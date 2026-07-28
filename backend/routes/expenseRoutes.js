import express from "express";
import userAuth from "../middleware/userAuth.js";
import {
  createExpenseCategory,
  editExpenseCategory,
  getAllExpenseCategories,
  createExpense,
  editExpense,
  getExpenseById,
  getExpensesByCategory,
  getDistinctExpenseItems,
  getExpenseItemUsage,
} from "../controllers/expenseController.js";

const expenseCategoryRouter = express.Router();
const expenseRouter = express.Router();

expenseCategoryRouter.post("/", userAuth, createExpenseCategory);
expenseCategoryRouter.put("/:id", userAuth, editExpenseCategory);
expenseCategoryRouter.get("/", userAuth, getAllExpenseCategories);

expenseRouter.post("/", userAuth, createExpense);
expenseRouter.put("/:id", userAuth, editExpense);
expenseRouter.get("/:id", userAuth, getExpenseById);
expenseRouter.get("/by-category/:categoryId", userAuth, getExpensesByCategory);
expenseRouter.get("/items", userAuth, getDistinctExpenseItems);
expenseRouter.get("/item-usage", userAuth, getExpenseItemUsage);

export { expenseCategoryRouter, expenseRouter };
export default expenseRouter;
