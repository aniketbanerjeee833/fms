import express from "express";
const router = express.Router();

import {addParty, editParty, exportSinglePartyDetailsReportToExcel, getAllParties, getAllPartiesCursor, getAllPartiesPayablesLeft, getAllPartiesReceivablesLeft,
     getAllPayableParties, getAllReceivableParties, getPartyPrintReport, getSinglePartyDetailsSalesPurchases, printSinglePartyDetailsSalesPurchasesReport} from "../controllers/partyController.js"
import userAuth from "../middleware/userAuth.js";


router.post("/add-party",userAuth,addParty)
router.patch("/edit-party/:Party_Id",userAuth,editParty)
router.get("/get-all-parties",userAuth,getAllParties)
router.get("/cursor",userAuth, getAllPartiesCursor);
router.get("/export-party-report-excel/:Party_Id",userAuth,exportSinglePartyDetailsReportToExcel);
router.get("/print-report/:Party_Id",userAuth,getPartyPrintReport);
router.get("/get-single-party-details-sales-purchases/:Party_Id",userAuth,getSinglePartyDetailsSalesPurchases)
router.post("/print-single-party-details-sales-purchases-report",userAuth,printSinglePartyDetailsSalesPurchasesReport)
router.get("/payables",userAuth,getAllPayableParties);
router.get("/receivables",userAuth,getAllReceivableParties);

router.get("/all-parties-payables-left",userAuth,getAllPartiesPayablesLeft)
router.get("/all-parties-receivables-left",userAuth,getAllPartiesReceivablesLeft)


export default router;