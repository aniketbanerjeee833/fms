// /* ═══════════════════════════════════════════════════════════════════
//    1. SQL — run this once to create the table
// ═══════════════════════════════════════════════════════════════════

// CREATE TABLE IF NOT EXISTS payment_out (
  
//   Party_Id          VARCHAR(20)     NOT NULL,
//   Receipt_No        VARCHAR(50)     DEFAULT NULL,
//   Payment_Date      DATE            NOT NULL,
//   Payment_Type      VARCHAR(50)     NOT NULL DEFAULT 'Cash',
//   Paid            DECIMAL(12,2)   NOT NULL DEFAULT 0,
//   Notes             TEXT            DEFAULT NULL,
//   created_at        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
//   updated_at        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//   FOREIGN KEY (Party_Id) REFERENCES add_party(Party_Id)
// );

// -- Auto-increment ID helper (optional — or generate in Node like PAY-OUT-001)
// -- If you prefer auto numeric PK, replace VARCHAR(20) with INT AUTO_INCREMENT


// ═══════════════════════════════════════════════════════════════════
//    2. BACKEND CONTROLLERS  (paymentOutController.js)
// ═══════════════════════════════════════════════════════════════════ */
// import db from "../config/db.js"; // mysql2/promise connection
// import { recordBankTransaction } from "../utils/bankAccountHelper.js";
// import { recordCashTransaction } from "../utils/cashTransactionHelper.js";


 
// const getAllPaymentOuts = async (req, res, next) => {
//   let connection;
//   try {
//     connection = await db.getConnection();

//     const page     = parseInt(req.query.page, 10) || 1;
//     const limit    = 10;
//     const offset   = (page - 1) * limit;
//     const search   = req.query.search?.trim().toLowerCase() || "";
//     const fromDate = req.query.fromDate || null;
//     const toDate   = req.query.toDate || null;

//     const whereClauses = [];
//     const params = [];

//     if (search) {
//       whereClauses.push(`(
//         LOWER(a.Party_Name) LIKE ? OR
//         LOWER(po.Payment_Type) LIKE ? OR
//         LOWER(po.Receipt_No) LIKE ? OR
//         LOWER(po.Reference_No) LIKE ? OR
//         LOWER(ba.Account_Display_Name) LIKE ? OR
//         CAST(po.Paid AS CHAR) LIKE ?
//       )`);

//       const like = `%${search}%`;
//       params.push(like, like, like, like, like, like);
//     }

//     if (fromDate && toDate) {
//       whereClauses.push(`DATE(po.Payment_Date) BETWEEN ? AND ?`);
//       params.push(fromDate, toDate);
//     } else if (fromDate) {
//       whereClauses.push(`DATE(po.Payment_Date) >= ?`);
//       params.push(fromDate);
//     } else if (toDate) {
//       whereClauses.push(`DATE(po.Payment_Date) <= ?`);
//       params.push(toDate);
//     }

//     const whereSQL = whereClauses.length
//       ? `WHERE ${whereClauses.join(" AND ")}`
//       : "";

//     const [rows] = await connection.query(
//       `SELECT
//           po.*,
//           a.Party_Name,
//           ba.Account_Display_Name AS Bank_Display_Name,
//           CASE
//             WHEN po.Payment_Type = 'Bank'
//               THEN ba.Account_Display_Name
//             ELSE po.Payment_Type
//           END AS Payment_Type_Display
//        FROM payment_out po
//        LEFT JOIN add_party a
//          ON a.Party_Id = po.Party_Id
//        LEFT JOIN bank_accounts ba
//          ON ba.id = po.Bank_Account_Id
//        ${whereSQL}
//        ORDER BY po.created_at DESC
//        LIMIT ? OFFSET ?`,
//       [...params, limit, offset]
//     );

//     const [[{ total }]] = await connection.query(
//       `SELECT COUNT(*) AS total
//        FROM payment_out po
//        LEFT JOIN add_party a
//          ON a.Party_Id = po.Party_Id
//        LEFT JOIN bank_accounts ba
//          ON ba.id = po.Bank_Account_Id
//        ${whereSQL}`,
//       params
//     );

//     const [[totals]] = await connection.query(
//       `SELECT
//           COALESCE(SUM(po.Paid), 0) AS totalPaid
//        FROM payment_out po
//        LEFT JOIN add_party a
//          ON a.Party_Id = po.Party_Id
//        LEFT JOIN bank_accounts ba
//          ON ba.id = po.Bank_Account_Id
//        ${whereSQL}`,
//       params
//     );

//     return res.status(200).json({
//       success: true,
//       currentPage: page,
//       totalPages: Math.ceil(total / limit),
//       totalPayments: total,
//       paymentOuts: rows,
//       totals,
//     });
//   } catch (err) {
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };
 
// /* ── GET SINGLE ───────────────────────────────────────────── */
// const getPaymentOutById = async (req, res, next) => {
//   let connection;
//   try {
//     connection = await db.getConnection();
//     const { id } = req.params;
 
