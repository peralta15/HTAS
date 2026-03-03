const express = require('express');
const router = express.Router();
const pool = require('../database');

// GET /api/dashboard/:patientId
router.get('/dashboard/:patientId', async (req, res) => {
  try {
    const patientId = req.params.patientId;
    
    // 1. Obtener información del paciente
    const patientQuery = await pool.query(
      `SELECT 
        id as "patientId",
        nombre as "patientName"
       FROM pacientes 
       WHERE id = $1`,
      [patientId]
    );

    // 2. Obtener última presión
    const lastBPQuery = await pool.query(
      `SELECT 
        sistolica as systolic,
        diastolica as diastolic,
        timestamp
       FROM mediciones_presion 
       WHERE paciente_id = $1 
       ORDER BY timestamp DESC 
       LIMIT 1`,
      [patientId]
    );

    // 3. Obtener tendencia de presión (últimos 30 días)
    const trendQuery = await pool.query(
      `SELECT 
        sistolica as systolic,
        diastolica as diastolic,
        timestamp
       FROM mediciones_presion 
       WHERE paciente_id = $1 
       AND timestamp >= NOW() - INTERVAL '30 days'
       ORDER BY timestamp DESC`,
      [patientId]
    );

    // 4. Obtener adherencia
    const adherenceQuery = await pool.query(
      `SELECT 
        ROUND(AVG(CASE WHEN estado = 'tomada' THEN 1 ELSE 0 END) * 100) as "last7DaysPercent"
       FROM tomas_medicamentos t
       JOIN prescripciones p ON t.prescripcion_id = p.id
       WHERE p.paciente_id = $1 
       AND t.programada_para >= NOW() - INTERVAL '7 days'`,
      [patientId]
    );

    // 5. Obtener frecuencia de mediciones
    const frequencyQuery = await pool.query(
      `SELECT 
        COUNT(CASE WHEN timestamp::date = CURRENT_DATE THEN 1 END) as daily,
        COUNT(*) as weekly
       FROM mediciones_presion 
       WHERE paciente_id = $1 
       AND timestamp >= NOW() - INTERVAL '7 days'`,
      [patientId]
    );

    // 6. Obtener alertas activas
    const alertsQuery = await pool.query(
      `SELECT 
        id::text,
        tipo as type,
        titulo as title,
        mensaje as message,
        timestamp,
        status,
        severidad as severity,
        codigo as code
       FROM alertas 
       WHERE paciente_id = $1 
       AND status = 'active'
       ORDER BY timestamp DESC`,
      [patientId]
    );

    // 7. Obtener resumen
    const summaryQuery = await pool.query(
      `SELECT 
        (SELECT AVG(EXTRACT(YEAR FROM age(NOW(), fecha_nacimiento)))::int 
         FROM pacientes WHERE id = $1) as age,
        (SELECT timestamp FROM mediciones_presion 
         WHERE paciente_id = $1 ORDER BY timestamp DESC LIMIT 1) as "lastSeen"
      `,
      [patientId]
    );

    // Construir respuesta
    const response = {
      patientId: patientId,
      patientName: patientQuery.rows[0]?.patientName || 'Paciente',
      vitals: {
        bloodPressure: {
          last: lastBPQuery.rows[0] || null,
          trend: trendQuery.rows || []
        },
        adherence: {
          last7DaysPercent: adherenceQuery.rows[0]?.last7DaysPercent || 0
        },
        measurementsFrequency: {
          daily: parseInt(frequencyQuery.rows[0]?.daily) || 0,
          weekly: parseInt(frequencyQuery.rows[0]?.weekly) || 0
        }
      },
      alerts: alertsQuery.rows || [],
      summary: {
        adherencePercentage: adherenceQuery.rows[0]?.last7DaysPercent || 0,
        age: summaryQuery.rows[0]?.age || null,
        lastSeen: summaryQuery.rows[0]?.lastSeen || null
      }
    };

    res.json(response);

  } catch (error) {
    console.error('❌ Error en dashboard:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;