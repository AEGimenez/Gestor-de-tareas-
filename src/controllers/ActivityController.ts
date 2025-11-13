import { Request, Response } from "express";
import { ActivityService, ActivityType } from "../services/ActivityService";

const activityService = new ActivityService();

// ⭐️ FUNCIÓN DE UTILIDAD: Para validar que el string de la query sea un ActivityType válido
function isValidActivityType(type: string | undefined): ActivityType | undefined {
    if (!type || typeof type !== 'string') {
        return undefined;
    }
    // Verifica si la cadena existe como un valor dentro del enum ActivityType
    if (Object.values(ActivityType).includes(type as ActivityType)) {
        return type as ActivityType; 
    }
    return undefined; // No es un valor válido
}

export class ActivityController {
  
  /**
   * Endpoint: GET /activity?teamId=...&type=...
   * Obtiene el feed de actividad global o filtrado por query param 'teamId' y 'type'.
   */
  static async getGlobalFeed(req: Request, res: Response) {
    try {
      // Leer parámetros de la query string
      const teamIdParam = req.query.teamId;
      const rawActivityType = req.query.type as string | undefined; // Siempre se lee como string
      
      const teamId = teamIdParam ? parseInt(teamIdParam as string, 10) : undefined;
      
      // La validación de NaN se mantiene
      if (teamIdParam && isNaN(teamId as number)) {
          return res.status(400).json({ message: "El ID de equipo ('teamId') proporcionado no es un número válido." });
      }
      
      // ⭐️ SOLUCIÓN: Usamos la función de validación para obtener el ActivityType seguro
      const activityType = isValidActivityType(rawActivityType);

      // Llamamos al servicio pasando ambos filtros
      const activities = await activityService.getFeed(teamId, activityType);

      res.json({
        message: teamId 
          ? `Feed de actividad filtrado por equipo ${teamId} obtenido con éxito`
          : "Feed de actividad global (sin filtro de equipo) obtenido con éxito",
        data: activities,
      });

    } catch (error) {
      console.error("Error al obtener el feed de actividad:", error);
      res.status(500).json({ 
        message: "Error al obtener el feed de actividad", 
        error 
      });
    }
  }

  /**
   * Endpoint: GET /teams/:teamId/activity
   * Obtiene el feed de actividad para un equipo específico (sin filtro de tipo en esta ruta).
   */
  static async getTeamFeed(req: Request, res: Response) {
     try {
      const teamId = parseInt(req.params.teamId);
      
      if (isNaN(teamId)) {
          return res.status(400).json({ message: "El ID del equipo no es válido" });
      }
      
      // Aquí teamId siempre es un número válido. Llamamos sin filtro de tipo.
      const activities = await activityService.getFeed(teamId);

      res.json({
        message: `Feed de actividad para el equipo ${teamId} obtenido con éxito`,
        data: activities,
      });

    } catch (error) {
      console.error("Error al obtener el feed de actividad del equipo:", error);
      res.status(500).json({ 
        message: "Error al obtener el feed de actividad del equipo", 
        error 
      });
    }
  }
}