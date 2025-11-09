import { Router } from "express";
import { TeamController } from "../controllers/TeamController";

const router = Router();

//Obtener todos los equipos
router.get("/", TeamController.getAll);

//Crear un nuevo equipo
router.post("/", TeamController.create);

//Eliminar un equipo
router.delete("/:id", TeamController.delete); 

//Actualizar un equipo
router.patch('/:id', TeamController.update);

export default router;