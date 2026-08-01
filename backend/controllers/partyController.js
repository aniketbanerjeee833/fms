
import db from "../config/db.js";
import { sanitizeObject } from "../utils/sanitizeInput.js";
import partySchema from "../validators/partySchema.js";

import PdfPrinter from "pdfmake";
const cleanValue = (value) => {
  if (value === undefined || value === null || value === "" || value === " ") {
    return null; // store as NULL in DB
  }
  return value;  // ✅ returns the original value for valid data
};

const addParty = async (req, res, next) => {
  let connection;
  try {
  

    connection = await db.getConnection();
    await connection.beginTransaction();
    const cleanData = sanitizeObject(req.body);
    const validation = partySchema.safeParse(cleanData);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.errors });
    }
    const {
      Party_Name,
      GSTIN,
      Phone_Number,
     
      State,
      Email_Id,
      Billing_Address,
      Shipping_Address,
      
    } = validation.data;

    if (!Party_Name) {
      await connection.rollback();
      return res.status(400).json({ message: "Party name is required" });
    }
// 🔥 Correct duplicate check
const [existingParty] = await db.query(
  `SELECT Party_Id FROM add_party 
   WHERE GSTIN = ? OR Phone_Number = ?
   LIMIT 1`,
  [GSTIN, Phone_Number]
);

if (existingParty.length > 0) {
  await connection.rollback();
  return res.status(400).json({
    message: "GSTIN or Phone Number already exists for another party",
  });
}
// 🔥 Duplicate party name check (case-insensitive, trimmed)
const [existingName] = await db.query(
  `SELECT Party_Id FROM add_party 
   WHERE LOWER(TRIM(Party_Name)) = LOWER(TRIM(?))
   LIMIT 1`,
  [Party_Name]
);

if (existingName.length > 0) {
  await connection.rollback();
  return res.status(400).json({
    message: "Party name already exists",
  });
}

  // const [existingParty] = await db.query(
  //     "SELECT Party_Id, GSTIN, Phone_Number FROM add_party "
  //   );

  //    if(existingParty[0].GSTIN === GSTIN || existingParty[0].Phone_Number === Phone_Number){
  //     await connection.rollback();
  //     return res.status(400).json({ message: "GSTIN or Phone Number for another party already exists" });
  //   }
    // Get last party code
    const [last] = await db.query(
      "SELECT Party_Id FROM add_party ORDER BY id DESC LIMIT 1"
    );

   
    let newId = "PTY001";
    if (last.length > 0) {
      const lastId = last[0].Party_Id; // e.g. "PTY005"
      const num = parseInt(lastId.replace("PTY", "")) + 1;
      newId = "PTY" + num.toString().padStart(3, "0");
    }
  const cleanValue = (val) =>
    val !== undefined && val !== null && String(val).trim() !== "" ? val : null;
    // Insert into DB
    const [result] = await db.execute(
      `INSERT INTO add_party 
       (Party_Id, Party_Name, GSTIN, Phone_Number,  State, Email_Id, Billing_Address, Shipping_Address)
       VALUES (?, ?, ?, ?, ?, ?, ?,?)`,
      [
        newId,
        Party_Name,
        cleanValue(GSTIN),
        cleanValue(Phone_Number),
      
        cleanValue(State),
        cleanValue(Email_Id),
        cleanValue(Billing_Address),
        cleanValue(Shipping_Address),
        
      ]
    );

      await connection.commit();
    return res.status(201).json({
      message: "Party added successfully",
      success: true,
      id: result.insertId, // auto-increment primary key
      Party_Id: newId,     // custom party code
      Party_Name,
      GSTIN,
      Phone_Number,
     
      State,
      Email_Id,
      Billing_Address,
      Shipping_Address,
     
    });
  } catch (err) {
    if (connection) {
      await connection.rollback();
    }
    console.error("❌ Error adding party:", err);
    next(err);
    // return res.status(500).json({ message: "Internal Server Error" });
  }finally {
    if (connection) {
      connection.release();
    }
  }
};

const editParty= async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    const cleanData = sanitizeObject(req.body);
    const validation = partySchema.safeParse(cleanData);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.errors });
    }
    const {
      Party_Name,
      GSTIN,
      Phone_Number,
      State,
      Email_Id,
      Billing_Address,
      Shipping_Address,
      
    } = validation.data;

    if (!Party_Name) {
      await connection.rollback();
      return res.status(400).json({ message: "Party name is required" });
    }
    const { Party_Id: partyId } = req.params;

 

// 🔥 Duplicate party name check (excluding this party itself)
const [existingName] = await db.query(
  `SELECT Party_Id FROM add_party 
   WHERE LOWER(TRIM(Party_Name)) = LOWER(TRIM(?)) AND Party_Id != ?
   LIMIT 1`,
  [Party_Name, partyId]
);

