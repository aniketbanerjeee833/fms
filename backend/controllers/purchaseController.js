import db from "../config/db.js"; // mysql2/promise connection
import purchaseSchema from "../validators/purchaseSchema.js";
import { sanitizeObject } from "../utils/sanitizeInput.js";
import { compressAndSavePurchaseBill } from "../utils/purchaseBillUpload.js";
//  import { extractTextFromInvoice } from "../utils/invoiceOCR.js";
// import { parseInvoiceText } from "../utils/invoiceParser.js";
import { extractInvoiceWithAI } from "../utils/invoiceAIParser.js";
import ExcelJS from "exceljs";
import { recordBankTransaction } from "../utils/bankAccountHelper.js";
import { recordCashTransaction } from "../utils/cashTransactionHelper.js";
import { deletePaymentSplits, insertPaymentSplits, validateSplits } from "../utils/paymentSplitHelper.js";
import { recordPartyLedger } from "../utils/partyLedgerHelper.js";
import { resolveUnitAndStockDelta } from "../utils/resolveUnitAndStockDelta.js";
import { recordItemLedger, reverseItemLedger } from "../utils/itemLedgerHelper.js";




const cleanValue = (value) => {
  if (value === undefined || value === null || value === "" || value === " ") {
    return null; // store as NULL in DB
  }
  return value;  // ✅ returns the original value for valid data
};
const cleanDiscount = (value) => {
  if (value === undefined || value === null || value === "" || value === " ") {
    return 0.00; // store as 0.00 in DB
  }
  return Number(value);
}
// const normalizeNumber = (val) =>
//   val !== undefined && val !== null && String(val).trim() !== ""
//     ? Number(val)
//     : null;


const normalizeNumber = (val) => {
  if (
    val === undefined ||
    val === null ||
    String(val).trim() === ""
  ) {
    return null;
  }

  const num = Number(val);

  return Number.isFinite(num) ? num : null;
};




//only amount >0 needs to have an item name why please expalin ?

// Because Amount is the one field that represents actual money at stake//
// const addPurchase = async (req, res, next) => {
//   let connection;
//   try {
//     connection = await db.getConnection();
//     await connection.beginTransaction();

//     //console.log(req.body);

//     const cleanData = sanitizeObject(req.body);
//     const validation = purchaseSchema.safeParse(cleanData);
//     if (!validation.success) {
//       await connection.rollback();
//       return res.status(400).json({ errors: validation.error.errors });
//     }

//     const {
//       Party_Name,
//       GSTIN,
//       Bill_Number,
//       Bill_Date,
//       State_Of_Supply,
//       Total_Amount,
//       Total_Paid,
//       Balance_Due,
//       splits,   // 🔹 replaces single Payment_Type / Bank_Account_Id
//       items,
//       Terms_Conditions_Id,          // nullable int — null if user typed fresh or cleared
//       Terms_Conditions_Description,
//     } = validation.data;

//     // 🔻 REMOVED: manual !Party_Name / !Bill_Number / !Bill_Date / items.length===0 check
//     //    — Party_Name is enforced by the schema (min(1)); Bill_Number, Bill_Date presence-shape,
//     //      and items being an empty array are all now legitimately allowed by the schema itself,
//     //      so re-checking them here would just re-impose the old strict rules the schema
//     //      was changed to relax. safeParse() above is the single source of truth now.



//     let termsId = null;
//     let termsDescription = null;



//     if (
//       Terms_Conditions_Id &&
//       Terms_Conditions_Description?.trim()
//     ) {
//       // Template selected and untouched
//       termsId = Number(Terms_Conditions_Id);
//       termsDescription = Terms_Conditions_Description.trim();

//     } else if (Terms_Conditions_Description?.trim()) {
//       // Custom / edited description
//       // UI has already cleared the template ID/title
//       termsId = null;
//       termsDescription = Terms_Conditions_Description.trim();
//     }

//     // Otherwise:
//     // termsId = null
//     // termsDescription = null
//     if (termsId) {
//       const [[selectedTerm]] = await connection.query(
//         `SELECT id
//      FROM terms_conditions
//      WHERE id = ?
//        AND Purchase_Bill = 1
//      LIMIT 1`,
//         [termsId]
//       );

//       if (!selectedTerm) {
//         await connection.rollback();

//         return res.status(400).json({
//           success: false,
//           message: "Invalid Terms & Conditions for Purchase Bill.",
//         });
//       }
//     }
//     const normalizedSplits = (splits || []).map((s) => ({ ...s, Amount: Number(s.Amount) || 0 }));

//     const firstValidIndex = normalizedSplits.findIndex((s) => {
//       if (!s.Payment_Type) return false;
//       if (s.Payment_Type === "Bank" && !s.Bank_Account_Id) return false;
//       return true;
//     });

//     const validSplits = normalizedSplits.reduce((acc, s, index) => {
//       if (!s.Payment_Type) return acc;
//       if (s.Payment_Type === "Bank" && !s.Bank_Account_Id) return acc;
//       if (s.Amount > 0) { acc.push(s); return acc; }
//       if (index === firstValidIndex) acc.push({ ...s, Amount: 0 });
//       return acc;
//     }, []);

//     const totalAmount = Number(Total_Amount) || 0;
//     const totalPaid = validSplits.reduce((sum, s) => sum + (Number(s.Amount) || 0), 0);
//     const balanceDue = totalAmount - totalPaid;

//     // 🔹 total paid cannot exceed total amount
//     if (totalPaid > totalAmount) {
//       await connection.rollback();
//       return res.status(400).json({
//         success: false,
//         message: "Received amount should be less than or equal to Total Amount",
//       });
//     }
//     if (totalPaid > 0) {
//       try {
//         validateSplits(validSplits, totalPaid);
//       } catch (validationErr) {
//         await connection.rollback();
//         return res.status(400).json({ success: false, message: validationErr.message });
//       }
//     }



//     // 🔻 REMOVED: per-item "Item name missing" loop check
//     //    — Item_Name is now optional().default("") in the schema (blank rows are legitimately
//     //      allowed to be submitted/skipped), so this loop was re-imposing a requirement the
//     //      schema intentionally dropped. If you need to *skip* blank rows during insert rather
//     //      than accept them, filter items below instead of validating/rejecting here:
//     //      const itemsToInsert = items.filter((item) => item.Item_Name?.trim());

//     // const [partyRows] = await connection.execute(
//     //   "SELECT Party_Id, GSTIN FROM add_party WHERE Party_Name = ? LIMIT 1",
//     //   [Party_Name]
//     // );
//     // if (partyRows.length === 0) {
//     //   await connection.rollback();
//     //   return res.status(404).json({ message: "Party not found." });
//     // }
//     // const Party_Id = partyRows[0].Party_Id;
//     // =========================================================
//     // 7. FIND PARTY / AUTO-CREATE NEW PARTY
//     // =========================================================

//     const [partyRows] = await connection.execute(
//       `SELECT *
//    FROM add_party
//    WHERE TRIM(Party_Name) = TRIM(?)
//    LIMIT 1`,
//       [Party_Name]
//     );

//     let Party_Id;

//     if (partyRows.length === 0) {
//       // =======================================================
//       // A. CREATE PARTY MASTER
//       // =======================================================

//       const [partyResult] = await connection.execute(
//         `INSERT INTO add_party
//      (
//        Party_Name,


//        created_at,
//        updated_at
//      )
//      VALUES (?, NOW(), NOW())`,
//         [
//           Party_Name.trim(),


//         ]
//       );

//       const partyIdNumber = partyResult.insertId;

//       Party_Id =
//         "PTY" +
//         partyIdNumber
//           .toString()
//           .padStart(3, "0");

//       await connection.execute(
//         `UPDATE add_party
//      SET Party_Id = ?
//      WHERE id = ?`,
//         [Party_Id, partyIdNumber]
//       );

//       // =======================================================
//       // B. CREATE DEFAULT BILLING ADDRESS
//       // =======================================================

//       // Only create address row if user actually entered address
//       // if (Billing_Address?.trim()) {
//       //   await connection.execute(
//       //     `INSERT INTO add_party_address
//       //      (
//       //        Party_Id,
//       //        Billing_Address,
//       //        Is_Default,
//       //        created_at,
//       //        updated_at
//       //      )
//       //      VALUES (?, ?, 1, NOW(), NOW())`,
//       //     [
//       //       Party_Id,
//       //       Billing_Address.trim(),
//       //     ]
//       //   );
//       // }
//     }

//     // =========================================================
//     // EXISTING PARTY
//     // =========================================================
//     else {
//       Party_Id = partyRows[0].Party_Id;

//       // IMPORTANT:
//       // Don't update party phone here.
//       // Don't update default billing address here.
//       //
//       // Phone_Number and Billing_Address entered in this sale
//       // belong to this invoice only.
//     }

//     const [fy] = await connection.query(
//       `SELECT Financial_Year FROM financial_year WHERE Current_Financial_Year = 1 LIMIT 1`
//     );
//     if (fy.length === 0) {
//       await connection.rollback();
//       return res.status(400).json({ message: "No active financial year found. Please set one in settings." });
//     }
//     const activeFY = fy[0].Financial_Year;

//     const [purchaseResult] = await connection.execute(
//       `INSERT INTO add_purchase
//    (
//      Party_Id,
//      Bill_Number,
//      Bill_Date,
//      financial_year,
//      State_Of_Supply,
//      Total_Amount,
//      Total_Paid,
//      Balance_Due,
//      Terms_Conditions_Id,
//      Terms_Conditions_Description,
//      created_at,
//      updated_at
//    )
//    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
//       [
//         Party_Id,
//         Bill_Number,
//         Bill_Date,
//         activeFY,
//         cleanValue(State_Of_Supply),

//         totalAmount,
//         totalPaid,
//         balanceDue,

//         // Terms
//         termsId,
//         termsDescription,
//       ]
//     );

//     const purchaseIdNumber = purchaseResult.insertId;
//     const newPurchaseId = "PUR" + purchaseIdNumber.toString().padStart(3, "0");

//     await connection.execute(
//       `UPDATE add_purchase SET Purchase_Id = ? WHERE id = ?`,
//       [newPurchaseId, purchaseIdNumber]
//     );
//     if (validSplits.length > 0) {
//       await insertPaymentSplits({
//         connection,
//         sourceType: "Purchase",
//         sourceId: purchaseIdNumber,
//         partyName: Party_Name,
//         txnDate: Bill_Date,
//         splits: validSplits,
//       });
//     }
//     // 🔹 insert splits + fan out to bank/cash ledgers
//     //     if (totalPaid > 0 && validSplits.length > 0) {
//     //   await insertPaymentSplits({
//     //     connection,
//     //     sourceType: "Purchase",
//     //     sourceId: purchaseIdNumber,
//     //     partyName: Party_Name,
//     //     txnDate: Bill_Date,
//     //     splits: validSplits,   // 🔹 use the filtered array here
//     //   });
//     // }
   

//     await recordPartyLedger({
//       connection,
//       partyId: Party_Id,
//       txnType: "Purchase",
//       referenceId: purchaseIdNumber,
//       amount: totalAmount,
//       txnDate: Bill_Date,
//       docNumber: Bill_Number,
//       balanceDue: balanceDue,
//     });

//     // items loop — unchanged, now naturally handles an empty items array (no-op loop)
//     for (const item of items) {
//       if (!item.Item_Name?.trim()) {
//         if ((normalizeNumber(item.Amount) ?? 0) > 0) {
//           await connection.rollback();
//           return res.status(400).json({ success: false, message: "Please enter an item name for the row." });
//         }
//         continue;
//       }

//       const {
//         Item_Category,
//         Item_Name,
//         Item_HSN,
//         Quantity,
//         Item_Unit,
//         Purchase_Price,
//         Discount_On_Purchase_Price,
//         Discount_Type_On_Purchase_Price,
//         Tax_Type,
//         Tax_Amount,
//         Amount,
//         Item_Image,
//       } = item;

//       const [itemRows] = await connection.execute(
//         "SELECT * FROM add_item WHERE TRIM(Item_Name) = TRIM(?) LIMIT 1",
//         [Item_Name]
//       );

//       let Item_Id;

//       if (itemRows.length === 0) {
//         const [itemResult] = await connection.execute(
//           `INSERT INTO add_item
//            (Item_Name, Item_HSN, Item_Unit, Item_Category, Stock_Quantity, created_at, updated_at)
//            VALUES (?, ?, ?, ?, ?,  NOW(), NOW())`,
//           [
//             Item_Name,
//             cleanValue(Item_HSN),
//             Item_Unit || "",

//             Item_Category || "",
//             normalizeNumber(Quantity),
//           ]
//         );
//         const itemIdNum = itemResult.insertId;
//         Item_Id = "ITM" + itemIdNum.toString().padStart(3, "0");
//         await connection.execute(
//           `UPDATE add_item SET Item_Id = ? WHERE id = ?`,
//           [Item_Id, itemIdNum]
//         );
//       } else {
//         Item_Id = itemRows[0].Item_Id;
//         await connection.execute(
//           `UPDATE add_item
//            SET Stock_Quantity = Stock_Quantity + ?,
//                Item_HSN = ?,
//                Item_Category = ?,
//                updated_at = NOW()
//            WHERE Item_Id = ?`,
//           [normalizeNumber(Quantity), cleanValue(Item_HSN) || itemRows[0].Item_HSN, Item_Category || "", Item_Id]
//         );
//       }

