const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// === RUTAS PARA AUTENTICACIÓN ===
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-pin', authController.verificarPin);
router.post('/request-new-pin', authController.solicitarNuevoPin);
router.post('/google-login', authController.googleLogin);

// === RUTAS PARA CONTACTOS ===
router.post('/contacto', authController.enviarMensaje);

// === RUTAS PARA USUARIOS ===
router.get('/all-users', authController.getAllUsers);
router.put('/update-user/:id', authController.updateUsuario);
router.delete('/delete-user/:id', authController.deleteUsuario);
router.post('/create-checkout-session', authController.createCheckoutSession);

// === RUTAS PARA CITAS ===
router.get('/todas-las-citas', authController.getAllCitas);
router.post('/agendar-cita', authController.agendarCita);
router.get('/mis-citas/:email', authController.getCitasUsuario);
router.put('/actualizar-cita/:idCita', authController.actualizarEstadoCita);

// === RUTAS PARA TRATAMIENTOS ===
router.get('/tratamientos', authController.getTratamientos);
router.post('/tratamientos', authController.crearTratamiento);
router.put('/tratamientos/:id', authController.actualizarTratamiento);
router.delete('/tratamientos/:id', authController.eliminarTratamiento);

// === RUTAS PARA MEDICAMENTOS ===
router.get('/medicamentos', authController.getMedicamentos);
router.post('/medicamentos', authController.crearMedicamento);
router.put('/medicamentos/:id', authController.actualizarMedicamento);
router.delete('/medicamentos/:id', authController.eliminarMedicamento);

// === RUTAS PARA DISPOSITIVOS ===
router.get('/dispositivos', authController.getDispositivos);
router.post('/dispositivos', authController.crearDispositivo);
router.put('/dispositivos/:id', authController.actualizarDispositivo);
router.delete('/dispositivos/:id', authController.eliminarDispositivo);

// === RUTAS PARA MEDICIONES DEL BAUMANÓMETRO ===
router.post('/mediciones', authController.registrarMedicion);
router.get('/mediciones/paciente/:idPaciente', authController.getMedicionesPaciente);
router.get('/mediciones/paciente/:idPaciente/ultima', authController.getUltimaMedicionPaciente);

// === NUEVAS RUTAS PARA GOOGLE FIT / HEALTH CONNECT ===
router.get('/google-fit/auth', authController.googleFitAuth);
router.get('/google-fit/callback', authController.googleFitCallback);
router.get('/google-fit/data/:idPaciente', authController.googleFitData);

module.exports = router;