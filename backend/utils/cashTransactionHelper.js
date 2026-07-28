import db from "../config/db.js";

const CREDIT_TYPES = ["Sale", "Payment_In", "Purchase_Return", "Adjustment_Add"];
const DEBIT_TYPES  = ["Purchase", "Payment_Out", "Sale_Return", "Adjustment_Reduce"];
 
/* ── MAIN EXPORT ─────────────────────────────────────────────────
   Call this from every controller that touches cash:
     sale create/edit, purchase create/edit,
     payment_in create/edit, payment_out create/edit,
     purchase_return create/edit, sale_return create/edit,
     cash_adjustment create/edit
 
   @param isCash  — pass true only when Payment_Type === 'Cash'
                    if false, deletes any stale cash row and returns null
───────────────────────────────────────────────────────────────── */
export const recordCashTransaction = async ({
  connection,
  isCash,          // boolean — is this transaction in cash?
  txnType,         // 'Sale' | 'Purchase' | 'Payment_In' | 'Payment_Out' |
                   // 'Purchase_Return' | 'Sale_Return' | 'Adjustment_Add' | 'Adjustment_Reduce'
  referenceId,     // source row's id (string or number)
  partyName,       // party name string or null
  amount,          // positive number
  txnDate         // 'YYYY-MM-DD'

}) => {
 
  /* find any existing cash ledger row for this transaction */
  const [[existingTxn]] = await connection.query(
    `SELECT * FROM cash_transactions
     WHERE Txn_Type = ? AND Reference_Id = ?
     LIMIT 1`,
    [txnType, String(referenceId)]
  );
 
  /* ══════════════════════════════════════════
     CASE 1 — No longer Cash (switched to Bank/Cheque/Neft)
     → delete stale row, re-shift later balances
  ══════════════════════════════════════════ */
  if (!isCash) {
    if (existingTxn) {
      await reverseAndDeleteCashTxn(connection, existingTxn);
    }
    return null;
  }
 
  const direction = CREDIT_TYPES.includes(txnType) ? "Credit" : "Debit";
 
  /* ══════════════════════════════════════════
     CASE 2 — Existing row found (edit scenario)
  ══════════════════════════════════════════ */
 if (existingTxn) {
  const oldAmount = Number(existingTxn.Amount);
  const amountDiff = Number(amount) - oldAmount;

  // 🔹 always update the row
  await connection.query(
    `UPDATE cash_transactions
     SET Amount = ?, Party_Name = ?, Txn_Date = ?, Remarks = ?, updated_at = NOW()
     WHERE id = ?`,
    [amount, partyName, txnDate, remarks, existingTxn.id]
  );

  // 🔹 only shift when amount actually changed
  if (amountDiff !== 0) {
    const shift = direction === "Credit" ? amountDiff : -amountDiff;
    await connection.query(
      `UPDATE cash_transactions
       SET Running_Balance = Running_Balance + ?
       WHERE id >= ?`,
      [shift, existingTxn.id]
    );
  }

  const [[updated]] = await connection.query(
    `SELECT Running_Balance FROM cash_transactions WHERE id = ?`,
    [existingTxn.id]
  );

  return Number(updated.Running_Balance);
}
 
  /* ══════════════════════════════════════════
     CASE 3 — No existing row (create / newly switched to Cash)
  ══════════════════════════════════════════ */
  return insertCashTxn(connection, {
    txnType, referenceId, partyName, amount, txnDate, direction
  });
};
 
 
/* ── INSERT fresh cash ledger row ─────────────────────────── */
async function insertCashTxn(connection, {
  txnType, referenceId, partyName, amount, txnDate, direction
}) {
  /* get last running balance */
  const [[lastRow]] = await connection.query(
    `SELECT Running_Balance FROM cash_transactions ORDER BY id DESC LIMIT 1`
  );
 
  const baseBalance = lastRow ? Number(lastRow.Running_Balance) : 0;
  const newBalance  = direction === "Credit"
    ? baseBalance + Number(amount)
    : baseBalance - Number(amount);
 
  await connection.query(
    `INSERT INTO cash_transactions
       (Txn_Type, Reference_Id, Party_Name, Direction, Amount, Running_Balance, Txn_Date)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [txnType, String(referenceId), partyName, direction, amount, newBalance, txnDate]
  );
 
  return newBalance;
}
 
 
/* ── REVERSE & DELETE a cash ledger row ──────────────────── */
async function reverseAndDeleteCashTxn(connection, existingTxn) {
  const removedAmount = Number(existingTxn.Amount);
  const reverseShift  = existingTxn.Direction === "Credit" ? -removedAmount : removedAmount;
 
  await connection.query(
    `DELETE FROM cash_transactions WHERE id = ?`,
    [existingTxn.id]
  );
 
  /* re-shift every row that came after */
  await connection.query(
    `UPDATE cash_transactions
     SET Running_Balance = Running_Balance + ?
     WHERE id > ?`,
    [reverseShift, existingTxn.id]
  );
}