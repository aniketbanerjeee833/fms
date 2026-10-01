

import { useMemo, useRef, useState } from "react";

import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import {

    UploadCloud,
    Upload,
    FileSpreadsheet,
    X,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";
import { useGetAllSettingsQuery } from "../../redux/api/Settings/settingsApi";
import { useImportItemsExcelMutation } from "../../redux/api/itemApi";
import { useVirtualizer } from "@tanstack/react-virtual";

/* ───────────── config ───────────── */
const PRIMARY = "#4CA1AF"; // change here when you switch the theme color
const MAX_FILE_MB = 5;
const MAX_ROWS = 5000;
const PREVIEW_LIMIT = 500;

const NOTE_LINE =
    "** Please leave the cell value empty if you don't need it. Please don't change the headers.";

/* One definition drives: sample file, header matching, parsing, preview.
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


/* ───────────── component ───────────── */
export default function ImportExcel() {
    //const navigate = useNavigate();
  
    const [importItemsExcel, { isLoading: importing }] = useImportItemsExcelMutation();
    const { data: settingsData } = useGetAllSettingsQuery();
    const settings = settingsData?.settings || [];
    const fileInputRef = useRef(null);
const previewScrollRef = useRef(null);
const [showPreviewModal, setShowPreviewModal] = useState(false);
const [showErrorsOnly, setShowErrorsOnly] = useState(false);
    const showMRP =
        Number(settings.find((s) => s.setting_key === "show_mrp")?.setting_value) === 1;

    const activeColumns = useMemo(
        () => COLUMNS.filter((c) => !c.mrpOnly || showMRP),
        [showMRP]
    );

    const [dragging, setDragging] = useState(false);
    const [parsing, setParsing] = useState(false);
    const [fileName, setFileName] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [rows, setRows] = useState(null); // null = nothing uploaded yet

    const validRows = useMemo(() => (rows || []).filter((r) => r.errors.length === 0), [rows]);
    const errorCount = (rows?.length || 0) - validRows.length;

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

    /* ---- file handling ---- */
  
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

    const result = await importItemsExcel({
      file,
      dryRun: true,
    }).unwrap();

    if (!result?.rows || result.rows.length === 0) {
      toast.error("No items found in the file");
      return;
    }

    setRows(result.rows);
    setSelectedFile(file);
    setFileName(file.name);
    setShowPreviewModal(true);
  } catch (err) {
    console.error(err);

    toast.error(
      err?.data?.message ||
      err?.message ||
      "Could not read the file"
    );
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

    //   const resetUpload = () => {
    //     setRows(null);
    //     setFileName("");
    //   };
  const resetUpload = () => {
  setRows(null);
  setFileName("");
  setSelectedFile(null);

  // close preview modal
  setShowPreviewModal(false);

  // reset filter
  setShowErrorsOnly(false);
};

    /* ---- import (backend later) ---- */
    //   const handleImport = async () => {
    //     const payload = validRows.map((r) => ({ ...r.data, Item_Type: "Product" }));

    //     // TODO: call the bulk import API with `payload`
    //     // const res = await importItems(payload).unwrap();
    //     console.log("Items ready to import:", payload);
    //   };

    const handleImport = async () => {
        if (!selectedFile) {
            toast.error("Please select an Excel file");
            return;
        }

        try {
            const result = await importItemsExcel({
                file: selectedFile,
                dryRun: false,
            }).unwrap();

            toast.success(
                result?.message || "Items imported successfully"
            );

            resetUpload();

        } catch (err) {
            console.error(err);

            toast.error(
                err?.data?.message ||
                err?.message ||
                "Failed to import items"
            );
        }
    };

    /* ---- preview table columns (status + #, then active columns) ---- */
    // const previewRows = (rows || []).slice(0, PREVIEW_LIMIT);
// const previewRows = useMemo(() => {
//   if (!rows) return [];

//   if (showErrorsOnly) {
//     return rows.filter((row) => row.errors.length > 0);
//   }

//   return rows;
// }, [rows, showErrorsOnly]);

const previewRows = useMemo(() => {
  if (!rows) return [];

  if (showErrorsOnly) {
    return rows.filter((row) => row.errors.length > 0);
  }

  return rows.filter((row) => row.errors.length === 0);
}, [rows, showErrorsOnly]);
const rowVirtualizer = useVirtualizer({
  count: previewRows.length,
  getScrollElement: () => previewScrollRef.current,
  estimateSize: () => 42,
  overscan: 10,
});
    const cell = { padding: "8px 10px", fontSize: 13, whiteSpace: "nowrap", borderBottom: "1px solid #f1f5f9" };
    const th = {
        ...cell,
        position: "sticky",
        top: 0,
        background: "#f8fafc",
        fontWeight: 600,
        color: "#334155",
        zIndex: 1,
        borderBottom: "2px solid #e2e8f0",
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
                <div
                    className="w-full lg:w-[38%] p-5 flex-none"
                    style={{ borderRight: "1px solid #e2e8f0" }}
                >
                    <h6 className="font-bold text-gray-900 mb-4" style={{ fontSize: 16 }}>
                        Steps to Import
                    </h6>

                    {/* STEP 1 */}
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
                        style={{
                            background: "#fff",
                            border: `1px solid ${PRIMARY}`,
                            color: PRIMARY,
                            cursor: "pointer",
                        }}
                    >
                        Download Sample
                    </button>

                    {/* mini preview of the sample */}
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
                    {/* <p className="text-gray-500 mt-2" style={{ fontSize: 11 }}>
                        {NOTE_LINE}
                    </p> */}

                    <p className="text-red-500 mt-2" style={{ fontSize: 11 }}>
                        {NOTE_LINE}
                    </p>

                    {/* STEP 2 */}
                    <p className="font-bold uppercase mt-6 mb-1" style={{ color: PRIMARY, letterSpacing: "0.08em", fontSize: 13 }}>
                        Step 2
                    </p>
                    <div className="flex items-start gap-3">
                        <Upload size={20} className="text-gray-600 flex-shrink-0 mt-0.5" />
                        <p className="text-gray-700 m-0" style={{ fontSize: 14 }}>
                            Upload the file (<b>xlsx or xls</b>) by clicking on the Upload File button
                            below.
                        </p>
                    </div>

                    {/* STEP 3 */}
                    <p className="font-bold uppercase mt-6 mb-1" style={{ color: PRIMARY, letterSpacing: "0.08em", fontSize: 13 }}>
                        Step 3
                    </p>
                    <p className="text-gray-700 m-0" style={{ fontSize: 14 }}>
                        Verify the items from the file &amp; complete the import.
                    </p>
                </div>

                {/* ══ RIGHT: UPLOAD / PREVIEW ══ */}
                <div className="flex-1 p-5 flex flex-col" style={{ minWidth: 0, minHeight: 0 }}>
                    {rows === null && (
                        /* ---- upload state ---- */
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
                    ) 
                    //: (
                        /* ---- preview state ---- */
                       
                    //)
                    
                    }
                    {showPreviewModal && rows && (
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
      style={{
        width: "96vw",
        maxWidth: 1600,
        height: "90vh",
        overflow: "hidden",
      }}
    >
      {/* =====================================================
          MODAL HEADER
      ====================================================== */}
      <div
        className="flex items-center justify-between gap-4 px-5 py-4"
        style={{
          borderBottom: "1px solid #e2e8f0",
          background: "#ffffff",
          flexShrink: 0,
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex items-center justify-center rounded-lg"
            style={{
              width: 40,
              height: 40,
              background: `${PRIMARY}15`,
            }}
          >
            <FileSpreadsheet
              size={22}
              style={{ color: PRIMARY }}
            />
          </div>

          <div className="min-w-0">
            <h3
              className="font-bold text-gray-900 m-0"
              style={{ fontSize: 18 }}
            >
              Import Preview
            </h3>

            <p
              className="text-gray-500 m-0 truncate"
              style={{
                fontSize: 12,
                maxWidth: 500,
              }}
              title={fileName}
            >
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

      {/* =====================================================
          SUMMARY
      ====================================================== */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
        style={{
          borderBottom: "1px solid #e2e8f0",
          background: "#f8fafc",
          flexShrink: 0,
        }}
      >
        <div className="flex flex-wrap items-center gap-2">
          {/* Total */}
          <div
            className="rounded-full px-3 py-1.5"
            style={{
              background: "#e2e8f0",
              color: "#334155",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Total: {rows.length}
          </div>

          {/* Valid */}
          <div
            className="rounded-full px-3 py-1.5"
            style={{
              background: "#dcfce7",
              color: "#166534",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {/* ✓ Valid: {validRows.length} */}
            ✓ Correct: {validRows.length}
          </div>

          {/* Errors */}
          <div
            className="rounded-full px-3 py-1.5"
            style={{
              background: errorCount
                ? "#fff1f2"
                : "#f1f5f9",
              color: errorCount
                ? "#be123c"
                : "#475569",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            ⚠ Errors: {errorCount}
          </div>
        </div>

        {/* Filter */}
        <div
          className="flex items-center rounded-lg"
          style={{
            border: "1px solid #cbd5e1",
            overflow: "hidden",
            background: "#fff",
          }}
        >
          <button
            type="button"
            // onClick={resetUpload}
              onClick={() => setShowErrorsOnly(false)}
            className="px-4 py-2 text-sm font-semibold"
            style={{
              border: "none",
              background: !showErrorsOnly
                ? `${PRIMARY}15`
                : "#fff",
              color: !showErrorsOnly
                ? PRIMARY
                : "#64748b",
              cursor: "pointer",
            }}
          >
            Correct ({validRows.length})
          </button>

          <button
            type="button"
            onClick={() => setShowErrorsOnly(true)}
            className="px-4 py-2 text-sm font-semibold"
            style={{
              border: "none",
              borderLeft: "1px solid #cbd5e1",
              background: showErrorsOnly
                ? "#fff1f2"
                : "#fff",
              color: showErrorsOnly
                ? "#be123c"
                : "#64748b",
              cursor: "pointer",
            }}
          >
            Errors ({errorCount})
          </button>
        </div>
      </div>

      {/* =====================================================
          TABLE
      ====================================================== */}
      <div
        ref={previewScrollRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          background: "#fff",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `60px ${activeColumns
              .map(() => "180px")
              .join(" ")}`,
            minWidth: "max-content",
            position: "sticky",
            top: 0,
            zIndex: 20,
            background: "#f8fafc",
            borderBottom: "2px solid #e2e8f0",
          }}
        >
          <div style={th}>Row</div>

          {/* <div
            style={{
              ...th,
              minWidth: 240,
            }}
          >
            Status
          </div> */}

          {activeColumns.map((c) => (
            <div
              key={c.field}
              style={{
                ...th,
                minWidth: 180,
              }}
            >
              {c.header}
            </div>
          ))}
        </div>

        {/* Virtualized body */}
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
            minWidth: "max-content",
          }}
        >
          {rowVirtualizer
            .getVirtualItems()
            .map((virtualRow) => {
              const row = previewRows[virtualRow.index];

              if (!row) return null;

              //const hasError =row.errors && row.errors.length > 0;
              const fieldErrors = row.fieldErrors || {};

              return (
                <div
                  key={row.rowNo}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    transform: `translateY(${virtualRow.start}px)`,

                    display: "grid",

                    gridTemplateColumns: `60px  ${activeColumns
                      .map(() => "180px")
                      .join(" ")}`,

                    minWidth: "max-content",
                    width: "100%",
                    height: `${virtualRow.size}px`,

                    // background: hasError
                    //   ? "#fffafa"
                    //   : "#ffffff",

                    borderBottom:"1px solid #f1f5f9",
                  }}
                >
                  {/* ROW NUMBER */}
                  <div
                    style={{
                      ...cell,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {row.rowNo}
                  </div>

                  {/* STATUS */}
                  {/* <div
                    style={{
                      ...cell,
                      minWidth: 240,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {hasError ? (
                      <div
                        className="flex items-center gap-2"
                        style={{
                          color: "#dc2626",
                          minWidth: 0,
                        }}
                        title={row.errors.join(" | ")}
                      >
                        <div
                          className="flex items-center justify-center rounded-full"
                          style={{
                            width: 22,
                            height: 22,
                            minWidth: 22,
                            background: "#fee2e2",
                          }}
                        >
                          <AlertCircle size={14} />
                        </div>

                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {row.errors.join(" | ")}
                        </span>
                      </div>
                    ) : (
                      <div
                        className="flex items-center gap-1.5"
                        style={{
                          color: "#15803d",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        <CheckCircle2 size={15} />
                        Ready
                      </div>
                    )}
                  </div> */}

                  {/* DATA CELLS */}
                  {activeColumns.map((c) => {
                    const val = row.data?.[c.field];
                     const hasFieldError =
                    (fieldErrors[c.field]?.length || 0) > 0;

                    return (
                      <div
                        key={c.field}
                        style={{
                          ...cell,
                          minWidth: 180,
                          display: "flex",
                          alignItems: "center",

                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",

                          // background:
                          //   hasError &&
                          //   (
                          //     c.field === "Item_Name" ||
                          //     c.field === "Primary_Unit" ||
                          //     c.field === "Secondary_Unit"
                          //   )
                          //     ? "#fff7f7"
                          //     : "transparent",
                               background: hasFieldError
                               ? "#fff7f7"
                               : "transparent",

                                border: hasFieldError
                                 ? "1px solid #ef4444"
                                : "1px solid transparent",
           
                        }}
                        // title={
                        //   val === null ||
                        //   val === undefined
                        //     ? ""
                        //     : String(val)
                        // }
                          title={
        hasFieldError
          ? fieldErrors[c.field].join(" | ")
          : val === null || val === undefined
            ? ""
            : String(val)
      }
                      >
                        {val === null ||
                        val === undefined ||
                        val === ""
                          ? ""
                          : String(val)}
                      </div>
                    );
                  })}
                </div>
              );
            })}
        </div>
      </div>

      {/* =====================================================
          FOOTER
      ====================================================== */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
        style={{
          borderTop: "1px solid #e2e8f0",
          background: "#fff",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: 13,
            color: errorCount
              ? "#b91c1c"
              : "#15803d",
          }}
        >
          {errorCount > 0
            ? `${errorCount} row${
                errorCount === 1 ? "" : "s"
              } have errors and will be skipped.`
            : "All rows are ready to import."}
        </div>

        {/* <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (importing) return;

              setShowPreviewModal(false);
              resetUpload();
            }}
            disabled={importing}
            className="rounded-full px-5 py-2 text-sm font-semibold"
            style={{
              background: "#fff",
              border: `1px solid ${PRIMARY}`,
              color: PRIMARY,
              cursor: importing
                ? "not-allowed"
                : "pointer",
              opacity: importing ? 0.6 : 1,
            }}
          >
            Choose Another File
          </button>

          <button
            type="button"
            onClick={handleImport}
            disabled={
              validRows.length === 0 || importing
            }
            className="rounded-full px-6 py-2 text-sm font-semibold text-white"
            style={{
              background:
                validRows.length === 0 ||
                importing
                  ? "#cbd5e1"
                  : PRIMARY,

              border: "none",

              cursor:
                validRows.length === 0 ||
                importing
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {importing
              ? "Importing..."
              : `Import ${validRows.length} ${
                  validRows.length === 1
                    ? "Item"
                    : "Items"
                }`}
          </button>
        </div> */}
        {!showErrorsOnly && (
  <div className="flex items-center gap-3">
    <button
      type="button"
      onClick={() => {
        if (importing) return;

        setShowPreviewModal(false);
        resetUpload();
      }}
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
        background:
          validRows.length === 0 || importing
            ? "#cbd5e1"
            : PRIMARY,
        border: "none",
        cursor:
          validRows.length === 0 || importing
            ? "not-allowed"
            : "pointer",
      }}
    >
      {importing
        ? "Importing..."
        : `Import ${validRows.length} ${
            validRows.length === 1 ? "Item" : "Items"
          }`}
    </button>
  </div>
)}
      </div>
    </div>
  </div>
)}
                </div>
            </div>
        </div>
    );
}


/* ───────────── helpers ───────────── */
// const normalize = (h) =>
//   String(h ?? "").replace(/\*/g, "").trim().toLowerCase().replace(/\s+/g, " ");

// const str = (v) => String(v ?? "").trim();

// const parseNum = (v) => {
//   const s = str(v).replace(/,/g, "");
//   if (s === "") return { value: null };
//   const n = Number(s);
//   return Number.isFinite(n) ? { value: n } : { invalid: true };
// };

// const parseDiscountType = (v) => {
//   const s = str(v).toLowerCase();
//   if (s === "") return { value: "" };
//   if (["discount %", "%", "percentage", "percent"].includes(s)) return { value: "Percentage" };
//   if (["discount amount", "amount", "flat"].includes(s)) return { value: "Amount" };
//   return { invalid: true };
// };

/* Reads the first matching sheet and returns validated rows */
// async function parseFile(file, activeColumns) {
//   const buf = await file.arrayBuffer();
//   const wb = XLSX.read(buf, { type: "array" });

//   const sheetName =
//     wb.SheetNames.find((n) => normalize(n) === "item details") || wb.SheetNames[0];

//   const aoa = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
//     header: 1,
//     defval: "",
//     blankrows: false,
//   });

//   const headerIdx = aoa.findIndex((row) =>
//     row.some((c) => normalize(c) === "item name")
//   );
//   if (headerIdx === -1) {
//     throw new Error("Invalid file. Please use the sample file and don't change the headers.");
//   }

//   // header text -> column index in the sheet
//   const colIndex = {};
//   aoa[headerIdx].forEach((h, i) => {
//     const key = normalize(h);
//     if (key && colIndex[key] === undefined) colIndex[key] = i;
//   });

//   const rows = [];

//   for (let r = headerIdx + 1; r < aoa.length; r++) {
//     const sheetRow = aoa[r];

//     // only look at columns we know (ignores stray cells like dropdown lists)
//     const raw = {};
//     activeColumns.forEach((c) => {
//       const idx = colIndex[normalize(c.header)];
//       raw[c.field] = idx === undefined ? "" : sheetRow[idx];
//     });

//     const allBlank = activeColumns.every((c) => str(raw[c.field]) === "");
//     if (allBlank) continue;
//     if (str(raw.Item_Name).startsWith("**")) continue; // note lines

//     rows.push({ rowNo: r + 1, ...validateRow(raw, activeColumns) });
//   }

//   if (rows.length > MAX_ROWS) {
//     throw new Error(`Too many rows. Maximum ${MAX_ROWS} items per import.`);
//   }

//   // duplicates inside the file
//   const seenNames = new Map();
//   const seenCodes = new Map();
//   rows.forEach((row) => {
//     const name = row.data.Item_Name.toLowerCase();
//     const code = (row.data.Item_Code || "").toLowerCase();

//     if (name) {
//       if (seenNames.has(name)) {
//         row.errors.push(`Duplicate item name (also in row ${seenNames.get(name)})`);
//       } else seenNames.set(name, row.rowNo);
//     }
//     if (code) {
//       if (seenCodes.has(code)) {
//         row.errors.push(`Duplicate item code (also in row ${seenCodes.get(code)})`);
//       } else seenCodes.set(code, row.rowNo);
//     }
//   });

//   return rows;
// }

// function validateRow(raw, activeColumns) {
//   const errors = [];
//   const data = {};

//   activeColumns.forEach((c) => {
//     const v = raw[c.field];

//     if (c.type === "text") {
//       data[c.field] = str(v);
//     } else if (c.type === "number") {
//       const r = parseNum(v);
//       if (r.invalid) errors.push(`${c.header}: must be a number`);
//       else if (r.value !== null && r.value < 0) errors.push(`${c.header}: cannot be negative`);
//       data[c.field] = r.invalid ? null : r.value;
//     } else if (c.type === "discountType") {
//       const r = parseDiscountType(v);
//       if (r.invalid) errors.push(`${c.header}: use "Discount %" or "Discount Amount"`);
//       data[c.field] = r.invalid ? "" : r.value;
//     }
//   });

//   if (!data.Item_Name) errors.push("Item name is required");

//   // discount rules
//   const disc = data.Discount_On_Sale_Price;
//   if (disc !== null && disc !== undefined && disc > 0) {
//     if (!data.Discount_Type_On_Sale_Price) {
//       errors.push("Discount Type is required when Sale Discount is given");
//     } else if (data.Discount_Type_On_Sale_Price === "Percentage" && disc > 100) {
//       errors.push("Sale Discount cannot be more than 100%");
//     } else if (
//       data.Discount_Type_On_Sale_Price === "Amount" &&
//       data.Sale_Price !== null &&
//       disc > data.Sale_Price
//     ) {
//       errors.push("Sale Discount cannot be more than the sale price");
//     }
//   }

//   // unit rules
//   const base = data.Primary_Unit;
//   const sec = data.Secondary_Unit;
//   const conv = data.Conversion_Rate;

//   if (sec && !base) errors.push("Base Unit is required when Secondary Unit is given");
//   if (sec && base && sec.toLowerCase() === base.toLowerCase()) {
//     errors.push("Base and Secondary unit cannot be the same");
//   }
//   if (sec && (conv === null || conv <= 0)) {
//     errors.push("Conversion Rate is required when Secondary Unit is given");
//   }
//   if (!sec && conv !== null && conv !== undefined) {
//     errors.push("Conversion Rate needs a Secondary Unit");
//   }

//   return { data, errors };
// }
 // <div className="flex flex-col flex-1" style={{ minHeight: 0 }}>
                        //     {/* file + summary */}
                        //     <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        //         <div className="flex items-center gap-2 min-w-0">
                        //             <FileSpreadsheet size={20} style={{ color: PRIMARY }} />
                        //             <span className="font-semibold text-gray-800 truncate" title={fileName}>
                        //                 {fileName}
                        //             </span>
                        //             <button
                        //                 type="button"
                        //                 onClick={resetUpload}
                        //                 className="p-1 rounded hover:bg-gray-100"
                        //                 style={{ background: "transparent", border: "none", cursor: "pointer" }}
                        //                 title="Remove file"
                        //             >
                        //                 <X size={16} style={{ color: "#6b7280" }} />
                        //             </button>
                        //         </div>

                        //         <div className="flex items-center gap-2 text-sm">
                        //             <span
                        //                 className="rounded-full px-3 py-1 font-medium"
                        //                 style={{ background: "#f1f5f9", color: "#334155" }}
                        //             >
                        //                 Total: {rows.length}
                        //             </span>
                        //             <span
                        //                 className="rounded-full px-3 py-1 font-medium"
                        //                 style={{ background: "#dcfce7", color: "#166534" }}
                        //             >
                        //                 Valid: {validRows.length}
                        //             </span>
                        //             <span
                        //                 className="rounded-full px-3 py-1 font-medium"
                        //                 style={{ background: errorCount ? "#fee2e2" : "#f1f5f9", color: errorCount ? "#991b1b" : "#334155" }}
                        //             >
                        //                 Errors: {errorCount}
                        //             </span>
                        //         </div>
                        //     </div>

                        //     {/* table */}
                        //     <div
                        //         style={{
                        //             flex: 1,
                        //             minHeight: 0,
                        //             overflow: "auto",
                        //             border: "1px solid #e2e8f0",
                        //             borderRadius: 6,
                        //         }}
                        //     >
                        //         <table style={{ borderCollapse: "collapse", width: "100%" }}>
                        //             <thead>
                        //                 <tr>
                        //                     <th style={th}>Row</th>
                        //                     <th style={{ ...th, minWidth: 220 }}>Status</th>
                        //                     {activeColumns.map((c) => (
                        //                         <th key={c.field} style={th}>
                        //                             {c.header}
                        //                         </th>
                        //                     ))}
                        //                 </tr>
                        //             </thead>
                        //             <tbody>
                        //                 {previewRows.map((row) => {
                        //                     const hasError = row.errors.length > 0;
                        //                     return (
                        //                         <tr key={row.rowNo} style={{ background: hasError ? "#fef2f2" : "transparent" }}>
                        //                             <td style={cell}>{row.rowNo}</td>
                        //                             <td style={{ ...cell, whiteSpace: "normal", minWidth: 220 }}>
                        //                                 {hasError ? (
                        //                                     <div className="flex items-start gap-1.5" style={{ color: "#b91c1c" }}>
                        //                                         <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                        //                                         <div>
                        //                                             {row.errors.map((e, i) => (
                        //                                                 <div key={i} style={{ fontSize: 12 }}>
                        //                                                     {e}
                        //                                                 </div>
                        //                                             ))}
                        //                                         </div>
                        //                                     </div>
                        //                                 ) : (
                        //                                     <div className="flex items-center gap-1.5" style={{ color: "#15803d" }}>
                        //                                         <CheckCircle2 size={15} />
                        //                                         <span style={{ fontSize: 12 }}>Ready</span>
                        //                                     </div>
                        //                                 )}
                        //                             </td>
                        //                             {activeColumns.map((c) => {
                        //                                 const val = row.data[c.field];
                        //                                 return (
                        //                                     <td key={c.field} style={cell}>
                        //                                         {val === null || val === undefined || val === "" ? "" : String(val)}
                        //                                     </td>
                        //                                 );
                        //                             })}
                        //                         </tr>
                        //                     );
                        //                 })}
                        //             </tbody>
                        //         </table>
                        //     </div>

                        //     {rows.length > PREVIEW_LIMIT && (
                        //         <p className="text-gray-500 mt-2 mb-0" style={{ fontSize: 12 }}>
                        //             Showing the first {PREVIEW_LIMIT} of {rows.length} rows. All valid rows will be
                        //             imported.
                        //         </p>
                        //     )}

                        //     {/* footer actions */}
                        //     <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                        //         <p className="text-gray-600 m-0" style={{ fontSize: 13 }}>
                        //             {errorCount > 0
                        //                 ? "Rows with errors will be skipped. Fix them in your file and upload again to include them."
                        //                 : "All rows look good."}
                        //         </p>

                        //         <div className="flex items-center gap-3">
                        //             <button
                        //                 type="button"
                        //                 onClick={resetUpload}
                        //                 className="rounded-full px-5 py-2 text-sm font-semibold"
                        //                 style={{
                        //                     background: "#fff",
                        //                     border: `1px solid ${PRIMARY}`,
                        //                     color: PRIMARY,
                        //                     cursor: "pointer",
                        //                 }}
                        //             >
                        //                 Choose Another File
                        //             </button>

                         
                        //             <button
                        //                 type="button"
                        //                 onClick={handleImport}
                        //                 disabled={validRows.length === 0 || importing}
                        //                 className="rounded-full px-6 py-2 text-sm font-semibold text-white"
                        //                 style={{
                        //                     background:
                        //                         validRows.length === 0 || importing
                        //                             ? "#cbd5e1"
                        //                             : PRIMARY,
                        //                     border: "none",
                        //                     cursor:
                        //                         validRows.length === 0 || importing
                        //                             ? "not-allowed"
                        //                             : "pointer",
                        //                 }}
                        //             >
                        //                 {importing
                        //                     ? "Importing..."
                        //                     : `Import ${validRows.length} ${validRows.length === 1 ? "Item" : "Items"
                        //                     }`}
                        //             </button>
                        //         </div>
                        //     </div>
                        // </div>