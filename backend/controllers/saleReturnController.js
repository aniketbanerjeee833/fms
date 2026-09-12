

import db from "../config/db.js";
import { getSaleReturnsForPrint } from "../helpers/printReportHelpers.js";
import { syncUnitIdsForItem, syncUnitIdsForSaleReturnItem } from "../helpers/unitSyncHelper.js";
import { recordItemLedger, reverseItemLedger } from "../utils/itemLedgerHelper.js";
import { recordPartyLedger, reversePartyLedger } from "../utils/partyLedgerHelper.js";
import { validateSplits, insertPaymentSplits, deletePaymentSplits } from "../utils/paymentSplitHelper.js";
import { resolveUnitAndStockDelta } from "../utils/resolveUnitAndStockDelta.js";
import ExcelJS from "exceljs";
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
// const getAllSaleReturns = async (req, res, next) => {
//   let connection;
//   try {
//     connection = await db.getConnection();

//     const page = parseInt(req.query.page, 10) || 1;
//     const limit = 10;
//     const offset = (page - 1) * limit;
//     const search = req.query.search?.trim().toLowerCase() || "";
//     const fromDate = req.query.fromDate || null;
//     const toDate = req.query.toDate || null;

//     const whereClauses = [];
//     const params = [];

//     // if (search) {
//     //   whereClauses.push(`(
//     //     LOWER(p.Party_Name)      LIKE ? OR
//     //     LOWER(sr.Return_Number)  LIKE ? OR
//     //     LOWER(sr.Invoice_Number) LIKE ? OR
//     //     CAST(sr.Total_Amount AS CHAR) LIKE ? OR
//     //     CAST(sr.Balance_Due AS CHAR) LIKE ? OR
//     //     CAST(sr.Total_Paid AS CHAR) LIKE ?
//     //   )`);
//     //   const like = `%${search}%`;
//     //   params.push(like, like, like, like, like, like);
//     // }

//     if (search) {
//       whereClauses.push(`(
//         p.Party_Name     LIKE ? OR
//         sr.Return_Number  LIKE ? OR
//         sr.Invoice_Number LIKE ? OR
//         CAST(sr.Total_Amount AS CHAR) LIKE ? OR
//         CAST(sr.Balance_Due AS CHAR) LIKE ? OR
//         CAST(sr.Total_Paid AS CHAR) LIKE ?
//       )`);
//       const like = `%${search}%`;
//       params.push(like, like, like, like, like, like);
//     }

//     if (fromDate && toDate) {
//       whereClauses.push(`DATE(sr.Return_Date) BETWEEN ? AND ?`);
//       params.push(fromDate, toDate);
//     } else if (fromDate) {
//       whereClauses.push(`DATE(sr.Return_Date) >= ?`);
//       params.push(fromDate);
//     } else if (toDate) {
//       whereClauses.push(`DATE(sr.Return_Date) <= ?`);
//       params.push(toDate);
//     }

//     const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";
//     //ORDER BY sr.created_at DESC
//     const [rows] = await connection.query(
//       `SELECT sr.*, p.Party_Name
//        FROM sale_return sr
//        LEFT JOIN add_party p ON p.Party_Id = sr.Party_Id
//        ${whereSQL}
//        ORDER BY sr.Invoice_Date DESC
//        LIMIT ? OFFSET ?`,
//       [...params, limit, offset]
//     );

//     // 🔹 attach Payment_Type_Display per row from splits
//     for (const row of rows) {
//       const [splits] = await connection.query(
//         `SELECT ps.Payment_Type, ba.Account_Display_Name
//          FROM payment_splits ps
//          LEFT JOIN bank_accounts ba ON ba.id = ps.Bank_Account_Id
//          WHERE ps.Source_Type = 'Sale_Return' AND ps.Source_Id = ?`,
//         [row.id]
//       );
//       const labels = splits.map((s) =>
//         s.Payment_Type === "Bank" ? s.Account_Display_Name : s.Payment_Type
//       );
//       const counts = {};
//       labels.forEach((l) => (counts[l] = (counts[l] || 0) + 1));
//       row.Payment_Type_Display = Object.entries(counts)
//         .map(([label, count]) => (count > 1 ? `${label} (x${count})` : label))
//         .join(",") || "—";
//     }

//     const [[{ total }]] = await connection.query(
//       `SELECT COUNT(*) AS total
//        FROM sale_return sr
//        LEFT JOIN add_party p ON p.Party_Id = sr.Party_Id
//        ${whereSQL}`,
//       params
//     );

//     const [[totals]] = await connection.query(
//       `SELECT
//          COALESCE(SUM(sr.Total_Amount), 0) AS totalAmount,
//          COALESCE(SUM(sr.Total_Paid),   0) AS totalPaid,
//          COALESCE(SUM(sr.Balance_Due),  0) AS totalBalance
//        FROM sale_return sr
//        LEFT JOIN add_party p ON p.Party_Id = sr.Party_Id
//        ${whereSQL}`,
//       params
//     );

