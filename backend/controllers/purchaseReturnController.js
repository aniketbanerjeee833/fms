/* ═══════════════════════════════════════════════════════════════════
   1. SQL — run once
═══════════════════════════════════════════════════════════════════
 
-- Master table
CREATE TABLE IF NOT EXISTS purchase_return (
  
  Purchase_Id          VARCHAR(255)    NOT NULL,               -- original purchase being returned
  Party_Id             VARCHAR(255)    NOT NULL,
  Return_Number            VARCHAR(255)    DEFAULT NULL,           -- manual entry like "ALCO/17135/2627"
  Bill_Number          VARCHAR(255)    DEFAULT NULL,           -- original bill number (pre-filled)
  Bill_Date            DATE           DEFAULT NULL,           -- original bill date  (pre-filled)
  Return_Date          DATE           NOT NULL,               -- "Date" field in UI
  State_Of_Supply      VARCHAR(255)   DEFAULT NULL,
  Total_Amount         DECIMAL(10,2)  NOT NULL DEFAULT 0,
 Total_Received           DECIMAL(10,2)  NOT NULL DEFAULT 0,
  Balance_Due          DECIMAL(10,2)  NOT NULL DEFAULT 0,
    Payment_Type ENUM('Cash', "Cheque", "Online") DEFAULT "Cash",
    Reference_Number VARCHAR(255) DEFAULT NULL,
  created_at           TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (Party_Id)    REFERENCES add_party(Party_Id),
  FOREIGN KEY (Purchase_Id) REFERENCES add_purchase(Purchase_Id)
);
 
-- Items table
CREATE TABLE IF NOT EXISTS purchase_return_items (
  
  Purchase_Return_Id        VARCHAR(20)    NOT NULL,
  Item_Id                   VARCHAR(20)    NOT NULL,
  Item_Name                 VARCHAR(255)   NOT NULL,
  Item_Category             VARCHAR(100)   DEFAULT NULL,
  Item_HSN                  VARCHAR(255)    DEFAULT NULL,
  Item_Unit                 VARCHAR(255)    DEFAULT NULL,
  Quantity                  INT(10)            NOT NULL DEFAULT 0,
  Purchase_Price            DECIMAL(10,2)  NOT NULL DEFAULT 0,
  Discount_On_Purchase_Price DECIMAL(10,2) DEFAULT 0,
  Discount_Type_On_Purchase_Price ENUM('percentage', 'amount') DEFAULT 'percentage',
  Tax_Type                  VARCHAR(255)   DEFAULT NULL,
  Tax_Amount                DECIMAL(10,2)  DEFAULT 0,
  Amount                    DECIMAL(10,2)  NOT NULL DEFAULT 0,
  created_at                TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  updated_at                TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (Purchase_Return_Id) REFERENCES purchase_return(Purchase_Return_Id)
);
 
═══════════════════════════════════════════════════════════════════ */
//  import db from "../config/db.js";
// import { recordBankTransaction } from "../utils/bankAccountHelper.js";
// import { recordCashTransaction } from "../utils/cashTransactionHelper.js";
 
// /* ═══════════════════════════════════════════════════════════════════
//    2. CONTROLLERS  (purchaseReturnController.js)
// ═══════════════════════════════════════════════════════════════════ */

 
// /* ── GET ALL ──────────────────────────────────────────────── */
// const getAllPurchaseReturns = async (req, res, next) => {
//   let connection;
//   try {
//     connection = await db.getConnection();

//     const page     = parseInt(req.query.page, 10) || 1;
//     const limit    = 10;
//     const offset   = (page - 1) * limit;
//     const search   = req.query.search?.trim().toLowerCase() || "";
//     const fromDate = req.query.fromDate || null;
//     const toDate   = req.query.toDate   || null;

//     const whereClauses = [];
//     const params       = [];

//     if (search) {
//       whereClauses.push(`(
//         LOWER(a.Party_Name)         LIKE ? OR
//         LOWER(pr.Return_Number)     LIKE ? OR
//         LOWER(pr.Bill_Number)       LIKE ? OR
//         LOWER(ba.Account_Display_Name) LIKE ? OR
//         CAST(pr.Total_Amount AS CHAR) LIKE ?
//       )`);
//       const like = `%${search}%`;
//       params.push(like, like, like, like, like);
//     }

//     if (fromDate && toDate) {
//       whereClauses.push(`DATE(pr.Return_Date) BETWEEN ? AND ?`);
//       params.push(fromDate, toDate);
//     } else if (fromDate) {
//       whereClauses.push(`DATE(pr.Return_Date) >= ?`);
//       params.push(fromDate);
//     } else if (toDate) {
//       whereClauses.push(`DATE(pr.Return_Date) <= ?`);
//       params.push(toDate);
//     }

