import { useState, useRef, useEffect } from "react";

/**
 * PaymentTypeSelect
 *
 * Props:
 *   value        — current identifier string ("Cash" | "Cheque" | "bank_1" | "")
 *   banks        — array of { Bank_Account_Id, Account_Display_Name }
 *   onChange     — (identifier: string) => void
 *   onAddBank    — () => void  (opens add-bank modal)
 *   placeholder  — string
 */
export default function PaymentTypeSelect({
    value = "",
    banks = [],
    onChange,
    onAddBank,
    placeholder = "Select Type",
   usedValues = []
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);
const safeValue = String(value || "");

const getLabel = () => {
    if (!safeValue) return "";

    if (safeValue === "Cash") return "Cash";
    if (safeValue === "Cheque") return "Cheque";

    if (safeValue.startsWith("bank_")) {
        const id = Number(safeValue.replace("bank_", ""));
        const bank = banks.find((b) => b.Bank_Account_Id === id);
        return bank?.Account_Display_Name || safeValue;
    }

    return safeValue;
};
    // Build display label from current value
    // const getLabel = () => {
    //     if (!value) return "";
    //     if (value === "Cash") return "Cash";
    //     if (value === "Cheque") return "Cheque";
    //     if (value.startsWith("bank_")) {
    //         const id = Number(value.replace("bank_", ""));
    //         const bank = banks.find((b) => b.Bank_Account_Id === id);
    //         return bank?.Account_Display_Name || value;
    //     }
    //     return value;
    // };

    const options = [
        { value: "Cash", label: "Cash" },
        { value: "Cheque", label: "Cheque" },
        ...banks.map((b) => ({
            value: `bank_${b.Bank_Account_Id}`,
            label: b.Account_Display_Name,
        })),
    ]
    .filter((opt) => {
  if (opt.value === safeValue) return true;
  if (opt.value === "Cheque") return true;
  return !(usedValues || []).includes(opt.value);
});
//     .filter((opt) => {
//   if (opt.value === value) return true;
//   if (opt.value === "Cheque") return true;  // Cheque can be used multiple times
//   return !usedValues.includes(opt.value);
// });
  //const [open, setOpen] = useState(false);
  //const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  //const ref = useRef(null);

  // recalculate position whenever dropdown opens or window scrolls/resizes
//   useEffect(() => {
//     if (!open || !ref.current) return;

//     const update = () => {
//       const rect = ref.current?.getBoundingClientRect();
//       if (rect) {
//         setDropdownPos({
//           top:   rect.bottom + 4,
//           left:  rect.left,
//           width: rect.width,
//         });
//       }
//     };

//     update(); // run immediately on open
//     window.addEventListener("scroll", update, true);
//     window.addEventListener("resize", update);
//     return () => {
//       window.removeEventListener("scroll", update, true);
//       window.removeEventListener("resize", update);
//     };
//   }, [open]);

  // outside click handler — unchanged
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

    return (
        <>
            <div ref={ref} style={{ position: "relative", width: "100%" }}>
                {/* Trigger */}
                <div
                    onClick={() => setOpen((p) => !p)}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        border: "1px solid #d1d5db",
                        borderRadius: 6,
                        padding: "6px 10px",
                        cursor: "pointer",
                        backgroundColor: "white",
                        fontSize: 13,
                        color: value ? "#1f2937" : "#9ca3af",
                        userSelect: "none",
                        height: "3rem"
                    }}
                >
                    <span>{getLabel() || placeholder}</span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 4l4 4 4-4" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>

                {/* Dropdown */}
                {/* Dropdown */}
                {open && (
                    <div style={{
                        position: "absolute",
                        top: "calc(100% + 4px)",
                        left: 0,
                        zIndex: 50,
                        width: "100%",
                        minWidth: 160,
                        background: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                        boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
                        overflow: "hidden",        // clips the rounded corners
                    }}>

                        {/* + Add Bank A/C — sticky at top, never scrolls away */}
                        <div
                            onClick={() => { setOpen(false); onAddBank?.(); }}
                            style={{
                                padding: "9px 14px",
                                fontSize: 13,
                                color: "#4CA1AF",
                                fontWeight: 600,
                                cursor: "pointer",
                                height: "3rem",
                                display: "flex",
                                alignItems: "center",
                                borderBottom: "1px solid #e5e7eb",
                                flexShrink: 0,
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f0f9ff"}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                        >
                            + Add Bank A/C
                        </div>

                        {/* Scrollable options list */}
                        <div style={{ maxHeight: 180, overflowY: "auto" }}>
                            {options.map((opt) => {
                                const isSelected = value === opt.value;
                                return (
                                    <div
                                        key={opt.value}
                                        onClick={() => { onChange?.(opt.value); setOpen(false); }}
                                        style={{
                                            padding: "9px 14px",
                                            fontSize: 13,
                                            cursor: "pointer",
                                            backgroundColor: isSelected ? "#eaf6f7" : "transparent",
                                            color: isSelected ? "#4CA1AF" : "#1f2937",
                                            fontWeight: isSelected ? 500 : 400,
                                        }}
                                        onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = "#f9fafb"; }}
                                        onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = "transparent"; }}
                                    >
                                        {opt.label}
                                    </div>
                                );
                            })}

                            {options.length === 0 && (
                                <div style={{ padding: "9px 14px", fontSize: 12, color: "#9ca3af" }}>
                                    No options
                                </div>
                            )}
                        </div>

                    </div>
                )}
            </div>

        </>
    );
}