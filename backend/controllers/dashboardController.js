

import db from "../config/db.js";
// const getTotalSalesPurchasesReceivablesPayablesProfit = async (req, res, next) => {
//   let connection;
//   try {
//     connection = await db.getConnection();
//     // Get current month and year
//     const now = new Date();
//     const currentMonth = now.getMonth() + 1; // JS months are 0-based
//     const currentYear = now.getFullYear();

//     const [totalSales] = await db.query(
//       `
//       SELECT SUM(Total_Amount) AS total_sales 
//       FROM add_sale 
//       WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?
//       `,
//       [currentMonth, currentYear]
//     );

//     const [totalPurchases] = await db.query(
//       `
//       SELECT SUM(Total_Amount) AS total_purchases 
//       FROM add_purchase 
//       WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?
//       `,
//       [currentMonth, currentYear]
//     );

//     const [totalReceivables] = await db.query(
//       `
//       SELECT SUM(Balance_Due) AS total_receivables 
//       FROM add_sale 
//       WHERE Balance_Due > 0 
//       AND MONTH(created_at) = ? AND YEAR(created_at) = ?
//       `,
//       [currentMonth, currentYear]
//     );

//     const [totalPayables] = await db.query(
//       `
//       SELECT SUM(Balance_Due) AS total_payables 
//       FROM add_purchase 
//       WHERE Balance_Due > 0 
//       AND MONTH(created_at) = ? AND YEAR(created_at) = ?
//       `,
//       [currentMonth, currentYear]
//     );

//     const totalSalesValue = totalSales[0].total_sales || 0;
//     const totalPurchasesValue = totalPurchases[0].total_purchases || 0;

