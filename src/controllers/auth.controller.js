const db = require("../db/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const pdf = require("pdf-parse");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { verificarRecaptcha } = require("../utils/verificarRecaptcha");

const authController = {
  register: async (req, res) => {
    const {
      nombre,
      apPaterno,
      apMaterno,
      correo,
      contrasenia,
      rol,
      telefono,
      genero,
      datosExtra,
      recaptchaToken,
    } = req.body;

    const captchaValido = await verificarRecaptcha(recaptchaToken);
    if (!captchaValido) {
      return res
        .status(400)
        .json({ error: "Verificación reCAPTCHA fallida. Intenta de nuevo." });
    }

    try {
      // Dentro de register, para el rol 'Doctor'
      if (rol === "Doctor" && datosExtra.cedula) {
        try {
          // Aseguramos que solo tomamos lo que está después de la coma
          const base64Data =
            datosExtra.cedula.split(",")[1] || datosExtra.cedula;

          // Convertimos a Buffer de forma explícita
          const buffer = Buffer.from(base64Data, "base64");

          // Validamos que el buffer tenga contenido
          if (buffer.length === 0) throw new Error("Buffer vacío");

          const data = await pdf(buffer);
          const texto = data.text.toUpperCase();

          // Si esto no imprime nada en tu consola, el PDF no se leyó bien
          console.log("Palabras encontradas:", texto.length, "caracteres.");

          const esValido =
            texto.includes("CÉDULA PROFESIONAL") ||
            texto.includes("ESTADOS UNIDOS MEXICANOS");

          if (!esValido) {
            console.log("PDF rechazado por falta de palabras clave.");
            return res
              .status(400)
              .json({ error: "El contenido del PDF no es válido." });
          }
        } catch (error) {
          console.error("ERROR CRÍTICO EN PDF-PARSE:", error.message);
          // Si hay un error aquí, te dará el 400
          return res
            .status(400)
            .json({ error: "No se pudo procesar el archivo PDF." });
        }
      }

      await db.query("BEGIN");

      const hash = await bcrypt.hash(contrasenia, 10);
      const pin = Math.floor(100000 + Math.random() * 900000).toString();

      // 1. Insertar en USUARIOS
      const userRes = await db.query(
        `INSERT INTO USUARIOS (Nombre, ApPaterno, ApMaterno, Correo, Contrasenia, Rol, Telefono, Genero, PinVerificacion) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING IdUsuario`,
        [
          nombre,
          apPaterno,
          apMaterno,
          correo,
          hash,
          rol,
          telefono,
          genero,
          pin,
        ],
      );

      const userId = userRes.rows[0].idusuario;

      // 2. Insertar según Rol
      if (rol === "Doctor") {
        await db.query(
          `INSERT INTO DOCTORES (IdUsuario, Cedula, ArchivoCedulaPDF, Especialidad, DireccionClinica, TipoSangre, Peso, Altura, AntecedentesFamiliares) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            userId,
            datosExtra.cedulaNum || "00000000", // El número de cédula (texto corto)
            datosExtra.cedula, // El Base64 (ArchivoCedulaPDF - texto largo)
            datosExtra.especialidad,
            datosExtra.direccion,
            datosExtra.tipoSangre || null,
            datosExtra.peso || null,
            datosExtra.altura || null,
            datosExtra.antecedentesFamiliares || null,
          ],
        );
      } else if (rol === "Paciente") {
        await db.query(
          `INSERT INTO PACIENTES (IdUsuario, NSS, TipoSangre, Peso, Altura, AntecedentesFamiliares) 
                     VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            userId,
            datosExtra.nss || null,
            datosExtra.tipoSangre || null,
            datosExtra.peso || null,
            datosExtra.altura || null,
            datosExtra.antecedentesFamiliares || null,
          ],
        );
      } else if (rol === "Acompañante") {
        if (!datosExtra.fechaNacimiento) {
          await db.query("ROLLBACK");
          return res.status(400).json({
            error:
              "La fecha de nacimiento es obligatoria para el rol Acompañante.",
          });
        }
        const idPaciente = datosExtra.idPacienteAsociado || null;
        await db.query(
          `INSERT INTO ACOMPANANTES (IdUsuario, FechaNacimiento, FechaAsignacion, IdPacienteAsociado) 
                     VALUES ($1, $2, CURRENT_DATE, $3)`,
          [userId, datosExtra.fechaNacimiento, idPaciente],
        );
      }

      await db.query("COMMIT");

      // --- EL CAMBIO VA AQUÍ (Dentro del try, después del commit) ---
      return res.status(201).json({
        message: "Registro exitoso",
        userId: userId,
        pin: pin, // <--- Ahora Angular recibirá el PIN aquí
        nombre: nombre,
      });
    } catch (error) {
      await db.query("ROLLBACK");
      return res.status(500).json({ error: error.message });
    }
  },

  login: async (req, res) => {
    const { correo, contrasenia, recaptchaToken } = req.body;
    const deviceInfo = req.headers["user-agent"];

    const captchaValido = await verificarRecaptcha(recaptchaToken);
    if (!captchaValido) {
      return res
        .status(400)
        .json({ error: "Verificación reCAPTCHA fallida. Intenta de nuevo." });
    }

    try {
      const result = await db.query(
        "SELECT * FROM USUARIOS WHERE Correo = $1 AND Activo = TRUE",
        [correo],
      );
      if (result.rows.length === 0)
        return res.status(401).json({ error: "Credenciales inválidas" });

      const usuario = result.rows[0];

      if (
        usuario.bloqueadohasta &&
        new Date(usuario.bloqueadohasta) > new Date()
      ) {
        const segundos = Math.ceil(
          (new Date(usuario.bloqueadohasta) - new Date()) / 1000,
        );
        return res.status(423).json({
          error: "Tu cuenta está temporalmente bloqueada.",
          bloqueado: true,
          segundosRestantes: segundos,
        });
      }

      const match = await bcrypt.compare(contrasenia, usuario.contrasenia);
      if (!match)
        return res.status(401).json({ error: "Credenciales inválidas" });

      // Generar Tokens
      const accessToken = jwt.sign(
        { id: usuario.idusuario, rol: usuario.rol },
        process.env.JWT_SECRET,
        { expiresIn: "15m" },
      );
      const refreshToken = jwt.sign(
        { id: usuario.idusuario },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" },
      );

      // Guardar sesión en DB
      const fechaExp = new Date();
      fechaExp.setDate(fechaExp.getDate() + 7);

      await db.query(
        "INSERT INTO SESIONES (IdUsuario, RefreshToken, DispositivoInfo, IpAddress, FechaExpiracion) VALUES ($1, $2, $3, $4, $5)",
        [usuario.idusuario, refreshToken, deviceInfo, req.ip, fechaExp],
      );

      // --- AQUÍ ESTÁ EL CAMBIO ---
      // Enviamos el PIN y el Nombre para que el Frontend pueda mandarlos por EmailJS
      res.json({
        accessToken,
        refreshToken,
        rol: usuario.rol,
        uid: usuario.idusuario, // Necesario para identificar al usuario
        nombre: usuario.nombre, // Para el saludo del correo
        apPaterno: usuario.appaterno, // <--- Importante
        apMaterno: usuario.apmaterno, // <--- Importante
        correo: usuario.correo, // <--- Importante
        telefono: usuario.telefono,

        pin: usuario.pinverificacion, // <-- IMPORTANTE: Debe llamarse igual que en tu tabla
        pinVerificado: usuario.pinverificado, // Para saber si redirigir al PIN o al Inicio
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  verificarPin: async (req, res) => {
    const { uid, pin } = req.body;
    try {
      const result = await db.query(
        "SELECT PinVerificacion, IntentosFallidos, BloqueadoHasta FROM USUARIOS WHERE IdUsuario = $1",
        [uid],
      );

      if (result.rows.length === 0)
        return res.status(404).json({ error: "Usuario no encontrado" });

      const usuario = result.rows[0];
      const ahora = new Date();

      // Verificar si sigue bloqueado
      if (usuario.bloqueadohasta && new Date(usuario.bloqueadohasta) > ahora) {
        const segundos = Math.ceil(
          (new Date(usuario.bloqueadohasta) - ahora) / 1000,
        );
        return res
          .status(423)
          .json({
            error: "Bloqueado",
            bloqueado: true,
            segundosRestantes: segundos,
          });
      }

      if (usuario.pinverificacion === pin) {
        // ÉXITO: Resetear contadores
        await db.query(
          "UPDATE USUARIOS SET PinVerificado = TRUE, IntentosFallidos = 0, BloqueadoHasta = NULL WHERE IdUsuario = $1",
          [uid],
        );
        return res.json({ message: "¡PIN verificado correctamente!" });
      } else {
        // FALLO: Incrementar intentos
        const nuevosIntentos = (usuario.intentosfallidos || 0) + 1;

        if (nuevosIntentos >= 3) {
          const tiempoBloqueo = new Date(ahora.getTime() + 3 * 60000); // 3 min
          await db.query(
            "UPDATE USUARIOS SET IntentosFallidos = $1, BloqueadoHasta = $2 WHERE IdUsuario = $3",
            [nuevosIntentos, tiempoBloqueo, uid],
          );
          return res
            .status(423)
            .json({
              error: "Demasiados intentos. Bloqueado por 3 min.",
              bloqueado: true,
              segundosRestantes: 180,
            });
        } else {
          await db.query(
            "UPDATE USUARIOS SET IntentosFallidos = $1 WHERE IdUsuario = $2",
            [nuevosIntentos, uid],
          );
          return res
            .status(400)
            .json({ error: `PIN incorrecto. Intentos: ${nuevosIntentos}/3` });
        }
      }
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  // También te agrego de una vez el de solicitar nuevo pin para tu botón de "Reenviar"
  solicitarNuevoPin: async (req, res) => {
    const { uid } = req.body;
    try {
      const result = await db.query(
        "SELECT Nombre, Correo, PinVerificacion FROM USUARIOS WHERE IdUsuario = $1",
        [uid],
      );
      if (result.rows.length === 0)
        return res.status(404).json({ error: "Usuario no encontrado" });

      const usuario = result.rows[0];
      res.json({
        nombre: usuario.nombre,
        correo: usuario.correo,
        pin: usuario.pinverificacion,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  googleLogin: async (req, res) => {
    const { nombre, apPaterno, apMaterno, correo } = req.body;

    try {
      // 1. Verificar si ya existe en la base de datos
      const result = await db.query(
        "SELECT idusuario, nombre, pinverificacion, pinverificado, rol FROM USUARIOS WHERE Correo = $1",
        [correo],
      );

      let usuario;

      if (result.rows.length === 0) {
        // 2. REGISTRO AUTOMÁTICO (Primer inicio de sesión)
        await db.query("BEGIN");
        try {
          const nuevoPin = Math.floor(
            100000 + Math.random() * 900000,
          ).toString();

          // Insertamos con valores temporales/default
          const nuevoUser = await db.query(
            `INSERT INTO USUARIOS (Nombre, ApPaterno, ApMaterno, Correo, Contrasenia, Rol, Telefono, Genero, PinVerificacion, PinVerificado, Activo) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,FALSE, TRUE) RETURNING *`,
            [
              nombre,
              apPaterno,
              apMaterno,
              correo,
              "GOOGLE_AUTH_USER",
              "Paciente",
              "0000000000",
              genero,
              nuevoPin,
            ],
          );

          usuario = nuevoUser.rows[0];

          // IMPORTANTE: Usamos ON CONFLICT para que si el ID ya existe en PACIENTES por una prueba vieja,
          // el sistema no se detenga con un error 500.
          await db.query(
            "INSERT INTO PACIENTES (IdUsuario) VALUES ($1) ON CONFLICT (IdUsuario) DO NOTHING",
            [usuario.idusuario],
          );

          await db.query("COMMIT");
        } catch (insertError) {
          await db.query("ROLLBACK");
          throw insertError;
        }
      } else {
        // 3. LOGIN NORMAL (Ya existía)
        usuario = result.rows[0];
      }

      // 4. Generar Token solo si ya pasó su verificación de PIN
      let accessToken = null;
      if (usuario.pinverificado) {
        accessToken = jwt.sign(
          { id: usuario.idusuario, rol: usuario.rol },
          process.env.JWT_SECRET,
          { expiresIn: "1h" },
        );
      }

      // 5. Respuesta limpia para Angular
      res.json({
        uid: usuario.idusuario,
        nombre: usuario.nombre,
        pin: usuario.pinverificacion,
        pinVerificado: usuario.pinverificado,
        accessToken: accessToken,
      });
    } catch (error) {
      console.error("Error detallado en googleLogin:", error);
      res.status(500).json({ error: "Error al procesar el acceso con Google" });
    }
  },

  enviarMensaje: async (req, res) => {
    const { nombre, apellidos, email, telefono, mensaje } = req.body;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const iniciales = `${nombre.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();

    const mailOptions = {
      from: `"HTAS Contacto" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      replyTo: email,
      subject: `Nuevo mensaje de contacto — ${nombre} ${apellidos}`,
      html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f0;padding:32px 16px;">
  <tr><td align="center">
  <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.10);">

    <!-- HEADER -->
    <tr><td style="background:#7B1C1C;padding:24px 32px;text-align:center;">
      <div style="font-size:24px;font-weight:700;color:#ffffff;letter-spacing:3px;">HTAS</div>
      <div style="font-size:11px;color:#f0b0b0;letter-spacing:2px;margin-top:4px;text-transform:uppercase;">Nuevo mensaje de contacto</div>
    </td></tr>

    <!-- ACCENT BAR -->
    <tr><td style="height:4px;background:#C0392B;"></td></tr>

    <!-- BODY -->
    <tr><td style="padding:32px 36px 24px;">

      <!-- AVATAR + NOMBRE -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        <tr>
          <td width="68" valign="middle">
            <div style="width:56px;height:56px;border-radius:50%;background:#C0392B;text-align:center;line-height:56px;font-size:20px;font-weight:700;color:#ffffff;">
              ${iniciales}
            </div>
          </td>
          <td valign="middle">
            <div style="font-size:18px;font-weight:600;color:#1a1a1a;">${nombre} ${apellidos}</div>
            <div style="font-size:13px;color:#888888;margin-top:2px;">Mensaje recibido desde el formulario de contacto</div>
          </td>
        </tr>
      </table>

      <!-- CAMPOS: Nombre / Apellidos -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
        <tr>
          <td width="49%" style="background:#fdf2f2;border-radius:8px;padding:10px 14px;">
            <div style="font-size:10px;color:#C0392B;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:3px;">Nombre</div>
            <div style="font-size:14px;color:#1a1a1a;">${nombre}</div>
          </td>
          <td width="2%"></td>
          <td width="49%" style="background:#fdf2f2;border-radius:8px;padding:10px 14px;">
            <div style="font-size:10px;color:#C0392B;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:3px;">Apellidos</div>
            <div style="font-size:14px;color:#1a1a1a;">${apellidos}</div>
          </td>
        </tr>
      </table>

      <!-- CAMPOS: Email / Teléfono -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
        <tr>
          <td width="49%" style="background:#fdf2f2;border-radius:8px;padding:10px 14px;">
            <div style="font-size:10px;color:#C0392B;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:3px;">Correo electrónico</div>
            <div style="font-size:14px;color:#C0392B;">${email}</div>
          </td>
          <td width="2%"></td>
          <td width="49%" style="background:#fdf2f2;border-radius:8px;padding:10px 14px;">
            <div style="font-size:10px;color:#C0392B;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:3px;">Teléfono</div>
            <div style="font-size:14px;color:#1a1a1a;">${telefono}</div>
          </td>
        </tr>
      </table>

      <!-- MENSAJE -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        <tr>
          <td style="background:#f9f9f9;border-left:4px solid #C0392B;border-radius:0 8px 8px 0;padding:14px 16px;">
            <div style="font-size:10px;color:#C0392B;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">Mensaje</div>
            <div style="font-size:14px;color:#333333;line-height:1.7;">${mensaje}</div>
          </td>
        </tr>
      </table>

      <hr style="border:none;border-top:1px solid #eeeeee;margin:0 0 20px"/>
      <p style="font-size:12px;color:#999999;text-align:center;line-height:1.6;margin:0;">
        Este correo fue generado automáticamente desde el formulario de contacto de HTAS.<br/>
        Responde directamente a <a href="mailto:${email}" style="color:#C0392B;text-decoration:none;">${email}</a>
      </p>

    </td></tr>

    <!-- FOOTER -->
    <tr><td style="background:#2a0a0a;padding:20px 32px;text-align:center;">
      <div style="font-size:13px;color:#e8a0a0;font-weight:600;letter-spacing:2px;margin-bottom:4px;">HTAS</div>
      <div style="font-size:11px;color:#b06060;">Hipertensión Arterial Sistémica · Monitoreo inteligente y control digital</div>
    </td></tr>

  </table>
  </td></tr>
</table>
</body>
</html>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      res.json({ message: "Correo enviado con éxito" });
    } catch (error) {
      console.error("Error nodemailer:", error);
      res.status(500).json({ error: "No se pudo enviar el correo" });
    }
  },

  getAllUsers: async (req, res) => {
    try {
      const result = await db.query(
        `SELECT 
                    u.idusuario, u.nombre, 
                    u.apPaterno AS "apPaterno", 
                    u.apMaterno AS "apMaterno", 
                    u.correo, u.rol, u.telefono, u.genero, u.activo,
                    u.intentosfallidos AS "intentosFallidos",
                    u.bloqueadohasta AS "bloqueadoHasta",
                    a.FechaNacimiento as "fechaNacimiento",
                    a.FechaAsignacion as "fechaAsignacion",
                    d.Especialidad as "especialidad", 
                    d.DireccionClinica as "direccionClinica",
                    d.Cedula as "cedula",
                    COALESCE(d.TipoSangre, p.TipoSangre) as "tipoSangre",
                    COALESCE(d.Peso, p.Peso) as "peso",
                    COALESCE(d.Altura, p.Altura) as "altura",
                    COALESCE(d.AntecedentesFamiliares, p.AntecedentesFamiliares) as "antecedentesFamiliares",
                    p.NSS as "nss"
                 FROM USUARIOS u
                 LEFT JOIN ACOMPANANTES a ON u.idusuario = a.idusuario
                 LEFT JOIN DOCTORES d ON u.idusuario = d.idusuario
                 LEFT JOIN PACIENTES p ON u.idusuario = p.idusuario
                 ORDER BY u.nombre ASC`,
      );
      res.json(result.rows);
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      res.status(500).json({ error: "Error al obtener la lista de usuarios" });
    }
  },

  updateUsuario: async (req, res) => {
    const { id } = req.params;
    const {
      nombre,
      apPaterno,
      apMaterno,
      correo,
      telefono,
      genero,
      activo,
      fechaNacimiento,
      fechaAsignacion,
      especialidad,
      direccionClinica,
      rol,
      cedula,
      nss,
      tipoSangre,
      peso,
      altura,
      antecedentesFamiliares,
    } = req.body;

    // LIMPIEZA DE FECHA
    const fechaLimpia =
      fechaAsignacion && fechaAsignacion.trim() !== ""
        ? fechaAsignacion
        : new Date().toISOString().split("T")[0];

    try {
      await db.query("BEGIN");

      // 1. Actualizar tabla base: USUARIOS
      const result = await db.query(
        `UPDATE USUARIOS 
             SET Nombre = $1, ApPaterno = $2, ApMaterno = $3, Correo = $4, Telefono = $5, Genero = $6, Activo = $7
             WHERE IdUsuario = $8 RETURNING *`,
        [nombre, apPaterno, apMaterno, correo, telefono, genero, activo, id],
      );

      if (result.rows.length === 0) {
        await db.query("ROLLBACK");
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      const rolNormalizado = (rol || "").toLowerCase();

      // 2. Lógica específica por Rol

      // --- DOCTORES ---
      if (
        rolNormalizado === "doctor" ||
        rolNormalizado === "médico" ||
        rolNormalizado === "medico"
      ) {
        const cedulaFinal = cedula || "00000000";
        const archivoFinal = req.body.archivoCedulaPDF || "";

        await db.query(
          `INSERT INTO DOCTORES (IdUsuario, Especialidad, DireccionClinica, Cedula, ArchivoCedulaPDF, TipoSangre, Peso, Altura, AntecedentesFamiliares)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (IdUsuario) 
                DO UPDATE SET 
                Especialidad = $2, 
                DireccionClinica = $3, 
                Cedula = $4,
                ArchivoCedulaPDF = CASE WHEN $5 <> '' THEN $5 ELSE DOCTORES.ArchivoCedulaPDF END,
                TipoSangre = COALESCE($6, DOCTORES.TipoSangre),
                Peso = COALESCE($7, DOCTORES.Peso),
                Altura = COALESCE($8, DOCTORES.Altura),
                AntecedentesFamiliares = COALESCE($9, DOCTORES.AntecedentesFamiliares),
                updated_at = CURRENT_TIMESTAMP`,
          [
            id,
            especialidad,
            direccionClinica,
            cedulaFinal,
            archivoFinal,
            tipoSangre,
            peso,
            altura,
            antecedentesFamiliares,
          ],
        );
      }

      // --- ACOMPAÑANTES ---
      else if (
        rolNormalizado === "acompañante" ||
        rolNormalizado === "acompanante"
      ) {
        if (!fechaNacimiento) {
          await db.query("ROLLBACK");
          return res
            .status(400)
            .json({
              error: "La fecha de nacimiento es requerida para acompañantes.",
            });
        }

        await db.query(
          `INSERT INTO ACOMPANANTES (IdUsuario, FechaNacimiento, FechaAsignacion)
                VALUES ($1, $2, $3)
                ON CONFLICT (IdUsuario)
                DO UPDATE SET 
                FechaNacimiento = $2,
                FechaAsignacion = $3,
                updated_at = CURRENT_TIMESTAMP`,
          [id, fechaNacimiento, fechaAsigLimpia],
        );
      }

      // --- PACIENTES (NUEVO) ---
      else if (rolNormalizado === "paciente") {
        const nssFinal = nss || ""; // Evitamos nulls si el campo viene vacío
        await db.query(
          `INSERT INTO PACIENTES (IdUsuario, NSS, TipoSangre, Peso, Altura, AntecedentesFamiliares)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (IdUsuario) 
                DO UPDATE SET 
                NSS = $2,
                TipoSangre = COALESCE($3, PACIENTES.TipoSangre),
                Peso = COALESCE($4, PACIENTES.Peso),
                Altura = COALESCE($5, PACIENTES.Altura),
                AntecedentesFamiliares = COALESCE($6, PACIENTES.AntecedentesFamiliares),
                updated_at = CURRENT_TIMESTAMP`,
          [id, nssFinal, tipoSangre, peso, altura, antecedentesFamiliares],
        );
      }

      await db.query("COMMIT");
      res.json({ message: "Actualizado correctamente", user: result.rows[0] });
    } catch (error) {
      await db.query("ROLLBACK");
      console.error("Error al actualizar:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },

  // --- ELIMINAR USUARIO (Borrado lógico o físico) ---
  deleteUsuario: async (req, res) => {
    const { id } = req.params;

    try {
      // Opción A: Borrado físico (Elimina la fila)
      // Nota: Si tienes llaves foráneas, esto podría dar error si no usas ON DELETE CASCADE
      await db.query("DELETE FROM USUARIOS WHERE IdUsuario = $1", [id]);

      /* Opción B: Borrado lógico (Solo lo desactiva) - Recomendado
      await db.query('UPDATE USUARIOS SET Activo = FALSE WHERE IdUsuario = $1', [id]); 
      */

      res.json({ message: "Usuario eliminado correctamente" });
    } catch (error) {
      console.error("Error al eliminar:", error);
      res
        .status(500)
        .json({
          error:
            "Error al eliminar el usuario. Verifique si tiene registros asociados.",
        });
    }
  },

  createCheckoutSession: async (req, res) => {
    const { uid, planType } = req.body;

    // Mapeo de tus IDs de Stripe (Pega aquí los IDs de tu Dashboard)
    const prices = {
      PRO: "price_1TF5GOK1qKH77YTdkm5FC6a5", // ID del Plan HTAS Full
      BASIC: "price_1TF5HrK1qKH77YTdQMhgG1VX", // ID del Plan Básico (si decides cobrar $0 por Stripe)
    };

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: prices[planType],
            quantity: 1,
          },
        ],
        mode: "subscription",
        metadata: {
          userId: uid,
          plan: planType,
        },
        success_url: `http://localhost:4200/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `http://localhost:4200/landing`,
      });

      // CAMBIO AQUÍ: Enviamos la URL completa, no solo el ID
      res.json({ url: session.url });
    } catch (error) {
      console.error("Error Stripe:", error);
      res.status(500).json({ error: "Error al generar la transacción" });
    }
  },

  // --- GESTIÓN DE CITAS ---

  agendarCita: async (req, res) => {
    const {
      nombrePaciente,
      apPaternoPaciente,
      apMaternoPaciente,
      telefonoPaciente,
      correoPaciente,
      fechaCita,
      horaCita,
      motivo,
      modalidad,
      sintomas,
    } = req.body;

    try {
      const result = await db.query(
        `INSERT INTO CITAS (
          NombrePaciente, ApPaternoPaciente, ApMaternoPaciente, 
          TelefonoPaciente, CorreoPaciente, 
          FechaCita, HoraCita, Motivo, Modalidad, Sintomas
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [
          nombrePaciente,
          apPaternoPaciente,
          apMaternoPaciente,
          telefonoPaciente,
          correoPaciente,
          fechaCita,
          horaCita,
          motivo,
          modalidad,
          sintomas,
        ],
      );
      res
        .status(201)
        .json({ message: "Cita agendada con éxito", cita: result.rows[0] });
    } catch (error) {
      console.error("Error al agendar cita:", error);
      res.status(500).json({ error: "Error al agendar la cita" });
    }
  },

  getCitasUsuario: async (req, res) => {
    const { email } = req.params; // Cambiamos UID por email para esta tabla plana
    try {
      // Al ser tabla plana, buscamos coincidencias por correo electrónico
      const query = `
        SELECT * FROM CITAS 
        WHERE CorreoPaciente = $1 
        ORDER BY FechaCita DESC, HoraCita DESC`;

      const result = await db.query(query, [email]);
      res.json(result.rows);
    } catch (error) {
      console.error("Error al obtener citas:", error);
      res.status(500).json({ error: "Error al obtener el historial de citas" });
    }
  },

  actualizarEstadoCita: async (req, res) => {
    const { idCita } = req.params;
    const { estado, notasDoctor } = req.body;
    try {
      const result = await db.query(
        `UPDATE CITAS 
         SET Estado = $1, NotasDoctor = COALESCE($2, NotasDoctor), updated_at = CURRENT_TIMESTAMP
         WHERE IdCita = $3 RETURNING *`,
        [estado, notasDoctor, idCita],
      );

      if (result.rows.length === 0)
        return res.status(404).json({ error: "Cita no encontrada" });

      res.json({ message: "Cita actualizada", cita: result.rows[0] });
    } catch (error) {
      console.error("Error al actualizar cita:", error);
      res
        .status(500)
        .json({ error: "Error al actualizar el estado de la cita" });
    }
  },
};

module.exports = authController;
