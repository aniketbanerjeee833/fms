
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useGetBalanceSheetQuery } from "../../redux/api/reportApi";
import { useGetAllFinancialYearsQuery } from "../../redux/api/settingsApi";
import { useEffect } from "react";

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
            //color: accent ? "#4CA1AF" : "#334155",
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
function Panel({ title, children, total, totalLabel }) {
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
      <div
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
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function BalanceSheet() {
     const [searchParams, setSearchParams] = useSearchParams();
  const [layout, setLayout] = useState("horizontal"); // "horizontal" | "vertical"
  //const [data, setData] = useState(null);
  //const [loading, setLoading] = useState(false);
  //const [error, setError] = useState(null);
  
    const { data: allFinancialYear } = useGetAllFinancialYearsQuery();
    console.log(allFinancialYear);
   const fromDate = searchParams.get("fromDate") || "";
  const toDate = searchParams.get("toDate") || "";
  const currentFY = allFinancialYear?.find(
  (fy) => fy.Current_Financial_Year === 1
);
console.log("Current Financial Year:", currentFY);
const formatDate = (date) =>
  date ? new Date(date).toISOString().split("T")[0] : "";
// const formatDate = (date) => date ? new Date(date).toLocaleDateString("en-IN", {
//                     day: "2-digit",
//                     month: "long",
//                     year: "numeric",
//                   }) : "";
useEffect(() => {
  if (!fromDate && !toDate && currentFY) {
    setSearchParams({
      fromDate: formatDate(currentFY.Start_Date),
      toDate: formatDate(currentFY.End_Date),
    })
  }
}, [currentFY]);
console.log("From Date:", fromDate);
console.log("To Date:", toDate);
  const { data: balanceSheetData, isLoading: isBalanceSheetDataLoading,isError: isBalanceSheetDataError } = useGetBalanceSheetQuery({
   
    fromDate,
    toDate,
  });
  // ── Fetch ────────────────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!fromDate || !toDate) return;
//     setLoading(true);
//     setError(null);
//     fetch(`/api/reports/balance-sheet?from=${fromDate}&to=${toDate}`)
//       .then((r) => {
//         if (!r.ok) throw new Error("Failed to fetch balance sheet");
//         return r.json();
//       })
//       .then((d) => {
//         setData(d);
//         setLoading(false);
//       })
//       .catch((e) => {
//         setError(e.message);
//         setLoading(false);
//       });
//   }, [fromDate, toDate]);

  // ── Demo stub (remove once API is wired) ─────────────────────────────────
//   const demo = {
//     asOf: toDate || "2026-03-31",
//     equities: {
//       capitalAccount: {
//         ownerEquity: 150000,
//       },
//       reservesSurplus: {
//         reservesSurplusDefault: 25000,
//         revaluationReserve: 0,
//         retainedEarnings: 48200,
//       },
//       longTermLiabilities: 200000,
//       currentLiabilities: {
//         sundryCreditors: 85000,
//         dutiesAndTaxes: 12500,
//         otherCurrentLiabilities: 5000,
//       },
//     },
//     assets: {
//       fixedAssets: 180000,
//       nonCurrentAssets: 45000,
//       currentAssets: {
//         sundryDebtors: 97000,
//         inputDutiesAndTaxes: 8700,
//         bankAccounts: 134000,
//         cashAccounts: 22000,
//         otherCurrentAssets: 3000,
//       },
//       otherAssets: 36000,
//     },
//   };

  //const d = data || demo;
// const d = demo;
console.log("Balance Sheet API Response:", balanceSheetData);
const d=balanceSheetData?.data
console.log("Balance Sheet Data:", d);
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

  const { sundryDebtors, inputDutiesAndTaxes, bankAccounts, cashAccounts, otherCurrentAssets } =
    d?.assets?.currentAssets || {};
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

  // ── Sections JSX ─────────────────────────────────────────────────────────
  const equitiesContent = (
    <>
      <Section
        title="Capital Account"
        total={capitalTotal}
        indent={0}
        rows={[{ label: "Owner's Equity", amount: ownerEquity }]}
      />
      <Section
        title="Reserves & Surplus"
        total={reservesTotal}
        indent={0}
        rows={[
          { label: "Reserves & Surplus [Default]", amount: reservesSurplusDefault },
          { label: "Revaluation Reserve", amount: revaluationReserve },
          { label: "Retained Earnings", amount: retainedEarnings },
        ]}
      />
      <Section
        title="Long-term Liabilities"
        total={d?.equities?.longTermLiabilities || 0}
        indent={0}
        rows={[]}
      />
      <Section
        title="Current Liabilities"
        total={currentLiabTotal}
        indent={0}
        rows={[
          { label: "Sundry Creditors", amount: sundryCreditors },
          { label: "Duties & Taxes", amount: dutiesAndTaxes },
          { label: "Other Current Liabilities", amount: otherCurrentLiabilities },
        ]}
      />
    </>
  );

  const assetsContent = (
    <>
      <Section title="Fixed Assets" total={d?.assets?.fixedAssets} rows={[]} indent={0} />
      <Section title="Non Current Assets" total={d?.assets?.nonCurrentAssets} rows={[]} indent={0} />
      <Section
        title="Current Assets"
        total={currentAssetsTotal}
        indent={0}
        rows={[
          { label: "Sundry Debtors", amount: sundryDebtors },
          { label: "Input Duties & Taxes", amount: inputDutiesAndTaxes },
          { label: "Bank Accounts", amount: bankAccounts },
          { label: "Cash Accounts", amount: cashAccounts },
          { label: "Other Current Assets", amount: otherCurrentAssets },
        ]}
      />
      <Section title="Other Assets" total={d?.assets?.otherAssets} rows={[]} indent={0} />
    </>
  );
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
  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600;700&display=swap"
        rel="stylesheet"
      />
      <div className="flex flex-col bg-white"> 
      {/* <div className="flex"
        // style={{
        //   fontFamily: "'DM Sans', sans-serif",
        //   background: "#f8fafc",
        //   minHeight: "100vh",
        //   padding: "24px 28px",
        // }}
      > */}
      {/* <div className="sb2-2-3 ">
        <div className="row">
          <div className="col-md-12">
            <div className="box-inn-sp"> */}
        {/* <div className="sb2-2-3 ">
        <div className="row">
          <div className="col-md-12">
            <div className="flex flex-col bg-white"> 
        {/* ── Top bar ── */}
        {/* <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 22,
            flexWrap: "wrap",
            gap: 12,
          }}
        > */}
         {/* <div className="inn-title">
        <div className="flex flex-col sm:flex-col lg:flex-row justify-between lg:items-center">
          <div>
            {/* <h1
              style={{
                //fontFamily: "'DM Serif Display', serif",
                fontSize: 26,
                fontWeight: 400,
                color: "#0f172a",
                margin: 0,
                letterSpacing: 0.3,
              }}
            >
              Balance Sheet
            </h1> 
            <h4 className="text-2xl font-bold mb-1">Balance Sheet</h4>
            <p className="text-gray-500 text-sm sm:text-base"
            //   style={{
            //     margin: "4px 0 0",
            //     fontSize: 12.5,
            //     color: "black",
            //     fontFamily: "'DM Sans', sans-serif",
            //   }}
            >
              As of{" "}
              {d?.period?.fromDate 
                ? new Date(d?.period?.fromDate).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "—"}
                {" "}to{" "} {d?.period?.toDate 
                ? new Date(d?.period?.toDate).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "—"}
                
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {/* Layout toggle 
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
                        // onChange={(e) => setFromDate(e.target.value)}
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
                        // onChange={(e) => setToDate(e.target.value)}
                        className="border p-1 rounded-md shadow-sm text-gray-700 sm:w-auto"
                        title="Search to date"
                      />
                    </div>
            <div
              style={{
                display: "flex",
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

            {/* Export buttons 
            {/* {["PDF", "XLS"].map((t) => (
              <button
                key={t}
                style={{
                  padding: "6px 14px",
                  borderRadius: 7,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                  fontWeight: 700,
                  background: t === "PDF" ? "#ef4444" : "#16a34a",
                  color: "#fff",
                  letterSpacing: 0.3,
                }}
              >
                {t}
              </button>
            ))} 
          </div>
        </div>
    </div> */}
     <div className="inn-title">
                <div className="flex flex-col sm:flex-col sm:flex-row justify-between sm:items-center">

                  <div className="flex flex-row justify-between items-center mb-4 sm:mb-4">
                    <div>
                        <h4 className="text-2xl font-bold mb-1">Balance Sheet</h4>
            <p className="text-gray-500 text-sm sm:text-base"
            //   style={{
            //     margin: "4px 0 0",
            //     fontSize: 12.5,
            //     color: "black",
            //     fontFamily: "'DM Sans', sans-serif",
            //   }}
            >
              As of{" "}
              {d?.period?.fromDate 
                ? new Date(d?.period?.fromDate).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "—"}
                {" "}to{" "} {d?.period?.toDate 
                ? new Date(d?.period?.toDate).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "—"}
                
            </p>
                    </div>


                 
                  </div>
{/* 
 //sm:justify-between sm:flex-wrap  */}
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
                            toDate
                          });
                        }}
                        // onChange={(e) => setToDate(e.target.value)}
                        className="border p-1 rounded-md shadow-sm text-gray-700 sm:w-auto"
                        title="Search to date"
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
                        // onChange={(e) => setToDate(e.target.value)}
                        className="border p-1 rounded-md shadow-sm text-gray-700 sm:w-auto"
                        title="Search to date"
                      />
                    </div>
 {/* <div className="flex flex-col sm:flex-row " */}
