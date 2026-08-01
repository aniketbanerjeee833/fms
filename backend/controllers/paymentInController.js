import db from "../config/db.js"; // mysql2/promise connection
import { recordBankTransaction } from "../utils/bankAccountHelper.js";
import { recordCashTransaction } from "../utils/cashTransactionHelper.js";
import { recordPartyLedger } from "../utils/partyLedgerHelper.js";
import { deletePaymentSplits, insertPaymentSplits, validateSplits } from "../utils/paymentSplitHelper.js";
import { validateDateRange } from "../utils/validateDate.js";

// CREATE TABLE IF NOT EXISTS payment_in (

//   Id                INT AUTO_INCREMENT PRIMARY KEY,
//   Party_Id          VARCHAR(255)     NOT NULL,
//   Receipt_No        VARCHAR(255)     DEFAULT NULL,
//   Payment_Date      DATE            NOT NULL,
//   Payment_Type      VARCHAR(255)     NOT NULL DEFAULT 'Cash',
//   Reference_No      VARCHAR(255)     DEFAULT NULL,
//   Received          DECIMAL(10,2)   NOT NULL DEFAULT 0,

//   created_at        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
//   updated_at        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//   FOREIGN KEY (Party_Id) REFERENCES add_party(Party_Id)
// );
// CREATE TABLE payment_splits (
//   id                INT AUTO_INCREMENT PRIMARY KEY,
//   Source_Type       ENUM('Sale','Purchase','Payment_In','Payment_Out','Sale_Return','Purchase_Return','Expense') NOT NULL,
//   Source_Id         INT NOT NULL,              -- numeric id of parent row (e.g. payment_in.Id)
//   Payment_Type      ENUM('Cash','Cheque','Neft','Bank') NOT NULL,
//   Bank_Account_Id   INT NULL,                  -- required only when Payment_Type = 'Bank'
//   Reference_Number  VARCHAR(100) NULL,         -- required for Cheque/Neft, optional for Bank
//   Amount            DECIMAL(14,2) NOT NULL,
//   created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//   updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//   FOREIGN KEY (Bank_Account_Id) REFERENCES bank_accounts(Bank_Account_Id)
// )
/* ── CREATE ─────────────────────────────────────────────── */
const createPaymentIn = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();

    const { Party_Id, Party_Name, Receipt_No, Payment_Date, splits } = req.body;

    if (!Party_Id || !Payment_Date) {
      return res.status(400).json({ success: false, message: "Party and Date are required" });
    }

    if (!Array.isArray(splits) || splits.length === 0) {
      return res.status(400).json({ success: false, message: "At least one payment split is required" });
    }

    // Received// Received always derived from splits — never trusted from frontend
    const totalReceived = splits.reduce((sum, s) => sum + (Number(s.Amount) || 0), 0);

    if (isNaN(totalReceived) || totalReceived < 0) {
      return res.status(400).json({ success: false, message: "Received amount must be a valid number" });
    }

    try {
      validateSplits(splits, totalReceived);
      // validateSplits(splits);
    } catch (validationErr) {
      return res.status(400).json({ success: false, message: validationErr.message });
    }

    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO payment_in (Party_Id, Receipt_No, Payment_Date, Received)
       VALUES (?, ?, ?, ?)`,
      [Party_Id, Receipt_No || null, Payment_Date, totalReceived]
    );

    const id = result.insertId;

    await insertPaymentSplits({
      connection,
      sourceType: "Payment_In",
      sourceId: id,
      partyName: Party_Name,
      txnDate: Payment_Date,
      splits,
    });

    await recordPartyLedger({
  connection,
  partyId: Party_Id,
  txnType: "Payment_In",
  referenceId: id,
  amount: totalReceived,
  txnDate: Payment_Date,
  docNumber: Receipt_No,
  balanceDue: null,
});

    await connection.commit();
    return res.status(201).json({ success: true, message: "Payment In created", id, totalReceived });
  } catch (err) {
    if (connection) await connection.rollback();
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

/* ── UPDATE ─────────────────────────────────────────────── */
const updatePaymentIn = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();

    const { id } = req.params;
    const { Party_Id, Party_Name, Receipt_No, Payment_Date, splits } = req.body;

    if (!Party_Id || !Payment_Date) {
      return res.status(400).json({ success: false, message: "Party and Date are required" });
    }

    if (!Array.isArray(splits) || splits.length === 0) {
      return res.status(400).json({ success: false, message: "At least one payment split is required" });
    }

    // always recalculate from splits — ignore any Received sent from frontend
    const totalReceived = splits.reduce((sum, s) => sum + (Number(s.Amount) || 0), 0);

    if (isNaN(totalReceived) || totalReceived < 0) {
      return res.status(400).json({ success: false, message: "Received amount must be a valid number" });
    }

    try {
      validateSplits(splits);
    } catch (validationErr) {
      return res.status(400).json({ success: false, message: validationErr.message });
    }

    // check record exists
    const [[existing]] = await connection.query(
      `SELECT Id FROM payment_in WHERE Id = ?`, [id]
    );
    if (!existing) {
      return res.status(404).json({ success: false, message: "Payment In not found" });
    }

    await connection.beginTransaction();

    // update header row — Received recalculated from splits
    await connection.query(
      `UPDATE payment_in
       SET Party_Id = ?, Receipt_No = ?, Payment_Date = ?, Received = ?, updated_at = NOW()
       WHERE Id = ?`,
      [Party_Id, Receipt_No || null, Payment_Date, totalReceived, id]
    );

    // wipe old splits + reverse their cash/bank ledger entries, then reinsert fresh
    await deletePaymentSplits({ connection, sourceType: "Payment_In", sourceId: id });

    await insertPaymentSplits({
      connection,
      sourceType: "Payment_In",
      sourceId: id,
      partyName: Party_Name,
      txnDate: Payment_Date,
      splits,
    });
    await recordPartyLedger({
  connection,
  partyId: Party_Id,
  txnType: "Payment_In",
  referenceId: id,
  amount: totalReceived,
  txnDate: Payment_Date,
  docNumber: Receipt_No,
  balanceDue: null,
});

    await connection.commit();
    return res.status(200).json({ success: true, message: "Payment In updated", totalReceived });
  } catch (err) {
    if (connection) await connection.rollback();
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

/* ── GET ALL ─────────────────────────────────────────────── */
const getAllPaymentIns = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();

    const page = parseInt(req.query.page, 10) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const search = req.query.search?.trim().toLowerCase() || "";
    const fromDate = req.query.fromDate || null;
    const toDate = req.query.toDate || null;

     const dateError = validateDateRange(fromDate, toDate);
    if (dateError) return res.status(400).json({ success: false, message: dateError });


    const whereClauses = [];
    const params = [];

    // if (search) {
    //   whereClauses.push(`(
    //     LOWER(a.Party_Name)       LIKE ? OR
    //     LOWER(pi.Receipt_No)      LIKE ? OR
    //     CAST(pi.Received AS CHAR) LIKE ?
    //   )`);
    //   const like = `%${search}%`;
    //   params.push(like, like, like);
    // }

     if (search) {
      whereClauses.push(`(
        a.Party_Name       LIKE ? OR
        pi.Receipt_No      LIKE ? OR
        CAST(pi.Received AS CHAR) LIKE ?
      )`);
      const like = `%${search}%`;
      params.push(like, like, like);
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

    // main list — no Payment_Type column anymore, splits carry that detail
    const [rows] = await connection.query(
      `SELECT pi.*, a.Party_Name
       FROM payment_in pi
       LEFT JOIN add_party a ON a.Party_Id = pi.Party_Id
       ${whereSQL}
       ORDER BY pi.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // attach split payment-type labels per row
    const paymentIds = rows.map((r) => r.id);

    if (paymentIds.length > 0) {
      const placeholders = paymentIds.map(() => "?").join(",");
      //       const [splits] = await connection.query(
      //         `SELECT ps.Source_Id, ps.Payment_Type, ba.Account_Display_Name
      //          FROM payment_splits ps
      //          LEFT JOIN bank_accounts ba ON ba.id = ps.Bank_Account_Id
      //          WHERE ps.Source_Type = 'Payment_In'
      //            AND ps.Source_Id IN (${placeholders})`,
      //         paymentIds
      //       );

      //       const splitMap = {};
      //       for (const s of splits) {
      //         if (!splitMap[s.Source_Id]) splitMap[s.Source_Id] = [];
      //         splitMap[s.Source_Id].push(
      //           s.Payment_Type === "Bank" ? s.Account_Display_Name : s.Payment_Type
      //         );
      //       }

      //      for (const row of rows) {
      //   const labels = splitMap[row.id] || [];

      //   const counts = {};
      //   labels.forEach((l) => {
      //     counts[l] = (counts[l] || 0) + 1;
      //   });

      //   row.Payment_Type_Display = Object.entries(counts)
      //     .map(([label, count]) =>
      //       count > 1 ? `${label} (x${count})` : label
      //     )
      //     .join(", ") || "—";
      // }
      const [splits] = await connection.query(
        `SELECT
      ps.Source_Id,
      ps.Payment_Type,
      ps.Bank_Account_Id,
      ps.Reference_Number,
      ps.Amount,
      ba.Account_Display_Name
   FROM payment_splits ps
   LEFT JOIN bank_accounts ba
      ON ba.id = ps.Bank_Account_Id
   WHERE ps.Source_Type = 'Payment_In'
     AND ps.Source_Id IN (${placeholders})`,
        paymentIds
      );

      const splitMap = {};

      for (const split of splits) {
        if (!splitMap[split.Source_Id]) {
          splitMap[split.Source_Id] = [];
        }

        splitMap[split.Source_Id].push({
          Payment_Type: split.Payment_Type,
          Bank_Account_Id: split.Bank_Account_Id,
          Reference_Number: split.Reference_Number,
          Amount: Number(split.Amount),

          // for displaying only
          Bank_Display_Name: split.Account_Display_Name,
        });
      }

      for (const row of rows) {
        row.splits = splitMap[row.id] || [];

        row.Payment_Type_Display = row.splits
          .map((s) =>
            s.Payment_Type === "Bank"
              ? s.Bank_Display_Name
              : s.Payment_Type
          )
          .join(", ") || "—";
      }
    }

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
      success: true,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPayments: total,
      paymentIns: rows,
      totals,
    });
  } catch (err) {
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

/* ── GET SINGLE ──────────────────────────────────────────── */
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

    const [splits] = await connection.query(
      `SELECT ps.*, ba.Account_Display_Name
       FROM payment_splits ps
       LEFT JOIN bank_accounts ba ON ba.id = ps.Bank_Account_Id
       WHERE ps.Source_Type = 'Payment_In' AND ps.Source_Id = ?
       ORDER BY ps.id ASC`,
      [id]
    );

    return res.status(200).json({ success: true, paymentIn: { ...row, splits } });
  } catch (err) {
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

export { getAllPaymentIns, getPaymentInById, createPaymentIn, updatePaymentIn };