//       const [pitResult] = await connection.execute(
//         `INSERT INTO add_purchase_items
//          (Purchase_Id, Item_Id, Quantity, Purchase_Price,
//           Discount_On_Purchase_Price, Discount_Type_On_Purchase_Price,
//           Tax_Type, Tax_Amount, Amount, created_at, updated_at)
//          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
//         [
//           newPurchaseId,
//           Item_Id,
//           normalizeNumber(Quantity) ?? 0,
//           normalizeNumber(Purchase_Price) ?? 0,
//           cleanDiscount(Discount_On_Purchase_Price),
//           cleanValue(Discount_Type_On_Purchase_Price),
//           cleanValue(Tax_Type),
//           normalizeNumber(Tax_Amount) ?? 0,
//           normalizeNumber(Amount) ?? 0,
//         ]
//       );
//       const pitId = pitResult.insertId;
//       const newPurchaseItemId = "PIT" + pitId.toString().padStart(3, "0");
//       await connection.execute(
//         `UPDATE add_purchase_items SET Purchase_items_Id = ? WHERE id = ?`,
//         [newPurchaseItemId, pitId]
//       );
//       await recordItemLedger({
//         connection,
//         itemId: Item_Id,
//         txnType: "Purchase",
//         referenceId: pitResult.insertId,   // purchase_item row's numeric id
//         //formattedId: newPurchaseId,
//          billId:      newPurchaseId,
//           billNumber: Bill_Number,   // AEPL-22
//         partyName: Party_Name,
//         quantity: normalizeNumber(Quantity) ?? 0,
//         rate: normalizeNumber(Purchase_Price) ?? null,
//         txnDate: Bill_Date,

//       });
//     }

//     await connection.commit();

//     return res.status(201).json({
//       success: true,
//       message: "Purchase and items added successfully",
//       purchaseId: newPurchaseId,
//     });
//   } catch (err) {
//     if (connection) await connection.rollback();
//     console.error("❌ Error adding purchase:", err);
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };


//NEW
const addPurchase = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const cleanData = sanitizeObject(req.body);
    const validation = purchaseSchema.safeParse(cleanData);
    if (!validation.success) {
      await connection.rollback();
      return res.status(400).json({ errors: validation.error.errors });
    }

    const {
      Party_Name,
      GSTIN,
      Bill_Number,
      Bill_Date,
      State_Of_Supply,
      Total_Amount,
      Total_Paid,
      Balance_Due,
      splits,
      items,
      Terms_Conditions_Id,
      Terms_Conditions_Description,
    } = validation.data;

    // ── TERMS & CONDITIONS — unchanged ──
    let termsId = null;
    let termsDescription = null;

    if (Terms_Conditions_Id && Terms_Conditions_Description?.trim()) {
      termsId = Number(Terms_Conditions_Id);
      termsDescription = Terms_Conditions_Description.trim();
    } else if (Terms_Conditions_Description?.trim()) {
      termsId = null;
      termsDescription = Terms_Conditions_Description.trim();
    }

    if (termsId) {
      const [[selectedTerm]] = await connection.query(
        `SELECT id FROM terms_conditions WHERE id = ? AND Purchase_Bill = 1 LIMIT 1`,
        [termsId]
      );
      if (!selectedTerm) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: "Invalid Terms & Conditions for Purchase Bill.",
        });
      }
    }

    // ── SPLITS — unchanged ──
    const normalizedSplits = (splits || []).map((s) => ({ ...s, Amount: Number(s.Amount) || 0 }));

    const firstValidIndex = normalizedSplits.findIndex((s) => {
      if (!s.Payment_Type) return false;
      if (s.Payment_Type === "Bank" && !s.Bank_Account_Id) return false;
      return true;
    });

    const validSplits = normalizedSplits.reduce((acc, s, index) => {
      if (!s.Payment_Type) return acc;
      if (s.Payment_Type === "Bank" && !s.Bank_Account_Id) return acc;
      if (s.Amount > 0) { acc.push(s); return acc; }
      if (index === firstValidIndex) acc.push({ ...s, Amount: 0 });
      return acc;
    }, []);

    const totalAmount = Number(Total_Amount) || 0;
    const totalPaid = validSplits.reduce((sum, s) => sum + (Number(s.Amount) || 0), 0);
    const balanceDue = totalAmount - totalPaid;

    if (totalPaid > totalAmount) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Received amount should be less than or equal to Total Amount",
      });
    }
    if (totalPaid > 0) {
      try {
        validateSplits(validSplits, totalPaid);
      } catch (validationErr) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: validationErr.message });
      }
    }

    // ── PARTY RESOLUTION — unchanged ──
    const [partyRows] = await connection.execute(
      `SELECT * FROM add_party WHERE TRIM(Party_Name) = TRIM(?) LIMIT 1`,
      [Party_Name]
    );

    let Party_Id;

    if (partyRows.length === 0) {
      const [partyResult] = await connection.execute(
        `INSERT INTO add_party (Party_Name, created_at, updated_at) VALUES (?, NOW(), NOW())`,
        [Party_Name.trim()]
      );
      const partyIdNumber = partyResult.insertId;
      Party_Id = "PTY" + partyIdNumber.toString().padStart(3, "0");
      await connection.execute(`UPDATE add_party SET Party_Id = ? WHERE id = ?`, [Party_Id, partyIdNumber]);
    } else {
      Party_Id = partyRows[0].Party_Id;
    }

    // ── FINANCIAL YEAR — unchanged ──
    const [fy] = await connection.query(
      `SELECT Financial_Year FROM financial_year WHERE Current_Financial_Year = 1 LIMIT 1`
    );
    if (fy.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: "No active financial year found. Please set one in settings." });
    }
    const activeFY = fy[0].Financial_Year;

    // ── PURCHASE HEADER — unchanged ──
    const [purchaseResult] = await connection.execute(
      `INSERT INTO add_purchase
       (Party_Id, Bill_Number, Bill_Date, financial_year, State_Of_Supply,
        Total_Amount, Total_Paid, Balance_Due, Terms_Conditions_Id, Terms_Conditions_Description,
        created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        Party_Id, Bill_Number, Bill_Date, activeFY, cleanValue(State_Of_Supply),
        totalAmount, totalPaid, balanceDue, termsId, termsDescription,
      ]
    );

    const purchaseIdNumber = purchaseResult.insertId;
    const newPurchaseId = "PUR" + purchaseIdNumber.toString().padStart(3, "0");

    await connection.execute(`UPDATE add_purchase SET Purchase_Id = ? WHERE id = ?`, [newPurchaseId, purchaseIdNumber]);

    if (validSplits.length > 0) {
      await insertPaymentSplits({
        connection,
        sourceType: "Purchase",
        sourceId: purchaseIdNumber,
        partyName: Party_Name,
        txnDate: Bill_Date,
        splits: validSplits,
      });
    }

    await recordPartyLedger({
      connection,
      partyId: Party_Id,
      txnType: "Purchase",
      referenceId: purchaseIdNumber,
      amount: totalAmount,
      txnDate: Bill_Date,
      docNumber: Bill_Number,
      balanceDue: balanceDue,
    });

    // ═══════════════════════════════════════════════════════
    // ITEMS LOOP — unit resolution + snapshot logic
    // ═══════════════════════════════════════════════════════
    for (const item of items) {
      if (!item.Item_Name?.trim()) {
        if ((normalizeNumber(item.Amount) ?? 0) > 0) {
          await connection.rollback();
          return res.status(400).json({ success: false, message: "Please enter an item name for the row." });
        }
        continue;
      }

      // const {
      //   Item_Category,
      //   Item_Name,
      //   Item_HSN,
      //   Quantity,
      //   Item_Unit,
      //   Selected_Unit,      // 🔹 which unit (Primary or Secondary) this row is in
      //   Purchase_Price,
      //   Discount_On_Purchase_Price,
      //   Discount_Type_On_Purchase_Price,
      //   Tax_Type,
      //   Tax_Amount,
      //   Amount,
      //   Item_Image,
      // } = item;
      const {
        Item_Category,
        Item_Name,
        Item_HSN,
        Quantity,
        Item_Unit,

        Purchase_Price,
        Discount_On_Purchase_Price,
        Discount_Type_On_Purchase_Price,
        Tax_Type,
        Tax_Amount,
        Amount,
        Item_Image,
      } = item;

      // UI currently calls the selected billing unit "Item_Unit".
      // Backend internally calls it Selected_Unit.
      const Selected_Unit = Item_Unit || null;

      const [itemRows] = await connection.execute(
        "SELECT * FROM add_item WHERE TRIM(Item_Name) = TRIM(?) LIMIT 1",
        [Item_Name]
      );

      let Item_Id;
      let stockDelta;
      let snapshot = { Primary_Unit_Snapshot: null, Secondary_Unit_Snapshot: null };
      let resolvedSelectedUnit = null;

      // if (itemRows.length === 0) {
      //   // ── NEW ITEM — legacy/no-unit, never invent a primary/secondary here ──
      //   const [itemResult] = await connection.execute(
      //     `INSERT INTO add_item
      //      (Item_Name, Item_HSN, Item_Unit, Item_Category, Stock_Quantity, created_at, updated_at)
      //      VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      //     [
      //       Item_Name,
      //       cleanValue(Item_HSN),
      //       Item_Unit || "",
      //       Item_Category || "",
      //       normalizeNumber(Quantity) ?? 0,
      //     ]
      //   );
      //   const itemIdNum = itemResult.insertId;
      //   Item_Id = "ITM" + itemIdNum.toString().padStart(3, "0");
      //   await connection.execute(`UPDATE add_item SET Item_Id = ? WHERE id = ?`, [Item_Id, itemIdNum]);

      //   stockDelta = normalizeNumber(Quantity) ?? 0;
      //   // snapshot stays null — legacy item, no unit config
      // } else {
      //   // ── EXISTING ITEM — resolve unit + stock delta ──
      //   Item_Id = itemRows[0].Item_Id;
      //   const dbItemRow = itemRows[0];

      //   try {
      //     const result = resolveUnitAndStockDelta({ dbItemRow, Selected_Unit, Quantity });
      //     stockDelta = result.stockDelta;
      //     snapshot = result.snapshot;
      //     resolvedSelectedUnit = result.resolvedSelectedUnit;
      //   } catch (unitErr) {
      //     await connection.rollback();
      //     return res.status(400).json({ success: false, message: unitErr.message });
      //   }

      //   await connection.execute(
      //     `UPDATE add_item
      //      SET Stock_Quantity = Stock_Quantity + ?,
      //          Item_HSN = ?,
      //          Item_Category = ?,
      //          updated_at = NOW()
      //      WHERE Item_Id = ?`,
      //     [stockDelta, cleanValue(Item_HSN) || dbItemRow.Item_HSN, Item_Category || "", Item_Id]
      //   );
      // }
      if (itemRows.length === 0) {
        // =========================================================
        // NEW ITEM CREATED DIRECTLY FROM PURCHASE
        // =========================================================
        //
        // Frontend Item_Unit = unit selected by user.
        //
        // Example:
        // Item_Unit = "Kg"
        //
        // New item becomes:
        // Primary_Unit    = Kg
        // Secondary_Unit  = NULL
        // Conversion_Rate = NULL
        //
        // Purchase snapshot:
        // Primary = Kg
        // Secondary = NULL
        // Selected = Kg
        //
        // If Item_Unit = "" (NONE):
        // everything remains NULL.
        // =========================================================

        const selectedUnit = Item_Unit || null;

        const primaryUnit = selectedUnit;

        const [itemResult] = await connection.execute(
          `
    INSERT INTO add_item
    (
      Item_Name,
      Item_HSN,
      Item_Unit,
      Item_Category,

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
      ?, ?, ?,
      ?,
      NOW(), NOW()
    )
    `,
          [
            Item_Name,
            cleanValue(Item_HSN),

            // Legacy field
            Item_Unit || "",

            Item_Category || "",

            // New unit system
            primaryUnit,
            null,
            null,

            // Initial live stock
            normalizeNumber(Quantity) ?? 0,
          ]
        );

        const itemIdNum = itemResult.insertId;

        Item_Id = "ITM" + itemIdNum.toString().padStart(3, "0");

        await connection.execute(
          `
    UPDATE add_item
    SET Item_Id = ?
    WHERE id = ?
    `,
          [Item_Id, itemIdNum]
        );

        // Stock was already inserted above.
        // This variable is needed for consistency,
        // but DON'T add it to stock again here.
        stockDelta =normalizeNumber(Quantity) ?? 0;

        // Bill snapshot
        snapshot = {
          Primary_Unit_Snapshot: primaryUnit,
          Secondary_Unit_Snapshot: null,
        };

        // The actual unit selected in this purchase row
        resolvedSelectedUnit = selectedUnit;

      } else {

        // =========================================================
        // EXISTING ITEM
        // =========================================================

        Item_Id = itemRows[0].Item_Id;

        const dbItemRow = itemRows[0];

        try {
          const result = resolveUnitAndStockDelta({
            dbItemRow,
            Selected_Unit,
            Quantity,
          });

          stockDelta = result.stockDelta;

          snapshot = result.snapshot;

          resolvedSelectedUnit = result.resolvedSelectedUnit;

        } catch (unitErr) {

          await connection.rollback();

          return res.status(400).json({
            success: false,
            message: unitErr.message,
          });
        }

        // Existing item → increase existing stock
        await connection.execute(
          `
    UPDATE add_item
    SET
      Stock_Quantity = Stock_Quantity + ?,
      Item_HSN = ?,
      Item_Category = ?,
      updated_at = NOW()
    WHERE Item_Id = ?
    `,
          [
            stockDelta,

            cleanValue(Item_HSN) || dbItemRow.Item_HSN,

            Item_Category || "",

            Item_Id,
          ]
        );
      }

      const [pitResult] = await connection.execute(
        `INSERT INTO add_purchase_items
         (Purchase_Id, Item_Id, Quantity, Purchase_Price,
          Discount_On_Purchase_Price, Discount_Type_On_Purchase_Price,
          Tax_Type, Tax_Amount, Amount,
          Primary_Unit_Snapshot, Secondary_Unit_Snapshot, Selected_Unit,
          created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          newPurchaseId,
          Item_Id,
          normalizeNumber(Quantity) ?? 0,
          normalizeNumber(Purchase_Price) ?? 0,
          cleanDiscount(Discount_On_Purchase_Price),
          cleanValue(Discount_Type_On_Purchase_Price),
          cleanValue(Tax_Type),
          normalizeNumber(Tax_Amount) ?? 0,
          normalizeNumber(Amount) ?? 0,
          snapshot.Primary_Unit_Snapshot,
          snapshot.Secondary_Unit_Snapshot,
          resolvedSelectedUnit,
        ]
      );
      const pitId = pitResult.insertId;
      const newPurchaseItemId = "PIT" + pitId.toString().padStart(3, "0");
      await connection.execute(
        `UPDATE add_purchase_items SET Purchase_items_Id = ? WHERE id = ?`,
        [newPurchaseItemId, pitId]
      );
         await recordItemLedger({
        connection,
        itemId: Item_Id,
        txnType: "Purchase",
        referenceId: pitResult.insertId,   // purchase_item row's numeric id
        //formattedId: newPurchaseId,
         billId:      newPurchaseId,
          billNumber: Bill_Number,   // AEPL-22
        partyName: Party_Name,
        quantity: normalizeNumber(Quantity) ?? 0,
        rate: normalizeNumber(Purchase_Price) ?? null,
        txnDate: Bill_Date,

      });
    }

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Purchase and items added successfully",
      purchaseId: newPurchaseId,
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("❌ Error adding purchase:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};
const exportAllPurchasesReportToExcel = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();

    const search = req.query.search ? req.query.search.trim().toLowerCase() : "";
    const fromDate = req.query.fromDate || null;
    const toDate = req.query.toDate || null;

    /* ── same WHERE logic as getAllPurchases ── */
    const whereClauses = [];
    const params = [];

    if (search) {
      whereClauses.push(`
        (
          LOWER(a.Party_Name)    LIKE ? OR
          LOWER(p.Payment_Type)  LIKE ? OR
          CAST(p.Total_Amount   AS CHAR) LIKE ? OR
          CAST(p.Balance_Due    AS CHAR) LIKE ?
        )
      `);
      const like = `%${search}%`;
      params.push(like, like, like, like);
    }

    if (fromDate && toDate) {
      whereClauses.push(`DATE(p.Bill_Date) BETWEEN ? AND ?`);
      params.push(fromDate, toDate);
    } else if (fromDate) {
      whereClauses.push(`DATE(p.Bill_Date) >= ?`);
      params.push(fromDate);
    } else if (toDate) {
      whereClauses.push(`DATE(p.Bill_Date) <= ?`);
      params.push(toDate);
    }

    const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

    /* ── ALL rows, no pagination ── */
    const [rows] = await connection.query(
      `SELECT p.*, a.Party_Name, a.GSTIN
       FROM add_purchase p
       LEFT JOIN add_party a ON p.Party_Id = a.Party_Id
       ${whereSQL}
       ORDER BY p.Bill_Date DESC`,
      params
    );

    /* ── totals ── */
    const [[totals]] = await connection.query(
      `SELECT
         COALESCE(SUM(p.Total_Amount), 0) AS totalAmount,
         COALESCE(SUM(p.Balance_Due),  0) AS totalUnpaid,
         COALESCE(SUM(p.Total_Paid),   0) AS totalPaid
       FROM add_purchase p
       LEFT JOIN add_party a ON p.Party_Id = a.Party_Id
       ${whereSQL}`,
      params
    );

    /* ════════════════════════════════════════════════════════
       BUILD WORKBOOK  —  plain / no color, matches sale report
    ════════════════════════════════════════════════════════ */
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Purchase Report");
    const itemSheet = workbook.addWorksheet("Item Details");

    /* ── column widths (8 cols: A–H) ── */
    sheet.columns = [
      { key: "date", width: 14 },   // A  Bill Date
      { key: "bill_no", width: 18 },   // B  Bill No / Purchase Id
      { key: "party", width: 36 },   // C  Party Name
      { key: "gstin", width: 22 },   // D  GSTIN
      { key: "amount", width: 16 },   // E  Total Amount
      { key: "payment", width: 16 },   // F  Payment Type
      { key: "paid", width: 20 },   // G  Total Paid
      { key: "balance", width: 16 },   // H  Balance Due
    ];

    const LAST_COL = "H";

    /* ── ROW 1 : title ── */
    sheet.mergeCells(`A1:${LAST_COL}1`);
    const titleCell = sheet.getCell("A1");
    titleCell.value = "PURCHASE REPORT";
    titleCell.font = { name: "Calibri", bold: true, size: 14 };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    sheet.getRow(1).height = 28;

    /* ── ROW 2 : generated-on stamp ── */
    sheet.mergeCells(`A2:${LAST_COL}2`);
    const generatedOn = new Date().toLocaleString("en-IN", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true,
    });
    const stampCell = sheet.getCell("A2");
    stampCell.value = `Generated on ${generatedOn}`;
    stampCell.font = { name: "Calibri", size: 10, italic: true };
    stampCell.alignment = { horizontal: "left", vertical: "middle" };
    sheet.getRow(2).height = 18;

    /* ── ROW 3 : blank spacer ── */
    sheet.addRow([]);
    sheet.getRow(3).height = 6;

    /* ── ROW 4 : column headers ── */
    const headerRow = sheet.addRow([
      "Date", "Bill No", "Party Name", "GSTIN",
      "Total Amount", "Payment Type", "Total Paid", "Balance Due",
    ]);

    headerRow.eachCell((cell) => {
      cell.font = { name: "Calibri", bold: true, size: 10 };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "medium" },   // thicker bottom on header
        right: { style: "thin" },
      };
    });
    sheet.getRow(4).height = 22;

    /* ── DATA ROWS (row 5 onward) ── */
    const FIRST_DATA = 5;

    rows.forEach((purchase) => {
      const dataRow = sheet.addRow([
        purchase.Bill_Date
          ? new Date(purchase.Bill_Date).toLocaleDateString("en-IN", {
            day: "2-digit", month: "2-digit", year: "numeric",
          })
          : "N/A",
        purchase.Bill_Number || "N/A",
        purchase.Party_Name || "N/A",
        purchase.GSTIN || "",
        Number(purchase.Total_Amount || 0),
        purchase.Payment_Type || "N/A",
        Number(purchase.Total_Paid || 0),
        Number(purchase.Balance_Due || 0),
      ]);

      dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.font = { name: "Calibri", size: 10 };
        cell.alignment = { vertical: "middle" };
        cell.border = {
          top: { style: "hair" },
          left: { style: "hair" },
          bottom: { style: "hair" },
          right: { style: "hair" },
        };

        /* right-align + currency format for numeric cols E(5), G(7), H(8) */
        if (colNumber === 5 || colNumber === 7 || colNumber === 8) {
          cell.numFmt = "#,##0.00";
          cell.alignment = { horizontal: "right", vertical: "middle" };
        }
      });

      dataRow.height = 18;
    });

    /* ── TOTAL ROW ── */
    const lastDataRow = sheet.rowCount;

    const totalRow = sheet.addRow([
      "", "", "", "TOTAL",
      { formula: `SUM(E${FIRST_DATA}:E${lastDataRow})` },   // Total Amount
      "",
      { formula: `SUM(G${FIRST_DATA}:G${lastDataRow})` },   // Total Paid
      { formula: `SUM(H${FIRST_DATA}:H${lastDataRow})` },   // Balance Due
    ]);

    totalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { name: "Calibri", bold: true, size: 11 };
      cell.alignment = { horizontal: "right", vertical: "middle" };
      cell.border = {
        top: { style: "medium" },
        left: { style: "thin" },
        bottom: { style: "medium" },
        right: { style: "thin" },
      };
      if (colNumber === 5 || colNumber === 7 || colNumber === 8) {
        cell.numFmt = "#,##0.00";
      }
    });
    totalRow.height = 22;

    /* ── freeze top 4 rows (title + stamp + spacer + header) ── */
    sheet.views = [{ state: "frozen", ySplit: 4 }];

    /* ── Item Details tab placeholder ── */
    itemSheet.columns = [{ width: 30 }];
    itemSheet.addRow(["Item-level detail export — coming soon"]);

    /* ════════════════════════════════════════════════════════
       STREAM TO CLIENT
    ════════════════════════════════════════════════════════ */
    const label = fromDate && toDate
      ? `PurchaseReport_${fromDate}_to_${toDate}`
      : `PurchaseReport_${new Date().toISOString().slice(0, 10)}`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${label}.xlsx"`
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error("❌ Purchase Excel export error:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

// const getAllPurchases = async (req, res, next) => {
//   let connection;

//   try {
//     connection = await db.getConnection();

//     /* ---------- PAGINATION ---------- */
//     const page = parseInt(req.query.page, 10) || 1;
//     const limit = 10;
//     const offset = (page - 1) * limit;

//     /* ---------- FILTERS ---------- */
//     const search = req.query.search?.trim().toLowerCase() || "";
//     const fromDate = req.query.fromDate || null;
//     const toDate = req.query.toDate || null;

//     let whereClauses = [];
//     let params = [];

//     /* ---------- SEARCH ---------- */
//     if (search) {
//       whereClauses.push(`
//         (
//           LOWER(a.Party_Name) LIKE ?
//           OR LOWER(p.Payment_Type) LIKE ?
//           OR LOWER(ba.Account_Display_Name) LIKE ?
//           OR CAST(p.Total_Amount AS CHAR) LIKE ?
//           OR CAST(p.Balance_Due AS CHAR) LIKE ?
//         )
//       `);
//       const like = `%${search}%`;
//       params.push(like, like, like, like, like);
//     }

//     /* ---------- DATE FILTER ---------- */
//     if (fromDate && toDate) {
//       whereClauses.push(`DATE(p.Bill_Date) BETWEEN ? AND ?`);
//       params.push(fromDate, toDate);
//     } else if (fromDate) {
//       whereClauses.push(`DATE(p.Bill_Date) >= ?`);
//       params.push(fromDate);
//     } else if (toDate) {
//       whereClauses.push(`DATE(p.Bill_Date) <= ?`);
//       params.push(toDate);
//     }

//     const whereSQL = whereClauses.length
//       ? `WHERE ${whereClauses.join(" AND ")}`
//       : "";

//     /* ---------- MAIN QUERY ---------- */
//     const purchasesQuery = `
//       SELECT p.*, a.Party_Name,
//         ba.Account_Display_Name AS Bank_Display_Name,
//         CASE 
//           WHEN p.Payment_Type = 'Bank' THEN ba.Account_Display_Name
//           ELSE p.Payment_Type
//         END AS Payment_Type_Display
//       FROM add_purchase p
//       LEFT JOIN add_party a ON p.Party_Id = a.Party_Id
//       LEFT JOIN bank_accounts ba ON p.Bank_Account_Id = ba.id
//       ${whereSQL}
//       ORDER BY p.created_at DESC
//       LIMIT ? OFFSET ?
//     `;

//     const [rows] = await db.query(purchasesQuery, [
//       ...params,
//       limit,
//       offset,
//     ]);

//     /* ---------- COUNT QUERY ---------- */
//     const countQuery = `
//       SELECT COUNT(*) AS total
//       FROM add_purchase p
//       LEFT JOIN add_party a ON p.Party_Id = a.Party_Id
//       LEFT JOIN bank_accounts ba ON p.Bank_Account_Id = ba.id
//       ${whereSQL}
//     `;

//     const [countResult] = await db.query(countQuery, params);

//     /* ---------- TOTALS QUERY ---------- */
//     const totalsQuery = `
//       SELECT
//         COALESCE(SUM(p.Total_Amount), 0) AS totalAmount,
//         COALESCE(SUM(p.Balance_Due), 0) AS totalUnpaid,
//         COALESCE(SUM(p.Total_Paid), 0) AS totalPaid
//       FROM add_purchase p
//       LEFT JOIN add_party a ON p.Party_Id = a.Party_Id
//       LEFT JOIN bank_accounts ba ON p.Bank_Account_Id = ba.id
//       ${whereSQL}
//     `;

//     const [totalsResult] = await db.query(totalsQuery, params);

//     /* ---------- RESPONSE ---------- */
//     return res.status(200).json({
//       success: true,
//       currentPage: page,
//       totalPages: Math.ceil(countResult[0].total / limit),
//       totalPurchases: countResult[0].total,
//       purchases: rows,
//       totals: totalsResult[0],
//     });

//   } catch (err) {
//     console.error("❌ Error fetching purchases:", err);
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };

const getAllPurchases = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();

    /* ---------- PAGINATION ---------- */
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    /* ---------- FILTERS ---------- */
    const search = req.query.search?.trim().toLowerCase() || "";
    const fromDate = req.query.fromDate || null;
    const toDate = req.query.toDate || null;

    const whereClauses = [];
    const params = [];

    /* ---------- SEARCH ---------- */
    // if (search) {
    //   whereClauses.push(`(
    //     LOWER(a.Party_Name)           LIKE ? OR
    //     CAST(p.Total_Amount AS CHAR)  LIKE ? OR
    //     CAST(p.Balance_Due AS CHAR)   LIKE ?
    //   )`);
    //   const like = `%${search}%`;
    //   params.push(like, like, like);
    // }
    if (search) {
      whereClauses.push(`(
      a.Party_Name          LIKE ? OR
        CAST(p.Total_Amount AS CHAR)  LIKE ? OR
        CAST(p.Balance_Due AS CHAR)   LIKE ? OR
        p.Bill_Number LIKE ?

      )`);
      const like = `%${search}%`;
      params.push(like, like, like, like);
    }

    /* ---------- DATE FILTER ---------- */
    if (fromDate && toDate) {
      whereClauses.push(`DATE(p.Bill_Date) BETWEEN ? AND ?`);
      params.push(fromDate, toDate);
    } else if (fromDate) {
      whereClauses.push(`DATE(p.Bill_Date) >= ?`);
      params.push(fromDate);
    } else if (toDate) {
      whereClauses.push(`DATE(p.Bill_Date) <= ?`);
      params.push(toDate);
    }

    const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

    /* ---------- MAIN QUERY ---------- */
    const [rows] = await connection.query(
      `SELECT p.*, a.Party_Name
       FROM add_purchase p
       LEFT JOIN add_party a ON a.Party_Id = p.Party_Id
       ${whereSQL}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    /* ---------- ATTACH SPLIT PAYMENT-TYPE LABELS PER ROW ---------- */
    const purchaseIds = rows.map((r) => r.id);

    if (purchaseIds.length > 0) {
      const placeholders = purchaseIds.map(() => "?").join(",");
      const [splits] = await connection.query(
        `SELECT ps.Source_Id, ps.Payment_Type, ba.Account_Display_Name
         FROM payment_splits ps
         LEFT JOIN bank_accounts ba ON ba.id = ps.Bank_Account_Id
         WHERE ps.Source_Type = 'Purchase'
           AND ps.Source_Id IN (${placeholders})`,
        purchaseIds
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

    /* ---------- COUNT QUERY ---------- */
    const [[{ total }]] = await connection.query(
      `SELECT COUNT(*) AS total
       FROM add_purchase p
       LEFT JOIN add_party a ON a.Party_Id = p.Party_Id
       ${whereSQL}`,
      params
    );

    /* ---------- TOTALS QUERY ---------- */
    const [[totals]] = await connection.query(
      `SELECT
         COALESCE(SUM(p.Total_Amount), 0) AS totalAmount,
         COALESCE(SUM(p.Balance_Due),  0) AS totalUnpaid,
         COALESCE(SUM(p.Total_Paid),   0) AS totalPaid
       FROM add_purchase p
       LEFT JOIN add_party a ON a.Party_Id = p.Party_Id
       ${whereSQL}`,
      params
    );

    /* ---------- RESPONSE ---------- */
    return res.status(200).json({
      success: true,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPurchases: total,
      purchases: rows,
      totals,
    });
  } catch (err) {
    console.error("❌ Error fetching purchases:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};
//TRYING
// const editPurchase = async (req, res, next) => {
//   let connection;
//   try {
//     const { Purchase_Id: purchaseId } = req.params;

//     connection = await db.getConnection();
//     await connection.beginTransaction();

//     // 1️⃣ Check purchase exists
//     const [existingPurchase] = await connection.query(
//       "SELECT * FROM add_purchase WHERE Purchase_Id = ?",
//       [purchaseId]
//     );

//     if (existingPurchase.length === 0) {
//       return res.status(404).json({ message: "No such Purchase found." });
//     }
//     const purchaseIdNumber = existingPurchase[0].id;  
//     console.log(req.body);

//     // 2️⃣ Validate
//     const cleanData = sanitizeObject(req.body);
//     const validation = purchaseSchema.safeParse(cleanData);

//     if (!validation.success) {
//       await connection.rollback();
//       return res.status(400).json({ errors: validation.error.errors });
//     }

//     const {
//       Party_Name,
//       GSTIN,
//       Bill_Number,
//       Bill_Date,
//       State_Of_Supply,
//       Total_Amount,
//       Total_Paid,
//       Balance_Due,
//       Payment_Type,
//       Bank_Account_Id,          // 🔹 new
//       Reference_Number,
//       items,
//     } = validation.data;

//     if (!Array.isArray(items) || items.length === 0) {
//       await connection.rollback();
//       return res.status(400).json({
//         message: "No purchase items provided",
//       });
//     }
//     if (Payment_Type === "Bank" && !Bank_Account_Id) {
//       await connection.rollback();
//       return res.status(400).json({ message: "Bank account is required for Bank payment type." });
//     }

//     // 3️⃣ Duplicate check
//     const itemNameSet = new Set();
//     for (const item of items) {
//       const name = item.Item_Name?.trim().toLowerCase();

//       if (!name) {
//         await connection.rollback();
//         return res.status(400).json({ message: "Item name missing." });
//       }

//       if (itemNameSet.has(name)) {
//         await connection.rollback();
//         return res.status(400).json({
//           message: `Duplicate item: ${item.Item_Name}`,
//         });
//       }

//       itemNameSet.add(name);
//     }

//     // 4️⃣ Party check
//     const [partyRows] = await connection.query(
//       "SELECT Party_Id FROM add_party WHERE Party_Name = ? LIMIT 1",
//       [Party_Name]
//     );

//     if (partyRows.length === 0) {
//       await connection.rollback();
//       return res.status(404).json({ message: "Party not found." });
//     }

//     const Party_Id = partyRows[0].Party_Id;

//     // 5️⃣ Update purchase master
//     const totalAmount = Number(Total_Amount) || 0;
//     const totalPaid = Number(Total_Paid) || 0;
//     const balanceDue = Number(Balance_Due) || totalAmount - totalPaid;

//     await connection.query(
//       `UPDATE add_purchase SET 
//         Party_Id=?, Bill_Number=?, Bill_Date=?, State_Of_Supply=?,
//         Total_Amount=?, Total_Paid=?, Balance_Due=?,
//         Payment_Type=?,Bank_Account_Id=?, Reference_Number=?, updated_at=NOW()
//        WHERE Purchase_Id=?`,
//       [
//         Party_Id,
//         Bill_Number,
//         Bill_Date,
//         State_Of_Supply,
//         totalAmount,
//         totalPaid,
//         balanceDue,
//         cleanValue(Payment_Type),
//         Payment_Type === "Bank" ? Bank_Account_Id : null,
//         cleanValue(Reference_Number),
//         purchaseId,
//       ]
//     );

//     // 6️⃣ Fetch existing purchase items
//     const [oldItems] = await connection.query(
//       "SELECT * FROM add_purchase_items WHERE Purchase_Id = ?",
//       [purchaseId]
//     );

//     const oldMap = new Map();
//     oldItems.forEach((i) => oldMap.set(i.Item_Id, i));

//     const newItemIds = new Set();

//     // 🔹 record bank ledger entry when paid via bank, using the amount actually paid

//       await recordBankTransaction({
//         connection,
//         bankAccountId: Payment_Type === "Bank" ? Bank_Account_Id : null,
//         txnType: "Purchase",
//         referenceId: purchaseIdNumber,        // ✅ fixed
//         partyName: Party_Name,          // ✅ add this
//         amount: totalPaid,
//         txnDate: Bill_Date
//       });
//      await recordCashTransaction({
//       connection,
//       isCash: Payment_Type === "Cash",
//       txnType: "Purchase",
//       referenceId: purchaseIdNumber,
//       partyName: Party_Name,
//       amount: totalPaid || totalAmount,
//       txnDate: Bill_Date,
//     });


//     // 7️⃣ Loop new items
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

//       // 🔹 get or create item
//       const [existingItem] = await connection.query(
//         "SELECT * FROM add_item WHERE Item_Name = ? LIMIT 1",
//         [Item_Name]
//       );

//       let Item_Id;

//       if (existingItem.length === 0) {
//         const [res] = await connection.execute(
//           `INSERT INTO add_item 
//            (Item_Name, Item_Category, Item_HSN, Item_Unit, Stock_Quantity, created_at, updated_at)
//            VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
//           [
//             Item_Name,
//             Item_Category || "",
//             Item_HSN || "",
//             Item_Unit || "",
//             normalizeNumber(Quantity),
//           ]
//         );

//         const id = res.insertId;
//         Item_Id = "ITM" + id;

//         await connection.execute(
//           `UPDATE add_item SET Item_Id=? WHERE id=?`,
//           [Item_Id, id]
//         );
//       } else {
//         Item_Id = existingItem[0].Item_Id;
//       }

//       newItemIds.add(Item_Id);

//       const old = oldMap.get(Item_Id);

//       if (old) {
//         // 🔥 UPDATE existing
//         await connection.query(
//           `UPDATE add_purchase_items SET 
//            Quantity=?, Purchase_Price=?, 
//            Discount_On_Purchase_Price=?, Discount_Type_On_Purchase_Price=?,
//            Tax_Type=?,
//             Tax_Amount=?,
//              Amount=?, updated_at=NOW()
//            WHERE Purchase_items_Id=?`,
//           [
//             normalizeNumber(Quantity),
//             normalizeNumber(Purchase_Price),
//             cleanDiscount(Discount_On_Purchase_Price),
//             cleanValue(Discount_Type_On_Purchase_Price),
//             cleanValue(Tax_Type),
//             normalizeNumber(Tax_Amount),
//             normalizeNumber(Amount),
//             old.Purchase_items_Id,
//           ]
//         );

//         // 🔥 stock adjust (diff)
//         const diff = normalizeNumber(Quantity) - old.Quantity;

//         if (diff !== 0) {
//           await connection.query(
//             `UPDATE add_item 
//              SET Stock_Quantity = Stock_Quantity + ?, updated_at=NOW()
//              WHERE Item_Id=?`,
//             [diff, Item_Id]
//           );
//         }
//       } else {
//         // 🔥 INSERT new
//         const [res] = await connection.execute(
//           `INSERT INTO add_purchase_items
//            (Purchase_Id, Item_Id, Quantity, Purchase_Price,
//             Discount_On_Purchase_Price, Discount_Type_On_Purchase_Price,
//             Tax_Type, Tax_Amount, Amount, created_at, updated_at)
//            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
//           [
//             purchaseId,
//             Item_Id,
//             normalizeNumber(Quantity),
//             normalizeNumber(Purchase_Price),
//             cleanDiscount(Discount_On_Purchase_Price),
//             cleanValue(Discount_Type_On_Purchase_Price),
//             cleanValue(Tax_Type),
//             normalizeNumber(Tax_Amount),
//             normalizeNumber(Amount),
//           ]
//         );

//         const id = res.insertId;
//         const Purchase_items_Id = "PIT" + id;

//         await connection.execute(
//           `UPDATE add_purchase_items SET Purchase_items_Id=? WHERE id=?`,
//           [Purchase_items_Id, id]
//         );

//         // 🔥 add stock
//         await connection.query(
//           `UPDATE add_item 
//            SET Stock_Quantity = Stock_Quantity + ?, updated_at=NOW()
//            WHERE Item_Id=?`,
//           [normalizeNumber(Quantity), Item_Id]
//         );
//       }
//     }

//     // 8️⃣ Delete removed items
//     for (const old of oldItems) {
//       if (!newItemIds.has(old.Item_Id)) {
//         await connection.query(
//           `DELETE FROM add_purchase_items WHERE Purchase_items_Id=?`,
//           [old.Purchase_items_Id]
//         );

//         // reduce stock
//         await connection.query(
//           `UPDATE add_item 
//            SET Stock_Quantity = Stock_Quantity - ?, updated_at=NOW()
//            WHERE Item_Id=?`,
//           [old.Quantity, old.Item_Id]
//         );
//       }
//     }

//     await connection.commit();

//     return res.status(200).json({
//       success: true,
//       message: "Purchase updated successfully",
//       purchaseId,
//     });

//   } catch (err) {
//     if (connection) await connection.rollback();
//     console.error("❌ Error editing purchase:", err);
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };
const editPurchase = async (req, res, next) => {
  let connection;
  try {
    const { Purchase_Id: purchaseId } = req.params;

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [existingPurchase] = await connection.query(
      "SELECT * FROM add_purchase WHERE Purchase_Id = ?",
      [purchaseId]
    );
    if (existingPurchase.length === 0) {
      return res.status(404).json({ message: "No such Purchase found." });
    }
    const purchaseIdNumber = existingPurchase[0].id;

    const cleanData = sanitizeObject(req.body);
    const validation = purchaseSchema.safeParse(cleanData);
    if (!validation.success) {
      await connection.rollback();
      return res.status(400).json({ errors: validation.error.errors });
    }

    const {
      Party_Name,
      GSTIN,
      Bill_Number,
      Bill_Date,
      State_Of_Supply,
      Total_Amount,
      Total_Paid,
      Balance_Due,
      splits,
      items,
      Terms_Conditions_Id,
      Terms_Conditions_Description,
    } = validation.data;

    // ── TERMS & CONDITIONS — unchanged ──
    let termsId = null;
    let termsDescription = null;

    if (Terms_Conditions_Id && Terms_Conditions_Description?.trim()) {
      termsId = Number(Terms_Conditions_Id);
      termsDescription = Terms_Conditions_Description.trim();
    } else if (Terms_Conditions_Description?.trim()) {
      termsId = null;
      termsDescription = Terms_Conditions_Description.trim();
    }
    if (termsId) {
      const [[selectedTerm]] = await connection.query(
        `SELECT id FROM terms_conditions WHERE id = ? AND Purchase_Bill = 1 LIMIT 1`,
        [termsId]
      );
      if (!selectedTerm) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: "Invalid Terms & Conditions for Purchase Bill.",
        });
      }
    }

    // ── SPLITS — unchanged ──
    const normalizedSplits = (splits || []).map((s) => ({ ...s, Amount: Number(s.Amount) || 0 }));

    const firstValidIndex = normalizedSplits.findIndex((s) => {
      if (!s.Payment_Type) return false;
      if (s.Payment_Type === "Bank" && !s.Bank_Account_Id) return false;
      return true;
    });

    const validSplits = normalizedSplits.reduce((acc, s, index) => {
      if (!s.Payment_Type) return acc;
      if (s.Payment_Type === "Bank" && !s.Bank_Account_Id) return acc;
      if (s.Amount > 0) { acc.push(s); return acc; }
      if (index === firstValidIndex) acc.push({ ...s, Amount: 0 });
      return acc;
    }, []);

    const totalAmount = Number(Total_Amount) || 0;
    const totalPaid = validSplits.reduce((sum, s) => sum + (Number(s.Amount) || 0), 0);
    const balanceDue = totalAmount - totalPaid;

    if (totalPaid > totalAmount) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Received amount should be less than or equal to Total Amount",
      });
    }
    if (totalPaid > 0) {
      try {
        validateSplits(validSplits, totalPaid);
      } catch (validationErr) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: validationErr.message });
      }
    }

    const [partyRows] = await connection.query(
      "SELECT Party_Id FROM add_party WHERE Party_Name = ? LIMIT 1",
      [Party_Name]
    );
    if (partyRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Party not found." });
    }
    const Party_Id = partyRows[0].Party_Id;

    await connection.query(
      `UPDATE add_purchase SET
         Party_Id = ?, Bill_Number = ?, Bill_Date = ?, State_Of_Supply = ?,
         Total_Amount = ?, Total_Paid = ?, Balance_Due = ?,
         Terms_Conditions_Id = ?, Terms_Conditions_Description = ?,
         updated_at = NOW()
       WHERE Purchase_Id = ?`,
      [
        Party_Id, Bill_Number, Bill_Date, cleanValue(State_Of_Supply),
        totalAmount, totalPaid, balanceDue,
        termsId, termsDescription,
        purchaseId,
      ]
    );

    await connection.query(
      `UPDATE purchase_return SET Bill_Number = ?, Bill_Date = ?, updated_at = NOW() WHERE Purchase_Id = ?`,
      [Bill_Number, Bill_Date, purchaseId]
    );

    await deletePaymentSplits({ connection, sourceType: "Purchase", sourceId: purchaseIdNumber });

    if (validSplits.length > 0) {
      await insertPaymentSplits({
        connection,
        sourceType: "Purchase",
        sourceId: purchaseIdNumber,
        partyName: Party_Name,
        txnDate: Bill_Date,
        splits: validSplits,
      });
    }

    await recordPartyLedger({
      connection,
      partyId: Party_Id,
      txnType: "Purchase",
      referenceId: purchaseIdNumber,
      amount: totalAmount,
      txnDate: Bill_Date,
      docNumber: Bill_Number,
      balanceDue: balanceDue,
    });

    const [oldItems] = await connection.query(
      "SELECT * FROM add_purchase_items WHERE Purchase_Id = ?",
      [purchaseId]
    );

    