//     const [[row]] = await connection.query(
//       `SELECT po.*, a.Party_Name,
//         ba.Account_Display_Name AS Bank_Display_Name,
//         CASE
//           WHEN po.Payment_Type = 'Bank'
//           THEN ba.Account_Display_Name
//           ELSE po.Payment_Type
//         END AS Payment_Type_Display
//        FROM payment_out po
//        LEFT JOIN add_party a ON a.Party_Id = po.Party_Id
//        LEFT JOIN bank_accounts ba ON ba.id = po.Bank_Account_Id
//        WHERE po.id = ?`,
//       [id]
//     );
 
//     if (!row) return res.status(404).json({ success: false, message: "Payment Out not found" });
 
//     return res.status(200).json({ success: true, paymentOut: row });
//   } catch (err) {
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };
 
// /* ── CREATE ───────────────────────────────────────────────── */
// const createPaymentOut = async (req, res, next) => {
//   let connection;
//   try {
//     connection = await db.getConnection();
 
//     const {
//       Party_Id,
//       Party_Name,       // needed by recordBankTransaction for the ledger row
//       Receipt_No,
//       Payment_Date,
//       Payment_Type,
//       Reference_No,
//       Bank_Account_Id,  // required only when Payment_Type === "Bank"
//       Paid,
//     } = req.body;
 
//     if (!Party_Id || !Payment_Date || !Payment_Type || !Paid) {
//       return res.status(400).json({ success: false, message: "Party, Date, Payment Type and Paid are required" });
//     }
 
//     if (isNaN(Paid) || Number(Paid) <= 0) {
//       return res.status(400).json({ success: false, message: "Paid amount must be greater than 0" });
//     }
 
//     if (Payment_Type === "Bank" && !Bank_Account_Id) {
//       return res.status(400).json({ success: false, message: "Bank account is required when Payment Type is Bank" });
//     }
 
//     await connection.beginTransaction();
 
//     const [result] = await connection.query(
//       `INSERT INTO payment_out
//          (Party_Id, Receipt_No, Payment_Date, Payment_Type, Reference_No, Bank_Account_Id, Paid)
//        VALUES (?, ?, ?, ?, ?, ?, ?)`,
//       [
//         Party_Id,
//         Receipt_No || null,
//         Payment_Date,
//         Payment_Type,
//         Reference_No || null,
//         Payment_Type === "Bank" ? Bank_Account_Id : null,
//         Number(Paid),
//       ]
//     );
 
//     const Payment_Out_Id = result.insertId;
 
//     // Payment_Out is not in CREDIT_TYPES inside recordBankTransaction, so it's
//     // correctly posted as a Debit (money leaving the bank account).
//      if (Payment_Type === "Bank" && Bank_Account_Id) {
//         await recordBankTransaction({
//       connection,
//       bankAccountId: Payment_Type === "Bank" ? Bank_Account_Id : null,
//       txnType: "Payment_Out",
//       referenceId: Payment_Out_Id,
//       partyName: Party_Name,
//       amount: Number(Paid),
//       txnDate: Payment_Date,
//     })
//      }
   
//     await recordCashTransaction({
//   connection,
//   isCash:      Payment_Type === "Cash",
//   txnType:     "Payment_Out",
//   referenceId: Payment_Out_Id,
//   partyName:   Party_Name,
//   amount: Number(Paid),
//   txnDate:     Payment_Date,
// });
 
 
//     await connection.commit();
 
//     return res.status(201).json({
//       success: true,
//       message: "Payment Out created",
//       Payment_Out_Id,
//     });
//   } catch (err) {
//     if (connection) await connection.rollback();
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };
 
// /* ── UPDATE ───────────────────────────────────────────────── */
// const updatePaymentOut = async (req, res, next) => {
//   let connection;
//   try {
//     connection = await db.getConnection();
//     const { id } = req.params;
//     const {
//       Party_Id,
//       Party_Name,
//       Receipt_No,
//       Payment_Date,
//       Payment_Type,
//       Reference_No,
//       Bank_Account_Id,
//       Paid,
//     } = req.body;
 
//     if (!Party_Id || !Payment_Date || !Payment_Type || !Paid) {
//       return res.status(400).json({ success: false, message: "Party, Date, Payment Type and Paid are required" });
//     }
 
//     if (isNaN(Paid) || Number(Paid) <= 0) {
//       return res.status(400).json({ success: false, message: "Paid amount must be greater than 0" });
//     }
 
//     if (Payment_Type === "Bank" && !Bank_Account_Id) {
//       return res.status(400).json({ success: false, message: "Bank account is required when Payment Type is Bank" });
//     }
 
//     await connection.beginTransaction();
 
//     await connection.query(
//       `UPDATE payment_out
//        SET Party_Id = ?, Receipt_No = ?, Payment_Date = ?,
//            Payment_Type = ?, Reference_No = ?, Bank_Account_Id = ?, Paid = ?
//        WHERE id = ?`,
//       [
//         Party_Id,
//         Receipt_No || null,
//         Payment_Date,
//         Payment_Type,
//         Reference_No || null,
//         Payment_Type === "Bank" ? Bank_Account_Id : null,
//         Number(Paid),
//         id,
//       ]
//     );
 
