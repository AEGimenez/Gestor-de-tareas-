import { Router } from "express";
import { UserController } from "../controllers/UserController";

const router = Router();

//Obtener usuarios
router.get("/", UserController.getAll);

//Crear un nuevo usuario
router.post("/", UserController.create);

// PUT /users/:id - Actualizar un usuario
router.put("/:id", UserController.update);

// DELETE /users/:id - Borrar un usuario
router.delete("/:id", UserController.remove);


export default router;