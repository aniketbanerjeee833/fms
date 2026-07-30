import db from "../config/db.js";
import { recordCashTransaction } from "../utils/cashTransactionHelper.js";
/* ═══════════════════════════════════════════════════════════════════
   2. CONTROLLER  (cashInHandController.js)
═══════════════════════════════════════════════════════════════════ */
 
/* ─────────────────────────────────────────────────────────────
   HOW CASH FLOWS:
 
   CASH IN  (+)
     • Sale         → Payment_Type = 'Cash'          → Total_Received (money received from customer)
     • Payment In   → Payment_Type = 'Cash'          → Amount
     • Purchase Return / Debit Note → Payment_Type = 'Cash' → Total_Received (vendor refunds you)
 
   CASH OUT (-)
     • Purchase     → Payment_Type = 'Cash'          → Total_Paid
     • Payment Out  → Payment_Type = 'Cash'          → Amount
     • Sale Return  → Payment_Type = 'Cash'          → Total_Received (you refund customer)
 
   MANUAL ADJUSTMENTS
     • cash_adjustments type='add'    → +amount
     • cash_adjustments type='reduce' → -amount
───────────────────────────────────────────────────────────────*/
 
/* ── GET CASH IN HAND SUMMARY + LEDGER ────────────────────── */

const getCashInHand = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();

    const fromDate = req.query.fromDate || null;
    const toDate   = req.query.toDate   || null;
    const page     = parseInt(req.query.page,  10) || 1;
    const limit    = parseInt(req.query.limit, 10) || 10;
    const offset   = (page - 1) * limit;
    const search   = req.query.search?.trim() || "";

    /* ── build WHERE ── */
    const conditions = [
      `Txn_Type NOT IN ('Adjustment_Add', 'Adjustment_Reduce')`,  // 🔹 hide adjustments from ledger UI
    ];
    const params = [];

    if (fromDate && toDate) {
      conditions.push(`DATE(Txn_Date) BETWEEN ? AND ?`);
      params.push(fromDate, toDate);
    } else if (fromDate) {
      conditions.push(`DATE(Txn_Date) >= ?`);
      params.push(fromDate);
    } else if (toDate) {
      conditions.push(`DATE(Txn_Date) <= ?`);
      params.push(toDate);
    }

    if (search) {
      conditions.push(`(Txn_Type LIKE ? OR Party_Name LIKE ? OR CAST(Amount AS CHAR) LIKE ?)`);
      const like = `%${search}%`;
      params.push(like, like, like);
    }

    const whereSQL = `WHERE ${conditions.join(" AND ")}`;

    /* ── ledger (paginated) — adjustments excluded ── */
   const [ledgerRows] = await connection.query(
  `
  SELECT
  ct.*,
  ps.Source_Id,
  CASE ct.Txn_Type
    WHEN 'Sale'            THEN s.Sale_Id
    WHEN 'Purchase'        THEN p.Purchase_Id
    WHEN 'Payment_In'      THEN pi.id
    WHEN 'Payment_Out'     THEN po.id
    WHEN 'Sale_Return'     THEN sr.id
    WHEN 'Purchase_Return' THEN pr.id
    ELSE NULL
  END AS Formatted_Reference_Id

FROM cash_transactions ct

-- resolve split_id → parent source id
LEFT JOIN payment_splits ps
  ON ct.Reference_Id = ps.id
  AND ct.Txn_Type IN (
    'Sale', 'Purchase', 'Sale_Return', 'Purchase_Return',
    'Payment_In', 'Payment_Out'
  )

-- now join parent tables via ps.Source_Id
LEFT JOIN add_sale s
  ON ct.Txn_Type = 'Sale'
  AND ps.Source_Id = s.id

LEFT JOIN add_purchase p
  ON ct.Txn_Type = 'Purchase'
  AND ps.Source_Id = p.id

LEFT JOIN payment_in pi
  ON ct.Txn_Type = 'Payment_In'
  AND ps.Source_Id = pi.Id

LEFT JOIN payment_out po
  ON ct.Txn_Type = 'Payment_Out'
  AND ps.Source_Id = po.id

LEFT JOIN sale_return sr
  ON ct.Txn_Type = 'Sale_Return'
  AND ps.Source_Id = sr.id

LEFT JOIN purchase_return pr
  ON ct.Txn_Type = 'Purchase_Return'
  AND ps.Source_Id = pr.id

${whereSQL}

ORDER BY ct.id DESC
LIMIT ? OFFSET ?
   `,
  [...params, limit, offset]
);

    /* ── total count (for pagination) — same filter ── */
    const [[{ totalCount }]] = await connection.query(
      `SELECT COUNT(*) AS totalCount FROM cash_transactions ${whereSQL}`,
      params
    );

    /* ── current balance (ALL-TIME, includes adjustments — unfiltered on purpose) ── */
    const [[balanceRow]] = await connection.query(
      `SELECT Running_Balance FROM cash_transactions ORDER BY id DESC LIMIT 1`
    );

    const cashInHand = balanceRow ? Number(balanceRow.Running_Balance) : 0;

    /* ── cash in / cash out totals — also exclude adjustments to keep these
         two numbers meaning "from real transactions", matching the ledger view ── */
    const [[totals]] = await connection.query(
      `SELECT
         COALESCE(SUM(CASE WHEN Direction = 'Credit' THEN Amount ELSE 0 END), 0) AS totalCashIn,
         COALESCE(SUM(CASE WHEN Direction = 'Debit'  THEN Amount ELSE 0 END), 0) AS totalCashOut
       FROM cash_transactions
       ${whereSQL}`,
      params
    );

    return res.status(200).json({
      success:      true,
      cashInHand:   parseFloat(cashInHand.toFixed(2)),
      totalCashIn:  parseFloat(totals.totalCashIn),
      totalCashOut: parseFloat(totals.totalCashOut),
      currentPage:  page,
      totalPages:   Math.ceil(totalCount / limit),
      totalCount,
      ledger:       ledgerRows,
    });

  } catch (err) {
    console.error("❌ getCashInHand:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};
 
/* ── getCashBalance (dashboard widget) ── */
const getCashBalance = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();
 
    const [[row]] = await connection.query(
      `SELECT Running_Balance FROM cash_transactions ORDER BY id DESC LIMIT 1`
    );
 
    return res.status(200).json({
      success:    true,
      cashInHand: row ? parseFloat(Number(row.Running_Balance).toFixed(2)) : 0,
    });
  } catch (err) {
    next(err);
  } finally {
    if (connection) connection.release();
  }
};
// const getCashInHand = async (req, res, next) => {
//   let connection;
//   try {
//     connection = await db.getConnection();
 
