import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Team } from "../entities/Team";
import { User } from "../entities/User";
import { TeamService } from "../services/TeamService";

export class TeamController {
  // Obtener todos los equipos
  static async getAll(req: Request, res: Response) {
    try {
      const teamRepository = AppDataSource.getRepository(Team);
      const teams = await teamRepository.find({
        relations: ["owner"],
      });
      
      res.json({
        message: "Se obtuvieron los equipos con éxito",
        data: teams
      });
    } catch (error) {
      res.status(500).json({
        message: "No se pudieron obtener equipos",
        error
      });
    }
  }

  // Crear un nuevo equipo
  static async create(req: Request, res: Response) {
    try {
      const { name, description, ownerId } = req.body;
      const teamRepository = AppDataSource.getRepository(Team);
      const userRepository = AppDataSource.getRepository(User);
      
      const owner = await userRepository.findOne({ where: { id: ownerId } });
      if (!owner) {
        return res.status(404).json({
          message: "No se encontró el usuario propietario"
        });
      }

      const newTeam = teamRepository.create({
        name,
        description,
        ownerId
      });
      const savedTeam = await teamRepository.save(newTeam);
      
      const teamWithOwner = await teamRepository.findOne({
        where: { id: savedTeam.id },
        relations: ["owner"]
      });
      
      res.status(201).json({
        message: "El equipo se creó con éxito",
        data: teamWithOwner
      });
    } catch (error) {
      res.status(500).json({
        message: "No se pudo crear el equipo",
        error
      });
    }
  }

  // borrar un equipo por ID
  static async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const teamService = new TeamService();
      await teamService.deleteTeam(id);

      // Respuesta estándar para un borrado exitoso
      res.status(204).send();

    } catch (error) {
      // Capturar los errores de negocio que vienen del servicio
      if (error instanceof Error) {
        if (error.message.includes("Equipo no encontrado")) {
          return res.status(404).json({ message: error.message });
        }
        // Para la regla de negocio de tareas activas
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "No se pudo eliminar el equipo" });
    }
  }

  // Actualizar un equipo por ID
  static async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { name, description } = req.body;

      const teamRepository = AppDataSource.getRepository(Team);
      const team = await teamRepository.findOne({ where: { id } });

      if (!team) {
        return res.status(404).json({ message: "Equipo no encontrado" });
      }

      // Solo actualiza los campos enviados
      if (name !== undefined) team.name = name;
      if (description !== undefined) team.description = description;

      const updatedTeam = await teamRepository.save(team);

      res.json({
        message: "Equipo actualizado correctamente",
        data: updatedTeam
      });
    } catch (error) {
      res.status(500).json({
        message: "Error al actualizar equipo",
        error
      });
    }
  }

  
}



