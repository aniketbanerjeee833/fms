import express from "express";
import {
  getAllSaleReturns,
  getSaleReturnById,
  createSaleReturn,
  editSaleReturn,
  deleteSaleReturn,
} from "../controllers/saleReturnController.js";

const router = express.Router();

router.get("/", getAllSaleReturns);
router.get("/:Sale_Return_Id", getSaleReturnById);
router.post("/:Sale_Id", createSaleReturn);
router.put("/:Sale_Return_Id", editSaleReturn);
router.delete("/:id", deleteSaleReturn);

export default router;