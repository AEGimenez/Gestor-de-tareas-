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
    private userRepository = AppDataSource.getRepository(User);
    private activityService = new ActivityService();
    private taskWatcherService = new TaskWatcherService();
    

    // --- 1. MÉTODO: createComment ---
    async createComment(data: ICommentCreationData): Promise<Comment> {
        const task = await this.taskRepository.findOne({ 
            where: { id: data.taskId },
            select: ['id', 'title', 'teamId'], 
        });

        if (!task) {
            throw new Error("Tarea no encontrada para el comentario.");
        }
        
        const author = await this.userRepository.findOne({ 
            where: { id: data.authorId },
            select: ['firstName', 'lastName'],
        });

        if (!author) {
            throw new Error("Autor del comentario no encontrado.");
        }

        const comment = this.commentRepository.create({
            content: data.content,
            task: { id: data.taskId } as Task,
            author: { id: data.authorId } as User,
        });

        const savedComment = await this.commentRepository.save(comment);

        if (task.teamId) {
            await this.activityService.createActivity({
                type: ActivityType.COMMENT_ADDED,
                description: `comentó en la tarea "${task.title || 'sin título'}".`,
                actorId: data.authorId,
                teamId: task.teamId,
                taskId: data.taskId,
            });
        }

        await this.taskWatcherService.notifyWatchers(
            task.id,
            WatcherEventType.COMMENT,
            data.authorId,
            {
                commentId: savedComment.id,
                content: data.content,
            }
        );

        return this.commentRepository.findOneOrFail({
            where: { id: savedComment.id },
            relations: ["author", "task"],
        });
    }
    

    // --- 2. MÉTODO: getCommentsByTaskId ---
    async getCommentsByTaskId(taskId: number): Promise<Comment[]> {
        if (!taskId || Number.isNaN(taskId)) {
            throw new Error("taskId inválido");
        }

        return await this.commentRepository.find({
            where: { task: { id: taskId } },
            relations: ["author", "task"],
            order: { createdAt: "DESC" },
        });
    }

    // --- 3. MÉTODO: getAllComments ---
    async getAllComments(): Promise<Comment[]> {
        return await this.commentRepository.find({
            relations: ["author", "task"],
            order: { createdAt: "DESC" },
        });
    }

    // --- 4. MÉTODO: updateComment ---
    async updateComment(commentId: number, content: string): Promise<Comment> {
        if (!content || !content.trim()) {
            throw new Error("El contenido del comentario no puede estar vacío");
        }

        const comment = await this.commentRepository.findOne({
            where: { id: commentId },
        });

        if (!comment) {
            throw new Error("Comentario no encontrado");
        }

        comment.content = content.trim();
        comment.updatedAt = new Date();

        return await this.commentRepository.save(comment);
    }

    // --- 5. MÉTODO: removeComment ---
    async removeComment(commentId: number): Promise<void> {
        const comment = await this.commentRepository.findOne({
            where: { id: commentId },
        });

        if (!comment) {
            throw new Error("Comentario no encontrado");
        }

        await this.commentRepository.remove(comment);
    }
}