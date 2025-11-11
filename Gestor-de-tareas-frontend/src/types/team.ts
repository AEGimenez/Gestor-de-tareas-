// Importamos el tipo 'User' que ya teníamos, 
// porque un 'Team' tiene un 'owner' (dueño).
import { type User } from './user';

/**
 * Rol del miembro en un equipo.
 * Copiado directamente de tu entidad TeamMembership.ts
 */
export enum MemberRole {
  OWNER = "propietario",
  MEMBER = "miembro"
}

/**
 * Interfaz para la entidad Team (Equipo).
 * Basado en tu archivo src/entities/Team.ts
 */
export interface Team {
  id: number;
  name: string;
  description?: string;
  ownerId: number;
  createdAt: string; // Las fechas de la API siempre son strings
  updatedAt: string;
  
  // Las relaciones (como 'owner') vendrán "pobladas" 
  // desde la API en algunas consultas.
  owner?: User; 
}

/**
 * Interfaz para la entidad TeamMembership (Membresía de Equipo).
 * Basado en tu archivo src/entities/TeamMembership.ts
 */
export interface TeamMembership {
  id: number;
  userId: number;
  teamId: number;
  role: MemberRole;
  joinedAt: string; // Las fechas de la API son strings

  // Relaciones que vendrán pobladas desde la API.
  // El endpoint 'GET /memberships/user/:userId' que usaremos
  // seguramente poblará la relación 'team'.
  user?: User;
  team?: Team;
}