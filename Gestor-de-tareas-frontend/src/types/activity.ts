// src/types/activity.ts
import { type User } from './user';
import { type Team } from './team';
import { type Task } from './task';

// Tipos de actividad que tu backend usa (de Activity.ts)
export enum ActivityType {
  TASK_CREATED = "TASK_CREATED",
  COMMENT_ADDED = "COMMENT_ADDED",
  STATUS_CHANGED = "STATUS_CHANGED",
}

export interface Activity {
  id: number;
  type: ActivityType | string; // Permite strings si hay tipos que no mapeamos
  description?: string;
  createdAt: string;
  
  // Relaciones populadas (Actor, Team, Task)
  actor?: User; 
  team?: Team;
  task?: Task;
}