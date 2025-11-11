import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { TeamMembership, MemberRole } from "../entities/TeamMembership";
import { User } from "../entities/User";
import { Team } from "../entities/Team";

export class TeamMembershipController {
  // Agregar usuario a un equipo
  static async addMember(req: Request, res: Response) {
    try {
      const { userId, teamId, role = MemberRole.MEMBER } = req.body;
      
      const membershipRepository = AppDataSource.getRepository(TeamMembership);
      const userRepository = AppDataSource.getRepository(User);
      const teamRepository = AppDataSource.getRepository(Team);
      
      // Verificar que el usuario existe
      const user = await userRepository.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({
          message: "El usuario no existe"
        });
      }

      // Verificar que el equipo existe
      const team = await teamRepository.findOne({ where: { id: teamId } });
      if (!team) {
        return res.status(404).json({
          message: "El equipo no existe"
        });
      }

      // Verificar si ya es miembro
      const existingMembership = await membershipRepository.findOne({
        where: { userId, teamId }
      });
      
      if (existingMembership) {
        return res.status(400).json({
          message: "El usuario ya está en el equipo"
        });
      }

      // Crear nueva membresía
      const newMembership = membershipRepository.create({
        userId,
        teamId,
        role
      });

      // Guardar en la base de datos
      const savedMembership = await membershipRepository.save(newMembership);
      
      // Obtener con relaciones
      const membershipWithRelations = await membershipRepository.findOne({
        where: { id: savedMembership.id },
        relations: ["user", "team"]
      });
      
      res.status(201).json({
        message: "Usuario agregado al equipo correctamente",
        data: membershipWithRelations
      });
    } catch (error) {
      res.status(500).json({
        message: "Error al agregar usuario al equipo",
        error
      });
    }
  }

  // Obtener miembros de un equipo
  static async getTeamMembers(req: Request, res: Response) {
    try {
      const { teamId } = req.params;
      
      const membershipRepository = AppDataSource.getRepository(TeamMembership);
      
      const members = await membershipRepository.find({
        where: { teamId: parseInt(teamId) },
        relations: ["user", "team"],
        order: { joinedAt: "ASC" }
      });
      
      res.json({
        message: "Se obtuvieron los miembros del equipo correctamente",
        data: members
      });
    } catch (error) {
      res.status(500).json({
        message: "Error al obtener miembros del equipo",
        error
      });
    }
  }

  // Obtener equipos de un usuario
  static async getUserTeams(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      
      const membershipRepository = AppDataSource.getRepository(TeamMembership);
      
      const teams = await membershipRepository.find({
        where: { userId: parseInt(userId) },
        relations: ["user", "team"],
        order: { joinedAt: "DESC" }
      });
      
      res.json({
        message: "Se obtuvieron los equipos del usuario correctamente",
        data: teams
      });
    } catch (error) {
      res.status(500).json({
        message: "Error al obtener equipos del usuario",
        error
      });
    }
  }

  static async removeMember(req: Request, res: Response) {
    try {
      const { teamId, userId } = req.params;
      
      const membershipRepository = AppDataSource.getRepository(TeamMembership);

      // Buscar la membresía específica
      const membership = await membershipRepository.findOne({
        where: { 
          teamId: parseInt(teamId), 
          userId: parseInt(userId) 
        }
      });

      if (!membership) {
        return res.status(404).json({
          message: "Membresía no encontrada. El usuario no pertenece a este equipo."
        });
      }

      // REGLA DE NEGOCIO (Según Épica 3.5): No permitir que un Propietario se elimine
      if (membership.role === MemberRole.OWNER) {
        return res.status(400).json({
          message: "No se puede eliminar al propietario del equipo."
        });
      }

      // Eliminar la membresía
      await membershipRepository.remove(membership);
      
      // Devolver 204 (No Content) que es estándar para un DELETE exitoso
      res.status(204).send(); 

    } catch (error) {
      res.status(500).json({
        message: "Error al eliminar miembro del equipo",
        error
      });
    }
  }
}