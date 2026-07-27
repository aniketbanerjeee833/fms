import express from "express";
import {
  createBankAccount,
  editBankAccount,
  getAllBankAccounts,
  getBankAccountById,
//   deleteBankAccount,
} from "../controllers/bankAccountController.js";

const router = express.Router();

router.post("/bank-account", createBankAccount);
router.put("/bank-account/:Bank_Account_Id", editBankAccount);
router.get("/bank-accounts", getAllBankAccounts);
router.get("/bank-account/:Bank_Account_Id", getBankAccountById);
// router.delete("/bank-account/:id", deleteBankAccount);

export default router;