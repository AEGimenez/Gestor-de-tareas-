import { AppDataSource } from "../config/database";
import { Task, TaskStatus, TaskPriority } from "../entities/Task"; // <-- TaskPriority añadido
import { User } from "../entities/User"; // <-- Añadido
import { Team } from "../entities/Team"; // <-- Añadido
import { StatusHistory } from "../entities/StatusHistory"; // <-- Ya estaba
import { Tag } from "../entities/Tag"; // <-- Añadido
import { TaskTag } from "../entities/TaskTag"; // <-- Añadido
import { ActivityService, ActivityType } from "./ActivityService"; // Importación del nuevo servicio
// --- 1. IMPORTAR OPERADORES Y TIPOS DE TypeORM ---
import { In, Like, FindOptionsWhere, Between, MoreThanOrEqual, LessThanOrEqual } from "typeorm"; 


// Un objeto para definir las transiciones de estado válidas
const allowedTransitions: Record<TaskStatus, TaskStatus[]> = {
  [TaskStatus.PENDING]: [TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED],
  [TaskStatus.IN_PROGRESS]: [TaskStatus.COMPLETED, TaskStatus.CANCELLED],
  [TaskStatus.COMPLETED]: [], // No se puede cambiar desde "finalizada"
  [TaskStatus.CANCELLED]: [], // No se puede cambiar desde "cancelada"
};

// --- 2. INTERFAZ PARA LOS FILTROS (Exportada para TaskController) ---
export interface ITaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string; 
  teamId?: number;
  dueDateFrom?: string; 
  dueDateTo?: string;   
  tagIds?: number[]; 
}

export class TaskService {
  private taskRepository = AppDataSource.getRepository(Task);
  private statusHistoryRepository = AppDataSource.getRepository(StatusHistory);
  private userRepository = AppDataSource.getRepository(User);
  private activityService = new ActivityService();
  private teamRepository = AppDataSource.getRepository(Team); // Para el log de actividad
  private tagRepository = AppDataSource.getRepository(Tag);
  private taskTagRepository = AppDataSource.getRepository(TaskTag);


  // --- 3. MÉTODO GETALLTASKS (con QueryBuilder para filtros) ---
  async getAllTasks(filters: ITaskFilters): Promise<Task[]> {
    
    // Usamos QueryBuilder para poder hacer JOINs complejos para los filtros
    const qb = this.taskRepository.createQueryBuilder("task");

    // --- APLICAR FILTROS (AND) ---
    if (filters.status) {
      qb.andWhere("task.status = :status", { status: filters.status });
    }
    if (filters.priority) {
      qb.andWhere("task.priority = :priority", { priority: filters.priority });
    }
    if (filters.teamId) {
      qb.andWhere("task.teamId = :teamId", { teamId: filters.teamId });
    }

    // Filtro de Fechas
    if (filters.dueDateFrom && filters.dueDateTo) {
      qb.andWhere("task.dueDate BETWEEN :from AND :to", { from: filters.dueDateFrom, to: filters.dueDateTo });
    } else if (filters.dueDateFrom) {
      qb.andWhere("task.dueDate >= :from", { from: filters.dueDateFrom });
    } else if (filters.dueDateTo) {
      qb.andWhere("task.dueDate <= :to", { to: filters.dueDateTo });
    }
    
    // Filtro de Etiquetas (Tags)
    if (filters.tagIds && filters.tagIds.length > 0) {
      qb.innerJoin("task.taskTags", "taskTag", "taskTag.tagId IN (:...tagIds)", { 
        tagIds: filters.tagIds 
      });
    }

    // Filtro de Búsqueda (OR en title/description)
    if (filters.search) {
      qb.andWhere("(task.title ILIKE :search OR task.description ILIKE :search)", {
        search: `%${filters.search}%`
      });
    }
    
    // Cargamos todas las relaciones
    qb.leftJoinAndSelect("task.team", "team")
      .leftJoinAndSelect("task.createdBy", "createdBy")
      .leftJoinAndSelect("task.assignedTo", "assignedTo")
      .leftJoinAndSelect("task.taskTags", "taskTags") 
      .leftJoinAndSelect("taskTags.tag", "tag");

    // Ordenar y obtener resultados
    return qb.orderBy("task.createdAt", "DESC").getMany();
  }

