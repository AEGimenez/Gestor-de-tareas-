import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Task, TaskStatus, TaskPriority } from "../entities/Task"; 
// Importamos el servicio y las interfaces actualizadas
import { TaskService, ITaskFilters, PaginatedResponse } from "../services/TaskService"; 

export class TaskController {
  
  // --- MÉTODO GETALL COMPLETO CON PAGINACIÓN ---
  static async getAll(req: Request, res: Response) {
    try {
      // Extraemos todos los query parameters relevantes
      const { 
        status, 
        priority, 
        search, 
        teamId, 
        dueDateFrom,  
        dueDateTo,     
        tags,
        // ⭐️ NUEVOS PARÁMETROS DE PAGINACIÓN ⭐️
        page,
        limit
      } = req.query;

      // Creamos el objeto de filtros
      const filters: ITaskFilters = {};
      
      if (status) filters.status = status as TaskStatus;
      if (priority) filters.priority = priority as TaskPriority;
      if (search) filters.search = search as string;
      if (teamId) filters.teamId = Number(teamId);
      if (dueDateFrom) filters.dueDateFrom = dueDateFrom as string;
      if (dueDateTo) filters.dueDateTo = dueDateTo as string;
      
      // Lógica para Etiquetas
      if (tags && typeof tags === 'string') {
        filters.tagIds = tags.split(',').map(id => Number(id));
      }

      // ⭐️ Lógica para Paginación ⭐️
      if (page) filters.page = Number(page);
      if (limit) filters.limit = Number(limit);
      
      const taskService = new TaskService();
      // ⭐️ El servicio ahora devuelve PaginatedResponse<Task> ⭐️
      const paginatedTasks = await taskService.getAllTasks(filters); 
      
      // ⭐️ Devolvemos el objeto paginado ⭐️
      res.json(paginatedTasks); 

    } catch (error) {
        res.status(500).json({ message: "Error al obtener tareas" });
    }
  }

  // (getOneById, create, update, delete, assignTags siguen igual)
  static async getOneById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const taskRepository = AppDataSource.getRepository(Task);
      
      const task = await taskRepository.findOne({
        where: { id },
        relations: [
          "team", "createdBy", "assignedTo", "comments", 
          "comments.author", "taskTags", "taskTags.tag"
        ],
      });
      
      if (!task) {
        return res.status(404).json({ message: "No se encontró la tarea" });
      }
      res.json(task); 
    } catch (error) {
      res.status(500).json({ message: "Error al obtener la tarea" });
    }
  }
  
  // (create - Sigue igual)
  static async create(req: Request, res: Response) {
    try {
      const taskService = new TaskService();
      const createdTask = await taskService.createTask(req.body);
      res.status(201).json(createdTask);
    } catch (error) {
      if (error instanceof Error) {
          return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Error interno al crear tarea" });
    }
  }

  // (update - Sigue igual)
  static async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body; 
      const { changedById } = req.body;
      
      if (!changedById) {
        return res.status(400).json({ message: "No se proporcionó el ID del usuario que realiza el cambio (changedById)." });
      }

      const taskService = new TaskService();
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
  
  // (delete - Sigue igual)
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

  // (assignTags - Sigue igual)
  static async assignTags(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { tagIds } = req.body; 

      if (!Array.isArray(tagIds)) {
        return res.status(400).json({ message: "El body debe contener un array 'tagIds'." });
      }

      const taskService = new TaskService();
      await taskService.updateTaskTags(id, tagIds);

      res.status(200).json({ message: "Etiquetas actualizadas correctamente" });

    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("Tarea no encontrada")) {
          return res.status(404).json({ message: error.message });
        }
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "No se pudo actualizar las etiquetas" });
    }
  }
}