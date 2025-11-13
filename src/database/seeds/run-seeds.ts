// src/database/seeds/run-seeds.ts
import "reflect-metadata";
import { AppDataSource } from "../../config/database";
import { User } from "../../entities/User";
import { Team } from "../../entities/Team";
import { TeamMembership, MemberRole } from "../../entities/TeamMembership";
import { Task, TaskStatus, TaskPriority } from "../../entities/Task"; 
import { Comment } from "../../entities/Comment";
import { Tag } from "../../entities/Tag";
import { TaskTag } from "../../entities/TaskTag";
import { StatusHistory } from "../../entities/StatusHistory";
import { Activity } from "../../entities/Activity";

// --- Helpers de Fechas ---
const daysFromNow = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);
const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

async function runSeeds() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Conectado a la base de datos para ejecutar seeds...");

    // -------------------------
    // 1️⃣ Usuarios
    // -------------------------
    const userRepository = AppDataSource.getRepository(User);
    const users = await userRepository.save(userRepository.create([
      { firstName: "Agustín", lastName: "Giménez", email: "agus@gestor.com", password: "123456" },
      { firstName: "Camila", lastName: "López", email: "camila@gestor.com", password: "123456" },
      { firstName: "Mateo", lastName: "Fontaine", email: "mateo@gestor.com", password: "123456" },
      { firstName: "Lucía", lastName: "Paez", email: "lucia@gestor.com", password: "123456" },
      { firstName: "Martín", lastName: "Soria", email: "martin@gestor.com", password: "123456" },
    ]));
    console.log(`👤 ${users.length} Usuarios creados`);

    // -------------------------
    // 2️⃣ Equipos
    // -------------------------
    const teamRepository = AppDataSource.getRepository(Team);
    const teams = await teamRepository.save(teamRepository.create([
      {
        name: "Equipo Desarrollo",
        description: "Equipo principal del proyecto Gestor de Tareas",
        owner: users[0], // Agustín
      },
      {
        name: "Equipo Marketing",
        description: "Equipo de estrategia y diseño",
        owner: users[1], // Camila
      },
      {
        name: "Equipo Soporte",
        description: "Equipo de atención al cliente y documentación",
        owner: users[0], // Agustín
      }
    ]));
    console.log(`👥 ${teams.length} Equipos creados`);

    // -------------------------
    // 3️⃣ Membresías
    // -------------------------
    const membershipRepository = AppDataSource.getRepository(TeamMembership);
    const memberships = await membershipRepository.save(membershipRepository.create([
      // Equipo Desarrollo (Agustín, Camila, Martín)
      { team: teams[0], user: users[0], role: MemberRole.OWNER }, 
      { team: teams[0], user: users[1], role: MemberRole.MEMBER },
      { team: teams[0], user: users[4], role: MemberRole.MEMBER },
      // Equipo Marketing (Camila, Lucía, Mateo)
      { team: teams[1], user: users[1], role: MemberRole.OWNER },
      { team: teams[1], user: users[3], role: MemberRole.MEMBER },
      { team: teams[1], user: users[2], role: MemberRole.MEMBER },
      // Equipo Soporte (Agustín, Mateo)
      { team: teams[2], user: users[0], role: MemberRole.OWNER },
      { team: teams[2], user: users[2], role: MemberRole.MEMBER },
    ]));
    console.log(`🧩 ${memberships.length} Membresías creadas`);

    // -------------------------
    // 4️⃣ Etiquetas
    // -------------------------
    const tagRepository = AppDataSource.getRepository(Tag);
    const tags = await tagRepository.save(tagRepository.create([
      { name: "Backend" },     // 0
      { name: "Frontend" },    // 1
      { name: "Bug" },         // 2
      { name: "Urgente" },     // 3
      { name: "Mejora" },      // 4
      { name: "Diseño" },      // 5
      { name: "Documentación" }, // 6
      { name: "Mobile" },      // 7
      { name: "CI/CD" },       // 8
      { name: "Performance" }, // 9
      { name: "QA" },          // 10
    ]));
    console.log(`🏷️ ${tags.length} Etiquetas creadas`);

    // -------------------------
    // 5️⃣ Tareas (25 Tareas)
    // -------------------------
    const taskRepository = AppDataSource.getRepository(Task);
    const tasks = await taskRepository.save(taskRepository.create([
      // --- Tareas 1-8 ---
      { // Tarea 1
        title: "Implementar login con Google (OAuth2)",
        description: "Agregar autenticación OAuth2 con Google usando la librería de Supabase.",
        status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, dueDate: daysFromNow(5),
        team: teams[0], createdBy: users[0], assignedTo: users[1],
      },
      { // Tarea 2
        title: "Diseñar logo del proyecto (v2)",
        description: "Propuesta de diseño con Figma, basarse en la paleta de colores nueva.",
        status: TaskStatus.IN_PROGRESS, priority: TaskPriority.MEDIUM, dueDate: daysFromNow(7),
        team: teams[1], createdBy: users[1], assignedTo: users[2],
      },
      { // Tarea 3
        title: "Corregir bug en paginación de Tareas",
        description: "El contador total de la paginación no se actualiza al aplicar filtros.",
        status: TaskStatus.PENDING, priority: TaskPriority.HIGH,
        team: teams[0], createdBy: users[1], assignedTo: users[4],
      },
      { // Tarea 4
        title: "Actualizar dependencias de TypeORM a v0.3.20",
        description: "Revisar breaking changes y actualizar la entidad de conexión.",
        status: TaskStatus.COMPLETED, priority: TaskPriority.LOW, dueDate: daysAgo(2),
        team: teams[0], createdBy: users[0], assignedTo: users[0],
      },
      { // Tarea 5
        title: "Preparar campaña de email marketing para lanzamiento",
        description: "Definir 3 correos: Expectativa, Lanzamiento y Recordatorio.",
        status: TaskStatus.PENDING, priority: TaskPriority.HIGH, dueDate: daysFromNow(10),
        team: teams[1], createdBy: users[1], assignedTo: users[3],
      },
      { // Tarea 6
        title: "Redactar guías de usuario (FAQ)",
        description: "Crear la sección de preguntas frecuentes en la web de ayuda.",
        status: TaskStatus.PENDING, priority: TaskPriority.MEDIUM,
        team: teams[2], createdBy: users[0], assignedTo: users[2],
      },
      { // Tarea 7
        title: "Refactorizar servicio de Tareas (Cancelada)",
        description: "Mover lógica de negocio del controlador al servicio. (Se pospone para v2)",
        status: TaskStatus.CANCELLED, priority: TaskPriority.LOW, dueDate: daysAgo(5),
        team: teams[0], createdBy: users[0], assignedTo: users[4],
      },
      { // Tarea 8
        title: "Definir paleta de colores oficial",
        description: "Seleccionar 3 colores primarios y 2 secundarios.",
        status: TaskStatus.COMPLETED, priority: TaskPriority.MEDIUM, dueDate: daysAgo(3),
        team: teams[1], createdBy: users[1], assignedTo: users[2],
      },
      // --- Tareas 9-12 ---
      { // Tarea 9
        title: "Implementar endpoint de Tags (PUT /tasks/:id/tags)",
        description: "Crear el endpoint para actualizar masivamente los tags de una tarea.",
        status: TaskStatus.IN_PROGRESS, priority: TaskPriority.MEDIUM, dueDate: daysFromNow(2),
        team: teams[0], createdBy: users[0], assignedTo: users[4],
      },
      { // Tarea 10
        title: "Testear flujo de 'Crear Equipo' en el frontend",
        description: "Verificar que el owner se añade automáticamente y el modal se cierra.",
        status: TaskStatus.PENDING, priority: TaskPriority.MEDIUM,
        team: teams[0], createdBy: users[1], assignedTo: users[1],
      },
      { // Tarea 11
        title: "Grabar video tutorial de 'Primeros Pasos'",
        description: "Grabar un video de 2 minutos mostrando cómo crear un equipo y una tarea.",
        status: TaskStatus.PENDING, priority: TaskPriority.LOW, dueDate: daysFromNow(14),
        team: teams[1], createdBy: users[1], assignedTo: users[3],
      },
      { // Tarea 12
        title: "Investigar integración con Sentry para logs",
        description: "Evaluar la librería de Sentry para Node.js y su impacto en performance.",
        status: TaskStatus.PENDING, priority: TaskPriority.LOW,
        team: teams[0], createdBy: users[4], assignedTo: users[4],
      },
      // --- NUEVAS TAREAS (13-25) ---
      { // Tarea 13
        title: "Revisar y aprobar diseños de la app mobile",
        description: "Revisión final de los mockups de Figma para la app nativa.",
        status: TaskStatus.PENDING, priority: TaskPriority.HIGH, dueDate: daysFromNow(3),
        team: teams[1], createdBy: users[1], assignedTo: users[3],
      },
      { // Tarea 14
        title: "Configurar CI/CD pipeline para el frontend",
        description: "Usar GitHub Actions para build y deploy automático a Vercel.",
        status: TaskStatus.PENDING, priority: TaskPriority.MEDIUM,
        team: teams[0], createdBy: users[0], assignedTo: users[4],
      },
      { // Tarea 15
        title: "Crear manual de usuario para v1.0",
        description: "Documentar todas las funcionalidades principales para el usuario final.",
        status: TaskStatus.IN_PROGRESS, priority: TaskPriority.MEDIUM, dueDate: daysFromNow(8),
        team: teams[2], createdBy: users[0], assignedTo: users[2],
      },
      { // Tarea 16
        title: "Optimizar consulta de 'GET /tasks'",
        description: "La consulta está tardando > 500ms. Aplicar indexación o Eager Loading.",
        status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, dueDate: daysFromNow(1),
        team: teams[0], createdBy: users[4], assignedTo: users[4],
      },
      { // Tarea 17
        title: "Resolver bug de login en iOS 17",
        description: "El teclado oculta el botón de 'Ingresar' en Safari mobile.",
        status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, dueDate: daysFromNow(1),
        team: teams[0], createdBy: users[1], assignedTo: users[1],
      },
      { // Tarea 18
        title: "Planificar A/B testing para el landing page",
        description: "Probar dos 'Call to Action' diferentes para ver cuál convierte mejor.",
        status: TaskStatus.PENDING, priority: TaskPriority.MEDIUM,
        team: teams[1], createdBy: users[3], assignedTo: users[3],
      },
      { // Tarea 19
        title: "Implementar 'Olvide mi contraseña'",
        description: "Flujo completo de backend y frontend para reseteo de password con token.",
        status: TaskStatus.PENDING, priority: TaskPriority.HIGH,
        team: teams[0], createdBy: users[0], assignedTo: users[0],
      },
      { // Tarea 20
        title: "Actualizar logo en todos los assets",
        description: "Reemplazar el logo viejo por el nuevo (v2) en la web, emails y app.",
        status: TaskStatus.COMPLETED, priority: TaskPriority.LOW, dueDate: daysAgo(1),
        team: teams[1], createdBy: users[2], assignedTo: users[2],
      },
      { // Tarea 21
        title: "Migrar base de datos de staging a producción",
        description: "Correr el script de migración final antes del lanzamiento.",
        status: TaskStatus.PENDING, priority: TaskPriority.HIGH, dueDate: daysFromNow(4),
        team: teams[0], createdBy: users[0], assignedTo: users[0],
      },
      { // Tarea 22
        title: "Monitorear performance del servidor post-deploy",
        description: "Vigilar CPU y memoria durante las primeras 24hs post-lanzamiento.",
        status: TaskStatus.PENDING, priority: TaskPriority.MEDIUM,
        team: teams[0], createdBy: users[4], assignedTo: users[4],
      },
      { // Tarea 23
        title: "Escribir artículos de blog para lanzamiento",
        description: "Escribir 3 artículos: 'Nuestra historia', 'Features' y 'Roadmap'.",
        status: TaskStatus.IN_PROGRESS, priority: TaskPriority.MEDIUM,
        team: teams[1], createdBy: users[3], assignedTo: users[3],
      },
      { // Tarea 24
        title: "Bug: El selector de fecha no se cierra en Firefox",
        description: "El 'date picker' queda abierto al hacer click afuera solo en Firefox.",
        status: TaskStatus.PENDING, priority: TaskPriority.LOW,
        team: teams[0], createdBy: users[1], assignedTo: users[1],
      },
      { // Tarea 25
        title: "Capacitar al equipo de Soporte en la v1.0",
        description: "Sesión de 1 hora mostrando todas las features nuevas.",
        status: TaskStatus.COMPLETED, priority: TaskPriority.MEDIUM, dueDate: daysAgo(7),
        team: teams[2], createdBy: users[0], assignedTo: users[0],
      },
    ]));
    console.log(`✅ ${tasks.length} Tareas creadas`);

    // -------------------------
    // 6️⃣ Asignar etiquetas (TaskTag)
    // -------------------------
    const taskTagRepository = AppDataSource.getRepository(TaskTag);
    const taskTags = await taskTagRepository.save(taskTagRepository.create([
      // Tareas 1-8
      { task: tasks[0], tag: tags[0] }, { task: tasks[0], tag: tags[1] }, { task: tasks[0], tag: tags[3] }, // Login
      { task: tasks[1], tag: tags[5] }, // Logo
      { task: tasks[2], tag: tags[0] }, { task: tasks[2], tag: tags[2] }, { task: tasks[2], tag: tags[3] }, // Bug paginación
      { task: tasks[3], tag: tags[0] }, { task: tasks[3], tag: tags[4] }, // TypeORM
      { task: tasks[4], tag: tags[3] }, // Campaña
      { task: tasks[5], tag: tags[6] }, // FAQ
      { task: tasks[7], tag: tags[5] }, { task: tasks[7], tag: tags[1] }, // Colores
      // Tareas 9-12
      { task: tasks[8], tag: tags[0] }, { task: tasks[8], tag: tags[4] }, // Endpoint Tags
      { task: tasks[9], tag: tags[1] }, { task: tasks[9], tag: tags[10] }, // Testear Flujo
      { task: tasks[11], tag: tags[0] }, { task: tasks[11], tag: tags[9] }, // Sentry
      // Tareas 13-25
      { task: tasks[12], tag: tags[5] }, { task: tasks[12], tag: tags[7] }, // Diseños Mobile
      { task: tasks[13], tag: tags[1] }, { task: tasks[13], tag: tags[8] }, // CI/CD
      { task: tasks[14], tag: tags[6] }, // Manual
      { task: tasks[15], tag: tags[0] }, { task: tasks[15], tag: tags[9] }, // Optimizar GET
      { task: tasks[16], tag: tags[7] }, { task: tasks[16], tag: tags[2] }, { task: tasks[16], tag: tags[3] }, // Bug iOS
      { task: tasks[18], tag: tags[0] }, { task: tasks[18], tag: tags[1] }, // Contraseña
      { task: tasks[20], tag: tags[0] }, { task: tasks[20], tag: tags[3] }, // Migrar DB
      { task: tasks[23], tag: tags[1] }, { task: tasks[23], tag: tags[2] }, // Bug Firefox
    ]));
    console.log(`🔗 ${taskTags.length} Relaciones Tarea–Etiqueta creadas`);

    // -------------------------
    // 7️⃣ Comentarios
    // -------------------------
    const commentRepository = AppDataSource.getRepository(Comment);
    const comments = await commentRepository.save(commentRepository.create([
      // Tarea 1 (Login)
      { content: "Ya tengo el flujo de login casi terminado, falta revisar el GSI.", task: tasks[0], author: users[1] },
      { content: "Excelente. Revisá el token de refresco por favor, creo que no se está guardando.", task: tasks[0], author: users[0] },
      { content: "¡Quedó listo! Ya podemos probar el login completo.", task: tasks[0], author: users[1] },
      // Tarea 2 (Logo)
      { content: "Subí un par de ideas de logo en Figma, link en la descripción.", task: tasks[1], author: users[2] },
      // Tarea 3 (Bug)
      { content: "Estoy en eso, parece un error 'off-by-one' en el offset de la query.", task: tasks[2], author: users[4] },
      // Tarea 4 (TypeORM)
      { content: "Listo, todo actualizado a la v0.3.20. No hubo breaking changes.", task: tasks[3], author: users[0] },
      // Tarea 8 (Colores)
      { content: "Aprobado por el cliente, usar esta paleta.", task: tasks[7], author: users[1] },
      // Tarea 9 (Endpoint Tags)
      { content: "Estoy trabajando en esto. Debería estar para el EOD.", task: tasks[8], author: users[4] },
      { content: "Recordatorio: mañana vence esta tarea.", task: tasks[8], author: users[0] },
      // Tarea 10 (Testear Flujo)
      { content: "Encontré un bug, al crear el equipo el 'ownerId' se manda como string.", task: tasks[9], author: users[1] },
      // Tarea 13 (Diseños Mobile)
      { content: "Me gusta la Opción B, pero el botón principal debería ser más grande.", task: tasks[12], author: users[1] },
      // Tarea 15 (Manual)
      { content: "Ya tengo la estructura base. Empiezo a redactar la sección 'Tareas'.", task: tasks[14], author: users[2] },
      // Tarea 17 (Bug iOS)
      { content: "Confirmado, es un bug de Safari con 'position: fixed'. Estoy buscando un workaround.", task: tasks[16], author: users[1] },
      { content: "Probaste usando 100vh en vez de 100%?", task: tasks[16], author: users[4] },
      // Tarea 19 (Contraseña)
      { content: "Backend listo, falta el formulario del frontend.", task: tasks[18], author: users[0] },
      // Tarea 24 (Bug Firefox)
      { content: "Lo puedo replicar. Parece un tema de 'focus' y 'blur' events.", task: tasks[23], author: users[1] },
    ]));
    console.log(`💬 ${comments.length} Comentarios creados`);

    // -------------------------
    // 8️⃣ Historial de estados
    // -------------------------
    const historyRepository = AppDataSource.getRepository(StatusHistory);
    const statusHistory = await historyRepository.save(historyRepository.create([
      // Tareas 1-8
      { task: tasks[0], previousStatus: TaskStatus.PENDING, newStatus: TaskStatus.IN_PROGRESS, changedBy: users[0] },
      { task: tasks[1], previousStatus: TaskStatus.PENDING, newStatus: TaskStatus.IN_PROGRESS, changedBy: users[1] },
      { task: tasks[3], previousStatus: TaskStatus.PENDING, newStatus: TaskStatus.IN_PROGRESS, changedBy: users[0], changedAt: daysAgo(2) },
      { task: tasks[3], previousStatus: TaskStatus.IN_PROGRESS, newStatus: TaskStatus.COMPLETED, changedBy: users[0], changedAt: daysAgo(2) },
      { task: tasks[6], previousStatus: TaskStatus.PENDING, newStatus: TaskStatus.IN_PROGRESS, changedBy: users[0], changedAt: daysAgo(6) },
      { task: tasks[6], previousStatus: TaskStatus.IN_PROGRESS, newStatus: TaskStatus.CANCELLED, changedBy: users[0], changedAt: daysAgo(5) },
      { task: tasks[7], previousStatus: TaskStatus.PENDING, newStatus: TaskStatus.IN_PROGRESS, changedBy: users[2], changedAt: daysAgo(4) },
      { task: tasks[7], previousStatus: TaskStatus.IN_PROGRESS, newStatus: TaskStatus.COMPLETED, changedBy: users[2], changedAt: daysAgo(3) },
      // Tareas 9-12
      { task: tasks[8], previousStatus: TaskStatus.PENDING, newStatus: TaskStatus.IN_PROGRESS, changedBy: users[4] },
      // Tareas 13-25
      { task: tasks[14], previousStatus: TaskStatus.PENDING, newStatus: TaskStatus.IN_PROGRESS, changedBy: users[2] },
      { task: tasks[15], previousStatus: TaskStatus.PENDING, newStatus: TaskStatus.IN_PROGRESS, changedBy: users[4] },
      { task: tasks[16], previousStatus: TaskStatus.PENDING, newStatus: TaskStatus.IN_PROGRESS, changedBy: users[1] },
      { task: tasks[19], previousStatus: TaskStatus.PENDING, newStatus: TaskStatus.IN_PROGRESS, changedBy: users[2], changedAt: daysAgo(2) },
      { task: tasks[19], previousStatus: TaskStatus.IN_PROGRESS, newStatus: TaskStatus.COMPLETED, changedBy: users[2], changedAt: daysAgo(1) },
      { task: tasks[22], previousStatus: TaskStatus.PENDING, newStatus: TaskStatus.IN_PROGRESS, changedBy: users[3] },
      { task: tasks[24], previousStatus: TaskStatus.PENDING, newStatus: TaskStatus.IN_PROGRESS, changedBy: users[0], changedAt: daysAgo(8) },
      { task: tasks[24], previousStatus: TaskStatus.IN_PROGRESS, newStatus: TaskStatus.COMPLETED, changedBy: users[0], changedAt: daysAgo(7) },
    ]));
    console.log(`📜 ${statusHistory.length} Registros de Historial de estados creados`);

    // -------------------------
    // 9️⃣ Actividad (Una muestra)
    // -------------------------
    const activityRepository = AppDataSource.getRepository(Activity);
    const activity = await activityRepository.save(activityRepository.create([
      // Tareas 1-8
      { type: "TASK_CREATED", description: `Tarea "${tasks[0].title}" creada por ${users[0].firstName}`, actor: users[0], team: teams[0], task: tasks[0] },
      { type: "TASK_CREATED", description: `Tarea "${tasks[4].title}" creada por ${users[1].firstName}`, actor: users[1], team: teams[1], task: tasks[4] },
      { type: "COMMENT_ADDED", description: `${users[1].firstName} comentó en "${tasks[0].title}"`, actor: users[1], team: teams[0], task: tasks[0] },
      { type: "COMMENT_ADDED", description: `${users[0].firstName} comentó en "${tasks[0].title}"`, actor: users[0], team: teams[0], task: tasks[0] },
      { type: "STATUS_CHANGED", description: `${users[0].firstName} cambió el estado de "${tasks[3].title}" a ${TaskStatus.COMPLETED}`, actor: users[0], team: teams[0], task: tasks[3] },
      // Tareas 9-12
      { type: "STATUS_CHANGED", description: `${users[4].firstName} cambió el estado de "${tasks[8].title}" a ${TaskStatus.IN_PROGRESS}`, actor: users[4], team: teams[0], task: tasks[8] },
      { type: "COMMENT_ADDED", description: `${users[1].firstName} comentó en "${tasks[9].title}"`, actor: users[1], team: teams[0], task: tasks[9] },
      // Tareas 13-25
      { type: "TASK_CREATED", description: `Tarea "${tasks[16].title}" creada por ${users[1].firstName}`, actor: users[1], team: teams[0], task: tasks[16] },
      { type: "STATUS_CHANGED", description: `${users[1].firstName} cambió el estado de "${tasks[16].title}" a ${TaskStatus.IN_PROGRESS}`, actor: users[1], team: teams[0], task: tasks[16] },
      { type: "COMMENT_ADDED", description: `${users[4].firstName} comentó en "${tasks[16].title}"`, actor: users[4], team: teams[0], task: tasks[16] },
      { type: "TASK_CREATED", description: `Tarea "${tasks[14].title}" creada por ${users[0].firstName}`, actor: users[0], team: teams[2], task: tasks[14] },
      { type: "STATUS_CHANGED", description: `${users[2].firstName} cambió el estado de "${tasks[19].title}" a ${TaskStatus.COMPLETED}`, actor: users[2], team: teams[1], task: tasks[19] },
    ]));
    console.log(`🧾 ${activity.length} Registros de Actividad creados`);

    console.log("🌱 SEED COMPLETO ✅");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error ejecutando seeds:", error);
    process.exit(1);
  }
}

runSeeds();