//     const fromDate = req.query.fromDate || null;
//     const toDate   = req.query.toDate   || null;
//     const page     = parseInt(req.query.page, 10) || 1;
//     const limit    = parseInt(req.query.limit, 10) || 10;
//     const offset   = (page - 1) * limit;
//     const search = req.query.search?.trim() || "";
 
//     /* ── date filter helper ── */
//     const dateFilter = (col) => {
//       if (fromDate && toDate)  return `AND DATE(${col}) BETWEEN '${fromDate}' AND '${toDate}'`;
//       if (fromDate)            return `AND DATE(${col}) >= '${fromDate}'`;
//       if (toDate)              return `AND DATE(${col}) <= '${toDate}'`;
//       return "";
//     };
// //     const searchFilter = (partyCol, amountCol) => {
// //   if (!search) return "";

// //   const escaped = search.replace(/'/g, "''");

// //   return `
// //     AND (
// //       ${partyCol} LIKE '%${escaped}%'
// //       OR CAST(${amountCol} AS CHAR) LIKE '%${escaped}%'
// //     )
// //   `;
// // };


// const searchFilter = (typeName, partyCol, amountCol) => {
//   if (!search) return "";

//   const escaped = search.replace(/'/g, "''");

//   return `
//     AND (
//       '${typeName}' LIKE '%${escaped}%'
//       OR ${partyCol} LIKE '%${escaped}%'
//       OR CAST(${amountCol} AS CHAR) LIKE '%${escaped}%'
//     )
//   `;
// };
 
//     /* ══════════════════════════════════════════════════════════
//        STEP 1 — Build unified ledger from all cash transactions
//     ══════════════════════════════════════════════════════════ */
//     const [ledgerRows] = await connection.query(`
//       SELECT * FROM (
 
//         /* ── SALES (cash in) ── */
//         SELECT
//           s.id                                        AS source_id,
//           'sale'                                      AS source_type,
//           'Cash In'                                   AS direction,
//           s.Invoice_Date                              AS txn_date,
//           a.Party_Name                                AS party_name,
//           COALESCE(s.Total_Received, s.Total_Amount)  AS amount,
//           CONCAT('Sale - ', COALESCE(a.Party_Name,'')) AS description
//         FROM add_sale s
//         LEFT JOIN add_party a ON a.Party_Id = s.Party_Id
//         WHERE s.Payment_Type = 'Cash'
//         ${dateFilter("s.Invoice_Date")}
//         ${searchFilter("Sale", "a.Party_Name", "COALESCE(s.Total_Received, s.Total_Amount)")}
 
