import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from "typeorm";
import { User } from "./User";
import { Team } from "./Team";

export enum MemberRole {
  OWNER = "propietario",
  MEMBER = "miembro"
}

@Entity("team_memberships")
@Unique(["userId", "teamId"])
export class TeamMembership {
  @PrimaryGeneratedColumn()
  id!: number;

  // Relación con el usuario
  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ name: "user_id" })
  userId!: number;

  // Relación con el equipo
  @ManyToOne(() => Team)
  @JoinColumn({ name: "team_id" })
  team!: Team;

  @Column({ name: "team_id" })
  teamId!: number;

  // Rol del usuario
  @Column({
    type: "simple-enum",
    enum: MemberRole,
    default: MemberRole.MEMBER
  })
  role!: MemberRole;

  @CreateDateColumn()
  joinedAt!: Date;
}