//     return res.status(200).json({
//       success: true,
//       currentPage: page,
//       totalPages: Math.ceil(total / limit),
//       totalReturns: total,
//       saleReturns: rows,
//       totals,
//     });
//   } catch (err) {
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };
const getAllSaleReturns = async (req, res, next) => {
  let connection;

  try {
    connection = await db.getConnection();

    /* ---------- CURSOR PAGINATION ---------- */

    const limit = Math.min(
      parseInt(req.query.limit, 10) || 10,
      200
    );

    let cursorDate = null;
    let cursorId = null;

    const cursorRaw = req.query.cursor || null;

    if (cursorRaw) {
      try {
        const decoded = JSON.parse(
          Buffer.from(cursorRaw, "base64").toString("utf8")
        );

        cursorDate = decoded.date || null;
        cursorId = decoded.id ? Number(decoded.id) : null;
      } catch {
        return res.status(400).json({
          success: false,
          message: "Invalid cursor.",
        });
      }
    }

    /* ---------- FILTERS ---------- */

    const search =
      req.query.search?.trim().toLowerCase() || "";

    const fromDate =
      req.query.fromDate || null;

    const toDate =
      req.query.toDate || null;

    // 🔹 FILTER-ONLY clauses — used by BOTH the main query and the
    //    count/totals query. Cursor is deliberately kept separate
    //    below so it never leaks into count/totals.
    const filterClauses = [];
    const filterParams = [];

    /* ---------- SEARCH ---------- */

    if (search) {
      filterClauses.push(`(
        p.Party_Name                    LIKE ? OR
        sr.Return_Number                LIKE ? OR
        sr.Invoice_Number               LIKE ? OR
        CAST(sr.Total_Amount AS CHAR)   LIKE ? OR
        CAST(sr.Balance_Due AS CHAR)    LIKE ? OR
        CAST(sr.Total_Paid AS CHAR)     LIKE ?
      )`);

      const like = `%${search}%`;

      filterParams.push(
        like,
        like,
        like,
        like,
        like,
        like
      );
    }

    /* ---------- DATE FILTER ---------- */

    if (fromDate && toDate) {
      filterClauses.push(
        `DATE(sr.Return_Date) BETWEEN ? AND ?`
      );

      filterParams.push(
        fromDate,
        toDate
      );

    } else if (fromDate) {
      filterClauses.push(
        `DATE(sr.Return_Date) >= ?`
      );

      filterParams.push(fromDate);

    } else if (toDate) {
      filterClauses.push(
        `DATE(sr.Return_Date) <= ?`
      );

      filterParams.push(toDate);
    }

    /* ---------- CURSOR CONDITION (kept separate from filters) ---------- */

    const cursorClauses = [];
    const cursorParams = [];

    if (cursorDate && cursorId) {
      cursorClauses.push(`(
        sr.Invoice_Date < ?
        OR (
          sr.Invoice_Date = ?
          AND sr.id < ?
        )
      )`);

      cursorParams.push(
        cursorDate,
        cursorDate,
        cursorId
      );
    }

    /* ---------- MAIN QUERY WHERE (filters + cursor) ---------- */

    const mainWhereClauses = [
      ...filterClauses,
      ...cursorClauses,
    ];

    const mainParams = [
      ...filterParams,
      ...cursorParams,
    ];

    const mainWhereSQL = mainWhereClauses.length
      ? `WHERE ${mainWhereClauses.join(" AND ")}`
      : "";

    /* ---------- COUNT/TOTALS WHERE (filters ONLY, no cursor) ---------- */

    const countWhereSQL = filterClauses.length
      ? `WHERE ${filterClauses.join(" AND ")}`
      : "";

    /* ---------- MAIN QUERY ----------
       Fetch limit + 1 to detect hasMore
    ---------- */

    const [rows] = await connection.query(
      `SELECT
         sr.*,
         p.Party_Name

       FROM sale_return sr

       LEFT JOIN add_party p
         ON p.Party_Id = sr.Party_Id

       ${mainWhereSQL}

       ORDER BY
         sr.Invoice_Date DESC,
         sr.id DESC

       LIMIT ?`,
      [
        ...mainParams,
        limit + 1
      ]
    );

    /* ---------- DETECT hasMore ---------- */

    const hasMore = rows.length > limit;

    const pageRows = hasMore
      ? rows.slice(0, limit)
      : rows;

    /* ---------- BUILD NEXT CURSOR ---------- */

    let nextCursor = null;

    if (hasMore && pageRows.length > 0) {
      const last =
        pageRows[pageRows.length - 1];

      nextCursor = Buffer.from(
        JSON.stringify({
          date: last.Invoice_Date,
          id: last.id,
        })
      ).toString("base64");
    }

    /* ---------- ATTACH SPLIT PAYMENT-TYPE LABELS ---------- */

    const saleReturnIds = pageRows.map(
      (row) => row.id
    );

    if (saleReturnIds.length > 0) {
      const placeholders = saleReturnIds
        .map(() => "?")
        .join(",");

      const [splits] =
        await connection.query(
          `SELECT
             ps.Source_Id,
             ps.Payment_Type,
             ba.Account_Display_Name

           FROM payment_splits ps

           LEFT JOIN bank_accounts ba
             ON ba.id = ps.Bank_Account_Id

           WHERE ps.Source_Type = 'Sale_Return'

             AND ps.Source_Id IN (${placeholders})`,
          saleReturnIds
        );

      const splitMap = {};

      for (const s of splits) {
        if (!splitMap[s.Source_Id]) {
          splitMap[s.Source_Id] = [];
        }

        splitMap[s.Source_Id].push(
          s.Payment_Type === "Bank"
            ? s.Account_Display_Name
            : s.Payment_Type
        );
      }

      for (const row of pageRows) {
        const labels =
          splitMap[row.id] || [];

        const counts = {};

        labels.forEach((label) => {
          counts[label] =
            (counts[label] || 0) + 1;
        });

        row.Payment_Type_Display =
          Object.entries(counts)
            .map(
              ([label, count]) =>
                count > 1
                  ? `${label} (x${count})`
                  : label
            )
            .join(",") || "—";
      }
    }

    /* ---------- COUNT + TOTALS — merged into ONE query ----------
       Ignores cursor condition (uses countWhereSQL / filterParams only),
       so it always reflects the full filtered set regardless of
       which page is currently loaded.
    ---------- */

    const [[combined]] =
      await connection.query(
        `SELECT
           COUNT(*) AS total,

           COALESCE(
             SUM(sr.Total_Amount),
             0
           ) AS totalAmount,

           COALESCE(
             SUM(sr.Total_Paid),
             0
           ) AS totalPaid,

           COALESCE(
             SUM(sr.Balance_Due),
             0
           ) AS totalBalance

         FROM sale_return sr

         LEFT JOIN add_party p
           ON p.Party_Id = sr.Party_Id

         ${countWhereSQL}`,
        filterParams
      );

    const total = combined.total;

    const totals = {
      totalAmount: combined.totalAmount,
      totalPaid: combined.totalPaid,
      totalBalance: combined.totalBalance,
    };

    /* ---------- RESPONSE ---------- */

    return res.status(200).json({
      success: true,

      saleReturns: pageRows,

      hasMore,

      nextCursor,

      totalReturns: total,

      totals,
    });

  } catch (err) {
    console.error(
      "❌ Error fetching sale returns:",
      err
    );

    next(err);

  } finally {
    if (connection) {
      connection.release();
    }
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
     sr.Round_Off,
     sr.Total_Paid,
     sr.Balance_Due,
     sr.Transaction_Discount_Percentage,
    sr.Transaction_Discount_Amount,
     sr.Party_Id,
     a.Party_Name,
     a.GSTIN,
         a.State,
          a.Phone_Number,
    
          (
  SELECT pa.Address_Text
  FROM add_party_addresses pa
  WHERE pa.Party_Id = sr.Party_Id
    AND pa.Address_Type = 'Billing'
    AND pa.Is_Default = 1
) AS Billing_Address
         
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

    //   const [items] = await connection.query(
    //     `
    // SELECT
    //     sri.id,

    //     sri.Item_Id,

    //     i.Item_Name,
    //     i.Item_HSN,
    //     i.Item_Unit,
    //     i.Item_Category,

    //     -- CURRENT MASTER
    //     i.Primary_Unit AS Current_Primary_Unit,
    //     i.Secondary_Unit AS Current_Secondary_Unit,
    //     i.Conversion_Rate,

    //     sri.Quantity,

    //     -- HISTORICAL SNAPSHOT (FROM UNIT IDS)
    //     pu1.Unit_Shorthand AS Primary_Unit_Snapshot,
    //     pu2.Unit_Shorthand AS Secondary_Unit_Snapshot,
    //     pu3.Unit_Shorthand AS Selected_Unit,

    //     sri.Sale_Price,
    //     sri.Discount_On_Sale_Price,
    //     sri.Discount_Type_On_Sale_Price,
    //     sri.Tax_Amount,
    //     sri.Tax_Type,
    //     sri.Amount,
    //     sri.created_at

    // FROM sale_return_items sri

    // LEFT JOIN add_item i
    //   ON sri.Item_Id = i.Item_Id

    // LEFT JOIN units pu1
    //   ON pu1.id = sri.Primary_Unit_Snapshot_Id

    // LEFT JOIN units pu2
    //   ON pu2.id = sri.Secondary_Unit_Snapshot_Id

    // LEFT JOIN units pu3
    //   ON pu3.id = sri.Selected_Unit_Id

    // WHERE sri.Sale_Return_Id = ?

    // ORDER BY sri.created_at DESC
    // `,
    //     [Sale_Return_Id]
    //   );
    const [items] = await connection.query(
      `
  SELECT
    sri.id,
    sri.Item_Id,

    i.Item_Name,
    i.Item_HSN,
    i.Item_Category,
    i.Discount_On_MRP_For_Sale AS Current_MRP_Discount,

    -- CURRENT MASTER UNITS FROM IDs
    iu.Unit_Shorthand AS Item_Unit,
    cpu.Unit_Shorthand AS Current_Primary_Unit,
    csu.Unit_Shorthand AS Current_Secondary_Unit,

    i.Conversion_Rate,

    sri.Quantity,

    -- HISTORICAL SNAPSHOT UNITS FROM IDS
    pu1.Unit_Shorthand AS Primary_Unit_Snapshot,
    pu2.Unit_Shorthand AS Secondary_Unit_Snapshot,
    pu3.Unit_Shorthand AS Selected_Unit,
        sri.MRP,
      sri.Discount_On_MRP_For_Sale_Percentage,
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

  -- HISTORICAL SNAPSHOT UNITS
  LEFT JOIN units pu1
    ON pu1.id = sri.Primary_Unit_Snapshot_Id

  LEFT JOIN units pu2
    ON pu2.id = sri.Secondary_Unit_Snapshot_Id

  LEFT JOIN units pu3
    ON pu3.id = sri.Selected_Unit_Id

  -- CURRENT MASTER UNITS
  LEFT JOIN units cpu
    ON i.Primary_Unit_Id = cpu.id

  LEFT JOIN units csu
    ON i.Secondary_Unit_Id = csu.id

  LEFT JOIN units iu
    ON i.Item_Unit_Id = iu.id

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

      const currentPrimary = it.Current_Primary_Unit || null;

      const currentSecondary = it.Current_Secondary_Unit || null;
      const hasHistoricalMRP = it.MRP !== null && Number(it.MRP) > 0;
      const price = Number(it.Sale_Price || 0);
      let discountAmount = 0;

      if (Number(it.Discount_On_Sale_Price || 0) > 0) {
        if (it.Discount_Type_On_Sale_Price === "Percentage") {
          discountAmount =
            (price * Number(it.Discount_On_Sale_Price)) / 100;
        } else {
          discountAmount = Number(
            it.Discount_On_Sale_Price
          );
        }
      }
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
        Conversion_Rate: it.Conversion_Rate !== null
          ? Number(it.Conversion_Rate)
          : 0,
        // Dropdown
        Available_Units: availableUnits,
        MRP: it.MRP,
        Discount_On_MRP_For_Sale_Percentage: it.Discount_On_MRP_For_Sale_Percentage,
        Current_MRP_Discount: it.Current_MRP_Discount,
        hasHistoricalMRP,

        Sale_Price: it.Sale_Price,

        Discount_On_Sale_Price: it.Discount_On_Sale_Price,

        Discount_Type_On_Sale_Price: it.Discount_Type_On_Sale_Price,

        Tax_Type: it.Tax_Type,

        Tax_Amount: it.Tax_Amount,
        Discount_Amount: Number(discountAmount.toFixed(2)),

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
      Transaction_Discount_Percentage,
      Transaction_Discount_Amount,
      Total_Amount,
      Round_Off,
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
    const roundOffValue = Number(Round_Off) || 0

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
    const transactionDiscountPercentage =
      normalizeNumber(Transaction_Discount_Percentage);

    const transactionDiscountAmount =
      normalizeNumber(Transaction_Discount_Amount);
    if (
      transactionDiscountPercentage !== null &&
      transactionDiscountPercentage > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Transaction discount percentage cannot be greater than 100%",
      });
    }

    const cleanTransactionDiscountPercentage =
      transactionDiscountPercentage > 0
        ? transactionDiscountPercentage
        : null;

    const cleanTransactionDiscountAmount =
      transactionDiscountAmount > 0
        ? transactionDiscountAmount
        : null;
        // =========================================================
// RETURN NUMBER PREFIX SEQUENCE
// =========================================================

// let returnNumber = String(Return_Number || "").trim();

// // ---------------------------------------------------------
// // SPECIAL CASE:
// // 000 / 00 / 0000 etc. means blank return number.
// // No error.
// // ---------------------------------------------------------

// if (/^0+$/.test(returnNumber)) {
//   returnNumber = "";
// }


// // ---------------------------------------------------------
// // Only process prefix sequence when return number exists
// // ---------------------------------------------------------

// if (returnNumber) {

//   // Extract trailing numeric part.
//   //
//   // CN1000
//   //   prefix = CN
//   //   number = 1000
//   //
//   // CRN100
//   //   prefix = CRN
//   //   number = 100
//   //
//   // AEPL-2627-0086
//   //   prefix = AEPL-2627-
//   //   number = 0086
//   //
//   // 1000
//   //   prefix = None
//   //   number = 1000

//   const returnMatch = returnNumber.match(/^(.*?)(\d+)$/);

//   if (!returnMatch) {
//     await connection.rollback();

//     return res.status(400).json({
//       success: false,
//       message: "Invalid return number.",
//     });
//   }

//   const returnPrefix = returnMatch[1] || "None";
//   const enteredReturnNumber = Number(returnMatch[2]);

//   if (
//     !Number.isInteger(enteredReturnNumber) ||
//     enteredReturnNumber < 1
//   ) {
//     await connection.rollback();

//     return res.status(400).json({
//       success: false,
//       message: "Return number must contain a valid positive number.",
//     });
//   }


//   // -------------------------------------------------------
//   // Find + LOCK the return prefix row.
//   //
//   // createSaleReturn already started a transaction at the
//   // beginning of this controller.
//   //
//   // FOR UPDATE keeps this prefix row locked until
//   // commit/rollback.
//   // -------------------------------------------------------

//   const [prefixRows] = await connection.execute(
//     `
//     SELECT
//       id,
//       transaction_type,
//       prefix_name,
//       last_number,
//       is_active
//     FROM transactions_prefixes
//     WHERE transaction_type = 'sale_return'
//       AND prefix_name = ?
//     LIMIT 1
//     FOR UPDATE
//     `,
//     [returnPrefix]
//   );


//   // -------------------------------------------------------
//   // Prefix must exist.
//   // -------------------------------------------------------

//   if (prefixRows.length === 0) {
//     await connection.rollback();

//     return res.status(400).json({
//       success: false,
//       message: `Return prefix "${returnPrefix}" does not exist.`,
//     });
//   }


//   const prefixRow = prefixRows[0];

//   const currentLastNumber =
//     Number(prefixRow.last_number) || 0;


//   // -------------------------------------------------------
//   // IMPORTANT:
//   //
//   // NEVER decrease last_number.
//   //
//   // Example:
//   //
//   // last_number = 1000
//   //
//   // CN1    -> stays 1000
//   // CN2    -> stays 1000
//   // CN3    -> stays 1000
//   //
//   // CN1001 -> becomes 1001
//   // -------------------------------------------------------

//   if (enteredReturnNumber > currentLastNumber) {

//     await connection.execute(
//       `
//       UPDATE transactions_prefixes
//       SET last_number = ?
//       WHERE id = ?
//       `,
//       [
//         enteredReturnNumber,
//         prefixRow.id,
//       ]
//     );
//   }
// }
// =========================================================
// RETURN NUMBER PREFIX SEQUENCE
// =========================================================

let returnNumber = String(Return_Number || "").trim();

// ---------------------------------------------------------
// Extract prefix + numeric part
//
// Examples:
//
// 00        -> prefix = None, number = 0
// SAL0      -> prefix = SAL,  number = 0
// SAL00     -> prefix = SAL,  number = 0
// SAL000    -> prefix = SAL,  number = 0
// SAL5      -> prefix = SAL,  number = 5
// SAL100    -> prefix = SAL, number = 100
// AEPL-2627-0086
//           -> prefix = AEPL-2627-
//           -> number = 86
// ---------------------------------------------------------

if (returnNumber) {

  const returnMatch =
    returnNumber.match(/^(.*?)(\d+)$/);

  // -------------------------------------------------------
  // Invalid return number
  // -------------------------------------------------------

  if (!returnMatch) {
    await connection.rollback();

    return res.status(400).json({
      success: false,
      message: "Invalid return number.",
    });
  }

  const returnPrefix =
    returnMatch[1] || "None";

  const numericPart = returnMatch[2];

  const enteredReturnNumber =
    Number(numericPart) || 0;

  // -------------------------------------------------------
  // SPECIAL CASE:
  //
  // SAL0
  // SAL00
  // SAL000
  //
  // means:
  //
  // SAL | empty
  //
  // Store only the prefix.
  //
  // 00 / 000 without a prefix means completely empty.
  // -------------------------------------------------------

  if (/^0+$/.test(numericPart)) {

    if (returnPrefix === "None") {
      // 00 / 000 / 0000
      returnNumber = "";
    } else {

      // SAL0 / SAL00 / SAL000
      //
      // Store only SAL.
      returnNumber = returnPrefix;
    }

  } else {

    // -----------------------------------------------------
    // NORMAL NUMBER
    //
    // SAL5
    // SAL100
    // INV25
    // -----------------------------------------------------

    if (
      !Number.isInteger(enteredReturnNumber) ||
      enteredReturnNumber < 1
    ) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          "Return number must contain a valid positive number.",
      });
    }

    // -----------------------------------------------------
    // Find + LOCK the return prefix row.
    // -----------------------------------------------------

    const [prefixRows] =
      await connection.execute(
        `
        SELECT
          id,
          transaction_type,
          prefix_name,
          last_number,
          is_active
        FROM transactions_prefixes
        WHERE transaction_type = 'sale_return'
          AND prefix_name = ?
        LIMIT 1
        FOR UPDATE
        `,
        [returnPrefix]
      );

    // -----------------------------------------------------
    // Prefix must exist.
    // -----------------------------------------------------

    if (prefixRows.length === 0) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          `Return prefix "${returnPrefix}" does not exist.`,
      });
    }

    const prefixRow = prefixRows[0];

    const currentLastNumber =
      Number(prefixRow.last_number) || 0;

    // -----------------------------------------------------
    // NEVER decrease last_number.
    //
    // Only increase it when the newly entered number
    // is greater than the current last number.
    //
    // SAL5  -> last_number becomes 5 if currently < 5
    // SAL10 -> last_number becomes 10 if currently < 10
    // SAL3  -> stays whatever current value is if >= 3
    // -----------------------------------------------------

    if (
      enteredReturnNumber >
      currentLastNumber
    ) {
      await connection.execute(
        `
        UPDATE transactions_prefixes
        SET last_number = ?
        WHERE id = ?
        `,
        [
          enteredReturnNumber,
          prefixRow.id,
        ]
      );
    }
  }

  // -------------------------------------------------------
  // PREFIX-ONLY VALUE
  //
  // Example:
  //
  // SAL0 -> SAL
  // SAL00 -> SAL
  // SAL000 -> SAL
  //
  // We must make sure the prefix actually exists.
  //
  // Do NOT update last_number.
  // -------------------------------------------------------

  if (
    returnNumber &&
    !/\d+$/.test(returnNumber)
  ) {

    const [prefixRows] =
      await connection.execute(
        `
        SELECT
          id,
          transaction_type,
          prefix_name,
          last_number,
          is_active
        FROM transactions_prefixes
        WHERE transaction_type = 'sale_return'
          AND prefix_name = ?
        LIMIT 1
        FOR UPDATE
        `,
        [returnNumber]
      );

    if (prefixRows.length === 0) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          `Return prefix "${returnNumber}" does not exist.`,
      });
    }
  }
}
console.log("Return_Number received:", Return_Number);
console.log("Return_Number final before INSERT:", returnNumber);
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
         Transaction_Discount_Percentage,
        Transaction_Discount_Amount,
         Total_Amount,
         Round_Off,
         Total_Paid,
         Balance_Due
       )
       VALUES (?, ?, ?, ?, ?, ?,?,?, ?, ?, ?, ?, ?, ?)`,
      [
        Sale_Id,
        party.Party_Id,
        //Return_Number || null,
         returnNumber || null, 
        Invoice_Number || null,
        Invoice_Date || null,
        activeFY,
        Return_Date,
        State_Of_Supply || null,
        cleanTransactionDiscountPercentage,
        cleanTransactionDiscountAmount,
        totalAmount,
        roundOffValue,
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
      //docNumber: Return_Number,
      docNumber: returnNumber,
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
        MRP,
        Discount_On_MRP_For_Sale_Percentage,
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
           MRP,
           Discount_On_MRP_For_Sale_Percentage,
           Sale_Price,
           Discount_On_Sale_Price,
           Discount_Type_On_Sale_Price,
           Tax_Type,
           Tax_Amount,
           Amount
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          Item_Id,
          snapshot.Primary_Unit_Snapshot,    // step 6
          snapshot.Secondary_Unit_Snapshot,  // step 6
          resolvedSelectedUnit,              // step 6
          Number(Quantity) || 0,
          normalizeNumber(MRP) || null,
          normalizeNumber(Discount_On_MRP_For_Sale_Percentage) || null,
          Number(Sale_Price) || 0,
          Number(Discount_On_Sale_Price) || 0,
          Discount_Type_On_Sale_Price || "Percentage",
          Tax_Type || "None",
          Number(Tax_Amount) || 0,
          Number(Amount) || 0,
        ]
      );

      const srItemId = srItemResult.insertId;
      await connection.execute(
        `
  UPDATE add_item
  SET
    Item_Unit = ?,
    Primary_Unit = ?,
    Secondary_Unit = ?
  WHERE Item_Id = ?
  `,
        [
          resolvedSelectedUnit || null,
          snapshot.Primary_Unit_Snapshot || null,
          snapshot.Secondary_Unit_Snapshot || null,
          Item_Id,
        ]
      );
      await syncUnitIdsForItem(
        connection,
        Item_Id
      );

      await syncUnitIdsForSaleReturnItem(
        connection,
        {
          saleReturnItemRowId: srItemId,

          Primary_Unit_Snapshot: snapshot.Primary_Unit_Snapshot,

          Secondary_Unit_Snapshot: snapshot.Secondary_Unit_Snapshot,

          Selected_Unit: resolvedSelectedUnit,
        }
      );

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
        //billNumber: Return_Number || null,
        billNumber:returnNumber || null,
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
       Transaction_Discount_Percentage,
      Transaction_Discount_Amount,
      Total_Amount,
      Round_Off,
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
    const roundOffValue = Number(Round_Off) || 0

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
    const transactionDiscountPercentage =
  normalizeNumber(Transaction_Discount_Percentage);

const transactionDiscountAmount =
  normalizeNumber(Transaction_Discount_Amount);
if (
  transactionDiscountPercentage !== null &&
  transactionDiscountPercentage > 100
) {
  return res.status(400).json({
    success: false,
    message: "Transaction discount percentage cannot be greater than 100%",
  });
}
const cleanTransactionDiscountPercentage =
  transactionDiscountPercentage > 0
    ? transactionDiscountPercentage
    : null;

const cleanTransactionDiscountAmount =
  transactionDiscountAmount > 0
    ? transactionDiscountAmount
    : null;
//     // ---------------------------------------------------------
// // Get OLD return number before updating the sale return
// // ---------------------------------------------------------

// const [oldReturnRows] = await connection.execute(
//   `
//   SELECT Return_Number
//   FROM sale_return
//   WHERE id = ?
//   LIMIT 1
//   FOR UPDATE
//   `,
//   [Sale_Return_Id]
// );

