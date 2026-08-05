import { useEffect, useState } from "react";

/**
 * SelectUnitModal
 *
 * Props:
 *   units        — array of { Unit_Shorthand, Unit_Name } from useGetAllItemUnitsQuery
 *   onClose      — () => void
 *   onSave       — ({ baseUnit, secondaryUnit, conversionRate }) => void
 *   initialBase  — pre-selected base unit shorthand (optional)
 */
export default function SelectUnitModal({ units = [], onClose, onSave,
  initialBase = "",
  initialSecondary = "",
  initialConversionRate = "",
  conversionHistory = [],
}) {
  const [baseUnit, setBaseUnit] = useState(initialBase || "");


  //const [customRate, setCustomRate]       = useState("0");
  const [secondaryUnit, setSecondaryUnit] = useState(
    initialSecondary || ""
  );

  // const [selectedRate, setSelectedRate] = useState(null);

  // const [customRate, setCustomRate] = useState(
  //   initialConversionRate
  //     ? String(Number(initialConversionRate))
  //     : "0"
  // );
  const [customRate, setCustomRate] = useState("");
  const [selectedRate, setSelectedRate] = useState(null);
  const [conversionError, setConversionError] = useState("");

  console.log("Modal opened")
  // Suggested conversion rates between the two selected units
  // In a real app these would come from a lookup table.
  // Here we generate one standard suggestion if units differ, otherwise just custom.
  const suggestions = (() => {
    if (!baseUnit || !secondaryUnit || baseUnit === secondaryUnit) return [];

    // Well-known pairs — extend as needed
    const knownRates = {
      "Gm-Kg": 0.001,
      "Kg-Gm": 1000,
      "ml-l": 0.001,
      "l-ml": 1000,
      "cm-m": 0.01,
      "m-cm": 100,
    };
    const key = `${baseUnit}-${secondaryUnit}`;
    const rate = knownRates[key];
    return rate !== undefined ? [rate] : [];
  })();
  const savedConversions = [
    // Current value from add_item
    ...(initialConversionRate &&
      baseUnit === initialBase &&
      secondaryUnit === initialSecondary
      ? [
        {
          id: "current",
          Primary_Unit: initialBase,
          Secondary_Unit: initialSecondary,
          Conversion_Rate: Number(initialConversionRate),
        },
      ]
      : []),

    // Previous values from item_unit_conversions
    ...conversionHistory.filter(
      (c) =>
        String(c.Primary_Unit) === String(baseUnit) &&
        String(c.Secondary_Unit) === String(secondaryUnit) &&
        Number(c.Conversion_Rate) !== Number(initialConversionRate)
    ),
  ];
  const baseLabel = units.find((u) => u.Unit_Shorthand === baseUnit)?.Unit_Name || baseUnit;
  const secondaryLabel = units.find((u) => u.Unit_Shorthand === secondaryUnit)?.Unit_Name || secondaryUnit;

  // When suggestions change, reset radio selection
  // useEffect(() => {
  //   setSelectedRate(null);

  //   if (
  //     baseUnit === initialBase &&
  //     secondaryUnit === initialSecondary &&
  //     initialConversionRate
  //   ) {
  //     setCustomRate(String(Number(initialConversionRate)));
  //   } else {
  //     setCustomRate("0");
  //   }
  // }, [
  //   baseUnit,
  //   secondaryUnit,
  //   initialBase,
  //   initialSecondary,
  //   initialConversionRate,
  // ]);
  useEffect(() => {
    setSelectedRate(null);
    setCustomRate("");
  }, [baseUnit, secondaryUnit]);

  // const handleSave = () => {
  //   const rate =
  //     selectedRate !== null && suggestions[selectedRate] !== undefined
  //       ? suggestions[selectedRate]
  //       : parseFloat(customRate) || 0;

  //   onSave({
  //     baseUnit,
  //     secondaryUnit: secondaryUnit || null,
  //     conversionRate: secondaryUnit ? rate : null,
  //   });
  // };
  
  console.log("baseUnit", baseUnit);
  console.log("secondaryUnit", secondaryUnit);
  const handleSave = () => {
    setConversionError("");

    // ==========================================
    // 1. BASE UNIT REQUIRED
    // ==========================================
  if (!baseUnit && !secondaryUnit) {
  onSave({
    baseUnit: null,
    secondaryUnit: null,
    conversionRate: null,
  });
  return;
}

    // ==========================================
    // 2. NO SECONDARY UNIT
    // Conversion is not required
    // ==========================================
    if (!secondaryUnit) {
      onSave({
        baseUnit,
        secondaryUnit: null,
        conversionRate: null,
      });

      return;
    }

    // ==========================================
    // 3. SECONDARY EXISTS BUT NOTHING SELECTED
    // ==========================================
    if (!selectedRate) {
      setConversionError("Please select a conversion rate");
      return;
    }

    let rate = null;

    // ==========================================
    // 4. CUSTOM RATE
    // ==========================================
    if (selectedRate === "custom") {
      rate = Number(customRate);

      // blank / 0 / invalid
      if (
        customRate.trim() === "" ||
        !Number.isFinite(rate) ||
        rate <= 0
      ) {
        setConversionError("Please enter conversion rate");
        return;
      }
    }

    // ==========================================
    // 5. STANDARD SUGGESTION
    // ==========================================
    else if (selectedRate.startsWith("suggestion-")) {
      const index = Number(
        selectedRate.replace("suggestion-", "")
      );

      rate = Number(suggestions[index]);
    }

    // ==========================================
    // 6. SAVED CONVERSION
    // ==========================================
    else if (selectedRate.startsWith("saved-")) {
      const id = selectedRate.replace("saved-", "");

      const saved = savedConversions.find(
        (c) => String(c.id) === String(id)
      );

      rate = saved
        ? Number(saved.Conversion_Rate)
        : null;
    }

    // ==========================================
    // 7. FINAL SAFETY CHECK
    // ==========================================
    if (!rate || rate <= 0) {
      setConversionError("Please enter conversion rate");
      return;
    }

    // ==========================================
    // 8. SAVE
    // ==========================================
    onSave({
      baseUnit,
      secondaryUnit,
      conversionRate: rate,
    });
  };
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(4px)",
        zIndex: 50,
      }}
    >
      <div
        className="bg-white rounded-xl shadow-xl"
        style={{ width: 480, maxWidth: "95vw", padding: "28px 28px 20px" }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-semibold text-gray-800" style={{ fontSize: 17, margin: 0 }}>
            Select Unit
          </h4>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 18, color: "#6b7280" }}
          >
            ✕
          </button>
        </div>

        {/* ── Unit selects ── */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Base Unit */}
          <div className="flex flex-col gap-1">
            <span style={{ fontSize: 11, fontWeight: 700, color: "#4CA1AF", letterSpacing: "0.06em" }}>
              BASE UNIT
            </span>
            {/* <select
              value={baseUnit}
              onChange={(e) => setBaseUnit(e.target.value)}
              style={{
                border: "2px solid #4CA1AF",
                borderRadius: 6,
                padding: "8px 10px",
                fontSize: 14,
                color: "#1f2937",
                outline: "none",
                backgroundColor: "white",
              }}
            >
              <option value="">Select unit</option>
              {units.map((u) => (
                <option key={u.Unit_Shorthand} value={u.Unit_Shorthand}>
                  {u.Unit_Name.toUpperCase()} ({u.Unit_Shorthand})
                </option>
              ))}
            </select> */}
            <select
              value={baseUnit}
              onChange={(e) => {
                const value = e.target.value;
                setBaseUnit(value);

                // If no base unit, clear everything else
                if (!value) {
                  //setSecondaryUnit("");
                  setSelectedRate(null);
                  setCustomRate("");
                  setConversionError("");
                }
              }}
            >
              <option value="">None</option>

              {units.map((u) => (
                <option key={u.Unit_Shorthand} value={u.Unit_Shorthand}>
                  {u.Unit_Name.toUpperCase()} ({u.Unit_Shorthand})
                </option>
              ))}
            </select>
          </div>

          {/* Secondary Unit */}
          <div className="flex flex-col gap-1">
            <span style={{ fontSize: 11, fontWeight: 700, color: "#4CA1AF", letterSpacing: "0.06em" }}>
              SECONDARY UNIT
            </span>
            {/* <select
              value={secondaryUnit}
              onChange={(e) => setSecondaryUnit(e.target.value)}
              style={{
                border: "1px solid #d1d5db",
                borderRadius: 6,
                padding: "8px 10px",
                fontSize: 14,
                color: "#1f2937",
                outline: "none",
                backgroundColor: "white",
              }}
            >
              <option value="">None</option>
              {units
                .filter((u) => u.Unit_Shorthand !== baseUnit)
                .map((u) => (
                  <option key={u.Unit_Shorthand} value={u.Unit_Shorthand}>
                    {u.Unit_Name.toUpperCase()} ({u.Unit_Shorthand})
                  </option>
                ))}
            </select> */}
            <select
              value={secondaryUnit}
              onChange={(e) => {
                const value = e.target.value;
                setSecondaryUnit(value);
                 setConversionError("");
                // Reset conversion selection whenever secondary changes
                setSelectedRate(null);
                setCustomRate("");
              }}
              //disabled={!baseUnit}
            >
              <option value="">None</option>

              {units
                .filter((u) => u.Unit_Shorthand !== baseUnit)
                .map((u) => (
                  <option key={u.Unit_Shorthand} value={u.Unit_Shorthand}>
                    {u.Unit_Name.toUpperCase()} ({u.Unit_Shorthand})
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* ── Conversion Rates — only when secondary is selected ── */}
        {secondaryUnit && baseUnit && (
          <div className="mb-6">
            <p className="font-semibold text-gray-700 mb-3" style={{ fontSize: 14 }}>
              Conversion Rates
            </p>


            <div className="flex flex-col gap-3">

              {/* ========================================= */}
              {/* CUSTOM RATE */}
              {/* ========================================= */}

              <div
                className="flex items-center gap-2 flex-nowrap cursor-pointer"
                onClick={() => setSelectedRate("custom")}
              >
                {/* Radio */}
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    border: `2px solid ${selectedRate === "custom" ? "#4CA1AF" : "#9ca3af"
                      }`,
                    backgroundColor:
                      selectedRate === "custom" ? "#4CA1AF" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {selectedRate === "custom" && (
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        backgroundColor: "white",
                      }}
                    />
                  )}
                </div>

                {/* Base unit */}
                <span className="whitespace-nowrap text-sm">
                  1 <strong>{baseLabel.toUpperCase()}</strong>
                </span>

                {/* Equal */}
                <span className="text-sm">=</span>

                {/* Custom rate */}
                <input
                  type="text"
                  value={customRate}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedRate("custom");
                  }}
                  onChange={(e) => {
                    setSelectedRate("custom");
                    setCustomRate(e.target.value.replace(/[^0-9.]/g, ""));
                  }}
                  style={{
                    width: "100px",
                    height: "30px",
                    border: "1px solid #d1d5db",
                    borderRadius: 4,
                    padding: "3px 8px",
                    fontSize: 14,
                    outline: "none",
                    margin: 0,
                    flexShrink: 0,
                  }}
                />

                {/* Secondary unit */}
                <span className="whitespace-nowrap text-sm">
                  {secondaryLabel.toUpperCase()}
                </span>
              </div>


              {/* ========================================= */}
              {/* STANDARD SUGGESTIONS */}
              {/* ========================================= */}

              {suggestions.map((rate, i) => (
                <label
                  key={`suggestion-${i}`}
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => setSelectedRate(`suggestion-${i}`)}
                >
                  <input
                    type="radio"
                    checked={selectedRate === `suggestion-${i}`}
                    onChange={() =>
                      setSelectedRate(`suggestion-${i}`)
                    }
                  />

                  <span >
                    1
                    <strong>{baseLabel.toUpperCase()}</strong>

                    <strong>{rate}</strong>{" "}
                    {secondaryLabel.toUpperCase()}
                  </span>
                </label>
              ))}


              {/* ========================================= */}
              {/* SAVED CONVERSION HISTORY */}
              {/* ========================================= */}

              {savedConversions.map((conversion) => {
                const rate = Number(conversion.Conversion_Rate);

                return (
                  <label
                    key={`saved-${conversion.id}`}
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() =>
                      setSelectedRate(`saved-${conversion.id}`)
                    }
                  >
                    <input
                      type="radio"
                      checked={
                        selectedRate === `saved-${conversion.id}`
                      }
                      onChange={() =>
                        setSelectedRate(`saved-${conversion.id}`)
                      }
                    />

                    <span style={{ fontSize: 14 }}>
                      1{" "}
                      <strong>{baseLabel.toUpperCase()}</strong>
                      {" = "}
                      <strong>{rate}</strong>{" "}
                      {secondaryLabel.toUpperCase()}
                    </span>
                  </label>
                );
              })}

            </div>
          </div>
        )}
        {conversionError && (
          <p
            style={{
              color: "#ef4444",
              fontSize: 13,
              marginBottom: 8,
            }}
          >
            {conversionError}
          </p>
        )}
        {/* ── Divider + Footer ── */}
        <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 16, display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={handleSave}
            //disabled={!baseUnit}
            className="text-white font-semibold px-6 py-2 rounded-md"
            // style={{
            //   backgroundColor: baseUnit ? "#4CA1AF" : "#9ca3af",
            //   border: "none",
            //   cursor: baseUnit ? "pointer" : "not-allowed",
            //   fontSize: 14,
            // }}
             style={{
              backgroundColor:"#4CA1AF",
              border: "none",
              cursor: "pointer" ,
              fontSize: 14,
            }}
          >
            SAVE
          </button>
        </div>
      </div>
    </div>
  );
}