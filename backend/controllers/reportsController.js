import PdfPrinter from "pdfmake";
import db from "../config/db.js";
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
// const getSalesNewSalesPurchasesEachDay = async (req, res, next) => {
//   let connection;
//   try {
//     connection = await db.getConnection();

//     // const { date, year, month } = req.query;
//     const {date} = req.query;
//     console.log(date);
//     // const [year, month, day] = date.split("-");
//     // const fullDate = `${year}-${month}-${day}`; 
// if (!date) {
//      connection.release();
//   return res.status(400).json({ message: "Date is required" });
// }

// const fullDate = date; // already YYYY-MM-DD
//     const formatIndianDate = (date) =>
//       new Date(date).toLocaleString("en-IN", {
//         day: "2-digit",
//         month: "2-digit",
//         year: "numeric"
//       });

//     const formatIndianDateTime = (timestamp) =>
//       new Date(timestamp).toLocaleString("en-IN", {
//         day: "2-digit",
//         month: "2-digit",
//         year: "numeric",
//         hour: "2-digit",
//         minute: "2-digit"
//       });

//     // ---------------------------------------------------
//     // SALES + ITEMS
//     // ---------------------------------------------------
//     const [sales] = await db.query(
//       `SELECT s.*, p.Party_Name,p.GSTIN
//        FROM add_sale s
//        LEFT JOIN add_party p ON s.Party_Id = p.Party_Id
//        WHERE DATE(s.created_at) = ?
//        ORDER BY s.created_at ASC`,
//       [fullDate]
//     );

//     const saleIds = sales.map((s) => s.Sale_Id);

//     let saleItems = [];
//     if (saleIds.length > 0) {
//       const [items] = await db.query(
//         `SELECT si.*,i.Item_Name,i.Item_HSN,i.Item_Category,i.Item_Unit FROM add_sale_items si
//         LEFT JOIN add_item i ON si.Item_Id = i.Item_Id
//         WHERE si.Sale_Id IN (?)`,
//         [saleIds]
//       );
//       saleItems = items;
//     }

//     const salesWithItems = sales.map((sale) => ({
//       sale_id: sale.Sale_Id,
//       Party_Name: sale.Party_Name,
//       GSTIN: sale.GSTIN,
//       Invoice_Number: sale.Invoice_Number,
//       Invoice_Date: formatIndianDate(sale.Invoice_Date),
//       State_Of_Supply: sale.State_Of_Supply,
//       Payment_Type: sale.Payment_Type,
//       Referrence_Number: sale.Referrence_Number,
//     //   bill_number: sale.Bill_Number,
//       Total_Received: sale.Total_Received,
//       Balance_Due: sale.Balance_Due,
//       created_at: formatIndianDate(sale.created_at),
//       Total_Amount: sale.Total_Amount,
//       items: saleItems.filter((i) => i.Sale_Id === sale.Sale_Id),
//     }));

//     // ---------------------------------------------------
//     // NEW SALES + ITEMS
//     // ---------------------------------------------------
//     const [newSales] = await db.query(
//       `SELECT ns.*, p.Party_Name,p.GSTIN 
//        FROM add_new_sale ns
//        LEFT JOIN add_party p ON ns.Party_Id = p.Party_Id
//        WHERE DATE(ns.created_at) = ?
//        ORDER BY ns.created_at ASC`,
//       [fullDate]
//     );
//     console.log(newSales);

//     const newSaleIds = newSales.map((n) => n.Sale_Id);
//     console.log(newSaleIds);
//     let newSaleItems = [];
//     if (newSaleIds.length > 0) {
//       const [items] = await db.query(
//         `SELECT nsi.*,i.Item_Name,i.Item_HSN,i.Item_Category,i.Item_Unit
//         FROM add_new_sale_items nsi
//          LEFT JOIN add_item_sale i ON nsi.Item_Id = i.Item_Id
//          WHERE nsi.Sale_Id IN (?)`,
//         [newSaleIds]
//       );
//       newSaleItems = items;
//     }
//     console.log(newSaleItems);

//     const newSalesWithItems = newSales.map((ns) => ({
//       sale_id: ns.Sale_Id,
//       Party_Name: ns.Party_Name,
//       GSTIN: ns.GSTIN,
//       Invoice_Number: ns.Invoice_Number,
//       Invoice_Date: formatIndianDate(ns.Invoice_Date),
//       State_Of_Supply: ns.State_Of_Supply,
//       Payment_Type: ns.Payment_Type,
//       Referrence_Number: ns.Referrence_Number,
//       Total_Received: ns.Total_Received,
//       Balance_Due: ns.Balance_Due,
//       created_at: formatIndianDate(ns.created_at),
//       Total_Amount: ns.Total_Amount,
//       items: newSaleItems.filter((i) => i.Sale_Id === ns.Sale_Id),
//     }));

//     // ---------------------------------------------------
//     // PURCHASES + ITEMS
//     // ---------------------------------------------------
//     const [purchases] = await db.query(
//       `SELECT pu.*, p.Party_Name,p.GSTIN 
//        FROM add_purchase pu
//        LEFT JOIN add_party p ON pu.Party_Id = p.Party_Id
//        WHERE DATE(pu.created_at) = ?
//        ORDER BY pu.created_at ASC`,
//       [fullDate]
//     );

//     const purchaseIds = purchases.map((pu) => pu.Purchase_Id);

//     let purchaseItems = [];
//     if (purchaseIds.length > 0) {
//       const [items] = await db.query(
//         `SELECT pu.*,i.Item_Name,i.Item_HSN,i.Item_Category,i.Item_Unit
//          FROM add_purchase_items pu
//          LEFT JOIN add_item i ON pu.Item_Id = i.Item_Id
//           WHERE pu.Purchase_Id IN (?)`,
//         [purchaseIds]
//       );
//       purchaseItems = items;
//     }

//     const purchasesWithItems = purchases.map((pu) => ({
//       purchase_id: pu.Purchase_Id,
//       Party_Name: pu.Party_Name,
//       GSTIN: pu.GSTIN,
//       Bill_Number: pu.Bill_Number,
//       Bill_Date: formatIndianDate(pu.Bill_Date),
//       State_Of_Supply: pu.State_Of_Supply,
//       Payment_Type: pu.Payment_Type,
//       Referrence_Number: pu.Referrence_Number,
//       Total_Paid: pu.Total_Paid,
//       Balance_Due: pu.Balance_Due,
//       created_at: formatIndianDate(pu.created_at),
//       Total_Amount: pu.Total_Amount,
//       items: purchaseItems.filter((i) => i.Purchase_Id === pu.Purchase_Id),
//     }));
// const totalPurchasesAmount = purchases.reduce(
//   (sum, p) => sum + Number(p.Total_Amount || 0),0);
// const totalPurchasePaidAmount = purchases.reduce(
//   (sum, p) => sum + Number(p.Total_Paid || 0),0)
// const totalSalesAmount = sales.reduce(
//   (sum, s) => sum + Number(s.Total_Amount || 0),0);
// const totalSalesReceivedAmount = sales.reduce(
//   (sum, s) => sum + Number(s.Total_Received || 0),0)
// const totalNewSalesAmount = newSales.reduce(
//   (sum, s) => sum + Number(s.Total_Amount || 0),0);
// const totalNewSalesReceivedAmount = newSales.reduce(
//   (sum, s) => sum + Number(s.Total_Received || 0),0)
//     // ---------------------------------------------------
//     // RESPONSE
//     // ---------------------------------------------------
//     return res.status(200).json({
//       success: true,
//       date: fullDate,
//       data:{
//         sales:{salesWithItems,totalSalesAmount,totalSalesReceivedAmount},
//       newSales: {newSalesWithItems,totalNewSalesAmount,totalNewSalesReceivedAmount},
//       purchases: {purchasesWithItems,totalPurchasesAmount,totalPurchasePaidAmount },
//       }
 
//     });

//   } catch (err) {
//     if (connection) connection.release();
//     console.error("❌ Error:", err);
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };

// const fonts = {
//   Helvetica: {
//     normal: "Helvetica",
//     bold: "Helvetica-Bold",
//     italics: "Helvetica-Oblique",
//     bolditalics: "Helvetica-BoldOblique",
//   },
// };
// const getSalesNewSalesPurchasesEachDay = async (req, res, next) => {
//   let connection;
//   try {
//     connection = await db.getConnection();

//     const { date } = req.query;

//     if (!date) {
//       connection.release();
//       return res.status(400).json({ message: "Date is required" });
//     }

//     const fullDate = date; // Already YYYY-MM-DD

//     // Date formatter
//     const formatIndianDate = (date) =>
//       new Date(date).toLocaleString("en-IN", {
//         day: "2-digit",
//         month: "2-digit",
//         year: "numeric"
//       });

//     // ---------------------------------------------------
//     // 1️⃣ SALES (DATA + ITEMS)
//     // ---------------------------------------------------
//     const [sales] = await db.query(
//       `SELECT s.*, p.Party_Name, p.GSTIN
//        FROM add_sale s
//        LEFT JOIN add_party p ON s.Party_Id = p.Party_Id
//        WHERE DATE(s.financial_year) = ?
//        ORDER BY s.created_at ASC`,
//       [fullDate]
//     );

//     const saleIds = sales.map((s) => s.Sale_Id);

//     let saleItems = [];
//     if (saleIds.length > 0) {
//       const [items] = await db.query(
//         `SELECT si.*, i.Item_Name, i.Item_HSN, i.Item_Category, i.Item_Unit
//          FROM add_sale_items si
//          LEFT JOIN add_item i ON si.Item_Id = i.Item_Id
//          WHERE si.Sale_Id IN (?)`,
//         [saleIds]
//       );
//       saleItems = items;
//     }

//     const salesWithItems = sales.map((sale) => ({
//       sale_id: sale.Sale_Id,
//       Party_Name: sale.Party_Name,
//       GSTIN: sale.GSTIN,
//       Invoice_Number: sale.Invoice_Number,
//       Invoice_Date: formatIndianDate(sale.Invoice_Date),
//       State_Of_Supply: sale.State_Of_Supply,
//       Payment_Type: sale.Payment_Type,
//       Referrence_Number: sale.Referrence_Number,
//       Total_Received: sale.Total_Received,
//       Balance_Due: sale.Balance_Due,
//       created_at: formatIndianDate(sale.created_at),
//       Total_Amount: sale.Total_Amount,
//       items: saleItems.filter((i) => i.Sale_Id === sale.Sale_Id),
//     }));

//     // 👉 SQL TOTALS
//     const [salesTotals] = await db.query(
//       `SELECT 
//           COALESCE(SUM(Total_Amount),0) AS totalSalesAmount,
//           COALESCE(SUM(Total_Received),0) AS totalSalesReceivedAmount,
//           COALESCE(SUM(Balance_Due),0) AS totalSalesBalanceDue
//        FROM add_sale
//        WHERE DATE(created_at) = ?`,
//       [fullDate]
//     );

//     // ---------------------------------------------------
//     // 2️⃣ NEW SALES (DATA + ITEMS)
//     // ---------------------------------------------------
    

//     // ---------------------------------------------------
//     // 3️⃣ PURCHASES (DATA + ITEMS)
//     // ---------------------------------------------------
//     const [purchases] = await db.query(
//       `SELECT pu.*, p.Party_Name, p.GSTIN
//        FROM add_purchase pu
//        LEFT JOIN add_party p ON pu.Party_Id = p.Party_Id
//        WHERE DATE(pu.financial_year) = ?
//        ORDER BY pu.created_at ASC`,
//       [fullDate]
//     );

//     const purchaseIds = purchases.map((pu) => pu.Purchase_Id);

//     let purchaseItems = [];
//     if (purchaseIds.length > 0) {
//       const [items] = await db.query(
//         `SELECT pu.*, i.Item_Name, i.Item_HSN, i.Item_Category, i.Item_Unit
//          FROM add_purchase_items pu
//          LEFT JOIN add_item i ON pu.Item_Id = i.Item_Id
//          WHERE pu.Purchase_Id IN (?)`,
//         [purchaseIds]
//       );
//       purchaseItems = items;
//     }

//     const purchasesWithItems = purchases.map((pu) => ({
//       purchase_id: pu.Purchase_Id,
//       Party_Name: pu.Party_Name,
//       GSTIN: pu.GSTIN,
//       Bill_Number: pu.Bill_Number,
//       Bill_Date: formatIndianDate(pu.Bill_Date),
//       State_Of_Supply: pu.State_Of_Supply,
//       Payment_Type: pu.Payment_Type,
//       Referrence_Number: pu.Referrence_Number,
//       Total_Paid: pu.Total_Paid,
//       Balance_Due: pu.Balance_Due,
//       created_at: formatIndianDate(pu.created_at),
//       Total_Amount: pu.Total_Amount,
//       items: purchaseItems.filter((i) => i.Purchase_Id === pu.Purchase_Id),
//     }));

//     // 👉 SQL TOTALS
//     const [purchaseTotals] = await db.query(
//       `SELECT 
//           COALESCE(SUM(Total_Amount),0) AS totalPurchasesAmount,
//           COALESCE(SUM(Total_Paid),0) AS totalPurchasePaidAmount,
//           COALESCE(SUM(Balance_Due),0) AS totalPurchasesBalanceDue
//        FROM add_purchase
//        WHERE DATE(created_at) = ?`,
//       [fullDate]
//     );

//     // ---------------------------------------------------
//     // FINAL RESPONSE
//     // ---------------------------------------------------

// console.log(salesTotals);
//     return res.status(200).json({
//       success: true,
//       date: fullDate,
//       data: {
//         sales: {
//           items: salesWithItems,
//           totalSalesAmount: salesTotals[0].totalSalesAmount,
//          totalSalesReceivedAmount: salesTotals[0].totalSalesReceivedAmount,
//          totalSalesBalanceDue: salesTotals[0].totalSalesBalanceDue
//         },
     
//         purchases: {
//           items: purchasesWithItems,
//           totalPurchasesAmount: purchaseTotals[0].totalPurchasesAmount,
//           totalPurchasePaidAmount: purchaseTotals[0].totalPurchasePaidAmount,
//           totalPurchasesBalanceDue: purchaseTotals[0].totalPurchasesBalanceDue
//         }
//       }
//     });

//   } catch (err) {
//     if (connection) connection.release();
//     console.error("❌ Error:", err);
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };
// const getSalesNewSalesPurchasesInDateRange = async (req, res, next) => {
//   let connection;
//   try {
//     connection = await db.getConnection();

