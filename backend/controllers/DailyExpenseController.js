import db from "../config/db.js";
import { sanitizeObject } from "../utils/sanitizeInput.js";
import { dailyExpenseSchema } from "../validators/dailyExpenseSchema.js";


const addDailyExpense = async (req, res, next) => {
  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Validate with Zod
    const cleanData = sanitizeObject(req.body);
    const validation = dailyExpenseSchema.safeParse(cleanData);

    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.errors });
    }

    const { Date, Purpose, Amount, Payment_Method, Paid_Via } = validation.data;

    // Additional safety check
    if (!Date || !Purpose || !Amount || !Payment_Method || !Paid_Via) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Generate new Expense_Id
    const [last] = await connection.query(
      `SELECT MAX(CAST(SUBSTRING(Expense_Id, 4) AS UNSIGNED)) AS lastExpenseId 
       FROM daily_expense`
    );

    const nextId = (last[0]?.lastExpenseId || 0) + 1;
    const newExpenseId = "EXP" + nextId.toString().padStart(3, "0");

    // INSERT Query — FIXED
    await connection.query(
      `INSERT INTO daily_expense 
        (Expense_Id, Date, Purpose, Amount, Payment_Method, Paid_Via, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [newExpenseId, Date, Purpose, Amount, Payment_Method, Paid_Via]
    );

    await connection.commit();

    return res.status(201).json({   
      success: true,message: "Expense added successfully",
       expenseId: newExpenseId 
    });

  } catch (err) {
    if (connection) await connection.rollback();
    console.error("❌ Error adding expense:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

const getAllExpenses = async (req, res, next) => {
  let connection;

  try {
    connection = await db.getConnection();

    const page = parseInt(req.query.page, 10) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const search = req.query.search ? req.query.search.trim().toLowerCase() : "";
    const fromDate = req.query.fromDate || null;
    const toDate = req.query.toDate || null;

    let whereClauses = [];
    let params = [];

    // 🔍 SEARCH on Purpose, Payment_Mode, Paid_Via
    if (search) {
      whereClauses.push(`
        (LOWER(Purpose) LIKE ? 
         OR LOWER(Payment_Mode) LIKE ? 
         OR LOWER(Paid_Via) LIKE ?)
      `);
      const like = `%${search}%`;
      params.push(like, like, like);
    }

    // 📅 DATE RANGE FILTER
    if (fromDate && toDate) {
      whereClauses.push("DATE(Date) BETWEEN ? AND ?");
      params.push(fromDate, toDate);
    } else if (fromDate) {
      whereClauses.push("DATE(Date) >= ?");
      params.push(fromDate);
    } else if (toDate) {
      whereClauses.push("DATE(Date) <= ?");
      params.push(toDate);
    }

    // Combine WHERE SQL
    const whereSQL = whereClauses.length ? "WHERE " + whereClauses.join(" AND ") : "";

    //1️⃣ COUNT QUERY
    const [countRows] = await connection.query(
      `SELECT COUNT(*) AS total FROM daily_expense ${whereSQL}`,
      params
    );

    // 2️⃣ DATA QUERY (add pagination params)
    const dataParams = [...params, limit, offset];

    const [rows] = await connection.query(
      `
      SELECT 
        Expense_Id,
        DATE_FORMAT(Date, '%Y-%m-%d') AS Date,
        Purpose,
        Amount,
        Payment_Method,
        Paid_Via
      FROM daily_expense
      ${whereSQL}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
      `,
      dataParams
    );

    return res.status(200).json({
      success: true,
      currentPage: page,
      totalPages: Math.ceil(countRows[0].total / limit),
      totalDailyExpenses: countRows[0].total,
      dailyExpenses: rows,
    });

  } catch (err) {
    console.error("❌ Error getting all expenses:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

// const getSingleExpenseById=async(req,res,next)=>{
//   let connection;
//   try{
//     connection=await db.getConnection();
//     console.log(req.body)
//     const {expenseId}= req.body

//    const [rows] = await connection.query(`
//   SELECT 
//     Expense_Id,
//     DATE_FORMAT(Date, '%Y-%m-%d') AS Date,
//     Purpose,
//     Amount,
//     Payment_Method,
//     Paid_Via
//   FROM daily_expense
//   WHERE Expense_Id = ?`,
//   [expenseId]
// );

// return res.status(200).json(rows);

   

//   }catch(err){
//     if(connection) connection.release();
//     console.error("❌ Error getting single expense:", err);
//     next(err);
//   }finally{
//     if(connection) connection.release();
//   }
// }

const editSingleDailyExpense=async(req,res,next)=>{
  let connection;
  try{
    connection=await db.getConnection();
    const {expenseId,Date,Purpose,Amount,Payment_Method,Paid_Via}=req.body
    await connection.query(`UPDATE daily_expense SET Date=?,Purpose=?,Amount=?,
      Payment_Method=?,Paid_Via=? WHERE Expense_Id=?`,
      [Date,Purpose,Amount,Payment_Method,Paid_Via,expenseId])
    return res.status(200).json({success:true,message:"Expense updated successfully"})
  }catch(err){
    if(connection) connection.release();
    console.error("❌ Error updating expense:", err);
    next(err);
  }finally{
    if(connection) connection.release();
  }
}


export{addDailyExpense,getAllExpenses,editSingleDailyExpense}