import express from "express";

import {
  getAllTransactionsSettings,
  updateTransactionsSetting,
} from "../../controllers/Settings/transactionsSettingController.js";
import userAuth from "../../middleware/userAuth.js";

const router = express.Router();

// Get all Transactions settings
router.get("/",userAuth, getAllTransactionsSettings);

// Update one Transactions setting
router.patch("/:setting_key",userAuth, updateTransactionsSetting);

export default router;