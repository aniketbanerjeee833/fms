
import db from "../config/db.js";
import { recordPartyLedger, reversePartyLedger } from "../utils/partyLedgerHelper.js";
import { sanitizeObject } from "../utils/sanitizeInput.js";
import partySchema from "../validators/partySchema.js";

import PdfPrinter from "pdfmake";
const cleanValue = (value) => {
  if (value === undefined || value === null || value === "" || value === " ") {
    return null; // store as NULL in DB
  }
  return value;  // ✅ returns the original value for valid data
};


const addParty = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const cleanData = sanitizeObject(req.body);
    const validation = partySchema.safeParse(cleanData);
    if (!validation.success) {
      await connection.rollback();
      return res.status(400).json({ errors: validation.error.errors });
    }

    const {
      Party_Name,
      GSTIN,
      Phone_Number,
      State,
      Email_Id,
      addresses,
      Opening_Balance,
      Opening_Balance_Type,
      Opening_Balance_Date,
      Credit_Limit_Type,
      Credit_Limit,
    } = validation.data;

    if (!Party_Name) {
      await connection.rollback();
      return res.status(400).json({ message: "Party name is required" });
    }

    // 🔥 Duplicate GSTIN/Phone check
    const [existingParty] = await connection.query(
      `SELECT Party_Id FROM add_party 
       WHERE GSTIN = ? OR Phone_Number = ?
       LIMIT 1`,
      [GSTIN, Phone_Number]
    );

    if (existingParty.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        message: "GSTIN or Phone Number already exists for another party",
      });
    }

    // 🔥 Duplicate party name check
    const [existingName] = await connection.query(
      `SELECT Party_Id FROM add_party 
       WHERE TRIM(Party_Name) = TRIM(?)
       LIMIT 1`,
      [Party_Name]
    );

    if (existingName.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        message: "Party name already exists",
      });
    }

    // Generate Party_Id
    const [last] = await connection.query(
      "SELECT Party_Id FROM add_party ORDER BY id DESC LIMIT 1"
    );

    let newId = "PTY001";
    if (last.length > 0) {
      const lastId = last[0].Party_Id;
      const num = parseInt(lastId.replace("PTY", "")) + 1;
      newId = "PTY" + num.toString().padStart(3, "0");
    }

    const cleanValue = (val) =>
      val !== undefined && val !== null && String(val).trim() !== "" ? val : null;

    const hasOpeningBalance = Opening_Balance !== null;
    const todayDate = new Date().toISOString().slice(0, 10);

    const [result] = await connection.execute(
      `INSERT INTO add_party 
       (Party_Id, Party_Name, GSTIN, Phone_Number, State, Email_Id,
        Opening_Balance, Opening_Balance_Type, Opening_Balance_Date,
        Credit_Limit_Type, Credit_Limit)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId,
        Party_Name,
        cleanValue(GSTIN),
        cleanValue(Phone_Number),
        cleanValue(State),
        cleanValue(Email_Id),

        hasOpeningBalance ? Opening_Balance : null,
        hasOpeningBalance ? Opening_Balance_Type : null,
        hasOpeningBalance ? (Opening_Balance_Date || todayDate) : null,

        Credit_Limit_Type || "No_Limit",
        Credit_Limit_Type === "Custom" ? Credit_Limit : null,
      ]
    );

    // 🔹 ADDRESSES — skip blank ones; last one of each type wins as default
    const realAddresses = (addresses || []).filter((a) => a.Address_Text?.trim());

    // find the LAST index for each type, among real addresses
    const lastIndexByType = {};
    realAddresses.forEach((a, i) => {
      lastIndexByType[a.Address_Type] = i;
    });

    for (let i = 0; i < realAddresses.length; i++) {
      const addr = realAddresses[i];
      const isDefault = i === lastIndexByType[addr.Address_Type];

      await connection.query(
        `INSERT INTO add_party_addresses (Party_Id, Address_Type, Address_Text, Is_Default)
         VALUES (?, ?, ?, ?)`,
        [newId, addr.Address_Type, addr.Address_Text.trim(), isDefault ? 1 : 0]
      );
    }

    // 🔹 seed the ledger only if Opening Balance was touched
    if (hasOpeningBalance) {
      await recordPartyLedger({
        connection,
        partyId: newId,
        txnType: "Opening_Balance",
        referenceId: result.insertId,
        amount: Opening_Balance,
        txnDate: Opening_Balance_Date || todayDate,
        directionOverride: Opening_Balance_Type === "To_Receive" ? "Credit" : "Debit",
      });
    }

    await connection.commit();
    return res.status(201).json({
      message: "Party added successfully",
      success: true,
      id: result.insertId,
      Party_Id: newId,
      Party_Name,
      GSTIN,
      Phone_Number,
      State,
      Email_Id,
      addresses: realAddresses,
      Opening_Balance,
      Opening_Balance_Type,
      Opening_Balance_Date,
      Credit_Limit_Type,
      Credit_Limit,
    });
  } catch (err) {
    if (connection) {
      await connection.rollback();
    }
    console.error("❌ Error adding party:", err);
    next(err);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};
// const addParty = async (req, res, next) => {
//   let connection;
//   try {
  

//     connection = await db.getConnection();
//     await connection.beginTransaction();
//     const cleanData = sanitizeObject(req.body);
//     const validation = partySchema.safeParse(cleanData);
//     if (!validation.success) {
//       return res.status(400).json({ errors: validation.error.errors });
//     }
//     // const {
//     //   Party_Name,
//     //   GSTIN,
//     //   Phone_Number,
     
//     //   State,
//     //   Email_Id,
//     //   Billing_Address,
//     //   Shipping_Address,
      
//     // } = validation.data;
//     const {
//   Party_Name, GSTIN, Phone_Number, State, Email_Id,
//   Billing_Address, Shipping_Address,
//   Opening_Balance, Opening_Balance_Type, Opening_Balance_Date,
//   Credit_Limit_Type, Credit_Limit,
// } = validation.data;

//     if (!Party_Name) {
//       await connection.rollback();
//       return res.status(400).json({ message: "Party name is required" });
//     }
// // 🔥 Correct duplicate check
// const [existingParty] = await db.query(
//   `SELECT Party_Id FROM add_party 
//    WHERE GSTIN = ? OR Phone_Number = ?
//    LIMIT 1`,
//   [GSTIN, Phone_Number]
// );

// if (existingParty.length > 0) {
//   await connection.rollback();
//   return res.status(400).json({
//     message: "GSTIN or Phone Number already exists for another party",
//   });
// }
// // 🔥 Duplicate party name check (case-insensitive, trimmed)
// const [existingName] = await db.query(
//   `SELECT Party_Id FROM add_party 
//    WHERE LOWER(TRIM(Party_Name)) = LOWER(TRIM(?))
//    LIMIT 1`,
//   [Party_Name]
// );

// if (existingName.length > 0) {
//   await connection.rollback();
//   return res.status(400).json({
//     message: "Party name already exists",
//   });
// }

//   // const [existingParty] = await db.query(
//   //     "SELECT Party_Id, GSTIN, Phone_Number FROM add_party "
//   //   );

//   //    if(existingParty[0].GSTIN === GSTIN || existingParty[0].Phone_Number === Phone_Number){
//   //     await connection.rollback();
//   //     return res.status(400).json({ message: "GSTIN or Phone Number for another party already exists" });
//   //   }
//     // Get last party code
//     const [last] = await db.query(
//       "SELECT Party_Id FROM add_party ORDER BY id DESC LIMIT 1"
//     );

   
//     let newId = "PTY001";
//     if (last.length > 0) {
//       const lastId = last[0].Party_Id; // e.g. "PTY005"
//       const num = parseInt(lastId.replace("PTY", "")) + 1;
//       newId = "PTY" + num.toString().padStart(3, "0");
//     }
//   const cleanValue = (val) =>
//     val !== undefined && val !== null && String(val).trim() !== "" ? val : null;
//     // Insert into DB
//     const [result] = await db.execute(
//       `INSERT INTO add_party 
//        (Party_Id, Party_Name, GSTIN, Phone_Number,  State, Email_Id, Billing_Address, Shipping_Address)
//        VALUES (?, ?, ?, ?, ?, ?, ?,?)`,
//       [
//         newId,
//         Party_Name,
//         cleanValue(GSTIN),
//         cleanValue(Phone_Number),
      
//         cleanValue(State),
//         cleanValue(Email_Id),
//         cleanValue(Billing_Address),
//         cleanValue(Shipping_Address),
        
//       ]
//     );

//       await connection.commit();
//     return res.status(201).json({
//       message: "Party added successfully",
//       success: true,
//       id: result.insertId, // auto-increment primary key
//       Party_Id: newId,     // custom party code
//       Party_Name,
//       GSTIN,
//       Phone_Number,
     
//       State,
//       Email_Id,
//       Billing_Address,
//       Shipping_Address,
     
//     });
//   } catch (err) {
//     if (connection) {
//       await connection.rollback();
//     }
//     console.error("❌ Error adding party:", err);
//     next(err);
//     // return res.status(500).json({ message: "Internal Server Error" });
//   }finally {
//     if (connection) {
//       connection.release();
//     }
//   }
// };

const editParty = async (req, res, next) => {
  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // ─────────────────────────────────────
    // VALIDATION
    // ─────────────────────────────────────
    const cleanData = sanitizeObject(req.body);
    const validation = partySchema.safeParse(cleanData);

    if (!validation.success) {
      await connection.rollback();

      return res.status(400).json({
        errors: validation.error.errors,
      });
    }

    const {
      Party_Name,
      GSTIN,
      Phone_Number,
      State,
      Email_Id,

      addresses,

      Opening_Balance,
      Opening_Balance_Type,
      Opening_Balance_Date,

      Credit_Limit_Type,
      Credit_Limit,
    } = validation.data;

    const { Party_Id: partyId } = req.params;

    if (!Party_Name) {
      await connection.rollback();

      return res.status(400).json({
        message: "Party name is required",
      });
    }

    // ─────────────────────────────────────
    // CHECK PARTY EXISTS
    // ─────────────────────────────────────
    const [[partyRow]] = await connection.query(
      `SELECT id
       FROM add_party
       WHERE Party_Id = ?
       LIMIT 1`,
      [partyId]
    );

    if (!partyRow) {
      await connection.rollback();

      return res.status(404).json({
        message: "Party not found",
      });
    }

    // ─────────────────────────────────────
    // DUPLICATE PARTY NAME
    // ─────────────────────────────────────
    const [existingName] = await connection.query(
      `SELECT Party_Id
       FROM add_party
       WHERE TRIM(Party_Name) = TRIM(?)
         AND Party_Id != ?
       LIMIT 1`,
      [Party_Name, partyId]
    );

    if (existingName.length > 0) {
      await connection.rollback();

      return res.status(400).json({
        message: "Party name already exists",
      });
    }

    // ─────────────────────────────────────
    // DUPLICATE GSTIN / PHONE
    // ─────────────────────────────────────
    // if (GSTIN || Phone_Number) {
    //   const conditions = [];
    //   const params = [];

    //   if (GSTIN) {
    //     conditions.push("GSTIN = ?");
    //     params.push(GSTIN);
    //   }

    //   if (Phone_Number) {
    //     conditions.push("Phone_Number = ?");
    //     params.push(Phone_Number);
    //   }

    //   params.push(partyId);

    //   const [existingParty] = await connection.query(
    //     `SELECT Party_Id
    //      FROM add_party
    //      WHERE (${conditions.join(" OR ")})
    //        AND Party_Id != ?
    //      LIMIT 1`,
    //     params
    //   );

    //   if (existingParty.length > 0) {
    //     await connection.rollback();

    //     return res.status(400).json({
    //       message:
    //         "GSTIN or Phone Number already exists for another party",
    //     });
    //   }
    // }

    const cleanValue = (val) =>
      val !== undefined &&
      val !== null &&
      String(val).trim() !== ""
        ? val
        : null;

    const hasOpeningBalance = Opening_Balance !== null;

    const todayDate = new Date()
      .toISOString()
      .slice(0, 10);

    // ─────────────────────────────────────
    // UPDATE PARTY MASTER
    // ─────────────────────────────────────
    await connection.execute(
      `UPDATE add_party
       SET
         Party_Name = ?,
         GSTIN = ?,
         Phone_Number = ?,
         State = ?,
         Email_Id = ?,

         Opening_Balance = ?,
         Opening_Balance_Type = ?,
         Opening_Balance_Date = ?,

         Credit_Limit_Type = ?,
         Credit_Limit = ?,

         updated_at = NOW()

       WHERE Party_Id = ?`,
      [
        Party_Name,
        cleanValue(GSTIN),
        cleanValue(Phone_Number),
        cleanValue(State),
        cleanValue(Email_Id),

        hasOpeningBalance
          ? Opening_Balance
          : null,

        hasOpeningBalance
          ? Opening_Balance_Type
          : null,

        hasOpeningBalance
          ? Opening_Balance_Date || todayDate
          : null,

        Credit_Limit_Type || "No_Limit",

        Credit_Limit_Type === "Custom"
          ? Credit_Limit
          : null,

        partyId,
      ]
    );

    // ─────────────────────────────────────
    // ADDRESSES
    // ─────────────────────────────────────

    // Ignore opened-but-empty address boxes
    const realAddresses = (addresses || []).filter(
      (address) => address.Address_Text?.trim()
    );

    
    // Remove existing addresses
    await connection.execute(
      `DELETE FROM add_party_addresses
       WHERE Party_Id = ?`,
      [partyId]
    );

    // Reinsert exactly according to user's selection
    for (const address of realAddresses) {
      await connection.execute(
        `INSERT INTO add_party_addresses
         (
           Party_Id,
           Address_Type,
           Address_Text,
           Is_Default
         )
         VALUES (?, ?, ?, ?)`,
        [
          partyId,
          address.Address_Type,
          address.Address_Text.trim(),

          //  USER CONTROLS DEFAULT
          address.Is_Default === true ? 1 : 0,
        ]
      );
    }

    // ─────────────────────────────────────
    // OPENING BALANCE LEDGER
    // ─────────────────────────────────────
    if (hasOpeningBalance) {
      await recordPartyLedger({
        connection,

        partyId,

        txnType: "Opening_Balance",

        referenceId: partyRow.id,

        amount: Opening_Balance,

        txnDate:Opening_Balance_Date || todayDate,

        directionOverride:Opening_Balance_Type === "To_Receive"
            ? "Credit"
            : "Debit",
      });

    } else {
      // Opening balance completely removed
      await reversePartyLedger({
        connection,

        partyId,

        txnType: "Opening_Balance",

        referenceId: partyRow.id,
      });
    }

    // ─────────────────────────────────────
    // COMMIT
    // ─────────────────────────────────────
    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Party updated successfully",

      Party_Id: partyId,

      Party_Name,
      GSTIN,
      Phone_Number,
      State,
      Email_Id,

      addresses: realAddresses,

      Opening_Balance:
        hasOpeningBalance
          ? Opening_Balance
          : null,

      Opening_Balance_Type:
        hasOpeningBalance
          ? Opening_Balance_Type
          : null,

      Opening_Balance_Date:
        hasOpeningBalance
          ? Opening_Balance_Date || todayDate
          : null,

      Credit_Limit_Type:
        Credit_Limit_Type || "No_Limit",

      Credit_Limit:
        Credit_Limit_Type === "Custom"
          ? Credit_Limit
          : null,
    });

  } catch (err) {
    if (connection) {
      await connection.rollback();
    }

    console.error("❌ Error updating party:", err);

    next(err);

  } finally {
    if (connection) {
      connection.release();
    }
  }
};
// const editParty = async (req, res, next) => {
//   let connection;
//   try {
//     connection = await db.getConnection();
//     await connection.beginTransaction();

