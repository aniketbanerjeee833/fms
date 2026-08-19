import express from "express";
const router = express.Router();


import { addPurchase, deletePurchase, editPurchase, exportAllPurchasesReportToExcel, getAllPurchases, getPurchasePrintReport, getSinglePurchase,
     getTotalPurchasesEachDay, 
     uploadBillAndCreatePurchase} from "../controllers/purchaseController.js";
import userAuth from "../middleware/userAuth.js";
 import { uploadPurchaseBill } from "../utils/purchaseBillUpload.js";


router.post("/add-purchase",userAuth,addPurchase)

router.get("/get-single-purchase/:Purchase_Id",userAuth,getSinglePurchase)
router.get("/get-all-purchases",userAuth,getAllPurchases)
router.get("/export-purchase-excel", exportAllPurchasesReportToExcel);
router.get("/total-purchases-by-day",userAuth,getTotalPurchasesEachDay)
router.put("/edit-purchase/:Purchase_Id",userAuth,editPurchase)
router.post(
  "/upload-bill",
  uploadPurchaseBill.single("bill"),
  uploadBillAndCreatePurchase
);
router.get("/print-purchase-report",userAuth,getPurchasePrintReport);

router.delete("/delete-purchase/:Purchase_Id",userAuth,deletePurchase);

export default router;