// import db from "../config/db.js";
// import { recordBankTransaction } from "../utils/bankAccountHelper.js";
// import { recordCashTransaction } from "../utils/cashTransactionHelper.js";

// /* ── GET ALL ──────────────────────────────────────────────── */
// const getAllSaleReturns = async (req, res, next) => {
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
//         LOWER(p.Party_Name) LIKE ? OR
//         LOWER(sr.Return_Number) LIKE ? OR
//         LOWER(sr.Invoice_Number) LIKE ? OR
//         LOWER(ba.Account_Display_Name) LIKE ? OR
//         CAST(sr.Total_Amount AS CHAR) LIKE ?
//       )`);

//       const like = `%${search}%`;
//       params.push(like, like, like, like, like);
//     }

//     if (fromDate && toDate) {
//       whereClauses.push(`DATE(sr.Return_Date) BETWEEN ? AND ?`);
//       params.push(fromDate, toDate);
//     } else if (fromDate) {
//       whereClauses.push(`DATE(sr.Return_Date) >= ?`);
//       params.push(fromDate);
//     } else if (toDate) {
//       whereClauses.push(`DATE(sr.Return_Date) <= ?`);
//       params.push(toDate);
//     }

//     const whereSQL = whereClauses.length
//       ? `WHERE ${whereClauses.join(" AND ")}`
//       : "";

//     const [rows] = await connection.query(
//       `SELECT
//           sr.*,
//           p.Party_Name,
//           ba.Account_Display_Name AS Bank_Display_Name,
//           CASE
//             WHEN sr.Payment_Type = 'Bank'
//               THEN ba.Account_Display_Name
//             ELSE sr.Payment_Type
//           END AS Payment_Type_Display
//        FROM sale_return sr
//        LEFT JOIN add_party p
//          ON p.Party_Id = sr.Party_Id
//        LEFT JOIN bank_accounts ba
//          ON ba.id = sr.Bank_Account_Id
//        ${whereSQL}
//        ORDER BY sr.created_at DESC
//        LIMIT ? OFFSET ?`,
//       [...params, limit, offset]
//     );

//     const [[{ total }]] = await connection.query(
//       `SELECT COUNT(*) AS total
//        FROM sale_return sr
//        LEFT JOIN add_party p
//          ON p.Party_Id = sr.Party_Id
//        LEFT JOIN bank_accounts ba
//          ON ba.id = sr.Bank_Account_Id
//        ${whereSQL}`,
//       params
//     );

//     const [[totals]] = await connection.query(
//       `SELECT
//           COALESCE(SUM(sr.Total_Amount), 0) AS totalAmount,
//           COALESCE(SUM(sr.Total_Paid), 0) AS totalPaid,
//           COALESCE(SUM(sr.Balance_Due), 0) AS totalBalance
//        FROM sale_return sr
//        LEFT JOIN add_party p
//          ON p.Party_Id = sr.Party_Id
//        LEFT JOIN bank_accounts ba
//          ON ba.id = sr.Bank_Account_Id
//        ${whereSQL}`,
//       params
//     );

//     return res.status(200).json({
//       success: true,
//       currentPage: page,
//       totalPages: Math.ceil(total / limit),
//       totalReturns: total,
//       saleReturns: rows,
//       totals,
//     });
//   } catch (err) {
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };

// /* ── GET SINGLE (with items) ──────────────────────────────── */
// const getSaleReturnById = async (req, res, next) => {
//   let connection;
//   try {
//     connection = await db.getConnection();
//     const { Sale_Return_Id } = req.params;

//     const [[header]] = await connection.query(
//       `SELECT sr.*, p.Party_Name,
//         ba.Account_Display_Name AS Bank_Display_Name,
//         CASE
//           WHEN sr.Payment_Type = 'Bank'
//           THEN ba.Account_Display_Name
//           ELSE sr.Payment_Type
//         END AS Payment_Type_Display
//        FROM sale_return sr
//        LEFT JOIN add_party p ON p.Party_Id = sr.Party_Id
//        LEFT JOIN bank_accounts ba ON ba.id = sr.Bank_Account_Id
//        WHERE sr.id = ?`,
//       [Sale_Return_Id]
//     );

//     if (!header) {
//       return res.status(404).json({ success: false, message: "Sale Return not found" });
//     }

//     const [items] = await connection.query(
//       `SELECT sri.*, ai.Item_Name as Item_Name_Ref
//        FROM sale_return_items sri
//        LEFT JOIN add_item ai ON ai.Item_Id = sri.Item_Id
//        WHERE sri.Sale_Return_Id = ?`,
//       [Sale_Return_Id]
//     );