//     return res.status(200).json({
//       month: currentMonth,
//       year: currentYear,
//       total_sales: totalSalesValue,
//       total_purchases: totalPurchasesValue,
//       total_receivables: totalReceivables[0].total_receivables || 0,
//       total_payables: totalPayables[0].total_payables || 0,
//       profit: totalSalesValue - totalPurchasesValue,
//     });
//   } catch (err) {
//     if (connection) connection.release();
//     console.error("❌ Error getting monthly totals:", err);
//     next(err);
//     // return res.status(500).json({ message: "Internal Server Error" });
//   }finally {
//     if (connection) connection.release();
//   }
// };
const getTotalSalesPurchasesReceivablesPayablesProfit = async (req, res, next) => {
  let connection;

  try {
    connection = await db.getConnection();

    const year = Number(req.query.year) || new Date().getFullYear();
    const month = Number(req.query.month) || (new Date().getMonth() + 1);

    // TOTAL SALES (Invoice_Date)
    const [totalSales] = await connection.query(
      `
      SELECT COALESCE(SUM(Total_Amount),0) AS total_sales
      FROM add_sale
      WHERE YEAR(Invoice_Date) = ?
      AND MONTH(Invoice_Date) = ?
      `,
      [year, month]
    );

    // TOTAL PURCHASES (Bill_Date)
    const [totalPurchases] = await connection.query(
      `
      SELECT COALESCE(SUM(Total_Amount),0) AS total_purchases
      FROM add_purchase
      WHERE YEAR(Bill_Date) = ?
      AND MONTH(Bill_Date) = ?
      `,
      [year, month]
    );

    // RECEIVABLES
    const [totalReceivables] = await connection.query(
      `
      SELECT COALESCE(SUM(Balance_Due),0) AS total_receivables
      FROM add_sale
      WHERE Balance_Due > 0
      AND YEAR(Invoice_Date) = ?
      AND MONTH(Invoice_Date) = ?
      `,
      [year, month]
    );

    // PAYABLES
    const [totalPayables] = await connection.query(
      `
      SELECT COALESCE(SUM(Balance_Due),0) AS total_payables
      FROM add_purchase
      WHERE Balance_Due > 0
      AND YEAR(Bill_Date) = ?
      AND MONTH(Bill_Date) = ?
      `,
      [year, month]
    );

    const totalSalesValue = totalSales[0].total_sales || 0;
    const totalPurchasesValue = totalPurchases[0].total_purchases || 0;

    return res.status(200).json({
      success: true,
      year,
      month,
      total_sales: totalSalesValue,
      total_purchases: totalPurchasesValue,
      total_receivables: totalReceivables[0].total_receivables || 0,
      total_payables: totalPayables[0].total_payables || 0,
      profit: totalSalesValue - totalPurchasesValue,
    });

  } catch (err) {
    console.error("❌ Error getting monthly totals:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};
const getAllSalesAndPurchasesYearWise = async (req, res, next) => {
  let connection;
  try {
    const year = parseInt(req.query.year) || 2025;
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
// const getTotalSalesPurchasesReceivablesPayablesProfit = async (req, res, next) => {
//   let connection;
//   try {
//     connection = await db.getConnection();
//     // Get current month and year
//     //const now = new Date();
//     //const currentMonth = now.getMonth() + 1; // JS months are 0-based
//     //const currentYear = now.getFullYear();

//     // const [totalSales] = await db.query(
//     //   `
//     //   SELECT SUM(Total_Amount) AS total_sales 
//     //   FROM add_sale 
//     //   WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?
//     //   `,
//     //   [currentMonth, currentYear]
//     // );

//      const [totalSales] = await db.query(
//       `
//       SELECT 
//      COALESCE(SUM(s.Total_Amount), 0) AS total_sales
//        FROM add_sale s
       
//       `,
  
//     );
//     // const [totalPurchases] = await db.query(
//     //   `
//     //   SELECT 
//     //   SUM(Total_Amount) AS total_purchases 
//     //   FROM add_purchase 
//     //   WHERE MONTH(created_at) = ? AND YEAR(created_at) = ?
//     //   `,
//     //   [currentMonth, currentYear]
//     // );
//     const [totalPurchases] = await db.query(
//       `
//       SELECT 
//       COALESCE(SUM(p.Total_Amount), 0) AS total_purchases
//       FROM add_purchase p
     
//       `,
     
//     );

//     // const [totalReceivables] = await db.query(
//     //   `
//     //   SELECT SUM(Balance_Due) AS total_receivables 
//     //   FROM add_sale 
//     //   WHERE Balance_Due > 0 
//     //   AND MONTH(created_at) = ? AND YEAR(created_at) = ?
//     //   `,
//     //   [currentMonth, currentYear]
//     // );

//     // const [totalPayables] = await db.query(
//     //   `
//     //   SELECT SUM(Balance_Due) AS total_payables 
//     //   FROM add_purchase 
//     //   WHERE Balance_Due > 0 
//     //   AND MONTH(created_at) = ? AND YEAR(created_at) = ?
//     //   `,
//     //   [currentMonth, currentYear]
//     // );


//         const [totalReceivables] = await db.query(
//       `
//       SELECT COALESCE(SUM(Balance_Due), 0) AS total_receivables 
//       FROM add_sale 
      
//       `,
      
//     );

//     const [totalPayables] = await db.query(
//       `
//       SELECT COALESCE(SUM(Balance_Due), 0) AS total_payables 
//       FROM add_purchase 
//       WHERE Balance_Due > 0 
     
//       `,
     
//     );
//     const totalSalesValue = totalSales[0].total_sales || 0;
//     const totalPurchasesValue = totalPurchases[0].total_purchases || 0;

//     return res.status(200).json({
     
//       total_sales: totalSalesValue,
//       total_purchases: totalPurchasesValue,
//       total_receivables: totalReceivables[0].total_receivables || 0,
//       total_payables: totalPayables[0].total_payables || 0,
//       profit: totalSalesValue - totalPurchasesValue,
//     });
//   } catch (err) {
//     if (connection) connection.release();
//     console.error("❌ Error getting monthly totals:", err);
//     next(err);
//     // return res.status(500).json({ message: "Internal Server Error" });
//   }finally {
//     if (connection) connection.release();
//   }
// };
const getCategoriesWiseItemCount = async (req, res) => {
  let connection;
  try {
    connection = await db.getConnection();

    const monthName = req.query.month || null;
    const year = parseInt(req.query.year) || new Date().getFullYear();
const monthMap = {
      january: 1,
      february: 2,
      march: 3,
      april: 4,
      may: 5,
      june: 6,
      july: 7,
      august: 8,
      september: 9,
      october: 10,
      november: 11,
      december: 12,
    };

    let monthNumber;
    if (monthName) {
      monthNumber = monthMap[monthName.toLowerCase()];
      if (!monthNumber) {
        return res.status(400).json({
          success: false,
          message: `Invalid month name: "${monthName}". Please send a valid month name (e.g., "October").`,
        });
      }
    } else {
      monthNumber = new Date().getMonth() + 1; // Default: current month
    }

    console.log(`📅 Month received: ${monthName || "(current month)"} → ${monthNumber}`);

    // const monthMap = {
    //   january: 1, february: 2, march: 3, april: 4,
    //   may: 5, june: 6, july: 7, august: 8,
    //   september: 9, october: 10, november: 11, december: 12,
    // };

    // const monthNumber = monthName
    //   ? monthMap[monthName.toLowerCase()]
    //   : new Date().getMonth() + 1;

    // if (!monthNumber) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Invalid month name",
    //   });
    // }

    // const startDate = `${year}-${String(monthNumber).padStart(2, "0")}-01`;
    // const endDate = `${year}-${String(monthNumber).padStart(2, "0")}-31`;

    const [categories] = await connection.query(
      `
      SELECT 
          c.Item_Category,
           CAST(SUM(pbi.quantity) AS UNSIGNED) AS total_items
      FROM add_purchase pb
      JOIN add_purchase_items pbi 
          ON pb.Purchase_Id = pbi.Purchase_Id
      JOIN add_item i 
          ON pbi.Item_Id = i.Item_Id
      JOIN add_category c 
          ON i.Item_Category = c.Item_Category
       WHERE MONTH(pb.Bill_Date) = ?
      AND YEAR(pb.Bill_Date) = ?
      GROUP BY c.Item_Category
      ORDER BY total_items DESC
      `,
      [monthNumber, year]
    );

    return res.status(200).json({
      success: true,
      month: monthName || "current month",
      year,
      data: categories,
    });

  } catch (err) {
    console.error("❌ Error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  } finally {
    if (connection) connection.release();
  }
};

// const getAllSalesAndPurchasesYearWise = async (req, res, next) => {
//   try {
//     const year = parseInt(req.query.year) || new Date().getFullYear();
//     console.log("📅 Year received:", year);

//     // 🟦 Fetch monthly total sales (created or updated within the year)
//     const [sales] = await db.query(
//       `
//       SELECT 
//         MONTH(COALESCE(updated_at, created_at)) AS month, 
//         SUM(Total_Amount) AS total_sales
//       FROM add_sale
//       WHERE 
//         YEAR(created_at) = ? 
//         OR YEAR(updated_at) = ?
//       GROUP BY MONTH(COALESCE(updated_at, created_at))
//       ORDER BY month ASC
//       `,
//       [year, year]
//     );

//     // 🟪 Fetch monthly total purchases (created or updated within the year)
//     const [purchases] = await db.query(
//       `
//       SELECT 
//         MONTH(COALESCE(updated_at, created_at)) AS month, 
//         SUM(Total_Amount) AS total_purchases
//       FROM add_purchase
//       WHERE 
//         YEAR(created_at) = ? 
//         OR YEAR(updated_at) = ?
//       GROUP BY MONTH(COALESCE(updated_at, created_at))
//       ORDER BY month ASC
//       `,
//       [year, year]
//     );

//     // 🧠 Merge results into a map
//     const monthMap = new Map();

//     // Add sales
//     for (const s of sales) {
//       monthMap.set(s.month, {
//         month: s.month,
//         total_sales: s.total_sales || 0,
//         total_purchases: 0,
//       });
//     }

//     // Add/merge purchases
//     for (const p of purchases) {
//       if (monthMap.has(p.month)) {
//         monthMap.get(p.month).total_purchases = p.total_purchases || 0;
//       } else {
//         monthMap.set(p.month, {
//           month: p.month,
//           total_sales: 0,
//           total_purchases: p.total_purchases || 0,
//         });
//       }
//     }

//     // 🧾 Ensure all 12 months exist
//     const allMonths = Array.from({ length: 12 }, (_, i) => i + 1);
//     const combinedData = allMonths.map((month) => {
//       const d = monthMap.get(month) || {
//         total_sales: 0,
//         total_purchases: 0,
//       };
//       return {
//         month: new Date(year, month - 1).toLocaleString("default", {
//           month: "short",
//         }),
//         sales: Number(d.total_sales),
//         purchases: Number(d.total_purchases),
//         profit: Number(d.total_sales) - Number(d.total_purchases),
//       };
//     });

//     return res.status(200).json({
//       success: true,
//       year,
//       data: combinedData,
//     });
//   } catch (err) {
//     console.error("❌ Error getting all sales and purchases year wise:", err);
//     next(err);
//   }
// };

// const getCategoriesWiseItemCount = async (req, res, next) => {
//   let connection;
//   try {
//     connection = await db.getConnection();
//     // Get month name from query (e.g. "October", "November")
//     const monthName = req.query.month || null;

//     // Get year from query (e.g. 2023)
//     const year = parseInt(req.query.year) || new Date().getFullYear();

//     // Map month name to number (1–12)
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

//     let monthNumber;
//     if (monthName) {
//       monthNumber = monthMap[monthName.toLowerCase()];
//       if (!monthNumber) {
//         return res.status(400).json({
//           success: false,
//           message: `Invalid month name: "${monthName}". Please send a valid month name (e.g., "October").`,
//         });
//       }
//     } else {
//       monthNumber = new Date().getMonth() + 1; // Default: current month
//     }

//     console.log(`📅 Month received: ${monthName || "(current month)"} → ${monthNumber}`);

//     // Query: Count items by category for given month
//     const [categories] = await db.query(
//       `
//       SELECT 
//         c.Item_Category,
//         COUNT(i.id) AS total_items
//       FROM add_item i
//       JOIN add_category c ON i.Item_Category = c.Item_Category
//       WHERE MONTH(i.created_at) = ?
//       AND YEAR(i.created_at) = ?
//       GROUP BY c.Item_Category
//       ORDER BY total_items DESC
//       `,
//       [monthNumber, year]
//     );

//     return res.status(200).json({
//       success: true,
//       month: monthName || "current month",
//       year: year,
//       data: categories,
//     });
//   } catch (err) {
//      if(connection){
//       connection.release();
//     }
//     console.error("❌ Error getting categories-wise item count:", err);
//     return res.status(500).json({ message: "Internal Server Error" });
//   }finally{
//     if(connection){
//       connection.release();
//     }
//   }
// };




// const getPartyWiseSalesAndPurchases = async (req, res, next) => {
//   try {
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
//     const [sales] = await db.query(
//   `
//   SELECT s.Party_Id, p.Party_Name, SUM(s.Total_Amount) AS total_sales
//   FROM add_sale s
//   JOIN add_party p ON p.Party_Id = s.Party_Id
//   WHERE 
//     (MONTH(s.created_at) = ? AND YEAR(s.created_at) = ?)
//     OR
//     (MONTH(s.updated_at) = ? AND YEAR(s.updated_at) = ?)
//   GROUP BY s.Party_Id, p.Party_Name
//   `,
//   [currentMonth, currentYear, currentMonth, currentYear]
// );

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
//     const [purchases] = await db.query(
//   `
//   SELECT pr.Party_Id, p.Party_Name, SUM(pr.Total_Amount) AS total_purchases
//   FROM add_purchase pr
//   JOIN add_party p ON p.Party_Id = pr.Party_Id
//   WHERE 
//     (MONTH(pr.created_at) = ? AND YEAR(pr.created_at) = ?)
//     OR
//     (MONTH(pr.updated_at) = ? AND YEAR(pr.updated_at) = ?)
//   GROUP BY pr.Party_Id, p.Party_Name
//   `,
//   [currentMonth, currentYear, currentMonth, currentYear]
// );

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
//     console.error("❌ Error getting party-wise sales and purchases:", err);
//     next(err);
//     // return res.status(500).json({ message: "Internal Server Error" });
//   }
// };
const getPartyWiseSalesAndPurchases = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();
    const now = new Date();
    //const currentMonth = now.getMonth() + 1; // JS months are 0-based
    // const currentYear = now.getFullYear();

       const monthName = req.query.month || null;
       const currentYear= parseInt(req.query.year) || new Date().getFullYear();
    // 🔹 1️⃣ Fetch total sales per party for current month
    const monthMap = {
      january: 1,
      february: 2,
      march: 3,
      april: 4,
      may: 5,
      june: 6,
      july: 7,
      august: 8,
      september: 9,
      october: 10,
      november: 11,
      december: 12,
    };

    let currentMonth;
    if (monthName) {
      currentMonth = monthMap[monthName.toLowerCase()];
      if (!currentMonth) {
        return res.status(400).json({
          success: false,
          message: `Invalid month name: "${monthName}". Please send a valid month name (e.g., "October").`,
        });
      }
    } else {
      currentMonth = new Date().getMonth() + 1; // Default: current month
    }
    // const [sales] = await db.query(
    //   `
    //   SELECT s.Party_Id, p.Party_Name, SUM(s.Total_Amount) AS total_sales
    //   FROM add_sale s
    //   JOIN add_party p ON p.Party_Id = s.Party_Id
    //   WHERE MONTH(s.created_at) = ? AND YEAR(s.created_at) = ?
    //   GROUP BY s.Party_Id, p.Party_Name
    //   `,
    //   [currentMonth, currentYear]
    // );
      const [sales] = await db.query(
      `
      SELECT s.Party_Id, p.Party_Name, SUM(s.Total_Amount) AS total_sales
      FROM add_sale s
      JOIN add_party p ON p.Party_Id = s.Party_Id
      WHERE MONTH(s.Invoice_Date) = ? AND YEAR(s.Invoice_Date) = ?
      GROUP BY s.Party_Id, p.Party_Name
      `,
      [currentMonth, currentYear]
    );

    // 🔹 2️⃣ Fetch total purchases per party for current month
    // const [purchases] = await db.query(
    //   `
    //   SELECT pr.Party_Id, p.Party_Name, SUM(pr.Total_Amount) AS total_purchases
    //   FROM add_purchase pr
    //   JOIN add_party p ON p.Party_Id = pr.Party_Id
    //   WHERE MONTH(pr.created_at) = ? AND YEAR(pr.created_at) = ?
    //   GROUP BY pr.Party_Id, p.Party_Name
    //   `,
    //   [currentMonth, currentYear]
    // );
      const [purchases] = await db.query(
      `
      SELECT pr.Party_Id, p.Party_Name, SUM(pr.Total_Amount) AS total_purchases
      FROM add_purchase pr
      JOIN add_party p ON p.Party_Id = pr.Party_Id
      WHERE MONTH(pr.Bill_Date) = ? AND YEAR(pr.Bill_Date) = ?
      GROUP BY pr.Party_Id, p.Party_Name
      `,
      [currentMonth, currentYear]
    );

    // 🔹 3️⃣ Merge both sales and purchase results
    const combinedMap = {};

    // Add sales data
    for (const s of sales) {
      combinedMap[s.Party_Id] = {
        partyId: s.Party_Id,
        partyName: s.Party_Name,
        totalSales: s.total_sales || 0,
        totalPurchases: 0,
      };
    }

    // Merge purchase data
    for (const p of purchases) {
      if (combinedMap[p.Party_Id]) {
        combinedMap[p.Party_Id].totalPurchases = p.total_purchases || 0;
      } else {
        combinedMap[p.Party_Id] = {
          partyId: p.Party_Id,
          partyName: p.Party_Name,
          totalSales: 0,
          totalPurchases: p.total_purchases || 0,
        };
      }
    }

    // 🔹 4️⃣ Calculate profit and transform into array
    const combined = Object.values(combinedMap).map((entry) => ({
      partyId: entry.partyId,
      partyName: entry.partyName,
      totalSales: Number(entry.totalSales) || 0,
      totalPurchases: Number(entry.totalPurchases) || 0,
      profit: (Number(entry.totalSales) || 0) - (Number(entry.totalPurchases) || 0),
    }));

    // 🔹 5️⃣ Sort by profit descending
    combined.sort((a, b) => b.profit - a.profit);

    // ✅ 6️⃣ Send response
    return res.status(200).json({
      success: true,
      month: currentMonth,
      year: currentYear,
      totalParties: combined.length,
      data: combined,
    });
  } catch (err) {
    if (connection) {
      connection.release();
    }
    console.error("❌ Error getting party-wise sales and purchases:", err);
    next(err);
    // return res.status(500).json({ message: "Internal Server Error" });
  }finally{
    if(connection){
      connection.release();
    }
  }
};


const eachItemHistory = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();
    // Fetch all purchase records
    const [purchaseItems] = await db.query(`
      SELECT * FROM add_purchase_items
      ORDER BY Item_Id ASC, created_at DESC
    `);

    // Fetch all sale records
    const [saleItems] = await db.query(`
      SELECT * FROM add_sale_items
      ORDER BY Item_Id ASC, created_at DESC
    `);

    // Use a Map to group by Item_Id
    const combinedEachItemSalePurchase = new Map();

    // Group purchase items
    for (const item of purchaseItems) {
      if (!combinedEachItemSalePurchase.has(item.Item_Id)) {
        combinedEachItemSalePurchase.set(item.Item_Id, {
          Item_Id: item.Item_Id,
          Item_Name: item.Item_Name,
          purchases: [],
          sales: [],
        });
      }
      combinedEachItemSalePurchase.get(item.Item_Id).purchases.push(item);
    }

    // Group sale items
    for (const item of saleItems) {
      if (!combinedEachItemSalePurchase.has(item.Item_Id)) {
        combinedEachItemSalePurchase.set(item.Item_Id, {
          Item_Id: item.Item_Id,
          Item_Name: item.Item_Name,
          purchases: [],
          sales: [],
        });
      }
      combinedEachItemSalePurchase.get(item.Item_Id).sales.push(item);
    }

    // Convert map → array for response
    const result = Array.from(combinedEachItemSalePurchase.values());

    return res.status(200).json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (err) {
       if(connection){
      connection.release();
    }
    console.error("❌ Error getting item history:", err);
    next(err);
  }finally{
    if(connection){
      connection.release();
    }
  }
};


const getItemsSoldCount = async (req, res, next) => {
  let connection;
  try {
    // Fetch all sale records with count
    const [saleItems] = await db.query(`
      SELECT 
        add_item.Item_Id,
        add_item.Item_Name,
        COUNT(add_sale_items.Item_Id) as sold_count
      FROM add_item 
      LEFT JOIN add_sale_items
        ON add_item.Item_Id = add_sale_items.Item_Id
      GROUP BY add_item.Item_Id, add_item.Item_Name
    `);

    return res.status(200).json({
      success: true,
      data: saleItems,
    });
  } catch (err) {
     if(connection){
      connection.release();
    }
    console.error("❌ Error getting items sold count:", err);
    next(err);
  }finally{
    if(connection){
      connection.release();
    }
  }
}
const getPartyWiseItemsSoldAndPurchased = async (req, res, next) => {
  let connection;
  try{
connection = await db.getConnection();
    // const partyId=req.params.partyId;
    const combinedPartyWiseSaleAndPurchase = new Map();
    const[saleItems]=await connection.query(
      `SELECT s.*,
       ap.Party_Name
      FROM add_sale s
      LEFT JOIN add_party ap ON ap.Party_Id = s.Party_Id
      ORDER BY s.Party_Id ASC, s.created_at DESC
      `)
    
    const [purchaseItems] = await connection.query(
      `SELECT 
         p.*,
         ap.Party_Name
       FROM add_purchase p
       LEFT JOIN add_party ap ON ap.Party_Id = p.Party_Id
       ORDER BY p.Party_Id ASC, p.created_at DESC
      `
    )
    saleItems.forEach((item)=>{
      if (!combinedPartyWiseSaleAndPurchase.has(item.Party_Id)) {
        combinedPartyWiseSaleAndPurchase.set(item.Party_Id, {
          Party_Id: item.Party_Id,
          Party_Name: item.Party_Name,
          sales: [],
          purchases: [],
        });
      }
      combinedPartyWiseSaleAndPurchase.get(item.Party_Id).sales.push(item);
    })
    purchaseItems.forEach((item)=>{
      if (!combinedPartyWiseSaleAndPurchase.has(item.Party_Id)) {
        combinedPartyWiseSaleAndPurchase.set(item.Party_Id, {
          Party_Id: item.Party_Id,
          Party_Name: item.Party_Name,
          sales: [],
          purchases: [],
        });
      }
      combinedPartyWiseSaleAndPurchase.get(item.Party_Id).purchases.push(item);
    })

        
    return res.status(200).json({
      success: true,
      data: Array.from(combinedPartyWiseSaleAndPurchase.values()),
    });
  }catch(err){  
    if(connection){
      connection.release();
    }
    console.error("❌ Error getting items sold count:", err);
    next(err);
  }finally{
    if(connection){
      connection.release();
    }
  }
}


// const rankPartyWiseSalesAndPurchases=async (req, res, next) => {
//   let connection;

//   try{

//     const combinedPartyWiseSaleAndPurchase = new Map();
//     const[saleItems]=await db.query(
//       `SELECT 
//     p.Party_Name,
//     SUM(s.Total_Amount) AS total_sales
// FROM add_sale s
// JOIN add_party p
// ON s.Party_Id = p.Party_Id
// GROUP BY s.Party_Id
// ORDER BY total_sales DESC
      
//       `)
    
//     const [purchaseItems] = await db.query(
//       `SELECT 
//     p.Party_Name,
//     SUM(pu.Total_Amount) AS total_purchase
// FROM add_purchase pu
// JOIN add_party p
// ON pu.Party_Id = p.Party_Id
// GROUP BY pu.Party_Id
// ORDER BY total_purchase DESC
       
//       `
//     )
// // console.log(saleItems);
// // console.log(purchaseItems);
//         // saleItems.forEach((item)=>{
//         //   if (!combinedPartyWiseSaleAndPurchase.has(item.Party_Id)) {
//         //     combinedPartyWiseSaleAndPurchase.set(item.Party_Id, {
//         //       Party_Id: item.Party_Id,
//         //       Party_Name: item.Party_Name,
//         //       sales: [],
//         //       purchases: [],
//         //     });
//         //   }
//         //   combinedPartyWiseSaleAndPurchase.get(item.Party_Id).sales.push(item);
//         // })
//         // purchaseItems.forEach((item)=>{
//         //   if (!combinedPartyWiseSaleAndPurchase.has(item.Party_Id)) {
//         //     combinedPartyWiseSaleAndPurchase.set(item.Party_Id, {
//         //       Party_Id: item.Party_Id,
//         //       Party_Name: item.Party_Name,
//         //       sales: [],
//         //       purchases: [],
//         //     });
//         //   }
//         //   combinedPartyWiseSaleAndPurchase.get(item.Party_Id).purchases.push(item);
//         // })

//         saleItems.forEach((item)=>{
//           combinedPartyWiseSaleAndPurchase.set(item.Party_Name, {
           
//             Party_Name: item.Party_Name,
//             sales: item.total_sales,
//             purchases: 0,
//           });
//         })
//         purchaseItems.forEach((item)=>{
//           combinedPartyWiseSaleAndPurchase.set(item.Party_Name, {
           
//             Party_Name: item.Party_Name,
//             sales: 0,
//             purchases: item.total_purchase,
//           });
//         })

//         //console.log("combinedPartyWiseSaleAndPurchase",combinedPartyWiseSaleAndPurchase);
//     return res.status(200).json({
//       success: true,
//       // saleItems,
//       // purchaseItems
//       data: Array.from(combinedPartyWiseSaleAndPurchase.values()),
//       // data: Array.from(combinedPartyWiseSaleAndPurchase.values()),
//     })

//   }
//   catch(err){  
//     if(connection){
//       connection.release();
//     }
//     console.error("❌ Error getting items sold count:", err);
//     next(err);
//   }finally{
//     if(connection){
//       connection.release();
//     }
//   }
// }

// const getItemsSoldAndPurchasedCountWise = async (req, res, next) => {

//   try {

//     const combinedPartyWiseSaleAndPurchase = new Map();

//     const [saleItems] = await db.query(`
//       SELECT 
//         i.Item_Name,
//         COUNT(i.Item_Id) AS total_sales
//       FROM add_item i
//       JOIN add_sale_items s ON s.Item_Id = i.Item_Id
//       GROUP BY s.Item_Id, i.Item_Name
//       ORDER BY total_sales DESC
//     `);

//     const [purchaseItems] = await db.query(`
//       SELECT 
//         i.Item_Name,
//         COUNT(i.Item_Id) AS total_purchases
//       FROM add_item i
//       JOIN add_purchase_items p ON p.Item_Id = i.Item_Id
//       GROUP BY p.Item_Id, i.Item_Name
//       ORDER BY total_purchases DESC
//     `);

//     saleItems.forEach((item) => {
//       combinedPartyWiseSaleAndPurchase.set(item.Item_Name, {
//         Item_Name: item.Item_Name,
//         sales: item.total_sales,
//         purchases: 0,
//       });
//     });

//     purchaseItems.forEach((item) => {

//       if (combinedPartyWiseSaleAndPurchase.has(item.Item_Name)) {

//         const existing = combinedPartyWiseSaleAndPurchase.get(item.Item_Name);
//         existing.purchases = item.total_purchases;

//       } else {

//         combinedPartyWiseSaleAndPurchase.set(item.Item_Name, {
//           Item_Name: item.Item_Name,
//           sales: 0,
//           purchases: item.total_purchases,
//         });

//       }

//     });

//     return res.status(200).json({
//       success: true,
//       data: Array.from(combinedPartyWiseSaleAndPurchase.values()),
//     });

//   } catch (err) {

//     console.error("❌ Error getting items sold count:", err);
//     next(err);

//   }

// };


// const currentStockOfItems = async (req, res, next) => {
//   let connection;

//   try {
//     connection = await db.getConnection();

//     const [items] = await connection.query(`
//       SELECT 
//           i.Item_Id,
//           i.Item_Name,

//           COALESCE(p.total_purchased,0) AS total_purchased,
//           COALESCE(s.total_sold,0) AS total_sold,

//           COALESCE(p.total_purchased,0) - COALESCE(s.total_sold,0) AS current_stock

//       FROM add_item i

//       LEFT JOIN (
//           SELECT Item_Id, SUM(Quantity) total_sold
//           FROM add_sale_items
//           GROUP BY Item_Id
//       ) s ON i.Item_Id = s.Item_Id

//       LEFT JOIN (
//           SELECT Item_Id, SUM(Quantity) total_purchased
//           FROM add_purchase_items
//           GROUP BY Item_Id
//       ) p ON i.Item_Id = p.Item_Id
//     `);

//     res.status(200).json({
//       success: true,
//       data: items
//     });

//   } catch (err) {
//     console.error("❌ Error:", err);
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };


const itemsProfitRankWise = async (req, res, next) => {
  let connection;

  try {
    connection = await db.getConnection();

    const [items] = await connection.query(`
      WITH items AS (
        SELECT 
          i.Item_Name,
          i.Item_Id,
          COALESCE(s.total_sold,0) AS total_sold,
          COALESCE(p.total_purchased,0) AS total_purchased,
          COALESCE(p.total_purchased,0) - COALESCE(s.total_sold,0) AS total_profit
        FROM add_item i

        LEFT JOIN (
          SELECT Item_Id, SUM(Amount) AS total_sold
          FROM add_sale_items
          GROUP BY Item_Id
        ) s 
        ON i.Item_Id = s.Item_Id

        LEFT JOIN (
          SELECT Item_Id, SUM(Amount) AS total_purchased
          FROM add_purchase_items
          GROUP BY Item_Id
        ) p 
        ON i.Item_Id = p.Item_Id
      )

      SELECT 
        Item_Name,
        total_sold,
        total_purchased,
        total_profit,
        ROW_NUMBER() OVER (ORDER BY total_profit DESC) AS rank
      FROM items
    `);

    res.status(200).json({
      success: true,
      data: items
    });

  } catch (err) {
    console.error("❌ Error:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

//SUM OF ALL PAYABLES LEFT
const getTotalPayablesLeft = async (req, res, next) => {
  let connection;

  try {
    connection = await db.getConnection();

    // total payable amount
    const [totalPayablesLeft] = await connection.query(`
      SELECT COALESCE(SUM(Balance_Due),0) AS total_payables_left
      FROM add_purchase
      WHERE Balance_Due > 0
    `);

    // number of parties with payable
    const [totalParties] = await connection.query(`
      SELECT COUNT(DISTINCT Party_Id) AS total_parties
      FROM add_purchase
      WHERE Balance_Due > 0
    `);

    return res.status(200).json({
      success: true,
      total_payables_left: totalPayablesLeft[0].total_payables_left,
      total_parties: totalParties[0].total_parties
    });

  } catch (err) {
    console.error("❌ Error:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};
//SUM OF ALL RECEIVABLES LEFT
const getTotalReceivablesLeft = async (req, res, next) => {
  let connection;

  try {
    connection = await db.getConnection();

    // total receivable amount
    const [totalReceivablesLeft] = await connection.query(`
      SELECT COALESCE(SUM(Balance_Due),0) AS total_receivables_left
      FROM add_sale
      WHERE Balance_Due > 0
    `);

    // number of parties with receivables
    const [totalParties] = await connection.query(`
      SELECT COUNT(DISTINCT Party_Id) AS total_parties
      FROM add_sale
      WHERE Balance_Due > 0
    `);

    return res.status(200).json({
      success: true,
      total_receivables_left: totalReceivablesLeft[0].total_receivables_left,
      total_parties: totalParties[0].total_parties
    });

  } catch (err) {
    console.error("❌ Error:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

// const rankPartyWiseSalesAndPurchases = async (req, res, next) => {
//   let connection;

//   try {
//     connection = await db.getConnection();

//     /* ================= TOP CUSTOMERS ================= */

//     const [topCustomers] = await connection.query(`
//       SELECT 
//         p.Party_Id,
//         p.Party_Name,
//         SUM(s.Total_Amount) AS total_sales,
//         RANK() OVER (ORDER BY SUM(s.Total_Amount) DESC) AS rank
//       FROM add_sale s
      
//       JOIN add_party p ON p.Party_Id = s.Party_Id
//       GROUP BY p.Party_Id, p.Party_Name
//       ORDER BY total_sales DESC
//     `);

//     /* ================= TOP SUPPLIERS ================= */

//     const [topSuppliers] = await connection.query(`
//       SELECT 
//         p.Party_Id,
//         p.Party_Name,
//         SUM(pu.Total_Amount) AS total_purchases,
//         RANK() OVER (ORDER BY SUM(pu.Total_Amount) DESC) AS rank
//       FROM add_purchase pu
//       JOIN add_party p ON p.Party_Id = pu.Party_Id
//       GROUP BY p.Party_Id, p.Party_Name
//       ORDER BY total_purchases DESC
//     `);

 

    

//     /* ================= RESPONSE ================= */

//     res.status(200).json({
//       success: true,
//       message: "Party ranking and ledger fetched successfully",
//       data: {
//         topCustomers,
//         topSuppliers
        
//       },
//     });

//   } catch (err) {
//     console.error("❌ Error fetching party rankings:", err);
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };
export { getAllSalesAndPurchasesYearWise ,
  getCategoriesWiseItemCount,
  getTotalSalesPurchasesReceivablesPayablesProfit,
  getPartyWiseSalesAndPurchases,eachItemHistory,

  getItemsSoldCount,
  getPartyWiseItemsSoldAndPurchased,
  itemsProfitRankWise,
  getTotalPayablesLeft,
  getTotalReceivablesLeft};