// const oldReturnNumber = String(
//   oldReturnRows[0]?.Return_Number || ""
// ).trim();


// // ---------------------------------------------------------
// // Current return number
// // ---------------------------------------------------------

// let returnNumber = String(Return_Number || "").trim();


// // ---------------------------------------------------------
// // SPECIAL CASE:
// // 000 / 00 / 0000 etc. means blank return number.
// // ---------------------------------------------------------

// if (/^0+$/.test(returnNumber)) {
//   returnNumber = "";
// }


// // ---------------------------------------------------------
// // Handle return number prefix sequence
// // ---------------------------------------------------------

// if (returnNumber) {

//   const returnMatch =
//     returnNumber.match(/^(.*?)(\d+)$/);

//   if (!returnMatch) {
//     await connection.rollback();

//     return res.status(400).json({
//       success: false,
//       message: "Invalid return number.",
//     });
//   }

//   const returnPrefix =
//     returnMatch[1] || "None";

//   const enteredReturnNumber =
//     Number(returnMatch[2]);


//   if (
//     !Number.isInteger(enteredReturnNumber) ||
//     enteredReturnNumber < 1
//   ) {
//     await connection.rollback();

//     return res.status(400).json({
//       success: false,
//       message:
//         "Return number must contain a valid positive number.",
//     });
//   }


