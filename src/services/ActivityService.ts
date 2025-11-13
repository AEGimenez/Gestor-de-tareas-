import { AppDataSource } from "../config/database";
import { Activity } from "../entities/Activity";
import { User } from "../entities/User";
import { Team } from "../entities/Team";
import { Task } from "../entities/Task";

// Definimos los tipos de actividad que usaremos
export enum ActivityType {
  TASK_CREATED = "TASK_CREATED",
  TASK_UPDATED = "TASK_UPDATED",
  STATUS_CHANGED = "STATUS_CHANGED",
  COMMENT_ADDED = "COMMENT_ADDED",
  TEAM_CREATED = "TEAM_CREATED",
  MEMBER_ADDED = "MEMBER_ADDED",
}

export interface ActivityData {
  type: ActivityType;
  description: string;
  actorId: number; // El usuario que realizó la acción
  teamId?: number;
  taskId?: number;
}

export class ActivityService {
  private activityRepository = AppDataSource.getRepository(Activity);

  async createActivity({
    type,
    description,
    actorId,
    teamId,
    taskId,
  }: ActivityData): Promise<Activity> {
    
    const activity = this.activityRepository.create({
      type,
      description,
      // TypeORM usa el ID para establecer la relación
      actor: { id: actorId } as User,
      team: teamId ? { id: teamId } as Team : undefined,
      task: taskId ? { id: taskId } as Task : undefined,
    });

    try {
        return await this.activityRepository.save(activity);
    } catch (error) {
        // Logueamos el error, pero no interrumpimos la operación principal (ej: creación de tarea)
        console.error("Error al guardar la actividad:", error);
        throw new Error("Fallo al registrar la actividad"); 
    }
  }

  async getFeed(teamId?: number, activityType?: ActivityType): Promise<Activity[]> {
      
    const qb = this.activityRepository.createQueryBuilder("activity");

    // Lógica para filtrar por teamId
    if (teamId) {
        qb.where("activity.teamId = :teamId", { teamId: teamId });
    }
    
    // Lógica para filtrar por tipo de actividad
    if (activityType) {
        // Si ya aplicamos un filtro (teamId), usamos AND. Si no, usamos WHERE.
        if (teamId) {
            qb.andWhere("activity.type = :type", { type: activityType });
        } else {
            qb.where("activity.type = :type", { type: activityType });
        }
    }
    
    // 2. RELACIONES: Cargar las entidades relacionadas (actor y task)
    qb.leftJoinAndSelect("activity.actor", "actor")
      .leftJoinAndSelect("activity.task", "task");
      
    // 3. ORDEN y Paginación
    qb.orderBy("activity.createdAt", "DESC");
    qb.take(50); 

    // 4. Ejecutar y retornar
    return qb.getMany();
  }
}