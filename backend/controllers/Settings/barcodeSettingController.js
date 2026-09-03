import db from "../../config/db.js";

// Get all barcode settings
const getBarcodeSettings = async (req, res, next) => {
    let connection;

    try {
        connection = await db.getConnection();

        const [settings] = await connection.query(`
            SELECT
                id,
                Size_Key,
                Size_Label,
                Label_Width_Mm,
                Label_Height_Mm,
                Columns_Count,
                Is_Active,
                created_at,
                updated_at
            FROM barcode_settings
            ORDER BY id ASC
        `);

        return res.status(200).json(settings);

    } catch (err) {
        console.error("❌ Error getting barcode settings:", err);
        next(err);

    } finally {
        if (connection) connection.release();
    }
};


// Select barcode setting
const selectBarcodeSetting = async (req, res, next) => {
    let connection;

    try {
        const { id } = req.body;

        if (!id) {
            return res.status(400).json({
                message: "Barcode setting id is required",
            });
        }

        connection = await db.getConnection();

        await connection.beginTransaction();

        const [setting] = await connection.query(
            `
            SELECT id
            FROM barcode_settings
            WHERE id = ?
            `,
            [id]
        );

        if (setting.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                message: "Barcode setting not found",
            });
        }

        await connection.query(`
            UPDATE barcode_settings
            SET Is_Active = 0
        `);

        await connection.query(
            `
            UPDATE barcode_settings
            SET Is_Active = 1
            WHERE id = ?
            `,
            [id]
        );

        await connection.commit();

        return res.status(200).json({
            message: "Barcode setting selected successfully",
        });

    } catch (err) {
        if (connection) {
            await connection.rollback();
        }

        console.error("❌ Error selecting barcode setting:", err);
        next(err);

    } finally {
        if (connection) connection.release();
    }
};


export {
    getBarcodeSettings,
    selectBarcodeSetting,
};