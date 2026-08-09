import express from "express";
import {
  createBankAccount,
  editBankAccount,
  getAllBankAccounts,
  getBankAccountById,
//   deleteBankAccount,
} from "../controllers/bankAccountController.js";
import userAuth from "../middleware/userAuth.js";

const router = express.Router();

router.post("/bank-account", userAuth,createBankAccount);
router.put("/bank-account/:Bank_Account_Id",userAuth, editBankAccount);
router.get("/bank-accounts", userAuth,getAllBankAccounts);
router.get("/bank-account/:Bank_Account_Id",userAuth, getBankAccountById);
// router.delete("/bank-account/:id", deleteBankAccount);

export default router;