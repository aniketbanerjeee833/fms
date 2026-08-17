import express from "express";
const router = express.Router();

import {addCategory, addItem,addItemConversion,addStockAdjustment,deleteItem,deleteStockAdjustment,eachItemBillAndInvoiceNumbers,
    eachItemSalesPurchaseDetails,editCategory,editItem,editStockAdjustment,getAllCategories,getAllCategoriesCursor,getAllItems, getAllItemsForLedger, getItemBills, getItemConversions, getItemsByCategory, printEachItemSalesPurchasesReport} from "../controllers/itemController.js"
import userAuth from "../middleware/userAuth.js";

router.post("/add-item",userAuth,addItem)
router.patch("/edit-item/:Item_Id",userAuth,editItem)
router.delete("/delete-item/:Item_Id",userAuth,deleteItem);
router.get("/get-all-items",userAuth,getAllItems)

router.get("/each-item-bill-and-invoice-numbers/:Item_Id",userAuth,eachItemBillAndInvoiceNumbers)
router.post("/add-category",userAuth,addCategory)
router.patch("/edit-category/:categoryId", editCategory);
router.get("/get-all-categories",userAuth,getAllCategories)
router.get("/get-all-categories/cursor",userAuth,getAllCategoriesCursor);
router.get("/items-by-category/:categoryId", getItemsByCategory);

router.get("/each-item-sales-purchase-details/:Item_Id",userAuth,eachItemSalesPurchaseDetails)
router.post("/print-each-item-sales-purchases-report",userAuth,printEachItemSalesPurchasesReport)
router.post("/item-conversions", addItemConversion);
// All items + unit conversion history
router.get("/ledger",userAuth, getAllItemsForLedger);

// Bills containing selected item
router.get("/:Item_Id/bills",userAuth, getItemBills);

router.get("/item-conversions/:Item_Id",userAuth, getItemConversions);
router.post("/stock-adjustment/add",userAuth, addStockAdjustment);
router.put("/stock-adjustment/:id", userAuth,editStockAdjustment);
router.delete("/stock-adjustment/:id",userAuth, deleteStockAdjustment);

export default router;