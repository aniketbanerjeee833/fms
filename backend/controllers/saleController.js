
import db from "../config/db.js"; // mysql2/promise db
import { sanitizeObject } from "../utils/sanitizeInput.js";
import { saleNewItemFormSchema } from "../validators/saleNewItemFormSchema.js";
import saleSchema from "../validators/saleSchema.js";
import PdfPrinter from "pdfmake";
import ExcelJS from "exceljs";
import { recordBankTransaction } from "../utils/bankAccountHelper.js";
import { recordCashTransaction } from "../utils/cashTransactionHelper.js";
import { deletePaymentSplits, insertPaymentSplits, validateSplits } from "../utils/paymentSplitHelper.js";
import { recordPartyLedger, reversePartyLedger } from "../utils/partyLedgerHelper.js";
import { recordItemLedger, reverseItemLedger } from "../utils/itemLedgerHelper.js";
import { resolveUnitAndStockDelta } from "../utils/resolveUnitAndStockDelta.js";
// import puppeteer from "puppeteer";
//import pdf from "html-pdf-node";
const TAX_TYPES = {
  "GST0": "GST 0%",
  "GST0.25": "GST 0.25%",
  "GST3": "GST 3%",
  GST5: "GST 5%",
  GST12: "GST 12%",
  GST18: "GST 18%",
  GST28: "GST 28%",
  GST40: "GST 40%",
  "IGST0": "IGST 0%",
  "IGST0.25": "IGST 0.25%",
  "IGST3": "IGST 3%",
  IGST5: "IGST 5%",
  IGST12: "IGST 12%",
  IGST18: "IGST 18%",
  IGST28: "IGST 28%",
  IGST40: "IGST 40%"
}
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
const normalizeNumber = (val) =>
  val !== undefined && val !== null && String(val).trim() !== ""
    ? Number(val)
    : null;



//OLD




// const addSale = async (req, res, next) => {
//   let connection;

//   try {
//     connection = await db.getConnection();
//     await connection.beginTransaction();

//     // =========================================================
//     // 1. SANITIZE + ZOD VALIDATION
//     // =========================================================

//     const cleanData = sanitizeObject(req.body);

//     const validation = saleSchema.safeParse(cleanData);

//     if (!validation.success) {
//       await connection.rollback();

//       return res.status(400).json({
//         errors: validation.error.errors,
//       });
//     }

//     const {
//       Sale_Mode,          // 🔹 "Credit" | "Cash" — request/controller logic only, never stored
//       Party_Name,
//       Billing_Name,        // 🔹 invoice snapshot field
//       Phone_Number,
//       Billing_Address,
//       GSTIN,
//       Invoice_Number,
//       Invoice_Date,
//       State_Of_Supply,
//       Total_Amount,
//       Total_Received,
//       Balance_Due,
//       splits,
//        Terms_Conditions_Id,          // nullable int — null if user typed fresh or cleared
//       Terms_Conditions_Description,
//       items,

//     } = validation.data;

//     const saleMode = Sale_Mode === "Cash" ? "Cash" : "Credit"; // default Credit if missing/unexpected
//     console.log("Sale mode:", saleMode);
//     // =========================================================
//     // 2. TOTAL AMOUNT
//     // =========================================================

//     const totalAmount = Number(Total_Amount) || 0;

//     // =========================================================
//     // 3. SALE PAYMENT SPLITS
//     //
//     // CREDIT: existing behavior — first split kept even at ₹0,
//     //         later ₹0 splits dropped, positive splits kept.
//     //
//     // CASH: sum of splits MUST equal totalAmount exactly.
//     //       Always fully paid — Total_Received/Balance_Due are
//     //       computed here, never trusted from frontend.
//     // =========================================================
//      let termsId = null;
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
//    if (termsId) {
//   const [[selectedTerm]] = await connection.query(
//     `SELECT id
//      FROM terms_conditions
//      WHERE id = ?
//        AND Sale_Invoice = 1
//      LIMIT 1`,
//     [termsId]
//   );

//   if (!selectedTerm) {
//     await connection.rollback();

//     return res.status(400).json({
//       success: false,
//       message: "Invalid Terms & Conditions for Sale Invoice.",
//     });
//   }
// }

//     let validSplits = [];

//     if (totalAmount > 0) {
//       const normalizedSplits = (splits || [])
//         .filter((split) => {
//           // Must have payment type
//           if (!split.Payment_Type) {
//             return false;
//           }

//           // Bank must have selected bank account
//           if (
//             split.Payment_Type === "Bank" &&
//             !split.Bank_Account_Id
//           ) {
//             return false;
//           }

//           return true;
//         })
//         .map((split) => ({
//           ...split,
//           Amount: Number(split.Amount) || 0,
//         }));

//       if (saleMode === "Cash") {
//         // 🔹 Cash mode: keep every split with a real amount (no first-at-₹0 exception —
//         //    a cash sale must be exactly and fully paid, so a ₹0 placeholder split is meaningless)
//         validSplits = normalizedSplits.filter((split) => split.Amount > 0);
//       } else {
//         // 🔹 Credit mode — unchanged existing logic
//         validSplits = normalizedSplits.filter(
//           (split, index) => {
//             // FIRST valid payment method: always preserve, even ₹0
//             if (index === 0) {
//               return true;
//             }
//             // Every payment after first: only preserve positive amount
//             return split.Amount > 0;
//           }
//         );
//       }
//     }

//     // =========================================================
//     // 4. TOTAL RECEIVED / BALANCE DUE
//     //
//     // Backend calculates this. Don't trust Total_Received/Balance_Due
//     // coming from frontend, especially for Cash mode.
//     // =========================================================

//     let totalReceived;
//     let balanceDue;

//     if (saleMode === "Cash") {
//       // 🔹 Cash sale must be fully paid — enforced here, not trusted from frontend
//       totalReceived = totalAmount;
//       balanceDue = 0;

//       if (totalAmount > 0) {
//         const splitsSum = validSplits.reduce(
//           (sum, split) => sum + (Number(split.Amount) || 0),
//           0
//         );

//         if (Math.round(splitsSum * 100) !== Math.round(totalAmount * 100)) {
//           await connection.rollback();
//           return res.status(400).json({
//             success: false,
//             message:
//               splitsSum < totalAmount
//                 ? "Cash sale must be fully paid."
//                 : "Payment exceeds the total amount.",
//           });
//         }
//       }
//     } else {
//       // 🔹 Credit mode — unchanged existing logic
//       totalReceived = validSplits.reduce(
//         (sum, split) => sum + (Number(split.Amount) || 0),
//         0
//       );
//       balanceDue = totalAmount - totalReceived;
//     }

//     // =========================================================
//     // 6. PAYMENT VALIDATION
//     // =========================================================

//     if (totalReceived > totalAmount) {
//       await connection.rollback();

//       return res.status(400).json({
//         success: false,
//         message:
//           "Received amount should be less than or equal to Total Amount",
//       });
//     }

//     // Only validate when an actual payment exists
//     if (totalReceived > 0) {
//       try {
//         validateSplits(validSplits, totalReceived);
//       } catch (validationErr) {
//         await connection.rollback();

//         return res.status(400).json({
//           success: false,
//           message: validationErr.message,
//         });
//       }
//     }




//     // =========================================================
//     // RESOLVE PARTY
//     // =========================================================

//     let Party_Id;
//     let resolvedPartyName;

//     if (saleMode === "Credit") {
//       // Credit sale MUST have a party
//       if (!Party_Name?.trim()) {
//         await connection.rollback();

//         return res.status(400).json({
//           success: false,
//           message: "Party is required for a Credit sale.",
//         });
//       }

//       resolvedPartyName = Party_Name.trim();

//     } else {
//       // Cash mode:
//       // blank party -> special system "Cash Sale" party
//       // selected party -> normal party
//       resolvedPartyName = Party_Name?.trim() || "Cash Sale";
//     }


//     // =========================================================
//     // IS THIS THE SPECIAL CASH SALE PARTY?
//     // =========================================================

//     const isCashSaleParty = resolvedPartyName.toLowerCase() === "cash sale";


//     // =========================================================
//     // FIND PARTY
//     // =========================================================

//     const [partyRows] = await connection.execute(
//       `SELECT *
//    FROM add_party
//    WHERE TRIM(Party_Name) = TRIM(?)
//    LIMIT 1`,
//       [resolvedPartyName]
//     );


//     // =========================================================
//     // CASE 1: PARTY DOES NOT EXIST
//     // =========================================================

//     if (partyRows.length === 0) {

//       // =======================================================
//       // A. CREATE SPECIAL "CASH SALE" PARTY
//       // =======================================================
//       //
//       // Cash Sale is only an accounting/system party.
//       //
//       // DON'T put invoice customer details into its master:
//       // - Billing_Name
//       // - Phone_Number
//       // - GSTIN
//       // - Billing_Address
//       //
//       // Those belong to add_sale.
//       // =======================================================

//       if (isCashSaleParty) {

//         const [partyResult] = await connection.execute(
//           `INSERT INTO add_party
//        (
//          Party_Name,
//          created_at,
//          updated_at
//        )
//        VALUES (?, NOW(), NOW())`,
//           [resolvedPartyName]
//         );

//         const partyIdNumber = partyResult.insertId;

//         Party_Id =
//           "PTY" +
//           partyIdNumber.toString().padStart(3, "0");

//         await connection.execute(
//           `UPDATE add_party
//        SET Party_Id = ?
//        WHERE id = ?`,
//           [
//             Party_Id,
//             partyIdNumber,
//           ]
//         );

//       }

//       // =======================================================
//       // B. CREATE NEW NORMAL PARTY
//       // =======================================================

//       else {

//         const [partyResult] = await connection.execute(
//           `INSERT INTO add_party
//        (
//          Party_Name,
//          Billing_Name,
//          Phone_Number,
//          GSTIN,
//          created_at,
//          updated_at
//        )
//        VALUES (?, ?, ?, ?, NOW(), NOW())`,
//           [
//             resolvedPartyName,
//             cleanValue(Billing_Name),
//             cleanValue(Phone_Number),
//             cleanValue(GSTIN),
//           ]
//         );

//         const partyIdNumber = partyResult.insertId;

//         Party_Id =
//           "PTY" +
//           partyIdNumber.toString().padStart(3, "0");

//         await connection.execute(
//           `UPDATE add_party
//        SET Party_Id = ?
//        WHERE id = ?`,
//           [
//             Party_Id,
//             partyIdNumber,
//           ]
//         );


//         // =====================================================
//         // FIRST BILLING ADDRESS -> DEFAULT ADDRESS
//         // =====================================================

//         if (Billing_Address?.trim()) {

//           await connection.execute(
//             `INSERT INTO add_party_addresses
//          (
//            Party_Id,
//            Address_Type,
//            Address_Text,
//            Is_Default,
//            created_at,
//            updated_at
//          )
//          VALUES (?, 'Billing', ?, 1, NOW(), NOW())`,
//             [
//               Party_Id,
//               Billing_Address.trim(),
//             ]
//           );
//         }
//       }

//     }


//     // =========================================================
//     // CASE 2: PARTY ALREADY EXISTS
//     // =========================================================

//     else {

//       const existingParty = partyRows[0];

//       Party_Id = existingParty.Party_Id;


//       // =======================================================
//       // SPECIAL "CASH SALE"
//       // =======================================================
//       //
//       // DO NOTHING TO MASTER.
//       //
//       // Every invoice may belong to a different walk-in
//       // customer, so invoice details must NOT modify Cash Sale.
//       // =======================================================

//       if (isCashSaleParty) {

//         // Intentionally empty.
//         //
//         // DON'T update:
//         // add_party.Billing_Name
//         // add_party.Phone_Number
//         // add_party.GSTIN
//         // add_party_addresses
//       }


//       // =======================================================
//       // NORMAL EXISTING PARTY
//       // =======================================================

//       else {

//         // =====================================================
//         // 1. BILLING NAME
//         //
//         // Initialize master only if currently blank.
//         // =====================================================

//         if (
//           !existingParty.Billing_Name?.trim() &&
//           Billing_Name?.trim()
//         ) {

//           await connection.execute(
//             `UPDATE add_party
//          SET
//            Billing_Name = ?,
//            updated_at = NOW()
//          WHERE Party_Id = ?`,
//             [
//               Billing_Name.trim(),
//               Party_Id,
//             ]
//           );
//         }


//         // =====================================================
//         // 2. PHONE NUMBER
//         //
//         // Initialize master only if currently blank.
//         // =====================================================

//         if (
//           !existingParty.Phone_Number?.trim() &&
//           Phone_Number?.trim()
//         ) {

//           await connection.execute(
//             `UPDATE add_party
//          SET
//            Phone_Number = ?,
//            updated_at = NOW()
//          WHERE Party_Id = ?`,
//             [
//               Phone_Number.trim(),
//               Party_Id,
//             ]
//           );
//         }


//         // =====================================================
//         // 3. BILLING ADDRESS
//         //
//         // Initialize only if NO billing address exists.
//         // =====================================================

//         if (Billing_Address?.trim()) {

//           const [[{ addrCount }]] =
//             await connection.query(
//               `SELECT COUNT(*) AS addrCount
//            FROM add_party_addresses
//            WHERE Party_Id = ?
//              AND Address_Type = 'Billing'`,
//               [Party_Id]
//             );

//           if (Number(addrCount) === 0) {

//             await connection.execute(
//               `INSERT INTO add_party_addresses
//            (
//              Party_Id,
//              Address_Type,
//              Address_Text,
//              Is_Default,
//              created_at,
//              updated_at
//            )
//            VALUES (?, 'Billing', ?, 1, NOW(), NOW())`,
//               [
//                 Party_Id,
//                 Billing_Address.trim(),
//               ]
//             );
//           }
//         }

//         // GSTIN:
//         // readonly in Sale UI.
//         // Don't update an existing party's GSTIN from sale.
//       }
//     }



//     // =========================================================
//     // 8. ACTIVE FINANCIAL YEAR
//     // =========================================================

//     const [fy] = await connection.query(
//       `SELECT Financial_Year
//        FROM financial_year
//        WHERE Current_Financial_Year = 1
//        LIMIT 1`
//     );

//     if (fy.length === 0) {
//       await connection.rollback();

//       return res.status(400).json({
//         success: false,
//         message:
//           "No active financial year found. Please set one in settings.",
//       });
//     }

//     const activeFY = fy[0].Financial_Year;

//     // =========================================================
//     // 9. CREATE SALE HEADER
//     //
//     // Billing_Name / Phone_Number / Billing_Address stored here
//     // as this invoice's own snapshot — independent of party master.
//     // =========================================================

//     const [saleResult] = await connection.execute(
//       `INSERT INTO add_sale
//        (
//          Party_Id,
//          Billing_Name,
//          Phone_Number,
//          Billing_Address,
//          Invoice_Number,
//          Invoice_Date,
//          Financial_Year,
//          State_Of_Supply,
//          Total_Amount,
//          Total_Received,
//          Balance_Due,
//           Terms_Conditions_Id,
//      Terms_Conditions_Description,
//          created_at,
//          updated_at
//        )
//        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?, NOW(), NOW())`,
//       [
//         Party_Id,
//         cleanValue(Billing_Name),
//         cleanValue(Phone_Number),
//         cleanValue(Billing_Address),
//         Invoice_Number,
//         Invoice_Date,
//         activeFY,
//         cleanValue(State_Of_Supply),
//         totalAmount,
//         totalReceived,
//         balanceDue,
//          termsId,
//         termsDescription,
//       ]
//     );

//     const saleIdNumber = saleResult.insertId;

//     const newSaleId =
//       "SAL" + saleIdNumber.toString().padStart(3, "0");

//     await connection.execute(
//       `UPDATE add_sale
//        SET Sale_Id = ?
//        WHERE id = ?`,
//       [newSaleId, saleIdNumber]
//     );

//     // =========================================================
//     // 10. PAYMENT SPLITS
//     //
//     // Use validSplits, NOT original splits, for BOTH modes.
//     // Cash mode: validSplits sums exactly to totalAmount (enforced above),
//     // so payment_splits/bank_transactions/cash_transactions stay
//     // consistent with add_sale.Total_Received.
//     // =========================================================

//     if (validSplits.length > 0) {
//       await insertPaymentSplits({
//         connection,
//         sourceType: "Sale",
//         sourceId: saleIdNumber,
//         partyName: resolvedPartyName,
//         txnDate: Invoice_Date,
//         splits: validSplits,
//       });
//     }

//     // =========================================================
//     // 11. PARTY LEDGER
//     // =========================================================

//     await recordPartyLedger({
//       connection,
//       partyId: Party_Id,
//       txnType: "Sale",
//       referenceId: saleIdNumber,
//       amount: totalAmount,
//       txnDate: Invoice_Date,
//       docNumber: Invoice_Number,
//       balanceDue,
//     });

//     // =========================================================
//     // 12. ITEMS — unchanged
//     // =========================================================

//     for (const item of items || []) {

//       if (!item.Item_Name?.trim()) {

//         if ((normalizeNumber(item.Amount) ?? 0) > 0) {
//           await connection.rollback();

//           return res.status(400).json({
//             success: false,
//             message: "Please enter an item name for the row.",
//           });
//         }

//         continue;
//       }

//       const {
//         Item_Name,
//         Item_HSN,
//         Item_Category,
//         Quantity,
//         Item_Unit,
//         Sale_Price,
//         Discount_On_Sale_Price,
//         Discount_Type_On_Sale_Price,
//         Tax_Type,
//         Tax_Amount,
//         Amount,
//       } = item;

