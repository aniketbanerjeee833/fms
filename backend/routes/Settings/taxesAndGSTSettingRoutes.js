import express from "express";

import {
  getAllTaxesAndGSTSettings,
  updateTaxesAndGSTSetting,
} from "../../controllers/Settings/taxesAndGSTSettingController.js";
import userAuth from "../../middleware/userAuth.js";

const router = express.Router();

// =========================================================
// GET ALL TAX / GST SETTINGS
// =========================================================

router.get(
  "/",userAuth,
  getAllTaxesAndGSTSettings
);

// =========================================================
// UPDATE SINGLE TAX / GST SETTING
// =========================================================

router.patch(
  "/:setting_key",userAuth,
  updateTaxesAndGSTSetting
);

export default router;