//     return res.status(200).json({ success: true, saleReturn: { ...header, items } });
//   } catch (err) {
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };
// const createSaleReturn = async (req, res, next) => {
//   let connection;

//   try {
//     const { Sale_Id } = req.params;

//     connection = await db.getConnection();
//     await connection.beginTransaction();

//     const {
//       Party_Name,
//       Return_Number,
//       Invoice_Number,
//       Invoice_Date,
//       Return_Date,
//       State_Of_Supply,
//       Total_Amount,
//       Total_Paid,
//       Balance_Due,
//       Payment_Type,
//       Bank_Account_Id,        // 🔹 added
//       Reference_Number,
//       items,
//     } = req.body;

//     /* ── validate ── */
//     if (!Sale_Id || !Party_Name || !Return_Date || !items?.length) {
//       await connection.rollback();
//       return res.status(400).json({
//         success: false,
//         message: "Sale_Id, Customer, Return Date and items are required",
//       });
//     }

//     if (Payment_Type === "Bank" && !Bank_Account_Id) {
//       await connection.rollback();
//       return res.status(400).json({ message: "Bank account is required for Bank payment type." });
//     }

//     /* ── party lookup ── */
//     const [[party]] = await connection.query(
//       `SELECT Party_Id FROM add_party WHERE Party_Name = ? LIMIT 1`,
//       [Party_Name]
//     );
//     if (!party) {
//       await connection.rollback();
//       return res.status(404).json({ success: false, message: "Customer not found" });
//     }

//     const totalAmount = Number(Total_Amount) || 0;
//     const totalPaid   = Number(Total_Paid)   || 0;
//     const balanceDue  = Number(Balance_Due)  || totalAmount - totalPaid;

//     /* ── insert header ── get insertId for items ── */
//     const [headerResult] = await connection.query(
//       `INSERT INTO sale_return
//          (Sale_Id, Party_Id, Return_Number, Invoice_Number,
//           Invoice_Date, Return_Date, State_Of_Supply,
//           Total_Amount, Total_Paid, Balance_Due, Payment_Type, Bank_Account_Id, Reference_Number)
//        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//       [
//         Sale_Id,
//         party.Party_Id,
//         Return_Number   || null,
//         Invoice_Number     || null,
//         Invoice_Date      || null,
//         Return_Date,
//         State_Of_Supply || null,
//         totalAmount,
//         totalPaid,
//         balanceDue,
//         Payment_Type    || "Cash",
//         Payment_Type === "Bank" ? Bank_Account_Id : null,   // 🔹 added
//         Reference_Number || null,
//       ]
//     );

//     const Sale_Return_Id = headerResult.insertId;

//     /* 🔹 record bank ledger — refund money going OUT to customer */
//     if (Payment_Type === "Bank" && Bank_Account_Id && totalPaid > 0) {
//       await recordBankTransaction({
//         connection,
//         bankAccountId: Bank_Account_Id,
//         txnType: "Sale_Return",
//         referenceId: Sale_Return_Id,
//         partyName: Party_Name,
//         amount: totalPaid,
//         txnDate: Return_Date,
//       });
//     }
//      if(Payment_Type === "Cash" && totalPaid > 0){  
// await recordCashTransaction({
//   connection,
//   isCash:      Payment_Type === "Cash",
//   txnType:     "Sale_Return",
//   referenceId: Sale_Return_Id,
//   partyName:   Party_Name,
//    amount: totalPaid,
//   txnDate:     Return_Date,
// })
//   }
//     /* ── insert items + restore stock ── */
//     for (const item of items) {
//       const {
//         Item_Name,
//         Item_Category,
//         Item_HSN,
//         Item_Unit,
//         Quantity,
//         Sale_Price,
//         Discount_On_Sale_Price,
//         Discount_Type_On_Sale_Price,
//         Tax_Type,
//         Tax_Amount,
//         Amount,
//       } = item;

//       const [[existingItem]] = await connection.query(
//         `SELECT Item_Id FROM add_item WHERE Item_Name = ? LIMIT 1`,
//         [Item_Name]
//       );

//       let Item_Id;

//       if (!existingItem) {
//         const [ins] = await connection.execute(
//           `INSERT INTO add_item
//              (Item_Name, Item_Category, Item_HSN, Item_Unit, Stock_Quantity, created_at, updated_at)
//            VALUES (?, ?, ?, ?, 0, NOW(), NOW())`,
//           [Item_Name, Item_Category || "", Item_HSN || "", Item_Unit || ""]
//         );
//         Item_Id = `ITM${ins.insertId}`;
//         await connection.execute(
//           `UPDATE add_item SET Item_Id = ? WHERE id = ?`,
//           [Item_Id, ins.insertId]
//         );
//       } else {
//         Item_Id = existingItem.Item_Id;
//       }