if (existingName.length > 0) {
  await connection.rollback();
  return res.status(400).json({
    message: "Party name already exists",
  });
}
    const [result] = await db.execute(
      `UPDATE add_party 
       SET Party_Name = ?, GSTIN = ?, Phone_Number = ?, State = ?, Email_Id = ?, Billing_Address = ?, Shipping_Address = ?
       WHERE Party_Id = ?`,
      [
        Party_Name,
        cleanValue(GSTIN),
        cleanValue(Phone_Number),
       
        cleanValue(State),
        cleanValue(Email_Id),
        cleanValue(Billing_Address),
        cleanValue(Shipping_Address),
        partyId,
      ]
    );

    await connection.commit();
    return res.status(200).json({
      message: "Party updated successfully",
      success: true,
      id: partyId,
      Party_Name,
      GSTIN,
      Phone_Number,
     
      State,
      Email_Id,
      Billing_Address,
      Shipping_Address,
     
    });
  } catch (err) {
    if (connection) {
      await connection.rollback();
    }
    console.error("❌ Error updating party:", err);
    next(err);
    // return res.status(500).json({ message: "Internal Server Error" });
  }finally {
    if (connection) {
      connection.release();
    }
  }
}
const getAllParties = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();
    const page = req.query.page ? parseInt(req.query.page, 10) : null;
    const limit = 10;
    const search = req.query.search ? req.query.search.trim().toLowerCase() : "";

    let whereClause = "";
    let params = [];

    // 🔎 Search (optional)
    if (search) {
      whereClause = `
        WHERE LOWER(Party_Name) LIKE ? 
           OR LOWER(GSTIN) LIKE ? 
           OR LOWER(Phone_Number) LIKE ? 
           OR LOWER(State) LIKE ? 
           OR LOWER(Email_Id) LIKE ? 
           OR LOWER(Billing_Address) LIKE ?
      `;
      const like = `%${search}%`;
      params.push(like, like, like, like, like, like);
    }

    let rows, totalParties;

    if (page) {
      // 📄 Pagination mode
      const offset = (page - 1) * limit;
    
      // const query = `
      //   SELECT 
      //     p.*,
      //     COALESCE(s.total_sales, 0) AS Total_Sales_Amount,
      //     COALESCE(pr.total_purchases, 0) AS Total_Purchases_Amount
      //   FROM add_party p

      //   LEFT JOIN (
      //     SELECT Party_Id, SUM(Total_Amount) AS total_sales
      //     FROM add_sale
      //     GROUP BY Party_Id
      //   ) s ON s.Party_Id = p.Party_Id

      //   LEFT JOIN (
      //     SELECT Party_Id, SUM(Total_Amount) AS total_purchases
      //     FROM add_purchase
      //     GROUP BY Party_Id
      //   ) pr ON pr.Party_Id = p.Party_Id

      //   ${whereClause}
      //   ORDER BY p.created_at DESC
      //   LIMIT ? OFFSET ?
      // `;

      const query=`WITH transactions AS (
  SELECT 
    Party_Id,
    Total_Amount AS sales,
    0 AS purchases
  FROM add_sale

  UNION ALL

  SELECT 
    Party_Id,
    0 AS sales,
    Total_Amount AS purchases
  FROM add_purchase
)

SELECT 
  p.*,
  COALESCE(SUM(t.sales),0) AS Total_Sales_Amount,
  COALESCE(SUM(t.purchases),0) AS Total_Purchases_Amount
FROM add_party p

LEFT JOIN transactions t
  ON t.Party_Id = p.Party_Id

${whereClause}

GROUP BY p.Party_Id
ORDER BY p.created_at DESC
LIMIT ? OFFSET ?;`

      const countQuery = `
        SELECT COUNT(*) AS total 
        FROM add_party
        ${whereClause}
      `;
      const [data] = await db.query(query, [...params, limit, offset]);
      const [count] = await db.query(countQuery, params);

      rows = data;
      totalParties = count[0].total;

      return res.status(200).json({
        success: true,
        currentPage: page,
        totalPages: Math.ceil(totalParties / limit),
        totalParties,
        parties: rows,
      });
    } else {
      // 🧾 Non-paginated mode (used in dropdowns, exports, etc.)
      const query = `
        SELECT * 
        FROM add_party
        ${whereClause}
        ORDER BY created_at DESC
      `;
      const [data] = await db.query(query, params);

      return res.status(200).json({
        success: true,
        totalParties: data.length,
        parties: data,
      });
    }
  } catch (err) {
    if (connection ) connection.release();
    console.error("❌ Error getting all parties:", err);
    next(err);
    // return res.status(500).json({ message: "Internal Server Error" });
  }finally {
    if (connection) {
      connection.release();
    }
  }
};
// const getSinglePartyDetailsSalesPurchases = async (req, res, next) => {
//   let connection;

//   try {
//     connection = await db.getConnection();

//     const { Party_Id } = req.params;
//     const page = parseInt(req.query.page, 10) || 1;
//     const limit = 10;
//     const offset = (page - 1) * limit;
//     const search= req.query.search ? req.query.search.trim().toLowerCase() : "";
//     // const fromDate = req.query.fromDate || null;
//     // const toDate = req.query.toDate || null;
// const searchDate = req.query.date || null;
//     if (!Party_Id) {
//       return res.status(400).json({
//         success: false,
//         message: "Party Id is required",
//       });
//     }

//     // Party Details
//     const [partyDetails] = await connection.query(
//       `SELECT * FROM add_party WHERE Party_Id=?`,
//       [Party_Id]
//     );

//     if (!partyDetails.length) {
//       return res.status(404).json({
//         success: false,
//         message: "Party not found",
//       });
//     }

//     // Build date conditions per table
//     //const dateRange = fromDate && toDate;
//     const paramsSale        = [Party_Id];
//     const paramsPurchase    = [Party_Id];
//     const paramsSaleReturn  = [Party_Id];
//     const paramsPurchReturn = [Party_Id];
//     const paramsPaymentIn   = [Party_Id];
//     const paramsPaymentOut  = [Party_Id];

//     let dateConditionSale        = "";
//     let dateConditionPurchase    = "";
//     let dateConditionSaleReturn  = "";
//     let dateConditionPurchReturn = "";
//     let dateConditionPaymentIn   = "";
//     let dateConditionPaymentOut  = "";
//     if (searchDate) {
//   dateConditionSale = "AND Invoice_Date = ?";
//   dateConditionPurchase = "AND Bill_Date = ?";
//   dateConditionSaleReturn = "AND Return_Date = ?";
//   dateConditionPurchReturn = "AND Return_Date = ?";
//   dateConditionPaymentIn = "AND Payment_Date = ?";
//   dateConditionPaymentOut = "AND Payment_Date = ?";

//   paramsSale.push(searchDate);
//   paramsPurchase.push(searchDate);
//   paramsSaleReturn.push(searchDate);
//   paramsPurchReturn.push(searchDate);
//   paramsPaymentIn.push(searchDate);
//   paramsPaymentOut.push(searchDate);
// }
// let searchConditionSale = "";
// let searchConditionPurchase = "";
// let searchConditionSaleReturn = "";
// let searchConditionPurchReturn = "";
// let searchConditionPaymentIn = "";
// let searchConditionPaymentOut = "";

// if (search) {

//   // SALE
//   searchConditionSale = `
//     AND (
//       LOWER(Invoice_Number) LIKE ?
//       OR CAST(Total_Amount AS CHAR) LIKE ?
//       OR CAST(Total_Received AS CHAR) LIKE ?
//       OR CAST(Balance_Due AS CHAR) LIKE ?
//     )
//   `;

//   paramsSale.push(
//     `%${search}%`,
//     `%${search}%`,
//     `%${search}%`,
//     `%${search}%`
//   );


//   // PURCHASE
//   searchConditionPurchase = `
//     AND (
//       LOWER(Bill_Number) LIKE ?
//       OR CAST(Total_Amount AS CHAR) LIKE ?
//       OR CAST(Total_Paid AS CHAR) LIKE ?
//       OR CAST(Balance_Due AS CHAR) LIKE ?
//     )
//   `;

//   paramsPurchase.push(
//     `%${search}%`,
//     `%${search}%`,
//     `%${search}%`,
//     `%${search}%`
//   );


//   // SALE RETURN / CREDIT NOTE
//   searchConditionSaleReturn = `
//     AND (
//       LOWER(Return_Number) LIKE ?
//       OR LOWER(Invoice_Number) LIKE ?
//       OR CAST(Total_Amount AS CHAR) LIKE ?
//       OR CAST(Total_Paid AS CHAR) LIKE ?
//       OR CAST(Balance_Due AS CHAR) LIKE ?
//     )
//   `;

//   paramsSaleReturn.push(
//     `%${search}%`,
//     `%${search}%`,
//     `%${search}%`,
//     `%${search}%`,
//     `%${search}%`
//   );


