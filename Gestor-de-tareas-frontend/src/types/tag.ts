// src/types/tag.ts

/**
 * Interfaz para la entidad Tag
 * (Basado en tu backend/entities/Tag.ts)
 */
export interface Tag {
  id: number;
  name: string;
}

/**
 * Interfaz para la tabla intermedia TaskTag
 * (Basada en tu backend/entities/TaskTag.ts y lo que nos
 * devuelve el endpoint GET /tasks/:id)
 */
export interface TaskTag {
  id: number;
  tag: Tag; // El objeto Tag anidado
}