import db from "../config/db.js";
import { validateSplits, insertPaymentSplits, deletePaymentSplits } from "../utils/paymentSplitHelper.js";

const PAGE_SIZE = 20;

/* ═══════════════════════════════════════
   CATEGORY CRUD
═══════════════════════════════════════ */
const createExpenseCategory = async (req, res, next) => {
  try {
    const { Category_Name, Category_Type} = req.body;
    if (!Category_Name?.trim()) {
      return res.status(400).json({ success: false, message: "Category Name is required" });
    }
    if (!["Direct", "Indirect"].includes(Category_Type)) {
      return res.status(400).json({ success: false, message: "Category Type must be Direct or Indirect" });
    }
    const normalizedName = Category_Name.trim().toLowerCase();

const [existing] = await db.query(
  `SELECT id
   FROM expense_categories
   WHERE LOWER(TRIM(Category_Name)) = ?`,
  [normalizedName]
);

if (existing.length > 0) {
  return res.status(400).json({
    success: false,
    message: "Category already exists.",
  });
}
    
    const [result] = await db.query(
      `INSERT INTO expense_categories (Category_Name, Category_Type) VALUES (?, ?)`,
      [Category_Name.trim(), Category_Type]
    );
    res.status(201).json({ success: true, message: "Category created", categoryId: result.insertId });
  } catch (err) {
    next(err);
  }
};

const editExpenseCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { Category_Name, Category_Type} = req.body;
    if (!Category_Name?.trim()) {
      return res.status(400).json({ success: false, message: "Category Name is required" });
    }
    if (!["Direct", "Indirect"].includes(Category_Type)) {
      return res.status(400).json({ success: false, message: "Type must be Direct or Indirect" });
    }
    const normalizedName = Category_Name.trim().toLowerCase();

const [existing] = await db.query(
  `SELECT id
   FROM expense_categories
   WHERE LOWER(TRIM(Category_Name)) = ?
     AND id <> ?`,
  [normalizedName, id]
);

if (existing.length > 0) {
  return res.status(400).json({
    success: false,
    message: "Another category with this name already exists.",
  });
}
    await db.query(
      `UPDATE expense_categories SET Category_Name = ?, Category_Type = ? WHERE id = ?`,
      [Category_Name.trim(), Category_Type, id]
    );
    res.status(200).json({ success: true, message: "Category updated" });
  } catch (err) {
    next(err);
  }
};

const deleteExpenseCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 🔹 block if used in any expense
    const [[{ cnt }]] = await db.query(
      `SELECT COUNT(*) AS cnt FROM expenses WHERE Category_Id = ?`,
      [id]
    );
    if (cnt > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete: this category is used in existing expenses.",
      });
    }
    await db.query(`DELETE FROM expense_categories WHERE id = ?`, [id]);
    res.status(200).json({ success: true, message: "Category deleted" });
  } catch (err) {
    next(err);
  }
};

const getAllExpenseCategories = async (req, res, next) => {
  try {
    const [categories] = await db.query(
      `SELECT ec.*,
         COALESCE((SELECT SUM(e.Total_Amount) FROM expenses e WHERE e.Category_Id = ec.id), 0) AS Total_Spent
       FROM expense_categories ec ORDER BY ec.Category_Name ASC`
    );
    res.status(200).json({ success: true, categories });
  } catch (err) {
    next(err);
  }
};

