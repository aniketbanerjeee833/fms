

// /* ───────────── helpers ───────────── */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import { UploadCloud, Upload, FileSpreadsheet, X, CheckCircle2 } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useGetAllSettingsQuery } from "../../redux/api/Settings/settingsApi";
import {
  useImportItemsExcelMutation,
  useValidateImportRowMutation,
  useImportItemRowsMutation,
} from "../../redux/api/itemApi";

/* ───────────── config ───────────── */
const PRIMARY = "#4CA1AF"; // change here when you switch the theme color
const MAX_FILE_MB = 5;
const MAX_ROWS = 5000;
const DEBOUNCE_MS = 500;
const ROW_H = 44;
const COL_W = 180;
const ROW_COL_W = 64;

const NOTE_LINE =
  "** Please leave the cell value empty if you don't need it. Please don't change the headers.";

/* One definition drives: sample file, header matching, preview, editing.
   Tax Rate / Inclusive Of Tax are intentionally NOT here.
   MRP column is shown only when the show_mrp setting is on. */
const COLUMNS = [
  { header: "Item name*", field: "Item_Name", type: "text", width: 24, sample: ["Item 1", "Item 2", "Item 3"] },
  { header: "Item code", field: "Item_Code", type: "text", width: 14, sample: ["a101", "a102", "a103"] },
  { header: "Category", field: "Item_Category", type: "text", width: 18, sample: [null, null, null] },
  { header: "HSN", field: "Item_HSN", type: "text", width: 12, sample: [null, null, null] },
  { header: "Default MRP", field: "MRP", type: "number", width: 14, mrpOnly: true, sample: [20, 30, 35] },
  { header: "Sale price", field: "Sale_Price", type: "number", width: 12, sample: [20, 30, 35] },
  { header: "Purchase price", field: "Purchase_Price", type: "number", width: 15, sample: [25, 35, 40] },
  { header: "Discount Type", field: "Discount_Type_On_Sale_Price", type: "discountType", width: 18, sample: ["Discount %", "Discount Amount", "Discount %"] },
  { header: "Sale Discount", field: "Discount_On_Sale_Price", type: "number", width: 14, sample: [20, 3, 10] },
  { header: "Opening stock quantity", field: "Opening_Quantity", type: "number", width: 22, sample: [10, 5, 15] },
  { header: "Minimum stock quantity", field: "Min_Stock", type: "number", width: 22, sample: [2, 0, 1] },
  { header: "Item Location", field: "Location", type: "text", width: 16, sample: ["Store 1", "Store 2", null] },
  { header: "Base Unit (x)", field: "Primary_Unit", type: "text", width: 14, sample: ["KG", null, null] },
  { header: "Secondary Unit (y)", field: "Secondary_Unit", type: "text", width: 18, sample: ["GM", null, null] },
  { header: "Conversion Rate (n) (x = ny)", field: "Conversion_Rate", type: "number", width: 28, sample: [1000, null, null] },
];

const DISCOUNT_LABEL = { Percentage: "Discount %", Amount: "Discount Amount" };

/* ───────────── helpers ───────────── */
const norm = (v) => String(v ?? "").trim().toLowerCase();

const numFrom = (v) => {
  const s = String(v ?? "").replace(/,/g, "").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
};

/* values sent to the backend: trimmed, numbers as numbers, blanks dropped */
const toServerData = (data, columns) => {
  const out = {};
  columns.forEach((c) => {
    const raw = data[c.field];
    if (c.type === "number") {
      const n = numFrom(raw);
      if (n === null) return;
      out[c.field] = Number.isNaN(n) ? String(raw).trim() : n;
    } else {
      const s = String(raw ?? "").trim();
      if (s !== "") out[c.field] = s;
    }
  });
  return out;
};

const mergeErrors = (...parts) => {
  const errors = [];
  const fieldErrors = {};
  parts.forEach((p) => {
    (p?.errors || []).forEach((m) => {
      if (!errors.includes(m)) errors.push(m);
    });
    Object.entries(p?.fieldErrors || {}).forEach(([f, msgs]) => {
      fieldErrors[f] = fieldErrors[f] || [];
      (msgs || []).forEach((m) => {
        if (!fieldErrors[f].includes(m)) fieldErrors[f].push(m);
      });
    });
  });
  return { errors, fieldErrors };
};

/* cheap checks that don't need the database (the live API only checks DB/unit rules) */
const clientValidate = (data, columns) => {
  const errors = [];
  const fieldErrors = {};
  const add = (field, msg) => {
    errors.push(msg);
    (fieldErrors[field] = fieldErrors[field] || []).push(msg);
  };

  if (!String(data.Item_Name ?? "").trim()) add("Item_Name", "Item Name is required.");

  columns.forEach((c) => {
    if (c.type !== "number") return;
    const n = numFrom(data[c.field]);
    if (n === null) return;
    if (Number.isNaN(n)) add(c.field, `${c.header}: must be a number`);
    else if (n < 0) add(c.field, `${c.header}: cannot be negative`);
  });

  const disc = numFrom(data.Discount_On_Sale_Price);
  const type = data.Discount_Type_On_Sale_Price;
  const sale = numFrom(data.Sale_Price);

  if (disc && !Number.isNaN(disc) && disc > 0) {
    if (!type) {
      add("Discount_Type_On_Sale_Price", "Discount Type is required when Sale Discount is given");
    } else if (type === "Percentage" && disc > 100) {
      add("Discount_On_Sale_Price", "Sale Discount cannot be more than 100%");
    } else if (type === "Amount" && sale !== null && !Number.isNaN(sale) && disc > sale) {
      add("Discount_On_Sale_Price", "Sale Discount cannot be more than the sale price");
    }
  }

  return { errors, fieldErrors };
};

const normalizeIncomingRow = (r, i, columns) => {
  const data = {};
  columns.forEach((c) => {
    const v = r?.data?.[c.field];
    data[c.field] = v === null || v === undefined ? "" : String(v);
  });
  return {
    rowNo: r?.rowNo ?? i + 2,
    data,
    errors: r?.errors || [],
    fieldErrors: r?.fieldErrors || {},
    validating: false,
  };
};

const inputStyle = (hasError) => ({
  width: "100%",
  height: 30,
  margin: 0,
  padding: "0 8px",
  fontSize: 13,
  boxSizing: "border-box",
  borderRadius: 4,
  border: hasError ? "1px solid #ef4444" : "1px solid #e2e8f0",
  background: hasError ? "#fff1f2" : "#fff",
  color: "#0f172a",
});

