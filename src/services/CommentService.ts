// src/services/CommentService.ts

import { AppDataSource } from "../config/database";
import { Comment } from "../entities/Comment";
import { Task } from "../entities/Task";       
import { User } from "../entities/User";
import { ActivityService, ActivityType } from "./ActivityService"; 

interface ICommentCreationData {
    content: string;
    taskId: number;
    authorId: number;
}

export class CommentService {
    private commentRepository = AppDataSource.getRepository(Comment);
    private taskRepository = AppDataSource.getRepository(Task);
    private userRepository = AppDataSource.getRepository(User); // Repositorio del usuario para buscar el nombre
    private activityService = new ActivityService();

    // --- 1. MÉTODO: createComment (Con Log de Actividad y Formato de Descripción Ajustado) ---
    async createComment(data: ICommentCreationData): Promise<Comment> {
        
        // 1. Verificar la existencia de la Tarea y obtener el teamId/title
        const task = await this.taskRepository.findOne({ 
            where: { id: data.taskId },
            select: ['id', 'title', 'teamId'], 
        });

        if (!task) {
            throw new Error("Tarea no encontrada para el comentario.");
        }
        
        // 2. Buscar al autor para obtener su nombre (necesario solo si se requiere para otra validación,
        //    pero es bueno para asegurar la existencia)
        const author = await this.userRepository.findOne({ 
            where: { id: data.authorId },
            select: ['firstName', 'lastName'],
        });

        if (!author) {
             throw new Error("Autor del comentario no encontrado.");
        }

        // 3. Crear y guardar el comentario
        const comment = this.commentRepository.create({
            content: data.content,
            task: { id: data.taskId } as Task,
            author: { id: data.authorId } as User,
        });

        const savedComment = await this.commentRepository.save(comment);

        // 4. LOG DE ACTIVIDAD
        if (task.teamId) {
            
            await this.activityService.createActivity({
                type: ActivityType.COMMENT_ADDED, 
                // ⭐️ AJUSTE CLAVE: La descripción SÓLO contiene la acción,
                // para que el frontend pueda añadir el @[Actor Name] sin duplicar.
                description: `comentó en la tarea "${task.title || 'sin título'}".`,
                actorId: data.authorId,
                teamId: task.teamId,
                taskId: data.taskId,
            });
        }
        
        // Retornar con relaciones para el Controller
        return this.commentRepository.findOneOrFail({
            where: { id: savedComment.id },
            relations: ["author", "task"],
        });
    }
    
    // --- 2. getCommentsByTaskId (Para CommentController.getByTask) ---
    async getCommentsByTaskId(taskId: number): Promise<Comment[]> {
        return this.commentRepository.find({
            where: { taskId: taskId },
            relations: ["author", "task"],
            order: { createdAt: "ASC" },
        });
    }

    // --- 3. getAllComments (Para CommentController.getAll) ---
    async getAllComments(): Promise<Comment[]> {
        return this.commentRepository.find({
            relations: ["task", "author"],
            order: { createdAt: "DESC" },
        });
    }

    // --- 4. updateComment (Para CommentController.update) ---
    async updateComment(id: number, content: string): Promise<Comment> {
        const comment = await this.commentRepository.findOne({ where: { id } });

        if (!comment) {
            throw new Error("Comentario no encontrado");
        }

        comment.content = content;
        await this.commentRepository.save(comment);
        
        // Retornar con relaciones para el Controller
        return this.commentRepository.findOneOrFail({
            where: { id: comment.id },
            relations: ["author", "task"],
        });
    }

    // --- 5. removeComment (Para CommentController.remove) ---
    async removeComment(id: number): Promise<void> {
        const comment = await this.commentRepository.findOne({ where: { id } });

        if (!comment) {
            throw new Error("Comentario no encontrado");
        }

        await this.commentRepository.remove(comment);
    }
}