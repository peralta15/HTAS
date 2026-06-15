// 1. Importamos la clase Ollama directamente de la librería
const { Ollama } = require('ollama');

// Endpoint para analizar los datos de presión arterial con LLM
const analizarPresion = async (req, res) => {
    // Recibimos los datos del paciente desde Angular
    const { presionSistolica, presionDiastolica, pulso } = req.body;

    // Creamos un prompt estructurado y profesional para la IA médica
    const prompt = `
    Actúa como un asistente médico automatizado experto en cardiología y riesgo cardiovascular. 
    Analiza con extremo rigor los siguientes signos vitales del paciente de manera aislada:
    - Presión Sistólica: ${presionSistolica} mmHg
    - Presión Diastólica: ${presionDiastolica} mmHg
    - Pulso / Frecuencia Cardíaca: ${pulso} lpm

    Basándote en las directrices internacionales (AHA/ACC), clasifica las métricas y genera un informe estructurado estrictamente en formato JSON.
    El texto debe ser profesional, empático y directo.

    Estructura requerida del JSON:
    {
      "estado": "Normal, Elevada, Hipertensión Estadio 1, Hipertensión Estadio 2 o Crisis de Hipertensión",
      "riesgo": "Bajo, Moderado o Alto",
      "alerta": "Un mensaje claro sobre qué valores específicos (${presionSistolica}/${presionDiastolica} o pulso de ${pulso}) requieren atención inmediata o cuidado especial.",
      "seguimiento": "Indicaciones precisas de monitoreo (ej. medir 2 veces al día, bitácora semanal o acudir a urgencias).",
      "recomendacion": "Pautas de estilo de vida, reducción de sodio o técnicas de relajación inmediatas según el estado.",
      "accionMedica": "Instrucción de consulta médica (ej. 'Consulte a su médico de cabecera en las próximas semanas' o 'Busque atención médica de emergencia inmediatamente')."
    }
    Devuelve ÚNICAMENTE el objeto JSON limpio. No incluyas explicaciones, ni introducciones, ni bloques decorativos fuera del JSON.
    `;

    try {
        console.log("=== Nueva petición de análisis recibida ===");
        console.log(`Métricas -> Sistólica: ${presionSistolica}, Diastólica: ${presionDiastolica}, Pulso: ${pulso}`);

        // 🌐 Recogemos la URL de Render, y si no existe por ahora, usa la local
        const NGROK_URL = process.env.URL_OLLAMA || 'http://127.0.0.1:11434';

        // 🚀 SOLUCIÓN: Creamos una instancia personalizada pasándole el host explícito
        const ollamaCliente = new Ollama({ host: NGROK_URL });

        // CONFIGURACIÓN DE NGROK: Inyectamos el header obligatorio para saltar la pantalla gris
        ollamaCliente.config = {
            headers: {
                'ngrok-skip-browser-warning': 'true'
            }
        };

        // Hacemos la petición usando nuestra instancia configurada
        const response = await ollamaCliente.chat({
            model: 'qwen2.5-coder:1.5b',
            messages: [{ role: 'user', content: prompt }],
            options: {
                temperature: 0.1 // Ultra bajo para mantener la consistencia del JSON clínico
            }
        });

        let resultadoTexto = response.message.content.trim();
        
        // FILTRO ANTI-MARKDOWN
        if (resultadoTexto.startsWith('```')) {
            resultadoTexto = resultadoTexto
                .replace(/^```json/, '')
                .replace(/^```/, '')
                .replace(/```$/, '')
                .trim();
        }

        const resultadoJson = JSON.parse(resultadoTexto);
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json(resultadoJson);

    } catch (error) {
        console.error("Error al conectar con Ollama o parsear JSON:", error);
        return res.status(500).json({ 
            error: "No se pudo procesar el análisis de presión arterial en este momento." 
        });
    }
};

module.exports = { analizarPresion };