import db from "../config/db.js"; // mysql2/promise connection
import purchaseSchema from "../validators/purchaseSchema.js";
import { sanitizeObject } from "../utils/sanitizeInput.js";
import { compressAndSavePurchaseBill } from "../utils/purchaseBillUpload.js";
//  import { extractTextFromInvoice } from "../utils/invoiceOCR.js";
// import { parseInvoiceText } from "../utils/invoiceParser.js";
import { extractInvoiceWithAI } from "../utils/invoiceAIParser.js";
import ExcelJS from "exceljs";
import { recordBankTransaction } from "../utils/bankAccountHelper.js";




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


// const getAllPurchases = async (req, res, next) => {
//   let connection;
//   try {
//     connection = await db.getConnection();
//     const page = parseInt(req.query.page, 10) || 1;
//     const limit = 10;
//     const offset = (page - 1) * limit;

//     const search = req.query.search ? req.query.search.trim().toLowerCase() : "";
//     const fromDate = req.query.fromDate || null;
//     const toDate = req.query.toDate || null;



//     let whereClauses = [];
//     let params = [];

//     // 🔎 Search
//     if (search) {
//       whereClauses.push(`
//         (LOWER(a.Party_Name) LIKE ? 
//          OR LOWER(p.Payment_Type) LIKE ? 
//          OR LOWER(p.Balance_Due) LIKE ? 
//          OR LOWER(p.Total_Amount) LIKE ?)
//       `);
//       const like = `%${search}%`;
//       params.push(like, like, like, like);
//     }

//     // 📅 Date Range
//     if (fromDate && toDate) {
//       whereClauses.push("DATE(p.created_at) BETWEEN ? AND ?");
//       params.push(fromDate, toDate);
//     } else if (fromDate) {
//       whereClauses.push("DATE(p.created_at) >= ?");
//       params.push(fromDate);
//     } else if (toDate) {
//       whereClauses.push("DATE(p.created_at) <= ?");
//       params.push(toDate);
//     }

//     const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

//     // 🧠 Main Paginated Query
//     const query = `
//       SELECT p.*, a.Party_Name
//       FROM add_purchase p
//       LEFT JOIN add_party a ON p.Party_Id = a.Party_Id
//       ${whereSQL}
//      ORDER BY p.created_at DESC
//       LIMIT ? OFFSET ?
//     `;
//     params.push(limit, offset);

//     const [rows] = await db.query(query, params);

//     // 🧾 Get total count
//     const [countResult] = await db.query(
//       `
//       SELECT COUNT(*) AS total
//       FROM add_purchase p
//       LEFT JOIN add_party a ON p.Party_Id = a.Party_Id
//       ${whereSQL}
//       `,
//       params.slice(0, params.length - 2)
//     );

//       const totalsQuery = `
//       SELECT
//         COALESCE(SUM(p.Total_Amount), 0) AS totalAmount,
//         COALESCE(SUM(p.Balance_Due), 0) AS totalBalance,
//         COALESCE(SUM(p.Total_Paid), 0) AS totalPaid
//       FROM add_purchase p
//       LEFT JOIN add_party a 
//         ON p.Party_Id = a.Party_Id
//       ${whereSQL}
//     `;

//     const [totalsResult] = await db.query(totalsQuery, params);
//     return res.status(200).json({
//       success: true,
//       currentPage: page,
//       totalPages: Math.ceil(countResult[0].total / limit),
//       totalPurchases: countResult[0].total,
//       purchases: rows,
//       totals: totalsResult[0],
//     });
//   } catch (err) {
//      if (connection) connection.release();
//     console.error("❌ Error fetching purchases:", err);
//     next(err);
//     //return res.status(500).json({ message: "Internal Server Error" });
//   }finally {
//     if (connection) connection.release();
//   }
// };

//OLD DUPLICACY ARISE
// const addPurchase = async (req, res, next) => {
//   let connection;
//   try {
//     connection = await db.getConnection();
//     await connection.beginTransaction(); // ✅ Start transaction
// console.log(req.body);
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
//       Reference_Number,
//       items,
//     } = validation.data;

//     if (
//       !Party_Name ||
//       !Bill_Number ||
//       !Bill_Date ||
//       !State_Of_Supply ||
//       !Array.isArray(items) ||
//       items.length === 0
//     ) {
//       await connection.rollback();
//       return res
//         .status(400)
//         .json({ message: "Star marked fields missing or items empty." });
//     }
//   //  const itemCountMap = new Map();
//   //   for (const item of items) {
//   //     const itemName = item.Item_Name?.trim().toLowerCase();
//   //     if (!itemName) {

//   //       return res.status(400).json({ message: "Item name missing." });
//   //     }

//   //     const qty = Number(item.Quantity) || 0;
//   //     itemCountMap.set(itemName, (itemCountMap.get(itemName) || 0) + qty);
//   //         const duplicates = [...itemCountMap.entries()].filter(([name]) =>
//   //     items.filter((it) => it.Item_Name?.trim().toLowerCase() === name).length > 1
//   //   );
//   //   if (duplicates.length > 0) {
//   //     const names = duplicates.map(([n]) => `'${n}'`).join(", ");

//   //     return res.status(400).json({
//   //       message: `Duplicate items detected: ${names}. Please ensure each item appears only once.`,
//   //     });
//   //   }
//   //   }
//   const itemNameSet = new Set();

