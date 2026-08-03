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



// const addPurchase = async (req, res, next) => {
//   let connection;
//   try {
//     connection = await db.getConnection();
//     await connection.beginTransaction();

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
//     } = validation.data;

//     if (
//       !Party_Name ||
//       !Bill_Number ||
//       !Bill_Date ||
//       // !State_Of_Supply ||
//       !Array.isArray(items) ||
//       items.length === 0
//     ) {
//       await connection.rollback();
//       return res.status(400).json({ message: "Star marked fields missing or items empty." });
//     }

//     const totalAmount = Number(Total_Amount) || 0;
//     const totalPaid = Total_Paid === "" || Total_Paid === undefined ? 0 : Number(Total_Paid);
//     const balanceDue = Balance_Due === "" || Balance_Due === undefined
//       ? totalAmount - totalPaid
//       : Number(Balance_Due);

//     // 🔹 total paid cannot exceed total amount
//     if (totalPaid > totalAmount) {
//       await connection.rollback();
//       return res.status(400).json({
//         success: false,
//         message: "Received amount should be less than or equal to Total Amount",
//       });
//     }

//     // 🔹 validate splits — sum must equal totalPaid
//     if (totalPaid > 0) {
//       try {
//         validateSplits(splits, totalPaid);
//       } catch (validationErr) {
//         await connection.rollback();
//         return res.status(400).json({ success: false, message: validationErr.message });
//       }
//     }

//     // duplicate item check
//     // const itemNameSet = new Set();
//     // for (const item of items) {
//     //   const itemName = item.Item_Name?.trim().toLowerCase();
//     //   if (!itemName) {
//     //     await connection.rollback();
//     //     return res.status(400).json({ message: "Item name missing." });
//     //   }
//     //   if (itemNameSet.has(itemName)) {
//     //     await connection.rollback();
//     //     return res.status(400).json({
//     //       message: `Duplicate item detected: '${item.Item_Name}'. Each item must appear only once.`,
//     //     });
//     //   }
//     //   itemNameSet.add(itemName);
//     // }
//     for (const item of items) {
//       if (!item.Item_Name?.trim()) {
//         await connection.rollback();
//         return res.status(400).json({
//           message: "Item name missing.",
//         });
//       }
//     }
//     const [partyRows] = await connection.execute(
//       "SELECT Party_Id, GSTIN FROM add_party WHERE Party_Name = ? LIMIT 1",
//       [Party_Name]
//     );
//     if (partyRows.length === 0) {
//       await connection.rollback();
//       return res.status(404).json({ message: "Party not found." });
//     }
//     const Party_Id = partyRows[0].Party_Id;

//     const [fy] = await connection.query(
//       `SELECT Financial_Year FROM financial_year WHERE Current_Financial_Year = 1 LIMIT 1`
//     );
//     if (fy.length === 0) {
//       await connection.rollback();
//       return res.status(400).json({ message: "No active financial year found. Please set one in settings." });
//     }
//     const activeFY = fy[0].Financial_Year;

//     // 🔹 Payment_Type on parent = comma-joined summary for display only (optional)
//     // or just leave it NULL — the real source of truth is payment_splits
//     const [purchaseResult] = await connection.execute(
//       `INSERT INTO add_purchase
//        (Party_Id, Bill_Number, Bill_Date, financial_year, State_Of_Supply,
//         Total_Amount, Total_Paid, Balance_Due, 
//         created_at, updated_at)
//        VALUES (?, ?, ?, ?, ?, ?, ?, ?,  NOW(), NOW())`,
//       [
//         Party_Id,
//         Bill_Number,
//         Bill_Date,
//         activeFY,
//         cleanValue(State_Of_Supply),
//         totalAmount,
//         totalPaid,
//         balanceDue

//       ]
//     );

//     const purchaseIdNumber = purchaseResult.insertId;
//     const newPurchaseId = "PUR" + purchaseIdNumber.toString().padStart(3, "0");

//     await connection.execute(
//       `UPDATE add_purchase SET Purchase_Id = ? WHERE id = ?`,
//       [newPurchaseId, purchaseIdNumber]
//     );

//     // 🔹 insert splits + fan out to bank/cash ledgers
//     if (totalPaid > 0 && Array.isArray(splits) && splits.length > 0) {
//       await insertPaymentSplits({
//         connection,
//         sourceType: "Purchase",
//         sourceId: purchaseIdNumber,
//         partyName: Party_Name,
//         txnDate: Bill_Date,
//         splits,
//       });
//     }