//   // PURCHASE RETURN / DEBIT NOTE
//   searchConditionPurchReturn = `
//     AND (
//       LOWER(Return_Number) LIKE ?
//       OR LOWER(Bill_Number) LIKE ?
//       OR CAST(Total_Amount AS CHAR) LIKE ?
//       OR CAST(Total_Received AS CHAR) LIKE ?
//       OR CAST(Balance_Due AS CHAR) LIKE ?
//     )
//   `;

//   paramsPurchReturn.push(
//     `%${search}%`,
//     `%${search}%`,
//     `%${search}%`,
//     `%${search}%`,
//     `%${search}%`
//   );


//   // PAYMENT IN
//   searchConditionPaymentIn = `
//     AND (
//       LOWER(Receipt_No) LIKE ?
//       OR CAST(Received AS CHAR) LIKE ?
      
//     )
//   `;

//   paramsPaymentIn.push(
//     `%${search}%`,
//     `%${search}%`
//   );


//   // PAYMENT OUT
//   searchConditionPaymentOut = `
//     AND (
//       LOWER(Receipt_No) LIKE ?
//       OR CAST(Paid AS CHAR) LIKE ?
//     )
//   `;

//   paramsPaymentOut.push(
//     `%${search}%`,
//     `%${search}%`
//   );
// }
//     // if (dateRange) {
//     //   dateConditionSale        = "AND Invoice_Date BETWEEN ? AND ?";
//     //   dateConditionPurchase    = "AND Bill_Date BETWEEN ? AND ?";
//     //   dateConditionSaleReturn  = "AND Return_Date BETWEEN ? AND ?";
//     //   dateConditionPurchReturn = "AND Return_Date BETWEEN ? AND ?";
//     //   dateConditionPaymentIn   = "AND Payment_Date BETWEEN ? AND ?";
//     //   dateConditionPaymentOut  = "AND Payment_Date BETWEEN ? AND ?";
//     //   paramsSale.push(fromDate, toDate);
//     //   paramsPurchase.push(fromDate, toDate);
//     //   paramsSaleReturn.push(fromDate, toDate);
//     //   paramsPurchReturn.push(fromDate, toDate);
//     //   paramsPaymentIn.push(fromDate, toDate);
//     //   paramsPaymentOut.push(fromDate, toDate);
//     // }

//     // 🔹 Purchases
//     const [purchases] = await connection.query(
//       `SELECT Purchase_Id AS Formatted_Reference_Id, Bill_Date, Bill_Number, Total_Amount,
//               State_Of_Supply, Total_Paid, Balance_Due,
//               "Purchase" AS Type
//        FROM add_purchase
//        WHERE Party_Id=? ${dateConditionPurchase} ${searchConditionPurchase}`,
//       paramsPurchase
//     );

//     // 🔹 Sales
//     const [sales] = await connection.query(
//       `SELECT Sale_Id AS Formatted_Reference_Id, Invoice_Date, Invoice_Number, Total_Amount,
//               State_Of_Supply, Total_Received, Balance_Due,
//               "Sale" AS Type
//        FROM add_sale
//        WHERE Party_Id=? ${dateConditionSale} ${searchConditionSale}`,
//       paramsSale
//     );

//     // 🔹 Sale Returns (Credit Note)
//     const [saleReturns] = await connection.query(
//       `SELECT id AS  Formatted_Reference_Id,  Return_Date, Return_Number,
//               Invoice_Number, Total_Amount, Total_Paid, Balance_Due,
//               "Credit_Note" AS Type
//        FROM sale_return
//        WHERE Party_Id=? ${dateConditionSaleReturn} ${searchConditionSaleReturn}`,
//       paramsSaleReturn
//     );

//     // 🔹 Purchase Returns (Debit Note)
//     const [purchaseReturns] = await connection.query(
//       `SELECT id AS  Formatted_Reference_Id,  Return_Date, Return_Number,
//               Bill_Number, Total_Amount, Total_Received, Balance_Due,
//               "Debit_Note" AS Type
//        FROM purchase_return
//        WHERE Party_Id=? ${dateConditionPurchReturn} ${searchConditionPurchReturn}`,
//       paramsPurchReturn
//     );

//     // 🔹 Payment In (standalone receipts, not tied to a specific sale)
//     const [paymentIns] = await connection.query(
//       `SELECT id AS  Formatted_Reference_Id, Payment_Date, Receipt_No,
//               Received AS Total_Amount,
//               "Payment_In" AS Type
//        FROM payment_in
//        WHERE Party_Id=? ${dateConditionPaymentIn} ${searchConditionPaymentIn}`,
//       paramsPaymentIn
//     );

//     // 🔹 Payment Out (standalone payments, not tied to a specific purchase)
//     const [paymentOuts] = await connection.query(
//       `SELECT id AS  Formatted_Reference_Id, Payment_Date, Receipt_No,
//               Paid AS Total_Amount,
//               "Payment_Out" AS Type
//        FROM payment_out
//        WHERE Party_Id=? ${dateConditionPaymentOut} ${searchConditionPaymentOut}`,
//       paramsPaymentOut
//     );

//     // Combine all transaction types into one timeline
//     const combined = [
//       ...purchases.map(p => ({ ...p, date: p.Bill_Date })),
//       ...sales.map(s => ({ ...s, date: s.Invoice_Date })),
//       ...saleReturns.map(r => ({ ...r, date: r.Return_Date })),
//       ...purchaseReturns.map(r => ({ ...r, date: r.Return_Date })),
//       ...paymentIns.map(p => ({ ...p, date: p.Payment_Date })),
//       ...paymentOuts.map(p => ({ ...p, date: p.Payment_Date })),
//     ];

//     // Sort latest first
//     combined.sort((a, b) => new Date(b.date) - new Date(a.date));

//     const totalRecords = combined.length;
//     const totalPages   = Math.ceil(totalRecords / limit);
//     const paged        = combined.slice(offset, offset + limit);
//     const hasMore = offset + paged.length < totalRecords;

//     // Split paged results back out by type
//     let pagedPurchases      = paged.filter(r => r.Type === "Purchase");
//     let pagedSales          = paged.filter(r => r.Type === "Sale");
//     let pagedSaleReturns    = paged.filter(r => r.Type === "Credit_Note");
//     let pagedPurchReturns   = paged.filter(r => r.Type === "Debit_Note");
//     let pagedPaymentIns     = paged.filter(r => r.Type === "Payment_In");
//     let pagedPaymentOuts    = paged.filter(r => r.Type === "Payment_Out");

