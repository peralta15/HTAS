/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - Correo
 *         - Contrasenia
 *       properties:
 *         IdUsuario:
 *           type: integer
 *           description: ID del Usuario.
 *         Correo:
 *           type: string
 *           description: Correo Electrónico del Usuario.
 *         Contrasenia:
 *           type: string
 *           description: Contraseña del Usuario (encriptada).
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Fecha de Creación.
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Fecha de la última Actualización.
 *         deleted_at:
 *           type: string
 *           format: date-time
 *           description: Fecha de Eliminación.
 *       example:
 *         IdUsuario: 1
 *         Correo: "zahidmonraga@gmail.com"
 *         created_at: "2024-10-22T10:20:30Z"
 *         updated_at: "2024-10-22T10:20:30Z"
 *         deleted_at: null
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Obtiene Todos los Usuarios.
 *     tags: [USERS (Consult)]
 *     responses:
 *       200:
 *         description: Lista de Todos los Usuarios.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Obtiene un Usuario por ID.
 *     tags: [USERS]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del Usuario.
 *     responses:
 *       200:
 *         description: Datos del Usuario Solicitado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Usuario no Encontrado.
 *       500:
 *         description: Error en el Servidor.
 */

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Crea un Nuevo Usuario.
 *     tags: [USERS]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               Correo:
 *                 type: string
 *                 description: Correo Electrónico del Usuario.
 *                 example: "zahidmonraga@gmail.com"
 *               Contrasenia:
 *                 type: string
 *                 description: Contraseña del Usuario.
 *                 example: "password12345"
 *     responses:
 *       201:
 *         description: Usuario creado Exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Solicitud inválida.
 *       500:
 *         description: Error en el Servidor.
 */

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Actualiza un Usuario.
 *     tags: [USERS]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del Usuario.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               Correo:
 *                 type: string
 *                 description: Correo Electrónico del Usuario.
 *                 example: "zahidmonraga@gmail.com"
 *               Contrasenia:
 *                 type: string
 *                 description: Contraseña del Usuario.
 *                 example: "newpassword12345"
 *     responses:
 *       200:
 *         description: Usuario Actualizado Exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Solicitud inválida.
 *       404:
 *         description: Usuario no Encontrado.
 *       500:
 *         description: Error en el Servidor.
 */

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Elimina un Usuario.
 *     tags: [USERS]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del Usuario a Eliminar.
 *     responses:
 *       200:
 *         description: Usuario Eliminado Exitosamente.
 *       404:
 *         description: Usuario no Encontrado.
 *       500:
 *         description: Error en el Servidor.
 */

const express = require('express');
const UsersController = require('../controllers/usersController');

const router = express.Router();

router.get('/', UsersController.getAllUsers);
router.get('/:id', UsersController.getUserById);
router.post('/', UsersController.createUser);
router.put('/:id', UsersController.updateUser);
router.delete('/:id', UsersController.deleteUser);

module.exports = router;