//     await recordPartyLedger({
//   connection,
//   partyId: Party_Id,
//   txnType: "Purchase",
//   referenceId: purchaseIdNumber,
//   amount: totalAmount,
//   txnDate: Bill_Date,
//   docNumber: Bill_Number,     // 🔹 new
//   balanceDue: balanceDue,     // 🔹 new
// });

//     // items loop — unchanged
//     for (const item of items) {
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

//       // const [itemRows] = await connection.execute(
//       //   "SELECT * FROM add_item WHERE Item_Name = ? LIMIT 1",
//       //   [Item_Name]
//       // );
//       const [itemRows] = await connection.execute(
//         "SELECT * FROM add_item WHERE TRIM(Item_Name) = TRIM(?)) LIMIT 1",
//         [Item_Name]
//       );

//       let Item_Id;

//       if (itemRows.length === 0) {
//         const [itemResult] = await connection.execute(
//           `INSERT INTO add_item
//            (Item_Name, Item_HSN, Item_Unit, Item_Image, Item_Category, Stock_Quantity, created_at, updated_at)
//            VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
//           [
//             Item_Name,
//             Item_HSN || "",
//             Item_Unit || "",
//             cleanValue(Item_Image),
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
//    SET Stock_Quantity = Stock_Quantity + ?,
//        Item_HSN = ?,
//        updated_at = NOW()
//    WHERE Item_Id = ?`,
//           [normalizeNumber(Quantity), cleanValue(Item_HSN) || itemRows[0].Item_HSN, Item_Id]
//         );
//         //     await connection.execute(
//         //   `UPDATE add_item
//         //    SET Stock_Quantity = Stock_Quantity - ?,
//         //        Item_HSN = ?,
//         //        updated_at = NOW()
//         //    WHERE Item_Id = ?`,
//         //   [
//         //     normalizeNumber(Quantity),
//         //     cleanValue(Item_HSN) || itemRows[0].Item_HSN,
//         //     Item_Id,
//         //   ]
//         // );
//         // await connection.execute(
//         //   `UPDATE add_item SET Stock_Quantity = Stock_Quantity + ?, updated_at = NOW() WHERE Item_Id = ?`,
//         //   [normalizeNumber(Quantity), Item_Id]
//         // );
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
//           normalizeNumber(Quantity),
//           normalizeNumber(Purchase_Price),
//           cleanDiscount(Discount_On_Purchase_Price),
//           cleanValue(Discount_Type_On_Purchase_Price),
//           cleanValue(Tax_Type),
//           normalizeNumber(Tax_Amount),
//           normalizeNumber(Amount),
//         ]
//       );
//       const pitId = pitResult.insertId;
//       const newPurchaseItemId = "PIT" + pitId.toString().padStart(3, "0");
//       await connection.execute(
//         `UPDATE add_purchase_items SET Purchase_items_Id = ? WHERE id = ?`,
//         [newPurchaseItemId, pitId]
//       );
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
//only amount >0 needs to have an item name why please expalin ?

