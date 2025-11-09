import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Comment } from "../entities/Comment";
import { User } from "../entities/User";
import { Task } from "../entities/Task";

export class CommentController {
  // Crear comentario
  static async create(req: Request, res: Response) {
    try {
      const { content, taskId, authorId } = req.body;
      
      //repositorios
      const commentRepository = AppDataSource.getRepository(Comment);
      const userRepository = AppDataSource.getRepository(User);
      const taskRepository = AppDataSource.getRepository(Task);
      
      // Valida q exista la tarea
      const task = await taskRepository.findOne({ where: { id: taskId } });
      if (!task) {
        return res.status(404).json({
          message: "Tarea no encontrada"
        });
      }

      // Valida la existencia del usuario autor
      const author = await userRepository.findOne({ where: { id: authorId } });
      if (!author) {
        return res.status(404).json({
          message: "Usuario autor no encontrado"
        });
      }

      // Crear un comentario nuevo
      const newComment = commentRepository.create({
        content,
        taskId,
        authorId
      });

      // Guardar en la DB
      const savedComment = await commentRepository.save(newComment);
      
      // Obtener el comentario y reponder 201 con el comentario creado
      const commentWithRelations = await commentRepository.findOne({
        where: { id: savedComment.id },
        relations: ["task", "author"]
      });
      
      res.status(201).json({
        message: "El comentario se creo con éxito",
        data: commentWithRelations
      });
    } catch (error) {
      //si algo falla responde 500 con el error
      res.status(500).json({
        message: "Error al crear comentario", 
        error
      });
    }
  }

  // Obtener comentarios de una tarea específica
  static async getByTask(req: Request, res: Response) {
    try {
      const { taskId } = req.params;
      
      const commentRepository = AppDataSource.getRepository(Comment);
      
      const comments = await commentRepository.find({
        where: { taskId: parseInt(taskId) },
        relations: ["author", "task"],
        order: { createdAt: "ASC" } 
      });
      
      res.json({
        message: "Los comentarios se obtuvieron con éxito",
        data: comments
      });
    } catch (error) {
      res.status(500).json({
        message: "Error al obtener los comentarios",
        error
      });
    }
  }

  // Obtener todos los comentarios
  static async getAll(req: Request, res: Response) {
    try {
      const commentRepository = AppDataSource.getRepository(Comment);
      
      const comments = await commentRepository.find({
        relations: ["task", "author"],
        order: { createdAt: "DESC" } 
      });
      
      res.json({
        message: "Todos los comentarios se obtuvieron con éxito",
        data: comments
      });
    } catch (error) {
      res.status(500).json({
        message: "Error al obtener los comentarios",
        error
      });
    }
  }
  // Actualizar comentario (solo content)
static async update(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "El contenido no puede estar vacío" });
    }

    const commentRepository = AppDataSource.getRepository(Comment);
    const comment = await commentRepository.findOne({ where: { id: Number(id) } });

    if (!comment) {
      return res.status(404).json({ message: "Comentario no encontrado" });
    }

    comment.content = content.trim();
    await commentRepository.save(comment);

    // devolver con relaciones si querés
    const updated = await commentRepository.findOne({
      where: { id: comment.id },
      relations: ["author", "task"],
    });

    res.json({ message: "Comentario actualizado", data: updated });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar comentario", error });
  }
}

// Eliminar comentario
static async remove(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const commentRepository = AppDataSource.getRepository(Comment);

    const comment = await commentRepository.findOne({ where: { id: Number(id) } });
    if (!comment) {
      return res.status(404).json({ message: "Comentario no encontrado" });
    }

    await commentRepository.remove(comment);
    res.json({ message: "Comentario eliminado" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar comentario", error });
  }
}

}