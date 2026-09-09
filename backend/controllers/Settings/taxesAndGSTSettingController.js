import db from "../../config/db.js";

// =========================================================
// SETTINGS RULES
// =========================================================

const TAX_GST_SETTING_RULES = {
  enable_gst: {
    onDisable: [
      "enable_hsn_sac",
      "enable_place_of_supply",
    ],
  },

  enable_hsn_sac: {
    requiresEnabled: ["enable_gst"],
  },

  enable_place_of_supply: {
    requiresEnabled: ["enable_gst"],
  },
};

// =========================================================
// GET ALL TAX / GST SETTINGS
// =========================================================

const getAllTaxesAndGSTSettings = async (req, res, next) => {
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
      FROM taxes_and_gst_settings
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
      "❌ Error fetching Taxes/GST settings:",
      err
    );

    next(err);
  }
};

// =========================================================
// UPDATE A SINGLE TAX / GST SETTING
// =========================================================

const updateTaxesAndGSTSetting = async (req, res, next) => {
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
      FROM taxes_and_gst_settings
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
        message: "Tax/GST setting not found",
      });
    }

    // =====================================================
    // GET RULE
    // =====================================================

    const rule =
      TAX_GST_SETTING_RULES[setting_key];

    // =====================================================
    // RULE: requiresEnabled
    //
    // HSN/SAC and Place of Supply require GST to be ON.
    // =====================================================

    if (
      rule?.requiresEnabled?.length &&
      newValue === 1
    ) {
      const placeholders =
        rule.requiresEnabled
          .map(() => "?")
          .join(",");

      const [dependencyRows] =
        await connection.query(
          `
          SELECT
            setting_key,
            setting_value
          FROM taxes_and_gst_settings
          WHERE setting_key IN (${placeholders})
          FOR UPDATE
          `,
          rule.requiresEnabled
        );

      const disabledDependency =
        rule.requiresEnabled.find((key) => {
          const dependency =
            dependencyRows.find(
              (row) =>
                row.setting_key === key
            );

          return (
            !dependency ||
            Number(dependency.setting_value) === 0
          );
        });

      if (disabledDependency) {
        await connection.rollback();

        return res.status(400).json({
          success: false,
          message: `Enable "${disabledDependency}" before turning on this setting.`,
        });
      }
    }

    // =====================================================
    // UPDATE TARGET SETTING
    // =====================================================

    await connection.execute(
      `
      UPDATE taxes_and_gst_settings
      SET setting_value = ?
      WHERE setting_key = ?
      `,
      [
        newValue,
        setting_key,
      ]
    );

    // =====================================================
    // RULE: onDisable
    //
    // If GST is turned OFF:
    //
    // HSN/SAC = OFF
    // Place of Supply = OFF
    // =====================================================

    if (
      rule?.onDisable?.length &&
      newValue === 0
    ) {
      const placeholders =
        rule.onDisable
          .map(() => "?")
          .join(",");

      await connection.execute(
        `
        UPDATE taxes_and_gst_settings
        SET setting_value = 0
        WHERE setting_key IN (${placeholders})
        `,
        rule.onDisable
      );
    }

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
      FROM taxes_and_gst_settings
      WHERE is_active = 1
      ORDER BY sort_order ASC
      `
    );

    return res.status(200).json({
      success: true,
      message:
        "Tax/GST setting updated successfully",
      settings: rows,
    });
  } catch (err) {
    if (connection) {
      await connection.rollback();
    }

    console.error(
      "❌ Error updating Taxes/GST setting:",
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
  getAllTaxesAndGSTSettings,
  updateTaxesAndGSTSetting,
};