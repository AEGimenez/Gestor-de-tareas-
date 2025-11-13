// src/index.ts
import "reflect-metadata";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { AppDataSource } from "./config/database";

// --- Importaciones de Swagger y Comentarios/Historial ---
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "../swagger.json"; 

// --- Importaciones de rutas ---
import userRoutes from "./routes/userRoutes";
import teamRoutes from "./routes/teamRoutes";
import taskRoutes from "./routes/taskRoutes";
import commentRoutes from "./routes/commentRoutes";
import membershipRoutes from "./routes/teamMembershipRoutes";
import statusHistoryRoutes from "./routes/statusHistoryRoutes";
import tagRoutes from "./routes/tagRoutes";
import activityRoutes from "./routes/activityRoutes"; 

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

// --- Rutas de tu API ---
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/users", userRoutes);
app.use("/teams", teamRoutes);
app.use("/tasks", taskRoutes);
app.use("/comments", commentRoutes);
app.use("/memberships", membershipRoutes);
app.use("/history", statusHistoryRoutes);
app.use("/tags", tagRoutes); 
app.use("/activity", activityRoutes); // <-- 2. USAR LA NUEVA RUTA

// Probar conexión a la base de datos (sigue igual)
app.get("/test-db", async (req, res) => { /* ... */ });

// Inicializar la conexión a la base de datos y arrancar el servidor (sigue igual)
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