// for (const item of items) {
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
//     // 🔹 Get Party_Id
//     const [partyRows] = await connection.execute(
//       "SELECT Party_Id,GSTIN FROM add_party WHERE Party_Name = ? LIMIT 1",
//       [Party_Name]
//     );
//     if (partyRows.length === 0) {
//       await connection.rollback();
//       return res.status(404).json({ message: "Party not found." });
//     }
// //    if (partyRows[0].GSTIN && partyRows[0].GSTIN !== GSTIN) {
// //   await connection.rollback();
// //   return res.status(400).json({
// //     message: "GSTIN does not match with selected party.",
// //   });
// // }
//     const Party_Id = partyRows[0].Party_Id;

//     // 🔹 Generate new Purchase_Id
//     const [lastPurchase] = await connection.query(
//       "SELECT Purchase_Id FROM add_purchase ORDER BY id DESC LIMIT 1"
//     );
//     let newPurchaseId = "PUR001";
//     if (lastPurchase.length > 0) {
//       const lastNum = parseInt(lastPurchase[0].Purchase_Id.replace("PUR", "")) + 1;
//       newPurchaseId = "PUR" + lastNum.toString().padStart(3, "0");
//     }
//  const [fy] = await connection.query(
//       `SELECT Financial_Year 
//        FROM financial_year 
//        WHERE Current_Financial_Year = 1
//        LIMIT 1`
//     );

//     if (fy.length === 0) {
//       await connection.rollback();
//       return res.status(400).json({
//         message: "No active financial year found. Please set one in settings.",
//       });
//     }

//     const activeFY = fy[0].Financial_Year; 
//     const totalAmount = Number(Total_Amount) || 0;

// const totalPaid =
//   Total_Paid === "" || Total_Paid === undefined
//     ? 0
//     : Number(Total_Paid);

// const balanceDue =
//   Balance_Due === "" || Balance_Due === undefined
//     ? totalAmount - totalPaid
//     : Number(Balance_Due);
//     // 🔹 Insert Purchase Master
//     await connection.execute(
//       `INSERT INTO add_purchase 
//        (Party_Id, Purchase_Id, Bill_Number, Bill_Date,financial_year, State_Of_Supply,
//         Total_Amount, Total_Paid, Balance_Due, Payment_Type, Reference_Number, 
//         created_at, updated_at)
//        VALUES (?, ?, ?,?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
//       [
//         Party_Id,
//         newPurchaseId,
//         Bill_Number,
//         Bill_Date,
//         activeFY,
//         State_Of_Supply,
//         totalAmount,
//         totalPaid,
//         balanceDue,
//         cleanValue(Payment_Type),
//         cleanValue(Reference_Number),
//       ]
//     );


//     const [maxRow] = await connection.query(
//   `SELECT MAX(CAST(SUBSTRING(Purchase_items_Id, 4) AS UNSIGNED)) 
//   AS maxNum FROM add_purchase_items`
// );
// let nextPurchaseItemNum = (maxRow[0]?.maxNum || 0) + 1;
//     console.log("nextPurchaseItemNum", nextPurchaseItemNum);
//     // 🔹 Loop through items
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

//       // Check for duplicate HSNs
//       // if (Item_HSN) {
//       //   const [hsnCheck] = await connection.execute(
//       //     `SELECT Item_Name FROM add_item WHERE Item_HSN = ? AND Item_Name != ? LIMIT 1`,
//       //     [Item_HSN, Item_Name]
//       //   );
//       //   if (hsnCheck.length > 0) {
//       //     await connection.rollback();
//       //     return res.status(400).json({
//       //       message: `HSN '${Item_HSN}' already belongs to another item '${hsnCheck[0].Item_Name}'.`,
//       //     });
//       //   }
//       // }

//       // Check if item already exists
//       const [itemRows] = await connection.execute(
//         "SELECT * FROM add_item WHERE Item_Name = ? LIMIT 1",
//         [Item_Name]
//       );

//       let Item_Id;
//       if (itemRows.length === 0) {
//         // Create new item
//         const [lastItem] = await connection.query(
//           "SELECT Item_Id FROM add_item ORDER BY id DESC LIMIT 1"
//         );

//         let newItemId = "ITM001";
//         if (lastItem.length > 0) {
//           const lastNum = parseInt(lastItem[0].Item_Id.replace("ITM", "")) + 1;
//           newItemId = "ITM" + lastNum.toString().padStart(3, "0");
//         }

//         await connection.execute(
//           `INSERT INTO add_item 
//            (Item_Id, Item_Name, Item_HSN, Item_Unit, Item_Image, Item_Category, Stock_Quantity, created_at, updated_at)
//            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
//           [
//             newItemId,
//             Item_Name,
//             Item_HSN || "",
//             Item_Unit || "",
//             cleanValue(Item_Image),
//             Item_Category || "",
//             normalizeNumber(Quantity),
//           ]
//         );

//         Item_Id = newItemId;
//       } else {
//         // Existing item → update stock
//         const existingItem = itemRows[0];
//         Item_Id = existingItem.Item_Id;

//         if (
//           existingItem.Item_HSN &&
//           Item_HSN &&
//           existingItem.Item_HSN.trim() !== Item_HSN.trim()
//         ) {
//           await connection.rollback();
//           return res.status(400).json({
//             message: `Item '${Item_Name}' already exists with different HSN (${existingItem.Item_HSN}).`,
//           });
//         }

//         await connection.execute(
//           `UPDATE add_item 
//            SET Stock_Quantity = Stock_Quantity + ?, updated_at = NOW()
//            WHERE Item_Id = ?`,
//           [normalizeNumber(Quantity), Item_Id]
//         );
//       }

//       // Generate unique Purchase_items_Id
//       // const newPurchaseItemId =
//       //   "PIT" + nextPurchaseItemNum.toString().padStart(3, "0");
//       // nextPurchaseItemNum++;
//    const newPurchaseItemId = "PIT" + nextPurchaseItemNum.toString().padStart(3, "0");
//       nextPurchaseItemNum++;

//       // Insert purchase item
//       await connection.execute(
//         `INSERT INTO add_purchase_items 
//          (Purchase_items_Id, Purchase_Id, Item_Id, Quantity, Purchase_Price,
//           Discount_On_Purchase_Price, Discount_Type_On_Purchase_Price,
//           Tax_Type, Tax_Amount, Amount, created_at, updated_at)
//          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
//         [
//           newPurchaseItemId,
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
//     }

//     await connection.commit(); // ✅ Commit only if all inserts succeed

//     return res.status(201).json({
//       success: true,
//       message: "Purchase and items added successfully",
//       purchaseId: newPurchaseId,
//     });
//   } catch (err) {
//     if (connection) await connection.rollback(); // ❌ Rollback everything on failure
//     console.error("❌ Error adding purchase:", err);
//     next(err);
//   } finally {
//     if (connection) connection.release(); // ✅ Always release connection
//   }
// };
const addPurchase = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

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
      Payment_Type,
      Bank_Account_Id,          // 🔹 new
      Reference_Number,
      items,
    } = validation.data;

    if (
      !Party_Name ||
      !Bill_Number ||
      !Bill_Date ||
      !State_Of_Supply ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      await connection.rollback();
      return res
        .status(400)
        .json({ message: "Star marked fields missing or items empty." });
    }

    // 🔹 guard: Bank payment type must carry a valid Bank_Account_Id
    if (Payment_Type === "Bank" && !Bank_Account_Id) {
      await connection.rollback();
      return res.status(400).json({ message: "Bank account is required for Bank payment type." });
    }

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
          message: `Duplicate item detected: '${item.Item_Name}'. Each item must appear only once.`,
        });
      }

      itemNameSet.add(itemName);
    }

    const [partyRows] = await connection.execute(
      "SELECT Party_Id,GSTIN FROM add_party WHERE Party_Name = ? LIMIT 1",
      [Party_Name]
    );

    if (partyRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Party not found." });
    }

    const Party_Id = partyRows[0].Party_Id;

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

    const activeFY = fy[0].Financial_Year;

    const totalAmount = Number(Total_Amount) || 0;

    const totalPaid =
      Total_Paid === "" || Total_Paid === undefined
        ? 0
        : Number(Total_Paid);

    const balanceDue =
      Balance_Due === "" || Balance_Due === undefined
        ? totalAmount - totalPaid
        : Number(Balance_Due);

    //  INSERT WITHOUT Purchase_Id
    const [purchaseResult] = await connection.execute(
      `INSERT INTO add_purchase 
       (Party_Id, Bill_Number, Bill_Date, financial_year, State_Of_Supply,
        Total_Amount, Total_Paid, Balance_Due, Payment_Type, Bank_Account_Id, Reference_Number, 
        created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        Party_Id,
        Bill_Number,
        Bill_Date,
        activeFY,
        State_Of_Supply,
        totalAmount,
        totalPaid,
        balanceDue,
        cleanValue(Payment_Type),
        Payment_Type === "Bank" ? Bank_Account_Id : null,   // 🔹 new
        cleanValue(Reference_Number),
      ]
    );

    const purchaseIdNumber = purchaseResult.insertId;
    const newPurchaseId =
      "PUR" + purchaseIdNumber.toString().padStart(3, "0");

    // ✅ UPDATE WITH FORMATTED ID
    await connection.execute(
      `UPDATE add_purchase SET Purchase_Id = ? WHERE id = ?`,
      [newPurchaseId, purchaseIdNumber]
    );

    // 🔹 record bank ledger entry when paid via bank, using the amount actually paid
    if (Payment_Type === "Bank" && Bank_Account_Id && totalPaid > 0) {
      await recordBankTransaction({
        connection,
        bankAccountId: Bank_Account_Id,
        txnType: "Purchase",
        partyName: Party_Name,          // ✅ add this
        referenceId: purchaseIdNumber,
        amount: totalPaid,
        txnDate: Bill_Date,
        remarks: `Purchase ${newPurchaseId}`,
      });
    }

    // 🔹 LOOP ITEMS
    for (const item of items) {
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
        "SELECT * FROM add_item WHERE Item_Name = ? LIMIT 1",
        [Item_Name]
      );

      let Item_Id;

      if (itemRows.length === 0) {
        const [itemResult] = await connection.execute(
          `INSERT INTO add_item 
           (Item_Name, Item_HSN, Item_Unit, Item_Image, Item_Category, Stock_Quantity, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            Item_Name,
            Item_HSN || "",
            Item_Unit || "",
            cleanValue(Item_Image),
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
        const existingItem = itemRows[0];
        Item_Id = existingItem.Item_Id;

        await connection.execute(
          `UPDATE add_item 
           SET Stock_Quantity = Stock_Quantity + ?, updated_at = NOW()
           WHERE Item_Id = ?`,
          [normalizeNumber(Quantity), Item_Id]
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
          normalizeNumber(Quantity),
          normalizeNumber(Purchase_Price),
          cleanDiscount(Discount_On_Purchase_Price),
          cleanValue(Discount_Type_On_Purchase_Price),
          cleanValue(Tax_Type),
          normalizeNumber(Tax_Amount),
          normalizeNumber(Amount),
        ]
      );

      const pitId = pitResult.insertId;
      const newPurchaseItemId =
        "PIT" + pitId.toString().padStart(3, "0");

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
//       Payment_Type,
//       Reference_Number,
//       items,
//     } = validation.data;

//     if (
//       !Party_Name ||
//       !Bill_Number ||
//       !Bill_Date ||
//       !State_Of_Supply ||
//       !Array.isArray(items) ||
//       items.length === 0
//     ) {
//       await connection.rollback();
//       return res
//         .status(400)
//         .json({ message: "Star marked fields missing or items empty." });
//     }

//     const itemNameSet = new Set();

//     for (const item of items) {
//       const itemName = item.Item_Name?.trim().toLowerCase();

//       if (!itemName) {
//         await connection.rollback();
//         return res.status(400).json({ message: "Item name missing." });
//       }

//       if (itemNameSet.has(itemName)) {
//         await connection.rollback();
//         return res.status(400).json({
//           message: `Duplicate item detected: '${item.Item_Name}'. Each item must appear only once.`,
//         });
//       }

//       itemNameSet.add(itemName);
//     }

//     const [partyRows] = await connection.execute(
//       "SELECT Party_Id,GSTIN FROM add_party WHERE Party_Name = ? LIMIT 1",
//       [Party_Name]
//     );

//     if (partyRows.length === 0) {
//       await connection.rollback();
//       return res.status(404).json({ message: "Party not found." });
//     }

//     const Party_Id = partyRows[0].Party_Id;

//     const [fy] = await connection.query(
//       `SELECT Financial_Year 
//        FROM financial_year 
//        WHERE Current_Financial_Year = 1
//        LIMIT 1`
//     );

//     if (fy.length === 0) {
//       await connection.rollback();
//       return res.status(400).json({
//         message: "No active financial year found. Please set one in settings.",
//       });
//     }

//     const activeFY = fy[0].Financial_Year;

//     const totalAmount = Number(Total_Amount) || 0;

//     const totalPaid =
//       Total_Paid === "" || Total_Paid === undefined
//         ? 0
//         : Number(Total_Paid);

//     const balanceDue =
//       Balance_Due === "" || Balance_Due === undefined
//         ? totalAmount - totalPaid
//         : Number(Balance_Due);

//     // ✅ INSERT WITHOUT Purchase_Id
//     const [purchaseResult] = await connection.execute(
//       `INSERT INTO add_purchase 
//        (Party_Id, Bill_Number, Bill_Date, financial_year, State_Of_Supply,
//         Total_Amount, Total_Paid, Balance_Due, Payment_Type, Reference_Number, 
//         created_at, updated_at)
//        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
//       [
//         Party_Id,
//         Bill_Number,
//         Bill_Date,
//         activeFY,
//         State_Of_Supply,
//         totalAmount,
//         totalPaid,
//         balanceDue,
//         cleanValue(Payment_Type),
//         cleanValue(Reference_Number),
//       ]
//     );

//     const purchaseIdNumber = purchaseResult.insertId;
//     const newPurchaseId =
//       "PUR" + purchaseIdNumber.toString().padStart(3, "0");

//     // ✅ UPDATE WITH FORMATTED ID
//     await connection.execute(
//       `UPDATE add_purchase SET Purchase_Id = ? WHERE id = ?`,
//       [newPurchaseId, purchaseIdNumber]
//     );

//     // 🔹 LOOP ITEMS
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

//       const [itemRows] = await connection.execute(
//         "SELECT * FROM add_item WHERE Item_Name = ? LIMIT 1",
//         [Item_Name]
//       );

//       let Item_Id;

//       if (itemRows.length === 0) {
//         // ✅ INSERT ITEM WITHOUT Item_Id
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
//         const existingItem = itemRows[0];
//         Item_Id = existingItem.Item_Id;

//         await connection.execute(
//           `UPDATE add_item 
//            SET Stock_Quantity = Stock_Quantity + ?, updated_at = NOW()
//            WHERE Item_Id = ?`,
//           [normalizeNumber(Quantity), Item_Id]
//         );
//       }

//       // ✅ INSERT PURCHASE ITEM WITHOUT ID
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
//       const newPurchaseItemId =
//         "PIT" + pitId.toString().padStart(3, "0");

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
        purchase.Purchase_Id || purchase.Bill_No || "N/A",
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
//           OR CAST(p.Total_Amount AS CHAR) LIKE ?
//           OR CAST(p.Balance_Due AS CHAR) LIKE ?
//         )
//       `);
//       const like = `%${search}%`;
//       params.push(like, like, like, like);
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
//       SELECT p.*, a.Party_Name
//       FROM add_purchase p
//       LEFT JOIN add_party a ON p.Party_Id = a.Party_Id
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

    let whereClauses = [];
    let params = [];

    /* ---------- SEARCH ---------- */
    if (search) {
      whereClauses.push(`
        (
          LOWER(a.Party_Name) LIKE ?
          OR LOWER(p.Payment_Type) LIKE ?
          OR LOWER(ba.Account_Display_Name) LIKE ?
          OR CAST(p.Total_Amount AS CHAR) LIKE ?
          OR CAST(p.Balance_Due AS CHAR) LIKE ?
        )
      `);
      const like = `%${search}%`;
      params.push(like, like, like, like, like);
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

    const whereSQL = whereClauses.length
      ? `WHERE ${whereClauses.join(" AND ")}`
      : "";

    /* ---------- MAIN QUERY ---------- */
    const purchasesQuery = `
      SELECT p.*, a.Party_Name,
        ba.Account_Display_Name AS Bank_Display_Name,
        CASE 
          WHEN p.Payment_Type = 'Bank' THEN ba.Account_Display_Name
          ELSE p.Payment_Type
        END AS Payment_Type_Display
      FROM add_purchase p
      LEFT JOIN add_party a ON p.Party_Id = a.Party_Id
      LEFT JOIN bank_accounts ba ON p.Bank_Account_Id = ba.id
      ${whereSQL}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await db.query(purchasesQuery, [
      ...params,
      limit,
      offset,
    ]);

    /* ---------- COUNT QUERY ---------- */
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM add_purchase p
      LEFT JOIN add_party a ON p.Party_Id = a.Party_Id
      LEFT JOIN bank_accounts ba ON p.Bank_Account_Id = ba.id
      ${whereSQL}
    `;

    const [countResult] = await db.query(countQuery, params);

    /* ---------- TOTALS QUERY ---------- */
    const totalsQuery = `
      SELECT
        COALESCE(SUM(p.Total_Amount), 0) AS totalAmount,
        COALESCE(SUM(p.Balance_Due), 0) AS totalUnpaid,
        COALESCE(SUM(p.Total_Paid), 0) AS totalPaid
      FROM add_purchase p
      LEFT JOIN add_party a ON p.Party_Id = a.Party_Id
      LEFT JOIN bank_accounts ba ON p.Bank_Account_Id = ba.id
      ${whereSQL}
    `;

    const [totalsResult] = await db.query(totalsQuery, params);

    /* ---------- RESPONSE ---------- */
    return res.status(200).json({
      success: true,
      currentPage: page,
      totalPages: Math.ceil(countResult[0].total / limit),
      totalPurchases: countResult[0].total,
      purchases: rows,
      totals: totalsResult[0],
    });

  } catch (err) {
    console.error("❌ Error fetching purchases:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};
//TRYING
const editPurchase = async (req, res, next) => {
  let connection;
  try {
    const { Purchase_Id: purchaseId } = req.params;

    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1️⃣ Check purchase exists
    const [existingPurchase] = await connection.query(
      "SELECT * FROM add_purchase WHERE Purchase_Id = ?",
      [purchaseId]
    );

    if (existingPurchase.length === 0) {
      return res.status(404).json({ message: "No such Purchase found." });
    }
    const purchaseIdNumber = existingPurchase[0].id;  
    console.log(req.body);

    // 2️⃣ Validate
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
      Payment_Type,
      Bank_Account_Id,          // 🔹 new
      Reference_Number,
      items,
    } = validation.data;

    if (!Array.isArray(items) || items.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        message: "No purchase items provided",
      });
    }
    if (Payment_Type === "Bank" && !Bank_Account_Id) {
      await connection.rollback();
      return res.status(400).json({ message: "Bank account is required for Bank payment type." });
    }

    // 3️⃣ Duplicate check
    const itemNameSet = new Set();
    for (const item of items) {
      const name = item.Item_Name?.trim().toLowerCase();

      if (!name) {
        await connection.rollback();
        return res.status(400).json({ message: "Item name missing." });
      }

      if (itemNameSet.has(name)) {
        await connection.rollback();
        return res.status(400).json({
          message: `Duplicate item: ${item.Item_Name}`,
        });
      }

      itemNameSet.add(name);
    }

    // 4️⃣ Party check
    const [partyRows] = await connection.query(
      "SELECT Party_Id FROM add_party WHERE Party_Name = ? LIMIT 1",
      [Party_Name]
    );

    if (partyRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Party not found." });
    }

    const Party_Id = partyRows[0].Party_Id;

    // 5️⃣ Update purchase master
    const totalAmount = Number(Total_Amount) || 0;
    const totalPaid = Number(Total_Paid) || 0;
    const balanceDue = Number(Balance_Due) || totalAmount - totalPaid;

    await connection.query(
      `UPDATE add_purchase SET 
        Party_Id=?, Bill_Number=?, Bill_Date=?, State_Of_Supply=?,
        Total_Amount=?, Total_Paid=?, Balance_Due=?,
        Payment_Type=?,Bank_Account_Id=?, Reference_Number=?, updated_at=NOW()
       WHERE Purchase_Id=?`,
      [
        Party_Id,
        Bill_Number,
        Bill_Date,
        State_Of_Supply,
        totalAmount,
        totalPaid,
        balanceDue,
        cleanValue(Payment_Type),
        Payment_Type === "Bank" ? Bank_Account_Id : null,
        cleanValue(Reference_Number),
        purchaseId,
      ]
    );

    // 6️⃣ Fetch existing purchase items
    const [oldItems] = await connection.query(
      "SELECT * FROM add_purchase_items WHERE Purchase_Id = ?",
      [purchaseId]
    );

    const oldMap = new Map();
    oldItems.forEach((i) => oldMap.set(i.Item_Id, i));

    const newItemIds = new Set();

    // 🔹 record bank ledger entry when paid via bank, using the amount actually paid
    
      await recordBankTransaction({
        connection,
        bankAccountId: Payment_Type === "Bank" ? Bank_Account_Id : null,
        txnType: "Purchase",
        referenceId: purchaseIdNumber,        // ✅ fixed
        partyName: Party_Name,          // ✅ add this
        amount: totalPaid,
        txnDate: Bill_Date
      });
    


    // 7️⃣ Loop new items
    for (const item of items) {
      const {
        Item_Name,
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

      // 🔹 get or create item
      const [existingItem] = await connection.query(
        "SELECT * FROM add_item WHERE Item_Name = ? LIMIT 1",
        [Item_Name]
      );

      let Item_Id;

      if (existingItem.length === 0) {
        const [res] = await connection.execute(
          `INSERT INTO add_item 
           (Item_Name, Item_Category, Item_HSN, Item_Unit, Stock_Quantity, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            Item_Name,
            Item_Category || "",
            Item_HSN || "",
            Item_Unit || "",
            normalizeNumber(Quantity),
          ]
        );

        const id = res.insertId;
        Item_Id = "ITM" + id;

        await connection.execute(
          `UPDATE add_item SET Item_Id=? WHERE id=?`,
          [Item_Id, id]
        );
      } else {
        Item_Id = existingItem[0].Item_Id;
      }

      newItemIds.add(Item_Id);

      const old = oldMap.get(Item_Id);

      if (old) {
        // 🔥 UPDATE existing
        await connection.query(
          `UPDATE add_purchase_items SET 
           Quantity=?, Purchase_Price=?, 
           Discount_On_Purchase_Price=?, Discount_Type_On_Purchase_Price=?,
           Tax_Type=?,
            Tax_Amount=?,
             Amount=?, updated_at=NOW()
           WHERE Purchase_items_Id=?`,
          [
            normalizeNumber(Quantity),
            normalizeNumber(Purchase_Price),
            cleanDiscount(Discount_On_Purchase_Price),
            cleanValue(Discount_Type_On_Purchase_Price),
            cleanValue(Tax_Type),
            normalizeNumber(Tax_Amount),
            normalizeNumber(Amount),
            old.Purchase_items_Id,
          ]
        );

        // 🔥 stock adjust (diff)
        const diff = normalizeNumber(Quantity) - old.Quantity;

        if (diff !== 0) {
          await connection.query(
            `UPDATE add_item 
             SET Stock_Quantity = Stock_Quantity + ?, updated_at=NOW()
             WHERE Item_Id=?`,
            [diff, Item_Id]
          );
        }
      } else {
        // 🔥 INSERT new
        const [res] = await connection.execute(
          `INSERT INTO add_purchase_items
           (Purchase_Id, Item_Id, Quantity, Purchase_Price,
            Discount_On_Purchase_Price, Discount_Type_On_Purchase_Price,
            Tax_Type, Tax_Amount, Amount, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            purchaseId,
            Item_Id,
            normalizeNumber(Quantity),
            normalizeNumber(Purchase_Price),
            cleanDiscount(Discount_On_Purchase_Price),
            cleanValue(Discount_Type_On_Purchase_Price),
            cleanValue(Tax_Type),
            normalizeNumber(Tax_Amount),
            normalizeNumber(Amount),
          ]
        );

        const id = res.insertId;
        const Purchase_items_Id = "PIT" + id;

        await connection.execute(
          `UPDATE add_purchase_items SET Purchase_items_Id=? WHERE id=?`,
          [Purchase_items_Id, id]
        );

        // 🔥 add stock
        await connection.query(
          `UPDATE add_item 
           SET Stock_Quantity = Stock_Quantity + ?, updated_at=NOW()
           WHERE Item_Id=?`,
          [normalizeNumber(Quantity), Item_Id]
        );
      }
    }

    // 8️⃣ Delete removed items
    for (const old of oldItems) {
      if (!newItemIds.has(old.Item_Id)) {
        await connection.query(
          `DELETE FROM add_purchase_items WHERE Purchase_items_Id=?`,
          [old.Purchase_items_Id]
        );

        // reduce stock
        await connection.query(
          `UPDATE add_item 
           SET Stock_Quantity = Stock_Quantity - ?, updated_at=NOW()
           WHERE Item_Id=?`,
          [old.Quantity, old.Item_Id]
        );
      }
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
//OLD DUPLICACY WHEN MANY USERS
//  const editPurchase = async (req, res, next) => {
//   let connection;
//   try {

//     const { Purchase_Id: purchaseId } = req.params;
//     connection = await db.getConnection();
//     await connection.beginTransaction();
//     // 1️⃣ Check if sale exists
//     const [existingPurchase] = await connection.query(
//       "SELECT * FROM add_purchase WHERE Purchase_Id = ?",
//       [purchaseId]
//     );
//     if (existingPurchase.length === 0) {
//       return res.status(404).json({ message: "No such Sale found." });
//     }

//     console.log(req.body)
//     // 2️⃣ Validate & sanitize request
//     const cleanData = sanitizeObject(req.body);
//     const validation = purchaseSchema.safeParse(cleanData);
//     if (!validation.success) {
//       await connection.rollback();
//       return res.status(400).json({ errors: validation.error.errors });
//     }

//     const {

//             Party_Name,
//             GSTIN,
//       Bill_Number,
//       Bill_Date,
//       State_Of_Supply,
//       Total_Amount,
//       Total_Paid,
//       Balance_Due,
//       Payment_Type,
//       Reference_Number,
//       items,
//     } = validation.data;

//     if (!Array.isArray(items) || items.length === 0) {
//       await connection.rollback();
//       return res.status(400).json({ message: "No purchase items provided, please add at least one item." });
//     }
//   const itemNameSet = new Set();

// for (const item of items) {
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

//   //  const itemCountMap = new Map();
//   //   for (const item of items) {
//   //     const name = item.Item_Name?.trim().toLowerCase();
//   //     if (!name) {
//   //       await connection.rollback();
//   //       return res.status(400).json({ message: "Item name missing in one or more entries." });
//   //     }

//   //     itemCountMap.set(name, (itemCountMap.get(name) || 0) + item.Quantity);
//   //   }

//   //   const duplicates = [...itemCountMap.entries()].filter(([name]) =>
//   //     items.filter((it) => it.Item_Name?.trim().toLowerCase() === name).length > 1
//   //   );
//   //   if (duplicates.length > 0) {
//   //     const names = duplicates.map(([n]) => `'${n}'`).join(", ");
//   //     await connection.rollback();
//   //     return res.status(400).json({
//   //       message: `Duplicate items detected: ${names}. Please ensure each item appears only once.`,
//   //     });
//   //   }

//     // 🧩 4️⃣ Fetch Party_Id
//     const [partyRows] = await connection.query(
//       "SELECT Party_Id, GSTIN FROM add_party WHERE Party_Name = ? LIMIT 1",
//       [Party_Name]
//     );
//     if (partyRows.length === 0) {
//       await connection.rollback();
//       return res.status(404).json({ message: "Party not found." });
//     }
// //   if (partyRows[0].GSTIN && partyRows[0].GSTIN !== GSTIN) {
// //   await connection.rollback();
// //   return res.status(400).json({
// //     message: "GSTIN does not match with selected party.",
// //   });
// // }
//     // 3️⃣ Restore previous stock before validation
//     const [oldItems] = await connection.query(
//       "SELECT Item_Id, Quantity FROM add_purchase_items WHERE Purchase_Id = ?",
//       [purchaseId]
//     );

//     for (const old of oldItems) {
//       await connection.query(
//         `UPDATE add_item 
//          SET Stock_Quantity = Stock_Quantity - ?, updated_at = NOW() 
//          WHERE Item_Id = ?`,
//         [old.Quantity, old.Item_Id]
//       );
//     }


// const totalAmount = Number(Total_Amount) || 0;

// const totalPaid =
//   Total_Paid === "" || Total_Paid === undefined
//     ? 0
//     : Number(Total_Paid);

// const balanceDue =
//   Balance_Due === "" || Balance_Due === undefined
//     ? totalAmount - totalPaid
//     : Number(Balance_Due);
//     // 5️⃣ Update sale master
//     await connection.query(
//       `UPDATE add_purchase SET 
//         Party_Id = (SELECT Party_Id FROM add_party WHERE Party_Name = ? LIMIT 1),
//         Bill_Number = ?, 
//         Bill_Date = ?, 
//         State_Of_Supply = ?, 
//         Total_Amount = ?, 
//         Total_Paid = ?, 
//         Balance_Due = ?, 
//         Payment_Type = ?, 
//         Reference_Number = ?, 
//         updated_at = NOW()
//        WHERE Purchase_Id = ?`,
//       [
//         Party_Name,
//         Bill_Number,
//         Bill_Date,
//         State_Of_Supply,
//         // cleanValue(Total_Amount),
//         // cleanValue(Total_Paid),
//         // cleanValue(Balance_Due),
//         totalAmount,
//         totalPaid,
//         balanceDue,
//         cleanValue(Payment_Type),
//         cleanValue(Reference_Number),
//         purchaseId,
//       ]
//     );

//     // 6️⃣ Fetch old sale items and build map
//     const [oldPurchaseItems] = await connection.query(
//       "SELECT Purchase_items_Id, Item_Id, Quantity, created_at FROM add_purchase_items WHERE Purchase_Id = ?",
//       [purchaseId]
//     );
//     const oldPurchaseItemMap = new Map();
//     for (const old of oldPurchaseItems) {
//       oldPurchaseItemMap.set(old.Item_Id, old);
//     }
// const [maxIdRow] = await connection.query(
//   "SELECT MAX(CAST(SUBSTRING(Purchase_items_Id, 4) AS UNSIGNED)) AS maxId FROM add_purchase_items"
// );
// let nextPurchaseItemNum = (maxIdRow[0]?.maxId || 0) + 1;
//    console.log(nextPurchaseItemNum);
//     // Delete old sale items (to reinsert updated)
//     await connection.query("DELETE FROM add_purchase_items WHERE Purchase_Id = ?", [purchaseId]);


// const [maxItemRow] = await connection.query(`
//   SELECT MAX(CAST(SUBSTRING(Item_Id, 4) AS UNSIGNED)) AS maxItem 
//   FROM add_item
// `);
// let nextItemNum = (maxItemRow[0]?.maxItem || 0) + 1;
// // 7️⃣ Reinsert updated purchase items & adjust stock
// for (const item of items) {
//   const {
//     Item_Name,
//     Item_Category,
//     Item_HSN,
//     Item_Unit,
//     Quantity,
//     Purchase_Price,
//     Discount_On_Purchase_Price,
//     Discount_Type_On_Purchase_Price,
//     Tax_Type,
//     Tax_Amount,
//     Amount,
//   } = item;

//   // 1️⃣ Check if item exists
//   const [existingItem] = await connection.query(
//     "SELECT * FROM add_item WHERE Item_Name = ? LIMIT 1",
//     [Item_Name]
//   );

//   let Item_Id;
//   let isNewItem = false;
// if (existingItem.length === 0) {
//   Item_Id = "ITM" + nextItemNum.toString().padStart(3, "0");
//   nextItemNum++;

//   await connection.query(
//     `INSERT INTO add_item 
//      (Item_Id, Item_Name, Item_Category, Item_HSN, Item_Unit, Stock_Quantity, created_at, updated_at)
//      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
//     [
//       Item_Id,   // 👈 Correct reference
//       Item_Name,
//       Item_Category || "",
//       Item_HSN || "",
//       Item_Unit || "",
//       normalizeNumber(Quantity),
//     ]
//   );

//   isNewItem = true;
// }

//   // if (existingItem.length === 0) {

//   // Item_Id = "ITM" + nextItemNum.toString().padStart(3, "0");
//   //   nextItemNum++; // increment counter safely for next item
//   //   await connection.query(
//   //     `INSERT INTO add_item 
//   //      (Item_Id, Item_Name, Item_Category, Item_HSN, Item_Unit, Stock_Quantity, created_at, updated_at)
//   //      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
//   //     [
//   //       newItemId,
//   //       Item_Name,
//   //       Item_Category || "",
//   //       Item_HSN || "",
//   //       Item_Unit || "",
//   //       normalizeNumber(Quantity),
//   //     ]
//   //   );

//   //   Item_Id = newItemId;
//   //   isNewItem = true;
//   // } 
//   else {
//     Item_Id = existingItem[0].Item_Id;
//   }

//   // 2️⃣ Reuse or create new Purchase_items_Id
//   const oldData = oldPurchaseItemMap.get(Item_Id);
//   let Purchase_items_Id;
//   let createdAt;

//   if (oldData) {
//     Purchase_items_Id = oldData.Purchase_items_Id;
//     createdAt = oldData.created_at;
//   } else {
//     // Generate next unique ID safely
//      Purchase_items_Id = "PIT" + nextPurchaseItemNum.toString().padStart(3, "0")
//     // Purchase_items_Id = "PIT" + nextItemNumber.toString().padStart(3, "0");
//     nextPurchaseItemNum++; // increment safely for next new item
//     createdAt = new Date().toISOString().slice(0, 19).replace("T", " ");
//   }

//   // 3️⃣ Insert into add_purchase_items
//   await connection.query(
//     `INSERT INTO add_purchase_items 
//      (Purchase_items_Id, Purchase_Id, Item_Id, Quantity, Purchase_Price, 
//       Discount_On_Purchase_Price, Discount_Type_On_Purchase_Price, 
//       Tax_Type, Tax_Amount, Amount, created_at, updated_at)
//      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
//     [
//       Purchase_items_Id,
//       purchaseId,
//       Item_Id,
//       normalizeNumber(Quantity),
//       normalizeNumber(Purchase_Price),
//       cleanDiscount(Discount_On_Purchase_Price),
//       cleanValue(Discount_Type_On_Purchase_Price),
//       cleanValue(Tax_Type),
//       normalizeNumber(Tax_Amount),
//       normalizeNumber(Amount),
//       createdAt,
//     ]
//   );

//   // 4️⃣ Update stock (increase for purchases)
//   if (!isNewItem) {
//     await connection.query(
//       `UPDATE add_item 
//        SET Stock_Quantity = Stock_Quantity + ?, updated_at = NOW()
//        WHERE Item_Id = ?`,
//       [normalizeNumber(Quantity), Item_Id]
//     );
//   }
// }


//     await connection.commit();
//     return res.status(200).json({
//       success: true,
//       message: "Purchase updated successfully",
//       purchaseId,
//     });
//   } catch (err) {
//     if (connection) await connection.rollback();
//     console.error("❌ Error editing purchase:", err);
//     return res.status(500).json({ message: "Internal Server Error" });
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

    // ✅ Fetch sale header (includes invoice + party info)
    const [purchaseData] = await db.query(
      `
     SELECT 
    pu.Purchase_Id,
    pu.Bill_Number,
    pu.Bill_Date,
    pu.Reference_Number,
    pu.State_Of_Supply,
    pu.Payment_Type,
    pu.Bank_Account_Id,
    pu.Total_Amount,
    pu.Total_Paid,
    pu.Balance_Due,
    pu.Party_Id,

    p.Party_Name,
    p.GSTIN,
    p.Billing_Address,
    p.Shipping_Address,

    ba.Account_Display_Name AS Bank_Display_Name,
    CASE
        WHEN pu.Payment_Type = 'Bank'
        THEN ba.Account_Display_Name
        ELSE pu.Payment_Type
    END AS Payment_Type_Display

FROM add_purchase pu
LEFT JOIN add_party p
    ON pu.Party_Id = p.Party_Id
LEFT JOIN bank_accounts ba
    ON pu.Bank_Account_Id = ba.id
WHERE pu.Purchase_Id = ?
      `,
      [purchaseId]
    );

    if (purchaseData.length === 0) {
      return res.status(404).json({ success: false, message: "Sale not found." });
    }

    const purchaseHeader = purchaseData[0];

    // ✅ Fetch all sale items related to that Sale_Id
    const [items] = await db.query(
      `
      SELECT 
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
      ORDER BY pi.created_at DESC
      `,
      [purchaseId]
    );

    if (items.length === 0) {
      return res.status(404).json({ success: false, message: "No sale items found for this invoice." });
    }

    // ✅ Combine and send response
    const response = {
      success: true,
      billPurchaseDetails: {
        Purchase_Id: purchaseHeader.Purchase_Id,
        Party_Name: purchaseHeader.Party_Name,
        GSTIN: purchaseHeader.GSTIN,
        State_Of_Supply: purchaseHeader.State_Of_Supply,
        Payment_Type: purchaseHeader.Payment_Type,
        Reference_Number: purchaseHeader.Reference_Number,
        Bill_Number: purchaseHeader.Bill_Number,
        Bill_Date: purchaseHeader.Bill_Date,
        Payment_Type: purchaseHeader.Payment_Type,
        Payment_Type_Display: purchaseHeader.Payment_Type_Display,

        Bank_Account_Id: purchaseHeader.Bank_Account_Id,
        Bank_Display_Name: purchaseHeader.Bank_Display_Name,
        Total_Amount: purchaseHeader.Total_Amount,
        Total_Paid: purchaseHeader.Total_Paid,
        Balance_Due: purchaseHeader.Balance_Due,
        Billing_Address: purchaseHeader.Billing_Address,
        Shipping_Address: purchaseHeader.Shipping_Address,
      },
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
    };

    return res.status(200).json(response);
  } catch (err) {
    if (connection) connection.release();
    console.error("❌ Error getting single sale:", err);
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