const express = require('express');
const cors = require('cors');
require('dotenv').config();

const dashboardRoutes = require('./routes/dashboard');

const app = express();

// Middlewares
app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true
}));
app.use(express.json());

// Rutas
app.use('/api', dashboardRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: '🚀 API HTAS funcionando' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});