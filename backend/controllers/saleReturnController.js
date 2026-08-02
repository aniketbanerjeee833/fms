

import db from "../config/db.js";
import { recordPartyLedger } from "../utils/partyLedgerHelper.js";
import { validateSplits, insertPaymentSplits, deletePaymentSplits } from "../utils/paymentSplitHelper.js";
const cleanValue = (value) => {
  if (value === undefined || value === null || value === "" || value === " ") {
    return null; // store as NULL in DB
  }
  return value;  // ✅ returns the original value for valid data
};
/* ── GET ALL ──────────────────────────────────────────────── */
const getAllSaleReturns = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();

    const page     = parseInt(req.query.page, 10) || 1;
    const limit    = 10;
    const offset   = (page - 1) * limit;
    const search   = req.query.search?.trim().toLowerCase() || "";
    const fromDate = req.query.fromDate || null;
    const toDate   = req.query.toDate   || null;

    const whereClauses = [];
    const params       = [];

    // if (search) {
    //   whereClauses.push(`(
    //     LOWER(p.Party_Name)      LIKE ? OR
    //     LOWER(sr.Return_Number)  LIKE ? OR
    //     LOWER(sr.Invoice_Number) LIKE ? OR
    //     CAST(sr.Total_Amount AS CHAR) LIKE ? OR
    //     CAST(sr.Balance_Due AS CHAR) LIKE ? OR
    //     CAST(sr.Total_Paid AS CHAR) LIKE ?
    //   )`);
    //   const like = `%${search}%`;
    //   params.push(like, like, like, like, like, like);
    // }

     if (search) {
      whereClauses.push(`(
        p.Party_Name     LIKE ? OR
        sr.Return_Number  LIKE ? OR
        sr.Invoice_Number LIKE ? OR
        CAST(sr.Total_Amount AS CHAR) LIKE ? OR
        CAST(sr.Balance_Due AS CHAR) LIKE ? OR
        CAST(sr.Total_Paid AS CHAR) LIKE ?
      )`);
      const like = `%${search}%`;
      params.push(like, like, like, like, like, like);
    }

    if (fromDate && toDate) {
      whereClauses.push(`DATE(sr.Return_Date) BETWEEN ? AND ?`);
      params.push(fromDate, toDate);
    } else if (fromDate) {
      whereClauses.push(`DATE(sr.Return_Date) >= ?`);
      params.push(fromDate);
    } else if (toDate) {
      whereClauses.push(`DATE(sr.Return_Date) <= ?`);
      params.push(toDate);
    }

    const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const [rows] = await connection.query(
      `SELECT sr.*, p.Party_Name
       FROM sale_return sr
       LEFT JOIN add_party p ON p.Party_Id = sr.Party_Id
       ${whereSQL}
       ORDER BY sr.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // 🔹 attach Payment_Type_Display per row from splits
    for (const row of rows) {
      const [splits] = await connection.query(
        `SELECT ps.Payment_Type, ba.Account_Display_Name
         FROM payment_splits ps
         LEFT JOIN bank_accounts ba ON ba.id = ps.Bank_Account_Id
         WHERE ps.Source_Type = 'Sale_Return' AND ps.Source_Id = ?`,
        [row.id]
      );
      const labels = splits.map((s) =>
        s.Payment_Type === "Bank" ? s.Account_Display_Name : s.Payment_Type
      );
      const counts = {};
      labels.forEach((l) => (counts[l] = (counts[l] || 0) + 1));
      row.Payment_Type_Display = Object.entries(counts)
        .map(([label, count]) => (count > 1 ? `${label} (x${count})` : label))
        .join(",") || "—";
    }

    const [[{ total }]] = await connection.query(
      `SELECT COUNT(*) AS total
       FROM sale_return sr
       LEFT JOIN add_party p ON p.Party_Id = sr.Party_Id
       ${whereSQL}`,
      params
    );

    const [[totals]] = await connection.query(
      `SELECT
         COALESCE(SUM(sr.Total_Amount), 0) AS totalAmount,
         COALESCE(SUM(sr.Total_Paid),   0) AS totalPaid,
         COALESCE(SUM(sr.Balance_Due),  0) AS totalBalance
       FROM sale_return sr
       LEFT JOIN add_party p ON p.Party_Id = sr.Party_Id
       ${whereSQL}`,
      params
    );

    return res.status(200).json({
      success: true,
      currentPage:  page,
      totalPages:   Math.ceil(total / limit),
      totalReturns: total,
      saleReturns:  rows,
      totals,
    });
  } catch (err) {
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

/* ── GET SINGLE ───────────────────────────────────────────── */
const getSaleReturnById = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();
    const { Sale_Return_Id } = req.params;

    const [[header]] = await connection.query(
      `SELECT sr.*, p.Party_Name
       FROM sale_return sr
       LEFT JOIN add_party p ON p.Party_Id = sr.Party_Id
       WHERE sr.id = ?`,
      [Sale_Return_Id]
    );

    if (!header) {
      return res.status(404).json({ success: false, message: "Sale Return not found" });
    }

    const [items] = await connection.query(
      `SELECT sri.*,
              ai.Item_Name AS Item_Name,
              ai.Item_HSN  AS Item_HSN,
              ai.Item_Unit AS Item_Unit,
               ai.Item_Category AS Item_Category
       FROM sale_return_items sri
       LEFT JOIN add_item ai ON ai.Item_Id = sri.Item_Id
       WHERE sri.Sale_Return_Id = ?`,
      [Sale_Return_Id]
    );

    // 🔹 fetch splits
    const [splits] = await connection.query(
      `SELECT ps.*, ba.Account_Display_Name
       FROM payment_splits ps
       LEFT JOIN bank_accounts ba ON ba.id = ps.Bank_Account_Id
       WHERE ps.Source_Type = 'Sale_Return' AND ps.Source_Id = ?
       ORDER BY ps.id ASC`,
      [Sale_Return_Id]
    );

    return res.status(200).json({
      success: true,
      saleReturn: { ...header, items, splits },
    });
  } catch (err) {
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

/* ── CREATE ───────────────────────────────────────────────── */
// const createSaleReturn = async (req, res, next) => {
//   let connection;
//   try {
//     const { Sale_Id } = req.params;

//     connection = await db.getConnection();
//     await connection.beginTransaction();

//     const {
//       Party_Name,
//       Return_Number,
//       Invoice_Number,
//       Invoice_Date,
//       Return_Date,
//       State_Of_Supply,
//       Total_Amount,
//       Total_Paid,
//       Balance_Due,
//       //Reference_Number,
//       splits,    // 🔹 replaces single Payment_Type / Bank_Account_Id
//       items,
//     } = req.body;

//     if (!Sale_Id || !Party_Name || !Return_Date || !items?.length) {
//       await connection.rollback();
//       return res.status(400).json({
//         success: false,
//         message: "Sale_Id, Customer, Return Date and items are required",
//       });
//     }

//     const totalAmount = Number(Total_Amount) || 0;
//     const totalPaid   = Number(Total_Paid)   || 0;
//     const balanceDue  = Number(Balance_Due)  || totalAmount - totalPaid;

//     // 🔹 paid cannot exceed total
//     if (totalPaid > totalAmount) {
//       await connection.rollback();
//       return res.status(400).json({
//         success: false,
//         message: "Paid amount should be less than or equal to Total Amount",
//       });
//     }

//     // 🔹 validate splits sum === totalPaid
//     if (totalPaid > 0) {
//       try {
//         validateSplits(splits, totalPaid);
//       } catch (validationErr) {
//         await connection.rollback();
//         return res.status(400).json({ success: false, message: validationErr.message });
//       }
//     }

//     const [[party]] = await connection.query(
//       `SELECT Party_Id FROM add_party WHERE Party_Name = ? LIMIT 1`,
//       [Party_Name]
//     );
//     if (!party) {
//       await connection.rollback();
//       return res.status(404).json({ success: false, message: "Customer not found" });
//     }

//     const [headerResult] = await connection.query(
//   `INSERT INTO sale_return
//     (
//       Sale_Id,
//       Party_Id,
//       Return_Number,
//       Invoice_Number,
//       Invoice_Date,
//       Return_Date,
//       State_Of_Supply,
//       Total_Amount,
//       Total_Paid,
//       Balance_Due
//     )
//    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//   [
//     Sale_Id,
//     party.Party_Id,
//     Return_Number || null,
//     Invoice_Number || null,
//     Invoice_Date || null,
//     Return_Date,
//     State_Of_Supply || null,
//     totalAmount,
//     totalPaid,
//     balanceDue,
//   ]
// );

//     const Sale_Return_Id = headerResult.insertId;

//     // 🔹 insert splits + fan out to bank/cash ledgers
//     if (totalPaid > 0 && Array.isArray(splits) && splits.length > 0) {
//       await insertPaymentSplits({
//         connection,
//         sourceType: "Sale_Return",
//         sourceId:   Sale_Return_Id,
//         partyName:  Party_Name,
//         txnDate:    Return_Date,
//         splits,
//       });
//     }

//     await recordPartyLedger({
//   connection,
//   partyId: party.Party_Id,
//   txnType: "Sale_Return",
//   referenceId: Sale_Return_Id,
//   amount: totalAmount,
//   txnDate: Return_Date,
//   docNumber: Return_Number,
//   balanceDue: balanceDue,
// });


//     // items loop — unchanged, item name/hsn pulled from add_item via FK
//     for (const item of items) {
//       const {
//         Item_Name,
//         Item_Category,
//         Item_HSN,
//         Item_Unit,
//         Quantity,
//         Sale_Price,
//         Discount_On_Sale_Price,
//         Discount_Type_On_Sale_Price,
//         Tax_Type,
//         Tax_Amount,
//         Amount,
//       } = item;

//       // const [[existingItem]] = await connection.query(
//       //   `SELECT Item_Id FROM add_item WHERE Item_Name = ? LIMIT 1`,
//       //   [Item_Name]
//       // );
//         const [[existingItem]] = await connection.query(
//         `SELECT Item_Id FROM add_item WHERE TRIM(Item_Name) = TRIM(?)) LIMIT 1`,
//         [Item_Name]
//       );

//       // let Item_Id;
//       // if (!existingItem) {
//       //   const [ins] = await connection.execute(
//       //     `INSERT INTO add_item
//       //        (Item_Name, Item_Category, Item_HSN, Item_Unit, Stock_Quantity, created_at, updated_at)
//       //      VALUES (?, ?, ?, ?, 0, NOW(), NOW())`,
//       //     [Item_Name, Item_Category || "", Item_HSN || "", Item_Unit || ""]
//       //   );
//       //   Item_Id = `ITM${ins.insertId}`;
//       //   await connection.execute(
//       //     `UPDATE add_item SET Item_Id = ? WHERE id = ?`,
//       //     [Item_Id, ins.insertId]
//       //   );
//       // } else {
//       //   Item_Id = existingItem.Item_Id;
//       // }
//   let Item_Id;
// if (!existingItem) {
//   const [ins] = await connection.execute(
//     `INSERT INTO add_item
//        (Item_Name, Item_Category, Item_HSN, Item_Unit, Stock_Quantity, created_at, updated_at)
//      VALUES (?, ?, ?, ?, 0, NOW(), NOW())`,
//     [Item_Name, Item_Category || "", Item_HSN || "", Item_Unit || ""]
//   );
//   Item_Id = `ITM${ins.insertId}`;
//   await connection.execute(`UPDATE add_item SET Item_Id = ? WHERE id = ?`, [Item_Id, ins.insertId]);
// } else {
//   Item_Id = existingItem.Item_Id;
//   // 🔹 sync HSN to master if changed
//   if (Item_HSN) {
//     await connection.query(
//       `UPDATE add_item SET Item_HSN = ?, updated_at = NOW() WHERE Item_Id = ?`,
//       [Item_HSN, Item_Id]
//     );
//   }
// }
//       await connection.query(
//         `INSERT INTO sale_return_items
//            (Sale_Return_Id, Item_Id, Quantity, Sale_Price,
//             Discount_On_Sale_Price, Discount_Type_On_Sale_Price,
//             Tax_Type, Tax_Amount, Amount)
//          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//         [
//           Sale_Return_Id,
//           Item_Id,
//           Number(Quantity),
//           Number(Sale_Price),
//           Number(Discount_On_Sale_Price) || 0,
//           Discount_Type_On_Sale_Price    || "Percentage",
//           Tax_Type                       || null,
//           Number(Tax_Amount)             || 0,
//           Number(Amount),
//         ]
//       );

//       // restore stock — item coming back into inventory
//       await connection.query(
//         `UPDATE add_item SET Stock_Quantity = Stock_Quantity + ?, updated_at = NOW()
//          WHERE Item_Id = ?`,
//         [Number(Quantity), Item_Id]
//       );
//     }

//     await connection.commit();
//     return res.status(201).json({
//       success: true,
//       message: "Sale Return created",
//       Sale_Return_Id,
//     });
//   } catch (err) {
//     if (connection) await connection.rollback();
//     console.error("❌ createSaleReturn:", err);
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };
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
      Total_Amount,
      splits,
      items,
    } = req.body;

    // =========================================================
    // 1. BASIC VALIDATION
    //
    // Empty items are allowed.
    // =========================================================

    if (!Sale_Id || !Party_Name) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Sale and Customer are required",
      });
    }

    // =========================================================
    // 2. PAYMENT SPLITS
    //
    // First valid split:
    // Cash ₹0 -> KEEP
    //
    // Later:
    // HDFC ₹0 -> DROP
    // ANCO ₹20 -> KEEP
    // =========================================================

    const normalizedSplits = (splits || [])
      .filter((split) => {
        if (!split.Payment_Type) {
          return false;
        }

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

    const validSplits = normalizedSplits.filter(
      (split, index) => {
        if (index === 0) {
          return true;
        }

        return split.Amount > 0;
      }
    );

    // =========================================================
    // 3. TOTALS
    //
    // Don't trust Total_Paid from frontend.
    // =========================================================

    const totalAmount =
      Number(Total_Amount) || 0;

    const totalPaid = validSplits.reduce(
      (sum, split) =>
        sum + (Number(split.Amount) || 0),
      0
    );

    const balanceDue =
      totalAmount - totalPaid;

    if (totalPaid > totalAmount) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          "Paid amount should be less than or equal to Total Amount",
      });
    }

    // =========================================================
    // 4. VALIDATE ONLY SURVIVING SPLITS
    // =========================================================

    if (validSplits.length > 0) {
      try {
        validateSplits(
          validSplits,
          totalPaid
        );
      } catch (validationErr) {
        await connection.rollback();

        return res.status(400).json({
          success: false,
          message: validationErr.message,
        });
      }
    }

    // =========================================================
    // 5. FIND PARTY
    // =========================================================

    const [[party]] =
      await connection.query(
        `SELECT Party_Id
         FROM add_party
         WHERE Party_Name = ?
         LIMIT 1`,
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
    // 6. CREATE SALE RETURN HEADER
    // =========================================================

    const [headerResult] =
      await connection.query(
        `INSERT INTO sale_return
        (
          Sale_Id,
          Party_Id,
          Return_Number,
          Invoice_Number,
          Invoice_Date,
          Return_Date,
          State_Of_Supply,
          Total_Amount,
          Total_Paid,
          Balance_Due
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          Sale_Id,
          party.Party_Id,
          Return_Number || null,
          Invoice_Number || null,
          Invoice_Date || null,
          Return_Date,
          State_Of_Supply || null,
          totalAmount,
          totalPaid,
          balanceDue,
        ]
      );

    const Sale_Return_Id =headerResult.insertId;

    // =========================================================
    // 7. PAYMENT SPLITS
    //
    // IMPORTANT:
    // Cash ₹0 first split is also inserted.
    // =========================================================

    if (validSplits.length > 0) {
      await insertPaymentSplits({
        connection,
        sourceType: "Sale_Return",
        sourceId: Sale_Return_Id,
        partyName: Party_Name,
        txnDate: Return_Date,
        splits: validSplits,
      });
    }

    // =========================================================
    // 8. PARTY LEDGER
    // =========================================================

    await recordPartyLedger({
      connection,
      partyId: party.Party_Id,
      txnType: "Sale_Return",
      referenceId: Sale_Return_Id,
      amount: totalAmount,
      txnDate: Return_Date,
      docNumber: Return_Number,
      balanceDue,
    });

    // =========================================================
    // 9. ITEMS
    //
    // No name + Amount > 0 -> ERROR
    // No name + Amount 0   -> SKIP
    // =========================================================

    for (const item of items || []) {
      const itemName =
        item.Item_Name?.trim();

      const itemAmount =
        Number(item.Amount) || 0;

      if (!itemName) {
        if (itemAmount > 0) {
          await connection.rollback();

          return res.status(400).json({
            success: false,
            message:
              "Please enter an item name for the row.",
          });
        }

        continue;
      }

      const {
        Item_Category,
        Item_HSN,
        Item_Unit,
        Quantity,
        Sale_Price,
        Discount_On_Sale_Price,
        Discount_Type_On_Sale_Price,
        Tax_Type,
        Tax_Amount,
        Amount,
      } = item;

      // =======================================================
      // 10. FIND ITEM
      // =======================================================

      const [[existingItem]] =
        await connection.query(
          `SELECT *
           FROM add_item
           WHERE TRIM(Item_Name) = TRIM(?)
           LIMIT 1`,
          [itemName]
        );

      let Item_Id;

      // =======================================================
      // 11. CREATE ITEM IF NEEDED
      // =======================================================

      if (!existingItem) {
        const [maxRow] =
          await connection.query(
            `SELECT
               MAX(
                 CAST(
                   SUBSTRING(Item_Id, 4)
                   AS UNSIGNED
                 )
               ) AS maxId
             FROM add_item
             WHERE Item_Id LIKE 'ITM%'`
          );

        const autoId =
          (maxRow[0]?.maxId || 0) + 1;

        Item_Id =
          "ITM" +
          autoId.toString().padStart(3, "0");

        await connection.execute(
          `INSERT INTO add_item
           (
             Item_Id,
             Item_Name,
             Item_Category,
             Item_HSN,
             Item_Unit,
             Stock_Quantity,
             created_at,
             updated_at
           )
           VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            Item_Id,
            itemName,
            Item_Category || "",
            cleanValue(Item_HSN),
            Item_Unit || "",
            0,
          ]
        );
      } else {
        Item_Id = existingItem.Item_Id;

        // =====================================================
        // 12. UPDATE ALLOWED MASTER DATA
        // =====================================================

        const updates = [];
        const params = [];

        if (
          Item_HSN &&
          Item_HSN !== existingItem.Item_HSN
        ) {
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
             SET ${updates.join(", ")},
                 updated_at = NOW()
             WHERE Item_Id = ?`,
            params
          );
        }
      }

      // =======================================================
      // 13. INSERT RETURN ITEM
      // =======================================================

      await connection.query(
        `INSERT INTO sale_return_items
        (
          Sale_Return_Id,
          Item_Id,
          Quantity,
          Sale_Price,
          Discount_On_Sale_Price,
          Discount_Type_On_Sale_Price,
          Tax_Type,
          Tax_Amount,
          Amount
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          Sale_Return_Id,
          Item_Id,
          Number(Quantity) || 0,
          Number(Sale_Price) || 0,
          Number(Discount_On_Sale_Price) || 0,
          Discount_Type_On_Sale_Price ||
            "Percentage",
          Tax_Type || null,
          Number(Tax_Amount) || 0,
          Number(Amount) || 0,
        ]
      );

      // =======================================================
      // 14. SALE RETURN -> STOCK COMES BACK
      // =======================================================

      await connection.query(
        `UPDATE add_item
         SET
           Stock_Quantity =
             Stock_Quantity + ?,
           updated_at = NOW()
         WHERE Item_Id = ?`,
        [
          Number(Quantity) || 0,
          Item_Id,
        ]
      );
    }

    // =========================================================
    // 15. COMMIT
    // =========================================================

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Sale Return created",
      Sale_Return_Id,
      totalAmount,
      totalPaid,
      balanceDue,
    });

  } catch (err) {
    if (connection) {
      await connection.rollback();
    }

    console.error(
      "createSaleReturn:",
      err
    );

    next(err);

  } finally {
    if (connection) {
      connection.release();
    }
  }
};
/* ── EDIT ─────────────────────────────────────────────────── */
// const editSaleReturn = async (req, res, next) => {
//   let connection;
//   try {
//     const { Sale_Return_Id } = req.params;

