import { Router } from "express";
import { TaskController } from "../controllers/TaskController";

const router = Router();

// Obtener todas las tareas
router.get("/", TaskController.getAll);

// Crear una nueva tarea
router.post("/", TaskController.create);

// Actualizar estado de tarea
router.put("/:id/status", TaskController.update);

// Rutas para un recurso de tarea específico
router.get("/:id", TaskController.getOneById);
router.patch("/:id", TaskController.update);
router.delete("/:id", TaskController.delete);


export default router;