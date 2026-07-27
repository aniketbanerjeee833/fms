/* ═══════════════════════════════════════════════════════════════════
   1. SQL — run this once to create the table
═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS payment_out (
  
  Party_Id          VARCHAR(20)     NOT NULL,
  Receipt_No        VARCHAR(50)     DEFAULT NULL,
  Payment_Date      DATE            NOT NULL,
  Payment_Type      VARCHAR(50)     NOT NULL DEFAULT 'Cash',
  Paid            DECIMAL(12,2)   NOT NULL DEFAULT 0,
  Notes             TEXT            DEFAULT NULL,
  created_at        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (Party_Id) REFERENCES add_party(Party_Id)
);

-- Auto-increment ID helper (optional — or generate in Node like PAY-OUT-001)
-- If you prefer auto numeric PK, replace VARCHAR(20) with INT AUTO_INCREMENT


═══════════════════════════════════════════════════════════════════
   2. BACKEND CONTROLLERS  (paymentOutController.js)
═══════════════════════════════════════════════════════════════════ */
import db from "../config/db.js"; // mysql2/promise connection
import { recordBankTransaction } from "../utils/bankAccountHelper.js";


 
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
 
    const whereClauses = [];
    const params       = [];
 
    if (search) {
      whereClauses.push(`(
        LOWER(a.Party_Name)      LIKE ? OR
        LOWER(po.Payment_Type)   LIKE ? OR
        LOWER(po.Receipt_No)     LIKE ? OR
        LOWER(po.Reference_No)   LIKE ? OR
        CAST(po.Paid AS CHAR)    LIKE ?
      )`);
      const like = `%${search}%`;
      params.push(like, like, like, like, like);
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
 
    const [rows] = await connection.query(
      `SELECT po.*, a.Party_Name,
        ba.Account_Display_Name AS Bank_Display_Name,
        CASE
          WHEN po.Payment_Type = 'Bank'
          THEN ba.Account_Display_Name
          ELSE po.Payment_Type
        END AS Payment_Type_Display
       FROM payment_out po
       LEFT JOIN add_party a ON a.Party_Id = po.Party_Id
       LEFT JOIN bank_accounts ba ON ba.id = po.Bank_Account_Id
       ${whereSQL}
       ORDER BY po.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
 
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
      success:        true,
      currentPage:    page,
      totalPages:     Math.ceil(total / limit),
      totalPayments:  total,
      paymentOuts:    rows,
      totals,
    });
  } catch (err) {
    next(err);
  } finally {
    if (connection) connection.release();
  }
};
 
/* ── GET SINGLE ───────────────────────────────────────────── */
const getPaymentOutById = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();
    const { id } = req.params;
 
    const [[row]] = await connection.query(
      `SELECT po.*, a.Party_Name,
        ba.Account_Display_Name AS Bank_Display_Name,
        CASE
          WHEN po.Payment_Type = 'Bank'
          THEN ba.Account_Display_Name
          ELSE po.Payment_Type
        END AS Payment_Type_Display
       FROM payment_out po
       LEFT JOIN add_party a ON a.Party_Id = po.Party_Id
       LEFT JOIN bank_accounts ba ON ba.id = po.Bank_Account_Id
       WHERE po.id = ?`,
      [id]
    );
 
    if (!row) return res.status(404).json({ success: false, message: "Payment Out not found" });
 
    return res.status(200).json({ success: true, paymentOut: row });
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
      Party_Name,       // needed by recordBankTransaction for the ledger row
      Receipt_No,
      Payment_Date,
      Payment_Type,
      Reference_No,
      Bank_Account_Id,  // required only when Payment_Type === "Bank"
      Paid,
    } = req.body;
 
    if (!Party_Id || !Payment_Date || !Payment_Type || !Paid) {
      return res.status(400).json({ success: false, message: "Party, Date, Payment Type and Paid are required" });
    }
 
    if (isNaN(Paid) || Number(Paid) <= 0) {
      return res.status(400).json({ success: false, message: "Paid amount must be greater than 0" });
    }
 
    if (Payment_Type === "Bank" && !Bank_Account_Id) {
      return res.status(400).json({ success: false, message: "Bank account is required when Payment Type is Bank" });
    }
 
    await connection.beginTransaction();
 
    const [result] = await connection.query(
      `INSERT INTO payment_out
         (Party_Id, Receipt_No, Payment_Date, Payment_Type, Reference_No, Bank_Account_Id, Paid)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        Party_Id,
        Receipt_No || null,
        Payment_Date,
        Payment_Type,
        Reference_No || null,
        Payment_Type === "Bank" ? Bank_Account_Id : null,
        Number(Paid),
      ]
    );
 
    const Payment_Out_Id = result.insertId;
 
    // Payment_Out is not in CREDIT_TYPES inside recordBankTransaction, so it's
    // correctly posted as a Debit (money leaving the bank account).
    await recordBankTransaction({
      connection,
      bankAccountId: Payment_Type === "Bank" ? Bank_Account_Id : null,
      txnType: "Payment_Out",
      referenceId: Payment_Out_Id,
      partyName: Party_Name,
      amount: Number(Paid),
      txnDate: Payment_Date,
    });
 
    await connection.commit();
 
    return res.status(201).json({
      success: true,
      message: "Payment Out created",
      Payment_Out_Id,
    });
  } catch (err) {
    if (connection) await connection.rollback();
    next(err);
  } finally {
    if (connection) connection.release();
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
      Payment_Type,
      Reference_No,
      Bank_Account_Id,
      Paid,
    } = req.body;
 
    if (!Party_Id || !Payment_Date || !Payment_Type || !Paid) {
      return res.status(400).json({ success: false, message: "Party, Date, Payment Type and Paid are required" });
    }
 
    if (isNaN(Paid) || Number(Paid) <= 0) {
      return res.status(400).json({ success: false, message: "Paid amount must be greater than 0" });
    }
 
    if (Payment_Type === "Bank" && !Bank_Account_Id) {
      return res.status(400).json({ success: false, message: "Bank account is required when Payment Type is Bank" });
    }
 
    await connection.beginTransaction();
 
    await connection.query(
      `UPDATE payment_out
       SET Party_Id = ?, Receipt_No = ?, Payment_Date = ?,
           Payment_Type = ?, Reference_No = ?, Bank_Account_Id = ?, Paid = ?
       WHERE id = ?`,
      [
        Party_Id,
        Receipt_No || null,
        Payment_Date,
        Payment_Type,
        Reference_No || null,
        Payment_Type === "Bank" ? Bank_Account_Id : null,
        Number(Paid),
        id,
      ]
    );
 
    await recordBankTransaction({
      connection,
      bankAccountId: Payment_Type === "Bank" ? Bank_Account_Id : null,
      txnType: "Payment_Out",
      referenceId: id,
      partyName: Party_Name,
      amount: Number(Paid),
      txnDate: Payment_Date,
    });
 
    await connection.commit();
 
    return res.status(200).json({ success: true, message: "Payment Out updated" });
  } catch (err) {
    if (connection) await connection.rollback();
    next(err);
  } finally {
    if (connection) connection.release();
  }
};
 