//     const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

//     const [rows] = await connection.query(
//       `SELECT pr.*, a.Party_Name,
//          ba.Account_Display_Name AS Bank_Display_Name,
//          CASE
//            WHEN pr.Payment_Type = 'Bank' THEN ba.Account_Display_Name
//            ELSE pr.Payment_Type
//          END AS Payment_Type_Display
//        FROM purchase_return pr
//        LEFT JOIN add_party a ON a.Party_Id = pr.Party_Id
//        LEFT JOIN bank_accounts ba ON pr.Bank_Account_Id = ba.id
//        ${whereSQL}
//        ORDER BY pr.created_at DESC
//        LIMIT ? OFFSET ?`,
//       [...params, limit, offset]
//     );

//     const [[{ total }]] = await connection.query(
//       `SELECT COUNT(*) AS total
//        FROM purchase_return pr
//        LEFT JOIN add_party a ON a.Party_Id = pr.Party_Id
//        LEFT JOIN bank_accounts ba ON pr.Bank_Account_Id = ba.id
//        ${whereSQL}`,
//       params
//     );

//     const [[totals]] = await connection.query(
//       `SELECT
//          COALESCE(SUM(pr.Total_Amount), 0) AS totalAmount,
//          COALESCE(SUM(pr.Total_Received),   0) AS totalReceived,
//          COALESCE(SUM(pr.Balance_Due),  0) AS totalBalance
//        FROM purchase_return pr
//        LEFT JOIN add_party a ON a.Party_Id = pr.Party_Id
//        LEFT JOIN bank_accounts ba ON pr.Bank_Account_Id = ba.id
//        ${whereSQL}`,
//       params
//     );

//     return res.status(200).json({
//       success:       true,
//       currentPage:   page,
//       totalPages:    Math.ceil(total / limit),
//       totalReturns:  total,
//       purchaseReturns: rows,
//       totals,
//     });
//   } catch (err) {
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };
// /* ── GET SINGLE (with items) ──────────────────────────────── */
// const getPurchaseReturnById = async (req, res, next) => {
//   let connection;
//   try {
//     connection = await db.getConnection();
//     const { Purchase_Return_Id } = req.params;
 
//     const [[header]] = await connection.query(
//       `SELECT pr.*, a.Party_Name,
//         ba.Account_Display_Name AS Bank_Display_Name,
//         CASE
//           WHEN pr.Payment_Type = 'Bank'
//           THEN ba.Account_Display_Name
//           ELSE pr.Payment_Type
//         END AS Payment_Type_Display
//        FROM purchase_return pr
//        LEFT JOIN add_party a ON a.Party_Id = pr.Party_Id
//         LEFT JOIN bank_accounts ba ON ba.id = pr.Bank_Account_Id
//        WHERE pr.id = ?`,
//       [Purchase_Return_Id]
//     );
 
//     if (!header) {
//       return res.status(404).json({ success: false, message: "Purchase Return not found" });
//     }
 
//     const [items] = await connection.query(
//       `SELECT pri.*, ai.Item_Name as Item_Name_Ref
//        FROM purchase_return_items pri
//        LEFT JOIN add_item ai ON ai.Item_Id = pri.Item_Id
//        WHERE pri.Purchase_Return_Id = ?`,
//       [Purchase_Return_Id]
//     );
 
//     return res.status(200).json({ success: true, purchaseReturn: { ...header, items } });
//   } catch (err) {
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };
 


// /* ── CREATE ───────────────────────────────────────────────── */
// const createPurchaseReturn = async (req, res, next) => {
//   let connection;

//   try {
//     const { Purchase_Id } = req.params;

//     connection = await db.getConnection();
//     await connection.beginTransaction();

//     const {
//       Party_Name,
//       Return_Number,
//       Bill_Number,
//       Bill_Date,
//       Return_Date,
//       State_Of_Supply,
//       Total_Amount,
//       Total_Received,
//       Balance_Due,
//       Payment_Type,
//       Bank_Account_Id,        // 🔹 added
//       Reference_Number,
//       items,
//     } = req.body;

//     /* ── validate ── */
//     if (!Purchase_Id || !Party_Name || !Return_Date || !items?.length) {
//       await connection.rollback();
//       return res.status(400).json({
//         success: false,
//         message: "Purchase_Id, Party, Return Date and items are required",
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
//       return res.status(404).json({ success: false, message: "Party not found" });
//     }

