

import db from "../config/db.js";
import { recordItemLedger } from "../utils/itemLedgerHelper.js";
import { sanitizeObject } from "../utils/sanitizeInput.js";
import itemFormSchema from "../validators/itemSchema.js";
import PdfPrinter from "pdfmake";
const cleanValue = (value) => {
  if (value === undefined || value === null || value === "" || value === " ") {
    return null; // store as NULL in DB
  }
  return value;  // ✅ returns the original value for valid data
};
{/* Add Item */ }
// const addItem = async (req, res, next) => {
//   let connection;
//   try {
//     connection = await db.getConnection();
//     await connection.beginTransaction(); // ✅ Start transaction
//     // ✅ Validate request body with Zod
//     const cleanData = sanitizeObject(req.body);
//     const validation = itemFormSchema.safeParse(cleanData);
//     if (!validation.success) {
//       return res.status(400).json({ errors: validation.error.errors });
//     }
//     const { Item_Name, Item_HSN, Item_Unit, Item_Image, Item_Category } =
//       validation.data;
//     // ✅ Check duplicate
//     const normalizedName = Item_Name.trim().toLowerCase();

//     const [rows] = await connection.query(
//       `SELECT Item_Id
//    FROM add_item
//    WHERE LOWER(TRIM(Item_Name)) = ?`,
//       [normalizedName]
//     );


//     if (rows.length > 0) {
//       await connection.rollback();
//       return res
//         .status(400)
//         .json({ message: "Item already exists, please add a new item" });
//     }

//     // ✅ Generate new Item_Id
//     const [last] = await db.query(
//       "SELECT Item_Id FROM add_item ORDER BY id DESC LIMIT 1"
//     );

//     let itemId = "ITM001";
//     if (last.length > 0) {
//       const lastId = last[0].Item_Id; // e.g. "ITM005"
//       const num = parseInt(lastId.replace("ITM", "")) + 1;
//       itemId = "ITM" + num.toString().padStart(3, "0");
//     }

//     // ✅ Insert into DB
//     const [result] = await db.execute(
//       `INSERT INTO add_item (
//         Item_Name, Item_Id, Item_HSN, Item_Unit,  Item_Category,
//         created_at, updated_at
//       ) VALUES (?, ?, ?, ?, ?,  NOW(), NOW())`,
//       [Item_Name, itemId, Item_HSN, Item_Unit, , Item_Category]
//     );
//     await connection.commit();
//     return res.status(201).json({
//       message: "Item added successfully",
//       success: true,
//       id: result.insertId,
//       itemId,
//     });
//   } catch (err) {
//     // if (err.code === "ER_DUP_ENTRY") {
//     //   return res.status(400).json({ message: "Duplicate entry" });
//     // }
//     if (connection) await connection.rollback();
//     console.error("❌ Error adding item:", err);
//     next(err);
//     // return res.status(500).json({ message: "Internal Server Error" });
//   } finally {
//     if (connection) connection.release();
//   }
// };

// Primary Unit
// None → Kg                 ✅
// Kg → Gm                   ❌ NEVER
// Kg → NULL                 ❌ NEVER

// Secondary Unit
// None → Gm                 ✅
// Gm → Box                  ✅
// Box → Packet              ✅
// Packet → NULL             ✅

// Conversion Rate
// 1000 → 5000               ✅
// 5000 → 10                 ✅
// 10 → 20                   ✅

// Current Stock
// Automatically changed
// because unit config edited?   ❌ NEVER
// const addItem = async (req, res, next) => {
//   let connection;
//   try {
//     connection = await db.getConnection();
//     await connection.beginTransaction();

//     const cleanData = sanitizeObject(req.body);
//     const validation = itemFormSchema.safeParse(cleanData);
//     if (!validation.success) {
//       await connection.rollback();
//       return res.status(400).json({ errors: validation.error.errors });
//     }

//     const {
//       Item_Name,
//       Item_HSN,
//       Item_Unit,
//       Item_Category,
//       // Pricing
//       // Sale_Price,
//       // Purchase_Price,
//       // Wholesale_Price,
//       // Tax_Type,
//       // Stock
//       Opening_Quantity,
//       At_Price,
//       As_Of_Date,
//       Min_Stock,
//       Location,
//     } = validation.data;

//     // ── duplicate check ──────────────────────────────────────────
//     const normalizedName = Item_Name.trim().toLowerCase();
//     const [rows] = await connection.query(
//       `SELECT Item_Id FROM add_item WHERE LOWER(TRIM(Item_Name)) = ?`,
//       [normalizedName]
//     );
//     if (rows.length > 0) {
//       await connection.rollback();
//       return res.status(400).json({
//         success: false,
//         message: "Item already exists, please add a new item",
//       });
//     }

//     // ── generate Item_Id ─────────────────────────────────────────
//     const [last] = await connection.query(
//       "SELECT Item_Id FROM add_item ORDER BY id DESC LIMIT 1"
//     );
//     let itemId = "ITM001";
//     if (last.length > 0) {
//       const num = parseInt(last[0].Item_Id.replace("ITM", ""), 10) + 1;
//       itemId = "ITM" + num.toString().padStart(3, "0");
//     }

//     // ── insert ───────────────────────────────────────────────────
//     const [result] = await connection.execute(
//       `INSERT INTO add_item (
//         Item_Id,    Item_Name,    Item_HSN,   Item_Unit,  Item_Category,


//         Opening_Quantity, At_Price, As_Of_Date, Min_Stock, Location,
//         created_at, updated_at
//       ) VALUES (
//         ?, ?, ?, ?, ?,


//         ?, ?, ?, ?, ?,
//         NOW(), NOW()
//       )`,
//       [
//         itemId,
//         Item_Name,
//         Item_HSN,
//         Item_Unit,
//         Item_Category,
//         // Pricing — null if not provided
//         //Sale_Price     ?? null,
//         //Purchase_Price ?? null,
//         //Wholesale_Price ?? null,
//         //Tax_Type       || "None",
//         // Stock_Quantity seeded from Opening_Quantity so existing
//         // purchase/sale stock logic still works against this column
//         //Opening_Quantity ?? 0,
//         // Stock tab extras
//         Opening_Quantity ?? null,
//         At_Price         ?? null,
//         As_Of_Date       || null,
//         Min_Stock        ?? null,
//         Location         || null,
//       ]
//     );

//     await connection.commit();
//     return res.status(201).json({
//       success: true,
//       message: "Item added successfully",
//       id: result.insertId,
//       itemId,
//     });
//   } catch (err) {
//     if (connection) await connection.rollback();
//     console.error("❌ Error adding item:", err);
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };

const addItem = async (req, res, next) => {
  let connection;

  try {
    // =========================================================
    // 1. GET CONNECTION + START TRANSACTION
    // =========================================================

    connection = await db.getConnection();
    await connection.beginTransaction();

    // =========================================================
    // 2. SANITIZE + VALIDATE
    // =========================================================

    const cleanData = sanitizeObject(req.body);

    const validation = itemFormSchema.safeParse(cleanData);

    if (!validation.success) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        errors: validation.error.errors,
      });
    }

    // =========================================================
    // 3. GET VALIDATED DATA
    // =========================================================

    const {
      Item_Name,
      Item_HSN,
      Item_Category,
      Item_Unit,
      // =======================================================
      // NEW UNIT SYSTEM
      // =======================================================

      Primary_Unit,
      Secondary_Unit,
      Conversion_Rate,

      // =======================================================
      // STOCK
      // =======================================================

      Opening_Quantity,
      At_Price,
      As_Of_Date,
      Min_Stock,
      Location,
    } = validation.data;

    // =========================================================
    // 4. DUPLICATE ITEM CHECK
    // =========================================================

    const normalizedName =
      Item_Name.trim().toLowerCase();

    const [existingItems] = await connection.query(
      `
        SELECT Item_Id
        FROM add_item
        WHERE LOWER(TRIM(Item_Name)) = ?
        LIMIT 1
      `,
      [normalizedName]
    );

    if (existingItems.length > 0) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          "Item already exists, please add a new item",
      });
    }

    // =========================================================
    // 5. GENERATE ITEM ID
    // =========================================================

    const [last] = await connection.query(
      `
        SELECT Item_Id
        FROM add_item
        ORDER BY id DESC
        LIMIT 1
      `
    );

    let itemId = "ITM001";

    if (last.length > 0) {
      const lastNumber = parseInt(
        last[0].Item_Id.replace("ITM", ""),
        10
      );

      const nextNumber =
        Number.isNaN(lastNumber)
          ? 1
          : lastNumber + 1;

      itemId =
        "ITM" +
        nextNumber
          .toString()
          .padStart(3, "0");
    }

    // =========================================================
    // 6. NORMALIZE UNIT DATA
    // =========================================================

    /*
      CASE 1
      ----------------------------
      No units selected

      Primary_Unit     = NULL
      Secondary_Unit   = NULL
      Conversion_Rate  = NULL


      CASE 2
      ----------------------------
      Only primary selected

      Primary_Unit     = Kg
      Secondary_Unit   = NULL
      Conversion_Rate  = NULL


      CASE 3
      ----------------------------
      Primary + Secondary

      Primary_Unit     = Kg
      Secondary_Unit   = Gm
      Conversion_Rate  = 1000
    */

    const primaryUnit = Primary_Unit || null;

    const secondaryUnit = Secondary_Unit || null;

    const conversionRate = secondaryUnit
      ? Conversion_Rate ?? null
      : null;

    // =========================================================
    // 7. INITIAL STOCK
    // =========================================================

    /*
      Opening_Quantity is historical setup information.

      Stock_Quantity is LIVE stock.

      Example:

      Opening_Quantity = NULL
      Stock_Quantity   = 0

      Opening_Quantity = 0
      Stock_Quantity   = 0

      Opening_Quantity = 10
      Stock_Quantity   = 10


      If item currently has NO unit:

          Opening = 10
          Stock   = 10

      Later user assigns Primary Unit = Kg:

          Stock becomes conceptually 10 Kg

      Numeric Stock_Quantity does NOT need to change.
    */

    const stockQuantity = Opening_Quantity ?? 0;

    // =========================================================
    // 8. LEGACY Item_Unit
    // =========================================================

    /*
      You said Item_Unit must remain in add_item because
      old items still use it.

      For NEW items we DON'T need to populate it.

      New unit system:

          Primary_Unit
          Secondary_Unit
          Conversion_Rate

      Therefore:

          Item_Unit = NULL

      Existing old database rows can still contain their
      previous Item_Unit values.
    */

    //const legacyItemUnit = null;

    // =========================================================
    // 9. INSERT ITEM
    // =========================================================

    const [result] = await connection.execute(
      `
    INSERT INTO add_item
    (
      Item_Id,
      Item_Name,
      Item_HSN,
      Item_Category,
      Item_Unit,
      Primary_Unit,
      Secondary_Unit,
      Conversion_Rate,
      Stock_Quantity,
      Opening_Quantity,
      At_Price,
      As_Of_Date,
      Min_Stock,
      Location,
      created_at,
      updated_at
    )
    VALUES
    (
      ?, ?, ?, ?,
      ?,
      ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      NOW(),
      NOW()
    )
  `,
      [
        itemId,
        Item_Name,
        Item_HSN || null,
        Item_Category || "",

        Item_Unit,

        primaryUnit,
        secondaryUnit,
        conversionRate,

        stockQuantity,
        Opening_Quantity ?? null,
        At_Price ?? null,
        As_Of_Date || null,
        Min_Stock ?? null,
        Location || null,
      ]
    );


    // =========================================================
    // 10. SAVE UNIT CONVERSION
    // =========================================================

    if (
      primaryUnit &&
      secondaryUnit &&
      conversionRate !== null &&
      Number(conversionRate) > 0
    ) {
      await connection.execute(
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
          itemId,
          primaryUnit,
          secondaryUnit,
          conversionRate,
        ]
      );
    }
    // =========================================================
    // 11. OPENING STOCK LEDGER ENTRY
    // =========================================================
    if (stockQuantity > 0) {
      await recordItemLedger({
        connection,
        itemId,
        txnType: "Opening_Stock",
        referenceId: result.insertId,
        formattedId: itemId,
        partyName: null,
        quantity: stockQuantity,
        rate: At_Price ?? null,
        txnDate: As_Of_Date || new Date().toISOString().slice(0, 10)
      });
    }

    // =========================================================
    // 12. COMMIT
    // =========================================================

    await connection.commit();



    // =========================================================
    // 13. RESPONSE
    // =========================================================

    return res.status(201).json({
      success: true,
      message: "Item added successfully",

      id: result.insertId,
      itemId,

      item: {
        Item_Id: itemId,
        Item_Name,
        Item_HSN: Item_HSN || null,
        Item_Category,

        // New units
        Primary_Unit: primaryUnit,
        Secondary_Unit: secondaryUnit,
        Conversion_Rate: conversionRate,

        // Stock
        Stock_Quantity: stockQuantity,
        Opening_Quantity:
          Opening_Quantity ?? null,

        At_Price:
          At_Price ?? null,

        As_Of_Date:
          As_Of_Date || null,

        Min_Stock:
          Min_Stock ?? null,

        Location:
          Location || null,
      },
    });

  } catch (err) {
    // =========================================================
    // 12. ROLLBACK
    // =========================================================

    if (connection) {
      await connection.rollback();
    }

    console.error(
      "❌ Error adding item:",
      err
    );

    next(err);

  } finally {
    // =========================================================
    // 13. RELEASE CONNECTION
    // =========================================================

    if (connection) {
      connection.release();
    }
  }
};
const addItemConversion = async (req, res, next) => {
  let connection;

  try {
    connection = await db.getConnection();

    const {
      Item_Id,
      Primary_Unit,
      Secondary_Unit,
      Conversion_Rate,
    } = req.body;

    if (
      !Item_Id ||
      !Primary_Unit ||
      !Secondary_Unit ||
      !Number(Conversion_Rate)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversion data.",
      });
    }

    await connection.execute(
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
        Primary_Unit,
        Secondary_Unit,
        Conversion_Rate,
      ]
    );

    const [conversions] = await connection.query(
      `
      SELECT
        id,
        Primary_Unit,
        Secondary_Unit,
        Conversion_Rate
      FROM item_unit_conversions
      WHERE Item_Id = ?
      ORDER BY id DESC
      `,
      [Item_Id]
    );

    return res.status(200).json({
      success: true,
      message: "Conversion saved successfully.",
      conversions,
    });
  } catch (err) {
    console.error("❌ addItemConversion:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};
const getItemConversions = async (req, res, next) => {
  let connection;

  try {
    connection = await db.getConnection();

    const { Item_Id } = req.params;

    const [conversions] = await connection.query(
      `
      SELECT
        id,
        Primary_Unit,
        Secondary_Unit,
        Conversion_Rate
      FROM item_unit_conversions
      WHERE Item_Id = ?
      ORDER BY id DESC
      `,
      [Item_Id]
    );

    return res.status(200).json({
      success: true,
      conversions,
    });
  } catch (err) {
    console.error("❌ getItemConversions:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};
const editItem = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction(); // ✅ Start transaction

    const { Item_Id } = req.params;
    const cleanData = sanitizeObject(req.body);
    const validation = itemFormSchema.safeParse(cleanData);
    if (!validation.success) {
      await connection.rollback();

      return res.status(400).json({
        errors: validation.error.errors,
      });
    }
    // const { Item_Name, Item_HSN, Item_Unit,  Item_Category } = validation.data;
    const {
      Item_Name,
      Item_HSN,
      Item_Unit,          // legacy

      Item_Category,

      Primary_Unit,
      Secondary_Unit,
      Conversion_Rate,

      Opening_Quantity,
      At_Price,
      As_Of_Date,
      Min_Stock,
      Location,
    } = validation.data;
    const normalizedName = Item_Name.trim().toLowerCase();

    const [duplicate] = await connection.query(
      `SELECT Item_Id
   FROM add_item
   WHERE LOWER(TRIM(Item_Name)) = ?
     AND Item_Id <> ?`,
      [normalizedName, Item_Id]
    );

    if (duplicate.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Another item with this name already exists.",
      });
    }
    // =========================================================
    // PRIMARY UNIT LOCK
    //
    // RULE:
    // If this item has EVER been used in a transaction
    // with ANY selected unit, Primary_Unit cannot change.
    //
    // Secondary_Unit can still change.
    // =========================================================

    const [[existingItem]] = await connection.query(
      `
    SELECT Primary_Unit
    FROM add_item
    WHERE Item_Id = ?
    LIMIT 1
  `,
      [Item_Id]
    );

    if (!existingItem) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Item not found.",
      });
    }

    const oldPrimary = existingItem.Primary_Unit || null;
    const newPrimary = Primary_Unit || null;


    // =========================================================
    // ONLY CHECK WHEN PRIMARY IS BEING CHANGED
    // =========================================================
    //+
    // (
    //   SELECT COUNT(*)
    //   FROM add_sale_items
    //   WHERE Item_Id = ?
    //     AND Selected_Unit IS NOT NULL
    //     AND TRIM(Selected_Unit) <> ''
    // )
    if (oldPrimary !== newPrimary) {

      const [[{ unitUsedCount }]] = await connection.query(
        `
     SELECT
(
    SELECT COUNT(*)
    FROM add_purchase_items
    WHERE Item_Id = ?
      AND Selected_Unit IS NOT NULL
      AND TRIM(Selected_Unit) <> ''
)
+
(
    SELECT COUNT(*)
    FROM add_sale_items
    WHERE Item_Id = ?
      AND Selected_Unit IS NOT NULL
      AND TRIM(Selected_Unit) <> ''
)
+
(
    SELECT COUNT(*)
    FROM purchase_return_items
    WHERE Item_Id = ?
      AND Selected_Unit IS NOT NULL
      AND TRIM(Selected_Unit) <> ''
)
+
(
    SELECT COUNT(*)
    FROM sale_return_items
    WHERE Item_Id = ?
      AND Selected_Unit IS NOT NULL
      AND TRIM(Selected_Unit) <> ''
)
AS unitUsedCount
    `,
        [
          Item_Id,
          Item_Id,
          Item_Id,
          Item_Id,
        ]
      );


      // =======================================================
      // ANY UNIT HAS BEEN USED
      // PRIMARY IS NOW LOCKED
      // =======================================================

      if (Number(unitUsedCount) > 0) {
        await connection.rollback();

        return res.status(400).json({
          success: false,
          message:
            `Primary Unit "${oldPrimary || "None"}" cannot be changed ` +
            `because this item has already been used with a unit in a transaction.`,
        });
      }
    }
    const [result] = await connection.execute(
      `UPDATE add_item
SET
    Item_Name=?,
    Item_HSN=?,
    Item_Unit=?,

    Item_Category=?,

    Primary_Unit=?,
    Secondary_Unit=?,
    Conversion_Rate=?,

    Opening_Quantity=?,
    At_Price=?,
    As_Of_Date=?,
    Min_Stock=?,
    Location=?,

    updated_at=NOW()

WHERE Item_Id=?`,
      [
        Item_Name,
        Item_HSN || null,
        Item_Unit || "",

        Item_Category || "",

        Primary_Unit || null,
        Secondary_Unit || null,
        Secondary_Unit
          ? Conversion_Rate ?? null
          : null,

        Opening_Quantity ?? null,
        At_Price ?? null,
        As_Of_Date || null,
        Min_Stock ?? null,
        Location || null,

        Item_Id,
      ]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Item not found" });
    }
    // =========================================================
    // UPDATE UNIT CONVERSION
    // =========================================================

    // =========================================================
    // SAVE UNIT CONVERSION HISTORY
    // =========================================================

    if (
      Primary_Unit &&
      Secondary_Unit &&
      Number(Conversion_Rate) > 0
    ) {
      await connection.execute(
        `
      INSERT INTO item_unit_conversions
      (
        Item_Id,
        Primary_Unit,
        Secondary_Unit,
        Conversion_Rate
      )
      SELECT ?, ?, ?, ?
      WHERE NOT EXISTS (
        SELECT 1
        FROM item_unit_conversions
        WHERE Item_Id = ?
          AND Primary_Unit = ?
          AND Secondary_Unit = ?
          AND Conversion_Rate = ?
      )
    `,
        [
          Item_Id,
          Primary_Unit,
          Secondary_Unit,
          Conversion_Rate,

          Item_Id,
          Primary_Unit,
          Secondary_Unit,
          Conversion_Rate,
        ]
      );
    }
    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Item updated successfully",
    });

  } catch (err) {
    if (connection) await connection.rollback();
    console.error("❌ Error editing item:", err);
    next(err);
    // return res.status(500).json({ message: "Internal Server Error" });
  } finally {
    if (connection) connection.release();
  }
}

const eachItemBillAndInvoiceNumbers = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();

    const { Item_Id } = req.params;
    if (!Item_Id) {
      return res.status(400).json({ message: "Item Id is required" });
    }

    // 1️⃣ Fetch purchase & sale references
    const [purchases] = await connection.query(
      "SELECT Purchase_Id FROM add_purchase_items WHERE Item_Id = ?",
      [Item_Id]
    );

    const [sales] = await connection.query(
      "SELECT Sale_Id FROM add_sale_items WHERE Item_Id = ?",
      [Item_Id]
    );

    const purchaseIds = purchases.map((p) => p.Purchase_Id);
    const saleIds = sales.map((s) => s.Sale_Id);

    let purchaseDetails = [];
    let saleDetails = [];

    // 2️⃣ Fetch purchase bill numbers (only if exists)
    if (purchaseIds.length > 0) {
      [purchaseDetails] = await connection.query(
        `SELECT  Purchase_Id,Bill_Number, Bill_Date 
         FROM add_purchase 
         WHERE Purchase_Id IN (?)`,
        [purchaseIds]
      );
    }

    // 3️⃣ Fetch sale invoice numbers (only if exists)
    if (saleIds.length > 0) {
      [saleDetails] = await connection.query(
        `SELECT Sale_Id, Invoice_Number, Invoice_Date 
         FROM add_sale 
         WHERE Sale_Id IN (?)`,
        [saleIds]
      );
    }

    // 4️⃣ Final output format
    const billAndInvoiceNumbers = {
      purchaseDetails: {
        type: "Purchase",
        count: purchaseDetails.length,
        details: purchaseDetails,
      },
      saleDetails: {
        type: "Sale",
        count: saleDetails.length,
        details: saleDetails,
      },
    };

    return res.status(200).json({
      success: true,
      message: "Bill and Invoice Numbers fetched successfully",
      billAndInvoiceNumbers,
    });

  } catch (err) {
    console.error("❌ Error:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};



// const getAllItems = async (req, res, next) => {
//   let connection;
//   try {
//     connection = await db.getConnection();
//     const page = req.query.page ? parseInt(req.query.page, 10) : null;
//     const search = req.query.search ? req.query.search.trim().toLowerCase() : "";
//     const fromDate = req.query.fromDate || null;
//     const toDate = req.query.toDate || null;
//     console.log("🔍 Params =>", { page, search, fromDate, toDate });
//     console.log(fromDate, toDate, search, page);
//     const limit = 10;
//     const offset = page ? (page - 1) * limit : 0;

//     // ✅ Build WHERE clause dynamically
//     let whereClauses = [];
//     let params = [];

//     // 🧠 Search term condition
//     if (search) {
//       whereClauses.push(`
//         (LOWER(Item_Name) LIKE ? 
//          OR LOWER(Item_Category) LIKE ? 
//          OR LOWER(Item_HSN) LIKE ? 
//          OR LOWER(Item_Id) LIKE ? 
//          OR LOWER(Item_Unit) LIKE ?)
//       `);
//       const like = `%${search}%`;
//       params.push(like, like, like, like, like);
//     }

//     // 📅 Date range condition
//     // if (fromDate && toDate) {
//     //   whereClauses.push("DATE(created_at) BETWEEN ? AND ?");
//     //   params.push(fromDate, toDate);
//     // } else if (fromDate) {
//     //   whereClauses.push("DATE(created_at) >= ?");
//     //   params.push(fromDate);
//     // } else if (toDate) {
//     //   whereClauses.push("DATE(created_at) <= ?");
//     //   params.push(toDate);
//     // }
//     if (fromDate && toDate) {
//       whereClauses.push(`DATE(created_at) BETWEEN ? AND ?`);
//       params.push(
//         `${fromDate} 00:00:00`,
//         `${toDate} 23:59:59`
//       );
//     } else if (fromDate) {
//       whereClauses.push(`DATE(created_at) >= ?`);
//       params.push(`${fromDate} 00:00:00`);
//     } else if (toDate) {
//       whereClauses.push(`DATE(created_at) <= ?`);
//       params.push(`${toDate} 23:59:59`);
//     }
//     // Combine WHERE clauses
//     const whereSQL = whereClauses.length ? "WHERE " + whereClauses.join(" AND ") : "";

//     // ✅ Fetch items
//     const query = `
//       SELECT * FROM add_item 
//       ${whereSQL}
//       ORDER BY created_at DESC
//       ${page ? "LIMIT ? OFFSET ?" : ""}
//     `;
//     if (page) params.push(limit, offset);

//     const [items] = await db.query(query, params);

//     // ✅ Count total for pagination
//     let [totalItems] = await db.query(
//       `SELECT COUNT(*) AS total FROM add_item ${whereSQL}`,
//       params.slice(0, params.length - (page ? 2 : 0))
//     );

//     // ✅ Get latest purchase and sales prices
//     const [purchaseItems] = await db.query(`
//       SELECT Item_Id, Purchase_Price,Tax_Type 
//       FROM add_purchase_items 
//       ORDER BY created_at DESC
//     `);
//     const [salesItems] = await db.query(`
//       SELECT Item_Id, Sale_Price 
//       FROM add_sale_items 
//       ORDER BY created_at DESC
//     `);

//     const latestPurchasePrice = {};
//     const latestTaxType = {};
//     purchaseItems.forEach((row) => {
//       if (!latestPurchasePrice[row.Item_Id]) {
//         latestPurchasePrice[row.Item_Id] = row.Purchase_Price;
//         latestTaxType[row.Item_Id] = row.Tax_Type;
//       }
//     });
//     const latestSalePrice = {};
//     salesItems.forEach((row) => {
//       if (!latestSalePrice[row.Item_Id]) {
//         latestSalePrice[row.Item_Id] = row.Sale_Price;
//       }
//     });

//     //console.log(latestPurchasePrice, latestTaxType, latestSalePrice);
//     // ✅ Merge results
//     const combined = items.map((item) => ({
//       ...item,
//       Purchase_Price: latestPurchasePrice[item.Item_Id] || 0.0,
//       Tax_Type: latestTaxType[item.Item_Id],
//       Sale_Price: latestSalePrice[item.Item_Id] || 0.0,
//     }));

//     //console.log(combined);
//     // ✅ Response
//     return res.status(200).json({
//       success: true,
//       currentPage: page || 1,
//       totalPages: page ? Math.ceil(totalItems[0].total / limit) : 1,
//       totalItems: totalItems[0].total,
//       items: combined,
//     });
//   } catch (err) {
//     if (connection) connection.release();
//     console.error("❌ Error fetching items:", err);
//     next(err);
//     // return res.status(500).json({ message: "Internal Server Error" });
//   } finally {
//     if (connection) connection.release();
//   }
// };


const getAllItems = async (req, res, next) => {
  let connection;

  try {
    connection = await db.getConnection();

    const page = req.query.page
      ? parseInt(req.query.page, 10)
      : null;

    const search = req.query.search
      ? req.query.search.trim().toLowerCase()
      : "";

    const fromDate = req.query.fromDate || null;
    const toDate = req.query.toDate || null;

    const limit = 10;
    const offset = page ? (page - 1) * limit : 0;

    // =========================================================
    // 1. BUILD WHERE
    // =========================================================

    const whereClauses = [];
    const params = [];

    if (search) {
      whereClauses.push(`
        (
          LOWER(Item_Name) LIKE ?
          OR LOWER(Item_Category) LIKE ?
          OR LOWER(Item_HSN) LIKE ?
          OR LOWER(Item_Id) LIKE ?
          OR LOWER(Item_Unit) LIKE ?
          OR LOWER(Primary_Unit) LIKE ?
          OR LOWER(Secondary_Unit) LIKE ?
        )
      `);

      const like = `%${search}%`;

      params.push(
        like,
        like,
        like,
        like,
        like,
        like,
        like
      );
    }

    // =========================================================
    // 2. DATE FILTER
    // =========================================================

    if (fromDate && toDate) {
      whereClauses.push(`DATE(created_at) BETWEEN ? AND ?`);
      params.push(fromDate, toDate);

    } else if (fromDate) {
      whereClauses.push(`DATE(created_at) >= ?`);
      params.push(fromDate);

    } else if (toDate) {
      whereClauses.push(`DATE(created_at) <= ?`);
      params.push(toDate);
    }

    const whereSQL = whereClauses.length
      ? `WHERE ${whereClauses.join(" AND ")}`
      : "";

    // Keep params without pagination for COUNT query
    const filterParams = [...params];

    // =========================================================
    // 3. GET ITEMS
    // =========================================================

    let query = `
      SELECT *
      FROM add_item
      ${whereSQL}
      ORDER BY created_at DESC
    `;

    if (page) {
      query += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);
    }

    const [items] = await connection.query(
      query,
      params
    );

    // =========================================================
    // 4. COUNT
    // =========================================================

    const [totalItems] = await connection.query(
      `
        SELECT COUNT(*) AS total
        FROM add_item
        ${whereSQL}
      `,
      filterParams
    );

    // =========================================================
    // 5. PURCHASE HISTORY
    // =========================================================

    const [purchaseItems] = await connection.query(`
      SELECT
        Item_Id,
        Purchase_Price,
        Tax_Type
      FROM add_purchase_items
      ORDER BY created_at DESC
    `);

    // =========================================================
    // 6. SALES HISTORY
    // =========================================================

    const [salesItems] = await connection.query(`
      SELECT
        Item_Id,
        Sale_Price
      FROM add_sale_items
      ORDER BY created_at DESC
    `);

    // =========================================================
    // 7. UNIT CONVERSION HISTORY
    // =========================================================

    const [unitConversions] = await connection.query(`
      SELECT
        id,
        Item_Id,
        Primary_Unit,
        Secondary_Unit,
        Conversion_Rate,
        created_at
      FROM item_unit_conversions
      ORDER BY created_at DESC, id DESC
    `);

    // =========================================================
    // 8. LATEST PURCHASE PRICE + TAX
    // =========================================================

    const latestPurchasePrice = {};
    const latestTaxType = {};

    purchaseItems.forEach((row) => {
      if (latestPurchasePrice[row.Item_Id] === undefined) {
        latestPurchasePrice[row.Item_Id] =
          row.Purchase_Price;

        latestTaxType[row.Item_Id] =
          row.Tax_Type;
      }
    });

    // =========================================================
    // 9. LATEST SALE PRICE
    // =========================================================

    const latestSalePrice = {};

    salesItems.forEach((row) => {
      if (latestSalePrice[row.Item_Id] === undefined) {
        latestSalePrice[row.Item_Id] =
          row.Sale_Price;
      }
    });

    // =========================================================
    // 10. GROUP CONVERSIONS BY ITEM
    // =========================================================

    const conversionsByItem = {};

    unitConversions.forEach((conversion) => {
      if (!conversionsByItem[conversion.Item_Id]) {
        conversionsByItem[conversion.Item_Id] = [];
      }

      conversionsByItem[conversion.Item_Id].push({
        id: conversion.id,

        Primary_Unit:
          conversion.Primary_Unit,

        Secondary_Unit:
          conversion.Secondary_Unit,

        Conversion_Rate:
          Number(conversion.Conversion_Rate),
      });
    });

    // =========================================================
    // 11. MERGE EVERYTHING
    // =========================================================

    // const combined = items.map((item) => ({
    //   ...item,

    //   Purchase_Price:
    //     latestPurchasePrice[item.Item_Id] ?? 0,

    //   Tax_Type:
    //     latestTaxType[item.Item_Id] ?? null,

    //   Sale_Price:
    //     latestSalePrice[item.Item_Id] ?? 0,

    //   // All previously saved conversions
    //   unitConversions:
    //     conversionsByItem[item.Item_Id] || [],
    // }));
    // =========================================================
    // 11. MERGE EVERYTHING
    // =========================================================
    const [unitMaster] = await connection.query(`
  SELECT
    Unit_Name,
    Unit_Shorthand
  FROM units
`);
    const unitLookup = {};

    unitMaster.forEach((unit) => {
      unitLookup[unit.Unit_Shorthand] = unit.Unit_Name;
    });
    const combined = items.map((item) => {
      // =======================================================
      // AVAILABLE UNITS = CURRENT ITEM MASTER ONLY
      //
      // Example:
      // Current master:
      // Primary   = Kgs
      // Secondary = BOX
      //
      // Available_Units:
      // Kgs + BOX
      //
      // OLD Kgs/gm conversions are NOT included here.
      // =======================================================

      const availableUnits = [];

      // PRIMARY
      if (item.Primary_Unit) {
        availableUnits.push({
          Unit_Shorthand: item.Primary_Unit,

          Unit_Name:
            unitLookup[item.Primary_Unit] ||
            item.Primary_Unit,
        });
      }

      // SECONDARY
      if (
        item.Secondary_Unit &&
        item.Secondary_Unit !== item.Primary_Unit
      ) {
        availableUnits.push({
          Unit_Shorthand: item.Secondary_Unit,

          Unit_Name:
            unitLookup[item.Secondary_Unit] ||
            item.Secondary_Unit,
        });
      }

      return {
        ...item,

        Purchase_Price:
          latestPurchasePrice[item.Item_Id] ?? 0,

        Tax_Type:
          latestTaxType[item.Item_Id] ?? null,

        Sale_Price:
          latestSalePrice[item.Item_Id] ?? 0,

        // CURRENT configured units
        Available_Units: availableUnits,

        // Historical conversion records
        unitConversions:
          conversionsByItem[item.Item_Id] || [],
      };
    });

    // =========================================================
    // 12. RESPONSE
    // =========================================================

    return res.status(200).json({
      success: true,

      currentPage: page || 1,

      totalPages: page
        ? Math.ceil(totalItems[0].total / limit)
        : 1,

      totalItems: totalItems[0].total,

      items: combined,
    });

  } catch (err) {
    console.error("❌ Error fetching items:", err);
    next(err);

  } finally {
    if (connection) {
      connection.release();
    }
  }
};
const getAllItemsForLedger = async (req, res, next) => {
  let connection;

  try {
    connection = await db.getConnection();

    // =========================================================
    // 1. OPTIONAL SEARCH
    // =========================================================

    const search = req.query.search
      ? req.query.search.trim().toLowerCase()
      : "";

    const params = [];

    let whereSQL = "";

    if (search) {
      const like = `%${search}%`;

      whereSQL = `
        WHERE (
          Item_Name LIKE ?
          OR Item_Category LIKE ?
          OR LOWER(Item_HSN) LIKE ?
          OR LOWER(Item_Id) LIKE ?
          OR LOWER(Item_Unit) LIKE ?
          OR LOWER(Primary_Unit) LIKE ?
          OR LOWER(Secondary_Unit) LIKE ?
        )
      `;

      params.push(
        like,
        like,
        like,
        like,
        like,
        like,
        like
      );
    }

    // =========================================================
    // 2. FETCH ALL ITEMS
    // No pagination
    // =========================================================

    const [items] = await connection.query(
      `
        SELECT
          id,
          Item_Id,
          Item_Name,
          Item_HSN,
          Item_Category,

          Item_Unit,

          Primary_Unit,
          Secondary_Unit,
          Conversion_Rate,

          Stock_Quantity,
          Opening_Quantity,
          At_Price,
          As_Of_Date,
          Min_Stock,
          Location,

          created_at,
          updated_at

        FROM add_item

        ${whereSQL}

        ORDER BY Item_Name ASC
      `,
      params
    );

    // =========================================================
    // 3. FETCH UNIT CONVERSION HISTORY
    // =========================================================

    const [unitConversions] = await connection.query(
      `
        SELECT
          id,
          Item_Id,
          Primary_Unit,
          Secondary_Unit,
          Conversion_Rate,
          created_at

        FROM item_unit_conversions

        ORDER BY
          created_at DESC,
          id DESC
      `
    );

    // =========================================================
    // 4. GROUP CONVERSION HISTORY BY ITEM
    // =========================================================

    const conversionsByItem = {};

    unitConversions.forEach((conversion) => {
      if (!conversionsByItem[conversion.Item_Id]) {
        conversionsByItem[conversion.Item_Id] = [];
      }

      conversionsByItem[conversion.Item_Id].push({
        id: conversion.id,

        Primary_Unit: conversion.Primary_Unit,

        Secondary_Unit: conversion.Secondary_Unit,

        Conversion_Rate:
          conversion.Conversion_Rate !== null
            ? Number(conversion.Conversion_Rate)
            : null,

        created_at:
          conversion.created_at,
      });
    });

    // =========================================================
    // 5. ATTACH CONVERSION HISTORY TO EACH ITEM
    // =========================================================

    const result = items.map((item) => ({
      ...item,

      Conversion_Rate:
        item.Conversion_Rate !== null
          ? Number(item.Conversion_Rate)
          : null,

      Stock_Quantity: Number(item.Stock_Quantity || 0),

      Opening_Quantity:
        item.Opening_Quantity !== null
          ? Number(item.Opening_Quantity)
          : null,

      At_Price:
        item.At_Price !== null
          ? Number(item.At_Price)
          : null,

      Min_Stock:
        item.Min_Stock !== null
          ? Number(item.Min_Stock)
          : null,

      unitConversions:
        conversionsByItem[item.Item_Id] || [],
    }));

    // =========================================================
    // 6. RESPONSE
    // =========================================================

    return res.status(200).json({
      success: true,

      totalItems: result.length,

      items: result,
    });

  } catch (err) {
    console.error(
      "❌ Error fetching items for ledger:",
      err
    );

    next(err);

  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const getItemBills = async (req, res, next) => {
  let connection;

  try {
    connection = await db.getConnection();

    const { Item_Id } = req.params;

    const {
      cursor = null,
      search = "",
      date = "",
    } = req.query;

    const limit = 10;

    // =========================================================
    // 1. VALIDATE ITEM
    // =========================================================

    if (!Item_Id) {
      return res.status(400).json({
        success: false,
        message: "Item ID is required.",
      });
    }

    // =========================================================
    // 2. ITEM DETAILS
    // =========================================================

    const [[item]] = await connection.query(
      `
      SELECT
        Item_Id,
        Item_Name,
        Item_HSN,
        Item_Category,

        Item_Unit,

        Primary_Unit,
        Secondary_Unit,
        Conversion_Rate,

        Stock_Quantity

      FROM add_item

      WHERE Item_Id = ?

      LIMIT 1
      `,
      [Item_Id]
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found.",
      });
    }

    // =========================================================
    // 3. BUILD LEDGER FILTER
    // =========================================================

    const where = [
      `Item_Id = ?`
    ];

    const params = [
      Item_Id
    ];

    // =========================================================
    // SEARCH
    //
    // Can search:
    // AEPL-22
    // ABC Supplier
    // Purchase
    // Sale
    // =========================================================

    if (search?.trim()) {
      const like =
        `%${search.trim().toLowerCase()}%`;

      where.push(`
        (
          LOWER(COALESCE(Bill_Number, '')) LIKE ?
          OR LOWER(COALESCE(Party_Name, '')) LIKE ?
          OR LOWER(COALESCE(Txn_Type, '')) LIKE ?
        )
      `);

      params.push(
        like,
        like,
        like
      );
    }

    // =========================================================
    // DATE FILTER
    // =========================================================

    if (date) {
      where.push(
        `DATE(Txn_Date) = ?`
      );

      params.push(date);
    }

    // =========================================================
    // 4. CURSOR
    //
    // cursor format:
    //
    // base64(
    //   JSON.stringify({
    //      date: "2026-08-06T00:00:00.000Z",
    //      id: 100
    //   })
    // )
    // =========================================================

    if (cursor) {
      try {
        const decoded = JSON.parse(
          Buffer
            .from(cursor, "base64")
            .toString("utf8")
        );

        if (
          !decoded.date ||
          !decoded.id
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid cursor.",
          });
        }

        where.push(`
          (
            Txn_Date < ?
            OR
            (
              Txn_Date = ?
              AND id < ?
            )
          )
        `);

        params.push(
          decoded.date,
          decoded.date,
          Number(decoded.id)
        );

      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid cursor.",
        });
      }
    }

    // =========================================================
    // 5. FETCH LIMIT + 1
    //
    // +1 tells us whether another page exists.
    // =========================================================

    const queryParams = [
      ...params,
      limit + 1,
    ];

    const [rows] = await connection.query(
      `
      SELECT
        id AS Ledger_Id,

        Item_Id,

        Txn_Type,
        Direction,

        Source_Id,

        Bill_Id,
        Bill_Number,

        Party_Name,

        Quantity,
        Rate,

        Running_Stock,

        Txn_Date

      FROM item_ledger

      WHERE ${where.join(" AND ")}

      ORDER BY
        Txn_Date DESC,
        id DESC

      LIMIT ?
      `,
      queryParams
    );

    // =========================================================
    // 6. HAS MORE?
    // =========================================================

    const hasMore = rows.length > limit;

    const transactions = hasMore
      ? rows.slice(0, limit)
      : rows;

    // =========================================================
    // 7. CREATE NEXT CURSOR
    // =========================================================

    let nextCursor = null;

    if (
      hasMore &&
      transactions.length > 0
    ) {
      const last =
        transactions[
        transactions.length - 1
        ];

      nextCursor = Buffer.from(
        JSON.stringify({
          date: last.Txn_Date,
          id: last.Ledger_Id,
        })
      ).toString("base64");
    }

    // =========================================================
    // 8. RESPONSE
    // =========================================================

    return res.status(200).json({
      success: true,

      item: {
        ...item,

        Conversion_Rate:
          item.Conversion_Rate !== null
            ? Number(item.Conversion_Rate)
            : null,

        Stock_Quantity:
          Number(
            item.Stock_Quantity || 0
          ),
      },

      transactions:
        transactions.map((row) => ({
          Ledger_Id:
            row.Ledger_Id,

          Item_Id:
            row.Item_Id,

          Txn_Type:
            row.Txn_Type,

          Direction:
            row.Direction,

          Source_Id:
            row.Source_Id,

          Bill_Id:
            row.Bill_Id,

          Bill_Number:
            row.Bill_Number,

          Party_Name:
            row.Party_Name,

          Quantity:
            Number(row.Quantity || 0),

          Rate:
            row.Rate !== null
              ? Number(row.Rate)
              : null,

          Running_Stock:
            Number(
              row.Running_Stock || 0
            ),

          Txn_Date:
            row.Txn_Date,
        })),

      nextCursor,

      hasMore,
    });

  } catch (err) {
    console.error(
      "❌ Error fetching item bills:",
      err
    );

    next(err);

  } finally {
    if (connection) {
      connection.release();
    }
  }
};

