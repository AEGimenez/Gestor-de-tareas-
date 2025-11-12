// src/types/task.ts
import { type User } from './user';
import { type Team } from './team';
import { type TaskTag } from './tag'; // <-- 1. IMPORTAR TaskTag
import { type Comment } from './comment';
import { type StatusHistory } from './history';

// --- ENUMS (Siguen igual) ---
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

// --- INTERFAZ (Actualizada) ---
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
  
  // --- 2. AÑADIR/ACTUALIZAR ESTAS LÍNEAS ---
  taskTags?: TaskTag[]; // <-- El backend nos envía esto
  comments?: Comment[]; // <-- El backend nos envía esto
  // (El historial lo cargamos por separado)
  // statusHistory?: StatusHistory[]; 
}