//     const totalAmount   = Number(Total_Amount)   || 0;
//     const totalReceived = Number(Total_Received)  || 0;
//     const balanceDue    = Number(Balance_Due)     || totalAmount - totalReceived;

//     /* ── insert header ── get insertId for items ── */
//     const [headerResult] = await connection.query(
//       `INSERT INTO purchase_return
//          (Purchase_Id, Party_Id, Return_Number, Bill_Number,
//           Bill_Date, Return_Date, State_Of_Supply,
//           Total_Amount, Total_Received, Balance_Due, Payment_Type, Bank_Account_Id, Reference_Number)
//        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//       [
//         Purchase_Id,
//         party.Party_Id,
//         Return_Number  || null,
//         Bill_Number    || null,
//         Bill_Date      || null,
//         Return_Date,
//         State_Of_Supply || null,
//         totalAmount,
//         totalReceived,
//         balanceDue,
//         Payment_Type   || "Cash",
//         Payment_Type === "Bank" ? Bank_Account_Id : null,   // 🔹 added
//         Reference_Number || null
//       ]
//     );

//     const Purchase_Return_Id = headerResult.insertId;

//     /* 🔹 record bank ledger — money coming IN from vendor refund */
//     if (Payment_Type === "Bank" && Bank_Account_Id && totalReceived > 0) {
//       await recordBankTransaction({
//         connection,
//         bankAccountId: Bank_Account_Id,
//         txnType: "Purchase_Return",
//         referenceId: Purchase_Return_Id,
//         partyName: Party_Name,
//         amount: totalReceived,
//         txnDate: Return_Date,
//       });
//     }
//   if(Payment_Type === "Cash" && totalReceived > 0){  
// await recordCashTransaction({
//   connection,
//   isCash:      Payment_Type === "Cash",
//   txnType:     "Purchase_Return",
//   referenceId: Purchase_Return_Id,
//   partyName:   Party_Name,
//   amount:      totalReceived,
//   txnDate:     Return_Date,
// })
//   }
//     /* ── insert items + reverse stock ── */
//     for (const item of items) {
//       const {
//         Item_Name,
//         Item_Category,
//         Item_HSN,
//         Item_Unit,
//         Quantity,
//         Purchase_Price,
//         Discount_On_Purchase_Price,
//         Discount_Type_On_Purchase_Price,
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
//         `INSERT INTO purchase_return_items
//            (Purchase_Return_Id, Item_Id, Item_Name,
//             Item_Category, Item_HSN, Item_Unit, Quantity, Purchase_Price,
//             Discount_On_Purchase_Price, Discount_Type_On_Purchase_Price,
//             Tax_Type, Tax_Amount, Amount)
//          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//         [
//           Purchase_Return_Id,
//           Item_Id,
//           Item_Name,
//           Item_Category  || "",
//           Item_HSN       || "",
//           Item_Unit      || "",
//           Number(Quantity),
//           Number(Purchase_Price),
//           Number(Discount_On_Purchase_Price) || 0,
//           Discount_Type_On_Purchase_Price    || "percentage",
//           Tax_Type       || null,
//           Number(Tax_Amount) || 0,
//           Number(Amount),
//         ]
//       );

//       /* reverse stock */
//       await connection.query(
//         `UPDATE add_item
//          SET Stock_Quantity = Stock_Quantity - ?, updated_at = NOW()
//          WHERE Item_Id = ?`,
//         [Number(Quantity), Item_Id]
//       );
//     }

//     await connection.commit();
//     return res.status(201).json({
//       success: true,
//       message: "Purchase Return created",
//       Purchase_Return_Id,
//     });

//   } catch (err) {
//     if (connection) await connection.rollback();
//     console.error("❌ createPurchaseReturn:", err);
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };

// /* ── EDIT ─────────────────────────────────────────────────── */
// const editPurchaseReturn = async (req, res, next) => {
//   let connection;
//   try {
//     const { Purchase_Return_Id } = req.params;

//     connection = await db.getConnection();
//     await connection.beginTransaction();

//     /* check exists */
//     const [[existing]] = await connection.query(
//       `SELECT * FROM purchase_return WHERE id = ?`,
//       [Purchase_Return_Id]
//     );
//     if (!existing) {
//       await connection.rollback();
//       return res.status(404).json({ success: false, message: "Purchase Return not found" });
//     }

