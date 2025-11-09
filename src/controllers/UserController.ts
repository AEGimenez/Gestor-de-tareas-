import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";

export class UserController {
  // Obtener todos los usuarios
  static async getAll(req: Request, res: Response) {
    try {
      const userRepository = AppDataSource.getRepository(User);
      const users = await userRepository.find();
       
      res.json({
        message: "Se obtuvieron todos los usuarios",
        data: users
      });
    } catch (error) {
      res.status(500).json({
        message: "No se pudieron obtener los usuarios",
        error
      });
    }
  }

  // Crear un nuevo usuario
  static async create(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      const userRepository = AppDataSource.getRepository(User);
      
      // Crear nueva instancia de usuario
      const newUser = userRepository.create({
        email,
        password, 
        firstName,
        lastName
      });

      // Guardar en la base de datos
      const savedUser = await userRepository.save(newUser);
      
      res.status(201).json({
        message: "Usuario creado con éxito",
        data: savedUser
      });
    } catch (error) {
      res.status(500).json({
        message: "No se pudo crear el usuario",
        error
      });
    }
  }
  // Actualizar un usuario existente
static async update(req: Request, res: Response) {
  try {
    const { id } = req.params;  // ID del usuario a actualizar
    const { email, password, firstName, lastName } = req.body;

    const userRepository = AppDataSource.getRepository(User);

    // Verificar que el usuario existe
    const user = await userRepository.findOne({ where: { id: parseInt(id) } });
    if (!user) {
      return res.status(404).json({
        message: "Usuario no encontrado"
      });
    }

    // Actualizar los campos (solo si se enviaron en el body)
    user.email = email ?? user.email;
    user.password = password ?? user.password;
    user.firstName = firstName ?? user.firstName;
    user.lastName = lastName ?? user.lastName;

    // Guardar cambios
    const updatedUser = await userRepository.save(user);

    res.json({
      message: "Usuario actualizado con éxito",
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({
      message: "No se pudo actualizar el usuario",
      error
    });
  }
}
// Borrar un usuario existente
static async delete(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const userRepository = AppDataSource.getRepository(User);

    // Verificar si existe el usuario
    const user = await userRepository.findOne({ where: { id: parseInt(id) } });
    if (!user) {
      return res.status(404).json({
        message: "Usuario no encontrado"
      });
    }

    // Eliminar usuario
    await userRepository.remove(user);

    res.json({
      message: "Usuario eliminado con éxito"
    });
  } catch (error) {
    res.status(500).json({
      message: "No se pudo eliminar el usuario",
      error
    });
  }
}


}