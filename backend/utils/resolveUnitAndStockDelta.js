export function resolveUnitAndStockDelta({
  dbItemRow,
  Selected_Unit,
  Quantity,
}) {
  const qty = Number(Quantity) || 0;

  const primaryUnit =
    dbItemRow?.Primary_Unit || null;

  const secondaryUnit =
    dbItemRow?.Secondary_Unit || null;

  const conversionRate =
    Number(dbItemRow?.Conversion_Rate) || 0;

  // =========================================================
  // CASE 1: ITEM HAS NO CONFIGURED PRIMARY UNIT
  // =========================================================
  //
  // UI dropdown:
  // None -> null
  // Kg   -> "Kg"
  // Gm   -> "Gm"
  // etc.
  //
  // No conversion exists, so stock uses raw quantity.
  // =========================================================

  if (!primaryUnit) {
    return {
      stockDelta: qty,

      snapshot: {
        Primary_Unit_Snapshot: null,
        Secondary_Unit_Snapshot: null,
      },

      // Preserve exactly what billing selected:
      // null stays null
      // "Kg" stays "Kg"
      // "Gm" stays "Gm"
      resolvedSelectedUnit: Selected_Unit ?? null,
    };
  }

  // =========================================================
  // CASE 2: ITEM HAS CONFIGURED UNITS
  // =========================================================

  const validUnits = [
    primaryUnit,
    secondaryUnit,
  ].filter(Boolean);

  // Once Primary exists, None is NOT allowed.
  // If UI somehow sends null, use primary as fallback.
  const chosenUnit =
    Selected_Unit ?? primaryUnit;

  if (!validUnits.includes(chosenUnit)) {
    throw new Error(
      `Invalid unit "${chosenUnit}" for this item — must be ${validUnits.join(
        " or "
      )}.`
    );
  }

  // =========================================================
  // STOCK CONVERSION
  // =========================================================

  let stockDelta;

  // Primary selected
  if (chosenUnit === primaryUnit) {
    stockDelta = qty;
  }

  // Secondary selected
  else {
    if (conversionRate <= 0) {
      throw new Error(
        `Item has an invalid conversion rate for ${chosenUnit}.`
      );
    }

    // Example:
    // Primary = Kg
    // Secondary = Gm
    // 1 Kg = 1000 Gm
    //
    // 500 Gm -> 500 / 1000 = 0.5 Kg
    stockDelta = qty / conversionRate;
  }

  return {
    stockDelta,

    snapshot: {
      Primary_Unit_Snapshot: primaryUnit,
      Secondary_Unit_Snapshot: secondaryUnit,
    },

    resolvedSelectedUnit: chosenUnit,
  };
}