
// CREATE TABLE expense_categories (
//   id    INT AUTO_INCREMENT PRIMARY KEY,
//   Category_Name  VARCHAR(100) NOT NULL,
//   Category_Type  ENUM('Direct', 'Indirect') DEFAULT 'Direct'  NOT NULL,
//   created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//   updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
// );


// CREATE TABLE expenses (
//     id INT AUTO_INCREMENT PRIMARY KEY,

//     Expense_Number VARCHAR(255) DEFAULT NULL,

//     Expense_Date DATE NOT NULL,
//     Bill_Date DATE NULL,

//     With_GST TINYINT(1) NOT NULL DEFAULT 0,

//     -- Expense Category
//     Category_Id INT NOT NULL,
//     Category_Name VARCHAR(255) NOT NULL,

//     -- Party Snapshot
//     Party_Id INT NULL,
//     Party_Name VARCHAR(255) NULL,
//     GSTIN VARCHAR(255) NULL,
//     Billing_Address TEXT NULL,
//     State_Of_Supply VARCHAR(255) NULL,

//     -- Payment Details
//     Payment_Type ENUM('Cash','Cheque','Neft','Bank') NOT NULL DEFAULT 'Cash',
//     Bank_Account_Id INT NULL,
//     Bank_Display_Name VARCHAR(255) NULL,
//     Reference_Number VARCHAR(255) NULL,

//     -- Amounts
//     Total_Amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
//     Total_Paid DECIMAL(12,2) NOT NULL DEFAULT 0.00,
//     Balance_Due DECIMAL(12,2) NOT NULL DEFAULT 0.00,

//     Financial_Year VARCHAR(255) NULL,

//     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//         ON UPDATE CURRENT_TIMESTAMP,

//     FOREIGN KEY (Category_Id)
//         REFERENCES expense_categories(Category_Id),

//     FOREIGN KEY (Party_Id)
//         REFERENCES add_party(Party_Id),

//     FOREIGN KEY (Bank_Account_Id)
//         REFERENCES bank_accounts(id)
// );


// CREATE TABLE expense_items (
//     id INT AUTO_INCREMENT PRIMARY KEY,

//     Expense_Id INT NOT NULL,

//     Item_Name VARCHAR(255) NOT NULL,
//     Item_HSN VARCHAR(255) NULL,

//     Quantity DECIMAL(12,2) NULL,
//     Price DECIMAL(12,2) NULL,

//     Discount_On_Price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
//     Discount_Type_On_Price ENUM('Percentage','Amount')
//         NOT NULL DEFAULT 'Percentage',

//     Tax_Type VARCHAR(100) NOT NULL DEFAULT 'None',
//     Tax_Percentage DECIMAL(5,2) NULL,
//     Tax_Amount DECIMAL(12,2) NULL,

//     Amount DECIMAL(12,2) NOT NULL,

//     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//         ON UPDATE CURRENT_TIMESTAMP,

//     FOREIGN KEY (Expense_Id)
//         REFERENCES expenses(id)
//         ON DELETE CASCADE
// );

// CREATE INDEX idx_expense_items_expense_id ON expense_items(Expense_Id);
// CREATE INDEX idx_expenses_category ON expenses(Category_Id);
// CREATE INDEX idx_expenses_date ON expenses(Expense_Date);


import db from "../config/db.js";
import { recordBankTransaction } from "../utils/bankAccountHelper.js";
import { recordCashTransaction } from "../utils/cashTransactionHelper.js";


const PAGE_SIZE = 20;



/* ═══════════════════════════════════════════════════════════
   EXPENSE CATEGORIES
═══════════════════════════════════════════════════════════ */