// ═══════════════════════════════════════════════════════
// STEP 1 — RESOLVE ITEMS + UNITS + STOCK QUANTITY
// ═══════════════════════════════════════════════════════

const resolvedLines = [];

for (const item of items) {
  const {
    Item_Name,
    Item_Category,
    Item_HSN,

    // Unit selected on THIS purchase row
    Item_Unit,

    Quantity,

    // These may come from frontend for a brand-new item
    Primary_Unit,
    Secondary_Unit,
    Conversion_Rate,
  } = item;

  // =====================================================
  // SKIP COMPLETELY BLANK ROW
  // =====================================================

  if (!Item_Name?.trim()) {
    if ((normalizeNumber(item.Amount) ?? 0) > 0) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Please enter an item name for the row.",
      });
    }

    continue;
  }

  // =====================================================
  // SELECTED UNIT ON THIS PURCHASE LINE
  // =====================================================

  const Selected_Unit = Item_Unit || null;

  let Item_Id = item.Item_Id || null;
  let dbItemRow = null;

  // =====================================================
  // FIND ITEM
  // =====================================================

  if (Item_Id) {
    const [rows] = await connection.query(
      `
      SELECT *
      FROM add_item
      WHERE Item_Id = ?
      LIMIT 1
      `,
      [Item_Id]
    );

    dbItemRow = rows[0] || null;
  } else {
    const [rows] = await connection.query(
      `
      SELECT *
      FROM add_item
      WHERE TRIM(Item_Name) = TRIM(?)
      LIMIT 1
      `,
      [Item_Name]
    );

    dbItemRow = rows[0] || null;

    Item_Id = dbItemRow?.Item_Id || null;
  }

  // =====================================================
  // VALUES THAT WILL BE STORED IN PURCHASE ITEM SNAPSHOT
  // =====================================================

  let snapshot = {
    Primary_Unit_Snapshot: null,
    Secondary_Unit_Snapshot: null,
  };

  let resolvedSelectedUnit = null;

  // IMPORTANT:
  // Stock_Quantity in add_item is maintained in PRIMARY UNIT.
  let quantityInBaseUnit = 0;

  // ═════════════════════════════════════════════════════
  // BRAND-NEW ITEM
  // ═════════════════════════════════════════════════════

  if (!dbItemRow) {

    /*
      IMPORTANT RULE:

      If frontend explicitly supplied Primary_Unit:
          use Primary_Unit

      Otherwise if user selected Item_Unit on purchase:
          Selected_Unit becomes Primary_Unit

      Otherwise:
          no unit

      Examples:

      Item_Unit = "kg"
      Primary_Unit = null
          => primaryUnit = "kg"

      Item_Unit = null
      Primary_Unit = null
          => primaryUnit = null

      Primary_Unit = "kg"
      Secondary_Unit = "gm"
      Item_Unit = "gm"
          => primaryUnit = "kg"
          => selected purchase unit = "gm"
    */

    const primaryUnit =
      Primary_Unit ||
      Selected_Unit ||
      null;

    const secondaryUnit =
      Secondary_Unit || null;

    const conversionRate =
      secondaryUnit && Number(Conversion_Rate) > 0
        ? Number(Conversion_Rate)
        : null;

    // ===================================================
    // GENERATE ITEM ID
    // ===================================================

    const [maxRow] = await connection.query(
      `
      SELECT
        MAX(
          CAST(
            SUBSTRING(Item_Id, 4)
            AS UNSIGNED
          )
        ) AS maxId
      FROM add_item
      WHERE Item_Id LIKE 'ITM%'
      `
    );

    const autoId =
      (maxRow[0]?.maxId || 0) + 1;

    Item_Id =
      "ITM" +
      autoId.toString().padStart(3, "0");

    // ===================================================
    // CREATE NEW ITEM MASTER
    // ===================================================

    await connection.execute(
      `
      INSERT INTO add_item
      (
        Item_Id,
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
        ?,
        ?, ?, ?,
        ?,
        NOW(),
        NOW()
      )
      `,
      [
        Item_Id,
        Item_Name,
        Item_Category || "",
        cleanValue(Item_HSN),

        // legacy field
        Item_Unit || "",

        primaryUnit,
        secondaryUnit,
        conversionRate,

        // Stock gets updated below using diff calculation
        0,
      ]
    );

    // ===================================================
    // SAVE CONVERSION HISTORY
    // ===================================================

    if (
      primaryUnit &&
      secondaryUnit &&
      conversionRate &&
      conversionRate > 0
    ) {
      await connection.query(
        `
        INSERT IGNORE INTO item_unit_conversions
        (
          Item_Id,
          Primary_Unit,
          Secondary_Unit,
          Conversion_Rate
        )
        VALUES (?, ?, ?, ?)
        `,
        [
          Item_Id,
          primaryUnit,
          secondaryUnit,
          conversionRate,
        ]
      );
    }

    // ===================================================
    // CREATE LOCAL MASTER REPRESENTATION
    // ===================================================

    dbItemRow = {
      Item_Id,

      Item_HSN: cleanValue(Item_HSN),

      Item_Category:
        Item_Category || "",

      Primary_Unit:
        primaryUnit,

      Secondary_Unit:
        secondaryUnit,

      Conversion_Rate:
        conversionRate,
    };

    // ===================================================
    // SNAPSHOT
    // ===================================================

    snapshot = {
      Primary_Unit_Snapshot:
        primaryUnit,

      Secondary_Unit_Snapshot:
        secondaryUnit,
    };

    /*
      Selected unit is whatever user selected on purchase.

      If frontend did not send one, use primary.

      Example:
      New Coca Cola
      Item_Unit = lt

      primary = lt
      selected = lt
    */

    resolvedSelectedUnit =
      Selected_Unit ||
      primaryUnit ||
      null;

    // ===================================================
    // NORMALIZE STOCK INTO PRIMARY UNIT
    // ===================================================

    const qty =
      normalizeNumber(Quantity) ?? 0;

    /*
      Convention:

      1 PRIMARY = Conversion_Rate SECONDARY

      Example:

      1 lt = 1000 ml

      Purchase:
      500 ml

      Base stock:
      500 / 1000 = 0.5 lt
    */

    if (
      primaryUnit &&
      secondaryUnit &&
      resolvedSelectedUnit === secondaryUnit
    ) {
      if (
        !conversionRate ||
        conversionRate <= 0
      ) {
        await connection.rollback();

        return res.status(400).json({
          success: false,
          message:
            `Conversion rate is required for ${primaryUnit} → ${secondaryUnit}.`,
        });
      }

      quantityInBaseUnit =
        qty / conversionRate;
    } else {
      // primary unit OR item has no units
      quantityInBaseUnit = qty;
    }
  }

  // ═════════════════════════════════════════════════════
  // EXISTING ITEM
  // ═════════════════════════════════════════════════════

  //   else {

  // // ADD THIS ↓↓↓

  // const oldPurchaseLine = oldItems.find(
  //   (old) => String(old.Item_Id) === String(Item_Id)
  // );

  // const oldPrimary =
  //   oldPurchaseLine?.Primary_Unit_Snapshot || null;

  // const oldSecondary =
  //   oldPurchaseLine?.Secondary_Unit_Snapshot || null;

  // const oldSelected =
  //   oldPurchaseLine?.Selected_Unit || null;

  // const oldUsedSecondary =
  //   oldPurchaseLine &&
  //   oldSecondary &&
  //   oldSelected === oldSecondary;
  else {

  // =====================================================
  // FIRST UNIT ASSIGNMENT
  //
  // Item already exists, but was originally created
  // with NO unit.
  //
  // Example:
  // master Primary_Unit = NULL
  // user now selects KG
  //
  // => KG becomes the item's Primary_Unit
  // =====================================================

  if (
    !dbItemRow.Primary_Unit &&
    Selected_Unit
  ) {
    await connection.query(
      `
        UPDATE add_item
        SET
          Primary_Unit = ?,
          Secondary_Unit = NULL,
          Conversion_Rate = NULL,
          updated_at = NOW()
        WHERE Item_Id = ?
      `,
      [
        Selected_Unit,
        Item_Id,
      ]
    );

    // VERY IMPORTANT:
    // Keep local object synchronized with DB
    dbItemRow.Primary_Unit = Selected_Unit;
    dbItemRow.Secondary_Unit = null;
    dbItemRow.Conversion_Rate = null;
  }


  // =====================================================
  // NOW YOUR EXISTING OLD PURCHASE LOGIC CONTINUES
  // =====================================================

  const oldPurchaseLine = oldItems.find(
    (old) => String(old.Item_Id) === String(Item_Id)
  );

  const oldPrimary =
    oldPurchaseLine?.Primary_Unit_Snapshot || null;

  const oldSecondary =
    oldPurchaseLine?.Secondary_Unit_Snapshot || null;

  const oldSelected =
    oldPurchaseLine?.Selected_Unit || null;

  const oldUsedSecondary =
    oldPurchaseLine &&
    oldSecondary &&
    oldSelected === oldSecondary;

  // ADD UNTIL HERE ↑↑↑


  
  try {

  // =====================================================
  // OLD PURCHASE USED SECONDARY UNIT
  // Example:
  // old snapshot = KG / GM
  // old selected = GM
  // current master = KG / BOX
  //
  // Keep KG / GM for this old purchase
  // =====================================================
  if (oldUsedSecondary) {

    snapshot = {
      Primary_Unit_Snapshot: oldPrimary,
      Secondary_Unit_Snapshot: oldSecondary,
    };

    // Only old KG / GM are valid for this old transaction
    if (
      Selected_Unit !== oldPrimary &&
      Selected_Unit !== oldSecondary
    ) {
      throw new Error(
        `Allowed units are ${oldPrimary} and ${oldSecondary}.`
      );
    }

    resolvedSelectedUnit = Selected_Unit;

    const qty =
      normalizeNumber(Quantity) ?? 0;

    // User selected primary KG
    if (Selected_Unit === oldPrimary) {
      quantityInBaseUnit = qty;
    }

    // User selected secondary GM
    else {
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
            Item_Id,
            oldPrimary,
            oldSecondary,
          ]
        );

      const rate =
        Number(conversion?.Conversion_Rate) || 0;

      if (rate <= 0) {
        throw new Error(
          `Conversion rate not found for ${oldPrimary} → ${oldSecondary}.`
        );
      }

      quantityInBaseUnit =
        qty / rate;
    }
  }

  // =====================================================
  // OLD PURCHASE USED PRIMARY
  // OR item is newly added to this edited purchase
  //
  // Use CURRENT master
  //
  // old = KG / GM, selected KG
  // master now = KG / BOX
  // => use KG / BOX
  // =====================================================
  else {

    const result =
      resolveUnitAndStockDelta({
        dbItemRow,
        Selected_Unit,
        Quantity,
      });

    snapshot =
      result.snapshot;

    resolvedSelectedUnit =
      result.resolvedSelectedUnit;

    quantityInBaseUnit =
      Number(result.stockDelta) || 0;
  }

}
    
    catch (unitErr) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: unitErr.message,
      });
    }

    // ===================================================
    // HSN / CATEGORY MAY STILL BE SYNCED
    // ===================================================

    const updates = [];
    const params = [];

    if (
      Item_HSN &&
      Item_HSN !== dbItemRow.Item_HSN
    ) {
      updates.push("Item_HSN = ?");
      params.push(Item_HSN);
    }

    if (
      Item_Category !== undefined &&
      Item_Category !==
        dbItemRow.Item_Category
    ) {
      updates.push("Item_Category = ?");
      params.push(Item_Category || "");
    }

    if (updates.length > 0) {
      params.push(Item_Id);

      await connection.query(
        `
        UPDATE add_item
        SET
          ${updates.join(", ")},
          updated_at = NOW()
        WHERE Item_Id = ?
        `,
        params
      );
    }
  }

  // =====================================================
  // SAVE RESOLVED LINE
  // =====================================================

  resolvedLines.push({
    ...item,

    Item_Id,

    snapshot,

    resolvedSelectedUnit,

    // Normalized quantity used ONLY for stock calculations
    quantityInBaseUnit,
  });
}


