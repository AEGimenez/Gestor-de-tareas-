// src/types/task.ts
import { type User } from './user';
import { type Team } from './team';
import { type TaskTag } from './tag'; // <-- Importa el tipo que acabamos de crear
import { type Comment } from './comment'; // <-- Importa el tipo de comentario (del paso anterior)
import { type StatusHistory } from './history'; // <-- Importa el tipo de historial (del paso anterior)

// --- ENUMS ---
// (Copiados 1:1 de tu backend/entities/Task.ts)
// Esto soluciona el error "Cannot find name 'TaskStatus'"
export enum TaskStatus {
  PENDING = "pendiente",
  IN_PROGRESS = "en_curso", 
  COMPLETED = "finalizada",
  CANCELLED = "cancelada"
}

export enum TaskPriority {
  HIGH = "alta",
  MEDIUM = "media",
  LOW = "baja"
}

// --- INTERFAZ ---
// Mapea la clase Task de TypeORM a una interfaz de Frontend
export interface Task {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  
  // IDs
  teamId: number;
  createdById: number;
  assignedToId?: number;

  // Relaciones populadas (que el backend nos envía)
  team?: Team;
  createdBy?: User;
  assignedTo?: User;
  
  // Relaciones anidadas (que el backend nos envía)
  taskTags?: TaskTag[]; 
  comments?: Comment[]; 
  statusHistory?: StatusHistory[];
}