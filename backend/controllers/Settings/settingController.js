
import db from "../../config/db.js";
const addFinancialYear = async (req, res, next) => {
  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const { financialYear, startDate, endDate } = req.body;

   
    if (!financialYear || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Financial year, start date and end date are required",
      });
    }

  
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Start Date and End Date must be valid dates",
      });
    }

 
    if (start > end) {
      return res.status(400).json({
        success: false,
        message: "Start date cannot be greater than end date",
      });
    }

    const[existingFinancialYear]=await connection.query("SELECT * FROM financial_year WHERE financial_year=?",[financialYear]);
    if (existingFinancialYear.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Financial year already exists, please add a different one",
      });
    }
    // --------------------------------
    // 🟢 4. Insert into database
    // --------------------------------
    const [rows] = await connection.query(
      `
        INSERT INTO financial_year 
        (financial_year, Start_Date, End_Date, Current_Financial_Year, created_at, updated_at)
        VALUES (?, ?, ?, 0, NOW(), NOW())
      `,
      [financialYear, startDate, endDate]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Financial year added successfully",
      insertedId: rows.insertId,
    });

  } catch (err) {
    if (connection) await connection.rollback();
    console.error("❌ Error adding financial year:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};


const getAllFinancialYears = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();
    // const [rows] = await connection.query("SELECT * FROM financial_year");
    const [rows] = await connection.query(`
  SELECT 
    id,
    Financial_Year,
    DATE_FORMAT(Start_Date, '%Y-%m-%d') AS Start_Date,
    DATE_FORMAT(End_Date, '%Y-%m-%d') AS End_Date,
    Current_Financial_Year,
    created_at,
    updated_at
  FROM financial_year
`);
    return res.status(200).json(rows);
  } catch (err) {
    if (connection) connection.release();
    console.error("❌ Error getting all financial years:", err);
    next(err);
  }finally {
    if (connection) connection.release();
  }
}
const updateCurrentFinancialYear = async (req, res, next) => {
  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const { financialYearId } = req.body;

    if (!financialYearId) {
      return res.status(400).json({
        success: false,
        message: "Financial Year ID is required",
      });
    }

    // Step 1: Set all to 0
    await connection.query(`
      UPDATE financial_year SET Current_Financial_Year = 0
    `);

    // Step 2: Set selected one to 1
    const [result] = await connection.query(
      `
      UPDATE financial_year 
      SET Current_Financial_Year = 1
      WHERE id = ?
      `,
      [financialYearId]
    );

    await connection.commit();
    return res.status(200).json({
      success: true,
      message: "Current Financial Year updated successfully",
    });

  } catch (err) {
    if (connection) await connection.rollback();
    console.error(err);
    return next(err);
  } finally {
    if (connection) connection.release();
  }
};

// settingsController.js


// =========================================================
// LINKED SETTINGS RULES CONFIG
// Add new rules here — no need to touch updateSetting logic
// =========================================================
const SETTING_RULES = {
  show_mrp: {
    onDisable: ['calculate_sale_price_from_mrp_disc'], // cascade off when this turns off
  },
  calculate_sale_price_from_mrp_disc: {
    requiresEnabled: ['show_mrp'], // can't turn this on unless these are already on
  },
  barcode_scan: {
    onDisable: ["direct_barcode_scan"],
  },

  direct_barcode_scan: {
    requiresEnabled: ["barcode_scan"],
  },
  // future example:
  // enable_gst: {
  //   onDisable: ['show_gst_breakup', 'auto_calculate_gst'],
  // },
  // show_discount_column: {
  //   requiresEnabled: ['show_mrp'],
  // },
};

// =========================================================
// GET ALL SETTINGS (active only, ordered)
// =========================================================
const getAllSettings = async (req, res, next) => {
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
      FROM app_settings
      WHERE is_active = 1
      ORDER BY sort_order ASC
      `
    );

    return res.status(200).json({
      success: true,
      settings: rows,
    });
  } catch (err) {
    console.error("❌ Error fetching settings:", err);
    next(err);
  }
};

// =========================================================
// UPDATE A SINGLE SETTING (toggle on/off)
// =========================================================
const updateSetting = async (req, res, next) => {
  let connection;

  try {
    const { setting_key } = req.params;
    const { setting_value } = req.body; // expects 0 or 1
    const newValue = Number(setting_value);

    if (![0, 1].includes(newValue)) {
      return res.status(400).json({
        success: false,
        message: "setting_value must be 0 or 1",
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // lock the target row while we work with it
    const [[targetSetting]] = await connection.query(
      `SELECT setting_key, setting_value FROM app_settings WHERE setting_key = ? LIMIT 1 FOR UPDATE`,
      [setting_key]
    );

    if (!targetSetting) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: "Setting not found",
      });
    }

    const rule = SETTING_RULES[setting_key];

    // =====================================================
    // RULE: requiresEnabled — block turning this ON unless
    // all listed dependencies are already ON
    // =====================================================
    if (rule?.requiresEnabled?.length && newValue === 1) {
      const placeholders = rule.requiresEnabled.map(() => "?").join(",");
      const [depRows] = await connection.query(
        `SELECT setting_key, setting_value FROM app_settings WHERE setting_key IN (${placeholders}) FOR UPDATE`,
        rule.requiresEnabled
      );

      const disabledDep = rule.requiresEnabled.find((key) => {
        const dep = depRows.find((r) => r.setting_key === key);
        return !dep || Number(dep.setting_value) === 0;
      });

      if (disabledDep) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: `Enable "${disabledDep}" before turning on this setting.`,
        });
      }
    }

    // update the target setting itself
    await connection.execute(
      `UPDATE app_settings SET setting_value = ? WHERE setting_key = ?`,
      [newValue, setting_key]
    );

    // =====================================================
    // RULE: onDisable — cascade OFF dependent settings when
    // this setting is turned OFF
    // =====================================================
    if (rule?.onDisable?.length && newValue === 0) {
      const placeholders = rule.onDisable.map(() => "?").join(",");
      await connection.execute(
        `UPDATE app_settings SET setting_value = 0 WHERE setting_key IN (${placeholders})`,
        rule.onDisable
      );
    }

    await connection.commit();

    // return the fresh full list so the frontend can sync all toggles at once
    const [rows] = await db.query(
      `
      SELECT id, setting_key, setting_value, setting_label, description, sort_order
      FROM app_settings
      WHERE is_active = 1
      ORDER BY sort_order ASC
      `
    );

    return res.status(200).json({
      success: true,
      message: "Setting updated successfully",
      settings: rows,
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("❌ Error updating setting:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};



export {addFinancialYear,getAllFinancialYears,updateCurrentFinancialYear,updateSetting,getAllSettings};