const createExpenseCategory = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();

    const { categoryName, categoryType } = req.body;

    if (!categoryName || !categoryName.trim()) {
      return res.status(400).json({ success: false, message: "Category Name is required" });
    }
    if (!["Direct", "Indirect"].includes(categoryType)) {
      return res.status(400).json({ success: false, message: "Category Type must be Direct or Indirect" });
    }

    const [result] = await connection.query(
      `INSERT INTO expense_categories (Category_Name, Category_Type, created_at, updated_at)
       VALUES (?, ?, NOW(), NOW())`,
      [categoryName.trim(), categoryType]
    );

    return res.status(201).json({
      success: true,
      message: "Expense category created",
      categoryId: result.insertId, // ✅ just the numeric id, no formatted string
    });
  } catch (err) {
    console.error("❌ Create expense category error:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

const editExpenseCategory = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();

    const { id } = req.params;
    const { categoryName, categoryType } = req.body;

    if (!categoryName || !categoryName.trim()) {
      return res.status(400).json({ success: false, message: "Category Name is required" });
    }
    if (!["Direct", "Indirect"].includes(categoryType)) {
      return res.status(400).json({ success: false, message: "Category Type must be Direct or Indirect" });
    }

    const [[existing]] = await connection.query(
      `SELECT id FROM expense_categories WHERE id = ?`,
      [id]
    );
    if (!existing) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    await connection.query(
      `UPDATE expense_categories SET Category_Name = ?, Category_Type = ?, updated_at = NOW() WHERE id = ?`,
      [categoryName.trim(), categoryType, id]
    );

    return res.status(200).json({ success: true, message: "Category updated" });
  } catch (err) {
    console.error("❌ Edit expense category error:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

/** Left-side category list — small list, plain query is fine (no infinite scroll needed here) */
const getAllExpenseCategories = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();

    const [categories] = await connection.query(
      `SELECT ec.id, ec.Category_Name, ec.Category_Type,
         COALESCE((SELECT SUM(e.Total_Amount) FROM expenses e WHERE e.Category_Id = ec.id), 0) AS Total_Spent,
         COALESCE((SELECT COUNT(*) FROM expenses e WHERE e.Category_Id = ec.id), 0) AS Expense_Count
       FROM expense_categories ec
       ORDER BY ec.Category_Name ASC`
    );

    return res.status(200).json({ success: true, categories });
  } catch (err) {
    console.error("❌ Get all expense categories error:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

// export const deleteExpenseCategory = async (req, res, next) => {
//   let connection;
//   try {
//     connection = await db.getConnection();

//     const { id } = req.params;

//     const [[{ expenseCount }]] = await connection.query(
//       `SELECT COUNT(*) AS expenseCount FROM expenses WHERE Category_Id = ?`,
//       [id]
//     );
//     if (expenseCount > 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Cannot delete: expenses already recorded under this category",
//       });
//     }

//     await connection.query(`DELETE FROM expense_categories WHERE id = ?`, [id]);
//     return res.status(200).json({ success: true, message: "Category deleted" });
//   } catch (err) {
//     console.error("❌ Delete expense category error:", err);
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };

/* ═══════════════════════════════════════════════════════════
   EXPENSES (create / edit / delete / single)
═══════════════════════════════════════════════════════════ */

const createExpense = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const {
      Expense_Number,       // ✅ always optional now
      Expense_Date,
      Bill_Date,
      With_GST,
      Category_Id,
      Party_Name,
      State_Of_Supply,      // ✅ always optional now
      Payment_Type,
      Bank_Account_Id,
      Reference_Number,
      Total_Amount,
      Total_Paid,
      items,
    } = req.body;

    const withGST = !!With_GST;

    /* ── always required ── */
    if (!Category_Id || !Payment_Type || !Expense_Date || !Array.isArray(items) || items.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Category, Payment Type, Expense Date and items are required.",
      });
    }

    /* ── required only when GST applies ── */
    if (withGST && (!Party_Name || !Bill_Date)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Party and Bill Date are required for GST expenses.",
      });
    }

    /* ── required only when paying via bank ── */
    if (Payment_Type === "Bank" && !Bank_Account_Id) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "Bank account is required for Bank payment type." });
    }

    /* ── category must exist ── */
    const [[category]] = await connection.query(
      `SELECT id FROM expense_categories WHERE id = ? LIMIT 1`,
      [Category_Id]
    );
    if (!category) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Expense category not found." });
    }

    /* ── party required only if GST ── */
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

    const totalAmount = Number(Total_Amount) || 0;
    const totalPaid = Total_Paid === "" || Total_Paid === undefined ? 0 : Number(Total_Paid);
    const balanceDue = totalAmount - totalPaid;

    const [expenseResult] = await connection.query(
      `INSERT INTO expenses
       (Expense_Number, Expense_Date, Bill_Date, With_GST, Category_Id, Party_Id, State_Of_Supply,
        Payment_Type, Bank_Account_Id, Reference_Number, Total_Amount, Total_Paid, Balance_Due,
        financial_year, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        Expense_Number || null,
        Expense_Date,
        withGST ? Bill_Date : null,
        withGST ? 1 : 0,
        Category_Id,
        Party_Id,
        State_Of_Supply || null,
        Payment_Type,
        Payment_Type === "Bank" ? Bank_Account_Id : null,
        Reference_Number || null,
        totalAmount,
        totalPaid,
        balanceDue,
        activeFY,
      ]
    );

    const expenseId = expenseResult.insertId; // ✅ numeric id, used everywhere as the reference — no formatted string

    /* ── ledger entries ── */
    if (Payment_Type === "Bank" && Bank_Account_Id && totalPaid > 0) {
      await recordBankTransaction({
        connection,
        bankAccountId: Bank_Account_Id,
        txnType: "Expense",
        referenceId: expenseId,
        partyName: withGST ? Party_Name : null,
        amount: totalPaid,
        txnDate: withGST ? Bill_Date : Expense_Date,
      });
    }

    await recordCashTransaction({
      connection,
      isCash: Payment_Type === "Cash",
      txnType: "Expense",
      referenceId: expenseId,
      partyName: withGST ? Party_Name : null,
      amount: totalPaid || totalAmount,
      txnDate: withGST ? Bill_Date : Expense_Date,
    });

    /* ── items ── */
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

      if (!Item_Name || !Item_Name.trim()) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: "Item name missing." });
      }

      if (withGST && (!Item_HSN || !Quantity || !Price)) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: "HSN, Quantity and Price are required for GST expense items.",
        });
      }

      await connection.query(
        `INSERT INTO expense_items
         (Expense_Id, Item_Name, Item_HSN, Quantity, Price,
          Discount_On_Price, Discount_Type_On_Price, Tax_Type, Tax_Amount, Amount,
          created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          expenseId,           // ✅ FK is the numeric expenses.id, no lookup needed
          Item_Name.trim(),
          withGST ? (Item_HSN || null) : null,
          withGST ? Number(Quantity) : null,
          withGST ? Number(Price) : null,
          Number(Discount_On_Price) || 0,
          Discount_Type_On_Price || "Percentage",
          Tax_Type || "None",
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
      Category_Id,
      Party_Name,
      State_Of_Supply,
      Payment_Type,
      Bank_Account_Id,
      Reference_Number,
      Total_Amount,
      Total_Paid,
      items,
    } = req.body;

    const withGST = !!With_GST;

    if (!Category_Id || !Payment_Type || !Expense_Date || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Category, Payment Type, Expense Date and items are required.",
      });
    }
    if (withGST && (!Party_Name || !Bill_Date)) {
      return res.status(400).json({
        success: false,
        message: "Party and Bill Date are required for GST expenses.",
      });
    }
    if (Payment_Type === "Bank" && !Bank_Account_Id) {
      return res.status(400).json({ success: false, message: "Bank account is required for Bank payment type." });
    }

    await connection.beginTransaction();

    const [[category]] = await connection.query(`SELECT id FROM expense_categories WHERE id = ?`, [Category_Id]);
    if (!category) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Expense category not found." });
    }

    let Party_Id = null;
    if (withGST) {
      const [[party]] = await connection.query(`SELECT Party_Id FROM add_party WHERE Party_Name = ? LIMIT 1`, [Party_Name]);
      if (!party) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: "Party not found." });
      }
      Party_Id = party.Party_Id;
    }

    const totalAmount = Number(Total_Amount) || 0;
    const totalPaid = Total_Paid === "" || Total_Paid === undefined ? 0 : Number(Total_Paid);
    const balanceDue = totalAmount - totalPaid;

    await connection.query(
      `UPDATE expenses SET
         Expense_Number=?, Expense_Date=?, Bill_Date=?, With_GST=?, Category_Id=?, Party_Id=?,
         State_Of_Supply=?, Payment_Type=?, Bank_Account_Id=?, Reference_Number=?,
         Total_Amount=?, Total_Paid=?, Balance_Due=?, updated_at=NOW()
       WHERE id=?`,
      [
        Expense_Number || null,
        Expense_Date,
        withGST ? Bill_Date : null,
        withGST ? 1 : 0,
        Category_Id,
        Party_Id,
        State_Of_Supply || null,
        Payment_Type,
        Payment_Type === "Bank" ? Bank_Account_Id : null,
        Reference_Number || null,
        totalAmount,
        totalPaid,
        balanceDue,
        id,
      ]
    );

    await recordBankTransaction({
  connection,
  bankAccountId: Payment_Type === "Bank" ? Bank_Account_Id : null,
  txnType: "Expense",
  referenceId: id,
  partyName: withGST ? Party_Name : null,
  amount: totalPaid,
  txnDate: withGST ? Bill_Date : Expense_Date,
});

