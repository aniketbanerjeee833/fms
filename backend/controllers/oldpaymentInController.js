/* ═══════════════════════════════════════════════════════════════════
   1. SQL — run this once to create the table
═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS payment_in (

  Id                INT AUTO_INCREMENT PRIMARY KEY,
  Party_Id          VARCHAR(255)     NOT NULL,
  Receipt_No        VARCHAR(255)     DEFAULT NULL,
  Payment_Date      DATE            NOT NULL,
  Payment_Type      VARCHAR(255)     NOT NULL DEFAULT 'Cash',
  Reference_No      VARCHAR(255)     DEFAULT NULL,
  Received          DECIMAL(10,2)   NOT NULL DEFAULT 0,
 
  created_at        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (Party_Id) REFERENCES add_party(Party_Id)
);
CREATE TABLE payment_splits (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  Source_Type       ENUM('Sale','Purchase','Payment_In','Payment_Out','Sale_Return','Purchase_Return','Expense') NOT NULL,
  Source_Id         INT NOT NULL,              -- numeric id of parent row (e.g. payment_in.Id)
  Payment_Type      ENUM('Cash','Cheque','Neft','Bank') NOT NULL,
  Bank_Account_Id   INT NULL,                  -- required only when Payment_Type = 'Bank'
  Reference_Number  VARCHAR(100) NULL,         -- required for Cheque/Neft, optional for Bank
  Amount            DECIMAL(14,2) NOT NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (Bank_Account_Id) REFERENCES bank_accounts(Bank_Account_Id)
)

═══════════════════════════════════════════════════════════════════
   2. BACKEND CONTROLLERS  (paymentInController.js)
═══════════════════════════════════════════════════════════════════ */
import db from "../config/db.js"; // mysql2/promise connection
import { recordBankTransaction } from "../utils/bankAccountHelper.js";
import { recordCashTransaction } from "../utils/cashTransactionHelper.js";
import { insertPaymentSplits, validateSplits } from "../utils/paymentSplitHelper.js";


/* ── GET ALL ──────────────────────────────────────────────── */
// const getAllPaymentIns = async (req, res, next) => {
//   let connection;
//   try {
//     connection = await db.getConnection();

//     const page = parseInt(req.query.page, 10) || 1;
//     const limit = 10;
//     const offset = (page - 1) * limit;
//     const search = req.query.search?.trim().toLowerCase() || "";
//     const fromDate = req.query.fromDate || null;
//     const toDate = req.query.toDate || null;

//     const whereClauses = [];
//     const params = [];

//     if (search) {
//       whereClauses.push(`(
//         LOWER(a.Party_Name) LIKE ? OR
//         LOWER(pi.Payment_Type) LIKE ? OR
//         LOWER(pi.Receipt_No) LIKE ? OR
//         LOWER(pi.Reference_No) LIKE ? OR
//         LOWER(ba.Account_Display_Name) LIKE ? OR
//         CAST(pi.Received AS CHAR) LIKE ?
//       )`);

//       const like = `%${search}%`;
//       params.push(like, like, like, like, like, like);
//     }

//     if (fromDate && toDate) {
//       whereClauses.push(`DATE(pi.Payment_Date) BETWEEN ? AND ?`);
//       params.push(fromDate, toDate);
//     } else if (fromDate) {
//       whereClauses.push(`DATE(pi.Payment_Date) >= ?`);
//       params.push(fromDate);
//     } else if (toDate) {
//       whereClauses.push(`DATE(pi.Payment_Date) <= ?`);
//       params.push(toDate);
//     }

//     const whereSQL = whereClauses.length
//       ? `WHERE ${whereClauses.join(" AND ")}`
//       : "";

//     const [rows] = await connection.query(
//       `SELECT
//           pi.*,
//           a.Party_Name,
//           ba.Account_Display_Name AS Bank_Display_Name,
//           CASE
//             WHEN pi.Payment_Type = 'Bank'
//               THEN ba.Account_Display_Name
//             ELSE pi.Payment_Type
//           END AS Payment_Type_Display
//        FROM payment_in pi
//        LEFT JOIN add_party a
//          ON a.Party_Id = pi.Party_Id
//        LEFT JOIN bank_accounts ba
//          ON ba.id = pi.Bank_Account_Id
//        ${whereSQL}
//        ORDER BY pi.created_at DESC
//        LIMIT ? OFFSET ?`,
//       [...params, limit, offset]
//     );

//     const [[{ total }]] = await connection.query(
//       `SELECT COUNT(*) AS total
//        FROM payment_in pi
//        LEFT JOIN add_party a
//          ON a.Party_Id = pi.Party_Id
//        LEFT JOIN bank_accounts ba
//          ON ba.id = pi.Bank_Account_Id
//        ${whereSQL}`,
//       params
//     );

