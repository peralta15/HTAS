const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

class UsersRoles {
  // 1. Obtener todos (Ya lo tenías)
  static async findAll() {
    const result = await pool.query(`
      SELECT ur.*, u.Correo as CorreoMaestro 
      FROM USUARIOSROLES ur 
      JOIN USUARIOS u ON ur.IdUsuario = u.IdUsuario
    `);
    return result.rows;
  }

  // 2. BUSCAR POR ID (Este faltaba y por eso fallaba el GET por ID)
  static async findById(IdUsuarioRol) {
    const result = await pool.query('SELECT * FROM USUARIOSROLES WHERE IdUsuarioRol = $1', [IdUsuarioRol]);
    return result.rows[0];
  }

  // 3. Crear en ambas tablas (Ya lo tenías)
  static async create(data) {
    const { NombreCompleto, Telefono, Correo, Contrasenia, Rol, Activo } = data;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const hashedPassword = await bcrypt.hash(Contrasenia, SALT_ROUNDS);
      const userResult = await client.query(
        'INSERT INTO USUARIOS (Correo, Contrasenia) VALUES ($1, $2) RETURNING IdUsuario',
        [Correo, hashedPassword]
      );
      const nuevoIdUsuario = userResult.rows[0].idusuario;
      const rolesResult = await client.query(
        `INSERT INTO USUARIOSROLES (IdUsuario, NombreCompleto, Telefono, Correo, Contrasenia, Rol, Activo) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [nuevoIdUsuario, NombreCompleto, Telefono, Correo, hashedPassword, Rol, Activo ?? true]
      );
      await client.query('COMMIT');
      return rolesResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // 4. ACTUALIZAR (Este faltaba y por eso fallaba el PUT)
  static async update(IdUsuarioRol, data) {
    const { NombreCompleto, Telefono, Correo, Contrasenia, Rol, Activo } = data;
    
    // Si viene una contraseña nueva, la encriptamos
    let hashedPassword = Contrasenia;
    if (Contrasenia && !Contrasenia.startsWith('$2a$')) {
        hashedPassword = await bcrypt.hash(Contrasenia, SALT_ROUNDS);
    }

    const result = await pool.query(
      `UPDATE USUARIOSROLES 
       SET NombreCompleto = $1, Telefono = $2, Correo = $3, Contrasenia = $4, Rol = $5, Activo = $6, updated_at = CURRENT_TIMESTAMP 
       WHERE IdUsuarioRol = $7 RETURNING *`,
      [NombreCompleto, Telefono, Correo, hashedPassword, Rol, Activo, IdUsuarioRol]
    );
    return result.rows[0];
  }

  // 5. Borrar (Ya lo tenías)
  static async delete(IdUsuarioRol) {
    const findUser = await pool.query('SELECT IdUsuario FROM USUARIOSROLES WHERE IdUsuarioRol = $1', [IdUsuarioRol]);
    if (findUser.rows.length > 0) {
        const idU = findUser.rows[0].idusuario;
        await pool.query('DELETE FROM USUARIOS WHERE IdUsuario = $1', [idU]);
    }
    return { message: 'Usuario y Rol eliminados correctamente' };
  }
}

module.exports = UsersRoles;