import { Router } from "express";
import { createBooking,getAvailabily,checkInBooking,cancelBooking, getOccupancyDetails, createGroupBooking, checkOutBooking, getBookingDetails} from "../controllers/bookingController.js";
import {authMiddleware} from "../middlewares/authMiddleware.js";
import { adminOnly } from "../middlewares/adminMiddleware.js";

const router = Router();

router.get("/availability", getAvailabily);
router.get("/me",authMiddleware,getBookingDetails)
router.post("/create", authMiddleware, createBooking);
router.post("/group",authMiddleware,createGroupBooking);
router.get("/admin/occupancy",authMiddleware,adminOnly,getOccupancyDetails);
router.post("/checkin", authMiddleware,adminOnly, checkInBooking);//staff check-in route
router.put("/cancel/:bookingId", authMiddleware, cancelBooking);//user cancel booking route
router.put("/checkout/:bookingId", authMiddleware,adminOnly, checkOutBooking);
export default router;