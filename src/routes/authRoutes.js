const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

router.post('/login', async (req, res) => {
  // 1. Recibimos los datos de Angular (aquí sí usamos Mayúsculas como en tu formulario)
  const { Correo, Contrasenia } = req.body;

  if (!Correo || !Contrasenia) {
    return res.status(400).json({ message: 'Correo y contraseña son requeridos' });
  }

  try {
    // Usamos ILIKE para el correo
    const userResult = await pool.query('SELECT * FROM USUARIOS WHERE Correo ILIKE $1', [Correo]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'El correo no está registrado' });
    }

    const usuarioMaestro = userResult.rows[0];

    // --- EL PUNTO CRÍTICO ---
    // Postgres suele devolver los nombres en minúscula. 
    // Usamos || para que funcione si viene en Mayúscula o minúscula.
    const hashDB = usuarioMaestro.contrasenia || usuarioMaestro.Contrasenia;
    const idDB = usuarioMaestro.idusuario || usuarioMaestro.IdUsuario;

    // 2. Comparamos la contraseña
    const isMatch = await bcrypt.compare(Contrasenia, hashDB);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    // 3. Traemos detalles de USUARIOSROLES usando el ID correcto
    const rolesResult = await pool.query('SELECT * FROM USUARIOSROLES WHERE IdUsuario = $1', [idDB]);
    const detalles = rolesResult.rows[0];

    // Extraemos datos de detalles con el mismo truco de mayúsculas/minúsculas
    const rolDB = detalles ? (detalles.rol || detalles.Rol) : 'Usuario';
    const nombreDB = detalles ? (detalles.nombrecompleto || detalles.NombreCompleto) : 'Sin nombre';

    // 4. Generamos el Token JWT
    const token = jwt.sign(
      { id: idDB, email: Correo, rol: rolDB },
      process.env.JWT_SECRET || 'llave_secreta_provisional',
      { expiresIn: '8h' }
    );

    // 5. Respondemos a Angular
    res.json({
      success: true,
      token,
      user: {
        id: idDB,
        nombre: nombreDB,
        correo: Correo,
        rol: rolDB
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error interno en el servidor' });
  }
});

module.exports = router;