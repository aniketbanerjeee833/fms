/* ═══════════════════════════════════════════════════════════════════
   1. SQL — run once
═══════════════════════════════════════════════════════════════════
 
-- Master table
CREATE TABLE IF NOT EXISTS purchase_return (
  
  Purchase_Id          VARCHAR(255)    NOT NULL,               -- original purchase being returned
  Party_Id             VARCHAR(255)    NOT NULL,
  Return_Number            VARCHAR(255)    DEFAULT NULL,           -- manual entry like "ALCO/17135/2627"
  Bill_Number          VARCHAR(255)    DEFAULT NULL,           -- original bill number (pre-filled)
  Bill_Date            DATE           DEFAULT NULL,           -- original bill date  (pre-filled)
  Return_Date          DATE           NOT NULL,               -- "Date" field in UI
  State_Of_Supply      VARCHAR(255)   DEFAULT NULL,
  Total_Amount         DECIMAL(10,2)  NOT NULL DEFAULT 0,
 Total_Received           DECIMAL(10,2)  NOT NULL DEFAULT 0,
  Balance_Due          DECIMAL(10,2)  NOT NULL DEFAULT 0,
    Payment_Type ENUM('Cash', "Cheque", "Online") DEFAULT "Cash",
    Reference_Number VARCHAR(255) DEFAULT NULL,
  created_at           TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (Party_Id)    REFERENCES add_party(Party_Id),
  FOREIGN KEY (Purchase_Id) REFERENCES add_purchase(Purchase_Id)
);
 
-- Items table
CREATE TABLE IF NOT EXISTS purchase_return_items (
  
  Purchase_Return_Id        VARCHAR(20)    NOT NULL,
  Item_Id                   VARCHAR(20)    NOT NULL,
  Item_Name                 VARCHAR(255)   NOT NULL,
  Item_Category             VARCHAR(100)   DEFAULT NULL,
  Item_HSN                  VARCHAR(255)    DEFAULT NULL,
  Item_Unit                 VARCHAR(255)    DEFAULT NULL,
  Quantity                  INT(10)            NOT NULL DEFAULT 0,
  Purchase_Price            DECIMAL(10,2)  NOT NULL DEFAULT 0,
  Discount_On_Purchase_Price DECIMAL(10,2) DEFAULT 0,
  Discount_Type_On_Purchase_Price ENUM('percentage', 'amount') DEFAULT 'percentage',
  Tax_Type                  VARCHAR(255)   DEFAULT NULL,
  Tax_Amount                DECIMAL(10,2)  DEFAULT 0,
  Amount                    DECIMAL(10,2)  NOT NULL DEFAULT 0,
  created_at                TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  updated_at                TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (Purchase_Return_Id) REFERENCES purchase_return(Purchase_Return_Id)
);
 
═══════════════════════════════════════════════════════════════════ */
 import db from "../config/db.js";
 
/* ═══════════════════════════════════════════════════════════════════
   2. CONTROLLERS  (purchaseReturnController.js)
═══════════════════════════════════════════════════════════════════ */
 
// const generateReturnId = async (connection) => {
//   const [[row]] = await connection.query(
//     `SELECT Purchase_Return_Id FROM purchase_return ORDER BY created_at DESC LIMIT 1`
//   );
//   if (!row) return "PRET001";
//   const num = parseInt(row.Purchase_Return_Id.replace("PRET", ""), 10) + 1;
//   return `PRET${String(num).padStart(3, "0")}`;
// };
 
// const generateReturnItemId = async (connection) => {
//   const [[row]] = await connection.query(
//     `SELECT Purchase_Return_Item_Id FROM purchase_return_items ORDER BY created_at DESC LIMIT 1`
//   );
//   if (!row) return "PRITM001";
//   const num = parseInt(row.Purchase_Return_Item_Id.replace("PRITM", ""), 10) + 1;
//   return `PRITM${String(num).padStart(3, "0")}`;
// };
 
