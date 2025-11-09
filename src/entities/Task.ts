import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { User } from "./User";
import { Team } from "./Team";

// Enums para los estados y prioridades
export enum TaskStatus {
  PENDING = "pendiente",
  IN_PROGRESS = "en_curso", 
  COMPLETED = "finalizada",
  CANCELLED = "cancelada"
}

export enum TaskPriority {
  HIGH = "alta",
  MEDIUM = "media",
  LOW = "baja"
}

@Entity("tasks")
export class Task {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column("text", { nullable: true })
  description?: string;

  @Column({
    type: "simple-enum",
    enum: TaskStatus,
    default: TaskStatus.PENDING
  })
  status!: TaskStatus;

  @Column({
    type: "simple-enum", 
    enum: TaskPriority,
    default: TaskPriority.MEDIUM
  })
  priority!: TaskPriority;

  @Column({ nullable: true })
  dueDate?: Date;

  @ManyToOne(() => Team)
  @JoinColumn({ name: "team_id" })
  team!: Team;

  @Column({ name: "team_id" })
  teamId!: number;

  // Propietario de la tarea
  @ManyToOne(() => User)
  @JoinColumn({ name: "created_by" })
  createdBy!: User;

  @Column({ name: "created_by" })
  createdById!: number;


  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "assigned_to" })
  assignedTo?: User;

  @Column({ name: "assigned_to", nullable: true })
  assignedToId?: number;

  @OneToMany("Comment", "task")
  comments!: Comment[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
import type { Comment } from "./Comment";