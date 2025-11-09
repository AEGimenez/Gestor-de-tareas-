import { Router } from "express";
import { CommentController } from "../controllers/CommentController";

const router = Router();

//Crear un nuevo comentario
router.post("/", CommentController.create);

//Obtener todos los comentarios
router.get("/", CommentController.getAll);

//Obtener comentarios de una tarea específica
router.get("/task/:taskId", CommentController.getByTask);

router.put("/:id", CommentController.update);
router.delete("/:id", CommentController.remove);

export default router;