// ═══════════════════════════════════════════════════════
// STEP 2 — CALCULATE STOCK DIFFERENCE
// ═══════════════════════════════════════════════════════

/*
  IMPORTANT:

  We cannot compare raw purchase quantities.

  Example:

      OLD:
      1 lt

      NEW:
      500 ml

  Raw:
      500 - 1 = 499 ❌

  Base:
      0.5 lt - 1 lt = -0.5 lt ✅
*/


// =======================================================
// NEW PURCHASE QUANTITY — NORMALIZED TO PRIMARY UNIT
// =======================================================

const newQtyByItem = new Map();

for (const line of resolvedLines) {
  const qty =
    Number(line.quantityInBaseUnit) || 0;

  newQtyByItem.set(
    line.Item_Id,
    (newQtyByItem.get(line.Item_Id) || 0) +
      qty
  );
}


// =======================================================
// OLD PURCHASE QUANTITY — NORMALIZE TO PRIMARY UNIT
// =======================================================

const oldQtyByItem = new Map();

for (const old of oldItems) {

  const rawQty =
    Number(old.Quantity) || 0;

  // Get CURRENT item conversion.
  //
  // Your rule is that historical conversion rate is
  // NOT frozen — old transactions use the item's
  // current conversion rate.

  const snapPrimary = old.Primary_Unit_Snapshot || null;
const snapSecondary = old.Secondary_Unit_Snapshot || null;

let baseQty = rawQty;

if (snapPrimary && snapSecondary && old.Selected_Unit === snapSecondary) {

  const [[historicalRate]] =
    await connection.query(
      `
      SELECT Conversion_Rate
      FROM item_unit_conversions
      WHERE Item_Id = ? AND Primary_Unit = ? AND Secondary_Unit = ?
      ORDER BY id DESC
      LIMIT 1
      `,
      [old.Item_Id, snapPrimary, snapSecondary]
    );

  const conversionRate = Number(historicalRate?.Conversion_Rate) || 0;

  if (conversionRate <= 0) {
    await connection.rollback();

    return res.status(400).json({
      success: false,
      message:
        `Missing historical conversion rate for item ${old.Item_Id} (${snapPrimary} → ${snapSecondary}).`,
    });
  }

  baseQty =
    rawQty / conversionRate;
}
  

  oldQtyByItem.set(
    old.Item_Id,
    (oldQtyByItem.get(old.Item_Id) || 0) +
      baseQty
  );
}


