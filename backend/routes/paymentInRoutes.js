import express from "express";
const router = express.Router();
import {
  getAllPaymentIns,
  getPaymentInById,
  createPaymentIn,
  updatePaymentIn,
 
} from "../controllers/paymentInController.js";

router.get("/", getAllPaymentIns);
router.get("/:id", getPaymentInById);
router.post("/", createPaymentIn);
router.put("/:id", updatePaymentIn);


export default router;
