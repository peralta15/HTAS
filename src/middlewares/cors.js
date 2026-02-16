const express = require('express');
const cors = require('cors');

const app = express();

// Habilitar CORS para todas las rutas
app.use(cors());

// Si necesitas configurar CORS más detalladamente, puedes hacerlo así:
app.use(cors({
    origin: '*', // Permitir solo este dominio
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos permitidos
    allowedHeaders: ['Content-Type', 'Authorization'], // Headers permitidos
}));

app.get('/api/data', (req, res) => {
    res.json({ message: 'Hola desde tu API con CORS habilitado' });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});