import multer from "multer";
import sharp from "sharp";
import fs from "fs";
import path from "path";

// Upload folder
const uploadDir = path.join(process.cwd(), "uploads", "purchaseBillUploads");

// Create folder if not exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer memory storage (so we can compress before saving)
const storage = multer.memoryStorage();

// Allow only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, JPEG, PNG images allowed"), false);
  }
};

// Multer upload
export const uploadPurchaseBill = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Compress and save image
export const compressAndSavePurchaseBill = async (file) => {
  try {
    const fileName = Date.now() + ".jpg";

    const filePath = path.join(uploadDir, fileName);

    await sharp(file.buffer)
      .resize({ width: 2000 }) // resize large images
      .grayscale() // better OCR
      .normalize()
      .sharpen()
      .jpeg({ quality: 80 }) // compress
      .toFile(filePath);

    return filePath;
    

  } catch (error) {
    console.error("Image compression error:", error);
    throw error;
  }
};