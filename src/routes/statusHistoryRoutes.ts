import { Router } from "express";
import { StatusHistoryController } from "../controllers/StatusHistoryController";

const router = Router();

// Definimos la ruta para obtener el historial de una tarea
// GET /history/task/42
router.get("/task/:taskId", StatusHistoryController.getByTask);

export default router;