//         UNION ALL
 
//         /* ── PURCHASES (cash out) ── */
//         SELECT
//           p.id,
//           'purchase',
//           'Cash Out',
//           p.Bill_Date,
//           a.Party_Name,
//           COALESCE(p.Total_Paid, p.Total_Amount),
//           CONCAT('Purchase - ', COALESCE(a.Party_Name,''))
//         FROM add_purchase p
//         LEFT JOIN add_party a ON a.Party_Id = p.Party_Id
//         WHERE p.Payment_Type = 'Cash'
//         ${dateFilter("p.Bill_Date")}
//         ${searchFilter("Purchase", "a.Party_Name", "COALESCE(p.Total_Paid, p.Total_Amount)")}
 
//         UNION ALL
 
//         /* ── PAYMENT IN (cash in) ── */
//         SELECT
//           pi.id,
//           'payment_in',
//           'Cash In',
//           pi.Payment_Date,
//           a.Party_Name,
//           pi.Received,
//           CONCAT('Payment In - ', COALESCE(a.Party_Name,''))
//         FROM payment_in pi
//         LEFT JOIN add_party a ON a.Party_Id = pi.Party_Id
//         WHERE pi.Payment_Type = 'Cash'
//         ${dateFilter("pi.Payment_Date")}
//         ${searchFilter("Payment In", "a.Party_Name", "pi.Received")}
 
//         UNION ALL
 
//         /* ── PAYMENT OUT (cash out) ── */
//         SELECT
//           po.id,
//           'payment_out',
//           'Cash Out',
//           po.Payment_Date,
//           a.Party_Name,
//           po.Paid,
//           CONCAT('Payment Out - ', COALESCE(a.Party_Name,''))
//         FROM payment_out po
//         LEFT JOIN add_party a ON a.Party_Id = po.Party_Id
//         WHERE po.Payment_Type = 'Cash'
//         ${dateFilter("po.Payment_Date")}
//         ${searchFilter("Payment Out", "a.Party_Name", "po.Paid")}
 
//         UNION ALL
 
//         /* ── PURCHASE RETURN / DEBIT NOTE (cash in — vendor refunds you) ── */
//         SELECT
//           pr.id,
//           'purchase_return',
//           'Cash In',
//           pr.Return_Date,
//           a.Party_Name,
//           COALESCE(pr.Total_Received, 0),
//           CONCAT('Purchase Return - ', COALESCE(a.Party_Name,''))
//         FROM purchase_return pr
//         LEFT JOIN add_party a ON a.Party_Id = pr.Party_Id
//         WHERE pr.Payment_Type = 'Cash'
//         ${dateFilter("pr.Return_Date")}
//        ${searchFilter("Purchase Return", "a.Party_Name", "COALESCE(pr.Total_Received,0)")}
 
//         UNION ALL
 
//         /* ── SALE RETURN / CREDIT NOTE (cash out — you refund customer) ── */
//         SELECT
//           sr.id,
//           'sale_return',
//           'Cash Out',
//           sr.Return_Date,
//           a.Party_Name,
//           COALESCE(sr.Total_Paid, 0),
//           CONCAT('Sale Return - ', COALESCE(a.Party_Name,''))
//         FROM sale_return sr
//         LEFT JOIN add_party a ON a.Party_Id = sr.Party_Id
//         WHERE sr.Payment_Type = 'Cash'
//         ${dateFilter("sr.Return_Date")}
//        ${searchFilter("Sale Return", "a.Party_Name", "COALESCE(sr.Total_Paid,0)")}
    
 
//       ) ledger
//       ORDER BY txn_date DESC, source_id DESC
//       LIMIT ? OFFSET ?
//     `, [limit, offset]);
 
//     /* ══════════════════════════════════════════════════════════
//        STEP 2 — Total count for pagination
//     ══════════════════════════════════════════════════════════ */
// const [[{ totalCount }]] = await connection.query(`
// SELECT COUNT(*) AS totalCount
// FROM (

//     /* SALES */
//     SELECT s.id
//     FROM add_sale s
//     LEFT JOIN add_party a ON a.Party_Id = s.Party_Id
//     WHERE s.Payment_Type = 'Cash'
//     ${dateFilter("s.Invoice_Date")}
//     ${searchFilter("Sale", "a.Party_Name", "COALESCE(s.Total_Received, s.Total_Amount)")}

