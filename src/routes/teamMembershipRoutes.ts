import { Router } from "express";
import { TeamMembershipController } from "../controllers/TeamMembershipController";

const router = Router();

// Agregar usuario a equipo
router.post("/", TeamMembershipController.addMember);

// Miembros de un equipo
router.get("/team/:teamId", TeamMembershipController.getTeamMembers);

// Equipos de un usuario
router.get("/user/:userId", TeamMembershipController.getUserTeams);

export default router;