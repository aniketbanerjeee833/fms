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


/*
|--------------------------------------------------------------------------
| Get all transaction prefixes
|--------------------------------------------------------------------------
*/
const getTransactionPrefixes = async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT
                id,
                transaction_type,
                prefix_name,
                is_active,
                created_at,
                updated_at
            FROM transactions_prefixes
            ORDER BY transaction_type ASC, id ASC
        `);

        return res.status(200).json({
            success: true,
            prefixes: rows,
        });
    } catch (err) {
        console.error("❌ Error getting transaction prefixes:", err);
        next(err);
    }
};


/*
|--------------------------------------------------------------------------
| Add transaction prefix
|--------------------------------------------------------------------------
*/
const addTransactionPrefix = async (req, res, next) => {
    let connection;

    try {
        const {
            transaction_type,
            prefix_name,
        } = req.body;

        if (!transaction_type || !transaction_type.trim()) {
            return res.status(400).json({
                success: false,
                message: "Transaction type is required",
            });
        }

        if (!prefix_name || !prefix_name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Prefix name is required",
            });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        /*
        ------------------------------------------------------------
        Check duplicate prefix for same transaction type
        ------------------------------------------------------------
        */
        const [existing] = await connection.query(
            `
            SELECT id
            FROM transactions_prefixes
            WHERE transaction_type = ?
              AND prefix_name = ?
            LIMIT 1
            `,
            [
                transaction_type.trim(),
                prefix_name.trim(),
            ]
        );

        if (existing.length > 0) {
            await connection.rollback();

            return res.status(409).json({
                success: false,
                message: "This prefix already exists for this transaction type",
            });
        }

        /*
        ------------------------------------------------------------
        New prefixes are added as active
        ------------------------------------------------------------
        */

        const [result] = await connection.execute(
            `
            INSERT INTO transactions_prefixes
            (
                transaction_type,
                prefix_name,
                is_active,
                created_at,
                updated_at
            )
            VALUES (?, ?, 1, NOW(), NOW())
            `,
            [
                transaction_type.trim(),
                prefix_name.trim(),
            ]
        );

        await connection.commit();

        return res.status(201).json({
            success: true,
            message: "Transaction prefix added successfully",
            prefixId: result.insertId,
        });

    } catch (err) {
        if (connection) {
            await connection.rollback();
        }

        console.error("❌ Error adding transaction prefix:", err);
        next(err);

    } finally {
        if (connection) {
            connection.release();
        }
    }
};


/*
|--------------------------------------------------------------------------
| Delete transaction prefix
|--------------------------------------------------------------------------
*/
const deleteTransactionPrefix = async (req, res, next) => {
    let connection;

    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Prefix id is required",
            });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [existing] = await connection.query(
            `
            SELECT *
            FROM transactions_prefixes
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );

        if (existing.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Transaction prefix not found",
            });
        }

        /*
        ------------------------------------------------------------
        Don't allow deleting the default None prefix
        ------------------------------------------------------------
        */
        if (existing[0].prefix_name === "None") {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "Default None prefix cannot be deleted",
            });
        }

        await connection.execute(
            `
            DELETE FROM transactions_prefixes
            WHERE id = ?
            `,
            [id]
        );

        await connection.commit();

        return res.status(200).json({
            success: true,
            message: "Transaction prefix deleted successfully",
        });

    } catch (err) {
        if (connection) {
            await connection.rollback();
        }

        console.error("❌ Error deleting transaction prefix:", err);
        next(err);

    } finally {
        if (connection) {
            connection.release();
        }
    }
};


/*
|--------------------------------------------------------------------------
| Make prefix active / inactive
|--------------------------------------------------------------------------
*/
const toggleTransactionPrefix = async (req, res, next) => {
    let connection;

    try {
        const { id } = req.params;
        const { is_active } = req.body;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Prefix id is required",
            });
        }

        if (![0, 1, true, false].includes(is_active)) {
            return res.status(400).json({
                success: false,
                message: "is_active must be 0 or 1",
            });
        }

        connection = await db.getConnection();

        await connection.beginTransaction();

        // =====================================================
        // GET PREFIX
        // =====================================================

        const [existing] = await connection.query(
            `
            SELECT id, transaction_type, prefix_name, is_active
            FROM transactions_prefixes
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );

        if (existing.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Transaction prefix not found",
            });
        }

        const prefix = existing[0];

        const activeValue =
            is_active === true || Number(is_active) === 1
                ? 1
                : 0;

        // =====================================================
        // ACTIVATE PREFIX
        // =====================================================

        if (activeValue === 1) {

            // First deactivate every prefix
            // belonging to the same transaction type
            await connection.execute(
                `
                UPDATE transactions_prefixes
                SET is_active = 0
                WHERE transaction_type = ?
                `,
                [prefix.transaction_type]
            );

            // Then activate the selected prefix
            await connection.execute(
                `
                UPDATE transactions_prefixes
                SET is_active = 1
                WHERE id = ?
                `,
                [id]
            );

        } else {

            // =================================================
            // DEACTIVATE PREFIX
            // =================================================

            await connection.execute(
                `
                UPDATE transactions_prefixes
                SET is_active = 0
                WHERE id = ?
                `,
                [id]
            );
        }

        await connection.commit();

        return res.status(200).json({
            success: true,
            message:
                activeValue === 1
                    ? "Transaction prefix activated successfully"
                    : "Transaction prefix deactivated successfully",
        });

    } catch (err) {

        if (connection) {
            await connection.rollback();
        }

        console.error(
            " Error toggling transaction prefix:",
            err
        );

        next(err);

    } finally {

        if (connection) {
            connection.release();
        }
    }
};

const getTransactionPrefixesByType = async (req, res, next) => {
    try {
        const { transaction_type } = req.params;

        if (!transaction_type) {
            return res.status(400).json({
                success: false,
                message: "Transaction type is required",
            });
        }

        const [rows] = await db.query(
            `
            SELECT
                id,
                transaction_type,
                prefix_name,
                is_active
            FROM transactions_prefixes
            WHERE transaction_type = ?
            ORDER BY id ASC
            `,
            [transaction_type]
        );

        return res.status(200).json({
            success: true,
            transaction_type,
            prefixes: rows,
        });

    } catch (err) {
        console.error(
            "❌ Error getting transaction prefixes by type:",
            err
        );

        next(err);
    }
};

export {
  getAllTransactionsSettings,
  updateTransactionsSetting,
  getTransactionPrefixes,
  addTransactionPrefix,
  deleteTransactionPrefix,
  toggleTransactionPrefix,
  getTransactionPrefixesByType
  

};