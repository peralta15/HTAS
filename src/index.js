require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const usersRoutes = require('./routes/usersRoutes');
const usersroleRoutes = require('./routes/usersroleRoutes');
const authRoutes = require('./routes/authRoutes');
const swaggerDocs = require('./config/swagger');

const app = express();

// Configuración dinámica para CORS
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      process.env.FRONTEND_URL,
      // 'https://estadias-2.onrender.com',
      `http://localhost:${process.env.PORT || 3000}`
    ].filter(Boolean)
  : '*';

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para URL base dinámica
app.use((req, res, next) => {
  req.baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
  next();
});

// Configuración Swagger dinámica
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API OF THE HTAS',
      version: '1.0.0',
      description: 'API documentation for blood pressure.',
    },
    servers: [{
      url: process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`
    }]
  },
  apis: ['./src/routes/*.js']
};

swaggerDocs(app, swaggerOptions);

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/usersroles', usersroleRoutes)

const PORT = process.env.PORT || 3000;
// app.listen(PORT, '0.0.0.0', () => {
  app.listen(PORT, () => {
  const serverUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
  console.log(`Servidor corriendo en ${serverUrl}`);
});