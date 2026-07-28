import express from "express";
import {
  getCashInHand,
  getAllAdjustments,
  createAdjustment,
  editAdjustment,
  getCashBalance,
 
} from "../controllers/cashInHandController.js";

const router = express.Router();

router.get("/", getCashInHand);                     // Summary + Ledger
router.get("/cash-balance",getCashBalance)
router.get("/adjustments", getAllAdjustments);      // List manual adjustments
router.post("/adjustments", createAdjustment);      // Add adjustment
router.put("/adjustments/:id", editAdjustment);     // Edit adjustment
//router.delete("/adjustments/:id", deleteAdjustment); // Delete adjustment

export default router;