//   // -------------------------------------------------------
//   // If prefix was changed while editing,
//   // release the old prefix number.
//   //
//   // Example:
//   // CN3 -> SR2
//   //
//   // CN last_number:
//   // 3 -> 2
//   // -------------------------------------------------------

//   if (
//     oldReturnNumber &&
//     oldReturnNumber !== returnNumber
//   ) {

//     const oldMatch =
//       oldReturnNumber.match(/^(.*?)(\d+)$/);

//     if (oldMatch) {

//       const oldPrefix =
//         oldMatch[1] || "None";

//       const oldNumber =
//         Number(oldMatch[2]);


//       // Only when PREFIX changed
//       if (oldPrefix !== returnPrefix) {

//         const [oldPrefixRows] =
//           await connection.execute(
//             `
//             SELECT
//               id,
//               last_number
//             FROM transactions_prefixes
//             WHERE transaction_type = 'sale_return'
//               AND prefix_name = ?
//             LIMIT 1
//             FOR UPDATE
//             `,
//             [oldPrefix]
//           );


//         if (oldPrefixRows.length > 0) {

//           const oldPrefixRow =
//             oldPrefixRows[0];

//           const oldLastNumber =
//             Number(oldPrefixRow.last_number) || 0;


//           // Old return was the latest return
//           if (oldNumber === oldLastNumber) {