//     await recordBankTransaction({
//       connection,
//       bankAccountId: Payment_Type === "Bank" ? Bank_Account_Id : null,
//       txnType: "Payment_Out",
//       referenceId: id,
//       partyName: Party_Name,
//       amount: Number(Paid),
//       txnDate: Payment_Date,
//     });
//   await recordCashTransaction({
//       connection,
//       isCash:      Payment_Type === "Cash",
//       txnType: "Payment_Out",
//       referenceId: id,
//       partyName: Party_Name,
//       amount: Number(Paid),
//       txnDate: Payment_Date,
//     });
//     await connection.commit();
 
//     return res.status(200).json({ success: true, message: "Payment Out updated" });
//   } catch (err) {
//     if (connection) await connection.rollback();
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };
 
// /* ── DELETE ───────────────────────────────────────────────── */
// // const deletePaymentOut = async (req, res, next) => {
// //   let connection;
// //   try {
// //     connection = await db.getConnection();
// //     await connection.query(`DELETE FROM payment_out WHERE Payment_Out_Id = ?`, [req.params.id]);
// //     return res.status(200).json({ success: true, message: "Payment Out deleted" });
// //   } catch (err) {
// //     next(err);
// //   } finally {
// //     if (connection) connection.release();
// //   }
// // };

// export { getAllPaymentOuts, getPaymentOutById, createPaymentOut, updatePaymentOut };


// /* ═══════════════════════════════════════════════════════════════════
//    3. ROUTES  (paymentOutRoutes.js)
// ═══════════════════════════════════════════════════════════════════

// const express  = require("express");
// const router   = express.Router();
// const {
//   getAllPaymentOuts,
//   getPaymentOutById,
//   createPaymentOut,
//   updatePaymentOut,
//   deletePaymentOut,
// } = require("../controllers/paymentOutController");

// router.get("/",          getAllPaymentOuts);
// router.get("/:id",       getPaymentOutById);
// router.post("/",         createPaymentOut);
// router.put("/:id",       updatePaymentOut);
// router.delete("/:id",    deletePaymentOut);

// module.exports = router;

// // In app.js / index.js:
// // app.use("/api/payment-out", require("./routes/paymentOutRoutes"));

// ═══════════════════════════════════════════════════════════════════ */



