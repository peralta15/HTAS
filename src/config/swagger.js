const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

module.exports = (app, options) => {
  const specs = swaggerJsdoc(options);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
  
  const docsUrl = process.env.BASE_URL 
    ? `${process.env.BASE_URL}/api-docs`
    : `http://localhost:${process.env.PORT || 3000}/api-docs`;
  
  console.log(`Documentación Swagger disponible en: ${docsUrl}`);
};