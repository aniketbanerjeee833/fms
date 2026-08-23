/**
 * Resolves a unit's id from its shorthand name.
 * Returns null if unitName is null/empty or not found.
 */
export const resolveUnitId = async (connection, unitName) => {
  if (!unitName) return null;

  const [[unit]] = await connection.query(
    `SELECT id FROM units WHERE Unit_Shorthand = ? LIMIT 1`,
    [unitName]
  );

  return unit?.id || null;
};

/**
 * Given an item's current Primary_Unit / Secondary_Unit (text),
 * resolves and backfills their _Id columns on add_item
 * WITHOUT touching Primary_Unit / Secondary_Unit themselves.
 *
 * Safe to call every time — no-ops if ids are already set correctly.
 */
// export const syncUnitIdsForItem = async (connection, Item_Id) => {
//   const [[item]] = await connection.query(
//     `SELECT Item_Id, Primary_Unit, Secondary_Unit, Primary_Unit_Id, Secondary_Unit_Id
//      FROM add_item WHERE Item_Id = ? LIMIT 1`,
//     [Item_Id]
//   );

//   if (!item) return;

//   const resolvedPrimaryId   = await resolveUnitId(connection, item.Primary_Unit);
//   const resolvedSecondaryId = await resolveUnitId(connection, item.Secondary_Unit);

//   // only write if something actually changed — avoids unnecessary writes
//   if (
//     resolvedPrimaryId   !== item.Primary_Unit_Id ||
//     resolvedSecondaryId !== item.Secondary_Unit_Id
//   ) {
//     await connection.query(
//       `UPDATE add_item
//        SET Primary_Unit_Id = ?, Secondary_Unit_Id = ?
//        WHERE Item_Id = ?`,
//       [resolvedPrimaryId, resolvedSecondaryId, Item_Id]
//     );
//   }

//   return { Primary_Unit_Id: resolvedPrimaryId, Secondary_Unit_Id: resolvedSecondaryId };
// };
export const syncUnitIdsForItem = async (connection, Item_Id) => {
  const [[item]] = await connection.query(
    `
    SELECT
      Item_Id,
      Item_Unit,
      Primary_Unit,
      Secondary_Unit,
      Item_Unit_Id,
      Primary_Unit_Id,
      Secondary_Unit_Id
    FROM add_item
    WHERE Item_Id = ?
    LIMIT 1
    `,
    [Item_Id]
  );

  if (!item) return;

  const resolvedItemUnitId =
    await resolveUnitId(connection, item.Item_Unit);

  const resolvedPrimaryId =
    await resolveUnitId(connection, item.Primary_Unit);

  const resolvedSecondaryId =
    await resolveUnitId(connection, item.Secondary_Unit);

  if (
    resolvedItemUnitId !== item.Item_Unit_Id ||
    resolvedPrimaryId !== item.Primary_Unit_Id ||
    resolvedSecondaryId !== item.Secondary_Unit_Id
  ) {
    await connection.query(
      `
      UPDATE add_item
      SET
        Item_Unit_Id = ?,
        Primary_Unit_Id = ?,
        Secondary_Unit_Id = ?
      WHERE Item_Id = ?
      `,
      [
        resolvedItemUnitId,
        resolvedPrimaryId,
        resolvedSecondaryId,
        Item_Id,
      ]
    );
  }

  return {
    Item_Unit_Id: resolvedItemUnitId,
    Primary_Unit_Id: resolvedPrimaryId,
    Secondary_Unit_Id: resolvedSecondaryId,
  };
};
/**
 * Given a purchase_items row's snapshot text columns,
 * resolves and backfills the corresponding _Id snapshot columns.
 * Call this right after inserting/updating a purchase_items row —
 * pass the row's own primary key (id) and the text values you already saved.
 */
