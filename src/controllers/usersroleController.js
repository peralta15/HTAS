const UsersRoles = require('../models/usersroleModel');

class UsersRolesController {
  static async getAllUsersRoles(req, res) {
    try {
      const usersroles = await UsersRoles.findAll();
      res.json(usersroles);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getUsersRolesById(req, res) {
    try {
      const usersroles = await UsersRoles.findById(req.params.id);
      if (!usersroles) {
        return res.status(404).json({ message: 'Users not found' });
      }
      res.json(usersroles);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async createUsersRoles(req, res) {
    try {
      const usersroles = await UsersRoles.create(req.body);
      res.status(201).json(usersroles);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateUsersRoles(req, res) {
    try {
      const usersroles = await UsersRoles.update(req.params.id, req.body);
      if (!usersroles) {
        return res.status(404).json({ message: 'Users not found or already deleted' });
      }
      res.json(usersroles);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  
  static async deleteUsersRoles(req, res) {
    try {
      const result = await UsersRoles.delete(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = UsersRolesController;