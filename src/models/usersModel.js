const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// Número de rondas de salting que bcrypt usará para encriptar
const SALT_ROUNDS = 10;

class User {
  static async findAll() {
    const result = await pool.query('SELECT * FROM USUARIOS');
    return result.rows;
  }

  static async findById(IdUsuario) {
    const result = await pool.query('SELECT * FROM USUARIOS WHERE IdUsuario = $1', [IdUsuario]);
    return result.rows[0];
  }

  static async create(data) {
    const { Correo, Contrasenia } = data;

    // Encriptar la contraseña antes de almacenarla
    const hashedPassword = await bcrypt.hash(Contrasenia, SALT_ROUNDS);

    const result = await pool.query(
      'INSERT INTO USUARIOS (Correo, Contrasenia) VALUES ($1, $2) RETURNING *',
      [Correo, hashedPassword ]
    );
    return result.rows[0];
  }

  static async update(IdUsuario, data) {
    const { Correo, Contrasenia } = data;

    // Si la contraseña fue enviada, encriptarla
    let hashedPassword = Contrasenia;
    if (Contrasenia) {
      hashedPassword = await bcrypt.hash(Contrasenia, SALT_ROUNDS);
    }

    const result = await pool.query(
      'UPDATE USUARIOS SET Correo = $1, Contrasenia = $2 WHERE IdUsuario = $3 RETURNING *',
      [ Correo, hashedPassword, IdUsuario]
    );
    return result.rows[0];
  }

  static async delete(IdUsuario) {
    await pool.query('DELETE FROM USUARIOS WHERE IdUsuario = $1', [IdUsuario]);
    return { message: 'User deleted successfully' };
  }
}

module.exports = User;