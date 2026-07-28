import db from "../config/db.js";
import { recordBankTransaction } from "./bankAccountHelper.js";
import { recordCashTransaction } from "./cashTransactionHelper.js";


/**
 * Validates a splits[] array against the dedup rules:
 *   - at most one Cash row
 *   - at most one row per distinct Bank_Account_Id
 *   - Cheque/Neft rows require a Reference_Number
 *   - unlimited Cheque/Neft rows
 *   - sum(splits.Amount) === expectedTotal
 * Throws an Error with a user-facing message if invalid.
 */
export const validateSplits = (splits, expectedTotal) => {
  if (!Array.isArray(splits) || splits.length === 0) {
    throw new Error("At least one payment split is required.");
  }

  let cashSeen = false;
  const seenBankAccounts = new Set();
  let sum = 0;

  for (const split of splits) {
    const { Payment_Type, Bank_Account_Id, Reference_Number, Amount } = split;

    if (!Payment_Type) throw new Error("Payment Type is required for every split.");
    if (isNaN(Amount) || Number(Amount) <= 0) {
      throw new Error("Each split amount must be greater than 0.");
    }

    if (Payment_Type === "Cash") {
      if (cashSeen) throw new Error("Only one Cash split is allowed.");
      cashSeen = true;
    }

    if (Payment_Type === "Bank") {
      if (!Bank_Account_Id) throw new Error("Bank account is required for a Bank split.");
      if (seenBankAccounts.has(Bank_Account_Id)) {
        throw new Error("Each bank account can only be used once. Edit the existing split instead of adding a duplicate.");
      }
      seenBankAccounts.add(Bank_Account_Id);
    }

    // if ((Payment_Type === "Cheque" || Payment_Type === "Neft") && !Reference_Number?.trim()) {
    //   throw new Error(`Reference number is required for ${Payment_Type} splits.`);
    // }

    sum += Number(Amount);
  }

  sum = Math.round(sum * 100) / 100;
  const expected = Math.round(Number(expectedTotal) * 100) / 100;

  if (sum !== expected) {
    throw new Error(`Split amounts (₹${sum}) must add up to the total paid (₹${expected}).`);
  }
};

/**
 * Inserts all split rows for a parent transaction and fans out
 * ledger writes (bank/cash) — one call per split.
 * Call this INSIDE the caller's existing connection/transaction.
 */
export const insertPaymentSplits = async ({
  connection,
  sourceType,     // 'Payment_In' | 'Payment_Out' | 'Sale' | 'Purchase' | ...
  sourceId,       // numeric parent id
  partyName,
  txnDate,
  splits,
}) => {
  for (const split of splits) {
    const { Payment_Type, Bank_Account_Id, Reference_Number, Amount } = split;

    const [result] = await connection.query(
      `INSERT INTO payment_splits
       (Source_Type, Source_Id, Payment_Type, Bank_Account_Id, Reference_Number, Amount)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        sourceType,
        sourceId,
        Payment_Type,
        Payment_Type === "Bank" ? Bank_Account_Id : null,
        Reference_Number || null,
        Number(Amount),
      ]
    );

    const splitId = result.insertId; // 🔹 use split id as the ledger's Reference_Id — keeps multiple splits distinct

    if (Payment_Type === "Bank" && Bank_Account_Id) {
      await recordBankTransaction({
        connection,
        bankAccountId: Bank_Account_Id,
        txnType: sourceType,
        referenceId: splitId,          // 🔹 per-split id, not the parent id
        partyName,
        amount: Number(Amount),
        txnDate,
      });
    }

    // cash helper is safe to call unconditionally — isCash flag no-ops otherwise
    await recordCashTransaction({
      connection,
      isCash: Payment_Type === "Cash",
      txnType: sourceType,
      referenceId: splitId,
      partyName,
      amount: Number(Amount),
      txnDate,
    });

    // Cheque/Neft: not posted to bank_transactions or cash_transactions —
    // they sit only in payment_splits until you build a "cheque clearing" flow.
    // If you DO want them tracked against a bank account once cleared, that's
    // a separate future step (see note below).
  }
};

/**
 * Deletes all existing splits + their ledger rows for a parent transaction.
 * Call this at the top of an edit controller before re-inserting fresh splits.
 */
export const deletePaymentSplits = async ({ connection, sourceType, sourceId }) => {
  const [oldSplits] = await connection.query(
    `SELECT * FROM payment_splits WHERE Source_Type = ? AND Source_Id = ?`,
    [sourceType, sourceId]
  );

  for (const split of oldSplits) {
    // reverse ledger rows keyed by this split's own id
    await recordBankTransaction({
      connection,
      bankAccountId: null,          // null → helper deletes the stale row if one exists
      txnType: sourceType,
      referenceId: split.id,
      partyName: null,
      amount: 0,
      txnDate: null,
    });

    await recordCashTransaction({
      connection,
      isCash: false,                // false → helper deletes the stale row if one exists
      txnType: sourceType,
      referenceId: split.id,
      partyName: null,
      amount: 0,
      txnDate: null,
    });
  }

  await connection.query(
    `DELETE FROM payment_splits WHERE Source_Type = ? AND Source_Id = ?`,
    [sourceType, sourceId]
  );
};