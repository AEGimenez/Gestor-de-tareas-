import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "../entities/User";
import { Team } from "../entities/Team";
import { Task } from "../entities/Task";
import { Comment } from "../entities/Comment";
import { TeamMembership } from "../entities/TeamMembership";

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: "gestor_tareas.sqlite", 
  synchronize: true,                // crea tablas automáticamente hasta que tengamos migraciones en funcionamiento
  logging: true,
  entities: [User, Team, Task, Comment, TeamMembership],
  //migrations: ["src/migrations/*.{ts,js}"], // TENEMOS LA SINCRONIZACION EN "VERDADERO" DESPUES VAMOS A CREAR MIGRACIONES
});