//       await connection.query(
//         `INSERT INTO sale_return_items
//            (Sale_Return_Id, Item_Id, Item_Name,
//             Item_Category, Item_HSN, Item_Unit, Quantity, Sale_Price,
//             Discount_On_Sale_Price, Discount_Type_On_Sale_Price,
//             Tax_Type, Tax_Amount, Amount)
//          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//         [
//           Sale_Return_Id,
//           Item_Id,
//           Item_Name,
//           Item_Category || "",
//           Item_HSN      || "",
//           Item_Unit     || "",
//           Number(Quantity),
//           Number(Sale_Price),
//           Number(Discount_On_Sale_Price) || 0,
//           Discount_Type_On_Sale_Price    || "percentage",
//           Tax_Type      || null,
//           Number(Tax_Amount) || 0,
//           Number(Amount),
//         ]
//       );

//       /* restore stock — item is coming back into inventory */
//       await connection.query(
//         `UPDATE add_item
//          SET Stock_Quantity = Stock_Quantity + ?, updated_at = NOW()
//          WHERE Item_Id = ?`,
//         [Number(Quantity), Item_Id]
//       );
//     }

//     await connection.commit();
//     return res.status(201).json({
//       success: true,
//       message: "Sale Return created",
//       Sale_Return_Id,
//     });

//   } catch (err) {
//     if (connection) await connection.rollback();
//     console.error("❌ createSaleReturn:", err);
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };

// /* ── EDIT ─────────────────────────────────────────────────── */
// const editSaleReturn = async (req, res, next) => {
//   let connection;
//   try {
//     const { Sale_Return_Id } = req.params;

//     connection = await db.getConnection();
//     await connection.beginTransaction();

//     /* check exists */
//     const [[existing]] = await connection.query(
//       `SELECT * FROM sale_return WHERE id = ?`,
//       [Sale_Return_Id]
//     );
//     if (!existing) {
//       await connection.rollback();
//       return res.status(404).json({ success: false, message: "Sale Return not found" });
//     }

//     const {
//       Party_Name,
//       Return_Number,
//       Invoice_Number,
//       Invoice_Date,
//       Return_Date,
//       State_Of_Supply,
//       Total_Amount,
//       Total_Paid,
//       Balance_Due,
//       Payment_Type,
//       Bank_Account_Id,        // 🔹 added
//       Reference_Number,
//       items,
//     } = req.body;

//     if (Payment_Type === "Bank" && !Bank_Account_Id) {
//       await connection.rollback();
//       return res.status(400).json({ message: "Bank account is required for Bank payment type." });
//     }

//     /* party */
//     const [[party]] = await connection.query(
//       `SELECT Party_Id FROM add_party WHERE Party_Name = ? LIMIT 1`,
//       [Party_Name]
//     );
//     if (!party) {
//       await connection.rollback();
//       return res.status(404).json({ success: false, message: "Customer not found" });
//     }

//     const totalAmount = Number(Total_Amount) || 0;
//     const totalPaid   = Number(Total_Paid)   || 0;
//     const balanceDue  = Number(Balance_Due)  || totalAmount - totalPaid;

//     /* update header */
//     await connection.query(
//       `UPDATE sale_return SET
//          Party_Id = ?, Return_Number = ?, Invoice_Number = ?, Invoice_Date= ?,
//          Return_Date = ?, State_Of_Supply = ?,
//          Total_Amount = ?, Total_Paid = ?, Balance_Due = ?,
//          Payment_Type = ?, Bank_Account_Id = ?, Reference_Number = ?, updated_at = NOW()
//        WHERE id = ?`,
//       [
//         party.Party_Id,
//         Return_Number   || null,
//         Invoice_Number     || null,
//         Invoice_Date      || null,
//         Return_Date,
//         State_Of_Supply || null,
//         totalAmount,
//         totalPaid,
//         balanceDue,
//         Payment_Type    || "Cash",
//         Payment_Type === "Bank" ? Bank_Account_Id : null,   // 🔹 added
//         Reference_Number || null,
//         Sale_Return_Id,
//       ]
//     );

//     /* 🔹 always call — helper handles insert / update / delete internally
//        (covers Cash→Bank, Bank→Cash, Bank→Bank switch, and amount edits) */
//     await recordBankTransaction({
//       connection,
//       bankAccountId: Payment_Type === "Bank" ? Bank_Account_Id : null,
//       txnType: "Sale_Return",
//       referenceId: Number(Sale_Return_Id),
//       partyName: Party_Name,
//       amount: totalPaid,
//       txnDate: Return_Date,
//     });