//     const { fromDate, toDate } = req.query;

//     if (!fromDate || !toDate) {
//       connection.release();
//       return res.status(400).json({ message: "From and To Date is required" });
//     }
 

//     const fullFromDate = fromDate; // Already YYYY-MM-DD
//     const fullToDate = toDate; // Already YYYY-MM-DD

//     // Date formatter
//     const formatIndianDate = (date) =>
//       new Date(date).toLocaleString("en-IN", {
//         day: "2-digit",
//         month: "2-digit",
//         year: "numeric"
//       });

//     // ---------------------------------------------------
//     // 1️⃣ SALES (DATA + ITEMS)
//     // ---------------------------------------------------
//     const [sales] = await db.query(
//       `SELECT s.*, p.Party_Name, p.GSTIN
//        FROM add_sale s
//        LEFT JOIN add_party p ON s.Party_Id = p.Party_Id
//        WHERE DATE(s.created_at) BETWEEN ? AND ?
//        ORDER BY s.created_at ASC`,
//       [fullFromDate, fullToDate]
//     );

//     const saleIds = sales.map((s) => s.Sale_Id);

//     let saleItems = [];
//     if (saleIds.length > 0) {
//       const [items] = await db.query(
//         `SELECT si.*, i.Item_Name, i.Item_HSN, i.Item_Category, i.Item_Unit
//          FROM add_sale_items si
//          LEFT JOIN add_item i ON si.Item_Id = i.Item_Id
//          WHERE si.Sale_Id IN (?)`,
//         [saleIds]
//       );
//       saleItems = items;
//     }

//     const salesWithItems = sales.map((sale) => ({
//       sale_id: sale.Sale_Id,
//       Party_Name: sale.Party_Name,
//       GSTIN: sale.GSTIN,
//       Invoice_Number: sale.Invoice_Number,
//       Invoice_Date: formatIndianDate(sale.Invoice_Date),
//       State_Of_Supply: sale.State_Of_Supply,
//       Payment_Type: sale.Payment_Type,
//       Referrence_Number: sale.Referrence_Number,
//       Total_Received: sale.Total_Received,
//       Balance_Due: sale.Balance_Due,
//       created_at: formatIndianDate(sale.created_at),
//       Total_Amount: sale.Total_Amount,
//       items: saleItems.filter((i) => i.Sale_Id === sale.Sale_Id),
//     }));

//     // 👉 SQL TOTALS
//     const [salesTotals] = await db.query(
//       `SELECT 
//           COALESCE(SUM(Total_Amount),0) AS totalSalesAmount,
//           COALESCE(SUM(Total_Received),0) AS totalSalesReceivedAmount,
//           COALESCE(SUM(Balance_Due),0) AS totalSalesBalanceDue
//        FROM add_sale
//       WHERE DATE(created_at) BETWEEN ? AND ?`,
//       [fullFromDate, fullToDate]
//     );

//     // ---------------------------------------------------
//     // 2️⃣ NEW SALES (DATA + ITEMS)
//     // ---------------------------------------------------
//     const [newSales] = await db.query(
//       `SELECT ns.*, p.Party_Name, p.GSTIN
//        FROM add_new_sale ns
//        LEFT JOIN add_party p ON ns.Party_Id = p.Party_Id
//        WHERE DATE(ns.created_at) BETWEEN ? AND ?
//        ORDER BY ns.created_at ASC`,
//       [fullFromDate, fullToDate]
//     );

//     const newSaleIds = newSales.map((ns) => ns.Sale_Id);

//     let newSaleItems = [];
//     if (newSaleIds.length > 0) {
//       const [items] = await db.query(
//         `SELECT nsi.*, i.Item_Name, i.Item_HSN, i.Item_Category, i.Item_Unit
//          FROM add_new_sale_items nsi
//          LEFT JOIN add_item_sale i ON nsi.Item_Id = i.Item_Id
//          WHERE nsi.Sale_Id IN (?)`,
//         [newSaleIds]
//       );
//       newSaleItems = items;
//     }

//     const newSalesWithItems = newSales.map((ns) => ({
//       sale_id: ns.Sale_Id,
//       Party_Name: ns.Party_Name,
//       GSTIN: ns.GSTIN,
//       Invoice_Number: ns.Invoice_Number,
//       Invoice_Date: formatIndianDate(ns.Invoice_Date),
//       State_Of_Supply: ns.State_Of_Supply,
//       Payment_Type: ns.Payment_Type,
//       Referrence_Number: ns.Referrence_Number,
//       Total_Received: ns.Total_Received,
//       Balance_Due: ns.Balance_Due,
//       created_at: formatIndianDate(ns.created_at),
//       Total_Amount: ns.Total_Amount,
//       items: newSaleItems.filter((i) => i.Sale_Id === ns.Sale_Id),
//     }));

//     // 👉 SQL TOTALS
//     const [newSalesTotals] = await db.query(
//       `SELECT 
//           COALESCE(SUM(Total_Amount), 0) AS totalNewSalesAmount,
//           COALESCE(SUM(Total_Received), 0) AS totalNewSalesReceivedAmount,
//           COALESCE(SUM(Balance_Due), 0) AS totalNewSalesBalanceDue
//        FROM add_new_sale
//       WHERE DATE(created_at) BETWEEN ? AND ?`,
//       [fullFromDate, fullToDate]
//     );

//     // ---------------------------------------------------
//     // 3️⃣ PURCHASES (DATA + ITEMS)
//     // ---------------------------------------------------
//     const [purchases] = await db.query(
//       `SELECT pu.*, p.Party_Name, p.GSTIN
//        FROM add_purchase pu
//        LEFT JOIN add_party p ON pu.Party_Id = p.Party_Id
//        WHERE DATE(pu.created_at) BETWEEN ? AND ?
//        ORDER BY pu.created_at ASC`,
//       [fullFromDate, fullToDate]
//     );

//     const purchaseIds = purchases.map((pu) => pu.Purchase_Id);

//     let purchaseItems = [];
//     if (purchaseIds.length > 0) {
//       const [items] = await db.query(
//         `SELECT pu.*, i.Item_Name, i.Item_HSN, i.Item_Category, i.Item_Unit
//          FROM add_purchase_items pu
//          LEFT JOIN add_item i ON pu.Item_Id = i.Item_Id
//          WHERE pu.Purchase_Id IN (?)`,
//         [purchaseIds]
//       );
//       purchaseItems = items;
//     }

//     const purchasesWithItems = purchases.map((pu) => ({
//       purchase_id: pu.Purchase_Id,
//       Party_Name: pu.Party_Name,
//       GSTIN: pu.GSTIN,
//       Bill_Number: pu.Bill_Number,
//       Bill_Date: formatIndianDate(pu.Bill_Date),
//       State_Of_Supply: pu.State_Of_Supply,
//       Payment_Type: pu.Payment_Type,
//       Referrence_Number: pu.Referrence_Number,
//       Total_Paid: pu.Total_Paid,
//       Balance_Due: pu.Balance_Due,
//       created_at: formatIndianDate(pu.created_at),
//       Total_Amount: pu.Total_Amount,
//       items: purchaseItems.filter((i) => i.Purchase_Id === pu.Purchase_Id),
//     }));

//     // 👉 SQL TOTALS
//     const [purchaseTotals] = await db.query(
//       `SELECT 
//           COALESCE(SUM(Total_Amount),0) AS totalPurchasesAmount,
//           COALESCE(SUM(Total_Paid),0) AS totalPurchasePaidAmount,
//           COALESCE(SUM(Balance_Due),0) AS totalPurchasesBalanceDue
//        FROM add_purchase
//       WHERE DATE(created_at) BETWEEN ? AND ?`,
//       [fullFromDate, fullToDate]
//     );

//     // ---------------------------------------------------
//     // FINAL RESPONSE
//     // ---------------------------------------------------

// console.log(salesTotals);
//     return res.status(200).json({
//       success: true,
//       fromDate: fromDate,
//       toDate: toDate,
//       data: {
//         sales: {
//           items: salesWithItems,
//           totalSalesAmount: salesTotals[0].totalSalesAmount,
//          totalSalesReceivedAmount: salesTotals[0].totalSalesReceivedAmount,
//          totalSalesBalanceDue: salesTotals[0].totalSalesBalanceDue
//         },
//         newSales: {
//           items: newSalesWithItems,
//         totalNewSalesAmount: newSalesTotals[0].totalNewSalesAmount,
//         totalNewSalesReceivedAmount: newSalesTotals[0].totalNewSalesReceivedAmount,
//         totalNewSalesBalanceDue: newSalesTotals[0].totalNewSalesBalanceDue
//         },
//         purchases: {
//           items: purchasesWithItems,
//           totalPurchasesAmount: purchaseTotals[0].totalPurchasesAmount,
//           totalPurchasePaidAmount: purchaseTotals[0].totalPurchasePaidAmount,
//           totalPurchasesBalanceDue: purchaseTotals[0].totalPurchasesBalanceDue
//         }
//       }
//     });

//   } catch (err) {
//     if (connection) connection.release();
//     console.error("❌ Error:", err);
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };

//DAILY SALES AND PURCHASES

