import db from "../../config/db.js";

// =========================================================
// GET ALL TRANSACTIONS SETTINGS
// =========================================================

const getAllTransactionsSettings = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `
      SELECT
        id,
        setting_key,
        setting_value,
        setting_label,
        description,
        sort_order
      FROM transactions_settings
      WHERE is_active = 1
      ORDER BY sort_order ASC
      `
    );

    return res.status(200).json({
      success: true,
      settings: rows,
    });
  } catch (err) {
    console.error(
      "❌ Error fetching Transactions settings:",
      err
    );

    next(err);
  }
};

// =========================================================
// UPDATE A SINGLE TRANSACTIONS SETTING
// =========================================================

const updateTransactionsSetting = async (req, res, next) => {
  let connection;

  try {
    const { setting_key } = req.params;
    const { setting_value } = req.body;

    const newValue = Number(setting_value);

    // =====================================================
    // VALIDATE VALUE
    // =====================================================

    if (![0, 1].includes(newValue)) {
      return res.status(400).json({
        success: false,
        message: "setting_value must be 0 or 1",
      });
    }

    // =====================================================
    // START TRANSACTION
    // =====================================================

    connection = await db.getConnection();

    await connection.beginTransaction();

    // =====================================================
    // GET + LOCK TARGET SETTING
    // =====================================================

    const [[targetSetting]] = await connection.query(
      `
      SELECT
        setting_key,
        setting_value
      FROM transactions_settings
      WHERE setting_key = ?
      LIMIT 1
      FOR UPDATE
      `,
      [setting_key]
    );

    if (!targetSetting) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Transaction setting not found",
      });
    }

    // =====================================================
    // UPDATE SETTING
    // =====================================================

    await connection.execute(
      `
      UPDATE transactions_settings
      SET setting_value = ?
      WHERE setting_key = ?
      `,
      [
        newValue,
        setting_key,
      ]
    );

    // =====================================================
    // COMMIT
    // =====================================================

    await connection.commit();

    // =====================================================
    // GET FRESH SETTINGS
    // =====================================================

    const [rows] = await db.query(
      `
      SELECT
        id,
        setting_key,
        setting_value,
        setting_label,
        description,
        sort_order
      FROM transactions_settings
      WHERE is_active = 1
      ORDER BY sort_order ASC
      `
    );

    return res.status(200).json({
      success: true,
      message: "Transaction setting updated successfully",
      settings: rows,
    });
  } catch (err) {
    if (connection) {
      await connection.rollback();
    }

    console.error(
      "❌ Error updating Transaction setting:",
      err
    );

    next(err);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// =========================================================
// EXPORT
// =========================================================

export {
  getAllTransactionsSettings,
  updateTransactionsSetting,
};