export const syncUnitIdsForPurchaseItem = async (connection, {
  purchaseItemRowId,          // add_purchase_items.id (auto-increment PK)
  Primary_Unit_Snapshot,
  Secondary_Unit_Snapshot,
  Selected_Unit,
}) => {
  const primaryId   = await resolveUnitId(connection, Primary_Unit_Snapshot);
  const secondaryId = await resolveUnitId(connection, Secondary_Unit_Snapshot);
  const selectedId  = await resolveUnitId(connection, Selected_Unit);

  await connection.query(
    `UPDATE add_purchase_items
     SET Primary_Unit_Snapshot_Id = ?, Secondary_Unit_Snapshot_Id = ?, Selected_Unit_Id = ?
     WHERE id = ?`,
    [primaryId, secondaryId, selectedId, purchaseItemRowId]
  );

  return { primaryId, secondaryId, selectedId };
};
export const syncUnitIdsForSaleItem = async (
  connection,
  {
    saleItemRowId,
    Primary_Unit_Snapshot,
    Secondary_Unit_Snapshot,
    Selected_Unit,
  }
) => {
  const primaryId =await resolveUnitId(connection, Primary_Unit_Snapshot);

  const secondaryId =await resolveUnitId(connection, Secondary_Unit_Snapshot);

  const selectedId =await resolveUnitId(connection, Selected_Unit);

  await connection.query(
    `
    UPDATE add_sale_items
    SET
      Primary_Unit_Snapshot_Id = ?,
      Secondary_Unit_Snapshot_Id = ?,
      Selected_Unit_Id = ?
    WHERE id = ?
    `,
    [
      primaryId,
      secondaryId,
      selectedId,
      saleItemRowId,
    ]
  );

  return {
    primaryId,
    secondaryId,
    selectedId,
  };
};
export const syncUnitIdsForPurchaseReturnItem = async (
  connection,
  {
    purchaseReturnItemRowId,
    Primary_Unit_Snapshot,
    Secondary_Unit_Snapshot,
    Selected_Unit,
  }
) => {

  const primaryId =await resolveUnitId(connection, Primary_Unit_Snapshot);

  const secondaryId =await resolveUnitId(connection, Secondary_Unit_Snapshot);

  const selectedId =await resolveUnitId(connection, Selected_Unit);

  await connection.query(
    `UPDATE purchase_return_items
     SET
       Primary_Unit_Snapshot_Id = ?,
       Secondary_Unit_Snapshot_Id = ?,
       Selected_Unit_Id = ?
     WHERE id = ?`,
    [
      primaryId,
      secondaryId,
      selectedId,
      purchaseReturnItemRowId,
    ]
  );

  return {
    primaryId,
    secondaryId,
    selectedId,
  };
};
export const syncUnitIdsForSaleReturnItem = async (
  connection,
  {
    saleReturnItemRowId,
    Primary_Unit_Snapshot,
    Secondary_Unit_Snapshot,
    Selected_Unit,
  }
) => {

  const primaryId =
    await resolveUnitId(
      connection,
      Primary_Unit_Snapshot
    );

  const secondaryId =
    await resolveUnitId(
      connection,
      Secondary_Unit_Snapshot
    );

  const selectedId =
    await resolveUnitId(
      connection,
      Selected_Unit
    );

  await connection.query(
    `UPDATE sale_return_items
     SET
       Primary_Unit_Snapshot_Id = ?,
       Secondary_Unit_Snapshot_Id = ?,
       Selected_Unit_Id = ?
     WHERE id = ?`,
    [
      primaryId,
      secondaryId,
      selectedId,
      saleReturnItemRowId,
    ]
  );

  return {
    primaryId,
    secondaryId,
    selectedId,
  };
};
/**
 * Same idea for item_ledger — call after recordItemLedger inserts/updates a row,
 * passing the ledger row's own id and the Selected_Unit text it was saved with.
 */
export const syncUnitIdForLedgerRow = async (connection, {
  ledgerRowId,        // item_ledger.id
  Selected_Unit,
}) => {
  const selectedId = await resolveUnitId(connection, Selected_Unit);

  await connection.query(
    `UPDATE item_ledger SET Selected_Unit_Id = ? WHERE id = ?`,
    [selectedId, ledgerRowId]
  );

  return selectedId;
};