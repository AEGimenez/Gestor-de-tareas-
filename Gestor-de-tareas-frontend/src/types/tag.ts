// src/types/tag.ts

/**
 * Interfaz para la entidad Tag
 * (Basado en tu backend/entities/Tag.ts que vimos)
 */
export interface Tag {
  id: number;
  name: string;
}

/**
 * Interfaz para la tabla intermedia TaskTag
 * (Basada en tu backend/entities/TaskTag.ts)
 */
export interface TaskTag {
  id: number;
  tag: Tag; // El objeto Tag anidado
}