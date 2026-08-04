import express from "express";
import {
  createTerms,
  getAllTerms,
  getTermsById,
} from "../controllers/termsConditionsController.js";

const router = express.Router();

router.post("/",        createTerms);

router.get("/",         getAllTerms);
router.get("/:id",      getTermsById);

export default router;