//NEW SALES AND PURCHASES
const getSalesNewSalesPurchasesEachDay = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();

        const { date } = req.query;

    if (!date) {
      connection.release();
      return res.status(400).json({ message: "Date is required" });
    }

    // const type = reportType?.toLowerCase();
    // const fetchSales = !type || type === "sales";
    // const fetchPurchases = !type || type === "purchases";
    const fullDate = date; // YYYY-MM-DD
    const formatIndianDate = (date) =>
      new Date(date).toLocaleString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

    /* ---------------------------------------------------
       0️⃣ FINANCIAL YEAR + SALES + PURCHASES — ALL PARALLEL
    --------------------------------------------------- */
    const queries = [];

    // Always fetch FY
    queries.push(
      connection.query(
        `SELECT Financial_Year FROM financial_year WHERE Current_Financial_Year = 1 LIMIT 1`
      )
    );

    // Sales: single JOIN query — no second round trip for items
    
      queries.push(
        connection.query(
          `SELECT
             s.Sale_Id, s.Invoice_Number, s.Invoice_Date,
             s.State_Of_Supply, s.Payment_Type, s.Reference_Number,
             s.Total_Amount, s.Total_Received, s.Balance_Due,
             p.Party_Name, p.GSTIN,
             si.Sale_Items_Id, si.Item_Id, si.Quantity,
             si.Sale_Price, si.Discount_On_Sale_Price,
             si.Discount_Type_On_Sale_Price, si.Tax_Type,
             si.Tax_Amount, si.Amount AS Item_Amount,
             i.Item_Name, i.Item_HSN, i.Item_Category, i.Item_Unit
           FROM add_sale s
           LEFT JOIN add_party p ON s.Party_Id = p.Party_Id
           LEFT JOIN add_sale_items si ON s.Sale_Id = si.Sale_Id
           LEFT JOIN add_item i ON si.Item_Id = i.Item_Id
           WHERE  DATE(s.Invoice_Date) = ?
           ORDER BY s.Invoice_Date ASC, s.Sale_Id`,
          [ fullDate]
        )
      );

      // Sales totals
      queries.push(
        connection.query(
          `SELECT
             COALESCE(SUM(Total_Amount), 0)   AS totalSalesAmount,
             COALESCE(SUM(Total_Received), 0) AS totalSalesReceivedAmount,
             COALESCE(SUM(Balance_Due), 0)    AS totalSalesBalanceDue
           FROM add_sale
           WHERE  DATE(Invoice_Date) = ?`,
          [ fullDate]
        )
      );
    

    // Purchases: same single JOIN approach
    
      queries.push(
        connection.query(
          `SELECT
             pu.Purchase_Id, pu.Bill_Number, pu.Bill_Date,
             pu.State_Of_Supply, pu.Payment_Type, pu.Reference_Number,
             pu.Total_Amount, pu.Total_Paid, pu.Balance_Due,
             p.Party_Name, p.GSTIN,
             pi.Purchase_items_Id, pi.Item_Id, pi.Quantity,
             pi.Purchase_Price, pi.Discount_On_Purchase_Price,
             pi.Discount_Type_On_Purchase_Price, pi.Tax_Type,
             pi.Tax_Amount, pi.Amount AS Item_Amount,
             i.Item_Name, i.Item_HSN, i.Item_Category, i.Item_Unit
           FROM add_purchase pu
           LEFT JOIN add_party p ON pu.Party_Id = p.Party_Id
           LEFT JOIN add_purchase_items pi ON pu.Purchase_Id = pi.Purchase_Id
           LEFT JOIN add_item i ON pi.Item_Id = i.Item_Id
            WHERE DATE(pu.Bill_Date) = ?
           ORDER BY pu.Bill_Date ASC, pu.Purchase_Id`,
          [ fullDate]
        )
      );

      // Purchase totals
      queries.push(
        connection.query(
          `SELECT
             COALESCE(SUM(Total_Amount), 0) AS totalPurchasesAmount,
             COALESCE(SUM(Total_Paid), 0)   AS totalPurchasePaidAmount,
             COALESCE(SUM(Balance_Due), 0)  AS totalPurchasesBalanceDue
           FROM add_purchase
            WHERE DATE(Bill_Date) = ?`,
          [ fullDate]
        )
      );
    

    // 🔥 ALL queries fire at the same time
    const results = await Promise.all(queries);

    /* ---------------------------------------------------
       1️⃣ UNPACK RESULTS IN ORDER
    --------------------------------------------------- */
    let idx = 0;
    const [fyRows]          = results[idx++];
    const activeFY          = fyRows[0]?.Financial_Year || null;

    let salesWithItems      = [];
    let salesTotals         = { totalSalesAmount: 0, totalSalesReceivedAmount: 0, totalSalesBalanceDue: 0 };
    let purchasesWithItems  = [];
    let purchaseTotals      = { totalPurchasesAmount: 0, totalPurchasePaidAmount: 0, totalPurchasesBalanceDue: 0 };

    
      const [saleJoinRows]  = results[idx++];
      const [saleTotalRows] = results[idx++];
      salesTotals = saleTotalRows[0];

      // ── Group flat JOIN rows → parent + items map (one pass, O(n))
      const saleMap = new Map();
      for (const row of saleJoinRows) {
        if (!saleMap.has(row.Sale_Id)) {
          saleMap.set(row.Sale_Id, {
            sale_id:        row.Sale_Id,
            Party_Name:     row.Party_Name,
            GSTIN:          row.GSTIN,
            Invoice_Number: row.Invoice_Number,
            Invoice_Date:   formatIndianDate(row.Invoice_Date),
            State_Of_Supply:row.State_Of_Supply,
            Payment_Type:   row.Payment_Type,
            Reference_Number: row.Reference_Number,
            Total_Received: row.Total_Received,
            Balance_Due:    row.Balance_Due,
            Total_Amount:   row.Total_Amount,
            items: [],
          });
        }
        if (row.Sale_Items_Id) {
          saleMap.get(row.Sale_Id).items.push({
            Sale_Items_Id:              row.Sale_Items_Id,
            Item_Id:                    row.Item_Id,
            Item_Name:                  row.Item_Name,
            Item_HSN:                   row.Item_HSN,
            Item_Category:              row.Item_Category,
            Item_Unit:                  row.Item_Unit,
            Quantity:                   row.Quantity,
            Sale_Price:                 row.Sale_Price,
            Discount_On_Sale_Price:     row.Discount_On_Sale_Price,
            Discount_Type_On_Sale_Price:row.Discount_Type_On_Sale_Price,
            Tax_Type:                   row.Tax_Type,
            Tax_Amount:                 row.Tax_Amount,
            Amount:                     row.Item_Amount,
          });
        }
      }
      salesWithItems = [...saleMap.values()];
  

    
      const [purJoinRows]   = results[idx++];
      const [purTotalRows]  = results[idx++];
      purchaseTotals = purTotalRows[0];

      const purchaseMap = new Map();
      for (const row of purJoinRows) {
        if (!purchaseMap.has(row.Purchase_Id)) {
          purchaseMap.set(row.Purchase_Id, {
            purchase_id:    row.Purchase_Id,
            Party_Name:     row.Party_Name,
            GSTIN:          row.GSTIN,
            Bill_Number:    row.Bill_Number,
            Bill_Date:      formatIndianDate(row.Bill_Date),
            State_Of_Supply:row.State_Of_Supply,
            Payment_Type:   row.Payment_Type,
            Reference_Number: row.Reference_Number,
            Total_Paid:     row.Total_Paid,
            Balance_Due:    row.Balance_Due,
            Total_Amount:   row.Total_Amount,
            items: [],
          });
        }
        if (row.Purchase_items_Id) {
          purchaseMap.get(row.Purchase_Id).items.push({
            Purchase_items_Id:                  row.Purchase_items_Id,
            Item_Id:                            row.Item_Id,
            Item_Name:                          row.Item_Name,
            Item_HSN:                           row.Item_HSN,
            Item_Category:                      row.Item_Category,
            Item_Unit:                          row.Item_Unit,
            Quantity:                           row.Quantity,
            Purchase_Price:                     row.Purchase_Price,
            Discount_On_Purchase_Price:         row.Discount_On_Purchase_Price,
            Discount_Type_On_Purchase_Price:    row.Discount_Type_On_Purchase_Price,
            Tax_Type:                           row.Tax_Type,
            Tax_Amount:                         row.Tax_Amount,
            Amount:                             row.Item_Amount,
          });
        }
      }
      purchasesWithItems = [...purchaseMap.values()];
   

    /* ---------------------------------------------------
       FINAL RESPONSE
    --------------------------------------------------- */
    return res.status(200).json({
      success: true,
      date: fullDate,
      financialYear: activeFY,
      
      data: {
       
          sales: {
            items: salesWithItems,
            totalSalesAmount:         salesTotals.totalSalesAmount,
            totalSalesReceivedAmount: salesTotals.totalSalesReceivedAmount,
            totalSalesBalanceDue:     salesTotals.totalSalesBalanceDue,
          },
       
        
          purchases: {
            items: purchasesWithItems,
            totalPurchasesAmount:     purchaseTotals.totalPurchasesAmount,
            totalPurchasePaidAmount:  purchaseTotals.totalPurchasePaidAmount,
            totalPurchasesBalanceDue: purchaseTotals.totalPurchasesBalanceDue,
          },
        
      },
    });
  } catch (err) {
    console.error("❌ Error:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
}

//OLD OVERALL SALES AND PURCHASES
// const getSalesNewSalesPurchasesInDateRange = async (req, res, next) => {
//   let connection;
//   try {
//     connection = await db.getConnection();

//     const { fromDate, toDate,reportType } = req.query;

//     if (!fromDate || !toDate) {
//       connection.release();
//       return res.status(400).json({ message: "From and To Date is required" });
//     }
// const type = reportType?.toLowerCase();
// const fetchSales = !type || type === "sales";
// const fetchPurchases = !type || type === "purchases";const formatIndianDate = (date) =>
//       new Date(date).toLocaleString("en-IN", {
//         day: "2-digit",
//         month: "2-digit",
//         year: "numeric",
//       });

//     /* ---------------------------------------------------
//        0️⃣ FETCH ACTIVE FINANCIAL YEAR
//     --------------------------------------------------- */
//     const [fy] = await connection.query(
//       `SELECT Financial_Year 
//        FROM financial_year 
//        WHERE Current_Financial_Year = 1
//        LIMIT 1`
//     );

//     if (!fy.length) {
//       connection.release();
//       return res.status(400).json({
//         success: false,
//         message: "No active financial year found.",
//       });
//     }

//     const activeFY = fy[0].Financial_Year;

//     /* ---------------------------------------------------
//        1️⃣ SALES (DATA + ITEMS)
//     --------------------------------------------------- */
//        let saleItems = [];
//     let salesWithItems = [];
// let salesTotals = [{
//   totalSalesAmount: 0,
//   totalSalesReceivedAmount: 0,
//   totalSalesBalanceDue: 0
// }];
//     if (fetchSales) {
//     // const [sales] = await connection.query(
//     //   `SELECT s.*, p.Party_Name, p.GSTIN
//     //    FROM add_sale s
//     //    LEFT JOIN add_party p ON s.Party_Id = p.Party_Id
//     //    WHERE s.Financial_Year = ?
//     //    AND DATE(s.Invoice_Date) BETWEEN ? AND ?
//     //    ORDER BY s.Invoice_Date ASC`,
//     //   [activeFY, fromDate, toDate]
//     // );

//     const [sales]= await connection.query(
//       `SELECT s.*, p.Party_Name, p.GSTIN
// FROM add_sale s
// LEFT JOIN add_party p ON s.Party_Id = p.Party_Id
// WHERE s.Invoice_Date BETWEEN ? AND ?
// ORDER BY s.Invoice_Date ASC`,
//       [fromDate, toDate]
//     )
//     const saleIds = sales.map((s) => s.Sale_Id);

 
//     if (saleIds.length > 0) {
//       const [items] = await connection.query(
//         `SELECT si.*, i.Item_Name, i.Item_HSN, i.Item_Category, i.Item_Unit
//          FROM add_sale_items si
//          LEFT JOIN add_item i ON si.Item_Id = i.Item_Id
//          WHERE si.Sale_Id IN (?)`,
//         [saleIds]
//       );
//       saleItems = items;
//     }
// const saleItemsMap = new Map();

// saleItems.forEach(item => {
//   if(!saleItemsMap.has(item.Sale_Id)){
//     saleItemsMap.set(item.Sale_Id, []);
//   }
//   saleItemsMap.get(item.Sale_Id).push(item);
// });
//     salesWithItems = sales.map((s) => ({
//       sale_id: s.Sale_Id,
//       Party_Name: s.Party_Name,
//       GSTIN: s.GSTIN,
//       Invoice_Number: s.Invoice_Number,
//       Invoice_Date: formatIndianDate(s.Invoice_Date),
//       State_Of_Supply: s.State_Of_Supply,
//       Payment_Type: s.Payment_Type,
//       Referrence_Number: s.Referrence_Number,
//       Total_Received: s.Total_Received,
//       Balance_Due: s.Balance_Due,
//       created_at: formatIndianDate(s.created_at),
//       Total_Amount: s.Total_Amount,
//       items: saleItemsMap.get(s.Sale_Id) || []
//       // items: saleItems.filter((i) => i.Sale_Id === s.Sale_Id),
//     }));

//     const [salesTotalsRows] = await connection.query(
//       `   SELECT 
//      COALESCE(SUM(Total_Amount),0) AS totalSalesAmount,
//      COALESCE(SUM(Total_Received),0) AS totalSalesReceivedAmount,
//     COALESCE(SUM(Balance_Due),0) AS totalSalesBalanceDue
//   FROM add_sale
//    WHERE 
//    DATE(Invoice_Date) BETWEEN ? AND ?
// `,
//       [fromDate, toDate]

//     )
// // const [salesTotalsRows] = await connection.query(
// //   `
// //   SELECT 
// //     COALESCE(SUM(Total_Amount),0) AS totalSalesAmount,
// //     COALESCE(SUM(Total_Received),0) AS totalSalesReceivedAmount,
// //     COALESCE(SUM(Balance_Due),0) AS totalSalesBalanceDue
// //   FROM add_sale
// //   WHERE Financial_Year = ?
// //     AND DATE(Invoice_Date) BETWEEN ? AND ?
// //   `,
// //   [activeFY, fromDate, toDate]
// // );

// salesTotals = salesTotalsRows[0];
//   // salesTotals = await connection.query(
//   //     `SELECT 
//   //         COALESCE(SUM(Total_Amount),0) AS totalSalesAmount,
//   //         COALESCE(SUM(Total_Received),0) AS totalSalesReceivedAmount,
//   //         COALESCE(SUM(Balance_Due),0) AS totalSalesBalanceDue
//   //      FROM add_sale
//   //      WHERE Financial_Year = ?
//   //      AND DATE(Invoice_Date) BETWEEN ? AND ?`,
//   //     [activeFY, fromDate, toDate]
//   //   );
//   }

//     /* ---------------------------------------------------
//        2️⃣ PURCHASES (DATA + ITEMS)
//     --------------------------------------------------- */
//      let purchaseItems = [];
//     let purchasesWithItems = [];
//     let purchaseTotals = [{
//   totalPurchasesAmount: 0,
//   totalPurchasePaidAmount: 0,
//   totalPurchasesBalanceDue: 0
// }]
//     if (fetchPurchases) {

//       const [purchases] = await connection.query(
//         `  SELECT pu.*, p.Party_Name, p.GSTIN
//        FROM add_purchase pu
//        LEFT JOIN add_party p ON pu.Party_Id = p.Party_Id
//        WHERE 
//         DATE(pu.Bill_Date) BETWEEN ? AND ?
//        ORDER BY pu.Bill_Date ASC`,
//       [fromDate, toDate]
//       )
//     // const [purchases] = await connection.query(
//     //   `SELECT pu.*, p.Party_Name, p.GSTIN
//     //    FROM add_purchase pu
//     //    LEFT JOIN add_party p ON pu.Party_Id = p.Party_Id
//     //    WHERE pu.Financial_Year = ?
//     //    AND DATE(pu.Bill_Date) BETWEEN ? AND ?
//     //    ORDER BY pu.Bill_Date ASC`,
//     //   [activeFY, fromDate, toDate]
//     // );

//     const purchaseIds = purchases.map((p) => p.Purchase_Id);

   
//     if (purchaseIds.length > 0) {
//       const [items] = await connection.query(
//         `SELECT pu.*, i.Item_Name, i.Item_HSN, i.Item_Category, i.Item_Unit
//          FROM add_purchase_items pu
//          LEFT JOIN add_item i ON pu.Item_Id = i.Item_Id
//          WHERE pu.Purchase_Id IN (?)`,
//         [purchaseIds]
//       );
//       purchaseItems = items;
//     }
// const purchaseItemsMap = new Map();

// purchaseItems.forEach(item => {
//   if(!purchaseItemsMap.has(item.Purchase_Id)){
//     purchaseItemsMap.set(item.Purchase_Id, []);
//   }
//   purchaseItemsMap.get(item.Purchase_Id).push(item);
// });
//      purchasesWithItems = purchases.map((pu) => ({
//       purchase_id: pu.Purchase_Id,
//       Party_Name: pu.Party_Name,
//       GSTIN: pu.GSTIN,
//       Bill_Number: pu.Bill_Number,
//       Bill_Date: formatIndianDate(pu.Bill_Date),
//       State_Of_Supply: pu.State_Of_Supply,
//       Payment_Type: pu.Payment_Type,
//       Referrence_Number: pu.Referrence_Number,
//       Total_Paid: pu.Total_Paid,
//       Balance_Due: pu.Balance_Due,
//       created_at: formatIndianDate(pu.created_at),
//       Total_Amount: pu.Total_Amount,
//       items: purchaseItemsMap.get(pu.Purchase_Id) || []
//       // items: purchaseItems.filter((i) => i.Purchase_Id === pu.Purchase_Id),
//     }));

//     const [purchaseTotalsRows] = await connection.query(
//       `  SELECT 
//  COALESCE(SUM(Total_Amount),0) AS totalPurchasesAmount,
//     COALESCE(SUM(Total_Paid),0) AS totalPurchasePaidAmount,
//     COALESCE(SUM(Balance_Due),0) AS totalPurchasesBalanceDue
//   FROM add_purchase
//    WHERE 
//      DATE(Bill_Date) BETWEEN ? AND ?
//    `,
//    [ fromDate, toDate]
//     )
// // const [purchaseTotalsRows] = await connection.query(
// //    `
// //    SELECT 
// //      COALESCE(SUM(Total_Amount),0) AS totalPurchasesAmount,
// //     COALESCE(SUM(Total_Paid),0) AS totalPurchasePaidAmount,
// //     COALESCE(SUM(Balance_Due),0) AS totalPurchasesBalanceDue
// //   FROM add_purchase
// //    WHERE Financial_Year = ?
// //      AND DATE(Bill_Date) BETWEEN ? AND ?
// //    `,
// //    [activeFY, fromDate, toDate]
// //  );

// purchaseTotals = purchaseTotalsRows[0]; // 🔥 THIS LINE FIXES EVERYTHING
//     // purchaseTotals = await connection.query(
//     //   `SELECT 
//     //       COALESCE(SUM(Total_Amount),0) AS totalPurchasesAmount,
//     //       COALESCE(SUM(Total_Paid),0) AS totalPurchasePaidAmount,
//     //       COALESCE(SUM(Balance_Due),0) AS totalPurchasesBalanceDue
//     //    FROM add_purchase
//     //    WHERE Financial_Year = ?
//     //    AND DATE(Bill_Date) BETWEEN ? AND ?`,
//     //   [activeFY, fromDate, toDate]
//     // );
//   }
//     /* ---------------------------------------------------
//        FINAL RESPONSE
//     --------------------------------------------------- */
//     return res.status(200).json({
//       success: true,
//       fromDate,
//       toDate,
//       financialYear: activeFY,
//       reportType: type || "all",
//         data: {
//     ...(fetchSales && {
//       sales: {
//         items: salesWithItems,
//         totalSalesAmount: salesTotals.totalSalesAmount,
//         totalSalesReceivedAmount: salesTotals.totalSalesReceivedAmount,
//         totalSalesBalanceDue: salesTotals.totalSalesBalanceDue,
//       },
//     }),
//     ...(fetchPurchases && {
//       purchases: {
//         items: purchasesWithItems,
//         totalPurchasesAmount: purchaseTotals.totalPurchasesAmount,
//         totalPurchasePaidAmount: purchaseTotals.totalPurchasePaidAmount,
//         totalPurchasesBalanceDue: purchaseTotals.totalPurchasesBalanceDue,
//       },
//     }),
//   },
//       // data: {
//       //   sales: {
//       //     items: salesWithItems,
//       //     totalSalesAmount: salesTotals[0].totalSalesAmount,
//       //     totalSalesReceivedAmount: salesTotals[0].totalSalesReceivedAmount,
//       //     totalSalesBalanceDue: salesTotals[0].totalSalesBalanceDue,
//       //   },

//       //   purchases: {
//       //     items: purchasesWithItems,
//       //     totalPurchasesAmount: purchaseTotals[0].totalPurchasesAmount,
//       //     totalPurchasePaidAmount: purchaseTotals[0].totalPurchasePaidAmount,
//       //     totalPurchasesBalanceDue: purchaseTotals[0].totalPurchasesBalanceDue,
//       //   },
//       // },
//     });
//   } catch (err) {
//     if (connection) connection.release();
//     console.error("❌ Error:", err);
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };

//OLD SALES AND PURCHASES
// const getSalesNewSalesPurchasesEachDay = async (req, res, next) => {
//   let connection;
//   try {
//     connection = await db.getConnection();

//     const { date } = req.query;

//     if (!date) {
//       connection.release();
//       return res.status(400).json({ message: "Date is required" });
//     }

//     const fullDate = date; // YYYY-MM-DD

//     // Format function
//     const formatIndianDate = (date) =>
//       new Date(date).toLocaleString("en-IN", {
//         day: "2-digit",
//         month: "2-digit",
//         year: "numeric",
//       });

//     // ---------------------------------------------------
//     // 0️⃣ FETCH ACTIVE FINANCIAL YEAR
//     // ---------------------------------------------------
//     const [fy] = await connection.query(
//       `SELECT Financial_Year 
//        FROM financial_year 
//        WHERE Current_Financial_Year = 1
//        LIMIT 1`
//     );

//     if (!fy.length) {
//       connection.release();
//       return res.status(400).json({
//         success: false,
//         message: "No active financial year found.",
//       });
//     }

//     const activeFY = fy[0].Financial_Year; // Example: "2024-2025"

//     // ---------------------------------------------------
//     // 1️⃣ SALES (DATA + ITEMS)
//     // ---------------------------------------------------
//     // const [sales] = await connection.query(
//     //   `SELECT s.*, p.Party_Name, p.GSTIN
//     //    FROM add_sale s
//     //    LEFT JOIN add_party p ON s.Party_Id = p.Party_Id
//     //    WHERE s.Financial_Year = ?
//     //    AND DATE(s.Invoice_Date) = ?
//     //    ORDER BY s.Invoice_Date ASC`,
//     //   [activeFY, fullDate]
//     // );

//       const [sales] = await connection.query(
//       `SELECT s.*, p.Party_Name, p.GSTIN
//        FROM add_sale s
//        LEFT JOIN add_party p ON s.Party_Id = p.Party_Id
//        WHERE  DATE(s.Invoice_Date) = ?
//        ORDER BY s.Invoice_Date ASC`,
//       [ fullDate]
//     );

//     const saleIds = sales.map((s) => s.Sale_Id);

//     let saleItems = [];
//     if (saleIds.length > 0) {
//       const [items] = await connection.query(
//         `SELECT si.*, i.Item_Name, i.Item_HSN, i.Item_Category, i.Item_Unit
//          FROM add_sale_items si
//          LEFT JOIN add_item i ON si.Item_Id = i.Item_Id
//          WHERE si.Sale_Id IN (?)`,
//         [saleIds]
//       );
//       saleItems = items;
//     }
// const saleItemsMap = new Map();

// saleItems.forEach(item => {
//   if(!saleItemsMap.has(item.Sale_Id)){
//     saleItemsMap.set(item.Sale_Id, []);
//   }
//   saleItemsMap.get(item.Sale_Id).push(item);
// });
//     const salesWithItems = sales.map((sale) => ({
//       sale_id: sale.Sale_Id,
//       Party_Name: sale.Party_Name,
//       GSTIN: sale.GSTIN,
//       Invoice_Number: sale.Invoice_Number,
//       Invoice_Date: formatIndianDate(sale.Invoice_Date),
//       State_Of_Supply: sale.State_Of_Supply,
//       Payment_Type: sale.Payment_Type,
//       Referrence_Number: sale.Referrence_Number,
//       Total_Received: sale.Total_Received,
//       Balance_Due: sale.Balance_Due,
//       created_at: formatIndianDate(sale.created_at),
//       Total_Amount: sale.Total_Amount,
//       // items: saleItems.filter((i) => i.Sale_Id === sale.Sale_Id),
//       items: saleItemsMap.get(sale.Sale_Id),
//     }));

//     // SALES TOTALS
//     // const [salesTotals] = await connection.query(
//     //   `SELECT 
//     //       COALESCE(SUM(Total_Amount),0) AS totalSalesAmount,
//     //       COALESCE(SUM(Total_Received),0) AS totalSalesReceivedAmount,
//     //       COALESCE(SUM(Balance_Due),0) AS totalSalesBalanceDue
//     //    FROM add_sale
//     //    WHERE Financial_Year = ?
//     //    AND DATE(Invoice_Date) = ?`,
//     //   [activeFY, fullDate]
//     // );
//     const [salesTotals] = await connection.query(
//       `SELECT 
//           COALESCE(SUM(Total_Amount),0) AS totalSalesAmount,
//           COALESCE(SUM(Total_Received),0) AS totalSalesReceivedAmount,
//           COALESCE(SUM(Balance_Due),0) AS totalSalesBalanceDue
//        FROM add_sale
//        WHERE  DATE(Invoice_Date) = ?`,
//       [fullDate]
//     );
//     // ---------------------------------------------------
//     // 2️⃣ PURCHASES (DATA + ITEMS)
//     // ---------------------------------------------------
//     // const [purchases] = await connection.query(
//     //   `SELECT pu.*, p.Party_Name, p.GSTIN
//     //    FROM add_purchase pu
//     //    LEFT JOIN add_party p ON pu.Party_Id = p.Party_Id
//     //    WHERE pu.Financial_Year = ?
//     //    AND DATE(pu.Bill_Date) = ?
//     //    ORDER BY pu.Bill_Date ASC`,
//     //   [activeFY, fullDate]
//     // );
//         const [purchases] = await connection.query(
//       `SELECT pu.*, p.Party_Name, p.GSTIN
//        FROM add_purchase pu
//        LEFT JOIN add_party p ON pu.Party_Id = p.Party_Id
//        WHERE DATE(pu.Bill_Date) = ?
//        ORDER BY pu.Bill_Date ASC`,
//       [fullDate]
//     );

//     const purchaseIds = purchases.map((pu) => pu.Purchase_Id);

//     let purchaseItems = [];
//     if (purchaseIds.length > 0) {
//       const [items] = await connection.query(
//         `SELECT pu.*, i.Item_Name, i.Item_HSN, i.Item_Category, i.Item_Unit
//          FROM add_purchase_items pu
//          LEFT JOIN add_item i ON pu.Item_Id = i.Item_Id
//          WHERE pu.Purchase_Id IN (?)`,
//         [purchaseIds]
//       );
//       purchaseItems = items;
//     }
// const purchaseItemsMap = new Map();

// purchaseItems.forEach(item => {
//   if(!purchaseItemsMap.has(item.Purchase_Id)){
//     purchaseItemsMap.set(item.Purchase_Id, []);
//   }
//   purchaseItemsMap.get(item.Purchase_Id).push(item);
// });
//     const purchasesWithItems = purchases.map((pu) => ({
//       purchase_id: pu.Purchase_Id,
//       Party_Name: pu.Party_Name,
//       GSTIN: pu.GSTIN,
//       Bill_Number: pu.Bill_Number,
//       Bill_Date: formatIndianDate(pu.Bill_Date),
//       State_Of_Supply: pu.State_Of_Supply,
//       Payment_Type: pu.Payment_Type,
//       Referrence_Number: pu.Referrence_Number,
//       Total_Paid: pu.Total_Paid,
//       Balance_Due: pu.Balance_Due,
//       created_at: formatIndianDate(pu.created_at),
//       Total_Amount: pu.Total_Amount,
//       // items: purchaseItems.filter((i) => i.Purchase_Id === pu.Purchase_Id),
//       items: purchaseItemsMap.get(pu.Purchase_Id),
//     }));

//     // PURCHASE TOTALS
//     // const [purchaseTotals] = await connection.query(
//     //   `SELECT 
//     //       COALESCE(SUM(Total_Amount),0) AS totalPurchasesAmount,
//     //       COALESCE(SUM(Total_Paid),0) AS totalPurchasePaidAmount,
//     //       COALESCE(SUM(Balance_Due),0) AS totalPurchasesBalanceDue
//     //    FROM add_purchase
//     //    WHERE Financial_Year = ?
//     //    AND DATE(Bill_Date) = ?`,
//     //   [activeFY, fullDate]
//     // );
//   const [purchaseTotals] = await connection.query(
//       `SELECT 
//           COALESCE(SUM(Total_Amount),0) AS totalPurchasesAmount,
//           COALESCE(SUM(Total_Paid),0) AS totalPurchasePaidAmount,
//           COALESCE(SUM(Balance_Due),0) AS totalPurchasesBalanceDue
//        FROM add_purchase
//        WHERE  DATE(Bill_Date) = ?`,
//       [fullDate]
//     );
//     // ---------------------------------------------------
//     // FINAL RESPONSE
//     // ---------------------------------------------------

//     return res.status(200).json({
//       success: true,
//       date: fullDate,
//       financialYear: activeFY,
//       data: {
//         sales: {
//           items: salesWithItems,
//           totalSalesAmount: salesTotals[0].totalSalesAmount,
//           totalSalesReceivedAmount: salesTotals[0].totalSalesReceivedAmount,
//           totalSalesBalanceDue: salesTotals[0].totalSalesBalanceDue,
//         },