//     const cleanData = sanitizeObject(req.body);
//     const validation = partySchema.safeParse(cleanData);
//     if (!validation.success) {
//       await connection.rollback();
//       return res.status(400).json({ errors: validation.error.errors });
//     }

//     const {
//       Party_Name,
//       GSTIN,
//       Phone_Number,
//       State,
//       Email_Id,
//       Billing_Address,
//       Shipping_Address,
//       Opening_Balance,
//       Opening_Balance_Type,
//       Opening_Balance_Date,
//       Credit_Limit_Type,
//       Credit_Limit,
//     } = validation.data;

//     if (!Party_Name) {
//       await connection.rollback();
//       return res.status(400).json({ message: "Party name is required" });
//     }

//     const { Party_Id: partyId } = req.params;

//     // 🔥 fetch the party's numeric PK — needed as referenceId for the ledger
//     const [[partyRow]] = await connection.query(
//       `SELECT id FROM add_party WHERE Party_Id = ?`,
//       [partyId]
//     );

//     if (!partyRow) {
//       await connection.rollback();
//       return res.status(404).json({ message: "Party not found" });
//     }

//     // 🔥 Duplicate party name check (excluding this party itself)
//     const [existingName] = await connection.query(
//       `SELECT Party_Id FROM add_party 
//        WHERE TRIM(Party_Name) = TRIM(?) AND Party_Id != ?
//        LIMIT 1`,
//       [Party_Name, partyId]
//     );

