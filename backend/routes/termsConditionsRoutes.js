import express from "express";
import {
  createTerms,
  getAllTerms,
  getTermsById,
} from "../controllers/termsConditionsController.js";
import userAuth from "../middleware/userAuth.js";

const router = express.Router();

router.post("/",   userAuth,      createTerms);

router.get("/",     userAuth,     getAllTerms);
router.get("/:id",   userAuth,    getTermsById);

export default router;