//       const [itemRows] = await connection.execute(
//         `SELECT *
//          FROM add_item
//          WHERE TRIM(Item_Name) = TRIM(?)
//          LIMIT 1`,
//         [Item_Name]
//       );

//       let Item_Id;

//       if (itemRows.length === 0) {
//         const [itemResult] = await connection.execute(
//           `INSERT INTO add_item
//            (
//              Item_Name,
//              Item_HSN,
//              Item_Unit,
//              Item_Category,
//              Stock_Quantity,
//              created_at,
//              updated_at
//            )
//            VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
//           [
//             Item_Name.trim(),
//             cleanValue(Item_HSN),
//             Item_Unit || "",
//             Item_Category || "",
//             -(normalizeNumber(Quantity) ?? 0),
//           ]
//         );

//         const itemIdNum = itemResult.insertId;

//         Item_Id =
//           "ITM" +
//           itemIdNum
//             .toString()
//             .padStart(3, "0");

//         await connection.execute(
//           `UPDATE add_item
//            SET Item_Id = ?
//            WHERE id = ?`,
//           [Item_Id, itemIdNum]
//         );
//       }

//       else {
//         Item_Id = itemRows[0].Item_Id;

//         await connection.execute(
//           `UPDATE add_item
//            SET
//              Stock_Quantity = Stock_Quantity - ?,
//              Item_HSN = ?,
//              Item_Category = ?,
//              updated_at = NOW()
//            WHERE Item_Id = ?`,
//           [
//             normalizeNumber(Quantity) ?? 0,

//             cleanValue(Item_HSN) ||
//             itemRows[0].Item_HSN,

//             Item_Category || itemRows[0].Item_Category ||
//             "",

//             Item_Id,
//           ]
//         );
//       }

//       const [purchaseTax] = await connection.query(
//         `SELECT Tax_Type
//          FROM add_purchase_items
//          WHERE Item_Id = ?
//          ORDER BY id DESC
//          LIMIT 1`,
//         [Item_Id]
//       );

//       const safeTaxType =
//         purchaseTax[0]?.Tax_Type ||
//         Tax_Type ||
//         "None";

//       const [saleItemResult] =
//         await connection.execute(
//           `INSERT INTO add_sale_items
//            (
//              Sale_Id,
//              Item_Id,
//              Quantity,
//              Sale_Price,
//              Discount_On_Sale_Price,
//              Discount_Type_On_Sale_Price,
//              Tax_Type,
//              Tax_Amount,
//              Amount,
//              created_at,
//              updated_at
//            )
//            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
//           [
//             newSaleId,
//             Item_Id,

//             normalizeNumber(Quantity) ?? 0,

//             normalizeNumber(Sale_Price) ?? 0,

//             cleanDiscount(
//               Discount_On_Sale_Price
//             ),

//             cleanValue(
//               Discount_Type_On_Sale_Price
//             ),

//             cleanValue(safeTaxType),

//             normalizeNumber(Tax_Amount) ?? 0,

//             normalizeNumber(Amount) ?? 0,
//           ]
//         );

//       const saleItemIdNum =
//         saleItemResult.insertId;

//       const newSaleItemId =
//         "SIT" +
//         saleItemIdNum
//           .toString()
//           .padStart(3, "0");

//       await connection.execute(
//         `UPDATE add_sale_items
//          SET Sale_Items_Id = ?
//          WHERE id = ?`,
//         [newSaleItemId, saleItemIdNum]
//       );
//       // ✅ ADD THIS — record item ledger entry for this sale line
// await recordItemLedger({
//   connection,
//   itemId:      Item_Id,
//   txnType:     "Sale",
//   referenceId: saleItemIdNum,   // add_sale_items.id (auto-increment)
//   //formattedId: newSaleId,       // "SAL001"
//   billId:      newSaleId,
//   billNumber: Invoice_Number,
//   partyName:   resolvedPartyName,
//   quantity:    normalizeNumber(Quantity) ?? 0,
//   rate:        normalizeNumber(Sale_Price) ?? null,
//   txnDate:     Invoice_Date,
// });
//     }

//     // =========================================================
//     // 19. COMMIT
//     // =========================================================

//     await connection.commit();

//     return res.status(201).json({
//       success: true,
//       message: "Sale and items added successfully",
//       saleId: newSaleId,
//     });

//   } catch (err) {

//     if (connection) {
//       await connection.rollback();
//     }

//     console.error("❌ Error adding sale:", err);

//     next(err);

//   } finally {

//     if (connection) {
//       connection.release();
//     }
//   }
// };

