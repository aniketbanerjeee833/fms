
import db from "../config/db.js";

const addUnit = async (req, res) => {
  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const { Unit_Name, Unit_Shorthand } = req.body;

    /* ---------- VALIDATION ---------- */
    if (!Unit_Name) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Unit name is required",
      });
    }

    /* ---------- CHECK DUPLICATE ---------- */
    const [existingUnit] = await connection.query(
      `SELECT 1 FROM units WHERE Unit_Name = ? LIMIT 1`,
      [Unit_Name]
    );

    if (existingUnit.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Unit name already exists",
      });
    }

    /* ---------- GENERATE ID ---------- */
    let newId = "UNT001";
    const [last] = await connection.query(
      `SELECT Unit_Id FROM units ORDER BY id DESC LIMIT 1`
    );

    if (last.length > 0) {
      const lastId = last[0].Unit_Id;
      const num = parseInt(lastId.replace("UNT", ""), 10) + 1;
      newId = "UNT" + num.toString().padStart(3, "0");
    }

    /* ---------- INSERT ---------- */
    await connection.query(
      `INSERT INTO units (Unit_Name, Unit_Shorthand, Unit_Id)
       VALUES (?, ?, ?)`,
      [Unit_Name, Unit_Shorthand, newId]
    );

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Unit added successfully",
      data: {
        Unit_Name,
        Unit_Shorthand,
        Unit_Id: newId,
      },
    });

  } catch (err) {
    if (connection) await connection.rollback();

    console.error("❌ Error adding unit:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to add unit",
    });
  } finally {
    if (connection) connection.release();
  }
};
        
const getAllUnits = async (req, res, next) => {
    let connection;
    try {
        connection = await db.getConnection();
        const [results] = await db.query(`SELECT Unit_Name ,Unit_Shorthand FROM units`);

        const finalData=[];
        results.forEach((item) => {
            finalData.push({
                Unit_Name: item.Unit_Name,
                Unit_Shorthand: item.Unit_Shorthand,
            });
        })
        return res.status(200).json(results);
    } catch (err) {
        console.error("❌ Error getting units:", err);
        next(err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

export { addUnit, getAllUnits };