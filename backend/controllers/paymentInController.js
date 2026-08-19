import db from "../config/db.js"; // mysql2/promise connection
import { recordBankTransaction } from "../utils/bankAccountHelper.js";
import { recordCashTransaction } from "../utils/cashTransactionHelper.js";
import { recordPartyLedger, reversePartyLedger } from "../utils/partyLedgerHelper.js";
import { deletePaymentSplits, insertPaymentSplits, validateSplits } from "../utils/paymentSplitHelper.js";
import { validateDateRange } from "../utils/validateDate.js";
import ExcelJS from "exceljs";

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

    const {
      Party_Id,
      Party_Name,
      Receipt_No,
      Payment_Date,
      splits,
    } = req.body;

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
    // 1. NORMALIZE VALID PAYMENT METHODS
    // =====================================================

    const normalizedSplits = (splits || [])
      .filter((split) => {
        // Must have payment type
        if (!split.Payment_Type) {
          return false;
        }

        // Bank must have account selected
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
    // 2. PAYMENT SPLIT RULE
    //
    // First valid method:
    //   keep even when amount = 0
    //
    // Later methods:
    //   keep only when amount > 0
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
    // 3. TOTAL RECEIVED
    // =====================================================

    const totalReceived = validSplits.reduce(
      (sum, split) =>
        sum + (Number(split.Amount) || 0),
      0
    );

    // =====================================================
    // 4. VALIDATE ONLY THE SURVIVING SPLITS
    // =====================================================

    try {
      validateSplits(
        validSplits,
        totalReceived
      );
    } catch (validationErr) {
      return res.status(400).json({
        success: false,
        message: validationErr.message,
      });
    }

    // =====================================================
    // 5. BEGIN TRANSACTION
    // =====================================================

    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO payment_in
       (
         Party_Id,
         Receipt_No,
         Payment_Date,
         financial_year,
         Received
       )
       VALUES (?, ?, ?, ?, ?)`,
      [
        Party_Id,
        Receipt_No || null,
        Payment_Date,
        activeFY,
        totalReceived,

      ]
    );

    const id = result.insertId;

    // =====================================================
    // 6. INSERT ONLY VALID SPLITS
    // =====================================================

    await insertPaymentSplits({
      connection,
      sourceType: "Payment_In",
      sourceId: id,
      partyName: Party_Name,
      txnDate: Payment_Date,

      // IMPORTANT
      splits: validSplits,
    });

    // =====================================================
    // 7. PARTY LEDGER
    // =====================================================

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

    return res.status(201).json({
      success: true,
      message: "Payment In created",
      id,
      totalReceived,
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
// const createPaymentIn = async (req, res, next) => {
//   let connection;
//   try {
//     connection = await db.getConnection();

//     const { Party_Id, Party_Name, Receipt_No, Payment_Date, splits } = req.body;

//     if (!Party_Id || !Payment_Date) {
//       return res.status(400).json({ success: false, message: "Party and Date are required" });
//     }

//     if (!Array.isArray(splits) || splits.length === 0) {
//       return res.status(400).json({ success: false, message: "At least one payment split is required" });
//     }

//     // Received// Received always derived from splits — never trusted from frontend
//     const totalReceived = splits.reduce((sum, s) => sum + (Number(s.Amount) || 0), 0);

//     if (isNaN(totalReceived) || totalReceived < 0) {
//       return res.status(400).json({ success: false, message: "Received amount must be a valid number" });
//     }

//     try {
//       validateSplits(splits, totalReceived);
//       // validateSplits(splits);
//     } catch (validationErr) {
//       return res.status(400).json({ success: false, message: validationErr.message });
//     }

//     await connection.beginTransaction();

//     const [result] = await connection.query(
//       `INSERT INTO payment_in (Party_Id, Receipt_No, Payment_Date, Received)
//        VALUES (?, ?, ?, ?)`,
//       [Party_Id, Receipt_No || null, Payment_Date, totalReceived]
//     );

//     const id = result.insertId;

//     await insertPaymentSplits({
//       connection,
//       sourceType: "Payment_In",
//       sourceId: id,
//       partyName: Party_Name,
//       txnDate: Payment_Date,
//       splits,
//     });

//     await recordPartyLedger({
//   connection,
//   partyId: Party_Id,
//   txnType: "Payment_In",
//   referenceId: id,
//   amount: totalReceived,
//   txnDate: Payment_Date,
//   docNumber: Receipt_No,
//   balanceDue: null,
// });

//     await connection.commit();
//     return res.status(201).json({ success: true, message: "Payment In created", id, totalReceived });
//   } catch (err) {
//     if (connection) await connection.rollback();
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };
 const deletePaymentIn = async (req, res, next) => {
  let connection;

  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Payment In ID is required.",
      });
    }

    connection = await db.getConnection();

    await connection.beginTransaction();

    // =========================================================
    // 1. GET PAYMENT IN
    // =========================================================

    const [[paymentIn]] = await connection.query(
      `
      SELECT
        id,
        Party_Id,
        Receipt_No,
        Payment_Date,
        Received
      FROM payment_in
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (!paymentIn) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Payment In not found.",
      });
    }

    const paymentInId = paymentIn.id;

    // =========================================================
    // 2. DELETE PAYMENT SPLITS
    //
    // payment_splits.Source_Id = payment_in.id
    // Source_Type = Payment_In
    // =========================================================

    await deletePaymentSplits({
      connection,
      sourceType: "Payment_In",
      sourceId: paymentInId,
    });

    // =========================================================
    // 3. REVERSE PARTY LEDGER
    //
    // party_ledger.Source_Id = payment_in.id
    // Txn_Type = Payment_In
    //
    // Opening Balance is NOT touched.
    // =========================================================

    await reversePartyLedger({
      connection,
      partyId: paymentIn.Party_Id,
      txnType: "Payment_In",
      referenceId: paymentInId,
    });

    // =========================================================
    // 4. DELETE PAYMENT IN HEADER
    // =========================================================

    await connection.query(
      `
      DELETE FROM payment_in
      WHERE id = ?
      `,
      [paymentInId]
    );

    // =========================================================
    // 5. COMMIT
    // =========================================================

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Payment In deleted successfully.",
      Payment_In_Id: paymentInId,
    });

  } catch (err) {

    if (connection) {
      await connection.rollback();
    }

    console.error(
      "❌ Error deleting Payment In:",
      err
    );

    next(err);

  } finally {

    if (connection) {
      connection.release();
    }
  }
};
/* ── UPDATE ─────────────────────────────────────────────── */
const updatePaymentIn = async (req, res, next) => {
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

    if (!Array.isArray(splits) || splits.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one payment split is required",
      });
    }

    // =====================================================
    // 2. NORMALIZE SPLITS
    //
    // ""       -> 0
    // "0"      -> 0
    // "0.00"   -> 0
    // "500"    -> 500
    //
    // Also remove invalid payment selections.
    // =====================================================

    const normalizedSplits = splits
      .filter((split) => {
        // No payment type selected
        if (!split.Payment_Type) {
          return false;
        }

        // Bank selected but no bank account selected
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
    // 3. APPLY YOUR SPLIT RULE
    //
    // First valid split:
    //     KEEP even if Amount = 0
    //
    // Middle/last:
    //     KEEP only if Amount > 0
    //
    // Example:
    //
    // Cash  0      -> KEEP
    // HDFC  0      -> DROP
    // ANCO  500    -> KEEP
    // SBI   0      -> DROP
    // ICICI 200    -> KEEP
    // =====================================================

    const validSplits = normalizedSplits.filter(
      (split, index) => {
        // First valid payment method always survives
        if (index === 0) {
          return true;
        }

        // Later payment methods need positive amount
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
    // 4. TOTAL RECEIVED
    //
    // IMPORTANT:
    // Calculate from validSplits, NOT original splits.
    // =====================================================

    const totalReceived = validSplits.reduce(
      (sum, split) => sum + split.Amount,
      0
    );

    // =====================================================
    // 5. VALIDATE SURVIVING SPLITS
    // =====================================================

    try {
      validateSplits(
        validSplits,
        totalReceived
      );
    } catch (validationErr) {
      return res.status(400).json({
        success: false,
        message: validationErr.message,
      });
    }

    // =====================================================
    // 6. CHECK PAYMENT EXISTS
    // =====================================================

    const [[existing]] = await connection.query(
      `SELECT Id,financial_year
       FROM payment_in
       WHERE Id = ?`,
      [id]
    );

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Payment In not found",
      });
    }

    // =====================================================
    // 7. START TRANSACTION
    // =====================================================

    await connection.beginTransaction();

    // =====================================================
    // 8. UPDATE PAYMENT HEADER
    // =====================================================

    await connection.query(
      `UPDATE payment_in
       SET
         Party_Id = ?,
         Receipt_No = ?,
         Payment_Date = ?,
         Received = ?,
         updated_at = NOW()
       WHERE Id = ?`,
      [
        Party_Id,
        Receipt_No || null,
        Payment_Date,
        totalReceived,
        id,
      ]
    );

    // =====================================================
    // 9. DELETE OLD SPLITS + LEDGER ENTRIES
    // =====================================================

    await deletePaymentSplits({
      connection,
      sourceType: "Payment_In",
      sourceId: id,
    });

    // =====================================================
    // 10. INSERT ONLY VALID SPLITS
    //
    // IMPORTANT:
    // splits: validSplits
    // NOT:
    // splits
    // =====================================================

    await insertPaymentSplits({
      connection,
      sourceType: "Payment_In",
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
      txnType: "Payment_In",
      referenceId: id,
      amount: totalReceived,
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
      message: "Payment In updated",
      totalReceived,
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

    // const [[row]] = await connection.query(
    //   `SELECT pi.*, a.Party_Name
    //    FROM payment_in pi
    //    LEFT JOIN add_party a ON a.Party_Id = pi.Party_Id
    //    WHERE pi.Id = ?`,
    //   [id]
    // );
    const [[row]] = await connection.query(
  `
  SELECT
    pi.*,

    a.Party_Name,
    a.GSTIN,
    a.Phone_Number,
    a.State,

    pa.Address_Text AS Billing_Address

  FROM payment_in pi

  LEFT JOIN add_party a
    ON a.Party_Id = pi.Party_Id

  LEFT JOIN add_party_addresses pa
    ON pa.Party_Id = pi.Party_Id
    AND pa.Address_Type = 'Billing'
    AND pa.Is_Default = 1

  WHERE pi.id = ?
  `,
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
const exportPaymentInsReportToExcel = async (req, res, next) => {
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
          OR pi.Receipt_No LIKE ?
          OR CAST(pi.Received AS CHAR) LIKE ?
        )
      `);

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

    const whereSQL =
      whereClauses.length > 0
        ? `WHERE ${whereClauses.join(" AND ")}`
        : "";

    const [rows] = await connection.query(
      `
      SELECT
        pi.*,
        a.Party_Name
      FROM payment_in pi
      LEFT JOIN add_party a
        ON a.Party_Id = pi.Party_Id
      ${whereSQL}
      ORDER BY pi.Payment_Date DESC
      `,
      params
    );

    /* =========================
       LOAD PAYMENT SPLITS
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
        WHERE ps.Source_Type = 'Payment_In'
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

    /* =========================
       EXCEL
    ========================= */

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Payment In Report");

    sheet.columns = [
      { width: 15 }, // Date
      { width: 20 }, // Receipt No
      { width: 35 }, // Party Name
      { width: 25 }, // Payment Type
      { width: 18 }, // Received Amount
    ];

    sheet.mergeCells("A1:E1");

    const titleCell = sheet.getCell("A1");
    titleCell.value = "PAYMENT IN REPORT";
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

    const headerRow = sheet.addRow([
      "Date",
      "Receipt No",
      "Party Name",
      "Payment Type",
      "Received Amount",
    ]);

    headerRow.eachCell((cell) => {
      cell.font = { bold: true };

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

    rows.forEach((payment) => {
      const row = sheet.addRow([
        payment.Payment_Date
          ? new Date(payment.Payment_Date).toLocaleDateString("en-IN")
          : "",

        payment.Receipt_No || "",

        payment.Party_Name || "",

        payment.Payment_Type_Display || "",

        Number(payment.Received || 0),
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
      cell.font = { bold: true };

      cell.border = {
        top: { style: "medium" },
        bottom: { style: "medium" },
      };
    });

    sheet.views = [
      {
        state: "frozen",
        ySplit: 4,
      },
    ];

    const fileName =
      fromDate && toDate
        ? `PaymentInReport_${fromDate}_to_${toDate}.xlsx`
        : `PaymentInReport_${new Date()
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
    console.error("Export Payment In Excel Error:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};
const getPaymentInPrintReport = async (req,res,next) => {
  let connection;

  try {
    connection = await db.getConnection();

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
          OR pi.Receipt_No LIKE ?
          OR CAST(pi.Received AS CHAR) LIKE ?
        )
      `);

      params.push(like, like, like);
    }

    if (fromDate && toDate) {
      whereClauses.push(
        `DATE(pi.Payment_Date) BETWEEN ? AND ?`
      );

      params.push(fromDate, toDate);
    } else if (fromDate) {
      whereClauses.push(
        `DATE(pi.Payment_Date) >= ?`
      );

      params.push(fromDate);
    } else if (toDate) {
      whereClauses.push(
        `DATE(pi.Payment_Date) <= ?`
      );

      params.push(toDate);
    }

    const whereClause =
      whereClauses.length > 0
        ? `WHERE ${whereClauses.join(" AND ")}`
        : "";

    // ===========================
    // HEADER
    // ===========================

    const [payments] =
      await connection.query(
        `
      SELECT
        pi.*,

        a.Party_Name,
        a.GSTIN
       

       

      FROM payment_in pi

      LEFT JOIN add_party a
        ON a.Party_Id = pi.Party_Id

      LEFT JOIN add_party_addresses pa
        ON pa.Party_Id = pi.Party_Id
       AND pa.Address_Type='Billing'
       AND pa.Is_Default=1

      ${whereClause}

      ORDER BY pi.Payment_Date ASC
      `,
        params
      );

    if (!payments.length) {
      return res.status(200).json({
        success: true,
        totalPayments: 0,
        paymentIns: [],
        summary: {
          totalReceived: 0,
        },
      });
    }

    const paymentIds = payments.map(
      (p) => p.id
    );

    const placeholders =
      paymentIds.map(() => "?").join(",");

    // ===========================
    // SPLITS
    // ===========================

    const [splits] =
      await connection.query(
        `
      SELECT
        ps.*,
        ba.Account_Display_Name

      FROM payment_splits ps

      LEFT JOIN bank_accounts ba
        ON ba.id = ps.Bank_Account_Id

      WHERE ps.Source_Type='Payment_In'
      AND ps.Source_Id IN (${placeholders})

      ORDER BY ps.id ASC
      `,
        paymentIds
      );

    const splitMap = {};

    splits.forEach((split) => {
      if (!splitMap[split.Source_Id]) {
        splitMap[split.Source_Id] = [];
      }

      splitMap[split.Source_Id].push({
        Id: split.id,
        Payment_Type:
          split.Payment_Type,
        Bank_Account_Id:
          split.Bank_Account_Id,
        Account_Display_Name:
          split.Account_Display_Name,
        Reference_Number:
          split.Reference_Number,
        Amount: split.Amount,
      });
    });

    const summary = {
      totalReceived: 0,
    };

    const paymentIns = payments.map(
      (payment) => {
        summary.totalReceived += Number(
          payment.Received || 0
        );

        return {
          paymentInDetails: {
            id: payment.id,

            Party_Name:
              payment.Party_Name,

            GSTIN: payment.GSTIN,

            // Phone_Number:
            //   payment.Phone_Number,

          
            Receipt_No:
              payment.Receipt_No,

            Payment_Date:
              payment.Payment_Date,

            // Description:
            //   payment.Description,

            Received:
              payment.Received,
          },

          splits:
            splitMap[payment.id] || [],
        };
      }
    );

    return res.status(200).json({
      success: true,
      totalPayments:
        paymentIns.length,

      paymentIns,

      summary: {
        totalReceived: Number(
          summary.totalReceived.toFixed(2)
        ),
      },
    });
  } catch (err) {
    next(err);
  } finally {
    if (connection)
      connection.release();
  }
};
export { getAllPaymentIns, getPaymentInById, createPaymentIn, updatePaymentIn, deletePaymentIn,
   exportPaymentInsReportToExcel,
   getPaymentInPrintReport };



