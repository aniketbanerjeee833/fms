import express from "express";
const router = express.Router();

import {addCategory, addItem,addItemConversion,addStockAdjustment,deleteItem,deleteStockAdjustment,
    eachItemBillAndInvoiceNumbers,
    eachItemSalesPurchaseDetails,editCategory,editItem,editStockAdjustment,getAllCategories,getAllCategoriesCursor,
    getAllItems, getAllItemsForLedger, getItemBills, getItemConversions, getItemsByCategory, getItemsNotInCategory, 
    moveItemsToCategory, printEachItemSalesPurchasesReport,addItemUnit,editItemUnit,
    getAllItemUnitsCursor,
    getUnitConversions,
    getAllItemUnits,
    getItemByCode,
    getItemsForDropdown,
    getItemByName,
    
    importItemsExcel,
    validateImportItemRow,
    importItemRows} from "../controllers/itemController.js"
import userAuth from "../middleware/userAuth.js";
import uploadExcel from "../middleware/uploadExcel.js";



const itemRouter = express.Router();
const unitRouter = express.Router();
itemRouter.post("/add-item", userAuth, addItem);
itemRouter.post("/import-items-excel", userAuth, uploadExcel.single("file"), importItemsExcel);
itemRouter.post("/validate-import-row", userAuth, validateImportItemRow);
itemRouter.post("/import-items-rows", userAuth, importItemRows);
itemRouter.patch("/edit-item/:Item_Id", userAuth, editItem);
itemRouter.delete("/delete-item/:Item_Id", userAuth, deleteItem);
itemRouter.get("/get-all-items", userAuth, getAllItems);

itemRouter.post("/add-category", userAuth, addCategory);
itemRouter.patch("/edit-category/:categoryId", userAuth, editCategory);
itemRouter.get("/get-all-categories", userAuth, getAllCategories);
itemRouter.get("/get-all-categories/cursor", userAuth, getAllCategoriesCursor);
itemRouter.get("/available-items/:Category_Id", userAuth, getItemsNotInCategory);
itemRouter.put("/move-items-to-category", userAuth, moveItemsToCategory);
itemRouter.get("/items-by-category/:categoryId", userAuth, getItemsByCategory);

itemRouter.get("/each-item-bill-and-invoice-numbers/:Item_Id", userAuth, eachItemBillAndInvoiceNumbers);
itemRouter.get("/each-item-sales-purchase-details/:Item_Id", userAuth, eachItemSalesPurchaseDetails);
itemRouter.post("/print-each-item-sales-purchases-report", userAuth, printEachItemSalesPurchasesReport);

itemRouter.post("/item-conversions", userAuth, addItemConversion);
itemRouter.get("/ledger", userAuth, getAllItemsForLedger);
itemRouter.get("/dropdown",userAuth,getItemsForDropdown);
itemRouter.get("/by-name",userAuth,getItemByName);

itemRouter.get("/by-code/:code", userAuth, getItemByCode);
itemRouter.get("/:Item_Id/bills", userAuth, getItemBills);
// itemRouter.get("/item-conversions/:Item_Id", userAuth, getItemConversions);
itemRouter.get("/item-conversions", userAuth, getItemConversions);

itemRouter.post("/stock-adjustment/add", userAuth, addStockAdjustment);
itemRouter.put("/stock-adjustment/:id", userAuth, editStockAdjustment);
itemRouter.delete("/stock-adjustment/:id", userAuth, deleteStockAdjustment);

unitRouter.post("/add-unit", userAuth, addItemUnit);
unitRouter.get("/get-all-units",userAuth,getAllItemUnits)
unitRouter.get("/get-all-units/cursor", userAuth, getAllItemUnitsCursor);
unitRouter.patch("/edit-unit/:id", userAuth, editItemUnit);
unitRouter.get("/:unitId/conversions",userAuth,getUnitConversions)
//unitRouter.delete("/delete-unit/:id", userAuth, deleteUnit);
export {
  itemRouter,
  unitRouter,
};
