const express = require('express');
const cors = require('cors');
const axios = require('axios');
const authRoutes = require('./routes/auth.routes');
const iaRoutes = require('./routes/ia.routes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/ia', iaRoutes);

app.post('/api/htas/evaluar', async (req, res) => {
    try {
        // Recibimos los datos enviados desde el frontend o Postman
        const { edad, sistolica, diastolica, tomaMedicamento } = req.body;

        // Acomodamos los datos con las mayúsculas que espera FastAPI en Python
        const datosParaPython = {
            Edad: parseInt(edad),
            Sistolica: parseInt(sistolica),
            Diastolica: parseInt(diastolica),
            Toma_Medicamento: parseInt(tomaMedicamento)
        };

        // 🌐 MODIFICADO: Lee la URL desde las variables de entorno (.env)
        // Si no existe, usa local por seguridad para que no truene si pruebas en tu PC
        const IA_SERVER_URL = process.env.URL_IA || 'http://127.0.0.1:8000';

        // Petición al endpoint de la IA en la nube
        const respuestaPython = await axios.post(`${IA_SERVER_URL}/predecir_crisis`, datosParaPython);

        // Devolvemos la respuesta de la IA de vuelta al cliente
        return res.status(200).json({
            success: true,
            mensaje: "Evaluación de crisis HTAS completada",
            resultado: respuestaPython.data
        });

    } catch (error) {
        // Si Python arrojó el error clínico (sistólica <= diastólica)
        if (error.response) {
            return res.status(error.response.status).json({
                success: false,
                error: error.response.data.detail
            });
        }

        console.error("Error de conexión con FastAPI en la nube:", error.message);
        return res.status(500).json({
            success: false,
            error: "No se pudo conectar con el módulo de Inteligencia Artificial."
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor HTAS corriendo en puerto ${PORT}`);
});