//     connection = await db.getConnection();
//     await connection.beginTransaction();

//     const [[existing]] = await connection.query(
//       `SELECT * FROM sale_return WHERE id = ?`,
//       [Sale_Return_Id]
//     );
//     if (!existing) {
//       await connection.rollback();
//       return res.status(404).json({ success: false, message: "Sale Return not found" });
//     }

//     const {
//       Party_Name,
//       Return_Number,
//       Invoice_Number,
//       Invoice_Date,
//       Return_Date,
//       State_Of_Supply,
//       Total_Amount,
//       Total_Paid,
//       Balance_Due,
//       //Reference_Number,
//       splits,   // 🔹 replaces single Payment_Type / Bank_Account_Id
//       items,
//     } = req.body;

//     const [[party]] = await connection.query(
//       `SELECT Party_Id FROM add_party WHERE Party_Name = ? LIMIT 1`,
//       [Party_Name]
//     );
//     if (!party) {
//       await connection.rollback();
//       return res.status(404).json({ success: false, message: "Customer not found" });
//     }

//     const totalAmount = Number(Total_Amount) || 0;
//     const totalPaid   = Number(Total_Paid)   || 0;
//     const balanceDue  = Number(Balance_Due)  || totalAmount - totalPaid;

//     // 🔹 paid cannot exceed total
//     if (totalPaid > totalAmount) {
//       await connection.rollback();
//       return res.status(400).json({
//         success: false,
//         message: "Paid amount should be less than or equal to Total Amount",
//       });
//     }

//     // 🔹 validate splits
//     if (totalPaid > 0) {
//       try {
//         validateSplits(splits, totalPaid);
//       } catch (validationErr) {
//         await connection.rollback();
//         return res.status(400).json({ success: false, message: validationErr.message });
//       }
//     }

//     await connection.query(
//       `UPDATE sale_return SET
//          Party_Id = ?, Return_Number = ?, Invoice_Number = ?, Invoice_Date = ?,
//          Return_Date = ?, State_Of_Supply = ?,
//          Total_Amount = ?, Total_Paid = ?, Balance_Due = ?,
//           updated_at = NOW()
//        WHERE id = ?`,
//       [
//         party.Party_Id,
//         Return_Number    || null,
//         Invoice_Number   || null,
//         Invoice_Date     || null,
//         Return_Date,
//         State_Of_Supply  || null,
//         totalAmount,
//         totalPaid,
//         balanceDue,
        
//         Sale_Return_Id,
//       ]
//     );

//     // 🔹 wipe old splits + ledger rows, re-insert fresh ones
//     await deletePaymentSplits({
//       connection,
//       sourceType: "Sale_Return",
//       sourceId:   Number(Sale_Return_Id),
//     });

//     if (totalPaid > 0 && Array.isArray(splits) && splits.length > 0) {
//       await insertPaymentSplits({
//         connection,
//         sourceType: "Sale_Return",
//         sourceId:   Number(Sale_Return_Id),
//         partyName:  Party_Name,
//         txnDate:    Return_Date,
//         splits,
//       });
//     }
//     await recordPartyLedger({
//   connection,
//   partyId: party.Party_Id,
//   txnType: "Sale_Return",
//   referenceId: Number(Sale_Return_Id),
//   amount: totalAmount,
//   txnDate: Return_Date,
//   docNumber: Return_Number,
//   balanceDue: balanceDue,
// });

