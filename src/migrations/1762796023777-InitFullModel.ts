import { MigrationInterface, QueryRunner } from "typeorm";

export class InitFullModel1762796023777 implements MigrationInterface {
    name = 'InitFullModel1762796023777'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "teams" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying, "owner_id" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7e5523774a38b08a6236d322403" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."team_memberships_role_enum" AS ENUM('propietario', 'miembro')`);
        await queryRunner.query(`CREATE TABLE "team_memberships" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "team_id" integer NOT NULL, "role" "public"."team_memberships_role_enum" NOT NULL DEFAULT 'miembro', "joinedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_11c823f69a675c3f05d0fc31958" UNIQUE ("user_id", "team_id"), CONSTRAINT "PK_053171f713ec8a2f09ed58f08f7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "status_history" ("id" SERIAL NOT NULL, "previousStatus" character varying NOT NULL, "newStatus" character varying NOT NULL, "changedAt" TIMESTAMP NOT NULL DEFAULT now(), "taskId" integer, "changedById" integer, CONSTRAINT "PK_271a5228edb4eeb41bc01d58fac" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "tags" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, CONSTRAINT "UQ_d90243459a697eadb8ad56e9092" UNIQUE ("name"), CONSTRAINT "PK_e7dc17249a1148a1970748eda99" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "task_tags" ("id" SERIAL NOT NULL, "taskId" integer, "tagId" integer, CONSTRAINT "UQ_20be04cfd9558da670ed177211d" UNIQUE ("taskId", "tagId"), CONSTRAINT "PK_7b47a7628547c0976415988d3cb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "comments" ("id" SERIAL NOT NULL, "content" text NOT NULL, "task_id" integer NOT NULL, "author_id" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8bf68bc960f2b69e818bdb90dcb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."tasks_status_enum" AS ENUM('pendiente', 'en_curso', 'finalizada', 'cancelada')`);
        await queryRunner.query(`CREATE TYPE "public"."tasks_priority_enum" AS ENUM('alta', 'media', 'baja')`);
        await queryRunner.query(`CREATE TABLE "tasks" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "description" text, "status" "public"."tasks_status_enum" NOT NULL DEFAULT 'pendiente', "priority" "public"."tasks_priority_enum" NOT NULL DEFAULT 'media', "dueDate" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "team_id" integer NOT NULL, "created_by" integer NOT NULL, "assigned_to" integer, CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "activity" ("id" SERIAL NOT NULL, "type" character varying NOT NULL, "description" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "actorId" integer, "teamId" integer, "taskId" integer, CONSTRAINT "PK_24625a1d6b1b089c8ae206fe467" PRIMARY KEY ("id"))`);

        /* ⭐ NUEVAS TABLAS PARA WATCHERS ⭐ */

        await queryRunner.query(`
            CREATE TABLE "task_watchers" (
                "id" SERIAL NOT NULL,
                "task_id" integer NOT NULL,
                "user_id" integer NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_task_watchers_task_user" UNIQUE ("task_id", "user_id"),
                CONSTRAINT "PK_task_watchers_id" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "task_watcher_notifications" (
                "id" SERIAL NOT NULL,
                "user_id" integer NOT NULL,
                "task_id" integer NOT NULL,
                "eventType" character varying NOT NULL,
                "payload" jsonb,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "readAt" TIMESTAMP,
                CONSTRAINT "PK_task_watcher_notifications_id" PRIMARY KEY ("id")
            )
        `);

