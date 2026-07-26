import express from "express";
const router   = express.Router();
import { createPurchaseReturn, deletePurchaseReturn, editPurchaseReturn, getAllPurchaseReturns, 
    getPurchaseReturnById } from "../controllers/purchaseReturnController.js";

router.get("/",      getAllPurchaseReturns);
router.get("/:Purchase_Return_Id",   getPurchaseReturnById);
router.post("/:Purchase_Id",     createPurchaseReturn);
router.put("/:Purchase_Return_Id",   editPurchaseReturn);
router.delete("/:id", deletePurchaseReturn);

export default router;