//         purchases: {
//           items: purchasesWithItems,
//           totalPurchasesAmount: purchaseTotals[0].totalPurchasesAmount,
//           totalPurchasePaidAmount: purchaseTotals[0].totalPurchasePaidAmount,
//           totalPurchasesBalanceDue: purchaseTotals[0].totalPurchasesBalanceDue,
//         },
//       },
//     });
//   } catch (err) {
//     if (connection) connection.release();
//     console.error("❌ Error:", err);
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };
//NEW OVERALL SALES AND PURCHASES
const getSalesNewSalesPurchasesInDateRange = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();

    const { fromDate, toDate, reportType } = req.query;

    if (!fromDate || !toDate) {
      connection.release();
      return res.status(400).json({ message: "From and To Date is required" });
    }

    const type = reportType?.toLowerCase();
    const fetchSales = !type || type === "sales";
    const fetchPurchases = !type || type === "purchases";

    const formatIndianDate = (date) =>
      new Date(date).toLocaleString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

    /* ---------------------------------------------------
       0️⃣ FINANCIAL YEAR + SALES + PURCHASES — ALL PARALLEL
    --------------------------------------------------- */
    const queries = [];

    // Always fetch FY
    queries.push(
      connection.query(
        `SELECT Financial_Year FROM financial_year WHERE Current_Financial_Year = 1 LIMIT 1`
      )
    );

    // Sales: single JOIN query — no second round trip for items
    if (fetchSales) {
      queries.push(
        connection.query(
          `SELECT
             s.Sale_Id, s.Invoice_Number, s.Invoice_Date,
             s.State_Of_Supply, s.Payment_Type, s.Reference_Number,
             s.Total_Amount, s.Total_Received, s.Balance_Due,
             p.Party_Name, p.GSTIN,
             si.Sale_Items_Id, si.Item_Id, si.Quantity,
             si.Sale_Price, si.Discount_On_Sale_Price,
             si.Discount_Type_On_Sale_Price, si.Tax_Type,
             si.Tax_Amount, si.Amount AS Item_Amount,
             i.Item_Name, i.Item_HSN, i.Item_Category, i.Item_Unit
           FROM add_sale s
           LEFT JOIN add_party p ON s.Party_Id = p.Party_Id
           LEFT JOIN add_sale_items si ON s.Sale_Id = si.Sale_Id
           LEFT JOIN add_item i ON si.Item_Id = i.Item_Id
           WHERE s.Invoice_Date BETWEEN ? AND ?
           ORDER BY s.Invoice_Date ASC, s.Sale_Id`,
          [fromDate, toDate]
        )
      );

      // Sales totals
      queries.push(
        connection.query(
          `SELECT
             COALESCE(SUM(Total_Amount), 0)   AS totalSalesAmount,
             COALESCE(SUM(Total_Received), 0) AS totalSalesReceivedAmount,
             COALESCE(SUM(Balance_Due), 0)    AS totalSalesBalanceDue
           FROM add_sale
           WHERE Invoice_Date BETWEEN ? AND ?`,
          [fromDate, toDate]
        )
      );
    }

    // Purchases: same single JOIN approach
    if (fetchPurchases) {
      queries.push(
        connection.query(
          `SELECT
             pu.Purchase_Id, pu.Bill_Number, pu.Bill_Date,
             pu.State_Of_Supply, pu.Payment_Type, pu.Reference_Number,
             pu.Total_Amount, pu.Total_Paid, pu.Balance_Due,
             p.Party_Name, p.GSTIN,
             pi.Purchase_items_Id, pi.Item_Id, pi.Quantity,
             pi.Purchase_Price, pi.Discount_On_Purchase_Price,
             pi.Discount_Type_On_Purchase_Price, pi.Tax_Type,
             pi.Tax_Amount, pi.Amount AS Item_Amount,
             i.Item_Name, i.Item_HSN, i.Item_Category, i.Item_Unit
           FROM add_purchase pu
           LEFT JOIN add_party p ON pu.Party_Id = p.Party_Id
           LEFT JOIN add_purchase_items pi ON pu.Purchase_Id = pi.Purchase_Id
           LEFT JOIN add_item i ON pi.Item_Id = i.Item_Id
           WHERE pu.Bill_Date BETWEEN ? AND ?
           ORDER BY pu.Bill_Date ASC, pu.Purchase_Id`,
          [fromDate, toDate]
        )
      );

      // Purchase totals
      queries.push(
        connection.query(
          `SELECT
             COALESCE(SUM(Total_Amount), 0) AS totalPurchasesAmount,
             COALESCE(SUM(Total_Paid), 0)   AS totalPurchasePaidAmount,
             COALESCE(SUM(Balance_Due), 0)  AS totalPurchasesBalanceDue
           FROM add_purchase
           WHERE Bill_Date BETWEEN ? AND ?`,
          [fromDate, toDate]
        )
      );
    }

    // 🔥 ALL queries fire at the same time
    const results = await Promise.all(queries);

    /* ---------------------------------------------------
       1️⃣ UNPACK RESULTS IN ORDER
    --------------------------------------------------- */
    let idx = 0;
    const [fyRows]          = results[idx++];
    const activeFY          = fyRows[0]?.Financial_Year || null;

    let salesWithItems      = [];
    let salesTotals         = { totalSalesAmount: 0, totalSalesReceivedAmount: 0, totalSalesBalanceDue: 0 };
    let purchasesWithItems  = [];
    let purchaseTotals      = { totalPurchasesAmount: 0, totalPurchasePaidAmount: 0, totalPurchasesBalanceDue: 0 };

    if (fetchSales) {
      const [saleJoinRows]  = results[idx++];
      const [saleTotalRows] = results[idx++];
      salesTotals = saleTotalRows[0];

      // ── Group flat JOIN rows → parent + items map (one pass, O(n))
      const saleMap = new Map();
      for (const row of saleJoinRows) {
        if (!saleMap.has(row.Sale_Id)) {
          saleMap.set(row.Sale_Id, {
            sale_id:        row.Sale_Id,
            Party_Name:     row.Party_Name,
            GSTIN:          row.GSTIN,
            Invoice_Number: row.Invoice_Number,
            Invoice_Date:   formatIndianDate(row.Invoice_Date),
            State_Of_Supply:row.State_Of_Supply,
            Payment_Type:   row.Payment_Type,
            Reference_Number: row.Reference_Number,
            Total_Received: row.Total_Received,
            Balance_Due:    row.Balance_Due,
            Total_Amount:   row.Total_Amount,
            items: [],
          });
        }
        if (row.Sale_Items_Id) {
          saleMap.get(row.Sale_Id).items.push({
            Sale_Items_Id:              row.Sale_Items_Id,
            Item_Id:                    row.Item_Id,
            Item_Name:                  row.Item_Name,
            Item_HSN:                   row.Item_HSN,
            Item_Category:              row.Item_Category,
            Item_Unit:                  row.Item_Unit,
            Quantity:                   row.Quantity,
            Sale_Price:                 row.Sale_Price,
            Discount_On_Sale_Price:     row.Discount_On_Sale_Price,
            Discount_Type_On_Sale_Price:row.Discount_Type_On_Sale_Price,
            Tax_Type:                   row.Tax_Type,
            Tax_Amount:                 row.Tax_Amount,
            Amount:                     row.Item_Amount,
          });
        }
      }
      salesWithItems = [...saleMap.values()];
    }

    if (fetchPurchases) {
      const [purJoinRows]   = results[idx++];
      const [purTotalRows]  = results[idx++];
      purchaseTotals = purTotalRows[0];

      const purchaseMap = new Map();
      for (const row of purJoinRows) {
        if (!purchaseMap.has(row.Purchase_Id)) {
          purchaseMap.set(row.Purchase_Id, {
            purchase_id:    row.Purchase_Id,
            Party_Name:     row.Party_Name,
            GSTIN:          row.GSTIN,
            Bill_Number:    row.Bill_Number,
            Bill_Date:      formatIndianDate(row.Bill_Date),
            State_Of_Supply:row.State_Of_Supply,
            Payment_Type:   row.Payment_Type,
            Reference_Number: row.Reference_Number,
            Total_Paid:     row.Total_Paid,
            Balance_Due:    row.Balance_Due,
            Total_Amount:   row.Total_Amount,
            items: [],
          });
        }
        if (row.Purchase_items_Id) {
          purchaseMap.get(row.Purchase_Id).items.push({
            Purchase_items_Id:                  row.Purchase_items_Id,
            Item_Id:                            row.Item_Id,
            Item_Name:                          row.Item_Name,
            Item_HSN:                           row.Item_HSN,
            Item_Category:                      row.Item_Category,
            Item_Unit:                          row.Item_Unit,
            Quantity:                           row.Quantity,
            Purchase_Price:                     row.Purchase_Price,
            Discount_On_Purchase_Price:         row.Discount_On_Purchase_Price,
            Discount_Type_On_Purchase_Price:    row.Discount_Type_On_Purchase_Price,
            Tax_Type:                           row.Tax_Type,
            Tax_Amount:                         row.Tax_Amount,
            Amount:                             row.Item_Amount,
          });
        }
      }
      purchasesWithItems = [...purchaseMap.values()];
    }

    /* ---------------------------------------------------
       FINAL RESPONSE
    --------------------------------------------------- */
    return res.status(200).json({
      success: true,
      fromDate,
      toDate,
      financialYear: activeFY,
      reportType: type || "all",
      data: {
        ...(fetchSales && {
          sales: {
            items: salesWithItems,
            totalSalesAmount:         salesTotals.totalSalesAmount,
            totalSalesReceivedAmount: salesTotals.totalSalesReceivedAmount,
            totalSalesBalanceDue:     salesTotals.totalSalesBalanceDue,
          },
        }),
        ...(fetchPurchases && {
          purchases: {
            items: purchasesWithItems,
            totalPurchasesAmount:     purchaseTotals.totalPurchasesAmount,
            totalPurchasePaidAmount:  purchaseTotals.totalPurchasePaidAmount,
            totalPurchasesBalanceDue: purchaseTotals.totalPurchasesBalanceDue,
          },
        }),
      },
    });
  } catch (err) {
    console.error("❌ Error:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

//CHARTS
const getSalesAndPurchasesDailyYearMonthWise = async (req, res, next) => {
  let connection;

  try {
    connection = await db.getConnection();

    const MONTH_MAP = {
      january: 1, jan: 1,
      february: 2, feb: 2,
      march: 3, mar: 3,
      april: 4, apr: 4,
      may: 5,
      june: 6, jun: 6,
      july: 7, jul: 7,
      august: 8, aug: 8,
      september: 9, sep: 9, sept: 9,
      october: 10, oct: 10,
      november: 11, nov: 11,
      december: 12, dec: 12,
    };

    const year = Number(req.query.year) || new Date().getFullYear();

    const monthInput = req.query.month;
    const month =
      MONTH_MAP[monthInput?.toLowerCase()] ||
      new Date().getMonth() + 1;

    // 🟢 SALES
    const [sales] = await connection.query(
      `
      SELECT 
        DAY(Invoice_Date) AS day,
        SUM(Total_Amount) AS total_sales
      FROM add_sale
      WHERE YEAR(Invoice_Date) = ?
      AND MONTH(Invoice_Date) = ?
      GROUP BY DAY(Invoice_Date)
      `,
      [year, month]
    );

    // 🔴 PURCHASES
    const [purchases] = await connection.query(
      `
      SELECT 
        DAY(Bill_Date) AS day,
        SUM(Total_Amount) AS total_purchases
      FROM add_purchase
      WHERE YEAR(Bill_Date) = ?
      AND MONTH(Bill_Date) = ?
      GROUP BY DAY(Bill_Date)
      `,
      [year, month]
    );

    // 🔹 Merge using Map
    const dayMap = new Map();

    for (const s of sales) {
      dayMap.set(s.day, {
        day: s.day,
        total_sales: Number(s.total_sales) || 0,
        total_purchases: 0,
      });
    }

    for (const p of purchases) {
      if (dayMap.has(p.day)) {
        dayMap.get(p.day).total_purchases =
          Number(p.total_purchases) || 0;
      } else {
        dayMap.set(p.day, {
          day: p.day,
          total_sales: 0,
          total_purchases: Number(p.total_purchases) || 0,
        });
      }
    }

    // 🔹 Convert Map → Array and sort by day
    const combinedData = Array.from(dayMap.values())
      .sort((a, b) => a.day - b.day)
      .map((d) => ({
        date: String(d.day).padStart(2, "0"),
        sales: d.total_sales,
        purchases: d.total_purchases,
      }));

    return res.status(200).json({
      year,
      month,
      data: combinedData,
    });

  } catch (err) {
    console.error("❌ Error getting sales & purchases analytics:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};
//CHARTS
const getSalesAndPurchasesWeeklyYearMonthWise = async (req, res, next) => {
  let connection;

  try {
    connection = await db.getConnection();

    const MONTH_MAP = {
      january: 1, jan: 1,
      february: 2, feb: 2,
      march: 3, mar: 3,
      april: 4, apr: 4,
      may: 5,
      june: 6, jun: 6,
      july: 7, jul: 7,
      august: 8, aug: 8,
      september: 9, sep: 9, sept: 9,
      october: 10, oct: 10,
      november: 11, nov: 11,
      december: 12, dec: 12,
    };

    const year = Number(req.query.year) || new Date().getFullYear();

    const month =
      MONTH_MAP[req.query.month?.toLowerCase()] ||
      new Date().getMonth() + 1;

    // SALES
    const [sales] = await connection.query(
      `
      SELECT 
        FLOOR((DAY(Invoice_Date)-1)/7)+1 AS week_no,
        SUM(Total_Amount) AS total_sales
      FROM add_sale
      WHERE YEAR(Invoice_Date)=?
      AND MONTH(Invoice_Date)=?
      GROUP BY week_no
      ORDER BY week_no
      `,
      [year, month]
    );

    // PURCHASES
    const [purchases] = await connection.query(
      `
      SELECT 
        FLOOR((DAY(Bill_Date)-1)/7)+1 AS week_no,
        SUM(Total_Amount) AS total_purchases
      FROM add_purchase
      WHERE YEAR(Bill_Date)=?
      AND MONTH(Bill_Date)=?
      GROUP BY week_no
      ORDER BY week_no
      `,
      [year, month]
    );

    const weekMap = new Map();

    // merge sales
    for (const s of sales) {
      weekMap.set(s.week_no, {
        week: `Week ${s.week_no}`,
        sales: Number(s.total_sales) || 0,
        purchases: 0,
      });
    }

    // merge purchases
    for (const p of purchases) {
      if (weekMap.has(p.week_no)) {
        weekMap.get(p.week_no).purchases =
          Number(p.total_purchases) || 0;
      } else {
        weekMap.set(p.week_no, {
          week: `Week ${p.week_no}`,
          sales: 0,
          purchases: Number(p.total_purchases) || 0,
        });
      }
    }

    const combinedData = Array.from(weekMap.values()).sort(
      (a, b) => a.week.localeCompare(b.week)
    );

    return res.status(200).json({
      year,
      month,
      data: combinedData,
    });

  } catch (err) {
    console.error("❌ Error getting weekly sales and purchases:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};
//CHARTS
const getSalesAndPurchasesMonthWise = async (req, res, next) => {
  let connection;
  try {
    const year = parseInt(req.query.year)|| new Date().getFullYear();
    console.log("📅 Year received:", year);
  connection = await db.getConnection();
    // 🟦 Fetch monthly total sales
    // const [sales] = await db.query(
    //   `
    //   SELECT 
    //     MONTH(created_at) AS month, 
    //     SUM(Total_Amount) AS total_sales
    //   FROM add_sale
    //   WHERE YEAR(created_at) = ?
    //   GROUP BY MONTH(created_at)
    //   ORDER BY month ASC
    //   `,
    //   [year]
    // );
        const [sales] = await db.query(
      `
      SELECT 
        MONTH(Invoice_Date) AS month, 
        SUM(Total_Amount) AS total_sales
      FROM add_sale
      WHERE YEAR(Invoice_Date) = ?
      GROUP BY MONTH(Invoice_Date)
      ORDER BY month ASC
      `,
      [year]
    );

    // 🟪 Fetch monthly total purchases
    // const [purchases] = await db.query(
    //   `
    //   SELECT 
    //     MONTH(created_at) AS month, 
    //     SUM(Total_Amount) AS total_purchases
    //   FROM add_purchase
    //   WHERE YEAR(created_at) = ?
    //   GROUP BY MONTH(created_at)
    //   ORDER BY month ASC
    //   `,
    //   [year]
    // );
   const [purchases] = await db.query(
      `
      SELECT 
        MONTH(Bill_Date) AS month, 
        SUM(Total_Amount) AS total_purchases
      FROM add_purchase
      WHERE YEAR(Bill_Date) = ?
      GROUP BY MONTH(Bill_Date)
      ORDER BY month ASC
      `,
      [year]
    );
    // 🧠 Merge results into a map
    const monthMap = new Map();

    for (const s of sales) {
      monthMap.set(s.month, {
        month: s.month,
        total_sales: s.total_sales || 0,
        total_purchases: 0,
      });
    }

    for (const p of purchases) {
      if (monthMap.has(p.month)) {
        monthMap.get(p.month).total_purchases = p.total_purchases || 0;
      } else {
        monthMap.set(p.month, {
          month: p.month,
          total_sales: 0,
          total_purchases: p.total_purchases || 0,
        });
      }
    }

    // 🧾 Ensure all 12 months exist (even if no sales/purchases)
    const allMonths = Array.from({ length: 12 }, (_, i) => i + 1);
    const combinedData = allMonths.map((month) => {
      const d = monthMap.get(month) || {
        total_sales: 0,
        total_purchases: 0,
      };
      return {
        month: new Date(year, month - 1).toLocaleString("default", {
          month: "short",
        }),
        sales: d.total_sales,
        purchases: d.total_purchases,
        // profit: d.total_sales - d.total_purchases,
      };
    });

    return res.status(200).json({
      year,
      data: combinedData,
    });
  } catch (err) {
      if (connection) connection.release();
    console.error("❌ Error getting all sales and purchases year wise:", err);
    next(err);
    // return res.status(500).json({ message: "Internal Server Error" });
  }finally {
    if (connection) connection.release();
  }
};

// const getSalesAndPurchasesYearWise = async (req, res, next) => {
//   let connection;

//   try {
//     connection = await db.getConnection();
//     const currentYear=parseInt(req.query.year)|| new Date().getFullYear();
//     // const currentYear = new Date().getFullYear();
//     const startYear = currentYear - 1;
//     const endYear = currentYear + 2;

//     // 🟢 SALES
//     const [sales] = await connection.query(
//       `
//       SELECT 
//         YEAR(Invoice_Date) AS year,
//         SUM(Total_Amount) AS total_sales
//       FROM add_sale
//       WHERE YEAR(Invoice_Date) BETWEEN ? AND ?
//       GROUP BY YEAR(Invoice_Date)
//       `,
//       [startYear, endYear]
//     );

//     // 🔴 PURCHASES
//     const [purchases] = await connection.query(
//       `
//       SELECT 
//         YEAR(Bill_Date) AS year,
//         SUM(Total_Amount) AS total_purchases
//       FROM add_purchase
//       WHERE YEAR(Bill_Date) BETWEEN ? AND ?
//       GROUP BY YEAR(Bill_Date)
//       `,
//       [startYear, endYear]
//     );

//     const yearMap = {};

//     // Merge sales
//     for (const s of sales) {
//       yearMap[s.year] = {
//         year: s.year,
//         sales: Number(s.total_sales) || 0,
//        purchases: 0,
//       };
//     }

//     // Merge purchases
//     for (const p of purchases) {
//       if (yearMap[p.year]) {
//         yearMap[p.year].purchases =
//           Number(p.total_purchases) || 0;
//       } else {
//         yearMap[p.year] = {
//           year: p.year,
//           sales: 0,
//           purchases: Number(p.total_purchases) || 0,
//         };
//       }
//     }

//     // Convert object → array and sort
//     const combinedData = Object.values(yearMap).sort(
//       (a, b) => a.year - b.year
//     );

//     return res.status(200).json({
    
//       data: combinedData,
//     });

//   } catch (err) {
//     console.error("❌ Error getting sales and purchases year wise:", err);
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };
//CHARTS
const getSalesAndPurchasesYearWise = async (req, res, next) => {
  let connection;

  try {
    connection = await db.getConnection();

    const currentYear = parseInt(req.query.year) || new Date().getFullYear();
    const startYear = currentYear - 1;
    const endYear = currentYear + 2;

    const [rows] = await connection.query(`
      WITH transactions AS (

        SELECT 
          YEAR(Invoice_Date) AS year,
          Total_Amount AS sales,
          0 AS purchases
        FROM add_sale
        WHERE YEAR(Invoice_Date) BETWEEN ? AND ?

        UNION ALL

        SELECT 
          YEAR(Bill_Date) AS year,
          0 AS sales,
          Total_Amount AS purchases
        FROM add_purchase
        WHERE YEAR(Bill_Date) BETWEEN ? AND ?
      )

      SELECT 
        year,
        COALESCE(SUM(sales),0) AS sales,
        COALESCE(SUM(purchases),0) AS purchases
      FROM transactions
      GROUP BY year
      ORDER BY year ASC
    `, [startYear, endYear, startYear, endYear]);

    res.status(200).json({
      data: rows
    });

  } catch (err) {
    console.error("❌ Error getting sales and purchases year wise:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

// const getPartyWiseSalesAndPurchasesDailyYearMonthWise = async (req, res, next) => {
//   let connection;
//   try {
//     connection = await db.getConnection();
//     const now = new Date();
//     //const currentMonth = now.getMonth() + 1; // JS months are 0-based
//     // const currentYear = now.getFullYear();

//        const monthName = req.query.month || null;
//        const currentYear= parseInt(req.query.year) || new Date().getFullYear();
//     // 🔹 1️⃣ Fetch total sales per party for current month
//     const monthMap = {
//       january: 1,
//       february: 2,
//       march: 3,
//       april: 4,
//       may: 5,
//       june: 6,
//       july: 7,
//       august: 8,
//       september: 9,
//       october: 10,
//       november: 11,
//       december: 12,
//     };

//     let currentMonth;
//     if (monthName) {
//       currentMonth = monthMap[monthName.toLowerCase()];
//       if (!currentMonth) {
//         return res.status(400).json({
//           success: false,
//           message: `Invalid month name: "${monthName}". Please send a valid month name (e.g., "October").`,
//         });
//       }
//     } else {
//       currentMonth = new Date().getMonth() + 1; // Default: current month
//     }
//     // const [sales] = await db.query(
//     //   `
//     //   SELECT s.Party_Id, p.Party_Name, SUM(s.Total_Amount) AS total_sales
//     //   FROM add_sale s
//     //   JOIN add_party p ON p.Party_Id = s.Party_Id
//     //   WHERE MONTH(s.created_at) = ? AND YEAR(s.created_at) = ?
//     //   GROUP BY s.Party_Id, p.Party_Name
//     //   `,
//     //   [currentMonth, currentYear]
//     // );
//       const [sales] = await db.query(
//       `
//       SELECT s.Party_Id, p.Party_Name, SUM(s.Total_Amount) AS total_sales
//       FROM add_sale s
//       JOIN add_party p ON p.Party_Id = s.Party_Id
//       WHERE MONTH(s.Invoice_Date) = ? AND YEAR(s.Invoice_Date) = ?
//       GROUP BY s.Party_Id, p.Party_Name
//       `,
//       [currentMonth, currentYear]
//     );

//     // 🔹 2️⃣ Fetch total purchases per party for current month
//     // const [purchases] = await db.query(
//     //   `
//     //   SELECT pr.Party_Id, p.Party_Name, SUM(pr.Total_Amount) AS total_purchases
//     //   FROM add_purchase pr
//     //   JOIN add_party p ON p.Party_Id = pr.Party_Id
//     //   WHERE MONTH(pr.created_at) = ? AND YEAR(pr.created_at) = ?
//     //   GROUP BY pr.Party_Id, p.Party_Name
//     //   `,
//     //   [currentMonth, currentYear]
//     // );
//       const [purchases] = await db.query(
//       `
//       SELECT pr.Party_Id, p.Party_Name, SUM(pr.Total_Amount) AS total_purchases
//       FROM add_purchase pr
//       JOIN add_party p ON p.Party_Id = pr.Party_Id
//       WHERE MONTH(pr.Bill_Date) = ? AND YEAR(pr.Bill_Date) = ?
//       GROUP BY pr.Party_Id, p.Party_Name
//       `,
//       [currentMonth, currentYear]
//     );

//     // 🔹 3️⃣ Merge both sales and purchase results
//     const combinedMap = {};

//     // Add sales data
//     for (const s of sales) {
//       combinedMap[s.Party_Id] = {
//         partyId: s.Party_Id,
//         partyName: s.Party_Name,
//         totalSales: s.total_sales || 0,
//         totalPurchases: 0,
//       };
//     }

//     // Merge purchase data
//     for (const p of purchases) {
//       if (combinedMap[p.Party_Id]) {
//         combinedMap[p.Party_Id].totalPurchases = p.total_purchases || 0;
//       } else {
//         combinedMap[p.Party_Id] = {
//           partyId: p.Party_Id,
//           partyName: p.Party_Name,
//           totalSales: 0,
//           totalPurchases: p.total_purchases || 0,
//         };
//       }
//     }

//     // 🔹 4️⃣ Calculate profit and transform into array
//     const combined = Object.values(combinedMap).map((entry) => ({
//       partyId: entry.partyId,
//       partyName: entry.partyName,
//       totalSales: Number(entry.totalSales) || 0,
//       totalPurchases: Number(entry.totalPurchases) || 0,
//       profit: (Number(entry.totalSales) || 0) - (Number(entry.totalPurchases) || 0),
//     }));

//     // 🔹 5️⃣ Sort by profit descending
//     combined.sort((a, b) => b.profit - a.profit);

//     // ✅ 6️⃣ Send response
//     return res.status(200).json({
//       success: true,
//       month: currentMonth,
//       year: currentYear,
//       totalParties: combined.length,
//       data: combined,
//     });
//   } catch (err) {
//     if (connection) {
//       connection.release();
//     }
//     console.error("❌ Error getting party-wise sales and purchases:", err);
//     next(err);
//     // return res.status(500).json({ message: "Internal Server Error" });
//   }finally{
//     if(connection){
//       connection.release();
//     }
//   }
// };

// const getSalesNewSalesPurchasesInDateRange = async (req, res, next) => {
//   let connection;
//   try {
//     connection = await db.getConnection();

//     const { fromDate, toDate } = req.query;

//     if (!fromDate || !toDate) {
//       connection.release();
//       return res.status(400).json({ message: "From and To Date is required" });
//     }

//     const formatIndianDate = (date) =>
//       new Date(date).toLocaleString("en-IN", {
//         day: "2-digit",
//         month: "2-digit",
//         year: "numeric",
//       });

//     /* ---------------------------------------------------
//        0️⃣ FETCH ACTIVE FINANCIAL YEAR
//     --------------------------------------------------- */
//     const [fy] = await connection.query(
//       `SELECT Financial_Year 
//        FROM financial_year 
//        WHERE Current_Financial_Year = 1
//        LIMIT 1`
//     );

//     if (!fy.length) {
//       connection.release();
//       return res.status(400).json({
//         success: false,
//         message: "No active financial year found.",
//       });
//     }

//     const activeFY = fy[0].Financial_Year;

//     /* ---------------------------------------------------
//        1️⃣ SALES (DATA + ITEMS)
//     --------------------------------------------------- */
//     const [sales] = await connection.query(
//       `SELECT s.*, p.Party_Name, p.GSTIN
//        FROM add_sale s
//        LEFT JOIN add_party p ON s.Party_Id = p.Party_Id
//        WHERE s.Financial_Year = ?
//        AND DATE(s.Invoice_Date) BETWEEN ? AND ?
//        ORDER BY s.Invoice_Date ASC`,
//       [activeFY, fromDate, toDate]
//     );

//     const saleIds = sales.map((s) => s.Sale_Id);

//     let saleItems = [];
//     if (saleIds.length > 0) {
//       const [items] = await connection.query(
//         `SELECT si.*, i.Item_Name, i.Item_HSN, i.Item_Category, i.Item_Unit
//          FROM add_sale_items si
//          LEFT JOIN add_item i ON si.Item_Id = i.Item_Id
//          WHERE si.Sale_Id IN (?)`,
//         [saleIds]
//       );
//       saleItems = items;
//     }

//     const salesWithItems = sales.map((s) => ({
//       sale_id: s.Sale_Id,
//       Party_Name: s.Party_Name,
//       GSTIN: s.GSTIN,
//       Invoice_Number: s.Invoice_Number,
//       Invoice_Date: formatIndianDate(s.Invoice_Date),
//       State_Of_Supply: s.State_Of_Supply,
//       Payment_Type: s.Payment_Type,
//       Referrence_Number: s.Referrence_Number,
//       Total_Received: s.Total_Received,
//       Balance_Due: s.Balance_Due,
//       created_at: formatIndianDate(s.created_at),
//       Total_Amount: s.Total_Amount,
//       items: saleItems.filter((i) => i.Sale_Id === s.Sale_Id),
//     }));

//     const [salesTotals] = await connection.query(
//       `SELECT 
//           COALESCE(SUM(Total_Amount),0) AS totalSalesAmount,
//           COALESCE(SUM(Total_Received),0) AS totalSalesReceivedAmount,
//           COALESCE(SUM(Balance_Due),0) AS totalSalesBalanceDue
//        FROM add_sale
//        WHERE Financial_Year = ?
//        AND DATE(Invoice_Date) BETWEEN ? AND ?`,
//       [activeFY, fromDate, toDate]
//     );

//     /* ---------------------------------------------------
//        2️⃣ PURCHASES (DATA + ITEMS)
//     --------------------------------------------------- */
//     const [purchases] = await connection.query(
//       `SELECT pu.*, p.Party_Name, p.GSTIN
//        FROM add_purchase pu
//        LEFT JOIN add_party p ON pu.Party_Id = p.Party_Id
//        WHERE pu.Financial_Year = ?
//        AND DATE(pu.Bill_Date) BETWEEN ? AND ?
//        ORDER BY pu.Bill_Date ASC`,
//       [activeFY, fromDate, toDate]
//     );

//     const purchaseIds = purchases.map((p) => p.Purchase_Id);

//     let purchaseItems = [];
//     if (purchaseIds.length > 0) {
//       const [items] = await connection.query(
//         `SELECT pu.*, i.Item_Name, i.Item_HSN, i.Item_Category, i.Item_Unit
//          FROM add_purchase_items pu
//          LEFT JOIN add_item i ON pu.Item_Id = i.Item_Id
//          WHERE pu.Purchase_Id IN (?)`,
//         [purchaseIds]
//       );
//       purchaseItems = items;
//     }

//     const purchasesWithItems = purchases.map((pu) => ({
//       purchase_id: pu.Purchase_Id,
//       Party_Name: pu.Party_Name,
//       GSTIN: pu.GSTIN,
//       Bill_Number: pu.Bill_Number,
//       Bill_Date: formatIndianDate(pu.Bill_Date),
//       State_Of_Supply: pu.State_Of_Supply,
//       Payment_Type: pu.Payment_Type,
//       Referrence_Number: pu.Referrence_Number,
//       Total_Paid: pu.Total_Paid,
//       Balance_Due: pu.Balance_Due,
//       created_at: formatIndianDate(pu.created_at),
//       Total_Amount: pu.Total_Amount,
//       items: purchaseItems.filter((i) => i.Purchase_Id === pu.Purchase_Id),
//     }));

//     const [purchaseTotals] = await connection.query(
//       `SELECT 
//           COALESCE(SUM(Total_Amount),0) AS totalPurchasesAmount,
//           COALESCE(SUM(Total_Paid),0) AS totalPurchasePaidAmount,
//           COALESCE(SUM(Balance_Due),0) AS totalPurchasesBalanceDue
//        FROM add_purchase
//        WHERE Financial_Year = ?
//        AND DATE(Bill_Date) BETWEEN ? AND ?`,
//       [activeFY, fromDate, toDate]
//     );

//     /* ---------------------------------------------------
//        FINAL RESPONSE
//     --------------------------------------------------- */
//     return res.status(200).json({
//       success: true,
//       fromDate,
//       toDate,
//       financialYear: activeFY,
//       data: {
//         sales: {
//           items: salesWithItems,
//           totalSalesAmount: salesTotals[0].totalSalesAmount,
//           totalSalesReceivedAmount: salesTotals[0].totalSalesReceivedAmount,
//           totalSalesBalanceDue: salesTotals[0].totalSalesBalanceDue,
//         },

//         purchases: {
//           items: purchasesWithItems,
//           totalPurchasesAmount: purchaseTotals[0].totalPurchasesAmount,
//           totalPurchasePaidAmount: purchaseTotals[0].totalPurchasePaidAmount,
//           totalPurchasesBalanceDue: purchaseTotals[0].totalPurchasesBalanceDue,
//         },
//       },
//     });
//   } catch (err) {
//     if (connection) connection.release();
//     console.error("❌ Error:", err);
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };

// const getSalesNewSalesPurchasesInDateRange = async (req, res, next) => {
//   let connection;

//   try {
//     connection = await db.getConnection();

//     const { fromDate, toDate, reportType } = req.query;

//     if (!fromDate || !toDate) {
//       return res.status(400).json({
//         message: "From and To Date is required",
//       });
//     }

//     const type = reportType?.toLowerCase();
//     const fetchSales = !type || type === "sales";
//     const fetchPurchases = !type || type === "purchases";

//     const formatIndianDate = (date) =>
//       new Date(date).toLocaleString("en-IN", {
//         day: "2-digit",
//         month: "2-digit",
//         year: "numeric",
//       });

//     /* -------------------------------------------
//        FETCH SALES + PURCHASES USING UNION ALL
//     -------------------------------------------- */

//     const [transactions] = await connection.query(
//       `
//       SELECT 
//         'sale' AS type,
//         s.Sale_Id AS bill_id,
//         s.Invoice_Number,
//         s.Invoice_Date AS bill_date,
//         s.Total_Amount,
//         s.Total_Received,
//         s.Balance_Due,
//         s.Payment_Type,
//         s.Referrence_Number,
//         s.State_Of_Supply,
//         s.created_at,
//         p.Party_Name,
//         p.GSTIN
//       FROM add_sale s
//       LEFT JOIN add_party p ON s.Party_Id = p.Party_Id
//       WHERE s.Invoice_Date BETWEEN ? AND ?

//       UNION ALL

//       SELECT 
//         'purchase' AS type,
//         pu.Purchase_Id AS bill_id,
//         pu.Bill_Number,
//         pu.Bill_Date,
//         pu.Total_Amount,
//         pu.Total_Paid,
//         pu.Balance_Due,
//         pu.Payment_Type,
//         pu.Referrence_Number,
//         pu.State_Of_Supply,
//         pu.created_at,
//         p.Party_Name,
//         p.GSTIN
//       FROM add_purchase pu
//       LEFT JOIN add_party p ON pu.Party_Id = p.Party_Id
//       WHERE pu.Bill_Date BETWEEN ? AND ?

//       ORDER BY bill_date ASC
//       `,
//       [fromDate, toDate, fromDate, toDate]
//     );

//     /* -------------------------------------------
//        SPLIT SALES & PURCHASES
//     -------------------------------------------- */

//     const sales = transactions.filter((t) => t.type === "sale");
//     const purchases = transactions.filter((t) => t.type === "purchase");

//     const saleIds = sales.map((s) => s.bill_id);
//     const purchaseIds = purchases.map((p) => p.bill_id);

//     /* -------------------------------------------
//        FETCH SALE ITEMS
//     -------------------------------------------- */

//     let saleItems = [];

//     if (saleIds.length) {
//       const [items] = await connection.query(
//         `
//         SELECT si.*, i.Item_Name, i.Item_HSN, i.Item_Category, i.Item_Unit
//         FROM add_sale_items si
//         LEFT JOIN add_item i ON si.Item_Id = i.Item_Id
//         WHERE si.Sale_Id IN (?)
//         `,
//         [saleIds]
//       );

//       saleItems = items;
//     }

//     /* -------------------------------------------
//        FETCH PURCHASE ITEMS
//     -------------------------------------------- */

//     let purchaseItems = [];

//     if (purchaseIds.length) {
//       const [items] = await connection.query(
//         `
//         SELECT pi.*, i.Item_Name, i.Item_HSN, i.Item_Category, i.Item_Unit
//         FROM add_purchase_items pi
//         LEFT JOIN add_item i ON pi.Item_Id = i.Item_Id
//         WHERE pi.Purchase_Id IN (?)
//         `,
//         [purchaseIds]
//       );

//       purchaseItems = items;
//     }

//     /* -------------------------------------------
//        MAP ITEMS FOR FAST LOOKUP
//     -------------------------------------------- */

//     const saleItemsMap = new Map();

//     saleItems.forEach((item) => {
//       if (!saleItemsMap.has(item.Sale_Id)) {
//         saleItemsMap.set(item.Sale_Id, []);
//       }
//       saleItemsMap.get(item.Sale_Id).push(item);
//     });

//     const purchaseItemsMap = new Map();

//     purchaseItems.forEach((item) => {
//       if (!purchaseItemsMap.has(item.Purchase_Id)) {
//         purchaseItemsMap.set(item.Purchase_Id, []);
//       }
//       purchaseItemsMap.get(item.Purchase_Id).push(item);
//     });

//     /* -------------------------------------------
//        BUILD FINAL OBJECTS
//     -------------------------------------------- */

//     const salesWithItems = fetchSales
//       ? sales.map((s) => ({
//           sale_id: s.bill_id,
//           Party_Name: s.Party_Name,
//           GSTIN: s.GSTIN,
//           Invoice_Number: s.Invoice_Number,
//           Invoice_Date: formatIndianDate(s.bill_date),
//           State_Of_Supply: s.State_Of_Supply,
//           Payment_Type: s.Payment_Type,
//           Referrence_Number: s.Referrence_Number,
//           Total_Received: s.Total_Received,
//           Balance_Due: s.Balance_Due,
//           created_at: formatIndianDate(s.created_at),
//           Total_Amount: s.Total_Amount,
//           items: saleItemsMap.get(s.bill_id) || [],
//         }))
//       : [];

//     const purchasesWithItems = fetchPurchases
//       ? purchases.map((pu) => ({
//           purchase_id: pu.bill_id,
//           Party_Name: pu.Party_Name,
//           GSTIN: pu.GSTIN,
//           Bill_Number: pu.Invoice_Number,
//           Bill_Date: formatIndianDate(pu.bill_date),
//           State_Of_Supply: pu.State_Of_Supply,
//           Payment_Type: pu.Payment_Type,
//           Referrence_Number: pu.Referrence_Number,
//           Total_Paid: pu.Total_Received,
//           Balance_Due: pu.Balance_Due,
//           created_at: formatIndianDate(pu.created_at),
//           Total_Amount: pu.Total_Amount,
//           items: purchaseItemsMap.get(pu.bill_id) || [],
//         }))
//       : [];

//     /* -------------------------------------------
//        TOTALS
//     -------------------------------------------- */

//     const salesTotals = sales.reduce(
//       (acc, s) => {
//         acc.totalSalesAmount += Number(s.Total_Amount || 0);
//         acc.totalSalesReceivedAmount += Number(s.Total_Received || 0);
//         acc.totalSalesBalanceDue += Number(s.Balance_Due || 0);
//         return acc;
//       },
//       {
//         totalSalesAmount: 0,
//         totalSalesReceivedAmount: 0,
//         totalSalesBalanceDue: 0,
//       }
//     );

//     const purchaseTotals = purchases.reduce(
//       (acc, p) => {
//         acc.totalPurchasesAmount += Number(p.Total_Amount || 0);
//         acc.totalPurchasePaidAmount += Number(p.Total_Received || 0);
//         acc.totalPurchasesBalanceDue += Number(p.Balance_Due || 0);
//         return acc;
//       },
//       {
//         totalPurchasesAmount: 0,
//         totalPurchasePaidAmount: 0,
//         totalPurchasesBalanceDue: 0,
//       }
//     );

//     /* -------------------------------------------
//        FINAL RESPONSE (UNCHANGED STRUCTURE)
//     -------------------------------------------- */

//     return res.status(200).json({
//       success: true,
//       fromDate,
//       toDate,
//       reportType: type || "all",
//       data: {
//         ...(fetchSales && {
//           sales: {
//             items: salesWithItems,
//             ...salesTotals,
//           },
//         }),
//         ...(fetchPurchases && {
//           purchases: {
//             items: purchasesWithItems,
//             ...purchaseTotals,
//           },
//         }),
//       },
//     });
//   } catch (err) {
//     console.error("❌ Error:", err);
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };

const getPartyWiseSalesAndPurchasesOverall = async (req, res, next) => {
  let connection;

  try {
    connection = await db.getConnection();

    const [rows] = await connection.query(`
      WITH party_transactions AS (
        SELECT 
          Party_Id,
          SUM(Total_Amount) AS sales,
          0 AS purchases
        FROM add_sale
        GROUP BY Party_Id

        UNION ALL

        SELECT 
          Party_Id,
          0 AS sales,
          SUM(Total_Amount) AS purchases
        FROM add_purchase
        GROUP BY Party_Id
      )

      SELECT 
        p.Party_Id AS partyId,
        p.Party_Name AS partyName,
        COALESCE(SUM(t.sales),0) AS sales,
        COALESCE(SUM(t.purchases),0) AS purchases
      FROM party_transactions t
      JOIN add_party p ON p.Party_Id = t.Party_Id
      GROUP BY p.Party_Id, p.Party_Name
      ORDER BY sales DESC
    `);

    // 🔑 convert to numbers
    const formatted = rows.map(r => ({
      ...r,
      sales: Number(r.sales),
      purchases: Number(r.purchases)
    }));

    res.status(200).json({
      success: true,
      totalRecords: formatted.length,
      data: formatted
    });

  } catch (err) {
    console.error("❌ Error getting party-wise sales and purchases:", err);
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


const printDailyReport = async (req, res) => {
  try {
    // Accept BOTH daily OR range
    const {
      sales = [],
    
      purchases = [],

      date,        // for single-day
      fromDate,    // for range
      toDate,

      totalSalesAmount,
      totalSalesReceivedAmount,
      totalSalesBalanceDue,

     

      totalPurchasesAmount,
      totalPurchasesPaidAmount,
      totalPurchasesBalanceDue
    } = req.body;

    // GLOBAL TOTALS
    const globalTotals = {
      totalSalesAmount: totalSalesAmount || 0,
      totalSalesReceivedAmount: totalSalesReceivedAmount || 0,
      totalSalesBalanceDue: totalSalesBalanceDue || 0,

     

      totalPurchasesAmount: totalPurchasesAmount || 0,
      totalPurchasesPaidAmount: totalPurchasesPaidAmount || 0,
      totalPurchasesBalanceDue: totalPurchasesBalanceDue || 0
    };

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
      unbreakable: true,  // 🔥🔥🔥 THE MAGIC FIX
      stack: [
        {
          text: `${title.slice(0, -1)} ${idx + 1}`,
          style: "subTitle",
          alignment: "left",
          margin: [0, 0, 0, 5]
        },

        // PARTY DETAILS
        {
          columns: [
            {
              width: "48%",
              stack: [
                { text: "Party Name", style: "label" },
                { text: safe(entry.Party_Name), style: "value" },

                { text: "GSTIN", style: "label" },
                { text: safe(entry.GSTIN), style: "value" }
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
                  text: safe(entry.Bill_Number|| entry.Invoice_Number),
                  style: "value"
                },

                {
                  text: type === "purchase" ? "Bill Date" : "Invoice Date",
                  style: "label"
                },
                {
                  text: safe(entry.Bill_Date|| entry.Invoice_Date),
                  style: "value"
                }
              ]
            }
          ],
          columnGap: 20,
          margin: [0, 0, 0, 10]
        },

        // TABLE
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
                safe(it.Quantity + " " + safe(it.Item_Unit)),
                safe(it.Sale_Price || it.Purchase_Price),
                safe(TAX_TYPES[it.Tax_Type] || it.Tax_Type),
                Number(it.Amount || 0).toFixed(2)
              ])
            ]
          },
          layout: "lightHorizontalLines",
          margin: [0, 0, 0, 8]
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
              layout: "noBordersBox"
            }
          ],
          margin: [0, 0, 0, 15]
        }
      ]
    });
  });

  return rows;
};

    // HEADER TITLE
    let headerTitle = "";

    if (fromDate && toDate) {
      headerTitle = `DATE RANGE REPORT`;
    } else if (date) {
      headerTitle = `DAILY REPORT`;
    }

    
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
      text: headerTitle,
      style: "header",
      alignment: "center",
      margin: [0, 0, 0, 10]
    },

    ...buildSection("Purchases", purchases, "purchase"),
    ...buildSection("Sales", sales, "sale"),
    
  ],

  styles: {
    header: { fontSize: 20, bold: true },
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
    console.error("Print failed:", err);
    res.status(500).json({ message: "PDF Print Error" });
  }
};
// const getPartyWiseSalesAndPurchasesOverall = async (req, res, next) => {
//   let connection;

