import express from "express";
import { getSalesAndPurchasesDailyYearMonthWise, getSalesAndPurchasesMonthWise, getSalesAndPurchasesWeeklyYearMonthWise, getSalesAndPurchasesYearWise, getSalesNewSalesPurchasesEachDay,
     getSalesNewSalesPurchasesInDateRange, 
     getPartyWiseSalesAndPurchasesOverall,
     printDailyReport, 
     getBalanceSheet,
    
     getDayWiseTransactionsCount,
     getDayWiseTransactionsDetails,
     getAllTransactionsDayPrintReport} from "../controllers/reportsController.js";
import userAuth from "../middleware/userAuth.js";

const router = express.Router();

router.get("/get-sales-new-sales-purchases-each-day",userAuth, getSalesNewSalesPurchasesEachDay);
router.get("/get-sales-new-sales-purchases-in-date-range",userAuth, getSalesNewSalesPurchasesInDateRange);
router.get("/sales-purchases-daily-year-month-wise",userAuth,
     getSalesAndPurchasesDailyYearMonthWise);
router.get("/sales-purchases-weekly-year-month-wise",userAuth,
     getSalesAndPurchasesWeeklyYearMonthWise);
router.get("/sales-purchases-month-wise",userAuth, 
    getSalesAndPurchasesMonthWise);
router.get("/sales-purchases-year-wise",userAuth,
     getSalesAndPurchasesYearWise);
router.post("/print-daily-report",userAuth,printDailyReport)

// router.get("/party-wise-sales-purchases-daily-year-month-wise",userAuth,
//      getPartyWiseSalesAndPurchasesDailyYearMonthWise);

     router.get("/party-wise-sales-purchases-overall",userAuth,
      getPartyWiseSalesAndPurchasesOverall);
      router.get("/balance-sheet", userAuth, getBalanceSheet);
      router.get("/day-wise-transactions-count",userAuth,getDayWiseTransactionsCount);
      router.get("/day-wise-transactions-details",userAuth,getDayWiseTransactionsDetails)
      router.get("/day-wise-transactions-details-print",userAuth,getAllTransactionsDayPrintReport);
export default router;