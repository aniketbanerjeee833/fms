import express from "express";
import userAuth from "../middleware/userAuth.js";
import {
  createExpenseCategory,
  editExpenseCategory,
  deleteExpenseCategory,
  getAllExpenseCategories,

  createExpenseItemMaster,
  editExpenseItemMaster,
  deleteExpenseItemMaster,
  getAllExpenseItemMasters,

  createExpense,
  editExpense,
  deleteExpense,
  getExpenseById,
  getExpensesByCategory,
  getExpenseItemUsage,
  getAllExpenseItemMastersCursor,
} from "../controllers/expenseController.js";

const expenseCategoryRouter = express.Router();
const expenseItemRouter = express.Router();
const expenseRouter = express.Router();

/* ==========================
   Expense Category Routes
========================== */

expenseCategoryRouter.post("/", userAuth, createExpenseCategory);
expenseCategoryRouter.put("/:id", userAuth, editExpenseCategory);
expenseCategoryRouter.delete("/:id", userAuth, deleteExpenseCategory);
expenseCategoryRouter.get("/", userAuth, getAllExpenseCategories);

/* ==========================
   Expense Item Master Routes
========================== */

expenseItemRouter.post("/", userAuth, createExpenseItemMaster);
expenseItemRouter.put("/:id", userAuth, editExpenseItemMaster);
expenseItemRouter.delete("/:id", userAuth, deleteExpenseItemMaster);
expenseItemRouter.get("/", userAuth, getAllExpenseItemMasters);
expenseItemRouter.get("/cursor",userAuth,getAllExpenseItemMastersCursor);

/* ==========================
   Expense Routes
========================== */

expenseRouter.post("/", userAuth, createExpense);
expenseRouter.put("/:id", userAuth, editExpense);
expenseRouter.delete("/:id", userAuth, deleteExpense);
expenseRouter.get("/item-usage", userAuth, getExpenseItemUsage);
expenseRouter.get("/by-category/:categoryId", userAuth, getExpensesByCategory);
expenseRouter.get("/:id", userAuth, getExpenseById);

export {
  expenseCategoryRouter,
  expenseItemRouter,
  expenseRouter,
};

export default expenseRouter;