<div className="hidden lg:flex flex-col sm:flex-row"
                    
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


                   
                  </div>


                </div>

                
              </div>
        {/* ── States ── */}
        {/* {loading && (
          <div style={{ textAlign: "center", color: "#94a3b8", padding: 60 }}>
            Loading…
          </div>
        )} */}
        {/* {error && (
          <div style={{ textAlign: "center", color: "#ef4444", padding: 60 }}>
            {error}
          </div>
        )} */}

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

{/* 
//         <div
//   style={{
//     display: "flex",
//     flexDirection:
//       window.innerWidth < 768
//         ? "column"
//         : layout === "horizontal"
//         ? "row"
//         : "column",
//     gap: 16,
//     alignItems: "stretch",
//     padding: "10px 20px",
//   }}
// > */}
            <Panel
              title="Equities & Liabilities"
              total={totalEquities}
              totalLabel="Total Equities & Liabilities"
            >
              {equitiesContent}
            </Panel>

            <Panel title="Assets" total={totalAssets} totalLabel="Total Assets">
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
            //   background:
            //     Math.abs(totalEquities - totalAssets) < 0.01
            //       ? "#f0fdf4"
            //       : "#fff1f2",
            //   border: `1px solid ${
            //     Math.abs(totalEquities - totalAssets) < 0.01
            //       ? "#bbf7d0"
            //       : "#fecdd3"
            //   }`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              //alignItems: "stretch",
            }}
          >
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12.5,
                fontWeight: 600,
                color:
                  Math.abs(totalEquities - totalAssets) < 0.01
                    ? "#15803d"
                    : "#dc2626",
              }}
            >
              {Math.abs(totalEquities - totalAssets) < 0.01
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
      </div>
    
    </>
  );
}