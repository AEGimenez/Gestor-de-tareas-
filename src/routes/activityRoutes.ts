import { Router } from "express";
import { ActivityController } from "../controllers/ActivityController";

const router = Router();

// Endpoint: GET /activity?teamId=... (Feed global o filtrado)
// Cumple con la ruta /activity del FRONTEND-TAREAS.md (con filtro opcional)
router.get("/", ActivityController.getGlobalFeed);

// Endpoint: GET /activity/team/:teamId 
// Cumple con la ruta /teams/:id/activity (si se monta este router en '/activity')
router.get("/team/:teamId", ActivityController.getTeamFeed);

export default router;

// En tu archivo principal (app.ts/index.ts) añade:
// import activityRoutes from './routes/activityRoutes';
// app.use('/activity', activityRoutes);