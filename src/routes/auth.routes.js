const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-pin', authController.verificarPin);
router.post('/request-new-pin', authController.solicitarNuevoPin);
router.post('/google-login', authController.googleLogin);
router.post('/contacto', authController.enviarMensaje);
router.get('/all-users', authController.getAllUsers);
router.put('/update-user/:id', authController.updateUsuario);
router.delete('/delete-user/:id', authController.deleteUsuario);
router.post('/create-checkout-session', authController.createCheckoutSession);
router.post('/agendar-cita', authController.agendarCita);
router.get('/mis-citas/:email', authController.getCitasUsuario);
router.put('/actualizar-cita/:idCita', authController.actualizarEstadoCita);

module.exports = router;