//             await connection.execute(
//               `
//               UPDATE transactions_prefixes
//               SET last_number = ?
//               WHERE id = ?
//               `,
//               [
//                 Math.max(
//                   0,
//                   oldLastNumber - 1
//                 ),
//                 oldPrefixRow.id,
//               ]
//             );
//           }
//         }
//       }
//     }
//   }


//   // -------------------------------------------------------
//   // Find + LOCK NEW prefix row
//   // -------------------------------------------------------

//   const [prefixRows] =
//     await connection.execute(
//       `
//       SELECT
//         id,
//         transaction_type,
//         prefix_name,
//         last_number,
//         is_active
//       FROM transactions_prefixes
//       WHERE transaction_type = 'sale_return'
//         AND prefix_name = ?
//       LIMIT 1
//       FOR UPDATE
//       `,
//       [returnPrefix]
//     );


//   // -------------------------------------------------------
//   // Prefix must exist
//   // -------------------------------------------------------

//   if (prefixRows.length === 0) {
//     await connection.rollback();

//     return res.status(400).json({
//       success: false,
//       message:
//         `Return prefix "${returnPrefix}" does not exist.`,
//     });
//   }


//   const prefixRow = prefixRows[0];

//   const currentLastNumber =Number(prefixRow.last_number) || 0;


//   // -------------------------------------------------------
//   // Update NEW prefix sequence if necessary
//   // -------------------------------------------------------

//   if (
//     enteredReturnNumber >
//     currentLastNumber
//   ) {

//     await connection.execute(
//       `
//       UPDATE transactions_prefixes
//       SET last_number = ?
//       WHERE id = ?
//       `,
//       [
//         enteredReturnNumber,
//         prefixRow.id,
//       ]
//     );
//   }
// }
    // =========================================================
    // =========================================================
// 8. GET OLD RETURN NUMBER
// =========================================================

const [oldReturnRows] = await connection.execute(
  `
  SELECT Return_Number
  FROM sale_return
  WHERE id = ?
  LIMIT 1
  FOR UPDATE
  `,
  [Sale_Return_Id]
);

const oldReturnNumber = String(
  oldReturnRows[0]?.Return_Number || ""
).trim();


// =========================================================
// 9. CURRENT RETURN NUMBER
// =========================================================

let returnNumber = String(
  Return_Number || ""
).trim();


// =========================================================
// 10. SPECIAL CASE
//
// SAL0  -> SAL
// SAL00 -> SAL
// INV0  -> INV
// INV00 -> INV
//
// 0     -> ""
// 00    -> ""
// 000   -> ""
//
// IMPORTANT:
// "None" is the UI prefix name, but it is NOT stored in DB.
//
// So:
//
// None + 0  -> ""
// None + 00 -> ""
//
// If old number was latest:
//
// SAL1000 -> SAL
// SAL last_number: 1000 -> 999
// =========================================================

// =========================================================
// 10. SPECIAL ZERO NUMBER
//
// DN0   -> DN
// DN00  -> DN
// DN000 -> DN
//
// 0     -> ""
// 00    -> ""
//
// IMPORTANT:
// DN1300 must remain DN1300.
// We only treat the number as "zero" when the ENTIRE
// numeric portion is zero.
// =========================================================

const returnMatchForZeroCheck =
  returnNumber.match(/^(.*?)(\d+)$/);

if (returnMatchForZeroCheck) {
  const zeroPrefix = returnMatchForZeroCheck[1] || "";
  const numericPart = returnMatchForZeroCheck[2] || "";

  // Only special-case when the ENTIRE number is zero.
  // Examples:
  // 0     -> true
  // 00    -> true
  // 000   -> true
  // 1300  -> false
  // 100   -> false
  // 10    -> false

  if (/^0+$/.test(numericPart)) {

    // -------------------------------------------------------
    // Get old return number
    // -------------------------------------------------------

    const oldMatch =
      oldReturnNumber.match(/^(.*?)(\d+)$/);

    if (oldMatch) {
      const oldPrefix =
        oldMatch[1] || "";

      const oldNumber =
        Number(oldMatch[2]);

      // Only decrement when the old prefix is the same
      if (oldPrefix === zeroPrefix) {

        const [oldPrefixRows] =
          await connection.execute(
            `
            SELECT
              id,
              last_number
            FROM transactions_prefixes
            WHERE transaction_type = 'sale_return'
              AND prefix_name = ?
            LIMIT 1
            FOR UPDATE
            `,
            [oldPrefix]
          );

        if (oldPrefixRows.length > 0) {

          const oldPrefixRow =
            oldPrefixRows[0];

          const oldLastNumber =
            Number(oldPrefixRow.last_number) || 0;

          // Only decrement if old return was latest
          if (oldNumber === oldLastNumber) {

            await connection.execute(
              `
              UPDATE transactions_prefixes
              SET last_number = ?
              WHERE id = ?
              `,
              [
                Math.max(
                  0,
                  oldLastNumber - 1
                ),
                oldPrefixRow.id,
              ]
            );
          }
        }
      }
    }

    // -------------------------------------------------------
    // Store prefix only
    //
    // DN0  -> DN
    // DN00 -> DN
    //
    // 0 / 00 / 000 -> ""
    // -------------------------------------------------------

    returnNumber = zeroPrefix;
  }
}

