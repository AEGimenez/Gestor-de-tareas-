import { In } from "typeorm";
import { AppDataSource } from "../config/database";
import { Team } from "../entities/Team";
import { Task, TaskStatus } from "../entities/Task";

export class TeamService {
  private teamRepository = AppDataSource.getRepository(Team);
  private taskRepository = AppDataSource.getRepository(Task);

  /**
   * Elimina un equipo solo si no tiene tareas pendientes o en curso.
   * @param id El ID del equipo a eliminar.
   */
  async deleteTeam(id: number): Promise<void> {
    const team = await this.teamRepository.findOneBy({ id });

    if (!team) {
      throw new Error("Equipo no encontrado");
    }

    // --- REGLA DE NEGOCIO: No eliminar si hay tareas activas ---
    const activeTasksCount = await this.taskRepository.count({
      where: {
        teamId: id,
        status: In([TaskStatus.PENDING, TaskStatus.IN_PROGRESS]),
      },
    });

    if (activeTasksCount > 0) {
      throw new Error(
        `No se puede eliminar el equipo porque tiene ${activeTasksCount} tarea(s) pendiente(s) o en curso.`
      );
    }

    // Si no hay tareas activas, procedemos a eliminar.
    // NOTA: TypeORM manejará el borrado en cascada de membresías si está configurado en la entidad.
    const result = await this.teamRepository.delete(id);
    
    if (result.affected === 0) {
        // Esto podría ocurrir en una condición de carrera si alguien más lo borró.
        throw new Error("No se pudo eliminar el equipo, puede que ya haya sido borrado.");
    }
  }
}

