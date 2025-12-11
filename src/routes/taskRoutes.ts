import { Router } from "express";
import { TaskController } from "../controllers/TaskController";
import { TaskWatcherController } from "../controllers/TaskWatcherController";
const router = Router();

// Obtener todas las tareas
router.get("/", TaskController.getAll);

// Crear una nueva tarea
router.post("/", TaskController.create);

// --- AÑADIR ESTA NUEVA RUTA ---
// Actualizar/Asignar etiquetas (Debe ir ANTES de /:id para que no colisione)
router.put("/:id/tags", TaskController.assignTags);


router.put("/:id/status", TaskController.update); 

// Rutas para un recurso de tarea específico
router.get("/:id", TaskController.getOneById);
router.patch("/:id", TaskController.update); // Esta es la que usa el frontend
router.delete("/:id", TaskController.delete);

// watchers
router.get("/:taskId/watchers", TaskWatcherController.getByTask);
router.post("/:taskId/watchers", TaskWatcherController.subscribe);
router.delete(
  "/:taskId/watchers/:userId",
  TaskWatcherController.unsubscribe
);

export default router;