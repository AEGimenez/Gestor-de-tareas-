// src/index.ts
import "reflect-metadata";
import express from "express";
import cors from "cors";
import helmet from "helmet";
// Corregido: Quitamos la extensión .js
import { AppDataSource } from "./config/database";

// --- 1. Importaciones de Swagger ---
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "../swagger.json"; 

// --- Importaciones de rutas (Corregido: Quitamos .js) ---
import userRoutes from "./routes/userRoutes";
import teamRoutes from "./routes/teamRoutes";
import taskRoutes from "./routes/taskRoutes";
import commentRoutes from "./routes/commentRoutes";
import membershipRoutes from "./routes/teamMembershipRoutes";

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());

// Ruta de prueba
app.get("/", (req, res) => {
  res.json({ message: "El gestor está funcionando..." });
});

// --- 2. Configuración de la ruta de Swagger ---
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// --- Rutas de tu API ---
app.use("/users", userRoutes);
app.use("/teams", teamRoutes);
app.use("/tasks", taskRoutes);
app.use("/comments", commentRoutes);
app.use("/memberships", membershipRoutes);

// Probar conexión a la base de datos
app.get("/test-db", async (req, res) => {
  try {
    if (AppDataSource.isInitialized) {
      res.json({ message: "Se conectó con éxito a la base de datos" });
    } else {
      res.status(500).json({ message: "No se pudo conectar a la base de datos" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error en la conexión con la base de datos", error });
  }
});

// Inicializar la conexión a la base de datos y arrancar el servidor
AppDataSource.initialize()
  .then(() => {
    console.log("Conectado a la base de datos (PostgreSQL)..."); 
    app.listen(PORT, () => {
      console.log(`Servidor activo en: http://localhost:${PORT}`);
      console.log(`Documentación de API disponible en: http://localhost:${PORT}/docs`);
    });
  })
  .catch((err) => {
    console.error("No se pudo conectar con la base de datos:", err);
  });