import db from "../config/db.js";
import { validateSplits, insertPaymentSplits, deletePaymentSplits } from "../utils/paymentSplitHelper.js";

const PAGE_SIZE = 20;

/* ═══════════════════════════════════════
   CATEGORY CRUD
═══════════════════════════════════════ */
const createExpenseCategory = async (req, res, next) => {
  try {
    const { Category_Name, Category_Type } = req.body;
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
    const { Category_Name, Category_Type } = req.body;
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
      taxType,     // "GST5" | "GST12" | "GST18" | "GST28" | "None" | null
    } = req.body;

    if (!itemName?.trim()) {
      return res.status(400).json({ success: false, message: "Item Name is required" });
    }

    const [result] = await db.query(
      `INSERT INTO expense_item_master (Item_Name, Item_HSN, Price, Tax_Type)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         Item_HSN   = VALUES(Item_HSN),
         Price      = VALUES(Price),
         Tax_Type  = VALUES(Tax_Type)`,
      [
        itemName.trim(),
        itemHSN || null,
        price != null && price !== "" ? Number(price) : null,
        taxType || null,
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
      taxType,
    } = req.body;

    if (!itemName?.trim()) {
      return res.status(400).json({ success: false, message: "Item Name is required" });
    }

    // name/HSN/price change propagates everywhere via FK join — no child row updates needed
    await db.query(
      `UPDATE expense_item_master
       SET Item_Name = ?, Item_HSN = ?, Price = ?, Tax_Type= ?
       WHERE id = ?`,
      [
        itemName.trim(),
        itemHSN || null,
        price != null && price !== "" ? Number(price) : null,
        taxType || null,
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
    const search = req.query.search?.trim().toLowerCase() || "";
    const whereSQL = search ? `WHERE LOWER(Item_Name) LIKE ?` : "";
    const params = search ? [`%${search}%`] : [];

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
const getOrCreateExpenseItemMaster = async (
  connection,
  itemName,
  itemHSN,
  price,
  taxType
) => {
  const [[existing]] = await connection.query(
    `SELECT id FROM expense_item_master
         WHERE Item_Name = ?
         LIMIT 1`,
    [itemName.trim()]
  );

  if (existing) return existing.id;

  const [result] = await connection.query(
    `INSERT INTO expense_item_master
        (
            Item_Name,
            Item_HSN,
            Price,
            Tax_Type
        )
        VALUES (?, ?, ?, ?)`,
    [
      itemName.trim(),
      itemHSN || null,
      price !== "" && price != null ? Number(price) : null,
      taxType || null,
    ]
  );

  return result.insertId;
};

/* ─── get or create expense category by name ─── */
const getOrCreateExpenseCategory = async (connection, Category_Name, Category_Type = "Indirect") => {
  const [[existing]] = await connection.query(
    `SELECT id FROM expense_categories WHERE Category_Name = ? LIMIT 1`,
    [Category_Name.trim()]
  );
  if (existing) return existing.id;

  const [result] = await connection.query(
    `INSERT INTO expense_categories (Category_Name, Category_Type) VALUES (?, ?)`,
    [Category_Name.trim(), Category_Type || "Indirect"]
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

      Category_Name,
      Category_Type,

      Party_Name,
      State_Of_Supply,

      Total_Amount,
      // Total_Paid, // ❌ don't trust frontend

      splits,
      items,
    } = req.body;

    const withGST = !!With_GST;



    // 1. VALIDATION
    // =========================================================
    if (!Category_Name?.trim()) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Expense Category is required.",
      });
    }

    if (withGST && !Party_Name?.trim()) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Party is required for GST expenses.",
      });
    }

    // =========================================================
    // 2. FIND PARTY
    //
    // Party is now used regardless of GST / non-GST.
    // =========================================================

    let Party_Id = null;

    if (Party_Name?.trim()) {
      const [[party]] = await connection.query(
        `SELECT Party_Id FROM add_party WHERE Party_Name = ? LIMIT 1`,
        [Party_Name]
      );

      if (!party) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: "Party not found.",
        });
      }

      Party_Id = party.Party_Id;
    }

    // =========================================================
    // 3. CATEGORY
    //
    // Category is OPTIONAL now.
    //
    // IMPORTANT:
    // Don't call getOrCreateExpenseCategory() with blank/null
    // because that helper uses Category_Name.trim().
    // =========================================================

    let Category_Id = null;

    if (Category_Name?.trim()) {
      Category_Id =
        await getOrCreateExpenseCategory(
          connection,
          Category_Name,
          Category_Type || "Indirect"
        );
    }

    // =========================================================
    // 4. NORMALIZE PAYMENT SPLITS
    //
    // Rules:
    //
    // Payment_Type missing -> ignore
    //
    // Bank without Bank_Account_Id -> ignore
    //
    // "" / null / undefined Amount -> 0
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

        Amount:
          Number(split.Amount) || 0,
      }));

    // =========================================================
    // 5. FIRST VALID PAYMENT SPLIT ALWAYS STAYS
    //
    // Cash  ₹0   -> KEEP if first
    // HDFC  ₹0   -> DROP if later
    // ANCO  ₹25  -> KEEP
    //
    // Example:
    //
    // frontend:
    // Cash  0
    // HDFC  0
    // ANCO  25
    //
    // database:
    // Cash  0
    // ANCO  25
    // =========================================================

    const validSplits =
      normalizedSplits.filter(
        (split, index) => {
          if (index === 0) {
            return true;
          }

          return split.Amount > 0;
        }
      );

    // =========================================================
    // 6. TOTALS
    //
    // NEVER trust Total_Paid from frontend.
    // Calculate it from surviving payment splits.
    // =========================================================

    const totalAmount =
      Number(Total_Amount) || 0;

    const totalPaid =
      validSplits.reduce(
        (sum, split) =>
          sum + (Number(split.Amount) || 0),
        0
      );

    const balanceDue =
      totalAmount - totalPaid;

    // =========================================================
    // 7. VALIDATE SURVIVING SPLITS
    //
    // No:
    //   validSplits.length === 0 error
    //
    // So empty/relaxed form remains possible.
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
    // 8. FINANCIAL YEAR
    // =========================================================

    const [fy] = await connection.query(
      `SELECT Financial_Year
       FROM financial_year
       WHERE Current_Financial_Year = 1
       LIMIT 1`
    );

    const activeFY =
      fy.length
        ? fy[0].Financial_Year
        : null;

    // =========================================================
    // 9. CREATE EXPENSE HEADER
    //
    // Everything except Party can be blank/null.
    // =========================================================

    const [expenseResult] =
      await connection.query(
        `INSERT INTO expenses
         (
           Expense_Number,
           Expense_Date,
           Bill_Date,
           With_GST,
           Category_Id,
           Party_Id,
           State_Of_Supply,
           Total_Amount,
           Total_Paid,
           Balance_Due,
           financial_year,
           created_at,
           updated_at
         )
         VALUES (
           ?, ?, ?, ?, ?, ?,
           ?, ?, ?, ?, ?,
           NOW(), NOW()
         )`,
        [
          Expense_Number || null,

          Expense_Date || null,

          Bill_Date || null,

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

    const expenseId =
      expenseResult.insertId;

    // =========================================================
    // 10. TRANSACTION DATE
    //
    // Use Bill_Date first for GST.
    // Otherwise Expense_Date.
    //
    // If both are blank -> null.
    // =========================================================

    const txnDate =
      (withGST
        ? Bill_Date || Expense_Date
        : Expense_Date || Bill_Date) ||
      null;

    // =========================================================
    // 11. PAYMENT SPLITS
    //
    // IMPORTANT:
    //
    // Do NOT check:
    // totalPaid > 0
    //
    // because:
    //
    // Cash ₹0 as first split must still be stored in
    // payment_splits.
    //
    // insertPaymentSplits should itself avoid creating a
    // ₹0 cash/bank ledger transaction, as in your existing
    // payment architecture.
    // =========================================================

    if (validSplits.length > 0) {
      await insertPaymentSplits({
        connection,

        sourceType: "Expense",

        sourceId: expenseId,

        partyName: Party_Name,

        txnDate,

        splits: validSplits,
      });
    }

    // =========================================================
    // 12. ITEMS
    //
    // Same relaxed Sale/Purchase rule:
    //
    // Name blank + Amount > 0
    //      -> ERROR
    //
    // Name blank + Amount 0/blank
    //      -> SKIP
    //
    // Name exists
    //      -> SAVE
    //
    // items [] / undefined
    //      -> allowed
    // =========================================================

    for (const item of items || []) {
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

      // -------------------------------------------------------
      // NAMELESS ROW
      // -------------------------------------------------------

      if (!Item_Name?.trim()) {
        const itemAmount =
          Number(Amount) || 0;

        // Amount entered -> name becomes required
        if (itemAmount > 0) {
          await connection.rollback();

          return res.status(400).json({
            success: false,
            message:
              "Please enter an item name for the row.",
          });
        }

        // Blank placeholder row -> ignore
        continue;
      }

      // =======================================================
      // 13. GET / CREATE EXPENSE ITEM MASTER
      // =======================================================

      const masterItemId =
        await getOrCreateExpenseItemMaster(
          connection,
          Item_Name,
          Item_HSN,
          Price,
          Tax_Type
        );

      // =======================================================
      // 14. INSERT EXPENSE ITEM
      //
      // Quantity / Price are no longer mandatory.
      // =======================================================

      await connection.query(
        `INSERT INTO expense_items
          (
              Expense_Id,
              Expense_Item_Master_Id,

              Quantity,
              Price,

              Discount_On_Price,
              Discount_Type_On_Price,

              Tax_Type,
              Tax_Amount,

              Amount,

              created_at,
              updated_at
          )
          VALUES
          (
              ?, ?, ?, ?, ?, ?, ?, ?, ?,
              NOW(), NOW()
          )`,
        [
          expenseId,

          masterItemId,

          Quantity === "" ||
            Quantity === null ||
            Quantity === undefined
            ? null
            : Number(Quantity),

          Price === "" ||
            Price === null ||
            Price === undefined
            ? null
            : Number(Price),

          Number(Discount_On_Price) || 0,

          Discount_Type_On_Price || "Percentage",

          Tax_Type || "None",

          Number(Tax_Amount) || 0,

          Number(Amount) || 0,
        ]
      );
    }

    // =========================================================
    // 15. COMMIT
    // =========================================================

    await connection.commit();

    return res.status(201).json({
      success: true,
      message:
        "Expense created successfully",
      expenseId,
    });

  } catch (err) {
    if (connection) {
      await connection.rollback();
    }

    console.error(
      "❌ Create expense error:",
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
   EDIT EXPENSE
═══════════════════════════════════════ */
const editExpense = async (req, res, next) => {
  let connection;

  try {
    connection = await db.getConnection();

    const { id } = req.params;

    const {
      Expense_Number,
      Expense_Date,
      Bill_Date,
      With_GST,

      Category_Name,
      Category_Type,

      Party_Name,
      State_Of_Supply,

      Total_Amount,

      splits,
      items,
    } = req.body;

    const withGST = !!With_GST;

    // =========================================================
    // 1. CHECK EXPENSE EXISTS
    // =========================================================

    const [[existingExpense]] = await connection.query(
      `SELECT *
       FROM expenses
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    if (!existingExpense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found.",
      });
    }

    // =========================================================
    // 2. REQUIRED FIELDS
    //
    // Expense requires:
    // - Party
    // - Category
    // =========================================================

    // =========================================================
    // 2. REQUIRED FIELDS
    // =========================================================
    if (!Category_Name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Expense Category is required.",
      });
    }

    if (withGST && !Party_Name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Party is required for GST expenses.",
      });
    }

    // =========================================================
    // 3. START TRANSACTION
    // =========================================================

    await connection.beginTransaction();
    // =========================================================
    // 4. FIND PARTY — only when provided
    // =========================================================
    let Party_Id = null;

    if (Party_Name?.trim()) {
      const [[party]] = await connection.query(
        `SELECT Party_Id FROM add_party WHERE Party_Name = ? LIMIT 1`,
        [Party_Name]
      );
      if (!party) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: "Party not found.",
        });
      }
      Party_Id = party.Party_Id;
    }




    // =========================================================
    // 5. GET / CREATE EXPENSE CATEGORY
    //
    // Category is REQUIRED.
    // =========================================================

    const Category_Id =
      await getOrCreateExpenseCategory(
        connection,
        Category_Name,
        Category_Type || "Indirect"
      );

    // =========================================================
    // 6. NORMALIZE PAYMENT SPLITS
    //
    // No Payment_Type              -> remove
    // Bank without account         -> remove
    // blank amount                 -> 0
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

    // =========================================================
    // 7. FIRST VALID SPLIT ALWAYS STAYS
    //
    // Cash ₹0      first -> KEEP
    // HDFC ₹0            -> DROP
    // ANCO ₹50           -> KEEP
    // =========================================================

    const validSplits =
      normalizedSplits.filter(
        (split, index) => {
          if (index === 0) {
            return true;
          }

          return split.Amount > 0;
        }
      );

    // =========================================================
    // 8. TOTALS
    //
    // Do NOT trust Total_Paid from frontend.
    // =========================================================

    const totalAmount =
      Number(Total_Amount) || 0;

    const totalPaid =
      validSplits.reduce(
        (sum, split) =>
          sum + (Number(split.Amount) || 0),
        0
      );

    const balanceDue =
      totalAmount - totalPaid;

    // =========================================================
    // 9. VALIDATE SURVIVING SPLITS
    //
    // We intentionally DON'T do:
    //
    // if (validSplits.length === 0) error
    //
    // because we're keeping the relaxed behavior.
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
    // 10. UPDATE EXPENSE HEADER
    // =========================================================

    await connection.query(
      `UPDATE expenses
       SET
         Expense_Number = ?,
         Expense_Date = ?,
         Bill_Date = ?,
         With_GST = ?,
         Category_Id = ?,
         Party_Id = ?,
         State_Of_Supply = ?,
         Total_Amount = ?,
         Total_Paid = ?,
         Balance_Due = ?,
         updated_at = NOW()
       WHERE id = ?`,
      [
        Expense_Number || null,
        Expense_Date || null,
        Bill_Date || null,
        withGST ? 1 : 0,

        Category_Id,
        Party_Id,

        State_Of_Supply || null,

        totalAmount,
        totalPaid,
        balanceDue,

        id,
      ]
    );

    // =========================================================
    // 11. TRANSACTION DATE
    // =========================================================

    const txnDate =
      (
        withGST
          ? Bill_Date || Expense_Date
          : Expense_Date || Bill_Date
      ) || null;

    // =========================================================
    // 12. DELETE OLD PAYMENT SPLITS
    //
    // This should also reverse old Cash/Bank transactions
    // according to your existing helper.
    // =========================================================

    await deletePaymentSplits({
      connection,
      sourceType: "Expense",
      sourceId: Number(id),
    });

    // =========================================================
    // 13. INSERT NEW PAYMENT SPLITS
    //
    // IMPORTANT:
    // Do NOT check totalPaid > 0.
    //
    // First Cash ₹0 must still be preserved in payment_splits.
    // =========================================================

    if (validSplits.length > 0) {
      await insertPaymentSplits({
        connection,
        sourceType: "Expense",
        sourceId: Number(id),
        partyName: Party_Name,
        txnDate,
        splits: validSplits,
      });
    }

    // =========================================================
    // 14. DELETE OLD EXPENSE ITEMS
    //
    // Expense items don't affect inventory stock here,
    // so replacing them is straightforward.
    // =========================================================

    await connection.query(
      `DELETE FROM expense_items
       WHERE Expense_Id = ?`,
      [id]
    );

    // =========================================================
    // 15. INSERT NEW ITEMS
    //
    // Same relaxed rule:
    //
    // Item_Name blank + Amount > 0 -> ERROR
    // Item_Name blank + Amount 0   -> SKIP
    // Item_Name exists             -> SAVE
    // All items blank              -> allowed
    // =========================================================

    for (const item of items || []) {
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

      // =======================================================
      // NAMELESS ROW
      // =======================================================

      if (!Item_Name?.trim()) {
        const itemAmount =
          Number(Amount) || 0;

        if (itemAmount > 0) {
          await connection.rollback();

          return res.status(400).json({
            success: false,
            message:
              "Please enter an item name for the row.",
          });
        }

        // Empty placeholder row
        continue;
      }

      // =======================================================
      // 16. GET / CREATE EXPENSE ITEM MASTER
      // =======================================================

      const masterItemId =
        await getOrCreateExpenseItemMaster(
          connection,
          Item_Name,
          Item_HSN,
          Price,
          Tax_Type
        );

      // =======================================================
      // 17. INSERT EXPENSE ITEM
      // =======================================================

      await connection.query(
        `INSERT INTO expense_items
         (
           Expense_Id,
           Expense_Item_Master_Id,

           Quantity,
           Price,

           Discount_On_Price,
           Discount_Type_On_Price,

           Tax_Type,
           Tax_Amount,

           Amount,

           created_at,
           updated_at
         )
         VALUES (
           ?, ?, ?, ?, ?, ?, ?, ?, ?,
           NOW(), NOW()
         )`,
        [
          id,

          masterItemId,

          Quantity === "" ||
            Quantity === null ||
            Quantity === undefined
            ? null
            : Number(Quantity),

          Price === "" ||
            Price === null ||
            Price === undefined
            ? null
            : Number(Price),

          Number(Discount_On_Price) || 0,

          Discount_Type_On_Price ||
          "Percentage",

          Tax_Type || "None",

          Number(Tax_Amount) || 0,

          Number(Amount) || 0,
        ]
      );
    }

    // =========================================================
    // 18. COMMIT
    // =========================================================

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      expenseId: Number(id),
      totalAmount,
      totalPaid,
      balanceDue,
    });

  } catch (err) {
    if (connection) {
      await connection.rollback();
    }

    console.error(
      "❌ Update expense error:",
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


//Category
const getExpensesByCategory = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();

    const { categoryId } = req.params;
    const lastId = req.query.lastId ? Number(req.query.lastId) : null;
    const search = req.query.search?.trim().toLowerCase() || "";
    const date = req.query.date || null;

    const whereClauses = [`e.Category_Id = ?`];
    const params = [categoryId];

    if (lastId) { whereClauses.push(`e.id < ?`); params.push(lastId); }
    if (search) {
      whereClauses.push(`(LOWER(e.Expense_Number) LIKE ? OR LOWER(a.Party_Name) LIKE ?)`);
      params.push(`%${search}%`, `%${search}%`);
    }
    if (date) {
      whereClauses.push(`DATE(e.Expense_Date) = ?`);
      params.push(date);
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

    const hasMore = rows.length > PAGE_SIZE;
    const pageRows = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

    // 🔹 attach Payment_Type_Display from payment_splits
    const expenseIds = pageRows.map((r) => r.id);
    if (expenseIds.length > 0) {
      const [splits] = await connection.query(
        `SELECT ps.Source_Id, ps.Payment_Type, ba.Account_Display_Name
         FROM payment_splits ps
         LEFT JOIN bank_accounts ba ON ba.id = ps.Bank_Account_Id
         WHERE ps.Source_Type = 'Expense'
           AND ps.Source_Id IN (${expenseIds.map(() => "?").join(",")})`,
        expenseIds
      );

      const splitMap = {};
      for (const s of splits) {
        if (!splitMap[s.Source_Id]) splitMap[s.Source_Id] = [];
        splitMap[s.Source_Id].push(
          s.Payment_Type === "Bank" ? s.Account_Display_Name : s.Payment_Type
        );
      }

      for (const row of pageRows) {
        const labels = splitMap[row.id] || [];
        const counts = {};
        labels.forEach((l) => { counts[l] = (counts[l] || 0) + 1; });
        row.Payment_Type_Display = Object.entries(counts)
          .map(([l, c]) => (c > 1 ? `${l} (x${c})` : l))
          .join(" , ") || "—";
      }
    }

    const nextCursor = hasMore ? pageRows[pageRows.length - 1].id : null;

    return res.status(200).json({ success: true, expenses: pageRows, hasMore, nextCursor });
  } catch (err) {
    next(err);
  } finally {
    if (connection) connection.release();
  }
};
//by items
const getExpenseItemUsage = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();

    const masterItemId = req.query.masterItemId ? Number(req.query.masterItemId) : null;
    if (!masterItemId) {
      return res.status(400).json({ success: false, message: "masterItemId is required" });
    }

    const lastId = req.query.lastId ? Number(req.query.lastId) : null;
    const date = req.query.date || null;

    const whereClauses = [`ei.Expense_Item_Master_Id = ?`];
    const params = [masterItemId];

    if (lastId) { whereClauses.push(`ei.id < ?`); params.push(lastId); }
    if (date) {
      whereClauses.push(`DATE(e.Expense_Date) = ?`);
      params.push(date);
    }

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

    const hasMore = rows.length > PAGE_SIZE;
    const pageRows = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

    // 🔹 attach Payment_Type_Display — key off e.Expense_Id (parent expense)
    const expenseIds = [...new Set(pageRows.map((r) => r.Expense_Id))];
    if (expenseIds.length > 0) {
      const [splits] = await connection.query(
        `SELECT ps.Source_Id, ps.Payment_Type, ba.Account_Display_Name
         FROM payment_splits ps
         LEFT JOIN bank_accounts ba ON ba.id = ps.Bank_Account_Id
         WHERE ps.Source_Type = 'Expense'
           AND ps.Source_Id IN (${expenseIds.map(() => "?").join(",")})`,
        expenseIds
      );

      const splitMap = {};
      for (const s of splits) {
        if (!splitMap[s.Source_Id]) splitMap[s.Source_Id] = [];
        splitMap[s.Source_Id].push(
          s.Payment_Type === "Bank" ? s.Account_Display_Name : s.Payment_Type
        );
      }

      for (const row of pageRows) {
        const labels = splitMap[row.Expense_Id] || [];
        const counts = {};
        labels.forEach((l) => { counts[l] = (counts[l] || 0) + 1; });
        row.Payment_Type_Display = Object.entries(counts)
          .map(([l, c]) => (c > 1 ? `${l} (x${c})` : l))
          .join(" , ") || "—";
      }
    }

    const nextCursor = hasMore ? pageRows[pageRows.length - 1].id : null;

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