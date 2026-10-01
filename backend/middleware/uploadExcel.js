// import multer from "multer";

// const storage = multer.memoryStorage();

// const uploadExcel = multer({
//   storage,
//   limits: {
//     fileSize: 5 * 1024 * 1024, // 5 MB
//   },
//   fileFilter: (req, file, cb) => {
//     const allowedExtensions = /\.(xlsx|xls)$/i;

//     if (!allowedExtensions.test(file.originalname)) {
//       return cb(new Error("Only .xls and .xlsx files are allowed."));
//     }

//     cb(null, true);
//   },
// });

// export default uploadExcel;

import multer from "multer";
import path from "path";
import fs from "fs/promises";

const uploadDir = path.join(
  process.cwd(),
  "uploads",
  "items-excel"
);

// Creates uploads/items-excel if it doesn't exist
await fs.mkdir(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);

    const fileName = `items-${Date.now()}${ext}`;

    cb(null, fileName);
  },
});

const uploadExcel = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const allowedExtensions = /\.(xlsx|xls)$/i;

    if (!allowedExtensions.test(file.originalname)) {
      return cb(
        new Error("Only .xls and .xlsx files are allowed.")
      );
    }

    cb(null, true);
  },
});

export default uploadExcel;