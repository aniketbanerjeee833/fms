import express from "express";
import { addInvoice, addSale, editSale, getAllSales, getLatestInvoiceNumber, getSingleInvoice,
     getSingleSale, printSaleBill, updateInvoice, getSingleNewSaleInvoice,
     getTotalSalesEachDay,
     exportAllSalesReportToExcel,
     deleteSale,
     getSalesPrintReport
} from "../controllers/saleController.js";
import userAuth from "../middleware/userAuth.js";
const router = express.Router();



router.post("/add-sale",userAuth,addSale)

router.get("/get-all-sales",userAuth,getAllSales)
router.get("/export-sale-excel", exportAllSalesReportToExcel);

router.get("/get-single-sale/:Sale_Id",userAuth,getSingleSale)

router.post("/add-invoice",userAuth,addInvoice)
router.put("/update-invoice/",userAuth,updateInvoice)
router.get("/get-single-invoice",userAuth,getSingleInvoice)


router.get("/get-single-new-sale-invoice",userAuth,getSingleNewSaleInvoice)

router.get("/get-latest-invoice-number",userAuth,getLatestInvoiceNumber)


router.post("/print-sale-invoice",userAuth,printSaleBill)
router.put("/edit-sale/:Sale_Id",userAuth,editSale)

router.delete("/delete-sale/:Sale_Id",userAuth,deleteSale);

router.get("/total-sales-by-day",userAuth,getTotalSalesEachDay)
router.get("/print-sales-report",userAuth,getSalesPrintReport);


// router.get("/top-selling-items-month-wise/:year",userAuth,getTopSellingItemsPerMonth)
export default router;