//     if (existingName.length > 0) {
//       await connection.rollback();
//       return res.status(400).json({
//         message: "Party name already exists",
//       });
//     }

//     const cleanValue = (val) =>
//       val !== undefined && val !== null && String(val).trim() !== "" ? val : null;

//     const hasOpeningBalance = Opening_Balance !== null;
//     const todayDate = new Date().toISOString().slice(0, 10);

//     await connection.execute(
//       `UPDATE add_party 
//        SET Party_Name = ?, GSTIN = ?, Phone_Number = ?, State = ?, Email_Id = ?,
//            Billing_Address = ?, Shipping_Address = ?,
//            Opening_Balance = ?, Opening_Balance_Type = ?, Opening_Balance_Date = ?,
//            Credit_Limit_Type = ?, Credit_Limit = ?
//        WHERE Party_Id = ?`,
//       [
//         Party_Name,
//         cleanValue(GSTIN),
//         cleanValue(Phone_Number),
//         cleanValue(State),
//         cleanValue(Email_Id),
//         cleanValue(Billing_Address),
//         cleanValue(Shipping_Address),

//         hasOpeningBalance ? Opening_Balance : null,
//         hasOpeningBalance ? Opening_Balance_Type : null,
//         hasOpeningBalance ? (Opening_Balance_Date || todayDate) : null,

//         Credit_Limit_Type || "No_Limit",
//         Credit_Limit_Type === "Custom" ? Credit_Limit : null,

//         partyId,
//       ]
//     );

//     // 🔹 sync the ledger to match the new state
//     if (hasOpeningBalance) {
//       await recordPartyLedger({
//         connection,
//         partyId,
//         txnType: "Opening_Balance",
//         referenceId: partyRow.id,
//         amount: Opening_Balance,
//         txnDate: Opening_Balance_Date || todayDate,
//         directionOverride: Opening_Balance_Type === "To_Receive" ? "Credit" : "Debit",
//       });
//     } else {
//       // 🔹 user cleared the opening balance entirely — remove the ledger row if one existed
//       await reversePartyLedger({
//         connection,
//         partyId,
//         txnType: "Opening_Balance",
//         referenceId: partyRow.id,
//       });
//     }

//     await connection.commit();
//     return res.status(200).json({
//       message: "Party updated successfully",
//       success: true,
//       id: partyId,
//       Party_Name,
//       GSTIN,
//       Phone_Number,
//       State,
//       Email_Id,
//       Billing_Address,
//       Shipping_Address,
//       Opening_Balance,
//       Opening_Balance_Type,
//       Opening_Balance_Date,
//       Credit_Limit_Type,
//       Credit_Limit,
//     });
//   } catch (err) {
//     if (connection) {
//       await connection.rollback();
//     }
//     console.error("❌ Error updating party:", err);
//     next(err);
//   } finally {
//     if (connection) {
//       connection.release();
//     }
//   }
// };

const getAllParties = async (req, res, next) => {
  let connection;

  try {
    connection = await db.getConnection();

    const page = req.query.page
      ? parseInt(req.query.page, 10)
      : null;

    const limit = 10;

    const search = req.query.search
      ? req.query.search.trim()
      : "";

    let whereClause = "";
    let params = [];

    // ─────────────────────────────────────────────
    // SEARCH
    // Search party fields + addresses
    // ─────────────────────────────────────────────
    if (search) {
      whereClause = `
        WHERE (
          p.Party_Name LIKE ?
          OR p.GSTIN LIKE ?
          OR p.Phone_Number LIKE ?
          OR p.State LIKE ?
          OR p.Email_Id LIKE ?

          OR EXISTS (
            SELECT 1
            FROM add_party_addresses pa
            WHERE pa.Party_Id = p.Party_Id
              AND pa.Address_Text LIKE ?
          )
        )
      `;

      const like = `%${search}%`;

      params.push(
        like,
        like,
        like,
        like,
        like,
        like
      );
    }

    // ═════════════════════════════════════════════
    // PAGINATED MODE
    // ═════════════════════════════════════════════
    if (page) {
      const offset = (page - 1) * limit;

      const query = `
        WITH transactions AS (
          SELECT
            Party_Id,
            Total_Amount AS sales,
            0 AS purchases
          FROM add_sale

          UNION ALL

          SELECT
            Party_Id,
            0 AS sales,
            Total_Amount AS purchases
          FROM add_purchase
        ),

        transaction_totals AS (
          SELECT
            Party_Id,
            SUM(sales) AS Total_Sales_Amount,
            SUM(purchases) AS Total_Purchases_Amount
          FROM transactions
          GROUP BY Party_Id
        )

        SELECT
          p.*,

          COALESCE(
            tt.Total_Sales_Amount,
            0
          ) AS Total_Sales_Amount,

          COALESCE(
            tt.Total_Purchases_Amount,
            0
          ) AS Total_Purchases_Amount

        FROM add_party p

        LEFT JOIN transaction_totals tt
          ON tt.Party_Id = p.Party_Id

        ${whereClause}

        ORDER BY p.created_at DESC

        LIMIT ? OFFSET ?
      `;

      // Count parties separately
      const countQuery = `
        SELECT COUNT(*) AS total
        FROM add_party p
        ${whereClause}
      `;

      const [partyRows] = await connection.query(
        query,
        [...params, limit, offset]
      );

      const [[countRow]] = await connection.query(
        countQuery,
        params
      );

      // ─────────────────────────────────────────
      // GET ADDRESSES FOR RETURNED PARTIES
      // ─────────────────────────────────────────
      const partyIds = partyRows.map(
        (party) => party.Party_Id
      );

      let addressRows = [];

      if (partyIds.length > 0) {
        const placeholders = partyIds
          .map(() => "?")
          .join(",");

        const [rows] = await connection.query(
          `SELECT
              id,
              Party_Id,
              Address_Type,
              Address_Text,
              Is_Default
           FROM add_party_addresses
           WHERE Party_Id IN (${placeholders})
           ORDER BY
             Party_Id,
             Address_Type,
             Is_Default DESC,
             id ASC`,
          partyIds
        );

        addressRows = rows;
      }

      // ─────────────────────────────────────────
      // GROUP ADDRESSES BY PARTY
      // ─────────────────────────────────────────
      const addressesByParty = {};

      for (const address of addressRows) {
        if (!addressesByParty[address.Party_Id]) {
          addressesByParty[address.Party_Id] = [];
        }

        addressesByParty[address.Party_Id].push({
          id: address.id,

          Address_Type:
            address.Address_Type,

          Address_Text:
            address.Address_Text,

          Is_Default:
            Boolean(address.Is_Default),
        });
      }

      // ─────────────────────────────────────────
      // ATTACH ADDRESSES TO PARTY
      // ─────────────────────────────────────────
      const parties = partyRows.map((party) => ({
        ...party,

        addresses:
          addressesByParty[party.Party_Id] || [],
      }));

      const totalParties = countRow.total;

      return res.status(200).json({
        success: true,

        currentPage: page,

        totalPages:
          Math.ceil(totalParties / limit),

        totalParties,

        parties,
      });
    }

    // ═════════════════════════════════════════════
    // NON-PAGINATED MODE
    // Used in Sale/Purchase dropdowns etc.
    // ═════════════════════════════════════════════

    const query = `
      SELECT
        p.*
      FROM add_party p

      ${whereClause}

      ORDER BY p.created_at DESC
    `;

    const [partyRows] = await connection.query(
      query,
      params
    );

    // ─────────────────────────────────────────────
    // GET ALL ADDRESSES FOR RETURNED PARTIES
    // ─────────────────────────────────────────────
    const partyIds = partyRows.map(
      (party) => party.Party_Id
    );

    let addressRows = [];

    if (partyIds.length > 0) {
      const placeholders = partyIds
        .map(() => "?")
        .join(",");

      const [rows] = await connection.query(
        `SELECT
            id,
            Party_Id,
            Address_Type,
            Address_Text,
            Is_Default
         FROM add_party_addresses
         WHERE Party_Id IN (${placeholders})
         ORDER BY
           Party_Id,
           Address_Type,
           Is_Default DESC,
           id ASC`,
        partyIds
      );

      addressRows = rows;
    }

    // ─────────────────────────────────────────────
    // GROUP ADDRESSES
    // ─────────────────────────────────────────────
    const addressesByParty = {};

    for (const address of addressRows) {
      if (!addressesByParty[address.Party_Id]) {
        addressesByParty[address.Party_Id] = [];
      }

      addressesByParty[address.Party_Id].push({
        id: address.id,

        Address_Type:
          address.Address_Type,

        Address_Text:
          address.Address_Text,

        Is_Default:
          Boolean(address.Is_Default),
      });
    }

    // ─────────────────────────────────────────────
    // ATTACH ADDRESSES
    // ─────────────────────────────────────────────
    const parties = partyRows.map((party) => ({
      ...party,

      addresses:
        addressesByParty[party.Party_Id] || [],
    }));

    return res.status(200).json({
      success: true,

      totalParties: parties.length,

      parties,
    });

  } catch (err) {
    console.error(
      "❌ Error getting all parties:",
      err
    );

    next(err);

  } finally {
    if (connection) {
      connection.release();
    }
  }
};
// const getAllParties = async (req, res, next) => {
//   let connection;
//   try {
//     connection = await db.getConnection();
//     const page = req.query.page ? parseInt(req.query.page, 10) : null;
//     const limit = 10;
//     const search = req.query.search ? req.query.search.trim().toLowerCase() : "";

//     let whereClause = "";
//     let params = [];

//     // 🔎 Search (optional)
//     if (search) {
//       whereClause = `
//         WHERE LOWER(Party_Name) LIKE ? 
//            OR LOWER(GSTIN) LIKE ? 
//            OR LOWER(Phone_Number) LIKE ? 
//            OR LOWER(State) LIKE ? 
//            OR LOWER(Email_Id) LIKE ? 
//            OR LOWER(Billing_Address) LIKE ?
//       `;
//       const like = `%${search}%`;
//       params.push(like, like, like, like, like, like);
//     }

//     let rows, totalParties;

//     if (page) {
//       // 📄 Pagination mode
//       const offset = (page - 1) * limit;
    
//       // const query = `
//       //   SELECT 
//       //     p.*,
//       //     COALESCE(s.total_sales, 0) AS Total_Sales_Amount,
//       //     COALESCE(pr.total_purchases, 0) AS Total_Purchases_Amount
//       //   FROM add_party p

//       //   LEFT JOIN (
//       //     SELECT Party_Id, SUM(Total_Amount) AS total_sales
//       //     FROM add_sale
//       //     GROUP BY Party_Id
//       //   ) s ON s.Party_Id = p.Party_Id

//       //   LEFT JOIN (
//       //     SELECT Party_Id, SUM(Total_Amount) AS total_purchases
//       //     FROM add_purchase
//       //     GROUP BY Party_Id
//       //   ) pr ON pr.Party_Id = p.Party_Id

//       //   ${whereClause}
//       //   ORDER BY p.created_at DESC
//       //   LIMIT ? OFFSET ?
//       // `;

//       const query=`WITH transactions AS (
//   SELECT 
//     Party_Id,
//     Total_Amount AS sales,
//     0 AS purchases
//   FROM add_sale

//   UNION ALL

//   SELECT 
//     Party_Id,
//     0 AS sales,
//     Total_Amount AS purchases
//   FROM add_purchase
// )

// SELECT 
//   p.*,
//   COALESCE(SUM(t.sales),0) AS Total_Sales_Amount,
//   COALESCE(SUM(t.purchases),0) AS Total_Purchases_Amount
// FROM add_party p

// LEFT JOIN transactions t
//   ON t.Party_Id = p.Party_Id

// ${whereClause}

// GROUP BY p.Party_Id
// ORDER BY p.created_at DESC
// LIMIT ? OFFSET ?;`

//       const countQuery = `
//         SELECT COUNT(*) AS total 
//         FROM add_party
//         ${whereClause}
//       `;
//       const [data] = await db.query(query, [...params, limit, offset]);
//       const [count] = await db.query(countQuery, params);

//       rows = data;
//       totalParties = count[0].total;

//       return res.status(200).json({
//         success: true,
//         currentPage: page,
//         totalPages: Math.ceil(totalParties / limit),
//         totalParties,
//         parties: rows,
//       });
//     } else {
//       // 🧾 Non-paginated mode (used in dropdowns, exports, etc.)
//       const query = `
//         SELECT * 
//         FROM add_party
//         ${whereClause}
//         ORDER BY created_at DESC
//       `;
//       const [data] = await db.query(query, params);

//       return res.status(200).json({
//         success: true,
//         totalParties: data.length,
//         parties: data,
//       });
//     }
//   } catch (err) {
//     if (connection ) connection.release();
//     console.error("❌ Error getting all parties:", err);
//     next(err);
//     // return res.status(500).json({ message: "Internal Server Error" });
//   }finally {
//     if (connection) {
//       connection.release();
//     }
//   }
// };

const getSinglePartyDetailsSalesPurchases = async (req, res, next) => {
  let connection;

  try {
    connection = await db.getConnection();

    const { Party_Id } = req.params;
    const limit = 10;
    const search = req.query.search ? req.query.search.trim().toLowerCase() : "";
    const searchDate = req.query.date || null;
    const cursor = req.query.cursor ? Number(req.query.cursor) : null;

    if (!Party_Id) {
      return res.status(400).json({ success: false, message: "Party Id is required" });
    }

    // const [partyDetails] = await connection.query(
    //   `SELECT * FROM add_party WHERE Party_Id = ?`,
    //   [Party_Id]
    // );
    // if (!partyDetails.length) {
    //   return res.status(404).json({ success: false, message: "Party not found" });
    // }
    // ─────────────────────────────────────────────
// PARTY DETAILS
// ─────────────────────────────────────────────
const [[party]] = await connection.query(
  `SELECT *
   FROM add_party
   WHERE Party_Id = ?
   LIMIT 1`,
  [Party_Id]
);

if (!party) {
  return res.status(404).json({
    success: false,
    message: "Party not found",
  });
}

// ─────────────────────────────────────────────
// PARTY ADDRESSES
// ─────────────────────────────────────────────
const [addresses] = await connection.query(
  `SELECT
      id,
      Address_Type,
      Address_Text,
      Is_Default
   FROM add_party_addresses
   WHERE Party_Id = ?
   ORDER BY Address_Type, Is_Default DESC, id ASC`,
  [Party_Id]
);

// Combine them
const partyDetails = {
  ...party,
  addresses: addresses.map((address) => ({
    ...address,
    Is_Default: Boolean(address.Is_Default),
  })),
};

    // 🔹 Build ledger query — cursor + search + date
    const params = [Party_Id];
    let where = `WHERE pl.Party_Id = ?`;
    // let where = `WHERE Party_Id = ?`;

    // if (cursor) {
    //   where += ` AND id < ?`;
    //   params.push(cursor);
    // }

    // if (searchDate) {
    //   where += ` AND Txn_Date = ?`;
    //   params.push(searchDate);
    // }

    // if (search) {
    //   where += ` AND (
    //     LOWER(Doc_Number) LIKE ?
    //     OR CAST(Amount AS CHAR) LIKE ?
    //     OR CAST(Balance_Due AS CHAR) LIKE ?
    //   )`;
    //   params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    // }

    if (cursor) {
  where += ` AND pl.id < ?`;
  params.push(cursor);
}

if (searchDate) {
  where += ` AND pl.Txn_Date = ?`;
  params.push(searchDate);
}

if (search) {
  where += ` AND (
    pl.Doc_Number LIKE ?
    OR CAST(pl.Amount AS CHAR) LIKE ?
    OR CAST(pl.Balance_Due AS CHAR) LIKE ?
  )`;

  params.push(
    `%${search}%`,
    `%${search}%`,
    `%${search}%`
  );
}

    // const [ledgerRows] = await connection.query(
    //   `SELECT id, Txn_Type, Source_Id, Direction, Amount, Doc_Number, Balance_Due, Running_Balance, Txn_Date
    //    FROM party_ledger
    //    ${where}
    //    ORDER BY id DESC
    //    LIMIT ${limit + 1}`,
    //   params
    // );
const [ledgerRows] = await connection.query(
  `SELECT
      pl.id,
      pl.Txn_Type,
      pl.Source_Id,
      pl.Direction,
      pl.Amount,
      pl.Doc_Number,
      pl.Balance_Due,
      pl.Running_Balance,
      pl.Txn_Date,

      CASE pl.Txn_Type
        WHEN 'Sale' THEN s.Sale_Id
        WHEN 'Purchase' THEN p.Purchase_Id
        ELSE pl.Source_Id
      END AS Formatted_Reference_Id

   FROM party_ledger pl

   LEFT JOIN add_sale s
     ON pl.Txn_Type = 'Sale'
     AND pl.Source_Id = s.id

   LEFT JOIN add_purchase p
     ON pl.Txn_Type = 'Purchase'
     AND pl.Source_Id = p.id

   ${where}

   ORDER BY pl.id DESC
   LIMIT ${limit + 1}`,
  params
);
    const hasMore = ledgerRows.length > limit;
    const pageRows = hasMore ? ledgerRows.slice(0, limit) : ledgerRows;
    const nextCursor = hasMore ? pageRows[pageRows.length - 1].id : null;

    // 🔹 Summary — ALL TIME
    const [[purchaseSummary]] = await connection.query(
      `SELECT COALESCE(SUM(Total_Amount),0) AS Total_Amount,
              COALESCE(SUM(Total_Paid),0) AS Total_Paid,
              COALESCE(SUM(Balance_Due),0) AS Balance_Due
       FROM add_purchase WHERE Party_Id = ?`,
      [Party_Id]
    );

    const [[salesSummary]] = await connection.query(
      `SELECT COALESCE(SUM(Total_Amount),0) AS Total_Amount,
              COALESCE(SUM(Total_Received),0) AS Total_Received,
              COALESCE(SUM(Balance_Due),0) AS Balance_Due
       FROM add_sale WHERE Party_Id = ?`,
      [Party_Id]
    );

    const [[saleReturnSummary]] = await connection.query(
      `SELECT COALESCE(SUM(Total_Amount),0) AS Total_Amount,
              COALESCE(SUM(Total_Paid),0) AS Total_Paid,
              COALESCE(SUM(Balance_Due),0) AS Balance_Due
       FROM sale_return WHERE Party_Id = ?`,
      [Party_Id]
    );

    const [[purchaseReturnSummary]] = await connection.query(
      `SELECT COALESCE(SUM(Total_Amount),0) AS Total_Amount,
              COALESCE(SUM(Total_Received),0) AS Total_Received,
              COALESCE(SUM(Balance_Due),0) AS Balance_Due
       FROM purchase_return WHERE Party_Id = ?`,
      [Party_Id]
    );

    const [[paymentInSummary]] = await connection.query(
      `SELECT COALESCE(SUM(Received),0) AS Total_Received FROM payment_in WHERE Party_Id = ?`,
      [Party_Id]
    );

    const [[paymentOutSummary]] = await connection.query(
      `SELECT COALESCE(SUM(Paid),0) AS Total_Paid FROM payment_out WHERE Party_Id = ?`,
      [Party_Id]
    );

    const [[latestLedgerRow]] = await connection.query(
      `SELECT Running_Balance FROM party_ledger WHERE Party_Id = ? ORDER BY id DESC LIMIT 1`,
      [Party_Id]
    );
    const netBalance = latestLedgerRow ? Number(latestLedgerRow.Running_Balance) : 0;

    return res.status(200).json({
      success: true,
      partyId: Party_Id,
      partyDetails: partyDetails,
      transactions: pageRows,
      nextCursor,
      hasMore,
      summary: {
        purchases: purchaseSummary,
        sales: salesSummary,
        saleReturns: saleReturnSummary,
        purchaseReturns: purchaseReturnSummary,
        paymentIns: paymentInSummary,
        paymentOuts: paymentOutSummary,
        netBalance,
      },
    });
  } catch (err) {
    console.error("❌ Error:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};


const fonts = {
  Helvetica: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique",
  },
};

const printer = new PdfPrinter(fonts);
const printSinglePartyDetailsSalesPurchasesReport = async (req, res) => {
  try {
    const {
      party = {},          // Party Details
      purchases = [],      // Purchase Records
      sales = [],          // Sales Records
      summary = {}         // { purchases: {}, sales: {} }
    } = req.body;

    const safe = (v) => (v !== undefined && v !== null ? v : "N/A");

    const buildSection = (title, list, type) => {
      if (!list || list.length === 0) return [];

      let rows = [
        {
          text: title.toUpperCase(),
          style: "sectionHeader",
          alignment: "center",
          margin: [0, 20, 0, 10]
        }
      ];

      list.forEach((entry, idx) => {
        rows.push({
          unbreakable: true,
          stack: [
            // Title
            {
              text: `${title.slice(0, -1)} ${idx + 1}`,
              style: "subTitle",
              margin: [0, 0, 0, 5]
            },

            // Basic details section
            {
              columns: [
                {
                  width: "48%",
                  stack: [
                    { text: "Party Name", style: "label" },
                    { text: safe(party.Party_Name), style: "value" },

                    { text: "GSTIN", style: "label" },
                    { text: safe(party.GSTIN), style: "value" }
                  ]
                },
                {
                  width: "48%",
                  alignment: "right",
                  stack: [
                    {
                      text: type === "purchase" ? "Bill Number" : "Invoice Number",
                      style: "label"
                    },
                    {
                      text: safe(entry.Bill_Number || entry.Invoice_Number),
                      style: "value"
                    },

                    {
                      text: type === "purchase" ? "Bill Date" : "Invoice Date",
                      style: "label"
                    },
                    {
                       text: safe(
    new Date(entry.Bill_Date || entry.Invoice_Date)
      .toLocaleDateString("en-IN", {
        day: "numeric",
        month: "numeric",
        year: "numeric",
      })
  ),
  style: "value"
                    }
                  ]
                }
              ],
              columnGap: 20,
              margin: [0, 0, 0, 10]
            },

            // ITEMS TABLE
            {
              style: "tableSmall",
              table: {
                headerRows: 1,
                widths: ["auto", "*", "*", "*", "*", "*", "*", "*"],
                body: [
                  [
                    { text: "Sl", style: "tableHeader" },
                    { text: "Category", style: "tableHeader" },
                    { text: "Item", style: "tableHeader" },
                    { text: "HSN", style: "tableHeader" },
                    { text: "Qty", style: "tableHeader" },
                    { text: "Price", style: "tableHeader" },
                    { text: "Tax", style: "tableHeader" },
                    { text: "Amount", style: "tableHeader" }
                  ],
                  ...entry.items.map((it, i) => [
                    i + 1,
                    safe(it.Item_Category),
                    safe(it.Item_Name),
                    safe(it.Item_HSN),
                    safe(it.Quantity),
                    safe(it.Sale_Price || it.Purchase_Price),
                    safe(it.Tax_Type),
                    Number(it.Amount || 0).toFixed(2)
                  ])
                ]
              },
              layout: "lightHorizontalLines",
              margin: [0, 0, 0, 10]
            },

            // TOTALS SECTION
            {
              columns: [
                { width: "*", text: "" },
                {
                  width: "40%",
                  table: {
                    widths: ["*", "auto"],
                    body: [
                      ["Total Amount", safe(entry.Total_Amount)],
                      [
                        type === "purchase" ? "Paid" : "Received",
                        safe(entry.Total_Paid || entry.Total_Received)
                      ],
                      ["Balance Due", safe(entry.Balance_Due)]
                    ]
                  },
                  layout:  "noBordersBox"
                }
              ],
              margin: [0, 0, 0, 15]
            }
          ]
        });
      });

      return rows;
    };

    const docDefinition = {
      pageMargins: [18, 18, 18, 30],
      defaultStyle: { font: "Helvetica" },

      footer: (p, pc) => ({
        text: `Page ${p} of ${pc}`,
        alignment: "center",
        margin: [10, 10, 10, 10]
      }),

      content: [
        {
          text: `${party.Party_Name}`,
          style: "header",
          alignment: "center",
          margin: [0, 0, 0, 8]
        },

        {
          text: `GSTIN: ${party.GSTIN || "N/A"}`,
          alignment: "center",
          margin: [0, 0, 0, 15]
        },
          {
          text: `Billing Address: ${party.Billing_Address || "N/A"}`,
          alignment: "center",
          margin: [0, 0, 0, 15]
        },

        ...buildSection("Purchases", purchases, "purchase"),

        ...buildSection("Sales", sales, "sale")
      ],

      styles: {
        header: { fontSize: 18, bold: true },
        sectionHeader: { fontSize: 15, bold: true },
        subTitle: { fontSize: 12, bold: true },
        label: { bold: true, fontSize: 10 },
        value: { fontSize: 10 },
        tableHeader: { bold: true, fillColor: "#eee" },
        tableSmall: { fontSize: 9 }
      }
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const chunks = [];

    pdfDoc.on("data", (c) => chunks.push(c));
    pdfDoc.on("end", () => {
      res.setHeader("Content-Type", "application/pdf");
      res.send(Buffer.concat(chunks));
    });

    pdfDoc.end();

  } catch (err) {
    console.error("❌ PDF Print failed:", err);
    res.status(500).json({ message: "PDF Print Error" });
  }
};

//  GET ALL PARTIES WITH PAYABLES FROM  PURCHASE
const getAllPartiesPayablesLeft = async (req, res, next) => {
  let connection;

  try {
    connection = await db.getConnection();

    const page = parseInt(req.query.page, 10) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const search = req.query.search ? req.query.search.trim().toLowerCase() : "";
    const fromDate = req.query.fromDate || null;
    const toDate = req.query.toDate || null;

    let params = [];
    let whereClauses = [];

    // ✅ Only receivables
    whereClauses.push(`pu.Balance_Due > 0`);

    /* ================= SEARCH ================= */

    if (search) {
      whereClauses.push(`
        (
          LOWER(p.Party_Name) LIKE ?
          OR LOWER(p.GSTIN) LIKE ?
          OR LOWER(p.Phone_Number) LIKE ?
          OR LOWER(p.State) LIKE ?
          OR LOWER(p.Email_Id) LIKE ?
          OR LOWER(p.Billing_Address) LIKE ?
        )
      `);

      const like = `%${search}%`;
      params.push(like, like, like, like, like, like);
    }

    /* ================= DATE FILTER ================= */

    if (fromDate && toDate) {
      whereClauses.push(`s.Invoice_Date BETWEEN ? AND ?`);
      params.push(`${fromDate} 00:00:00`, `${toDate} 23:59:59`);
    } else if (fromDate) {
      whereClauses.push(`s.Invoice_Date >= ?`);
      params.push(`${fromDate} 00:00:00`);
    } else if (toDate) {
      whereClauses.push(`s.Invoice_Date <= ?`);
      params.push(`${toDate} 23:59:59`);
    }

    const whereSQL = whereClauses.length
      ? `WHERE ${whereClauses.join(" AND ")}`
      : "";

    /* ================= FETCH DATA ================= */

    const [rows] = await connection.query(
      `
      SELECT
        p.Party_Id,
        p.Party_Name,
        p.Phone_Number,
        p.GSTIN,
        pu.Purchase_Id,
        pu.Bill_Number,
        pu.Total_Amount,
        pu.Balance_Due,
        pu.Bill_Date,
        pu.Payment_Type,
        pu.Created_At
      FROM add_purchase pu
      JOIN add_party p ON p.Party_Id = pu.Party_Id
      ${whereSQL}
      ORDER BY p.Party_Name
      LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    /* ================= COUNT ================= */

    const [count] = await connection.query(
      `
      SELECT COUNT(*) AS total
      FROM add_purchase pu
      JOIN add_party p ON p.Party_Id = pu.Party_Id
      ${whereSQL}
      `,
      params
    );

    /* ================= RESPONSE ================= */

    res.status(200).json({
      success: true,
      message: "Successfully fetched receivable bills",
      data: rows,
      currentPage: page,
      totalPages: Math.ceil(count[0].total / limit),
      totalPurchases: count[0].total,
    });

  } catch (err) {
    console.error("❌ Error:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};


//  GET ALL PARTIES WITH RECEIVABLES FROM  SALES
const getAllPartiesReceivablesLeft = async (req, res, next) => {
  let connection;

  try {
    connection = await db.getConnection();

    const page = parseInt(req.query.page, 10) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const search = req.query.search ? req.query.search.trim().toLowerCase() : "";
    const fromDate = req.query.fromDate || null;
    const toDate = req.query.toDate || null;

    let params = [];
    let whereClauses = [];

    // ✅ Only receivables
    whereClauses.push(`s.Balance_Due > 0`);

    /* ================= SEARCH ================= */

    if (search) {
      whereClauses.push(`
        (
          LOWER(p.Party_Name) LIKE ?
          OR LOWER(p.GSTIN) LIKE ?
          OR LOWER(p.Phone_Number) LIKE ?
          OR LOWER(p.State) LIKE ?
          OR LOWER(p.Email_Id) LIKE ?
          OR LOWER(p.Billing_Address) LIKE ?
        )
      `);

      const like = `%${search}%`;
      params.push(like, like, like, like, like, like);
    }

    /* ================= DATE FILTER ================= */

    if (fromDate && toDate) {
      whereClauses.push(`s.Invoice_Date BETWEEN ? AND ?`);
      params.push(`${fromDate} 00:00:00`, `${toDate} 23:59:59`);
    } else if (fromDate) {
      whereClauses.push(`s.Invoice_Date >= ?`);
      params.push(`${fromDate} 00:00:00`);
    } else if (toDate) {
      whereClauses.push(`s.Invoice_Date <= ?`);
      params.push(`${toDate} 23:59:59`);
    }

    const whereSQL = whereClauses.length
      ? `WHERE ${whereClauses.join(" AND ")}`
      : "";

    /* ================= FETCH DATA ================= */

    const [rows] = await connection.query(
      `
      SELECT
        p.Party_Id,
        p.Party_Name,
        p.Phone_Number,
        p.GSTIN,
        s.Sale_Id,
        s.Invoice_Number,
        s.Total_Amount,
        s.Balance_Due,
        s.Invoice_Date,
        s.Payment_Type,
        s.Created_At
      FROM add_sale s
      JOIN add_party p ON p.Party_Id = s.Party_Id
      ${whereSQL}
      ORDER BY p.Party_Name
      LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    /* ================= COUNT ================= */

    const [count] = await connection.query(
      `
      SELECT COUNT(*) AS total
      FROM add_sale s
      JOIN add_party p ON p.Party_Id = s.Party_Id
      ${whereSQL}
      `,
      params
    );

    /* ================= RESPONSE ================= */

    res.status(200).json({
      success: true,
      message: "Successfully fetched receivable bills",
      data: rows,
      currentPage: page,
      totalPages: Math.ceil(count[0].total / limit),
      totalSales: count[0].total,
    });

  } catch (err) {
    console.error("❌ Error:", err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
};

export { addParty,editParty,getAllParties,getSinglePartyDetailsSalesPurchases,
  printSinglePartyDetailsSalesPurchasesReport,getAllPartiesPayablesLeft,getAllPartiesReceivablesLeft
 };  // ✅ for ESM
// const getSinglePartyDetailsSalesPurchases = async (req, res, next) => {
//   let connection;

//   try {
//     connection = await db.getConnection();

//     const { Party_Id } = req.params;
//     const page = parseInt(req.query.page, 10) || 1;
//     const limit = 10;
//     const offset = (page - 1) * limit;
// const salesCursor = req.query.salesCursor || null;
// const purchasesCursor = req.query.purchasesCursor || null;
//     const fromDate = req.query.fromDate || null;
//     const toDate = req.query.toDate || null;

//     if (!Party_Id) {
//       return res.status(400).json({
//         success: false,
//         message: "Party Id is required",
//       });
//     }

//     // Party Details
//     const [partyDetails] = await connection.query(
//       `SELECT * FROM add_party WHERE Party_Id=?`,
//       [Party_Id]
//     );

//     if (!partyDetails.length) {
//       return res.status(404).json({
//         success: false,
//         message: "Party not found",
//       });
//     }

//     // Build date condition
//     let dateConditionSale = "";
//     let dateConditionPurchase = "";
//     const paramsSale = [Party_Id];
//     const paramsPurchase = [Party_Id];

//     if (fromDate && toDate) {
//       dateConditionSale = "AND Invoice_Date BETWEEN ? AND ?";
//       dateConditionPurchase = "AND Bill_Date BETWEEN ? AND ?";
//       paramsSale.push(fromDate, toDate);
//       paramsPurchase.push(fromDate, toDate);
//     }

//     // Fetch purchases
//     const [purchases] = await connection.query(
//       `
//       SELECT 
//         Purchase_Id,
//         Bill_Date,
//         Bill_Number,
//         Total_Amount,
//         State_Of_Supply,
//         Total_Paid,
//         Balance_Due,
//         Payment_Type,
//         "Purchase" AS Type
//       FROM add_purchase
//       WHERE Party_Id=? ${dateConditionPurchase}
//       `,
//       paramsPurchase
//     );

//     // Fetch sales
//     const [sales] = await connection.query(
//       `
//       SELECT 
//         Sale_Id,
//         Invoice_Date,
//         Invoice_Number,
//         Total_Amount,
//         State_Of_Supply,
//         Total_Received,
//         Balance_Due,
//         Payment_Type,
//         "Sale" AS Type
//       FROM add_sale
//       WHERE Party_Id=? ${dateConditionSale}
//       `,
//       paramsSale
//     );

//     // Combine transactions
//     const combined = [
//       ...purchases.map(p => ({
//         ...p,
//         date: p.Bill_Date
//       })),
//       ...sales.map(s => ({
//         ...s,
//         date: s.Invoice_Date
//       }))
//     ];

//     // Sort latest first
//     combined.sort((a, b) => new Date(b.date) - new Date(a.date));

//     const paged = combined.slice(offset, offset + limit);

//     // Separate again
//     let pagedPurchases = paged.filter(r => r.Type === "Purchase");
//     let pagedSales = paged.filter(r => r.Type === "Sale");

//     const totalRecords = combined.length;
//     const totalPages = Math.ceil(totalRecords / limit);

//     // Fetch purchase items
//     const purchaseIds = pagedPurchases.map(r => r.Purchase_Id);

//     if (purchaseIds.length > 0) {
//       const [purchaseItems] = await connection.query(
//         `
//         SELECT pi.*, it.Item_Name, it.Item_HSN, it.Item_Category, it.Item_Unit
//         FROM add_purchase_items pi
//         LEFT JOIN add_item it ON it.Item_Id = pi.Item_Id
//         WHERE pi.Purchase_Id IN (?)
//         `,
//         [purchaseIds]
//       );

//       pagedPurchases = pagedPurchases.map(p => ({
//         ...p,
//         items: purchaseItems.filter(i => i.Purchase_Id === p.Purchase_Id)
//       }));
//     }

//     // Fetch sale items
//     const saleIds = pagedSales.map(r => r.Sale_Id);

//     if (saleIds.length > 0) {
//       const [saleItems] = await connection.query(
//         `
//         SELECT si.*, it.Item_Name, it.Item_HSN, it.Item_Category, it.Item_Unit
//         FROM add_sale_items si
//         LEFT JOIN add_item it ON it.Item_Id = si.Item_Id
//         WHERE si.Sale_Id IN (?)
//         `,
//         [saleIds]
//       );

//       pagedSales = pagedSales.map(s => ({
//         ...s,
//         items: saleItems.filter(i => i.Sale_Id === s.Sale_Id)
//       }));
//     }

//     // Summary Purchases
//     const [[purchaseSummary]] = await connection.query(
//       `
//       SELECT 
//         COALESCE(SUM(Total_Amount),0) AS Total_Amount,
//         COALESCE(SUM(Total_Paid),0) AS Total_Paid,
//         COALESCE(SUM(Balance_Due),0) AS Balance_Due
//       FROM add_purchase
//       WHERE Party_Id=? ${dateConditionPurchase}
//       `,
//       paramsPurchase
//     );

//     // Summary Sales
//     const [[salesSummary]] = await connection.query(
//       `
//       SELECT 
//         COALESCE(SUM(Total_Amount),0) AS Total_Amount,
//         COALESCE(SUM(Total_Received),0) AS Total_Received,
//         COALESCE(SUM(Balance_Due),0) AS Balance_Due
//       FROM add_sale
//       WHERE Party_Id=? ${dateConditionSale}
//       `,
//       paramsSale
//     );

//     return res.status(200).json({
//       success: true,
//       partyId: Party_Id,
//       partyDetails: partyDetails[0],
//       totalRecords,
//       totalPages,
//       currentPage: page,
//       limit,
//       summary: {
//         purchases: purchaseSummary,
//         sales: salesSummary,
//       },
//       purchases: pagedPurchases,
//       sales: pagedSales,
//     });

//   } catch (err) {
//     console.error("❌ Error:", err);
//     next(err);
//   } finally {
//     if (connection) connection.release();
//   }
// };
