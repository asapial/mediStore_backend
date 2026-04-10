import { Router } from "express";
import { searchController } from "./search.controller";

const router = Router();

// Public routes (no auth required — customers can search freely)
router.get("/", searchController.advancedSearch);
router.get("/alternatives/:id", searchController.getGenericAlternatives);

export const searchRouter = router;
