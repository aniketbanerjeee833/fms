import express from "express";
import {
  getAllSaleReturns,
  getSaleReturnById,
  createSaleReturn,
  editSaleReturn,
  deleteSaleReturn,
} from "../controllers/saleReturnController.js";
import userAuth from "../middleware/userAuth.js";

const router = express.Router();

router.get("/", userAuth, getAllSaleReturns);
router.get("/:Sale_Return_Id",userAuth, getSaleReturnById);
router.post("/:Sale_Id",userAuth, createSaleReturn);
router.put("/:Sale_Return_Id", userAuth, editSaleReturn);
router.delete("/:Sale_Return_Id",userAuth,  deleteSaleReturn);

export default router;