/* ── GET ALL ──────────────────────────────────────────────── */
const getAllPurchaseReturns = async (req, res, next) => {
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
 
    if (search) {
      whereClauses.push(`(
        LOWER(a.Party_Name)      LIKE ? OR
        LOWER(pr.Return_Number)      LIKE ? OR
        LOWER(pr.Bill_Number)    LIKE ? OR
        CAST(pr.Total_Amount AS CHAR) LIKE ?
      )`);
      const like = `%${search}%`;
      params.push(like, like, like, like);
    }
 
    if (fromDate && toDate) {
      whereClauses.push(`DATE(pr.Return_Date) BETWEEN ? AND ?`);
      params.push(fromDate, toDate);
    } else if (fromDate) {
      whereClauses.push(`DATE(pr.Return_Date) >= ?`);
      params.push(fromDate);
    } else if (toDate) {
      whereClauses.push(`DATE(pr.Return_Date) <= ?`);
      params.push(toDate);
    }
 
    const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";
 
    const [rows] = await connection.query(
      `SELECT pr.*, a.Party_Name
       FROM purchase_return pr
       LEFT JOIN add_party a ON a.Party_Id = pr.Party_Id
       ${whereSQL}
       ORDER BY pr.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
 
    const [[{ total }]] = await connection.query(
      `SELECT COUNT(*) AS total
       FROM purchase_return pr
       LEFT JOIN add_party a ON a.Party_Id = pr.Party_Id
       ${whereSQL}`,
      params
    );
 
    const [[totals]] = await connection.query(
      `SELECT
         COALESCE(SUM(pr.Total_Amount), 0) AS totalAmount,
         COALESCE(SUM(pr.Total_Received),   0) AS totalReceived,
         COALESCE(SUM(pr.Balance_Due),  0) AS totalBalance
       FROM purchase_return pr
       LEFT JOIN add_party a ON a.Party_Id = pr.Party_Id
       ${whereSQL}`,
      params
    );
 
    return res.status(200).json({
      success:       true,
      currentPage:   page,
      totalPages:    Math.ceil(total / limit),
      totalReturns:  total,
      purchaseReturns:       rows,
      totals,
    });
  } catch (err) {
    next(err);
  } finally {
    if (connection) connection.release();
  }
};
 
/* ── GET SINGLE (with items) ──────────────────────────────── */
const getPurchaseReturnById = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();
    const { Purchase_Return_Id } = req.params;
 
    const [[header]] = await connection.query(
      `SELECT pr.*, a.Party_Name
       FROM purchase_return pr
       LEFT JOIN add_party a ON a.Party_Id = pr.Party_Id
       WHERE pr.id = ?`,
      [Purchase_Return_Id]
    );
 
    if (!header) {
      return res.status(404).json({ success: false, message: "Purchase Return not found" });
    }
 
    const [items] = await connection.query(
      `SELECT pri.*, ai.Item_Name as Item_Name_Ref
       FROM purchase_return_items pri
       LEFT JOIN add_item ai ON ai.Item_Id = pri.Item_Id
       WHERE pri.Purchase_Return_Id = ?`,
      [Purchase_Return_Id]
    );
 
    return res.status(200).json({ success: true, purchaseReturn: { ...header, items } });
  } catch (err) {
    next(err);
  } finally {
    if (connection) connection.release();
  }
};
 
/* ── CREATE ───────────────────────────────────────────────── */
const createPurchaseReturn = async (req, res, next) => {
  let connection;
 
  try {
    const { Purchase_Id } = req.params;  // comes from  POST /purchase-return/:Purchase_Id
 
    connection = await db.getConnection();
    await connection.beginTransaction();
 
    const {
      Party_Name,
      Return_Number,      // ← what frontend sends
      Bill_Number,
      Bill_Date,
      Return_Date,
      State_Of_Supply,
      Total_Amount,
      Total_Received,
      Balance_Due,
      Payment_Type,
      Reference_Number,
      items,
    } = req.body;
 
    /* ── validate ── */
    if (!Purchase_Id || !Party_Name || !Return_Date || !items?.length) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Purchase_Id, Party, Return Date and items are required",
      });
    }
 
    /* ── party lookup ── */
    const [[party]] = await connection.query(
      `SELECT Party_Id FROM add_party WHERE Party_Name = ? LIMIT 1`,
      [Party_Name]
    );
    if (!party) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Party not found" });
    }
 
    const totalAmount   = Number(Total_Amount)   || 0;
    const totalReceived = Number(Total_Received)  || 0;
    const balanceDue    = Number(Balance_Due)     || totalAmount - totalReceived;
 
    /* ── insert header ── get insertId for items ── */
    const [headerResult] = await connection.query(
      `INSERT INTO purchase_return
         (Purchase_Id, Party_Id, Return_Number, Bill_Number,
          Bill_Date, Return_Date, State_Of_Supply,
          Total_Amount, Total_Received, Balance_Due, Payment_Type,Reference_Number)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Purchase_Id,
        party.Party_Id,
        Return_Number  || null,   // ✅ was Return_Number (undefined) — now uses destructured value
        Bill_Number    || null,
        Bill_Date      || null,
        Return_Date,
        State_Of_Supply || null,
        totalAmount,
        totalReceived,
        balanceDue,
        Payment_Type   || "Cash",
        Reference_Number || null
      ]
    );
 
    const Purchase_Return_Id = headerResult.insertId;  // ✅ now defined — was missing before
 
    /* ── insert items + reverse stock ── */
    for (const item of items) {
      const {
        Item_Name,
        Item_Category,
        Item_HSN,
        Item_Unit,
        Quantity,
        Purchase_Price,
        Discount_On_Purchase_Price,
        Discount_Type_On_Purchase_Price,
        Tax_Type,
        Tax_Amount,
        Amount,
      } = item;
 
      /* find item */
      const [[existingItem]] = await connection.query(
        `SELECT Item_Id FROM add_item WHERE Item_Name = ? LIMIT 1`,
        [Item_Name]
      );
 
      let Item_Id;
 
      if (!existingItem) {
        const [ins] = await connection.execute(
          `INSERT INTO add_item
             (Item_Name, Item_Category, Item_HSN, Item_Unit, Stock_Quantity, created_at, updated_at)
           VALUES (?, ?, ?, ?, 0, NOW(), NOW())`,
          [Item_Name, Item_Category || "", Item_HSN || "", Item_Unit || ""]
        );
        Item_Id = `ITM${ins.insertId}`;
        await connection.execute(
          `UPDATE add_item SET Item_Id = ? WHERE id = ?`,
          [Item_Id, ins.insertId]
        );
      } else {
        Item_Id = existingItem.Item_Id;
      }
 
      await connection.query(
        `INSERT INTO purchase_return_items
           (Purchase_Return_Id, Item_Id, Item_Name,
            Item_Category, Item_HSN, Item_Unit, Quantity, Purchase_Price,
            Discount_On_Purchase_Price, Discount_Type_On_Purchase_Price,
            Tax_Type, Tax_Amount, Amount)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          Purchase_Return_Id,           // ✅ now correctly set from insertId
          Item_Id,
          Item_Name,
          Item_Category  || "",
          Item_HSN       || "",
          Item_Unit      || "",
          Number(Quantity),
          Number(Purchase_Price),
          Number(Discount_On_Purchase_Price) || 0,
          Discount_Type_On_Purchase_Price    || "percentage",
          Tax_Type       || null,
          Number(Tax_Amount) || 0,
          Number(Amount),
        ]
      );
 
      /* reverse stock */
      await connection.query(
        `UPDATE add_item
         SET Stock_Quantity = Stock_Quantity - ?, updated_at = NOW()
         WHERE Item_Id = ?`,
        [Number(Quantity), Item_Id]
      );
    }
 
    await connection.commit();
    return res.status(201).json({
      success: true,
      message: "Purchase Return created",
      Purchase_Return_Id,
    });
 
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("❌ createPurchaseReturn:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};
 
/* ── EDIT ─────────────────────────────────────────────────── */
const editPurchaseReturn = async (req, res, next) => {
  let connection;
  try {
    const { Purchase_Return_Id } = req.params;
 
    connection = await db.getConnection();
    await connection.beginTransaction();
 
    /* check exists */
    const [[existing]] = await connection.query(
      `SELECT * FROM purchase_return WHERE id = ?`,
      [Purchase_Return_Id]
    );
    if (!existing) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Purchase Return not found" });
    }
 
    const {
      Party_Name,
      Return_Number,
      Bill_Number,
      Bill_Date,
      Return_Date,
      State_Of_Supply,
      Total_Amount,
     Total_Received,
      Balance_Due,
      Payment_Type,
      items,
    } = req.body;
 
    /* party */
    const [[party]] = await connection.query(
      `SELECT Party_Id FROM add_party WHERE Party_Name = ? LIMIT 1`,
      [Party_Name]
    );
    if (!party) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Party not found" });
    }
 
    const totalAmount = Number(Total_Amount) || 0;
    const totalReceived = Number(Total_Received) || 0;
    const balanceDue  = Number(Balance_Due)  || totalAmount - totalReceived;
 
    /* update header */
    await connection.query(
      `UPDATE purchase_return SET
         Party_Id = ?, Return_Number = ?, Bill_Number = ?, Bill_Date = ?,
         Return_Date = ?, State_Of_Supply = ?,
         Total_Amount = ?,Total_Received = ?, Balance_Due = ?,
         Payment_Type = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        party.Party_Id,
        Return_Number    || null,
        Bill_Number  || null,
        Bill_Date    || null,
        Return_Date,
        State_Of_Supply || null,
        totalAmount,
        totalReceived,
        balanceDue,
        Payment_Type || "Cash",
        Purchase_Return_Id,
      ]
    );
 
    /* fetch old items */
    const [oldItems] = await connection.query(
      `SELECT * FROM purchase_return_items WHERE Purchase_Return_Id = ?`,
      [Purchase_Return_Id]
    );
    const oldMap = new Map(oldItems.map((i) => [i.Item_Id, i]));
    const newItemIds = new Set();
 
    /* upsert new items */
    for (const item of items) {
      const {
        Item_Name, Item_Category, Item_HSN, Item_Unit,
        Quantity, Purchase_Price,
        Discount_On_Purchase_Price, Discount_Type_On_Purchase_Price,
        Tax_Type, Tax_Amount, Amount,
      } = item;
 
      const [[existingItem]] = await connection.query(
        `SELECT Item_Id FROM add_item WHERE Item_Name = ? LIMIT 1`,
        [Item_Name]
      );
 
      let Item_Id;
      if (!existingItem) {
        const [ins] = await connection.execute(
          `INSERT INTO add_item
             (Item_Name, Item_Category, Item_HSN, Item_Unit, Stock_Quantity, created_at, updated_at)
           VALUES (?, ?, ?, ?, 0, NOW(), NOW())`,
          [Item_Name, Item_Category || "", Item_HSN || "", Item_Unit || ""]
        );
        Item_Id = `ITM${ins.insertId}`;
        await connection.execute(`UPDATE add_item SET Item_Id = ? WHERE id = ?`, [Item_Id, ins.insertId]);
      } else {
        Item_Id = existingItem.Item_Id;
      }
 
      newItemIds.add(Item_Id);
      const old = oldMap.get(Item_Id);
 
      if (old) {
        /* update existing return item */
        await connection.query(
          `UPDATE purchase_return_items SET
             Quantity = ?, Purchase_Price = ?,
             Discount_On_Purchase_Price = ?, Discount_Type_On_Purchase_Price = ?,
             Tax_Type = ?, Tax_Amount = ?, Amount = ?, updated_at = NOW()
           WHERE id = ?`,
          [
            Number(Quantity), Number(Purchase_Price),
            Number(Discount_On_Purchase_Price) || 0,
            Discount_Type_On_Purchase_Price    || "percentage",
            Tax_Type || null, Number(Tax_Amount) || 0,
            Number(Amount),
            old.id,
          ]
        );
 
        /* stock diff: old qty was already deducted, adjust difference */
        const diff = Number(Quantity) - old.Quantity;
        if (diff !== 0) {
          await connection.query(
            `UPDATE add_item SET Stock_Quantity = Stock_Quantity - ?, updated_at = NOW()
             WHERE Item_Id = ?`,
            [diff, Item_Id]
          );
        }
      } else {
        /* insert new return item */
        const Purchase_Return_Item_Id = await generateReturnItemId(connection);
        await connection.query(
          `INSERT INTO purchase_return_items
             ( Purchase_Return_Id, Item_Id, Item_Name,
              Item_Category, Item_HSN, Item_Unit, Quantity, Purchase_Price,
              Discount_On_Purchase_Price, Discount_Type_On_Purchase_Price,
              Tax_Type, Tax_Amount, Amount)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
             Purchase_Return_Id, Item_Id, Item_Name,
            Item_Category || "", Item_HSN || "", Item_Unit || "",
            Number(Quantity), Number(Purchase_Price),
            Number(Discount_On_Purchase_Price) || 0,
            Discount_Type_On_Purchase_Price    || "percentage",
            Tax_Type || null, Number(Tax_Amount) || 0, Number(Amount),
          ]
        );
        /* deduct new stock */
        await connection.query(
          `UPDATE add_item SET Stock_Quantity = Stock_Quantity - ?, updated_at = NOW()
           WHERE Item_Id = ?`,
          [Number(Quantity), Item_Id]
        );
      }
    }
 
    /* delete removed items — restore stock */
    for (const old of oldItems) {
      if (!newItemIds.has(old.Item_Id)) {
        await connection.query(
          `DELETE FROM purchase_return_items WHERE id = ?`,
          [old.id]
        );
        /* restore stock because we un-returned these items */
        await connection.query(
          `UPDATE add_item SET Stock_Quantity = Stock_Quantity + ?, updated_at = NOW()
           WHERE Item_Id = ?`,
          [old.Quantity, old.Item_Id]
        );
      }
    }
 
    await connection.commit();
    return res.status(200).json({ success: true, message: "Purchase Return updated", Purchase_Return_Id });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("❌ editPurchaseReturn:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};
 
/* ── DELETE ───────────────────────────────────────────────── */
const deletePurchaseReturn = async (req, res, next) => {
  let connection;
  try {
    const { id } = req.params;
 
    connection = await db.getConnection();
    await connection.beginTransaction();
 
    /* fetch items first to restore stock */
    const [items] = await connection.query(
      `SELECT Item_Id, Quantity FROM purchase_return_items WHERE id = ?`,
      [id]
    );
 
    /* restore stock for each returned item */
    for (const item of items) {
      await connection.query(
        `UPDATE add_item SET Stock_Quantity = Stock_Quantity + ?, updated_at = NOW()
         WHERE Item_Id = ?`,
        [item.Quantity, item.Item_Id]
      );
    }
 
    /* delete items then header */
    await connection.query(
      `DELETE FROM purchase_return_items WHERE id = ?`,
      [id]
    );
    await connection.query(
      `DELETE FROM purchase_return WHERE id = ?`,
      [id]
    );
 
    await connection.commit();
    return res.status(200).json({ success: true, message: "Purchase Return deleted" });
  } catch (err) {
    if (connection) await connection.rollback();
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

export { getAllPurchaseReturns, getPurchaseReturnById, createPurchaseReturn, editPurchaseReturn, deletePurchaseReturn };