import db from "../config/db.js";
import { getPaymentOutsForPrint } from "../helpers/printReportHelpers.js";
import { recordBankTransaction } from "../utils/bankAccountHelper.js";
import { recordCashTransaction }  from "../utils/cashTransactionHelper.js";
import { recordPartyLedger, reversePartyLedger } from "../utils/partyLedgerHelper.js";
import { validateSplits, insertPaymentSplits, deletePaymentSplits } from "../utils/paymentSplitHelper.js";
import { validateDateRange } from "../utils/validateDate.js";
import ExcelJS from "exceljs";
/* ── GET ALL ─────────────────────────────────────────────── */
const getAllPaymentOuts = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();

    const page     = parseInt(req.query.page, 10) || 1;
    const limit    = 10;
    const offset   = (page - 1) * limit;
    const search   = req.query.search?.trim().toLowerCase() || "";
    const fromDate = req.query.fromDate || null;
    const toDate   = req.query.toDate   || null;
  const dateError = validateDateRange(fromDate, toDate);
    if (dateError) return res.status(400).json({ success: false, message: dateError });
    const whereClauses = [];
    const params       = [];

    // if (search) {
    //   whereClauses.push(`(
    //     LOWER(a.Party_Name)       LIKE ? OR
    //     LOWER(po.Receipt_No)      LIKE ? OR
    //     CAST(po.Paid AS CHAR)     LIKE ?
    //   )`);
    //   const like = `%${search}%`;
    //   params.push(like, like, like);
    // }

    if (search) {
      whereClauses.push(`(
       a.Party_Name       LIKE ? OR
        po.Receipt_No      LIKE ? OR
        CAST(po.Paid AS CHAR)     LIKE ?
      )`);
      const like = `%${search}%`;
      params.push(like, like, like);
    }

    if (fromDate && toDate) {
      whereClauses.push(`DATE(po.Payment_Date) BETWEEN ? AND ?`);
      params.push(fromDate, toDate);
    } else if (fromDate) {
      whereClauses.push(`DATE(po.Payment_Date) >= ?`);
      params.push(fromDate);
    } else if (toDate) {
      whereClauses.push(`DATE(po.Payment_Date) <= ?`);
      params.push(toDate);
    }

    const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

    /* main rows — no Payment_Type column anymore, splits carry that detail */
    const [rows] = await connection.query(
      `SELECT po.*, a.Party_Name
       FROM payment_out po
       LEFT JOIN add_party a ON a.Party_Id = po.Party_Id
       ${whereSQL}
       ORDER BY po.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    /* attach split labels per row */
    const paymentIds = rows.map((r) => r.id);

    if (paymentIds.length > 0) {
      const placeholders = paymentIds.map(() => "?").join(",");

      const [splits] = await connection.query(
        `SELECT
           ps.Source_Id,
           ps.Payment_Type,
           ps.Bank_Account_Id,
           ps.Reference_Number,
           ps.Amount,
           ba.Account_Display_Name
         FROM payment_splits ps
         LEFT JOIN bank_accounts ba ON ba.id = ps.Bank_Account_Id
         WHERE ps.Source_Type = 'Payment_Out'
           AND ps.Source_Id IN (${placeholders})`,
        paymentIds
      );

      const splitMap = {};
      for (const split of splits) {
        if (!splitMap[split.Source_Id]) splitMap[split.Source_Id] = [];
        splitMap[split.Source_Id].push({
          Payment_Type:     split.Payment_Type,
          Bank_Account_Id:  split.Bank_Account_Id,
          Reference_Number: split.Reference_Number,
          Amount:           Number(split.Amount),
          Bank_Display_Name: split.Account_Display_Name,
        });
      }

      for (const row of rows) {
        row.splits = splitMap[row.id] || [];
        row.Payment_Type_Display = row.splits
          .map((s) => s.Payment_Type === "Bank" ? s.Bank_Display_Name : s.Payment_Type)
          .join(", ") || "—";
      }
    }

    const [[{ total }]] = await connection.query(
      `SELECT COUNT(*) AS total
       FROM payment_out po
       LEFT JOIN add_party a ON a.Party_Id = po.Party_Id
       ${whereSQL}`,
      params
    );

    const [[totals]] = await connection.query(
      `SELECT COALESCE(SUM(po.Paid), 0) AS totalPaid
       FROM payment_out po
       LEFT JOIN add_party a ON a.Party_Id = po.Party_Id
       ${whereSQL}`,
      params
    );

    return res.status(200).json({
      success:       true,
      currentPage:   page,
      totalPages:    Math.ceil(total / limit),
      totalPayments: total,
      paymentOuts:   rows,
      totals,
    });
  } catch (err) {
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

/* ── GET SINGLE ──────────────────────────────────────────── */
const getPaymentOutById = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();
    const { id } = req.params;

    // const [[row]] = await connection.query(
    //   `SELECT po.*, a.Party_Name
    //    FROM payment_out po
    //    LEFT JOIN add_party a ON a.Party_Id = po.Party_Id
    //    WHERE po.id = ?`,
    //   [id]
    // );
        const [[row]] = await connection.query(
  `
  SELECT
    po.*,

    a.Party_Name,
    a.GSTIN,
    a.Phone_Number,
    a.State,

    pa.Address_Text AS Billing_Address

  FROM payment_out po

  LEFT JOIN add_party a
    ON a.Party_Id = po.Party_Id

  LEFT JOIN add_party_addresses pa
    ON pa.Party_Id = po.Party_Id
    AND pa.Address_Type = 'Billing'
    AND pa.Is_Default = 1

  WHERE po.id = ?
  `,
  [id]
);

    if (!row) return res.status(404).json({ success: false, message: "Payment Out not found" });

    const [splits] = await connection.query(
      `SELECT ps.*, ba.Account_Display_Name
       FROM payment_splits ps
       LEFT JOIN bank_accounts ba ON ba.id = ps.Bank_Account_Id
       WHERE ps.Source_Type = 'Payment_Out' AND ps.Source_Id = ?
       ORDER BY ps.id ASC`,
      [id]
    );

    return res.status(200).json({ success: true, paymentOut: { ...row, splits } });
  } catch (err) {
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

/* ── CREATE ───────────────────────────────────────────────── */
const createPaymentOut = async (req, res, next) => {
  let connection;

  try {
    connection = await db.getConnection();

    const {
      Party_Id,
      Party_Name,
      Receipt_No,
      Payment_Date,
      splits,
    } = req.body;

    // =====================================================
    // 1. BASIC VALIDATION
    // =====================================================

    if (!Party_Id || !Payment_Date) {
      return res.status(400).json({
        success: false,
        message: "Party and Date are required",
      });
    }

    if (!Array.isArray(splits) || splits.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one payment split is required",
      });
    }

     // =====================================================
    // FINANCIAL YEAR
    // =====================================================

    const [fy] = await connection.query(
      `
      SELECT Financial_Year
      FROM financial_year
      WHERE Current_Financial_Year = 1
      LIMIT 1
      `
    );

    if (fy.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "No active financial year found. Please set one in settings.",
      });
    }

    const activeFY = fy[0].Financial_Year;

    // =====================================================
    // 2. NORMALIZE SPLITS
    //
    // ""       -> 0
    // "0"      -> 0
    // "0.00"   -> 0
    // "500"    -> 500
    //
    // Invalid Bank without Bank_Account_Id is removed.
    // =====================================================

    const normalizedSplits = splits
      .filter((split) => {
        if (!split.Payment_Type) {
          return false;
        }

        if (
          split.Payment_Type === "Bank" &&
          !split.Bank_Account_Id
        ) {
          return false;
        }

        return true;
      })
      .map((split) => ({
        ...split,
        Amount: Number(split.Amount) || 0,
      }));

    // =====================================================
    // 3. FIRST VALID SPLIT STAYS
    //
    // First valid method:
    //   ₹0 or blank -> KEEP
    //
    // Middle/last methods:
    //   ₹0 or blank -> DROP
    //   > ₹0        -> KEEP
    // =====================================================

    const validSplits = normalizedSplits.filter(
      (split, index) => {
        if (index === 0) {
          return true;
        }

        return split.Amount > 0;
      }
    );

    if (validSplits.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one valid payment method is required",
      });
    }

    // =====================================================
    // 4. TOTAL PAID
    //
    // Calculate ONLY from surviving splits.
    // =====================================================

    const totalPaid = validSplits.reduce(
      (sum, split) => sum + split.Amount,
      0
    );

    // ₹0 is allowed because first payment method may be ₹0
    if (isNaN(totalPaid) || totalPaid < 0) {
      return res.status(400).json({
        success: false,
        message: "Paid amount must be a valid non-negative number",
      });
    }

    // =====================================================
    // 5. VALIDATE SURVIVING SPLITS
    // =====================================================

    try {
      validateSplits(
        validSplits,
        totalPaid
      );
    } catch (validationErr) {
      return res.status(400).json({
        success: false,
        message: validationErr.message,
      });
    }

    // =====================================================
    // 6. START TRANSACTION
    // =====================================================

    await connection.beginTransaction();

    // =====================================================
    // 7. INSERT PAYMENT OUT HEADER
    // =====================================================

    const [result] = await connection.query(
      `INSERT INTO payment_out
       (
         Party_Id,
         Receipt_No,
         Payment_Date,
         financial_year,
         Paid
       )
       VALUES (?, ?, ?, ?, ?)`,
      [
        Party_Id,
        Receipt_No || null,
        Payment_Date,
        activeFY,
        totalPaid,
      ]
    );

    const id = result.insertId;

    // =====================================================
    // 8. INSERT ONLY VALID SPLITS
    // =====================================================

    await insertPaymentSplits({
      connection,
      sourceType: "Payment_Out",
      sourceId: id,
      partyName: Party_Name,
      txnDate: Payment_Date,
      splits: validSplits,
    });

    // =====================================================
    // 9. PARTY LEDGER
    // =====================================================

    await recordPartyLedger({
      connection,
      partyId: Party_Id,
      txnType: "Payment_Out",

      // FIXED:
      // Your old code used referenceId: id
      referenceId: id,

      amount: totalPaid,
      txnDate: Payment_Date,
      docNumber: Receipt_No,
      balanceDue: null,
    });

    // =====================================================
    // 10. COMMIT
    // =====================================================

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Payment Out created",
      id,
      totalPaid,
    });

  } catch (err) {
    if (connection) {
      await connection.rollback();
    }

    next(err);

  } finally {
    if (connection) {
      connection.release();
    }
  }
};
 const deletePaymentOut = async (req, res, next) => {
  let connection;

  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Payment Out ID is required.",
      });
    }

    connection = await db.getConnection();

    await connection.beginTransaction();

    // =========================================================
    // 1. GET PAYMENT OUT
    // =========================================================

    const [[paymentOut]] = await connection.query(
      `
      SELECT
        id,
        Party_Id,
        Receipt_No,
        Payment_Date,
        Paid
      FROM payment_out
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (!paymentOut) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Payment Out not found.",
      });
    }

    const paymentOutId = paymentOut.id;

    // =========================================================
    // 2. DELETE PAYMENT SPLITS
    //
    // payment_splits.Source_Id = payment_out.id
    // Source_Type = Payment_Out
    // =========================================================

    await deletePaymentSplits({
      connection,
      sourceType: "Payment_Out",
      sourceId: paymentOutId,
    });

    // =========================================================
    // 3. REVERSE PARTY LEDGER
    //
    // party_ledger.Source_Id = payment_out.id
    // Txn_Type = Payment_Out
    //
    // Opening Balance is NOT touched.
    // =========================================================

    await reversePartyLedger({
      connection,
      partyId: paymentOut.Party_Id,
      txnType: "Payment_Out",
      referenceId: paymentOutId,
    });

    // =========================================================
    // 4. DELETE PAYMENT OUT HEADER
    // =========================================================

    await connection.query(
      `
      DELETE FROM payment_out
      WHERE id = ?
      `,
      [paymentOutId]
    );

    // =========================================================
    // 5. COMMIT
    // =========================================================

    await connection.commit();

  return res.status(200).json({
  success: true,
  message: "Payment Out deleted successfully.",
  Payment_Out_Id: paymentOut.id,
});

  } catch (err) {

    if (connection) {
      await connection.rollback();
    }

    console.error(
      "❌ Error deleting Payment Out:",
      err
    );

    next(err);

  } finally {

    if (connection) {
      connection.release();
    }
  }
};
/* ── UPDATE ───────────────────────────────────────────────── */

const updatePaymentOut = async (req, res, next) => {
  let connection;

  try {
    connection = await db.getConnection();

    const { id } = req.params;

    const {
      Party_Id,
      Party_Name,
      Receipt_No,
      Payment_Date,
      splits,
    } = req.body;

    // =====================================================
    // 1. BASIC VALIDATION
    // =====================================================

    if (!Party_Id || !Payment_Date) {
      return res.status(400).json({
        success: false,
        message: "Party and Date are required",
      });
    }

    // if (!Array.isArray(splits) || splits.length === 0) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "At least one payment split is required",
    //   });
    // }

    // =====================================================
    // 2. NORMALIZE SPLITS
    // =====================================================

    const normalizedSplits = splits
      .filter((split) => {
        if (!split.Payment_Type) {
          return false;
        }

        if (
          split.Payment_Type === "Bank" &&
          !split.Bank_Account_Id
        ) {
          return false;
        }

        return true;
      })
      .map((split) => ({
        ...split,
        Amount: Number(split.Amount) || 0,
      }));

    // =====================================================
    // 3. FIRST VALID SPLIT STAYS
    //
    // Cash ₹0       -> KEEP if first
    // HDFC ₹0       -> DROP if later
    // ANCO ₹500     -> KEEP
    // SBI blank     -> DROP
    // =====================================================

    const validSplits = normalizedSplits.filter(
      (split, index) => {
        if (index === 0) {
          return true;
        }

        return split.Amount > 0;
      }
    );

    // if (validSplits.length === 0) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "At least one valid payment method is required",
    //   });
    // }

    // =====================================================
    // 4. TOTAL PAID
    // =====================================================

    const totalPaid = validSplits.reduce(
      (sum, split) => sum + split.Amount,
      0
    );

    if (isNaN(totalPaid) || totalPaid < 0) {
      return res.status(400).json({
        success: false,
        message: "Paid amount must be a valid non-negative number",
      });
    }

    // =====================================================
    // 5. VALIDATE SURVIVING SPLITS
    // =====================================================

    try {
      validateSplits(
        validSplits,
        totalPaid
      );
    } catch (validationErr) {
      return res.status(400).json({
        success: false,
        message: validationErr.message,
      });
    }

    // =====================================================
    // 6. CHECK PAYMENT OUT EXISTS
    // =====================================================

    const [[existing]] = await connection.query(
      `SELECT id,financial_year
       FROM payment_out
       WHERE id = ?`,
      [id]
    );

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Payment Out not found",
      });
    }

    // =====================================================
    // 7. START TRANSACTION
    // =====================================================

    await connection.beginTransaction();

    // =====================================================
    // 8. UPDATE HEADER
    // =====================================================

    await connection.query(
      `UPDATE payment_out
       SET
         Party_Id = ?,
         Receipt_No = ?,
         Payment_Date = ?,
         Paid = ?,
         updated_at = NOW()
       WHERE id = ?`,
      [
        Party_Id,
        Receipt_No || null,
        Payment_Date,
        totalPaid,
        id,
      ]
    );

    // =====================================================
    // 9. DELETE OLD SPLITS + OLD CASH/BANK LEDGER ROWS
    // =====================================================

    await deletePaymentSplits({
      connection,
      sourceType: "Payment_Out",
      sourceId: id,
    });

    // =====================================================
    // 10. INSERT ONLY SURVIVING SPLITS
    //
    // IMPORTANT:
    // splits: validSplits
    // =====================================================

    await insertPaymentSplits({
      connection,
      sourceType: "Payment_Out",
      sourceId: id,
      partyName: Party_Name,
      txnDate: Payment_Date,
      splits: validSplits,
    });

    // =====================================================
    // 11. PARTY LEDGER
    // =====================================================

    await recordPartyLedger({
      connection,
      partyId: Party_Id,
      txnType: "Payment_Out",
      referenceId: id,
      amount: totalPaid,
      txnDate: Payment_Date,
      docNumber: Receipt_No,
      balanceDue: null,
    });

    // =====================================================
    // 12. COMMIT
    // =====================================================

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Payment Out updated",
      totalPaid,
    });

  } catch (err) {
    if (connection) {
      await connection.rollback();
    }

    next(err);

  } finally {
    if (connection) {
      connection.release();
    }
  }
};



const exportPaymentOutsReportToExcel = async (req, res, next) => {
  let connection;

  try {
    connection = await db.getConnection();

    const search = req.query.search?.trim() || "";
    const fromDate = req.query.fromDate || null;
    const toDate = req.query.toDate || null;

    const whereClauses = [];
    const params = [];

    if (search) {
      const like = `%${search}%`;

      whereClauses.push(`
        (
          a.Party_Name LIKE ?
          OR po.Receipt_No LIKE ?
          OR CAST(po.Paid AS CHAR) LIKE ?
        )
      `);

      params.push(like, like, like);
    }

    if (fromDate && toDate) {
      whereClauses.push(`DATE(po.Payment_Date) BETWEEN ? AND ?`);
      params.push(fromDate, toDate);
    } else if (fromDate) {
      whereClauses.push(`DATE(po.Payment_Date) >= ?`);
      params.push(fromDate);
    } else if (toDate) {
      whereClauses.push(`DATE(po.Payment_Date) <= ?`);
      params.push(toDate);
    }

    const whereSQL =
      whereClauses.length > 0
        ? `WHERE ${whereClauses.join(" AND ")}`
        : "";

    const [rows] = await connection.query(
      `
      SELECT
        po.*,
        a.Party_Name
      FROM payment_out po
      LEFT JOIN add_party a
        ON a.Party_Id = po.Party_Id
      ${whereSQL}
      ORDER BY po.Payment_Date DESC
      `,
      params
    );

    /* =========================
       Load Payment Types
    ========================= */

    const paymentIds = rows.map((r) => r.id);

    if (paymentIds.length) {
      const placeholders = paymentIds.map(() => "?").join(",");

      const [splits] = await connection.query(
        `
        SELECT
          ps.Source_Id,
          ps.Payment_Type,
          ba.Account_Display_Name
        FROM payment_splits ps
        LEFT JOIN bank_accounts ba
          ON ba.id = ps.Bank_Account_Id
        WHERE ps.Source_Type = 'Payment_Out'
        AND ps.Source_Id IN (${placeholders})
        `,
        paymentIds
      );

      const splitMap = {};

      for (const split of splits) {
        if (!splitMap[split.Source_Id]) {
          splitMap[split.Source_Id] = [];
        }

        splitMap[split.Source_Id].push(
          split.Payment_Type === "Bank"
            ? split.Account_Display_Name
            : split.Payment_Type
        );
      }

      rows.forEach((row) => {
        row.Payment_Type_Display =
          splitMap[row.id]?.join(", ") || "—";
      });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Payment Out Report");

    sheet.columns = [
      { width: 15 }, // Date
      { width: 20 }, // Receipt No
      { width: 35 }, // Party Name
      { width: 25 }, // Payment Type
      { width: 18 }, // Paid Amount
    ];

    /* =========================
       TITLE
    ========================= */

    sheet.mergeCells("A1:E1");

    const titleCell = sheet.getCell("A1");
    titleCell.value = "PAYMENT OUT REPORT";
    titleCell.font = {
      bold: true,
      size: 14,
    };
    titleCell.alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    sheet.mergeCells("A2:E2");

    const generatedOn = new Date().toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    sheet.getCell("A2").value = `Generated On ${generatedOn}`;

    sheet.getCell("A2").font = {
      italic: true,
      size: 10,
    };

    sheet.addRow([]);

    /* =========================
       HEADER
    ========================= */

    const headerRow = sheet.addRow([
      "Date",
      "Receipt No",
      "Party Name",
      "Payment Type",
      "Paid Amount",
    ]);

    headerRow.eachCell((cell) => {
      cell.font = {
        bold: true,
      };

      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "medium" },
        right: { style: "thin" },
      };
    });

    const FIRST_DATA_ROW = 5;

    /* =========================
       DATA
    ========================= */

    rows.forEach((payment) => {
      const row = sheet.addRow([
        payment.Payment_Date
          ? new Date(payment.Payment_Date).toLocaleDateString("en-IN")
          : "",

        payment.Receipt_No || "",

        payment.Party_Name || "",

        payment.Payment_Type_Display || "",

        Number(payment.Paid || 0),
      ]);

      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: "hair" },
          left: { style: "hair" },
          bottom: { style: "hair" },
          right: { style: "hair" },
        };

        if (colNumber === 5) {
          cell.numFmt = "#,##0.00";
          cell.alignment = {
            horizontal: "right",
          };
        }
      });
    });

    /* =========================
       TOTAL ROW
    ========================= */

    const lastDataRow = sheet.rowCount;

    const totalRow = sheet.addRow([
      "",
      "",
      "",
      "TOTAL",
      {
        formula: `SUM(E${FIRST_DATA_ROW}:E${lastDataRow})`,
      },
    ]);

    totalRow.eachCell((cell) => {
      cell.font = {
        bold: true,
      };

      cell.border = {
        top: { style: "medium" },
        bottom: { style: "medium" },
      };
    });

    /* =========================
       FREEZE HEADER
    ========================= */

    sheet.views = [
      {
        state: "frozen",
        ySplit: 4,
      },
    ];

    const fileName =
      fromDate && toDate
        ? `PaymentOutReport_${fromDate}_to_${toDate}.xlsx`
        : `PaymentOutReport_${new Date()
            .toISOString()
            .slice(0, 10)}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName}"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Export Payment Out Excel Error:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};