//     await recordCashTransaction({
//   connection,
//   isCash:      Payment_Type === "Cash",
//   txnType:     "Sale_Return",
//    referenceId: Number(Sale_Return_Id),
//   partyName:   Party_Name,
//    amount: totalPaid,
//   txnDate:     Return_Date,
// })

//     /* fetch old items */
//     const [oldItems] = await connection.query(
//       `SELECT * FROM sale_return_items WHERE Sale_Return_Id = ?`,
//       [Sale_Return_Id]
//     );
//     const oldMap = new Map(oldItems.map((i) => [i.Item_Id, i]));
//     const newItemIds = new Set();

//     /* upsert new items */
//     for (const item of items) {
//       const {
//         Item_Name, Item_Category, Item_HSN, Item_Unit,
//         Quantity, Sale_Price,
//         Discount_On_Sale_Price, Discount_Type_On_Sale_Price,
//         Tax_Type, Tax_Amount, Amount,
//       } = item;

//       const [[existingItem]] = await connection.query(
//         `SELECT Item_Id FROM add_item WHERE Item_Name = ? LIMIT 1`,
//         [Item_Name]
//       );

//       let Item_Id;
//       if (!existingItem) {
//         const [ins] = await connection.execute(
//           `INSERT INTO add_item
//              (Item_Name, Item_Category, Item_HSN, Item_Unit, Stock_Quantity, created_at, updated_at)
//            VALUES (?, ?, ?, ?, 0, NOW(), NOW())`,
//           [Item_Name, Item_Category || "", Item_HSN || "", Item_Unit || ""]
//         );
//         Item_Id = `ITM${ins.insertId}`;
//         await connection.execute(`UPDATE add_item SET Item_Id = ? WHERE id = ?`, [Item_Id, ins.insertId]);
//       } else {
//         Item_Id = existingItem.Item_Id;
//       }

//       newItemIds.add(Item_Id);
//       const old = oldMap.get(Item_Id);

//       if (old) {
//         await connection.query(
//           `UPDATE sale_return_items SET
//              Quantity = ?, Sale_Price = ?,
//              Discount_On_Sale_Price = ?, Discount_Type_On_Sale_Price = ?,
//              Tax_Type = ?, Tax_Amount = ?, Amount = ?, updated_at = NOW()
//            WHERE id = ?`,
//           [
//             Number(Quantity), Number(Sale_Price),
//             Number(Discount_On_Sale_Price) || 0,
//             Discount_Type_On_Sale_Price    || "percentage",
//             Tax_Type || null, Number(Tax_Amount) || 0,
//             Number(Amount),
//             old.id,
//           ]
//         );

//         const diff = Number(Quantity) - old.Quantity;
//         if (diff !== 0) {
//           await connection.query(
//             `UPDATE add_item SET Stock_Quantity = Stock_Quantity + ?, updated_at = NOW()
//              WHERE Item_Id = ?`,
//             [diff, Item_Id]
//           );
//         }
//       } else {
//         await connection.query(
//           `INSERT INTO sale_return_items
//              (Sale_Return_Id, Item_Id, Item_Name,
//               Item_Category, Item_HSN, Item_Unit, Quantity, Sale_Price,
//               Discount_On_Sale_Price, Discount_Type_On_Sale_Price,
//               Tax_Type, Tax_Amount, Amount)
//            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//           [
//             Sale_Return_Id, Item_Id, Item_Name,
//             Item_Category || "", Item_HSN || "", Item_Unit || "",
//             Number(Quantity), Number(Sale_Price),
//             Number(Discount_On_Sale_Price) || 0,
//             Discount_Type_On_Sale_Price    || "percentage",
//             Tax_Type || null, Number(Tax_Amount) || 0, Number(Amount),
//           ]
//         );
//         await connection.query(
//           `UPDATE add_item SET Stock_Quantity = Stock_Quantity + ?, updated_at = NOW()
//            WHERE Item_Id = ?`,
//           [Number(Quantity), Item_Id]
//         );
//       }
//     }

//     /* delete removed items — reverse stock restoration */
//     for (const old of oldItems) {
//       if (!newItemIds.has(old.Item_Id)) {
//         await connection.query(
//           `DELETE FROM sale_return_items WHERE id = ?`,
//           [old.id]
//         );
//         await connection.query(
//           `UPDATE add_item SET Stock_Quantity = Stock_Quantity - ?, updated_at = NOW()
//            WHERE Item_Id = ?`,
//           [old.Quantity, old.Item_Id]
//         );
//       }
//     }

//     await connection.commit();
//     return res.status(200).json({ success: true, message: "Sale Return updated", Sale_Return_Id });
//   } catch (err) {
//     if (connection) await connection.rollback();
//     console.error("❌ editSaleReturn:", err);
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };

// /* ── DELETE ───────────────────────────────────────────────── */
// const deleteSaleReturn = async (req, res, next) => {
//   let connection;
//   try {
//     const { id } = req.params;

//     connection = await db.getConnection();
//     await connection.beginTransaction();

//     /* fetch items first to reverse stock */
//     const [items] = await connection.query(
//       `SELECT Item_Id, Quantity FROM sale_return_items WHERE Sale_Return_Id = ?`,
//       [id]
//     );

//     /* reverse stock for each returned item (they leave inventory again) */
//     for (const item of items) {
//       await connection.query(
//         `UPDATE add_item SET Stock_Quantity = Stock_Quantity - ?, updated_at = NOW()
//          WHERE Item_Id = ?`,
//         [item.Quantity, item.Item_Id]
//       );
//     }

//     /* delete items then header */
//     await connection.query(
//       `DELETE FROM sale_return_items WHERE Sale_Return_Id = ?`,
//       [id]
//     );
//     await connection.query(
//       `DELETE FROM sale_return WHERE id = ?`,
//       [id]
//     );

//     await connection.commit();
//     return res.status(200).json({ success: true, message: "Sale Return deleted" });
//   } catch (err) {
//     if (connection) await connection.rollback();
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };

// export {
//   getAllSaleReturns,
//   getSaleReturnById,
//   createSaleReturn,
//   editSaleReturn,
//   deleteSaleReturn,
// };



import db from "../config/db.js";
import { validateSplits, insertPaymentSplits, deletePaymentSplits } from "../utils/paymentSplitHelper.js";

