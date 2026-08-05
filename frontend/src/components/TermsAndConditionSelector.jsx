import { useEffect, useRef, useState } from "react";
import TermsConditionsModal from "./Modal/TermsConditionsModal";
import { useCreateTermsMutation } from "../redux/api/termsConditionsApi";

export function TermsAndConditionsSelector({
  termsList = [],
  value = null,
  description = "",
  onChange,
  onRefresh,
  applicable = null,
}) {
  const [dropOpen, setDropOpen] = useState(false);
  const [modal, setModal] = useState({ open: false, data: null });
  const dropRef = useRef(null);
  //const hasEditedRef = useRef(false);  // add this near your other refs

  // Reset it whenever a new item is selected from dropdown:
  // In your dropdown onClick where you select a term:

  const [justSaved, setJustSaved] = useState(null);
  const [addTerms, { isLoading }] = useCreateTermsMutation();

  const selected =
    justSaved && String(justSaved.id) === String(value)
      ? justSaved
      : termsList.find((t) => String(t.id) === String(value)) || null;

  const [previewText, setPreviewText] = useState(selected?.Terms || "");
  const [selectedTitle, setSelectedTitle] = useState(selected?.Title || "");
  const isUserEditingRef = useRef(false);
  // sync when selected changes from outside (edit form load, refetch lands)
  // useEffect(() => {
  //   setPreviewText(selected?.Terms || "");
  //   if (selected?.Title) setSelectedTitle(selected.Title);
  // }, [selected?.id]);
  useEffect(() => {
    // Textarea caused ID to become null.
    // Do NOT touch previewText.
    if (isUserEditingRef.current) {
      isUserEditingRef.current = false;
      return;
    }

    if (value) {
      const selectedTemplate = termsList.find(
        (t) => String(t.id) === String(value)
      );

      setSelectedTitle(selectedTemplate?.Title || "");

      setPreviewText(
        description ||
        selectedTemplate?.Terms ||
        ""
      );

      return;
    }

    // External custom value, e.g. Edit page initial load
    if (description) {
      setSelectedTitle("");
      setPreviewText(description);
      return;
    }

    setSelectedTitle("");
    setPreviewText("");

  }, [value, description, termsList]);
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSave = async (formData) => {
    try {
      const res = await addTerms(formData).unwrap();
      if (!res?.success || !res?.term) return;

      const savedTerm = res.term;
      const isApplicable =
        !applicable ||
        savedTerm[applicable] === 1 ||
        savedTerm[applicable] === true;

      if (isApplicable) {
        //setJustSaved(savedTerm);
        //setSelectedTitle(savedTerm.Title);
        //setPreviewText(savedTerm.Terms);
        // Also reset in handleSave when justSaved:
        setJustSaved(savedTerm);
        setSelectedTitle(savedTerm.Title);
        setPreviewText(savedTerm.Terms);
        //hasEditedRef.current = false;
        onChange?.({
          Terms_Conditions_Id: savedTerm.id,
          Terms_Conditions_Description: savedTerm.Terms,
        });
      }
      onRefresh?.();
      setModal({ open: false, data: null });
    } catch (err) {
      console.error("Failed to save terms:", err);
    }
  };

  const justSavedIsApplicable =
    justSaved &&
    (!applicable || justSaved[applicable] === 1 || justSaved[applicable] === true);

  const ACCENT = "#4CA1AF";
  console.log(previewText);
  console.log(termsList);
  return (
    <>
      <style>{`
        .tnc-drop-item { transition: background 0.12s; }
        .tnc-drop-item:hover { background: #f4f9fa; }
      `}</style>

      <div className="flex flex-col gap-2 w-full overflow-y-auto">
        <span className="text-sm font-semibold text-gray-800">Terms &amp; Conditions</span>

        <div className="relative" ref={dropRef}>
          <div
            onClick={() => setDropOpen((p) => !p)}
            className="flex items-center justify-between w-full border border-gray-300 rounded-lg px-3 py-2 bg-white cursor-pointer text-sm hover:border-[#4CA1AF] transition-colors"
          >
            {/* 🔹 use selectedTitle — persists even after textarea edits */}
            <span className={selectedTitle ? "text-gray-900" : "text-gray-400"}>
              {selectedTitle || "Select Title"}
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

              {/* None option */}
              <div
                onClick={() => {
                  setJustSaved(null);
                  setSelectedTitle("");   // 🔹 clear title
                  setPreviewText("");     // 🔹 clear textarea
                  onChange?.({
                    Terms_Conditions_Id: null,
                    Terms_Conditions_Description: null,
                  });
                  setDropOpen(false);
                }}
                className="tnc-drop-item px-3 py-2 text-sm cursor-pointer text-gray-500"
              >
                None
              </div>

              {(() => {
                const listToShow =
                  justSavedIsApplicable &&
                    !termsList.some((t) => String(t.id) === String(justSaved.id))
                    ? [justSaved, ...termsList]
                    : termsList;

                if (listToShow.length === 0) {
                  return (
                    <p className="px-3 py-2 text-xs text-gray-400">No terms saved yet</p>
                  );
                }

                return listToShow.map((t) => {
                  const isSelected = String(value) === String(t.id);
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
                          setSelectedTitle(t.Title);
                          setPreviewText(t.Terms);
                          //hasEditedRef.current = false;   // ← reset on new selection
                          onChange?.({
                            Terms_Conditions_Id: t.id,
                            Terms_Conditions_Description: t.Terms,
                          });
                          setDropOpen(false);
                        }}


                      // onClick={() => {
                      //   setSelectedTitle(t.Title);   // 🔹 store title locally
                      //   setPreviewText(t.Terms);     // 🔹 sync textarea
                      //   onChange?.({
                      //     Terms_Conditions_Id: t.id,
                      //     Terms_Conditions_Description: t.Terms,
                      //   });
                      //   setDropOpen(false);
                      // }}
                      >
                        {t.Title}
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
        <textarea
          value={previewText}
          onChange={(e) => {
            const newVal = e.target.value;

            // VERY IMPORTANT:
            // Tell synchronization effect that this change
            // originated from the textarea.
            isUserEditingRef.current = true;

            // Native textarea gives the FULL resulting text.
            setPreviewText(newVal);

            // Description modified → template/title no longer applies
            setSelectedTitle("");
            setJustSaved(null);

            if (!newVal.trim()) {
              onChange?.({
                Terms_Conditions_Id: null,
                Terms_Conditions_Description: null,
              });
            } else {
              onChange?.({
                Terms_Conditions_Id: null,
                Terms_Conditions_Description: newVal,
              });
            }
          }}
          rows={4}
          placeholder="Selected terms and conditions appear here"
          className="w-full border border-gray-200 rounded-lg px-3 py-3 bg-white text-xs leading-5 text-gray-700 resize-none focus:outline-none focus:border-[#4CA1AF] transition-colors"
          style={{ minHeight: 72 }}
        />
        {/* <textarea
          value={previewText}
          onChange={(e) => {
            const newVal = e.target.value;

            // Always keep exactly what user typed/edited.
            // Native textarea already supports:
            // - adding at beginning
            // - adding at end
            // - editing middle
            // - replacing all
            // - clearing all
            setPreviewText(newVal);

            // =====================================================
            // User modified description
            // → it is now custom bill-specific terms
            // → unlink from selected master template
            // → clear displayed title
            // =====================================================

            setSelectedTitle("");
            setJustSaved(null);

            if (!newVal.trim()) {
              // Completely cleared
              onChange?.({
                Terms_Conditions_Id: null,
                Terms_Conditions_Description: null,
              });
            } else {
              // Custom description
              onChange?.({
                Terms_Conditions_Id: null,
                Terms_Conditions_Description: newVal,
              });
            }
          }}
          rows={4}
          placeholder="Selected terms and conditions appear here"
          className="w-full border border-gray-200 rounded-lg px-3 py-3 bg-white text-xs leading-5 text-gray-700 resize-none focus:outline-none focus:border-[#4CA1AF] transition-colors"
          style={{ minHeight: 72 }}
        /> */}

      </div>

      {modal.open && (
        <TermsConditionsModal
          initialData={modal.data}
          onClose={() => setModal({ open: false, data: null })}
          onSave={handleSave}
          isSaving={isLoading}
          applicable={applicable}
        />
      )}
    </>
  );
}

export default TermsAndConditionsSelector;