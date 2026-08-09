import express from "express";
const router   = express.Router();
import { createPurchaseReturn,  deletePurchaseReturn,  editPurchaseReturn, getAllPurchaseReturns, 
    getPurchaseReturnById } from "../controllers/purchaseReturnController.js";
import userAuth from "../middleware/userAuth.js";

router.get("/",  userAuth,    getAllPurchaseReturns);
router.get("/:Purchase_Return_Id", userAuth,  getPurchaseReturnById);
router.post("/:Purchase_Id",  userAuth,   createPurchaseReturn);
router.put("/:Purchase_Return_Id", userAuth,  editPurchaseReturn);
router.delete("/:Purchase_Return_Id",userAuth, deletePurchaseReturn);

export default router;