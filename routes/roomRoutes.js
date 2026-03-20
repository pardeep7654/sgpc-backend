import { Router } from "express";
import { addRoom,getRoomsByGurudwara } from "../controllers/roomController.js";
import { adminOnly } from "../middlewares/adminMiddleware.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

// Add a new room to a Gurudwara (Admin only)
router.post('/add', authMiddleware, adminOnly, addRoom);
// Get rooms by Gurudwara ID (Public)
router.get('/:gurudwaraId', getRoomsByGurudwara);

export default router;