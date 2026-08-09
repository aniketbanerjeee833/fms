import express from "express";
const router   = express.Router();
import {
    getAllPaymentOuts,
    getPaymentOutById,
    createPaymentOut,
    updatePaymentOut,
    deletePaymentOut} from "../controllers/paymentOutController.js";
import userAuth from "../middleware/userAuth.js";

router.get("/",    userAuth,      getAllPaymentOuts);
router.get("/:id",  userAuth,     getPaymentOutById);
router.post("/",   userAuth,      createPaymentOut);
router.put("/:id",  userAuth,     updatePaymentOut);
router.delete("/:id",userAuth,    deletePaymentOut);


export default router;