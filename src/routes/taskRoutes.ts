import { Router } from "express";
import { TaskController } from "../controllers/TaskController";

const router = Router();

// Obtener todas las tareas
router.get("/", TaskController.getAll);

// Crear una nueva tarea
router.post("/", TaskController.create);

// --- AÑADIR ESTA NUEVA RUTA ---
// Actualizar/Asignar etiquetas (Debe ir ANTES de /:id para que no colisione)
router.put("/:id/tags", TaskController.assignTags);

// Actualizar estado de tarea (OBSOLETA?)
// Nota: Tu TaskController.update (PATCH /:id) ya maneja el status. 
// Esta ruta PUT /:id/status parece no usarse en el servicio.
router.put("/:id/status", TaskController.update); 

// Rutas para un recurso de tarea específico
router.get("/:id", TaskController.getOneById);
router.patch("/:id", TaskController.update); // Esta es la que usa el frontend
router.delete("/:id", TaskController.delete);


export default router;