/* ── DELETE ───────────────────────────────────────────────── */
// const deletePaymentOut = async (req, res, next) => {
//   let connection;
//   try {
//     connection = await db.getConnection();
//     await connection.query(`DELETE FROM payment_out WHERE Payment_Out_Id = ?`, [req.params.id]);
//     return res.status(200).json({ success: true, message: "Payment Out deleted" });
//   } catch (err) {
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };

export { getAllPaymentOuts, getPaymentOutById, createPaymentOut, updatePaymentOut };


/* ═══════════════════════════════════════════════════════════════════
   3. ROUTES  (paymentOutRoutes.js)
═══════════════════════════════════════════════════════════════════

const express  = require("express");
const router   = express.Router();
const {
  getAllPaymentOuts,
  getPaymentOutById,
  createPaymentOut,
  updatePaymentOut,
  deletePaymentOut,
} = require("../controllers/paymentOutController");

router.get("/",          getAllPaymentOuts);
router.get("/:id",       getPaymentOutById);
router.post("/",         createPaymentOut);
router.put("/:id",       updatePaymentOut);
router.delete("/:id",    deletePaymentOut);

module.exports = router;

// In app.js / index.js:
// app.use("/api/payment-out", require("./routes/paymentOutRoutes"));

═══════════════════════════════════════════════════════════════════ */