const addSale = async (req, res, next) => {
  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // =========================================================
    // 1. SANITIZE + ZOD VALIDATION
    // =========================================================

    const cleanData = sanitizeObject(req.body);

    const validation = saleSchema.safeParse(cleanData);

    if (!validation.success) {
      await connection.rollback();

      return res.status(400).json({
        errors: validation.error.errors,
      });
    }

    const {
      Sale_Mode,          // 🔹 "Credit" | "Cash" — request/controller logic only, never stored
      Party_Name,
      Billing_Name,        // 🔹 invoice snapshot field
      Phone_Number,
      Billing_Address,
      GSTIN,
      Invoice_Number,
      Invoice_Date,
      State_Of_Supply,
      Total_Amount,
      Total_Received,
      Balance_Due,
      splits,
      Terms_Conditions_Id,          // nullable int — null if user typed fresh or cleared
      Terms_Conditions_Description,
      items,

    } = validation.data;

    const saleMode = Sale_Mode === "Cash" ? "Cash" : "Credit"; // default Credit if missing/unexpected
    console.log("Sale mode:", saleMode);
    // =========================================================
    // 2. TOTAL AMOUNT
    // =========================================================

    const totalAmount = Number(Total_Amount) || 0;

    // =========================================================
    // 3. SALE PAYMENT SPLITS
    //
    // CREDIT: existing behavior — first split kept even at ₹0,
    //         later ₹0 splits dropped, positive splits kept.
    //
    // CASH: sum of splits MUST equal totalAmount exactly.
    //       Always fully paid — Total_Received/Balance_Due are
    //       computed here, never trusted from frontend.
    // =========================================================
    let termsId = null;
    let termsDescription = null;



    if (
      Terms_Conditions_Id &&
      Terms_Conditions_Description?.trim()
    ) {
      // Template selected and untouched
      termsId = Number(Terms_Conditions_Id);
      termsDescription = Terms_Conditions_Description.trim();

    } else if (Terms_Conditions_Description?.trim()) {
      // Custom / edited description
      // UI has already cleared the template ID/title
      termsId = null;
      termsDescription = Terms_Conditions_Description.trim();
    }

    // Otherwise:
    // termsId = null
    // termsDescription = null
    if (termsId) {
      const [[selectedTerm]] = await connection.query(
        `SELECT id
     FROM terms_conditions
     WHERE id = ?
       AND Sale_Invoice = 1
     LIMIT 1`,
        [termsId]
      );

      if (!selectedTerm) {
        await connection.rollback();

        return res.status(400).json({
          success: false,
          message: "Invalid Terms & Conditions for Sale Invoice.",
        });
      }
    }

    let validSplits = [];

    if (totalAmount > 0) {
      const normalizedSplits = (splits || [])
        .filter((split) => {
          // Must have payment type
          if (!split.Payment_Type) {
            return false;
          }

          // Bank must have selected bank account
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

      if (saleMode === "Cash") {
        // 🔹 Cash mode: keep every split with a real amount (no first-at-₹0 exception —
        //    a cash sale must be exactly and fully paid, so a ₹0 placeholder split is meaningless)
        validSplits = normalizedSplits.filter((split) => split.Amount > 0);
      } else {
        // 🔹 Credit mode — unchanged existing logic
        validSplits = normalizedSplits.filter(
          (split, index) => {
            // FIRST valid payment method: always preserve, even ₹0
            if (index === 0) {
              return true;
            }
            // Every payment after first: only preserve positive amount
            return split.Amount > 0;
          }
        );
      }
    }

    // =========================================================
    // 4. TOTAL RECEIVED / BALANCE DUE
    //
    // Backend calculates this. Don't trust Total_Received/Balance_Due
    // coming from frontend, especially for Cash mode.
    // =========================================================

    let totalReceived;
    let balanceDue;

    if (saleMode === "Cash") {
      // 🔹 Cash sale must be fully paid — enforced here, not trusted from frontend
      totalReceived = totalAmount;
      balanceDue = 0;

      if (totalAmount > 0) {
        const splitsSum = validSplits.reduce(
          (sum, split) => sum + (Number(split.Amount) || 0),
          0
        );

        if (Math.round(splitsSum * 100) !== Math.round(totalAmount * 100)) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message:
              splitsSum < totalAmount
                ? "Cash sale must be fully paid."
                : "Payment exceeds the total amount.",
          });
        }
      }
    } else {
      // 🔹 Credit mode — unchanged existing logic
      totalReceived = validSplits.reduce(
        (sum, split) => sum + (Number(split.Amount) || 0),
        0
      );
      balanceDue = totalAmount - totalReceived;
    }

    // =========================================================
    // 6. PAYMENT VALIDATION
    // =========================================================

    if (totalReceived > totalAmount) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          "Received amount should be less than or equal to Total Amount",
      });
    }

    // Only validate when an actual payment exists
    if (totalReceived > 0) {
      try {
        validateSplits(validSplits, totalReceived);
      } catch (validationErr) {
        await connection.rollback();

        return res.status(400).json({
          success: false,
          message: validationErr.message,
        });
      }
    }




    // =========================================================
    // RESOLVE PARTY
    // =========================================================

    let Party_Id;
    let resolvedPartyName;

    if (saleMode === "Credit") {
      // Credit sale MUST have a party
      if (!Party_Name?.trim()) {
        await connection.rollback();

        return res.status(400).json({
          success: false,
          message: "Party is required for a Credit sale.",
        });
      }

      resolvedPartyName = Party_Name.trim();

    } else {
      // Cash mode:
      // blank party -> special system "Cash Sale" party
      // selected party -> normal party
      resolvedPartyName = Party_Name?.trim() || "Cash Sale";
    }


    // =========================================================
    // IS THIS THE SPECIAL CASH SALE PARTY?
    // =========================================================

    const isCashSaleParty = resolvedPartyName.toLowerCase() === "cash sale";


    // =========================================================
    // FIND PARTY
    // =========================================================

    const [partyRows] = await connection.execute(
      `SELECT *
   FROM add_party
   WHERE TRIM(Party_Name) = TRIM(?)
   LIMIT 1`,
      [resolvedPartyName]
    );


    // =========================================================
    // CASE 1: PARTY DOES NOT EXIST
    // =========================================================

    if (partyRows.length === 0) {

      // =======================================================
      // A. CREATE SPECIAL "CASH SALE" PARTY
      // =======================================================
      //
      // Cash Sale is only an accounting/system party.
      //
      // DON'T put invoice customer details into its master:
      // - Billing_Name
      // - Phone_Number
      // - GSTIN
      // - Billing_Address
      //
      // Those belong to add_sale.
      // =======================================================

      if (isCashSaleParty) {

        const [partyResult] = await connection.execute(
          `INSERT INTO add_party
       (
         Party_Name,
         created_at,
         updated_at
       )
       VALUES (?, NOW(), NOW())`,
          [resolvedPartyName]
        );

        const partyIdNumber = partyResult.insertId;

        Party_Id =
          "PTY" +
          partyIdNumber.toString().padStart(3, "0");

        await connection.execute(
          `UPDATE add_party
       SET Party_Id = ?
       WHERE id = ?`,
          [
            Party_Id,
            partyIdNumber,
          ]
        );

      }

      // =======================================================
      // B. CREATE NEW NORMAL PARTY
      // =======================================================

      else {

        const [partyResult] = await connection.execute(
          `INSERT INTO add_party
       (
         Party_Name,
         Billing_Name,
         Phone_Number,
         GSTIN,
         created_at,
         updated_at
       )
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
          [
            resolvedPartyName,
            cleanValue(Billing_Name),
            cleanValue(Phone_Number),
            cleanValue(GSTIN),
          ]
        );

        const partyIdNumber = partyResult.insertId;

        Party_Id =
          "PTY" +
          partyIdNumber.toString().padStart(3, "0");

        await connection.execute(
          `UPDATE add_party
       SET Party_Id = ?
       WHERE id = ?`,
          [
            Party_Id,
            partyIdNumber,
          ]
        );


        // =====================================================
        // FIRST BILLING ADDRESS -> DEFAULT ADDRESS
        // =====================================================

        if (Billing_Address?.trim()) {

          await connection.execute(
            `INSERT INTO add_party_addresses
         (
           Party_Id,
           Address_Type,
           Address_Text,
           Is_Default,
           created_at,
           updated_at
         )
         VALUES (?, 'Billing', ?, 1, NOW(), NOW())`,
            [
              Party_Id,
              Billing_Address.trim(),
            ]
          );
        }
      }

    }


    // =========================================================
    // CASE 2: PARTY ALREADY EXISTS
    // =========================================================

    else {

      const existingParty = partyRows[0];

      Party_Id = existingParty.Party_Id;


      // =======================================================
      // SPECIAL "CASH SALE"
      // =======================================================
      //
      // DO NOTHING TO MASTER.
      //
      // Every invoice may belong to a different walk-in
      // customer, so invoice details must NOT modify Cash Sale.
      // =======================================================

      if (isCashSaleParty) {

        // Intentionally empty.
        //
        // DON'T update:
        // add_party.Billing_Name
        // add_party.Phone_Number
        // add_party.GSTIN
        // add_party_addresses
      }


      // =======================================================
      // NORMAL EXISTING PARTY
      // =======================================================

      else {

        // =====================================================
        // 1. BILLING NAME
        //
        // Initialize master only if currently blank.
        // =====================================================

        if (
          !existingParty.Billing_Name?.trim() &&
          Billing_Name?.trim()
        ) {

          await connection.execute(
            `UPDATE add_party
         SET
           Billing_Name = ?,
           updated_at = NOW()
         WHERE Party_Id = ?`,
            [
              Billing_Name.trim(),
              Party_Id,
            ]
          );
        }


        // =====================================================
        // 2. PHONE NUMBER
        //
        // Initialize master only if currently blank.
        // =====================================================

        if (
          !existingParty.Phone_Number?.trim() &&
          Phone_Number?.trim()
        ) {

          await connection.execute(
            `UPDATE add_party
         SET
           Phone_Number = ?,
           updated_at = NOW()
         WHERE Party_Id = ?`,
            [
              Phone_Number.trim(),
              Party_Id,
            ]
          );
        }


        // =====================================================
        // 3. BILLING ADDRESS
        //
        // Initialize only if NO billing address exists.
        // =====================================================

        if (Billing_Address?.trim()) {

          const [[{ addrCount }]] =
            await connection.query(
              `SELECT COUNT(*) AS addrCount
           FROM add_party_addresses
           WHERE Party_Id = ?
             AND Address_Type = 'Billing'`,
              [Party_Id]
            );

          if (Number(addrCount) === 0) {

            await connection.execute(
              `INSERT INTO add_party_addresses
           (
             Party_Id,
             Address_Type,
             Address_Text,
             Is_Default,
             created_at,
             updated_at
           )
           VALUES (?, 'Billing', ?, 1, NOW(), NOW())`,
              [
                Party_Id,
                Billing_Address.trim(),
              ]
            );
          }
        }

        // GSTIN:
        // readonly in Sale UI.
        // Don't update an existing party's GSTIN from sale.
      }
    }



    // =========================================================
    // 8. ACTIVE FINANCIAL YEAR
    // =========================================================

    const [fy] = await connection.query(
      `SELECT Financial_Year
       FROM financial_year
       WHERE Current_Financial_Year = 1
       LIMIT 1`
    );

    if (fy.length === 0) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          "No active financial year found. Please set one in settings.",
      });
    }

    const activeFY = fy[0].Financial_Year;

    // =========================================================
    // 9. CREATE SALE HEADER
    //
    // Billing_Name / Phone_Number / Billing_Address stored here
    // as this invoice's own snapshot — independent of party master.
    // =========================================================

    const [saleResult] = await connection.execute(
      `INSERT INTO add_sale
       (
         Party_Id,
         Billing_Name,
         Phone_Number,
         Billing_Address,
         Invoice_Number,
         Invoice_Date,
         Financial_Year,
         State_Of_Supply,
         Total_Amount,
         Total_Received,
         Balance_Due,
          Terms_Conditions_Id,
     Terms_Conditions_Description,
         created_at,
         updated_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?, NOW(), NOW())`,
      [
        Party_Id,
        cleanValue(Billing_Name),
        cleanValue(Phone_Number),
        cleanValue(Billing_Address),
        Invoice_Number,
        Invoice_Date,
        activeFY,
        cleanValue(State_Of_Supply),
        totalAmount,
        totalReceived,
        balanceDue,
        termsId,
        termsDescription,
      ]
    );

    const saleIdNumber = saleResult.insertId;

    const newSaleId =
      "SAL" + saleIdNumber.toString().padStart(3, "0");

    await connection.execute(
      `UPDATE add_sale
       SET Sale_Id = ?
       WHERE id = ?`,
      [newSaleId, saleIdNumber]
    );

    // =========================================================
    // 10. PAYMENT SPLITS
    //
    // Use validSplits, NOT original splits, for BOTH modes.
    // Cash mode: validSplits sums exactly to totalAmount (enforced above),
    // so payment_splits/bank_transactions/cash_transactions stay
    // consistent with add_sale.Total_Received.
    // =========================================================

    if (validSplits.length > 0) {
      await insertPaymentSplits({
        connection,
        sourceType: "Sale",
        sourceId: saleIdNumber,
        partyName: resolvedPartyName,
        txnDate: Invoice_Date,
        splits: validSplits,
      });
    }

    // =========================================================
    // 11. PARTY LEDGER
    // =========================================================

    await recordPartyLedger({
      connection,
      partyId: Party_Id,
      txnType: "Sale",
      referenceId: saleIdNumber,
      amount: totalAmount,
      txnDate: Invoice_Date,
      docNumber: Invoice_Number,
      balanceDue,
    });

    // =========================================================
    // 12. ITEMS — unchanged
    // =========================================================

    // =========================================================
    // 12. ITEMS — with unit resolution + snapshot logic
    // =========================================================

    for (const item of items || []) {

      if (!item.Item_Name?.trim()) {
        if ((normalizeNumber(item.Amount) ?? 0) > 0) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: "Please enter an item name for the row.",
          });
        }
        continue;
      }

      const {
        Item_Name,
        Item_HSN,
        Item_Category,
        Quantity,
        Item_Unit,
        Sale_Price,
        Discount_On_Sale_Price,
        Discount_Type_On_Sale_Price,
        Tax_Type,
        Tax_Amount,
        Amount,
      } = item;

      // UI calls the selected billing unit "Item_Unit"; backend calls it Selected_Unit
      const Selected_Unit = Item_Unit || null;

      const [itemRows] = await connection.execute(
        `SELECT * FROM add_item WHERE TRIM(Item_Name) = TRIM(?) LIMIT 1`,
        [Item_Name]
      );

      let Item_Id;
      let stockDelta;
      let snapshot = { Primary_Unit_Snapshot: null, Secondary_Unit_Snapshot: null };
      let resolvedSelectedUnit = null;

      if (itemRows.length === 0) {
        // =========================================================
        // CASE 1 — BRAND-NEW ITEM CREATED FROM SALE
        //
        // The selected transaction unit becomes the item's first Primary_Unit.
        // If Item_Unit is blank/NONE, everything stays NULL and raw quantity is used.
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
            Item_Name.trim(),
            cleanValue(Item_HSN),

            // Legacy field
            Item_Unit || "",

            Item_Category || "",

            // New unit system
            primaryUnit,
            null,
            null,

            // Sale decreases stock — new item starting stock can go negative
            -(normalizeNumber(Quantity) ?? 0),
          ]
        );

        const itemIdNum = itemResult.insertId;
        Item_Id = "ITM" + itemIdNum.toString().padStart(3, "0");

        await connection.execute(
          `UPDATE add_item SET Item_Id = ? WHERE id = ?`,
          [Item_Id, itemIdNum]
        );

        // Stock already applied above — don't add again below
        stockDelta = normalizeNumber(Quantity) ?? 0;

        snapshot = {
          Primary_Unit_Snapshot: primaryUnit,
          Secondary_Unit_Snapshot: null,
        };

        resolvedSelectedUnit = selectedUnit;

      } else {
        // =========================================================
        // CASE 2 — EXISTING ITEM
        //
        // Never accept Primary_Unit/Secondary_Unit/Conversion_Rate from
        // the frontend — always resolve from the current add_item row,
        // exactly like addPurchase.
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
          return res.status(400).json({ success: false, message: unitErr.message });
        }

        // Sale DECREASES stock — the only difference from addPurchase's "+"
        await connection.execute(
          `
      UPDATE add_item
      SET
        Stock_Quantity = Stock_Quantity - ?,
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

      const [purchaseTax] = await connection.query(
        `SELECT Tax_Type FROM add_purchase_items WHERE Item_Id = ? ORDER BY id DESC LIMIT 1`,
        [Item_Id]
      );

      const safeTaxType = purchaseTax[0]?.Tax_Type || Tax_Type || "None";

      const [saleItemResult] = await connection.execute(
        `INSERT INTO add_sale_items
     (Sale_Id, Item_Id, Quantity, Sale_Price,
      Discount_On_Sale_Price, Discount_Type_On_Sale_Price,
      Tax_Type, Tax_Amount, Amount,
      Primary_Unit_Snapshot, Secondary_Unit_Snapshot, Selected_Unit,
      created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          newSaleId,
          Item_Id,
          normalizeNumber(Quantity) ?? 0,
          normalizeNumber(Sale_Price) ?? 0,
          cleanDiscount(Discount_On_Sale_Price),
          cleanValue(Discount_Type_On_Sale_Price),
          cleanValue(safeTaxType),
          normalizeNumber(Tax_Amount) ?? 0,
          normalizeNumber(Amount) ?? 0,
          snapshot.Primary_Unit_Snapshot,
          snapshot.Secondary_Unit_Snapshot,
          resolvedSelectedUnit,
        ]
      );

      const saleItemIdNum = saleItemResult.insertId;
      const newSaleItemId = "SIT" + saleItemIdNum.toString().padStart(3, "0");

      await connection.execute(
        `UPDATE add_sale_items SET Sale_Items_Id = ? WHERE id = ?`,
        [newSaleItemId, saleItemIdNum]
      );

      await recordItemLedger({
        connection,
        itemId: Item_Id,
        txnType: "Sale",
        referenceId: saleItemIdNum,
        billId: newSaleId,
        billNumber: Invoice_Number,
        partyName: resolvedPartyName,
        quantity: normalizeNumber(Quantity) ?? 0,
        rate: normalizeNumber(Sale_Price) ?? null,
        txnDate: Invoice_Date,
      });
    }

    // =========================================================
    // 19. COMMIT
    // =========================================================

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Sale and items added successfully",
      saleId: newSaleId,
    });

  } catch (err) {

    if (connection) {
      await connection.rollback();
    }

    console.error("❌ Error adding sale:", err);

    next(err);

  } finally {

    if (connection) {
      connection.release();
    }
  }
};
const addNewSale = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    // console.log(req.body);
    // 1️⃣ Sanitize + validate
    const cleanData = sanitizeObject(req.body);
    const validation = saleNewItemFormSchema.safeParse(cleanData);
    if (!validation.success) {
      await connection.rollback();
      return res.status(400).json({ errors: validation.error.errors });
    }

    const {
      Party_Name,
      Invoice_Number,
      Invoice_Date,
      State_Of_Supply,
      Total_Amount,
      GSTIN,
      Total_Received,
      Balance_Due,
      Payment_Type,
      Reference_Number,
      items,
    } = validation.data;

    //  const {
    //   Party_Name,
    //   Invoice_Number,
    //   Invoice_Date,
    //   State_Of_Supply,
    //   Total_Amount,
    //   GSTIN,
    //   Total_Received,
    //   Balance_Due,
    //   Payment_Type,
    //   Reference_Number,
    //   items,
    // } = req.body;

    if (
      !Party_Name ||
      !Invoice_Number ||
      !Invoice_Date ||
      !State_Of_Supply ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      await connection.rollback();
      return res.status(400).json({
        message: "Star marked fields missing or items empty",
      });
    }
    //     const itemNameSet = new Set();
    //     for (const item of items) {
    //   const itemName = item.Item_Name?.trim().toLowerCase();

    //   if (!itemName) {
    //     await connection.rollback();
    //     return res.status(400).json({ message: "Item name missing." });
    //   }

    //   if (itemNameSet.has(itemName)) {
    //     await connection.rollback();
    //     return res.status(400).json({
    //       message: `Duplicate item detected: '${item.Item_Name}'. Each item must appear only once.`,
    //     });
    //   }

    //   itemNameSet.add(itemName);
    // }
    const itemNameSet = new Set();

    for (const item of items) {
      const itemName = item.Item_Name?.trim().toLowerCase();

      if (!itemName) {
        await connection.rollback();
        return res.status(400).json({ message: "Item name missing." });
      }

      if (itemNameSet.has(itemName)) {
        await connection.rollback();
        return res.status(400).json({
          message: `Duplicate item detected: '${item.Item_Name}'`,
        });
      }

      itemNameSet.add(itemName);
    }

    // 2️⃣ Validate unique invoice number
    const [existingInvoice] = await connection.query(
      "SELECT Invoice_Number FROM add_new_sale WHERE Invoice_Number = ? LIMIT 1",
      [Invoice_Number]
    );
    if (existingInvoice.length > 0) {
      await connection.rollback();
      return res
        .status(400)
        .json({ message: "Invoice number already exists, please use a new one." });
    }

    // 3️⃣ Fetch Party_Id
    const [partyRows] = await connection.query(
      "SELECT Party_Id FROM add_party WHERE Party_Name = ? LIMIT 1",
      [Party_Name]
    );
    if (partyRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Party not found." });
    }
    const Party_Id = partyRows[0].Party_Id;

    // 4️⃣ Generate new Sale_Id
    const [lastSale] = await connection.query(
      "SELECT Sale_Id FROM  add_new_sale ORDER BY id DESC LIMIT 1"
    );
    // let newSaleId = "SAL001";
    // if (lastSale.length > 0) {
    //   const num = parseInt(lastSale[0].Sale_Id.replace("SAL", "")) + 1;
    //   newSaleId = "SAL" + num.toString().padStart(3, "0");
    // }

    let nextSaleNum = 1;
    // if (lastHotel.length > 0) {
    //   nextHotelNum = Number(lastHotel[0].hotel_id.replace(/\D/g, "")) + 1;
    // }
    if (lastSale.length > 0) {
      // const num = parseInt(lastSale[0].Sale_Id.replace("SAL", "")) + 1;
      // newSaleId = "SAL" + num.toString().padStart(3, "0");
      nextSaleNum = parseInt(lastSale[0].Sale_Id.replace(/\D/g, "")) + 1;
    }
    const newSaleId = "SALS" + nextSaleNum.toString().padStart(4, "0");

    const [fy] = await connection.query(
      `SELECT Financial_Year 
       FROM financial_year 
       WHERE Current_Financial_Year = 1
       LIMIT 1`
    );

    if (fy.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        message: "No active financial year found. Please set one in settings.",
      });
    }

    const activeFY = fy[0].Financial_Year; // Example: "2025-2026"
    // 5️⃣ Insert into add_sale
    const totalAmount = Number(Total_Amount) || 0;
    const totalReceived =
      Total_Received === "" || Total_Received === undefined
        ? 0
        : Number(Total_Received);

    const balanceDue =
      Balance_Due === "" || Balance_Due === undefined
        ? totalAmount - totalReceived
        : Number(Balance_Due);
    await connection.query(
      `INSERT INTO add_new_sale
       (Party_Id, Sale_Id, Invoice_Number, Invoice_Date,financial_year, State_Of_Supply,
        Total_Amount, Total_Received, Balance_Due, Payment_Type, Reference_Number, 
        created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?,?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        Party_Id,
        newSaleId,
        Invoice_Number,
        Invoice_Date,
        activeFY,
        State_Of_Supply,
        totalAmount,
        totalReceived,
        balanceDue,
        cleanValue(Payment_Type),
        cleanValue(Reference_Number),
      ]
    );


    const [maxRow] = await connection.query(
      "SELECT MAX(CAST(SUBSTRING(Sale_Items_Id, 5) AS UNSIGNED)) AS maxNum FROM add_new_sale_items"
    );
    let nextSaleItemNum = (maxRow[0]?.maxNum || 0) + 1;

    // 7️⃣ Insert each sale item
    for (const item of items) {
      const {
        Item_Name,
        Item_HSN,
        Item_Image,
        Item_Category,
        Quantity,
        Item_Unit,
        Sale_Price,
        Discount_On_Sale_Price,
        Discount_Type_On_Sale_Price,
        Tax_Type,
        Tax_Amount,
        Amount,
      } = item;

      let Item_Id;
      // Ensure item exists
      const [itemRows] = await connection.query(
        "SELECT * FROM add_item_sale WHERE Item_Name = ? LIMIT 1",
        [Item_Name]
      );
      if (itemRows.length === 0) {
        const [lastItem] = await connection.query(
          "SELECT Item_Id FROM add_item_sale ORDER BY id DESC LIMIT 1"
        );

        let newItemId = "ITMS001";
        if (lastItem.length > 0) {
          const lastNum = parseInt(lastItem[0].Item_Id.replace("ITMS", "")) + 1;
          newItemId = "ITMS" + lastNum.toString().padStart(4, "0");
        }

        await connection.execute(
          `INSERT INTO add_item_sale 
           (Item_Id, Item_Name, Item_HSN, Item_Unit, Item_Image, 
           Item_Category, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            newItemId,
            Item_Name,
            Item_HSN || "",
            Item_Unit || "",
            cleanValue(Item_Image),
            Item_Category || ""

          ]
        );

        Item_Id = newItemId;
      } else {
        // Existing item → update stock
        const existingItem = itemRows[0];
        Item_Id = existingItem.Item_Id;

        if (
          existingItem.Item_HSN &&
          Item_HSN &&
          existingItem.Item_HSN.trim() !== Item_HSN.trim()
        ) {
          await connection.rollback();
          return res.status(400).json({
            message: `Item '${Item_Name}' already exists with different HSN (${existingItem.Item_HSN}).`,
          });
        }

        await connection.execute(
          `UPDATE add_item_sale
           SET  updated_at = NOW()
           WHERE Item_Id = ?`,
          [Item_Id]
        );
      }



      // // Generate new sale item id safely
      const newSaleItemId = "SITS" + nextSaleItemNum.toString().padStart(4, "0");
      nextSaleItemNum++;

      // Insert into add_sale_items
      await connection.query(
        `INSERT INTO add_new_sale_items 
         (Sale_Items_Id, Sale_Id, Item_Id, Quantity, Sale_Price, 
          Discount_On_Sale_Price, Discount_Type_On_Sale_Price, 
          Tax_Type, Tax_Amount, Amount, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          newSaleItemId,
          newSaleId,
          Item_Id,
          normalizeNumber(Quantity),
          normalizeNumber(Sale_Price),
          cleanDiscount(Discount_On_Sale_Price),
          cleanValue(Discount_Type_On_Sale_Price),
          cleanValue(Tax_Type),
          normalizeNumber(Tax_Amount),
          normalizeNumber(Amount),
        ]
      );
    }

    // 8️⃣ Commit everything
    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Sale and items added successfully",
      saleId: newSaleId,
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("❌ Error adding sale:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Something went wrong",
    });
    // return res.status(500).json({
    //   success: false,
    //   message: "Duplicate entry detected. Please use unique values.",
    //   stack: err.stack,
    // });
  } finally {
    if (connection) connection.release();
  }
};
const addInvoice = async (req, res, next) => {

  let connection;
  try {
    const { Invoice_Name } = req.body;
    connection = await db.getConnection();
    await connection.beginTransaction();
    const newInvoice = await db.execute(
      `INSERT INTO add_invoice (Invoice_Name, created_at, updated_at) VALUES (?, NOW(), NOW())`,
      [Invoice_Name]
    );

    await connection.commit();
    return res.status(201).json(
      {
        success: true,
        message: "Invoice added successfully",
        invoiceId: newInvoice[0].insertId,
      }
    )
  }
  catch (err) {
    if (connection) await connection.rollback();
    console.error("❌ Error adding invoice:", err);
    next(err);
    // return res.status(500).json({ message: "Internal Server Error" });
  } finally {
    if (connection) connection.release();
  }
}
const updateInvoice = async (req, res, next) => {
  let connection;


  try {
    const { Invoice_Name, id } = req.body;
    connection = await db.getConnection();
    await connection.beginTransaction();
    const newInvoice = await db.execute(
      `UPDATE add_invoice SET Invoice_Name=? WHERE id=?`,
      [Invoice_Name, id]
    );

    await connection.commit();
    return res.status(201).json(
      {
        success: true,
        message: "Invoice updated successfully",
        invoiceId: newInvoice[0].insertId,
      }
    )
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("❌ Error updating invoice:", err);
    next(err);
    // return res.status(500).json({ message: "Internal Server Error" });
  } finally {
    if (connection) connection.release();
  }
}
const getSingleInvoice = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();
    const [rows] = await db.query("SELECT * FROM add_invoice");

    // 🧠 If no invoice exists yet (first-time user)
    if (rows.length === 0) {
      return res.status(200).json({
        success: true,
        invoice: null,
        message: "No invoice found. You can create your first invoice prefix.",
      });
    }

    // ✅ Return the existing invoice (only one per user)
    return res.status(200).json({
      success: true,
      invoice: rows[0],
    });
  } catch (err) {
    if (connection) connection.release();
    console.error("❌ Error getting invoice:", err);
    next(err);
    //return res.status(500).json({ message: "Internal Server Error" });
  } finally {
    if (connection) connection.release();
  }
};
const addNewSaleInvoice = async (req, res, next) => {

  let connection;
  try {
    const { Invoice_Name } = req.body;
    connection = await db.getConnection();
    await connection.beginTransaction();
    const newInvoice = await db.execute(
      `INSERT INTO add_new_sale_invoice (Invoice_Name, created_at, updated_at) VALUES (?, NOW(), NOW())`,
      [Invoice_Name]
    );
    await connection.commit();
    return res.status(201).json(
      {
        success: true,
        message: "Invoice added successfully",
        invoiceId: newInvoice[0].insertId,
      }
    )
  }
  catch (err) {
    if (connection) await connection.rollback();
    console.error("❌ Error adding invoice:", err);
    next(err);
    // return res.status(500).json({ message: "Internal Server Error" });
  } finally {
    if (connection) connection.release();
  }
}
const updateNewSaleInvoice = async (req, res, next) => {

  let connection;
  try {
    const { Invoice_Name, id } = req.body;
    connection = await db.getConnection();
    await connection.beginTransaction();
    const newInvoice = await db.execute(
      `UPDATE add_new_sale_invoice SET Invoice_Name=? WHERE id=?`,
      [Invoice_Name, id]
    );
    await connection.commit();
    return res.status(201).json(
      {
        success: true,
        message: "Invoice updated successfully",
        invoiceId: newInvoice[0].insertId,
      }
    )
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("❌ Error updating invoice:", err);
    next(err);
    // return res.status(500).json({ message: "Internal Server Error" });
  } finally {
    if (connection) connection.release();
  }
}
const getSingleNewSaleInvoice = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();
    const [rows] = await db.query("SELECT * FROM add_new_sale_invoice");

    // 🧠 If no invoice exists yet (first-time user)
    if (rows.length === 0) {
      return res.status(200).json({
        success: true,
        invoice: null,
        message: "No invoice found. You can create your first invoice prefix.",
      });
    }

    // ✅ Return the existing invoice (only one per user)
    return res.status(200).json({
      success: true,
      invoice: rows[0],
    });
  } catch (err) {
    if (connection) connection.release();
    console.error("❌ Error getting invoice:", err);
    next(err);
    //return res.status(500).json({ message: "Internal Server Error" });
  } finally {
    if (connection) connection.release();
  }
};
// const getAllSales = async (req, res, next) => {
//   let connection;
//   try {
//  connection = await db.getConnection();
//     const page = parseInt(req.query.page, 10) || 1;
//     const limit = 10;
//     const offset = (page - 1) * limit;