// Because Amount is the one field that represents actual money at stake//
const addPurchase = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    //console.log(req.body);

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
      splits,   // 🔹 replaces single Payment_Type / Bank_Account_Id
      items,
    } = validation.data;

    // 🔻 REMOVED: manual !Party_Name / !Bill_Number / !Bill_Date / items.length===0 check
    //    — Party_Name is enforced by the schema (min(1)); Bill_Number, Bill_Date presence-shape,
    //      and items being an empty array are all now legitimately allowed by the schema itself,
    //      so re-checking them here would just re-impose the old strict rules the schema
    //      was changed to relax. safeParse() above is the single source of truth now.




    // 🔹 validate splits — sum must equal totalPaid
    // if (totalPaid > 0) {
    //   try {
    //     validateSplits(splits, totalPaid);
    //   } catch (validationErr) {
    //     await connection.rollback();
    //     return res.status(400).json({ success: false, message: validationErr.message });
    //   }
    // }
    // 🔹 silently drop splits with no real amount — don't reject, just don't use them
    // const validSplits = (splits || []).filter(
    //   (s) => s.Payment_Type && Number(s.Amount) > 0
    // );
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

    // 🔹 total paid cannot exceed total amount
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



    // 🔻 REMOVED: per-item "Item name missing" loop check
    //    — Item_Name is now optional().default("") in the schema (blank rows are legitimately
    //      allowed to be submitted/skipped), so this loop was re-imposing a requirement the
    //      schema intentionally dropped. If you need to *skip* blank rows during insert rather
    //      than accept them, filter items below instead of validating/rejecting here:
    //      const itemsToInsert = items.filter((item) => item.Item_Name?.trim());

    const [partyRows] = await connection.execute(
      "SELECT Party_Id, GSTIN FROM add_party WHERE Party_Name = ? LIMIT 1",
      [Party_Name]
    );
    if (partyRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Party not found." });
    }
    const Party_Id = partyRows[0].Party_Id;

    const [fy] = await connection.query(
      `SELECT Financial_Year FROM financial_year WHERE Current_Financial_Year = 1 LIMIT 1`
    );
    if (fy.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: "No active financial year found. Please set one in settings." });
    }
    const activeFY = fy[0].Financial_Year;

    const [purchaseResult] = await connection.execute(
      `INSERT INTO add_purchase
       (Party_Id, Bill_Number, Bill_Date, financial_year, State_Of_Supply,
        Total_Amount, Total_Paid, Balance_Due,
        created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?,  NOW(), NOW())`,
      [
        Party_Id,
        Bill_Number,
        Bill_Date,
        activeFY,
        cleanValue(State_Of_Supply),
        totalAmount,
        totalPaid,
        balanceDue
      ]
    );

    const purchaseIdNumber = purchaseResult.insertId;
    const newPurchaseId = "PUR" + purchaseIdNumber.toString().padStart(3, "0");

    await connection.execute(
      `UPDATE add_purchase SET Purchase_Id = ? WHERE id = ?`,
      [newPurchaseId, purchaseIdNumber]
    );
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
    // 🔹 insert splits + fan out to bank/cash ledgers
    //     if (totalPaid > 0 && validSplits.length > 0) {
    //   await insertPaymentSplits({
    //     connection,
    //     sourceType: "Purchase",
    //     sourceId: purchaseIdNumber,
    //     partyName: Party_Name,
    //     txnDate: Bill_Date,
    //     splits: validSplits,   // 🔹 use the filtered array here
    //   });
    // }
    // if (totalPaid > 0 && Array.isArray(splits) && splits.length > 0) {
    //   await insertPaymentSplits({
    //     connection,
    //     sourceType: "Purchase",
    //     sourceId: purchaseIdNumber,
    //     partyName: Party_Name,
    //     txnDate: Bill_Date,
    //     splits,
    //   });
    // }

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

    // items loop — unchanged, now naturally handles an empty items array (no-op loop)
    for (const item of items) {
      if (!item.Item_Name?.trim()) {
        if ((normalizeNumber(item.Amount) ?? 0) > 0) {
          await connection.rollback();
          return res.status(400).json({ success: false, message: "Please enter an item name for the row." });
        }
        continue;
      }

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

      const [itemRows] = await connection.execute(
        "SELECT * FROM add_item WHERE TRIM(Item_Name) = TRIM(?) LIMIT 1",
        [Item_Name]
      );

      let Item_Id;

      if (itemRows.length === 0) {
        const [itemResult] = await connection.execute(
          `INSERT INTO add_item
           (Item_Name, Item_HSN, Item_Unit, Item_Category, Stock_Quantity, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?,  NOW(), NOW())`,
          [
            Item_Name,
            cleanValue(Item_HSN),
            Item_Unit || "",

            Item_Category || "",
            normalizeNumber(Quantity),
          ]
        );
        const itemIdNum = itemResult.insertId;
        Item_Id = "ITM" + itemIdNum.toString().padStart(3, "0");
        await connection.execute(
          `UPDATE add_item SET Item_Id = ? WHERE id = ?`,
          [Item_Id, itemIdNum]
        );
      } else {
        Item_Id = itemRows[0].Item_Id;
        await connection.execute(
          `UPDATE add_item
           SET Stock_Quantity = Stock_Quantity + ?,
               Item_HSN = ?,
               Item_Category = ?,
               updated_at = NOW()
           WHERE Item_Id = ?`,
          [normalizeNumber(Quantity), cleanValue(Item_HSN) || itemRows[0].Item_HSN, Item_Category || "", Item_Id]
        );
      }

      const [pitResult] = await connection.execute(
        `INSERT INTO add_purchase_items
         (Purchase_Id, Item_Id, Quantity, Purchase_Price,
          Discount_On_Purchase_Price, Discount_Type_On_Purchase_Price,
          Tax_Type, Tax_Amount, Amount, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
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
        ]
      );
      const pitId = pitResult.insertId;
      const newPurchaseItemId = "PIT" + pitId.toString().padStart(3, "0");
      await connection.execute(
        `UPDATE add_purchase_items SET Purchase_items_Id = ? WHERE id = ?`,
        [newPurchaseItemId, pitId]
      );
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

    console.log(req.body);

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
      //Reference_Number,
      splits,   // 🔹 replaces single Payment_Type / Bank_Account_Id
      items,
    } = validation.data;





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


    // 🔹 total paid cannot exceed total amount
    if (totalPaid > totalAmount) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Received amount should be less than or equal to Total Amount",
      });
    }

    // 🔹 validate splits sum === totalPaid
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

    // update parent row — no Payment_Type / Bank_Account_Id columns anymore
    await connection.query(
      `UPDATE add_purchase SET
         Party_Id = ?, Bill_Number = ?, Bill_Date = ?, State_Of_Supply = ?,
         Total_Amount = ?, Total_Paid = ?, Balance_Due = ?,
          updated_at = NOW()
       WHERE Purchase_Id = ?`,
      [
        Party_Id,
        Bill_Number,
        Bill_Date,
        cleanValue(State_Of_Supply),
        totalAmount,
        totalPaid,
        balanceDue,

        purchaseId,
      ]
    );
    await connection.query(
      `UPDATE purchase_return
   SET
      Bill_Number = ?,
      Bill_Date = ?,
      updated_at = NOW()
   WHERE Purchase_Id = ?`,
      [
        Bill_Number,
        Bill_Date,
        purchaseId
      ]
    );
    // 🔹 wipe old splits + ledger rows, re-insert fresh ones
    await deletePaymentSplits({
      connection,
      sourceType: "Purchase",
      sourceId: purchaseIdNumber,
    });

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

    // Step 1: resolve every line to its Item_Id (create new items if needed, sync HSN if changed)
    const resolvedLines = [];
    for (const item of items) {
      const { Item_Name, Item_Category, Item_HSN, Item_Unit, Quantity } = item;
      if (!Item_Name?.trim()) {

        // Only Amount > 0 makes Item_Name mandatory
        if ((normalizeNumber(item.Amount) ?? 0) > 0) {
          await connection.rollback();

          return res.status(400).json({
            success: false,
            message: "Please enter an item name for the row.",
          });
        }

        // Amount blank / 0 + no Item_Name
        // Treat as empty placeholder row
        continue;
      }
      let Item_Id = item.Item_Id || null;
      let dbItemRow = null;

      if (Item_Id) {
        const [rows] = await connection.query("SELECT * FROM add_item WHERE Item_Id = ? LIMIT 1", [Item_Id]);
        dbItemRow = rows[0] || null;
      } else {
        const [rows] = await connection.query(
          "SELECT * FROM add_item WHERE TRIM(Item_Name) = TRIM(?) LIMIT 1",
          [item.Item_Name]
        );
        // const [rows] = await connection.query("SELECT * FROM add_item WHERE Item_Name = ? LIMIT 1", [Item_Name]);
        dbItemRow = rows[0] || null;

        // ⭐ THIS WAS MISSING
        Item_Id = dbItemRow?.Item_Id || null;
        //dbItemRow = { Item_Id, Item_HSN: item.Item_HSN };
      }

      if (!dbItemRow) {
        const [maxRow] = await connection.query(
          `SELECT MAX(CAST(SUBSTRING(Item_Id, 4) AS UNSIGNED)) AS maxId FROM add_item WHERE Item_Id LIKE 'ITM%'`
        );
        const autoId = (maxRow[0]?.maxId || 0) + 1;
        Item_Id = "ITM" + autoId.toString().padStart(3, "0");

        await connection.execute(
          `INSERT INTO add_item
       (Item_Id, Item_Name, Item_Category, Item_HSN, Item_Unit,
        Stock_Quantity, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [Item_Id, Item_Name, Item_Category || "", cleanValue(Item_HSN), Item_Unit || "", 0]
        );
         dbItemRow = { Item_Id, Item_HSN: item.Item_HSN };
      }
      else{

     
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

      if (updates.length > 0) {
        params.push(Item_Id);
        await connection.query(
          `UPDATE add_item SET ${updates.join(", ")}, updated_at = NOW() WHERE Item_Id = ?`,
          params
        );
      }
    }

      // else if (Item_HSN && Item_HSN !== dbItemRow.Item_HSN) {
      //   await connection.query(
      //     `UPDATE add_item SET Item_HSN = ?,Item_Category = ?, updated_at = NOW() WHERE Item_Id = ?`,
      //     [Item_HSN, Item_Category || "", Item_Id]
      //   );
      // }

      resolvedLines.push({ ...item, Item_Id });
    }

    // Step 2: net stock delta per Item_Id — purchase adds stock, so diff is applied as "+"
    const newQtyByItem = new Map();
    for (const line of resolvedLines) {
      newQtyByItem.set(line.Item_Id, (newQtyByItem.get(line.Item_Id) || 0) + normalizeNumber(line.Quantity));
    }
    const oldQtyByItem = new Map();
    oldItems.forEach((o) => {
      oldQtyByItem.set(o.Item_Id, (oldQtyByItem.get(o.Item_Id) || 0) + Number(o.Quantity));
    });

    const allItemIds = new Set([...newQtyByItem.keys(), ...oldQtyByItem.keys()]);
    for (const itemId of allItemIds) {
      const newQty = newQtyByItem.get(itemId) || 0;
      const oldQty = oldQtyByItem.get(itemId) || 0;
      const diff = newQty - oldQty;
      if (diff !== 0) {
        await connection.query(
          `UPDATE add_item SET Stock_Quantity = Stock_Quantity + ?, updated_at = NOW() WHERE Item_Id = ?`,
          [diff, itemId]
        );
      }
    }

    // Step 3: delete old purchase_items rows, reinsert fresh (repeats-safe)
    await connection.query(`DELETE FROM add_purchase_items WHERE Purchase_Id = ?`, [purchaseId]);

    for (const line of resolvedLines) {
      const [insertRes] = await connection.execute(
        `INSERT INTO add_purchase_items
     (Purchase_Id, Item_Id, Quantity, Purchase_Price,
      Discount_On_Purchase_Price, Discount_Type_On_Purchase_Price,
      Tax_Type, Tax_Amount, Amount, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          purchaseId,
          line.Item_Id,
          normalizeNumber(line.Quantity) ?? 0,
          normalizeNumber(line.Purchase_Price) ?? 0,

          cleanDiscount(line.Discount_On_Purchase_Price),
          cleanValue(line.Discount_Type_On_Purchase_Price),
          cleanValue(line.Tax_Type),
          normalizeNumber(line.Tax_Amount) ?? 0,
          normalizeNumber(line.Amount) ?? 0
        ]
      );
      const id = insertRes.insertId;
      await connection.execute(
        `UPDATE add_purchase_items SET Purchase_items_Id = ? WHERE id = ?`,
        ["PIT" + id.toString().padStart(3, "0"), id]
      );
    }

    // delete removed items + reverse their stock — unchanged, still correct
    for (const old of oldItems) {
      if (![...newQtyByItem.keys()].includes(old.Item_Id)) {
        await connection.query(`DELETE FROM add_purchase_items WHERE Purchase_items_Id = ?`, [old.Purchase_items_Id]);
        await connection.query(
          `UPDATE add_item SET Stock_Quantity = Stock_Quantity - ?, updated_at = NOW() WHERE Item_Id = ?`,
          [old.Quantity, old.Item_Id]
        );
      }
    }

    // delete removed items + reverse their stock
    // for (const old of oldItems) {
    //   if (!newItemIds.has(old.Item_Id)) {
    //     await connection.query(
    //       `DELETE FROM add_purchase_items WHERE Purchase_items_Id = ?`,
    //       [old.Purchase_items_Id]
    //     );
    //     await connection.query(
    //       `UPDATE add_item SET Stock_Quantity = Stock_Quantity - ?, updated_at = NOW() WHERE Item_Id = ?`,
    //       [old.Quantity, old.Item_Id]
    //     );
    //   }
    // }

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

//     // ✅ Fetch sale header (includes invoice + party info)
//     const [purchaseData] = await db.query(
//       `
//      SELECT 
//     pu.Purchase_Id,
//     pu.Bill_Number,
//     pu.Bill_Date,
//     pu.Reference_Number,
//     pu.State_Of_Supply,
//     pu.Payment_Type,
//     pu.Bank_Account_Id,
//     pu.Total_Amount,
//     pu.Total_Paid,
//     pu.Balance_Due,
//     pu.Party_Id,

//     p.Party_Name,
//     p.GSTIN,
//     p.Billing_Address,
//     p.Shipping_Address,

//     ba.Account_Display_Name AS Bank_Display_Name,
//     CASE
//         WHEN pu.Payment_Type = 'Bank'
//         THEN ba.Account_Display_Name
//         ELSE pu.Payment_Type
//     END AS Payment_Type_Display

// FROM add_purchase pu
// LEFT JOIN add_party p
//     ON pu.Party_Id = p.Party_Id
// LEFT JOIN bank_accounts ba
//     ON pu.Bank_Account_Id = ba.id
// WHERE pu.Purchase_Id = ?
//       `,
//       [purchaseId]
//     );

//     if (purchaseData.length === 0) {
//       return res.status(404).json({ success: false, message: "Sale not found." });
//     }

//     const purchaseHeader = purchaseData[0];

//     // ✅ Fetch all sale items related to that Sale_Id
//     const [items] = await db.query(
//       `
//       SELECT 
//         pi.Purchase_Items_Id,
//         pi.Item_Id,
//         i.Item_Name,
//         i.Item_HSN,
//         i.Item_Unit,
//         i.Item_Category,
//         pi.Quantity,
//         pi.Purchase_Price,
//         pi.Discount_On_Purchase_Price,
//         pi.Discount_Type_On_Purchase_Price,
//         pi.Tax_Amount,
//         pi.Tax_Type,
//         pi.Amount,
//         pi.created_at
//       FROM add_purchase_items pi
//       LEFT JOIN add_item i ON pi.Item_Id = i.Item_Id
//       WHERE pi.Purchase_Id = ?
//       ORDER BY pi.created_at DESC
//       `,
//       [purchaseId]
//     );

//     if (items.length === 0) {
//       return res.status(404).json({ success: false, message: "No sale items found for this invoice." });
//     }

//     // ✅ Combine and send response
//     const response = {
//       success: true,
//       billPurchaseDetails: {
//         Purchase_Id: purchaseHeader.Purchase_Id,
//         Party_Name: purchaseHeader.Party_Name,
//         GSTIN: purchaseHeader.GSTIN,
//         State_Of_Supply: purchaseHeader.State_Of_Supply,
//         Payment_Type: purchaseHeader.Payment_Type,
//         Reference_Number: purchaseHeader.Reference_Number,
//         Bill_Number: purchaseHeader.Bill_Number,
//         Bill_Date: purchaseHeader.Bill_Date,
//         Payment_Type: purchaseHeader.Payment_Type,
//         Payment_Type_Display: purchaseHeader.Payment_Type_Display,

//         Bank_Account_Id: purchaseHeader.Bank_Account_Id,
//         Bank_Display_Name: purchaseHeader.Bank_Display_Name,
//         Total_Amount: purchaseHeader.Total_Amount,
//         Total_Paid: purchaseHeader.Total_Paid,
//         Balance_Due: purchaseHeader.Balance_Due,
//         Billing_Address: purchaseHeader.Billing_Address,
//         Shipping_Address: purchaseHeader.Shipping_Address,
//       },
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
//     };

//     return res.status(200).json(response);
//   } catch (err) {
//     if (connection) connection.release();
//     console.error("❌ Error getting single sale:", err);
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };
const getSinglePurchase = async (req, res, next) => {
  let connection;
  try {
    const { Purchase_Id: purchaseId } = req.params;

    connection = await db.getConnection();

    if (!purchaseId) {
      return res.status(400).json({ success: false, message: "Purchase ID is required." });
    }

    // ✅ Fetch purchase header — no Payment_Type/Bank_Account_Id anymore
    const [purchaseData] = await connection.query(
      `SELECT
      pu.id,
         pu.Purchase_Id,
         pu.Bill_Number,
         pu.Bill_Date,
        
         pu.State_Of_Supply,
         pu.Total_Amount,
         pu.Total_Paid,
         pu.Balance_Due,
         pu.Party_Id,
         p.Party_Name,
         p.GSTIN
       FROM add_purchase pu
       LEFT JOIN add_party p ON pu.Party_Id = p.Party_Id
       WHERE pu.Purchase_Id = ?`,
      [purchaseId]
    );

    if (purchaseData.length === 0) {
      return res.status(404).json({ success: false, message: "Purchase not found." });
    }

    const purchaseHeader = purchaseData[0];

    // ✅ Fetch purchase items
    const [items] = await connection.query(
      `SELECT 
         pi.Purchase_Items_Id,
         pi.Item_Id,
         i.Item_Name,
         i.Item_HSN,
         i.Item_Unit,
         i.Item_Category,
         pi.Quantity,
         pi.Purchase_Price,
         pi.Discount_On_Purchase_Price,
         pi.Discount_Type_On_Purchase_Price,
         pi.Tax_Amount,
         pi.Tax_Type,
         pi.Amount,
         pi.created_at
       FROM add_purchase_items pi
       LEFT JOIN add_item i ON pi.Item_Id = i.Item_Id
       WHERE pi.Purchase_Id = ?
       ORDER BY pi.created_at DESC`,
      [purchaseId]
    );

    // if (items.length === 0) {
    //   return res.status(404).json({ success: false, message: "No purchase items found for this invoice." });
    // }

    // ✅ Fetch payment splits for this purchase
    const [splits] = await connection.query(
      `SELECT
         ps.id,
         ps.Payment_Type,
         ps.Bank_Account_Id,
         ps.Reference_Number,
         ps.Amount,
         ba.Account_Display_Name,
         CASE
           WHEN ps.Payment_Type = 'Bank' THEN ba.Account_Display_Name
           ELSE ps.Payment_Type
         END AS Payment_Type_Display
       FROM payment_splits ps
       LEFT JOIN bank_accounts ba ON ba.id = ps.Bank_Account_Id
       WHERE ps.Source_Type = 'Purchase' AND ps.Source_Id = ?
       ORDER BY ps.id ASC`,
      [purchaseHeader.id]
      //[purchaseHeader.id ?? purchaseId]  

      // use numeric id if your splits store numeric; adjust if stored as 'PUR001'
    );

    // ✅ Build a human-readable summary of splits for easy display
    const splitSummary = splits.map((s) => s.Payment_Type_Display).join(" + ") || "—";

    return res.status(200).json({
      success: true,
      billPurchaseDetails: {
        Purchase_Id: purchaseHeader.Purchase_Id,
        Party_Name: purchaseHeader.Party_Name,
        GSTIN: purchaseHeader.GSTIN,
        State_Of_Supply: purchaseHeader.State_Of_Supply,
        Bill_Number: purchaseHeader.Bill_Number,
        Bill_Date: purchaseHeader.Bill_Date,
        //Reference_Number: purchaseHeader.Reference_Number,
        Total_Amount: purchaseHeader.Total_Amount,
        Total_Paid: purchaseHeader.Total_Paid,
        Balance_Due: purchaseHeader.Balance_Due,
        Billing_Address: purchaseHeader.Billing_Address,
        Shipping_Address: purchaseHeader.Shipping_Address,
        // 🔹 split summary for display in UI header
        Payment_Type_Display: splitSummary,
      },
      // 🔹 full splits array — frontend uses this to pre-fill the payment split UI
      splits: splits.map((s) => ({
        id: s.id,
        Payment_Type: s.Payment_Type,
        Bank_Account_Id: s.Bank_Account_Id,
        Account_Display_Name: s.Account_Display_Name,
        Payment_Type_Display: s.Payment_Type_Display,
        Reference_Number: s.Reference_Number,
        Amount: s.Amount,
      })),
      items: items.map((it) => ({
        Purchase_Items_Id: it.Purchase_Items_Id,
        Item_Id: it.Item_Id,
        Item_Name: it.Item_Name,
        Item_HSN: it.Item_HSN,
        Item_Unit: it.Item_Unit,
        Item_Category: it.Item_Category,
        Quantity: it.Quantity,
        Purchase_Price: it.Purchase_Price,
        Discount_On_Purchase_Price: it.Discount_On_Purchase_Price,
        Discount_Type_On_Purchase_Price: it.Discount_Type_On_Purchase_Price,
        Tax_Amount: it.Tax_Amount,
        Tax_Type: it.Tax_Type,
        Amount: it.Amount,
        created_at: it.created_at,
      })),
    });
  } catch (err) {
    console.error("❌ Error getting single purchase:", err);
    next(err);
  } finally {
    if (connection) connection.release();
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