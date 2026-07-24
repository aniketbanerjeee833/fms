
import errorHandler from "./middleware/errorHandler.js";
import userRoutes from "./routes/userRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import partyRoutes from "./routes/partyRoutes.js";
import itemRoutes from "./routes/itemRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";

import purchaseRoutes from "./routes/purchaseRoutes.js";
import saleRoutes from "./routes/saleRoutes.js";
import dailyExpenseRoutes from "./routes/dailyExpense.js";
import financialYearRoutes from "./routes/financialYearRoutes.js";
import miscellaneousRoutes from "./routes/miscellaneousRoutes.js";

import "dotenv/config";
import express from "express";


// const dotenv = require('dotenv');

import cors from "cors";
import helmet from "helmet";  
import cookieParser from "cookie-parser";
import { clearExpiredLoginAttempts, clearExpiredSessions } from "./utils/cronJobs.js";







const app = express();
app.use(express.json());

const isProduction=false
// app.use(helmet());
if (isProduction) {
  console.log("🚀 Running Helmet in PRODUCTION mode with strict CSP");

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'",
            "https://cdn.jsdelivr.net",
            "https://cdnjs.cloudflare.com",
          ],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com",
            "https://cdn.jsdelivr.net",
            "https://cdnjs.cloudflare.com",
          ],
          fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
          imgSrc: [
            "'self'",
            "data:",
            "blob:",
            "https://cdn.jsdelivr.net",
            "https://cdnjs.cloudflare.com",
            "https://ancoinnovation.com",
          ],
          connectSrc: [
            "'self'",
            "https://cdn.jsdelivr.net",
            "https://ancoinnovation.com",
          ],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },
      noSniff: true,
    })
  );
} else {
  console.log("🧩 Running Helmet in DEVELOPMENT mode (relaxed CSP)");

  // More permissive CSP for Vite dev
  app.use(
    helmet({
      contentSecurityPolicy: false, // disable CSP locally
      crossOriginResourcePolicy: { policy: "cross-origin" },
      crossOriginEmbedderPolicy: false,
      noSniff: true,
    })
  );
}
app.use(cookieParser());
// app.use(cors({
//   origin: process.env.CLIENT_URL, // allow requests from 'http://localhost:5173','http://localhost:5174'
//   methods: ['GET', 'POST',"PUT","DELETE","PATCH",'OPTIONS'],  // your React app port
//   credentials: true                // allow cookies
// }));
const allowedOrigins = [
  "http://localhost:5173",             // e.g. http://localhost:5173
  "http://localhost:5174",              // second allowed origin

];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true
}));
app.use("/api/user",userRoutes)
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/party", partyRoutes);
app.use("/api/item", itemRoutes);
app.use("/api/purchase", purchaseRoutes);
app.use("/api/sale", saleRoutes);
app.use("/api/daily-expense",dailyExpenseRoutes);
app.use("/api/financial-year",financialYearRoutes)
app.use("/api/misc",miscellaneousRoutes)
app.use(errorHandler)
const PORT = process.env.PORT || 5000;
clearExpiredSessions();
clearExpiredLoginAttempts();

app.listen(PORT, (err) => {
  if (err) {
    logger.error(`❌ Failed to start server on port ${PORT}`, err);
    process.exit(1);
  } else {
    console.log(`Server running on port ${PORT}`); // optional plain console
  }
});