//     const search = req.query.search ? req.query.search.trim().toLowerCase() : "";
//     const fromDate = req.query.fromDate || null;
//     const toDate = req.query.toDate || null;

//     console.log("🔍 Params =>", { page, search, fromDate, toDate });

//     let whereClauses = [];
//     let params = [];

//     // 🔎 Search
//     if (search) {
//       whereClauses.push(`
//         (LOWER(a.Party_Name) LIKE ? 
//          OR LOWER(s.Payment_Type) LIKE ? 
//          OR LOWER(ba.Account_Display_Name) LIKE ?
//           OR CAST(s.Total_Amount AS CHAR) LIKE ?
//           OR CAST(s.Balance_Due AS CHAR) LIKE ?)
//       `);
//       const like = `%${search}%`;
//       params.push(like, like, like, like, like);
//     }


// if (fromDate && toDate) {
//   whereClauses.push(`s.Invoice_Date BETWEEN ? AND ?`);
//   params.push(
//     `${fromDate} 00:00:00`,
//     `${toDate} 23:59:59`
//   );
// } else if (fromDate) {
//   whereClauses.push(`s.Invoice_Date >= ?`);
//   params.push(`${fromDate} 00:00:00`);
// } else if (toDate) {
//   whereClauses.push(`s.Invoice_Date <= ?`);
//   params.push(`${toDate} 23:59:59`);
// }
//     const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

//     // 🧠 Main Paginated Query
//      const query = `
//       SELECT s.*, a.Party_Name,
//         ba.Account_Display_Name AS Bank_Display_Name,
//         CASE 
//           WHEN s.Payment_Type = 'Bank' THEN ba.Account_Display_Name
//           ELSE s.Payment_Type
//         END AS Payment_Type_Display
//       FROM add_sale s
//       LEFT JOIN add_party a ON s.Party_Id = a.Party_Id
//       LEFT JOIN bank_accounts ba ON s.Bank_Account_Id = ba.id
//       ${whereSQL}
//       ORDER BY s.created_at DESC 
//       LIMIT ? OFFSET ?
//     `;
//     // const query = `
//     //   SELECT s.*, a.Party_Name

//     //   FROM add_sale s
//     //   LEFT JOIN add_party a ON s.Party_Id = a.Party_Id
//     //   ${whereSQL}
//     //   ORDER BY s.created_at DESC 
//     //   LIMIT ? OFFSET ?
//     // `;
//     params.push(limit, offset);

//     const [rows] = await db.query(query, params);


//     const [count] = await db.query(
//       `
//       SELECT COUNT(*) AS total
//       FROM add_sale s
//       LEFT JOIN add_party a ON s.Party_Id = a.Party_Id
//       LEFT JOIN bank_accounts ba ON s.Bank_Account_Id = ba.id
//       ${whereSQL}
//       `,
//       params.slice(0, params.length - 2)
//     );

//     // const [count] = await db.query(
//     //   `SELECT COUNT(*) AS total FROM add_sale`
//     // )

//       const totalsQuery = `
//       SELECT
//         COALESCE(SUM(s.Total_Amount), 0) AS totalAmount,
//         COALESCE(SUM(s.Balance_Due), 0) AS totalBalance,
//         COALESCE(SUM(s.Total_Received), 0) AS totalReceived
//       FROM add_sale s
//       LEFT JOIN add_party a 
//         ON s.Party_Id = a.Party_Id
//       LEFT JOIN bank_accounts ba 
//         ON s.Bank_Account_Id = ba.id
//       ${whereSQL}
//     `;

//     const [totalsResult] = await db.query(totalsQuery, params);
//     return res.status(200).json({
//       currentPage: page,
//       totalPages: Math.ceil(count[0].total / limit),
//       totalSales: count[0].total,
//       sales: rows,
//          totals: totalsResult[0]
//     });

