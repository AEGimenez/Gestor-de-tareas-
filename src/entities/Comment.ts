import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";
import { Task } from "./Task";

@Entity("comments")
export class Comment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("text")
  content!: string;

  // Relación comentario-tarea | M a N |
  @ManyToOne(() => Task)
  @JoinColumn({ name: "task_id" })
  task!: Task;

  @Column({ name: "task_id" })
  taskId!: number;

  // Relación comentario-autor | M a 1 |
  @ManyToOne(() => User)
  @JoinColumn({ name: "author_id" })
  author!: User;

  @Column({ name: "author_id" })
  authorId!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}