//     const [[totals]] = await connection.query(
//       `SELECT
//           COALESCE(SUM(pi.Received), 0) AS totalReceived
//        FROM payment_in pi
//        LEFT JOIN add_party a
//          ON a.Party_Id = pi.Party_Id
//        LEFT JOIN bank_accounts ba
//          ON ba.id = pi.Bank_Account_Id
//        ${whereSQL}`,
//       params
//     );

//     return res.status(200).json({
//       success: true,
//       currentPage: page,
//       totalPages: Math.ceil(total / limit),
//       totalPayments: total,
//       paymentIns: rows,
//       totals,
//     });
//   } catch (err) {
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };
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

    const whereClauses = [];
    const params = [];

    if (search) {
      whereClauses.push(`(
        LOWER(a.Party_Name) LIKE ? OR
        LOWER(pi.Receipt_No) LIKE ? OR
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

    const whereSQL = whereClauses.length
      ? `WHERE ${whereClauses.join(" AND ")}`
      : "";

    // ==========================
    // Fetch Payment In List
    // ==========================
    const [rows] = await connection.query(
      `SELECT
          pi.*,
          a.Party_Name
       FROM payment_in pi
       LEFT JOIN add_party a
         ON a.Party_Id = pi.Party_Id
       ${whereSQL}
       ORDER BY pi.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // ==========================
    // Fetch all payment splits
    // ==========================
    const paymentIds = rows.map((row) => row.Id);

    if (paymentIds.length > 0) {
      const placeholders = paymentIds.map(() => "?").join(",");

      const [splits] = await connection.query(
        `SELECT
            ps.Source_Id,
            ps.Payment_Type,
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

        splitMap[split.Source_Id].push(
          split.Payment_Type === "Bank"
            ? split.Account_Display_Name
            : split.Payment_Type
        );
      }

      for (const row of rows) {
        const labels = splitMap[row.Id] || [];

        const counts = {};

        labels.forEach((label) => {
          counts[label] = (counts[label] || 0) + 1;
        });

        row.Payment_Type_Display = Object.entries(counts)
          .map(([label, count]) =>
            count > 1 ? `${label} (x${count})` : label
          )
          .join(" + ");
      }
    }

    // ==========================
    // Total Records
    // ==========================
    const [[{ total }]] = await connection.query(
      `SELECT COUNT(*) AS total
       FROM payment_in pi
       LEFT JOIN add_party a
         ON a.Party_Id = pi.Party_Id
       ${whereSQL}`,
      params
    );

    // ==========================
    // Total Received
    // ==========================
    const [[totals]] = await connection.query(
      `SELECT
          COALESCE(SUM(pi.Received),0) AS totalReceived
       FROM payment_in pi
       LEFT JOIN add_party a
         ON a.Party_Id = pi.Party_Id
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
    console.error(err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};
 
/* ── GET SINGLE ───────────────────────────────────────────── */
// const getPaymentInById = async (req, res, next) => {
//   let connection;
//   try {
//     connection = await db.getConnection();
//     const { id } = req.params;
 
//     const [[row]] = await connection.query(
//       `SELECT pi.*, a.Party_Name,
//         ba.Account_Display_Name AS Bank_Display_Name,
//         CASE
//           WHEN pi.Payment_Type = 'Bank'
//           THEN ba.Account_Display_Name
//           ELSE pi.Payment_Type
//         END AS Payment_Type_Display
//        FROM payment_in pi
//        LEFT JOIN add_party a ON a.Party_Id = pi.Party_Id
//        LEFT JOIN bank_accounts ba ON ba.id = pi.Bank_Account_Id
//        WHERE pi.Id = ?`,
//       [id]
//     );
 
//     if (!row) return res.status(404).json({ success: false, message: "Payment In not found" });
 
//     return res.status(200).json({ success: true, paymentIn: row });
//   } catch (err) {
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };
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
       LEFT JOIN bank_accounts ba ON ps.Bank_Account_Id = ba.id
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

// const createPaymentIn = async (req, res, next) => {
//   let connection;
//   try {
//     connection = await db.getConnection();

//     const {
//       Party_Id,
//       Party_Name,
//       Receipt_No,
//       Payment_Date,
//       Received,       // total amount — must equal sum of splits
//       splits,         // [{ Payment_Type, Bank_Account_Id, Reference_Number, Amount }, ...]
//     } = req.body;

//     if (!Party_Id || !Payment_Date || !Received) {
//       return res.status(400).json({ success: false, message: "Party, Date and Received are required" });
//     }

//     if (isNaN(Received) || Number(Received) <= 0) {
//       return res.status(400).json({ success: false, message: "Received amount must be greater than 0" });
//     }

//     try {
//       validateSplits(splits, Received);
//     } catch (validationErr) {
//       return res.status(400).json({ success: false, message: validationErr.message });
//     }

//     await connection.beginTransaction();

//     const [result] = await connection.query(
//       `INSERT INTO payment_in (Party_Id, Receipt_No, Payment_Date, Received)
//        VALUES (?, ?, ?, ?)`,
//       [Party_Id, Receipt_No || null, Payment_Date, Number(Received)]
//     );

//     const Id = result.insertId;

//     await insertPaymentSplits({
//       connection,
//       sourceType: "Payment_In",
//       sourceId: Id,
//       partyName: Party_Name,
//       txnDate: Payment_Date,
//       splits,
//     });

//     await connection.commit();

//     return res.status(201).json({ success: true, message: "Payment In created", Id });
//   } catch (err) {
//     if (connection) await connection.rollback();
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };

const createPaymentIn = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();

    const {
      Party_Id,
      Party_Name,
      Receipt_No,
      Payment_Date,
      Received,
      splits,
    } = req.body;

    // 🔹 Payment_Date and Party_Id always required
    if (!Party_Id || !Payment_Date) {
      return res.status(400).json({ success: false, message: "Party and Date are required" });
    }

    const hasSplits = Array.isArray(splits) && splits.length > 0;

    // 🔹 in split mode, Received is calculated from splits sum; in single mode it must be sent
    const totalReceived = hasSplits
      ? splits.reduce((sum, s) => sum + (Number(s.Amount) || 0), 0)
      : Number(Received);

    if (!totalReceived || totalReceived <= 0) {
      return res.status(400).json({ success: false, message: "Received amount must be greater than 0" });
    }

    if (hasSplits) {
      try {
        validateSplits(splits, totalReceived);
      } catch (validationErr) {
        return res.status(400).json({ success: false, message: validationErr.message });
      }
    } else {
      // single mode — Payment_Type is required
      const { Payment_Type, Bank_Account_Id } = req.body;
      if (!Payment_Type) {
        return res.status(400).json({ success: false, message: "Payment Type is required" });
      }
      if (Payment_Type === "Bank" && !Bank_Account_Id) {
        return res.status(400).json({ success: false, message: "Bank account is required for Bank payment type" });
      }
    }

    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO payment_in (Party_Id, Receipt_No, Payment_Date, Received)
       VALUES (?, ?, ?, ?)`,
      [Party_Id, Receipt_No || null, Payment_Date, totalReceived]
    );

    const Id = result.insertId;

    if (hasSplits) {
      await insertPaymentSplits({
        connection,
        sourceType: "Payment_In",
        sourceId: Id,
        partyName: Party_Name,
        txnDate: Payment_Date,
        splits,
      });
    } else {
      // single payment — call cash/bank helpers directly
      const { Payment_Type, Bank_Account_Id } = req.body;

      if (Payment_Type === "Bank" && Bank_Account_Id) {
        await recordBankTransaction({
          connection,
          bankAccountId: Bank_Account_Id,
          txnType: "Payment_In",
          referenceId: Id,
          partyName: Party_Name,
          amount: totalReceived,
          txnDate: Payment_Date,
        });
      }

      await recordCashTransaction({
        connection,
        isCash: Payment_Type === "Cash",
        txnType: "Payment_In",
        referenceId: Id,
        partyName: Party_Name,
        amount: totalReceived,
        txnDate: Payment_Date,
      });
    }

    await connection.commit();
    return res.status(201).json({ success: true, message: "Payment In created", Id });
  } catch (err) {
    if (connection) await connection.rollback();
    next(err);
  } finally {
    if (connection) connection.release();
  }
};
// const createPaymentIn = async (req, res, next) => {
//   let connection;
//   try {
//     connection = await db.getConnection();
 
//     const {
//       Party_Id,
//       Party_Name,       // pass the display name straight from the form / selected party
//       Receipt_No,
//       Payment_Date,
//       Payment_Type,
//       Reference_No,
//       Bank_Account_Id,  // required only when Payment_Type === "Bank"
//       Received,
//     } = req.body;
 
//     if (!Party_Id || !Payment_Date || !Payment_Type || !Received) {
//       return res.status(400).json({ success: false, message: "Party, Date, Payment Type and Received are required" });
//     }
 
//     if (isNaN(Received) || Number(Received) <= 0) {
//       return res.status(400).json({ success: false, message: "Received amount must be greater than 0" });
//     }
 
//     if (Payment_Type === "Bank" && !Bank_Account_Id) {
//       return res.status(400).json({ success: false, message: "Bank account is required when Payment Type is Bank" });
//     }
 
//     await connection.beginTransaction();
 
//     const [result] = await connection.query(
//       `INSERT INTO payment_in
//          (Party_Id, Receipt_No, Payment_Date, Payment_Type, Reference_No, Bank_Account_Id, Received)
//        VALUES (?, ?, ?, ?, ?, ?, ?)`,
//       [
//         Party_Id,
//         Receipt_No || null,
//         Payment_Date,
//         Payment_Type,
//         Reference_No || null,
//         Payment_Type === "Bank" ? Bank_Account_Id : null,
//         Number(Received),
//       ]
//     );
 
//     const Id = result.insertId;
//    if (Payment_Type === "Bank" && Bank_Account_Id) {
//     await recordBankTransaction({
//       connection,
//       bankAccountId: Payment_Type === "Bank" ? Bank_Account_Id : null,
//       txnType: "Payment_In",
//       referenceId: Id,
//       partyName: Party_Name,
//       amount: Number(Received),
//       txnDate: Payment_Date,
//     });
//   }
//     await recordCashTransaction({
//   connection,
//   isCash:      Payment_Type === "Cash",
//   txnType:     "Payment_In",
//   referenceId: Id,
//   partyName:   Party_Name,
//   amount: Number(Received),
//   txnDate:     Payment_Date,
// });
 
//     await connection.commit();
 
//     return res.status(201).json({
//       success: true,
//       message: "Payment In created",
//       Id,
//     });
//   } catch (err) {
//     if (connection) await connection.rollback();
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };
 
/* ── UPDATE OLD ───────────────────────────────────────────────── */
// const updatePaymentIn = async (req, res, next) => {
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
//       Received,
//     } = req.body;
 
//     if (!Party_Id || !Payment_Date || !Payment_Type || !Received) {
//       return res.status(400).json({ success: false, message: "Party, Date, Payment Type and Received are required" });
//     }
 
//     if (isNaN(Received) || Number(Received) <= 0) {
//       return res.status(400).json({ success: false, message: "Received amount must be greater than 0" });
//     }
 
//     if (Payment_Type === "Bank" && !Bank_Account_Id) {
//       return res.status(400).json({ success: false, message: "Bank account is required when Payment Type is Bank" });
//     }
 
//     await connection.beginTransaction();
 
//     await connection.query(
//       `UPDATE payment_in
//        SET Party_Id = ?, Receipt_No = ?, Payment_Date = ?,
//            Payment_Type = ?, Reference_No = ?, Bank_Account_Id = ?, Received = ?
//        WHERE Id = ?`,
//       [
//         Party_Id,
//         Receipt_No || null,
//         Payment_Date,
//         Payment_Type,
//         Reference_No || null,
//         Payment_Type === "Bank" ? Bank_Account_Id : null,
//         Number(Received),
//         id,
//       ]
//     );
 
//     await recordBankTransaction({
//       connection,
//       bankAccountId: Payment_Type === "Bank" ? Bank_Account_Id : null,
//       txnType: "Payment_In",
//       referenceId: id,
//       partyName: Party_Name,
//       amount: Number(Received),
//       txnDate: Payment_Date,
//     });
//   await recordCashTransaction({
//   connection,
//   isCash:      Payment_Type === "Cash",
//   txnType:     "Payment_In",
//   referenceId: id,
//   partyName:   Party_Name,
//   amount: Number(Received),
//   txnDate:     Payment_Date,
// });
//     await connection.commit();
 
//     return res.status(200).json({ success: true, message: "Payment In updated" });
//   } catch (err) {
//     if (connection) await connection.rollback();
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };
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
      Received,
      splits,
    } = req.body;

    if (!Party_Id || !Payment_Date || !Received) {
      return res.status(400).json({ success: false, message: "Party, Date and Received are required" });
    }

    if (isNaN(Received) || Number(Received) <= 0) {
      return res.status(400).json({ success: false, message: "Received amount must be greater than 0" });
    }

    try {
      validateSplits(splits, Received);
    } catch (validationErr) {
      return res.status(400).json({ success: false, message: validationErr.message });
    }

    await connection.beginTransaction();

    await connection.query(
      `UPDATE payment_in
       SET Party_Id = ?, Receipt_No = ?, Payment_Date = ?, Received = ?
       WHERE Id = ?`,
      [Party_Id, Receipt_No || null, Payment_Date, Number(Received), id]
    );

    // 🔹 wipe old splits + their ledger rows, then re-insert fresh ones
    await deletePaymentSplits({ connection, sourceType: "Payment_In", sourceId: id });

    await insertPaymentSplits({
      connection,
      sourceType: "Payment_In",
      sourceId: id,
      partyName: Party_Name,
      txnDate: Payment_Date,
      splits,
    });

    await connection.commit();

    return res.status(200).json({ success: true, message: "Payment In updated" });
  } catch (err) {
    if (connection) await connection.rollback();
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