{/* add category */ }
// const addCategory = async (req, res, next) => {
//   let connection;
//   try {
//     const { Item_Category } = req.body;
//     connection = await db.getConnection();

//     if (!Item_Category) {
//       await connection.rollback();
//       return res.status(400).json({ success: false, message: "Item_Category is required" });
//     }

//     // Trim + collapse spaces
//     const updatedCategory = Item_Category.trim().replace(/\s+/g, " ");

//     // Check if already exists (case-insensitive)
//     const [rows] = await db.query(
//       `SELECT * FROM add_category WHERE LOWER(Item_Category) = LOWER(?)`,
//       [updatedCategory]
//     );

//     if (rows.length > 0) {
//       await connection.rollback();
//       return res.status(400).json({ message: "Item_Category already exists" });
//     }

//     // Generate Category_Id
//     let newId = "CAT001";
//     const [last] = await db.query(
//       "SELECT Category_Id FROM add_category ORDER BY id DESC LIMIT 1"
//     );

//     if (last.length > 0) {
//       const lastId = last[0].Category_Id; // e.g. "CAT005"
//       const num = parseInt(lastId.replace("CAT", "")) + 1;
//       newId = "CAT" + num.toString().padStart(3, "0");
//     }

//     // ✅ Insert new category (2 placeholders for 2 values)
//     const [result] = await db.execute(
//       `INSERT INTO add_category (Category_Id, Item_Category, created_at, updated_at) 
//        VALUES (?, ?, NOW(), NOW())`,
//       [newId, updatedCategory]
//     );
//     await connection.commit();
//     return res.status(201).json({
//       message: "Item_Category added successfully",
//       success: true,
//       id: result.insertId, // auto-increment primary key
//       Category_Id: newId,
//       Item_Category: updatedCategory,
//     });
//   } catch (err) {
//     if (connection) await connection.rollback();
//     console.error("❌ Error adding Item_Category:", err);
//     next(err);
//     // return res.status(500).json({ message: "Internal Server Error" });
//   } finally {
//     if (connection) await connection.release()
//   }
// };
const addCategory = async (req, res, next) => {
  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const { Item_Category } = req.body;

    if (!Item_Category?.trim()) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Item Category is required",
      });
    }

    // Normalize category name
    const normalizedCategory = Item_Category.trim().replace(/\s+/g, " ");

    // Check duplicate (case-insensitive)
    const [existing] = await connection.query(
      `SELECT Category_Id
       FROM add_category
       WHERE LOWER(TRIM(Item_Category)) = ?`,
      [normalizedCategory.toLowerCase()]
    );

    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Category already exists.",
      });
    }

    // Generate Category_Id
    let categoryId = "CAT001";

    const [last] = await connection.query(
      `SELECT Category_Id
       FROM add_category
       ORDER BY id DESC
       LIMIT 1`
    );

    if (last.length > 0) {
      const lastId = last[0].Category_Id; // CAT001
      const nextNumber = parseInt(lastId.replace("CAT", ""), 10) + 1;

      categoryId = "CAT" + nextNumber.toString().padStart(3, "0");
    }

    // Insert category
    const [result] = await connection.execute(
      `INSERT INTO add_category
        (
          Category_Id,
          Item_Category,
          created_at,
          updated_at
        )
       VALUES
        (?, ?, NOW(), NOW())`,
      [categoryId, normalizedCategory]
    );

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Category added successfully.",
      id: result.insertId,
      Category_Id: categoryId,
      Item_Category: normalizedCategory,
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("❌ Error adding category:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};
const getAllCategories = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();
    const [rows] = await db.query("SELECT * FROM add_category  ORDER BY created_at DESC");
    return res.status(200).json(rows);
  } catch (err) {
    if (connection) connection.release();
    console.error("❌ Error getting all categories:", err);
    next(err);
    // return res.status(500).json({ message: "Internal Server Error" });
  } finally {
    if (connection) connection.release();
  }
}



