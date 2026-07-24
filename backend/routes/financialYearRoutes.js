import express from "express";
const router = express.Router();



import userAuth from "../middleware/userAuth.js";
import { addFinancialYear, getAllFinancialYears, updateCurrentFinancialYear } from "../controllers/FinancialYearController.js";
router.post("/add-financial-year",userAuth,addFinancialYear)
router.get("/get-all-financial-years",userAuth,getAllFinancialYears)
router.patch("/update-current-financial-year",userAuth,updateCurrentFinancialYear)
export default router;