//     const {
//       Party_Name,
//       Return_Number,
//       Bill_Number,
//       Bill_Date,
//       Return_Date,
//       State_Of_Supply,
//       Total_Amount,
//       Total_Received,
//       Balance_Due,
//       Payment_Type,
//       Bank_Account_Id,        // 🔹 added
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
//       return res.status(404).json({ success: false, message: "Party not found" });
//     }

//     const totalAmount = Number(Total_Amount) || 0;
//     const totalReceived = Number(Total_Received) || 0;
//     const balanceDue  = Number(Balance_Due)  || totalAmount - totalReceived;

//     /* update header */
//     await connection.query(
//       `UPDATE purchase_return SET
//          Party_Id = ?, Return_Number = ?, Bill_Number = ?, Bill_Date = ?,
//          Return_Date = ?, State_Of_Supply = ?,
//          Total_Amount = ?, Total_Received = ?, Balance_Due = ?,
//          Payment_Type = ?, Bank_Account_Id = ?, updated_at = NOW()
//        WHERE id = ?`,
//       [
//         party.Party_Id,
//         Return_Number    || null,
//         Bill_Number  || null,
//         Bill_Date    || null,
//         Return_Date,
//         State_Of_Supply || null,
//         totalAmount,
//         totalReceived,
//         balanceDue,
//         Payment_Type || "Cash",
//         Payment_Type === "Bank" ? Bank_Account_Id : null,   // 🔹 added
//         Purchase_Return_Id,
//       ]
//     );

//     /* 🔹 always call — helper handles insert / update / delete internally
//        (covers Cash→Bank, Bank→Cash, Bank→Bank switch, and amount edits) */
//     await recordBankTransaction({
//       connection,
//       bankAccountId: Payment_Type === "Bank" ? Bank_Account_Id : null,
//       txnType: "Purchase_Return",
//       referenceId: Number(Purchase_Return_Id),
//       partyName: Party_Name,
//       amount: totalReceived,
//       txnDate: Return_Date,
//     });

     
// await recordCashTransaction({
//   connection,
//   isCash:      Payment_Type === "Cash",
//   txnType:     "Purchase_Return",
//   referenceId: Number(Purchase_Return_Id),
//   partyName:   Party_Name,
//   amount:      totalReceived,
//   txnDate:     Return_Date,
// })
  

//     /* fetch old items */
//     const [oldItems] = await connection.query(
//       `SELECT * FROM purchase_return_items WHERE Purchase_Return_Id = ?`,
//       [Purchase_Return_Id]
//     );
//     const oldMap = new Map(oldItems.map((i) => [i.Item_Id, i]));
//     const newItemIds = new Set();

//     /* upsert new items */
//     for (const item of items) {
//       const {
//         Item_Name, Item_Category, Item_HSN, Item_Unit,
//         Quantity, Purchase_Price,
//         Discount_On_Purchase_Price, Discount_Type_On_Purchase_Price,
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
//           `UPDATE purchase_return_items SET
//              Quantity = ?, Purchase_Price = ?,
//              Discount_On_Purchase_Price = ?, Discount_Type_On_Purchase_Price = ?,
//              Tax_Type = ?, Tax_Amount = ?, Amount = ?, updated_at = NOW()
//            WHERE id = ?`,
//           [
//             Number(Quantity), Number(Purchase_Price),
//             Number(Discount_On_Purchase_Price) || 0,
//             Discount_Type_On_Purchase_Price    || "percentage",
//             Tax_Type || null, Number(Tax_Amount) || 0,
//             Number(Amount),
//             old.id,
//           ]
//         );

//         const diff = Number(Quantity) - old.Quantity;
//         if (diff !== 0) {
//           await connection.query(
//             `UPDATE add_item SET Stock_Quantity = Stock_Quantity - ?, updated_at = NOW()
//              WHERE Item_Id = ?`,
//             [diff, Item_Id]
//           );
//         }
//       } else {
//         await connection.query(
//           `INSERT INTO purchase_return_items
//              ( Purchase_Return_Id, Item_Id, Item_Name,
//               Item_Category, Item_HSN, Item_Unit, Quantity, Purchase_Price,
//               Discount_On_Purchase_Price, Discount_Type_On_Purchase_Price,
//               Tax_Type, Tax_Amount, Amount)
//            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//           [
//              Purchase_Return_Id, Item_Id, Item_Name,
//             Item_Category || "", Item_HSN || "", Item_Unit || "",
//             Number(Quantity), Number(Purchase_Price),
//             Number(Discount_On_Purchase_Price) || 0,
//             Discount_Type_On_Purchase_Price    || "percentage",
//             Tax_Type || null, Number(Tax_Amount) || 0, Number(Amount),
//           ]
//         );
//         await connection.query(
//           `UPDATE add_item SET Stock_Quantity = Stock_Quantity - ?, updated_at = NOW()
//            WHERE Item_Id = ?`,
//           [Number(Quantity), Item_Id]
//         );
//       }
//     }

