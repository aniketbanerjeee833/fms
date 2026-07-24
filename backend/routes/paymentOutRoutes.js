import express from "express";
const router   = express.Router();
import {
    getAllPaymentOuts,
    getPaymentOutById,
    createPaymentOut,
    updatePaymentOut} from "../controllers/paymentOutController.js";

router.get("/",          getAllPaymentOuts);
router.get("/:id",       getPaymentOutById);
router.post("/",         createPaymentOut);
router.put("/:id",       updatePaymentOut);


export default router;