/* ═══════════════════════════════════════
   EXPENSE ITEM MASTER CRUD
═══════════════════════════════════════ */
const createExpenseItemMaster = async (req, res, next) => {
  try {
    const {
      itemName,
      itemHSN,
      price,
      priceType,   // "Tax Excluded" | "Tax Included" | null
      taxType,     // "GST5" | "GST12" | "GST18" | "GST28" | "None" | null
    } = req.body;

    if (!itemName?.trim()) {
      return res.status(400).json({ success: false, message: "Item Name is required" });
    }

    const [result] = await db.query(
      `INSERT INTO expense_item_master (Item_Name, Item_HSN, Price, Price_Type, Tax_Type)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         Item_HSN   = VALUES(Item_HSN),
         Price      = VALUES(Price),
         Price_Type = VALUES(Price_Type),
         Tax_Type  = VALUES(Tax_Type)`,
      [
        itemName.trim(),
        itemHSN   || null,
        price     != null && price !== "" ? Number(price) : null,
        priceType || "Tax Excluded",
        taxType   || null,
      ]
    );

    res.status(201).json({ success: true, message: "Item saved", id: result.insertId });
  } catch (err) {
    next(err);
  }
};

const editExpenseItemMaster = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      itemName,
      itemHSN,
      price,
      priceType,
      taxType,
    } = req.body;

    if (!itemName?.trim()) {
      return res.status(400).json({ success: false, message: "Item Name is required" });
    }

    // name/HSN/price change propagates everywhere via FK join — no child row updates needed
    await db.query(
      `UPDATE expense_item_master
       SET Item_Name = ?, Item_HSN = ?, Price = ?, Price_Type = ?, Tax_Type= ?
       WHERE id = ?`,
      [
        itemName.trim(),
        itemHSN   || null,
        price     != null && price !== "" ? Number(price) : null,
        priceType || "Tax Excluded",
        taxType   || null,
        id,
      ]
    );

    res.status(200).json({ success: true, message: "Item updated" });
  } catch (err) {
    next(err);
  }
};

const deleteExpenseItemMaster = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [[{ cnt }]] = await db.query(
      `SELECT COUNT(*) AS cnt FROM expense_items WHERE Expense_Item_Master_Id = ?`,
      [id]
    );
    if (cnt > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete: this item is used in existing expenses.",
      });
    }

    await db.query(`DELETE FROM expense_item_master WHERE id = ?`, [id]);
    res.status(200).json({ success: true, message: "Item deleted" });
  } catch (err) {
    next(err);
  }
};

const getAllExpenseItemMasters = async (req, res, next) => {
  try {
    const search   = req.query.search?.trim().toLowerCase() || "";
    const whereSQL = search ? `WHERE LOWER(Item_Name) LIKE ?` : "";
    const params   = search ? [`%${search}%`] : [];

    const [items] = await db.query(
      `SELECT * FROM expense_item_master ${whereSQL} ORDER BY Item_Name ASC`,
      params
    );

    res.status(200).json({ success: true, items });
  } catch (err) {
    next(err);
  }
};

/* ═══════════════════════════════════════
   CREATE EXPENSE
═══════════════════════════════════════ */
/* ═══════════════════════════════════════
   HELPER — get or create expense item master by name
═══════════════════════════════════════ */
const getOrCreateExpenseItemMaster = async (connection, itemName, itemHSN) => {
  const [[existing]] = await connection.query(
    `SELECT id FROM expense_item_master WHERE Item_Name = ? LIMIT 1`,
    [itemName.trim()]
  );
  if (existing) return existing.id;

  const [result] = await connection.query(
    `INSERT INTO expense_item_master (Item_Name, Item_HSN) VALUES (?, ?)`,
    [itemName.trim(), itemHSN || null]
  );
  return result.insertId;
};

/* ─── get or create expense category by name ─── */
const getOrCreateExpenseCategory = async (connection, Category_Name, Category_Type= "Indirect") => {
  const [[existing]] = await connection.query(
    `SELECT id FROM expense_categories WHERE Category_Name = ? LIMIT 1`,
    [Category_Name.trim()]
  );
  if (existing) return existing.id;

  const [result] = await connection.query(
    `INSERT INTO expense_categories (Category_Name, Category_Type) VALUES (?, ?)`,
    [Category_Name.trim(), Category_Type|| "Indirect"]
  );
  return result.insertId;
};

