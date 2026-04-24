import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import https from "https";
import auth from "../../middleware/auth.middleware";
import { sellerLicenseController } from "./sellerLicense.controller";
import { prisma } from "../../lib/prisma";
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

      // ── Cloudinary upload ────────────────────────────────────────────────
      // IMPORTANT: We always use resource_type: "image" — even for PDFs.
      //
      // Why NOT "raw" or "auto"?
      // Cloudinary routes "raw" and "auto" (when it auto-detects PDF) through
      // its *raw* CDN pipeline.  On free / unverified accounts that pipeline
      // returns: { "error": { "message": "Customer is marked as untrusted" } }
      // inside the served file — the upload succeeds but the file is unviewable.
      //
      // The "image" pipeline has no such restriction: Cloudinary supports PDF
      // natively under the image type (you can even generate page thumbnails),
      // and the image CDN delivers it without the untrusted-customer block.
      const secureUrl = await new Promise<string>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder:          "seller-licenses",
            resource_type:   "image",  // image pipeline: works for JPG/PNG/WEBP AND PDF
            use_filename:    true,
            unique_filename: true,
            // pages: false tells Cloudinary NOT to split the PDF into pages,
            // just store the whole file as-is.
            pages:           false,
          },
          (error, result) => {
            if (error || !result) {
              console.error("[upload] Cloudinary error detail:", error);
              return reject(new Error(error?.message || "Cloudinary upload failed"));
            }
            console.log("[upload] Cloudinary secure_url:", result.secure_url);
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

// ── GET /document — serve the license file via Cloudinary signed API URL ──────────
//
// Cloudinary's CDN (res.cloudinary.com) blocks delivery for unverified accounts.
// cloudinary.utils.private_download_url() generates a signed URL that points
// to api.cloudinary.com instead — authenticated with the API key+secret —
// so it completely bypasses the CDN restriction.
router.get("/document", auth(["SELLER", "ADMIN"]), async (req: Request, res: Response) => {
  try {
    let docUrl = "";

    // 1. If a specific URL is provided (e.g. previewing an unsaved upload)
    if (req.query.url && typeof req.query.url === "string") {
      docUrl = req.query.url;
      // Basic SSRF protection: ensure it's a Cloudinary URL
      if (!docUrl.includes("res.cloudinary.com")) {
        return res.status(400).json({ success: false, message: "Invalid document URL" });
      }
    } 
    // 2. Otherwise, look up the saved license for this seller
    else {
      const sellerId =
        (req.user.role === "ADMIN" && req.query.sellerId)
          ? String(req.query.sellerId)
          : req.user.id;

      const license = await prisma.sellerLicense.findUnique({ where: { sellerId } });
      if (!license?.documentUrl) {
        return res.status(404).json({ success: false, message: "No license document found" });
      }
      docUrl = license.documentUrl;
    }

    // ── Extract public_id from the Cloudinary secure_url ────────────────────
    // URL shape: https://res.cloudinary.com/{cloud}/image/upload/v{n}/{public_id}.{ext}
    const uploadMarker = "/upload/";
    const afterUpload  = docUrl.split(uploadMarker)[1]; // "v123/seller-licenses/file.pdf"
    if (!afterUpload) {
      return res.status(400).json({ success: false, message: "Unrecognised document URL format" });
    }
    // Strip leading version segment (v123/)
    const withoutVersion = afterUpload.replace(/^v\d+\//, "");  // "seller-licenses/file.pdf"
    const lastDot        = withoutVersion.lastIndexOf(".");
    const publicId       = lastDot > -1 ? withoutVersion.slice(0, lastDot) : withoutVersion; // "seller-licenses/file"
    const format         = lastDot > -1 ? withoutVersion.slice(lastDot + 1) : "pdf";         // "pdf"

    // ── Generate signed Cloudinary API download URL (NOT CDN) ─────────────────
    // This URL points to api.cloudinary.com and is authenticated with
    // the API key + secret, bypassing all CDN delivery restrictions.
    const signedUrl = cloudinary.utils.private_download_url(publicId, format, {
      resource_type: "image",
      type:          "upload",
      attachment:    false,         
      expires_at:    Math.floor(Date.now() / 1000) + 3600,  // valid 1 hour
    });

    console.log("[document] fetching signed URL:", signedUrl);
    
    // ── Proxy the response to enforce inline display ───────────────────────
    // api.cloudinary.com might force Content-Disposition: attachment for PDFs,
    // causing a download. By proxying the stream, we can overwrite the headers
    // so the browser displays the PDF inline.
    https.get(signedUrl, (upstream) => {
      if (upstream.statusCode && upstream.statusCode >= 400) {
         console.error("[document] upstream error:", upstream.statusCode);
         return res.status(502).json({ success: false, message: "Could not fetch document from storage" });
      }

      // Determine mime type from the stored URL extension
      const isPdf = /\.pdf(\?|$)/i.test(docUrl);
      const contentType = isPdf ? "application/pdf" : (upstream.headers["content-type"] || "application/octet-stream");

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", "inline; filename=\"license.pdf\"");
      res.setHeader("Cache-Control", "private, max-age=3600");

      upstream.pipe(res);
    }).on("error", (err) => {
      console.error("[document] fetch error:", err);
      res.status(500).json({ success: false, message: "Failed to stream document" });
    });

  } catch (err: any) {
    console.error("[document] error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});


// ── SELLER ────────────────────────────────────────────────────────────────────
router.post("/",    auth(["SELLER"]), sellerLicenseController.submitLicense);
router.get("/my",   auth(["SELLER"]), sellerLicenseController.getMyLicense);

// ── ADMIN ─────────────────────────────────────────────────────────────────────
router.get("/",                   auth(["ADMIN"]), sellerLicenseController.getAllLicenses);
router.patch("/:sellerId/review", auth(["ADMIN"]), sellerLicenseController.reviewLicense);
router.delete("/:licenseId",      auth(["ADMIN"]), sellerLicenseController.deleteLicense);

export const sellerLicenseRouter = router;