//     //return res.status(200).json(rows);
//   } catch (err) {
//     if(connection)  connection.release();
//     console.error("❌ Error fetching purchases:", err);
//     next(err);
//     // return res.status(500).json({ message: "Internal Server Error" });
//   }finally {
//     if(connection)  connection.release();
//   }
// };
const getAllSales = async (req, res, next) => {
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
    //     LOWER(a.Party_Name)      LIKE ? OR
    //     CAST(s.Total_Amount AS CHAR) LIKE ? OR
    //     CAST(s.Balance_Due  AS CHAR) LIKE ?
    //   )`);
    //   const like = `%${search}%`;
    //   params.push(like, like, like);
    // }
    if (search) {
      whereClauses.push(`(
        a.Party_Name      LIKE ? OR
        CAST(s.Total_Amount AS CHAR) LIKE ? OR
        CAST(s.Balance_Due  AS CHAR) LIKE ? OR
        s.Invoice_Number LIKE ?
      )`);
      const like = `%${search}%`;
      params.push(like, like, like, like);
    }
    if (fromDate && toDate) {
      whereClauses.push(`s.Invoice_Date BETWEEN ? AND ?`);
      params.push(`${fromDate} 00:00:00`, `${toDate} 23:59:59`);
    } else if (fromDate) {
      whereClauses.push(`s.Invoice_Date >= ?`);
      params.push(`${fromDate} 00:00:00`);
    } else if (toDate) {
      whereClauses.push(`s.Invoice_Date <= ?`);
      params.push(`${toDate} 23:59:59`);
    }

    const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const [rows] = await connection.query(
      `SELECT s.*, a.Party_Name
       FROM add_sale s
       LEFT JOIN add_party a ON s.Party_Id = a.Party_Id
       ${whereSQL}
       ORDER BY s.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // 🔹 attach Payment_Type_Display per row from splits
    for (const row of rows) {
      const [splits] = await connection.query(
        `SELECT ps.Payment_Type, ba.Account_Display_Name
         FROM payment_splits ps
         LEFT JOIN bank_accounts ba ON ba.id = ps.Bank_Account_Id
         WHERE ps.Source_Type = 'Sale' AND ps.Source_Id = ?`,
        [row.id]
      );

      const labels = splits.map((s) =>
        s.Payment_Type === "Bank" ? s.Account_Display_Name : s.Payment_Type
      );
      const counts = {};
      labels.forEach((l) => (counts[l] = (counts[l] || 0) + 1));
      row.Payment_Type_Display = Object.entries(counts)
        .map(([label, count]) => (count > 1 ? `${label} (x${count})` : label))
        .join(" , ") || "—";
    }

    const [[{ total }]] = await connection.query(
      `SELECT COUNT(*) AS total
       FROM add_sale s
       LEFT JOIN add_party a ON s.Party_Id = a.Party_Id
       ${whereSQL}`,
      params
    );

    const [[totals]] = await connection.query(
      `SELECT
         COALESCE(SUM(s.Total_Amount),   0) AS totalAmount,
         COALESCE(SUM(s.Balance_Due),    0) AS totalBalance,
         COALESCE(SUM(s.Total_Received), 0) AS totalReceived
       FROM add_sale s
       LEFT JOIN add_party a ON s.Party_Id = a.Party_Id
       ${whereSQL}`,
      params
    );

    return res.status(200).json({
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalSales: total,
      sales: rows,
      totals,
    });
  } catch (err) {
    console.error("❌ Error fetching sales:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

const exportAllSalesReportToExcel = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();

    const search = req.query.search ? req.query.search.trim().toLowerCase() : "";
    const fromDate = req.query.fromDate || null;
    const toDate = req.query.toDate || null;

    const whereClauses = [];
    const params = [];

    if (search) {
      whereClauses.push(`
        (LOWER(a.Party_Name)   LIKE ? OR
         LOWER(s.Payment_Type) LIKE ? OR
         CAST(s.Total_Amount  AS CHAR) LIKE ? OR
         CAST(s.Balance_Due   AS CHAR) LIKE ?)
      `);
      const like = `%${search}%`;
      params.push(like, like, like, like);
    }

    if (fromDate && toDate) {
      whereClauses.push(`s.Invoice_Date BETWEEN ? AND ?`);
      params.push(`${fromDate} 00:00:00`, `${toDate} 23:59:59`);
    } else if (fromDate) {
      whereClauses.push(`s.Invoice_Date >= ?`);
      params.push(`${fromDate} 00:00:00`);
    } else if (toDate) {
      whereClauses.push(`s.Invoice_Date <= ?`);
      params.push(`${toDate} 23:59:59`);
    }

    const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const [rows] = await connection.query(
      `SELECT s.*, a.Party_Name, a.GSTIN
       FROM add_sale s
       LEFT JOIN add_party a ON s.Party_Id = a.Party_Id
       ${whereSQL}
       ORDER BY s.Invoice_Date DESC`,
      params
    );

    const [[totals]] = await connection.query(
      `SELECT
         COALESCE(SUM(s.Total_Amount),   0) AS totalAmount,
         COALESCE(SUM(s.Balance_Due),    0) AS totalBalance,
         COALESCE(SUM(s.Total_Received), 0) AS totalReceived
       FROM add_sale s
       LEFT JOIN add_party a ON s.Party_Id = a.Party_Id
       ${whereSQL}`,
      params
    );

    /* ════════════════════════════════════════════════════════
       BUILD WORKBOOK
    ════════════════════════════════════════════════════════ */
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Sale Report");
    const itemSheet = workbook.addWorksheet("Item Details");

    /* ── palette — pure black & white, no color fills ── */
    const WHITE = "FFFFFFFF";
    const BLACK = "FF000000";
    const STAMP_CLR = "FF595959";

    /* ── 8 columns ── */
    sheet.columns = [
      { key: "date", width: 14 },   // A
      { key: "invoice", width: 18 },   // B
      { key: "party", width: 34 },   // C
      { key: "gstin", width: 22 },   // D
      { key: "amount", width: 16 },   // E  Total Amount
      { key: "payment", width: 14 },   // F  Payment Type
      { key: "received", width: 20 },   // G  Received/Paid
      { key: "balance", width: 16 },   // H  Balance Due
    ];

    const LAST_COL = "H";
    const TOTAL_COLS = 8;

    /* ─── ROW 1 : report title ─── */
    sheet.mergeCells(`A1:${LAST_COL}1`);
    const titleCell = sheet.getCell("A1");
    titleCell.value = "SALES REPORT";
    titleCell.font = { name: "Calibri", bold: true, size: 14, color: { argb: BLACK } };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    sheet.getRow(1).height = 28;

    /* ─── ROW 2 : generated-on stamp ─── */
    sheet.mergeCells(`A2:${LAST_COL}2`);
    const generatedOn = new Date().toLocaleString("en-IN", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true,
    });
    const stampCell = sheet.getCell("A2");
    stampCell.value = `Generated on ${generatedOn}`;
    stampCell.font = { name: "Calibri", size: 10, italic: true, color: { argb: STAMP_CLR } };
    stampCell.alignment = { horizontal: "left", vertical: "middle" };
    sheet.getRow(2).height = 18;

    /* ─── ROW 3 : blank spacer ─── */
    sheet.addRow([]);
    sheet.getRow(3).height = 6;

    /* ─── ROW 4 : column headers ─── */
    const HEADERS = [
      "Date", "Invoice No", "Party Name", "GSTIN",
      "Total Amount", "Payment Type", "Received/Paid Amount", "Balance Due",
    ];

    const headerRow = sheet.addRow(HEADERS);
    headerRow.eachCell((cell) => {
      cell.font = { name: "Calibri", bold: true, size: 10, color: { argb: BLACK } };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = {
        top: { style: "thin", color: { argb: BLACK } },
        left: { style: "thin", color: { argb: BLACK } },
        bottom: { style: "thin", color: { argb: BLACK } },
        right: { style: "thin", color: { argb: BLACK } },
      };
    });
    sheet.getRow(headerRow.number).height = 22;

    /* ─── DATA ROWS (start row 5) ─── */
    const FIRST_DATA = 5;
    rows.forEach((sale) => {
      const dataRow = sheet.addRow([
        sale.Invoice_Date
          ? new Date(sale.Invoice_Date).toLocaleDateString("en-IN", {
            day: "2-digit", month: "2-digit", year: "numeric",
          })
          : "N/A",
        sale.Invoice_Number || "N/A",
        sale.Party_Name || "N/A",
        sale.GSTIN || "",
        Number(sale.Total_Amount || 0),
        sale.Payment_Type || "N/A",
        Number(sale.Total_Received || 0),
        Number(sale.Balance_Due || 0),
      ]);

      dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.font = { name: "Calibri", size: 10, color: { argb: BLACK } };
        cell.alignment = { vertical: "middle" };
        cell.border = {
          top: { style: "hair", color: { argb: BLACK } },
          left: { style: "hair", color: { argb: BLACK } },
          bottom: { style: "hair", color: { argb: BLACK } },
          right: { style: "hair", color: { argb: BLACK } },
        };

        /* numeric columns: E(5) G(7) H(8) */
        if (colNumber === 5 || colNumber === 7 || colNumber === 8) {
          cell.numFmt = "₹#,##0.00";
          cell.alignment = { horizontal: "right", vertical: "middle" };
        }

        /* emphasize non-zero Balance Due — bold only, no color */
        if (colNumber === 8 && Number(sale.Balance_Due || 0) > 0) {
          cell.font = { name: "Calibri", size: 10, color: { argb: BLACK }, bold: true };
        }
      });

      dataRow.height = 18;
    });

    /* ─── TOTAL ROW ─── */
    const lastDataRow = sheet.rowCount;

    const totalRow = sheet.addRow([
      "", "", "", "TOTAL",
      { formula: `SUM(E${FIRST_DATA}:E${lastDataRow})` },
      "",
      { formula: `SUM(G${FIRST_DATA}:G${lastDataRow})` },
      { formula: `SUM(H${FIRST_DATA}:H${lastDataRow})` },
    ]);

    totalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { name: "Calibri", bold: true, size: 11, color: { argb: BLACK } };
      cell.alignment = { horizontal: "right", vertical: "middle" };
      cell.border = {
        top: { style: "medium", color: { argb: BLACK } },
        left: { style: "thin", color: { argb: BLACK } },
        bottom: { style: "medium", color: { argb: BLACK } },
        right: { style: "thin", color: { argb: BLACK } },
      };
      if (colNumber === 5 || colNumber === 7 || colNumber === 8) {
        cell.numFmt = "₹#,##0.00";
      }
      if (colNumber === 4) cell.alignment = { horizontal: "right", vertical: "middle" };
    });
    totalRow.height = 24;

    /* ─── freeze top 4 rows (title + stamp + spacer + header) ─── */
    sheet.views = [{ state: "frozen", ySplit: 4 }];

    /* ─── Item Details sheet placeholder ─── */
    itemSheet.columns = [{ width: 30 }];
    itemSheet.addRow(["Item-level detail export — coming soon"]);

    /* ════════════════════════════════════════════════════════
       STREAM TO CLIENT
    ════════════════════════════════════════════════════════ */
    const label = fromDate && toDate
      ? `SaleReport_${fromDate}_to_${toDate}`
      : `SaleReport_${new Date().toISOString().slice(0, 10)}`;

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
    console.error("❌ Excel export error:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};
const getAllNewSales = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const search = req.query.search ? req.query.search.trim().toLowerCase() : "";
    const fromDate = req.query.fromDate || null;
    const toDate = req.query.toDate || null;

    console.log("🔍 Params =>", { page, search, fromDate, toDate });

    let whereClauses = [];
    let params = [];

    // 🔎 Search
    if (search) {
      whereClauses.push(`
        (LOWER(a.Party_Name) LIKE ? 
         OR LOWER(s.Payment_Type) LIKE ? 
         OR CAST(s.Balance_Due AS CHAR) LIKE ?
         OR LOWER(s.Total_Amount) LIKE ?)
      `);
      const like = `%${search}%`;
      params.push(like, like, like, like);
    }

    // 📅 Date Range
    // if (fromDate && toDate) {
    //   whereClauses.push("DATE(s.created_at) BETWEEN ? AND ?");
    //   params.push(fromDate, toDate);
    // } else if (fromDate) {
    //   whereClauses.push("DATE(s.created_at) >= ?");
    //   params.push(fromDate);
    // } else if (toDate) {
    //   whereClauses.push("DATE(s.created_at) <= ?");
    //   params.push(toDate);
    // }
    if (fromDate && toDate) {
      whereClauses.push(`s.Invoice_Date BETWEEN ? AND ?`);
      params.push(
        `${fromDate} 00:00:00`,
        `${toDate} 23:59:59`
      );
    } else if (fromDate) {
      whereClauses.push(`s.Invoice_Date >= ?`);
      params.push(`${fromDate} 00:00:00`);
    } else if (toDate) {
      whereClauses.push(`s.Invoice_Date <= ?`);
      params.push(`${toDate} 23:59:59`);
    }
    const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

    // 🧠 Main Paginated Query
    const query = `
      SELECT s.*, a.Party_Name
      FROM add_new_sale s
      LEFT JOIN add_party a ON s.Party_Id = a.Party_Id
      ${whereSQL}
      ORDER BY GREATEST(s.updated_at, s.created_at) DESC 
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);

    const [rows] = await db.query(query, params);

    //const [rows] = await db.query(query, params);


    // const [rows] = await db.query(
    //   `SELECT s.*, a.Party_Name 
    //    FROM add_sale s
    //    LEFT JOIN add_party a ON s.Party_Id = a.Party_Id
    //    ORDER BY s.created_at DESC
    //    LIMIT ? OFFSET ?`,
    //   [limit, offset]
    // );
    const [count] = await db.query(
      `
      SELECT COUNT(*) AS total
      FROM add_new_sale s
      LEFT JOIN add_party a ON s.Party_Id = a.Party_Id
      ${whereSQL}
      `,
      params.slice(0, params.length - 2)
    );

    // const [count] = await db.query(
    //   `SELECT COUNT(*) AS total FROM add_sale`
    // )
    return res.status(200).json({
      currentPage: page,
      totalPages: Math.ceil(count[0].total / limit),
      totalSales: count[0].total,
      sales: rows,
    });

    //return res.status(200).json(rows);
  } catch (err) {
    if (connection) connection.release();
    console.error("❌ Error fetching purchases:", err);
    next(err);
    // return res.status(500).json({ message: "Internal Server Error" });
  } finally {
    if (connection) connection.release();
  }
};
const getSingleSale = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();
    const { Sale_Id: saleId } = req.params;

    if (!saleId) {
      return res.status(400).json({ success: false, message: "Sale ID is required." });
    }

    const isSaleForItemSale = saleId.startsWith("SALS");
    // const salesTable    = isSaleForItemSale ? "add_new_sale"       : "add_sale";
    // const saleItemTable = isSaleForItemSale ? "add_new_sale_items" : "add_sale_items";
    // const itemTable     = isSaleForItemSale ? "add_item_sale"      : "add_item";

    const salesTable = isSaleForItemSale ? "add_sale" : "add_sale";
    const saleItemTable = isSaleForItemSale ? "add_sale_items" : "add_sale_items";
    const itemTable = isSaleForItemSale ? "add_item" : "add_item";

    const [saleData] = await connection.query(
      `SELECT
     s.id,
     s.Sale_Id,
     s.Phone_Number,
     s.Billing_Name,
     s.Billing_Address,
     s.Invoice_Number,
     s.Invoice_Date,
     s.State_Of_Supply,
     s.Total_Amount,
     s.Total_Received,
     s.Balance_Due,
     s.Party_Id,

     -- Terms saved on this invoice
     s.Terms_Conditions_Id,
     s.Terms_Conditions_Description,

     -- Party master
     p.Party_Name,
     p.GSTIN,

     -- Title only exists when this invoice is linked
     -- to a master Terms & Conditions template
     tc.Title AS Terms_Conditions_Title

   FROM ${salesTable} s

   LEFT JOIN add_party p
     ON s.Party_Id = p.Party_Id

   LEFT JOIN terms_conditions tc
     ON s.Terms_Conditions_Id = tc.id

   WHERE s.Sale_Id = ?`,
      [saleId]
    );

    if (!saleData.length) {
      return res.status(404).json({ success: false, message: "Sale not found." });
    }

    const saleHeader = saleData[0];

    // const [items] = await connection.query(
    //   `SELECT
    //      si.Sale_Items_Id, si.Item_Id,
    //      i.Item_Name, i.Item_HSN, i.Item_Unit, 
    //      i.Item_Category,
    //      si.Quantity, si.Sale_Price,
    //      si.Discount_On_Sale_Price, si.Discount_Type_On_Sale_Price,
    //      si.Tax_Amount, si.Tax_Type, si.Amount, si.created_at
    //    FROM ${saleItemTable} si
    //    LEFT JOIN ${itemTable} i ON si.Item_Id = i.Item_Id
    //    WHERE si.Sale_Id = ?
    //    ORDER BY si.created_at DESC`,
    //   [saleId]
    // );
    const [items] = await connection.query(
      `
  SELECT
    si.Sale_Items_Id,
    si.Item_Id,

    i.Item_Name,
    i.Item_HSN,
    i.Item_Unit,
    i.Item_Category,

    -- CURRENT ITEM MASTER
    i.Primary_Unit AS Current_Primary_Unit,
    i.Secondary_Unit AS Current_Secondary_Unit,

    si.Quantity,

    -- HISTORICAL SALE SNAPSHOT
    si.Primary_Unit_Snapshot,
    si.Secondary_Unit_Snapshot,
    si.Selected_Unit,

    si.Sale_Price,
    si.Discount_On_Sale_Price,
    si.Discount_Type_On_Sale_Price,
    si.Tax_Amount,
    si.Tax_Type,
    si.Amount,
    si.created_at

  FROM ${saleItemTable} si

  LEFT JOIN ${itemTable} i
    ON si.Item_Id = i.Item_Id

  WHERE si.Sale_Id = ?

  ORDER BY si.created_at DESC
  `,
      [saleId]
    );

    // if (!items.length) {
    //   return res.status(404).json({ success: false, message: "No sale items found for this invoice." });
    // }
    const [allUnits] = await connection.query(
      `
  SELECT
    Unit_Shorthand,
    Unit_Name
  FROM units
  ORDER BY Unit_Name ASC
  `
    );
    const formattedItems = items.map((it) => {
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


      // =====================================================
      // DID THIS OLD SALE ACTUALLY USE THE OLD SECONDARY?
      // =====================================================
      //
      // Old snapshot:
      // KG / GM
      //
      // Selected:
      // GM
      //
      // => true
      // =====================================================

      const oldUsedSecondary =
        oldSecondary &&
        oldSelected === oldSecondary;


      let unitCodes = [];


      // =====================================================
      // CASE 1
      // OLD SALE USED SECONDARY
      //
      // Old sale:
      // KG / GM
      // selected GM
      //
      // Current master:
      // KG / BOX
      //
      // EDIT OLD SALE SHOW:
      // KG / GM
      // =====================================================

      if (oldUsedSecondary) {
        unitCodes = [
          oldPrimary,
          oldSecondary,
        ].filter(Boolean);
      }


      // =====================================================
      // CASE 2
      // OLD SALE USED PRIMARY
      //
      // Old sale:
      // KG / GM
      // selected KG
      //
      // Current master:
      // KG / BOX
      //
      // EDIT OLD SALE SHOW:
      // KG / BOX
      // =====================================================

      else {
        unitCodes = [
          currentPrimary,
          currentSecondary,
        ].filter(Boolean);
      }


      // Remove duplicate units
      unitCodes = [...new Set(unitCodes)];


      // =====================================================
      // CREATE Available_Units
      // =====================================================

      const availableUnits = unitCodes.map((unitCode) => {
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


      return {
        Sale_Items_Id: it.Sale_Items_Id,

        Item_Id: it.Item_Id,

        Item_Name: it.Item_Name,

        Item_HSN: it.Item_HSN,

        // Legacy field
        Item_Unit: it.Item_Unit,

        Item_Category: it.Item_Category,

        Quantity: it.Quantity,


        // ================================================
        // HISTORICAL TRANSACTION UNIT DATA
        // ================================================

        Primary_Unit:
          it.Primary_Unit_Snapshot,

        Secondary_Unit:
          it.Secondary_Unit_Snapshot,

        Selected_Unit:
          it.Selected_Unit,

        // What Edit Sale dropdown should display
        Available_Units:
          availableUnits,


        // ================================================
        // PRICE / TAX
        // ================================================

        Sale_Price:
          it.Sale_Price,

        Discount_On_Sale_Price:
          it.Discount_On_Sale_Price,

        Discount_Type_On_Sale_Price:
          it.Discount_Type_On_Sale_Price,

        Tax_Amount:
          it.Tax_Amount,

        Tax_Type:
          it.Tax_Type || "None",

        Amount:
          it.Amount,

        created_at:
          it.created_at,
      };
    });
    // 🔹 fetch splits with bank display name
    const [splits] = await connection.query(
      `SELECT ps.*, ba.Account_Display_Name
       FROM payment_splits ps
       LEFT JOIN bank_accounts ba ON ba.id = ps.Bank_Account_Id
       WHERE ps.Source_Type = 'Sale' AND ps.Source_Id = ?
       ORDER BY ps.id ASC`,
      [saleHeader.id]   // numeric id — add to SELECT if not already there
    );

    // build a display summary for the header (e.g. "Cash + HDFC")
    const splitLabels = splits.map((s) =>
      s.Payment_Type === "Bank" ? s.Account_Display_Name : s.Payment_Type
    );
    const counts = {};
    splitLabels.forEach((l) => (counts[l] = (counts[l] || 0) + 1));
    const Payment_Type_Display = Object.entries(counts)
      .map(([label, count]) => (count > 1 ? `${label} (x${count})` : label))
      .join(" + ");

    return res.status(200).json({
      success: true,

      invoicePartyDetails: {
        Sale_Id: saleHeader.Sale_Id,
        Party_Name: saleHeader.Party_Name,
        Billing_Name: saleHeader.Billing_Name,
        Phone_Number: saleHeader.Phone_Number,
        Billing_Address: saleHeader.Billing_Address,
        GSTIN: saleHeader.GSTIN,
        State_Of_Supply: saleHeader.State_Of_Supply,
        //Reference_Number: saleHeader.Reference_Number,
        Payment_Type_Display,
        Invoice_Number: saleHeader.Invoice_Number,
        Invoice_Date: saleHeader.Invoice_Date,
        Total_Amount: saleHeader.Total_Amount,
        Total_Received: saleHeader.Total_Received,
        Balance_Due: saleHeader.Balance_Due,
        Terms_Conditions_Id: saleHeader.Terms_Conditions_Id,
        Terms_Conditions_Description: saleHeader.Terms_Conditions_Description

      },

      splits: splits.map((split) => ({
        Id: split.id,
        Payment_Type: split.Payment_Type,
        Bank_Account_Id: split.Bank_Account_Id,
        Account_Display_Name: split.Account_Display_Name,
        Reference_Number: split.Reference_Number,
        Amount: split.Amount,
      })),
      items: formattedItems,
      // items: items.map((it) => ({
      //   Sale_Items_Id: it.Sale_Items_Id,
      //   Item_Id: it.Item_Id,
      //   Item_Name: it.Item_Name,
      //   Item_HSN: it.Item_HSN,
      //   Item_Unit: it.Item_Unit,
      //   Item_Category: it.Item_Category,
      //   Quantity: it.Quantity,
      //   Sale_Price: it.Sale_Price,
      //   Discount_On_Sale_Price: it.Discount_On_Sale_Price,
      //   Discount_Type_On_Sale_Price: it.Discount_Type_On_Sale_Price,
      //   Tax_Amount: it.Tax_Amount,
      //   Tax_Type: it.Tax_Type || "None",
      //   Amount: it.Amount,
      //   created_at: it.created_at,
      // })),
    });
  } catch (err) {
    console.error("❌ Error getting single sale:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};
const generateInvoiceHtml = (sale) => {
  const { invoicePartyDetails, items } = sale;


  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Invoice</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
          }
          header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #ddd;
            padding-bottom: 10px;
          }

          /* --- Invoice Meta Section --- */
          .meta-container {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            gap: 12px;
            margin: 20px 0;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            padding: 12px;
          }

          .meta-item {
            flex: 1 1 45%;
            min-width: 250px;
          }

          .meta-item strong {
            display: block;
            font-weight: bold;
            color: #222;
            margin-bottom: 4px;
          }

          /* --- Address Section --- */
          .address-section {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            overflow: hidden;
          }

          .address-box {
            flex: 1;
            padding: 12px 16px;
          }

          .address-box h4 {
            margin-bottom: 8px;
            border-bottom: 1px solid #ccc;
            padding-bottom: 4px;
          }

          .divider {
            width: 1px;
            background-color: #e0e0e0;
          }

          /* --- Items Table --- */
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }

          th, td {
            border: 1px solid #ccc;
            padding: 8px;
            text-align: center;
          }

          th {
            background-color: #f8f8f8;
          }

          /* --- Totals Section --- */
          .totals {
            margin-top: 20px;
            float: right;
          }

          .totals table {
            border-collapse: collapse;
          }

          .totals td {
            padding: 6px 12px;
            border: 1px solid #ccc;
          }
    footer { position: fixed; bottom: 30px; left: 0; right: 0; text-align: center; font-size: 12px; 
    color: #555; }
         
        </style>
      </head>
      <body>
        <header>
          <h1>Invoice</h1>
          <div class="invoice-meta">
            <strong>Invoice Number:</strong> ${invoicePartyDetails?.Invoice_Number || "N/A"}<br/>
            <strong>Date:</strong> ${new Date(invoicePartyDetails?.Invoice_Date).toLocaleDateString("en-IN")}
          </div>
        </header>

        <!-- 🧾 Meta Information -->
        <div class="meta-container">
          <div class="meta-item">
            <strong>Party Name</strong>
            <span>${invoicePartyDetails?.Party_Name || "N/A"}</span>
          </div>

          <div class="meta-item">
            <strong>GSTIN</strong>
            <span>${invoicePartyDetails?.GSTIN || "N/A"}</span>
          </div>

          <div class="meta-item">
            <strong>State of Supply</strong>
            <span>${invoicePartyDetails?.State_Of_Supply || "N/A"}</span>
          </div>

          <div class="meta-item">
            <strong>Payment Type</strong>
            <span>${invoicePartyDetails?.Payment_Type || "N/A"}</span>
          </div>

          ${invoicePartyDetails?.Reference_Number
      ? `<div class="meta-item" style="flex: 1 1 100%;">
                  <strong>Reference Number</strong>
                  <span>${invoicePartyDetails.Reference_Number}</span>
                </div>`
      : ""
    }
        </div>

        
        
          
              <div class="address-section">
                ${invoicePartyDetails?.Billing_Address
      ? `<div class="address-box">
                        <h4>Billed To</h4>
                        <p>${invoicePartyDetails.Billing_Address}</p>
                      </div>`
      : ""
    }
                ${invoicePartyDetails?.Shipping_Address
      ? `<div class="divider"></div>
                      <div class="address-box">
                        <h4>Shipped To</h4>
                        <p>${invoicePartyDetails.Shipping_Address}</p>
                      </div>`
      : ""
    }
              </div>
            
        

        <!-- 📦 Items Table -->
        <table>
          <thead>
            <tr>
              <th>Sl.No</th>
              <th>Category</th>
              <th>Item</th>
              <th>HSN</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Discount</th>
              <th>Tax Type</th>
              <th>Tax</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${items
      ?.map(
        (it, idx) => `
                    <tr>
                      <td>${idx + 1}</td>
                      <td>${it?.Item_Category || ""}</td>
                      <td>${it?.Item_Name || ""}</td>
                      <td>${it?.Item_HSN || ""}</td>
                      <td>${it?.Quantity || 0} ${it?.Item_Unit || ""}</td>
                      <td>${Number(it?.Sale_Price || 0).toFixed(2)}</td>
                      <td>${it?.Discount_Type_On_Sale_Price === "Percentage"
            ? it?.Discount_On_Sale_Price == 0.00 ? "0%" : it?.Discount_On_Sale_Price + "%"
            : "₹" + it?.Discount_On_Sale_Price
          }</td>
                      <td>${Object.keys(TAX_TYPES).includes(it?.Tax_Type)
            ? TAX_TYPES[it?.Tax_Type]
            : it?.Tax_Type
          }</td>
                      <td>${Number(it?.Tax_Amount || 0).toFixed(2)}</td>
                      <td>${Number(it?.Amount || 0).toFixed(2)}</td>
                    </tr>
                  `
      )
      .join("") || ""
    }
          </tbody>
        </table>

        <!-- 💰 Totals Section -->
        <div class="totals">
          <table>
            <tr><td><strong>Total Amount</strong></td><td>${invoicePartyDetails?.Total_Amount || 0}</td></tr>
            <tr><td><strong>Received</strong></td><td>${invoicePartyDetails?.Total_Received || 0}</td></tr>
            <tr><td><strong>Balance Due</strong></td><td>${invoicePartyDetails?.Balance_Due || 0}</td></tr>
          </table>
        </div>

        <footer>Thank you for your business!</footer>
      </body>
    </html>
  `;

  return html;
};




// Main controller function to handle PDF creation
// const printSaleBill = async (req, res, next) => {
//   // 1. Fetch data (replace this with your actual DB query logic)
//   // For demonstration, assume 'sale' data is fetched here:
//  const sale = req.body;
//   console.log(sale);
//   if (!sale) {
//     return res.status(400).send("No invoice data provided.");
//   }

//   // 2. Generate the HTML content
//   const htmlContent = generateInvoiceHtml(sale);

//   let browser;
//   try {
//     // 3. Launch Puppeteer (headless Chrome)
//     browser = await puppeteer.launch({
//       args: ['--no-sandbox', '--disable-setuid-sandbox']
//     });
//     const page = await browser.newPage();

//     // 4. Set the HTML content
//     await page.setContent(htmlContent, {
//       waitUntil: 'networkidle0' // Wait until the network is idle
//     });

//     // 5. Generate PDF
//     const pdfBuffer = await page.pdf({
//       format: 'A4',
//       printBackground: true, // Ensure background colors/images are printed
//       preferCSSPageSize: true, // Use sizes defined in CSS @page rules if present
//     });

//     // 6. Send the PDF buffer back to the client
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `inline; filename=Invoice-${sale?.invoicePartyDetails?.Invoice_Number}.pdf`);
//     res.send(pdfBuffer);

//   } catch (error) {
//     console.error('PDF Generation Error:', error);
//     // next(error);
//     return res.status(500).send('Error generating PDF.');
//   } finally {
//     if (browser) {
//       await browser.close();
//     }
//   }
// };
// const printSaleBill = async (req, res) => {
//   const sale = req.body;
//   if (!sale) return res.status(400).send("No invoice data provided.");

//   const htmlContent = generateInvoiceHtml(sale);
//   const file = { content: htmlContent };

//   try {
//     const pdfBuffer = await pdf.generatePdf(file, {
//       format: "A4",
//       printBackground: true,
//       preferCSSPageSize: true,
//     });

//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `inline; filename=Invoice-${sale?.invoicePartyDetails?.Invoice_Number}.pdf`
//     );
//     res.send(pdfBuffer);
//   } catch (err) {
//     console.error("PDF generation failed:", err);
//     res.status(500).send("Error generating PDF");
//   }
// };


const fonts = {
  Helvetica: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique",
  },
};




const printer = new PdfPrinter(fonts);


const printSaleBill = async (req, res) => {
  try {
    const sale = req.body;
    if (!sale) return res.status(400).send("No invoice data provided.");

    const { invoicePartyDetails, items } = sale;
    const safe = (v) => (v ? v : "N/A");

    const docDefinition = {
      pageMargins: [30, 30, 30, 60], // left, top, right, bottom (space for footer)
      footer: (currentPage, pageCount) => ({
        text: `Thank you for your business! — Page ${currentPage} of ${pageCount}`,
        alignment: "center",
        fontSize: 10,
        color: "#555",
        margin: [0, 10, 0, 0],
      }),

      content: [
        // 🧾 HEADER (Centered)
        {
          stack: [
            { text: "INVOICE", style: "header", alignment: "center" },
            {
              columns: [
                {
                  width: "*",
                  alignment: "center",
                  stack: [
                    {
                      text: `Invoice Number: ${safe(invoicePartyDetails?.Invoice_Number)}`,
                      style: "meta",
                      alignment: "center",
                    },
                    {
                      text: `Date: ${new Date(
                        invoicePartyDetails?.Invoice_Date
                      ).toLocaleDateString("en-IN")}`,
                      style: "meta",
                      alignment: "center",
                    },
                  ],
                },
              ],
            },
          ],
          margin: [0, 0, 0, 15],
        },


        {
          style: "section",
          table: {
            widths: ["50%", "50%"],
            body: [
              [
                {
                  stack: [
                    { text: "Party Name", style: "label", margin: [0, 2, 0, 1] },
                    { text: safe(invoicePartyDetails?.Party_Name), style: "value", margin: [0, 0, 0, 4] },
                    { text: "GSTIN", style: "label", margin: [0, 2, 0, 1] },
                    { text: safe(invoicePartyDetails?.GSTIN), style: "value", margin: [0, 0, 0, 4] },
                  ],
                  border: [false, false, true, false],
                },
                {
                  stack: [
                    { text: "State of Supply", style: "label", margin: [0, 2, 0, 1] },
                    { text: safe(invoicePartyDetails?.State_Of_Supply), style: "value", margin: [0, 0, 0, 4] },
                    { text: "Payment Type", style: "label", margin: [0, 2, 0, 1] },
                    { text: safe(invoicePartyDetails?.Payment_Type), style: "value", margin: [0, 0, 0, 4] },
                    ...(invoicePartyDetails?.Reference_Number
                      ? [
                        { text: "Reference Number", style: "label", margin: [0, 2, 0, 1] },
                        { text: invoicePartyDetails.Reference_Number, style: "value", margin: [0, 0, 0, 4] },
                      ]
                      : []),
                  ],
                },
              ],
            ],
          },
          layout: "lightHorizontalLines",
          margin: [0, 5, 0, 5], // Adds spacing around the table itself
        },

        // 🏠 Addresses
        {
          columns: [
            invoicePartyDetails?.Billing_Address
              ? {
                width: "50%",
                stack: [
                  { text: "Billed To", style: "labelBold" },
                  { text: invoicePartyDetails.Billing_Address, style: "value" },
                ],
              }
              : {},
            invoicePartyDetails?.Shipping_Address
              ? {
                width: "50%",
                stack: [
                  { text: "Shipped To", style: "labelBold" },
                  { text: invoicePartyDetails.Shipping_Address, style: "value" },
                ],
              }
              : {},
          ],
          columnGap: 20,
          margin: [0, 10, 0, 0],
        },

        // 📦 Items Table
        {
          style: "tableExample",
          table: {
            headerRows: 1,
            widths: [30, 50, 50, 45, 35, 40, 50, 50, 45, 55],
            body: [
              [
                { text: "Sl.No", style: "tableHeader" },
                { text: "Category", style: "tableHeader" },
                { text: "Item", style: "tableHeader" },
                { text: "HSN", style: "tableHeader" },
                { text: "Qty", style: "tableHeader" },
                { text: "Price", style: "tableHeader" },
                { text: "Discount", style: "tableHeader" },
                { text: "Tax Type", style: "tableHeader" },
                { text: "Tax", style: "tableHeader" },
                { text: "Amount", style: "tableHeader" },
              ],
              ...items.map((it, idx) => [
                { text: idx + 1, style: "numeric" },
                safe(it.Item_Category),
                safe(it.Item_Name),
                safe(it.Item_HSN),
                { text: `${it.Quantity || 0} ${safe(it.Item_Unit)}`, style: "numeric" },
                { text: Number(it?.Sale_Price || 0).toFixed(2), style: "numeric" },
                {
                  text:
                    it?.Discount_Type_On_Sale_Price === "Percentage"
                      ? it?.Discount_On_Sale_Price == 0.0
                        ? "0%"
                        : `${it.Discount_On_Sale_Price}%`
                      : "₹" + (it.Discount_On_Sale_Price || 0),
                  style: "numeric",
                },
                Object.keys(TAX_TYPES).includes(it?.Tax_Type)
                  ? TAX_TYPES[it?.Tax_Type]
                  : it?.Tax_Type,
                // safe(it.Tax_Type),
                { text: Number(it?.Tax_Amount || 0).toFixed(2), style: "numeric" },
                { text: Number(it?.Amount || 0).toFixed(2), style: "numeric" },
              ]),
            ],
          },
          layout: {
            fillColor: (rowIndex) => (rowIndex === 0 ? "#f2f2f2" : null),
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
          },
          margin: [0, 10, 0, 0],
        },

        // 💰 Totals Box (Right Side)
        {
          columns: [
            { width: "*", text: "" },
            {
              width: "37%",
              table: {
                widths: ["*", "auto"],
                body: [
                  [{ text: "Total Amount", style: "labelBold" }, { text: `${invoicePartyDetails?.Total_Amount || 0}`, style: "numeric" }],
                  [{ text: "Received", style: "labelBold" }, { text: `${invoicePartyDetails?.Total_Received || 0}`, style: "numeric" }],
                  [
                    { text: "Balance Due", style: "labelBoldRed" },
                    //{ text: `${invoicePartyDetails?.Balance_Due || 0}` },
                    { text: `${invoicePartyDetails?.Balance_Due || 0}`, style: "numericRed" },
                  ],
                ],
              },
              layout: {
                hLineColor: "#999",
                vLineColor: "#999",
                fillColor: (rowIndex) => (rowIndex % 2 === 0 ? "#fafafa" : null),
              },
              margin: [0, 15, 0, 0],
            },
          ],
        },
      ],

      styles: {
        header: { fontSize: 18, bold: true, margin: [10, 10, 10, 10] },
        meta: { fontSize: 11, margin: [0, 2, 0, 2] },
        section: { margin: [0, 10, 0, 10] },
        tableHeader: { bold: true, fillColor: "#f2f2f2", fontSize: 11 },
        label: { bold: true, fontSize: 11 },
        labelBold: { bold: true, fontSize: 12, margin: [0, 5, 0, 3] },
        labelBoldRed: { bold: true, color: "black", fontSize: 11 },
        value: { fontSize: 11 },
        numeric: { alignment: "right", fontSize: 11 },
        numericRed: { alignment: "right", fontSize: 11, color: "black" },
        tableExample: { fontSize: 11 },
      },
      defaultStyle: { font: "Helvetica" },
    };

    // Generate PDF
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const chunks = [];
    pdfDoc.on("data", (chunk) => chunks.push(chunk));
    pdfDoc.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename=Invoice-${invoicePartyDetails?.Invoice_Number}.pdf`
      );
      res.send(pdfBuffer);
    });
    pdfDoc.end();
  } catch (err) {
    console.error("PDF generation failed:", err);
    res.status(500).send("Error generating PDF");
  }
};

