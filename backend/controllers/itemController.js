

import db from "../config/db.js";
import { recordItemLedger, reverseItemLedger } from "../utils/itemLedgerHelper.js";
import { sanitizeObject } from "../utils/sanitizeInput.js";
import itemFormSchema from "../validators/itemSchema.js";
import PdfPrinter from "pdfmake";
const cleanValue = (value) => {
  if (value === undefined || value === null || value === "" || value === " ") {
    return null; // store as NULL in DB
  }
  return value;  // ✅ returns the original value for valid data
};
const formatDateOnly = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const hasItemTransactions = async (connection, itemId) => {
  const [[{ transactionCount }]] = await connection.query(
    `
    SELECT
    (
        (SELECT COUNT(*) FROM add_purchase_items WHERE Item_Id = ?)
      + (SELECT COUNT(*) FROM add_sale_items WHERE Item_Id = ?)
      + (SELECT COUNT(*) FROM purchase_return_items WHERE Item_Id = ?)
      + (SELECT COUNT(*) FROM sale_return_items WHERE Item_Id = ?)
    ) AS transactionCount
    `,
    [itemId, itemId, itemId, itemId]
  );

  return Number(transactionCount) > 0;
};
{/* Add Item */ }

const getUsedUnits = async (connection, itemId) => {
  const [rows] = await connection.query(
    `
    SELECT Selected_Unit
    FROM add_purchase_items
    WHERE Item_Id = ?
      AND Selected_Unit IS NOT NULL
      AND TRIM(Selected_Unit) <> ''

    UNION

    SELECT Selected_Unit
    FROM add_sale_items
    WHERE Item_Id = ?
      AND Selected_Unit IS NOT NULL
      AND TRIM(Selected_Unit) <> ''

    UNION

    SELECT Selected_Unit
    FROM purchase_return_items
    WHERE Item_Id = ?
      AND Selected_Unit IS NOT NULL
      AND TRIM(Selected_Unit) <> ''

    UNION

    SELECT Selected_Unit
    FROM sale_return_items
    WHERE Item_Id = ?
      AND Selected_Unit IS NOT NULL
      AND TRIM(Selected_Unit) <> ''
    `,
    [itemId, itemId, itemId, itemId]
  );

  return new Set(
    rows
      .map(row => row.Selected_Unit?.trim())
      .filter(Boolean)
  );
};
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
    // if (stockQuantity > 0) {
    //   await recordItemLedger({
    //     connection,
    //     itemId,
    //     txnType: "Opening_Stock",
    //     referenceId: result.insertId,
    //     formattedId: itemId,
    //     partyName: null,
    //     quantity: stockQuantity,
    //     rate: At_Price ?? null,
    //     txnDate: As_Of_Date || new Date().toISOString().slice(0, 10)
    //   });
    // }
    if (stockQuantity > 0) {
      await recordItemLedger({
        connection,

        itemId,
        txnType: "Opening_Stock",

        // Same source id used to identify this opening stock entry
        referenceId: result.insertId,

        billId: itemId,
        billNumber: null,
        partyName: null,

        // User-entered opening quantity
        quantity: Number(stockQuantity),

        // Opening stock is always stored in the primary unit
        // (or null if no unit is configured)
        selectedUnit: primaryUnit || null,

        // No conversion needed for opening stock
        baseQty: Number(stockQuantity),

        rate: At_Price ?? null,

        txnDate: As_Of_Date || new Date().toISOString().slice(0, 10),
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
    // if (await hasItemTransactions(connection, Item_Id)) {
    //   return res.status(400).json({
    //     success: false,
    //     message:
    //       "This item has already been used in transactions. Unit configuration cannot be changed.",
    //   });
    // }
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

    //   const [[existingItem]] = await connection.query(
    //     `
    //   SELECT Primary_Unit
    //   FROM add_item
    //   WHERE Item_Id = ?
    //   LIMIT 1
    // `,
    //     [Item_Id]
    //   );
    // SELECT
    //   Primary_Unit,
    //   Secondary_Unit,
    //   Conversion_Rate
    // FROM add_item
    // WHERE Item_Id = ?
    // LIMIT 1
    const [[existingItem]] = await connection.query(
      `

  SELECT
  id,
  Primary_Unit,
  Secondary_Unit,
  Conversion_Rate
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

    //const oldPrimary = existingItem.Primary_Unit || null;
    //const newPrimary = Primary_Unit || null;

    const oldPrimary = existingItem.Primary_Unit || null;
    const oldSecondary = existingItem.Secondary_Unit || null;
    const oldConversion =
      existingItem.Conversion_Rate == null
        ? null
        : Number(existingItem.Conversion_Rate);

    const newConversion =
      Secondary_Unit
        ? (
          Conversion_Rate == null
            ? null
            : Number(Conversion_Rate)
        )
        : null;

    const newPrimary = Primary_Unit || null;
    const newSecondary = Secondary_Unit || null;
    //const newConversion =
    Secondary_Unit ? Number(Conversion_Rate) || null : null;
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
    // const hasTransactions = await hasItemTransactions(
    //   connection,
    //   Item_Id
    // );
    const usedUnits = await getUsedUnits(
      connection,
      Item_Id
    );

    const primaryUsed =
      oldPrimary &&
      usedUnits.has(oldPrimary);

    const secondaryUsed =
      oldSecondary &&
      usedUnits.has(oldSecondary);



    // =========================================================
    // PRIMARY UNIT LOCK
    // =========================================================

    if (
      primaryUsed &&
      oldPrimary !== newPrimary
    ) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          `Primary Unit "${oldPrimary}" cannot be changed because it has already been used in a transaction.`,
      });
    }


    // =========================================================
    // SECONDARY UNIT LOCK
    // =========================================================

    if (
      secondaryUsed &&
      (
        oldSecondary !== newSecondary ||
        oldConversion !== newConversion
      )
    ) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          `Secondary Unit "${oldSecondary}" and its Conversion Rate cannot be changed because it has already been used in a transaction.`,
      });
    }


    // =========================================================
    // UPDATE ITEM
    // =========================================================



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
    // UPDATE OPENING STOCK LEDGER
    // =========================================================


    // await recordItemLedger({
    //   connection,
    //   itemId: Item_Id,
    //   txnType: "Opening_Stock",

    //   // Same Source_Id used when the item was created
    //   referenceId: existingItem.id,

    //   billId: Item_Id,
    //   billNumber: null,
    //   partyName: null,

    //   // User-entered opening quantity
    //   quantity: Number(Opening_Quantity) || 0,

    //   // Display unit
    //   selectedUnit: Primary_Unit || null,

    //   // Stock quantity (same as quantity for opening stock)
    //   baseQty: Number(Opening_Quantity) || 0,

    //   rate: At_Price ?? null,

    //   txnDate: As_Of_Date || new Date().toISOString().slice(0, 10),
    // });
    // =========================================================
    // CREATE OPENING STOCK LEDGER ONLY IF USER ENTERED IT
    // =========================================================

    if (
      Opening_Quantity !== null &&
      Opening_Quantity !== undefined &&
      Number(Opening_Quantity) > 0
    ) {
      await recordItemLedger({
        connection,
        itemId: Item_Id,
        txnType: "Opening_Stock",

        referenceId: existingItem.id,

        billId: null,
        billNumber: null,
        partyName: null,

        quantity: Number(Opening_Quantity),

        selectedUnit: Primary_Unit || null,

        baseQty: Number(Opening_Quantity),

        rate: At_Price ?? null,

        txnDate:
          As_Of_Date ||
          new Date().toISOString().slice(0, 10),
      });
    }
    const [[latestLedger]] = await connection.query(
      `
  SELECT Running_Stock
  FROM item_ledger
  WHERE Item_Id = ?
  ORDER BY id DESC
  LIMIT 1
  `,
      [Item_Id]
    );

    await connection.query(
      `
  UPDATE add_item
  SET Stock_Quantity = ?
  WHERE Item_Id = ?
  `,
      [
        latestLedger
          ? Number(latestLedger.Running_Stock)
          : 0,
        Item_Id,
      ]
    );
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

// const editItem = async (req, res, next) => {
//   let connection;
//   try {
//     connection = await db.getConnection();
//     await connection.beginTransaction(); // ✅ Start transaction

//     const { Item_Id } = req.params;
//     const cleanData = sanitizeObject(req.body);
//     const validation = itemFormSchema.safeParse(cleanData);
//     if (!validation.success) {
//       await connection.rollback();

//       return res.status(400).json({
//         errors: validation.error.errors,
//       });
//     }
//     // const { Item_Name, Item_HSN, Item_Unit,  Item_Category } = validation.data;
//     const {
//       Item_Name,
//       Item_HSN,
//       Item_Unit,          // legacy

//       Item_Category,

//       Primary_Unit,
//       Secondary_Unit,
//       Conversion_Rate,

//       Opening_Quantity,
//       At_Price,
//       As_Of_Date,
//       Min_Stock,
//       Location,
//     } = validation.data;
//     const normalizedName = Item_Name.trim().toLowerCase();

//     const [duplicate] = await connection.query(
//       `SELECT Item_Id
//    FROM add_item
//    WHERE LOWER(TRIM(Item_Name)) = ?
//      AND Item_Id <> ?`,
//       [normalizedName, Item_Id]
//     );

//     if (duplicate.length > 0) {
//       await connection.rollback();
//       return res.status(400).json({
//         success: false,
//         message: "Another item with this name already exists.",
//       });
//     }
//     // =========================================================
//     // PRIMARY UNIT LOCK
//     //
//     // RULE:
//     // If this item has EVER been used in a transaction
//     // with ANY selected unit, Primary_Unit cannot change.
//     //
//     // Secondary_Unit can still change.
//     // =========================================================

//     //   const [[existingItem]] = await connection.query(
//     //     `
//     //   SELECT Primary_Unit
//     //   FROM add_item
//     //   WHERE Item_Id = ?
//     //   LIMIT 1
//     // `,
//     //     [Item_Id]
//     //   );
//     // SELECT
//     //   Primary_Unit,
//     //   Secondary_Unit,
//     //   Conversion_Rate
//     // FROM add_item
//     // WHERE Item_Id = ?
//     // LIMIT 1
//     const [[existingItem]] = await connection.query(
//       `

//   SELECT
//   id,
//   Primary_Unit,
//   Secondary_Unit,
//   Conversion_Rate
// FROM add_item
// WHERE Item_Id = ?
// LIMIT 1


//   `,
//       [Item_Id]
//     );

//     if (!existingItem) {
//       await connection.rollback();

//       return res.status(404).json({
//         success: false,
//         message: "Item not found.",
//       });
//     }

//     //const oldPrimary = existingItem.Primary_Unit || null;
//     //const newPrimary = Primary_Unit || null;

//     const oldPrimary = existingItem.Primary_Unit || null;
//     const oldSecondary = existingItem.Secondary_Unit || null;
//     const oldConversion =
//       existingItem.Conversion_Rate == null
//         ? null
//         : Number(existingItem.Conversion_Rate);

//     const newConversion =
//       Secondary_Unit
//         ? (
//           Conversion_Rate == null
//             ? null
//             : Number(Conversion_Rate)
//         )
//         : null;

//     const newPrimary = Primary_Unit || null;
//     const newSecondary = Secondary_Unit || null;
//     //const newConversion =
//     Secondary_Unit ? Number(Conversion_Rate) || null : null;
//     // =========================================================
//     // ONLY CHECK WHEN PRIMARY IS BEING CHANGED
//     // =========================================================
//     //+
//     // (
//     //   SELECT COUNT(*)
//     //   FROM add_sale_items
//     //   WHERE Item_Id = ?
//     //     AND Selected_Unit IS NOT NULL
//     //     AND TRIM(Selected_Unit) <> ''
//     // )
//     const hasTransactions = await hasItemTransactions(
//       connection,
//       Item_Id
//     );

//     //     if (oldPrimary !== newPrimary) {

//     //       const [[{ unitUsedCount }]] = await connection.query(
//     //         `
//     //      SELECT
//     // (
//     //     SELECT COUNT(*)
//     //     FROM add_purchase_items
//     //     WHERE Item_Id = ?
//     //       AND Selected_Unit IS NOT NULL
//     //       AND TRIM(Selected_Unit) <> ''
//     // )
//     // +
//     // (
//     //     SELECT COUNT(*)
//     //     FROM add_sale_items
//     //     WHERE Item_Id = ?
//     //       AND Selected_Unit IS NOT NULL
//     //       AND TRIM(Selected_Unit) <> ''
//     // )
//     // +
//     // (
//     //     SELECT COUNT(*)
//     //     FROM purchase_return_items
//     //     WHERE Item_Id = ?
//     //       AND Selected_Unit IS NOT NULL
//     //       AND TRIM(Selected_Unit) <> ''
//     // )
//     // +
//     // (
//     //     SELECT COUNT(*)
//     //     FROM sale_return_items
//     //     WHERE Item_Id = ?
//     //       AND Selected_Unit IS NOT NULL
//     //       AND TRIM(Selected_Unit) <> ''
//     // )
//     // AS unitUsedCount
//     //     `,
//     //         [
//     //           Item_Id,
//     //           Item_Id,
//     //           Item_Id,
//     //           Item_Id,
//     //         ]
//     //       );


//     //       // =======================================================
//     //       // ANY UNIT HAS BEEN USED
//     //       // PRIMARY IS NOW LOCKED
//     //       // =======================================================

//     //       if (Number(unitUsedCount) > 0) {
//     //         await connection.rollback();

//     //         return res.status(400).json({
//     //           success: false,
//     //           // message:
//     //           //   `Primary Unit "${oldPrimary || "None"}" cannot be changed ` +
//     //           //   `because this item has already been used with a unit in a transaction.`,
//     //                 message:
//     //             `Unit cannot be changed ` +
//     //             `because this item has already been used with a unit in a transaction.`,
//     //         });
//     //       }
//     //     }
//     if (hasTransactions) {

//       // ------------------------------------------------------
//       // Rule 1
//       // Primary can never change after transactions
//       // ------------------------------------------------------

//       if (oldPrimary !== newPrimary) {
//         await connection.rollback();

//         return res.status(400).json({
//           success: false,
//           message:
//             " Unit cannot be changed because this item has already been used in transactions.",
//         });
//       }

//       // ------------------------------------------------------
//       // Rule 2
//       // Once Secondary exists, it becomes locked.
//       //
//       // If Secondary is still NULL,
//       // user may add one later.
//       // ------------------------------------------------------

//       if (oldSecondary !== null) {
//         if (
//           oldSecondary !== newSecondary ||
//           oldConversion !== newConversion
//         ) {
//           await connection.rollback();

//           return res.status(400).json({
//             success: false,
//             message:
//               "Secondary Unit and Conversion Rate cannot be changed because this item has already been used in transactions.",
//           });
//         }
//       }
//     }
//     const [result] = await connection.execute(
//       `UPDATE add_item
// SET
//     Item_Name=?,
//     Item_HSN=?,
//     Item_Unit=?,

//     Item_Category=?,

//     Primary_Unit=?,
//     Secondary_Unit=?,
//     Conversion_Rate=?,

//     Opening_Quantity=?,
//     At_Price=?,
//     As_Of_Date=?,
//     Min_Stock=?,
//     Location=?,

//     updated_at=NOW()

// WHERE Item_Id=?`,
//       [
//         Item_Name,
//         Item_HSN || null,
//         Item_Unit || "",

//         Item_Category || "",

//         Primary_Unit || null,
//         Secondary_Unit || null,
//         Secondary_Unit
//           ? Conversion_Rate ?? null
//           : null,

//         Opening_Quantity ?? null,
//         At_Price ?? null,
//         As_Of_Date || null,
//         Min_Stock ?? null,
//         Location || null,

//         Item_Id,
//       ]
//     );

//     if (result.affectedRows === 0) {
//       await connection.rollback();
//       return res.status(404).json({ message: "Item not found" });
//     }
//     // =========================================================
//     // UPDATE OPENING STOCK LEDGER
//     // =========================================================


//     // await recordItemLedger({
//     //   connection,
//     //   itemId: Item_Id,
//     //   txnType: "Opening_Stock",

//     //   // Same Source_Id used when the item was created
//     //   referenceId: existingItem.id,

//     //   billId: Item_Id,
//     //   billNumber: null,
//     //   partyName: null,

//     //   // User-entered opening quantity
//     //   quantity: Number(Opening_Quantity) || 0,

//     //   // Display unit
//     //   selectedUnit: Primary_Unit || null,

//     //   // Stock quantity (same as quantity for opening stock)
//     //   baseQty: Number(Opening_Quantity) || 0,

//     //   rate: At_Price ?? null,

//     //   txnDate: As_Of_Date || new Date().toISOString().slice(0, 10),
//     // });
//     // =========================================================
// // CREATE OPENING STOCK LEDGER ONLY IF USER ENTERED IT
// // =========================================================

// if (
//   Opening_Quantity !== null &&
//   Opening_Quantity !== undefined &&
//   Number(Opening_Quantity) > 0
// ) {
//   await recordItemLedger({
//     connection,
//     itemId: Item_Id,
//     txnType: "Opening_Stock",

//     referenceId: existingItem.id,

//     billId: null,
//     billNumber: null,
//     partyName: null,

//     quantity: Number(Opening_Quantity),

//     selectedUnit: Primary_Unit || null,

//     baseQty: Number(Opening_Quantity),

//     rate: At_Price ?? null,

//     txnDate:
//       As_Of_Date ||
//       new Date().toISOString().slice(0, 10),
//   });
// }
//     const [[latestLedger]] = await connection.query(
//       `
//   SELECT Running_Stock
//   FROM item_ledger
//   WHERE Item_Id = ?
//   ORDER BY id DESC
//   LIMIT 1
//   `,
//       [Item_Id]
//     );

//     await connection.query(
//       `
//   UPDATE add_item
//   SET Stock_Quantity = ?
//   WHERE Item_Id = ?
//   `,
//       [
//         latestLedger
//           ? Number(latestLedger.Running_Stock)
//           : 0,
//         Item_Id,
//       ]
//     );
//     // =========================================================
//     // UPDATE UNIT CONVERSION
//     // =========================================================

//     // =========================================================
//     // SAVE UNIT CONVERSION HISTORY
//     // =========================================================

//     if (
//       Primary_Unit &&
//       Secondary_Unit &&
//       Number(Conversion_Rate) > 0
//     ) {
//       await connection.execute(
//         `
//       INSERT INTO item_unit_conversions
//       (
//         Item_Id,
//         Primary_Unit,
//         Secondary_Unit,
//         Conversion_Rate
//       )
//       SELECT ?, ?, ?, ?
//       WHERE NOT EXISTS (
//         SELECT 1
//         FROM item_unit_conversions
//         WHERE Item_Id = ?
//           AND Primary_Unit = ?
//           AND Secondary_Unit = ?
//           AND Conversion_Rate = ?
//       )
//     `,
//         [
//           Item_Id,
//           Primary_Unit,
//           Secondary_Unit,
//           Conversion_Rate,

//           Item_Id,
//           Primary_Unit,
//           Secondary_Unit,
//           Conversion_Rate,
//         ]
//       );
//     }
//     await connection.commit();

//     return res.status(200).json({
//       success: true,
//       message: "Item updated successfully",
//     });

//   } catch (err) {
//     if (connection) await connection.rollback();
//     console.error("❌ Error editing item:", err);
//     next(err);
//     // return res.status(500).json({ message: "Internal Server Error" });
//   } finally {
//     if (connection) connection.release();
//   }
// }
const deleteItem = async (req, res, next) => {
  let connection;

  try {
    const { Item_Id } = req.params;

    if (!Item_Id) {
      return res.status(400).json({
        success: false,
        message: "Item ID is required.",
      });
    }

    connection = await db.getConnection();

    await connection.beginTransaction();

    // =========================================================
    // 1. CHECK ITEM EXISTS
    // =========================================================

    const [[item]] = await connection.query(
      `
      SELECT
        id,
        Item_Id,
        Item_Name
      FROM add_item
      WHERE Item_Id = ?
      LIMIT 1
      `,
      [Item_Id]
    );

    if (!item) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Item not found.",
      });
    }

    // =========================================================
    // 2. CHECK ITEM LEDGER
    //
    // If ANY transaction exists for this item,
    // item cannot be deleted.
    // =========================================================

    const [[ledgerCount]] = await connection.query(
      `
      SELECT COUNT(*) AS count
      FROM item_ledger
      WHERE Item_Id = ?
      `,
      [Item_Id]
    );

    if (Number(ledgerCount.count) > 0) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        canDelete: false,
        message:
          "This item cannot be deleted because transactions exist for this item. Delete the related sales, purchases, returns, stock adjustments, or opening stock transaction first.",
      });
    }

    // =========================================================
    // 3. DELETE ITEM UNIT CONVERSIONS
    // =========================================================

    await connection.query(
      `
      DELETE FROM item_unit_conversions
      WHERE Item_Id = ?
      `,
      [Item_Id]
    );

    // =========================================================
    // 4. DELETE STOCK ADJUSTMENTS
    //
    // Normally there should be none because any adjustment
    // should have an item_ledger row.
    //
    // This is just cleanup / FK safety.
    // =========================================================

    await connection.query(
      `
      DELETE FROM item_stock_adjustments
      WHERE Item_Id = ?
      `,
      [Item_Id]
    );

    // =========================================================
    // 5. DELETE ITEM
    // =========================================================

    await connection.query(
      `
      DELETE FROM add_item
      WHERE Item_Id = ?
      `,
      [Item_Id]
    );

    // =========================================================
    // 6. COMMIT
    // =========================================================

    await connection.commit();

    return res.status(200).json({
      success: true,
      canDelete: true,
      message: "Item deleted successfully.",
      Item_Id,
    });

  } catch (err) {

    if (connection) {
      await connection.rollback();
    }

    console.error("❌ Error deleting item:", err);

    next(err);

  } finally {

    if (connection) {
      connection.release();
    }
  }
};

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

    // const [purchaseItems] = await connection.query(`
    //   SELECT
    //     Item_Id,
    //     Purchase_Price,
    //     Tax_Type
    //   FROM add_purchase_items
    //   ORDER BY created_at DESC
    // `);

    // =========================================================
    // 6. SALES HISTORY
    // =========================================================

    // const [salesItems] = await connection.query(`
    //   SELECT
    //     Item_Id,
    //     Sale_Price
    //   FROM add_sale_items
    //   ORDER BY created_at DESC
    // `);

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
    // 7A. ITEMS USED IN TRANSACTIONS
    // =========================================================

    const [usedItems] = await connection.query(`
SELECT DISTINCT Item_Id
FROM (
    SELECT Item_Id FROM add_purchase_items

    UNION

    SELECT Item_Id FROM add_sale_items

    UNION

    SELECT Item_Id FROM purchase_return_items

    UNION

    SELECT Item_Id FROM sale_return_items
) t
`);

    const usedItemSet = new Set(
      usedItems.map((row) => row.Item_Id)
    );

    // =========================================================
    // 8. LATEST PURCHASE PRICE + TAX
    // =========================================================

    // const latestPurchasePrice = {};
    // const latestTaxType = {};

    // purchaseItems.forEach((row) => {
    //   if (latestPurchasePrice[row.Item_Id] === undefined) {
    //     latestPurchasePrice[row.Item_Id] =
    //       row.Purchase_Price;

    //     latestTaxType[row.Item_Id] =
    //       row.Tax_Type;
    //   }
    // });

    // =========================================================
    // 9. LATEST SALE PRICE
    // =========================================================

    // const latestSalePrice = {};

    // salesItems.forEach((row) => {
    //   if (latestSalePrice[row.Item_Id] === undefined) {
    //     latestSalePrice[row.Item_Id] =
    //       row.Sale_Price;
    //   }
    // });

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
      const hasTransactions = usedItemSet.has(item.Item_Id);

      const canEditUnits =
        !item.Primary_Unit
          ? true
          : !item.Secondary_Unit
            ? true
            : !hasTransactions;
      return {
        ...item,

        // Prices now come directly from add_item
        Purchase_Price: item.Purchase_Price ?? 0,

        Sale_Price: item.Sale_Price ?? 0,

        Available_Units: availableUnits,

        unitConversions:
          conversionsByItem[item.Item_Id] || [],

        Can_Edit_Units: canEditUnits,
      };
      // return {
      //   ...item,

      //   Purchase_Price:
      //     latestPurchasePrice[item.Item_Id] ?? 0,

      //   Tax_Type:
      //     latestTaxType[item.Item_Id] ?? null,

      //   Sale_Price:
      //     latestSalePrice[item.Item_Id] ?? 0,

      //   // CURRENT configured units
      //   Available_Units: availableUnits,

      //   // Historical conversion records
      //   unitConversions: conversionsByItem[item.Item_Id] || [],

      //   Can_Edit_Units: canEditUnits,
      // };
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
    // 1. SEARCH
    // =========================================================

    const search = req.query.search
      ? req.query.search.trim().toLowerCase()
      : "";
    const limit = parseInt(req.query.limit, 10) || 10;
    const cursorId = req.query.cursor ? Number(req.query.cursor) : null;

    // const params = [];

    // let whereSQL = "";

    // if (search) {
    //   const like = `%${search}%`;

    //   whereSQL = `
    //     WHERE (
    //       LOWER(Item_Name) LIKE ?
    //       OR LOWER(Item_Category) LIKE ?
    //       OR LOWER(Item_HSN) LIKE ?
    //       OR LOWER(Item_Id) LIKE ?
    //       OR LOWER(Item_Unit) LIKE ?
    //       OR LOWER(Primary_Unit) LIKE ?
    //       OR LOWER(Secondary_Unit) LIKE ?
    //     )
    //   `;

    //   params.push(
    //     like,
    //     like,
    //     like,
    //     like,
    //     like,
    //     like,
    //     like
    //   );
    // }
    // if (cursorId) {
    //   whereClauses.push(`id < ?`);
    //   params.push(cursorId);
    // }
    const whereParts = [];
    const params = [];

    if (search) {
      const like = `%${search}%`;
      whereParts.push(`(
        LOWER(Item_Name) LIKE ?
        OR LOWER(Item_Category) LIKE ?
        OR LOWER(Item_HSN) LIKE ?
        OR LOWER(Item_Id) LIKE ?
        OR LOWER(Item_Unit) LIKE ?
        OR LOWER(Primary_Unit) LIKE ?
        OR LOWER(Secondary_Unit) LIKE ?
      )`);
      params.push(like, like, like, like, like, like, like);
    }

    if (cursorId) {
      whereParts.push(`id < ?`);
      params.push(cursorId);
    }

    const whereSQL = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";

    // =========================================================
    // 2. GET ALL ITEMS
    //
    // Same important fields as getAllItems
    // =========================================================

    // const [items] = await connection.query(
    //   `
    //   SELECT
    //     id,
    //     Item_Id,
    //     Item_Name,
    //     Item_HSN,
    //     Item_Category,
    //     Item_Unit,

    //     Primary_Unit,
    //     Secondary_Unit,
    //     Conversion_Rate,

    //     Stock_Quantity,
    //     Opening_Quantity,
    //     At_Price,
    //     As_Of_Date,
    //     Min_Stock,
    //     Location,

    //     created_at,
    //     updated_at

    //   FROM add_item

    //   ${whereSQL}

    // ORDER BY id DESC
    //   `,
    //   [...params, limit + 1]
    // );

    // =========================================================
    // 3. PURCHASE HISTORY
    //
    // Used to get latest purchase price + tax type
    // =========================================================

    const [purchaseItems] = await connection.query(
      `
      SELECT
        Item_Id,
        Purchase_Price,
        Tax_Type,
        created_at
      FROM add_purchase_items
      ORDER BY created_at DESC
      `
    );

    // =========================================================
    // 4. SALES HISTORY
    //
    // Used to get latest sale price
    // =========================================================

    const [salesItems] = await connection.query(
      `
      SELECT
        Item_Id,
        Sale_Price,
        created_at
      FROM add_sale_items
      ORDER BY created_at DESC
      `
    );

    // =========================================================
    // 5. UNIT CONVERSION HISTORY
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
      ORDER BY created_at DESC, id DESC
      `
    );

    // =========================================================
    // 6. ITEMS USED IN TRANSACTIONS
    //
    // Needed for Can_Edit_Units
    //
    // If an item already has transactions and both
    // Primary + Secondary units exist, don't allow
    // changing the unit configuration.
    // =========================================================

    // const [usedItems] = await connection.query(
    //   `
    //   SELECT DISTINCT Item_Id
    //   FROM (
    //     SELECT Item_Id
    //     FROM add_purchase_items

    //     UNION

    //     SELECT Item_Id
    //     FROM add_sale_items

    //     UNION

    //     SELECT Item_Id
    //     FROM purchase_return_items

    //     UNION

    //     SELECT Item_Id
    //     FROM sale_return_items
    //   ) t
    //   `
    // );
    const [usedUnitsRows] = await connection.query(`
  SELECT Item_Id, Selected_Unit
  FROM add_purchase_items
  WHERE Selected_Unit IS NOT NULL
    AND TRIM(Selected_Unit) <> ''

  UNION

  SELECT Item_Id, Selected_Unit
  FROM add_sale_items
  WHERE Selected_Unit IS NOT NULL
    AND TRIM(Selected_Unit) <> ''

  UNION

  SELECT Item_Id, Selected_Unit
  FROM purchase_return_items
  WHERE Selected_Unit IS NOT NULL
    AND TRIM(Selected_Unit) <> ''

  UNION

  SELECT Item_Id, Selected_Unit
  FROM sale_return_items
  WHERE Selected_Unit IS NOT NULL
    AND TRIM(Selected_Unit) <> ''
`);

    // const usedItemSet = new Set(
    //   usedItems.map((row) => row.Item_Id)
    // );
    const usedUnitsByItem = {};

    usedUnitsRows.forEach((row) => {
      if (!usedUnitsByItem[row.Item_Id]) {
        usedUnitsByItem[row.Item_Id] = new Set();
      }

      usedUnitsByItem[row.Item_Id].add(
        row.Selected_Unit.trim()
      );
    });

    // =========================================================
    // 7. LATEST PURCHASE PRICE + TAX
    //
    // purchaseItems are already ordered DESC,
    // so first occurrence is latest.
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
    // 8. LATEST SALE PRICE
    // =========================================================

    const latestSalePrice = {};

    salesItems.forEach((row) => {
      if (latestSalePrice[row.Item_Id] === undefined) {
        latestSalePrice[row.Item_Id] =
          row.Sale_Price;
      }
    });

    // =========================================================
    // 9. GROUP CONVERSION HISTORY BY ITEM
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
          conversion.Conversion_Rate !== null
            ? Number(conversion.Conversion_Rate)
            : null,

        created_at:
          conversion.created_at,
      });
    });

    // =========================================================
    // 10. UNIT MASTER
    //
    // Used to show unit name + shorthand
    // =========================================================

    const [unitMaster] = await connection.query(
      `
      SELECT
        Unit_Name,
        Unit_Shorthand
      FROM units
      `
    );

    const unitLookup = {};

    unitMaster.forEach((unit) => {
      unitLookup[unit.Unit_Shorthand] =
        unit.Unit_Name;
    });


    const [[{ totalItems }]] = await db.query(
      `
  SELECT COUNT(*) AS totalItems
  FROM add_item
  ${whereSQL}
  `,
      params
    );

    const [rows] = await db.query(
      `
  SELECT *
  FROM add_item
  ${whereSQL}
  ORDER BY id DESC
  LIMIT ?
  `,
      [...params, limit + 1]
    );

    const hasMore = rows.length > limit;
    const pageItems = hasMore ? rows.slice(0, limit) : rows;
    // const hasMore = items.length > limit;
    // const pageItems = hasMore ? items.slice(0, limit) : items;
    const result = pageItems.map((item) => {

      // -------------------------------------------------------
      // CURRENT AVAILABLE UNITS
      //
      // Only current item master units.
      // Historical conversions are kept separately.
      // -------------------------------------------------------

      const availableUnits = [];

      // PRIMARY UNIT
      if (item.Primary_Unit) {
        availableUnits.push({
          Unit_Shorthand:
            item.Primary_Unit,

          Unit_Name:
            unitLookup[item.Primary_Unit] ||
            item.Primary_Unit,
        });
      }

      // SECONDARY UNIT
      if (
        item.Secondary_Unit &&
        item.Secondary_Unit !== item.Primary_Unit
      ) {
        availableUnits.push({
          Unit_Shorthand:
            item.Secondary_Unit,

          Unit_Name:
            unitLookup[item.Secondary_Unit] ||
            item.Secondary_Unit,
        });
      }

      // =======================================================
      // UNIT USAGE / EDIT PERMISSION
      // =======================================================

      // const hasTransactions =usedItemSet.has(item.Item_Id);



      // const canEditUnits =
      //   !item.Primary_Unit
      //     ? true
      //     : !item.Secondary_Unit
      //       ? true
      //       : !hasTransactions;
      const usedUnits =
        usedUnitsByItem[item.Item_Id] || new Set();

      const primaryUsed =
        item.Primary_Unit
          ? usedUnits.has(item.Primary_Unit)
          : false;

      const secondaryUsed =
        item.Secondary_Unit
          ? usedUnits.has(item.Secondary_Unit)
          : false;

      //    const canEditUnits =
      // !item.Secondary_Unit
      //   ? true
      //   : !primaryUsed;
      const canEditUnits = {
        Primary: !primaryUsed,

        // If there is no secondary yet, it can be added.
        // If secondary exists, it can only be changed if it has NOT been used.
        Secondary: !secondaryUsed,
      };
      //           console.log("🔍 UNIT CHECK", {
      //   Item_Id: item.Item_Id,
      //   Primary_Unit: item.Primary_Unit,
      //   Secondary_Unit: item.Secondary_Unit,
      //   usedUnits: [...usedUnits],
      //   primaryUsed,
      //   canEditUnits,
      // });
      // -------------------------------------------------------
      // RETURN ITEM
      // -------------------------------------------------------

      return {
        ...item,

        // Latest transaction information
        Purchase_Price:
          latestPurchasePrice[item.Item_Id] ?? 0,

        Tax_Type:
          latestTaxType[item.Item_Id] ?? null,

        Sale_Price:
          latestSalePrice[item.Item_Id] ?? 0,

        // Current configured units
        Available_Units:
          availableUnits,

        // Historical conversion records
        unitConversions:
          conversionsByItem[item.Item_Id] || [],

        // Unit editing permission
        Can_Edit_Units:
          canEditUnits,

        // Numeric values
        Conversion_Rate:
          item.Conversion_Rate !== null
            ? Number(item.Conversion_Rate)
            : null,

        Stock_Quantity:
          Number(item.Stock_Quantity || 0),

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
      };
    });

    // =========================================================
    // 12. RESPONSE
    // =========================================================

    return res.status(200).json({
      success: true,
      totalItems,
      //totalItems: result.length,

      items: result,
      hasMore,
      nextCursor: hasMore ? pageItems[pageItems.length - 1].id : null,
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
      `SELECT
      id,
         Item_Id,
         Item_Name,
         Item_HSN,
         Item_Category,
         Item_Unit,
         Primary_Unit,
         Secondary_Unit,
         Conversion_Rate,
         Sale_Price,
         Purchase_Price,
         Stock_Quantity
       FROM add_item
       WHERE Item_Id = ?
       LIMIT 1`,
      [Item_Id]
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found.",
      });
    }

    //     const [unitConversions] = await connection.query(
    //   `
    //   SELECT
    //     id,
    //     Item_Id,
    //     Primary_Unit,
    //     Secondary_Unit,
    //     Conversion_Rate
    //   FROM item_unit_conversions
    //   WHERE Item_Id = ?
    //   ORDER BY id ASC
    //   `,
    //   [Item_Id]
    // );
    // =========================================================
    // 3. BUILD LEDGER FILTER
    // =========================================================

    const where = [`Item_Id = ?`];
    const params = [Item_Id];


    if (search?.trim()) {
      const like = `%${search.trim().toLowerCase()}%`;

      where.push(`(
    LOWER(COALESCE(Bill_Number, '')) LIKE ?
    OR LOWER(COALESCE(Party_Name, '')) LIKE ?
    OR LOWER(COALESCE(Txn_Type, '')) LIKE ?
    OR CAST(COALESCE(Quantity, 0) AS CHAR) LIKE ?
    OR CAST(COALESCE(Rate, 0) AS CHAR) LIKE ?
    OR DATE_FORMAT(Txn_Date, '%d/%m/%Y') LIKE ?
  )`);

      params.push(
        like,
        like,
        like,
        like,
        like,
        like
      );
    }


    if (date) {
      where.push(`DATE(Txn_Date) = ?`);
      params.push(date);
    }

    // =========================================================
    // 4. CURSOR
    // =========================================================

    if (cursor) {
      try {
        const decoded = JSON.parse(
          Buffer.from(cursor, "base64").toString("utf8")
        );

        if (!decoded.date || !decoded.id) {
          return res.status(400).json({ success: false, message: "Invalid cursor." });
        }

        where.push(`(
          Txn_Date < ?
          OR (Txn_Date = ? AND id < ?)
        )`);
        params.push(decoded.date, decoded.date, Number(decoded.id));

      } catch {
        return res.status(400).json({ success: false, message: "Invalid cursor." });
      }
    }

    // =========================================================
    // 5. FETCH LIMIT + 1
    // =========================================================

    const [rows] = await connection.query(
      `SELECT
         id          AS Ledger_Id,
         Item_Id,
         Txn_Type,
         Direction,
         Source_Id,
         Bill_Id,
         Bill_Number,
         Party_Name,
         Quantity,
         Selected_Unit,
         Rate,
         Running_Stock,
         Txn_Date
       FROM item_ledger
       WHERE ${where.join(" AND ")}
       ORDER BY Txn_Date DESC, id DESC
       LIMIT ?`,
      [...params, limit + 1]
    );

    const hasMore = rows.length > limit;
    const transactions = hasMore ? rows.slice(0, limit) : rows;
    // =========================================================
    // 5A. GET STOCK ADJUSTMENT DETAILS
    // =========================================================

    const adjustmentSourceIds = transactions
      .filter(
        (r) =>
          (
            r.Txn_Type === "Add_Adjustment" ||
            r.Txn_Type === "Reduce_Adjustment"
          ) &&
          r.Source_Id
      )
      .map((r) => r.Source_Id);

    const adjustmentMap = new Map();

    if (adjustmentSourceIds.length > 0) {
      const [adjustmentRows] = await connection.query(
        `
    SELECT
      id,
      Item_Id,
      At_Price,
      Details,
      Adjustment_Date
    FROM item_stock_adjustments
    WHERE id IN (?)
      AND Item_Id = ?
    `,
        [
          adjustmentSourceIds,
          Item_Id,
        ]
      );

      adjustmentRows.forEach((row) => {
        adjustmentMap.set(row.id, row);
      });
    }
    // =========================================================
    // 6. RESOLVE RETURN Bill_Id
    //
    // For Purchase_Return and Sale_Return:
    //   Bill_Id is NULL in item_ledger.
    //   Source_Id → purchase_return_items.id
    //             → sale_return_items.id
    //
    //   Join through item table to get the return header id.
    //   Return header id is what frontend uses to navigate
    //   to /purchase/return/edit/:id or /sale/return/edit/:id
    //
    // For Purchase and Sale:
    //   Bill_Id already holds e.g. "PUR001" / "SAL001" — no join needed.
    // =========================================================

    const purchaseReturnSourceIds = transactions
      .filter((r) => r.Txn_Type === "Purchase_Return" && r.Source_Id)
      .map((r) => r.Source_Id);

    const saleReturnSourceIds = transactions
      .filter((r) => r.Txn_Type === "Sale_Return" && r.Source_Id)
      .map((r) => r.Source_Id);

    /* Maps: source_id → return header numeric id */
    const purchaseReturnMap = new Map();
    const saleReturnMap = new Map();

    if (purchaseReturnSourceIds.length > 0) {
      const [prRows] = await connection.query(
        `SELECT
           pri.id                 AS source_id,
           pri.Purchase_Return_Id AS return_header_id
         FROM purchase_return_items pri
         WHERE pri.id IN (?)`,
        [purchaseReturnSourceIds]
      );
      prRows.forEach((r) =>
        purchaseReturnMap.set(r.source_id, r.return_header_id)
      );
    }

    if (saleReturnSourceIds.length > 0) {
      const [srRows] = await connection.query(
        `SELECT
           sri.id             AS source_id,
           sri.Sale_Return_Id AS return_header_id
         FROM sale_return_items sri
         WHERE sri.id IN (?)`,
        [saleReturnSourceIds]
      );
      srRows.forEach((r) =>
        saleReturnMap.set(r.source_id, r.return_header_id)
      );
    }

    // =========================================================
    // 7. NEXT CURSOR
    // =========================================================

    let nextCursor = null;

    if (hasMore && transactions.length > 0) {
      const last = transactions[transactions.length - 1];
      nextCursor = Buffer.from(
        JSON.stringify({ date: last.Txn_Date, id: last.Ledger_Id })
      ).toString("base64");
    }

    // =========================================================
    // 8. RESPONSE
    //
    // Resolved_Bill_Id rules:
    //
    //   Purchase      → Bill_Id  (e.g. "PUR001")
    //   Sale          → Bill_Id  (e.g. "SAL001")
    //   Purchase_Return → purchase_return.id  (numeric, e.g. 3)
    //   Sale_Return     → sale_return.id      (numeric, e.g. 7)
    //
    // Frontend uses Resolved_Bill_Id to build its nav link.
    // =========================================================

    return res.status(200).json({
      success: true,

      item: {
        ...item,
        Conversion_Rate: item.Conversion_Rate !== null ? Number(item.Conversion_Rate) : null,
        Stock_Quantity: Number(item.Stock_Quantity || 0),
      },

      transactions: transactions.map((row) => {
        let resolvedBillId = row.Bill_Id; // Purchase / Sale — already correct

        if (row.Txn_Type === "Purchase_Return" && row.Source_Id) {
          resolvedBillId = purchaseReturnMap.get(row.Source_Id) ?? null;
        } else if (row.Txn_Type === "Sale_Return" && row.Source_Id) {
          resolvedBillId = saleReturnMap.get(row.Source_Id) ?? null;
        }

        const adjustment =
          row.Txn_Type === "Add_Adjustment" ||
            row.Txn_Type === "Reduce_Adjustment"
            ? adjustmentMap.get(row.Source_Id)
            : null;


        return {
          Ledger_Id: row.Ledger_Id,
          Item_Id: row.Item_Id,
          Txn_Type: row.Txn_Type,
          Direction: row.Direction,
          Source_Id: row.Source_Id,
          Selected_Unit: row.Selected_Unit,
          //Bill_Id: row.Bill_Id,
          Document_Id: resolvedBillId, // SAL001 / PUR001 / numeric return header id

          Number: row.Bill_Number,     // INV-001 / AEPL-001 / SR-001 / PR-001
          Party_Name: row.Party_Name,
          Quantity: Number(row.Quantity || 0),
          Rate: row.Rate !== null ? Number(row.Rate) : null,
          // ✅ ONLY populated for adjustments
          At_Price:
            adjustment?.At_Price !== null &&
              adjustment?.At_Price !== undefined
              ? Number(adjustment.At_Price)
              : null,

          // ✅ ONLY populated for adjustments
          Details: adjustment?.Details ?? null,

          // ✅ ONLY populated for adjustments
          Adjustment_Date: formatDateOnly(adjustment?.Adjustment_Date) ?? null,
          Running_Stock: Number(row.Running_Stock || 0),
          Txn_Date: row.Txn_Date,
        };
      }),

      nextCursor,
      hasMore,
    });

  } catch (err) {
    console.error("❌ Error fetching item bills:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

{/* add category */ }

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
const editCategory = async (req, res, next) => {
  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const { categoryId } = req.params;
    const { Item_Category } = req.body;

    if (!categoryId) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Category ID is required.",
      });
    }

    if (!Item_Category?.trim()) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Item Category is required.",
      });
    }

    const normalizedCategory = Item_Category.trim().replace(/\s+/g, " ");

    // Get existing category
    const [[existingCategory]] = await connection.query(
      `
      SELECT Category_Id, Item_Category
      FROM add_category
      WHERE Category_Id = ?
      LIMIT 1
      `,
      [categoryId]
    );

    if (!existingCategory) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    const oldCategoryName = existingCategory.Item_Category;

    // Duplicate check
    const [duplicate] = await connection.query(
      `
      SELECT Category_Id
      FROM add_category
      WHERE LOWER(TRIM(Item_Category)) = ?
      AND Category_Id <> ?
      `,
      [normalizedCategory.toLowerCase(), categoryId]
    );

    if (duplicate.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Category already exists.",
      });
    }

    // Update category master
    await connection.query(
      `
      UPDATE add_category
      SET
        Item_Category = ?,
        updated_at = NOW()
      WHERE Category_Id = ?
      `,
      [normalizedCategory, categoryId]
    );

    // Update all items using old category name
    await connection.query(
      `
      UPDATE add_item
      SET Item_Category = ?
      WHERE TRIM(Item_Category) = TRIM(?)
      `,
      [normalizedCategory, oldCategoryName]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Category updated successfully.",
      Category_Id: categoryId,
      Item_Category: normalizedCategory,
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("❌ Error updating category:", err);
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
const getAllCategoriesCursor = async (req, res, next) => {
  let connection;

  try {
    connection = await db.getConnection();

    const cursor = req.query.cursor
      ? Number(req.query.cursor)
      : null;

    const search = req.query.search
      ? req.query.search.trim()
      : "";

    const limit = parseInt(req.query.limit, 10) || 10;

    const where = [];
    const params = [];

    // =========================================================
    // SEARCH FILTER
    // =========================================================

    if (search) {
      where.push(`Item_Category LIKE ?`);
      params.push(`%${search}%`);
    }

    // =========================================================
    // CURSOR FILTER
    // =========================================================

    if (cursor) {
      where.push(`id < ?`);
      params.push(cursor);
    }

    const whereSQL =
      where.length > 0
        ? `WHERE ${where.join(" AND ")}`
        : "";

    // =========================================================
    // TOTAL CATEGORY COUNT
    // =========================================================

    const [[countResult]] = await connection.query(`
      SELECT COUNT(*) AS totalCategories
      FROM add_category
    `);

    // +1 because we show
    // "Items Not In Any Category"
    const totalCategories = Number(countResult.totalCategories || 0);

    // =========================================================
    // FETCH CATEGORIES
    // =========================================================

    const [rows] = await connection.query(
      `
      SELECT *
      FROM add_category
      ${whereSQL}
      ORDER BY id DESC
      LIMIT ?
      `,
      [...params, limit + 1]
    );

    // =========================================================
    // PAGINATION
    // =========================================================

    const hasMore = rows.length > limit;

    const pageRows = hasMore
      ? rows.slice(0, limit)
      : rows;

    const nextCursor = hasMore
      ? pageRows[pageRows.length - 1].id
      : null;

    // =========================================================
    // ADD SPECIAL CATEGORY
    // =========================================================

    let categories = [...pageRows];

    if (!cursor && !search) {
      categories.unshift({
        Category_Id: "uncategorized",
        Item_Category: "Items Not In Any Category",
      });
    }

    // =========================================================
    // RESPONSE
    // =========================================================

    return res.status(200).json({
      success: true,
      categories,
      totalCategories,
      hasMore,
      nextCursor,
    });
  } catch (err) {
    console.error(
      "❌ Error getting categories (cursor):",
      err
    );
    next(err);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

/* ═══════════════════════════════════════
   ITEMS BY CATEGORY (cursor paginated, mirrors getItemBills)
   categoryId = "all" → every item, regardless of category
═══════════════════════════════════════ */
//OLD
// const getItemsByCategory = async (req, res, next) => {
//   let connection;

//   try {
//     connection = await db.getConnection();

//     const { categoryId } = req.params;
//     const { cursor = null, search = "" } = req.query;

//     const limit = 10;

//     if (!categoryId) {
//       return res.status(400).json({
//         success: false,
//         message: "Category ID is required.",
//       });
//     }

//     // =========================================================
//     // 1. VALIDATE CATEGORY (skip if "all")
//     // =========================================================

//     let categoryName = null;

//     if (categoryId !== "all") {
//       const [[category]] = await connection.query(
//         `SELECT Category_Id, Item_Category FROM add_category WHERE Category_Id = ? LIMIT 1`,
//         [categoryId]
//       );

//       if (!category) {
//         return res.status(404).json({
//           success: false,
//           message: "Category not found.",
//         });
//       }

//       categoryName = category.Item_Category;
//     }

//     // =========================================================
//     // 2. BUILD FILTER
//     // =========================================================

//     const where = [];
//     const params = [];

//     if (categoryName !== null) {
//       where.push(`TRIM(Item_Category) = TRIM(?)`);
//       params.push(categoryName);
//     }

//     if (search?.trim()) {
//       const like = `%${search.trim().toLowerCase()}%`;
//       where.push(`(LOWER(Item_Name) LIKE ? OR LOWER(Item_Id) LIKE ?)`);
//       params.push(like, like);
//     }

//     // =========================================================
//     // 3. CURSOR
//     //
//     // cursor format: base64(JSON.stringify({ id: 100 }))
//     // simple numeric cursor since items are ordered by id, not date
//     // =========================================================

//     if (cursor) {
//       try {
//         const decoded = JSON.parse(Buffer.from(cursor, "base64").toString("utf8"));

//         if (!decoded.id) {
//           return res.status(400).json({
//             success: false,
//             message: "Invalid cursor.",
//           });
//         }

//         where.push(`id < ?`);
//         params.push(Number(decoded.id));
//       } catch (error) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid cursor.",
//         });
//       }
//     }

//     const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

//     // =========================================================
//     // 4. FETCH LIMIT + 1
//     // =========================================================

//     const [rows] = await connection.query(
//       `SELECT
//          id,
//          Item_Id,
//          Item_Name,
//          Item_Category,
//          Stock_Quantity,
//          At_Price,
//          Item_Unit,
//          Primary_Unit,
//          Secondary_Unit,
//          (Stock_Quantity * COALESCE(At_Price, 0)) AS Stock_Value
//        FROM add_item
//        ${whereSQL}
//        ORDER BY id DESC
//        LIMIT ?`,
//       [...params, limit + 1]
//     );

//     // =========================================================
//     // 5. HAS MORE?
//     // =========================================================

//     const hasMore = rows.length > limit;
//     const pageRows = hasMore ? rows.slice(0, limit) : rows;

//     // =========================================================
//     // 6. NEXT CURSOR
//     // =========================================================

//     let nextCursor = null;
//     if (hasMore && pageRows.length > 0) {
//       const last = pageRows[pageRows.length - 1];
//       nextCursor = Buffer.from(JSON.stringify({ id: last.id })).toString("base64");
//     }

//     // =========================================================
//     // 7. RESPONSE
//     // =========================================================

//     return res.status(200).json({
//       success: true,

//       category: categoryId === "all"
//         ? { Category_Id: null, Item_Category: "All" }
//         : { Category_Id: categoryId, Item_Category: categoryName },

//       items: pageRows.map((row) => ({
//         Item_Id: row.Item_Id,
//         Item_Name: row.Item_Name,
//         Item_Category: row.Item_Category,
//         Stock_Quantity: Number(row.Stock_Quantity || 0),
//         Unit: row.Primary_Unit || row.Item_Unit || null,
//         Stock_Value: Number(row.Stock_Value || 0),
//       })),

//       nextCursor,
//       hasMore,
//     });

//   } catch (err) {
//     console.error("❌ Error fetching items by category:", err);
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };
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

    const where = [];
    const params = [];

    // For total count (without cursor)
    const countWhere = [];
    const countParams = [];

    let categoryResponse;

    // =========================================================
    // ITEMS NOT IN ANY CATEGORY
    // =========================================================

    if (categoryId === "uncategorized") {
      const uncategorizedCondition = `
        (
          Item_Category IS NULL
          OR TRIM(Item_Category) = ''
        )
      `;

      where.push(uncategorizedCondition);
      countWhere.push(uncategorizedCondition);

      categoryResponse = {
        Category_Id: "uncategorized",
        Item_Category: "Items Not In Any Category",
      };
    }

    // =========================================================
    // NORMAL CATEGORY
    // =========================================================

    else {
      const [[category]] = await connection.query(
        `
        SELECT
          Category_Id,
          Item_Category
        FROM add_category
        WHERE Category_Id = ?
        LIMIT 1
        `,
        [categoryId]
      );

      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found.",
        });
      }

      where.push(`TRIM(Item_Category) = TRIM(?)`);
      params.push(category.Item_Category);

      countWhere.push(`TRIM(Item_Category) = TRIM(?)`);
      countParams.push(category.Item_Category);

      categoryResponse = {
        Category_Id: category.Category_Id,
        Item_Category: category.Item_Category,
      };
    }

    // =========================================================
    // SEARCH
    // =========================================================

    if (search?.trim()) {
      const like = `%${search.trim()}%`;

      const searchCondition = `
        (
          LOWER(Item_Name) LIKE LOWER(?)
          OR CAST(Stock_Quantity AS CHAR) LIKE ?
        )
      `;

      where.push(searchCondition);
      params.push(like, like);

      countWhere.push(searchCondition);
      countParams.push(like, like);
    }

    // =========================================================
    // CURSOR PAGINATION
    // =========================================================

    if (cursor) {
      try {
        const decoded = JSON.parse(
          Buffer.from(cursor, "base64").toString("utf8")
        );

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

    const whereSQL =
      where.length > 0
        ? `WHERE ${where.join(" AND ")}`
        : "";

    const countWhereSQL =
      countWhere.length > 0
        ? `WHERE ${countWhere.join(" AND ")}`
        : "";

    // =========================================================
    // TOTAL ITEMS COUNT (NO CURSOR)
    // =========================================================

    const [countRows] = await connection.query(
      `
      SELECT COUNT(*) AS totalItems
      FROM add_item
      ${countWhereSQL}
      `,
      countParams
    );

    const totalItems = Number(countRows[0].totalItems || 0);

    // =========================================================
    // FETCH ITEMS
    // =========================================================

    const [rows] = await connection.query(
      `
      SELECT
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
      LIMIT ?
      `,
      [...params, limit + 1]
    );

    // =========================================================
    // PAGINATION
    // =========================================================

    const hasMore = rows.length > limit;

    const pageRows = hasMore
      ? rows.slice(0, limit)
      : rows;

    let nextCursor = null;

    if (hasMore && pageRows.length > 0) {
      nextCursor = Buffer.from(
        JSON.stringify({
          id: pageRows[pageRows.length - 1].id,
        })
      ).toString("base64");
    }

    // =========================================================
    // RESPONSE
    // =========================================================

    return res.status(200).json({
      success: true,

      category: categoryResponse,

      totalItems,

      items: pageRows.map((row) => ({
        Item_Id: row.Item_Id,
        Item_Name: row.Item_Name,
        Item_Category: row.Item_Category,
        Stock_Quantity: Number(row.Stock_Quantity || 0),
        Unit: row.Primary_Unit || row.Item_Unit || null,
        Stock_Value: Number(row.Stock_Value || 0),
      })),

      hasMore,
      nextCursor,
    });
  } catch (err) {
    console.error("❌ Error fetching items by category:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

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

const addStockAdjustment = async (req, res, next) => {
  let connection;

  try {
    connection = await db.getConnection();

    await connection.beginTransaction();

    const {
      Item_Id,
      Adjustment_Type,   // "Add" | "Reduce"
      Quantity,
      Selected_Unit,
      At_Price,
      Details,
      Adjustment_Date,
    } = req.body;

    // =========================================================
    // 1. VALIDATION
    // =========================================================

    if (
      !Item_Id ||
      !Adjustment_Type ||
      Quantity === undefined ||
      Quantity === null ||
      Quantity === ""
    ) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Invalid adjustment data.",
      });
    }

    if (
      Adjustment_Type !== "Add" &&
      Adjustment_Type !== "Reduce"
    ) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Invalid adjustment type.",
      });
    }

    const qty = Number(Quantity);

    if (!Number.isFinite(qty) || qty <= 0) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0.",
      });
    }

    // =========================================================
    // 2. GET ITEM
    // =========================================================

    const [[item]] = await connection.query(
      `
      SELECT
        Item_Id,
        Item_Name,
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
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Item not found.",
      });
    }

    // =========================================================
    // 3. CONVERT QUANTITY TO PRIMARY / BASE UNIT
    //
    // Example:
    //
    // Primary   = Kg
    // Secondary = Gm
    // Rate      = 1000
    //
    // User enters:
    // 500 Gm
    //
    // Base_Qty = 500 / 1000 = 0.5 Kg
    // =========================================================

    let baseQty = qty;

    if (
      item.Primary_Unit &&
      item.Secondary_Unit &&
      Selected_Unit === item.Secondary_Unit
    ) {
      const rate = Number(item.Conversion_Rate) || 0;

      if (rate <= 0) {
        await connection.rollback();

        return res.status(400).json({
          success: false,
          message:
            `Missing conversion rate for ${item.Primary_Unit} → ${item.Secondary_Unit}.`,
        });
      }

      baseQty = qty / rate;
    }

    // =========================================================
    // 4. DETERMINE LEDGER DIRECTION
    //
    // Add    = IN
    // Reduce = OUT
    // =========================================================

    const direction =
      Adjustment_Type === "Add"
        ? "In"
        : "Out";

    // Signed quantity used ONLY for add_item stock.
    //
    // Add    => +
    // Reduce => -
    const signedBaseQty =
      Adjustment_Type === "Add"
        ? baseQty
        : -baseQty;

    // =========================================================
    // 5. INSERT STOCK ADJUSTMENT HEADER
    //
    // item_stock_adjustments.id becomes the
    // item_ledger.Source_Id
    // =========================================================

    const [insertRes] = await connection.execute(
      `
      INSERT INTO item_stock_adjustments
      (
        Item_Id,
        Adjustment_Type,
        Quantity,
        Selected_Unit,
        Base_Qty,
        At_Price,
        Details,
        Adjustment_Date,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [
        Item_Id,
        Adjustment_Type,
        qty,
        Selected_Unit || null,
        baseQty,
        At_Price || null,
        Details || null,
        Adjustment_Date,
      ]
    );

    const adjustmentId = insertRes.insertId;

    // =========================================================
    // 6. UPDATE ITEM MASTER STOCK
    //
    // NO NEGATIVE STOCK RESTRICTION.
    //
    // Reduce can make Stock_Quantity negative.
    // =========================================================

    await connection.query(
      `
      UPDATE add_item
      SET
        Stock_Quantity = Stock_Quantity + ?,
        updated_at = NOW()
      WHERE Item_Id = ?
      `,
      [
        signedBaseQty,
        Item_Id,
      ]
    );

    // =========================================================
    // 7. INSERT ITEM LEDGER
    //
    // IMPORTANT:
    //
    // Quantity  = user entered quantity
    // Base_Qty  = normalized primary-unit quantity
    //
    // Example:
    //
    // User enters 500 Gm
    //
    // Quantity      = 500
    // Selected_Unit = Gm
    // Base_Qty      = 0.5
    //
    // Direction:
    // Add    = In
    // Reduce = Out
    // =========================================================

    await recordItemLedger({
      connection,

      itemId: Item_Id,

      txnType:
        Adjustment_Type === "Reduce"
          ? "Reduce_Adjustment"
          : "Add_Adjustment",

      // item_stock_adjustments.id
      referenceId: adjustmentId,

      // You can keep these null because this isn't
      // a Sale/Purchase document.
      billId: null,
      billNumber: null,

      partyName: null,

      // Original user-entered quantity
      quantity: qty,

      // Unit selected by user
      selectedUnit: Selected_Unit || null,

      // Normalized quantity in primary unit
      baseQty: baseQty,

      rate:
        At_Price !== undefined &&
          At_Price !== null &&
          At_Price !== ""
          ? Number(At_Price)
          : null,

      txnDate: Adjustment_Date,

      // IMPORTANT:
      // Add    => In
      // Reduce => Out
      direction,
    });

    // =========================================================
    // 8. COMMIT
    // =========================================================

    await connection.commit();

    return res.status(200).json({
      success: true,

      message:
        `Stock ${Adjustment_Type === "Add"
          ? "added"
          : "reduced"
        } successfully`,

      adjustment: {
        id: adjustmentId,
        Item_Id,
        Adjustment_Type,
        Quantity: qty,
        Selected_Unit: Selected_Unit || null,
        Base_Qty: baseQty,
        At_Price:
          At_Price !== undefined &&
            At_Price !== null &&
            At_Price !== ""
            ? Number(At_Price)
            : null,
        Details: Details || null,
        Adjustment_Date,
      },
    });

  } catch (err) {

    if (connection) {
      await connection.rollback();
    }

    console.error(
      "❌ addStockAdjustment:",
      err
    );

    next(err);

  } finally {

    if (connection) {
      connection.release();
    }
  }
};
const editStockAdjustment = async (req, res, next) => {
  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // =========================================================
    // 1. IDS + BODY
    //
    // URL:
    // /item/stock-adjustment/edit/:id
    //
    // id = item_stock_adjustments.id
    // Item_Id = body
    // =========================================================

    const { id } = req.params;

    const {
      Item_Id,
      Adjustment_Type,
      Quantity,
      Selected_Unit,
      At_Price,
      Details,
      Adjustment_Date,
    } = req.body;

    // =========================================================
    // 2. VALIDATION
    // =========================================================

    if (!id) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Adjustment ID is required.",
      });
    }

    if (!Item_Id) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Item ID is required.",
      });
    }

    if (
      !Adjustment_Type ||
      Quantity === undefined ||
      Quantity === null ||
      Quantity === ""
    ) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Invalid adjustment data.",
      });
    }

    if (
      Adjustment_Type !== "Add" &&
      Adjustment_Type !== "Reduce"
    ) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Invalid adjustment type.",
      });
    }

    const qty = Number(Quantity);

    if (!Number.isFinite(qty) || qty <= 0) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0.",
      });
    }

    // =========================================================
    // 3. GET OLD ADJUSTMENT
    // =========================================================

    const [[oldAdjustment]] = await connection.query(
      `
      SELECT
        id,
        Item_Id,
        Adjustment_Type,
        Quantity,
        Selected_Unit,
        Base_Qty,
        At_Price,
        Details,
        Adjustment_Date
      FROM item_stock_adjustments
      WHERE id = ?
        AND Item_Id = ?
      LIMIT 1
      `,
      [id, Item_Id]
    );

    if (!oldAdjustment) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Stock adjustment not found for this item.",
      });
    }

    // =========================================================
    // 4. GET ITEM
    // =========================================================

    const [[item]] = await connection.query(
      `
      SELECT
        Item_Id,
        Item_Name,
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
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Item not found.",
      });
    }

    // =========================================================
    // 5. CALCULATE NEW BASE QTY
    //
    // Primary:
    //   2 Kg = 2
    //
    // Secondary:
    //   500 Gm / 1000 = 0.5 Kg
    //
    // Use item_unit_conversions for secondary units.
    // =========================================================

    let newBaseQty = qty;

    if (
      Selected_Unit &&
      Selected_Unit !== item.Primary_Unit
    ) {
      const [[conversion]] = await connection.query(
        `
        SELECT
          Conversion_Rate
        FROM item_unit_conversions
        WHERE Item_Id = ?
          AND Primary_Unit = ?
          AND Secondary_Unit = ?
        ORDER BY id DESC
        LIMIT 1
        `,
        [
          Item_Id,
          item.Primary_Unit,
          Selected_Unit,
        ]
      );

      const conversionRate =
        Number(conversion?.Conversion_Rate) || 0;

      if (conversionRate <= 0) {
        await connection.rollback();

        return res.status(400).json({
          success: false,
          message:
            `Missing conversion rate for ${item.Primary_Unit} → ${Selected_Unit}.`,
        });
      }

      newBaseQty = qty / conversionRate;
    }

    // =========================================================
    // 6. OLD SIGNED EFFECT
    //
    // Add    = +
    // Reduce = -
    // =========================================================

    const oldBaseQty =
      Number(oldAdjustment.Base_Qty) || 0;

    const oldSignedBaseQty =
      oldAdjustment.Adjustment_Type === "Add"
        ? oldBaseQty
        : -oldBaseQty;

    // =========================================================
    // 7. NEW SIGNED EFFECT
    //
    // Add    = +
    // Reduce = -
    // =========================================================

    const newSignedBaseQty =
      Adjustment_Type === "Add"
        ? newBaseQty
        : -newBaseQty;

    // =========================================================
    // 8. NET DIFFERENCE
    //
    // Example:
    //
    // Old: Reduce 10
    // New: Add 5
    //
    // old = -10
    // new = +5
    //
    // netDiff = +15
    // =========================================================

    const netDiff =
      newSignedBaseQty -
      oldSignedBaseQty;

    // =========================================================
    // 9. NEW LEDGER TYPE + DIRECTION
    // =========================================================

    const direction =
      Adjustment_Type === "Add"
        ? "In"
        : "Out";

    const txnType =
      Adjustment_Type === "Add"
        ? "Add_Adjustment"
        : "Reduce_Adjustment";

    // =========================================================
    // 10. UPDATE STOCK ADJUSTMENT TABLE
    // =========================================================

    await connection.query(
      `
      UPDATE item_stock_adjustments
      SET
        Adjustment_Type = ?,
        Quantity = ?,
        Selected_Unit = ?,
        Base_Qty = ?,
        At_Price = ?,
        Details = ?,
        Adjustment_Date = ?,
        updated_at = NOW()
      WHERE id = ?
        AND Item_Id = ?
      `,
      [
        Adjustment_Type,
        qty,
        Selected_Unit || null,
        newBaseQty,

        At_Price !== undefined &&
          At_Price !== null &&
          At_Price !== ""
          ? Number(At_Price)
          : null,

        Details || null,
        Adjustment_Date,

        id,
        Item_Id,
      ]
    );

    // =========================================================
    // 11. UPDATE ITEM MASTER STOCK
    //
    // NO NEGATIVE STOCK RESTRICTION
    // =========================================================

    await connection.query(
      `
      UPDATE add_item
      SET
        Stock_Quantity = Stock_Quantity + ?,
        updated_at = NOW()
      WHERE Item_Id = ?
      `,
      [
        netDiff,
        Item_Id,
      ]
    );

    // =========================================================
    // 12. FIND EXISTING ITEM LEDGER ROW
    // =========================================================

    const [[ledgerRow]] = await connection.query(
      `
      SELECT
        id
      FROM item_ledger
      WHERE Item_Id = ?
        AND Source_Id = ?
        AND Txn_Type IN (
          'Add_Adjustment',
          'Reduce_Adjustment'
        )
      LIMIT 1
      `,
      [
        Item_Id,
        id,
      ]
    );

    if (!ledgerRow) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Adjustment ledger entry not found.",
      });
    }

    // =========================================================
    // 13. UPDATE EXISTING ITEM LEDGER ROW
    // =========================================================

    await connection.query(
      `
      UPDATE item_ledger
      SET
        Txn_Type = ?,
        Direction = ?,
        Quantity = ?,
        Selected_Unit = ?,
        Base_Qty = ?,
        Rate = ?,
        Txn_Date = ?
      WHERE id = ?
      `,
      [
        txnType,
        direction,
        qty,
        Selected_Unit || null,
        newBaseQty,

        At_Price !== undefined &&
          At_Price !== null &&
          At_Price !== ""
          ? Number(At_Price)
          : null,

        Adjustment_Date,

        ledgerRow.id,
      ]
    );

    // =========================================================
    // 14. FIX RUNNING STOCK
    //
    // The edited ledger row AND all rows after it
    // must move by netDiff.
    //
    // Example:
    //
    // Old adjustment: +10
    // New adjustment: +5
    //
    // netDiff = -5
    //
    // Current row and every later row:
    // Running_Stock -= 5
    // =========================================================

    if (netDiff !== 0) {
      await connection.query(
        `
        UPDATE item_ledger
        SET
          Running_Stock = Running_Stock + ?
        WHERE Item_Id = ?
          AND id >= ?
        `,
        [
          netDiff,
          Item_Id,
          ledgerRow.id,
        ]
      );
    }

    // =========================================================
    // 15. COMMIT
    // =========================================================

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Stock adjustment updated successfully",

      adjustment: {
        id,
        Item_Id,
        Adjustment_Type,
        Quantity: qty,
        Selected_Unit:
          Selected_Unit || null,
        Base_Qty: newBaseQty,

        At_Price:
          At_Price !== undefined &&
            At_Price !== null &&
            At_Price !== ""
            ? Number(At_Price)
            : null,

        Details:
          Details || null,

        Adjustment_Date,
      },
    });

  } catch (err) {
    if (connection) {
      await connection.rollback();
    }

    console.error(
      "❌ editStockAdjustment:",
      err
    );

    next(err);

  } finally {
    if (connection) {
      connection.release();
    }
  }
};
const deleteStockAdjustment = async (req, res, next) => {
  let connection;
  try {
    const { id } = req.params;  // item_stock_adjustments.id

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Adjustment ID is required.",
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // =========================================================
    // 1. CHECK ADJUSTMENT EXISTS
    // =========================================================

    const [[adjustment]] = await connection.query(
      `SELECT * FROM item_stock_adjustments WHERE id = ? LIMIT 1`,
      [id]
    );

    if (!adjustment) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Stock adjustment not found.",
      });
    }

    const {
      Item_Id,
      Adjustment_Type,   // "Add_Adjustment" | "Reduce_Adjustment"
      Quantity,
    } = adjustment;

    const qty = Number(Quantity) || 0;

    // =========================================================
    // 2. VERIFY ITEM EXISTS
    // =========================================================

    const [[item]] = await connection.query(
      `SELECT Item_Id, Stock_Quantity FROM add_item WHERE Item_Id = ? LIMIT 1`,
      [Item_Id]
    );

    if (!item) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Item not found.",
      });
    }

    // =========================================================
    // 3. REVERSE Stock_Quantity ON add_item
    //    Add_Adjustment   added stock  → reverse = subtract
    //    Reduce_Adjustment removed stock → reverse = add
    // =========================================================

    if (Adjustment_Type === "Add") {
      await connection.query(
        `UPDATE add_item
         SET Stock_Quantity = Stock_Quantity - ?,
             updated_at     = NOW()
         WHERE Item_Id = ?`,
        [qty, Item_Id]
      );
    } else if (Adjustment_Type === "Reduce") {
      await connection.query(
        `UPDATE add_item
         SET Stock_Quantity = Stock_Quantity + ?,
             updated_at     = NOW()
         WHERE Item_Id = ?`,
        [qty, Item_Id]
      );
    }

    // =========================================================
    // 4. DELETE ITEM LEDGER ROW
    //    reverseItemLedger just deletes —
    //    Running_Stock recomputed via window function on read
    // =========================================================

    await reverseItemLedger({
      connection,
      itemId: Item_Id,
      txnType:
        Adjustment_Type === "Add"
          ? "Add_Adjustment"
          : "Reduce_Adjustment",
      referenceId: Number(id),
    });

    // =========================================================
    // 5. DELETE ADJUSTMENT RECORD
    // =========================================================

    await connection.query(
      `DELETE FROM item_stock_adjustments WHERE id = ?`,
      [id]
    );

    // =========================================================
    // 6. COMMIT
    // =========================================================

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Stock adjustment deleted successfully.",
      id,
      Item_Id,
      Reversed_Quantity: qty,
      Adjustment_Type,
    });

  } catch (err) {
    if (connection) await connection.rollback();
    console.error("❌ deleteStockAdjustment:", err);
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
  addItem, editItem, deleteItem, addCategory,editCategory, getAllItems, getAllCategories, getAllCategoriesCursor,
  eachItemSalesPurchaseDetails,
  printEachItemSalesPurchasesReport, eachItemBillAndInvoiceNumbers, addItemConversion, getItemConversions,
  getAllItemsForLedger, getItemBills, getItemsByCategory, addStockAdjustment, editStockAdjustment,
  deleteStockAdjustment
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