/* ───────────── component ───────────── */
export default function ImportExcel() {
  //const [importItemsExcel, { isLoading: importing }] = useImportItemsExcelMutation();
  const [importItemsExcel] = useImportItemsExcelMutation();
  const [validateImportRow] = useValidateImportRowMutation();
  const [importItemRows, { isLoading: importing }] = useImportItemRowsMutation();

  const { data: settingsData } = useGetAllSettingsQuery();
  const settings = settingsData?.settings || [];

  const showMRP =
    Number(settings.find((s) => s.setting_key === "show_mrp")?.setting_value) === 1;

  const activeColumns = useMemo(
    () => COLUMNS.filter((c) => !c.mrpOnly || showMRP),
    [showMRP]
  );

  const fileInputRef = useRef(null);
  const previewScrollRef = useRef(null);

  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState(null); // null = nothing uploaded yet
  const [activeTab, setActiveTab] = useState("correct"); // "correct" | "errors"

  const allRows = useMemo(() => rows || [], [rows]);

  /* refs used by the debounced validation */
  const rowsRef = useRef([]);
  rowsRef.current = allRows;
  const timersRef = useRef(new Map()); // rowNo -> timeout id
  const versionRef = useRef(new Map()); // rowNo -> edit counter (ignores stale responses)

  /* ---- in-file duplicates (the live API can't see other rows) ---- */
  const effectiveRows = useMemo(() => {
    const seenNames = new Set();
    const seenCodes = new Set();

    return allRows.map((row) => {
      const extra = { errors: [], fieldErrors: {} };
      const name = norm(row.data.Item_Name);
      const code = norm(row.data.Item_Code);

      if (name) {
        if (seenNames.has(name)) {
          const m = "Duplicate item name in the file.";
          extra.errors.push(m);
          extra.fieldErrors.Item_Name = [m];
        } else seenNames.add(name);
      }
      if (code) {
        if (seenCodes.has(code)) {
          const m = "Duplicate item code in the file.";
          extra.errors.push(m);
          extra.fieldErrors.Item_Code = [m];
        } else seenCodes.add(code);
      }

      return extra.errors.length ? { ...row, ...mergeErrors(row, extra) } : row;
    });
  }, [allRows]);

  const validRows = useMemo(
    () => effectiveRows.filter((r) => r.errors.length === 0),
    [effectiveRows]
  );
  const errorRows = useMemo(
    () => effectiveRows.filter((r) => r.errors.length > 0),
    [effectiveRows]
  );
  const errorCount = errorRows.length;
  const checking = allRows.some((r) => r.validating);

  const previewRows = activeTab === "errors" ? errorRows : validRows;

  const rowVirtualizer = useVirtualizer({
    count: previewRows.length,
    getScrollElement: () => previewScrollRef.current,
    estimateSize: () => ROW_H,
    overscan: 10,
  });

  const switchTab = (tab) => {
    setActiveTab(tab);
    rowVirtualizer.scrollToOffset(0);
  };

  /* ---- live validation (debounced, per row) ---- */
  const runValidate = useCallback(
    async (rowNo) => {
      const row = rowsRef.current.find((r) => r.rowNo === rowNo);
      if (!row) return;

      const version = versionRef.current.get(rowNo) || 0;
      const local = clientValidate(row.data, activeColumns);

      let server = { errors: [], fieldErrors: {} };
      try {
        const res = await validateImportRow({
          data: toServerData(row.data, activeColumns),
        }).unwrap();
        server = { errors: res?.errors || [], fieldErrors: res?.fieldErrors || {} };
      } catch (err) {
        console.error(err);
        toast.error("Could not check the row. Please try editing it again.", {
          toastId: "validate-row-failed",
        });
        setRows((prev) =>
          prev.map((r) => (r.rowNo === rowNo ? { ...r, validating: false } : r))
        );
        return;
      }

      // the row was edited again while this request was running: ignore this answer
      if ((versionRef.current.get(rowNo) || 0) !== version) return;

      const merged = mergeErrors(local, server);
      setRows((prev) =>
        prev.map((r) =>
          r.rowNo === rowNo
            ? { ...r, errors: merged.errors, fieldErrors: merged.fieldErrors, validating: false }
            : r
        )
      );
    },
    [activeColumns, validateImportRow]
  );

  const scheduleValidate = useCallback(
    (rowNo, delay = DEBOUNCE_MS) => {
      versionRef.current.set(rowNo, (versionRef.current.get(rowNo) || 0) + 1);
      clearTimeout(timersRef.current.get(rowNo));
      timersRef.current.set(
        rowNo,
        setTimeout(() => {
          timersRef.current.delete(rowNo);
          runValidate(rowNo);
        }, delay)
      );
    },
    [runValidate]
  );

  const clearAllTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current.clear();
    versionRef.current.clear();
  };

  useEffect(() => clearAllTimers, []); // cleanup on unmount

  const handleCellChange = (rowNo, field, value) => {
    const current = rowsRef.current.find((r) => r.rowNo === rowNo);
    const oldValue = current?.data?.[field];

    setRows((prev) =>
      prev.map((r) =>
        r.rowNo === rowNo
          ? { ...r, data: { ...r.data, [field]: value }, validating: true }
          : r
      )
    );
    scheduleValidate(rowNo);

    // the old value may have been the "duplicate" of another row: re-check those rows too
    if (field === "Item_Name" || field === "Item_Code") {
      const key = norm(oldValue);
      if (key) {
        rowsRef.current.forEach((r) => {
          if (r.rowNo !== rowNo && r.errors.length > 0 && norm(r.data[field]) === key) {
            scheduleValidate(r.rowNo);
          }
        });
      }
    }
  };

  /* ---- sample download ---- */
  const downloadSample = () => {
    const aoa = [
      activeColumns.map((c) => c.header),
      ...[0, 1, 2].map((i) => activeColumns.map((c) => c.sample[i])),
      [],
      [NOTE_LINE],
    ];

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = activeColumns.map((c) => ({ wch: c.width }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Item Details");
    XLSX.writeFile(wb, "Import_Items_Template.xlsx");
  };

  /* ---- file handling: backend parses + validates every row ---- */
  const handleFile = async (file) => {
    if (!file) return;

    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      toast.error("Please upload an .xls or .xlsx file");
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`File is too large. Maximum ${MAX_FILE_MB} MB`);
      return;
    }

    try {
      setParsing(true);

      const result = await importItemsExcel({ file, dryRun: true }).unwrap();

      const incoming = (result?.rows || []).map((r, i) =>
        normalizeIncomingRow(r, i, activeColumns)
      );

      if (incoming.length === 0) {
        toast.error("No items found in the file");
        return;
      }

      clearAllTimers();
      setRows(incoming);
      setFileName(file.name);
      setActiveTab(incoming.some((r) => r.errors.length === 0) ? "correct" : "errors");
    } catch (err) {
      console.error(err);
      toast.error(err?.data?.message || err?.message || "Could not read the file");
    } finally {
      setParsing(false);
    }
  };

  const onInputChange = (e) => {
    handleFile(e.target.files?.[0]);
    e.target.value = ""; // allow choosing the same file again
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const resetUpload = () => {
    clearAllTimers();
    setRows(null);
    setFileName("");
    setActiveTab("correct");
  };

  /* ---- final import: sends the corrected rows, backend validates AGAIN before inserting ---- */
  const handleImport = async () => {
    const sending = validRows;
    if (sending.length === 0) return;

    const items = sending.map((r) => ({
      rowNo: r.rowNo,
      ...toServerData(r.data, activeColumns),
    }));

    try {
      const res = await importItemRows({ items }).unwrap();

      const failed = new Map((res?.errors || []).map((e) => [e.rowNo, e.messages || []]));
      const sentNos = new Set(sending.map((r) => r.rowNo));
      const importedNos = new Set([...sentNos].filter((n) => !failed.has(n)));

      const remaining = allRows.length - importedNos.size;

      if (remaining === 0) {
        toast.success(res?.message || "Items imported successfully");
        resetUpload();
        return;
      }

      // keep only the rows that did not go in; they come back to the Errors tab
      setRows((prev) =>
        prev
          .filter((r) => !importedNos.has(r.rowNo))
          .map((r) =>
            failed.has(r.rowNo)
              ? { ...r, errors: failed.get(r.rowNo), fieldErrors: {} }
              : r
          )
      );

      // repaint the red cells for rows the backend rejected
      failed.forEach((_, rowNo) => scheduleValidate(rowNo, 100));

      setActiveTab("errors");
      toast.warn(
        `${importedNos.size} imported. ${remaining} row${remaining === 1 ? "" : "s"} still need fixing.`
      );
    } catch (err) {
      console.error(err);
      toast.error(err?.data?.message || err?.message || "Failed to import items");
    }
  };

  /* ---- styles ---- */
  const gridCols = `${ROW_COL_W}px repeat(${activeColumns.length}, ${COL_W}px)`;
  const gridWidth = ROW_COL_W + activeColumns.length * COL_W;

  const headCell = {
    padding: "10px 10px",
    fontSize: 13,
    fontWeight: 600,
    color: "#334155",
    whiteSpace: "nowrap",
  };

  return (
    <div
      className="flex flex-col bg-white"
      style={{ height: "100%", minHeight: 0, overflow: "hidden" }}
    >
      {/* ── TOP BAR ── */}
      <div
        className="flex items-center gap-3 px-5 py-3"
        style={{ borderBottom: "1px solid #e2e8f0", background: "#f8f8f8" }}
      >
        <h4 className="text-xl font-bold m-0 text-gray-800">Import Items From Excel File</h4>
      </div>

      {/* ── BODY ── */}
      <div className="flex flex-col lg:flex-row flex-1" style={{ minHeight: 0, overflowY: "auto" }}>
        {/* ══ LEFT: STEPS ══ */}
        <div className="w-full lg:w-[38%] p-5 flex-none" style={{ borderRight: "1px solid #e2e8f0" }}>
          <h6 className="font-bold text-gray-900 mb-4" style={{ fontSize: 16 }}>
            Steps to Import
          </h6>

          <p className="font-bold uppercase mb-1" style={{ color: PRIMARY, letterSpacing: "0.08em", fontSize: 13 }}>
            Step 1
          </p>
          <p className="text-gray-700 mb-3" style={{ fontSize: 14 }}>
            Create an Excel file with the following format.
          </p>

          <button
            type="button"
            onClick={downloadSample}
            className="rounded-full px-5 py-2 text-sm font-semibold mb-4"
            style={{ background: "#fff", border: `1px solid ${PRIMARY}`, color: PRIMARY, cursor: "pointer" }}
          >
            Download Sample
          </button>

          <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: 4 }}>
            <table style={{ borderCollapse: "collapse", width: "100%" }}>
              <thead>
                <tr>
                  {activeColumns.map((c) => (
                    <th
                      key={c.field}
                      style={{
                        background: PRIMARY,
                        color: "#fff",
                        fontSize: 10,
                        fontWeight: 600,
                        padding: "4px 6px",
                        whiteSpace: "nowrap",
                        textAlign: "left",
                      }}
                    >
                      {c.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[0, 1, 2].map((i) => (
                  <tr key={i}>
                    {activeColumns.map((c) => (
                      <td
                        key={c.field}
                        style={{
                          fontSize: 10,
                          padding: "3px 6px",
                          whiteSpace: "nowrap",
                          borderBottom: "1px solid #f1f5f9",
                          color: "#334155",
                        }}
                      >
                        {c.sample[i] ?? ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-red-500 mt-2" style={{ fontSize: 11 }}>
            {NOTE_LINE}
          </p>

          <p className="font-bold uppercase mt-6 mb-1" style={{ color: PRIMARY, letterSpacing: "0.08em", fontSize: 13 }}>
            Step 2
          </p>
          <div className="flex items-start gap-3">
            <Upload size={20} className="text-gray-600 flex-shrink-0 mt-0.5" />
            <p className="text-gray-700 m-0" style={{ fontSize: 14 }}>
              Upload the file (<b>xlsx or xls</b>) by clicking on the Upload File button below.
            </p>
          </div>

          <p className="font-bold uppercase mt-6 mb-1" style={{ color: PRIMARY, letterSpacing: "0.08em", fontSize: 13 }}>
            Step 3
          </p>
          <p className="text-gray-700 m-0" style={{ fontSize: 14 }}>
            Verify the items from the file &amp; complete the import.
          </p>
        </div>

        {/* ══ RIGHT: UPLOAD ══ */}
        <div className="flex-1 p-5 flex flex-col" style={{ minWidth: 0, minHeight: 0 }}>
          {rows === null && (
            <div className="flex-1 flex flex-col items-center justify-center">
              <p className="text-gray-800 mb-4" style={{ fontSize: 15 }}>
                Upload your <b>.xls/ .xlsx (excel sheet)</b>
              </p>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className="w-full flex flex-col items-center justify-center text-center"
                style={{
                  maxWidth: 640,
                  minHeight: 300,
                  border: `2px dashed ${PRIMARY}`,
                  borderRadius: 8,
                  background: dragging ? `${PRIMARY}1F` : `${PRIMARY}0D`,
                  transition: "background 0.15s",
                }}
              >
                <UploadCloud size={64} strokeWidth={1.2} style={{ color: PRIMARY, opacity: 0.6 }} />
                <p className="text-gray-700 mt-3 mb-1" style={{ fontSize: 16 }}>
                  Drag &amp; Drop files here
                </p>
                <p className="text-gray-600 my-2" style={{ fontSize: 14 }}>
                  or
                </p>

                <button
                  type="button"
                  disabled={parsing}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 rounded-full text-white font-semibold"
                  style={{
                    background: PRIMARY,
                    border: "none",
                    padding: "10px 26px",
                    cursor: parsing ? "not-allowed" : "pointer",
                    opacity: parsing ? 0.7 : 1,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                  }}
                >
                  <Upload size={18} />
                  {parsing ? "Reading file..." : "Upload File"}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xls,.xlsx"
                  onChange={onInputChange}
                  style={{ display: "none" }}
                />
              </div>

              <p className="text-gray-500 mt-3" style={{ fontSize: 12 }}>
                Maximum {MAX_ROWS} items and {MAX_FILE_MB} MB per file.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ═════════════ PREVIEW MODAL ═════════════ */}
      {rows !== null && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{
            background: "rgba(15, 23, 42, 0.45)",
            backdropFilter: "blur(4px)",
            padding: "1rem",
            marginTop: "50px",
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl flex flex-col"
            style={{ width: "96vw", maxWidth: 1600, height: "90vh", overflow: "hidden" }}
          >
            {/* HEADER */}
            <div
              className="flex items-center justify-between gap-4 px-5 py-4"
              style={{ borderBottom: "1px solid #e2e8f0", flexShrink: 0 }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="flex items-center justify-center rounded-lg"
                  style={{ width: 40, height: 40, background: `${PRIMARY}15` }}
                >
                  <FileSpreadsheet size={22} style={{ color: PRIMARY }} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 m-0" style={{ fontSize: 18 }}>
                    Import Preview
                  </h3>
                  <p className="text-gray-500 m-0 truncate" style={{ fontSize: 12, maxWidth: 500 }} title={fileName}>
                    {fileName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={resetUpload}
                disabled={importing}
                className="flex items-center justify-center rounded-lg hover:bg-gray-100"
                style={{
                  width: 36,
                  height: 36,
                  border: "none",
                  background: "transparent",
                  cursor: importing ? "not-allowed" : "pointer",
                }}
                title="Close preview"
              >
                <X size={20} color="#64748b" />
              </button>
            </div>

            {/* SUMMARY + TABS */}
            <div
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
              style={{ borderBottom: "1px solid #e2e8f0", background: "#f8fafc", flexShrink: 0 }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <div className="rounded-full px-3 py-1.5" style={{ background: "#e2e8f0", color: "#334155", fontSize: 13, fontWeight: 600 }}>
                  Total: {allRows.length}
                </div>
                <div className="rounded-full px-3 py-1.5" style={{ background: "#dcfce7", color: "#166534", fontSize: 13, fontWeight: 600 }}>
                  ✓ Correct: {validRows.length}
                </div>
                <div
                  className="rounded-full px-3 py-1.5"
                  style={{
                    background: errorCount ? "#fff1f2" : "#f1f5f9",
                    color: errorCount ? "#be123c" : "#475569",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  ⚠ Errors: {errorCount}
                </div>
                {checking && (
                  <span className="text-gray-500" style={{ fontSize: 12 }}>
                    Checking...
                  </span>
                )}
              </div>

              <div className="flex items-center rounded-lg" style={{ border: "1px solid #cbd5e1", overflow: "hidden", background: "#fff" }}>
                <button
                  type="button"
                  onClick={() => switchTab("correct")}
                  className="px-4 py-2 text-sm font-semibold"
                  style={{
                    border: "none",
                    background: activeTab === "correct" ? `${PRIMARY}15` : "#fff",
                    color: activeTab === "correct" ? PRIMARY : "#64748b",
                    cursor: "pointer",
                  }}
                >
                  Correct ({validRows.length})
                </button>
                <button
                  type="button"
                  onClick={() => switchTab("errors")}
                  className="px-4 py-2 text-sm font-semibold"
                  style={{
                    border: "none",
                    borderLeft: "1px solid #cbd5e1",
                    background: activeTab === "errors" ? "#fff1f2" : "#fff",
                    color: activeTab === "errors" ? "#be123c" : "#64748b",
                    cursor: "pointer",
                  }}
                >
                  Errors ({errorCount})
                </button>
              </div>
            </div>

            {/* TABLE */}
            <div
              ref={previewScrollRef}
              style={{ flex: 1, minHeight: 0, overflow: "auto", background: "#fff" }}
            >
              {/* header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: gridCols,
                  width: gridWidth,
                  position: "sticky",
                  top: 0,
                  zIndex: 20,
                  background: "#f8fafc",
                  borderBottom: "2px solid #e2e8f0",
                }}
              >
                <div style={headCell}>Row</div>
                {activeColumns.map((c) => (
                  <div key={c.field} style={headCell}>
                    {c.header}
                  </div>
                ))}
              </div>

              {/* empty states */}
              {previewRows.length === 0 && (
                <div className="flex flex-col items-center justify-center text-center" style={{ padding: "60px 20px", color: "#64748b" }}>
                  {activeTab === "errors" ? (
                    <>
                      <CheckCircle2 size={36} style={{ color: "#16a34a" }} />
                      <p className="mt-3 mb-3" style={{ fontSize: 14 }}>
                        No errors left. Go to the Correct tab to import.
                      </p>
                      <button
                        type="button"
                        onClick={() => switchTab("correct")}
                        className="rounded-full px-5 py-2 text-sm font-semibold"
                        style={{ background: "#fff", border: `1px solid ${PRIMARY}`, color: PRIMARY, cursor: "pointer" }}
                      >
                        View Correct Rows
                      </button>
                    </>
                  ) : (
                    <p className="m-0" style={{ fontSize: 14 }}>
                      No correct rows yet. Fix the rows in the Errors tab.
                    </p>
                  )}
                </div>
              )}

              {/* virtualized body */}
              {previewRows.length > 0 && (
                <div
                  style={{
                    height: rowVirtualizer.getTotalSize(),
                    width: gridWidth,
                    position: "relative",
                  }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const row = previewRows[virtualRow.index];
                    if (!row) return null;

                    const editable = activeTab === "errors";

                    return (
                      <div
                        key={row.rowNo}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: gridWidth,
                          height: virtualRow.size,
                          transform: `translateY(${virtualRow.start}px)`,
                          display: "grid",
                          gridTemplateColumns: gridCols,
                          alignItems: "center",
                          borderBottom: "1px solid #f1f5f9",
                        }}
                      >
                        <div style={{ padding: "0 10px", fontSize: 13, color: "#475569" }}>
                          {row.rowNo}
                          {row.validating && <span style={{ color: "#94a3b8" }}> …</span>}
                        </div>

                        {activeColumns.map((c) => {
                          const val = row.data?.[c.field] ?? "";
                          const hasErr = (row.fieldErrors?.[c.field]?.length || 0) > 0;

                          if (!editable) {
                            const shown =
                              c.type === "discountType" ? DISCOUNT_LABEL[val] || val : val;
                            return (
                              <div
                                key={c.field}
                                style={{
                                  padding: "0 10px",
                                  fontSize: 13,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {shown}
                              </div>
                            );
                          }

                          return (
                            <div key={c.field} style={{ padding: "0 6px" }}>
                              {c.type === "discountType" ? (
                                <select
                                  className="browser-default"
                                  value={val}
                                  onChange={(e) => handleCellChange(row.rowNo, c.field, e.target.value)}
                                  style={inputStyle(hasErr)}
                                >
                                  {/* <option value=""></option> */}
                                  <option value="Percentage">Discount %</option>
                                  <option value="Amount">Discount Amount</option>
                                </select>
                              ) : (
                                <input
                                  className="browser-default"
                                  type="text"
                                  inputMode={c.type === "number" ? "decimal" : undefined}
                                  value={val}
                                  onChange={(e) => handleCellChange(row.rowNo, c.field, e.target.value)}
                                  style={inputStyle(hasErr)}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
              style={{ borderTop: "1px solid #e2e8f0", background: "#fff", flexShrink: 0 }}
            >
              <div style={{ fontSize: 13, color: errorCount ? "#b91c1c" : "#15803d" }}>
                {activeTab === "errors"
                  ? "Fix the highlighted cells. Rows are checked automatically."
                  : errorCount > 0
                  ? `${errorCount} row${errorCount === 1 ? "" : "s"} still have errors and will be skipped.`
                  : "All rows are ready to import."}
              </div>

              {activeTab === "correct" && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={resetUpload}
                    disabled={importing}
                    className="rounded-full px-5 py-2 text-sm font-semibold"
                    style={{
                      background: "#fff",
                      border: `1px solid ${PRIMARY}`,
                      color: PRIMARY,
                      cursor: importing ? "not-allowed" : "pointer",
                      opacity: importing ? 0.6 : 1,
                    }}
                  >
                    Choose Another File
                  </button>

                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={validRows.length === 0 || importing}
                    className="rounded-full px-6 py-2 text-sm font-semibold text-white"
                    style={{
                      background: validRows.length === 0 || importing ? "#cbd5e1" : PRIMARY,
                      border: "none",
                      cursor: validRows.length === 0 || importing ? "not-allowed" : "pointer",
                    }}
                  >
                    {importing
                      ? "Importing..."
                      : `Import ${validRows.length} ${validRows.length === 1 ? "Item" : "Items"}`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}