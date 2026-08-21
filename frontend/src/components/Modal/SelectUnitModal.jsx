
import { useEffect, useState } from "react";
import { useAddItemConversionMutation, useGetItemConversionsQuery } from "../../redux/api/itemApi";

export default function SelectUnitModal({
  units = [],
  onClose,
  onSave,
  Item_Id,               // 🔹 NEW — needed to fetch/save conversions
  initialBase = "",
  initialSecondary = "",
  //initialConversionRate = "",
}) {
  const [baseUnit, setBaseUnit] = useState(initialBase || "");
  const [secondaryUnit, setSecondaryUnit] = useState(initialSecondary || "");
  const [customRate, setCustomRate] = useState("");
  const [selectedRate, setSelectedRate] = useState(null);
  const [conversionError, setConversionError] = useState("");

  // const {
  //   data: allConversions = [],
  // } = useGetItemConversionsQuery(Item_Id, {
  //   skip: !Item_Id,
  // });

   const {
    data: allConversions = [],
  } = useGetItemConversionsQuery();

  const [addItemConversion, { isLoading: isSavingConversion }] =
    useAddItemConversionMutation();

  const suggestions = (() => {
    if (!baseUnit || !secondaryUnit || baseUnit === secondaryUnit) return [];

    const knownRates = {
      // ── WEIGHT ──
      "gm-kgs": 0.001,
      "kgs-gm": 1000,
      "mgs-gm": 0.001,
      "gm-mgs": 1000,
      "mgs-kgs": 0.000001,
      "kgs-mgs": 1000000,
      "kgs-ton": 0.001,
      "ton-kgs": 1000,
      "kgs-qtl": 0.01,
      "qtl-kgs": 100,

      // ── VOLUME ──
      "Ml-Ltr": 0.001,
      "Ltr-Ml": 1000,
      "Ml-kl": 0.000001,
      "kl-Ml": 1000000,
      "Ltr-kl": 0.001,
      "kl-Ltr": 1000,

      // ── LENGTH ──
      "mm-cm": 0.1,
      "cm-mm": 10,
      "cm-mtr": 0.01,
      "mtr-cm": 100,
      "mm-mtr": 0.001,
      "mtr-mm": 1000,
      "mtr-km": 0.001,
      "km-mtr": 1000,
      "inch-ft": 0.0833,
      "ft-inch": 12,
      "ft-yd": 0.333,
      "yd-ft": 3,

      // ── COUNT / PACKAGING ──
      "pcs-dzn": 0.0833,
      "dzn-pcs": 12,
      "pcs-gross": 0.00694,
      "gross-pcs": 144,
      "dzn-gross": 0.0833,
      "gross-dzn": 12,

      // ── AREA ──
      "sqft-sqm": 0.0929,
      "sqm-sqft": 10.7639,
      "sqft-sqyd": 0.1111,
      "sqyd-sqft": 9,
    };

    const key = `${baseUnit}-${secondaryUnit}`.toLowerCase();
    const rate = knownRates[key];

    return rate !== undefined ? [rate] : [];
  })();

  // 🔹 saved conversions — filtered to the CURRENT base/secondary pair only
  //    (e.g. Kg→Box shows only Kg→Box history, Kg→Gm shows only Kg→Gm history)
  const savedConversions = allConversions.filter(
    (c) =>
      String(c.Primary_Unit) === String(baseUnit) &&
      String(c.Secondary_Unit) === String(secondaryUnit)
  );

  const baseLabel = units.find((u) => u.Unit_Shorthand === baseUnit)?.Unit_Name || baseUnit;
  const secondaryLabel = units.find((u) => u.Unit_Shorthand === secondaryUnit)?.Unit_Name || secondaryUnit;

  useEffect(() => {
    setSelectedRate(null);
    setCustomRate("");
    setConversionError("");
  }, [baseUnit, secondaryUnit]);

  const handleSave = async () => {
    setConversionError("");

    // 1. NEITHER SELECTED
    if (!baseUnit && !secondaryUnit) {
      onSave({ baseUnit: null, secondaryUnit: null, conversionRate: null });
      return;
    }

    // 2. NO SECONDARY UNIT — conversion not required
    if (!secondaryUnit) {
      onSave({ baseUnit, secondaryUnit: null, conversionRate: null });
      return;
    }

    // 3. SECONDARY EXISTS BUT NOTHING SELECTED
    if (!selectedRate) {
      setConversionError("Please select a conversion rate");
      return;
    }

    let rate = null;

    // 4. CUSTOM RATE
    if (selectedRate === "custom") {
      rate = Number(customRate);
      if (customRate.trim() === "" || !Number.isFinite(rate) || rate <= 0) {
        setConversionError("Please enter conversion rate");
        return;
      }
    }
    // 5. STANDARD SUGGESTION
    else if (selectedRate.startsWith("suggestion-")) {
      const index = Number(selectedRate.replace("suggestion-", ""));
      rate = Number(suggestions[index]);
    }
    // 6. SAVED CONVERSION
    else if (selectedRate.startsWith("saved-")) {
      const id = selectedRate.replace("saved-", "");
      const saved = savedConversions.find((c) => String(c.id) === String(id));
      rate = saved ? Number(saved.Conversion_Rate) : null;
    }

    // 7. FINAL SAFETY CHECK
    if (!rate || rate <= 0) {
      setConversionError("Please enter conversion rate");
      return;
    }
    console.log("Calling API", {
  Item_Id,
  Primary_Unit: baseUnit,
  Secondary_Unit: secondaryUnit,
  Conversion_Rate: rate,
});

    // 8. PERSIST to item_unit_conversions (so it shows up next time as "saved")
    // if (Item_Id) {
    //   try {
    //     await addItemConversion({
    //       Item_Id,
    //       Primary_Unit: baseUnit,
    //       Secondary_Unit: secondaryUnit,
    //       Conversion_Rate: rate,
    //     }).unwrap();
    //   } catch (err) {
    //     console.error("Failed to save conversion history:", err);
    //     // don't block the form save on this — conversion history is a nice-to-have
    //   }
    // }
    try {
  await addItemConversion({
    Primary_Unit: baseUnit,
    Secondary_Unit: secondaryUnit,
    Conversion_Rate: rate,
  }).unwrap();
} catch (err) {
  console.error("Failed to save conversion history:", err);
}

    // 9. UPDATE PARENT FORM STATE
    onSave({ baseUnit, secondaryUnit, conversionRate: rate });
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
        backdropfilter: "blur(4px)",
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
            <select
              value={baseUnit}
              onChange={(e) => {
                const value = e.target.value;
                setBaseUnit(value);
                if (!value) {
                  setSelectedRate(null);
                  setCustomRate("");
                  setConversionError("");
                }
              }}
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
            <select
              value={secondaryUnit}
              onChange={(e) => {
                const value = e.target.value;
                setSecondaryUnit(value);
                setConversionError("");
                setSelectedRate(null);
                setCustomRate("");
              }}
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
            </select>
          </div>
        </div>

        {/* ── Conversion Rates — only when both selected ── */}
        {secondaryUnit && baseUnit && (
          <div className="mb-6">
            <p className="font-semibold text-gray-700 mb-3" style={{ fontSize: 14 }}>
              Conversion Rates
            </p>

            <div className="flex flex-col gap-3">

              {/* CUSTOM RATE */}
              <div
                className="flex items-center gap-2 flex-nowrap cursor-pointer"
                onClick={() => setSelectedRate("custom")}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    border: `2px solid ${selectedRate === "custom" ? "#4CA1AF" : "#9ca3af"}`,
                    backgroundColor: selectedRate === "custom" ? "#4CA1AF" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {selectedRate === "custom" && (
                    <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "white" }} />
                  )}
                </div>

                <span className="whitespace-nowrap text-sm">
                  1 <strong>{baseLabel.toUpperCase()}</strong>
                </span>
                <span className="text-sm">=</span>

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

                <span className="whitespace-nowrap text-sm">
                  {secondaryLabel.toUpperCase()}
                </span>
              </div>

              {/* STANDARD SUGGESTIONS */}
              {suggestions.map((rate, i) => {
                const rowKey = `suggestion-${i}`;
                const isChecked = selectedRate === rowKey;

                return (
                  <div
                    key={rowKey}
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => setSelectedRate(rowKey)}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        border: `2px solid ${isChecked ? "#4CA1AF" : "#9ca3af"}`,
                        backgroundColor: isChecked ? "#4CA1AF" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {isChecked && (
                        <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "white" }} />
                      )}
                    </div>

                    <span className="text-sm">
                      1 <strong>{baseLabel.toUpperCase()}</strong> = <strong>{rate}</strong>{" "}
                      {secondaryLabel.toUpperCase()}
                    </span>
                  </div>
                );
              })}

              {/* SAVED CONVERSION HISTORY — filtered to this exact base/secondary pair */}
              {savedConversions.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-gray-500 mt-2">
                    Previously Used
                  </p>

                  {savedConversions.map((conversion) => {
                    const rate = Number(conversion.Conversion_Rate);
                    const rowKey = `saved-${conversion.id}`;
                    const isChecked = selectedRate === rowKey;

                    return (
                      <div
                        key={rowKey}
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => {
                          setSelectedRate(rowKey);
                          setCustomRate(String(rate));
                        }}
                      >
                        {/* 🔹 same custom-styled circle used for custom-rate/suggestion rows above,
                            instead of a bare native <input type="radio"> that rendered tiny/inconsistent */}
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            border: `2px solid ${isChecked ? "#4CA1AF" : "#9ca3af"}`,
                            backgroundColor: isChecked ? "#4CA1AF" : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {isChecked && (
                            <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "white" }} />
                          )}
                        </div>

                        <span className="text-sm">
                          1 <strong>{baseLabel.toUpperCase()}</strong>
                          {" = "}
                          <strong>{rate}</strong>{" "}
                          {secondaryLabel.toUpperCase()}
                        </span>
                      </div>
                    );
                  })}
                </>
              )}

            </div>
          </div>
        )}

        {conversionError && (
          <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 8 }}>
            {conversionError}
          </p>
        )}

        {/* ── Footer ── */}
        <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 16, display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSavingConversion}
            className="text-white font-semibold px-6 py-2 rounded-md"
            style={{
              backgroundColor: "#4CA1AF",
              border: "none",
              cursor: isSavingConversion ? "not-allowed" : "pointer",
              opacity: isSavingConversion ? 0.6 : 1,
              fontSize: 14,
            }}
          >
            {isSavingConversion ? "Saving..." : "SAVE"}
          </button>
        </div>
      </div>
    </div>
  );
}