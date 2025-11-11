import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Task } from "../entities/Task";
import { TaskService } from "../services/TaskService";

export class TaskController {
  // Obtener todas las tareas
  static async getAll(req: Request, res: Response) {
    try {
      const taskRepository = AppDataSource.getRepository(Task);
      const tasks = await taskRepository.find({
        relations: ["team", "createdBy", "assignedTo"],
      });
      res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener tareas" });
    }
  }

  // Obtener tarea según ID
  static async getOneById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const taskRepository = AppDataSource.getRepository(Task);
      const task = await taskRepository.findOne({
        where: { id },
        relations: ["team", "createdBy", "assignedTo", "comments", "comments.author"],
      });
      if (!task) {
        return res.status(404).json({ message: "No se encontró la tarea" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener la tarea" });
    }
  }
  
  // Crear una nueva tarea
  static async create(req: Request, res: Response) {
    try {
      const taskService = new TaskService();  //Derivamos la lógica al servicio
      const createdTask = await taskService.createTask(req.body);
      res.status(201).json(createdTask);
    } catch (error) {
        if (error instanceof Error) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: "Error interno al crear tarea" });
    }
  }






  // Actualizar tarea por ID
  static async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      
      // --- CAMBIO AQUÍ ---
      // 'updates' contendrá todo (title, desc, status, changedById)
      const updates = req.body; 
      
      // Extraemos el changedById (quién edita) del cuerpo
      const { changedById } = req.body;
      
      // Validación: Necesitamos saber quién hizo el cambio
      if (!changedById) {
        return res.status(400).json({ message: "No se proporcionó el ID del usuario que realiza el cambio (changedById)." });
      }
      // --- FIN DEL CAMBIO ---

      const taskService = new TaskService();

      // Pasamos el ID del usuario al servicio
      const updatedTask = await taskService.updateTask(id, updates, changedById);

      res.json(updatedTask);

    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("Tarea no encontrada")) {
          return res.status(404).json({ message: error.message });
        }
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "No se pudo actualizar la tarea" });
    }
  }
  
  // Eliminar una tarea por ID
  static async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const taskRepository = AppDataSource.getRepository(Task);
      const result = await taskRepository.delete(id);
      if (result.affected === 0) {
        return res.status(404).json({ message: "No se encontró la tarea" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "No se pudo eliminar la tarea" });
    }
  }
}

