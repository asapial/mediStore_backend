import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import auth from "../../middleware/auth.middleware";
import { sellerLicenseController } from "./sellerLicense.controller";
import cloudinary from "../../lib/cloudinary";

const router = Router();

// ── Multer: store file in memory (max 10 MB) ──────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPG, PNG, WEBP, or PDF files are allowed"));
  },
});

// ── POST /api/seller-license/upload ──────────────────────────────────────────
// Receives file via multipart/form-data → uploads to Cloudinary → returns secure_url
router.post("/upload", auth(["SELLER"]), (req: Request, res: Response, next: NextFunction) => {
  // Run multer inside a callback so its errors are caught and returned as JSON
  upload.single("file")(req, res, async (multerErr: any) => {
    if (multerErr) {
      return res.status(400).json({ success: false, message: multerErr.message || "File upload error" });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file provided" });
      }

      const isPdf         = req.file.mimetype === "application/pdf";
      const resourceType: "image" | "raw" = isPdf ? "raw" : "image";

      // Stream buffer → Cloudinary
      const secureUrl = await new Promise<string>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder:          "seller-licenses",
            resource_type:   resourceType,
            use_filename:    true,
            unique_filename: true,
          },
          (error, result) => {
            if (error || !result) {
              return reject(new Error(error?.message || "Cloudinary upload failed"));
            }
            resolve(result.secure_url);
          }
        );
        stream.end(req.file!.buffer);
      });

      return res.status(200).json({
        success: true,
        message: "File uploaded successfully",
        data:    { url: secureUrl },
      });

    } catch (err: any) {
      console.error("[upload] Cloudinary error:", err);
      return res.status(500).json({ success: false, message: err.message || "Upload failed" });
    }
  });
});

// ── SELLER ────────────────────────────────────────────────────────────────────
router.post("/",    auth(["SELLER"]), sellerLicenseController.submitLicense);
router.get("/my",   auth(["SELLER"]), sellerLicenseController.getMyLicense);

// ── ADMIN ─────────────────────────────────────────────────────────────────────
router.get("/",                   auth(["ADMIN"]), sellerLicenseController.getAllLicenses);
router.patch("/:sellerId/review", auth(["ADMIN"]), sellerLicenseController.reviewLicense);
router.delete("/:licenseId",      auth(["ADMIN"]), sellerLicenseController.deleteLicense);

export const sellerLicenseRouter = router;
