// src/services/TaskWatcherService.ts

import { AppDataSource } from "../config/database";
import { Task } from "../entities/Task";
import { User } from "../entities/User";
import { TaskWatcher } from "../entities/TaskWatcher";
import { TaskWatcherNotification, WatcherEventType } from "../entities/TaskWatcherNotification";
import { ActivityService, ActivityType } from "./ActivityService";
import { TeamMembership } from "../entities/TeamMembership";
import { TaskStatus } from "../entities/Task";

export class TaskWatcherService {
  private watcherRepo = AppDataSource.getRepository(TaskWatcher);
  private taskRepo = AppDataSource.getRepository(Task);
  private userRepo = AppDataSource.getRepository(User);
  private membershipRepo = AppDataSource.getRepository(TeamMembership);
  private notificationRepo = AppDataSource.getRepository(TaskWatcherNotification);
  private activityService = new ActivityService();

  private readonly MAX_WATCHERS_PER_TASK = 50;

  // 🔹 Obtener watchers de una tarea
  async getWatchersByTask(taskId: number): Promise<TaskWatcher[]> {
    return this.watcherRepo.find({
      where: { task: { id: taskId } },
      relations: ["user"],
      order: { createdAt: "ASC" },
    });
  }

  // 🔹 Suscribir usuario a una tarea
  async subscribe(taskId: number, userId: number): Promise<TaskWatcher> {
    const task = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: ["team"],
    });
    if (!task) {
      throw new Error("Tarea no encontrada");
    }

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    // Opcional: validar que el usuario pertenezca al equipo de la tarea
    if (task.team) {
      const membership = await this.membershipRepo.findOne({
        where: { team: { id: task.team.id }, user: { id: userId } },
      });

      if (!membership) {
        throw new Error("El usuario no pertenece al equipo de la tarea");
      }
    }

    // Máximo de watchers por tarea
    const count = await this.watcherRepo.count({
      where: { task: { id: taskId } },
    });
    if (count >= this.MAX_WATCHERS_PER_TASK) {
      throw new Error("Se alcanzó el máximo de watchers para esta tarea");
    }

    // Evitar duplicados
    const existing = await this.watcherRepo.findOne({
      where: { task: { id: taskId }, user: { id: userId } },
    });
    if (existing) {
      return existing;
    }

    const watcher = this.watcherRepo.create({
      task,
      user,
    });

    const saved = await this.watcherRepo.save(watcher);

    // Log de actividad (opcional)
    await this.activityService.createActivity({
      type: ActivityType.WATCHER_ADDED,
      description: `Empezó a seguir la tarea "${task.title}".`,
      actorId: userId,
      teamId: task.teamId,
      taskId: task.id,
    });

    return saved;
  }

  // 🔹 Desuscribir usuario de una tarea
  async unsubscribe(taskId: number, userId: number): Promise<void> {
    const watcher = await this.watcherRepo.findOne({
      where: { task: { id: taskId }, user: { id: userId } },
      relations: ["task"],
    });

    if (!watcher) {
      // Nada que borrar
      return;
    }

    await this.watcherRepo.remove(watcher);

    if (watcher.task) {
      await this.activityService.createActivity({
        type: ActivityType.WATCHER_REMOVED,
        description: `Dejó de seguir la tarea "${watcher.task.title}".`,
        actorId: userId,
        teamId: watcher.task.teamId,
        taskId: watcher.task.id,
      });
    }
  }

  // 🔹 Notificar a watchers (lo usan TaskService y CommentService)
  async notifyWatchers(
    taskId: number,
    eventType: WatcherEventType,
    actorId: number,
    payload: any = {}
  ): Promise<void> {
    const watchers = await this.watcherRepo.find({
      where: { task: { id: taskId } },
      relations: ["user"],
    });

    if (!watchers.length) return;

    const task = await this.taskRepo.findOne({ where: { id: taskId } });
    if (!task) return;

    const now = new Date();

    const notifications = watchers
      .filter(w => w.user.id !== actorId) // evitar notificar al que hizo la acción
      .map(w =>
        this.notificationRepo.create({
          user: w.user,
          task,
          eventType,
          payload,
          createdAt: now,
        })
      );

    if (notifications.length > 0) {
      await this.notificationRepo.save(notifications);
    }
  }

  // 🔹 Obtener notificaciones de un usuario
  async getNotifications(userId: number, unreadOnly = false) {
    const where: any = { user: { id: userId } };
    if (unreadOnly) {
      where.readAt = null;
    }

    return this.notificationRepo.find({
      where,
      relations: ["task"],
      order: { createdAt: "DESC" },
    });
  }

  // 🔹 Marcar notificaciones como leídas
  async markNotificationsAsRead(userId: number, notificationIds: number[]) {
    if (!notificationIds.length) return;

    await this.notificationRepo
      .createQueryBuilder()
      .update(TaskWatcherNotification)
      .set({ readAt: () => "NOW()" })
      .where("id IN (:...ids)", { ids: notificationIds })
      .andWhere("userId = :userId", { userId })
      .execute();
  }

  // 🔹 Watchlist de usuario (lista de tareas que sigue)
  async getWatchlist(
    userId: number,
    page = 1,
    limit = 10,
    filters?: { status?: TaskStatus; teamId?: number }
  ) {
    const qb = this.watcherRepo
      .createQueryBuilder("watcher")
      .innerJoinAndSelect("watcher.task", "task")
      .leftJoinAndSelect("task.team", "team")
      .where("watcher.userId = :userId", { userId });

    if (filters?.status) {
      qb.andWhere("task.status = :status", { status: filters.status });
    }
    if (filters?.teamId) {
      qb.andWhere("task.teamId = :teamId", { teamId: filters.teamId });
    }

    const total = await qb.getCount();

    const rows = await qb
      .orderBy("task.updatedAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const data = rows.map(w => {
      const t = w.task;
      const isOverdue =
        t.dueDate &&
        t.status !== TaskStatus.COMPLETED &&
        t.dueDate < new Date();

      return {
        taskId: t.id,
        title: t.title,
        teamId: t.teamId,
        teamName: t.team?.name ?? "",
        status: t.status,
        priority: t.priority,
        lastUpdateAt: t.updatedAt,
        isOverdue,
      };
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
