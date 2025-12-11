// src/services/CommentService.ts

import { AppDataSource } from "../config/database";
import { Comment } from "../entities/Comment";
import { Task } from "../entities/Task";       
import { User } from "../entities/User";
import { ActivityService, ActivityType } from "./ActivityService"; 
import { TaskWatcherService } from "./TaskWatcherService";
import { WatcherEventType } from "../entities/TaskWatcherNotification";

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
    private taskWatcherService = new TaskWatcherService();

    // --- 1. MÉTODO: createComment (Con Log de Actividad + Notificación a Watchers) ---
async createComment(data: ICommentCreationData): Promise<Comment> {

    // 1. Verificar la existencia de la Tarea y obtener el teamId/title
    const task = await this.taskRepository.findOne({ 
        where: { id: data.taskId },
        select: ['id', 'title', 'teamId'], 
    });

    if (!task) {
        throw new Error("Tarea no encontrada para el comentario.");
    }
    
    // 2. Buscar al autor
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
            description: `comentó en la tarea "${task.title || 'sin título'}".`,
            actorId: data.authorId,
            teamId: task.teamId,
            taskId: data.taskId,
        });
    }

    // ----------------------------------------------------
    // ⭐️ 5. NOTIFICAR A TODOS LOS WATCHERS DE LA TAREA
    // ----------------------------------------------------
    await this.taskWatcherService.notifyWatchers(
        task.id,
        WatcherEventType.COMMENT,
        data.authorId,
        {
            commentId: savedComment.id,
            content: data.content,
        }
    );

    // 6. Retornar con relaciones para el Controller
    return this.commentRepository.findOneOrFail({
        where: { id: savedComment.id },
        relations: ["author", "task"],
    });
}
}