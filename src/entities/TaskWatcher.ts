
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  Unique,
} from "typeorm";
import { Task } from "./Task";
import { User } from "./User";

@Entity("task_watchers")
@Unique(["taskId", "userId"]) //  evita duplicados
export class TaskWatcher {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Task, { onDelete: "CASCADE" })
  @JoinColumn({ name: "task_id" })
  task!: Task;

  @Column({ name: "task_id" })
  taskId!: number;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ name: "user_id" })
  userId!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
