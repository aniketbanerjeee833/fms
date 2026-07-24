/* ═══════════════════════════════════════════════════════════════════
   1. SQL — run this once to create the table
═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS payment_in (

  Id                INT AUTO_INCREMENT PRIMARY KEY,
  Party_Id          VARCHAR(20)     NOT NULL,
  Receipt_No        VARCHAR(50)     DEFAULT NULL,
  Payment_Date      DATE            NOT NULL,
  Payment_Type      VARCHAR(50)     NOT NULL DEFAULT 'Cash',
  Reference_No      VARCHAR(50)     DEFAULT NULL,
  Received          DECIMAL(12,2)   NOT NULL DEFAULT 0,
  Notes             TEXT            DEFAULT NULL,
  created_at        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (Party_Id) REFERENCES add_party(Party_Id)
);


═══════════════════════════════════════════════════════════════════
   2. BACKEND CONTROLLERS  (paymentInController.js)
═══════════════════════════════════════════════════════════════════ */
import db from "../config/db.js"; // mysql2/promise connection


/* ── GET ALL ──────────────────────────────────────────────── */
const getAllPaymentIns = async (req, res, next) => {
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
        LOWER(a.Party_Name)       LIKE ? OR
        LOWER(pi.Payment_Type)    LIKE ? OR
        LOWER(pi.Receipt_No)      LIKE ? OR
        LOWER(pi.Reference_No)    LIKE ? OR
        CAST(pi.Received AS CHAR) LIKE ?
      )`);
      const like = `%${search}%`;
      params.push(like, like, like, like, like);
    }

    if (fromDate && toDate) {
      whereClauses.push(`DATE(pi.Payment_Date) BETWEEN ? AND ?`);
      params.push(fromDate, toDate);
    } else if (fromDate) {
      whereClauses.push(`DATE(pi.Payment_Date) >= ?`);
      params.push(fromDate);
    } else if (toDate) {
      whereClauses.push(`DATE(pi.Payment_Date) <= ?`);
      params.push(toDate);
    }

    const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const [rows] = await connection.query(
      `SELECT pi.*, a.Party_Name
       FROM payment_in pi
       LEFT JOIN add_party a ON a.Party_Id = pi.Party_Id
       ${whereSQL}
       ORDER BY pi.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[{ total }]] = await connection.query(
      `SELECT COUNT(*) AS total
       FROM payment_in pi
       LEFT JOIN add_party a ON a.Party_Id = pi.Party_Id
       ${whereSQL}`,
      params
    );

    const [[totals]] = await connection.query(
      `SELECT COALESCE(SUM(pi.Received), 0) AS totalReceived
       FROM payment_in pi
       LEFT JOIN add_party a ON a.Party_Id = pi.Party_Id
       ${whereSQL}`,
      params
    );

    return res.status(200).json({
      success:        true,
      currentPage:    page,
      totalPages:     Math.ceil(total / limit),
      totalPayments:  total,
      paymentIns:     rows,
      totals,
    });
  } catch (err) {
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

/* ── GET SINGLE ───────────────────────────────────────────── */
const getPaymentInById = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();
    const { id } = req.params;

    const [[row]] = await connection.query(
      `SELECT pi.*, a.Party_Name
       FROM payment_in pi
       LEFT JOIN add_party a ON a.Party_Id = pi.Party_Id
       WHERE pi.Id = ?`,
      [id]
    );

    if (!row) return res.status(404).json({ success: false, message: "Payment In not found" });

    return res.status(200).json({ success: true, paymentIn: row });
  } catch (err) {
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

/* ── CREATE ───────────────────────────────────────────────── */
const createPaymentIn = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();

    const { Party_Id, Receipt_No, Payment_Date, Payment_Type, Reference_No, Received } = req.body;

    if (!Party_Id || !Payment_Date || !Payment_Type || !Received) {
      return res.status(400).json({ success: false, message: "Party, Date, Payment Type and Received are required" });
    }

    const [result] = await connection.query(
      `INSERT INTO payment_in
         (Party_Id, Receipt_No, Payment_Date, Payment_Type, Reference_No, Received)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [Party_Id, Receipt_No || null, Payment_Date, Payment_Type, Reference_No || null, Number(Received)]
    );

    return res.status(201).json({
      success: true,
      message: "Payment In created",
      Id: result.insertId,
    });
  } catch (err) {
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

/* ── UPDATE ───────────────────────────────────────────────── */
const updatePaymentIn = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();
    const { id } = req.params;
    const { Party_Id, Receipt_No, Payment_Date, Payment_Type, Reference_No, Received } = req.body;

    if (!Party_Id || !Payment_Date || !Payment_Type || !Received) {
      return res.status(400).json({ success: false, message: "Party, Date, Payment Type and Received are required" });
    }

    await connection.query(
      `UPDATE payment_in
       SET Party_Id = ?, Receipt_No = ?, Payment_Date = ?,
           Payment_Type = ?, Reference_No = ?, Received = ?
       WHERE Id = ?`,
      [Party_Id, Receipt_No || null, Payment_Date, Payment_Type, Reference_No || null, Number(Received), id]
    );

    return res.status(200).json({ success: true, message: "Payment In updated" });
  } catch (err) {
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

/* ── DELETE ───────────────────────────────────────────────── */
// const deletePaymentIn = async (req, res, next) => {
//   let connection;
//   try {
//     connection = await db.getConnection();
//     await connection.query(`DELETE FROM payment_in WHERE Id = ?`, [req.params.id]);
//     return res.status(200).json({ success: true, message: "Payment In deleted" });
//   } catch (err) {
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };

export { getAllPaymentIns, getPaymentInById, createPaymentIn, updatePaymentIn };


/* ═══════════════════════════════════════════════════════════════════
   3. ROUTES  (paymentInRoutes.js)
═══════════════════════════════════════════════════════════════════

const express  = require("express");
const router   = express.Router();
const {
  getAllPaymentIns,
  getPaymentInById,
  createPaymentIn,
  updatePaymentIn,
  deletePaymentIn,
} = require("../controllers/paymentInController");

router.get("/",          getAllPaymentIns);
router.get("/:id",       getPaymentInById);
router.post("/",         createPaymentIn);
router.put("/:id",       updatePaymentIn);
router.delete("/:id",    deletePaymentIn);

module.exports = router;

// In app.js / index.js:
// app.use("/api/payment-in", require("./routes/paymentInRoutes"));

═══════════════════════════════════════════════════════════════════ */