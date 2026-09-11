// import express from "express";

// import {
//   getAllTransactionsSettings,
//   updateTransactionsSetting,
// } from "../../controllers/Settings/transactionsSettingController.js";
// import userAuth from "../../middleware/userAuth.js";

// const router = express.Router();

// // Get all Transactions settings
// router.get("/",userAuth, getAllTransactionsSettings);

// // Update one Transactions setting
// router.patch("/:setting_key",userAuth, updateTransactionsSetting);

// export default router;

import express from "express";

import {
    getAllTransactionsSettings,
    updateTransactionsSetting,
    getTransactionPrefixes,
    addTransactionPrefix,
    deleteTransactionPrefix,
    toggleTransactionPrefix,
    getTransactionPrefixesByType,
} from "../../controllers/Settings/transactionsSettingController.js";

import userAuth from "../../middleware/userAuth.js";

const router = express.Router();


// ============================================================
// Transaction Prefixes
// ============================================================

router.get("/prefixes", userAuth, getTransactionPrefixes);
router.get(
    "/prefixes/type/:transaction_type",
    userAuth,
    getTransactionPrefixesByType
);

router.post("/prefixes", userAuth, addTransactionPrefix);

router.patch(
    "/prefixes/:id/toggle",
    userAuth,
    toggleTransactionPrefix
);

router.delete(
    "/prefixes/:id",
    userAuth,
    deleteTransactionPrefix
);


// ============================================================
// Transactions Settings
// ============================================================

// Get all Transactions settings
router.get("/", userAuth, getAllTransactionsSettings);

// Update one Transactions setting
router.patch(
    "/:setting_key",
    userAuth,
    updateTransactionsSetting
);


export default router;