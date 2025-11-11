// src/types/history.ts
import { type User } from './user';
import { type TaskStatus } from './task'; // Importamos el Enum de Status

/**
 * Interfaz para la entidad StatusHistory
 * (Basada en tu backend/entities/StatusHistory.ts)
 */
export interface StatusHistory {
  id: number;
  previousStatus: TaskStatus;
  newStatus: TaskStatus;
  changedAt: string; // Usamos string para las fechas

  // Relación que poblamos en el backend
  changedBy: User; 
}