// =======================================================
// APPLY DIFFERENCE TO ITEM MASTER STOCK
// =======================================================

const allItemIds =
  new Set([
    ...newQtyByItem.keys(),
    ...oldQtyByItem.keys(),
  ]);

for (const itemId of allItemIds) {

  const newQty =
    newQtyByItem.get(itemId) || 0;

  const oldQty =
    oldQtyByItem.get(itemId) || 0;

  const diff =
    newQty - oldQty;

  if (diff !== 0) {
    await connection.query(
      `
      UPDATE add_item
      SET
        Stock_Quantity =
          Stock_Quantity + ?,

        updated_at = NOW()

      WHERE Item_Id = ?
      `,
      [
        diff,
        itemId,
      ]
    );
  }
}
    // ═══════════════════════════════════════════════════════
    // STEP 3a — reverse ALL old item ledger rows before deleting purchase_items
    // ═══════════════════════════════════════════════════════
    for (const old of oldItems) {
      await reverseItemLedger({
        connection,
        itemId: old.Item_Id,
        txnType: "Purchase",
        referenceId: old.id,
      });
    }

    // STEP 3b — now safe to delete old rows
    await connection.query(`DELETE FROM add_purchase_items WHERE Purchase_Id = ?`, [purchaseId]);

    // STEP 3c — insert fresh rows (WITH unit snapshot columns) + record new ledger entries
    for (const line of resolvedLines) {
      const [insertRes] = await connection.execute(
        `INSERT INTO add_purchase_items
         (Purchase_Id, Item_Id, Quantity, Purchase_Price,
          Discount_On_Purchase_Price, Discount_Type_On_Purchase_Price,
          Tax_Type, Tax_Amount, Amount,
          Primary_Unit_Snapshot, Secondary_Unit_Snapshot, Selected_Unit,
          created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          purchaseId,
          line.Item_Id,
          normalizeNumber(line.Quantity) ?? 0,
          normalizeNumber(line.Purchase_Price) ?? 0,
          cleanDiscount(line.Discount_On_Purchase_Price),
          cleanValue(line.Discount_Type_On_Purchase_Price),
          cleanValue(line.Tax_Type),
          normalizeNumber(line.Tax_Amount) ?? 0,
          normalizeNumber(line.Amount) ?? 0,
          line.snapshot.Primary_Unit_Snapshot,
          line.snapshot.Secondary_Unit_Snapshot,
          line.resolvedSelectedUnit,
        ]
      );

      const id = insertRes.insertId;
      await connection.execute(
        `UPDATE add_purchase_items SET Purchase_items_Id = ? WHERE id = ?`,
        ["PIT" + id.toString().padStart(3, "0"), id]
      );

      await recordItemLedger({
        connection,
        itemId: line.Item_Id,
        txnType: "Purchase",
        referenceId: id,
        billId: purchaseId,
        billNumber: Bill_Number,
        partyName: Party_Name,
        quantity: normalizeNumber(line.Quantity) ?? 0,
        rate: normalizeNumber(line.Purchase_Price) ?? null,
        txnDate: Bill_Date,
      });
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Purchase updated successfully",
      purchaseId,
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("❌ Error editing purchase:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};
//OLD

// const getSinglePurchase = async (req, res, next) => {
//   let connection;
//   try {
//     const { Purchase_Id: purchaseId } = req.params;

//     connection = await db.getConnection();

//     if (!purchaseId) {
//       return res.status(400).json({ success: false, message: "Purchase ID is required." });
//     }

//     // ✅ Fetch purchase header — no Payment_Type/Bank_Account_Id anymore
//     // const [purchaseData] = await connection.query(
//     //   `SELECT
//     //   pu.id,
//     //      pu.Purchase_Id,
//     //      pu.Bill_Number,
//     //      pu.Bill_Date,

//     //      pu.State_Of_Supply,
//     //      pu.Total_Amount,
//     //      pu.Total_Paid,
//     //      pu.Balance_Due,
//     //      pu.Party_Id,
//     //      pu.Terms_Conditions_Id,
//     //      pu.Terms_Conditions_Description,
//     //      p.Party_Name,
//     //      p.GSTIN
//     //    FROM add_purchase pu
//     //    LEFT JOIN add_party p ON pu.Party_Id = p.Party_Id
//     //    WHERE pu.Purchase_Id = ?`,
//     //   [purchaseId]
//     // );
//     const [purchaseData] = await connection.query(
//       `SELECT
//      pu.id,
//      pu.Purchase_Id,
//      pu.Bill_Number,
//      pu.Bill_Date,
//      pu.State_Of_Supply,
//      pu.Total_Amount,
//      pu.Total_Paid,
//      pu.Balance_Due,
//      pu.Party_Id,

//      pu.Terms_Conditions_Id,
//      pu.Terms_Conditions_Description,

//      p.Party_Name,
//      p.GSTIN,

//      tc.Title AS Terms_Conditions_Title

//    FROM add_purchase pu

//    LEFT JOIN add_party p
//      ON pu.Party_Id = p.Party_Id

//    LEFT JOIN terms_conditions tc
//      ON pu.Terms_Conditions_Id = tc.id

//    WHERE pu.Purchase_Id = ?`,
//       [purchaseId]
//     );

//     if (purchaseData.length === 0) {
//       return res.status(404).json({ success: false, message: "Purchase not found." });
//     }

//     const purchaseHeader = purchaseData[0];

//     // ✅ Fetch purchase items
//     const [items] = await connection.query(
//       `SELECT 
//          pi.Purchase_Items_Id,
//          pi.Item_Id,
//          i.Item_Name,
//          i.Item_HSN,
//          i.Item_Unit,
//          i.Item_Category,
//          pi.Quantity,
//          pi.Purchase_Price,
//          pi.Discount_On_Purchase_Price,
//          pi.Discount_Type_On_Purchase_Price,
//          pi.Tax_Amount,
//          pi.Tax_Type,
//          pi.Amount,
//          pi.created_at
//        FROM add_purchase_items pi
//        LEFT JOIN add_item i ON pi.Item_Id = i.Item_Id
//        WHERE pi.Purchase_Id = ?
//        ORDER BY pi.created_at DESC`,
//       [purchaseId]
//     );

//     // if (items.length === 0) {
//     //   return res.status(404).json({ success: false, message: "No purchase items found for this invoice." });
//     // }

//     // ✅ Fetch payment splits for this purchase
//     const [splits] = await connection.query(
//       `SELECT
//          ps.id,
//          ps.Payment_Type,
//          ps.Bank_Account_Id,
//          ps.Reference_Number,
//          ps.Amount,
//          ba.Account_Display_Name,
//          CASE
//            WHEN ps.Payment_Type = 'Bank' THEN ba.Account_Display_Name
//            ELSE ps.Payment_Type
//          END AS Payment_Type_Display
//        FROM payment_splits ps
//        LEFT JOIN bank_accounts ba ON ba.id = ps.Bank_Account_Id
//        WHERE ps.Source_Type = 'Purchase' AND ps.Source_Id = ?
//        ORDER BY ps.id ASC`,
//       [purchaseHeader.id]
//       //[purchaseHeader.id ?? purchaseId]  

//       // use numeric id if your splits store numeric; adjust if stored as 'PUR001'
//     );

//     // ✅ Build a human-readable summary of splits for easy display
//     const splitSummary = splits.map((s) => s.Payment_Type_Display).join(" + ") || "—";

//     return res.status(200).json({
//       success: true,
//       billPurchaseDetails: {
//         Purchase_Id: purchaseHeader.Purchase_Id,
//         Party_Name: purchaseHeader.Party_Name,
//         GSTIN: purchaseHeader.GSTIN,
//         State_Of_Supply: purchaseHeader.State_Of_Supply,
//         Bill_Number: purchaseHeader.Bill_Number,
//         Bill_Date: purchaseHeader.Bill_Date,
//         //Reference_Number: purchaseHeader.Reference_Number,
//         Total_Amount: purchaseHeader.Total_Amount,
//         Total_Paid: purchaseHeader.Total_Paid,
//         Balance_Due: purchaseHeader.Balance_Due,
//         Billing_Address: purchaseHeader.Billing_Address,
//         Shipping_Address: purchaseHeader.Shipping_Address,
//         // 🔹 split summary for display in UI header
//         Payment_Type_Display: splitSummary,
//         Terms_Conditions_Id: purchaseHeader.Terms_Conditions_Id,
//         Terms_Conditions_Description: purchaseHeader.Terms_Conditions_Description,
//       },
//       // 🔹 full splits array — frontend uses this to pre-fill the payment split UI
//       splits: splits.map((s) => ({
//         id: s.id,
//         Payment_Type: s.Payment_Type,
//         Bank_Account_Id: s.Bank_Account_Id,
//         Account_Display_Name: s.Account_Display_Name,
//         Payment_Type_Display: s.Payment_Type_Display,
//         Reference_Number: s.Reference_Number,
//         Amount: s.Amount,
//       })),
//       items: items.map((it) => ({
//         Purchase_Items_Id: it.Purchase_Items_Id,
//         Item_Id: it.Item_Id,
//         Item_Name: it.Item_Name,
//         Item_HSN: it.Item_HSN,
//         Item_Unit: it.Item_Unit,
//         Item_Category: it.Item_Category,
//         Quantity: it.Quantity,
//         Purchase_Price: it.Purchase_Price,
//         Discount_On_Purchase_Price: it.Discount_On_Purchase_Price,
//         Discount_Type_On_Purchase_Price: it.Discount_Type_On_Purchase_Price,
//         Tax_Amount: it.Tax_Amount,
//         Tax_Type: it.Tax_Type,
//         Amount: it.Amount,
//         created_at: it.created_at,
//       })),
//     });
//   } catch (err) {
//     console.error("❌ Error getting single purchase:", err);
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };

//TRYING
const getSinglePurchase = async (req, res, next) => {
  let connection;

  try {
    const { Purchase_Id: purchaseId } = req.params;

    connection = await db.getConnection();

    // =========================================================
    // 1. VALIDATE PURCHASE ID
    // =========================================================

    if (!purchaseId) {
      return res.status(400).json({
        success: false,
        message: "Purchase ID is required.",
      });
    }

    // =========================================================
    // 2. FETCH PURCHASE HEADER
    // =========================================================

    const [purchaseData] = await connection.query(
      `
      SELECT
        pu.id,
        pu.Purchase_Id,
        pu.Bill_Number,
        pu.Bill_Date,
        pu.State_Of_Supply,
        pu.Total_Amount,
        pu.Total_Paid,
        pu.Balance_Due,
        pu.Party_Id,

        pu.Terms_Conditions_Id,
        pu.Terms_Conditions_Description,

        p.Party_Name,
        p.GSTIN,

        tc.Title AS Terms_Conditions_Title

      FROM add_purchase pu

      LEFT JOIN add_party p
        ON pu.Party_Id = p.Party_Id

      LEFT JOIN terms_conditions tc
        ON pu.Terms_Conditions_Id = tc.id

      WHERE pu.Purchase_Id = ?
      `,
      [purchaseId]
    );

    if (purchaseData.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found.",
      });
    }

    const purchaseHeader = purchaseData[0];

    // =========================================================
    // 3. FETCH PURCHASE ITEMS
    // =========================================================
    //
    // IMPORTANT:
    //
    // Unit information comes from add_purchase_items:
    //
    // Primary_Unit_Snapshot
    // Secondary_Unit_Snapshot
    // Selected_Unit
    //
    // We DO NOT use current add_item Primary/Secondary to
    // determine historical bill dropdown.
    //
    // =========================================================

    const [items] = await connection.query(
      `
     SELECT
  pi.Purchase_Items_Id,
  pi.Item_Id,

  i.Item_Name,
  i.Item_HSN,
  i.Item_Unit,
  i.Item_Category,

  -- CURRENT MASTER
  i.Primary_Unit AS Current_Primary_Unit,
  i.Secondary_Unit AS Current_Secondary_Unit,

  pi.Quantity,

  -- HISTORICAL SNAPSHOT
  pi.Primary_Unit_Snapshot,
  pi.Secondary_Unit_Snapshot,
  pi.Selected_Unit,

  pi.Purchase_Price,
  pi.Discount_On_Purchase_Price,
  pi.Discount_Type_On_Purchase_Price,
  pi.Tax_Amount,
  pi.Tax_Type,
  pi.Amount,
  pi.created_at

      FROM add_purchase_items pi

      LEFT JOIN add_item i
        ON pi.Item_Id = i.Item_Id

      WHERE pi.Purchase_Id = ?

      ORDER BY pi.created_at DESC
      `,
      [purchaseId]
    );

    // =========================================================
    // 4. FETCH ALL UNITS FROM UNIT MASTER
    // =========================================================
    //
    // Used ONLY when purchase item has NO unit snapshot.
    //
    // Example:
    //
    // Historical bill:
    //
    // Primary snapshot   = NULL
    // Secondary snapshot = NULL
    //
    // Then dropdown:
    //
    // None
    // Kg
    // Gm
    // Box
    // Pcs
    // ...
    //
    // =========================================================

    const [allUnits] = await connection.query(
      `
      SELECT
        Unit_Shorthand,
        Unit_Name
      FROM units
      ORDER BY Unit_Name ASC
      `
    );

    // =========================================================
    // 5. FORMAT PURCHASE ITEMS + AVAILABLE UNITS
    // =========================================================

    const formattedItems = items.map((it) => {
      let availableUnits = [];

      // =======================================================
      // CASE 1:
      // PURCHASE ROW HAS A UNIT SNAPSHOT
      // =======================================================
      //
      // Example:
      //
      // Historical:
      //
      // Primary   = Kg
      // Secondary = Gm
      //
      // Current item might now be:
      //
      // Primary   = Kg
      // Secondary = Box
      //
      // OLD BILL STILL SHOWS:
      //
      // Kg
      // Gm
      //
      // =======================================================

      // if (it.Primary_Unit_Snapshot) {
      //   const snapshotUnits = [
      //     it.Primary_Unit_Snapshot,
      //     it.Secondary_Unit_Snapshot,
      //   ].filter(Boolean);

      //   availableUnits = snapshotUnits.map(
      //     (unitCode) => {
      //       // Get full unit name from unit master if it
      //       // still exists there.
      //       const masterUnit = allUnits.find(
      //         (unit) =>
      //           unit.Unit_Shorthand === unitCode
      //       );

      //       return {
      //         Unit_Shorthand: unitCode,

      //         // If old unit was removed from master,
      //         // still preserve/display its shorthand.
      //         Unit_Name:
      //           masterUnit?.Unit_Name || unitCode,
      //       };
      //     }
      //   );
      // }

     

      // else {
      //   availableUnits = [
      //     {
      //       Unit_Shorthand: null,
      //       Unit_Name: "None",
      //     },

      //     ...allUnits.map((unit) => ({
      //       Unit_Shorthand:
      //         unit.Unit_Shorthand,

      //       Unit_Name:
      //         unit.Unit_Name,
      //     })),
      //   ];
      // }
// =======================================================
// DECIDE WHICH UNITS EDIT PURCHASE SHOULD SHOW
// =======================================================

const oldPrimary =
  it.Primary_Unit_Snapshot || null;

const oldSecondary =
  it.Secondary_Unit_Snapshot || null;

const oldSelected =
  it.Selected_Unit || null;

const currentPrimary =
  it.Current_Primary_Unit || null;

const currentSecondary =
  it.Current_Secondary_Unit || null;


// Did this OLD purchase actually use its secondary unit?
//
// Old snapshot: KG / GM
// Selected:     GM
//
// => TRUE
const oldUsedSecondary =
  oldSecondary &&
  oldSelected === oldSecondary;


let unitCodes = [];


// =======================================================
// CASE 1: OLD PURCHASE USED OLD SECONDARY
//
// Old snapshot  = KG / GM
// Old selected  = GM
// Current master = KG / BOX
//
// SHOW => KG / GM
// =======================================================

if (oldUsedSecondary) {

  unitCodes = [
    oldPrimary,
    oldSecondary,
  ].filter(Boolean);

}


// =======================================================
// CASE 2: OLD PURCHASE USED PRIMARY
//
// Old snapshot   = KG / GM
// Old selected   = KG
// Current master = KG / BOX
//
// SHOW => KG / BOX
//
// ALSO:
// Current master KG only
// => show KG only
// =======================================================

else {

  unitCodes = [
    currentPrimary,
    currentSecondary,
  ].filter(Boolean);

}


// Remove duplicates just in case
unitCodes = [...new Set(unitCodes)];


// =======================================================
// CREATE Available_Units FOR FRONTEND
// =======================================================

availableUnits = unitCodes.map((unitCode) => {

  const masterUnit = allUnits.find(
    (unit) =>
      unit.Unit_Shorthand === unitCode
  );

  return {
    Unit_Shorthand: unitCode,
    Unit_Name:
      masterUnit?.Unit_Name || unitCode,
  };
});
      // =======================================================
      // RETURN FORMATTED ITEM
      // =======================================================

      return {
        Purchase_Items_Id:
          it.Purchase_Items_Id,

        Item_Id:
          it.Item_Id,

        Item_Name:
          it.Item_Name,

        Item_HSN:
          it.Item_HSN,

        // Keep legacy column for old application data
        Item_Unit:
          it.Item_Unit,

        Item_Category:
          it.Item_Category,

        Quantity:
          it.Quantity,

        // =====================================================
        // UNIT DATA
        // =====================================================

        Primary_Unit:
          it.Primary_Unit_Snapshot,

        Secondary_Unit:
          it.Secondary_Unit_Snapshot,

        // ONE unit selected by user for this bill row
        Selected_Unit:
          it.Selected_Unit,

        // Units frontend should show in edit dropdown
        Available_Units:
          availableUnits,

        // =====================================================
        // PRICE / TAX
        // =====================================================

        Purchase_Price:
          it.Purchase_Price,

        Discount_On_Purchase_Price:
          it.Discount_On_Purchase_Price,

        Discount_Type_On_Purchase_Price:
          it.Discount_Type_On_Purchase_Price,

        Tax_Amount:
          it.Tax_Amount,

        Tax_Type:
          it.Tax_Type,

        Amount:
          it.Amount,

        created_at:
          it.created_at,
      };
    });

    // =========================================================
    // 6. FETCH PAYMENT SPLITS
    // =========================================================

    const [splits] = await connection.query(
      `
      SELECT
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

      LEFT JOIN bank_accounts ba
        ON ba.id = ps.Bank_Account_Id

      WHERE
        ps.Source_Type = 'Purchase'
        AND ps.Source_Id = ?

      ORDER BY ps.id ASC
      `,
      [purchaseHeader.id]
    );

    // =========================================================
    // 7. PAYMENT DISPLAY
    // =========================================================

    const splitSummary =
      splits
        .map((s) => s.Payment_Type_Display)
        .join(" + ") || "—";

    // =========================================================
    // 8. RESPONSE
    // =========================================================

    return res.status(200).json({
      success: true,

      // =======================================================
      // PURCHASE HEADER
      // =======================================================

      billPurchaseDetails: {
        Purchase_Id:
          purchaseHeader.Purchase_Id,

        Party_Name:
          purchaseHeader.Party_Name,

        GSTIN:
          purchaseHeader.GSTIN,

        State_Of_Supply:
          purchaseHeader.State_Of_Supply,

        Bill_Number:
          purchaseHeader.Bill_Number,

        Bill_Date:
          purchaseHeader.Bill_Date,

        Total_Amount:
          purchaseHeader.Total_Amount,

        Total_Paid:
          purchaseHeader.Total_Paid,

        Balance_Due: purchaseHeader.Balance_Due,

        Billing_Address: purchaseHeader.Billing_Address,

        Shipping_Address:purchaseHeader.Shipping_Address,

        Payment_Type_Display:splitSummary,

        Terms_Conditions_Id: purchaseHeader.Terms_Conditions_Id,

        Terms_Conditions_Description: purchaseHeader.Terms_Conditions_Description,

        Terms_Conditions_Title: purchaseHeader.Terms_Conditions_Title,
      },

      // =======================================================
      // PAYMENT SPLITS
      // =======================================================

      splits: splits.map((s) => ({
        id: s.id,

        Payment_Type: s.Payment_Type,

        Bank_Account_Id: s.Bank_Account_Id,

        Account_Display_Name: s.Account_Display_Name,

        Payment_Type_Display: s.Payment_Type_Display,

        Reference_Number: s.Reference_Number,

        Amount: s.Amount,
      })),

      // =======================================================
      // PURCHASE ITEMS
      // =======================================================

      items: formattedItems,
    });
  } catch (err) {
    console.error(
      "❌ Error getting single purchase:",
      err
    );

    next(err);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};


