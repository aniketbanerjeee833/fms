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
export const validateSource = async (
  connection,
  sourceType,
  sourceId
) => {
  const tableMap = {
    Payment_In: "payment_in",
    Payment_Out: "payment_out",
    Sale_Return: "sale_return",
    Purchase_Return: "purchase_return",
    Sale: "add_sale",
    Purchase: "add_purchase",
    Expense: "expenses",
  };

  const table = tableMap[sourceType];

  if (!table) {
    throw new Error(`Invalid Source_Type: ${sourceType}`);
  }

  const [[row]] = await connection.query(
    `SELECT id FROM ${table} WHERE id = ?`,
    [sourceId]
  );

  if (!row) {
    throw new Error(
      `Invalid Source_Id (${sourceId}) for ${sourceType}.`
    );
  }
};
export const validateSplits = (splits, expectedTotal=null) => {
  if (!Array.isArray(splits) || splits.length === 0) {
    throw new Error("At least one payment split is required.");
  }

  let cashSeen = false;
  const seenBankAccounts = new Set();
  let sum = 0;

  // for (const split of splits) {
  //   const { Payment_Type, Bank_Account_Id, Reference_Number, Amount } = split;

  //   if (!Payment_Type) throw new Error("Payment Type is required for every split.");
  //   if (isNaN(Amount) || Number(Amount) < 0) {
  //     throw new Error(" Payment Type amount must be greater than 0.");
  //   }

  // //    const splitAmount = Number(Amount) || 0;

  // // // Don't allow negative payment
  // // if (splitAmount < 0) {
  // //   throw new Error("Payment amount cannot be negative.");
  // // }


  //   if (Payment_Type === "Cash") {
  //     if (cashSeen) throw new Error("Only one Cash split is allowed.");
  //     cashSeen = true;
  //   }

  //   if (Payment_Type === "Bank") {
  //     if (!Bank_Account_Id) throw new Error("Bank account is required for a Bank split.");
  //     if (seenBankAccounts.has(Bank_Account_Id)) {
  //       throw new Error("Each bank account can only be used once. Edit the existing split instead of adding a duplicate.");
  //     }
  //     seenBankAccounts.add(Bank_Account_Id);
  //   }

  //   // if ((Payment_Type === "Cheque" || Payment_Type === "Neft") && !Reference_Number?.trim()) {
  //   //   throw new Error(`Reference number is required for ${Payment_Type} splits.`);
  //   // }

  //   sum += Number(Amount);
  // }
for (const split of splits) {
  const {
    Payment_Type,
    Bank_Account_Id,
    Reference_Number,
    Amount,
  } = split;

  if (!Payment_Type) {
    throw new Error(
      "Payment Type is required for every split."
    );
  }

  // Blank/null/undefined -> ₹0
  const splitAmount = Number(Amount) || 0;

  // Negative amount is not allowed
  if (splitAmount < 0) {
    throw new Error(
      "Payment amount cannot be negative."
    );
  }

  // Only one Cash split
  if (Payment_Type === "Cash") {
    if (cashSeen) {
      throw new Error(
        "Only one Cash split is allowed."
      );
    }

    cashSeen = true;
  }

  // Bank validation
  if (Payment_Type === "Bank") {
    if (!Bank_Account_Id) {
      throw new Error(
        "Bank account is required for a Bank split."
      );
    }

    if (seenBankAccounts.has(Bank_Account_Id)) {
      throw new Error(
        "Each bank account can only be used once. Edit the existing split instead of adding a duplicate."
      );
    }

    seenBankAccounts.add(Bank_Account_Id);
  }

  sum += splitAmount;
}
  // sum = Math.round(sum * 100) / 100;
  // const expected = Math.round(Number(expectedTotal) * 100) / 100;

  // if (sum !== expected) {
  //   throw new Error(`Split amounts (₹${sum}) must add up to the total paid (₹${expected}).`);
  // }
  sum = Math.round(sum * 100) / 100;

// Only validate against a total if one is provided.
if (expectedTotal !== null && expectedTotal !== undefined) {
  const expected = Math.round(Number(expectedTotal) * 100) / 100;

  if (sum !== expected) {
    throw new Error(
      `Split amounts (₹${sum}) must add up to the total paid (₹${expected}).`
    );
  }
}

return sum;
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
  await validateSource(connection, sourceType, sourceId);
  for (const split of splits) {
    const { Payment_Type, Bank_Account_Id, Reference_Number, Amount } = split;
    const splitAmount = Number(Amount) || 0;
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
        splitAmount,
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
        amount: splitAmount,
        txnDate,
      });
    }

    // cash helper is safe to call unconditionally — isCash flag no-ops otherwise
   if (Payment_Type === "Cash" && splitAmount > 0) {
  await recordCashTransaction({
    connection,
    isCash: true,
    txnType: sourceType,
    referenceId: splitId,
    partyName,
    amount: splitAmount,
    txnDate,
  });
}

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


// validateSplits(splits, expectedTotal)

// you need to pass the second argument in every controller.

// Payment In
// const totalReceived = splits.reduce(
//   (sum, s) => sum + (Number(s.Amount) || 0),
//   0
// );

// validateSplits(splits, totalReceived);
// Update Payment In

// Replace:

// try {
//   validateSplits(splits);
// } catch (validationErr) {

// with:

// try {
//   validateSplits(splits, totalReceived);
// } catch (validationErr) {
// Payment Out
// const totalPaid = splits.reduce(
//   (sum, s) => sum + (Number(s.Amount) || 0),
//   0
// );

// validateSplits(splits, totalPaid);
// Update Payment Out
// const totalPaid = splits.reduce(
//   (sum, s) => sum + (Number(s.Amount) || 0),
//   0
// );

// validateSplits(splits, totalPaid);
// Sale
// const totalPaid = splits.reduce(
//   (sum, s) => sum + (Number(s.Amount) || 0),
//   0
// );

// validateSplits(splits, totalPaid);

// If you're validating against the invoice total instead, then use:

// validateSplits(splits, Grand_Total);

// or

// validateSplits(splits, Total_Amount);

// depending on your column name.

// Update Sale
// validateSplits(splits, Grand_Total);
// Purchase
// const totalPaid = splits.reduce(
//   (sum, s) => sum + (Number(s.Amount) || 0),
//   0
// );

// validateSplits(splits, totalPaid);

// or

// validateSplits(splits, Grand_Total);
// Update Purchase
// validateSplits(splits, Grand_Total);
// Expense
// validateSplits(splits, Amount);
// Update Expense
// validateSplits(splits, Amount);

// DELIMITER $$
// CREATE TRIGGER trg_payment_splits_check_source
// BEFORE INSERT ON payment_splits
// FOR EACH ROW
// BEGIN
//   DECLARE cnt INT DEFAULT 0;

//   IF NEW.Source_Type = 'Payment_In' THEN
//     SELECT COUNT(*) INTO cnt FROM payment_in WHERE Id = NEW.Source_Id;
//   ELSEIF NEW.Source_Type = 'Payment_Out' THEN
//     SELECT COUNT(*) INTO cnt FROM payment_out WHERE Id = NEW.Source_Id;
//   ELSEIF NEW.Source_Type = 'Sale' THEN
//     SELECT COUNT(*) INTO cnt FROM sale WHERE Id = NEW.Source_Id;
//   ELSEIF NEW.Source_Type = 'Purchase' THEN
//     SELECT COUNT(*) INTO cnt FROM purchase WHERE Id = NEW.Source_Id;
//   ELSEIF NEW.Source_Type = 'Expense' THEN
//     SELECT COUNT(*) INTO cnt FROM expense WHERE Id = NEW.Source_Id;
//   END IF;

//   IF cnt = 0 THEN
//     SIGNAL SQLSTATE '45000'
//       SET MESSAGE_TEXT = 'Invalid Source_Id for given Source_Type';
//   END IF;
// END$$
// DELIMITER ;