/* ═══════════════════════════════════════
   ITEMS BY CATEGORY (cursor paginated, mirrors getItemBills)
   categoryId = "all" → every item, regardless of category
═══════════════════════════════════════ */
const getItemsByCategory = async (req, res, next) => {
  let connection;

  try {
    connection = await db.getConnection();

    const { categoryId } = req.params;
    const { cursor = null, search = "" } = req.query;

    const limit = 10;

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Category ID is required.",
      });
    }

    // =========================================================
    // 1. VALIDATE CATEGORY (skip if "all")
    // =========================================================

    let categoryName = null;

    if (categoryId !== "all") {
      const [[category]] = await connection.query(
        `SELECT Category_Id, Item_Category FROM add_category WHERE Category_Id = ? LIMIT 1`,
        [categoryId]
      );

      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found.",
        });
      }

      categoryName = category.Item_Category;
    }

    // =========================================================
    // 2. BUILD FILTER
    // =========================================================

    const where = [];
    const params = [];

    if (categoryName !== null) {
      where.push(`TRIM(Item_Category) = TRIM(?)`);
      params.push(categoryName);
    }

    if (search?.trim()) {
      const like = `%${search.trim().toLowerCase()}%`;
      where.push(`(LOWER(Item_Name) LIKE ? OR LOWER(Item_Id) LIKE ?)`);
      params.push(like, like);
    }

    // =========================================================
    // 3. CURSOR
    //
    // cursor format: base64(JSON.stringify({ id: 100 }))
    // simple numeric cursor since items are ordered by id, not date
    // =========================================================

    if (cursor) {
      try {
        const decoded = JSON.parse(Buffer.from(cursor, "base64").toString("utf8"));

        if (!decoded.id) {
          return res.status(400).json({
            success: false,
            message: "Invalid cursor.",
          });
        }

        where.push(`id < ?`);
        params.push(Number(decoded.id));
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid cursor.",
        });
      }
    }

    const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // =========================================================
    // 4. FETCH LIMIT + 1
    // =========================================================

    const [rows] = await connection.query(
      `SELECT
         id,
         Item_Id,
         Item_Name,
         Item_Category,
         Stock_Quantity,
         At_Price,
         Item_Unit,
         Primary_Unit,
         Secondary_Unit,
         (Stock_Quantity * COALESCE(At_Price, 0)) AS Stock_Value
       FROM add_item
       ${whereSQL}
       ORDER BY id DESC
       LIMIT ?`,
      [...params, limit + 1]
    );

    // =========================================================
    // 5. HAS MORE?
    // =========================================================

    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;

    // =========================================================
    // 6. NEXT CURSOR
    // =========================================================

    let nextCursor = null;
    if (hasMore && pageRows.length > 0) {
      const last = pageRows[pageRows.length - 1];
      nextCursor = Buffer.from(JSON.stringify({ id: last.id })).toString("base64");
    }

    // =========================================================
    // 7. RESPONSE
    // =========================================================

    return res.status(200).json({
      success: true,

      category: categoryId === "all"
        ? { Category_Id: null, Item_Category: "All" }
        : { Category_Id: categoryId, Item_Category: categoryName },

      items: pageRows.map((row) => ({
        Item_Id: row.Item_Id,
        Item_Name: row.Item_Name,
        Item_Category: row.Item_Category,
        Stock_Quantity: Number(row.Stock_Quantity || 0),
        Unit: row.Primary_Unit || row.Item_Unit || null,
        Stock_Value: Number(row.Stock_Value || 0),
      })),

      nextCursor,
      hasMore,
    });

  } catch (err) {
    console.error("❌ Error fetching items by category:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

// const eachItemSalesPurchaseDetails = async (req, res, next) => {
//   let connection;

//   try {
//     connection = await db.getConnection();
//     const { Item_Id } = req.params;
//     const page = parseInt(req.query.page, 10) || 1;
//     const limit = 10;
//     const offset = (page - 1) * limit;

//     // 1️⃣ Fetch full lists
//     const [itemsPurchaseList] = await connection.query(
//       `SELECT * FROM add_purchase_items WHERE Item_Id = ?`,
//       [Item_Id]
//     );

//     const [itemsSalesList] = await connection.query(
//       `SELECT * FROM add_sale_items WHERE Item_Id = ?`,
//       [Item_Id]
//     );


//     const purchaseIds = itemsPurchaseList.map((i) => i.Purchase_Id);
//     const saleIds = itemsSalesList.map((i) => i.Sale_Id);

//     const[purchases] = await connection.query(
//       `SELECT * FROM add_purchase WHERE Purchase_Id IN (?) `,
//       [purchaseIds]
//     );

//     const[sales] = await connection.query(
//       `SELECT * FROM add_sale WHERE Sale_Id IN (?) `,
//       [saleIds]
//     )
//     // 📌 Identify parties involved
//     const combinedPartyIds = [
//       ...new Set([
//         ...itemsPurchaseList.map((i) => i.Party_Id),
//         ...itemsSalesList.map((i) => i.Party_Id),
//       ])
//     ];

//     let partyDetails = [];
//     if (combinedPartyIds.length > 0) {
//       [partyDetails] = await connection.query(
//         `SELECT Party_Id, Party_Name FROM add_party WHERE Party_Id IN (?)`,
//         [combinedPartyIds]
//       );
//     }

//     // 2️⃣ Pagination Logic
//     let pagedPurchases = [];
//     let pagedSales = [];

//     if (offset < itemsPurchaseList.length) {
//       pagedPurchases = itemsPurchaseList.slice(offset, offset + limit);
//     } else {
//       const salesOffset = offset - itemsPurchaseList.length;
//       pagedSales = itemsSalesList.slice(salesOffset, salesOffset + limit);
//     }

//     const totalRecords = itemsPurchaseList.length + itemsSalesList.length;
//     const totalPages = Math.ceil(totalRecords / limit);

//     // 3️⃣ Add party names + Type
//     pagedPurchases = pagedPurchases.map((item) => ({
//       Type: "Purchase",
//        Party_Name: partyDetails.find((p) => p.Party_Id === item.Party_Id)?.Party_Name,
//       ...item,

//       // Purchase_Price_Unit: item.Purchase_Price,
//       // Purchase_Id: item.Purchase_Id,
//       // Quantity: item.Quantity,
//       // Bill_Date: item.Bill_Date,
//     }));

//     pagedSales = pagedSales.map((item) => ({
//       Type: "Sale",
//       Party_Name: partyDetails.find((p) => p.Party_Id === item.Party_Id)?.Party_Name,
//       ...item,
//       // Sale_Price_Unit: item.Sale_Price,
//       // Sale_Id: item.Sale_Id,
//       // Quantity: item.Quantity,
//       // Invoice_Date: item.Invoice_Date,
//     }));

//     return res.status(200).json({
//       success: true,
//       Item_Id,
//       totalRecords,
//       totalPages,
//       page,
//       limit,
//       purchases: pagedPurchases,
//       sales: pagedSales,
//     });

//   } catch (err) {
//     console.error("❌ Error getting item history:", err);
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };

// const eachItemSalesPurchaseDetails = async (req, res, next) => {
//   let connection;

//   try {
//     connection = await db.getConnection();
//     const { Item_Id } = req.params;

//     const page = parseInt(req.query.page, 10) || 1;
//     const limit = 10;
//     const offset = (page - 1) * limit;

//     const[items]= await connection.query(
//       `SELECT Item_Id, Item_Name FROM add_item WHERE Item_Id = ?`,
//       [Item_Id]
//     )
//     // Fetch full purchase item rows
//     const [purchaseItemsList] = await connection.query(
//       `SELECT * FROM add_purchase_items WHERE Item_Id = ? ORDER BY created_at DESC`,
//       [Item_Id]
//     );

//     // Fetch full sale item rows
//     const [salesItemsList] = await connection.query(
//       `SELECT * FROM add_sale_items WHERE Item_Id = ? ORDER BY created_at DESC`,
//       [Item_Id]
//     );

//     const totalRecords = purchaseItemsList.length + salesItemsList.length;
//     const totalPages = Math.ceil(totalRecords / limit);

//     // Pagination logic
//     let pagedPurchaseItemRows = [];
//     let pagedSalesItemRows = [];

//     if (offset < purchaseItemsList.length) {
//       pagedPurchaseItemRows = purchaseItemsList.slice(offset, offset + limit);
//     } else {
//       const salesOffset = offset - purchaseItemsList.length;
//       pagedSalesItemRows = salesItemsList.slice(salesOffset, salesOffset + limit);
//     }

//     // Extract Purchase & Sale IDs
//     const purchaseIds = pagedPurchaseItemRows.map((item) => item.Purchase_Id);
//     const saleIds = pagedSalesItemRows.map((item) => item.Sale_Id);

//     // Full bill details
//     const [purchases] = purchaseIds.length
//       ? await connection.query(`SELECT * FROM add_purchase WHERE Purchase_Id IN (?)`, [purchaseIds])
//       : [[]];

//     const [sales] = saleIds.length
//       ? await connection.query(`SELECT * FROM add_sale WHERE Sale_Id IN (?)`, [saleIds])
//       : [[]];

//     // Fetch ALL items inside those bills
//     const [purchaseItemsAll] = purchaseIds.length ? await connection.query(
//           `SELECT pi.*, it.Item_Name, it.Item_HSN, it.Item_Category
//            FROM add_purchase_items pi
//            LEFT JOIN add_item it ON it.Item_Id = pi.Item_Id
//            WHERE pi.Purchase_Id IN (?)`,
//           [purchaseIds]
//         )
//       : [[]];

//     const [saleItemsAll] = saleIds.length ? await connection.query(
//           `SELECT si.*, it.Item_Name, it.Item_HSN, it.Item_Category
//            FROM add_sale_items si
//            LEFT JOIN add_item it ON it.Item_Id = si.Item_Id
//            WHERE si.Sale_Id IN (?)`,
//           [saleIds]
//         )
//       : [[]];

//     // Map purchase items by bill
//     const purchaseBills = purchases.map((bill) => ({
//       Type: "Purchase",
//       ...bill,
//       items: purchaseItemsAll.filter((it) => it.Purchase_Id === bill.Purchase_Id),
//     }));

//     // Map sales items by invoice
//     const saleBills = sales.map((bill) => ({
//       Type: "Sale",
//       ...bill,
//       items: saleItemsAll.filter((it) => it.Sale_Id === bill.Sale_Id),
//     }));

//     return res.status(200).json({
//       success: true,
//       Item_Id,
//       Item_Name: items[0].Item_Name,
//       page,
//       limit,
//       totalRecords,
//       totalPages,
//       purchases: purchaseBills,
//       sales: saleBills,
//     });

//   } catch (err) {
//     console.error("❌ Error:", err);
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };
const eachItemSalesPurchaseDetails = async (req, res, next) => {
  let connection;

  try {
    connection = await db.getConnection();

    const { Item_Id } = req.params;

    const page = parseInt(req.query.page, 10) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    // Fetch Item
    const [items] = await connection.query(
      `SELECT Item_Id, Item_Name 
       FROM add_item 
       WHERE Item_Id = ?`,
      [Item_Id]
    );

    if (!items.length) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    /* ---------------------------------------------------
       1️⃣ Get total record count
    --------------------------------------------------- */

    const [[countResult]] = await connection.query(
      `
      SELECT COUNT(*) AS totalRecords
      FROM (
        SELECT Purchase_Id AS id
        FROM add_purchase_items
        WHERE Item_Id = ?

        UNION ALL

        SELECT Sale_Id AS id
        FROM add_sale_items
        WHERE Item_Id = ?
      ) t
      `,
      [Item_Id, Item_Id]
    );

    const totalRecords = countResult.totalRecords;
    const totalPages = Math.ceil(totalRecords / limit);

    /* ---------------------------------------------------
       2️⃣ Fetch combined transactions
    --------------------------------------------------- */

    const [transactions] = await connection.query(
      `
      SELECT * FROM (
          SELECT 
              'Purchase' AS Type,
              pi.Purchase_Id AS Bill_Id,
              pi.Item_Id,
              pi.Quantity,
              pi.Amount,
              pi.created_at
          FROM add_purchase_items pi
          WHERE pi.Item_Id = ?

          UNION ALL

          SELECT 
              'Sale' AS Type,
              si.Sale_Id AS Bill_Id,
              si.Item_Id,
              si.Quantity,
              si.Amount,
              si.created_at
          FROM add_sale_items si
          WHERE si.Item_Id = ?
      ) t
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
      `,
      [Item_Id, Item_Id, limit, offset]
    );

    /* ---------------------------------------------------
       3️⃣ Extract Bill IDs
    --------------------------------------------------- */

    const purchaseIds = transactions
      .filter((t) => t.Type === "Purchase")
      .map((t) => t.Bill_Id);

    const saleIds = transactions
      .filter((t) => t.Type === "Sale")
      .map((t) => t.Bill_Id);

    /* ---------------------------------------------------
       4️⃣ Fetch Purchase Bills
    --------------------------------------------------- */

    const [purchases] = purchaseIds.length
      ? await connection.query(
        `
          SELECT ap.*, p.Party_Name, p.Phone_Number, p.GSTIN
          FROM add_purchase ap
          LEFT JOIN add_party p ON ap.Party_Id = p.Party_Id
          WHERE ap.Purchase_Id IN (?)
          `,
        [purchaseIds]
      )
      : [[]];

    /* ---------------------------------------------------
       5️⃣ Fetch Sale Bills
    --------------------------------------------------- */

    const [sales] = saleIds.length
      ? await connection.query(
        `
          SELECT s.*, p.Party_Name, p.Phone_Number, p.GSTIN
          FROM add_sale s
          LEFT JOIN add_party p ON s.Party_Id = p.Party_Id
          WHERE s.Sale_Id IN (?)
          `,
        [saleIds]
      )
      : [[]];

    /* ---------------------------------------------------
       6️⃣ Fetch Items for Bills
    --------------------------------------------------- */

    const [purchaseItems] = purchaseIds.length
      ? await connection.query(
        `
          SELECT pi.*, i.Item_Name, i.Item_HSN, i.Item_Category, i.Item_Unit
          FROM add_purchase_items pi
          LEFT JOIN add_item i ON pi.Item_Id = i.Item_Id
          WHERE pi.Purchase_Id IN (?)
          `,
        [purchaseIds]
      )
      : [[]];

    const [saleItems] = saleIds.length
      ? await connection.query(
        `
          SELECT si.*, i.Item_Name, i.Item_HSN, i.Item_Category, i.Item_Unit
          FROM add_sale_items si
          LEFT JOIN add_item i ON si.Item_Id = i.Item_Id
          WHERE si.Sale_Id IN (?)
          `,
        [saleIds]
      )
      : [[]];

    /* ---------------------------------------------------
       7️⃣ Build Final Objects
    --------------------------------------------------- */
    const purchaseMap = new Map();

    purchaseItems.forEach(it => {
      if (!purchaseMap.has(it.Purchase_Id)) {
        purchaseMap.set(it.Purchase_Id, []);
      }
      purchaseMap.get(it.Purchase_Id).push(it);
    });
    const purchaseBills = purchases.map((bill) => ({
      Type: "Purchase",
      ...bill,
      Party_Name: bill.Party_Name,
      Party_GST: bill.GSTIN,
      Party_Phone: bill.Phone_Number,
      items: purchaseMap.get(bill.Purchase_Id) || []
      // items: purchaseItems.filter(
      //   (it) => it.Purchase_Id === bill.Purchase_Id
      // ),
    }));

    const saleMap = new Map()
    saleItems.forEach(it => {
      if (!saleMap.has(it.Sale_Id)) {
        saleMap.set(it.Sale_Id, []);
      }
      saleMap.get(it.Sale_Id).push(it);
    });

    const saleBills = sales.map((bill) => ({
      Type: "Sale",
      ...bill,
      Party_Name: bill.Party_Name,
      Party_GST: bill.GSTIN,
      Party_Phone: bill.Phone_Number,
      items: saleMap.get(bill.Sale_Id) || [],
    }));

    /* ---------------------------------------------------
       8️⃣ Final Response
    --------------------------------------------------- */

    return res.status(200).json({
      success: true,
      Item_Id,
      Item_Name: items[0].Item_Name,
      page,
      limit,
      totalRecords,
      totalPages,
      purchases: purchaseBills,
      sales: saleBills,
      transactions,
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

const printEachItemSalesPurchasesReport = async (req, res) => {
  try {
    const {
      itemName,
      purchases = [],
      sales = [],
    } = req.body;

    const safe = (v) => (v !== undefined && v !== null ? v : "N/A");

    // 🔵 Build each Purchase/Sale section
    const buildSection = (title, list, type) => {
      if (!list.length) return [];

      const rows = [
        {
          text: title.toUpperCase(),
          style: "sectionHeader",
          alignment: "center",
          margin: [0, 20, 0, 10],
        },
      ];

      list.forEach((entry, idx) => {
        rows.push({
          unbreakable: true,
          stack: [
            // Small title
            {
              text: `${title.slice(0, -1)} ${idx + 1}`,
              style: "subTitle",
              margin: [0, 0, 0, 5],
            },

            // Party + Bill/Invoice details
            {
              columns: [
                {
                  width: "48%",
                  stack: [
                    { text: "Party Name", style: "label" },
                    { text: safe(entry.Party_Name), style: "value" },

                    { text: "GSTIN", style: "label" },
                    { text: safe(entry.GSTIN), style: "value" },

                    { text: "Phone", style: "label" },
                    { text: safe(entry.Phone_Number), style: "value" },
                  ],
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
                    },

                  ],
                },
              ],
              columnGap: 20,
              margin: [0, 0, 0, 10],
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
                    { text: "Amount", style: "tableHeader" },
                  ],

                  ...(entry.items || []).map((it, i) => [
                    i + 1,
                    safe(it.Item_Category),
                    safe(it.Item_Name),
                    safe(it.Item_HSN),
                    safe(it.Quantity),
                    safe(it.Sale_Price || it.Purchase_Price),
                    safe(it.Tax_Type),
                    Number(it.Amount || 0).toFixed(2),
                  ]),
                ],
              },
              layout: "lightHorizontalLines",
              margin: [0, 0, 0, 10],
            },

            // TOTALS
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
                        safe(entry.Total_Paid || entry.Total_Received),
                      ],
                      ["Balance Due", safe(entry.Balance_Due)],
                    ],
                  },
                  layout: "noBordersBox",
                },
              ],
              margin: [0, 0, 0, 15],
            },
          ],
        });
      });

      return rows;
    };

    // HEADER — print first party from first purchase or sale
    const firstEntry = purchases[0] || sales[0] || {};

    const docDefinition = {
      pageMargins: [18, 18, 18, 30],
      defaultStyle: { font: "Helvetica" },

      footer: (p, pc) => ({
        text: `Page ${p} of ${pc}`,
        alignment: "center",
        margin: [10, 10, 10, 10],
      }),

      content: [
        {
          text: safe(itemName),
          style: "header",
          alignment: "center",
          margin: [0, 0, 0, 8],
        },


        ...buildSection("Purchases", purchases, "purchase"),
        ...buildSection("Sales", sales, "sale"),
      ],

      styles: {
        header: { fontSize: 18, bold: true },
        sectionHeader: { fontSize: 15, bold: true },
        subTitle: { fontSize: 12, bold: true },
        label: { bold: true, fontSize: 10 },
        value: { fontSize: 10 },
        tableHeader: { bold: true, fillColor: "#eee" },
        tableSmall: { fontSize: 9 },
      },
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



export {
  addItem, editItem, addCategory, getAllItems, getAllCategories, eachItemSalesPurchaseDetails,
  printEachItemSalesPurchasesReport, eachItemBillAndInvoiceNumbers, addItemConversion, getItemConversions,
  getAllItemsForLedger, getItemBills, getItemsByCategory
};
// ALTER TABLE add_item


// CHANGE COLUMN Item_Unit Primary_Unit VARCHAR(255) NULL AFTER `Item_Unit`,


// ADD COLUMN Secondary_Unit VARCHAR(255) NULL
// AFTER Primary_Unit,


// ADD COLUMN Conversion_Rate DECIMAL(18,6) NULL
// AFTER Secondary_Unit,

// -- Opening stock entered from Item → Stock tab
// ADD COLUMN Opening_Quantity DECIMAL(18,6) NULL DEFAULT NULL
// AFTER Stock_Quantity,

// -- Cost/value of opening stock
// ADD COLUMN At_Price DECIMAL(10,2) NULL DEFAULT NULL
// AFTER Opening_Quantity,

// -- Date from which opening stock applies
// ADD COLUMN As_Of_Date DATE NULL DEFAULT NULL
// AFTER At_Price,

// -- Low-stock warning level
// ADD COLUMN Min_Stock DECIMAL(10,2) NULL DEFAULT NULL
// AFTER As_Of_Date,

// -- Storage location
// ADD COLUMN Location VARCHAR(255) NULL DEFAULT NULL
// AFTER Min_Stock;

// }
// | When bill was created | Unit used on bill | Item configuration NOW | OLD bill dropdown | NEW bill dropdown | Old stock effect              |
// | --------------------- | ----------------- | ---------------------- | ----------------- | ----------------- | ----------------------------- |
// | `None`                | None              | None                   | None              | None              | Stored `Base_Quantity`        |
// | `None`                | None              | `Kg`                   | **Kg**            | **Kg**            | unchanged                     |
// | `None`                | None              | `Kg + Gm`              | **Kg + Gm**       | **Kg + Gm**       | unchanged                     |
// | `Kg`                  | Kg                | `Kg + Gm`              | **Kg + Gm**       | **Kg + Gm**       | unchanged                     |
// | `Kg + Gm`             | **Kg**            | `Kg + Box`             | **Kg + Box**      | **Kg + Box**      | unchanged                     |
// | `Kg + Gm`             | **Gm**            | `Kg + Box`             | **Kg + Gm**       | **Kg + Box**      | unchanged                     |
// | `Kg + Gm`             | **Gm**            | secondary removed      | **Kg + Gm**       | **Kg**            | unchanged                     |
// | `Kg + Gm`             | **Kg**            | secondary removed      | **Kg**            | **Kg**            | unchanged                     |
// | `Kg + Gm`             | **Gm**            | rate changed           | **Kg + Gm**       | **Kg + Gm**       | old `Base_Quantity` unchanged |
