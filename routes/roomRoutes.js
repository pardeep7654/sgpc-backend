import { Router } from "express";
import { addMultipleRooms, addRoom,getRoomsByGurudwara } from "../controllers/roomController.js";
import { adminOnly } from "../middlewares/adminMiddleware.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { uploadRoomImages } from "../middlewares/uploadMiddleware.js";

const router = Router();

// Add a new room to a Gurudwara (Admin only)
router.post('/add', authMiddleware, adminOnly, uploadRoomImages, addRoom);
// Get rooms by Gurudwara ID (Public)
router.post('/add-multiple', authMiddleware, adminOnly, uploadRoomImages, addMultipleRooms);
router.get('/:gurudwaraId', getRoomsByGurudwara);

export default router;
