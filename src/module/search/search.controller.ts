import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { searchService } from "./search.service";
import status from "http-status";

// ─── Advanced search ──────────────────────────────────────────────────────────
const advancedSearch = catchAsync(async (req: Request, res: Response) => {
  const filters = req.query as any;
  const data = await searchService.advancedSearch(filters);

  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "Search results fetched",
    data,
  });
});

// ─── Generic alternatives ─────────────────────────────────────────────────────
const getGenericAlternatives = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = await searchService.getGenericAlternatives(id);

  sendResponse(res, {
    status: status.OK,
    success: true,
    message: "Generic alternatives fetched",
    data,
  });
});

export const searchController = {
  advancedSearch,
  getGenericAlternatives,
};