// =========================================================
// 11. HANDLE NORMAL RETURN NUMBER PREFIX SEQUENCE
// =========================================================
//
// This block runs only for:
//
// SAL5
// SAL1000
// INV5
// 5
// 100
//
// It does NOT run for:
//
// SAL0
// SAL00
// INV0
// INV00
// 0
// 00
// =========================================================

if (
  returnNumber &&
  /\d+$/.test(returnNumber)
) {
  const returnMatch =
    returnNumber.match(/^(.*?)(\d+)$/);

  // -------------------------------------------------------
  // Invalid return number
  // -------------------------------------------------------

  if (!returnMatch) {
    await connection.rollback();

    return res.status(400).json({
      success: false,
      message: "Invalid return number.",
    });
  }

  const returnPrefix =
    returnMatch[1] || "";

  const enteredReturnNumber =
    Number(returnMatch[2]);

  // -------------------------------------------------------
  // Validate positive number
  // -------------------------------------------------------

  if (
    !Number.isInteger(enteredReturnNumber) ||
    enteredReturnNumber < 1
  ) {
    await connection.rollback();

    return res.status(400).json({
      success: false,
      message:
        "Return number must contain a valid positive number.",
    });
  }

  // -------------------------------------------------------
  // If prefix changed while editing,
  // release old prefix number.
  //
  // Example:
  //
  // SAL3 -> INV2
  //
  // SAL last_number:
  // 3 -> 2
  // -------------------------------------------------------

  if (
    oldReturnNumber &&
    oldReturnNumber !== returnNumber
  ) {
    const oldMatch =
      oldReturnNumber.match(/^(.*?)(\d+)$/);

    if (oldMatch) {
      const oldPrefix =
        oldMatch[1] || "";

      const oldNumber =
        Number(oldMatch[2]);

      // ---------------------------------------------------
      // Only when PREFIX changed
      // ---------------------------------------------------

      if (oldPrefix !== returnPrefix) {
        const [oldPrefixRows] =
          await connection.execute(
            `
            SELECT
              id,
              last_number
            FROM transactions_prefixes
            WHERE transaction_type = 'sale_return'
              AND prefix_name = ?
            LIMIT 1
            FOR UPDATE
            `,
            [oldPrefix]
          );

        if (oldPrefixRows.length > 0) {
          const oldPrefixRow =
            oldPrefixRows[0];

          const oldLastNumber =
            Number(oldPrefixRow.last_number) || 0;

          // Old return was latest
          if (
            oldNumber === oldLastNumber
          ) {
            await connection.execute(
              `
              UPDATE transactions_prefixes
              SET last_number = ?
              WHERE id = ?
              `,
              [
                Math.max(
                  0,
                  oldLastNumber - 1
                ),
                oldPrefixRow.id,
              ]
            );
          }
        }
      }
    }
  }

  // -------------------------------------------------------
  // Find + LOCK NEW prefix row
  // -------------------------------------------------------

  const [prefixRows] =
    await connection.execute(
      `
      SELECT
        id,
        transaction_type,
        prefix_name,
        last_number,
        is_active
      FROM transactions_prefixes
      WHERE transaction_type = 'sale_return'
        AND prefix_name = ?
      LIMIT 1
      FOR UPDATE
      `,
      [returnPrefix]
    );

  // -------------------------------------------------------
  // Prefix must exist
  // -------------------------------------------------------

  if (prefixRows.length === 0) {
    await connection.rollback();

    return res.status(400).json({
      success: false,
      message:
        `Return prefix "${returnPrefix}" does not exist.`,
    });
  }

  const prefixRow =
    prefixRows[0];

  const currentLastNumber =
    Number(prefixRow.last_number) || 0;

  // -------------------------------------------------------
  // Update NEW prefix sequence if necessary
  // -------------------------------------------------------

  if (
    enteredReturnNumber >
    currentLastNumber
  ) {
    await connection.execute(
      `
      UPDATE transactions_prefixes
      SET last_number = ?
      WHERE id = ?
      `,
      [
        enteredReturnNumber,
        prefixRow.id,
      ]
    );
  }
}

    await connection.query(
      `UPDATE sale_return
       SET
         Party_Id = ?,
         Return_Number = ?,
         Invoice_Number = ?,
         Invoice_Date = ?,
         Return_Date = ?,
         State_Of_Supply = ?,
          Transaction_Discount_Percentage = ?, 
         Transaction_Discount_Amount = ?,
         Total_Amount = ?,
         Round_Off = ?,
         Total_Paid = ?,
         Balance_Due = ?,
         updated_at = NOW()
       WHERE id = ?`,
      [
        party.Party_Id,
        returnNumber || null,
        //Return_Number || null,
        Invoice_Number || null,
        Invoice_Date || null,
        Return_Date,
        State_Of_Supply || null,
         cleanTransactionDiscountPercentage,
        cleanTransactionDiscountAmount,
        totalAmount,
        roundOffValue,
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
      docNumber: returnNumber,
      //docNumber: Return_Number,
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
        MRP,
        Discount_On_MRP_For_Sale_Percentage,
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
        MRP: normalizeNumber(MRP) || null,


        Discount_On_MRP_For_Sale_Percentage: normalizeNumber(Discount_On_MRP_For_Sale_Percentage) || null,

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

          // const [[conversion]] =
          //   await connection.query(
          //     `
          // SELECT Conversion_Rate
          // FROM item_unit_conversions
          // WHERE Item_Id = ?
          //   AND Primary_Unit = ?
          //   AND Secondary_Unit = ?
          // ORDER BY id DESC
          // LIMIT 1
          // `,
          //     [
          //       old.Item_Id,
          //       oldPrimary,
          //       oldSecondary,
          //     ]
          //   );

          // const conversionRate =
          //   Number(conversion?.Conversion_Rate) || 0;

          // if (
          //   Number.isFinite(conversionRate) &&
          //   conversionRate > 0
          // ) {
          //   oldBaseQty =
          //     rawQty / conversionRate;
          // }
          const [[itemMaster]] =
            await connection.query(
              `
              SELECT Conversion_Rate
              FROM add_item
              WHERE Item_Id = ?
              LIMIT 1
              `,
              [old.Item_Id]
            );

          const conversionRate =
            Number(itemMaster?.Conversion_Rate) || 0;

          if (conversionRate > 0) {
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
           MRP,
           Discount_On_MRP_For_Sale_Percentage,
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
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          Sale_Return_Id,
          line.Item_Id,
          line.Quantity,
          normalizeNumber(line.MRP) || null,
          normalizeNumber(line.Discount_On_MRP_For_Sale_Percentage) || null,
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
      await connection.execute(
        `
  UPDATE add_item
  SET
    Item_Unit = ?,
    Primary_Unit = ?,
    Secondary_Unit = ?
  WHERE Item_Id = ?
  `,
        [
          line.resolvedSelectedUnit || null,
          line.Primary_Unit_Snapshot || null,
          line.Secondary_Unit_Snapshot || null,
          line.Item_Id,
        ]
      );
      await syncUnitIdsForItem(
        connection,
        line.Item_Id
      );

      await syncUnitIdsForSaleReturnItem(
        connection,
        {
          saleReturnItemRowId: saleReturnItemId,

          Primary_Unit_Snapshot: line.Primary_Unit_Snapshot,

          Secondary_Unit_Snapshot: line.Secondary_Unit_Snapshot,

          Selected_Unit: line.Selected_Unit,
        }
      );
      await recordItemLedger({
        connection,

        itemId: line.Item_Id,

        txnType: "Sale_Return",

        referenceId: saleReturnItemId,

        billId: existing.id,                     // sale_return.id
        //billNumber: Return_Number || null,
        billNumber: returnNumber || null,

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

const getLatestSaleReturnNumber = async (req, res, next) => {
    let connection;

    try {
        const { prefix: requestedPrefix } = req.query;

        // =========================================================
        // 1. VALIDATE PREFIX
        // =========================================================

        if (!requestedPrefix) {
            return res.status(400).json({
                success: false,
                message: "Return prefix is required.",
            });
        }

        const requestedPrefixName = String(requestedPrefix).trim();

        connection = await db.getConnection();

        // =========================================================
        // 2. GET PREFIX + LAST NUMBER
        // =========================================================

        const [prefixRows] = await connection.query(
            `
            SELECT
                id,
                transaction_type,
                prefix_name,
                last_number,
                is_active
            FROM transactions_prefixes
            WHERE transaction_type = 'sale_return'
              AND prefix_name = ?
            LIMIT 1
            `,
            [requestedPrefixName]
        );

        if (prefixRows.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid Sale Return prefix.",
            });
        }

        const prefixRow = prefixRows[0];

        // =========================================================
        // 3. GET LAST NUMBER
        // =========================================================

        const lastNumber = Number(prefixRow.last_number) || 0;

        const nextNumber = lastNumber + 1;

        // =========================================================
        // 4. FORMAT NEXT NUMBER
        // =========================================================

        let newReturnNumber;

        // ---------------------------------------------------------
        // NONE PREFIX
        // ---------------------------------------------------------

        if (
            requestedPrefixName.toLowerCase() === "none"
        ) {
            newReturnNumber = String(nextNumber);
        }

        // ---------------------------------------------------------
        // AEPL-2627-
        // ---------------------------------------------------------

        else if (
            requestedPrefixName.toUpperCase() === "AEPL-2627-"
        ) {
            newReturnNumber = String(nextNumber).padStart(4, "0");
        }

        // ---------------------------------------------------------
        // ALL OTHER PREFIXES
        // ---------------------------------------------------------

        else {
            newReturnNumber = String(nextNumber);
        }

        // =========================================================
        // 5. GET CURRENT FINANCIAL YEAR
        // =========================================================

        const [fyRows] = await connection.query(
            `
            SELECT Financial_Year
            FROM financial_year
            WHERE Current_Financial_Year = 1
            LIMIT 1
            `
        );

        if (fyRows.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No active financial year found.",
            });
        }

        const activeFY = fyRows[0].Financial_Year;

        // =========================================================
        // 6. RETURN NEXT NUMBER
        // =========================================================

        return res.status(200).json({
            success: true,
            prefix: requestedPrefixName,
            financialYear: activeFY,
            newReturnNumber,
        });

    } catch (err) {
        console.error(
            "❌ Error getting latest sale return number:",
            err
        );

        next(err);

    } finally {
        if (connection) {
            connection.release();
        }
    }
};
const exportSaleReturnReportToExcel = async (req, res, next) => {
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
          p.Party_Name LIKE ?
          OR sr.Return_Number LIKE ?
          OR sr.Invoice_Number LIKE ?
          OR CAST(sr.Total_Amount AS CHAR) LIKE ?
          OR CAST(sr.Total_Paid AS CHAR) LIKE ?
          OR CAST(sr.Balance_Due AS CHAR) LIKE ?
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
        `DATE(sr.Return_Date) BETWEEN ? AND ?`
      );
      params.push(fromDate, toDate);
    } else if (fromDate) {
      whereClauses.push(
        `DATE(sr.Return_Date) >= ?`
      );
      params.push(fromDate);
    } else if (toDate) {
      whereClauses.push(
        `DATE(sr.Return_Date) <= ?`
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
        sr.*,
        p.Party_Name
      FROM sale_return sr
      LEFT JOIN add_party p
        ON p.Party_Id = sr.Party_Id
      ${whereSQL}
      ORDER BY sr.Return_Date DESC
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
        WHERE ps.Source_Type = 'Sale_Return'
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
      "Sale Return Report"
    );

    sheet.columns = [
      { width: 15 }, // Date
      { width: 18 }, // Return No
      { width: 18 }, // Invoice No
      { width: 35 }, // Party
      { width: 25 }, // Payment Type
      { width: 18 }, // Amount
      { width: 18 }, // Paid
      { width: 18 }, // Balance
    ];

    const LAST_COL = "H";

    sheet.mergeCells(`A1:${LAST_COL}1`);

    const titleCell = sheet.getCell("A1");
    titleCell.value = "SALE RETURN REPORT";
    titleCell.font = {
      bold: true,
      size: 14,
    };
    titleCell.alignment = {
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
      "Invoice No",
      "Party Name",
      "Payment Type",
      "Total Amount",
      "Total Paid",
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
        row.Invoice_Number || "",
        row.Party_Name || "",
        row.Payment_Type_Display || "",
        Number(row.Total_Amount || 0),
        Number(row.Total_Paid || 0),
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
        ? `SaleReturnReport_${fromDate}_to_${toDate}`
        : `SaleReturnReport_${new Date()
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
      "❌ Sale Return Excel export error:",
      err
    );
    next(err);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// const getSaleReturnPrintReport = async (req, res,next) => {
//   let connection;

//   try {
//     connection = await db.getConnection();

//     const { search = "", fromDate, toDate } = req.query;

//     const whereClauses = [];
//     const params = [];

//     if (search) {
//       const like = `%${search}%`;

//       whereClauses.push(`
//         (
//           p.Party_Name LIKE ?
//           OR sr.Return_Number LIKE ?
//           OR sr.Invoice_Number LIKE ?
//           OR CAST(sr.Total_Amount AS CHAR) LIKE ?
//           OR CAST(sr.Balance_Due AS CHAR) LIKE ?
//           OR CAST(sr.Total_Paid AS CHAR) LIKE ?
//         )
//       `);

//       params.push(
//         like,
//         like,
//         like,
//         like,
//         like,
//         like
//       );
//     }

//     if (fromDate && toDate) {
//       whereClauses.push(
//         `DATE(sr.Return_Date) BETWEEN ? AND ?`
//       );

//       params.push(fromDate, toDate);
//     } else if (fromDate) {
//       whereClauses.push(
//         `DATE(sr.Return_Date) >= ?`
//       );

//       params.push(fromDate);
//     } else if (toDate) {
//       whereClauses.push(
//         `DATE(sr.Return_Date) <= ?`
//       );

//       params.push(toDate);
//     }

//     const whereClause =
//       whereClauses.length > 0
//         ? `WHERE ${whereClauses.join(" AND ")}`
//         : "";

//     // =====================================
//     // HEADER
//     // =====================================

//     const [returns] = await connection.query(
//       `
//       SELECT
//         sr.id,
//         sr.Return_Number,
//         sr.Invoice_Number,
//         sr.Invoice_Date,
//         sr.Return_Date,
//         sr.State_Of_Supply,
//         sr.Total_Amount,
//         sr.Total_Paid,
//         sr.Balance_Due,
//         sr.Party_Id,

//         p.Party_Name,
//         p.GSTIN


//       FROM sale_return sr

//       LEFT JOIN add_party p
//         ON p.Party_Id = sr.Party_Id

//       ${whereClause}

//       ORDER BY sr.Return_Date ASC
//       `,
//       params
//     );

//     if (!returns.length) {
//       return res.status(200).json({
//         success: true,
//         totalSaleReturns: 0,
//         saleReturns: [],
//         summary: {
//           totalAmount: 0,
//           totalPaid: 0,
//           totalDue: 0,
//           totalDiscount: 0,
//         },
//       });
//     }

//     const returnIds = returns.map(
//       (r) => r.id
//     );

//     const placeholders =
//       returnIds.map(() => "?").join(",");

//     // =====================================
//     // ITEMS
//     // =====================================

//     const [items] = await connection.query(
//       `
//       SELECT
//         sri.*,

//         i.Item_Name,
//         i.Item_HSN,
//         i.Item_Unit,
//         i.Item_Category,

//         i.Primary_Unit,
//         i.Secondary_Unit,
//         i.Conversion_Rate

//       FROM sale_return_items sri

//       LEFT JOIN add_item i
//         ON i.Item_Id = sri.Item_Id

//       WHERE sri.Sale_Return_Id IN (${placeholders})

//       ORDER BY sri.created_at ASC
//       `,
//       returnIds
//     );

//     // =====================================
//     // PAYMENT SPLITS
//     // =====================================

//     const [splits] = await connection.query(
//       `
//       SELECT
//         ps.*,
//         ba.Account_Display_Name

//       FROM payment_splits ps

//       LEFT JOIN bank_accounts ba
//         ON ba.id = ps.Bank_Account_Id

//       WHERE ps.Source_Type = 'Sale_Return'
//       AND ps.Source_Id IN (${placeholders})

//       ORDER BY ps.id ASC
//       `,
//       returnIds
//     );

//     const itemMap = {};
//     const splitMap = {};

//     items.forEach((item) => {
//       if (!itemMap[item.Sale_Return_Id]) {
//         itemMap[item.Sale_Return_Id] = [];
//       }

//       const price = Number(
//         item.Sale_Price || 0
//       );

//       let discountAmount = 0;

//       if (
//         Number(item.Discount_On_Sale_Price || 0) > 0
//       ) {
//         if (
//           item.Discount_Type_On_Sale_Price ===
//           "Percentage"
//         ) {
//           discountAmount =
//             (price *
//               Number(
//                 item.Discount_On_Sale_Price
//               )) /
//             100;
//         } else {
//           discountAmount = Number(
//             item.Discount_On_Sale_Price
//           );
//         }
//       }

//       itemMap[item.Sale_Return_Id].push({
//         ...item,
//         Discount_Amount: Number(
//           discountAmount.toFixed(2)
//         ),
//       });
//     });

//     splits.forEach((split) => {
//       if (!splitMap[split.Source_Id]) {
//         splitMap[split.Source_Id] = [];
//       }

//       splitMap[split.Source_Id].push({
//         Id: split.id,
//         Payment_Type: split.Payment_Type,
//         Bank_Account_Id:
//           split.Bank_Account_Id,
//         Account_Display_Name:
//           split.Account_Display_Name,
//         Amount: split.Amount,
//       });
//     });

//     // =====================================
//     // SUMMARY
//     // =====================================

//     const summary = {
//       totalAmount: 0,
//       totalPaid: 0,
//       totalDue: 0,
//       totalDiscount: 0,
//     };

//     const saleReturns = returns.map((row) => {
//       const returnItems =
//         itemMap[row.id] || [];

//       summary.totalAmount += Number(
//         row.Total_Amount || 0
//       );

//       summary.totalPaid += Number(
//         row.Total_Paid || 0
//       );

//       summary.totalDue += Number(
//         row.Balance_Due || 0
//       );

//       returnItems.forEach((item) => {
//         summary.totalDiscount += Number(
//           item.Discount_Amount || 0
//         );
//       });

//       return {
//         saleReturnDetails: {
//           Sale_Return_Id: row.id,

//           Party_Name: row.Party_Name,
//           GSTIN: row.GSTIN,

//           Return_Number: row.Return_Number,
//           Invoice_Number: row.Invoice_Number,
//           Invoice_Date: row.Invoice_Date,
//           Return_Date: row.Return_Date,

//           State_Of_Supply:
//             row.State_Of_Supply,

//           Total_Amount:
//             row.Total_Amount,

//           Total_Paid:
//             row.Total_Paid,

//           Balance_Due:
//             row.Balance_Due,
//         },

//         splits:
//           splitMap[row.id] || [],

//         items: returnItems,
//       };
//     });

//     summary.totalAmount = Number(
//       summary.totalAmount.toFixed(2)
//     );

//     summary.totalPaid = Number(
//       summary.totalPaid.toFixed(2)
//     );

//     summary.totalDue = Number(
//       summary.totalDue.toFixed(2)
//     );

//     summary.totalDiscount = Number(
//       summary.totalDiscount.toFixed(2)
//     );

//     return res.status(200).json({
//       success: true,
//       totalSaleReturns:
//         saleReturns.length,
//       saleReturns,
//       summary,
//     });
//   } catch (err) {
//     console.error(
//       "Sale Return Print Report Error:",
//       err
//     );

//      next(err);
//   } 
//   finally {
//     if (connection) {
//       connection.release();
//     }
//   }
// };
const getSaleReturnPrintReport = async (
  req,
  res,
  next
) => {
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
          OR sr.Return_Number LIKE ?
          OR sr.Invoice_Number LIKE ?
          OR CAST(sr.Total_Amount AS CHAR) LIKE ?
          OR CAST(sr.Balance_Due AS CHAR) LIKE ?
          OR CAST(sr.Total_Paid AS CHAR) LIKE ?
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
        `DATE(sr.Return_Date) BETWEEN ? AND ?`
      );

      params.push(fromDate, toDate);
    } else if (fromDate) {
      whereClauses.push(
        `DATE(sr.Return_Date) >= ?`
      );

      params.push(fromDate);
    } else if (toDate) {
      whereClauses.push(
        `DATE(sr.Return_Date) <= ?`
      );

      params.push(toDate);
    }

    const whereClause =
      whereClauses.length > 0
        ? `WHERE ${whereClauses.join(" AND ")}`
        : "";

    const {
      saleReturns,
      summary,
    } = await getSaleReturnsForPrint(
      connection,
      whereClause,
      params
    );
    console.log("saleReturns", saleReturns.length);
    return res.status(200).json({
      success: true,
      totalSaleReturns:
        saleReturns.length,
      saleReturns,
      summary,
    });
  } catch (err) {
    console.error(
      "Sale Return Print Report Error:",
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
  getLatestSaleReturnNumber,
  exportSaleReturnReportToExcel,
  getSaleReturnPrintReport
};