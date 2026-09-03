import express from "express";

import {
    getBarcodeSettings, selectBarcodeSetting,
} from "../../controllers/Settings/barcodeSettingController.js";

const router = express.Router();

router.get("/", getBarcodeSettings);

router.put("/select", selectBarcodeSetting);

export default router;