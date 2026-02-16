/**
 * @swagger
 * components:
 *   schemas:
 *     UsersRoles:
 *       type: object
 *       required:
 *         - NombreCompleto
 *         - Telefono
 *         - Correo
 *         - Contrasenia
 *         - Rol
 *         - Activo
 *       properties:
 *         IdUsuarioRol:
 *           type: integer
 *           description: ID único del Usuario.
 *         NombreCompleto:
 *           type: string
 *           description: Nombre del Usuario.
 *         Telefono:
 *           type: integer
 *           description: Telefono del Empleado.
 *         Correo:
 *           type: string
 *           description: Correo Electrónico del Usuario.
 *         Contrasenia:
 *           type: string
 *           description: Contraseña del Usuario (encriptada).
 *         Rol:
 *           type: string
 *           description: Rol del Usuario
 *         Activo:
 *           type: boolean
 *           description: Estado de la cuenta del usuario
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
 *         IdUsuarioRol: 1
 *         NombreCompleto: Zahid Monraga Contreras
 *         Telefono: 2719901240
 *         Correo: "zahidmonraga@gmail.com"
 *         Rol: Paciente
 *         Activo: True
 *         created_at: "2024-10-22T10:20:30Z"
 *         updated_at: "2024-10-22T10:20:30Z"
 *         deleted_at: null
 */

/**
 * @swagger
 * /api/usersroles:
 *   get:
 *     summary: Obtiene la lista de Todos los Usuarios y Roles.
 *     tags: [USERSROLES (Consult)]
 *     responses:
 *       200:
 *         description: Lista de Usuarios y Roles.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UsersRoles'
 *       500:
 *         description: Error en el Servidor.
 */

/**
 * @swagger
 * /api/usersroles/{id}:
 *   get:
 *     summary: Obtiene un Usuario por su ID.
 *     tags: [USERSROLES]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del Usuario.
 *     responses:
 *       200:
 *         description: Usuario Encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UsersRoles'
 *       404:
 *         description: Usuario no Encontrado.
 *       500:
 *         description: Error en el Servidor.
 */

/**
/**
 * @swagger
 * /api/usersroles:
 *   post:
 *     summary: Crea un Nuevo Usuario.
 *     tags: [USERSROLES]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               NombreCompleto:
 *                 type: string
 *                 description: Nombre del Usuario.
 *               Telefono:
 *                 type: integer
 *                 description: Telefono del Usuario.
 *               Correo:
 *                 type: string
 *                 description: Correo Electrónico del Usuario.
 *                 example: "zahidmonraga@gmail.com"
 *               Contrasenia:
 *                 type: string
 *                 description: Contraseña del Usuario.
 *                 example: "password12345"
 *               Rol:
 *                 type: string
 *                 description: Rol del Usuario
 *               Activo:
 *                 type: boolean
 *                 description: Estado de la cuenta del usuario
 *           example:
 *             NombreCompleto: Zahid Monraga Contreras
 *             Telefono: 2711201240
 *             Correo: "zahidmonraga@gmail.com"
 *             Contrasenia: "password12345"
 *             Rol: Paciente
 *             Activo: True
 *     responses:
 *       201:
 *         description: El Usuario ha sido Creado con Éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UsersRoles'
 *       500:
 *         description: Error en el Servidor.
 */

/**
 * @swagger
 * /api/usersroles/{id}:
 *   put:
 *     summary: Actualiza un Usuario por su ID.
 *     tags: [USERSROLES]
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
 *               NombreCompleto:
 *                 type: string
 *                 description: Nombre del Usuario.
 *               Telefono:
 *                 type: integer
 *                 description: Telefono del Usuario.
 *               Correo:
 *                 type: string
 *                 description: Correo Electrónico del Usuario.
 *                 example: "zahidmonraga@gmail.com"
 *               Contrasenia:
 *                 type: string
 *                 description: Contraseña del Usuario.
 *                 example: "password12345"
 *               Rol:
 *                 type: string
 *                 description: Rol del Usuario
 *               Activo:
 *                 type: boolean
 *                 description: Estado de la cuenta del usuario
 *           example:
 *             NombreCompleto: Zahid Monraga Contreras
 *             Telefono: 2711201240
 *             Correo: "zahidmonraga@gmail.com"
 *             Contrasenia: "password12345"
 *             Rol: Paciente
 *             Activo: True
 *     responses:
 *       200:
 *         description: El Usuario ha sido Actualizado con Éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UsersRoles'
 *       404:
 *         description: Usuario no Encontrado.
 *       500:
 *         description: Error en el Servidor.
 */

/**
 * @swagger
 * /api/usersroles/{id}:
 *   delete:
 *     summary: Elimina un Usuario por su ID.
 *     tags: [USERSROLES]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del Usuario.
 *     responses:
 *       204:
 *         description: Usuario Eliminado con Éxito.
 *       404:
 *         description: Usuario no Encontrado.
 *       500:
 *         description: Error en el Servidor.
 */

const express = require('express');
const UsersRolesController = require('../controllers/usersroleController');

const router = express.Router();

router.get('/', UsersRolesController.getAllUsersRoles);
router.get('/:id', UsersRolesController.getUsersRolesById);  
router.post('/', UsersRolesController.createUsersRoles);
router.put('/:id', UsersRolesController.updateUsersRoles);  
router.delete('/:id', UsersRolesController.deleteUsersRoles);  

module.exports = router;