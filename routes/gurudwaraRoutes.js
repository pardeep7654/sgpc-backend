import { Router } from "express";
import { createGurudwara,getAllGurudwaras } from "../controllers/gurudwaraController.js";
import { adminOnly } from "../middlewares/adminMiddleware.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

// Create a new Gurudwara (Admin only)
router.post('/create', authMiddleware, adminOnly, createGurudwara);
// Get all Gurudwaras (Public)
router.get('/all', getAllGurudwaras);

export default router;