/* ═══════════════════════════════════════
   CREATE EXPENSE
═══════════════════════════════════════ */
const createExpense = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const {
      Expense_Number,
      Expense_Date,
      Bill_Date,
      With_GST,
      Category_Name,       // 🔹 typed directly — not Category_Id
      Category_Type,       // optional, defaults to "Indirect"
      Party_Name,
      State_Of_Supply,
      
      Total_Amount,
      Total_Paid,
      splits,
      items,               // [{ Item_Name, Item_HSN, Quantity, Price, Discount_On_Price,
                           //    Discount_Type_On_Price, Tax_Type, Tax_Amount, Amount }]
    } = req.body;

    const withGST = !!With_GST;

    if (!Category_Name?.trim() || !Expense_Date || !Array.isArray(items) || items.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Category Name, Expense Date and items are required.",
      });
    }

    if (withGST && (!Party_Name || !Bill_Date)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Party and Bill Date are required for GST expenses.",
      });
    }

    const totalAmount = Number(Total_Amount) || 0;
    const totalPaid   = Total_Paid === "" || Total_Paid === undefined ? 0 : Number(Total_Paid);
    const balanceDue  = totalAmount - totalPaid;

    // 🔹 without GST: must pay full amount — no credit allowed
    if (!withGST && Math.round(totalPaid * 100) !== Math.round(totalAmount * 100)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "For non-GST expenses, Total Paid must equal Total Amount.",
      });
    }

    // 🔹 with GST: partial allowed but can't overpay
    if (withGST && totalPaid > totalAmount) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Paid amount cannot exceed Total Amount.",
      });
    }

    // 🔹 validate splits sum === totalPaid
    if (totalPaid > 0) {
      try {
        validateSplits(splits, totalPaid);
      } catch (err) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: err.message });
      }
    }

    // 🔹 get or create category — default type Indirect
    const Category_Id = await getOrCreateExpenseCategory(
      connection,
      Category_Name,
      Category_Type || "Indirect"
    );

    // 🔹 party lookup (GST only)
    let Party_Id = null;
    if (withGST) {
      const [[party]] = await connection.query(
        `SELECT Party_Id FROM add_party WHERE Party_Name = ? LIMIT 1`,
        [Party_Name]
      );
      if (!party) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: "Party not found." });
      }
      Party_Id = party.Party_Id;
    }

    const [fy] = await connection.query(
      `SELECT Financial_Year FROM financial_year WHERE Current_Financial_Year = 1 LIMIT 1`
    );
    const activeFY = fy.length ? fy[0].Financial_Year : null;

    const [expenseResult] = await connection.query(
      `INSERT INTO expenses
       (Expense_Number, Expense_Date, Bill_Date, With_GST, Category_Id, Party_Id,
        State_Of_Supply,  Total_Amount, Total_Paid, Balance_Due,
        financial_year, created_at, updated_at)
       VALUES (?, ?, ?, ?,  ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        Expense_Number || null,
        Expense_Date,
        withGST ? Bill_Date : null,
        withGST ? 1 : 0,
        Category_Id,
        Party_Id,
        State_Of_Supply || null,
       
        totalAmount,
        totalPaid,
        balanceDue,
        activeFY,
      ]
    );

    const expenseId = expenseResult.insertId;
    const txnDate   = withGST ? Bill_Date : Expense_Date;
    const partyName = withGST ? Party_Name : null;

    // 🔹 splits → bank/cash ledgers
    if (totalPaid > 0 && Array.isArray(splits) && splits.length > 0) {
      await insertPaymentSplits({
        connection,
        sourceType: "Expense",
        sourceId:   expenseId,
        partyName,
        txnDate,
        splits,
      });
    }

    // 🔹 items — get or create master record, then insert child row
    for (const item of items) {
      const {
        Item_Name,
        Item_HSN,
        Quantity,
        Price,
        Discount_On_Price,
        Discount_Type_On_Price,
        Tax_Type,
        Tax_Amount,
        Amount,
      } = item;

      if (!Item_Name?.trim()) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: "Item name is required." });
      }

      if (withGST && (!Quantity || !Price)) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: "Quantity and Price are required for GST expense items.",
        });
      }

      // 🔹 look up or create master item — if HSN provided and item is new, store it
      const masterItemId = await getOrCreateExpenseItemMaster(connection, Item_Name, Item_HSN);

      await connection.query(
        `INSERT INTO expense_items
         (Expense_Id, Expense_Item_Master_Id, Quantity, Price,
          Discount_On_Price, Discount_Type_On_Price, Tax_Type, Tax_Amount, Amount,
          created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          expenseId,
          masterItemId,
          withGST ? Number(Quantity) : null,
          withGST ? Number(Price)    : null,
          Number(Discount_On_Price)  || 0,
          Discount_Type_On_Price     || "Percentage",
          Tax_Type  || "None",
          Tax_Amount ? Number(Tax_Amount) : null,
          Number(Amount) || 0,
        ]
      );
    }

    await connection.commit();
    return res.status(201).json({
      success: true,
      message: "Expense created successfully",
      expenseId,
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("❌ Create expense error:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

/* ═══════════════════════════════════════
   EDIT EXPENSE
═══════════════════════════════════════ */
const editExpense = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();
    const { id } = req.params;

    const [[existing]] = await connection.query(`SELECT * FROM expenses WHERE id = ?`, [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Expense not found." });
    }

    const {
      Expense_Number,
      Expense_Date,
      Bill_Date,
      With_GST,
      Category_Name,      // 🔹 typed directly
      Category_Type,
      Party_Name,
      State_Of_Supply,
     
      Total_Amount,
      Total_Paid,
      splits,
      items,
    } = req.body;

    const withGST = !!With_GST;

    if (!Category_Name?.trim() || !Expense_Date || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Category Name, Expense Date and items are required.",
      });
    }

    if (withGST && (!Party_Name || !Bill_Date)) {
      return res.status(400).json({
        success: false,
        message: "Party and Bill Date are required for GST expenses.",
      });
    }

    const totalAmount = Number(Total_Amount) || 0;
    const totalPaid   = Total_Paid === "" || Total_Paid === undefined ? 0 : Number(Total_Paid);
    const balanceDue  = totalAmount - totalPaid;

    if (!withGST && Math.round(totalPaid * 100) !== Math.round(totalAmount * 100)) {
      return res.status(400).json({
        success: false,
        message: "For non-GST expenses, Total Paid must equal Total Amount.",
      });
    }

    if (withGST && totalPaid > totalAmount) {
      return res.status(400).json({
        success: false,
        message: "Paid amount cannot exceed Total Amount.",
      });
    }

    if (totalPaid > 0) {
      try {
        validateSplits(splits, totalPaid);
      } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
    }

    await connection.beginTransaction();

    // 🔹 get or create category
    const Category_Id = await getOrCreateExpenseCategory(
      connection,
      Category_Name,
      Category_Type || "Indirect"
    );

    let Party_Id = null;
    if (withGST) {
      const [[party]] = await connection.query(
        `SELECT Party_Id FROM add_party WHERE Party_Name = ? LIMIT 1`,
        [Party_Name]
      );
      if (!party) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: "Party not found." });
      }
      Party_Id = party.Party_Id;
    }

    await connection.query(
      `UPDATE expenses SET
         Expense_Number = ?, Expense_Date = ?, Bill_Date = ?, With_GST = ?,
         Category_Id = ?, Party_Id = ?, State_Of_Supply = ?, 
         Total_Amount = ?, Total_Paid = ?, Balance_Due = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        Expense_Number || null,
        Expense_Date,
        withGST ? Bill_Date : null,
        withGST ? 1 : 0,
        Category_Id,
        Party_Id,
        State_Of_Supply  || null,
        
        totalAmount,
        totalPaid,
        balanceDue,
        id,
      ]
    );

    const txnDate   = withGST ? Bill_Date : Expense_Date;
    const partyName = withGST ? Party_Name : null;

    // 🔹 wipe old splits + ledger rows, re-insert fresh
    await deletePaymentSplits({ connection, sourceType: "Expense", sourceId: Number(id) });

    if (totalPaid > 0 && Array.isArray(splits) && splits.length > 0) {
      await insertPaymentSplits({
        connection,
        sourceType: "Expense",
        sourceId:   Number(id),
        partyName,
        txnDate,
        splits,
      });
    }

    // 🔹 replace items wholesale
    await connection.query(`DELETE FROM expense_items WHERE Expense_Id = ?`, [id]);

    for (const item of items) {
      const {
        Item_Name,
        Item_HSN,
        Quantity,
        Price,
        Discount_On_Price,
        Discount_Type_On_Price,
        Tax_Type,
        Tax_Amount,
        Amount,
      } = item;

      if (!Item_Name?.trim()) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: "Item name is required." });
      }

      if (withGST && (!Quantity || !Price)) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: "Quantity and Price required for GST expense items.",
        });
      }

      const masterItemId = await getOrCreateExpenseItemMaster(connection, Item_Name, Item_HSN);

      await connection.query(
        `INSERT INTO expense_items
         (Expense_Id, Expense_Item_Master_Id, Quantity, Price,
          Discount_On_Price, Discount_Type_On_Price, Tax_Type, Tax_Amount, Amount,
          created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          id,
          masterItemId,
          withGST ? Number(Quantity) : null,
          withGST ? Number(Price)    : null,
          Number(Discount_On_Price)  || 0,
          Discount_Type_On_Price     || "Percentage",
          Tax_Type  || "None",
          Tax_Amount ? Number(Tax_Amount) : null,
          Number(Amount) || 0,
        ]
      );
    }

    await connection.commit();
    return res.status(200).json({ success: true, message: "Expense updated successfully", expenseId: id });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("❌ Edit expense error:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

/* ═══════════════════════════════════════
   GET SINGLE EXPENSE FOR EDIT
═══════════════════════════════════════ */
const getExpenseById = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();
    const { id } = req.params;

    const [[expense]] = await connection.query(
      `SELECT e.*, a.Party_Name, ec.Category_Name, ec.Category_Type
       FROM expenses e
       LEFT JOIN add_party a ON e.Party_Id = a.Party_Id
       LEFT JOIN expense_categories ec ON e.Category_Id = ec.id
       WHERE e.id = ? LIMIT 1`,
      [id]
    );

    if (!expense) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }

    // 🔹 items join to master for live name/HSN
    const [items] = await connection.query(
      `SELECT ei.*, eim.Item_Name, eim.Item_HSN
       FROM expense_items ei
       LEFT JOIN expense_item_master eim ON eim.id = ei.Expense_Item_Master_Id
       WHERE ei.Expense_Id = ?
       ORDER BY ei.id ASC`,
      [expense.id]
    );

    // 🔹 splits
    const [splits] = await connection.query(
      `SELECT ps.*, ba.Account_Display_Name
       FROM payment_splits ps
       LEFT JOIN bank_accounts ba ON ba.id = ps.Bank_Account_Id
       WHERE ps.Source_Type = 'Expense' AND ps.Source_Id = ?
       ORDER BY ps.id ASC`,
      [expense.id]
    );

    const splitLabels = splits.map((s) =>
      s.Payment_Type === "Bank" ? s.Account_Display_Name : s.Payment_Type
    );
    const counts = {};
    splitLabels.forEach((l) => (counts[l] = (counts[l] || 0) + 1));
    const Payment_Type_Display = Object.entries(counts)
      .map(([label, count]) => (count > 1 ? `${label} (x${count})` : label))
      .join(" + ") || "—";

    return res.status(200).json({
      success: true,
      expense: { ...expense, Payment_Type_Display, items, splits },
    });
  } catch (err) {
    console.error("❌ Get expense by id error:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

/* ═══════════════════════════════════════
   DELETE EXPENSE
═══════════════════════════════════════ */
const deleteExpense = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const { id } = req.params;

    const [[expense]] = await connection.query(`SELECT * FROM expenses WHERE id = ? LIMIT 1`, [id]);
    if (!expense) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Expense not found" });
    }

    // 🔹 wipe splits + ledger rows first
    await deletePaymentSplits({ connection, sourceType: "Expense", sourceId: Number(id) });

    await connection.query(`DELETE FROM expense_items WHERE Expense_Id = ?`, [id]);
    await connection.query(`DELETE FROM expenses WHERE id = ?`, [id]);

    await connection.commit();
    return res.status(200).json({ success: true, message: "Expense deleted" });
  } catch (err) {
    if (connection) await connection.rollback();
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

/* ═══════════════════════════════════════
   GET ALL EXPENSES (paginated)
═══════════════════════════════════════ */
// const getAllExpenses = async (req, res, next) => {
//   let connection;
//   try {
//     connection = await db.getConnection();

//     const page       = parseInt(req.query.page, 10) || 1;
//     const limit      = 10;
//     const offset     = (page - 1) * limit;
//     const search     = req.query.search?.trim().toLowerCase() || "";
//     const fromDate   = req.query.fromDate || null;
//     const toDate     = req.query.toDate   || null;
//     const categoryId = req.query.categoryId || null;

//     const whereClauses = [];
//     const params       = [];

//     if (search) {
//       whereClauses.push(`(
//         LOWER(e.Expense_Number) LIKE ? OR
//         LOWER(a.Party_Name)     LIKE ? OR
//         LOWER(ec.Category_Name) LIKE ? OR
//         CAST(e.Total_Amount AS CHAR) LIKE ?
//       )`);
//       const like = `%${search}%`;
//       params.push(like, like, like, like);
//     }
//     if (categoryId) {
//       whereClauses.push(`e.Category_Id = ?`);
//       params.push(categoryId);
//     }
//     if (fromDate && toDate) {
//       whereClauses.push(`DATE(e.Expense_Date) BETWEEN ? AND ?`);
//       params.push(fromDate, toDate);
//     } else if (fromDate) {
//       whereClauses.push(`DATE(e.Expense_Date) >= ?`);
//       params.push(fromDate);
//     } else if (toDate) {
//       whereClauses.push(`DATE(e.Expense_Date) <= ?`);
//       params.push(toDate);
//     }

//     const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

//     const [rows] = await connection.query(
//       `SELECT e.*, a.Party_Name, ec.Category_Name, ec.Category_Type
//        FROM expenses e
//        LEFT JOIN add_party a ON e.Party_Id = a.Party_Id
//        LEFT JOIN expense_categories ec ON e.Category_Id = ec.id
//        ${whereSQL}
//        ORDER BY e.created_at DESC
//        LIMIT ? OFFSET ?`,
//       [...params, limit, offset]
//     );

//     // 🔹 attach Payment_Type_Display per row
//     for (const row of rows) {
//       const [splits] = await connection.query(
//         `SELECT ps.Payment_Type, ba.Account_Display_Name
//          FROM payment_splits ps
//          LEFT JOIN bank_accounts ba ON ba.id = ps.Bank_Account_Id
//          WHERE ps.Source_Type = 'Expense' AND ps.Source_Id = ?`,
//         [row.id]
//       );
//       const labels = splits.map((s) =>
//         s.Payment_Type === "Bank" ? s.Account_Display_Name : s.Payment_Type
//       );
//       const counts = {};
//       labels.forEach((l) => (counts[l] = (counts[l] || 0) + 1));
//       row.Payment_Type_Display = Object.entries(counts)
//         .map(([label, count]) => (count > 1 ? `${label} (x${count})` : label))
//         .join(" + ") || "—";
//     }

//     const [[{ total }]] = await connection.query(
//       `SELECT COUNT(*) AS total
//        FROM expenses e
//        LEFT JOIN add_party a ON e.Party_Id = a.Party_Id
//        LEFT JOIN expense_categories ec ON e.Category_Id = ec.id
//        ${whereSQL}`,
//       params
//     );

//     const [[totals]] = await connection.query(
//       `SELECT
//          COALESCE(SUM(e.Total_Amount), 0) AS totalAmount,
//          COALESCE(SUM(e.Total_Paid),   0) AS totalPaid,
//          COALESCE(SUM(e.Balance_Due),  0) AS totalBalance
//        FROM expenses e
//        LEFT JOIN add_party a ON e.Party_Id = a.Party_Id
//        LEFT JOIN expense_categories ec ON e.Category_Id = ec.id
//        ${whereSQL}`,
//       params
//     );

//     return res.status(200).json({
//       success: true,
//       currentPage:    page,
//       totalPages:     Math.ceil(total / limit),
//       totalExpenses:  total,
//       expenses:       rows,
//       totals,
//     });
//   } catch (err) {
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };

/* ═══════════════════════════════════════
   BY-CATEGORY (infinite scroll)
═══════════════════════════════════════ */
 const getExpensesByCategory = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();

    const { categoryId } = req.params;
    const lastId   = req.query.lastId ? Number(req.query.lastId) : null;
    const search   = req.query.search?.trim().toLowerCase() || "";
    const fromDate = req.query.fromDate || null;
    const toDate   = req.query.toDate   || null;

    const whereClauses = [`e.Category_Id = ?`];
    const params       = [categoryId];

    if (lastId) { whereClauses.push(`e.id < ?`); params.push(lastId); }
    if (search) {
      whereClauses.push(`(LOWER(e.Expense_Number) LIKE ? OR LOWER(a.Party_Name) LIKE ?)`);
      const like = `%${search}%`;
      params.push(like, like);
    }
    if (fromDate && toDate) {
      whereClauses.push(`DATE(e.Expense_Date) BETWEEN ? AND ?`);
      params.push(fromDate, toDate);
    } else if (fromDate) {
      whereClauses.push(`DATE(e.Expense_Date) >= ?`); params.push(fromDate);
    } else if (toDate) {
      whereClauses.push(`DATE(e.Expense_Date) <= ?`); params.push(toDate);
    }

    const [rows] = await connection.query(
      `SELECT e.id, e.Expense_Number, e.Expense_Date, e.With_GST,
              e.Total_Amount, e.Total_Paid, e.Balance_Due, a.Party_Name
       FROM expenses e
       LEFT JOIN add_party a ON e.Party_Id = a.Party_Id
       WHERE ${whereClauses.join(" AND ")}
       ORDER BY e.id DESC LIMIT ?`,
      [...params, PAGE_SIZE + 1]
    );

    const hasMore    = rows.length > PAGE_SIZE;
    const pageRows   = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
    const nextCursor = pageRows.length ? pageRows[pageRows.length - 1].id : null;

    return res.status(200).json({ success: true, expenses: pageRows, hasMore, nextCursor });
  } catch (err) {
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

/* ═══════════════════════════════════════
   BY ITEM USAGE (infinite scroll)
═══════════════════════════════════════ */
 const getExpenseItemUsage = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();

    const masterItemId = req.query.masterItemId ? Number(req.query.masterItemId) : null;
    if (!masterItemId) {
      return res.status(400).json({ success: false, message: "masterItemId is required" });
    }

    const lastId = req.query.lastId ? Number(req.query.lastId) : null;
    const whereClauses = [`ei.Expense_Item_Master_Id = ?`];
    const params       = [masterItemId];

    if (lastId) { whereClauses.push(`ei.id < ?`); params.push(lastId); }

    const [rows] = await connection.query(
      `SELECT ei.id, ei.Quantity, ei.Price, ei.Amount,
              eim.Item_Name, eim.Item_HSN,
              e.id AS Expense_Id, e.Expense_Number, e.Expense_Date,
              ec.Category_Name, a.Party_Name
       FROM expense_items ei
       LEFT JOIN expense_item_master eim ON eim.id = ei.Expense_Item_Master_Id
       JOIN expenses e ON ei.Expense_Id = e.id
       LEFT JOIN expense_categories ec ON e.Category_Id = ec.id
       LEFT JOIN add_party a ON e.Party_Id = a.Party_Id
       WHERE ${whereClauses.join(" AND ")}
       ORDER BY ei.id DESC LIMIT ?`,
      [...params, PAGE_SIZE + 1]
    );

    const hasMore    = rows.length > PAGE_SIZE;
    const pageRows   = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
    const nextCursor = pageRows.length ? pageRows[pageRows.length - 1].id : null;

    return res.status(200).json({ success: true, usage: pageRows, hasMore, nextCursor });
  } catch (err) {
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

export {
  getExpenseItemUsage,
  getExpenseById,
  getExpensesByCategory,
  createExpenseCategory,
  editExpenseCategory,
  deleteExpenseCategory,
  getAllExpenseCategories,
  createExpense,
  editExpense,
  deleteExpense,
  createExpenseItemMaster,
  editExpenseItemMaster,  
  deleteExpenseItemMaster,
 
  getAllExpenseItemMasters,
};
//WITH GST
// {
//   "Expense_Number": "EXP-001",
//   "Expense_Date": "2026-07-30",
//   "Bill_Date": "2026-07-30",
//   "With_GST": true,
//   "Category_Name": "Office Expense",
//   "Category_Type": "Direct",
//   "Party_Name": "ANJANEYA COMTECH PRIVATE LIMITED",
//   "State_Of_Supply": "West Bengal",
//   "Reference_Number": "CHQ123456",
//   "Total_Amount": 1180,
//   "Total_Paid": 1180,
//   "splits": [
//     {
//       "Payment_Type": "Cash",
//       "Bank_Account_Id": null,
//       "Reference_Number": "",
//       "Amount": 500
//     },
//     {
//       "Payment_Type": "Bank",
//       "Bank_Account_Id": 1,
//       "Reference_Number": "UTR123456789",
//       "Amount": 680
//     }
//   ],
//   "items": [
//     {
//       "Item_Name": "Printer Paper",
//       "Item_HSN": "4802",
//       "Quantity": 10,
//       "Price": 100,
//       "Discount_On_Price": 0,
//       "Discount_Type_On_Price": "Percentage",
//       "Tax_Type": "GST",
//       "Tax_Amount": 180,
//       "Amount": 1180
//     }
//   ]
// }
//WITHOUT GST

// {
//   "Expense_Number": "EXP-002",
//   "Expense_Date": "2026-07-30",
//   "With_GST": false,
//   "Category_Name": "Stationery",
//   "Category_Type": "Indirect",
//   "Reference_Number": "",
//   "Total_Amount": 500,
//   "Total_Paid": 500,
//   "splits": [
//     {
//       "Payment_Type": "Cash",
//       "Bank_Account_Id": null,
//       "Reference_Number": "",
//       "Amount": 500
//     }
//   ],
//   "items": [
//     {
//       "Item_Name": "Pen",
//       "Item_HSN": "",
//       "Quantity": null,
//       "Price": null,
//       "Discount_On_Price": 0,
//       "Discount_Type_On_Price": "Percentage",
//       "Tax_Type": "None",
//       "Tax_Amount": 0,
//       "Amount": 500
//     }
//   ]
// }