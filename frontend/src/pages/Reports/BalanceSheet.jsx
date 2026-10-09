
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Printer } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { useGetBalanceSheetQuery } from "../../redux/api/reportApi";
import { useGetAllFinancialYearsQuery } from "../../redux/api/Settings/settingsApi";
import BalanceSheetPrintTemplate from "../../components/Print/BalanceSheetPrintTemplate";

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n) =>
  n == null
    ? "0.00"
    : Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 });

const sum = (...vals) => vals.reduce((a, b) => a + (Number(b) || 0), 0);

// ─── Section Component ───────────────────────────────────────────────────────
function Section({ title, rows = [], total, accent = false, indent = 0 }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ marginBottom: 2 }}>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: `6px ${8 + indent * 16}px`,
          cursor: rows.length ? "pointer" : "default",
          borderRadius: 6,
          background: accent ? "rgba(99,102,241,.08)" : "transparent",
          userSelect: "none",
        }}
      >
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600,
            fontSize: 13,
            color: accent ? "#4CA1AF" : "#1e293b",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {rows.length ? (
            <span style={{ fontSize: 10, opacity: 0.5 }}>{open ? "▼" : "▶"}</span>
          ) : null}
          {title}
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            fontWeight: 600,
            color: accent ? "#4CA1AF" : "#334155",
            minWidth: 90,
            textAlign: "right",
          }}
        >
          {fmt(total)}
        </span>
      </div>

      {open &&
        rows.map((r, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: `4px ${8 + (indent + 1) * 16}px`,
              borderRadius: 4,
            }}
          >
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12.5,
                color: "#64748b",
              }}
            >
              {r.label}
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12.5,
                color: "#475569",
                minWidth: 90,
                textAlign: "right",
              }}
            >
              {fmt(r.amount)}
            </span>
          </div>
        ))}
    </div>
  );
}

// ─── Panel ───────────────────────────────────────────────────────────────────
function Panel({ title, children, total, totalLabel, layout }) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 14,
        border: "1px solid #e2e8f0",
        overflow: "hidden",
        flex: 1,
        minWidth: 0,
        boxShadow: "0 1px 4px rgba(0,0,0,.04)",

      }}
    >
      {/* Panel header */}
      <div
        style={{
          padding: "14px 20px 10px",
          borderBottom: "1px solid #f1f5f9",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 15,
            fontWeight: 400,
            color: "#0f172a",
            letterSpacing: 0.2,
          }}
        >
          {title}
        </span>
        <div
          style={{
            display: "flex",
            gap: 8,
            fontSize: 11,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <span style={{ color: "#94a3b8" }}>ACCOUNT</span>
          <span style={{ color: "#94a3b8", minWidth: 90, textAlign: "right" }}>
            AMOUNT (₹)
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "8px 12px 0" }}>{children}</div>

      {/* Total footer */}
      {/* <div
        style={{
          margin: "10px 12px",
          padding: "10px 8px",
          borderTop: "2px solid #4CA1AF",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 700,
            fontSize: 13,
            color: "#4CA1AF",
          }}
        >
          {totalLabel}
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            fontSize: 14,
            color: "#4CA1AF",
            minWidth: 90,
            textAlign: "right",
          }}
        >
          {fmt(total)}
        </span>
      </div> */}

      {/* Total footer */}


      <div
        style={{
          margin: "10px 12px 18px",
          padding: "12px 8px 16px",
          borderTop: "2px solid #4CA1AF",
          display: "flex",
          flexDirection: layout === "vertical" ? "column" : "row",
          justifyContent: "space-between",
          alignItems: layout === "vertical" ? "stretch" : "center",
          gap: 10,
          boxSizing: "border-box",
        }}
      >
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 700,
            fontSize: 13,
            color: "#4CA1AF",
            flex: layout === "vertical" ? "none" : 1,
            minWidth: 0,
            whiteSpace: "normal",
            overflowWrap: "anywhere",
            lineHeight: 1.6,
          }}
        >
          {totalLabel}
        </span>

        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            fontSize: 14,
            color: "#4CA1AF",
            minWidth: 90,
            textAlign: "right",
            whiteSpace: "nowrap",
            alignSelf: layout === "vertical" ? "flex-end" : "auto",
          }}
        >
          {fmt(total)}
        </span>
      </div>


    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function BalanceSheet() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [layout, setLayout] = useState("horizontal"); // "horizontal" | "vertical"

  const printRef = useRef(null);

  const { data: allFinancialYear } = useGetAllFinancialYearsQuery();

  const fromDate = searchParams.get("fromDate") || "";
  const toDate = searchParams.get("toDate") || "";

  const currentFY = allFinancialYear?.find(
    (fy) => fy.Current_Financial_Year === 1
  );

  const formatDate = (date) =>
    date ? new Date(date).toISOString().split("T")[0] : "";

  // Default to the current financial year when no dates are in the URL
  useEffect(() => {
    if (!fromDate && !toDate && currentFY) {
      setSearchParams({
        fromDate: formatDate(currentFY.Start_Date),
        toDate: formatDate(currentFY.End_Date),
      });
    }
  }, [currentFY]);

  const {
    data: balanceSheetData,
    isLoading: isBalanceSheetDataLoading,
    isError: isBalanceSheetDataError,
  } = useGetBalanceSheetQuery({
    fromDate,
    toDate,
  });

  const d = balanceSheetData?.data;

  // ── Derived totals ────────────────────────────────────────────────────────
  const ownerEquity = d?.equities?.capitalAccount?.ownerEquity;
  const capitalTotal = ownerEquity;

  const { reservesSurplusDefault, revaluationReserve, retainedEarnings } =
    d?.equities?.reservesSurplus || {};
  const reservesTotal = sum(
    reservesSurplusDefault,
    revaluationReserve,
    retainedEarnings
  );

  const { sundryCreditors, dutiesAndTaxes, otherCurrentLiabilities } =
    d?.equities?.currentLiabilities || {};
  const currentLiabTotal = sum(
    sundryCreditors,
    dutiesAndTaxes,
    otherCurrentLiabilities
  );

  const totalEquities = sum(
    capitalTotal,
    reservesTotal,
    d?.equities?.longTermLiabilities || 0,
    currentLiabTotal
  );

  const {
    sundryDebtors,
    inputDutiesAndTaxes,
    bankAccounts,
    cashAccounts,
    otherCurrentAssets,
  } = d?.assets?.currentAssets || {};
  const currentAssetsTotal = sum(
    sundryDebtors,
    inputDutiesAndTaxes,
    bankAccounts,
    cashAccounts,
    otherCurrentAssets
  );

  const totalAssets = sum(
    d?.assets?.fixedAssets,
    d?.assets?.nonCurrentAssets,
    currentAssetsTotal,
    d?.assets?.otherAssets
  );

  // ── Shared section data (used by screen + print) ─────────────────────────
  const equitySections = [
    {
      title: "Capital Account",
      total: capitalTotal,
      rows: [{ label: "Owner's Equity", amount: ownerEquity }],
    },
    {
      title: "Reserves & Surplus",
      total: reservesTotal,
      rows: [
        { label: "Reserves & Surplus [Default]", amount: reservesSurplusDefault },
        { label: "Revaluation Reserve", amount: revaluationReserve },
        { label: "Retained Earnings", amount: retainedEarnings },
      ],
    },
    {
      title: "Long-term Liabilities",
      total: d?.equities?.longTermLiabilities || 0,
      rows: [],
    },
    {
      title: "Current Liabilities",
      total: currentLiabTotal,
      rows: [
        { label: "Sundry Creditors", amount: sundryCreditors },
        { label: "Duties & Taxes", amount: dutiesAndTaxes },
        { label: "Other Current Liabilities", amount: otherCurrentLiabilities },
      ],
    },
  ];

  const assetSections = [
    { title: "Fixed Assets", total: d?.assets?.fixedAssets, rows: [] },
    { title: "Non Current Assets", total: d?.assets?.nonCurrentAssets, rows: [] },
    {
      title: "Current Assets",
      total: currentAssetsTotal,
      rows: [
        { label: "Sundry Debtors", amount: sundryDebtors },
        { label: "Input Duties & Taxes", amount: inputDutiesAndTaxes },
        { label: "Bank Accounts", amount: bankAccounts },
        { label: "Cash Accounts", amount: cashAccounts },
        { label: "Other Current Assets", amount: otherCurrentAssets },
      ],
    },
    { title: "Other Assets", total: d?.assets?.otherAssets, rows: [] },
  ];

  // ── Print ────────────────────────────────────────────────────────────────
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Balance-Sheet-${fromDate || "all"}-to-${toDate || "all"}`,
  });

  // ── Sections JSX ─────────────────────────────────────────────────────────
  const equitiesContent = (
    <>
      {equitySections.map((s) => (
        <Section
          key={s.title}
          title={s.title}
          total={s.total}
          indent={0}
          rows={s.rows}
        />
      ))}
    </>
  );

  const assetsContent = (
    <>
      {assetSections.map((s) => (
        <Section
          key={s.title}
          title={s.title}
          total={s.total}
          indent={0}
          rows={s.rows}
        />
      ))}
    </>
  );

  // Force vertical layout on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setLayout("vertical");
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isBalanced = Math.abs(totalEquities - totalAssets) < 0.01;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600;700&display=swap"
        rel="stylesheet"
      />
      <div className="flex flex-col bg-white"
        style={{
          height: "100%",
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <div className="inn-title">
          <div className="flex flex-col sm:flex-col sm:flex-row justify-between sm:items-center">
            <div className="flex flex-row justify-between items-center mb-4 sm:mb-4">
              <div>
                <h4 className="text-2xl font-bold mb-1">Balance Sheet</h4>
                <p className="text-gray-500 text-sm sm:text-base">
                  As of{" "}
                  {d?.period?.fromDate
                    ? new Date(d.period.fromDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })
                    : "—"}{" "}
                  to{" "}
                  {d?.period?.toDate
                    ? new Date(d.period.toDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })
                    : "—"}
                </p>
              </div>
            </div>

            <div
              className="
                flex flex-col gap-2 md:flex-row md:gap-2 sm:flex-row
                sm:space-x-4 space-y-3 sm:space-y-0
                sm:items-center
              "
            >
              <div className="flex flex-col">
                <span className="text-sm text-gray-600 font-medium mb-1">From Date</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setSearchParams({
                      fromDate: e.target.value,
                      toDate,
                    });
                  }}
                  className="border p-1 rounded-md shadow-sm text-gray-700 sm:w-auto"
                  title="Search from date"
                />
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-gray-600 font-medium mb-1">To Date</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setSearchParams({
                      fromDate,
                      toDate: e.target.value,
                    });
                  }}
                  className="border p-1 rounded-md shadow-sm text-gray-700 sm:w-auto"
                  title="Search to date"
                />
              </div>

             
              <div
                className="hidden lg:flex flex-col sm:flex-row"
                style={{
                  background: "#e2e8f0",
                  borderRadius: 8,
                  padding: 3,
                  gap: 2,
                }}
              >
                {["horizontal", "vertical"].map((l) => (
                  <button
                    key={l}
                    onClick={() => setLayout(l)}
                    style={{
                      padding: "5px 14px",
                      borderRadius: 6,
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 12,
                      fontWeight: 600,
                      background: layout === l ? "#4CA1AF" : "transparent",
                      color: layout === l ? "#fff" : "#64748b",
                      transition: "all .15s",
                      textTransform: "capitalize",
                    }}
                  >
                    {l === "horizontal" ? "⇔ Horizontal" : "⇕ Vertical"}
                  </button>
                ))}
              </div>

              
                <div className="flex justify-end">
              <button
                type="button"
                onClick={handlePrint}
                disabled={isBalanceSheetDataLoading || !d}
                className="group flex items-center gap-2 rounded-lg bg-blue-50 px-3.5 py-2 text-sm font-medium text-blue-700 ring-1 ring-blue-200 transition-all duration-200 hover:bg-blue-100 hover:ring-blue-300 active:scale-95 disabled:opacity-50 sm:self-end"
                title="Print Balance Sheet"
              >
                <Printer
                  size={16}
                  strokeWidth={2.2}
                  className="text-blue-600 transition-transform duration-200 group-hover:scale-110"
                />
              </button>
              </div>
            </div>
          </div>
        </div>





        {/* ── Content ── */}
        {!isBalanceSheetDataLoading && !isBalanceSheetDataError && (
          <div
            style={{
              display: "flex",
              flexDirection: layout === "horizontal" ? "row" : "column",
              gap: 16,
              alignItems: "stretch",
              padding: "10px 20px",
            }}
          >
            <Panel
              title="Equities & Liabilities"
              total={totalEquities}
              totalLabel="Total Equities & Liabilities"
              layout={layout}
            >
              {equitiesContent}
            </Panel>

            <Panel title="Assets" total={totalAssets} totalLabel="Total Assets" layout={layout}>
              {assetsContent}
            </Panel>
          </div>
        )}

        {/* ── Balance check ── */}
        {!isBalanceSheetDataLoading && !isBalanceSheetDataError && (
          <div
            style={{
              marginTop: 14,
              padding: "10px 20px",
              borderRadius: 10,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12.5,
                fontWeight: 600,
                color: isBalanced ? "#15803d" : "#dc2626",
              }}
            >
              {isBalanced
                ? "✓ Balance sheet is balanced"
                : `⚠ Difference: ₹${fmt(Math.abs(totalEquities - totalAssets))}`}
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                color: "#64748b",
              }}
            >
              Diff: ₹{fmt(Math.abs(totalEquities - totalAssets))}
            </span>
          </div>
        )}

        {/* ── Hidden print template ── */}
        {d && (
          <div style={{ display: "none" }}>
            <BalanceSheetPrintTemplate
              ref={printRef}
              companyDetails={{}}
              fromDate={d?.period?.fromDate || fromDate}
              toDate={d?.period?.toDate || toDate}
              equitySections={equitySections}
              assetSections={assetSections}
              totalEquities={totalEquities}
              totalAssets={totalAssets}
            />
          </div>
        )}
      </div>
    </>
  );
}