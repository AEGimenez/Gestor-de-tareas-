import { Request, Response } from "express";
// ⭐️ IMPORTANTE: Ahora solo necesitamos importar el Service
import { CommentService } from "../services/CommentService"; 

// Instanciamos el servicio (puede ser en el constructor si no fuera un método estático)
const commentService = new CommentService();

export class CommentController {
  
  // Crear comentario
  // El controlador solo se encarga de la entrada/salida HTTP y de llamar al servicio.
  static async create(req: Request, res: Response) {
    try {
      const { content, taskId, authorId } = req.body;
      
      // 1. Validar datos básicos
      if (!content || !taskId || !authorId) {
          return res.status(400).json({ message: "Faltan campos obligatorios (content, taskId, authorId)." });
      }

      // 2. Llamar al Service, que maneja:
      //    a) La validación de Tarea/Autor
      //    b) El guardado del comentario
      //    c) El Log de Actividad (COMMENT_ADDED)
      const savedComment = await commentService.createComment({ 
        content, 
        taskId, 
        authorId 
      });

      // Nota: Aquí podrías necesitar un método en el Service para buscar el comentario
      // con las relaciones completas si el Service solo devuelve la entidad cruda.
      
      res.status(201).json({
        message: "El comentario se creó con éxito (Actividad Registrada)",
        data: savedComment,
      });
      
    } catch (error: any) {
      // Manejo de errores del Service (ej. "Tarea no encontrada")
      const statusCode = (error.message && error.message.includes("no encontrado")) ? 404 : 500;
      res.status(statusCode).json({
        message: "Error al crear comentario",
        error: error.message,
      });
    }
  }

  // --- MÉTODOS EXISTENTES (Mantener la referencia a la entidad si es necesario) ---
  
  // Obtener comentarios de una tarea específica
  // NOTA: Para limpiar el código, este método también debería ir en el CommentService.
  static async getByTask(req: Request, res: Response) {
    try {
      const { taskId } = req.params;
      
      const comments = await commentService.getCommentsByTaskId(parseInt(taskId)); // ⭐️ Asumiendo que creas este método
      
      res.json({
        message: "Los comentarios se obtuvieron con éxito",
        data: comments,
      });
    } catch (error) {
      res.status(500).json({
        message: "Error al obtener los comentarios",
        error,
      });
    }
  }

  // Obtener todos los comentarios
  // NOTA: Para limpiar el código, este método también debería ir en el CommentService.
  static async getAll(req: Request, res: Response) {
    try {
      const comments = await commentService.getAllComments(); // ⭐️ Asumiendo que creas este método
      
      res.json({
        message: "Todos los comentarios se obtuvieron con éxito",
        data: comments,
      });
    } catch (error) {
      res.status(500).json({
        message: "Error al obtener los comentarios",
        error,
      });
    }
  }

  // Actualizar comentario (solo content)
  // NOTA: Este método también debería ir en el CommentService para posible Log de Actividad.
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { content } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({ message: "El contenido no puede estar vacío" });
      }

      const updated = await commentService.updateComment(Number(id), content.trim()); // ⭐️ Asumiendo este método

      res.json({ message: "Comentario actualizado", data: updated });
    } catch (error) {
      res.status(500).json({ message: "Error al actualizar comentario", error });
    }
  }

  // Eliminar comentario
  // NOTA: Este método también debería ir en el CommentService para posible Log de Actividad.
  static async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      await commentService.removeComment(Number(id)); // ⭐️ Asumiendo este método
      
      res.json({ message: "Comentario eliminado" });
    } catch (error) {
      res.status(500).json({ message: "Error al eliminar comentario", error });
    }
  }
}