// src/controllers/TaskWatcherController.ts

import { Request, Response } from "express";
import { TaskWatcherService } from "../services/TaskWatcherService";
import { TaskStatus } from "../entities/Task";

const service = new TaskWatcherService();

export class TaskWatcherController {
  // GET /tasks/:taskId/watchers
  static async getByTask(req: Request, res: Response) {
    try {
      const taskId = Number(req.params.taskId);
      if (Number.isNaN(taskId)) {
        return res.status(400).json({ message: "taskId inválido" });
      }

      const watchers = await service.getWatchersByTask(taskId);
      return res.json(watchers);
    } catch (error: any) {
      console.error("Error getByTask watchers:", error);
      return res.status(500).json({ message: error.message || "Error interno" });
    }
  }

  // POST /tasks/:taskId/watchers
  static async subscribe(req: Request, res: Response) {
    try {
      const taskId = Number(req.params.taskId);
      const { userId } = req.body;

      if (Number.isNaN(taskId) || !userId) {
        return res.status(400).json({ message: "taskId y userId son obligatorios" });
      }

      const watcher = await service.subscribe(taskId, Number(userId));
      return res.status(201).json(watcher);
    } catch (error: any) {
      console.error("Error subscribe watcher:", error);
      if (error.message === "Tarea no encontrada" || error.message === "Usuario no encontrado") {
        return res.status(404).json({ message: error.message });
      }
      if (
        error.message === "El usuario no pertenece al equipo de la tarea" ||
        error.message === "Se alcanzó el máximo de watchers para esta tarea"
      ) {
        return res.status(422).json({ message: error.message });
      }
      return res.status(500).json({ message: "Error interno" });
    }
  }

  // DELETE /tasks/:taskId/watchers/:userId
  static async unsubscribe(req: Request, res: Response) {
    try {
      const taskId = Number(req.params.taskId);
      const userId = Number(req.params.userId);

      if (Number.isNaN(taskId) || Number.isNaN(userId)) {
        return res.status(400).json({ message: "IDs inválidos" });
      }

      await service.unsubscribe(taskId, userId);
      return res.status(204).send();
    } catch (error: any) {
      console.error("Error unsubscribe watcher:", error);
      return res.status(500).json({ message: "Error interno" });
    }
  }

  // GET /watchers/watchlist?userId=...&status=...&teamId=...&page=1&limit=10
  static async getWatchlist(req: Request, res: Response) {
    try {
      const userId = Number(req.query.userId);
      if (Number.isNaN(userId)) {
        return res.status(400).json({ message: "userId es obligatorio" });
      }

      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 10;

      let status: TaskStatus | undefined;
      if (req.query.status && Object.values(TaskStatus).includes(req.query.status as TaskStatus)) {
        status = req.query.status as TaskStatus;
      }

      const teamId = req.query.teamId ? Number(req.query.teamId) : undefined;

      const result = await service.getWatchlist(userId, page, limit, {
        status,
        teamId,
      });

      return res.json(result);
    } catch (error: any) {
      console.error("Error getWatchlist:", error);
      return res.status(500).json({ message: "Error interno" });
    }
  }

  // GET /watchers/notifications?userId=...&unreadOnly=true
  static async getNotifications(req: Request, res: Response) {
    try {
      const userId = Number(req.query.userId);
      if (Number.isNaN(userId)) {
        return res.status(400).json({ message: "userId es obligatorio" });
      }

      const unreadOnly = req.query.unreadOnly === "true";

      const notifications = await service.getNotifications(userId, unreadOnly);
      return res.json(notifications);
    } catch (error: any) {
      console.error("Error getNotifications:", error);
      return res.status(500).json({ message: "Error interno" });
    }
  }

  // PATCH /watchers/notifications/read
  static async markNotificationsAsRead(req: Request, res: Response) {
    try {
      const { userId, notificationIds } = req.body;

      if (!userId || !Array.isArray(notificationIds)) {
        return res
          .status(400)
          .json({ message: "userId y notificationIds[] son obligatorios" });
      }

      await service.markNotificationsAsRead(Number(userId), notificationIds.map(Number));

      return res.status(204).send();
    } catch (error: any) {
      console.error("Error markNotificationsAsRead:", error);
      return res.status(500).json({ message: "Error interno" });
    }
  }
}
