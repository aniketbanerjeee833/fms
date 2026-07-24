import express from "express";
const router = express.Router();

import {addCategory, addItem,eachItemBillAndInvoiceNumbers,
    eachItemSalesPurchaseDetails,editItem,getAllCategories,getAllItems, printEachItemSalesPurchasesReport} from "../controllers/itemController.js"
import userAuth from "../middleware/userAuth.js";

router.post("/add-item",userAuth,addItem)
router.patch("/edit-item/:Item_Id",userAuth,editItem)
router.get("/get-all-items",userAuth,getAllItems)

router.get("/each-item-bill-and-invoice-numbers/:Item_Id",userAuth,eachItemBillAndInvoiceNumbers)
router.post("/add-category",userAuth,addCategory)
router.get("/get-all-categories",userAuth,getAllCategories)

router.get("/each-item-sales-purchase-details/:Item_Id",userAuth,eachItemSalesPurchaseDetails)
router.post("/print-each-item-sales-purchases-report",userAuth,printEachItemSalesPurchasesReport)

export default router;