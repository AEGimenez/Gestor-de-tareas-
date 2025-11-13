// src/controllers/TeamController.ts

import { Request, Response } from "express";
import { TeamService } from "../services/TeamService"; // ⭐️ Solo necesitamos el Service

const teamService = new TeamService(); // Instanciamos el servicio

export class TeamController {
  // Obtener todos los equipos
  static async getAll(req: Request, res: Response) {
    try {
      const teams = await teamService.getAllTeams(); // Llama al Service
      
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
      
      // Llama al Service, que maneja la validación de owner y el log de actividad
      const teamWithOwner = await teamService.createTeam(name, description, ownerId);
      
      res.status(201).json({
        message: "El equipo se creó con éxito",
        data: teamWithOwner
      });
    } catch (error: any) {
        const statusCode = error.message.includes("propietario") ? 404 : 500;
      res.status(statusCode).json({
        message: "No se pudo crear el equipo",
        error: error.message
      });
    }
  }

  // borrar un equipo por ID
  static async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await teamService.deleteTeam(id); // Llama al Service

      res.status(204).send();

    } catch (error: any) {
      if (error.message.includes("Equipo no encontrado")) {
        return res.status(404).json({ message: error.message });
      }
      // Para la regla de negocio de tareas activas
      return res.status(400).json({ message: error.message });
    }
  }

  // Actualizar un equipo por ID
  static async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { name, description } = req.body;
      
      // Llama al Service, que maneja la búsqueda y el guardado
      const updatedTeam = await teamService.updateTeam(id, name, description);

      res.json({
        message: "Equipo actualizado correctamente",
        data: updatedTeam
      });
    } catch (error: any) {
        const statusCode = error.message.includes("Equipo no encontrado") ? 404 : 500;
      res.status(statusCode).json({
        message: "Error al actualizar equipo",
        error: error.message
      });
    }
  }
  
  // ⭐️ NUEVO MÉTODO para obtener equipos del usuario (para el filtro del frontend)
  static async getTeamsForUser(req: Request, res: Response) {
      try {
          // Asumimos que el ID del usuario viene de un middleware (req as any).userId
          const userId = (req as any).userId || parseInt(req.params.userId); 
          
          if (isNaN(userId)) {
              return res.status(400).json({ message: "ID de usuario inválido." });
          }
          
          const teams = await teamService.getTeamsByUserId(userId);
          
          return res.json({
              message: `Equipos del usuario ${userId} obtenidos con éxito.`,
              data: teams,
          });
      } catch (error) {
          console.error("Error al obtener equipos del usuario:", error);
          return res.status(500).json({ 
              message: "Error al obtener equipos del usuario",
              error 
          });
      }
  }
}