import { AppDataSource } from "../config/database";
import { Task, TaskStatus } from "../entities/Task";
import { User } from "../entities/User"; // <-- 1. IMPORTAR
import { Team } from "../entities/Team";
import { StatusHistory } from "../entities/StatusHistory"; // <-- 1. IMPORTAR

// (allowedTransitions sigue igual)
const allowedTransitions = {
  [TaskStatus.PENDING]: [TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED],
  [TaskStatus.IN_PROGRESS]: [TaskStatus.COMPLETED, TaskStatus.CANCELLED],
  [TaskStatus.COMPLETED]: [],
  [TaskStatus.CANCELLED]: [],
};

export class TaskService {
  private taskRepository = AppDataSource.getRepository(Task);
  // Obtenemos el repositorio del historial
  private historyRepository = AppDataSource.getRepository(StatusHistory);

  // (createTask sigue igual)
  async createTask(taskData: Partial<Task>): Promise<Task> {
    // ... (tu código de createTask)
    if (taskData.dueDate) {
      const dueDate = new Date(taskData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); 
      if (dueDate < today) {
        throw new Error("La fecha límite no puede ser en el pasado.");
      }
    }
    const task = this.taskRepository.create({
        ...taskData,
        team: { id: (taskData as any).teamId },
        createdBy: { id: (taskData as any).createdById },
        assignedTo: (taskData as any).assignedToId ? { id: (taskData as any).assignedToId } : undefined,
    });
    return this.taskRepository.save(task);
  }

  // --- 2. MODIFICAR LA FIRMA DE updateTask ---
  async updateTask(id: number, updates: Partial<Task>, changedById: number): Promise<Task> {
    const task = await this.taskRepository.findOneBy({ id });

    if (!task) {
      throw new Error("Tarea no encontrada");
    }

    // REGLA 1: Restricciones de edición (Sigue igual)
    if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CANCELLED) {
      throw new Error("No se puede editar una tarea que está finalizada o cancelada.");
    }
    
    // --- 3. LÓGICA DE HISTORIAL DE CAMBIOS ---
    // (La lógica de REGLA 2 se mueve aquí adentro)
    if (updates.status && updates.status !== task.status) {
      const transitions = allowedTransitions[task.status];
      if (!transitions || !transitions.includes(updates.status)) {
        throw new Error(`Transición de estado no válida de '${task.status}' a '${updates.status}'.`);
      }
      
      // ¡AQUÍ CREAMOS EL HISTORIAL!
      const historyEntry = this.historyRepository.create({
        task: task,
        previousStatus: task.status,
        newStatus: updates.status,
        changedBy: { id: changedById } as User // Asignamos quién lo cambió
      });
      // Guardamos el historial (no necesitamos esperar a que termine)
      this.historyRepository.save(historyEntry);
    }
    
    // REGLA 3: Validación de Fecha (Sigue igual)
    if (updates.dueDate) {
      // ... (tu validación de fecha)
    }

    // (Lógica de relaciones de Team y User - Sigue igual)
    const { teamId, assignedToId, ...otherUpdates } = updates as any;
    this.taskRepository.merge(task, otherUpdates);
    if (teamId !== undefined) {
      task.team = { id: Number(teamId) } as Team;
    }
    if (assignedToId !== undefined) {
      task.assignedTo = assignedToId ? { id: Number(assignedToId) } as User : undefined;
    }
    
    // Guardar la tarea actualizada
    return this.taskRepository.save(task);
  }
}