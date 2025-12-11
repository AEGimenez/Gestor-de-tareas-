import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";

const userRepository = AppDataSource.getRepository(User);

// Helper para limpiar la contraseña del objeto
const toSafeUser = (user: User) => {
  const { password, ...rest } = user as any;
  return rest;
};

export class UserController {
  // GET /users
  static async getAll(req: Request, res: Response) {
    try {
      const users = await userRepository.find(); // password NO se selecciona por select:false
      const safeUsers = users.map(toSafeUser);

      res.json({
        message: "Se obtuvieron todos los usuarios",
        data: safeUsers,
      });
    } catch (error) {
      res.status(500).json({
        message: "No se pudieron obtener los usuarios",
        error,
      });
    }
  }

  // GET /users/:id
  static async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const user = await userRepository.findOne({ where: { id } });
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      res.json({
        message: "Usuario obtenido con éxito",
        data: toSafeUser(user),
      });
    } catch (error) {
      res.status(500).json({
        message: "No se pudo obtener el usuario",
        error,
      });
    }
  }

  // POST /users
  static async create(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({
          message: "email, password, firstName y lastName son obligatorios",
        });
      }

      const existing = await userRepository.findOne({ where: { email } });
      if (existing) {
        return res
          .status(409)
          .json({ message: "Ya existe un usuario con ese email" });
      }

      const user = userRepository.create({
        email,
        password, // acá podrías hashear la contraseña en el futuro
        firstName,
        lastName,
      });

      const saved = await userRepository.save(user);

      res.status(201).json({
        message: "Usuario creado con éxito",
        data: toSafeUser(saved), // 👈 no devolvemos password
      });
    } catch (error) {
      res.status(500).json({
        message: "No se pudo crear el usuario",
        error,
      });
    }
  }

  // PUT /users/:id
  static async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const { email, password, firstName, lastName } = req.body;

      const user = await userRepository.findOne({ where: { id } });
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      if (email !== undefined) user.email = email;
      if (firstName !== undefined) user.firstName = firstName;
      if (lastName !== undefined) user.lastName = lastName;
      if (password !== undefined) {
        user.password = password; // idem: acá podrías hashearla
      }

      const updated = await userRepository.save(user);

      res.json({
        message: "Usuario actualizado con éxito",
        data: toSafeUser(updated), // 👈 también sin password
      });
    } catch (error) {
      res.status(500).json({
        message: "No se pudo actualizar el usuario",
        error,
      });
    }
  }

  // DELETE /users/:id
  static async remove(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }

      const user = await userRepository.findOne({ where: { id } });
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      await userRepository.remove(user);

      res.json({
        message: "Usuario eliminado con éxito",
      });
    } catch (error) {
      res.status(500).json({
        message: "No se pudo eliminar el usuario",
        error,
      });
    }
  }
}