//     UNION ALL

//     /* PURCHASE */
//     SELECT p.id
//     FROM add_purchase p
//     LEFT JOIN add_party a ON a.Party_Id = p.Party_Id
//     WHERE p.Payment_Type = 'Cash'
//     ${dateFilter("p.Bill_Date")}
//     ${searchFilter("Purchase", "a.Party_Name", "COALESCE(p.Total_Paid, p.Total_Amount)")}

//     UNION ALL

//     /* PAYMENT IN */
//     SELECT pi.id
//     FROM payment_in pi
//     LEFT JOIN add_party a ON a.Party_Id = pi.Party_Id
//     WHERE pi.Payment_Type = 'Cash'
//     ${dateFilter("pi.Payment_Date")}
//     ${searchFilter("Payment In", "a.Party_Name", "pi.Received")}

//     UNION ALL

//     /* PAYMENT OUT */
//     SELECT po.id
//     FROM payment_out po
//     LEFT JOIN add_party a ON a.Party_Id = po.Party_Id
//     WHERE po.Payment_Type = 'Cash'
//     ${dateFilter("po.Payment_Date")}
//     ${searchFilter("Payment Out", "a.Party_Name", "po.Paid")}

//     UNION ALL

//     /* PURCHASE RETURN */
//     SELECT pr.id
//     FROM purchase_return pr
//     LEFT JOIN add_party a ON a.Party_Id = pr.Party_Id
//     WHERE pr.Payment_Type = 'Cash'
//     ${dateFilter("pr.Return_Date")}
//     ${searchFilter("Purchase Return", "a.Party_Name", "COALESCE(pr.Total_Received,0)")}

//     UNION ALL

//     /* SALE RETURN */
//     SELECT sr.id
//     FROM sale_return sr
//     LEFT JOIN add_party a ON a.Party_Id = sr.Party_Id
//     WHERE sr.Payment_Type = 'Cash'
//     ${dateFilter("sr.Return_Date")}
//     ${searchFilter("Sale Return", "a.Party_Name", "COALESCE(sr.Total_Paid,0)")}

// ) _cnt
// `);
 
//     /* ══════════════════════════════════════════════════════════
//        STEP 3 — Cash In / Cash Out totals (ALL time, no date filter)
//        This gives the true current balance
//     ══════════════════════════════════════════════════════════ */
//     const [[summary]] = await connection.query(`
//       SELECT
//         COALESCE(SUM(CASE WHEN direction = 'Cash In'  THEN amount ELSE 0 END), 0) AS totalCashIn,
//         COALESCE(SUM(CASE WHEN direction = 'Cash Out' THEN amount ELSE 0 END), 0) AS totalCashOut
//       FROM (
//         SELECT 'Cash In'  AS direction, COALESCE(Total_Received, Total_Amount) AS amount FROM add_sale      WHERE Payment_Type = 'Cash'
//         UNION ALL
//         SELECT 'Cash Out',              COALESCE(Total_Paid, Total_Amount)     FROM add_purchase             WHERE Payment_Type = 'Cash'
//         UNION ALL
//         SELECT 'Cash In',               Received                                 FROM payment_in               WHERE Payment_Type = 'Cash'
//         UNION ALL
//         SELECT 'Cash Out',              Paid                                 FROM payment_out              WHERE Payment_Type = 'Cash'
//         UNION ALL
//         SELECT 'Cash In',               COALESCE(Total_Received, 0)            FROM purchase_return          WHERE Payment_Type = 'Cash'
//         UNION ALL
//         SELECT 'Cash Out',              COALESCE(Total_Paid, 0)            FROM sale_return              WHERE Payment_Type = 'Cash'
//         UNION ALL
//         SELECT CASE WHEN type = 'add' THEN 'Cash In' ELSE 'Cash Out' END, amount FROM cash_adjustments
//       ) _all
//     `);
 
//     const cashInHand = summary.totalCashIn - summary.totalCashOut;
 
//     return res.status(200).json({
//       success:      true,
//       cashInHand:   parseFloat(cashInHand.toFixed(2)),
//       totalCashIn:  parseFloat(summary.totalCashIn),
//       totalCashOut: parseFloat(summary.totalCashOut),
//       currentPage:  page,
//       totalPages:   Math.ceil(totalCount / limit),
//       totalCount,
//       ledger:       ledgerRows,
//     });
 
