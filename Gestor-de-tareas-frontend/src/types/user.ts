// src/types/user.ts

/**
 * Mapea la entidad User del backend
 */
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string; 
  createdAt: string; // Tipo string para fechas de la API (ISO format)
}

/**
 * Helper para obtener el nombre completo del usuario.
 * (Necesario para el selector y otras vistas).
 */
export const getFullName = (user: User): string => `${user.firstName} ${user.lastName}`;