const getTotalPurchasesEachDay = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();

    // 1️⃣ Get purchase count per day for all records
    const [rows] = await connection.query(
      `
      SELECT 
        DATE_FORMAT(Bill_Date, '%Y-%m-%d') AS purchase_date,
        COUNT(*) AS total_purchases
      FROM add_purchase
      GROUP BY DATE_FORMAT(Bill_Date, '%Y-%m-%d')
      ORDER BY purchase_date ASC;
      `
    );

    // 2️⃣ Format output
    const result = rows.map((r) => ({
      date: r.purchase_date,
      total_purchases: r.total_purchases,
    }));

    return res.status(200).json({
      success: true,
      financialYear: null, // kept same key but no FY filter
      data: result,
    });
  } catch (err) {
    console.error("❌ Error getting total purchases each day:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

const uploadBillAndCreatePurchase = async (req, res, next) => {

  try {

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Invoice image required"
      });
    }

    // 1️⃣ compress image
    const imagePath = await compressAndSavePurchaseBill(req.file);

    // 2️⃣ AI extract
    const parsedData = await extractInvoiceWithAI(imagePath);

    console.log("AI PARSED DATA:", parsedData);

    // 3️⃣ return to frontend
    return res.json({
      success: true,
      data: parsedData
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

};
export {
  addPurchase, editPurchase, getSinglePurchase, getAllPurchases, exportAllPurchasesReportToExcel, getTotalPurchasesEachDay,

  uploadBillAndCreatePurchase
};



//   let connection;
//   try {
//     connection = await db.getConnection();

//     // 1️⃣ Get active financial year
//     const [fy] = await connection.query(
//       `SELECT Financial_Year
//        FROM financial_year
//        WHERE Current_Financial_Year = 1
//        LIMIT 1`
//     );

//     if (!fy.length) {
//       return res.status(400).json({
//         success: false,
//         message: "No active financial year found.",
//       });
//     }

//     const activeFY = fy[0].Financial_Year;

//     // 2️⃣ Get purchase count per day inside financial year
//     const [rows] = await connection.query(
//       `
//       SELECT
//         DATE_FORMAT(Bill_Date, '%Y-%m-%d') AS purchase_date,
//         COUNT(*) AS total_purchases
//       FROM add_purchase
//       WHERE Financial_Year = ?
//       GROUP BY DATE_FORMAT(Bill_Date, '%Y-%m-%d')
//       ORDER BY purchase_date ASC;
//       `,
//       [activeFY]
//     );

//     // 3️⃣ Format output
//     const result = rows.map((r) => ({
//       date: r.purchase_date,
//       total_purchases: r.total_purchases,
//     }));

//     return res.status(200).json({
//       success: true,
//       financialYear: activeFY,
//       data: result,
//     });
//   } catch (err) {
//     if (connection) connection.release();
//     console.error("❌ Error getting total purchases each day:", err);
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };

// const editPurchase = async (req, res, next) => {
//   let connection;
//   try {
//     const { Purchase_Id: purchaseId } = req.params;

//     connection = await db.getConnection();
//     await connection.beginTransaction();

//     const [existingPurchase] = await connection.query(
//       "SELECT * FROM add_purchase WHERE Purchase_Id = ?",
//       [purchaseId]
//     );
//     if (existingPurchase.length === 0) {
//       return res.status(404).json({ message: "No such Purchase found." });
//     }
//     const purchaseIdNumber = existingPurchase[0].id;

//     console.log(req.body);

//     const cleanData = sanitizeObject(req.body);
//     const validation = purchaseSchema.safeParse(cleanData);
//     if (!validation.success) {
//       await connection.rollback();
//       return res.status(400).json({ errors: validation.error.errors });
//     }

//     const {
//       Party_Name,
//       GSTIN,
//       Bill_Number,
//       Bill_Date,
//       State_Of_Supply,
//       Total_Amount,
//       Total_Paid,
//       Balance_Due,
//       //Reference_Number,
//       splits,   // 🔹 replaces single Payment_Type / Bank_Account_Id
//       items,
//       // Terms & Conditions
//       Terms_Conditions_Id,
//       Terms_Conditions_Description
//     } = validation.data;





//     let termsId = null;
//     let termsDescription = null;

//     if (
//       Terms_Conditions_Id &&
//       Terms_Conditions_Description?.trim()
//     ) {
//       // Saved template selected and untouched
//       termsId = Number(Terms_Conditions_Id);
//       termsDescription =
//         Terms_Conditions_Description.trim();

//     } else if (Terms_Conditions_Description?.trim()) {
//       // Custom / edited description
//       termsId = null;
//       termsDescription =
//         Terms_Conditions_Description.trim();
//     }
//     if (termsId) {
//       const [[selectedTerm]] = await connection.query(
//         `SELECT id
//      FROM terms_conditions
//      WHERE id = ?
//        AND Purchase_Bill = 1
//      LIMIT 1`,
//         [termsId]
//       );

//       if (!selectedTerm) {
//         await connection.rollback();

//         return res.status(400).json({
//           success: false,
//           message:
//             "Invalid Terms & Conditions for Purchase Bill.",
//         });
//       }
//     }
//     const normalizedSplits = (splits || []).map((s) => ({ ...s, Amount: Number(s.Amount) || 0 }));

//     const firstValidIndex = normalizedSplits.findIndex((s) => {
//       if (!s.Payment_Type) return false;
//       if (s.Payment_Type === "Bank" && !s.Bank_Account_Id) return false;
//       return true;
//     });

//     const validSplits = normalizedSplits.reduce((acc, s, index) => {
//       if (!s.Payment_Type) return acc;
//       if (s.Payment_Type === "Bank" && !s.Bank_Account_Id) return acc;
//       if (s.Amount > 0) { acc.push(s); return acc; }
//       if (index === firstValidIndex) acc.push({ ...s, Amount: 0 });
//       return acc;
//     }, []);

//     const totalAmount = Number(Total_Amount) || 0;
//     const totalPaid = validSplits.reduce((sum, s) => sum + (Number(s.Amount) || 0), 0);
//     const balanceDue = totalAmount - totalPaid;


//     // 🔹 total paid cannot exceed total amount
//     if (totalPaid > totalAmount) {
//       await connection.rollback();
//       return res.status(400).json({
//         success: false,
//         message: "Received amount should be less than or equal to Total Amount",
//       });
//     }

//     // 🔹 validate splits sum === totalPaid
//     if (totalPaid > 0) {
//       try {
//         validateSplits(validSplits, totalPaid);
//       } catch (validationErr) {
//         await connection.rollback();
//         return res.status(400).json({ success: false, message: validationErr.message });
//       }
//     }




//     const [partyRows] = await connection.query(
//       "SELECT Party_Id FROM add_party WHERE Party_Name = ? LIMIT 1",
//       [Party_Name]
//     );
//     if (partyRows.length === 0) {
//       await connection.rollback();
//       return res.status(404).json({ message: "Party not found." });
//     }
//     const Party_Id = partyRows[0].Party_Id;

//     // update parent row — no Payment_Type / Bank_Account_Id columns anymore
//     // await connection.query(
//     //   `UPDATE add_purchase SET
//     //      Party_Id = ?, Bill_Number = ?, Bill_Date = ?, State_Of_Supply = ?,
//     //      Total_Amount = ?, Total_Paid = ?, Balance_Due = ?,
//     //       updated_at = NOW()
//     //    WHERE Purchase_Id = ?`,
//     //   [
//     //     Party_Id,
//     //     Bill_Number,
//     //     Bill_Date,
//     //     cleanValue(State_Of_Supply),
//     //     totalAmount,
//     //     totalPaid,
//     //     balanceDue,

//     //     purchaseId,
//     //   ]
//     // );
//     await connection.query(
//       `UPDATE add_purchase SET
//      Party_Id = ?,
//      Bill_Number = ?,
//      Bill_Date = ?,
//      State_Of_Supply = ?,
//      Total_Amount = ?,
//      Total_Paid = ?,
//      Balance_Due = ?,

//      Terms_Conditions_Id = ?,
//      Terms_Conditions_Description = ?,

//      updated_at = NOW()

//    WHERE Purchase_Id = ?`,
//       [
//         Party_Id,
//         Bill_Number,
//         Bill_Date,
//         cleanValue(State_Of_Supply),

//         totalAmount,
//         totalPaid,
//         balanceDue,

//         // Terms & Conditions
//         termsId,
//         termsDescription,

//         purchaseId,
//       ]
//     );
//     await connection.query(
//       `UPDATE purchase_return
//    SET
//       Bill_Number = ?,
//       Bill_Date = ?,
//       updated_at = NOW()
//    WHERE Purchase_Id = ?`,
//       [
//         Bill_Number,
//         Bill_Date,
//         purchaseId
//       ]
//     );
//     // 🔹 wipe old splits + ledger rows, re-insert fresh ones
//     await deletePaymentSplits({
//       connection,
//       sourceType: "Purchase",
//       sourceId: purchaseIdNumber,
//     });

//     if (validSplits.length > 0) {
//       await insertPaymentSplits({
//         connection,
//         sourceType: "Purchase",
//         sourceId: purchaseIdNumber,
//         partyName: Party_Name,
//         txnDate: Bill_Date,
//         splits: validSplits,
//       });
//     }
//     await recordPartyLedger({
//       connection,
//       partyId: Party_Id,
//       txnType: "Purchase",
//       referenceId: purchaseIdNumber,
//       amount: totalAmount,
//       txnDate: Bill_Date,
//       docNumber: Bill_Number,
//       balanceDue: balanceDue,
//     });

//     const [oldItems] = await connection.query(
//       "SELECT * FROM add_purchase_items WHERE Purchase_Id = ?",
//       [purchaseId]
//     );

//     // Step 1: resolve every line to its Item_Id (create new items if needed, sync HSN if changed)
//     const resolvedLines = [];
//     for (const item of items) {
//       const { Item_Name, Item_Category, Item_HSN, Item_Unit, Quantity } = item;
//       if (!Item_Name?.trim()) {

//         // Only Amount > 0 makes Item_Name mandatory
//         if ((normalizeNumber(item.Amount) ?? 0) > 0) {
//           await connection.rollback();

//           return res.status(400).json({
//             success: false,
//             message: "Please enter an item name for the row.",
//           });
//         }

//         // Amount blank / 0 + no Item_Name
//         // Treat as empty placeholder row
//         continue;
//       }
//       let Item_Id = item.Item_Id || null;
//       let dbItemRow = null;

//       if (Item_Id) {
//         const [rows] = await connection.query("SELECT * FROM add_item WHERE Item_Id = ? LIMIT 1", [Item_Id]);
//         dbItemRow = rows[0] || null;
//       } else {
//         const [rows] = await connection.query(
//           "SELECT * FROM add_item WHERE TRIM(Item_Name) = TRIM(?) LIMIT 1",
//           [item.Item_Name]
//         );
//         // const [rows] = await connection.query("SELECT * FROM add_item WHERE Item_Name = ? LIMIT 1", [Item_Name]);
//         dbItemRow = rows[0] || null;

//         //  THIS WAS MISSING
//         Item_Id = dbItemRow?.Item_Id || null;
//         //dbItemRow = { Item_Id, Item_HSN: item.Item_HSN };
//       }

//       if (!dbItemRow) {
//         const [maxRow] = await connection.query(
//           `SELECT MAX(CAST(SUBSTRING(Item_Id, 4) AS UNSIGNED)) AS maxId FROM add_item WHERE Item_Id LIKE 'ITM%'`
//         );
//         const autoId = (maxRow[0]?.maxId || 0) + 1;
//         Item_Id = "ITM" + autoId.toString().padStart(3, "0");

//         await connection.execute(
//           `INSERT INTO add_item
//        (Item_Id, Item_Name, Item_Category, Item_HSN, Item_Unit,
//         Stock_Quantity, created_at, updated_at)
//        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
//           [Item_Id, Item_Name, Item_Category || "", cleanValue(Item_HSN), Item_Unit || "", 0]
//         );
//         dbItemRow = { Item_Id, Item_HSN: item.Item_HSN };
//       }
//       else {


//         const updates = [];
//         const params = [];

//         if (Item_HSN && Item_HSN !== dbItemRow.Item_HSN) {
//           updates.push("Item_HSN = ?");
//           params.push(Item_HSN);
//         }

//         if (Item_Category !== undefined && Item_Category !== dbItemRow.Item_Category) {
//           updates.push("Item_Category = ?");
//           params.push(Item_Category || "");
//         }

//         if (updates.length > 0) {
//           params.push(Item_Id);
//           await connection.query(
//             `UPDATE add_item SET ${updates.join(", ")}, updated_at = NOW() WHERE Item_Id = ?`,
//             params
//           );
//         }
//       }

//       // else if (Item_HSN && Item_HSN !== dbItemRow.Item_HSN) {
//       //   await connection.query(
//       //     `UPDATE add_item SET Item_HSN = ?,Item_Category = ?, updated_at = NOW() WHERE Item_Id = ?`,
//       //     [Item_HSN, Item_Category || "", Item_Id]
//       //   );
//       // }

//       resolvedLines.push({ ...item, Item_Id });
//     }

//     // Step 2: net stock delta per Item_Id — purchase adds stock, so diff is applied as "+"
//     const newQtyByItem = new Map();
//     for (const line of resolvedLines) {
//       newQtyByItem.set(line.Item_Id, (newQtyByItem.get(line.Item_Id) || 0) + normalizeNumber(line.Quantity));
//     }
//     const oldQtyByItem = new Map();
//     oldItems.forEach((o) => {
//       oldQtyByItem.set(o.Item_Id, (oldQtyByItem.get(o.Item_Id) || 0) + Number(o.Quantity));
//     });

//     const allItemIds = new Set([...newQtyByItem.keys(), ...oldQtyByItem.keys()]);
//     for (const itemId of allItemIds) {
//       const newQty = newQtyByItem.get(itemId) || 0;
//       const oldQty = oldQtyByItem.get(itemId) || 0;
//       const diff = newQty - oldQty;
//       if (diff !== 0) {
//         await connection.query(
//           `UPDATE add_item SET Stock_Quantity = Stock_Quantity + ?, updated_at = NOW() WHERE Item_Id = ?`,
//           [diff, itemId]
//         );
//       }
//     }

//     // Step 3: delete old purchase_items rows, reinsert fresh (repeats-safe)
//     await connection.query(`DELETE FROM add_purchase_items WHERE Purchase_Id = ?`, [purchaseId]);

//     for (const line of resolvedLines) {
//       const [insertRes] = await connection.execute(
//         `INSERT INTO add_purchase_items
//      (Purchase_Id, Item_Id, Quantity, Purchase_Price,
//       Discount_On_Purchase_Price, Discount_Type_On_Purchase_Price,
//       Tax_Type, Tax_Amount, Amount, created_at, updated_at)
//      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
//         [
//           purchaseId,
//           line.Item_Id,
//           normalizeNumber(line.Quantity) ?? 0,
//           normalizeNumber(line.Purchase_Price) ?? 0,

//           cleanDiscount(line.Discount_On_Purchase_Price),
//           cleanValue(line.Discount_Type_On_Purchase_Price),
//           cleanValue(line.Tax_Type),
//           normalizeNumber(line.Tax_Amount) ?? 0,
//           normalizeNumber(line.Amount) ?? 0
//         ]
//       );
//       const id = insertRes.insertId;
//       await connection.execute(
//         `UPDATE add_purchase_items SET Purchase_items_Id = ? WHERE id = ?`,
//         ["PIT" + id.toString().padStart(3, "0"), id]
//       );
//       // ✅ INSIDE the loop
//   await recordItemLedger({
//     connection,
//     itemId:      line.Item_Id,
//     txnType:     "Purchase",
//     referenceId: id,
//     formattedId: purchaseId,         // existing "PUR001"
//     partyName:   Party_Name,
//     quantity:    normalizeNumber(line.Quantity) ?? 0,
//     rate:        normalizeNumber(line.Purchase_Price) ?? null,
//     txnDate:     Bill_Date,
//   });
//     }

//     // delete removed items + reverse their stock — unchanged, still correct
//     // for (const old of oldItems) {
//     //   if (![...newQtyByItem.keys()].includes(old.Item_Id)) {
//     //     await connection.query(`DELETE FROM add_purchase_items WHERE Purchase_items_Id = ?`, [old.Purchase_items_Id]);
//     //     await connection.query(
//     //       `UPDATE add_item SET Stock_Quantity = Stock_Quantity - ?, updated_at = NOW() WHERE Item_Id = ?`,
//     //       [old.Quantity, old.Item_Id]
//     //     );
//     //   }
//     // }
// // for (const old of oldItems) {
// //   if (![...newQtyByItem.keys()].includes(old.Item_Id)) {
// //     await connection.query(
// //       `DELETE FROM add_purchase_items WHERE Purchase_items_Id = ?`,
// //       [old.Purchase_items_Id]
// //     );
// //     await connection.query(
// //       `UPDATE add_item SET Stock_Quantity = Stock_Quantity - ?, updated_at = NOW() WHERE Item_Id = ?`,
// //       [old.Quantity, old.Item_Id]
// //     );
// //     // ✅ reverse the old item ledger row
// //     await recordItemLedger({
// //       connection,
// //       itemId:      old.Item_Id,
// //       txnType:     "Purchase",
// //       referenceId: old.id,          // the old purchase_items.id
// //       formattedId: purchaseId,
// //       partyName:   Party_Name,
// //       quantity:    -Number(old.Quantity), // negative = reversal
// //       rate:        Number(old.Purchase_Price) ?? null,
// //       txnDate:     Bill_Date,
// //     });
// //   }
// // }
// // ── BEFORE deleting purchase_items ──
// // Reverse ALL old item ledger rows using old ids (still valid)
// for (const old of oldItems) {
//   await reverseItemLedger({
//     connection,
//     itemId:      old.Item_Id,
//     txnType:     "Purchase",
//     referenceId: old.id,
//   });
// }

// // Step 3: delete all old rows, reinsert fresh
// await connection.query(`DELETE FROM add_purchase_items WHERE Purchase_Id = ?`, [purchaseId]);

// for (const line of resolvedLines) {
//   const [insertRes] = await connection.execute(`INSERT INTO add_purchase_items ...`);
//   const id = insertRes.insertId;

//   await connection.execute(
//     `UPDATE add_purchase_items SET Purchase_items_Id = ? WHERE id = ?`,
//     ["PIT" + id.toString().padStart(3, "0"), id]
//   );

//   await recordItemLedger({
//     connection,
//     itemId:      line.Item_Id,
//     txnType:     "Purchase",
//     referenceId: id,
//     formattedId: purchaseId,
//     partyName:   Party_Name,
//     quantity:    normalizeNumber(line.Quantity) ?? 0,
//     rate:        normalizeNumber(line.Purchase_Price) ?? null,
//     txnDate:     Bill_Date,
//   });
// }

// // ── NO second loop at all ──
// // Stock delta already handled by Step 2.
// // Ledger reversal already done above before Step 3.
    

//     await connection.commit();

//     return res.status(200).json({
//       success: true,
//       message: "Purchase updated successfully",
//       purchaseId,
//     });
//   } catch (err) {
//     if (connection) await connection.rollback();
//     console.error("❌ Error editing purchase:", err);
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };