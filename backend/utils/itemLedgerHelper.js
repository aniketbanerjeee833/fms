import db from "../config/db.js";

/*
  Direction convention:
  In  = stock comes IN  (Purchase, Sale_Return, Opening_Stock)
  Out = stock goes OUT  (Sale, Purchase_Return)

  Running_Stock = previous stock + (In ? +qty : -qty)
*/

const IN_TYPES  = ["Purchase", "Sale_Return", "Opening_Stock", "Adjustment_Add"];
const OUT_TYPES = ["Sale", "Purchase_Return", "Adjustment_Reduce"];

export const recordItemLedger = async ({
  connection,
  itemId,
  txnType,        // 'Purchase' | 'Sale' | 'Purchase_Return' | 'Sale_Return' | 'Opening_Stock'
  referenceId,    // numeric source row id
  //formattedId,    // e.g. 'PUR001', 'SAL001'
  billId = null,
    billNumber = null,   // AEPL-22 / INV-25  
  partyName,
  quantity,       // positive number
  rate,           // price per unit (Purchase_Price or Sale_Price) — nullable
  txnDate,
  //remarks  = null,
  directionOverride = null,   // for Stock_Adjustment ('In' | 'Out')
}) => {

  /* ── find existing ledger row for this item+transaction ── */
  const [[existingRow]] = await connection.query(
    `SELECT * FROM item_ledger
     WHERE Item_Id = ? AND Txn_Type = ? AND Source_Id = ?
     LIMIT 1`,
    [itemId, txnType, referenceId]
  );

  const direction = directionOverride ||
    (IN_TYPES.includes(txnType) ? "In" : "Out");

  /* ══════════════════════════════════════
     CASE 1 — edit: existing row found
  ══════════════════════════════════════ */
  if (existingRow) {
    const oldQty  = Number(existingRow.Quantity);
    const qtyDiff = Number(quantity) - oldQty;

    // always update metadata
    // await connection.query(
    //   `UPDATE item_ledger
    //    SET Quantity = ?, Rate = ?, Party_Name = ?, Txn_Date = ?
    //    WHERE id = ?`,
    //   [quantity, rate ?? null, partyName ?? null, txnDate, existingRow.id]
    // );
    await connection.query(
  `UPDATE item_ledger
   SET
     Quantity = ?,
     Rate = ?,
     Party_Name = ?,
     Txn_Date = ?,
     Bill_Id = ?,
     Bill_Number = ?
   WHERE id = ?`,
  [
    quantity,
    rate ?? null,
    partyName ?? null,
    txnDate,
    billId,
    billNumber,
    existingRow.id,
  ]
);
    // shift running stock only if quantity changed
    if (qtyDiff !== 0) {
      const shift = direction === "In" ? qtyDiff : -qtyDiff;
      await connection.query(
        `UPDATE item_ledger
         SET Running_Stock = Running_Stock + ?
         WHERE Item_Id = ? AND id >= ?`,
        [shift, itemId, existingRow.id]
      );
    }

    const [[updated]] = await connection.query(
      `SELECT Running_Stock FROM item_ledger WHERE id = ?`,
      [existingRow.id]
    );
    return Number(updated.Running_Stock);
  }

  /* ══════════════════════════════════════
     CASE 2 — insert: no existing row
  ══════════════════════════════════════ */
  const [[lastRow]] = await connection.query(
    `SELECT Running_Stock FROM item_ledger
     WHERE Item_Id = ? ORDER BY id DESC LIMIT 1`,
    [itemId]
  );

  const baseStock  = lastRow ? Number(lastRow.Running_Stock) : 0;
  const newStock   = direction === "In"
    ? baseStock + Number(quantity)
    : baseStock - Number(quantity);

  
//   await connection.query(
//     `INSERT INTO item_ledger
//      (Item_Id, Txn_Type, Source_Id, Bill_Id, Party_Name,
//       Direction, Quantity, Running_Stock, Rate, Txn_Date, Remarks)
//      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//     [
//       itemId, txnType, referenceId,
//       billId || null,
//       partyName || null,
//       direction, quantity, newStock,
//       rate ?? null, txnDate, remarks,
//     ]
//   );

await connection.query(
  `INSERT INTO item_ledger
   (
     Item_Id,
     Txn_Type,
     Source_Id,
     Bill_Id,
     Bill_Number,
     Party_Name,
     Direction,
     Quantity,
     Running_Stock,
     Rate,
     Txn_Date
   )
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    itemId,
    txnType,
    referenceId,

    billId || null,
    billNumber || null,

    partyName || null,
    direction,
    quantity,
    newStock,
    rate ?? null,
    txnDate,
  ]
);

  return newStock;
};

/* ── reverse a ledger row + re-shift subsequent rows ── */
export const reverseItemLedger = async ({
  connection,
  itemId,
  txnType,
  referenceId,
}) => {
  const [[existingRow]] = await connection.query(
    `SELECT * FROM item_ledger
     WHERE Item_Id = ? AND Txn_Type = ? AND Source_Id = ?
     LIMIT 1`,
    [itemId, txnType, referenceId]
  );

  if (!existingRow) return;

  const removedQty   = Number(existingRow.Quantity);
  const reverseShift = existingRow.Direction === "In"
    ? -removedQty
    : removedQty;

  await connection.query(
    `DELETE FROM item_ledger WHERE id = ?`,
    [existingRow.id]
  );

  await connection.query(
    `UPDATE item_ledger
     SET Running_Stock = Running_Stock + ?
     WHERE Item_Id = ? AND id > ?`,
    [reverseShift, itemId, existingRow.id]
  );
};