// const getPaymentOutPrintReport = async (req, res, next) => {
//   let connection;

//   try {
//     connection = await db.getConnection();

//     const {
//       search = "",
//       fromDate,
//       toDate,
//     } = req.query;

//     const whereClauses = [];
//     const params = [];

//     if (search) {
//       const like = `%${search}%`;

//       whereClauses.push(`
//         (
//           a.Party_Name LIKE ?
//           OR po.Payment_Number LIKE ?
//           OR CAST(po.Paid AS CHAR) LIKE ?
//         )
//       `);

//       params.push(like, like, like);
//     }

//     if (fromDate && toDate) {
//       whereClauses.push(
//         `DATE(po.Payment_Date) BETWEEN ? AND ?`
//       );

//       params.push(fromDate, toDate);
//     } else if (fromDate) {
//       whereClauses.push(
//         `DATE(po.Payment_Date) >= ?`
//       );

//       params.push(fromDate);
//     } else if (toDate) {
//       whereClauses.push(
//         `DATE(po.Payment_Date) <= ?`
//       );

//       params.push(toDate);
//     }

//     const whereClause =
//       whereClauses.length > 0
//         ? `WHERE ${whereClauses.join(" AND ")}`
//         : "";

//     // ===========================
//     // HEADER
//     // ===========================

//     const [payments] =
//       await connection.query(
//         `
//         SELECT
//           po.*,

//           a.Party_Name,
//           a.GSTIN
         

          

//         FROM payment_out po

//         LEFT JOIN add_party a
//           ON a.Party_Id = po.Party_Id

//         LEFT JOIN add_party_addresses pa
//           ON pa.Party_Id = po.Party_Id
//          AND pa.Address_Type = 'Billing'
//          AND pa.Is_Default = 1

//         ${whereClause}

//         ORDER BY po.Payment_Date ASC
//         `,
//         params
//       );

//     if (!payments.length) {
//       return res.status(200).json({
//         success: true,
//         totalPayments: 0,
//         paymentOuts: [],
//         summary: {
//           totalPaid: 0,
//         },
//       });
//     }

//     const paymentIds = payments.map(
//       (p) => p.id
//     );

//     const placeholders =
//       paymentIds.map(() => "?").join(",");

//     // ===========================
//     // SPLITS
//     // ===========================

//     const [splits] =
//       await connection.query(
//         `
//         SELECT
//           ps.*,
//           ba.Account_Display_Name

//         FROM payment_splits ps

//         LEFT JOIN bank_accounts ba
//           ON ba.id = ps.Bank_Account_Id

//         WHERE ps.Source_Type='Payment_Out'
//         AND ps.Source_Id IN (${placeholders})

