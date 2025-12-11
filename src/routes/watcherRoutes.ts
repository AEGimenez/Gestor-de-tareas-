// src/routes/watcherRoutes.ts
import { Router } from "express";
import { TaskWatcherController } from "../controllers/TaskWatcherController";

const router = Router();

// GET /watchers/watchlist
router.get("/watchlist", TaskWatcherController.getWatchlist);

// GET /watchers/notifications
router.get("/notifications", TaskWatcherController.getNotifications);

// PATCH /watchers/notifications/read
router.patch("/notifications/read", TaskWatcherController.markNotificationsAsRead);

export default router;