//     /* delete removed items — restore stock */
//     for (const old of oldItems) {
//       if (!newItemIds.has(old.Item_Id)) {
//         await connection.query(
//           `DELETE FROM purchase_return_items WHERE id = ?`,
//           [old.id]
//         );
//         await connection.query(
//           `UPDATE add_item SET Stock_Quantity = Stock_Quantity + ?, updated_at = NOW()
//            WHERE Item_Id = ?`,
//           [old.Quantity, old.Item_Id]
//         );
//       }
//     }

//     await connection.commit();
//     return res.status(200).json({ success: true, message: "Purchase Return updated", Purchase_Return_Id });
//   } catch (err) {
//     if (connection) await connection.rollback();
//     console.error("❌ editPurchaseReturn:", err);
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };
// /* ── DELETE ───────────────────────────────────────────────── */
// // const deletePurchaseReturn = async (req, res, next) => {
// //   let connection;
// //   try {
// //     const { id } = req.params;
 
// //     connection = await db.getConnection();
// //     await connection.beginTransaction();
 
// //     /* fetch items first to restore stock */
// //     const [items] = await connection.query(
// //       `SELECT Item_Id, Quantity FROM purchase_return_items WHERE id = ?`,
// //       [id]
// //     );
 
// //     /* restore stock for each returned item */
// //     for (const item of items) {
// //       await connection.query(
// //         `UPDATE add_item SET Stock_Quantity = Stock_Quantity + ?, updated_at = NOW()
// //          WHERE Item_Id = ?`,
// //         [item.Quantity, item.Item_Id]
// //       );
// //     }
 
// //     /* delete items then header */
// //     await connection.query(
// //       `DELETE FROM purchase_return_items WHERE id = ?`,
// //       [id]
// //     );
// //     await connection.query(
// //       `DELETE FROM purchase_return WHERE id = ?`,
// //       [id]
// //     );
 
// //     await connection.commit();
// //     return res.status(200).json({ success: true, message: "Purchase Return deleted" });
// //   } catch (err) {
// //     if (connection) await connection.rollback();
// //     next(err);
// //   } finally {
// //     if (connection) connection.release();
// //   }
// // };

// export { getAllPurchaseReturns, getPurchaseReturnById, createPurchaseReturn, editPurchaseReturn};



import db from "../config/db.js";
import { recordBankTransaction } from "../utils/bankAccountHelper.js";
import { recordCashTransaction } from "../utils/cashTransactionHelper.js";
import {
  insertPaymentSplits,
  deletePaymentSplits,
  validateSplits,
} from "../utils/paymentSplitHelper.js";

