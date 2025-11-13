import "reflect-metadata";
import { AppDataSource } from "../../config/database";
import { User } from "../../entities/User";
import { Team } from "../../entities/Team";
import { TeamMembership, MemberRole } from "../../entities/TeamMembership";
// Importar Enums desde Task
import { Task, TaskStatus, TaskPriority } from "../../entities/Task"; 
import { Comment } from "../../entities/Comment";
import { Tag } from "../../entities/Tag";
import { TaskTag } from "../../entities/TaskTag";
import { StatusHistory } from "../../entities/StatusHistory";
import { Activity } from "../../entities/Activity";

async function runSeeds() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Conectado a la base de datos para ejecutar seeds...");

    // ... (El código de Usuarios, Equipos, Membresías y Etiquetas es idéntico) ...

    // -------------------------
    // 1️⃣ Usuarios (Sin cambios)
    // -------------------------
    const users = AppDataSource.getRepository(User).create([
  { firstName: "Agustín", lastName: "Giménez", email: "agus@gestor.com", password: "123456" },
  { firstName: "Camila", lastName: "López", email: "camila@gestor.com", password: "123456" },
  { firstName: "Agustín", lastName: "Luporini", email: "agustin@gestor.com", password: "123456" },
    ]);
    await AppDataSource.getRepository(User).save(users);
    console.log("👤 Usuarios creados");

    // -------------------------
    // 2️⃣ Equipos (Sin cambios)
    // -------------------------
    const team = AppDataSource.getRepository(Team).create({
     name: "Equipo Desarrollo",
     description: "Equipo principal del proyecto Gestor de Tareas",
     owner: users[0], 
    });
    await AppDataSource.getRepository(Team).save(team);
    console.log("👥 Equipo creado");

    // -------------------------
    // 3️⃣ Membresías (Sin cambios)
    // -------------------------
    const memberships = AppDataSource.getRepository(TeamMembership).create([
    // Usamos .OWNER que equivale a "propietario"
    { team, user: users[0], role: MemberRole.OWNER }, 
    { team, user: users[1], role: MemberRole.MEMBER },
    { team, user: users[2], role: MemberRole.MEMBER },
    ]);
    await AppDataSource.getRepository(TeamMembership).save(memberships);
    console.log("🧩 Membresías creadas");

    // -------------------------
    // 4️⃣ Etiquetas (Sin cambios)
    // -------------------------
    const tags = AppDataSource.getRepository(Tag).create([
      { name: "Backend" },
      { name: "Frontend" },
      { name: "Bug" },
      { name: "Urgente" },
      { name: "Mejora" },
    ]);
    await AppDataSource.getRepository(Tag).save(tags);
    console.log("🏷️ Etiquetas creadas");

    // -------------------------
    // 5️⃣ Tareas (MODIFICADO)
    // -------------------------
    const tasks = AppDataSource.getRepository(Task).create([
      {
        title: "Implementar login con Google",
        description: "Agregar autenticación OAuth2 con Google",
        // Corregido: Usar Enums
        status: TaskStatus.IN_PROGRESS, 
        priority: TaskPriority.HIGH,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // +5 días
        assignedTo: users[1],
        team,
        createdBy: users[0], // Asegúrate de tener 'createdBy' si es obligatorio
      },
      {
        title: "Diseñar logo del proyecto",
        description: "Propuesta de diseño con Figma",
        // Corregido: Usar Enums
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 días
        assignedTo: users[2],
        team,
        createdBy: users[0], // Asegúrate de tener 'createdBy' si es obligatorio
      },
    ]);
    await AppDataSource.getRepository(Task).save(tasks);
    console.log("✅ Tareas creadas");

    // ... (El resto del archivo: TaskTag, Comentarios, Historial, Actividad es idéntico) ...
    
    // -------------------------
    // 6️⃣ Asignar etiquetas (TaskTag) (Sin cambios, ya era correcto)
    // -------------------------
    const taskTags = [
      { task: tasks[0], tag: tags[0] }, // Backend
      { task: tasks[0], tag: tags[2] }, // Bug
      { task: tasks[1], tag: tags[1] }, // Frontend
    ];
    await AppDataSource.getRepository(TaskTag).save(taskTags);
    console.log("🔗 Relaciones Tarea–Etiqueta creadas");

    // -------------------------
    // 7️⃣ Comentarios (Sin cambios)
    // -------------------------
    const comments = AppDataSource.getRepository(Comment).create([
      {
      content: "Ya tengo el flujo de login casi terminado",
      task: tasks[0],
      author: users[1], // <-- Corregido
      },
    {
      content: "Subí un par de ideas de logo en Figma",
      task: tasks[1],
      author: users[2], // <-- Corregido
    },
    ]);
    await AppDataSource.getRepository(Comment).save(comments);
    console.log("💬 Comentarios creados");

    // -------------------------
    // 8️⃣ Historial de estados (Sin cambios)
    // -------------------------
    // Nota: El seed tiene "PENDIENTE" -> "PENDIENTE" para la tarea 2.
    // Lo he dejado así, pero asegúrate de que es lo que quieres.
    const statusHistory = AppDataSource.getRepository(StatusHistory).create([
      {
        task: tasks[0],
        previousStatus: TaskStatus.PENDING, // Es buena idea usar enums aquí también
        newStatus: TaskStatus.IN_PROGRESS,  // Es buena idea usar enums aquí también
        changedBy: users[0],
      },
      {
        task: tasks[1],
        previousStatus: TaskStatus.PENDING,
        newStatus: TaskStatus.PENDING,
        changedBy: users[2],
      },
    ]);
    await AppDataSource.getRepository(StatusHistory).save(statusHistory);
    console.log("📜 Historial de estados creado");

    // -------------------------
    // 9️⃣ Actividad (Sin cambios)
    // -------------------------
    const activity = AppDataSource.getRepository(Activity).create([
      {
        type: "TASK_CREATED",
        description: `Tarea "${tasks[0].title}" creada por ${users[0].firstName}`,
        actor: users[0],
        team,
        task: tasks[0],
      },
      {
        type: "COMMENT_ADDED",
        description: `${users[1].firstName} comentó en "${tasks[0].title}"`,
        actor: users[1],
        team,
        task: tasks[0],
      },
      {
        type: "TASK_CREATED",
        description: `Tarea "${tasks[1].title}" creada por ${users[2].firstName}`,
        actor: users[2],
        team,
        task: tasks[1],
      },
    ]);
    await AppDataSource.getRepository(Activity).save(activity);
    console.log("🧾 Actividad registrada");


    console.log("🌱 SEED COMPLETO ✅");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error ejecutando seeds:", error);
    process.exit(1);
  }
}

runSeeds();