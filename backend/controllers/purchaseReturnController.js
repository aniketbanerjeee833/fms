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
 


/* ── GET ALL ─────────────────────────────────────────────── */

import db from "../config/db.js";
import { recordBankTransaction } from "../utils/bankAccountHelper.js";
import { recordCashTransaction } from "../utils/cashTransactionHelper.js";
import { recordItemLedger, reverseItemLedger } from "../utils/itemLedgerHelper.js";
import { recordPartyLedger, reversePartyLedger } from "../utils/partyLedgerHelper.js";
import {
  insertPaymentSplits,
  deletePaymentSplits,
  validateSplits,
} from "../utils/paymentSplitHelper.js";
import { resolveUnitAndStockDelta } from "../utils/resolveUnitAndStockDelta.js";
import ExcelJS from "exceljs";
//import { recordItemLedger, reverseItemLedger } from "../utils/itemLedgerHelper
const cleanValue = (value) => {
  if (value === undefined || value === null || value === "" || value === " ") {
    return null; // store as NULL in DB
  }
  return value;  // ✅ returns the original value for valid data
};

const normalizeNumber = (val) =>
  val !== undefined &&
  val !== null &&
  String(val).trim() !== ""
    ? Number(val)
    : null;
const getAllPurchaseReturns = async (req, res, next) => {
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

    // if (search) {
    //   whereClauses.push(`(
    //     LOWER(a.Party_Name)           LIKE ? OR
    //     LOWER(pr.Return_Number)       LIKE ? OR
    //     LOWER(pr.Bill_Number)         LIKE ? OR
    //     CAST(pr.Total_Amount AS CHAR) LIKE ? OR
    //     CAST(pr.Balance_Due AS CHAR)  LIKE ? OR
    //     CAST(pr.Total_Received AS CHAR)  LIKE ?

    //   )`);
    //   const like = `%${search}%`;
    //   params.push(like, like, like, like, like, like);
    // }

    if (search) {
      whereClauses.push(`(
        a.Party_Name           LIKE ? OR
      pr.Return_Number       LIKE ? OR
      pr.Bill_Number         LIKE ? OR
        CAST(pr.Total_Amount AS CHAR) LIKE ? OR
        CAST(pr.Balance_Due AS CHAR)  LIKE ? OR
        CAST(pr.Total_Received AS CHAR)  LIKE ?

      )`);
      const like = `%${search}%`;
      params.push(like, like, like, like, like, like);
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
      success: true,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalReturns: total,
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
// const getPurchaseReturnById = async (req, res, next) => {
//   let connection;
//   try {
//     connection = await db.getConnection();
//     const { Purchase_Return_Id } = req.params;

//     const [[header]] = await connection.query(
//       `SELECT pr.*, a.Party_Name,a.GSTIN
//        FROM purchase_return pr
//        LEFT JOIN add_party a ON a.Party_Id = pr.Party_Id
//        WHERE pr.id = ?`,
//       [Purchase_Return_Id]
//     );

//     if (!header) {
//       return res.status(404).json({ success: false, message: "Purchase Return not found" });
//     }

//     // const [items] = await connection.query(
//     //   `SELECT pri.*, ai.Item_Name AS Item_Name_Ref
//     //    FROM purchase_return_items pri
//     //    LEFT JOIN add_item ai ON ai.Item_Id = pri.Item_Id
//     //    WHERE pri.Purchase_Return_Id = ?`,
//     //   [Purchase_Return_Id]
//     // );
//     const [items] = await connection.query(
//       `SELECT pri.*,
//               ai.Item_Name AS Item_Name,
//               ai.Item_HSN  AS Item_HSN,
//               ai.Item_Unit AS Item_Unit,
//               ai.Item_Category AS Item_Category
//        FROM purchase_return_items pri
//        LEFT JOIN add_item ai ON ai.Item_Id = pri.Item_Id
//        WHERE pri.Purchase_Return_Id = ?`,
//       [Purchase_Return_Id]
//     );

//     // fetch splits with bank display name
//     const [splits] = await connection.query(
//       `SELECT ps.*, ba.Account_Display_Name
//        FROM payment_splits ps
//        LEFT JOIN bank_accounts ba ON ba.id = ps.Bank_Account_Id
//        WHERE ps.Source_Type = 'Purchase_Return' AND ps.Source_Id = ?
//        ORDER BY ps.id ASC`,
//       [Purchase_Return_Id]
//     );

//     return res.status(200).json({
//       success: true,
//       purchaseReturn: { ...header, items, splits },
//     });
//   } catch (err) {
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };
// (
//   SELECT pa.Address_Text
//   FROM add_party_addresses pa
//   WHERE pa.Party_Id = pr.Party_Id
//     AND pa.Address_Type = 'Billing'
//     AND pa.Is_Default = 1
// ) AS Billing_Address
const getPurchaseReturnById = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();
    const { Purchase_Return_Id } = req.params;

    if (!Purchase_Return_Id) {
      return res.status(400).json({
        success: false,
        message: "Purchase Return ID is required.",
      });
    }

    // =========================================================
    // 1. FETCH HEADER
    // =========================================================

    const [[header]] = await connection.query(
      `SELECT
         pr.id,
         
         pr.Return_Number,
         pr.Bill_Number,
         pr.Bill_Date,
         pr.Return_Date,
         pr.State_Of_Supply,
         pr.Total_Amount,
         pr.Total_Received,
         pr.Balance_Due,
         pr.Party_Id,
         a.Party_Name,
         a.GSTIN,
         a.State
            
 
       FROM purchase_return pr
       LEFT JOIN add_party a ON a.Party_Id = pr.Party_Id
       WHERE pr.id = ?`,
      [Purchase_Return_Id]
    );

    if (!header) {
      return res.status(404).json({
        success: false,
        message: "Purchase Return not found.",
      });
    }

    // =========================================================
    // 2. FETCH ITEMS
    //    Item name/HSN/unit/category come from add_item (live)
    //    — same source-of-truth pattern as purchase
    // =========================================================

    const [items] = await connection.query(
      `
  SELECT
      pri.id,
     
      pri.Item_Id,

      i.Item_Name,
      i.Item_HSN,
      i.Item_Unit,
      i.Item_Category,

      -- CURRENT MASTER
      i.Primary_Unit AS Current_Primary_Unit,
      i.Secondary_Unit AS Current_Secondary_Unit,
       i.Conversion_Rate,

      pri.Quantity,

      -- HISTORICAL SNAPSHOT
      pri.Primary_Unit_Snapshot,
      pri.Secondary_Unit_Snapshot,
      pri.Selected_Unit,

      pri.Purchase_Price,
      pri.Discount_On_Purchase_Price,
      pri.Discount_Type_On_Purchase_Price,
      pri.Tax_Amount,
      pri.Tax_Type,
      pri.Amount,
      pri.created_at

  FROM purchase_return_items pri

  LEFT JOIN add_item i
    ON pri.Item_Id = i.Item_Id

  WHERE pri.Purchase_Return_Id = ?

  ORDER BY pri.created_at DESC
  `,
      [Purchase_Return_Id]
    );

    // =========================================================
    // 3. FETCH ALL UNITS (for edit dropdown — same as purchase)
    // =========================================================

    const [allUnits] = await connection.query(
      `SELECT Unit_Shorthand, Unit_Name
       FROM units
       ORDER BY Unit_Name ASC`
    );

    // =========================================================
    // 4. FORMAT ITEMS — build Available_Units per item
    // =========================================================

    const formattedItems = items.map((it) => {
      let availableUnits = [];

      // =======================================================
      // OLD SNAPSHOT
      // =======================================================

      const oldPrimary =
        it.Primary_Unit_Snapshot || null;

      const oldSecondary =
        it.Secondary_Unit_Snapshot || null;

      const oldSelected =
        it.Selected_Unit || null;

      // =======================================================
      // CURRENT MASTER
      // =======================================================

      const currentPrimary =
        it.Current_Primary_Unit || null;

      const currentSecondary =
        it.Current_Secondary_Unit || null;

      // =======================================================
      // DID THIS RETURN USE THE OLD SECONDARY UNIT?
      // =======================================================

      const oldUsedSecondary =
        oldSecondary &&
        oldSelected === oldSecondary;

      let unitCodes = [];

      // =======================================================
      // CASE 1
      //
      // Old:
      // KG / GM
      // Selected = GM
      //
      // Current:
      // KG / BOX
      //
      // Show:
      // KG / GM
      // =======================================================

      if (oldUsedSecondary) {

        unitCodes = [
          oldPrimary,
          oldSecondary,
        ].filter(Boolean);

      }

      // =======================================================
      // CASE 2
      //
      // Old:
      // KG / GM
      // Selected = KG
      //
      // Current:
      // KG / BOX
      //
      // Show:
      // KG / BOX
      // =======================================================

      else {

        unitCodes = [
          currentPrimary,
          currentSecondary,
        ].filter(Boolean);

      }

      unitCodes = [...new Set(unitCodes)];

      availableUnits = unitCodes.map((unitCode) => {

        const masterUnit = allUnits.find(
          (u) => u.Unit_Shorthand === unitCode
        );

        return {
          Unit_Shorthand: unitCode,
          Unit_Name: masterUnit?.Unit_Name || unitCode,
        };

      });

      return {
        id: it.id,

        Item_Id: it.Item_Id,

        Item_Name: it.Item_Name,

        Item_HSN: it.Item_HSN,

        Item_Unit: it.Item_Unit,

        Item_Category: it.Item_Category,

        Quantity: it.Quantity,

        // Snapshot
        Primary_Unit: oldPrimary,
        Secondary_Unit: oldSecondary,
        Selected_Unit: oldSelected,
         Conversion_Rate:it.Conversion_Rate !== null
    ? Number(it.Conversion_Rate)
    : 0,
        // Dropdown
        Available_Units: availableUnits,

        Purchase_Price: it.Purchase_Price,

        Discount_On_Purchase_Price:it.Discount_On_Purchase_Price,

        Discount_Type_On_Purchase_Price:it.Discount_Type_On_Purchase_Price,

        Tax_Type: it.Tax_Type,

        Tax_Amount: it.Tax_Amount,

        Amount: it.Amount,

        created_at: it.created_at,
      };
    });

    // =========================================================
    // 5. FETCH PAYMENT SPLITS
    // =========================================================

    const [splits] = await connection.query(
      `SELECT
         ps.id,
         ps.Payment_Type,
         ps.Bank_Account_Id,
         ps.Reference_Number,
         ps.Amount,
         ba.Account_Display_Name,
         CASE
           WHEN ps.Payment_Type = 'Bank'
             THEN ba.Account_Display_Name
           ELSE ps.Payment_Type
         END AS Payment_Type_Display
       FROM payment_splits ps
       LEFT JOIN bank_accounts ba ON ba.id = ps.Bank_Account_Id
       WHERE ps.Source_Type = 'Purchase_Return'
         AND ps.Source_Id = ?
       ORDER BY ps.id ASC`,
      [Purchase_Return_Id]
    );

    // =========================================================
    // 6. PAYMENT DISPLAY SUMMARY
    // =========================================================

    const splitSummary =
      splits.map((s) => s.Payment_Type_Display).join(" + ") || "—";

    // =========================================================
    // 7. RESPONSE
    // =========================================================

    // return res.status(200).json({
    //   success: true,

    //   purchaseReturnDetails: {
    //     id:                  header.id,
    //     Purchase_Return_Id:  header.id,
    //     Party_Name:          header.Party_Name,
    //     GSTIN:               header.GSTIN,
    //     Return_Number:       header.Return_Number,
    //     Bill_Number:         header.Bill_Number,
    //     Bill_Date:           header.Bill_Date,
    //     Return_Date:         header.Return_Date,
    //     State_Of_Supply:     header.State_Of_Supply,
    //     Total_Amount:        header.Total_Amount,
    //     Total_Received:      header.Total_Received,
    //     Balance_Due:         header.Balance_Due,
    //     Payment_Type_Display: splitSummary,
    //   },

    //   splits: splits.map((s) => ({
    //     id:                   s.id,
    //     Payment_Type:         s.Payment_Type,
    //     Bank_Account_Id:      s.Bank_Account_Id,
    //     Account_Display_Name: s.Account_Display_Name,
    //     Payment_Type_Display: s.Payment_Type_Display,
    //     Reference_Number:     s.Reference_Number,
    //     Amount:               s.Amount,
    //   })),

    //   items: formattedItems,
    // });
    return res.status(200).json({
      success: true,
      purchaseReturn: {
        ...header,
        items: formattedItems,
        splits,
      },
    });


  } catch (err) {
    console.error("❌ getPurchaseReturnById:", err);
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
      Return_Date = new Date().toISOString().slice(0, 10),
      State_Of_Supply,
      Total_Amount,
      splits,
      items,
    } = req.body;

    // =========================================================
    // 1. BASIC VALIDATION
    //
    // Empty item rows / empty items array are allowed.
    // =========================================================

    if (!Purchase_Id || !Party_Name || !Return_Date) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          "Purchase_Id, Party and Return Date are required",
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

    // if (!Array.isArray(splits) || splits.length === 0) {
    //   await connection.rollback();

    //   return res.status(400).json({
    //     success: false,
    //     message: "At least one payment split is required",
    //   });
    // }

    // =========================================================
    // 2. NORMALIZE PAYMENT SPLITS
    //
    // Amount:
    // ""      -> 0
    // "0"     -> 0
    // "0.00"  -> 0
    // "500"   -> 500
    //
    // Invalid rows without Payment_Type are ignored.
    //
    // Bank without Bank_Account_Id is ignored.
    // =========================================================

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

    // =========================================================
    // 3. PAYMENT SPLIT RULE
    //
    // FIRST valid payment method:
    //     blank / ₹0 -> KEEP
    //     > ₹0       -> KEEP
    //
    // SECOND / THIRD / etc:
    //     blank / ₹0 -> DROP
    //     > ₹0       -> KEEP
    //
    // Example:
    //
    // Cash   ₹0    -> KEEP
    // HDFC   ₹0    -> DROP
    // ANCO   ₹500  -> KEEP
    // SBI    ₹0    -> DROP
    //
    // payment_splits:
    // Cash ₹0
    // ANCO ₹500
    // =========================================================

    const validSplits = normalizedSplits.filter(
      (split, index) => {
        // First valid method always stays
        if (index === 0) {
          return true;
        }

        // All later methods only stay when > 0
        return split.Amount > 0;
      }
    );

    // if (validSplits.length === 0) {
    //   await connection.rollback();

    //   return res.status(400).json({
    //     success: false,
    //     message:"At least one valid payment method is required",
    //   });
    // }

    // =========================================================
    // 4. CALCULATE TOTAL RECEIVED
    //
    // IMPORTANT:
    // calculate from validSplits, NOT original splits.
    // =========================================================

    const totalReceived = validSplits.reduce(
      (sum, split) => sum + split.Amount,
      0
    );

    const totalAmount = Number(Total_Amount) || 0;

    // Always derive it ourselves
    const balanceDue = totalAmount - totalReceived;

    // =========================================================
    // 5. TOTAL VALIDATION
    // =========================================================

    if (totalReceived > totalAmount) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Received amount should be less than or equal to Total Amount",
      });
    }

    // if (isNaN(totalReceived) || totalReceived < 0) {
    //   await connection.rollback();

    //   return res.status(400).json({
    //     success: false,
    //     message: "Split amounts must be valid numbers",
    //   });
    // }

    // =========================================================
    // 6. VALIDATE ONLY SURVIVING SPLITS
    // =========================================================

    try {
      validateSplits(validSplits, totalReceived);
    } catch (validationErr) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: validationErr.message,
      });
    }

    // =========================================================
    // 7. FIND PARTY
    // =========================================================

    const [[party]] = await connection.query(
      `SELECT Party_Id
       FROM add_party
       WHERE Party_Name = ?
       LIMIT 1`,
      [Party_Name]
    );

    if (!party) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Party not found",
      });
    }

    // =========================================================
    // 8. INSERT PURCHASE RETURN HEADER
    // =========================================================

    const [headerResult] = await connection.query(
      `INSERT INTO purchase_return
       (
         Purchase_Id,
         Party_Id,
         Return_Number,
         Bill_Number,
         Bill_Date,
         financial_year,
         Return_Date,
         State_Of_Supply,
         Total_Amount,
         Total_Received,
         Balance_Due
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Purchase_Id,
        party.Party_Id,
        Return_Number || null,
        Bill_Number || null,
        Bill_Date || null,
        activeFY,
        Return_Date,
        State_Of_Supply || null,
        totalAmount,
        totalReceived,
        balanceDue,
      ]
    );

    const id = headerResult.insertId;

    // =========================================================
    // 9. INSERT PAYMENT SPLITS
    //
    // IMPORTANT:
    // validSplits — NOT original splits.
    //
    // Your insertPaymentSplits helper already handles:
    //
    // Bank ₹0:
    //   payment_splits      -> yes
    //   bank_transactions   -> yes
    //
    // Cash ₹0:
    //   payment_splits      -> yes
    //   cash_transactions   -> NO
    //
    // Cash > 0:
    //   both
    //
    // Cheque/Neft:
    //   payment_splits only
    // =========================================================

    await insertPaymentSplits({
      connection,
      sourceType: "Purchase_Return",
      sourceId: id,
      partyName: Party_Name,
      txnDate: Return_Date,
      splits: validSplits,
    });

    // =========================================================
    // 10. PARTY LEDGER
    // =========================================================

    await recordPartyLedger({
      connection,
      partyId: party.Party_Id,
      txnType: "Purchase_Return",
      referenceId: id,
      amount: totalAmount,
      txnDate: Return_Date,
      docNumber: Return_Number,
      balanceDue,
    });

    // =========================================================
    // 11. ITEMS
    //
    // RULE:
    //
    // Item_Name blank + Amount blank/0
    //      -> SKIP
    //
    // Item_Name blank + Amount > 0
    //      -> ERROR
    //
    // Item_Name exists
    //      -> process normally
    //
    // Therefore completely empty form can still be saved.
    // =========================================================

    for (const item of items || []) {
      const itemName = item.Item_Name?.trim();

      const itemAmount =
        item.Amount === "" ||
          item.Amount === null ||
          item.Amount === undefined
          ? 0
          : Number(item.Amount) || 0;

      // =======================================================
      // ITEM NAME RULE
      // =======================================================

      if (!itemName) {
        // Amount entered but no item name
        if (itemAmount > 0) {
          await connection.rollback();

          return res.status(400).json({
            success: false,
            message: "Please enter an item name for the row.",
          });
        }

        // Completely blank/zero placeholder row
        // Do not create add_item
        // Do not create purchase_return_items
        continue;
      }

      const {
        Item_Category,
        Item_HSN,
        Item_Unit,
        Quantity,
        Purchase_Price,
        Discount_On_Purchase_Price,
        Discount_Type_On_Purchase_Price,
        Tax_Type,
        Tax_Amount,
        Amount,
      } = item;
      const Selected_Unit = Item_Unit || null;

      // =======================================================
      // 12. FIND EXISTING ITEM
      //
      // Since your MySQL collation is case-insensitive,
      // LOWER() is unnecessary.
      // =======================================================

      const [[existingItem]] = await connection.query(
        `SELECT
    Item_Id,
    Item_HSN,
    Item_Category,
    Item_Unit,
    Primary_Unit,
    Secondary_Unit,
    Conversion_Rate,
    Stock_Quantity
FROM add_item
         WHERE TRIM(Item_Name) = TRIM(?)
         LIMIT 1`,
        [itemName]
      );

      let Item_Id;

      // =======================================================
      // 13. CREATE ITEM IF IT DOESN'T EXIST
      // =======================================================
      let dbItemRow;
      if (!existingItem) {
        const [ins] = await connection.execute(
          `
         INSERT INTO add_item
(
  Item_Name,
  Item_Category,
  Item_HSN,
  Item_Unit,

  Primary_Unit,
  Secondary_Unit,
  Conversion_Rate,

  Stock_Quantity,
  created_at,
  updated_at
)
VALUES
(
  ?, ?, ?, ?,

  ?, NULL, NULL,

  0,
  NOW(),
  NOW()
)

           `,
          [
            itemName,
            Item_Category || "",
            cleanValue(Item_HSN),
            Item_Unit || "",
            Selected_Unit
          ]
        );

        Item_Id =
          "ITM" +
          ins.insertId.toString().padStart(3, "0");

        await connection.execute(
          `UPDATE add_item
           SET Item_Id = ?
           WHERE id = ?`,
          [
            Item_Id,
            ins.insertId,
          ]
        );
        dbItemRow = {
          Primary_Unit: Selected_Unit,
          Secondary_Unit: null,
          Conversion_Rate: null,
        };
      } else {
        // =====================================================
        // EXISTING ITEM
        // =====================================================

        Item_Id = existingItem.Item_Id;
        // ===============================================
        // First time unit assignment
        // Existing item had no Primary Unit
        // ===============================================

        if (
          !existingItem.Primary_Unit &&
          Selected_Unit
        ) {
          await connection.query(
            `
    UPDATE add_item
    SET
      Primary_Unit = ?,
      Secondary_Unit = NULL,
      Conversion_Rate = NULL,
      Item_Unit = '',
      updated_at = NOW()
    WHERE Item_Id = ?
    `,
            [
              Selected_Unit,
              Item_Id,
            ]
          );

          existingItem.Primary_Unit = Selected_Unit;
          existingItem.Secondary_Unit = null;
          existingItem.Conversion_Rate = null;
        }

        // Update HSN/category if supplied/changed.
        // We are NOT changing Item_Unit here.
        const updates = [];
        const params = [];

        if (
          Item_HSN &&
          Item_HSN !== existingItem.Item_HSN
        ) {
          updates.push("Item_HSN = ?");
          params.push(Item_HSN);
        }

        if (
          Item_Category !== undefined &&
          Item_Category !== existingItem.Item_Category
        ) {
          updates.push("Item_Category = ?");
          params.push(Item_Category || "");
        }

        if (updates.length > 0) {
          params.push(Item_Id);

          await connection.query(
            `UPDATE add_item
             SET ${updates.join(", ")},
                 updated_at = NOW()
             WHERE Item_Id = ?`,
            params
          );
        }
        dbItemRow = existingItem;
      }

      const {
        stockDelta,
        snapshot,
        resolvedSelectedUnit,
      } = resolveUnitAndStockDelta({
        dbItemRow,
        Selected_Unit,
        Quantity,
      });

      // =======================================================
      // 14. INSERT PURCHASE RETURN ITEM
      // =======================================================

      const [prItemResult] = await connection.query(
        `
        INSERT INTO purchase_return_items
(
    Purchase_Return_Id,
    Item_Id,

    Primary_Unit_Snapshot,
    Secondary_Unit_Snapshot,
    Selected_Unit,

    Quantity,
    Purchase_Price,
    Discount_On_Purchase_Price,
    Discount_Type_On_Purchase_Price,
    Tax_Type,
    Tax_Amount,
    Amount
)
VALUES
(
    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
)
         
         `,
        // [
        //   id,
        //   Item_Id,

        //   Number(Quantity) || 0,
        //   Number(Purchase_Price) || 0,

        //   Number(Discount_On_Purchase_Price) || 0,

        //   Discount_Type_On_Purchase_Price ||
        //   "percentage",

        //   Tax_Type || null,

        //   Number(Tax_Amount) || 0,

        //   Number(Amount) || 0,
        // ]
        [
          id,
          Item_Id,

          snapshot.Primary_Unit_Snapshot,
          snapshot.Secondary_Unit_Snapshot,
          resolvedSelectedUnit,

          Number(Quantity) || 0,
          Number(Purchase_Price) || 0,
          Number(Discount_On_Purchase_Price) || 0,
          Discount_Type_On_Purchase_Price || "Percentage",
          Tax_Type || "None",
          Number(Tax_Amount) || 0,
          Number(Amount) || 0,
        ]
      );
      const prItemId = prItemResult.insertId; // ← capture insertId
      // =======================================================
      // 15. STOCK
      //
      // PURCHASE RETURN:
      // goods are going OUT to supplier.
      //
      // Therefore stock decreases.
      // =======================================================

      await connection.query(
        `UPDATE add_item
         SET
           Stock_Quantity =
             Stock_Quantity - ?,
           updated_at = NOW()
         WHERE Item_Id = ?`,
        [
          stockDelta,
          Item_Id,
        ]
      );
      // await recordItemLedger({
      //   connection,
      //   itemId: Item_Id,
      //   txnType: "Purchase_Return",
      //   referenceId: prItemId,
      //   //formattedId: Return_Number || null,
      //   billId: id,                  // purchase_return.id
      //   billNumber: Return_Number || null,
      //   partyName: Party_Name,
      //   quantity: Number(Quantity) || 0,
      //   rate: Number(Purchase_Price) || null,
      //   txnDate: Return_Date,
      // });
      await recordItemLedger({
  connection,

  itemId: Item_Id,

  txnType: "Purchase_Return",

  referenceId: prItemId,

  billId: id,                     // purchase_return.id
  billNumber: Return_Number || null,

  partyName: Party_Name,

  // User-entered quantity
  quantity: normalizeNumber(Quantity) ?? 0,

  // Unit used in this transaction
  selectedUnit: resolvedSelectedUnit,

  // Normalized quantity used for stock calculation
  baseQty: normalizeNumber(stockDelta) ?? 0,

  rate: normalizeNumber(Purchase_Price),

  txnDate: Return_Date,
});
    }

    // =========================================================
    // 16. COMMIT
    // =========================================================

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Purchase Return created",
      id,
      totalAmount,
      totalReceived,
      balanceDue,
    });
  } catch (err) {
    if (connection) {
      await connection.rollback();
    }

    console.error(
      "❌ createPurchaseReturn:",
      err
    );

    next(err);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};
/* ── EDIT ────────────────────────────────────────────────── */

const editPurchaseReturn = async (req, res, next) => {
  let connection;

  try {
    const { Purchase_Return_Id } = req.params;

    connection = await db.getConnection();
    await connection.beginTransaction();

    // =========================================================
    // 1. CHECK PURCHASE RETURN EXISTS
    // =========================================================

    const [[existing]] = await connection.query(
  `
  SELECT id, financial_year
  FROM purchase_return
  WHERE id = ?
  LIMIT 1
  `,
  [Purchase_Return_Id]
);

if (!existing) {
  await connection.rollback();

  return res.status(404).json({
    success: false,
    message: "Purchase Return not found",
  });
}

    // =========================================================
    // 2. BODY
    // =========================================================

    const {
      Party_Name,
      Return_Number,
      Bill_Number,
      Bill_Date,
      Return_Date = new Date().toISOString().slice(0, 10),
      State_Of_Supply,
      Total_Amount,
      splits,
      items,
    } = req.body;

    if (!Party_Name) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Party is required",
      });
    }

    // =========================================================
    // 3. PAYMENT SPLITS
    // =========================================================

    const normalizedSplits = (splits || [])
      .filter((split) => {
        if (!split.Payment_Type) return false;
        if (split.Payment_Type === "Bank" && !split.Bank_Account_Id) return false;
        return true;
      })
      .map((split) => ({
        ...split,
        Amount: Number(split.Amount) || 0,
      }));

    const validSplits = normalizedSplits.filter((split, index) => {
      if (index === 0) return true;
      return split.Amount > 0;
    });

    // =========================================================
    // 4. TOTALS
    // =========================================================

    const totalAmount = Number(Total_Amount) || 0;
    const totalReceived = validSplits.reduce((sum, split) => sum + split.Amount, 0);
    const balanceDue = totalAmount - totalReceived;

    if (totalReceived > totalAmount) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Received amount should be less than or equal to Total Amount",
      });
    }

    if (validSplits.length > 0) {
      try {
        validateSplits(validSplits, totalReceived);
      } catch (validationErr) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: validationErr.message });
      }
    }

    // =========================================================
    // 5. FIND PARTY
    // =========================================================

    const [[party]] = await connection.query(
      `SELECT Party_Id FROM add_party WHERE Party_Name = ? LIMIT 1`,
      [Party_Name]
    );

    if (!party) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Party not found" });
    }

    // =========================================================
    // 6. UPDATE HEADER
    // =========================================================

    await connection.query(
      `UPDATE purchase_return
       SET
         Party_Id        = ?,
         Return_Number   = ?,
         Bill_Number     = ?,
         Bill_Date       = ?,
         Return_Date     = ?,
         State_Of_Supply = ?,
         Total_Amount    = ?,
         Total_Received  = ?,
         Balance_Due     = ?,
         updated_at      = NOW()
       WHERE id = ?`,
      [
        party.Party_Id,
        Return_Number || null,
        Bill_Number || null,
        Bill_Date || null,
        Return_Date,
        State_Of_Supply || null,
        totalAmount,
        totalReceived,
        balanceDue,
        Purchase_Return_Id,
      ]
    );

    // =========================================================
    // 7. REPLACE PAYMENT SPLITS
    // =========================================================

    await deletePaymentSplits({
      connection,
      sourceType: "Purchase_Return",
      sourceId: Purchase_Return_Id,
    });

    if (validSplits.length > 0) {
      await insertPaymentSplits({
        connection,
        sourceType: "Purchase_Return",
        sourceId: Purchase_Return_Id,
        partyName: Party_Name,
        txnDate: Return_Date,
        splits: validSplits,
      });
    }

    // =========================================================
    // 8. PARTY LEDGER
    // =========================================================

    await recordPartyLedger({
      connection,
      partyId: party.Party_Id,
      txnType: "Purchase_Return",
      referenceId: Purchase_Return_Id,
      amount: totalAmount,
      txnDate: Return_Date,
      docNumber: Return_Number,
      balanceDue,
    });

    // =========================================================
    // 9. GET OLD ITEMS
    // =========================================================

    const [oldItems] = await connection.query(
      `SELECT * FROM purchase_return_items WHERE Purchase_Return_Id = ?`,
      [Purchase_Return_Id]
    );

    // =========================================================
    // 10. RESOLVE NEW ITEMS
    // =========================================================

    const resolvedLines = [];

    for (const item of items || []) {
      const itemName = item.Item_Name?.trim();
      const itemAmount = Number(item.Amount) || 0;

      if (!itemName) {
        if (itemAmount > 0) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: "Please enter an item name for the row.",
          });
        }
        continue;
      }

      const {
        Item_Category,
        Item_HSN,
        Item_Unit,          // 🔹 Selected_Unit from frontend
        Quantity,
        Purchase_Price,
        Discount_On_Purchase_Price,
        Discount_Type_On_Purchase_Price,
        Tax_Type,
        Tax_Amount,
        Amount,
      } = item;

      let Item_Id = item.Item_Id || null;
      let dbItemRow = null;

      // =======================================================
      // 11. FIND ITEM
      // =======================================================

      if (Item_Id) {
        const [rows] = await connection.query(
          `SELECT * FROM add_item WHERE Item_Id = ? LIMIT 1`,
          [Item_Id]
        );
        dbItemRow = rows[0] || null;
      } else {
        const [rows] = await connection.query(
          `SELECT * FROM add_item WHERE TRIM(Item_Name) = TRIM(?) LIMIT 1`,
          [itemName]
        );
        dbItemRow = rows[0] || null;
        Item_Id = dbItemRow?.Item_Id || null;
      }

      // =======================================================
      // 12. CREATE ITEM IF NOT FOUND
      // =======================================================

      if (!dbItemRow) {
        const [maxRow] = await connection.query(
          `SELECT MAX(CAST(SUBSTRING(Item_Id, 4) AS UNSIGNED)) AS maxId
           FROM add_item WHERE Item_Id LIKE 'ITM%'`
        );
        const autoId = (maxRow[0]?.maxId || 0) + 1;
        Item_Id = "ITM" + autoId.toString().padStart(3, "0");

        // 🔹 same as editPurchase: new item gets Selected_Unit as Primary_Unit
        await connection.execute(
          `INSERT INTO add_item
           (Item_Id, Item_Name, Item_Category, Item_HSN, Item_Unit,
            Primary_Unit, Secondary_Unit, Conversion_Rate,
            Stock_Quantity, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, 0, NOW(), NOW())`,
          [
            Item_Id,
            itemName,
            Item_Category || "",
            cleanValue(Item_HSN),
            Item_Unit || "",   // legacy
            Item_Unit || null, // Primary_Unit = selected unit
          ]
        );

        dbItemRow = {
          Item_Id,
          Item_HSN: Item_HSN || null,
          Item_Category: Item_Category || "",
          Item_Unit: Item_Unit || "",
          Primary_Unit: Item_Unit || null,
          Secondary_Unit: null,
          Conversion_Rate: null,
        };

      } else {

        // =======================================================
        // 13. UPDATE ALLOWED ITEM MASTER FIELDS
        // =======================================================

        const updates = [];
        const params = [];

        if (Item_HSN && Item_HSN !== dbItemRow.Item_HSN) {
          updates.push("Item_HSN = ?");
          params.push(Item_HSN);
        }

        if (Item_Category !== undefined && Item_Category !== dbItemRow.Item_Category) {
          updates.push("Item_Category = ?");
          params.push(Item_Category || "");
        }

        // 🔹 same as editPurchase: assign Primary_Unit if master has none
        if (!dbItemRow.Primary_Unit && Item_Unit) {
          updates.push("Primary_Unit = ?");
          updates.push("Secondary_Unit = NULL");
          updates.push("Conversion_Rate = NULL");
          updates.push("Item_Unit = ''");
          params.push(Item_Unit);

          // keep dbItemRow in sync for snapshot below
          dbItemRow = {
            ...dbItemRow,
            Primary_Unit: Item_Unit,
            Secondary_Unit: null,
            Conversion_Rate: null,
          };
        }

        if (updates.length > 0) {
          params.push(Item_Id);
          await connection.query(
            `UPDATE add_item
             SET ${updates.join(", ")}, updated_at = NOW()
             WHERE Item_Id = ?`,
            params
          );
        }
      }

      // =======================================================
      // 14. UNIT RESOLUTION — same table as editPurchase
      //     (resolveUnitAndStockDelta if you have that helper,
      //      or inline the same logic)
      // =======================================================

      // const {
      //   stockDelta,
      //   snapshot,
      //   resolvedSelectedUnit,
      // } = resolveUnitAndStockDelta({
      //   dbItemRow,
      //   selectedUnit:  Item_Unit || null,
      //   quantity:      Number(Quantity) || 0,
      //   //txnType:       "Purchase_Return",  // Out direction
      // });
      const {
        stockDelta,
        snapshot,
        resolvedSelectedUnit,
      } = resolveUnitAndStockDelta({
        dbItemRow,
        Selected_Unit: Item_Unit,
        Quantity: Number(Quantity) || 0,
      });

      // =======================================================
      // 15. KEEP RESOLVED LINE
      // =======================================================

      resolvedLines.push({
        ...item,
        Item_Id,
        dbItemRow,

        // unit snapshots for the DB row
        Primary_Unit_Snapshot: snapshot.Primary_Unit_Snapshot,
        Secondary_Unit_Snapshot: snapshot.Secondary_Unit_Snapshot,
        Selected_Unit: resolvedSelectedUnit,

        // normalized values
        stockDelta,
        Quantity: Number(Quantity) || 0,
        Purchase_Price: Number(Purchase_Price) || 0,
        Discount_On_Purchase_Price: Number(Discount_On_Purchase_Price) || 0,
        Discount_Type_On_Purchase_Price: Discount_Type_On_Purchase_Price || "Percentage",
        Tax_Type: Tax_Type || null,
        Tax_Amount: Number(Tax_Amount) || 0,
        Amount: Number(Amount) || 0,
      });
    }

    // =========================================================
    // 16. NET STOCK PER ITEM (using stockDelta from resolution)
    // =========================================================

    const newQtyByItem = new Map();
    // for (const line of resolvedLines) {
    //   newQtyByItem.set(
    //     line.Item_Id,
    //     (newQtyByItem.get(line.Item_Id) || 0) + line.Quantity
    //   );
    // }
    for (const line of resolvedLines) {
  newQtyByItem.set(
    line.Item_Id,
    (newQtyByItem.get(line.Item_Id) || 0) +
      Number(line.stockDelta || 0)
  );
}

    const oldQtyByItem = new Map();
    

for (const old of oldItems) {

  const [[ledgerRow]] = await connection.query(
    `
    SELECT Base_Qty
    FROM item_ledger
    WHERE Item_Id = ?
      AND Txn_Type = 'Purchase_Return'
      AND Source_Id = ?
    LIMIT 1
    `,
    [
      old.Item_Id,
      old.id,
    ]
  );

  let oldBaseQty;

  if (ledgerRow) {
    // Exact historical quantity used for stock
    oldBaseQty =
      Number(ledgerRow.Base_Qty) || 0;
  } else {

    // Fallback for old records where ledger is missing
    const rawQty =
      Number(old.Quantity) || 0;

    oldBaseQty = rawQty;

    const oldPrimary =
      old.Primary_Unit_Snapshot || null;

    const oldSecondary =
      old.Secondary_Unit_Snapshot || null;

    const oldSelected =
      old.Selected_Unit || null;

    if (
      oldPrimary &&
      oldSecondary &&
      oldSelected === oldSecondary
    ) {

      const [[conversion]] =
        await connection.query(
          `
          SELECT Conversion_Rate
          FROM item_unit_conversions
          WHERE Item_Id = ?
            AND Primary_Unit = ?
            AND Secondary_Unit = ?
          ORDER BY id DESC
          LIMIT 1
          `,
          [
            old.Item_Id,
            oldPrimary,
            oldSecondary,
          ]
        );

      const conversionRate =
        Number(conversion?.Conversion_Rate) || 0;

      if (
        Number.isFinite(conversionRate) &&
        conversionRate > 0
      ) {
        oldBaseQty =
          rawQty / conversionRate;
      }
    }
  }

  oldQtyByItem.set(
    old.Item_Id,
    (oldQtyByItem.get(old.Item_Id) || 0) +
      oldBaseQty
  );
}
    // for (const old of oldItems) {
    //   oldQtyByItem.set(
    //     old.Item_Id,
    //     (oldQtyByItem.get(old.Item_Id) || 0) + (Number(old.Quantity) || 0)
    //   );
    // }

    // =========================================================
    // 17. ADJUST add_item.Stock_Quantity BY DIFF
    //     Purchase_Return → items go OUT → Stock_Quantity - diff
    // =========================================================

    const allItemIds = new Set([
      ...newQtyByItem.keys(),
      ...oldQtyByItem.keys(),
    ]);

    for (const itemId of allItemIds) {
      const newQty = newQtyByItem.get(itemId) || 0;
      const oldQty = oldQtyByItem.get(itemId) || 0;
      const diff = newQty - oldQty;

      if (diff !== 0) {
        await connection.query(
          `UPDATE add_item
           SET Stock_Quantity = Stock_Quantity - ?,
               updated_at     = NOW()
           WHERE Item_Id = ?`,
          [diff, itemId]
        );
      }
    }

    // =========================================================
    // 18a. REVERSE OLD ITEM LEDGER ROWS (before delete)
    // =========================================================

    for (const old of oldItems) {
      await reverseItemLedger({
        connection,
        itemId: old.Item_Id,
        txnType: "Purchase_Return",
        referenceId: old.id,
      });
    }

    // =========================================================
    // 18b. DELETE OLD RETURN ITEM ROWS
    // =========================================================

    await connection.query(
      `DELETE FROM purchase_return_items WHERE Purchase_Return_Id = ?`,
      [Purchase_Return_Id]
    );

    // =========================================================
    // 19. INSERT FRESH ROWS + SNAPSHOTS + ITEM LEDGER
    // =========================================================

    for (const line of resolvedLines) {
      const [insertResult] = await connection.query(
        `INSERT INTO purchase_return_items
         (Purchase_Return_Id, Item_Id, Quantity, Purchase_Price,
          Discount_On_Purchase_Price, Discount_Type_On_Purchase_Price,
          Tax_Type, Tax_Amount, Amount,
          Primary_Unit_Snapshot, Secondary_Unit_Snapshot, Selected_Unit)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          Purchase_Return_Id,
          line.Item_Id,
          line.Quantity,
          line.Purchase_Price,
          line.Discount_On_Purchase_Price,
          line.Discount_Type_On_Purchase_Price,
          line.Tax_Type,
          line.Tax_Amount,
          line.Amount,
          line.Primary_Unit_Snapshot,    // 🔹 snapshot
          line.Secondary_Unit_Snapshot,  // 🔹 snapshot
          line.Selected_Unit,            // 🔹 snapshot
        ]
      );

      const prItemId = insertResult.insertId;

      // 🔹 item ledger — direction Out (same as before, unchanged)
      // await recordItemLedger({
      //   connection,
      //   itemId: line.Item_Id,
      //   txnType: "Purchase_Return",
      //   referenceId: prItemId,
      //   billId: existing.id,
      //   partyName: Party_Name,
      //   quantity: line.Quantity,
      //   rate: line.Purchase_Price || null,
      //   txnDate: Return_Date
      // });
   await recordItemLedger({
  connection,
  itemId: line.Item_Id,
  txnType: "Purchase_Return",
  referenceId: prItemId,

  billId: existing.id,
  billNumber: Return_Number || null,

  partyName: Party_Name,

  quantity: normalizeNumber(line.Quantity) ?? 0,

  //selectedUnit: line.resolvedSelectedUnit,
  selectedUnit: line.Selected_Unit,

 baseQty: normalizeNumber(line.stockDelta) ?? 0,

  rate: normalizeNumber(line.Purchase_Price),

  txnDate: Return_Date,
});
    }

    // =========================================================
    // 20. COMMIT
    // =========================================================

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Purchase Return updated successfully",
      Purchase_Return_Id,
      totalAmount,
      totalReceived,
      balanceDue,
    });

  } catch (err) {
    if (connection) await connection.rollback();
    console.error("❌ editPurchaseReturn:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};
const deletePurchaseReturn = async (req, res, next) => {
  let connection;

  try {
    const { Purchase_Return_Id } = req.params;

    if (!Purchase_Return_Id) {
      return res.status(400).json({
        success: false,
        message: "Purchase Return ID is required.",
      });
    }

    connection = await db.getConnection();

    await connection.beginTransaction();

    // =========================================================
    // 1. GET PURCHASE RETURN HEADER
    // =========================================================

    const [[purchaseReturn]] = await connection.query(
      `
      SELECT
        id,
        Purchase_Id,
        Party_Id,
        Return_Number,
        Return_Date
      FROM purchase_return
      WHERE id = ?
      LIMIT 1
      `,
      [Purchase_Return_Id]
    );

    if (!purchaseReturn) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Purchase Return not found.",
      });
    }

    const purchaseReturnDbId = purchaseReturn.id;

    // =========================================================
    // 2. GET ALL RETURN ITEMS
    //
    // purchase_return_items.id
    //        ↓
    // item_ledger.Source_Id
    // =========================================================

    const [returnItems] = await connection.query(
      `
      SELECT
        id,
        Item_Id
      FROM purchase_return_items
      WHERE Purchase_Return_Id = ?
      `,
      [Purchase_Return_Id]
    );

    // =========================================================
    // 3. REVERSE STOCK + ITEM LEDGER
    //
    // Purchase Return = OUT
    //
    // When deleting the return:
    //
    //     OUT is removed
    //     therefore stock must INCREASE again
    //
    // Use Base_Qty from item_ledger.
    // Do NOT use raw Quantity because it may be secondary unit.
    // =========================================================

    for (const returnItem of returnItems) {

      // -------------------------------------------------------
      // Get exact historical quantity from ledger
      // -------------------------------------------------------

      const [[ledgerRow]] = await connection.query(
        `
        SELECT
          id,
          Direction,
          Base_Qty,
          Quantity
        FROM item_ledger
        WHERE Item_Id = ?
          AND Txn_Type = 'Purchase_Return'
          AND Source_Id = ?
        LIMIT 1
        `,
        [
          returnItem.Item_Id,
          returnItem.id,
        ]
      );

      if (!ledgerRow) {
        // No ledger row.
        // Nothing to reverse for this item.
        continue;
      }

      const baseQty =
        Number(
          ledgerRow.Base_Qty ??
          ledgerRow.Quantity
        ) || 0;

      // -------------------------------------------------------
      // Purchase Return was OUT.
      //
      // Return deleted => put stock back.
      // -------------------------------------------------------

      if (
        ledgerRow.Direction === "Out" &&
        baseQty !== 0
      ) {
        await connection.query(
          `
          UPDATE add_item
          SET
            Stock_Quantity = Stock_Quantity + ?,
            updated_at = NOW()
          WHERE Item_Id = ?
          `,
          [
            baseQty,
            returnItem.Item_Id,
          ]
        );
      }

      // -------------------------------------------------------
      // Delete ledger row and fix Running_Stock of all
      // subsequent ledger rows.
      // -------------------------------------------------------

      await reverseItemLedger({
        connection,
        itemId: returnItem.Item_Id,
        txnType: "Purchase_Return",
        referenceId: returnItem.id,
      });
    }

    // =========================================================
    // 4. DELETE PAYMENT SPLITS
    //
    // payment_splits.Source_Id = purchase_return.id
    // =========================================================

    await deletePaymentSplits({
      connection,
      sourceType: "Purchase_Return",
      sourceId: purchaseReturnDbId,
    });

    // =========================================================
    // 5. REVERSE PARTY LEDGER
    //
    // party_ledger.Source_Id = purchase_return.id
    //
    // IMPORTANT:
    // Opening Balance is NOT touched.
    // =========================================================

    await reversePartyLedger({
      connection,
      partyId: purchaseReturn.Party_Id,
      txnType: "Purchase_Return",
      referenceId: purchaseReturnDbId,
    });

    // =========================================================
    // 6. DELETE RETURN ITEMS
    // =========================================================

    await connection.query(
      `
      DELETE FROM purchase_return_items
      WHERE Purchase_Return_Id = ?
      `,
      [Purchase_Return_Id]
    );

    // =========================================================
    // 7. DELETE PURCHASE RETURN HEADER
    // =========================================================

    await connection.query(
      `
      DELETE FROM purchase_return
      WHERE id = ?
      `,
      [Purchase_Return_Id]
    );

    // =========================================================
    // 8. COMMIT
    // =========================================================

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Purchase Return deleted successfully.",
      Purchase_Return_Id,
    });

  } catch (err) {

    if (connection) {
      await connection.rollback();
    }

    console.error(
      "❌ Error deleting purchase return:",
      err
    );

    next(err);

  } finally {

    if (connection) {
      connection.release();
    }
  }
};
const exportPurchaseReturnReportToExcel = async (req, res, next) => {
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
          OR pr.Return_Number LIKE ?
          OR pr.Bill_Number LIKE ?
          OR CAST(pr.Total_Amount AS CHAR) LIKE ?
          OR CAST(pr.Total_Received AS CHAR) LIKE ?
          OR CAST(pr.Balance_Due AS CHAR) LIKE ?
        )
      `);

      params.push(
        like,
        like,
        like,
        like,
        like,
        like
      );
    }

    if (fromDate && toDate) {
      whereClauses.push(
        `DATE(pr.Return_Date) BETWEEN ? AND ?`
      );
      params.push(fromDate, toDate);
    } else if (fromDate) {
      whereClauses.push(
        `DATE(pr.Return_Date) >= ?`
      );
      params.push(fromDate);
    } else if (toDate) {
      whereClauses.push(
        `DATE(pr.Return_Date) <= ?`
      );
      params.push(toDate);
    }

    const whereSQL =
      whereClauses.length
        ? `WHERE ${whereClauses.join(" AND ")}`
        : "";

    const [rows] = await connection.query(
      `
      SELECT
        pr.*,
        a.Party_Name
      FROM purchase_return pr
      LEFT JOIN add_party a
        ON a.Party_Id = pr.Party_Id
      ${whereSQL}
      ORDER BY pr.Return_Date DESC
      `,
      params
    );

    const returnIds = rows.map((r) => r.id);

    if (returnIds.length) {
      const placeholders = returnIds
        .map(() => "?")
        .join(",");

      const [splits] = await connection.query(
        `
        SELECT
          ps.Source_Id,
          ps.Payment_Type,
          ba.Account_Display_Name
        FROM payment_splits ps
        LEFT JOIN bank_accounts ba
          ON ba.id = ps.Bank_Account_Id
        WHERE ps.Source_Type = 'Purchase_Return'
          AND ps.Source_Id IN (${placeholders})
        `,
        returnIds
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
    const sheet = workbook.addWorksheet(
      "Purchase Return Report"
    );

    sheet.columns = [
      { width: 15 }, // Return Date
      { width: 18 }, // Return No
      { width: 18 }, // Bill No
      { width: 35 }, // Party
      { width: 25 }, // Payment Type
      { width: 18 }, // Amount
      { width: 18 }, // Received
      { width: 18 }, // Balance
    ];

    const LAST_COL = "H";

    sheet.mergeCells(`A1:${LAST_COL}1`);

    sheet.getCell("A1").value =
      "PURCHASE RETURN REPORT";

    sheet.getCell("A1").font = {
      bold: true,
      size: 14,
    };

    sheet.getCell("A1").alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    sheet.mergeCells(`A2:${LAST_COL}2`);

    sheet.getCell("A2").value =
      `Generated on ${new Date().toLocaleString("en-IN")}`;

    sheet.getCell("A2").font = {
      italic: true,
      size: 10,
    };

    sheet.addRow([]);

    const headerRow = sheet.addRow([
      "Return Date",
      "Return No",
      "Bill No",
      "Party Name",
      "Payment Type",
      "Total Amount",
      "Total Received",
      "Balance Due",
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
        bottom: { style: "medium" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });

    const FIRST_DATA_ROW = 5;

    rows.forEach((row) => {
      const excelRow = sheet.addRow([
        row.Return_Date
          ? new Date(
              row.Return_Date
            ).toLocaleDateString("en-IN")
          : "",
        row.Return_Number || "",
        row.Bill_Number || "",
        row.Party_Name || "",
        row.Payment_Type_Display || "",
        Number(row.Total_Amount || 0),
        Number(row.Total_Received || 0),
        Number(row.Balance_Due || 0),
      ]);

      excelRow.eachCell(
        { includeEmpty: true },
        (cell, colNumber) => {
          cell.border = {
            top: { style: "hair" },
            bottom: { style: "hair" },
            left: { style: "hair" },
            right: { style: "hair" },
          };

          if ([6, 7, 8].includes(colNumber)) {
            cell.numFmt = "#,##0.00";
            cell.alignment = {
              horizontal: "right",
            };
          }
        }
      );
    });

    const lastDataRow = sheet.rowCount;

    const totalRow = sheet.addRow([
      "",
      "",
      "",
      "",
      "TOTAL",
      {
        formula: `SUM(F${FIRST_DATA_ROW}:F${lastDataRow})`,
      },
      {
        formula: `SUM(G${FIRST_DATA_ROW}:G${lastDataRow})`,
      },
      {
        formula: `SUM(H${FIRST_DATA_ROW}:H${lastDataRow})`,
      },
    ]);

    totalRow.eachCell((cell) => {
      cell.font = {
        bold: true,
      };

      cell.border = {
        top: { style: "medium" },
        bottom: { style: "medium" },
        left: { style: "thin" },
        right: { style: "thin" },
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
        ? `PurchaseReturnReport_${fromDate}_to_${toDate}`
        : `PurchaseReturnReport_${new Date()
            .toISOString()
            .slice(0, 10)}`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName}.xlsx"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(
      "❌ Purchase Return Excel export error:",
      err
    );
    next(err);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};
const getPurchaseReturnPrintReport = async (req,res,next) => {
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
          p.Party_Name LIKE ?
          OR pr.Return_Number LIKE ?
          OR pr.Bill_Number LIKE ?
          OR CAST(pr.Total_Amount AS CHAR) LIKE ?
          OR CAST(pr.Balance_Due AS CHAR) LIKE ?
          OR CAST(pr.Total_Received AS CHAR) LIKE ?
        )
      `);

      params.push(
        like,
        like,
        like,
        like,
        like,
        like
      );
    }

    if (fromDate && toDate) {
      whereClauses.push(
        `DATE(pr.Return_Date) BETWEEN ? AND ?`
      );

      params.push(fromDate, toDate);
    } else if (fromDate) {
      whereClauses.push(
        `DATE(pr.Return_Date) >= ?`
      );

      params.push(fromDate);
    } else if (toDate) {
      whereClauses.push(
        `DATE(pr.Return_Date) <= ?`
      );

      params.push(toDate);
    }

    const whereClause =
      whereClauses.length > 0
        ? `WHERE ${whereClauses.join(" AND ")}`
        : "";

    // ============================
    // HEADER
    // ============================

    const [returns] = await connection.query(
      `
      SELECT
        pr.id,
        pr.Return_Number,
        pr.Bill_Number,
        pr.Bill_Date,
        pr.Return_Date,
        pr.State_Of_Supply,
        pr.Total_Amount,
        pr.Total_Received,
        pr.Balance_Due,
        pr.Party_Id,

        p.Party_Name,
        p.GSTIN
       

      FROM purchase_return pr

      LEFT JOIN add_party p
        ON p.Party_Id = pr.Party_Id

      ${whereClause}

      ORDER BY pr.Return_Date ASC
      `,
      params
    );

    if (!returns.length) {
      return res.status(200).json({
        success: true,
        totalPurchaseReturns: 0,
        purchaseReturns: [],
        summary: {
          totalAmount: 0,
          totalReceived: 0,
          totalDue: 0,
          totalDiscount: 0,
        },
      });
    }

    const returnIds = returns.map(
      (r) => r.id
    );

    const placeholders =
      returnIds.map(() => "?").join(",");

    // ============================
    // ITEMS
    // ============================

    const [items] = await connection.query(
      `
      SELECT
        pri.*,

        i.Item_Name,
        i.Item_HSN,
        i.Item_Unit,
        i.Item_Category,

        i.Primary_Unit,
        i.Secondary_Unit,
        i.Conversion_Rate

      FROM purchase_return_items pri

      LEFT JOIN add_item i
        ON i.Item_Id = pri.Item_Id

      WHERE pri.Purchase_Return_Id IN (${placeholders})

      ORDER BY pri.created_at ASC
      `,
      returnIds
    );

    // ============================
    // SPLITS
    // ============================

    const [splits] = await connection.query(
      `
      SELECT
        ps.*,
        ba.Account_Display_Name

      FROM payment_splits ps

      LEFT JOIN bank_accounts ba
        ON ba.id = ps.Bank_Account_Id

      WHERE ps.Source_Type = 'Purchase_Return'
      AND ps.Source_Id IN (${placeholders})

      ORDER BY ps.id ASC
      `,
      returnIds
    );

    const itemMap = {};
    const splitMap = {};

    items.forEach((item) => {
      if (
        !itemMap[item.Purchase_Return_Id]
      ) {
        itemMap[item.Purchase_Return_Id] = [];
      }

      const price = Number(
        item.Purchase_Price || 0
      );

      let discountAmount = 0;

      if (
        Number(
          item.Discount_On_Purchase_Price ||
            0
        ) > 0
      ) {
        if (
          item.Discount_Type_On_Purchase_Price ===
          "Percentage"
        ) {
          discountAmount =
            (price *
              Number(
                item.Discount_On_Purchase_Price
              )) /
            100;
        } else {
          discountAmount = Number(
            item.Discount_On_Purchase_Price
          );
        }
      }

      itemMap[
        item.Purchase_Return_Id
      ].push({
        ...item,
        Discount_Amount: Number(
          discountAmount.toFixed(2)
        ),
      });
    });

    splits.forEach((split) => {
      if (!splitMap[split.Source_Id]) {
        splitMap[split.Source_Id] = [];
      }

      splitMap[split.Source_Id].push({
        Id: split.id,
        Payment_Type: split.Payment_Type,
        Bank_Account_Id:
          split.Bank_Account_Id,
        Account_Display_Name:
          split.Account_Display_Name,
        Amount: split.Amount,
      });
    });

    // ============================
    // SUMMARY
    // ============================

    const summary = {
      totalAmount: 0,
      totalReceived: 0,
      totalDue: 0,
      totalDiscount: 0,
    };

    const purchaseReturns = returns.map(
      (row) => {
        const returnItems =
          itemMap[row.id] || [];

        summary.totalAmount += Number(
          row.Total_Amount || 0
        );

        summary.totalReceived += Number(
          row.Total_Received || 0
        );

        summary.totalDue += Number(
          row.Balance_Due || 0
        );

        returnItems.forEach((item) => {
          summary.totalDiscount += Number(
            item.Discount_Amount || 0
          );
        });

        return {
          purchaseReturnDetails: {
            Purchase_Return_Id:
              row.id,

            Party_Name:
              row.Party_Name,

            GSTIN: row.GSTIN,

            Return_Number:
              row.Return_Number,

            Bill_Number:
              row.Bill_Number,

            Bill_Date:
              row.Bill_Date,

            Return_Date:
              row.Return_Date,

            State_Of_Supply:
              row.State_Of_Supply,

            Total_Amount:
              row.Total_Amount,

            Total_Received:
              row.Total_Received,

            Balance_Due:
              row.Balance_Due,
          },

          splits:
            splitMap[row.id] || [],

          items: returnItems,
        };
      }
    );

    return res.status(200).json({
      success: true,
      totalPurchaseReturns:
        purchaseReturns.length,

      purchaseReturns,

      summary: {
        totalAmount: Number(
          summary.totalAmount.toFixed(2)
        ),
        totalReceived: Number(
          summary.totalReceived.toFixed(2)
        ),
        totalDue: Number(
          summary.totalDue.toFixed(2)
        ),
        totalDiscount: Number(
          summary.totalDiscount.toFixed(2)
        ),
      },
    });
  } catch (err) {
    console.error(
      "Purchase Return Print Report Error:",
      err
    );

    next(err);
  } 
  finally {
    if (connection)
      connection.release();
  }
};
export { getAllPurchaseReturns, getPurchaseReturnById, createPurchaseReturn, editPurchaseReturn, deletePurchaseReturn,
  exportPurchaseReturnReportToExcel,getPurchaseReturnPrintReport
 };