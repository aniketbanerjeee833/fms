import express from "express";
import { limiter } from "../utils/RateLimiter.js";
import { registerUser, loginUser, getUser, logoutUser } from "../controllers/userController.js";
import userAuth from "../middleware/userAuth.js";



const router = express.Router();
router.post("/register",  registerUser);
router.post("/login",  loginUser);//MAX 3 requests per 1 minutes per IP

router.get("/me",  getUser);
router.post("/logout", userAuth, logoutUser);

export default router;
