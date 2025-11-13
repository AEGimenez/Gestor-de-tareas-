// src/types/comment.ts
import { type User } from './user';

/**
 * Interfaz para la entidad Comment
 * (Basada en tu backend/entities/Comment.ts)
 */
export interface Comment {
  id: number;
  content: string;
  authorId: number;
  taskId: number;
  createdAt: string; // Usamos string para las fechas
  updatedAt: string;

  // Relación opcional (cuando el backend la "popula")
  author?: User; 
}