/**
 * Helper: Generate next ID (e.g., SIT001)
 */
const generateNextId = async (connection, table, column, prefix) => {
  const [latest] = await connection.query(
    `SELECT ${column} FROM ${table} ORDER BY id DESC LIMIT 1`
  );
  let nextNum = 1;
  if (latest.length > 0) {
    const lastId = latest[0][column];
    nextNum = parseInt(lastId.replace(prefix, "")) + 1;
  }
  return prefix + nextNum.toString().padStart(3, "0");
};

/**
 * Edit Sale Controller
 */

const editSale = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    const { Sale_Id: saleId } = req.params;

    const [existingSale] = await connection.query(
      "SELECT * FROM add_sale WHERE Sale_Id = ?",
      [saleId]
    );
    if (existingSale.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "No such Sale found.",
      });
    }
    // IMPORTANT:
    // Save old party before changing the sale
    const oldPartyId = existingSale[0].Party_Id;
    const saleIdNumber = existingSale[0].id;

    const cleanData = sanitizeObject(req.body);
    const validation = saleSchema.safeParse(cleanData);
    if (!validation.success) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        errors: validation.error.errors,
      });
    }

    const {
      Party_Name,
      Billing_Name,
      Invoice_Number,
      Phone_Number,        // ← add
      Billing_Address,     // ← add
      Invoice_Date,
      State_Of_Supply,
      Total_Amount,
      Total_Received,
      Balance_Due,
      //Reference_Number,
      splits,   // 🔹 replaces single Payment_Type / Bank_Account_Id
      items,
      // Terms & Conditions
      Terms_Conditions_Id,
      Terms_Conditions_Description
    } = validation.data;

    //await connection.beginTransaction();
    let termsId = null;
    let termsDescription = null;

    if (
      Terms_Conditions_Id &&
      Terms_Conditions_Description?.trim()
    ) {
      // Saved template selected and untouched
      termsId = Number(Terms_Conditions_Id);
      termsDescription =
        Terms_Conditions_Description.trim();

    } else if (Terms_Conditions_Description?.trim()) {
      // Custom / edited description
      termsId = null;
      termsDescription = Terms_Conditions_Description.trim();
    }
    if (termsId) {
      const [[selectedTerm]] = await connection.query(
        `SELECT id
     FROM terms_conditions
     WHERE id = ?
       AND Sale_Invoice = 1
     LIMIT 1`,
        [termsId]
      );

      if (!selectedTerm) {
        await connection.rollback();

        return res.status(400).json({
          success: false,
          message: "Invalid Terms & Conditions for Sale Invoice.",
        });
      }
    }
    const totalAmount = Number(Total_Amount) || 0;
    let validSplits = [];

    if (totalAmount > 0) {
      const normalizedSplits = (splits || [])
        .filter((split) => {
          // Must have payment type
          if (!split.Payment_Type) {
            return false;
          }

          // Bank must have selected bank account
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


      validSplits = normalizedSplits.filter(
        (split, index) => {

          // FIRST valid payment method:
          // always preserve, even ₹0
          if (index === 0) {
            return true;
          }

          // Every payment after first:
          // only preserve positive amount
          return split.Amount > 0;
        }
      );
    }
    // const totalReceived = Total_Received === "" || Total_Received === undefined
    //   ? 0
    //   : Number(Total_Received);
    const totalReceived = validSplits.reduce(
      (sum, split) => sum + (Number(split.Amount) || 0),
      0
    );
    const balanceDue = totalAmount - totalReceived;

    // 🔹 received cannot exceed total
    if (totalReceived > totalAmount) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Received amount should be less than or equal to Total Amount",
      });
    }

    // 🔹 validate splits
    if (totalReceived > 0) {
      try {
        validateSplits(validSplits, totalReceived);
      } catch (validationErr) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: validationErr.message });
      }
    }



    // =========================================================
    // RESOLVE PARTY — EDIT SALE
    // =========================================================
    //
    // EDIT SALE RULE:
    //
    // Party_Name is always mandatory because even an anonymous
    // cash invoice already comes back as:
    //
    // Party_Name = "Cash Sale"
    //
    // ---------------------------------------------------------
    //
    // SPECIAL "Cash Sale" PARTY:
    //
    // add_party:
    //   ❌ NEVER update Billing_Name
    //   ❌ NEVER update Phone_Number
    //   ❌ NEVER update GSTIN
    //   ❌ NEVER create/update Billing_Address
    //
    // add_sale:
    //   ✅ Billing_Name is invoice-specific
    //   ✅ Phone_Number is invoice-specific
    //   ✅ Billing_Address is invoice-specific
    //
    // ---------------------------------------------------------
    //
    // NORMAL PARTY:
    //
    // If party doesn't exist:
    //   → create master
    //   → initialize Billing_Name
    //   → initialize Phone_Number
    //   → initialize first Billing_Address
    //
    // If party exists:
    //   → initialize Billing_Name only if master blank
    //   → initialize Phone_Number only if master blank
    //   → initialize Billing_Address only if none exists
    //
    // But add_sale ALWAYS receives the current invoice values.
    //
    // GSTIN is readonly in Sale Edit and is NEVER updated here.
    // =========================================================


    const partyName = Party_Name?.trim();

    if (!partyName) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Party name is required.",
      });
    }


    // =========================================================
    // IDENTIFY SPECIAL CASH SALE PARTY
    // =========================================================

    const isCashSaleParty =
      partyName.toLowerCase() === "cash sale";


    // =========================================================
    // FIND PARTY
    // =========================================================

    const [partyRows] = await connection.query(
      `SELECT *
   FROM add_party
   WHERE TRIM(Party_Name) = TRIM(?)
   LIMIT 1`,
      [partyName]
    );

    let Party_Id;


    // =========================================================
    // CASE 1: PARTY DOES NOT EXIST
    // =========================================================

    if (partyRows.length === 0) {

      // =======================================================
      // A. SPECIAL CASH SALE PARTY DOESN'T EXIST
      // =======================================================
      //
      // Normally Cash Sale should already exist.
      //
      // If somehow missing, recreate ONLY the system party.
      // Customer details still do NOT belong in its master.
      // =======================================================

      if (isCashSaleParty) {

        const [partyResult] = await connection.execute(
          `INSERT INTO add_party
       (
         Party_Name,
         created_at,
         updated_at
       )
       VALUES (?, NOW(), NOW())`,
          [partyName]
        );

        const partyIdNumber = partyResult.insertId;

        Party_Id =
          "PTY" +
          partyIdNumber.toString().padStart(3, "0");

        await connection.execute(
          `UPDATE add_party
       SET Party_Id = ?
       WHERE id = ?`,
          [
            Party_Id,
            partyIdNumber,
          ]
        );
      }


      // =======================================================
      // B. BRAND-NEW NORMAL PARTY
      // =======================================================

      else {

        const [partyResult] = await connection.execute(
          `INSERT INTO add_party
       (
         Party_Name,
         Billing_Name,
         Phone_Number,
         created_at,
         updated_at
       )
       VALUES (?, ?, ?, NOW(), NOW())`,
          [
            partyName,
            cleanValue(Billing_Name),
            cleanValue(Phone_Number),
          ]
        );

        const partyIdNumber = partyResult.insertId;

        Party_Id =
          "PTY" +
          partyIdNumber.toString().padStart(3, "0");

        await connection.execute(
          `UPDATE add_party
       SET Party_Id = ?
       WHERE id = ?`,
          [
            Party_Id,
            partyIdNumber,
          ]
        );


        // =====================================================
        // FIRST BILLING ADDRESS -> DEFAULT
        // =====================================================

        if (Billing_Address?.trim()) {

          await connection.execute(
            `INSERT INTO add_party_addresses
         (
           Party_Id,
           Address_Type,
           Address_Text,
           Is_Default,
           created_at,
           updated_at
         )
         VALUES (?, 'Billing', ?, 1, NOW(), NOW())`,
            [
              Party_Id,
              Billing_Address.trim(),
            ]
          );
        }
      }
    }


    // =========================================================
    // CASE 2: PARTY ALREADY EXISTS
    // =========================================================

    else {

      const existingParty = partyRows[0];

      Party_Id = existingParty.Party_Id;


      // =======================================================
      // A. SPECIAL CASH SALE PARTY
      // =======================================================
      //
      // DO ABSOLUTELY NOTHING TO MASTER.
      //
      // Cash Sale represents many different walk-in customers.
      //
      // Billing_Name / Phone / Address entered on this invoice
      // belong ONLY to add_sale.
      // =======================================================

      if (isCashSaleParty) {

        // Intentionally empty.
      }


      // =======================================================
      // B. NORMAL EXISTING PARTY
      // =======================================================

      else {

        // =====================================================
        // 1. BILLING NAME
        //
        // Initialize master only when blank.
        // =====================================================

        if (
          !existingParty.Billing_Name?.trim() &&
          Billing_Name?.trim()
        ) {

          await connection.execute(
            `UPDATE add_party
         SET
           Billing_Name = ?,
           updated_at = NOW()
         WHERE Party_Id = ?`,
            [
              Billing_Name.trim(),
              Party_Id,
            ]
          );
        }


        // =====================================================
        // 2. PHONE NUMBER
        //
        // Initialize master only when blank.
        // =====================================================

        if (
          !existingParty.Phone_Number?.trim() &&
          Phone_Number?.trim()
        ) {

          await connection.execute(
            `UPDATE add_party
         SET
           Phone_Number = ?,
           updated_at = NOW()
         WHERE Party_Id = ?`,
            [
              Phone_Number.trim(),
              Party_Id,
            ]
          );
        }


        // =====================================================
        // 3. BILLING ADDRESS
        //
        // Add first address only if no Billing address exists.
        // =====================================================

        if (Billing_Address?.trim()) {

          const [[addressCount]] =
            await connection.query(
              `SELECT COUNT(*) AS total
           FROM add_party_addresses
           WHERE Party_Id = ?
             AND Address_Type = 'Billing'`,
              [Party_Id]
            );

          if (Number(addressCount.total) === 0) {

            await connection.execute(
              `INSERT INTO add_party_addresses
           (
             Party_Id,
             Address_Type,
             Address_Text,
             Is_Default,
             created_at,
             updated_at
           )
           VALUES (?, 'Billing', ?, 1, NOW(), NOW())`,
              [
                Party_Id,
                Billing_Address.trim(),
              ]
            );
          }
        }


        // =====================================================
        // GSTIN
        // =====================================================
        //
        // GSTIN is readonly in Sale Edit.
        // NEVER update add_party.GSTIN from here.
      }
    }


    // =========================================================
    // UPDATE INVOICE SNAPSHOT
    // =========================================================
    //
    // IMPORTANT:
    //
    // These values describe THIS invoice.
    //
    // NORMAL PARTY:
    //   → current UI values overwrite this bill.
    //
    // CASH SALE:
    //   → current UI values also belong only to this bill.
    //
    // Therefore we DON'T need finalBillingName /
    // finalPhoneNumber / finalBillingAddress anymore.
    //
    // Whatever Edit Sale UI sends is saved on THIS invoice.
    // =========================================================

    await connection.query(
      `UPDATE add_sale
   SET
      Party_Id = ?,

      Billing_Name = ?,
      Phone_Number = ?,
      Billing_Address = ?,

      Invoice_Number = ?,
      Invoice_Date = ?,
      State_Of_Supply = ?,

      Total_Amount = ?,
      Total_Received = ?,
      Balance_Due = ?,
        Terms_Conditions_Id = ?,
     Terms_Conditions_Description = ?,

      updated_at = NOW()

   WHERE Sale_Id = ?`,
      [
        Party_Id,

        // Invoice-specific snapshots
        cleanValue(Billing_Name),
        cleanValue(Phone_Number),
        cleanValue(Billing_Address),

        Invoice_Number,
        Invoice_Date,
        cleanValue(State_Of_Supply),

        totalAmount,
        totalReceived,
        balanceDue,
        // Terms & Conditions
        termsId,
        termsDescription,
        saleId,
      ]
    );
    // await connection.query(
    //   `UPDATE add_sale
    //    SET
    //       Party_Id = ?,

    //       Billing_Name = ?,
    //       Phone_Number = ?,
    //       Billing_Address = ?,

    //       Invoice_Number = ?,
    //       Invoice_Date = ?,
    //       State_Of_Supply = ?,

    //       Total_Amount = ?,
    //       Total_Received = ?,
    //       Balance_Due = ?,

    //       updated_at = NOW()

    //    WHERE Sale_Id = ?`,
    //   [
    //     Party_Id,

    //     // Invoice snapshots
    //     finalBillingName,
    //     finalPhoneNumber,
    //     finalBillingAddress,

    //     Invoice_Number,
    //     Invoice_Date,
    //     cleanValue(State_Of_Supply),

    //     totalAmount,
    //     totalReceived,
    //     balanceDue,

    //     saleId,
    //   ]
    // );





    await connection.query(
      `UPDATE sale_return
   SET
      Invoice_Number = ?,
      Invoice_Date = ?,
      updated_at = NOW()
   WHERE Sale_Id = ?`,
      [
        Invoice_Number,
        Invoice_Date,
        saleId,
      ]
    );

    // 🔹 wipe old splits + ledger rows, re-insert fresh ones
    await deletePaymentSplits({
      connection,
      sourceType: "Sale",
      sourceId: saleIdNumber,
    });

    if (validSplits.length > 0) {
      await insertPaymentSplits({
        connection,
        sourceType: "Sale",
        sourceId: saleIdNumber,
        partyName: Party_Name,
        txnDate: Invoice_Date,
        splits: validSplits,
      });
    }
    const partyChanged =
      oldPartyId &&
      Party_Id &&
      oldPartyId !== Party_Id;


    // ─────────────────────────────────────────────
    // 1. REMOVE SALE FROM OLD PARTY
    // ─────────────────────────────────────────────
    if (partyChanged) {
      await reversePartyLedger({
        connection,

        // OLD PARTY
        partyId: oldPartyId,

        txnType: "Sale",

        // Same numeric Source_Id used when
        // original ledger row was created
        referenceId: saleIdNumber,
      });
    }


    // ─────────────────────────────────────────────
    // 2. ADD / UPDATE SALE FOR CURRENT PARTY
    // ─────────────────────────────────────────────
    await recordPartyLedger({
      connection,

      // NEW/CURRENT PARTY
      partyId: Party_Id,

      txnType: "Sale",

      referenceId: saleIdNumber,

      amount: totalAmount,

      txnDate: Invoice_Date,

      docNumber: Invoice_Number,

      balanceDue: balanceDue,
    });


    // =========================================================
    // OLD SALE ITEMS
    // =========================================================

    const [oldItems] = await connection.query(
      `SELECT *
   FROM add_sale_items
   WHERE Sale_Id = ?`,
      [saleId]
    );


    // =========================================================
    // STEP 1: RESOLVE ALL NEW SALE LINES
    // =========================================================

    const resolvedLines = [];

    for (const item of items) {

      // -------------------------------------------------------
      // EMPTY ROW
      // -------------------------------------------------------

      if (!item.Item_Name?.trim()) {

        if ((normalizeNumber(item.Amount) ?? 0) > 0) {
          await connection.rollback();

          return res.status(400).json({
            success: false,
            message: "Please enter an item name for the row.",
          });
        }

        continue;
      }


      // =======================================================
      // TRANSACTION SELECTED UNIT
      //
      // Frontend Item_Unit = selected transaction unit
      // add_item.Item_Unit is legacy and remains ""
      // =======================================================

      const Selected_Unit =
        item.Item_Unit?.trim() || null;


      let Item_Id =
        item.Item_Id || null;

      let dbItemRow = null;


      // =======================================================
      // FIND ITEM MASTER
      // =======================================================

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
          [item.Item_Name]
        );

        dbItemRow = rows[0] || null;

        Item_Id =
          dbItemRow?.Item_Id || null;
      }


      // These are what THIS sale row will save
      let stockDelta = 0;

      // let snapshot = {
      //   Primary_Unit: null,
      //   Secondary_Unit: null,
      // };
      let snapshot = {
        Primary_Unit_Snapshot: null,
        Secondary_Unit_Snapshot: null,
      };
      let resolvedSelectedUnit =
        Selected_Unit;


      // =======================================================
      // CASE 1: BRAND-NEW ITEM
      // =======================================================

      if (!dbItemRow) {

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


        // -----------------------------------------------------
        // FIRST SELECTED UNIT BECOMES PRIMARY
        //
        // New item + Kgs:
        //
        // Primary = Kgs
        // Secondary = NULL
        //
        // New item + NONE:
        //
        // Primary = NULL
        // -----------------------------------------------------

        const firstPrimaryUnit =
          Selected_Unit || null;


        stockDelta =
          normalizeNumber(item.Quantity) ?? 0;


        // snapshot = {
        //   Primary_Unit:
        //     firstPrimaryUnit,

        //   Secondary_Unit:
        //     null,
        // };
        snapshot = {
          Primary_Unit_Snapshot:
            firstPrimaryUnit,

          Secondary_Unit_Snapshot:
            null,
        };


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
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
          [
            Item_Id,

            item.Item_Name.trim(),
            item.Item_Category || "",
            cleanValue(item.Item_HSN),

            // legacy field
            "",

            firstPrimaryUnit,
            null,
            null,

            // SALE = stock OUT
            -stockDelta,
          ]
        );


        dbItemRow = {
          Item_Id,

          Item_HSN:
            item.Item_HSN,

          Item_Category:
            item.Item_Category || "",

          Primary_Unit:
            firstPrimaryUnit,

          Secondary_Unit:
            null,

          Conversion_Rate:
            null,
        };
      }


      // =======================================================
      // CASE 2: EXISTING ITEM
      // =======================================================

      else {
        let firstUnitAssigned = false;
        // =====================================================
        // ⭐ IMPORTANT CASE:
        // EXISTING MASTER HAS NO PRIMARY YET
        //
        // Master:
        // Primary = NULL
        //
        // User edits sale and selects Kgs
        //
        // => Kgs becomes FIRST PRIMARY UNIT
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
            Item_Unit = '',
            updated_at = NOW()
          WHERE Item_Id = ?
        `,
            [
              Selected_Unit,
              Item_Id,
            ]
          );


          // IMPORTANT:
          // Keep our in-memory master synchronized

          dbItemRow.Primary_Unit = Selected_Unit;

          dbItemRow.Secondary_Unit = null;

          dbItemRow.Conversion_Rate = null;
          firstUnitAssigned = true;
          // 👇 ADD THIS HERE
          // snapshot = {
          //   Primary_Unit: Selected_Unit,
          //   Secondary_Unit: null,
          // };

          // resolvedSelectedUnit = Selected_Unit;

          // stockDelta =normalizeNumber(item.Quantity) ?? 0;


        }


        // =====================================================
        // FIND THIS ITEM'S OLD SALE LINE
        // =====================================================

        const oldSaleLine =
          oldItems.find(
            (old) =>
              String(old.Item_Id) ===
              String(Item_Id)
          );


        const oldPrimary =
          oldSaleLine?.Primary_Unit_Snapshot ||
          null;

        const oldSecondary =
          oldSaleLine?.Secondary_Unit_Snapshot ||
          null;

        const oldSelected =
          oldSaleLine?.Selected_Unit ||
          null;


        // =====================================================
        // OLD TRANSACTION ACTUALLY USED OLD SECONDARY?
        // =====================================================

        const oldUsedSecondary =
          !!(
            oldSaleLine &&
            oldSecondary &&
            oldSelected === oldSecondary
          );


        // =====================================================
        // UNIT RESOLUTION
        // =====================================================
          if (firstUnitAssigned) {

    stockDelta =
        normalizeNumber(item.Quantity) ?? 0;

    snapshot = {
        Primary_Unit_Snapshot:
            dbItemRow.Primary_Unit,

        Secondary_Unit_Snapshot:
            dbItemRow.Secondary_Unit,
    };

    resolvedSelectedUnit =
        dbItemRow.Primary_Unit;
}
       else if (oldUsedSecondary) {

          // ---------------------------------------------------
          // Historical secondary transaction
          //
          // Example:
          //
          // Old:
          // KG / GM
          // Selected GM
          //
          // Master now:
          // KG / BOX
          //
          // Keep transaction KG / GM
          // ---------------------------------------------------

          // snapshot = {
          //   Primary_Unit:
          //     oldPrimary,

          //   Secondary_Unit:
          //     oldSecondary,
          // };
          snapshot = {
            Primary_Unit_Snapshot:
              oldPrimary,

            Secondary_Unit_Snapshot:
              oldSecondary,
          };


          resolvedSelectedUnit =
            Selected_Unit ||
            oldSelected;


          const quantity =
            normalizeNumber(item.Quantity) ?? 0;


          // ---------------------------------------------------
          // Need conversion corresponding to old unit pair.
          // ---------------------------------------------------

          if (
            resolvedSelectedUnit ===
            oldSecondary
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
                  Item_Id,
                  oldPrimary,
                  oldSecondary,
                ]
              );


            const conversionRate =
              Number(
                conversion?.Conversion_Rate
              );


            if (
              !Number.isFinite(conversionRate) ||
              conversionRate <= 0
            ) {

              await connection.rollback();

              return res.status(400).json({
                success: false,
                message:
                  `Conversion rate not found for ` +
                  `"${oldPrimary}" to "${oldSecondary}" ` +
                  `for item "${item.Item_Name}".`,
              });
            }


            stockDelta =
              quantity / conversionRate;

          } else {

            // Selected primary
            stockDelta =
              quantity;
          }
        }


        // =====================================================
        // NORMAL CASE:
        // USE CURRENT ITEM MASTER
        // =====================================================

        else {

          const resolved =
            resolveUnitAndStockDelta({
              dbItemRow,

              Selected_Unit:
                Selected_Unit,

              Quantity:
                item.Quantity,
            });


          stockDelta =
            resolved.stockDelta;

          snapshot =
            resolved.snapshot;

          resolvedSelectedUnit =
            resolved.resolvedSelectedUnit;
        }


        // =====================================================
        // UPDATE SAFE ITEM MASTER FIELDS
        // =====================================================

        const updates = [];
        const params = [];


        if (
          item.Item_HSN &&
          item.Item_HSN !==
          dbItemRow.Item_HSN
        ) {

          updates.push(
            "Item_HSN = ?"
          );

          params.push(
            item.Item_HSN
          );
        }


        if (
          item.Item_Category !== undefined &&
          item.Item_Category !==
          dbItemRow.Item_Category
        ) {

          updates.push(
            "Item_Category = ?"
          );

          params.push(
            item.Item_Category || ""
          );
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


      // =======================================================
      // STORE RESOLVED TRANSACTION LINE
      // =======================================================

      // resolvedLines.push({
      //   ...item,

      //   Item_Id,

      //   Stock_Delta:
      //     Number(stockDelta),

      //   Primary_Unit_Snapshot:
      //     snapshot.Primary_Unit || null,

      //   Secondary_Unit_Snapshot:
      //     snapshot.Secondary_Unit || null,

      //   Selected_Unit:
      //     resolvedSelectedUnit || null,
      // });
      resolvedLines.push({
  ...item,

  Item_Id,

  Stock_Delta: Number(stockDelta),

  snapshot,

  resolvedSelectedUnit,
});
    }


    // =========================================================
    // STEP 2:
    // CALCULATE OLD BASE QUANTITY PER ITEM
    //
    // IMPORTANT:
    // Raw sale Quantity cannot be compared anymore.
    //
    // 500 gm != 500 Kg
    //
    // We need normalized/base quantities.
    // =========================================================

    const oldBaseQtyByItem = new Map();


    for (const old of oldItems) {

      let oldBaseQty =
        Number(old.Quantity) || 0;


      const oldPrimary =
        old.Primary_Unit_Snapshot || null;

      const oldSecondary =
        old.Secondary_Unit_Snapshot || null;

      const oldSelected =
        old.Selected_Unit || null;


      if (
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
          Number(
            conversion?.Conversion_Rate
          );


        if (
          Number.isFinite(conversionRate) &&
          conversionRate > 0
        ) {

          oldBaseQty =
            oldBaseQty /
            conversionRate;
        }
      }


      oldBaseQtyByItem.set(
        old.Item_Id,

        (
          oldBaseQtyByItem.get(
            old.Item_Id
          ) || 0
        ) + oldBaseQty
      );
    }


    // =========================================================
    // NEW BASE QUANTITY PER ITEM
    // =========================================================

    const newBaseQtyByItem = new Map();


    for (const line of resolvedLines) {

      newBaseQtyByItem.set(
        line.Item_Id,

        (
          newBaseQtyByItem.get(
            line.Item_Id
          ) || 0
        ) +
        Number(line.Stock_Delta || 0)
      );
    }


    // =========================================================
    // STEP 3:
    // APPLY NET STOCK DIFFERENCE
    //
    // Sale = OUT
    //
    // More sold => subtract more
    // Less sold => restore stock
    // =========================================================

    const allItemIds =
      new Set([
        ...newBaseQtyByItem.keys(),
        ...oldBaseQtyByItem.keys(),
      ]);


    for (const itemId of allItemIds) {

      const newQty =
        newBaseQtyByItem.get(itemId) || 0;

      const oldQty =
        oldBaseQtyByItem.get(itemId) || 0;


      const diff =
        newQty - oldQty;


      if (diff !== 0) {

        await connection.query(
          `
        UPDATE add_item
        SET
          Stock_Quantity =
            Stock_Quantity - ?,

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


    // =========================================================
    // STEP 4:
    // REVERSE OLD ITEM LEDGER ROWS
    // =========================================================

    for (const old of oldItems) {

      await reverseItemLedger({
        connection,

        itemId:
          old.Item_Id,

        txnType:
          "Sale",

        referenceId:
          old.id,
      });
    }


    // =========================================================
    // STEP 5:
    // DELETE OLD SALE ITEMS
    // =========================================================

    await connection.query(
      `
    DELETE FROM add_sale_items
    WHERE Sale_Id = ?
  `,
      [saleId]
    );


    // =========================================================
    // STEP 6:
    // INSERT FRESH SALE ITEMS
    // =========================================================

    for (const line of resolvedLines) {

      const [purchaseTax] =
        await connection.query(
          `
        SELECT Tax_Type
        FROM add_purchase_items
        WHERE Item_Id = ?
        ORDER BY id DESC
        LIMIT 1
      `,
          [line.Item_Id]
        );


      const safeTaxType =
        line.Tax_Type ||
        purchaseTax[0]?.Tax_Type ||
        "None";


      const [insertRes] =
        await connection.execute(
          `
        INSERT INTO add_sale_items
        (
          Sale_Id,
          Item_Id,

          Quantity,

          Primary_Unit_Snapshot,
          Secondary_Unit_Snapshot,
          Selected_Unit,

          Sale_Price,

          Discount_On_Sale_Price,
          Discount_Type_On_Sale_Price,

          Tax_Type,
          Tax_Amount,
          Amount,

          created_at,
          updated_at
        )
        VALUES (
          ?, ?,
          ?,
          ?, ?, ?,
          ?,
          ?, ?,
          ?, ?, ?,
          NOW(), NOW()
        )
      `,
          [
            saleId,
            line.Item_Id,

            normalizeNumber(
              line.Quantity
            ) ?? 0,
            line.snapshot.Primary_Unit_Snapshot,
            line.snapshot.Secondary_Unit_Snapshot,
            line.resolvedSelectedUnit,
            // line.Primary_Unit_Snapshot,
            // line.Secondary_Unit_Snapshot,
            // line.Selected_Unit,

            normalizeNumber(
              line.Sale_Price
            ) ?? 0,

            cleanDiscount(
              line.Discount_On_Sale_Price
            ),

            cleanValue(
              line.Discount_Type_On_Sale_Price
            ),

            cleanValue(
              safeTaxType
            ),

            normalizeNumber(
              line.Tax_Amount
            ) ?? 0,

            normalizeNumber(
              line.Amount
            ) ?? 0,
          ]
        );


      const id =
        insertRes.insertId;

      const newId =
        "SIT" +
        id.toString().padStart(3, "0");


      await connection.execute(
        `
      UPDATE add_sale_items
      SET Sale_Items_Id = ?
      WHERE id = ?
    `,
        [
          newId,
          id,
        ]
      );


      // =====================================================
      // ITEM LEDGER
      //
      // Use BASE quantity, not transaction quantity.
      //
      // 500 gm => Stock_Delta 0.5 Kg
      // =====================================================

      await recordItemLedger({
        connection,

        itemId:
          line.Item_Id,

        txnType:
          "Sale",

        referenceId:
          id,

        billId:
          saleId,

        billNumber:
          Invoice_Number,

        partyName:
          Party_Name,

        quantity:
          Number(line.Stock_Delta),

        rate:
          normalizeNumber(
            line.Sale_Price
          ) ?? null,

        txnDate:
          Invoice_Date,
      });
    }

    await connection.commit();

    return res.json({ success: true, message: "Sale updated successfully" });
  } catch (err) {
    if (connection) await connection.rollback();
    next(err);
  } finally {
    if (connection) connection.release();
  }
};
const editNewSale = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();
    const { Sale_Id: saleId } = req.params;

    // 1️⃣ Check if sale exists
    const [existingSale] = await connection.query(
      "SELECT * FROM add_new_sale WHERE Sale_Id = ?",
      [saleId]
    );
    if (existingSale.length === 0) {
      return res.status(404).json({ message: "No such Sale found." });
    }

    // 2️⃣ Validate & sanitize request
    const cleanData = sanitizeObject(req.body);
    const validation = saleNewItemFormSchema.safeParse(cleanData);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.errors });
    }

    const {
      Party_Name,
      Invoice_Number,
      Invoice_Date,
      State_Of_Supply,
      Total_Amount,
      Total_Received,
      Balance_Due,
      Payment_Type,
      Reference_Number,
      items,
    } = validation.data;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "No sale items provided." });
    }

    await connection.beginTransaction();

    // 3️⃣ Prevent duplicate item names
    const seenItems = new Set();
    for (const item of items) {
      const name = item.Item_Name?.trim().toLowerCase();
      if (!name) {
        await connection.rollback();
        return res.status(400).json({ message: "Item name missing." });
      }
      if (seenItems.has(name)) {
        await connection.rollback();
        return res.status(400).json({
          message: `Duplicate item '${item.Item_Name}' found. Please ensure each item appears only once.`,
        });
      }
      seenItems.add(name);
    }

    // 4️⃣ Restore previous stock before re-updating sale
    const [oldItems] = await connection.query(
      "SELECT Item_Id, Quantity FROM add_sale_items WHERE Sale_Id = ?",
      [saleId]
    );


    for (const old of oldItems) {
      if (old.Item_Id === null || old.Item_Id === undefined) {
        await connection.rollback();
        return res.status(400).json({ message: "Invalid Item_Id in old sale items." });
      }

      await connection.query(
        `UPDATE add_item_sale 
         SET updated_at = NOW() 
         WHERE Item_Id = ?`,
        [old.Item_Id]
      );


    }
    const totalAmount = Number(Total_Amount) || 0;
    const totalReceived =
      Total_Received === "" || Total_Received === undefined
        ? 0
        : Number(Total_Received);

    const balanceDue =
      Balance_Due === "" || Balance_Due === undefined
        ? totalAmount - totalReceived
        : Number(Balance_Due);
    // 5️⃣ Update sale master record
    await connection.query(
      `UPDATE add_new_sale SET 
        Party_Id = (SELECT Party_Id FROM add_party WHERE Party_Name = ? LIMIT 1),
        Invoice_Number = ?, 
        Invoice_Date = ?, 
        State_Of_Supply = ?, 
        Total_Amount = ?, 
        Total_Received = ?, 
        Balance_Due = ?, 
        Payment_Type = ?, 
        Reference_Number = ?, 
        updated_at = NOW()
       WHERE Sale_Id = ?`,
      [
        Party_Name,
        Invoice_Number,
        Invoice_Date,
        State_Of_Supply,
        totalAmount,
        totalReceived,
        balanceDue,
        cleanValue(Payment_Type),
        cleanValue(Reference_Number),
        saleId,
      ]
    );

    // 6️⃣ Fetch old sale items for reference
    const [oldSaleItems] = await connection.query(
      "SELECT Sale_Items_Id, Item_Id, Quantity, created_at FROM add_new_sale_items WHERE Sale_Id = ?",
      [saleId]
    );
    const oldSaleItemMap = new Map();
    for (const old of oldSaleItems) {
      oldSaleItemMap.set(old.Item_Id, old);
    }
    const [maxIdRow] = await connection.query(
      "SELECT MAX(CAST(SUBSTRING(Sale_Items_Id, 5) AS UNSIGNED)) AS maxNum FROM add_new_sale_items"
    );
    let nextSaleItemNum = (maxIdRow[0]?.maxId || 0) + 1;
    console.log(nextSaleItemNum);
    // Delete all old sale items (we’ll reinsert)
    await connection.query("DELETE FROM add_new_sale_items WHERE Sale_Id = ?", [saleId]);



    // 8️⃣ Reinsert sale items & adjust stock
    for (const item of items) {
      const [dbItem] = await connection.query(
        "SELECT Item_Id FROM add_item_sale WHERE Item_Name = ? LIMIT 1",
        [item.Item_Name]
      );

      const Item_Id = dbItem[0]?.Item_Id;

      console.log("Item_Id:", Item_Id);


      if (!Item_Id) {
        await connection.rollback();
        return res
          .status(404)
          .json({ message: `Item '${item.Item_Name}' not found.` });
      }
      const [purchaseTax] = await connection.query(
        `SELECT Tax_Type 
     FROM add_purchase_items 
     WHERE Item_Id = ? 
     ORDER BY id DESC 
     LIMIT 1`,
        [Item_Id]
      );

      // 3️⃣ Use trusted tax type or fallback to frontend value
      const taxTypeFromDB = purchaseTax[0]?.Tax_Type;
      const safeTaxType = taxTypeFromDB || item.Tax_Type || "None";
      // Reuse old Sale_Items_Id if exists, else generate new one
      const oldData = oldSaleItemMap.get(Item_Id);
      let Sale_Items_Id;
      let createdAt;

      if (oldData) {
        Sale_Items_Id = oldData.Sale_Items_Id;
        createdAt = oldData.created_at;
      } else {
        Sale_Items_Id = "SIT" + nextSaleItemNum.toString().padStart(3, "0");
        nextSaleItemNum++;
        createdAt = new Date().toISOString().slice(0, 19).replace("T", " ");
      }
      console.log(Sale_Items_Id);
      const taxType = item.Tax_Type || "None";
      // Insert the updated/new sale item
      await connection.query(
        `INSERT INTO add_new_sale_items 
         (Sale_Items_Id, Sale_Id, Item_Id, Quantity, Sale_Price, 
          Discount_On_Sale_Price, Discount_Type_On_Sale_Price, 
          Tax_Type, Tax_Amount, Amount, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          Sale_Items_Id,
          saleId,
          Item_Id,
          normalizeNumber(item.Quantity),
          normalizeNumber(item.Sale_Price),
          cleanDiscount(item.Discount_On_Sale_Price),
          cleanValue(item.Discount_Type_On_Sale_Price),
          cleanValue(safeTaxType),
          normalizeNumber(item.Tax_Amount),
          normalizeNumber(item.Amount),
          createdAt,
        ]
      );

      // Update stock (deduct sold quantity)

      await connection.query(
        `UPDATE add_item_sale 
         SET updated_at = NOW()
         WHERE Item_Id = ?`,
        [Item_Id]
      );


    }

    await connection.commit();
    return res.status(200).json({
      success: true,
      message: "Sale updated successfully",
      saleId,
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("❌ Error editing sale:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  } finally {
    if (connection) connection.release();
  }
};
const getLatestInvoiceNumber = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();

    // 1️⃣ Fetch invoice prefix
    const [invoiceSettings] = await connection.query(
      `SELECT Invoice_Name FROM add_invoice LIMIT 1`
    );

    if (!invoiceSettings.length || !invoiceSettings[0].Invoice_Name) {
      return res.status(400).json({
        success: false,
        message: "Invoice prefix not set ,please set it first.",
      });
    }

    const prefix = invoiceSettings[0].Invoice_Name.trim();

    // 2️⃣ Get ACTIVE financial year
    const [fy] = await connection.query(
      `SELECT Financial_Year 
       FROM financial_year 
       WHERE Current_Financial_Year = 1
       LIMIT 1`
    );

    if (!fy.length) {
      return res.status(400).json({
        success: false,
        message: "No active financial year found.",
      });
    }

    const activeFY = fy[0].Financial_Year;

    // 3️⃣ Fetch latest invoice **ONLY inside this financial year**
    const [rows] = await connection.query(
      `
      SELECT Invoice_Number 
      FROM add_sale
      WHERE Invoice_Number LIKE '${prefix}%'
      AND Financial_Year = ?
      ORDER BY 
        CAST(SUBSTRING(Invoice_Number, LENGTH(?) + 1) AS UNSIGNED) DESC
      LIMIT 1
      `,
      [activeFY, prefix]
    );

    // 4️⃣ default new invoice number
    let newInvoiceNumber = `${prefix}0001`;

    // If an invoice already exists in this FY → increment
    if (rows.length > 0) {
      const last = rows[0].Invoice_Number;
      const numPart = last.replace(prefix, "");
      const nextNum = parseInt(numPart) + 1;
      newInvoiceNumber = prefix + nextNum.toString().padStart(4, "0");
    }

    return res.status(200).json({
      success: true,
      financialYear: activeFY,
      newInvoiceNumber,
    });
  } catch (err) {
    console.error("❌ Error:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};


const getNewSaleLatestInvoiceNumber = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();
    // 1️⃣ Fetch user-defined invoice prefix
    const [invoiceSettings] = await db.query(`SELECT Invoice_Name FROM add_new_sale_invoice LIMIT 1`);

    if (!invoiceSettings || invoiceSettings.length === 0 || !invoiceSettings[0].Invoice_Name) {

      return res.status(400).json({

        success: false,
        message:
          "Invoice prefix not set. Please configure an invoice prefix in settings before generating invoices.",
      });
    }

    const prefix = invoiceSettings[0].Invoice_Name.trim();

    // 2️⃣ Fetch latest invoice based on numeric part of invoice number
    const [rows] = await db.query(`
      SELECT 
        Invoice_Number AS latestInvoice,
        created_at AS createdAt
      FROM add_new_sale
      WHERE Invoice_Number LIKE '${prefix}%'
      ORDER BY 
        CAST(SUBSTRING(Invoice_Number, LENGTH('${prefix}') + 1) AS UNSIGNED) DESC
      LIMIT 1
    `);

    // 3️⃣ Default new invoice number
    let newInvoiceNumber = `${prefix}0001`;
    let latestInvoiceInfo = null;

    // 4️⃣ Increment if previous invoices exist
    if (rows.length > 0 && rows[0].latestInvoice) {
      const lastInvoice = rows[0].latestInvoice;

      // Extract numeric part safely
      const numericPart = lastInvoice.replace(prefix, "").trim();
      const num = isNaN(parseInt(numericPart)) ? 1 : parseInt(numericPart) + 1;

      // Generate next invoice number
      newInvoiceNumber = `${prefix}${num.toString().padStart(4, "0")}`;

      latestInvoiceInfo = {
        lastInvoiceNumber: lastInvoice,
        createdAt: rows[0].createdAt,
      };
    }

    // 5️⃣ Return clean response
    return res.status(200).json({
      success: true,
      newInvoiceNumber,
      latestInvoiceInfo,
    });
  } catch (err) {
    if (connection) connection.release();
    console.error("❌ Error getting latest invoice number:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

const getTotalNewSalesEachDay = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();

    // ✅ Correct SQL: group by date, count total sales per day
    const [rows] = await connection.query(
      `
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m-%d') AS sale_date,
        COUNT(*) AS total_new_sales
      FROM add_new_sale
      GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
      ORDER BY sale_date ASC;
      `
    );

    // ✅ Format response
    const result = rows.map((r) => ({
      date: r.sale_date,
      total_new_sales: r.total_new_sales,
    }));

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    if (connection) connection.release();
    console.error("❌ Error getting total new sales by day:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

const getTotalSalesEachDay = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();

    // 1️⃣ Get sales count per day for all records
    const [rows] = await connection.query(
      `
      SELECT 
        DATE_FORMAT(Invoice_Date, '%Y-%m-%d') AS sale_date,
        COUNT(*) AS total_sales
      FROM add_sale
      GROUP BY DATE_FORMAT(Invoice_Date, '%Y-%m-%d')
      ORDER BY sale_date ASC;
      `
    );

    // 2️⃣ Format output
    const result = rows.map((r) => ({
      date: r.sale_date,
      total_sales: r.total_sales,
    }));

    return res.status(200).json({
      success: true,
      financialYear: null, // kept key so frontend won't break
      data: result,
    });
  } catch (err) {
    console.error("❌ Error getting total sales each day:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};


export {
  addSale, addNewSale, getAllSales, exportAllSalesReportToExcel, getAllNewSales, getSingleSale, getLatestInvoiceNumber,
  addInvoice, updateInvoice, getSingleInvoice,
  addNewSaleInvoice, updateNewSaleInvoice, getSingleNewSaleInvoice, getNewSaleLatestInvoiceNumber,
  printSaleBill, editSale, editNewSale, getTotalNewSalesEachDay, getTotalSalesEachDay
};

// const getTotalSalesEachDay = async (req, res, next) => {
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

//     // 2️⃣ Get sales count per day inside financial year
//     const [rows] = await connection.query(
//       `
//       SELECT
//         DATE_FORMAT(Invoice_Date, '%Y-%m-%d') AS sale_date,
//         COUNT(*) AS total_sales
//       FROM add_sale
//       WHERE Financial_Year = ?
//       GROUP BY DATE_FORMAT(Invoice_Date, '%Y-%m-%d')
//       ORDER BY sale_date ASC;
//       `,
//       [activeFY]
//     );

//     // 3️⃣ Format output
//     const result = rows.map((r) => ({
//       date: r.sale_date,
//       total_sales: r.total_sales,
//     }));

//     return res.status(200).json({
//       success: true,
//       financialYear: activeFY,
//       data: result,
//     });
//   } catch (err) {
//     if (connection) connection.release();
//     console.error("❌ Error getting total sales each day:", err);
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };
