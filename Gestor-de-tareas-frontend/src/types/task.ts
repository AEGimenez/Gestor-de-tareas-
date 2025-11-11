// src/types/task.ts
import { type User } from './user';
import { type Team } from './team';
import { type Tag } from './tag';

// --- ENUMS ---
// Copiados 1:1 de tu backend/entities/Task.ts
// Esto es crucial para los filtros y la lógica de negocio.

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
  description?: string; // Es nullable en el backend
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;     // Las fechas de la API siempre como string
  createdAt: string;
  updatedAt: string;
  
  // IDs de relaciones
  teamId: number;
  createdById: number;
  assignedToId?: number; // Es nullable en el backend

  // Relaciones populadas (que el backend nos envía)
  // Tu TaskController.ts confirma que estas se cargan
  team?: Team;
  createdBy?: User;
  assignedTo?: User;
  
  // Relaciones anidadas (para la vista de detalle)
  // El backend usa TaskTag, pero el frontend solo necesita la lista de Tags
  tags?: Tag[]; 
  
  // TODO: Agregaremos Comment e StatusHistory aquí cuando creemos esos tipos
  // comments?: Comment[]; 
  // statusHistory?: StatusHistory[];
}