//   try {
//     connection = await db.getConnection();

//     // SALES
//     const [sales] = await connection.query(`
//       SELECT 
//         s.Party_Id,
//         p.Party_Name,
//         SUM(s.Total_Amount) AS total_sales
//       FROM add_sale s
//       JOIN add_party p ON p.Party_Id = s.Party_Id
//       GROUP BY s.Party_Id, p.Party_Name
//     `);

//     // PURCHASES
//     const [purchases] = await connection.query(`
//       SELECT 
//         pr.Party_Id,
//         p.Party_Name,
//         SUM(pr.Total_Amount) AS total_purchases
//       FROM add_purchase pr
//       JOIN add_party p ON p.Party_Id = pr.Party_Id
//       GROUP BY pr.Party_Id, p.Party_Name
//     `);

//     console.log(sales, purchases);
//     const map = {};

//     // Merge sales
//     for (const s of sales) {
//       const key = s.Party_Id;

//       map[key] = {
//         partyId: s.Party_Id,
//         partyName: s.Party_Name,
//         sales: Number(s.total_sales) || 0,
//         purchases: 0,
//       };
//     }

//     // Merge purchases
//     for (const p of purchases) {
//       const key = p.Party_Id;

//       if (map[key]) {
//         map[key].purchases = Number(p.total_purchases) || 0;
//       } else {
//         map[key] = {
//           partyId: p.Party_Id,
//           partyName: p.Party_Name,
//           sales: 0,
//           purchases: Number(p.total_purchases) || 0,
//         };
//       }
//     }

