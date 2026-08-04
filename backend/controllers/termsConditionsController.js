import db from "../config/db.js";

/* ═══════════════════════════════════════
   CREATE
═══════════════════════════════════════ */
const createTerms = async (req, res, next) => {
  try {
    const {
      Title,
      Terms,
      Sale_Invoice       = 0,
      //Sale_Order         = 0,
      //Delivery_Challan   = 0,
      //Estimation_Quotation = 0,
      Purchase_Bill      = 0,
      //Purchase_Order     = 0,
      //Proforma_Invoice   = 0,
    } = req.body;

    if (!Title?.trim() || !Terms?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title and Terms are required.",
      });
    }

    const [result] = await db.query(
      `INSERT INTO terms_conditions
       (Title, Terms, Sale_Invoice, 
        Purchase_Bill)
       VALUES (?, ?, ?, ?)`,
      [
        Title.trim(),
        Terms.trim(),
        Sale_Invoice       ? 1 : 0,
        
       
      
        Purchase_Bill      ? 1 : 0,
       
      ]
    );

    res.status(201).json({
      success: true,
      message: "Terms & Conditions created",
      id: result.insertId,
    });
  } catch (err) {
    console.error("❌ createTerms:", err);
    next(err);
  }
};

// /* ═══════════════════════════════════════
//    EDIT
// ═══════════════════════════════════════ */
//  const editTerms = async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     const {
//       Title,
//       Terms,
//       Sale_Invoice       = 0,
//       Sale_Order         = 0,
//       Delivery_Challan   = 0,
//       Estimation_Quotation = 0,
//       Purchase_Bill      = 0,
//       Purchase_Order     = 0,
//       Proforma_Invoice   = 0,
//     } = req.body;

//     if (!Title?.trim() || !Terms?.trim()) {
//       return res.status(400).json({
//         success: false,
//         message: "Title and Terms are required.",
//       });
//     }

//     const [[existing]] = await db.query(
//       `SELECT id FROM terms_conditions WHERE id = ?`,
//       [id]
//     );
//     if (!existing) {
//       return res.status(404).json({
//         success: false,
//         message: "Terms & Conditions not found.",
//       });
//     }

//     await db.query(
//       `UPDATE terms_conditions SET
//          Title = ?, Terms = ?,
//          Sale_Invoice = ?, Sale_Order = ?, Delivery_Challan = ?,
//          Estimation_Quotation = ?, Purchase_Bill = ?,
//          Purchase_Order = ?, Proforma_Invoice = ?,
//          updated_at = NOW()
//        WHERE id = ?`,
//       [
//         Title.trim(),
//         Terms.trim(),
//         Sale_Invoice       ? 1 : 0,
//         Sale_Order         ? 1 : 0,
//         Delivery_Challan   ? 1 : 0,
//         Estimation_Quotation ? 1 : 0,
//         Purchase_Bill      ? 1 : 0,
//         Purchase_Order     ? 1 : 0,
//         Proforma_Invoice   ? 1 : 0,
//         id,
//       ]
//     );

//     res.status(200).json({ success: true, message: "Terms & Conditions updated" });
//   } catch (err) {
//     console.error("❌ editTerms:", err);
//     next(err);
//   }
// };

// /* ═══════════════════════════════════════
//    DELETE
// ═══════════════════════════════════════ */
//  const deleteTerms = async (req, res, next) => {
//   try {
//     const { id } = req.params;

//     // 🔹 nullify FK references before deleting
//     await db.query(`UPDATE add_sale     SET Terms_Id = NULL WHERE Terms_Id = ?`, [id]);
//     await db.query(`UPDATE add_purchase SET Terms_Id = NULL WHERE Terms_Id = ?`, [id]);

//     await db.query(`DELETE FROM terms_conditions WHERE id = ?`, [id]);

//     res.status(200).json({ success: true, message: "Terms & Conditions deleted" });
//   } catch (err) {
//     console.error("❌ deleteTerms:", err);
//     next(err);
//   }
// };

/* ═══════════════════════════════════════
   GET ALL
   Optional filter: ?applicable=Sale_Invoice
   Returns only terms where that flag = 1
═══════════════════════════════════════ */
const getAllTerms = async (req, res, next) => {
  try {
    const applicable = req.query.applicable || null;

    // const VALID_FLAGS = [
    //   "Sale_Invoice", "Sale_Order", "Delivery_Challan",
    //   "Estimation_Quotation", "Purchase_Bill",
    //   "Purchase_Order", "Proforma_Invoice",
    // ];

    const VALID_FLAGS = [
      "Sale_Invoice", 
      "Purchase_Bill"
      
    ];

    let whereSQL = "";
    //et params   = [];

    if (applicable && VALID_FLAGS.includes(applicable)) {
      whereSQL = `WHERE ${applicable} = 1`;
    }

    const [templates] = await db.query(
      `SELECT * FROM terms_conditions ${whereSQL} ORDER BY created_at DESC`,
    
    );

    res.status(200).json({ success: true, templates });
  } catch (err) {
    console.error("❌ getAllTerms:", err);
    next(err);
  }
};
// const getAllTerms = async (req, res, next) => {
//   let connection;
//   try {
//     connection = await db.getConnection();

//     const [templates] = await connection.query(
//       `SELECT
//          Terms_Condition_Id,
//          Title,
//          Description,
//          Applicable_Sale,
//          Applicable_Purchase,
//          Applicable_Sale_Return,
//          Applicable_Purchase_Return,
//          Applicable_Quotation,
//          Created_At
//        FROM terms_conditions
//        ORDER BY Title ASC`
//     );

//     return res.status(200).json({
//       success: true,
//       templates,
//     });
//   } catch (err) {
//     console.error("❌ getAllTermsConditions Error:", err);
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };
/* ═══════════════════════════════════════
   GET SINGLE
═══════════════════════════════════════ */
 const getTermsById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [[terms]] = await db.query(
      `SELECT * FROM terms_conditions WHERE id = ?`,
      [id]
    );
    if (!terms) {
      return res.status(404).json({ success: false, message: "Not found." });
    }
    res.status(200).json({ success: true, terms });
  } catch (err) {
    console.error("❌ getTermsById:", err);
    next(err);
  }
};

export { createTerms, getAllTerms, getTermsById };

// CREATE TABLE terms_conditions (
//   id            INT AUTO_INCREMENT PRIMARY KEY,
//   Title         VARCHAR(255) NOT NULL,
//   Terms         TEXT NOT NULL,
//   -- applicable flags
//   Sale_Invoice       TINYINT(1) DEFAULT 0,
//   Sale_Order         TINYINT(1) DEFAULT 0,
//   Delivery_Challan   TINYINT(1) DEFAULT 0,
//   Estimation_Quotation TINYINT(1) DEFAULT 0,
//   Purchase_Bill      TINYINT(1) DEFAULT 0,
//   Purchase_Order     TINYINT(1) DEFAULT 0,
//   Proforma_Invoice   TINYINT(1) DEFAULT 0,
//   created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//   updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
// );

// -- FK on sale and purchase to link a terms & conditions record
// ALTER TABLE add_sale     ADD COLUMN Terms_Id INT NULL, ADD FOREIGN KEY (Terms_Id) REFERENCES terms_conditions(id);
// ALTER TABLE add_purchase ADD COLUMN Terms_Id INT NULL, ADD FOREIGN KEY (Terms_Id) REFERENCES terms_conditions(id);