//     // items loop — unchanged
//     // const [oldItems] = await connection.query(
//     //   `SELECT * FROM sale_return_items WHERE Sale_Return_Id = ?`,
//     //   [Sale_Return_Id]
//     // );
//     // const oldMap    = new Map(oldItems.map((i) => [i.Item_Id, i]));
//     // const newItemIds = new Set();

//     // for (const item of items) {
//     //   const {
//     //     Item_Name, Item_Category, Item_HSN, Item_Unit,
//     //     Quantity, Sale_Price,
//     //     Discount_On_Sale_Price, Discount_Type_On_Sale_Price,
//     //     Tax_Type, Tax_Amount, Amount,
//     //   } = item;

//     //   const [[existingItem]] = await connection.query(
//     //     `SELECT Item_Id FROM add_item WHERE Item_Name = ? LIMIT 1`,
//     //     [Item_Name]
//     //   );

//     //   let Item_Id;
//     //   if (!existingItem) {
//     //     const [ins] = await connection.execute(
//     //       `INSERT INTO add_item
//     //          (Item_Name, Item_Category, Item_HSN, Item_Unit, Stock_Quantity, created_at, updated_at)
//     //        VALUES (?, ?, ?, ?, 0, NOW(), NOW())`,
//     //       [Item_Name, Item_Category || "", Item_HSN || "", Item_Unit || ""]
//     //     );
//     //     Item_Id = `ITM${ins.insertId}`;
//     //     await connection.execute(
//     //       `UPDATE add_item SET Item_Id = ? WHERE id = ?`,
//     //       [Item_Id, ins.insertId]
//     //     );
//     //   } else {
//     //     Item_Id = existingItem.Item_Id;
//     //   }