//     // 🔹 Purchase items
//     const purchaseIds = pagedPurchases.map(r => r.Purchase_Id);
//     if (purchaseIds.length > 0) {
//       const [purchaseItems] = await connection.query(
//         `SELECT pi.*, it.Item_Name, it.Item_HSN, it.Item_Category, it.Item_Unit
//          FROM add_purchase_items pi
//          LEFT JOIN add_item it ON it.Item_Id = pi.Item_Id
//          WHERE pi.Purchase_Id IN (?)`,
//         [purchaseIds]
//       );
//       pagedPurchases = pagedPurchases.map(p => ({
//         ...p,
//         items: purchaseItems.filter(i => i.Purchase_Id === p.Purchase_Id),
//       }));
//     }

//     // 🔹 Sale items
//     const saleIds = pagedSales.map(r => r.Sale_Id);
//     if (saleIds.length > 0) {
//       const [saleItems] = await connection.query(
//         `SELECT si.*, it.Item_Name, it.Item_HSN, it.Item_Category, it.Item_Unit
//          FROM add_sale_items si
//          LEFT JOIN add_item it ON it.Item_Id = si.Item_Id
//          WHERE si.Sale_Id IN (?)`,
//         [saleIds]
//       );
//       pagedSales = pagedSales.map(s => ({
//         ...s,
//         items: saleItems.filter(i => i.Sale_Id === s.Sale_Id),
//       }));
//     }

//     // 🔹 Sale Return items
//     const saleReturnIds = pagedSaleReturns.map(r => r.Sale_Return_Id);
//     if (saleReturnIds.length > 0) {
//       const [srItems] = await connection.query(
//         `SELECT sri.*, it.Item_Name, it.Item_HSN, it.Item_Category, it.Item_Unit
//          FROM sale_return_items sri
//          LEFT JOIN add_item it ON it.Item_Id = sri.Item_Id
//          WHERE sri.Sale_Return_Id IN (?)`,
//         [saleReturnIds]
//       );
//       pagedSaleReturns = pagedSaleReturns.map(r => ({
//         ...r,
//         items: srItems.filter(i => i.Sale_Return_Id === r.Sale_Return_Id),
//       }));
//     }

//     // 🔹 Purchase Return items
//     const purchReturnIds = pagedPurchReturns.map(r => r.Purchase_Return_Id);
//     if (purchReturnIds.length > 0) {
//       const [prItems] = await connection.query(
//         `SELECT pri.*, it.Item_Name, it.Item_HSN, it.Item_Category, it.Item_Unit
//          FROM purchase_return_items pri
//          LEFT JOIN add_item it ON it.Item_Id = pri.Item_Id
//          WHERE pri.Purchase_Return_Id IN (?)`,
//         [purchReturnIds]
//       );
//       pagedPurchReturns = pagedPurchReturns.map(r => ({
//         ...r,
//         items: prItems.filter(i => i.Purchase_Return_Id === r.Purchase_Return_Id),
//       }));
//     }

//     // 🔹 Payment splits for paged Payment In / Payment Out / Sale / Purchase / Returns
//     // (attach splits to every source type that uses payment_splits)
//     // const attachSplits = async (rows, sourceType, idField) => {
//     //   const ids = rows.map(r => r[idField]);
//     //   if (ids.length === 0) return rows;
//     //   const [splits] = await connection.query(
//     //     `SELECT * FROM payment_splits WHERE Source_Type = ? AND Source_Id IN (?)`,
//     //     [sourceType, ids]
//     //   );
//     //   return rows.map(r => ({
//     //     ...r,
//     //     splits: splits.filter(s => s.Source_Id === r[idField]),
//     //   }));
//     // };

//     // pagedSales        = await attachSplits(pagedSales, "Sale", "Sale_Id");
//     // pagedPurchases     = await attachSplits(pagedPurchases, "Purchase", "Purchase_Id");
//     // pagedSaleReturns   = await attachSplits(pagedSaleReturns, "Sale_Return", "Sale_Return_Id");
//     // pagedPurchReturns  = await attachSplits(pagedPurchReturns, "Purchase_Return", "Purchase_Return_Id");
//     // pagedPaymentIns    = await attachSplits(pagedPaymentIns, "Payment_In", "Payment_In_Id");
//     // pagedPaymentOuts   = await attachSplits(pagedPaymentOuts, "Payment_Out", "Payment_Out_Id");
//     // 🔹 Summary — Purchases (ALL TIME)
// const [[purchaseSummary]] = await connection.query(
//   `SELECT 
//       COALESCE(SUM(Total_Amount), 0) AS Total_Amount,
//       COALESCE(SUM(Total_Paid), 0) AS Total_Paid,
//       COALESCE(SUM(Balance_Due), 0) AS Balance_Due
//    FROM add_purchase
//    WHERE Party_Id = ?`,
//   [Party_Id]
// );

// // 🔹 Summary — Sales (ALL TIME)
// const [[salesSummary]] = await connection.query(
//   `SELECT 
//       COALESCE(SUM(Total_Amount), 0) AS Total_Amount,
//       COALESCE(SUM(Total_Received), 0) AS Total_Received,
//       COALESCE(SUM(Balance_Due), 0) AS Balance_Due
//    FROM add_sale
//    WHERE Party_Id = ?`,
//   [Party_Id]
// );

// // 🔹 Summary — Sale Returns / Credit Notes (ALL TIME)
// const [[saleReturnSummary]] = await connection.query(
//   `SELECT 
//       COALESCE(SUM(Total_Amount), 0) AS Total_Amount,
//       COALESCE(SUM(Total_Paid), 0) AS Total_Paid,
//       COALESCE(SUM(Balance_Due), 0) AS Balance_Due
//    FROM sale_return
//    WHERE Party_Id = ?`,
//   [Party_Id]
// );

// // 🔹 Summary — Purchase Returns / Debit Notes (ALL TIME)
// const [[purchaseReturnSummary]] = await connection.query(
//   `SELECT 
//       COALESCE(SUM(Total_Amount), 0) AS Total_Amount,
//       COALESCE(SUM(Total_Received), 0) AS Total_Received,
//       COALESCE(SUM(Balance_Due), 0) AS Balance_Due
//    FROM purchase_return
//    WHERE Party_Id = ?`,
//   [Party_Id]
// );

// // 🔹 Summary — Payment In (ALL TIME)
// const [[paymentInSummary]] = await connection.query(
//   `SELECT 
//       COALESCE(SUM(Received), 0) AS Total_Received
//    FROM payment_in
//    WHERE Party_Id = ?`,
//   [Party_Id]
// );

// // 🔹 Summary — Payment Out (ALL TIME)
// const [[paymentOutSummary]] = await connection.query(
//   `SELECT 
//       COALESCE(SUM(Paid), 0) AS Total_Paid
//    FROM payment_out
//    WHERE Party_Id = ?`,
//   [Party_Id]
// );