//     const combined = Object.values(map).map((row) => ({
//       ...row,
//       profit: row.sales - row.purchases,
//     }));

//     combined.sort((a, b) => b.sales - a.sales);

//     return res.status(200).json({
//       success: true,
//       totalRecords: combined.length,
//       data: combined,
//     });

//   } catch (err) {
//     console.error("❌ Error getting overall party-wise sales and purchases:", err);
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };

//BALANCE SHEET

const getFinancialYearDates = () => {
  const today = new Date();

  const year = today.getFullYear();
  const month = today.getMonth(); // 0 = Jan, 3 = April

  let fromDate, toDate;

  if (month >= 3) {
    // April or later → current FY
    fromDate = `${year}-04-01`;
    toDate = `${year + 1}-03-31`;
  } else {
    // Jan–March → previous FY
    fromDate = `${year - 1}-04-01`;
    toDate = `${year}-03-31`;
  }

  return { fromDate, toDate };
};
const getBalanceSheet = async (req, res, next) => {
  try {
    // const { fromDate, toDate } = req.query;
 let { fromDate, toDate } = req.query;

if (!fromDate || !toDate) {
  const fyDates = getFinancialYearDates();
  fromDate = fyDates.fromDate;
  toDate = fyDates.toDate;
}

console.log("Using date range:", fromDate, "to", toDate);
    // if (!fromDate || !toDate) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Query params 'fromDate' and 'toDate' are required (YYYY-MM-DD)",
    //   });
    // }
 
    // ── helpers ────────────────────────────────────────────────────────────
    const n = (val) => parseFloat(val || 0);
 
    // ══════════════════════════════════════════════════════════════════════
    //  ASSETS
    // ══════════════════════════════════════════════════════════════════════
 
    // ── 1. SUNDRY DEBTORS
    //    Sales billed up toDate `toDate` whose Balance_Due > 0
    const [debtorRows] = await db.execute(
      `SELECT COALESCE(SUM(Balance_Due), 0) AS amount
       FROM add_sale
       WHERE Invoice_Date <= ?`,
      [toDate]
    );
    const sundryDebtors = n(debtorRows[0].amount);
 
    // ── 2. CASH IN HAND
    //    Cash received fromDate sales  minus  cash paid for purchases  minus  cash expenses
    const [cashSaleRows] = await db.execute(
      `SELECT COALESCE(SUM(Total_Received), 0) AS amount
       FROM add_sale
       WHERE Invoice_Date <= ? AND Payment_Type = 'Cash'`,
      [toDate]
    );
    const [cashPurRows] = await db.execute(
      `SELECT COALESCE(SUM(Total_Paid), 0) AS amount
       FROM add_purchase
       WHERE Bill_Date <= ? AND Payment_Type = 'Cash'`,
      [toDate]
    );
    // const [cashExpRows] = await db.execute(
    //   `SELECT COALESCE(SUM(Amount), 0) AS amount
    //    FROM daily_expense
    //    WHERE Date <= ? AND Payment_Method = 'Cash'`,
    //   [toDate]
    // );
    // const cashAccounts =
    //   n(cashSaleRows[0].amount) -
    //   n(cashPurRows[0].amount) -
    //   n(cashExpRows[0].amount);
   const cashAccounts =
      n(cashSaleRows[0].amount) -
      n(cashPurRows[0].amount)
    // ── 3. BANK / NEFT BALANCE
    //    Neft/Cheque received  minus  Neft/Cheque paid  minus  Online expenses
    const [bankSaleRows] = await db.execute(
      `SELECT COALESCE(SUM(Total_Received), 0) AS amount
       FROM add_sale
       WHERE Invoice_Date <= ? AND Payment_Type IN ('Neft','Cheque')`,
      [toDate]
    );
    const [bankPurRows] = await db.execute(
      `SELECT COALESCE(SUM(Total_Paid), 0) AS amount
       FROM add_purchase
       WHERE Bill_Date <= ? AND Payment_Type IN ('Neft','Cheque')`,
      [toDate]
    );
    // const [onlineExpRows] = await db.execute(
    //   `SELECT COALESCE(SUM(Amount), 0) AS amount
    //    FROM daily_expense
    //    WHERE Date <= ? AND Payment_Method IN ('Online','Cheque')`,
    //   [toDate]
    // );
    // const bankAccounts =
    //   n(bankSaleRows[0].amount) -
    //   n(bankPurRows[0].amount) -
    //   n(onlineExpRows[0].amount);
        const bankAccounts =
      n(bankSaleRows[0].amount) -
      n(bankPurRows[0].amount)
 
    // ── 4. INPUT GST (GST paid on purchases — claimable ITC)
    //    SUM of Tax_Amount on purchase items within period
    const [inputGSTRows] = await db.execute(
      `SELECT COALESCE(SUM(pi.Tax_Amount), 0) AS amount
       FROM add_purchase_items pi
       JOIN add_purchase p ON pi.Purchase_Id = p.Purchase_Id
       WHERE p.Bill_Date <= ?
         AND pi.Tax_Type NOT IN ('None','none')`,
      [toDate]
    );
    const inputDutiesAndTaxes = n(inputGSTRows[0].amount);
 
    // ── 5. CLOSING STOCK VALUE
    //    Current Stock_Quantity × last Purchase_Price per item
    //    (Uses the most recent purchase price recorded in add_purchase_items)
    const [stockRows] = await db.execute(
      `SELECT
         i.Item_Id,
         i.Stock_Quantity,
         (
           SELECT pi2.Purchase_Price
           FROM add_purchase_items pi2
           JOIN add_purchase p2 ON pi2.Purchase_Id = p2.Purchase_Id
           WHERE pi2.Item_Id = i.Item_Id
             AND p2.Bill_Date <= ?
           ORDER BY p2.Bill_Date DESC, pi2.id DESC
           LIMIT 1
         ) AS last_price
       FROM add_item i
       WHERE i.Stock_Quantity > 0`,
      [toDate]
    );
    let closingStock = 0;
    for (const row of stockRows) {
      if (row.last_price != null) {
        closingStock += n(row.Stock_Quantity) * n(row.last_price);
      }
    }
 
    // ── Total Current Assets
    const currentAssetsTotal =
      sundryDebtors +
      inputDutiesAndTaxes +
      bankAccounts +
      cashAccounts +
      closingStock;
 
    // ── Total Assets (no fixed/non-current assets in this DB)
    const totalAssets = currentAssetsTotal;
 
    // ══════════════════════════════════════════════════════════════════════
    //  EQUITIES & LIABILITIES
    // ══════════════════════════════════════════════════════════════════════
 
    // ── 6. SUNDRY CREDITORS (purchase bills with outstanding balance)
    const [creditorRows] = await db.execute(
      `SELECT COALESCE(SUM(Balance_Due), 0) AS amount
       FROM add_purchase
       WHERE Bill_Date <= ?`,
      [toDate]
    );
    const sundryCreditors = n(creditorRows[0].amount);
 
    // ── 7. OUTPUT GST PAYABLE (GST collected on sales)
    const [outputGSTRows] = await db.execute(
      `SELECT COALESCE(SUM(si.Tax_Amount), 0) AS amount
       FROM add_sale_items si
       JOIN add_sale s ON si.Sale_Id = s.Sale_Id
       WHERE s.Invoice_Date <= ?
         AND si.Tax_Type NOT IN ('None','none')`,
      [toDate]
    );
    // const dutiesAndTaxes = n(outputGSTRows[0].amount);
 const dutiesAndTaxes =
  n(outputGSTRows[0].amount) - inputDutiesAndTaxes;
    // ── 8. RETAINED EARNINGS  (Net profit within the selected period)
    //    = Revenue (sale subtotal excl. tax) − COGS (purchase subtotal excl. tax) − Expenses
    const [revenueRows] = await db.execute(
      `SELECT COALESCE(SUM(si.Amount - si.Tax_Amount), 0) AS amount
       FROM add_sale_items si
       JOIN add_sale s ON si.Sale_Id = s.Sale_Id
       WHERE s.Invoice_Date BETWEEN ? AND ?`,
      [fromDate, toDate]
    );
    const [cogsRows] = await db.execute(
      `SELECT COALESCE(SUM(pi.Amount - pi.Tax_Amount), 0) AS amount
       FROM add_purchase_items pi
       JOIN add_purchase p ON pi.Purchase_Id = p.Purchase_Id
       WHERE p.Bill_Date BETWEEN ? AND ?`,
      [fromDate, toDate]
    );
    const [expenseRows] = await db.execute(
      `SELECT COALESCE(SUM(Amount), 0) AS amount
       FROM daily_expense
       WHERE Date BETWEEN ? AND ?`,
      [fromDate, toDate]
    );
    const retainedEarnings =
      n(revenueRows[0].amount) -
      n(cogsRows[0].amount) -
      n(expenseRows[0].amount);
 
    // ── Total Current Liabilities
    const currentLiabTotal = sundryCreditors + dutiesAndTaxes;
 
    // ── Owner's Equity = Total Assets − Total Liabilities − Retained Earnings
    //    (Back-calculated since there is no capital_transactions table)
    // const ownerEquity =
    //   totalAssets - currentLiabTotal - retainedEarnings;
 const ownerEquity = totalAssets - currentLiabTotal;
    const totalEquities =
      ownerEquity + retainedEarnings + currentLiabTotal;
 
    // ══════════════════════════════════════════════════════════════════════
    //  RESPONSE
    // ══════════════════════════════════════════════════════════════════════
    return res.status(200).json({
      success: true,
      data: {
        asOf: toDate,
        period: { fromDate, toDate },
 
        equities: {
          capitalAccount: {
            ownerEquity: parseFloat(ownerEquity.toFixed(2)),
          },
          reservesSurplus: {
            reservesSurplusDefault: 0,
            revaluationReserve: 0,
            retainedEarnings: parseFloat(retainedEarnings.toFixed(2)),
          },
          longTermLiabilities: 0,
          currentLiabilities: {
            sundryCreditors: parseFloat(sundryCreditors.toFixed(2)),
            dutiesAndTaxes: parseFloat(dutiesAndTaxes.toFixed(2)),
            otherCurrentLiabilities: 0,
          },
          total: parseFloat(totalEquities.toFixed(2)),
        },
 
        assets: {
          fixedAssets: 0,
          nonCurrentAssets: 0,
          currentAssets: {
            sundryDebtors: parseFloat(sundryDebtors.toFixed(2)),
            inputDutiesAndTaxes: parseFloat(inputDutiesAndTaxes.toFixed(2)),
            bankAccounts: parseFloat(bankAccounts.toFixed(2)),
            cashAccounts: parseFloat(cashAccounts.toFixed(2)),
            closingStock: parseFloat(closingStock.toFixed(2)),
            otherCurrentAssets: 0,
          },
          otherAssets: 0,
          total: parseFloat(totalAssets.toFixed(2)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
export {getSalesNewSalesPurchasesEachDay,
  getSalesNewSalesPurchasesInDateRange,
  getSalesAndPurchasesDailyYearMonthWise,
  getSalesAndPurchasesWeeklyYearMonthWise,
  getSalesAndPurchasesMonthWise,
  getSalesAndPurchasesYearWise,
  getPartyWiseSalesAndPurchasesOverall,
  printDailyReport,
  getBalanceSheet};

// const getPartyWiseSalesAndPurchasesDailyYearMonthWise = async (req, res, next) => {
//   let connection;

//   try {
//     connection = await db.getConnection();

//     const MONTH_MAP = {
//       january: 1, jan: 1,
//       february: 2, feb: 2,
//       march: 3, mar: 3,
//       april: 4, apr: 4,
//       may: 5,
//       june: 6, jun: 6,
//       july: 7, jul: 7,
//       august: 8, aug: 8,
//       september: 9, sep: 9, sept: 9,
//       october: 10, oct: 10,
//       november: 11, nov: 11,
//       december: 12, dec: 12,
//     };

//     const year = Number(req.query.year) || new Date().getFullYear();

//     const month =
//       MONTH_MAP[req.query.month?.toLowerCase()] ||
//       new Date().getMonth() + 1;

//     // SALES
//     const [sales] = await connection.query(
//       `
//       SELECT 
//         DAY(s.Invoice_Date) AS day,
//         s.Party_Id,
//         p.Party_Name,
//         SUM(s.Total_Amount) AS total_sales
//       FROM add_sale s
//       JOIN add_party p ON p.Party_Id = s.Party_Id
//       WHERE YEAR(s.Invoice_Date)=?
//       AND MONTH(s.Invoice_Date)=?
//       GROUP BY day, s.Party_Id, p.Party_Name
//       ORDER BY day
//       `,
//       [year, month]
//     );

//     // PURCHASES
//     const [purchases] = await connection.query(
//       `
//       SELECT 
//         DAY(pr.Bill_Date) AS day,
//         pr.Party_Id,
//         p.Party_Name,
//         SUM(pr.Total_Amount) AS total_purchases
//       FROM add_purchase pr
//       JOIN add_party p ON p.Party_Id = pr.Party_Id
//       WHERE YEAR(pr.Bill_Date)=?
//       AND MONTH(pr.Bill_Date)=?
//       GROUP BY day, pr.Party_Id, p.Party_Name
//       ORDER BY day
//       `,
//       [year, month]
//     );

//     const map = {};

//     // Merge sales
//     for (const s of sales) {
//       const key = `${s.day}-${s.Party_Id}`;

//       map[key] = {
//         date: String(s.day).padStart(2, "0"),
//         partyId: s.Party_Id,
//         partyName: s.Party_Name,
//         sales: Number(s.total_sales) || 0,
//         purchases: 0,
//       };
//     }

//     // Merge purchases
//     for (const p of purchases) {
//       const key = `${p.day}-${p.Party_Id}`;

//       if (map[key]) {
//         map[key].purchases = Number(p.total_purchases) || 0;
//       } else {
//         map[key] = {
//           date: String(p.day).padStart(2, "0"),
//           partyId: p.Party_Id,
//           partyName: p.Party_Name,
//           sales: 0,
//           purchases: Number(p.total_purchases) || 0,
//         };
//       }
//     }

//     const combined = Object.values(map).map((row) => ({
//       ...row,
//       profit: row.sales - row.purchases,
//     }));

//     combined.sort((a, b) => Number(a.date) - Number(b.date));

//     return res.status(200).json({
//       success: true,
//       year,
//       month,
//       totalRecords: combined.length,
//       data: combined,
//     });

//   } catch (err) {
//     console.error("❌ Error getting party-wise daily sales and purchases:", err);
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };