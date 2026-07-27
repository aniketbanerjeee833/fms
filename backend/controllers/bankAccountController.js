import db from "../config/db.js";

/* ═══════════════════════════════════════
   CREATE BANK ACCOUNT
═══════════════════════════════════════ */
const createBankAccount = async (req, res, next) => {
  try {
    const {
      accountDisplayName,
      openingBalance,
      asOfDate,
      accountNumber,
      ifscCode,
      upiId,
      qrCodeImage,
      bankName,
      accountHolderName,
    } = req.body;

    if (!accountDisplayName || !accountDisplayName.trim()) {
      return res.status(400).json({ success: false, message: "Account Display Name is required" });
    }

    const [result] = await db.query(
      `INSERT INTO bank_accounts
       (Account_Display_Name, Opening_Balance, As_Of_Date, Account_Number,
        IFSC_Code, UPI_Id, QR_Code_Image, Bank_Name, Account_Holder_Name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        accountDisplayName.trim(),
        openingBalance || 0,
        asOfDate || null,
        accountNumber || null,
        ifscCode || null,
        upiId || null,
        qrCodeImage || null,
        bankName || null,
        accountHolderName || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Bank account created successfully",
      bankAccountId: result.insertId,
    });
  } catch (err) {
    console.error("❌ Create bank account error:", err);
    next(err);
  }
};

/* ═══════════════════════════════════════
   EDIT BANK ACCOUNT
═══════════════════════════════════════ */
 const editBankAccount = async (req, res, next) => {
  try {
    const { Bank_Account_Id } = req.params;
    const {
      accountDisplayName,
      openingBalance,
      asOfDate,
      accountNumber,
      ifscCode,
      upiId,
      qrCodeImage,
      bankName,
      accountHolderName,
    } = req.body;

    if (!accountDisplayName || !accountDisplayName.trim()) {
      return res.status(400).json({ success: false, message: "Account Display Name is required" });
    }

    const [existing] = await db.query(`SELECT * FROM bank_accounts WHERE id = ?`, [Bank_Account_Id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Bank account not found" });
    }

    await db.query(
      `UPDATE bank_accounts SET
        Account_Display_Name = ?, Opening_Balance = ?, As_Of_Date = ?,
        Account_Number = ?, IFSC_Code = ?, UPI_Id = ?, QR_Code_Image = ?,
        Bank_Name = ?, Account_Holder_Name = ?
       WHERE id = ?`,
      [
        accountDisplayName.trim(),
        openingBalance || 0,
        asOfDate || null,
        accountNumber || null,
        ifscCode || null,
        upiId || null,
        qrCodeImage || null,
        bankName || null,
        accountHolderName || null,
        Bank_Account_Id,
      ]
    );

    res.status(200).json({ success: true, message: "Bank account updated successfully" });
  } catch (err) {
    console.error("❌ Edit bank account error:", err);
    next(err);
  }
};

/* ═══════════════════════════════════════
   GET ALL BANK ACCOUNTS
═══════════════════════════════════════ */
 const getAllBankAccounts = async (req, res, next) => {
  try {
    const [accounts] = await db.query(`
  SELECT
  ba.id AS Bank_Account_Id,
  ba.Account_Display_Name,
  ba.Bank_Name,
  ba.Account_Holder_Name,
  ba.Account_Number,
  ba.IFSC_Code,
  ba.UPI_Id,
  ba.Opening_Balance,
  ba.As_Of_Date,
  COALESCE(
    (
      SELECT bt.Running_Balance
      FROM bank_transactions bt
      WHERE bt.Bank_Account_Id = ba.id
      ORDER BY bt.id DESC
      LIMIT 1
    ),
    ba.Opening_Balance
  ) AS Current_Balance
FROM bank_accounts ba
ORDER BY ba.Account_Display_Name;
`);

    res.status(200).json({ success: true, bankAccounts: accounts });
  } catch (err) {
    console.error("❌ Get all bank accounts error:", err);
    next(err);
  }
};

/* ═══════════════════════════════════════
   GET SINGLE BANK ACCOUNT + ALL TRANSACTIONS
   (reads straight from the running-balance ledger — no recompute)
═══════════════════════════════════════ */
 const getBankAccountById = async (req, res, next) => {
  try {
    const { Bank_Account_Id } = req.params;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Bank account
   const [[account]] = await db.query(
  `SELECT
      id AS Bank_Account_Id,
      Account_Display_Name,
      Bank_Name,
      Account_Holder_Name,
      Account_Number,
      IFSC_Code,
      UPI_Id,
      Opening_Balance,
      As_Of_Date
   FROM bank_accounts
   WHERE id = ?`,
  [Bank_Account_Id]
);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Bank account not found",
      });
    }

    // Total transactions
    const [[{ totalCount }]] = await db.query(
      `SELECT COUNT(*) AS totalCount
       FROM bank_transactions
       WHERE Bank_Account_Id = ?`,
      [Bank_Account_Id]
    );

    // Transactions
   const [transactions] = await db.query(
  `SELECT
      id,
      Txn_Type,
      Party_Name,
      Direction,
      Amount,
      Running_Balance,
      Txn_Date,
      Remarks,
      Reference_Id
   FROM bank_transactions
   WHERE Bank_Account_Id = ?
   ORDER BY Txn_Date DESC, id DESC
   LIMIT ? OFFSET ?`,
  [Bank_Account_Id, limit, offset]
);

    // Current balance
    const [[lastTxn]] = await db.query(
      `SELECT Running_Balance
       FROM bank_transactions
       WHERE Bank_Account_Id = ?
       ORDER BY id DESC
       LIMIT 1`,
      [Bank_Account_Id]
    );

    const currentBalance = lastTxn
      ? Number(lastTxn.Running_Balance)
      : Number(account.Opening_Balance);

    res.status(200).json({
      success: true,
      bankAccount: account,
      currentBalance,
      transactions,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
    });

  } catch (err) {
    console.error("❌ Get bank account details error:", err);
    next(err);
  }
};

/* ═══════════════════════════════════════
   DELETE BANK ACCOUNT (optional, guard against existing txns)
═══════════════════════════════════════ */
//  const deleteBankAccount = async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     const [[{ txnCount }]] = await db.query(
//       `SELECT COUNT(*) AS txnCount FROM bank_transactions WHERE id = ?`,
//       [id]
//     );
//     if (txnCount > 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Cannot delete: transactions already recorded against this account",
//       });
//     }
//     await db.query(`DELETE FROM bank_accounts WHERE id = ?`, [id]);
//     res.status(200).json({ success: true, message: "Bank account deleted" });
//   } catch (err) {
//     console.error("❌ Delete bank account error:", err);
//     next(err);
//   }
// };

export { createBankAccount, editBankAccount, getAllBankAccounts, getBankAccountById };