        /* 🔗 FOREIGN KEYS EXISTENTES */
        await queryRunner.query(`ALTER TABLE "teams" ADD CONSTRAINT "FK_03655bd3d01df69022646faffd5" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "team_memberships" ADD CONSTRAINT "FK_c9eb2ded8e0e2f4bcb41fd0984a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "team_memberships" ADD CONSTRAINT "FK_b917b8603c6d5c526fcdb2009de" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "status_history" ADD CONSTRAINT "FK_0715487a168c4504bbcf3f02738" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "status_history" ADD CONSTRAINT "FK_7de8bdfa74d2b54e3fe690ef8db" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "task_tags" ADD CONSTRAINT "FK_1470ad368e79cb5636163a4bf8d" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "task_tags" ADD CONSTRAINT "FK_ac1cfe87c11bc138ee8675cff3c" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK_18c2493067c11f44efb35ca0e03" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK_e6d38899c31997c45d128a8973b" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_2b1604aae04e0dec6e38580e099" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_9fc727aef9e222ebd09dc8dac08" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_5770b28d72ca90c43b1381bf787" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "activity" ADD CONSTRAINT "FK_52ea3a7ddc66851abf6138892bc" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "activity" ADD CONSTRAINT "FK_d26804bd34b21eecb76a29fec4a" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "activity" ADD CONSTRAINT "FK_2743f8990fde12f9586287eb09f" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        /* 🔗 FOREIGN KEYS NUEVAS PARA WATCHERS */
        await queryRunner.query(`
            ALTER TABLE "task_watchers"
            ADD CONSTRAINT "FK_task_watchers_task"
            FOREIGN KEY ("task_id") REFERENCES "tasks"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "task_watchers"
            ADD CONSTRAINT "FK_task_watchers_user"
            FOREIGN KEY ("user_id") REFERENCES "users"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "task_watcher_notifications"
            ADD CONSTRAINT "FK_task_watcher_notifications_user"
            FOREIGN KEY ("user_id") REFERENCES "users"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "task_watcher_notifications"
            ADD CONSTRAINT "FK_task_watcher_notifications_task"
            FOREIGN KEY ("task_id") REFERENCES "tasks"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        /* 🔽 PRIMERO DROPEAMOS LAS FKs NUEVAS Y TABLAS WATCHERS */
        await queryRunner.query(`ALTER TABLE "task_watcher_notifications" DROP CONSTRAINT "FK_task_watcher_notifications_task"`);
        await queryRunner.query(`ALTER TABLE "task_watcher_notifications" DROP CONSTRAINT "FK_task_watcher_notifications_user"`);
        await queryRunner.query(`ALTER TABLE "task_watchers" DROP CONSTRAINT "FK_task_watchers_user"`);
        await queryRunner.query(`ALTER TABLE "task_watchers" DROP CONSTRAINT "FK_task_watchers_task"`);

        await queryRunner.query(`DROP TABLE "task_watcher_notifications"`);
        await queryRunner.query(`DROP TABLE "task_watchers"`);

        /* 🔽 DESPUÉS TODO LO EXISTENTE (como ya lo tenías) */
        await queryRunner.query(`ALTER TABLE "activity" DROP CONSTRAINT "FK_2743f8990fde12f9586287eb09f"`);
        await queryRunner.query(`ALTER TABLE "activity" DROP CONSTRAINT "FK_d26804bd34b21eecb76a29fec4a"`);
        await queryRunner.query(`ALTER TABLE "activity" DROP CONSTRAINT "FK_52ea3a7ddc66851abf6138892bc"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_5770b28d72ca90c43b1381bf787"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_9fc727aef9e222ebd09dc8dac08"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_2b1604aae04e0dec6e38580e099"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_e6d38899c31997c45d128a8973b"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_18c2493067c11f44efb35ca0e03"`);
        await queryRunner.query(`ALTER TABLE "task_tags" DROP CONSTRAINT "FK_ac1cfe87c11bc138ee8675cff3c"`);
        await queryRunner.query(`ALTER TABLE "task_tags" DROP CONSTRAINT "FK_1470ad368e79cb5636163a4bf8d"`);
        await queryRunner.query(`ALTER TABLE "status_history" DROP CONSTRAINT "FK_7de8bdfa74d2b54e3fe690ef8db"`);
        await queryRunner.query(`ALTER TABLE "status_history" DROP CONSTRAINT "FK_0715487a168c4504bbcf3f02738"`);
        await queryRunner.query(`ALTER TABLE "team_memberships" DROP CONSTRAINT "FK_b917b8603c6d5c526fcdb2009de"`);
        await queryRunner.query(`ALTER TABLE "team_memberships" DROP CONSTRAINT "FK_c9eb2ded8e0e2f4bcb41fd0984a"`);
        await queryRunner.query(`ALTER TABLE "teams" DROP CONSTRAINT "FK_03655bd3d01df69022646faffd5"`);
        await queryRunner.query(`DROP TABLE "activity"`);
        await queryRunner.query(`DROP TABLE "tasks"`);
        await queryRunner.query(`DROP TYPE "public"."tasks_priority_enum"`);
        await queryRunner.query(`DROP TYPE "public"."tasks_status_enum"`);
        await queryRunner.query(`DROP TABLE "comments"`);
        await queryRunner.query(`DROP TABLE "task_tags"`);
        await queryRunner.query(`DROP TABLE "tags"`);
        await queryRunner.query(`DROP TABLE "status_history"`);
        await queryRunner.query(`DROP TABLE "team_memberships"`);
        await queryRunner.query(`DROP TYPE "public"."team_memberships_role_enum"`);
        await queryRunner.query(`DROP TABLE "teams"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }
}
