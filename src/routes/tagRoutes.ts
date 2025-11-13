import { Router } from "express";
import { TagController } from "../controllers/TagController";

const router = Router();

// GET /tags
router.get("/", TagController.getAll);

// POST /tags
router.post("/", TagController.create);

export default router;