await recordCashTransaction({
  connection,
  isCash: Payment_Type === "Cash",
  txnType: "Expense",
  referenceId: id,
  partyName: withGST ? Party_Name : null,
  amount: totalPaid,
  txnDate: withGST ? Bill_Date : Expense_Date,
});

    // replace items wholesale on edit (simplest correct approach for a line-item list tied 1:1 to the expense)
    await connection.query(`DELETE FROM expense_items WHERE Expense_Id = ?`, [id]);

    for (const item of items) {
      const {
        Item_Name, Item_HSN, Quantity, Price,
        Discount_On_Price, Discount_Type_On_Price,
        Tax_Type, Tax_Amount, Amount,
      } = item;

      if (!Item_Name || !Item_Name.trim()) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: "Item name missing." });
      }
      if (withGST && (!Item_HSN || !Quantity || !Price)) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: "HSN, Quantity and Price are required for GST expense items.",
        });
      }

      await connection.query(
        `INSERT INTO expense_items
         (Expense_Id, Item_Name, Item_HSN, Quantity, Price,
          Discount_On_Price, Discount_Type_On_Price, Tax_Type, Tax_Amount, Amount,
          created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          id,
          Item_Name.trim(),
          withGST ? (Item_HSN || null) : null,
          withGST ? Number(Quantity) : null,
          withGST ? Number(Price) : null,
          Number(Discount_On_Price) || 0,
          Discount_Type_On_Price || "Percentage",
          Tax_Type || "None",
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

const getExpenseById = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();
    const { id } = req.params;

    const [[expense]] = await connection.query(
      `SELECT e.*, a.Party_Name, ec.Category_Name, ec.Category_Type, ba.Account_Display_Name AS Bank_Display_Name
       FROM expenses e
       LEFT JOIN add_party a ON e.Party_Id = a.Party_Id
       LEFT JOIN expense_categories ec ON e.Category_Id = ec.id
       LEFT JOIN bank_accounts ba ON e.Bank_Account_Id = ba.id
       WHERE e.id = ?
       LIMIT 1`,
      [id]
    );

    if (!expense) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }

    const [items] = await connection.query(
      `SELECT * FROM expense_items WHERE Expense_Id = ? ORDER BY id ASC`,
      [expense.id]
    );

    return res.status(200).json({ success: true, expense: { ...expense, items } });
  } catch (err) {
    console.error("❌ Get expense by id error:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

// const deleteExpense = async (req, res, next) => {
//   let connection;
//   try {
//     connection = await db.getConnection();
//     await connection.beginTransaction();

//     const { id } = req.params;

//     const [[expense]] = await connection.query(`SELECT * FROM expenses WHERE id = ? LIMIT 1`, [id]);
//     if (!expense) {
//       await connection.rollback();
//       return res.status(404).json({ success: false, message: "Expense not found" });
//     }

//     await connection.query(`DELETE FROM expense_items WHERE Expense_Id = ?`, [id]);
//     await connection.query(`DELETE FROM expenses WHERE id = ?`, [id]);

//     await connection.commit();
//     return res.status(200).json({ success: true, message: "Expense deleted" });
//   } catch (err) {
//     if (connection) await connection.rollback();
//     console.error("❌ Delete expense error:", err);
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };

/* ═══════════════════════════════════════════════════════════
   LEFT-SIDE CATEGORY → RIGHT-SIDE EXPENSES  (infinite scroll)
   GET /expense/by-category/:categoryId?lastId=123&search=&fromDate=&toDate=
═══════════════════════════════════════════════════════════ */
const getExpensesByCategory = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();

    const { categoryId } = req.params;
    const lastId = req.query.lastId ? Number(req.query.lastId) : null; // cursor: last seen expenses.id
    const search = req.query.search?.trim().toLowerCase() || "";
    const fromDate = req.query.fromDate || null;
    const toDate = req.query.toDate || null;

    const whereClauses = [`e.Category_Id = ?`];
    const params = [categoryId];

    if (lastId) {
      whereClauses.push(`e.id < ?`); // fetch older rows than the last one already loaded
      params.push(lastId);
    }
    if (search) {
      whereClauses.push(`(LOWER(e.Expense_Number) LIKE ? OR LOWER(a.Party_Name) LIKE ?)`);
      const like = `%${search}%`;
      params.push(like, like);
    }
    if (fromDate && toDate) {
      whereClauses.push(`DATE(e.Expense_Date) BETWEEN ? AND ?`);
      params.push(fromDate, toDate);
    } else if (fromDate) {
      whereClauses.push(`DATE(e.Expense_Date) >= ?`);
      params.push(fromDate);
    } else if (toDate) {
      whereClauses.push(`DATE(e.Expense_Date) <= ?`);
      params.push(toDate);
    }

    const whereSQL = `WHERE ${whereClauses.join(" AND ")}`;

    const [rows] = await connection.query(
      `SELECT e.id, e.Expense_Number, e.Expense_Date, e.With_GST, e.Payment_Type,
              e.Total_Amount, e.Total_Paid, e.Balance_Due, a.Party_Name
       FROM expenses e
       LEFT JOIN add_party a ON e.Party_Id = a.Party_Id
       ${whereSQL}
       ORDER BY e.id DESC
       LIMIT ?`,
      [...params, PAGE_SIZE + 1] // fetch one extra to know if there's more
    );

    const hasMore = rows.length > PAGE_SIZE;
    const pageRows = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
    const nextCursor = pageRows.length ? pageRows[pageRows.length - 1].id : null;

    return res.status(200).json({
      success: true,
      expenses: pageRows,
      hasMore,
      nextCursor,
    });
  } catch (err) {
    console.error("❌ Get expenses by category error:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

/* ═══════════════════════════════════════════════════════════
   LEFT-SIDE ITEM LIST  (distinct item names across all expenses)
   GET /expense/items?search=
═══════════════════════════════════════════════════════════ */
const getDistinctExpenseItems = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();

    const search = req.query.search?.trim().toLowerCase() || "";
    const whereSQL = search ? `WHERE LOWER(ei.Item_Name) LIKE ?` : "";
    const params = search ? [`%${search}%`] : [];

    const [items] = await connection.query(
      `SELECT ei.Item_Name,
         COUNT(*) AS Usage_Count,
         COALESCE(SUM(ei.Amount), 0) AS Total_Spent
       FROM expense_items ei
       ${whereSQL}
       GROUP BY ei.Item_Name
       ORDER BY ei.Item_Name ASC`,
      params
    );

    return res.status(200).json({ success: true, items });
  } catch (err) {
    console.error("❌ Get distinct expense items error:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

/* ═══════════════════════════════════════════════════════════
   LEFT-SIDE ITEM CLICK → RIGHT-SIDE "everywhere this item was used"
   GET /expense/item-usage?itemName=...&lastId=123
═══════════════════════════════════════════════════════════ */
 const getExpenseItemUsage = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();

    const itemName = req.query.itemName?.trim();
    if (!itemName) {
      return res.status(400).json({ success: false, message: "itemName is required" });
    }

    const lastId = req.query.lastId ? Number(req.query.lastId) : null; // cursor: last seen expense_items.id

    const whereClauses = [`ei.Item_Name = ?`];
    const params = [itemName];

    if (lastId) {
      whereClauses.push(`ei.id < ?`);
      params.push(lastId);
    }

    const whereSQL = `WHERE ${whereClauses.join(" AND ")}`;

    const [rows] = await connection.query(
      `SELECT ei.id, ei.Quantity, ei.Price, ei.Amount, ei.created_at,
              e.id AS Expense_Id, e.Expense_Number, e.Expense_Date, ec.Category_Name, a.Party_Name
       FROM expense_items ei
       JOIN expenses e ON ei.Expense_Id = e.id
       LEFT JOIN expense_categories ec ON e.Category_Id = ec.id
       LEFT JOIN add_party a ON e.Party_Id = a.Party_Id
       ${whereSQL}
       ORDER BY ei.id DESC
       LIMIT ?`,
      [...params, PAGE_SIZE + 1]
    );

    const hasMore = rows.length > PAGE_SIZE;
    const pageRows = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
    const nextCursor = pageRows.length ? pageRows[pageRows.length - 1].id : null;

    return res.status(200).json({
      success: true,
      usage: pageRows,
      hasMore,
      nextCursor,
    });
  } catch (err) {
    console.error("❌ Get expense item usage error:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

/* ═══════════════════════════════════════════════════════════
   GENERAL EXPENSE LIST  (infinite scroll — kept for a top-level "All Expenses" view)
   GET /expense?lastId=123&search=&fromDate=&toDate=&categoryId=
═══════════════════════════════════════════════════════════ */
export {
  createExpenseCategory,
  editExpenseCategory,
  getAllExpenseCategories,
  createExpense,
  editExpense,
  getExpenseById,
  getExpensesByCategory,
  getDistinctExpenseItems,
  getExpenseItemUsage,
};