//   } catch (err) {
//     console.error("❌ getCashInHand:", err);
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };
 
 
/* ── GET ALL MANUAL ADJUSTMENTS ───────────────────────────── */
const getAllAdjustments = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();
 
    const page   = parseInt(req.query.page, 10) || 1;
    const limit  = 20;
    const offset = (page - 1) * limit;
 
    const [rows] = await connection.query(
      `SELECT * FROM cash_adjustments ORDER BY adjustment_date DESC, created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
 
    const [[{ total }]] = await connection.query(
      `SELECT COUNT(*) AS total FROM cash_adjustments`
    );
 
    return res.status(200).json({
      success:     true,
      currentPage: page,
      totalPages:  Math.ceil(total / limit),
      total,
      adjustments: rows,
    });
  } catch (err) {
    next(err);
  } finally {
    if (connection) connection.release();
  }
};
 
 
/* ── CREATE MANUAL ADJUSTMENT ─────────────────────────────── */
const createAdjustment = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();  
 
    const { type, amount, adjustment_date, description } = req.body;
 
    if (!type || !amount || !adjustment_date) {
      return res.status(400).json({
        success: false,
        message: "type, amount and adjustment_date are required",
      });
    }
 
    if (!["add", "reduce"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "type must be 'add' or 'reduce'",
      });
    }
 
    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "amount must be a positive number",
      });
    }
 
    const [result] = await connection.query(
      `INSERT INTO cash_adjustments (type, amount, adjustment_date, description)
       VALUES (?, ?, ?, ?)`,
      [type, Number(amount), adjustment_date, description || null]
    );
 const adjustmentId = result.insertId;

    // 🔹 post into the cash ledger so running balance reflects it
    await recordCashTransaction({
      connection,
      isCash: true,
      txnType: type === "add" ? "Adjustment_Add" : "Adjustment_Reduce",
      referenceId: adjustmentId,
      partyName: description || null,
      amount: Number(amount),
      txnDate: adjustment_date
    });
 
    await connection.commit();
    return res.status(201).json({
      success: true,
      message: "Cash adjustment created",
      id:      result.insertId,
    });
  } catch (err) {
    if (connection) await connection.rollback();
    next(err);
  } finally {
    if (connection) connection.release();
  }
};
 
 
/* ── EDIT MANUAL ADJUSTMENT ───────────────────────────────── */
const editAdjustment = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
 
    const { id } = req.params;
    const { type, amount, adjustment_date, description } = req.body;
 
    if (!type || !amount || !adjustment_date) {
      return res.status(400).json({
        success: false,
        message: "type, amount and adjustment_date are required",
      });
    }
 
    await connection.query(
      `UPDATE cash_adjustments
       SET type = ?, amount = ?, adjustment_date = ?, description = ?, updated_at = NOW()
       WHERE id = ?`,
      [type, Number(amount), adjustment_date, description || null, id]
    );
   await recordCashTransaction({
      connection,
      isCash: true,
      txnType: type === "add" ? "Adjustment_Add" : "Adjustment_Reduce",
      referenceId: id,
      partyName: description || null,
      amount: Number(amount),
      txnDate: adjustment_date
    });

    await connection.commit();
    return res.status(200).json({ success: true, message: "Adjustment updated" });
  } catch (err) {
    if (connection) await connection.rollback();
    next(err);
  } finally {
    if (connection) connection.release();
  }
};
 
 
/* ── DELETE MANUAL ADJUSTMENT ─────────────────────────────── */
// const deleteAdjustment = async (req, res, next) => {
//   let connection;
//   try {
//     connection = await db.getConnection();
//     await connection.query(`DELETE FROM cash_adjustments WHERE id = ?`, [req.params.id]);
//     return res.status(200).json({ success: true, message: "Adjustment deleted" });
//   } catch (err) {
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };

export {
  getCashInHand,
  getCashBalance,
  getAllAdjustments,
  createAdjustment,
  editAdjustment}
 
// module.exports = {
//   getCashInHand,
//   getAllAdjustments,
//   createAdjustment,
//   editAdjustment,
//   //deleteAdjustment,
// };
    // UNION ALL
 
        /* ── MANUAL ADJUSTMENTS ── */
        // SELECT
        //   ca.id,
        //   'adjustment',
        //   CASE WHEN ca.type = 'add' THEN 'Cash In' ELSE 'Cash Out' END,
        //   ca.adjustment_date,
        //   NULL,
        //   ca.amount,
        //   COALESCE(ca.description, 'Manual Adjustment')
        // FROM cash_adjustments ca
        // WHERE 1=1
        // ${dateFilter("ca.adjustment_date")}