//     // // 🔹 Summary — Purchases
//     // const [[purchaseSummary]] = await connection.query(
//     //   `SELECT COALESCE(SUM(Total_Amount),0) AS Total_Amount,
//     //           COALESCE(SUM(Total_Paid),0) AS Total_Paid,
//     //           COALESCE(SUM(Balance_Due),0) AS Balance_Due
//     //    FROM add_purchase
//     //    WHERE Party_Id=? ${dateConditionPurchase} ${searchConditionPurchase}`,
//     //   paramsPurchase
//     // );

//     // // 🔹 Summary — Sales
//     // const [[salesSummary]] = await connection.query(
//     //   `SELECT COALESCE(SUM(Total_Amount),0) AS Total_Amount,
//     //           COALESCE(SUM(Total_Received),0) AS Total_Received,
//     //           COALESCE(SUM(Balance_Due),0) AS Balance_Due
//     //    FROM add_sale
//     //    WHERE Party_Id=? ${dateConditionSale} ${searchConditionSale}`,
//     //   paramsSale
//     // );

//     // // 🔹 Summary — Sale Returns (Credit Notes)
//     // const [[saleReturnSummary]] = await connection.query(
//     //   `SELECT COALESCE(SUM(Total_Amount),0) AS Total_Amount,
//     //           COALESCE(SUM(Total_Paid),0) AS Total_Paid,
//     //           COALESCE(SUM(Balance_Due),0) AS Balance_Due
//     //    FROM sale_return
//     //    WHERE Party_Id=? ${dateConditionSaleReturn}`,
//     //   paramsSaleReturn
//     // );

//     // // 🔹 Summary — Purchase Returns (Debit Notes)
//     // const [[purchaseReturnSummary]] = await connection.query(
//     //   `SELECT COALESCE(SUM(Total_Amount),0) AS Total_Amount,
//     //           COALESCE(SUM(Total_Received),0) AS Total_Received,
//     //           COALESCE(SUM(Balance_Due),0) AS Balance_Due
//     //    FROM purchase_return
//     //    WHERE Party_Id=? ${dateConditionPurchReturn}`,
//     //   paramsPurchReturn
//     // );

//     // // 🔹 Summary — Payment In
//     // const [[paymentInSummary]] = await connection.query(
//     //   `SELECT COALESCE(SUM(Received),0) AS Total_Received
//     //    FROM payment_in
//     //    WHERE Party_Id=? ${dateConditionPaymentIn}`,
//     //   paramsPaymentIn
//     // );

//     // // 🔹 Summary — Payment Out
//     // const [[paymentOutSummary]] = await connection.query(
//     //   `SELECT COALESCE(SUM(Paid),0) AS Total_Paid
//     //    FROM payment_out
//     //    WHERE Party_Id=? ${dateConditionPaymentOut}`,
//     //   paramsPaymentOut
//     // );

//     // 🔹 Net balance across everything:
//     // Party owes you: Sales - SaleReturns - PaymentIn (received against sales/standalone)
//     // You owe party: Purchases - PurchaseReturns - PaymentOut (paid against purchases/standalone)
//     const totalReceivable =
//       Number(salesSummary.Total_Amount) -
//       Number(saleReturnSummary.Total_Amount);

//     const totalReceived =
//       Number(salesSummary.Total_Received) +
//       Number(paymentInSummary.Total_Received) -
//       Number(saleReturnSummary.Total_Paid); // refunds paid out on credit notes reduce net received

//     const totalPayable =
//       Number(purchaseSummary.Total_Amount) -
//       Number(purchaseReturnSummary.Total_Amount);

//     const totalPaidOut =
//       Number(purchaseSummary.Total_Paid) +
//       Number(paymentOutSummary.Total_Paid) -
//       Number(purchaseReturnSummary.Total_Received); // refunds received on debit notes reduce net paid

//     const netBalance = (totalReceivable - totalReceived) - (totalPayable - totalPaidOut);
//     // positive => party owes you; negative => you owe party

//     return res.status(200).json({
//       success: true,
//       partyId: Party_Id,
//       partyDetails: partyDetails[0],
//       totalRecords,
//       totalPages,
//       currentPage: page,
//       limit,
//       hasMore, //  ADD THIS
//       summary: {
//         purchases:        purchaseSummary,
//         sales:             salesSummary,
//         saleReturns:       saleReturnSummary,
//         purchaseReturns:   purchaseReturnSummary,
//         paymentIns:        paymentInSummary,
//         paymentOuts:       paymentOutSummary,
//         netBalance, // + = receivable from party, - = payable to party
//       },
//       purchases:       pagedPurchases,
//       sales:            pagedSales,
//       saleReturns:      pagedSaleReturns,
//       purchaseReturns:  pagedPurchReturns,
//       paymentIns:       pagedPaymentIns,
//       paymentOuts:      pagedPaymentOuts,
//     });

//   } catch (err) {
//     console.error("❌ Error:", err);
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };

const getSinglePartyDetailsSalesPurchases = async (req, res, next) => {
  let connection;

  try {
    connection = await db.getConnection();

    const { Party_Id } = req.params;
    const limit = 10;
    const search = req.query.search ? req.query.search.trim().toLowerCase() : "";
    const searchDate = req.query.date || null;
    const cursor = req.query.cursor ? Number(req.query.cursor) : null;

    if (!Party_Id) {
      return res.status(400).json({ success: false, message: "Party Id is required" });
    }

    const [partyDetails] = await connection.query(
      `SELECT * FROM add_party WHERE Party_Id = ?`,
      [Party_Id]
    );
    if (!partyDetails.length) {
      return res.status(404).json({ success: false, message: "Party not found" });
    }

    // 🔹 Build ledger query — cursor + search + date
    const params = [Party_Id];
    let where = `WHERE pl.Party_Id = ?`;
    // let where = `WHERE Party_Id = ?`;

    // if (cursor) {
    //   where += ` AND id < ?`;
    //   params.push(cursor);
    // }

    // if (searchDate) {
    //   where += ` AND Txn_Date = ?`;
    //   params.push(searchDate);
    // }

    // if (search) {
    //   where += ` AND (
    //     LOWER(Doc_Number) LIKE ?
    //     OR CAST(Amount AS CHAR) LIKE ?
    //     OR CAST(Balance_Due AS CHAR) LIKE ?
    //   )`;
    //   params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    // }

    if (cursor) {
  where += ` AND pl.id < ?`;
  params.push(cursor);
}

if (searchDate) {
  where += ` AND pl.Txn_Date = ?`;
  params.push(searchDate);
}

if (search) {
  where += ` AND (
    pl.Doc_Number LIKE ?
    OR CAST(pl.Amount AS CHAR) LIKE ?
    OR CAST(pl.Balance_Due AS CHAR) LIKE ?
  )`;

  params.push(
    `%${search}%`,
    `%${search}%`,
    `%${search}%`
  );
}

    // const [ledgerRows] = await connection.query(
    //   `SELECT id, Txn_Type, Source_Id, Direction, Amount, Doc_Number, Balance_Due, Running_Balance, Txn_Date
    //    FROM party_ledger
    //    ${where}
    //    ORDER BY id DESC
    //    LIMIT ${limit + 1}`,
    //   params
    // );
const [ledgerRows] = await connection.query(
  `SELECT
      pl.id,
      pl.Txn_Type,
      pl.Source_Id,
      pl.Direction,
      pl.Amount,
      pl.Doc_Number,
      pl.Balance_Due,
      pl.Running_Balance,
      pl.Txn_Date,

      CASE pl.Txn_Type
        WHEN 'Sale' THEN s.Sale_Id
        WHEN 'Purchase' THEN p.Purchase_Id
        ELSE pl.Source_Id
      END AS Formatted_Reference_Id

   FROM party_ledger pl

   LEFT JOIN add_sale s
     ON pl.Txn_Type = 'Sale'
     AND pl.Source_Id = s.id

   LEFT JOIN add_purchase p
     ON pl.Txn_Type = 'Purchase'
     AND pl.Source_Id = p.id

   ${where}

   ORDER BY pl.id DESC
   LIMIT ${limit + 1}`,
  params
);
    const hasMore = ledgerRows.length > limit;
    const pageRows = hasMore ? ledgerRows.slice(0, limit) : ledgerRows;
    const nextCursor = hasMore ? pageRows[pageRows.length - 1].id : null;

    // 🔹 Summary — ALL TIME
    const [[purchaseSummary]] = await connection.query(
      `SELECT COALESCE(SUM(Total_Amount),0) AS Total_Amount,
              COALESCE(SUM(Total_Paid),0) AS Total_Paid,
              COALESCE(SUM(Balance_Due),0) AS Balance_Due
       FROM add_purchase WHERE Party_Id = ?`,
      [Party_Id]
    );

    const [[salesSummary]] = await connection.query(
      `SELECT COALESCE(SUM(Total_Amount),0) AS Total_Amount,
              COALESCE(SUM(Total_Received),0) AS Total_Received,
              COALESCE(SUM(Balance_Due),0) AS Balance_Due
       FROM add_sale WHERE Party_Id = ?`,
      [Party_Id]
    );

    const [[saleReturnSummary]] = await connection.query(
      `SELECT COALESCE(SUM(Total_Amount),0) AS Total_Amount,
              COALESCE(SUM(Total_Paid),0) AS Total_Paid,
              COALESCE(SUM(Balance_Due),0) AS Balance_Due
       FROM sale_return WHERE Party_Id = ?`,
      [Party_Id]
    );

    const [[purchaseReturnSummary]] = await connection.query(
      `SELECT COALESCE(SUM(Total_Amount),0) AS Total_Amount,
              COALESCE(SUM(Total_Received),0) AS Total_Received,
              COALESCE(SUM(Balance_Due),0) AS Balance_Due
       FROM purchase_return WHERE Party_Id = ?`,
      [Party_Id]
    );

    const [[paymentInSummary]] = await connection.query(
      `SELECT COALESCE(SUM(Received),0) AS Total_Received FROM payment_in WHERE Party_Id = ?`,
      [Party_Id]
    );

    const [[paymentOutSummary]] = await connection.query(
      `SELECT COALESCE(SUM(Paid),0) AS Total_Paid FROM payment_out WHERE Party_Id = ?`,
      [Party_Id]
    );

    const [[latestLedgerRow]] = await connection.query(
      `SELECT Running_Balance FROM party_ledger WHERE Party_Id = ? ORDER BY id DESC LIMIT 1`,
      [Party_Id]
    );
    const netBalance = latestLedgerRow ? Number(latestLedgerRow.Running_Balance) : 0;

    return res.status(200).json({
      success: true,
      partyId: Party_Id,
      partyDetails: partyDetails[0],
      transactions: pageRows,
      nextCursor,
      hasMore,
      summary: {
        purchases: purchaseSummary,
        sales: salesSummary,
        saleReturns: saleReturnSummary,
        purchaseReturns: purchaseReturnSummary,
        paymentIns: paymentInSummary,
        paymentOuts: paymentOutSummary,
        netBalance,
      },
    });
  } catch (err) {
    console.error("❌ Error:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};


const fonts = {
  Helvetica: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique",
  },
};

const printer = new PdfPrinter(fonts);
const printSinglePartyDetailsSalesPurchasesReport = async (req, res) => {
  try {
    const {
      party = {},          // Party Details
      purchases = [],      // Purchase Records
      sales = [],          // Sales Records
      summary = {}         // { purchases: {}, sales: {} }
    } = req.body;

    const safe = (v) => (v !== undefined && v !== null ? v : "N/A");

    const buildSection = (title, list, type) => {
      if (!list || list.length === 0) return [];

      let rows = [
        {
          text: title.toUpperCase(),
          style: "sectionHeader",
          alignment: "center",
          margin: [0, 20, 0, 10]
        }
      ];

      list.forEach((entry, idx) => {
        rows.push({
          unbreakable: true,
          stack: [
            // Title
            {
              text: `${title.slice(0, -1)} ${idx + 1}`,
              style: "subTitle",
              margin: [0, 0, 0, 5]
            },

            // Basic details section
            {
              columns: [
                {
                  width: "48%",
                  stack: [
                    { text: "Party Name", style: "label" },
                    { text: safe(party.Party_Name), style: "value" },

                    { text: "GSTIN", style: "label" },
                    { text: safe(party.GSTIN), style: "value" }
                  ]
                },
                {
                  width: "48%",
                  alignment: "right",
                  stack: [
                    {
                      text: type === "purchase" ? "Bill Number" : "Invoice Number",
                      style: "label"
                    },
                    {
                      text: safe(entry.Bill_Number || entry.Invoice_Number),
                      style: "value"
                    },

                    {
                      text: type === "purchase" ? "Bill Date" : "Invoice Date",
                      style: "label"
                    },
                    {
                       text: safe(
    new Date(entry.Bill_Date || entry.Invoice_Date)
      .toLocaleDateString("en-IN", {
        day: "numeric",
        month: "numeric",
        year: "numeric",
      })
  ),
  style: "value"
                    }
                  ]
                }
              ],
              columnGap: 20,
              margin: [0, 0, 0, 10]
            },

            // ITEMS TABLE
            {
              style: "tableSmall",
              table: {
                headerRows: 1,
                widths: ["auto", "*", "*", "*", "*", "*", "*", "*"],
                body: [
                  [
                    { text: "Sl", style: "tableHeader" },
                    { text: "Category", style: "tableHeader" },
                    { text: "Item", style: "tableHeader" },
                    { text: "HSN", style: "tableHeader" },
                    { text: "Qty", style: "tableHeader" },
                    { text: "Price", style: "tableHeader" },
                    { text: "Tax", style: "tableHeader" },
                    { text: "Amount", style: "tableHeader" }
                  ],
                  ...entry.items.map((it, i) => [
                    i + 1,
                    safe(it.Item_Category),
                    safe(it.Item_Name),
                    safe(it.Item_HSN),
                    safe(it.Quantity),
                    safe(it.Sale_Price || it.Purchase_Price),
                    safe(it.Tax_Type),
                    Number(it.Amount || 0).toFixed(2)
                  ])
                ]
              },
              layout: "lightHorizontalLines",
              margin: [0, 0, 0, 10]
            },

            // TOTALS SECTION
            {
              columns: [
                { width: "*", text: "" },
                {
                  width: "40%",
                  table: {
                    widths: ["*", "auto"],
                    body: [
                      ["Total Amount", safe(entry.Total_Amount)],
                      [
                        type === "purchase" ? "Paid" : "Received",
                        safe(entry.Total_Paid || entry.Total_Received)
                      ],
                      ["Balance Due", safe(entry.Balance_Due)]
                    ]
                  },
                  layout:  "noBordersBox"
                }
              ],
              margin: [0, 0, 0, 15]
            }
          ]
        });
      });

      return rows;
    };

    const docDefinition = {
      pageMargins: [18, 18, 18, 30],
      defaultStyle: { font: "Helvetica" },

      footer: (p, pc) => ({
        text: `Page ${p} of ${pc}`,
        alignment: "center",
        margin: [10, 10, 10, 10]
      }),

      content: [
        {
          text: `${party.Party_Name}`,
          style: "header",
          alignment: "center",
          margin: [0, 0, 0, 8]
        },

        {
          text: `GSTIN: ${party.GSTIN || "N/A"}`,
          alignment: "center",
          margin: [0, 0, 0, 15]
        },
          {
          text: `Billing Address: ${party.Billing_Address || "N/A"}`,
          alignment: "center",
          margin: [0, 0, 0, 15]
        },

        ...buildSection("Purchases", purchases, "purchase"),

        ...buildSection("Sales", sales, "sale")
      ],

      styles: {
        header: { fontSize: 18, bold: true },
        sectionHeader: { fontSize: 15, bold: true },
        subTitle: { fontSize: 12, bold: true },
        label: { bold: true, fontSize: 10 },
        value: { fontSize: 10 },
        tableHeader: { bold: true, fillColor: "#eee" },
        tableSmall: { fontSize: 9 }
      }
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const chunks = [];

    pdfDoc.on("data", (c) => chunks.push(c));
    pdfDoc.on("end", () => {
      res.setHeader("Content-Type", "application/pdf");
      res.send(Buffer.concat(chunks));
    });

    pdfDoc.end();

  } catch (err) {
    console.error("❌ PDF Print failed:", err);
    res.status(500).json({ message: "PDF Print Error" });
  }
};

//  GET ALL PARTIES WITH PAYABLES FROM  PURCHASE
const getAllPartiesPayablesLeft = async (req, res, next) => {
  let connection;

  try {
    connection = await db.getConnection();

    const page = parseInt(req.query.page, 10) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const search = req.query.search ? req.query.search.trim().toLowerCase() : "";
    const fromDate = req.query.fromDate || null;
    const toDate = req.query.toDate || null;

    let params = [];
    let whereClauses = [];

    // ✅ Only receivables
    whereClauses.push(`pu.Balance_Due > 0`);

    /* ================= SEARCH ================= */

    if (search) {
      whereClauses.push(`
        (
          LOWER(p.Party_Name) LIKE ?
          OR LOWER(p.GSTIN) LIKE ?
          OR LOWER(p.Phone_Number) LIKE ?
          OR LOWER(p.State) LIKE ?
          OR LOWER(p.Email_Id) LIKE ?
          OR LOWER(p.Billing_Address) LIKE ?
        )
      `);

      const like = `%${search}%`;
      params.push(like, like, like, like, like, like);
    }

    /* ================= DATE FILTER ================= */

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

    const whereSQL = whereClauses.length
      ? `WHERE ${whereClauses.join(" AND ")}`
      : "";

    /* ================= FETCH DATA ================= */

    const [rows] = await connection.query(
      `
      SELECT
        p.Party_Id,
        p.Party_Name,
        p.Phone_Number,
        p.GSTIN,
        pu.Purchase_Id,
        pu.Bill_Number,
        pu.Total_Amount,
        pu.Balance_Due,
        pu.Bill_Date,
        pu.Payment_Type,
        pu.Created_At
      FROM add_purchase pu
      JOIN add_party p ON p.Party_Id = pu.Party_Id
      ${whereSQL}
      ORDER BY p.Party_Name
      LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    /* ================= COUNT ================= */

    const [count] = await connection.query(
      `
      SELECT COUNT(*) AS total
      FROM add_purchase pu
      JOIN add_party p ON p.Party_Id = pu.Party_Id
      ${whereSQL}
      `,
      params
    );

    /* ================= RESPONSE ================= */

    res.status(200).json({
      success: true,
      message: "Successfully fetched receivable bills",
      data: rows,
      currentPage: page,
      totalPages: Math.ceil(count[0].total / limit),
      totalPurchases: count[0].total,
    });

  } catch (err) {
    console.error("❌ Error:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};


//  GET ALL PARTIES WITH RECEIVABLES FROM  SALES
const getAllPartiesReceivablesLeft = async (req, res, next) => {
  let connection;

  try {
    connection = await db.getConnection();

    const page = parseInt(req.query.page, 10) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const search = req.query.search ? req.query.search.trim().toLowerCase() : "";
    const fromDate = req.query.fromDate || null;
    const toDate = req.query.toDate || null;

    let params = [];
    let whereClauses = [];

    // ✅ Only receivables
    whereClauses.push(`s.Balance_Due > 0`);

    /* ================= SEARCH ================= */

    if (search) {
      whereClauses.push(`
        (
          LOWER(p.Party_Name) LIKE ?
          OR LOWER(p.GSTIN) LIKE ?
          OR LOWER(p.Phone_Number) LIKE ?
          OR LOWER(p.State) LIKE ?
          OR LOWER(p.Email_Id) LIKE ?
          OR LOWER(p.Billing_Address) LIKE ?
        )
      `);

      const like = `%${search}%`;
      params.push(like, like, like, like, like, like);
    }

    /* ================= DATE FILTER ================= */

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

    const whereSQL = whereClauses.length
      ? `WHERE ${whereClauses.join(" AND ")}`
      : "";

    /* ================= FETCH DATA ================= */

    const [rows] = await connection.query(
      `
      SELECT
        p.Party_Id,
        p.Party_Name,
        p.Phone_Number,
        p.GSTIN,
        s.Sale_Id,
        s.Invoice_Number,
        s.Total_Amount,
        s.Balance_Due,
        s.Invoice_Date,
        s.Payment_Type,
        s.Created_At
      FROM add_sale s
      JOIN add_party p ON p.Party_Id = s.Party_Id
      ${whereSQL}
      ORDER BY p.Party_Name
      LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    /* ================= COUNT ================= */

    const [count] = await connection.query(
      `
      SELECT COUNT(*) AS total
      FROM add_sale s
      JOIN add_party p ON p.Party_Id = s.Party_Id
      ${whereSQL}
      `,
      params
    );

    /* ================= RESPONSE ================= */

    res.status(200).json({
      success: true,
      message: "Successfully fetched receivable bills",
      data: rows,
      currentPage: page,
      totalPages: Math.ceil(count[0].total / limit),
      totalSales: count[0].total,
    });

  } catch (err) {
    console.error("❌ Error:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

export { addParty,editParty,getAllParties,getSinglePartyDetailsSalesPurchases,
  printSinglePartyDetailsSalesPurchasesReport,getAllPartiesPayablesLeft,getAllPartiesReceivablesLeft
 };  // ✅ for ESM
// const getSinglePartyDetailsSalesPurchases = async (req, res, next) => {
//   let connection;

//   try {
//     connection = await db.getConnection();

//     const { Party_Id } = req.params;
//     const page = parseInt(req.query.page, 10) || 1;
//     const limit = 10;
//     const offset = (page - 1) * limit;
// const salesCursor = req.query.salesCursor || null;
// const purchasesCursor = req.query.purchasesCursor || null;
//     const fromDate = req.query.fromDate || null;
//     const toDate = req.query.toDate || null;

//     if (!Party_Id) {
//       return res.status(400).json({
//         success: false,
//         message: "Party Id is required",
//       });
//     }

//     // Party Details
//     const [partyDetails] = await connection.query(
//       `SELECT * FROM add_party WHERE Party_Id=?`,
//       [Party_Id]
//     );

//     if (!partyDetails.length) {
//       return res.status(404).json({
//         success: false,
//         message: "Party not found",
//       });
//     }

//     // Build date condition
//     let dateConditionSale = "";
//     let dateConditionPurchase = "";
//     const paramsSale = [Party_Id];
//     const paramsPurchase = [Party_Id];

//     if (fromDate && toDate) {
//       dateConditionSale = "AND Invoice_Date BETWEEN ? AND ?";
//       dateConditionPurchase = "AND Bill_Date BETWEEN ? AND ?";
//       paramsSale.push(fromDate, toDate);
//       paramsPurchase.push(fromDate, toDate);
//     }

//     // Fetch purchases
//     const [purchases] = await connection.query(
//       `
//       SELECT 
//         Purchase_Id,
//         Bill_Date,
//         Bill_Number,
//         Total_Amount,
//         State_Of_Supply,
//         Total_Paid,
//         Balance_Due,
//         Payment_Type,
//         "Purchase" AS Type
//       FROM add_purchase
//       WHERE Party_Id=? ${dateConditionPurchase}
//       `,
//       paramsPurchase
//     );

//     // Fetch sales
//     const [sales] = await connection.query(
//       `
//       SELECT 
//         Sale_Id,
//         Invoice_Date,
//         Invoice_Number,
//         Total_Amount,
//         State_Of_Supply,
//         Total_Received,
//         Balance_Due,
//         Payment_Type,
//         "Sale" AS Type
//       FROM add_sale
//       WHERE Party_Id=? ${dateConditionSale}
//       `,
//       paramsSale
//     );

//     // Combine transactions
//     const combined = [
//       ...purchases.map(p => ({
//         ...p,
//         date: p.Bill_Date
//       })),
//       ...sales.map(s => ({
//         ...s,
//         date: s.Invoice_Date
//       }))
//     ];

//     // Sort latest first
//     combined.sort((a, b) => new Date(b.date) - new Date(a.date));

//     const paged = combined.slice(offset, offset + limit);

//     // Separate again
//     let pagedPurchases = paged.filter(r => r.Type === "Purchase");
//     let pagedSales = paged.filter(r => r.Type === "Sale");

//     const totalRecords = combined.length;
//     const totalPages = Math.ceil(totalRecords / limit);

//     // Fetch purchase items
//     const purchaseIds = pagedPurchases.map(r => r.Purchase_Id);

//     if (purchaseIds.length > 0) {
//       const [purchaseItems] = await connection.query(
//         `
//         SELECT pi.*, it.Item_Name, it.Item_HSN, it.Item_Category, it.Item_Unit
//         FROM add_purchase_items pi
//         LEFT JOIN add_item it ON it.Item_Id = pi.Item_Id
//         WHERE pi.Purchase_Id IN (?)
//         `,
//         [purchaseIds]
//       );

//       pagedPurchases = pagedPurchases.map(p => ({
//         ...p,
//         items: purchaseItems.filter(i => i.Purchase_Id === p.Purchase_Id)
//       }));
//     }

//     // Fetch sale items
//     const saleIds = pagedSales.map(r => r.Sale_Id);

//     if (saleIds.length > 0) {
//       const [saleItems] = await connection.query(
//         `
//         SELECT si.*, it.Item_Name, it.Item_HSN, it.Item_Category, it.Item_Unit
//         FROM add_sale_items si
//         LEFT JOIN add_item it ON it.Item_Id = si.Item_Id
//         WHERE si.Sale_Id IN (?)
//         `,
//         [saleIds]
//       );

//       pagedSales = pagedSales.map(s => ({
//         ...s,
//         items: saleItems.filter(i => i.Sale_Id === s.Sale_Id)
//       }));
//     }

//     // Summary Purchases
//     const [[purchaseSummary]] = await connection.query(
//       `
//       SELECT 
//         COALESCE(SUM(Total_Amount),0) AS Total_Amount,
//         COALESCE(SUM(Total_Paid),0) AS Total_Paid,
//         COALESCE(SUM(Balance_Due),0) AS Balance_Due
//       FROM add_purchase
//       WHERE Party_Id=? ${dateConditionPurchase}
//       `,
//       paramsPurchase
//     );

//     // Summary Sales
//     const [[salesSummary]] = await connection.query(
//       `
//       SELECT 
//         COALESCE(SUM(Total_Amount),0) AS Total_Amount,
//         COALESCE(SUM(Total_Received),0) AS Total_Received,
//         COALESCE(SUM(Balance_Due),0) AS Balance_Due
//       FROM add_sale
//       WHERE Party_Id=? ${dateConditionSale}
//       `,
//       paramsSale
//     );

//     return res.status(200).json({
//       success: true,
//       partyId: Party_Id,
//       partyDetails: partyDetails[0],
//       totalRecords,
//       totalPages,
//       currentPage: page,
//       limit,
//       summary: {
//         purchases: purchaseSummary,
//         sales: salesSummary,
//       },
//       purchases: pagedPurchases,
//       sales: pagedSales,
//     });

//   } catch (err) {
//     console.error("❌ Error:", err);
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };
