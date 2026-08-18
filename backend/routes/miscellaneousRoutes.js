import express from "express";
const router = express.Router();

import userAuth from "../middleware/userAuth.js";
import {  getAllUnits } from "../controllers/miscellaneousController.js";
//router.post("/unit/add-unit",userAuth,addUnit)
router.get("/unit/get-all-units",userAuth,getAllUnits)

export default router;