import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { StatusHistory } from "../entities/StatusHistory";
import { Task } from "../entities/Task";

export class StatusHistoryController {

  /**
   * Obtener el historial de cambios de estado para una tarea específica
   */
  static async getByTask(req: Request, res: Response) {
    try {
      const { taskId } = req.params;
      
      const historyRepository = AppDataSource.getRepository(StatusHistory);
      const taskRepository = AppDataSource.getRepository(Task);

      // 1. Validar que la tarea exista
      const task = await taskRepository.findOne({ where: { id: parseInt(taskId) } });
      if (!task) {
        return res.status(404).json({ message: "Tarea no encontrada" });
      }

      // 2. Buscar el historial
      const history = await historyRepository.find({
        where: { task: { id: parseInt(taskId) } },
        // ¡Importante! Incluimos la relación con "changedBy" (User)
        relations: ["changedBy"],
        // Ordenamos por el más reciente primero
        order: { changedAt: "DESC" }
      });
      
      res.json({
        message: "Historial obtenido con éxito",
        data: history
      });

    } catch (error) {
      res.status(500).json({
        message: "Error al obtener el historial de la tarea",
        error
      });
    }
  }
}