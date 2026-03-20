import {Router} from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
   forgotPassword,
   resetPassword
} from "../controllers/authController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password/request-otp", forgotPassword);
router.post("/forgot-password/reset-password", resetPassword);
router.get("/logout",authMiddleware ,logoutUser);

export default router;
