import express from "express";
const router = express.Router();
import {
  getAllPaymentIns,
  getPaymentInById,
  createPaymentIn,
  updatePaymentIn,
  deletePaymentIn,
 
} from "../controllers/paymentInController.js";
import userAuth from "../middleware/userAuth.js";

router.get("/",userAuth,  getAllPaymentIns);
router.get("/:id", userAuth,getPaymentInById);
router.post("/", userAuth,createPaymentIn);
router.put("/:id",userAuth, updatePaymentIn);
router.delete("/:id",userAuth,    deletePaymentIn);

export default router;
