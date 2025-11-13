import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm";
import { Task } from "./Task";
import { User } from "./User";

@Entity("status_history")
export class StatusHistory {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Task, (task) => task.statusHistory, { onDelete: "CASCADE" })
  task!: Task;

  @ManyToOne(() => User, { nullable: true })
  changedBy!: User;

  @Column()
  previousStatus!: string;

  @Column()
  newStatus!: string;

  @CreateDateColumn()
  changedAt!: Date;
}