/* ── GET ALL ─────────────────────────────────────────────── */
const getAllPurchaseReturns = async (req, res, next) => {
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
        LOWER(a.Party_Name)           LIKE ? OR
        LOWER(pr.Return_Number)       LIKE ? OR
        LOWER(pr.Bill_Number)         LIKE ? OR
        CAST(pr.Total_Amount AS CHAR) LIKE ?
      )`);
      const like = `%${search}%`;
      params.push(like, like, like, like);
    }

    if (fromDate && toDate) {
      whereClauses.push(`DATE(pr.Return_Date) BETWEEN ? AND ?`);
      params.push(fromDate, toDate);
    } else if (fromDate) {
      whereClauses.push(`DATE(pr.Return_Date) >= ?`);
      params.push(fromDate);
    } else if (toDate) {
      whereClauses.push(`DATE(pr.Return_Date) <= ?`);
      params.push(toDate);
    }

    const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const [rows] = await connection.query(
      `SELECT pr.*, a.Party_Name
       FROM purchase_return pr
       LEFT JOIN add_party a ON a.Party_Id = pr.Party_Id
       ${whereSQL}
       ORDER BY pr.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // attach split payment-type labels per row (same pattern as payment_in)
    const returnIds = rows.map((r) => r.id);

    if (returnIds.length > 0) {
      const placeholders = returnIds.map(() => "?").join(",");
      const [splits] = await connection.query(
        `SELECT ps.Source_Id, ps.Payment_Type, ba.Account_Display_Name
         FROM payment_splits ps
         LEFT JOIN bank_accounts ba ON ba.id = ps.Bank_Account_Id
         WHERE ps.Source_Type = 'Purchase_Return'
           AND ps.Source_Id IN (${placeholders})`,
        returnIds
      );

      const splitMap = {};
      for (const s of splits) {
        if (!splitMap[s.Source_Id]) splitMap[s.Source_Id] = [];
        splitMap[s.Source_Id].push(
          s.Payment_Type === "Bank" ? s.Account_Display_Name : s.Payment_Type
        );
      }

      for (const row of rows) {
        const labels = splitMap[row.id] || [];
        const counts = {};
        labels.forEach((l) => { counts[l] = (counts[l] || 0) + 1; });
        row.Payment_Type_Display = Object.entries(counts)
          .map(([l, c]) => (c > 1 ? `${l} (x${c})` : l))
          .join(" , ") || "—";
      }
    }

    const [[{ total }]] = await connection.query(
      `SELECT COUNT(*) AS total
       FROM purchase_return pr
       LEFT JOIN add_party a ON a.Party_Id = pr.Party_Id
       ${whereSQL}`,
      params
    );

    const [[totals]] = await connection.query(
      `SELECT
         COALESCE(SUM(pr.Total_Amount),   0) AS totalAmount,
         COALESCE(SUM(pr.Total_Received), 0) AS totalReceived,
         COALESCE(SUM(pr.Balance_Due),    0) AS totalBalance
       FROM purchase_return pr
       LEFT JOIN add_party a ON a.Party_Id = pr.Party_Id
       ${whereSQL}`,
      params
    );

    return res.status(200).json({
      success:         true,
      currentPage:     page,
      totalPages:      Math.ceil(total / limit),
      totalReturns:    total,
      purchaseReturns: rows,
      totals,
    });
  } catch (err) {
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

/* ── GET SINGLE ──────────────────────────────────────────── */
const getPurchaseReturnById = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();
    const { Purchase_Return_Id } = req.params;

    const [[header]] = await connection.query(
      `SELECT pr.*, a.Party_Name,a.GSTIN
       FROM purchase_return pr
       LEFT JOIN add_party a ON a.Party_Id = pr.Party_Id
       WHERE pr.id = ?`,
      [Purchase_Return_Id]
    );

    if (!header) {
      return res.status(404).json({ success: false, message: "Purchase Return not found" });
    }

    // const [items] = await connection.query(
    //   `SELECT pri.*, ai.Item_Name AS Item_Name_Ref
    //    FROM purchase_return_items pri
    //    LEFT JOIN add_item ai ON ai.Item_Id = pri.Item_Id
    //    WHERE pri.Purchase_Return_Id = ?`,
    //   [Purchase_Return_Id]
    // );
       const [items] = await connection.query(
      `SELECT pri.*,
              ai.Item_Name AS Item_Name,
              ai.Item_HSN  AS Item_HSN,
              ai.Item_Unit AS Item_Unit,
              ai.Item_Category AS Item_Category
       FROM purchase_return_items pri
       LEFT JOIN add_item ai ON ai.Item_Id = pri.Item_Id
       WHERE pri.Purchase_Return_Id = ?`,
      [Purchase_Return_Id]
    );

    // fetch splits with bank display name
    const [splits] = await connection.query(
      `SELECT ps.*, ba.Account_Display_Name
       FROM payment_splits ps
       LEFT JOIN bank_accounts ba ON ba.id = ps.Bank_Account_Id
       WHERE ps.Source_Type = 'Purchase_Return' AND ps.Source_Id = ?
       ORDER BY ps.id ASC`,
      [Purchase_Return_Id]
    );

    return res.status(200).json({
      success:        true,
      purchaseReturn: { ...header, items, splits },
    });
  } catch (err) {
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

/* ── CREATE ──────────────────────────────────────────────── */
const createPurchaseReturn = async (req, res, next) => {
  let connection;
  try {
    const { Purchase_Id } = req.params;
    connection = await db.getConnection();
    await connection.beginTransaction();

    const {
      Party_Name,
      Return_Number,
      Bill_Number,
      Bill_Date,
      Return_Date,
      State_Of_Supply,
      Total_Amount,
      Balance_Due,
      splits,          // 🔹 replaces Payment_Type / Bank_Account_Id / Total_Received
      items,
    } = req.body;

    if (!Purchase_Id || !Party_Name || !Return_Date || !items?.length) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Purchase_Id, Party, Return Date and items are required",
      });
    }

    if (!Array.isArray(splits) || splits.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "At least one payment split is required",
      });
    }

    // Total_Received always derived from splits
    const totalReceived = splits.reduce((sum, s) => sum + (Number(s.Amount) || 0), 0);
 const totalAmount = Number(Total_Amount) || 0;
    const balanceDue  = Number(Balance_Due)  ?? totalAmount - totalReceived;
     if (totalReceived > totalAmount) {
      return res.status(400).json({
        success: false,
        message: "Received amount should be less than or equal to Total Amount",
      });
    }
    if (isNaN(totalReceived) || totalReceived < 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "Split amounts must be valid numbers" });
    }

    try {
      validateSplits(splits);
    } catch (err) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: err.message });
    }

    const [[party]] = await connection.query(
      `SELECT Party_Id FROM add_party WHERE Party_Name = ? LIMIT 1`,
      [Party_Name]
    );
    if (!party) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Party not found" });
    }

   

    // 🔹 no Payment_Type / Bank_Account_Id / Reference_Number on header anymore
    const [headerResult] = await connection.query(
      `INSERT INTO purchase_return
         (Purchase_Id, Party_Id, Return_Number, Bill_Number,
          Bill_Date, Return_Date, State_Of_Supply,
          Total_Amount, Total_Received, Balance_Due)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Purchase_Id,
        party.Party_Id,
        Return_Number   || null,
        Bill_Number     || null,
        Bill_Date       || null,
        Return_Date,
        State_Of_Supply || null,
        totalAmount,
        totalReceived,
        balanceDue,
      ]
    );

    const Purchase_Return_Id = headerResult.insertId;

    // 🔹 insert splits + write cash/bank ledger entries
    await insertPaymentSplits({
      connection,
      sourceType: "Purchase_Return",
      sourceId:   Purchase_Return_Id,
      partyName:  Party_Name,
      txnDate:    Return_Date,
      splits,
    });

    // items
    for (const item of items) {
      const {
        Item_Name, Item_Category, Item_HSN, Item_Unit,
        Quantity, Purchase_Price,
        Discount_On_Purchase_Price, Discount_Type_On_Purchase_Price,
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
        //  Item_Name,
          //   Item_Category, Item_HSN, Item_Unit, 

      await connection.query(
        `INSERT INTO purchase_return_items
           (Purchase_Return_Id, Item_Id, 
        
            Quantity, Purchase_Price,
            Discount_On_Purchase_Price, Discount_Type_On_Purchase_Price,
            Tax_Type, Tax_Amount, Amount)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          Purchase_Return_Id, Item_Id, 
          // Item_Name,
          // Item_Category  || "", Item_HSN || "", Item_Unit || "",

          Number(Quantity), Number(Purchase_Price),
          Number(Discount_On_Purchase_Price) || 0,
          Discount_Type_On_Purchase_Price    || "percentage",
          Tax_Type       || null,
          Number(Tax_Amount) || 0,
          Number(Amount),
        ]
      );

      await connection.query(
        `UPDATE add_item SET Stock_Quantity = Stock_Quantity - ?, updated_at = NOW()
         WHERE Item_Id = ?`,
        [Number(Quantity), Item_Id]
      );
    }

    await connection.commit();
    return res.status(201).json({
      success: true,
      message: "Purchase Return created",
      Purchase_Return_Id,
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("❌ createPurchaseReturn:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

/* ── EDIT ────────────────────────────────────────────────── */
const editPurchaseReturn = async (req, res, next) => {
  let connection;
  try {
    const { Purchase_Return_Id } = req.params;
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [[existing]] = await connection.query(
      `SELECT * FROM purchase_return WHERE id = ?`,
      [Purchase_Return_Id]
    );
    if (!existing) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Purchase Return not found" });
    }

    const {
      Party_Name,
      Return_Number,
      Bill_Number,
      Bill_Date,
      Return_Date,
      State_Of_Supply,
      Total_Amount,
      Balance_Due,
      splits,
      items,
    } = req.body;

    if (!Array.isArray(splits) || splits.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "At least one payment split is required",
      });
    }

    // Total_Received always recalculated from splits
     
    const totalReceived = splits.reduce((sum, s) => sum + (Number(s.Amount) || 0), 0);
      const totalAmount = Number(Total_Amount) || 0;
    const balanceDue  = Number(Balance_Due)  ?? totalAmount - totalReceived;
 if (totalReceived > totalAmount) {
      return res.status(400).json({
        success: false,
        message: "Received amount should be less than or equal to Total Amount",
      });
    }
    if (isNaN(totalReceived) || totalReceived < 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "Split amounts must be valid numbers" });
    }

    try {
      validateSplits(splits);
    } catch (err) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: err.message });
    }

    const [[party]] = await connection.query(
      `SELECT Party_Id FROM add_party WHERE Party_Name = ? LIMIT 1`,
      [Party_Name]
    );
    if (!party) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Party not found" });
    }

 

    await connection.query(
      `UPDATE purchase_return SET
         Party_Id        = ?, Return_Number   = ?, Bill_Number     = ?,
         Bill_Date       = ?, Return_Date     = ?, State_Of_Supply = ?,
         Total_Amount    = ?, Total_Received  = ?, Balance_Due     = ?,
         updated_at      = NOW()
       WHERE id = ?`,
      [
        party.Party_Id,
        Return_Number    || null,
        Bill_Number      || null,
        Bill_Date        || null,
        Return_Date,
        State_Of_Supply  || null,
        totalAmount,
        totalReceived,
        balanceDue,
        Purchase_Return_Id,
      ]
    );

    // 🔹 wipe old splits + reverse ledger entries, reinsert fresh
    await deletePaymentSplits({
      connection,
      sourceType: "Purchase_Return",
      sourceId:   Purchase_Return_Id,
    });

    await insertPaymentSplits({
      connection,
      sourceType: "Purchase_Return",
      sourceId:   Purchase_Return_Id,
      partyName:  Party_Name,
      txnDate:    Return_Date,
      splits,
    });

    // items upsert
    const [oldItems] = await connection.query(
      `SELECT * FROM purchase_return_items WHERE Purchase_Return_Id = ?`,
      [Purchase_Return_Id]
    );
    const oldMap     = new Map(oldItems.map((i) => [i.Item_Id, i]));
    const newItemIds = new Set();

    for (const item of items) {
      const {
        Item_Name, Item_Category, Item_HSN, Item_Unit,
        Quantity, Purchase_Price,
        Discount_On_Purchase_Price, Discount_Type_On_Purchase_Price,
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
          `UPDATE purchase_return_items SET
             Quantity = ?, Purchase_Price = ?,
             Discount_On_Purchase_Price = ?, Discount_Type_On_Purchase_Price = ?,
             Tax_Type = ?, Tax_Amount = ?, Amount = ?, updated_at = NOW()
           WHERE id = ?`,
          [
            Number(Quantity), Number(Purchase_Price),
            Number(Discount_On_Purchase_Price) || 0,
            Discount_Type_On_Purchase_Price    || "percentage",
            Tax_Type || null, Number(Tax_Amount) || 0,
            Number(Amount), old.id,
          ]
        );
        const diff = Number(Quantity) - old.Quantity;
        if (diff !== 0) {
          await connection.query(
            `UPDATE add_item SET Stock_Quantity = Stock_Quantity - ?, updated_at = NOW()
             WHERE Item_Id = ?`,
            [diff, Item_Id]
          );
        }
      } else {
         //  Item_Name,
            //   Item_Category, Item_HSN, Item_Unit, 
        await connection.query(
          `INSERT INTO purchase_return_items
             (Purchase_Return_Id, Item_Id, 
           
              Quantity, Purchase_Price,
              Discount_On_Purchase_Price, Discount_Type_On_Purchase_Price,
              Tax_Type, Tax_Amount, Amount)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            Purchase_Return_Id, Item_Id, 
            // Item_Name,
            // Item_Category || "", Item_HSN || "", Item_Unit || "",

            Number(Quantity), Number(Purchase_Price),
            Number(Discount_On_Purchase_Price) || 0,
            Discount_Type_On_Purchase_Price    || "percentage",
            Tax_Type || null, Number(Tax_Amount) || 0, Number(Amount),
          ]
        );
        await connection.query(
          `UPDATE add_item SET Stock_Quantity = Stock_Quantity - ?, updated_at = NOW()
           WHERE Item_Id = ?`,
          [Number(Quantity), Item_Id]
        );
      }
    }

    for (const old of oldItems) {
      if (!newItemIds.has(old.Item_Id)) {
        await connection.query(
          `DELETE FROM purchase_return_items WHERE id = ?`, [old.id]
        );
        await connection.query(
          `UPDATE add_item SET Stock_Quantity = Stock_Quantity + ?, updated_at = NOW()
           WHERE Item_Id = ?`,
          [old.Quantity, old.Item_Id]
        );
      }
    }

    await connection.commit();
    return res.status(200).json({
      success: true,
      message: "Purchase Return updated",
      Purchase_Return_Id,
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("❌ editPurchaseReturn:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

export { getAllPurchaseReturns, getPurchaseReturnById, createPurchaseReturn, editPurchaseReturn };