//     //   newItemIds.add(Item_Id);
//     //   const old = oldMap.get(Item_Id);

//     //   if (old) {
//     //     await connection.query(
//     //       `UPDATE sale_return_items SET
//     //          Quantity = ?, Sale_Price = ?,
//     //          Discount_On_Sale_Price = ?, Discount_Type_On_Sale_Price = ?,
//     //          Tax_Type = ?, Tax_Amount = ?, Amount = ?, updated_at = NOW()
//     //        WHERE id = ?`,
//     //       [
//     //         Number(Quantity), Number(Sale_Price),
//     //         Number(Discount_On_Sale_Price) || 0,
//     //         Discount_Type_On_Sale_Price    || "Percentage",
//     //         Tax_Type || null,
//     //         Number(Tax_Amount) || 0,
//     //         Number(Amount),
//     //         old.id,
//     //       ]
//     //     );

//     //     const diff = Number(Quantity) - old.Quantity;
//     //     if (diff !== 0) {
//     //       await connection.query(
//     //         `UPDATE add_item SET Stock_Quantity = Stock_Quantity + ?, updated_at = NOW()
//     //          WHERE Item_Id = ?`,
//     //         [diff, Item_Id]
//     //       );
//     //     }
//     //   } else {
//     //     await connection.query(
//     //       `INSERT INTO sale_return_items
//     //          (Sale_Return_Id, Item_Id, Quantity, Sale_Price,
//     //           Discount_On_Sale_Price, Discount_Type_On_Sale_Price,
//     //           Tax_Type, Tax_Amount, Amount)
//     //        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//     //       [
//     //         Sale_Return_Id,
//     //         Item_Id,
//     //         Number(Quantity), Number(Sale_Price),
//     //         Number(Discount_On_Sale_Price) || 0,
//     //         Discount_Type_On_Sale_Price    || "Percentage",
//     //         Tax_Type || null,
//     //         Number(Tax_Amount) || 0,
//     //         Number(Amount),
//     //       ]
//     //     );
//     //     await connection.query(
//     //       `UPDATE add_item SET Stock_Quantity = Stock_Quantity + ?, updated_at = NOW()
//     //        WHERE Item_Id = ?`,
//     //       [Number(Quantity), Item_Id]
//     //     );
//     //   }
//     // }