//         ORDER BY ps.id ASC
//         `,
//         paymentIds
//       );

//     const splitMap = {};

//     splits.forEach((split) => {
//       if (!splitMap[split.Source_Id]) {
//         splitMap[split.Source_Id] = [];
//       }

//       splitMap[split.Source_Id].push({
//         Id: split.id,
//         Payment_Type:
//           split.Payment_Type,
//         Bank_Account_Id:
//           split.Bank_Account_Id,
//         Account_Display_Name:
//           split.Account_Display_Name,
//         Reference_Number:
//           split.Reference_Number,
//         Amount: split.Amount,
//       });
//     });

//     // ===========================
//     // RESPONSE
//     // ===========================

//     const summary = {
//       totalPaid: 0,
//     };

//     const paymentOuts = payments.map(
//       (payment) => {
//         summary.totalPaid += Number(
//           payment.Paid || 0
//         );

//         return {
//           paymentOutDetails: {
//             id: payment.id,

//             Party_Name:
//               payment.Party_Name,

//             GSTIN: payment.GSTIN,

//             // Phone_Number:
//             //   payment.Phone_Number,

           

//             Payment_Number:
//               payment.Receipt_No,

//             Payment_Date:
//               payment.Payment_Date,

//             // Description:
//             //   payment.Description,

