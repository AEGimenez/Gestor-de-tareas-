import "reflect-metadata";
import { AppDataSource } from "../../config/database";
import { User } from "../../entities/User";
import { Team } from "../../entities/Team";
import { Task, TaskStatus, TaskPriority } from "../../entities/Task";
import { Comment } from "../../entities/Comment";
import { TeamMembership, MemberRole } from "../../entities/TeamMembership";

async function seedDatabase() {
  try {
    // Inicializar la conexión
    await AppDataSource.initialize();
    console.log("Conexión establecida, iniciando siembra...");

    // --- Repositorios ---
    const userRepository = AppDataSource.getRepository(User);
    const teamRepository = AppDataSource.getRepository(Team);
    const taskRepository = AppDataSource.getRepository(Task);
    const membershipRepository = AppDataSource.getRepository(TeamMembership);
    const commentRepository = AppDataSource.getRepository(Comment);
    
    // Limpiar tablas en el orden correcto para evitar errores de clave foránea
    await commentRepository.clear();
    await membershipRepository.clear();
    await taskRepository.clear();
    await teamRepository.clear();
    await userRepository.clear();
    console.log("🧹 Tablas limpiadas.");

    // --- Crear Usuarios ---
    const userAna = await userRepository.save(
      userRepository.create({
        email: "ana@test.com",
        password: "password123", // NOTA: Hashear en un proyecto real
        firstName: "Ana",
        lastName: "García",
      })
    );

    const userJuan = await userRepository.save(
      userRepository.create({
        email: "juan@test.com",
        password: "password123",
        firstName: "Juan",
        lastName: "Pérez",
      })
    );
    console.log("Usuarios creados.");

    // --- Crear Equipo ---
    const devTeam = await teamRepository.save(
      teamRepository.create({
        name: "Equipo de Desarrollo Alpha",
        description: "Equipo encargado del desarrollo del TPI.",
        owner: userAna, 
      })
    );
    console.log("Equipo creado.");

    // --- Crear Membresías ---
    await membershipRepository.save([
      membershipRepository.create({
        user: userAna,
        team: devTeam,
        role: MemberRole.OWNER, 
      }),
      membershipRepository.create({
        user: userJuan,
        team: devTeam,
        role: MemberRole.MEMBER, 
      }),
    ]);
    console.log("Membresías creadas.");

    // --- Crear Tareas ---
    const task1 = await taskRepository.save(
      taskRepository.create({
        title: "Configurar el entorno de desarrollo",
        status: TaskStatus.COMPLETED,
        priority: TaskPriority.HIGH,
        team: devTeam,
        createdBy: userAna,
        assignedTo: userJuan,
      })
    );

    const task2 = await taskRepository.save(
      taskRepository.create({
        title: "Modelar las entidades de la base de datos",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        team: devTeam,
        createdBy: userAna,
        assignedTo: userAna,
      })
    );
    console.log("Tareas creadas.");

    // --- Crear Comentarios ---
    await commentRepository.save(
      commentRepository.create({
        content: "¡Excelente trabajo! Ya quedó listo el entorno.",
        task: task1, 
        author: userJuan, 
      })
    );
    console.log("💬 Comentarios creados.");

    console.log("La base de datos se sembro correctamente! 🎉");
  } catch (error) {
    console.error("Error seeding the database:", error);
  } finally {
    // Cerrar la conexión
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log("Conexión cerrada.");
    }
  }
}

// Ejecutar la función
seedDatabase();