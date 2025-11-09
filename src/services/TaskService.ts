import { AppDataSource } from "../config/database";
import { Task, TaskStatus } from "../entities/Task";

// Un objeto para definir las transiciones de estado válidas
const allowedTransitions = {
  [TaskStatus.PENDING]: [TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED],
  [TaskStatus.IN_PROGRESS]: [TaskStatus.COMPLETED, TaskStatus.CANCELLED],
  [TaskStatus.COMPLETED]: [], // No se puede cambiar desde "finalizada"
  [TaskStatus.CANCELLED]: [], // No se puede cambiar desde "cancelada"
};

export class TaskService {
  private taskRepository = AppDataSource.getRepository(Task);

  // --- NUEVO MÉTODO PARA CREAR TAREAS ---
  async createTask(taskData: Partial<Task>): Promise<Task> {
    
    // --- REGLA DE NEGOCIO 3: Validación de fecha límite no pasada ---
    if (taskData.dueDate) {
      const dueDate = new Date(taskData.dueDate);
      const today = new Date();
      // Ignoramos la hora para la comparación
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

  async updateTask(id: number, updates: Partial<Task>): Promise<Task> {
    const task = await this.taskRepository.findOneBy({ id });

    if (!task) {
      throw new Error("Tarea no encontrada");
    }

    // --- REGLA DE NEGOCIO 1: Restricciones de edición ---
    if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CANCELLED) {
      throw new Error("No se puede editar una tarea que está finalizada o cancelada.");
    }
    
    // --- REGLA DE NEGOCIO 2: Transiciones de estado válidas ---
    if (updates.status && updates.status !== task.status) {
      const transitions = allowedTransitions[task.status];
      if (!transitions || !transitions.includes(updates.status)) {
        throw new Error(`Transición de estado no válida de '${task.status}' a '${updates.status}'.`);
      }
    }

    // --- REGLA DE NEGOCIO 3 (APLICADA TAMBIÉN EN UPDATE) ---
    if (updates.dueDate) {
      const dueDate = new Date(updates.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dueDate < today) {
        throw new Error("La fecha límite no puede ser en el pasado.");
      }
    }

    // Si todas las reglas pasan, aplicamos los cambios
    this.taskRepository.merge(task, updates);
    return this.taskRepository.save(task);
  }
}

