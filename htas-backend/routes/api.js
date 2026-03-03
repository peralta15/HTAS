// routes/api.js - Aquí van todas las rutas de la API
const express = require('express');
const router = express.Router();
const pool = require('../database');

// =============================================
// ENDPOINT 1: Obtener dashboard resumen
// =============================================
router.get('/dashboard/:pacienteId', async (req, res) => {
  try {
    const pacienteId = req.params.pacienteId;
    
    // 1. Obtener última medición
    const ultimaMedicion = await pool.query(
      `SELECT * FROM mediciones_presion 
       WHERE paciente_id = $1 
       ORDER BY timestamp DESC 
       LIMIT 1`,
      [pacienteId]
    );
    
    // 2. Contar alertas (presiones altas)
    const alertasQuery = await pool.query(
      `SELECT COUNT(*) as total FROM mediciones_presion 
       WHERE paciente_id = $1 
       AND sistolica > 180`,
      [pacienteId]
    );
    
    // 3. Preparar respuesta
    const respuesta = {
      ultimaPresion: ultimaMedicion.rows[0] || {
        mensaje: "Sin datos",
        sistolica: 0,
        diastolica: 0
      },
      alertasActivas: parseInt(alertasQuery.rows[0].total) || 0,
      mensaje: "Datos obtenidos correctamente"
    };
    
    res.json(respuesta);
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// =============================================
// ENDPOINT 2: Obtener todas las mediciones
// =============================================
router.get('/mediciones/:pacienteId', async (req, res) => {
  try {
    const pacienteId = req.params.pacienteId;
    
    const mediciones = await pool.query(
      `SELECT * FROM mediciones_presion 
       WHERE paciente_id = $1 
       ORDER BY timestamp DESC`,
      [pacienteId]
    );
    
    res.json(mediciones.rows);
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// =============================================
// ENDPOINT 3: Crear nueva medición
// =============================================
router.post('/mediciones', async (req, res) => {
  try {
    const { paciente_id, sistolica, diastolica } = req.body;
    
    if (!paciente_id || !sistolica || !diastolica) {
      return res.status(400).json({ 
        error: 'Faltan datos. Necesitas: paciente_id, sistolica, diastolica' 
      });
    }
    
    const nuevaMedicion = await pool.query(
      `INSERT INTO mediciones_presion 
       (paciente_id, sistolica, diastolica) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [paciente_id, sistolica, diastolica]
    );
    
    res.status(201).json({
      mensaje: '✅ Medición guardada',
      medicion: nuevaMedicion.rows[0]
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// =============================================
// ENDPOINT 4: Login
// =============================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (email === 'cuidador@test.com' && password === '123456') {
      res.json({ 
        mensaje: 'Login exitoso',
        token: 'token_simulado_123',
        usuario: { email, nombre: 'María' }
      });
    } else {
      res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;