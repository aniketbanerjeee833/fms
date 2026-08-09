import express from "express";
import {
  getCashInHand,
  getAllAdjustments,
  createAdjustment,
  editAdjustment,
  getCashBalance,
 
} from "../controllers/cashInHandController.js";
import userAuth from "../middleware/userAuth.js";

const router = express.Router();

router.get("/",userAuth, getCashInHand);                     // Summary + Ledger
router.get("/cash-balance",userAuth,getCashBalance)
router.get("/adjustments",userAuth, getAllAdjustments);      // List manual adjustments
router.post("/adjustments",userAuth, createAdjustment);      // Add adjustment
router.put("/adjustments/:id", userAuth,editAdjustment);     // Edit adjustment
//router.delete("/adjustments/:id", deleteAdjustment); // Delete adjustment

export default router;