//     // // delete removed items — reverse stock restoration
//     // for (const old of oldItems) {
//     //   if (!newItemIds.has(old.Item_Id)) {
//     //     await connection.query(
//     //       `DELETE FROM sale_return_items WHERE id = ?`,
//     //       [old.id]
//     //     );
//     //     await connection.query(
//     //       `UPDATE add_item SET Stock_Quantity = Stock_Quantity - ?, updated_at = NOW()
//     //        WHERE Item_Id = ?`,
//     //       [old.Quantity, old.Item_Id]
//     //     );
//     //   }
//     // }
//     // Step 1: resolve every line, create new items, sync HSN
// const [oldItems] = await connection.query(
//   `SELECT * FROM sale_return_items WHERE Sale_Return_Id = ?`,
//   [Sale_Return_Id]
// );

// const resolvedLines = [];
// for (const item of items) {
//   const { Item_Name, Item_Category, Item_HSN, Item_Unit, Quantity, Sale_Price,
//           Discount_On_Sale_Price, Discount_Type_On_Sale_Price,
//           Tax_Type, Tax_Amount, Amount } = item;

//   // const [[existingItem]] = await connection.query(
//   //   `SELECT Item_Id, Item_HSN FROM add_item WHERE Item_Name = ? LIMIT 1`,
//   //   [Item_Name]
//   // );
//    const [[existingItem]] = await connection.query(
//     `SELECT Item_Id, Item_HSN FROM add_item WHERE TRIM(Item_Name) = TRIM(?)) LIMIT 1`,
//     [Item_Name]
//   );

//   let Item_Id;
//   if (!existingItem) {
//     const [ins] = await connection.execute(
//       `INSERT INTO add_item
//          (Item_Name, Item_Category, Item_HSN, Item_Unit, Stock_Quantity, created_at, updated_at)
//        VALUES (?, ?, ?, ?, 0, NOW(), NOW())`,
//       [Item_Name, Item_Category || "", Item_HSN || "", Item_Unit || ""]
//     );
//     Item_Id = `ITM${ins.insertId}`;
//     await connection.execute(`UPDATE add_item SET Item_Id = ? WHERE id = ?`, [Item_Id, ins.insertId]);
//   } else {
//     Item_Id = existingItem.Item_Id;
//     if (Item_HSN && Item_HSN !== existingItem.Item_HSN) {
//       await connection.query(
//         `UPDATE add_item SET Item_HSN = ?, updated_at = NOW() WHERE Item_Id = ?`,
//         [Item_HSN, Item_Id]
//       );
//     }
//   }

//   resolvedLines.push({ Item_Id, Quantity, Sale_Price, Discount_On_Sale_Price,
//                         Discount_Type_On_Sale_Price, Tax_Type, Tax_Amount, Amount });
// }

// // Step 2: net stock delta per Item_Id (sale return ADDS stock back, diff applied as "+")
// const newQtyByItem = new Map();
// resolvedLines.forEach((l) => newQtyByItem.set(l.Item_Id, (newQtyByItem.get(l.Item_Id) || 0) + Number(l.Quantity)));
// const oldQtyByItem = new Map();
// oldItems.forEach((o) => oldQtyByItem.set(o.Item_Id, (oldQtyByItem.get(o.Item_Id) || 0) + Number(o.Quantity)));

// const allItemIds = new Set([...newQtyByItem.keys(), ...oldQtyByItem.keys()]);
// for (const itemId of allItemIds) {
//   const diff = (newQtyByItem.get(itemId) || 0) - (oldQtyByItem.get(itemId) || 0);
//   if (diff !== 0) {
//     await connection.query(
//       `UPDATE add_item SET Stock_Quantity = Stock_Quantity + ?, updated_at = NOW() WHERE Item_Id = ?`,
//       [diff, itemId]
//     );
//   }
// }

// // Step 3: delete old return items, reinsert fresh
// await connection.query(`DELETE FROM sale_return_items WHERE Sale_Return_Id = ?`, [Sale_Return_Id]);

// for (const line of resolvedLines) {
//   await connection.query(
//     `INSERT INTO sale_return_items
//        (Sale_Return_Id, Item_Id, Quantity, Sale_Price,
//         Discount_On_Sale_Price, Discount_Type_On_Sale_Price,
//         Tax_Type, Tax_Amount, Amount)
//      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//     [
//       Sale_Return_Id, line.Item_Id,
//       Number(line.Quantity), Number(line.Sale_Price),
//       Number(line.Discount_On_Sale_Price) || 0,
//       line.Discount_Type_On_Sale_Price || "Percentage",
//       line.Tax_Type || null, Number(line.Tax_Amount) || 0, Number(line.Amount),
//     ]
//   );
// }