/* ── GET ALL ──────────────────────────────────────────────── */
const getAllSaleReturns = async (req, res, next) => {
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
        LOWER(p.Party_Name)      LIKE ? OR
        LOWER(sr.Return_Number)  LIKE ? OR
        LOWER(sr.Invoice_Number) LIKE ? OR
        CAST(sr.Total_Amount AS CHAR) LIKE ? OR
        CAST(sr.Balance_Due AS CHAR) LIKE ? OR
        CAST(sr.Total_Paid AS CHAR) LIKE ?
      )`);
      const like = `%${search}%`;
      params.push(like, like, like, like, like, like);
    }

    if (fromDate && toDate) {
      whereClauses.push(`DATE(sr.Return_Date) BETWEEN ? AND ?`);
      params.push(fromDate, toDate);
    } else if (fromDate) {
      whereClauses.push(`DATE(sr.Return_Date) >= ?`);
      params.push(fromDate);
    } else if (toDate) {
      whereClauses.push(`DATE(sr.Return_Date) <= ?`);
      params.push(toDate);
    }

    const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const [rows] = await connection.query(
      `SELECT sr.*, p.Party_Name
       FROM sale_return sr
       LEFT JOIN add_party p ON p.Party_Id = sr.Party_Id
       ${whereSQL}
       ORDER BY sr.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // 🔹 attach Payment_Type_Display per row from splits
    for (const row of rows) {
      const [splits] = await connection.query(
        `SELECT ps.Payment_Type, ba.Account_Display_Name
         FROM payment_splits ps
         LEFT JOIN bank_accounts ba ON ba.id = ps.Bank_Account_Id
         WHERE ps.Source_Type = 'Sale_Return' AND ps.Source_Id = ?`,
        [row.id]
      );
      const labels = splits.map((s) =>
        s.Payment_Type === "Bank" ? s.Account_Display_Name : s.Payment_Type
      );
      const counts = {};
      labels.forEach((l) => (counts[l] = (counts[l] || 0) + 1));
      row.Payment_Type_Display = Object.entries(counts)
        .map(([label, count]) => (count > 1 ? `${label} (x${count})` : label))
        .join(",") || "—";
    }

    const [[{ total }]] = await connection.query(
      `SELECT COUNT(*) AS total
       FROM sale_return sr
       LEFT JOIN add_party p ON p.Party_Id = sr.Party_Id
       ${whereSQL}`,
      params
    );

    const [[totals]] = await connection.query(
      `SELECT
         COALESCE(SUM(sr.Total_Amount), 0) AS totalAmount,
         COALESCE(SUM(sr.Total_Paid),   0) AS totalPaid,
         COALESCE(SUM(sr.Balance_Due),  0) AS totalBalance
       FROM sale_return sr
       LEFT JOIN add_party p ON p.Party_Id = sr.Party_Id
       ${whereSQL}`,
      params
    );

    return res.status(200).json({
      success: true,
      currentPage:  page,
      totalPages:   Math.ceil(total / limit),
      totalReturns: total,
      saleReturns:  rows,
      totals,
    });
  } catch (err) {
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

/* ── GET SINGLE ───────────────────────────────────────────── */
const getSaleReturnById = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();
    const { Sale_Return_Id } = req.params;

    const [[header]] = await connection.query(
      `SELECT sr.*, p.Party_Name
       FROM sale_return sr
       LEFT JOIN add_party p ON p.Party_Id = sr.Party_Id
       WHERE sr.id = ?`,
      [Sale_Return_Id]
    );

    if (!header) {
      return res.status(404).json({ success: false, message: "Sale Return not found" });
    }

    const [items] = await connection.query(
      `SELECT sri.*,
              ai.Item_Name AS Item_Name,
              ai.Item_HSN  AS Item_HSN,
              ai.Item_Unit AS Item_Unit,
               ai.Item_Category AS Item_Category
       FROM sale_return_items sri
       LEFT JOIN add_item ai ON ai.Item_Id = sri.Item_Id
       WHERE sri.Sale_Return_Id = ?`,
      [Sale_Return_Id]
    );

    // 🔹 fetch splits
    const [splits] = await connection.query(
      `SELECT ps.*, ba.Account_Display_Name
       FROM payment_splits ps
       LEFT JOIN bank_accounts ba ON ba.id = ps.Bank_Account_Id
       WHERE ps.Source_Type = 'Sale_Return' AND ps.Source_Id = ?
       ORDER BY ps.id ASC`,
      [Sale_Return_Id]
    );

    return res.status(200).json({
      success: true,
      saleReturn: { ...header, items, splits },
    });
  } catch (err) {
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

/* ── CREATE ───────────────────────────────────────────────── */
const createSaleReturn = async (req, res, next) => {
  let connection;
  try {
    const { Sale_Id } = req.params;

    connection = await db.getConnection();
    await connection.beginTransaction();

    const {
      Party_Name,
      Return_Number,
      Invoice_Number,
      Invoice_Date,
      Return_Date,
      State_Of_Supply,
      Total_Amount,
      Total_Paid,
      Balance_Due,
      Reference_Number,
      splits,    // 🔹 replaces single Payment_Type / Bank_Account_Id
      items,
    } = req.body;

    if (!Sale_Id || !Party_Name || !Return_Date || !items?.length) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Sale_Id, Customer, Return Date and items are required",
      });
    }

    const totalAmount = Number(Total_Amount) || 0;
    const totalPaid   = Number(Total_Paid)   || 0;
    const balanceDue  = Number(Balance_Due)  || totalAmount - totalPaid;

    // 🔹 paid cannot exceed total
    if (totalPaid > totalAmount) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Paid amount should be less than or equal to Total Amount",
      });
    }

    // 🔹 validate splits sum === totalPaid
    if (totalPaid > 0) {
      try {
        validateSplits(splits, totalPaid);
      } catch (validationErr) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: validationErr.message });
      }
    }

    const [[party]] = await connection.query(
      `SELECT Party_Id FROM add_party WHERE Party_Name = ? LIMIT 1`,
      [Party_Name]
    );
    if (!party) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    const [headerResult] = await connection.query(
      `INSERT INTO sale_return
         (Sale_Id, Party_Id, Return_Number, Invoice_Number,
          Invoice_Date, Return_Date, State_Of_Supply,
          Total_Amount, Total_Paid, Balance_Due, Reference_Number)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Sale_Id,
        party.Party_Id,
        Return_Number    || null,
        Invoice_Number   || null,
        Invoice_Date     || null,
        Return_Date,
        State_Of_Supply  || null,
        totalAmount,
        totalPaid,
        balanceDue,
        Reference_Number || null,
      ]
    );

    const Sale_Return_Id = headerResult.insertId;

    // 🔹 insert splits + fan out to bank/cash ledgers
    if (totalPaid > 0 && Array.isArray(splits) && splits.length > 0) {
      await insertPaymentSplits({
        connection,
        sourceType: "Sale_Return",
        sourceId:   Sale_Return_Id,
        partyName:  Party_Name,
        txnDate:    Return_Date,
        splits,
      });
    }

    // items loop — unchanged, item name/hsn pulled from add_item via FK
    for (const item of items) {
      const {
        Item_Name,
        Item_Category,
        Item_HSN,
        Item_Unit,
        Quantity,
        Sale_Price,
        Discount_On_Sale_Price,
        Discount_Type_On_Sale_Price,
        Tax_Type,
        Tax_Amount,
        Amount,
      } = item;

      const [[existingItem]] = await connection.query(
        `SELECT Item_Id FROM add_item WHERE Item_Name = ? LIMIT 1`,
        [Item_Name]
      );

      let Item_Id;
      if (!existingItem) {
        const [ins] = await connection.execute(
          `INSERT INTO add_item
             (Item_Name, Item_Category, Item_HSN, Item_Unit, Stock_Quantity, created_at, updated_at)
           VALUES (?, ?, ?, ?, 0, NOW(), NOW())`,
          [Item_Name, Item_Category || "", Item_HSN || "", Item_Unit || ""]
        );
        Item_Id = `ITM${ins.insertId}`;
        await connection.execute(
          `UPDATE add_item SET Item_Id = ? WHERE id = ?`,
          [Item_Id, ins.insertId]
        );
      } else {
        Item_Id = existingItem.Item_Id;
      }

      await connection.query(
        `INSERT INTO sale_return_items
           (Sale_Return_Id, Item_Id, Quantity, Sale_Price,
            Discount_On_Sale_Price, Discount_Type_On_Sale_Price,
            Tax_Type, Tax_Amount, Amount)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          Sale_Return_Id,
          Item_Id,
          Number(Quantity),
          Number(Sale_Price),
          Number(Discount_On_Sale_Price) || 0,
          Discount_Type_On_Sale_Price    || "Percentage",
          Tax_Type                       || null,
          Number(Tax_Amount)             || 0,
          Number(Amount),
        ]
      );

      // restore stock — item coming back into inventory
      await connection.query(
        `UPDATE add_item SET Stock_Quantity = Stock_Quantity + ?, updated_at = NOW()
         WHERE Item_Id = ?`,
        [Number(Quantity), Item_Id]
      );
    }

    await connection.commit();
    return res.status(201).json({
      success: true,
      message: "Sale Return created",
      Sale_Return_Id,
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("❌ createSaleReturn:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

/* ── EDIT ─────────────────────────────────────────────────── */
const editSaleReturn = async (req, res, next) => {
  let connection;
  try {
    const { Sale_Return_Id } = req.params;

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [[existing]] = await connection.query(
      `SELECT * FROM sale_return WHERE id = ?`,
      [Sale_Return_Id]
    );
    if (!existing) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Sale Return not found" });
    }

    const {
      Party_Name,
      Return_Number,
      Invoice_Number,
      Invoice_Date,
      Return_Date,
      State_Of_Supply,
      Total_Amount,
      Total_Paid,
      Balance_Due,
      Reference_Number,
      splits,   // 🔹 replaces single Payment_Type / Bank_Account_Id
      items,
    } = req.body;

    const [[party]] = await connection.query(
      `SELECT Party_Id FROM add_party WHERE Party_Name = ? LIMIT 1`,
      [Party_Name]
    );
    if (!party) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    const totalAmount = Number(Total_Amount) || 0;
    const totalPaid   = Number(Total_Paid)   || 0;
    const balanceDue  = Number(Balance_Due)  || totalAmount - totalPaid;

    // 🔹 paid cannot exceed total
    if (totalPaid > totalAmount) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Paid amount should be less than or equal to Total Amount",
      });
    }

    // 🔹 validate splits
    if (totalPaid > 0) {
      try {
        validateSplits(splits, totalPaid);
      } catch (validationErr) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: validationErr.message });
      }
    }

    await connection.query(
      `UPDATE sale_return SET
         Party_Id = ?, Return_Number = ?, Invoice_Number = ?, Invoice_Date = ?,
         Return_Date = ?, State_Of_Supply = ?,
         Total_Amount = ?, Total_Paid = ?, Balance_Due = ?,
         Reference_Number = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        party.Party_Id,
        Return_Number    || null,
        Invoice_Number   || null,
        Invoice_Date     || null,
        Return_Date,
        State_Of_Supply  || null,
        totalAmount,
        totalPaid,
        balanceDue,
        Reference_Number || null,
        Sale_Return_Id,
      ]
    );

    // 🔹 wipe old splits + ledger rows, re-insert fresh ones
    await deletePaymentSplits({
      connection,
      sourceType: "Sale_Return",
      sourceId:   Number(Sale_Return_Id),
    });

    if (totalPaid > 0 && Array.isArray(splits) && splits.length > 0) {
      await insertPaymentSplits({
        connection,
        sourceType: "Sale_Return",
        sourceId:   Number(Sale_Return_Id),
        partyName:  Party_Name,
        txnDate:    Return_Date,
        splits,
      });
    }

    // items loop — unchanged
    const [oldItems] = await connection.query(
      `SELECT * FROM sale_return_items WHERE Sale_Return_Id = ?`,
      [Sale_Return_Id]
    );
    const oldMap    = new Map(oldItems.map((i) => [i.Item_Id, i]));
    const newItemIds = new Set();

    for (const item of items) {
      const {
        Item_Name, Item_Category, Item_HSN, Item_Unit,
        Quantity, Sale_Price,
        Discount_On_Sale_Price, Discount_Type_On_Sale_Price,
        Tax_Type, Tax_Amount, Amount,
      } = item;

      const [[existingItem]] = await connection.query(
        `SELECT Item_Id FROM add_item WHERE Item_Name = ? LIMIT 1`,
        [Item_Name]
      );

      let Item_Id;
      if (!existingItem) {
        const [ins] = await connection.execute(
          `INSERT INTO add_item
             (Item_Name, Item_Category, Item_HSN, Item_Unit, Stock_Quantity, created_at, updated_at)
           VALUES (?, ?, ?, ?, 0, NOW(), NOW())`,
          [Item_Name, Item_Category || "", Item_HSN || "", Item_Unit || ""]
        );
        Item_Id = `ITM${ins.insertId}`;
        await connection.execute(
          `UPDATE add_item SET Item_Id = ? WHERE id = ?`,
          [Item_Id, ins.insertId]
        );
      } else {
        Item_Id = existingItem.Item_Id;
      }

      newItemIds.add(Item_Id);
      const old = oldMap.get(Item_Id);

      if (old) {
        await connection.query(
          `UPDATE sale_return_items SET
             Quantity = ?, Sale_Price = ?,
             Discount_On_Sale_Price = ?, Discount_Type_On_Sale_Price = ?,
             Tax_Type = ?, Tax_Amount = ?, Amount = ?, updated_at = NOW()
           WHERE id = ?`,
          [
            Number(Quantity), Number(Sale_Price),
            Number(Discount_On_Sale_Price) || 0,
            Discount_Type_On_Sale_Price    || "Percentage",
            Tax_Type || null,
            Number(Tax_Amount) || 0,
            Number(Amount),
            old.id,
          ]
        );

        const diff = Number(Quantity) - old.Quantity;
        if (diff !== 0) {
          await connection.query(
            `UPDATE add_item SET Stock_Quantity = Stock_Quantity + ?, updated_at = NOW()
             WHERE Item_Id = ?`,
            [diff, Item_Id]
          );
        }
      } else {
        await connection.query(
          `INSERT INTO sale_return_items
             (Sale_Return_Id, Item_Id, Quantity, Sale_Price,
              Discount_On_Sale_Price, Discount_Type_On_Sale_Price,
              Tax_Type, Tax_Amount, Amount)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            Sale_Return_Id,
            Item_Id,
            Number(Quantity), Number(Sale_Price),
            Number(Discount_On_Sale_Price) || 0,
            Discount_Type_On_Sale_Price    || "Percentage",
            Tax_Type || null,
            Number(Tax_Amount) || 0,
            Number(Amount),
          ]
        );
        await connection.query(
          `UPDATE add_item SET Stock_Quantity = Stock_Quantity + ?, updated_at = NOW()
           WHERE Item_Id = ?`,
          [Number(Quantity), Item_Id]
        );
      }
    }

    // delete removed items — reverse stock restoration
    for (const old of oldItems) {
      if (!newItemIds.has(old.Item_Id)) {
        await connection.query(
          `DELETE FROM sale_return_items WHERE id = ?`,
          [old.id]
        );
        await connection.query(
          `UPDATE add_item SET Stock_Quantity = Stock_Quantity - ?, updated_at = NOW()
           WHERE Item_Id = ?`,
          [old.Quantity, old.Item_Id]
        );
      }
    }

    await connection.commit();
    return res.status(200).json({ success: true, message: "Sale Return updated", Sale_Return_Id });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("❌ editSaleReturn:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

/* ── DELETE ───────────────────────────────────────────────── */
const deleteSaleReturn = async (req, res, next) => {
  let connection;
  try {
    const { id } = req.params;

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [items] = await connection.query(
      `SELECT Item_Id, Quantity FROM sale_return_items WHERE Sale_Return_Id = ?`,
      [id]
    );

    // reverse stock
    for (const item of items) {
      await connection.query(
        `UPDATE add_item SET Stock_Quantity = Stock_Quantity - ?, updated_at = NOW()
         WHERE Item_Id = ?`,
        [item.Quantity, item.Item_Id]
      );
    }

    // 🔹 wipe splits + ledger rows before deleting header
    await deletePaymentSplits({
      connection,
      sourceType: "Sale_Return",
      sourceId:   Number(id),
    });

    await connection.query(
      `DELETE FROM sale_return_items WHERE Sale_Return_Id = ?`,
      [id]
    );
    await connection.query(
      `DELETE FROM sale_return WHERE id = ?`,
      [id]
    );

    await connection.commit();
    return res.status(200).json({ success: true, message: "Sale Return deleted" });
  } catch (err) {
    if (connection) await connection.rollback();
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

export {
  getAllSaleReturns,
  getSaleReturnById,
  createSaleReturn,
  editSaleReturn,
  deleteSaleReturn,
};