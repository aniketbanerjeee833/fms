import db from "../config/db.js";

/**
 * Call this from your existing sale/purchase/paymentIn/paymentOut/
 * saleReturn/purchaseReturn controllers, right after inserting the
 * record, whenever Payment_Type === 'Bank'.
 */
export const recordBankTransaction = async ({
  connection,
  bankAccountId,
  txnType,
  referenceId,
  partyName,
  amount,
  txnDate,
  remarks = null,
}) => {
  const CREDIT_TYPES = [
    "Sale",
    "Payment_In",
    "Purchase_Return",
  ];

  const direction = CREDIT_TYPES.includes(txnType)
    ? "Credit"
    : "Debit";

 const [[lastRow]] = await connection.query(
  `SELECT Running_Balance
   FROM bank_transactions
   WHERE Bank_Account_Id = ?
   ORDER BY id DESC
   LIMIT 1`,
  [bankAccountId]
);

  let baseBalance;

  if (lastRow) {
    baseBalance = Number(lastRow.Running_Balance);
  } else {
    const [[acc]] = await connection.query(
      `SELECT Opening_Balance
       FROM bank_accounts
       WHERE id = ?`,
      [bankAccountId]
    );

    baseBalance = Number(acc?.Opening_Balance || 0);
  }

  const newBalance =
    direction === "Credit"
      ? baseBalance + Number(amount)
      : baseBalance - Number(amount);

  await connection.query(
    `INSERT INTO bank_transactions
      (
        Bank_Account_Id,
        Txn_Type,
        Reference_Id,
        Party_Name,
        Direction,
        Amount,
        Running_Balance,
        Txn_Date,
        Remarks
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      bankAccountId,
      txnType,
      referenceId,
      partyName,
      direction,
      amount,
      newBalance,
      txnDate,
      remarks,
    ]
  );

  return newBalance;
};