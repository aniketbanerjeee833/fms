// import db from "../config/db.js";

// /*
//   Direction convention:
//   Credit = balance moves in your favour (party owes you MORE, or you owe them LESS)
//   Debit  = balance moves against you   (you owe party MORE, or party owes you LESS)

//   Running balance:
//     positive = party owes YOU (net receivable)
//     negative = YOU owe party  (net payable)

//   Per transaction type:
//     Sale             → Credit  (party owes you more)
//     Payment_In       → Debit   (party paid, they owe you less)
//     Sale_Return      → Debit   (you refunded, they owe you less)
//     Purchase         → Debit   (you owe party more)
//     Payment_Out      → Credit  (you paid, you owe them less)
//     Purchase_Return  → Credit  (party refunded, you owe them less)
//     Opening_Balance  → Credit or Debit depending on To_Receive / To_Pay
// */
// // CREATE TABLE party_ledger (
// //   id               INT AUTO_INCREMENT PRIMARY KEY,
// //   Party_Id         VARCHAR(20)  NOT NULL,
// //   Txn_Type         ENUM(
// //                      'Sale','Purchase',
// //                      'Payment_In','Payment_Out',
// //                      'Sale_Return','Purchase_Return',
// //                      'Opening_Balance'
// //                    ) NOT NULL,
// //   Source_Id        INT          NULL,   -- numeric id of source row
// //   Reference_Id     INT   NULL,   -- formatted id e.g. PUR001, SAL001
// //   Direction        ENUM('Credit','Debit') NOT NULL,
// //   Amount           DECIMAL(14,2) NOT NULL,
// //   Running_Balance  DECIMAL(14,2) NOT NULL,
// //                    -- positive = party owes you
// //                    -- negative = you owe party
// //   Txn_Date         DATE NOT NULL,

// //   created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
// //   updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
// //   FOREIGN KEY (Party_Id) REFERENCES add_party(Party_Id)
// // );
// const CREDIT_TYPES = [
//   "Sale",
//   "Payment_Out",
//   "Purchase_Return",
// ];

// const DEBIT_TYPES = [
//   "Purchase",
//   "Payment_In",
//   "Sale_Return",
// ];



// export const recordPartyLedger = async ({
//   connection,
//   partyId,
//   txnType,
//   referenceId,
//   amount,
//   txnDate,
//   docNumber        = null,
//   balanceDue       = null,
//   directionOverride = null,
// }) => {
//   const [[existingRow]] = await connection.query(
//     `SELECT * FROM party_ledger
//      WHERE Party_Id = ? AND Txn_Type = ? AND Source_Id = ?
//      LIMIT 1`,
//     [partyId, txnType, referenceId]
//   );

//   const direction = directionOverride ||
//     (CREDIT_TYPES.includes(txnType) ? "Credit" : "Debit");

//   let finalBalance;

//   if (existingRow) {
//     const oldAmount  = Number(existingRow.Amount);
//     const amountDiff = Number(amount) - oldAmount;

//     await connection.query(
//       `UPDATE party_ledger
//        SET Direction = ?, Amount = ?, Txn_Date = ?,
//            Doc_Number = ?, Balance_Due = ?, updated_at = NOW()
//        WHERE id = ?`,
//       [direction, amount, txnDate, docNumber, balanceDue, existingRow.id]
//     );

//     if (amountDiff !== 0) {
//       const shift = direction === "Credit" ? amountDiff : -amountDiff;
//       await connection.query(
//         `UPDATE party_ledger
//          SET Running_Balance = Running_Balance + ?
//          WHERE Party_Id = ? AND id >= ?`,
//         [shift, partyId, existingRow.id]
//       );
//     }

//     const [[updated]] = await connection.query(
//       `SELECT Running_Balance FROM party_ledger WHERE id = ?`,
//       [existingRow.id]
//     );
//     finalBalance = Number(updated.Running_Balance);

//   } else {
//     const [[lastRow]] = await connection.query(
//       `SELECT Running_Balance FROM party_ledger
//        WHERE Party_Id = ? ORDER BY id DESC LIMIT 1`,
//       [partyId]
//     );

//     const baseBalance = lastRow ? Number(lastRow.Running_Balance) : 0;
//     const newBalance  = direction === "Credit"
//       ? baseBalance + Number(amount)
//       : baseBalance - Number(amount);

//     await connection.query(
//       `INSERT INTO party_ledger
//        (Party_Id, Txn_Type, Source_Id, Direction, Amount,
//         Doc_Number, Balance_Due, Running_Balance, Txn_Date)
//        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//       [partyId, txnType, referenceId, direction, amount,
//        docNumber, balanceDue, newBalance, txnDate]
//     );

//     finalBalance = newBalance;
//   }

//   // 🔹 always sync Current_Balance on add_party
//   // this is the latest Running_Balance from the last ledger row
//   const [[latestRow]] = await connection.query(
//     `SELECT Running_Balance FROM party_ledger
//      WHERE Party_Id = ? ORDER BY id DESC LIMIT 1`,
//     [partyId]
//   );

//   await connection.query(
//     `UPDATE add_party
//      SET Current_Balance = ?, updated_at = NOW()
//      WHERE Party_Id = ?`,
//     [latestRow ? Number(latestRow.Running_Balance) : 0, partyId]
//   );

//   return finalBalance;
// };

// /* ── reverse ── */
// export const reversePartyLedger = async ({
//   connection,
//   partyId,
//   txnType,
//   referenceId,
// }) => {
//   const [[existingRow]] = await connection.query(
//     `SELECT * FROM party_ledger
//      WHERE Party_Id = ? AND Txn_Type = ? AND Source_Id = ?
//      LIMIT 1`,
//     [partyId, txnType, referenceId]
//   );

//   if (!existingRow) return;

//   const removedAmount = Number(existingRow.Amount);
//   const reverseShift  = existingRow.Direction === "Credit"
//     ? -removedAmount
//     : removedAmount;

//   await connection.query(
//     `DELETE FROM party_ledger WHERE id = ?`,
//     [existingRow.id]
//   );

//   await connection.query(
//     `UPDATE party_ledger
//      SET Running_Balance = Running_Balance + ?
//      WHERE Party_Id = ? AND id > ?`,
//     [reverseShift, partyId, existingRow.id]
//   );

//   // 🔹 sync Current_Balance after reversal
//   const [[latestRow]] = await connection.query(
//     `SELECT Running_Balance FROM party_ledger
//      WHERE Party_Id = ? ORDER BY id DESC LIMIT 1`,
//     [partyId]
//   );

//   await connection.query(
//     `UPDATE add_party
//      SET Current_Balance = ?, updated_at = NOW()
//      WHERE Party_Id = ?`,
//     [latestRow ? Number(latestRow.Running_Balance) : 0, partyId]
//   );
// };
// // Controller	txnType	Source_Id (referenceId)	Reference_Id (formattedId)
// // addSale / editSale	"Sale"	saleIdNumber (numeric id)	newSaleId → "SAL001"
// // addPurchase / editPurchase	"Purchase"	purchaseIdNumber (numeric id)	newPurchaseId → "PUR001"
// // createPaymentIn / edit	"Payment_In"	id (= result.insertId)	null
// // Payment Out controller	"Payment_Out"	id (= result.insertId)	null
// // createSaleReturn / editSaleReturn	"Sale_Return"	Sale_Return_Id (= headerResult.insertId)	null
// // createPurchaseReturn / editPurchaseReturn	"Purchase_Return"	Purchase_Return_Id (= headerResult.insertId)	null


/*
  Direction convention:

  Credit = positive impact
  Debit  = negative impact

  Running balance:
    Positive = party owes you
    Negative = you owe party

  Transaction types:
    Sale             -> Credit
    Payment_In       -> Debit
    Sale_Return      -> Debit
    Purchase         -> Debit
    Payment_Out      -> Credit
    Purchase_Return  -> Credit
    Opening_Balance  -> depends on directionOverride
*/

const CREDIT_TYPES = [
  "Sale",
  "Payment_Out",
  "Purchase_Return",
];

const DEBIT_TYPES = [
  "Purchase",
  "Payment_In",
  "Sale_Return",
];

/*
  Calculate the actual impact on the party balance.

  Special case:
    Purchase -> use Balance_Due instead of Amount.

  All other transactions -> use Amount.
*/

const BALANCE_DUE_TYPES = [
  "Sale",
  "Purchase",
  "Sale_Return",
  "Purchase_Return",
];

const getLedgerImpact = (
  txnType,
  amount,
  balanceDue,
  direction
) => {
  const effectiveAmount = BALANCE_DUE_TYPES.includes(txnType)
    ? (
        balanceDue !== null && balanceDue !== undefined
          ? Number(balanceDue)
          : Number(amount)
      )
    : Number(amount);

  return direction === "Credit"
    ? effectiveAmount
    : -effectiveAmount;
};


/* ─────────────────────────────────────────────
   RECORD / UPDATE PARTY LEDGER
───────────────────────────────────────────── */

export const recordPartyLedger = async ({
  connection,
  partyId,
  txnType,
  referenceId,
  amount,
  txnDate,
  docNumber = null,
  balanceDue = null,
  directionOverride = null,
}) => {
  const [[existingRow]] = await connection.query(
    `SELECT *
     FROM party_ledger
     WHERE Party_Id = ?
       AND Txn_Type = ?
       AND Source_Id = ?
     LIMIT 1`,
    [partyId, txnType, referenceId]
  );

  const direction =
    directionOverride ||
    (CREDIT_TYPES.includes(txnType) ? "Credit" : "Debit");

  let finalBalance;

  /* ───────────── UPDATE EXISTING ENTRY ───────────── */

  if (existingRow) {
    // Calculate old impact BEFORE updating the row.
    const oldImpact = getLedgerImpact(
      existingRow.Txn_Type,
      existingRow.Amount,
      existingRow.Balance_Due,
      existingRow.Direction
    );

    // Calculate new impact using updated values.
    const newImpact = getLedgerImpact(
      txnType,
      amount,
      balanceDue,
      direction
    );

    const balanceDiff = newImpact - oldImpact;

    // Update the existing ledger transaction.
    await connection.query(
      `UPDATE party_ledger
       SET Direction = ?,
           Amount = ?,
           Txn_Date = ?,
           Doc_Number = ?,
           Balance_Due = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [
        direction,
        amount,
        txnDate,
        docNumber,
        balanceDue,
        existingRow.id,
      ]
    );

    // Adjust this transaction and all subsequent balances.
    if (balanceDiff !== 0) {
      await connection.query(
        `UPDATE party_ledger
         SET Running_Balance = Running_Balance + ?
         WHERE Party_Id = ?
           AND id >= ?`,
        [balanceDiff, partyId, existingRow.id]
      );
    }

    const [[updatedRow]] = await connection.query(
      `SELECT Running_Balance
       FROM party_ledger
       WHERE id = ?`,
      [existingRow.id]
    );

    finalBalance = Number(updatedRow.Running_Balance);
  }

  /* ───────────── INSERT NEW ENTRY ───────────── */

  else {
    const [[lastRow]] = await connection.query(
      `SELECT Running_Balance
       FROM party_ledger
       WHERE Party_Id = ?
       ORDER BY id DESC
       LIMIT 1`,
      [partyId]
    );

    const baseBalance = lastRow
      ? Number(lastRow.Running_Balance)
      : 0;

    const impact = getLedgerImpact(
      txnType,
      amount,
      balanceDue,
      direction
    );

    const newBalance = baseBalance + impact;

    await connection.query(
      `INSERT INTO party_ledger
       (
         Party_Id,
         Txn_Type,
         Source_Id,
         Direction,
         Amount,
         Doc_Number,
         Balance_Due,
         Running_Balance,
         Txn_Date
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        partyId,
        txnType,
        referenceId,
        direction,
        amount,
        docNumber,
        balanceDue,
        newBalance,
        txnDate,
      ]
    );

    finalBalance = newBalance;
  }

  /* ───────────── SYNC PARTY CURRENT BALANCE ───────────── */

  const [[latestRow]] = await connection.query(
    `SELECT Running_Balance
     FROM party_ledger
     WHERE Party_Id = ?
     ORDER BY id DESC
     LIMIT 1`,
    [partyId]
  );

  await connection.query(
    `UPDATE add_party
     SET Current_Balance = ?,
         updated_at = NOW()
     WHERE Party_Id = ?`,
    [
      latestRow ? Number(latestRow.Running_Balance) : 0,
      partyId,
    ]
  );

  return finalBalance;
};

/* ─────────────────────────────────────────────
   REVERSE / DELETE PARTY LEDGER ENTRY
───────────────────────────────────────────── */

export const reversePartyLedger = async ({
  connection,
  partyId,
  txnType,
  referenceId,
}) => {
  const [[existingRow]] = await connection.query(
    `SELECT *
     FROM party_ledger
     WHERE Party_Id = ?
       AND Txn_Type = ?
       AND Source_Id = ?
     LIMIT 1`,
    [partyId, txnType, referenceId]
  );

  if (!existingRow) return;

  // Calculate the original impact before deleting.
  const existingImpact = getLedgerImpact(
    existingRow.Txn_Type,
    existingRow.Amount,
    existingRow.Balance_Due,
    existingRow.Direction
  );

  const reverseShift = -existingImpact;

  // Delete the ledger entry.
  await connection.query(
    `DELETE FROM party_ledger
     WHERE id = ?`,
    [existingRow.id]
  );

  // Correct all subsequent running balances.
  await connection.query(
    `UPDATE party_ledger
     SET Running_Balance = Running_Balance + ?
     WHERE Party_Id = ?
       AND id > ?`,
    [reverseShift, partyId, existingRow.id]
  );

  // Sync party current balance.
  const [[latestRow]] = await connection.query(
    `SELECT Running_Balance
     FROM party_ledger
     WHERE Party_Id = ?
     ORDER BY id DESC
     LIMIT 1`,
    [partyId]
  );

  await connection.query(
    `UPDATE add_party
     SET Current_Balance = ?,
         updated_at = NOW()
     WHERE Party_Id = ?`,
    [
      latestRow ? Number(latestRow.Running_Balance) : 0,
      partyId,
    ]
  );
};

/* ─────────────────────────────────────────────
   REBUILD PARTY LEDGER RUNNING BALANCES
   Use for historical correction.
───────────────────────────────────────────── */

export const rebuildPartyLedger = async (
  connection,
  partyId
) => {
  const [rows] = await connection.query(
    `SELECT
       id,
       Txn_Type,
       Amount,
       Balance_Due,
       Direction
     FROM party_ledger
     WHERE Party_Id = ?
     ORDER BY id ASC`,
    [partyId]
  );

  let runningBalance = 0;

  for (const row of rows) {
    const impact = getLedgerImpact(
      row.Txn_Type,
      row.Amount,
      row.Balance_Due,
      row.Direction
    );

    runningBalance += impact;

    await connection.query(
      `UPDATE party_ledger
       SET Running_Balance = ?
       WHERE id = ?`,
      [runningBalance, row.id]
    );
  }

  await connection.query(
    `UPDATE add_party
     SET Current_Balance = ?,
         updated_at = NOW()
     WHERE Party_Id = ?`,
    [runningBalance, partyId]
  );

  return runningBalance;
};
