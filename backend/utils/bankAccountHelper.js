import db from "../config/db.js";

/**
 * Call this from your existing sale/purchase/paymentIn/paymentOut/
 * saleReturn/purchaseReturn controllers, right after inserting the
 * record, whenever Payment_Type === 'Bank'.
 */
// export const recordBankTransaction = async ({
//   connection,
//   bankAccountId,
//   txnType,
//   referenceId,
//   partyName,
//   amount,
//   txnDate,
//   remarks = null,
// }) => {
//   const CREDIT_TYPES = ["Sale", "Payment_In", "Purchase_Return"];
//   const direction = CREDIT_TYPES.includes(txnType) ? "Credit" : "Debit";

//   // 🔹 check if a transaction already exists for this exact reference
//   const [[existingTxn]] = await connection.query(
//     `SELECT * FROM bank_transactions
//      WHERE Bank_Account_Id = ? AND Txn_Type = ? AND Reference_Id = ?
//      LIMIT 1`,
//     [bankAccountId, txnType, referenceId]
//   );

//   if (existingTxn) {
//     const oldAmount = Number(existingTxn.Amount);
//     const amountDiff = Number(amount) - oldAmount; // could be + or -

//     if (amountDiff === 0) {
//       // nothing actually changed, skip entirely
//       return Number(existingTxn.Running_Balance);
//     }

//     // update this transaction's own amount
//     await connection.query(
//       `UPDATE bank_transactions
//        SET Amount = ?, Party_Name = ?, Txn_Date = ?, updated_at = NOW()
//        WHERE id = ?`,
//       [amount, partyName, txnDate, existingTxn.id]
//     );

//     // shift this txn's own running balance and every later txn's running balance
//     // by the diff (credit adds, debit subtracts — direction stays the same)
//     const shift = direction === "Credit" ? amountDiff : -amountDiff;

//     await connection.query(
//       `UPDATE bank_transactions
//        SET Running_Balance = Running_Balance + ?
//        WHERE Bank_Account_Id = ? AND id >= ?`,
//       [shift, bankAccountId, existingTxn.id]
//     );

//     const [[updated]] = await connection.query(
//       `SELECT Running_Balance FROM bank_transactions WHERE id = ?`,
//       [existingTxn.id]
//     );
//     return Number(updated.Running_Balance);
//   }

//   // 🔹 no existing transaction — insert as before
//   const [[lastRow]] = await connection.query(
//     `SELECT Running_Balance FROM bank_transactions
//      WHERE Bank_Account_Id = ? ORDER BY id DESC LIMIT 1`,
//     [bankAccountId]
//   );

//   let baseBalance;
//   if (lastRow) {
//     baseBalance = Number(lastRow.Running_Balance);
//   } else {
//     const [[acc]] = await connection.query(
//       `SELECT Opening_Balance FROM bank_accounts WHERE id = ?`,
//       [bankAccountId]
//     );
//     baseBalance = Number(acc?.Opening_Balance || 0);
//   }

//   const newBalance =
//     direction === "Credit" ? baseBalance + Number(amount) : baseBalance - Number(amount);

//   await connection.query(
//     `INSERT INTO bank_transactions
//       (Bank_Account_Id, Txn_Type, Reference_Id, Party_Name, Direction, Amount, Running_Balance, Txn_Date)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
//     [bankAccountId, txnType, referenceId, partyName, direction, amount, newBalance, txnDate]
//   );

//   return newBalance;
// };

export const recordBankTransaction = async ({
  connection,
  bankAccountId,
  txnType,
  referenceId,
  partyName,
  amount,
  txnDate
}) => {
  const CREDIT_TYPES = ["Sale", "Payment_In", "Purchase_Return"];

  const [[existingTxn]] = await connection.query(
    `SELECT * FROM bank_transactions
     WHERE Txn_Type = ? AND Reference_Id = ?
     LIMIT 1`,
    [txnType, referenceId]
  );

  if (!bankAccountId) {
    if (existingTxn) {
      await reverseAndDeleteTxn(connection, existingTxn);
    }
    return null;
  }

  const direction = CREDIT_TYPES.includes(txnType) ? "Credit" : "Debit";

  if (existingTxn) {
    // bank account itself changed — full delete + reinsert
    if (existingTxn.Bank_Account_Id !== bankAccountId) {
      await reverseAndDeleteTxn(connection, existingTxn);
      return insertBankTxn(connection, {
        bankAccountId, txnType, referenceId, partyName, amount, txnDate, direction,
      });
    }

    // same bank account — always update the row's fields
    const oldAmount = Number(existingTxn.Amount);
    const amountDiff = Number(amount) - oldAmount;

    // 🔹 always write Party_Name / Txn_Date / Amount, regardless of whether amount changed
    await connection.query(
      `UPDATE bank_transactions
       SET Amount = ?, Party_Name = ?, Txn_Date = ?, updated_at = NOW()
       WHERE id = ?`,
      [amount, partyName, txnDate, existingTxn.id]
    );

    // 🔹 only shift later balances if the amount actually changed
    if (amountDiff !== 0) {
      const shift = direction === "Credit" ? amountDiff : -amountDiff;
      await connection.query(
        `UPDATE bank_transactions
         SET Running_Balance = Running_Balance + ?
         WHERE Bank_Account_Id = ? AND id >= ?`,
        [shift, bankAccountId, existingTxn.id]
      );
    }

    const [[updated]] = await connection.query(
      `SELECT Running_Balance FROM bank_transactions WHERE id = ?`,
      [existingTxn.id]
    );
    return Number(updated.Running_Balance);
  }

  return insertBankTxn(connection, {
    bankAccountId, txnType, referenceId, partyName, amount, txnDate, direction,
  });
};

/* insertBankTxn and reverseAndDeleteTxn unchanged */

/* ── helper: insert a fresh ledger row ── */
async function insertBankTxn(connection, { bankAccountId, txnType, referenceId, partyName, amount, txnDate, direction }) {
  const [[lastRow]] = await connection.query(
    `SELECT Running_Balance FROM bank_transactions
     WHERE Bank_Account_Id = ? ORDER BY id DESC LIMIT 1`,
    [bankAccountId]
  );

  let baseBalance;
  if (lastRow) {
    baseBalance = Number(lastRow.Running_Balance);
  } else {
    const [[acc]] = await connection.query(
      `SELECT Opening_Balance FROM bank_accounts WHERE id = ?`,
      [bankAccountId]
    );
    baseBalance = Number(acc?.Opening_Balance || 0);
  }

  const newBalance =
    direction === "Credit" ? baseBalance + Number(amount) : baseBalance - Number(amount);

  await connection.query(
    `INSERT INTO bank_transactions
      (Bank_Account_Id, Txn_Type, Reference_Id, Party_Name, Direction, Amount, Running_Balance, Txn_Date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [bankAccountId, txnType, referenceId, partyName, direction, amount, newBalance, txnDate]
  );

  return newBalance;
}

/* ── helper: remove a ledger row and re-shift every later txn on that account ── */
async function reverseAndDeleteTxn(connection, existingTxn) {
  const removedAmount = Number(existingTxn.Amount);
  const reverseShift = existingTxn.Direction === "Credit" ? -removedAmount : removedAmount;

  await connection.query(`DELETE FROM bank_transactions WHERE id = ?`, [existingTxn.id]);

  await connection.query(
    `UPDATE bank_transactions
     SET Running_Balance = Running_Balance + ?
     WHERE Bank_Account_Id = ? AND id > ?`,
    [reverseShift, existingTxn.Bank_Account_Id, existingTxn.id]
  );
}