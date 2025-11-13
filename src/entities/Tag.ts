import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
// Importar TaskTag
import { TaskTag } from "./TaskTag";

@Entity("tags")
export class Tag {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string;

  // Corregido: Relación con TaskTag (en lugar de ManyToMany con Task)
  @OneToMany(() => TaskTag, (taskTag) => taskTag.tag)
  taskTags!: TaskTag[];
}