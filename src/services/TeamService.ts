// src/services/TeamService.ts

import { In } from "typeorm";
import { AppDataSource } from "../config/database";
import { Team } from "../entities/Team";
import { User } from "../entities/User"; // Necesario para buscar al owner/miembro
import { TeamMembership } from "../entities/TeamMembership"; // ⭐️ Asumimos esta entidad para las membresías
import { Task, TaskStatus } from "../entities/Task";
import { ActivityService, ActivityType } from "./ActivityService"; // Para el log

// Tipo simplificado que el frontend necesita para el filtro
interface SimpleTeam {
    id: number;
    name: string;
}

export class TeamService {
    private teamRepository = AppDataSource.getRepository(Team);
    private taskRepository = AppDataSource.getRepository(Task);
    private userRepository = AppDataSource.getRepository(User);
    private teamMembershipRepository = AppDataSource.getRepository(TeamMembership); // ⭐️ Para la nueva funcionalidad
    private activityService = new ActivityService();

    // --- NUEVO MÉTODO 1: Obtener Equipos por Usuario (para el filtro) ---
    async getTeamsByUserId(userId: number): Promise<SimpleTeam[]> {
        
        // Buscamos las membresías del usuario y cargamos la información del equipo
        const memberships = await this.teamMembershipRepository.find({
            where: { user: { id: userId } as User },
            relations: ["team"],
        });

        // Mapeamos para devolver solo la información necesaria (id y name)
        return memberships
            .map(membership => membership.team)
            .filter((team): team is Team => !!team)
            .map(team => ({ id: team.id, name: team.name }));
    }
    
    // --- NUEVO MÉTODO 2: getAll (Refactorizado) ---
    async getAllTeams(): Promise<Team[]> {
        return this.teamRepository.find({
            relations: ["owner"],
        });
    }

    // --- NUEVO MÉTODO 3: createTeam (Refactorizado con Log) ---
    async createTeam(name: string, description: string, ownerId: number): Promise<Team> {
        const owner = await this.userRepository.findOneBy({ id: ownerId });
        if (!owner) {
            throw new Error("No se encontró el usuario propietario");
        }

        const newTeam = this.teamRepository.create({
            name,
            description,
            ownerId
        });
        const savedTeam = await this.teamRepository.save(newTeam);
        
        // ⭐️ LOG DE ACTIVIDAD: Equipo Creado
        await this.activityService.createActivity({
            type: ActivityType.TEAM_CREATED,
            description: `Equipo "${savedTeam.name}" creado por ${owner.firstName}.`,
            actorId: ownerId,
            teamId: savedTeam.id,
        });

        // NOTA: Aquí deberías crear una membresía para el owner si no lo haces en otro servicio.
        
        return this.teamRepository.findOneOrFail({
            where: { id: savedTeam.id },
            relations: ["owner"]
        });
    }
    
    // --- NUEVO MÉTODO 4: updateTeam (Refactorizado) ---
    async updateTeam(id: number, name?: string, description?: string): Promise<Team> {
        const team = await this.teamRepository.findOne({ where: { id } });

        if (!team) {
            throw new Error("Equipo no encontrado");
        }

        if (name !== undefined) team.name = name;
        if (description !== undefined) team.description = description;

        return this.teamRepository.save(team);
    }


    /**
     * Elimina un equipo solo si no tiene tareas pendientes o en curso (Mantiene lógica original).
     */
    async deleteTeam(id: number): Promise<void> {
        // ... (Tu lógica deleteTeam original aquí)
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

        const result = await this.teamRepository.delete(id);
        
        if (result.affected === 0) {
            throw new Error("No se pudo eliminar el equipo, puede que ya haya sido borrado.");
        }
    }
}