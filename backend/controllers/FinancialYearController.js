
import db from "../config/db.js";
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

export {addFinancialYear,getAllFinancialYears,updateCurrentFinancialYear}