import { Entity, PrimaryGeneratedColumn, ManyToOne, Unique } from "typeorm";
import { Task } from "./Task";
import { Tag } from "./Tag";

@Entity("task_tags")
@Unique(["task", "tag"])
export class TaskTag {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Task, (task) => task.taskTags, { onDelete: "CASCADE" })
  task!: Task;

  @ManyToOne(() => Tag, (tag) => tag.taskTags, { onDelete: "CASCADE" })
  tag!: Tag;
}
