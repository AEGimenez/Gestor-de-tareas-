// Importa las entidades necesarias
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { User } from "./User";
import { Team } from "./Team";
import { StatusHistory } from "./StatusHistory"; 
import { TaskTag } from "./TaskTag";           
import { Comment } from "./Comment";         
import { Activity } from "./Activity";

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

  // --- Columnas ---
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

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // --- Relaciones ---

  @ManyToOne(() => Team)
  @JoinColumn({ name: "team_id" })
  team!: Team;

  @Column({ name: "team_id" })
  teamId!: number;

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

  // --- Relaciones Inversas (Uno-a-Muchos) ---

  @OneToMany(() => Comment, (comment) => comment.task)
  comments!: Comment[];

  // 1. Corregido: Relación con StatusHistory (movida dentro de la clase)
  @OneToMany(() => StatusHistory, (history) => history.task)
  statusHistory!: StatusHistory[];

  // 2. Corregido: Relación con TaskTag (en lugar de ManyToMany con Tag)
  @OneToMany(() => TaskTag, (taskTag) => taskTag.task)
  taskTags!: TaskTag[];

  @OneToMany(() => Activity, (activity) => activity.actor)
  activities!: Activity[];
}