  // --- 4. MÉTODO createTask (Log Activity) ---
  async createTask(taskData: Partial<Task>): Promise<Task> {
    
    // ... (Validación de dueDate)
    
    const task = this.taskRepository.create({
        ...taskData,
        team: { id: (taskData as any).teamId } as Team,
        createdBy: { id: (taskData as any).createdById } as User,
        assignedTo: (taskData as any).assignedToId ? { id: (taskData as any).assignedToId } as User : undefined,
    });

    const savedTask = await this.taskRepository.save(task);

    // ⭐️ LOG DE ACTIVIDAD: Tarea Creada
    const actorId = (taskData as any).createdById;
    const teamId = (taskData as any).teamId;
    
    if (actorId && teamId) {
        await this.activityService.createActivity({
            type: ActivityType.TASK_CREATED,
            description: `Tarea "${savedTask.title}" creada.`,
            actorId: actorId,
            teamId: teamId,
            taskId: savedTask.id,
        });
    }

    return savedTask;
  }

  // --- 5. MÉTODO updateTask (Log Activity y Historial) ---
async updateTask(id: number, updates: Partial<Task>, changedById: number): Promise<Task> {
    const task = await this.taskRepository.findOneBy({ id });

    if (!task) {
      throw new Error("Tarea no encontrada");
    }

    // ... (REGLA DE NEGOCIO 1: Restricciones de edición)
    // ... (REGLA DE NEGOCIO 2: Transiciones de estado válidas)
    
    const isStatusChanged = updates.status && updates.status !== task.status;
    const previousStatus = task.status;

    // Actualiza los campos de la tarea
    Object.assign(task, updates); 
    
    // Manejo de la relación assignedTo (si se actualiza)
    if ((updates as any).assignedToId !== undefined) {
        task.assignedTo = (updates as any).assignedToId ? { id: (updates as any).assignedToId } as User : undefined;
    }
    
    // ... (REGLA DE NEGOCIO 3: Validación de fecha límite no pasada)

    const updatedTask = await this.taskRepository.save(task);

    // ----------------------------------------------------
    // ⭐️ LOG DE ACTIVIDAD
    // ----------------------------------------------------
    
    let activityType: ActivityType | null = null;
    let activityDescription: string = "";

    if (isStatusChanged) {
        // 1. Guardar en StatusHistory (como ya lo tenías)
        const historyEntry = this.statusHistoryRepository.create({
            task: updatedTask,
            previousStatus: previousStatus,
            newStatus: updatedTask.status,
            changedBy: { id: changedById } as User,
        });
        await this.statusHistoryRepository.save(historyEntry);

        // 2. Definir actividad para cambio de estado
        activityType = ActivityType.STATUS_CHANGED;
        activityDescription = `Estado de "${updatedTask.title}" cambiado de '${previousStatus}' a '${updatedTask.status}'.`;
    } else if (Object.keys(updates).some(key => key !== 'changedById')) { // Si se actualizó algún otro campo
        activityType = ActivityType.TASK_UPDATED;
        activityDescription = `Tarea "${updatedTask.title}" actualizada.`;
    }

    // 3. Crear registro de actividad
    if (activityType) {
        await this.activityService.createActivity({
            type: activityType,
            description: activityDescription,
            actorId: changedById, // El usuario que realizó el cambio
            teamId: updatedTask.teamId,
            taskId: updatedTask.id,
        });
    }

    return updatedTask;
  }

  // --- 6. MÉTODO updateTaskTags (Sigue igual) ---
  async updateTaskTags(taskId: number, tagIds: number[]): Promise<void> { /* ... */ }
}