
import express from "express";
const router = express.Router();

import { eachItemHistory,  getAllSalesAndPurchasesYearWise, 
    getCategoriesWiseItemCount, getItemsSoldCount,
     getPartyWiseItemsSoldAndPurchased, getPartyWiseSalesAndPurchases, 
     getSalesChartData, 
     getTotalPayablesLeft, 
     getTotalReceivablesLeft, 
     getTotalSalesPurchasesReceivablesPayablesProfit, 
     itemsProfitRankWise} from "../controllers/dashboardController.js"
import userAuth from "../middleware/userAuth.js";
router.get("/total-sales-purchases-receivables-payables-profit", userAuth,getTotalSalesPurchasesReceivablesPayablesProfit);
router.get("/sales-purchases-profit", userAuth,getAllSalesAndPurchasesYearWise);
router.get("/categories-wise-item-count",userAuth, getCategoriesWiseItemCount);
router.get("/party-wise-sales-purchases",userAuth, getPartyWiseSalesAndPurchases);
router.get("/each-item-history",userAuth,eachItemHistory);
router.get("/each-item-sold-count",userAuth,getItemsSoldCount);
router.get("/each-party-items-sold-purchased",userAuth,getPartyWiseItemsSoldAndPurchased);
router.get("/item-rank-profit-wise",userAuth,  itemsProfitRankWise);
router.get("/total-payables-left",userAuth,  getTotalPayablesLeft);
router.get("/total-receivables-left",userAuth,  getTotalReceivablesLeft);
router.get("/sales-chart",userAuth,getSalesChartData)
//router.get("/rank-party-wise-sales-purchases",userAuth,  rankPartyWiseSalesAndPurchases)
export default router;