//             Paid:
//               payment.Paid,
//           },

//           splits:
//             splitMap[payment.id] || [],
//         };
//       }
//     );

//     return res.status(200).json({
//       success: true,
//       totalPayments:
//         paymentOuts.length,

//       paymentOuts,

//       summary: {
//         totalPaid: Number(
//           summary.totalPaid.toFixed(2)
//         ),
//       },
//     });
//   } catch (err) {
//     next(err);
//   } finally {
//     if (connection)
//       connection.release();
//   }
// };
const getPaymentOutPrintReport = async (
  req,
  res,
  next
) => {
  let connection;

  try {
    connection =
      await db.getConnection();

    const {
      search = "",
      fromDate,
      toDate,
    } = req.query;

    const whereClauses = [];
    const params = [];

    if (search) {
      const like = `%${search}%`;

      whereClauses.push(`
        (
          a.Party_Name LIKE ?
          OR po.Payment_Number LIKE ?
          OR CAST(po.Paid AS CHAR) LIKE ?
        )
      `);

      params.push(
        like,
        like,
        like
      );
    }

    if (fromDate && toDate) {
      whereClauses.push(
        `DATE(po.Payment_Date) BETWEEN ? AND ?`
      );

      params.push(
        fromDate,
        toDate
      );
    } else if (fromDate) {
      whereClauses.push(
        `DATE(po.Payment_Date) >= ?`
      );

      params.push(fromDate);
    } else if (toDate) {
      whereClauses.push(
        `DATE(po.Payment_Date) <= ?`
      );

      params.push(toDate);
    }

    const whereClause =
      whereClauses.length > 0
        ? `WHERE ${whereClauses.join(" AND ")}`
        : "";

    const {
      paymentOuts,
      summary,
    } = await getPaymentOutsForPrint(
      connection,
      whereClause,
      params
    );

    return res.status(200).json({
      success: true,
      totalPayments:
        paymentOuts.length,
      paymentOuts,
      summary,
    });
  } catch (err) {
    next(err);
  } finally {
    if (connection)
      connection.release();
  }
};
export { getAllPaymentOuts, getPaymentOutById, createPaymentOut, updatePaymentOut, deletePaymentOut,
   exportPaymentOutsReportToExcel,getPaymentOutPrintReport };