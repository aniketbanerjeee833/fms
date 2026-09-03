import express from "express";
const router = express.Router();



import userAuth from "../../middleware/userAuth.js";
import { addFinancialYear, getAllFinancialYears, getAllSettings, updateCurrentFinancialYear, updateSetting } 
from "../../controllers/Settings/settingController.js";
router.post("/add-financial-year",userAuth,addFinancialYear)
router.get("/get-all-financial-years",userAuth,getAllFinancialYears)
router.patch("/update-current-financial-year",userAuth,updateCurrentFinancialYear)
router.get("/get-all-settings",getAllSettings);



router.patch("/update-setting/:setting_key",updateSetting);
export default router;