import express from "express";
import * as authController from "../controllers/authController";
import * as userController from "../controllers/userController";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/signup", authController.signup);

router.post("/login", authController.Login);

router.post("/logout", protect, authController.logout);

router.get("/me", protect, userController.getMe);

// router.get("/protect", protect);

export default router;
