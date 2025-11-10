import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from "typeorm";
import { User } from "./User";
import { Team } from "./Team";
import { Task } from "./Task";

@Entity("activity")
export class Activity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  type!: string; // e.g., 'TASK_CREATED', 'COMMENT_ADDED', 'STATUS_CHANGED'

  @Column({ type: "text", nullable: true })
  description!: string;

  @ManyToOne(() => User, { nullable: true })
  actor!: User;

  @ManyToOne(() => Team, { nullable: true })
  team!: Team;

  @ManyToOne(() => Task, { nullable: true })
  task!: Task;

  @CreateDateColumn()
  createdAt!: Date;
}
