
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
  CreateDateColumn,
} from "typeorm";
import { Task } from "./Task";
import { User } from "./User";

export enum WatcherEventType {
  STATUS_CHANGE = "statusChange",
  PRIORITY_CHANGE = "priorityChange",
  COMMENT = "comment",
}

@Entity("task_watcher_notifications")
export class TaskWatcherNotification {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ name: "user_id" })
  userId!: number;

  @ManyToOne(() => Task, { onDelete: "CASCADE" })
  @JoinColumn({ name: "task_id" })
  task!: Task;

  @Column({ name: "task_id" })
  taskId!: number;

  @Column({
    type: "varchar",
  })
  eventType!: WatcherEventType;

  // Metadatos del evento (comentario, quién lo hizo, etc.) guardados como JSON
  @Column({ type: "jsonb", nullable: true })
  payload?: any;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: "timestamp", nullable: true })
  readAt!: Date | null;
}