//     await connection.commit();
//     return res.status(200).json({ success: true, message: "Sale Return updated", Sale_Return_Id });
//   } catch (err) {
//     if (connection) await connection.rollback();
//     console.error("❌ editSaleReturn:", err);
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };
const editSaleReturn = async (req, res, next) => {
  let connection;

  try {
    const { Sale_Return_Id } = req.params;

    connection = await db.getConnection();
    await connection.beginTransaction();

    // =========================================================
    // 1. CHECK RETURN EXISTS
    // =========================================================

    const [[existing]] =
      await connection.query(
        `SELECT *
         FROM sale_return
         WHERE id = ?`,
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
      Total_Amount,
      splits,
      items,
    } = req.body;

    // =========================================================
    // 3. PAYMENT SPLITS
    // =========================================================

    const normalizedSplits = (splits || [])
      .filter((split) => {
        if (!split.Payment_Type) {
          return false;
        }

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

    const validSplits =
      normalizedSplits.filter(
        (split, index) => {
          // first valid payment stays,
          // including ₹0
          if (index === 0) {
            return true;
          }

          // later zero payments disappear
          return split.Amount > 0;
        }
      );

    // =========================================================
    // 4. TOTALS
    // =========================================================

    const totalAmount =
      Number(Total_Amount) || 0;

    const totalPaid =
      validSplits.reduce(
        (sum, split) =>
          sum +
          (Number(split.Amount) || 0),
        0
      );

    const balanceDue =
      totalAmount - totalPaid;

    if (totalPaid > totalAmount) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          "Paid amount should be less than or equal to Total Amount",
      });
    }

    // =========================================================
    // 5. VALIDATE SURVIVING SPLITS
    // =========================================================

    if (validSplits.length > 0) {
      try {
        validateSplits(
          validSplits,
          totalPaid
        );
      } catch (validationErr) {
        await connection.rollback();

        return res.status(400).json({
          success: false,
          message: validationErr.message,
        });
      }
    }

    // =========================================================
    // 6. PARTY
    // =========================================================

    const [[party]] =
      await connection.query(
        `SELECT Party_Id
         FROM add_party
         WHERE Party_Name = ?
         LIMIT 1`,
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
    // 7. UPDATE HEADER
    // =========================================================

    await connection.query(
      `UPDATE sale_return
       SET
         Party_Id = ?,
         Return_Number = ?,
         Invoice_Number = ?,
         Invoice_Date = ?,
         Return_Date = ?,
         State_Of_Supply = ?,
         Total_Amount = ?,
         Total_Paid = ?,
         Balance_Due = ?,
         updated_at = NOW()
       WHERE id = ?`,
      [
        party.Party_Id,
        Return_Number || null,
        Invoice_Number || null,
        Invoice_Date || null,
        Return_Date,
        State_Of_Supply || null,
        totalAmount,
        totalPaid,
        balanceDue,
        Sale_Return_Id,
      ]
    );

    // =========================================================
    // 8. REPLACE PAYMENT SPLITS
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
    // 9. PARTY LEDGER
    // =========================================================

    await recordPartyLedger({
      connection,
      partyId: party.Party_Id,
      txnType: "Sale_Return",
      referenceId: Number(Sale_Return_Id),
      amount: totalAmount,
      txnDate: Return_Date,
      docNumber: Return_Number,
      balanceDue,
    });

    // =========================================================
    // 10. OLD ITEMS
    // =========================================================

    const [oldItems] =
      await connection.query(
        `SELECT *
         FROM sale_return_items
         WHERE Sale_Return_Id = ?`,
        [Sale_Return_Id]
      );

    // =========================================================
    // 11. RESOLVE NEW LINES
    // =========================================================

    const resolvedLines = [];

    for (const item of items || []) {
      const itemName =
        item.Item_Name?.trim();

      const itemAmount =
        Number(item.Amount) || 0;

      // =======================================================
      // No name + positive amount -> ERROR
      // No name + zero amount     -> SKIP
      // =======================================================

      if (!itemName) {
        if (itemAmount > 0) {
          await connection.rollback();

          return res.status(400).json({
            success: false,
            message:
              "Please enter an item name for the row.",
          });
        }

        continue;
      }

      const {
        Item_Category,
        Item_HSN,
        Item_Unit,
        Quantity,
        Sale_Price,
        Discount_On_Sale_Price,
        Discount_Type_On_Sale_Price,
        Tax_Type,
        Tax_Amount,
        Amount,
      } = item;

      let Item_Id =
        item.Item_Id || null;

      let dbItemRow = null;

      // =======================================================
      // 12. FIND ITEM
      // =======================================================

      if (Item_Id) {
        const [rows] =
          await connection.query(
            `SELECT *
             FROM add_item
             WHERE Item_Id = ?
             LIMIT 1`,
            [Item_Id]
          );

        dbItemRow =
          rows[0] || null;

      } else {
        const [rows] =
          await connection.query(
            `SELECT *
             FROM add_item
             WHERE TRIM(Item_Name) = TRIM(?)
             LIMIT 1`,
            [itemName]
          );

        dbItemRow =
          rows[0] || null;

        Item_Id =
          dbItemRow?.Item_Id || null;
      }

      // =======================================================
      // 13. CREATE ITEM
      // =======================================================

      if (!dbItemRow) {
        const [maxRow] =
          await connection.query(
            `SELECT
               MAX(
                 CAST(
                   SUBSTRING(Item_Id, 4)
                   AS UNSIGNED
                 )
               ) AS maxId
             FROM add_item
             WHERE Item_Id LIKE 'ITM%'`
          );

        const autoId =
          (maxRow[0]?.maxId || 0) + 1;

        Item_Id =
          "ITM" +
          autoId
            .toString()
            .padStart(3, "0");

        await connection.execute(
          `INSERT INTO add_item
           (
             Item_Id,
             Item_Name,
             Item_Category,
             Item_HSN,
             Item_Unit,
             Stock_Quantity,
             created_at,
             updated_at
           )
           VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            Item_Id,
            itemName,
            Item_Category || "",
            cleanValue(Item_HSN),
            Item_Unit || "",
            0,
          ]
        );

        dbItemRow = {
          Item_Id,
          Item_HSN,
          Item_Category,
          Item_Unit,
        };

      } else {
        // =====================================================
        // 14. UPDATE ALLOWED MASTER FIELDS
        // =====================================================

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
          updates.push(
            "Item_Category = ?"
          );

          params.push(
            Item_Category || ""
          );
        }

        if (updates.length > 0) {
          params.push(Item_Id);

          await connection.query(
            `UPDATE add_item
             SET ${updates.join(", ")},
                 updated_at = NOW()
             WHERE Item_Id = ?`,
            params
          );
        }
      }

      // =======================================================
      // 15. KEEP RESOLVED LINE
      // =======================================================

      resolvedLines.push({
        ...item,

        Item_Id,

        Quantity:
          Number(Quantity) || 0,

        Sale_Price:
          Number(Sale_Price) || 0,

        Discount_On_Sale_Price:
          Number(
            Discount_On_Sale_Price
          ) || 0,

        Discount_Type_On_Sale_Price:
          Discount_Type_On_Sale_Price ||
          "Percentage",

        Tax_Type:
          Tax_Type || null,

        Tax_Amount:
          Number(Tax_Amount) || 0,

        Amount:
          Number(Amount) || 0,
      });
    }

    // =========================================================
    // 16. NEW QUANTITY PER ITEM
    // =========================================================

    const newQtyByItem =
      new Map();

    for (const line of resolvedLines) {
      newQtyByItem.set(
        line.Item_Id,
        (newQtyByItem.get(line.Item_Id) || 0) +
          line.Quantity
      );
    }

    // =========================================================
    // 17. OLD QUANTITY PER ITEM
    // =========================================================

    const oldQtyByItem =
      new Map();

    for (const old of oldItems) {
      oldQtyByItem.set(
        old.Item_Id,
        (oldQtyByItem.get(old.Item_Id) || 0) +
          (Number(old.Quantity) || 0)
      );
    }

    // =========================================================
    // 18. STOCK DIFFERENCE
    //
    // SALE RETURN ADDS STOCK.
    //
    // Old return = 5
    // New return = 8
    // diff = +3
    // stock += 3
    //
    // Old return = 8
    // New return = 5
    // diff = -3
    // stock -= 3
    // =========================================================

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
          `UPDATE add_item
           SET
             Stock_Quantity =
               Stock_Quantity + ?,
             updated_at = NOW()
           WHERE Item_Id = ?`,
          [
            diff,
            itemId,
          ]
        );
      }
    }

    // =========================================================
    // 19. DELETE OLD RETURN ITEMS
    // =========================================================

    await connection.query(
      `DELETE FROM sale_return_items
       WHERE Sale_Return_Id = ?`,
      [Sale_Return_Id]
    );

    // =========================================================
    // 20. REINSERT
    // =========================================================

    for (const line of resolvedLines) {
      await connection.query(
        `INSERT INTO sale_return_items
        (
          Sale_Return_Id,
          Item_Id,
          Quantity,
          Sale_Price,
          Discount_On_Sale_Price,
          Discount_Type_On_Sale_Price,
          Tax_Type,
          Tax_Amount,
          Amount
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          Sale_Return_Id,
          line.Item_Id,
          line.Quantity,
          line.Sale_Price,
          line.Discount_On_Sale_Price,
          line.Discount_Type_On_Sale_Price,
          line.Tax_Type,
          line.Tax_Amount,
          line.Amount,
        ]
      );
    }

    // =========================================================
    // 21. COMMIT
    // =========================================================

    await connection.commit();

    return res.status(200).json({
      success: true,
      message:
        "Sale Return updated successfully",
      Sale_Return_Id,
      totalAmount,
      totalPaid,
      balanceDue,
    });

  } catch (err) {
    if (connection) {
      await connection.rollback();
    }

    console.error(
      "editSaleReturn:",
      err
    );

    next(err);

  } finally {
    if (connection) {
      connection.release();
    }
  }
};
/* ── DELETE ───────────────────────────────────────────────── */
const deleteSaleReturn = async (req, res, next) => {
  let connection;
  try {
    const { id } = req.params;

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [items] = await connection.query(
      `SELECT Item_Id, Quantity FROM sale_return_items WHERE Sale_Return_Id = ?`,
      [id]
    );

    // reverse stock
    for (const item of items) {
      await connection.query(
        `UPDATE add_item SET Stock_Quantity = Stock_Quantity - ?, updated_at = NOW()
         WHERE Item_Id = ?`,
        [item.Quantity, item.Item_Id]
      );
    }

    // 🔹 wipe splits + ledger rows before deleting header
    await deletePaymentSplits({
      connection,
      sourceType: "Sale_Return",
      sourceId:   Number(id),
    });

    await connection.query(
      `DELETE FROM sale_return_items WHERE Sale_Return_Id = ?`,
      [id]
    );
    await connection.query(
      `DELETE FROM sale_return WHERE id = ?`,
      [id]
    );

    await connection.commit();
    return res.status(200).json({ success: true, message: "Sale Return deleted" });
  } catch (err) {
    if (connection) await connection.rollback();
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

export {
  getAllSaleReturns,
  getSaleReturnById,
  createSaleReturn,
  editSaleReturn,
  deleteSaleReturn,
};