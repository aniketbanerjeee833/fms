import express from "express";
const router = express.Router();


import userAuth from "../middleware/userAuth.js";
import { addDailyExpense, editSingleDailyExpense, getAllExpenses } from "../controllers/DailyExpenseController.js";
router.post("/add-daily-expense",userAuth,addDailyExpense)
router.get("/get-all-daily-expenses",userAuth,getAllExpenses)
// router.get("/get-single-daily-expense",userAuth,getSingleExpenseById)
router.patch("/edit-daily-expense",userAuth,editSingleDailyExpense)

export default router;