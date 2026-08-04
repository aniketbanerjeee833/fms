import { useEffect, useRef, useState } from "react";
import TermsConditionsModal from "./Modal/TermsConditionsModal";
import { useCreateTermsMutation } from "../redux/api/termsConditionsApi";

export function TermsAndConditionsSelector({
  termsList = [],
  value = null,
  onChange,
  onRefresh,
}) {
  const [dropOpen, setDropOpen] = useState(false);
  const [modal, setModal] = useState({ open: false, data: null });
  const dropRef = useRef(null);

  const [addTerms, { isLoading }] = useCreateTermsMutation();

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = termsList.find((t) => String(t.id) === String(value)) || null;
  console.log(selected);

  const handleSave = async (formData) => {
    try {
      const res = await addTerms(formData).unwrap();

      // ✅ your backend response — confirm exact shape, adjust key if needed
      const template = res.template;

      onRefresh?.();

      onChange?.({
        Terms_Condition_Id: template.id,
        Terms_Condition_Description: template.Terms,
      });

      setModal({ open: false, data: null });
    } catch (err) {
      console.error("Failed to save terms:", err);
    }
  };

  const ACCENT = "#4CA1AF";
  return (
    <>
      <style>{`
        .tnc-drop-item { transition: background 0.12s; }
        .tnc-drop-item:hover { background: #f4f9fa; }
      `}</style>

      <div className="flex flex-col gap-2 w-full">
        <span className="text-sm font-semibold text-gray-800">Terms &amp; Conditions</span>

        <div className="relative" ref={dropRef}>
          <div
            onClick={() => setDropOpen((p) => !p)}
            className="flex items-center justify-between w-full border border-gray-300 rounded-lg px-3 py-2 bg-white cursor-pointer text-sm hover:border-[#4CA1AF] transition-colors"
          >
            <span className={selected ? "text-gray-900" : "text-gray-400"}>
              {selected ? selected.Title : "Select Title"}
            </span>
            <span className="text-gray-500" style={{ fontSize: 12 }}>▼</span>
          </div>

          {dropOpen && (
            <div className="absolute top-full left-0 z-30 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 overflow-hidden">
              <div
                onClick={() => {
                  setDropOpen(false);
                  setModal({ open: true, data: null });
                }}
                className="tnc-drop-item px-3 py-2 text-sm cursor-pointer font-medium"
                style={{ color: ACCENT }}
              >
                + Add Terms &amp; Conditions
              </div>
              <div
                onClick={() => {
                  onChange?.({
                    Terms_Condition_Id: null,
                    Terms_Condition_Description: "",
                  });
                  setDropOpen(false);
                }}
                className="tnc-drop-item px-3 py-2 text-sm cursor-pointer text-gray-500"
              >
                None
              </div>

              {termsList.length === 0 && (
                <p className="px-3 py-2 text-xs text-gray-400">No terms saved yet</p>
              )}

              {termsList.map((t) => {
                const isSelected = value === t.id;
                return (
                  <div
                    key={t.id}
                    className="tnc-drop-item flex items-center justify-between px-3 py-2 text-sm cursor-pointer"
                    style={{
                      background: isSelected ? "#eaf6f7" : undefined,
                      color: isSelected ? ACCENT : "#374151",
                      fontWeight: isSelected ? 500 : 400,
                    }}
                  >
                    <span
                      className="flex-1"
                      onClick={() => {
                        onChange?.({
                          Terms_Condition_Id: t.id,
                          Terms_Condition_Description: t.Terms,
                        });
                        setDropOpen(false);
                      }}
                    >
                      {t.Title}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Preview box ── */}
        <div
          className="w-full border border-gray-200 rounded-lg px-3 py-3 bg-white text-sm"
          style={{ minHeight: 72 }}
        >
          {selected?.Terms ? ( // ✅ was Description
            <p className="text-gray-700 whitespace-pre-wrap text-xs leading-5">
              {selected.Terms}
            </p>
          ) : (
            <p className="text-gray-400 italic text-xs">
              Selected terms and conditions appear here
            </p>
          )}
        </div>

        {/* {selected && (
          <button
            type="button"
            onClick={() =>
              onChange?.({
                Terms_Condition_Id: null,
                Terms_Condition_Description: "",
              })
            }
            style={{
              background: "none", border: "none",
              cursor: "pointer", color: "#ef4444",
              fontSize: 12, alignSelf: "flex-end", padding: 0,
            }}
          >
            Clear
          </button>
        )} */}
      </div >

      {
        modal.open && (
          <TermsConditionsModal
            initialData={modal.data}
            onClose={() => setModal({ open: false, data: null })}
            onSave={handleSave}
            isSaving={isLoading}
          />
        )
      }
    </>
  );
}

export default TermsAndConditionsSelector;

