

import db from "../config/db.js";
import { recordItemLedger, reverseItemLedger } from "../utils/itemLedgerHelper.js";
import { recordPartyLedger, reversePartyLedger } from "../utils/partyLedgerHelper.js";
import { validateSplits, insertPaymentSplits, deletePaymentSplits } from "../utils/paymentSplitHelper.js";
import { resolveUnitAndStockDelta } from "../utils/resolveUnitAndStockDelta.js";
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
/* ── GET ALL ──────────────────────────────────────────────── */
const getAllSaleReturns = async (req, res, next) => {
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
    //     LOWER(p.Party_Name)      LIKE ? OR
    //     LOWER(sr.Return_Number)  LIKE ? OR
    //     LOWER(sr.Invoice_Number) LIKE ? OR
    //     CAST(sr.Total_Amount AS CHAR) LIKE ? OR
    //     CAST(sr.Balance_Due AS CHAR) LIKE ? OR
    //     CAST(sr.Total_Paid AS CHAR) LIKE ?
    //   )`);
    //   const like = `%${search}%`;
    //   params.push(like, like, like, like, like, like);
    // }

    if (search) {
      whereClauses.push(`(
        p.Party_Name     LIKE ? OR
        sr.Return_Number  LIKE ? OR
        sr.Invoice_Number LIKE ? OR
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
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalReturns: total,
      saleReturns: rows,
      totals,
    });
  } catch (err) {
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

/* ── GET SINGLE ───────────────────────────────────────────── */

//    (
//   SELECT pa.Address_Text
//   FROM add_party_addresses pa
//   WHERE pa.Party_Id = sr.Party_Id
//     AND pa.Address_Type = 'Billing'
//     AND pa.Is_Default = 1
// ) AS Billing_Address
const getSaleReturnById = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();
    const { Sale_Return_Id } = req.params;

    if (!Sale_Return_Id) {
      return res.status(400).json({
        success: false,
        message: "Sale Return ID is required.",
      });
    }

    // =========================================================
    // 1. FETCH HEADER
    // =========================================================

    const [[header]] = await connection.query(
      `SELECT
     sr.id,
     sr.Return_Number,
     sr.Invoice_Number,
     sr.Invoice_Date,
     sr.Return_Date,
     sr.State_Of_Supply,
     sr.Total_Amount,
     sr.Total_Paid,
     sr.Balance_Due,
     sr.Party_Id,
     a.Party_Name,
     a.GSTIN,
      
         a.GSTIN,
         a.State
         
   FROM sale_return sr
   LEFT JOIN add_party a
     ON a.Party_Id = sr.Party_Id
   WHERE sr.id = ?`,
      [Sale_Return_Id]
    );

    if (!header) {
      return res.status(404).json({
        success: false,
        message: "Sale Return not found.",
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
      sri.id,
     
      sri.Item_Id,

      i.Item_Name,
      i.Item_HSN,
      i.Item_Unit,
      i.Item_Category,

      -- CURRENT MASTER
      i.Primary_Unit AS Current_Primary_Unit,
      i.Secondary_Unit AS Current_Secondary_Unit,
      i.Conversion_Rate,

      sri.Quantity,

      -- HISTORICAL SNAPSHOT
      sri.Primary_Unit_Snapshot,
      sri.Secondary_Unit_Snapshot,
      sri.Selected_Unit,

      sri.Sale_Price,
      sri.Discount_On_Sale_Price,
      sri.Discount_Type_On_Sale_Price,
      sri.Tax_Amount,
      sri.Tax_Type,
      sri.Amount,
      sri.created_at

  FROM sale_return_items sri

  LEFT JOIN add_item i
    ON sri.Item_Id = i.Item_Id

  WHERE sri.Sale_Return_Id = ?

  ORDER BY sri.created_at DESC
  `,
      [Sale_Return_Id]
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

      const oldPrimary = it.Primary_Unit_Snapshot || null;

      const oldSecondary = it.Secondary_Unit_Snapshot || null;

      const oldSelected = it.Selected_Unit || null;

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

        Sale_Price: it.Sale_Price,

        Discount_On_Purchase_Price:
          it.Discount_On_Purchase_Price,

        Discount_Type_On_Purchase_Price:
          it.Discount_Type_On_Purchase_Price,

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
       WHERE ps.Source_Type = 'Sale_Return'
         AND ps.Source_Id = ?
       ORDER BY ps.id ASC`,
      [Sale_Return_Id]
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
    //     Sale_Return_Id:  header.id,
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
      saleReturn: {
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

/* ── CREATE ───────────────────────────────────────────────── */

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
//       Return_Date = new Date().toISOString().slice(0, 10),
//       State_Of_Supply,
//       Total_Amount,
//       splits,
//       items,
//     } = req.body;

//     // =========================================================
//     // 1. BASIC VALIDATION
//     //
//     // Empty items are allowed.
//     // =========================================================

//     if (!Sale_Id || !Party_Name) {
//       await connection.rollback();

//       return res.status(400).json({
//         success: false,
//         message: "Sale and Customer are required",
//       });
//     }

//     // =========================================================
//     // 2. PAYMENT SPLITS
//     //
//     // First valid split:
//     // Cash ₹0 -> KEEP
//     //
//     // Later:
//     // HDFC ₹0 -> DROP
//     // ANCO ₹20 -> KEEP
//     // =========================================================

//     const normalizedSplits = (splits || [])
//       .filter((split) => {
//         if (!split.Payment_Type) {
//           return false;
//         }

//         if (
//           split.Payment_Type === "Bank" &&
//           !split.Bank_Account_Id
//         ) {
//           return false;
//         }

//         return true;
//       })
//       .map((split) => ({
//         ...split,
//         Amount: Number(split.Amount) || 0,
//       }));

//     const validSplits = normalizedSplits.filter(
//       (split, index) => {
//         if (index === 0) {
//           return true;
//         }

//         return split.Amount > 0;
//       }
//     );

//     // =========================================================
//     // 3. TOTALS
//     //
//     // Don't trust Total_Paid from frontend.
//     // =========================================================

//     const totalAmount =
//       Number(Total_Amount) || 0;

//     const totalPaid = validSplits.reduce(
//       (sum, split) =>
//         sum + (Number(split.Amount) || 0),
//       0
//     );

//     const balanceDue =
//       totalAmount - totalPaid;

//     if (totalPaid > totalAmount) {
//       await connection.rollback();

//       return res.status(400).json({
//         success: false,
//         message:
//           "Paid amount should be less than or equal to Total Amount",
//       });
//     }

//     // =========================================================
//     // 4. VALIDATE ONLY SURVIVING SPLITS
//     // =========================================================

//     if (validSplits.length > 0) {
//       try {
//         validateSplits(
//           validSplits,
//           totalPaid
//         );
//       } catch (validationErr) {
//         await connection.rollback();

//         return res.status(400).json({
//           success: false,
//           message: validationErr.message,
//         });
//       }
//     }

//     // =========================================================
//     // 5. FIND PARTY
//     // =========================================================

//     const [[party]] =
//       await connection.query(
//         `SELECT Party_Id
//          FROM add_party
//          WHERE Party_Name = ?
//          LIMIT 1`,
//         [Party_Name]
//       );

//     if (!party) {
//       await connection.rollback();

//       return res.status(404).json({
//         success: false,
//         message: "Customer not found",
//       });
//     }

//     // =========================================================
//     // 6. CREATE SALE RETURN HEADER
//     // =========================================================

//     const [headerResult] =
//       await connection.query(
//         `INSERT INTO sale_return
//         (
//           Sale_Id,
//           Party_Id,
//           Return_Number,
//           Invoice_Number,
//           Invoice_Date,
//           Return_Date,
//           State_Of_Supply,
//           Total_Amount,
//           Total_Paid,
//           Balance_Due
//         )
//         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//         [
//           Sale_Id,
//           party.Party_Id,
//           Return_Number || null,
//           Invoice_Number || null,
//           Invoice_Date || null,
//           Return_Date,
//           State_Of_Supply || null,
//           totalAmount,
//           totalPaid,
//           balanceDue,
//         ]
//       );

//     const Sale_Return_Id =headerResult.insertId;

//     // =========================================================
//     // 7. PAYMENT SPLITS
//     //
//     // IMPORTANT:
//     // Cash ₹0 first split is also inserted.
//     // =========================================================

//     if (validSplits.length > 0) {
//       await insertPaymentSplits({
//         connection,
//         sourceType: "Sale_Return",
//         sourceId: Sale_Return_Id,
//         partyName: Party_Name,
//         txnDate: Return_Date,
//         splits: validSplits,
//       });
//     }

//     // =========================================================
//     // 8. PARTY LEDGER
//     // =========================================================

//     await recordPartyLedger({
//       connection,
//       partyId: party.Party_Id,
//       txnType: "Sale_Return",
//       referenceId: Sale_Return_Id,
//       amount: totalAmount,
//       txnDate: Return_Date,
//       docNumber: Return_Number,
//       balanceDue,
//     });

//     // =========================================================
//     // 9. ITEMS
//     //
//     // No name + Amount > 0 -> ERROR
//     // No name + Amount 0   -> SKIP
//     // =========================================================

//     for (const item of items || []) {
//       const itemName =
//         item.Item_Name?.trim();

//       const itemAmount =
//         Number(item.Amount) || 0;

//       if (!itemName) {
//         if (itemAmount > 0) {
//           await connection.rollback();

//           return res.status(400).json({
//             success: false,
//             message:
//               "Please enter an item name for the row.",
//           });
//         }

//         continue;
//       }

//       const {
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

//       // =======================================================
//       // 10. FIND ITEM
//       // =======================================================

//       const [[existingItem]] =
//         await connection.query(
//           `SELECT *
//            FROM add_item
//            WHERE TRIM(Item_Name) = TRIM(?)
//            LIMIT 1`,
//           [itemName]
//         );

//       let Item_Id;

//       // =======================================================
//       // 11. CREATE ITEM IF NEEDED
//       // =======================================================

//       if (!existingItem) {
//         const [maxRow] =
//           await connection.query(
//             `SELECT
//                MAX(
//                  CAST(
//                    SUBSTRING(Item_Id, 4)
//                    AS UNSIGNED
//                  )
//                ) AS maxId
//              FROM add_item
//              WHERE Item_Id LIKE 'ITM%'`
//           );

//         const autoId =
//           (maxRow[0]?.maxId || 0) + 1;

//         Item_Id ="ITM" + autoId.toString().padStart(3, "0");

//         await connection.execute(
//           `INSERT INTO add_item
//            (
//              Item_Id,
//              Item_Name,
//              Item_Category,
//              Item_HSN,
//              Item_Unit,
//              Stock_Quantity,
//              created_at,
//              updated_at
//            )
//            VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
//           [
//             Item_Id,
//             itemName,
//             Item_Category || "",
//             cleanValue(Item_HSN),
//             Item_Unit || "",
//             0,
//           ]
//         );
//       } else {
//         Item_Id = existingItem.Item_Id;

//         // =====================================================
//         // 12. UPDATE ALLOWED MASTER DATA
//         // =====================================================

//         const updates = [];
//         const params = [];

//         if (
//           Item_HSN &&
//           Item_HSN !== existingItem.Item_HSN
//         ) {
//           updates.push("Item_HSN = ?");
//           params.push(Item_HSN);
//         }

//         if (
//           Item_Category !== undefined &&
//           Item_Category !== existingItem.Item_Category
//         ) {
//           updates.push("Item_Category = ?");
//           params.push(Item_Category || "");
//         }

//         if (updates.length > 0) {
//           params.push(Item_Id);

//           await connection.query(
//             `UPDATE add_item
//              SET ${updates.join(", ")},
//                  updated_at = NOW()
//              WHERE Item_Id = ?`,
//             params
//           );
//         }
//       }

//       // =======================================================
//       // 13. INSERT RETURN ITEM
//       // =======================================================

//       // await connection.query(
//       //   `INSERT INTO sale_return_items
//       //   (
//       //     Sale_Return_Id,
//       //     Item_Id,
//       //     Quantity,
//       //     Sale_Price,
//       //     Discount_On_Sale_Price,
//       //     Discount_Type_On_Sale_Price,
//       //     Tax_Type,
//       //     Tax_Amount,
//       //     Amount
//       //   )
//       //   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//       //   [
//       //     Sale_Return_Id,
//       //     Item_Id,
//       //     Number(Quantity) || 0,
//       //     Number(Sale_Price) || 0,
//       //     Number(Discount_On_Sale_Price) || 0,
//       //     Discount_Type_On_Sale_Price ||
//       //       "Percentage",
//       //     Tax_Type || null,
//       //     Number(Tax_Amount) || 0,
//       //     Number(Amount) || 0,
//       //   ]
//       // );
//       const [srItemResult] = await connection.query(
//   `INSERT INTO sale_return_items
//   (
//     Sale_Return_Id,
//     Item_Id,
//     Quantity,
//     Sale_Price,
//     Discount_On_Sale_Price,
//     Discount_Type_On_Sale_Price,
//     Tax_Type,
//     Tax_Amount,
//     Amount
//   )
//   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//   [
//     Sale_Return_Id,
//     Item_Id,
//     Number(Quantity) || 0,
//     Number(Sale_Price) || 0,
//     Number(Discount_On_Sale_Price) || 0,
//     Discount_Type_On_Sale_Price || "Percentage",
//     Tax_Type || null,
//     Number(Tax_Amount) || 0,
//     Number(Amount) || 0,
//   ]
// );

// const saleReturnItemId = srItemResult.insertId;

//       // =======================================================
//       // 14. SALE RETURN -> STOCK COMES BACK
//       // =======================================================

//       await connection.query(
//         `UPDATE add_item
//          SET
//            Stock_Quantity =
//              Stock_Quantity + ?,
//            updated_at = NOW()
//          WHERE Item_Id = ?`,
//         [
//           Number(Quantity) || 0,
//           Item_Id,
//         ]
//       );
//       await recordItemLedger({
//   connection,

//   itemId: Item_Id,

//   txnType: "Sale_Return",

//   // Exact sale_return_items row.
//   // Used for reverse/edit/delete.
//   referenceId: saleReturnItemId,

//   // Parent sale_return header.
//   // Used to open the complete return bill.
//   billId: Sale_Return_Id,

//   // Human-readable number shown in UI.
//   billNumber: Return_Number || null,

//   partyName: Party_Name,

//   quantity: Number(Quantity) || 0,

//   rate: Number(Sale_Price) || null,

//   txnDate: Return_Date,
// });
//     }

//     // =========================================================
//     // 15. COMMIT
//     // =========================================================

//     await connection.commit();

//     return res.status(201).json({
//       success: true,
//       message: "Sale Return created",
//       Sale_Return_Id,
//       totalAmount,
//       totalPaid,
//       balanceDue,
//     });

//   } catch (err) {
//     if (connection) {
//       await connection.rollback();
//     }

//     console.error(
//       "createSaleReturn:",
//       err
//     );

//     next(err);

//   } finally {
//     if (connection) {
//       connection.release();
//     }
//   }
// };

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
      Return_Date = new Date().toISOString().slice(0, 10),
      State_Of_Supply,
      Total_Amount,
      splits,
      items,
    } = req.body;

    // =========================================================
    // 1. BASIC VALIDATION
    // =========================================================

    if (!Sale_Id || !Party_Name || !Return_Date) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Sale_Id, Party and Return Date are required",
      });
    }
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
    // =========================================================
    // 2. NORMALIZE PAYMENT SPLITS
    // =========================================================

    const normalizedSplits = splits
      .filter((split) => {
        if (!split.Payment_Type) return false;
        if (split.Payment_Type === "Bank" && !split.Bank_Account_Id) return false;
        return true;
      })
      .map((split) => ({
        ...split,
        Amount: Number(split.Amount) || 0,
      }));

    // =========================================================
    // 3. PAYMENT SPLIT RULE
    // =========================================================

    const validSplits = normalizedSplits.filter((split, index) => {
      if (index === 0) return true;
      return split.Amount > 0;
    });

    // =========================================================
    // 4. CALCULATE TOTAL PAID (Sale Return — you pay customer)
    // =========================================================

    const totalPaid = validSplits.reduce(
      (sum, split) => sum + split.Amount,
      0
    );

    const totalAmount = Number(Total_Amount) || 0;
    const balanceDue = totalAmount - totalPaid;

    // =========================================================
    // 5. TOTAL VALIDATION
    // =========================================================

    if (totalPaid > totalAmount) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Paid amount should be less than or equal to Total Amount",
      });
    }

    // =========================================================
    // 6. VALIDATE SURVIVING SPLITS
    // =========================================================

    try {
      validateSplits(validSplits, totalPaid);
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
      `SELECT Party_Id FROM add_party WHERE Party_Name = ? LIMIT 1`,
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
    // 8. INSERT SALE RETURN HEADER
    // =========================================================

    const [headerResult] = await connection.query(
      `INSERT INTO sale_return
       (
         Sale_Id,
         Party_Id,
         Return_Number,
         Invoice_Number,
         Invoice_Date,
         financial_year,
         Return_Date,
         State_Of_Supply,
         Total_Amount,
         Total_Paid,
         Balance_Due
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Sale_Id,
        party.Party_Id,
        Return_Number || null,
        Invoice_Number || null,
        Invoice_Date || null,
        activeFY,
        Return_Date,
        State_Of_Supply || null,
        totalAmount,
        totalPaid,
        balanceDue,
      ]
    );

    const id = headerResult.insertId;

    // =========================================================
    // 9. INSERT PAYMENT SPLITS
    // =========================================================

    await insertPaymentSplits({
      connection,
      sourceType: "Sale_Return",
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
      txnType: "Sale_Return",
      referenceId: id,
      amount: totalAmount,
      txnDate: Return_Date,
      docNumber: Return_Number,
      balanceDue,
    });

    // =========================================================
    // 11. ITEMS
    // =========================================================

    for (const item of items || []) {
      const itemName = item.Item_Name?.trim();

      const itemAmount =
        item.Amount === "" ||
          item.Amount === null ||
          item.Amount === undefined
          ? 0
          : Number(item.Amount) || 0;

      // ── blank row rule ──
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
        Item_Unit,
        Quantity,
        Sale_Price,
        Discount_On_Sale_Price,
        Discount_Type_On_Sale_Price,
        Tax_Type,
        Tax_Amount,
        Amount,
      } = item;

      // ── UNIT ARCHITECTURE (ported from createPurchaseReturn) ──
      const Selected_Unit = Item_Unit || null;   // step 1

      // =========================================================
      // 12. FIND EXISTING ITEM
      // =========================================================

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
      let dbItemRow;

      // =========================================================
      // 13. CREATE ITEM IF IT DOESN'T EXIST
      // =========================================================

      if (!existingItem) {
        const [ins] = await connection.execute(
          `INSERT INTO add_item
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
           VALUES (?, ?, ?, ?, ?, NULL, NULL, 0, NOW(), NOW())`,
          [
            itemName,
            Item_Category || "",
            cleanValue(Item_HSN),
            Item_Unit || "",
            Selected_Unit,          // step 2
          ]
        );

        Item_Id = "ITM" + ins.insertId.toString().padStart(3, "0");

        await connection.execute(
          `UPDATE add_item SET Item_Id = ? WHERE id = ?`,
          [Item_Id, ins.insertId]
        );

        // step 3
        dbItemRow = {
          Primary_Unit: Selected_Unit,
          Secondary_Unit: null,
          Conversion_Rate: null,
        };

      } else {

        // ── EXISTING ITEM ──
        Item_Id = existingItem.Item_Id;

        // step 4 — first-time unit assignment
        if (!existingItem.Primary_Unit && Selected_Unit) {
          await connection.query(
            `UPDATE add_item
             SET
               Primary_Unit    = ?,
               Secondary_Unit  = NULL,
               Conversion_Rate = NULL,
               Item_Unit       = '',
               updated_at      = NOW()
             WHERE Item_Id = ?`,
            [Selected_Unit, Item_Id]
          );

          existingItem.Primary_Unit = Selected_Unit;
          existingItem.Secondary_Unit = null;
          existingItem.Conversion_Rate = null;
        }

        // sync HSN / Category if changed
        const updates = [];
        const params = [];

        if (Item_HSN && Item_HSN !== existingItem.Item_HSN) {
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
             SET ${updates.join(", ")}, updated_at = NOW()
             WHERE Item_Id = ?`,
            params
          );
        }

        dbItemRow = existingItem;  // step 4 (in-memory update already done above)
      }

      // step 5
      const {
        stockDelta,
        snapshot,
        resolvedSelectedUnit,
      } = resolveUnitAndStockDelta({
        dbItemRow,
        Selected_Unit,
        Quantity,
      });

      // =========================================================
      // 14. INSERT SALE RETURN ITEM
      //     step 6 — add snapshot columns
      // =========================================================

      const [srItemResult] = await connection.query(
        `INSERT INTO sale_return_items
         (
           Sale_Return_Id,
           Item_Id,
           Primary_Unit_Snapshot,
           Secondary_Unit_Snapshot,
           Selected_Unit,
           Quantity,
           Sale_Price,
           Discount_On_Sale_Price,
           Discount_Type_On_Sale_Price,
           Tax_Type,
           Tax_Amount,
           Amount
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          Item_Id,
          snapshot.Primary_Unit_Snapshot,    // step 6
          snapshot.Secondary_Unit_Snapshot,  // step 6
          resolvedSelectedUnit,              // step 6
          Number(Quantity) || 0,
          Number(Sale_Price) || 0,
          Number(Discount_On_Sale_Price) || 0,
          Discount_Type_On_Sale_Price || "Percentage",
          Tax_Type || "None",
          Number(Tax_Amount) || 0,
          Number(Amount) || 0,
        ]
      );

      const srItemId = srItemResult.insertId;

      // =========================================================
      // 15. STOCK
      //
      // SALE RETURN:
      // customer returns goods — stock INCREASES.
      //
      // step 7 — use stockDelta instead of raw Quantity
      // =========================================================

      await connection.query(
        `UPDATE add_item
         SET
           Stock_Quantity = Stock_Quantity + ?,
           updated_at     = NOW()
         WHERE Item_Id = ?`,
        [stockDelta, Item_Id]   // step 7: + stockDelta (not + Quantity)
      );

      // step 8 — item ledger unchanged (uses raw Quantity, not stockDelta)
      // await recordItemLedger({
      //   connection,
      //   itemId: Item_Id,
      //   txnType: "Sale_Return",
      //   referenceId: srItemId,
      //   billId: id,
      //   billNumber: Return_Number || null,
      //   partyName: Party_Name,
      //   quantity: Number(Quantity) || 0,   // step 8: keep raw Quantity
      //   rate: Number(Sale_Price) || null,
      //   txnDate: Return_Date,
      // });
      await recordItemLedger({
        connection,

        itemId: Item_Id,

        txnType: "Sale_Return",

        referenceId: srItemId,

        billId: id,                     // sale_return.id
        billNumber: Return_Number || null,

        partyName: Party_Name,

        // User-entered quantity
        quantity: normalizeNumber(Quantity) ?? 0,

        // Unit used in this transaction
        selectedUnit: resolvedSelectedUnit,

        // Normalized quantity in primary unit
        baseQty: normalizeNumber(stockDelta) ?? 0,

        rate: normalizeNumber(Sale_Price),

        txnDate: Return_Date,
      });
    }

    // =========================================================
    // 16. COMMIT
    // =========================================================

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Sale Return created",
      id,
      totalAmount,
      totalPaid,
      balanceDue,
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

// const editSaleReturn = async (req, res, next) => {
//   let connection;

//   try {
//     const { Sale_Return_Id } = req.params;

//     connection = await db.getConnection();
//     await connection.beginTransaction();

//     // =========================================================
//     // 1. CHECK RETURN EXISTS
//     // =========================================================

//     const [[existing]] =
//       await connection.query(
//         `SELECT *
//          FROM sale_return
//          WHERE id = ?`,
//         [Sale_Return_Id]
//       );

//     if (!existing) {
//       await connection.rollback();

//       return res.status(404).json({
//         success: false,
//         message: "Sale Return not found",
//       });
//     }

//     // =========================================================
//     // 2. BODY
//     // =========================================================

//     const {
//       Party_Name,
//       Return_Number,
//       Invoice_Number,
//       Invoice_Date,
//       Return_Date,
//       State_Of_Supply,
//       Total_Amount,
//       splits,
//       items,
//     } = req.body;

//     // =========================================================
//     // 3. PAYMENT SPLITS
//     // =========================================================

//     const normalizedSplits = (splits || [])
//       .filter((split) => {
//         if (!split.Payment_Type) {
//           return false;
//         }

//         if (
//           split.Payment_Type === "Bank" &&
//           !split.Bank_Account_Id
//         ) {
//           return false;
//         }

//         return true;
//       })
//       .map((split) => ({
//         ...split,
//         Amount: Number(split.Amount) || 0,
//       }));

//     const validSplits =
//       normalizedSplits.filter(
//         (split, index) => {
//           // first valid payment stays,
//           // including ₹0
//           if (index === 0) {
//             return true;
//           }

//           // later zero payments disappear
//           return split.Amount > 0;
//         }
//       );

//     // =========================================================
//     // 4. TOTALS
//     // =========================================================

//     const totalAmount =
//       Number(Total_Amount) || 0;

//     const totalPaid =
//       validSplits.reduce(
//         (sum, split) =>
//           sum +
//           (Number(split.Amount) || 0),
//         0
//       );

//     const balanceDue =
//       totalAmount - totalPaid;

//     if (totalPaid > totalAmount) {
//       await connection.rollback();

//       return res.status(400).json({
//         success: false,
//         message:
//           "Paid amount should be less than or equal to Total Amount",
//       });
//     }

//     // =========================================================
//     // 5. VALIDATE SURVIVING SPLITS
//     // =========================================================

//     if (validSplits.length > 0) {
//       try {
//         validateSplits(
//           validSplits,
//           totalPaid
//         );
//       } catch (validationErr) {
//         await connection.rollback();

//         return res.status(400).json({
//           success: false,
//           message: validationErr.message,
//         });
//       }
//     }

//     // =========================================================
//     // 6. PARTY
//     // =========================================================

//     const [[party]] =
//       await connection.query(
//         `SELECT Party_Id
//          FROM add_party
//          WHERE Party_Name = ?
//          LIMIT 1`,
//         [Party_Name]
//       );

//     if (!party) {
//       await connection.rollback();

//       return res.status(404).json({
//         success: false,
//         message: "Customer not found",
//       });
//     }

//     // =========================================================
//     // 7. UPDATE HEADER
//     // =========================================================

//     await connection.query(
//       `UPDATE sale_return
//        SET
//          Party_Id = ?,
//          Return_Number = ?,
//          Invoice_Number = ?,
//          Invoice_Date = ?,
//          Return_Date = ?,
//          State_Of_Supply = ?,
//          Total_Amount = ?,
//          Total_Paid = ?,
//          Balance_Due = ?,
//          updated_at = NOW()
//        WHERE id = ?`,
//       [
//         party.Party_Id,
//         Return_Number || null,
//         Invoice_Number || null,
//         Invoice_Date || null,
//         Return_Date,
//         State_Of_Supply || null,
//         totalAmount,
//         totalPaid,
//         balanceDue,
//         Sale_Return_Id,
//       ]
//     );

//     // =========================================================
//     // 8. REPLACE PAYMENT SPLITS
//     // =========================================================

//     await deletePaymentSplits({
//       connection,
//       sourceType: "Sale_Return",
//       sourceId: Number(Sale_Return_Id),
//     });

//     if (validSplits.length > 0) {
//       await insertPaymentSplits({
//         connection,
//         sourceType: "Sale_Return",
//         sourceId: Number(Sale_Return_Id),
//         partyName: Party_Name,
//         txnDate: Return_Date,
//         splits: validSplits,
//       });
//     }

//     // =========================================================
//     // 9. PARTY LEDGER
//     // =========================================================

//     await recordPartyLedger({
//       connection,
//       partyId: party.Party_Id,
//       txnType: "Sale_Return",
//       referenceId: Number(Sale_Return_Id),
//       amount: totalAmount,
//       txnDate: Return_Date,
//       docNumber: Return_Number,
//       balanceDue,
//     });

//     // =========================================================
//     // 10. OLD ITEMS
//     // =========================================================

//     const [oldItems] =
//       await connection.query(
//         `SELECT *
//          FROM sale_return_items
//          WHERE Sale_Return_Id = ?`,
//         [Sale_Return_Id]
//       );

//     // =========================================================
//     // 11. RESOLVE NEW LINES
//     // =========================================================

//     const resolvedLines = [];

//     for (const item of items || []) {
//       const itemName =
//         item.Item_Name?.trim();

//       const itemAmount =
//         Number(item.Amount) || 0;

//       // =======================================================
//       // No name + positive amount -> ERROR
//       // No name + zero amount     -> SKIP
//       // =======================================================

//       if (!itemName) {
//         if (itemAmount > 0) {
//           await connection.rollback();

//           return res.status(400).json({
//             success: false,
//             message:
//               "Please enter an item name for the row.",
//           });
//         }

//         continue;
//       }

//       const {
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

//       let Item_Id =
//         item.Item_Id || null;

//       let dbItemRow = null;

//       // =======================================================
//       // 12. FIND ITEM
//       // =======================================================

//       if (Item_Id) {
//         const [rows] =
//           await connection.query(
//             `SELECT *
//              FROM add_item
//              WHERE Item_Id = ?
//              LIMIT 1`,
//             [Item_Id]
//           );

//         dbItemRow =
//           rows[0] || null;

//       } else {
//         const [rows] =
//           await connection.query(
//             `SELECT *
//              FROM add_item
//              WHERE TRIM(Item_Name) = TRIM(?)
//              LIMIT 1`,
//             [itemName]
//           );

//         dbItemRow =
//           rows[0] || null;

//         Item_Id =
//           dbItemRow?.Item_Id || null;
//       }

//       // =======================================================
//       // 13. CREATE ITEM
//       // =======================================================

//       if (!dbItemRow) {
//         const [maxRow] =
//           await connection.query(
//             `SELECT
//                MAX(
//                  CAST(
//                    SUBSTRING(Item_Id, 4)
//                    AS UNSIGNED
//                  )
//                ) AS maxId
//              FROM add_item
//              WHERE Item_Id LIKE 'ITM%'`
//           );

//         const autoId =
//           (maxRow[0]?.maxId || 0) + 1;

//         Item_Id =
//           "ITM" +
//           autoId
//             .toString()
//             .padStart(3, "0");

//         await connection.execute(
//           `INSERT INTO add_item
//            (
//              Item_Id,
//              Item_Name,
//              Item_Category,
//              Item_HSN,
//              Item_Unit,
//              Stock_Quantity,
//              created_at,
//              updated_at
//            )
//            VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
//           [
//             Item_Id,
//             itemName,
//             Item_Category || "",
//             cleanValue(Item_HSN),
//             Item_Unit || "",
//             0,
//           ]
//         );

//         dbItemRow = {
//           Item_Id,
//           Item_HSN,
//           Item_Category,
//           Item_Unit,
//         };

//       } else {
//         // =====================================================
//         // 14. UPDATE ALLOWED MASTER FIELDS
//         // =====================================================

//         const updates = [];
//         const params = [];

//         if (
//           Item_HSN &&
//           Item_HSN !== dbItemRow.Item_HSN
//         ) {
//           updates.push("Item_HSN = ?");
//           params.push(Item_HSN);
//         }

//         if (
//           Item_Category !== undefined &&
//           Item_Category !==
//           dbItemRow.Item_Category
//         ) {
//           updates.push(
//             "Item_Category = ?"
//           );

//           params.push(
//             Item_Category || ""
//           );
//         }

//         if (updates.length > 0) {
//           params.push(Item_Id);

//           await connection.query(
//             `UPDATE add_item
//              SET ${updates.join(", ")},
//                  updated_at = NOW()
//              WHERE Item_Id = ?`,
//             params
//           );
//         }
//       }

//       // =======================================================
//       // 15. KEEP RESOLVED LINE
//       // =======================================================

//       resolvedLines.push({
//         ...item,

//         Item_Id,

//         Quantity:
//           Number(Quantity) || 0,

//         Sale_Price:
//           Number(Sale_Price) || 0,

//         Discount_On_Sale_Price:
//           Number(
//             Discount_On_Sale_Price
//           ) || 0,

//         Discount_Type_On_Sale_Price:
//           Discount_Type_On_Sale_Price ||
//           "Percentage",

//         Tax_Type:
//           Tax_Type || null,

//         Tax_Amount:
//           Number(Tax_Amount) || 0,

//         Amount:
//           Number(Amount) || 0,
//       });
//     }

//     // =========================================================
//     // 16. NEW QUANTITY PER ITEM
//     // =========================================================

//     const newQtyByItem =
//       new Map();

//     for (const line of resolvedLines) {
//       newQtyByItem.set(
//         line.Item_Id,
//         (newQtyByItem.get(line.Item_Id) || 0) +
//         line.Quantity
//       );
//     }

//     // =========================================================
//     // 17. OLD QUANTITY PER ITEM
//     // =========================================================

//     const oldQtyByItem =
//       new Map();

//     for (const old of oldItems) {
//       oldQtyByItem.set(
//         old.Item_Id,
//         (oldQtyByItem.get(old.Item_Id) || 0) +
//         (Number(old.Quantity) || 0)
//       );
//     }

//     // =========================================================
//     // 18. STOCK DIFFERENCE
//     //
//     // SALE RETURN ADDS STOCK.
//     //
//     // Old return = 5
//     // New return = 8
//     // diff = +3
//     // stock += 3
//     //
//     // Old return = 8
//     // New return = 5
//     // diff = -3
//     // stock -= 3
//     // =========================================================

//     const allItemIds =
//       new Set([
//         ...newQtyByItem.keys(),
//         ...oldQtyByItem.keys(),
//       ]);

//     for (const itemId of allItemIds) {
//       const newQty =
//         newQtyByItem.get(itemId) || 0;

//       const oldQty =
//         oldQtyByItem.get(itemId) || 0;

//       const diff =
//         newQty - oldQty;

//       if (diff !== 0) {
//         await connection.query(
//           `UPDATE add_item
//            SET
//              Stock_Quantity =
//                Stock_Quantity + ?,
//              updated_at = NOW()
//            WHERE Item_Id = ?`,
//           [
//             diff,
//             itemId,
//           ]
//         );
//       }
//     }
//     // =========================================================
//     // 19. REVERSE OLD ITEM LEDGER ENTRIES
//     // =========================================================

//     for (const old of oldItems) {
//       await reverseItemLedger({
//         connection,

//         itemId: old.Item_Id,
//         txnType: "Sale_Return",

//         // old sale_return_items.id
//         referenceId: old.id,
//       });
//     }
//     // =========================================================
//     // 19. DELETE OLD RETURN ITEMS
//     // =========================================================

//     await connection.query(
//       `DELETE FROM sale_return_items
//        WHERE Sale_Return_Id = ?`,
//       [Sale_Return_Id]
//     );

//     // =========================================================
//     // 20. REINSERT
//     // =========================================================
//     for (const line of resolvedLines) {

//       const [srItemResult] = await connection.query(
//         `INSERT INTO sale_return_items
//     (
//       Sale_Return_Id,
//       Item_Id,
//       Quantity,
//       Sale_Price,
//       Discount_On_Sale_Price,
//       Discount_Type_On_Sale_Price,
//       Tax_Type,
//       Tax_Amount,
//       Amount
//     )
//     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//         [
//           Sale_Return_Id,
//           line.Item_Id,
//           line.Quantity,
//           line.Sale_Price,
//           line.Discount_On_Sale_Price,
//           line.Discount_Type_On_Sale_Price,
//           line.Tax_Type,
//           line.Tax_Amount,
//           line.Amount,
//         ]
//       );

//       const saleReturnItemId = srItemResult.insertId;

//       await recordItemLedger({
//         connection,

//         itemId: line.Item_Id,
//         txnType: "Sale_Return",

//         referenceId: saleReturnItemId,

//         billId: Number(Sale_Return_Id),
//         billNumber: Return_Number || null,

//         partyName: Party_Name,

//         quantity: line.Quantity,
//         rate: line.Sale_Price ?? null,

//         txnDate: Return_Date,
//       });
//     }


//     // =========================================================
//     // 22. COMMIT
//     // =========================================================

//     await connection.commit();

//     return res.status(200).json({
//       success: true,
//       message:
//         "Sale Return updated successfully",
//       Sale_Return_Id,
//       totalAmount,
//       totalPaid,
//       balanceDue,
//     });

//   } catch (err) {
//     if (connection) {
//       await connection.rollback();
//     }

//     console.error(
//       "editSaleReturn:",
//       err
//     );

//     next(err);

//   } finally {
//     if (connection) {
//       connection.release();
//     }
//   }
// };
/* ── DELETE ───────────────────────────────────────────────── */

const editSaleReturn = async (req, res, next) => {
  let connection;

  try {
    const { Sale_Return_Id } = req.params;

    connection = await db.getConnection();
    await connection.beginTransaction();

    // =========================================================
    // 1. CHECK RETURN EXISTS
    // =========================================================

    const [[existing]] = await connection.query(
      `SELECT id,financial_year FROM sale_return WHERE id = ?`,
      [Sale_Return_Id]
    );

    if (!existing) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Sale Return not found",
      });
    }

    // =========================================================
    // 2. BODY
    // =========================================================

    const {
      Party_Name,
      Return_Number,
      Invoice_Number,
      Invoice_Date,
      Return_Date,
      State_Of_Supply,
      Total_Amount,
      splits,
      items,
    } = req.body;

    // =========================================================
    // 3. PAYMENT SPLITS — unchanged
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
    // 4. TOTALS — unchanged
    // =========================================================

    const totalAmount = Number(Total_Amount) || 0;
    const totalPaid = validSplits.reduce((sum, split) => sum + (Number(split.Amount) || 0), 0);
    const balanceDue = totalAmount - totalPaid;

    if (totalPaid > totalAmount) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Paid amount should be less than or equal to Total Amount",
      });
    }

    // =========================================================
    // 5. VALIDATE SURVIVING SPLITS — unchanged
    // =========================================================

    if (validSplits.length > 0) {
      try {
        validateSplits(validSplits, totalPaid);
      } catch (validationErr) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: validationErr.message });
      }
    }

    // =========================================================
    // 6. PARTY — unchanged
    // =========================================================

    const [[party]] = await connection.query(
      `SELECT Party_Id FROM add_party WHERE Party_Name = ? LIMIT 1`,
      [Party_Name]
    );

    if (!party) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // =========================================================
    // 7. UPDATE HEADER — unchanged
    // =========================================================

    await connection.query(
      `UPDATE sale_return
       SET
         Party_Id = ?,
         Return_Number = ?,
         Invoice_Number = ?,
         Invoice_Date = ?,
         Return_Date = ?,
         State_Of_Supply = ?,
         Total_Amount = ?,
         Total_Paid = ?,
         Balance_Due = ?,
         updated_at = NOW()
       WHERE id = ?`,
      [
        party.Party_Id,
        Return_Number || null,
        Invoice_Number || null,
        Invoice_Date || null,
        Return_Date,
        State_Of_Supply || null,
        totalAmount,
        totalPaid,
        balanceDue,
        Sale_Return_Id,
      ]
    );

    // =========================================================
    // 8. REPLACE PAYMENT SPLITS — unchanged
    // =========================================================

    await deletePaymentSplits({
      connection,
      sourceType: "Sale_Return",
      sourceId: Number(Sale_Return_Id),
    });

    if (validSplits.length > 0) {
      await insertPaymentSplits({
        connection,
        sourceType: "Sale_Return",
        sourceId: Number(Sale_Return_Id),
        partyName: Party_Name,
        txnDate: Return_Date,
        splits: validSplits,
      });
    }

    // =========================================================
    // 9. PARTY LEDGER — unchanged
    // =========================================================

    await recordPartyLedger({
      connection,
      partyId: party.Party_Id,
      txnType: "Sale_Return",
      referenceId: Number(Sale_Return_Id),
      amount: totalAmount,
      txnDate: Return_Date,
      docNumber: Return_Number,
      balanceDue,
    });

    // =========================================================
    // 10. OLD ITEMS — unchanged
    // =========================================================

    const [oldItems] = await connection.query(
      `SELECT * FROM sale_return_items WHERE Sale_Return_Id = ?`,
      [Sale_Return_Id]
    );

    // =========================================================
    // 11. RESOLVE NEW LINES — unit architecture ported from editPurchaseReturn
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
        Sale_Price,
        Discount_On_Sale_Price,
        Discount_Type_On_Sale_Price,
        Tax_Type,
        Tax_Amount,
        Amount,
      } = item;

      const Selected_Unit = Item_Unit || null;

      let Item_Id = item.Item_Id || null;
      let dbItemRow = null;

      // =======================================================
      // 12. FIND ITEM
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
      // 13. CREATE ITEM IF NOT FOUND
      // =======================================================

      if (!dbItemRow) {
        const [maxRow] = await connection.query(
          `SELECT MAX(CAST(SUBSTRING(Item_Id, 4) AS UNSIGNED)) AS maxId
           FROM add_item WHERE Item_Id LIKE 'ITM%'`
        );
        const autoId = (maxRow[0]?.maxId || 0) + 1;
        Item_Id = "ITM" + autoId.toString().padStart(3, "0");

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
            Selected_Unit || "",   // legacy
            Selected_Unit || null, // Primary_Unit = selected unit
          ]
        );

        dbItemRow = {
          Item_Id,
          Item_HSN: Item_HSN || null,
          Item_Category: Item_Category || "",
          Item_Unit: Selected_Unit || "",
          Primary_Unit: Selected_Unit || null,
          Secondary_Unit: null,
          Conversion_Rate: null,
        };

      } else {

        // =======================================================
        // 14. UPDATE ALLOWED MASTER FIELDS
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

        // 🔹 assign Primary_Unit if master has none yet
        if (!dbItemRow.Primary_Unit && Selected_Unit) {
          updates.push("Primary_Unit = ?");
          updates.push("Secondary_Unit = NULL");
          updates.push("Conversion_Rate = NULL");
          updates.push("Item_Unit = ''");
          params.push(Selected_Unit);

          dbItemRow = {
            ...dbItemRow,
            Primary_Unit: Selected_Unit,
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
      // 15. UNIT RESOLUTION
      // =======================================================

      // const {
      //   stockDelta,
      //   snapshot,
      //   resolvedSelectedUnit,
      // } = resolveUnitAndStockDelta({
      //   dbItemRow,
      //   selectedUnit: Selected_Unit,
      //   quantity: Number(Quantity) || 0,
      // });
      const {
        stockDelta,
        snapshot,
        resolvedSelectedUnit,
      } = resolveUnitAndStockDelta({
        dbItemRow,
        Selected_Unit: Selected_Unit,
        Quantity: Number(Quantity) || 0,
      });

      // =======================================================
      // 16. KEEP RESOLVED LINE
      // =======================================================

      resolvedLines.push({
        ...item,
        Item_Id,
        dbItemRow,

        Primary_Unit_Snapshot: snapshot.Primary_Unit_Snapshot,
        Secondary_Unit_Snapshot: snapshot.Secondary_Unit_Snapshot,
        Selected_Unit: resolvedSelectedUnit,

        stockDelta,
        Quantity: Number(Quantity) || 0,
        Sale_Price: Number(Sale_Price) || 0,
        Discount_On_Sale_Price: Number(Discount_On_Sale_Price) || 0,
        Discount_Type_On_Sale_Price: Discount_Type_On_Sale_Price || "Percentage",
        Tax_Type: Tax_Type || null,
        Tax_Amount: Number(Tax_Amount) || 0,
        Amount: Number(Amount) || 0,
      });
    }

    // =========================================================
    // 17. NEW QUANTITY PER ITEM — unchanged
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

    // =========================================================
    // 18. OLD QUANTITY PER ITEM — unchanged
    // =========================================================

    const oldQtyByItem = new Map();

    for (const old of oldItems) {

      const [[ledgerRow]] = await connection.query(
        `
    SELECT Base_Qty
    FROM item_ledger
    WHERE Item_Id = ?
      AND Txn_Type = 'Sale_Return'
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
    // 19. STOCK DIFFERENCE — Sale Return ADDS stock
    //     Now applied using stockDelta instead of raw Quantity
    // =========================================================

    const allItemIds = new Set([
      ...newQtyByItem.keys(),
      ...oldQtyByItem.keys(),
    ]);

    // build stockDelta-based new/old maps in parallel to qty maps
    //const newStockDeltaByItem = new Map();
    // for (const line of resolvedLines) {
    //   newStockDeltaByItem.set(
    //     line.Item_Id,
    //     (newStockDeltaByItem.get(line.Item_Id) || 0) + line.stockDelta
    //   );
    // }
    // // old items have no stored stockDelta (pre-unit-architecture rows may not),
    // // fall back to their raw Quantity as their historical stock contribution
    // const oldStockDeltaByItem = new Map();
    // for (const old of oldItems) {
    //   oldStockDeltaByItem.set(
    //     old.Item_Id,
    //     (oldStockDeltaByItem.get(old.Item_Id) || 0) + (Number(old.Quantity) || 0)
    //   );
    // }
    for (const itemId of allItemIds) {

  const newBaseQty =
    newQtyByItem.get(itemId) || 0;

  const oldBaseQty =
    oldQtyByItem.get(itemId) || 0;

  const diff =
    newBaseQty - oldBaseQty;

  if (diff !== 0) {

    await connection.query(
      `
      UPDATE add_item
      SET
        Stock_Quantity = Stock_Quantity + ?,
        updated_at = NOW()
      WHERE Item_Id = ?
      `,
      [diff, itemId]
    );
  }
}

    // for (const itemId of allItemIds) {
    //   const newDelta = newStockDeltaByItem.get(itemId) || 0;
    //   const oldDelta = oldStockDeltaByItem.get(itemId) || 0;
    //   const diff = newDelta - oldDelta;

    //   if (diff !== 0) {
    //     await connection.query(
    //       `UPDATE add_item
    //        SET Stock_Quantity = Stock_Quantity + ?,
    //            updated_at = NOW()
    //        WHERE Item_Id = ?`,
    //       [diff, itemId]
    //     );
    //   }
    // }

    // =========================================================
    // 20. REVERSE OLD ITEM LEDGER ENTRIES — unchanged
    // =========================================================

    for (const old of oldItems) {
      await reverseItemLedger({
        connection,
        itemId: old.Item_Id,
        txnType: "Sale_Return",
        referenceId: old.id,
      });
    }

    // =========================================================
    // 21. DELETE OLD RETURN ITEMS — unchanged
    // =========================================================

    await connection.query(
      `DELETE FROM sale_return_items WHERE Sale_Return_Id = ?`,
      [Sale_Return_Id]
    );

    // =========================================================
    // 22. REINSERT + SNAPSHOTS + ITEM LEDGER
    // =========================================================

    for (const line of resolvedLines) {

      const [srItemResult] = await connection.query(
        `INSERT INTO sale_return_items
         (
           Sale_Return_Id,
           Item_Id,
           Quantity,
           Sale_Price,
           Discount_On_Sale_Price,
           Discount_Type_On_Sale_Price,
           Tax_Type,
           Tax_Amount,
           Amount,
           Primary_Unit_Snapshot,
           Secondary_Unit_Snapshot,
           Selected_Unit
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          Sale_Return_Id,
          line.Item_Id,
          line.Quantity,
          line.Sale_Price,
          line.Discount_On_Sale_Price,
          line.Discount_Type_On_Sale_Price,
          line.Tax_Type,
          line.Tax_Amount,
          line.Amount,
          line.Primary_Unit_Snapshot,
          line.Secondary_Unit_Snapshot,
          line.Selected_Unit,
        ]
      );

      const saleReturnItemId = srItemResult.insertId;

      // 🔹 Item Ledger — unchanged, still uses line.Quantity, NOT stockDelta
      // await recordItemLedger({
      //   connection,

      //   itemId: line.Item_Id,
      //   txnType: "Sale_Return",

      //   referenceId: saleReturnItemId,

      //   billId: Number(Sale_Return_Id),
      //   billNumber: Return_Number || null,

      //   partyName: Party_Name,

      //   quantity: line.Quantity,
      //   rate: line.Sale_Price ?? null,

      //   txnDate: Return_Date,
      // });
      await recordItemLedger({
        connection,

        itemId: line.Item_Id,

        txnType: "Sale_Return",

        referenceId: saleReturnItemId,

        billId: existing.id,                     // sale_return.id
        billNumber: Return_Number || null,

        partyName: Party_Name,

        // User-entered quantity
        quantity: normalizeNumber(line.Quantity) ?? 0,

        // Unit used in this transaction
        selectedUnit: line.Selected_Unit,

        // Normalized quantity in primary unit
        baseQty: normalizeNumber(line.stockDelta) ?? 0,

        rate: normalizeNumber(line.Sale_Price),

        txnDate: Return_Date,
      });
    }

    // =========================================================
    // 23. COMMIT
    // =========================================================

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Sale Return updated successfully",
      Sale_Return_Id,
      totalAmount,
      totalPaid,
      balanceDue,
    });

  } catch (err) {
    if (connection) {
      await connection.rollback();
    }

    console.error("editSaleReturn:", err);

    next(err);

  } finally {
    if (connection) {
      connection.release();
    }
  }
};
 const deleteSaleReturn = async (req, res, next) => {
  let connection;

  try {
    const { Sale_Return_Id } = req.params;

    if (!Sale_Return_Id) {
      return res.status(400).json({
        success: false,
        message: "Sale Return ID is required.",
      });
    }

    connection = await db.getConnection();

    await connection.beginTransaction();

    // =========================================================
    // 1. GET SALE RETURN HEADER
    // =========================================================

    const [[saleReturn]] = await connection.query(
      `
      SELECT
        id,
        Sale_Id,
        Party_Id,
        Return_Number,
        Return_Date
      FROM sale_return
      WHERE id = ?
      LIMIT 1
      `,
      [Sale_Return_Id]
    );

    if (!saleReturn) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Sale Return not found.",
      });
    }

    const saleReturnDbId = saleReturn.id;

    // =========================================================
    // 2. GET ALL SALE RETURN ITEMS
    //
    // sale_return_items.id
    //        ↓
    // item_ledger.Source_Id
    // =========================================================

    const [returnItems] = await connection.query(
      `
      SELECT
        id,
        Item_Id
      FROM sale_return_items
      WHERE Sale_Return_Id = ?
      `,
      [Sale_Return_Id]
    );

    // =========================================================
    // 3. REVERSE STOCK + ITEM LEDGER
    //
    // Sale Return = IN
    //
    // Sale Return originally:
    //
    //     Stock + Base_Qty
    //
    // Deleting Sale Return:
    //
    //     Stock - Base_Qty
    //
    // Use Base_Qty from item_ledger.
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
          AND Txn_Type = 'Sale_Return'
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
      // Sale Return was IN.
      //
      // Delete Sale Return => remove that stock.
      // -------------------------------------------------------

      if (
        ledgerRow.Direction === "In" &&
        baseQty !== 0
      ) {
        await connection.query(
          `
          UPDATE add_item
          SET
            Stock_Quantity = Stock_Quantity - ?,
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
        txnType: "Sale_Return",
        referenceId: returnItem.id,
      });
    }

    // =========================================================
    // 4. DELETE PAYMENT SPLITS
    //
    // payment_splits.Source_Id = sale_return.id
    // =========================================================

    await deletePaymentSplits({
      connection,
      sourceType: "Sale_Return",
      sourceId: saleReturnDbId,
    });

    // =========================================================
    // 5. REVERSE PARTY LEDGER
    //
    // party_ledger.Source_Id = sale_return.id
    //
    // Opening Balance is NOT touched.
    // =========================================================

    await reversePartyLedger({
      connection,
      partyId: saleReturn.Party_Id,
      txnType: "Sale_Return",
      referenceId: saleReturnDbId,
    });

    // =========================================================
    // 6. DELETE SALE RETURN ITEMS
    // =========================================================

    await connection.query(
      `
      DELETE FROM sale_return_items
      WHERE Sale_Return_Id = ?
      `,
      [Sale_Return_Id]
    );

    // =========================================================
    // 7. DELETE SALE RETURN HEADER
    // =========================================================

    await connection.query(
      `
      DELETE FROM sale_return
      WHERE id = ?
      `,
      [Sale_Return_Id]
    );

    // =========================================================
    // 8. COMMIT
    // =========================================================

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Sale Return deleted successfully.",
      Sale_Return_Id,
    });

  } catch (err) {

    if (connection) {
      await connection.rollback();
    }

    console.error(
      "❌ Error deleting sale return:",
      err
    );

    next(err);

  } finally {

    if (connection) {
      connection.release();
    }
  }
};
export {
  getAllSaleReturns,
  getSaleReturnById,
  createSaleReturn,
  editSaleReturn,
  deleteSaleReturn,
};