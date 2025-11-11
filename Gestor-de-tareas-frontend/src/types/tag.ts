// src/types/tag.ts

/**
 * Interfaz para la entidad Tag
 * (Basado en tu backend/entities/Tag.ts que vimos anteriormente)
 */
export interface Tag {
  id: number;
  name: string;
  
  // Nota: Tu 'FRONTEND-TAREAS.md' sugería un campo 'color',
  // pero tu entidad 'Tag.ts' del backend no lo tiene.
  // Por ahora, seguimos la estructura del backend.
  // color?: string; 
}