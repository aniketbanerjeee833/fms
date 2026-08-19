// import { forwardRef } from "react";
// import "./SalePurchaseBulkReportPrintTemplate.css";

// /* ═══════════════════════════════════════════════════════════════════
//    SHARED COMPONENT — used by both Sale and Purchase "Print All" report
//    type: "sale" | "purchase"
//    data: { totalInvoices, sales } OR { totalInvoices, purchases }
//    fromDate / toDate: strings for header
// ═══════════════════════════════════════════════════════════════════ */

// const money = (v) =>
//     Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// const fmtDate = (d) =>
//     d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

// // const getGstRate = (taxType) => {
// //     if (!taxType || taxType === "None") return 0;
// //     const match = String(taxType).match(/GST([\d.]+)/i);
// //     return match ? Number(match[1]) : 0;
// // };
// const getTaxAmount = (item) => Number(item?.Tax_Amount || 0);
// const getGstRate = (taxType) => {
//     if (!taxType || taxType === "None") return 0;
//     const match = taxType.match(/GST([\d.]+)/i);
//     return match ? Number(match[1]) : 0;
// };

// const formatRate = (rate) => `${rate}%`;

// const SalePurchaseBulkReportPrintTemplate = forwardRef(({ type = "sale", data, fromDate, toDate }, ref) => {

//     const records = type === "sale" ? data?.invoices || [] : data?.purchaseBills || [];
//     const summary = data?.summary || {};
//     console.log(records);
//     return (
//         <div ref={ref} className="bulk-print">

//             {/* ── REPORT HEADER ── */}
//             {/* <div className="bulk-report-title">
//                 DATE RANGE REPORT ({fmtDate(fromDate)} to {fmtDate(toDate)})
//             </div>
//             <div className="bulk-report-subtitle">
//                 {type === "sale" ? "SALES" : "PURCHASES"}
//             </div> */}
//             <h4 className="bulk-report-title">
//                 DATE RANGE REPORT ({fmtDate(fromDate)} to {fmtDate(toDate)})
//             </h4>

//             <h5 className="bulk-report-subtitle">
//                 {type === "sale" ? "SALES" : "PURCHASES"}
//             </h5>

//             {/* ── ONE BLOCK PER INVOICE ── */}
//             {records.map((record, idx) => {
//                 const row = record.invoicePartyDetails || record.billPurchaseDetails || {};
//                 const documentNumber = type === "sale" ? row.Invoice_Number : row.Bill_Number;
//                 const documentDate = type === "sale" ? row.Invoice_Date : row.Bill_Date;
//                 const items = record.items || [];
//                 const splits = record.splits || [];
//                 const terms = row.Terms_Conditions_Description || row.Terms_Conditions;


//                 const totalTax = items.reduce((s, it) => s + Number(it.Tax_Amount || 0), 0);
//                 //const cgst = totalTax / 2;
//                 //const sgst = totalTax / 2;

//                 // ── tax breakdown by rate, same logic as InvoicePrintTemplate ──
//                 const taxGroups = {};
//                 items.forEach((item) => {
//                     const gstRate = getGstRate(item.Tax_Type);
//                     const taxAmt = Number(item.Tax_Amount || 0);
//                     const halfRate = gstRate / 2;
//                     const key = String(halfRate);

//                     if (!taxGroups[key]) {
//                         taxGroups[key] = { halfRate, taxable: 0, cgst: 0, sgst: 0 };
//                     }
//                     taxGroups[key].taxable += Number(item.Amount || 0) - taxAmt;
//                     taxGroups[key].cgst += taxAmt / 2;
//                     taxGroups[key].sgst += taxAmt / 2;
//                 });

//                 const taxGroupList = Object.values(taxGroups).filter((g) => g.halfRate > 0);
//                 const hasTaxDetails = taxGroupList.length > 0;
//                 const hasDiscountColumn = items.some(
//                     (it) => Number(it.Discount_On_Sale_Price || 0) > 0
//                 );
//                 const showTaxColumns = items.some(
//                     (item) => Number(item.Tax_Amount || 0) > 0
//                 );
//                 return (
//                     <div key={row.Sale_Id || row.Purchase_Id || idx} className="bulk-invoice-block">

//                         {/* party + invoice info */}
//                         <div className="bulk-invoice-header">
//                             <div>
//                                 <span className="bulk-label">Party Name: </span>
//                                 <span className="bulk-bold">{row.Party_Name || "—"}</span>
//                             </div>
//                             <div>
//                                 <span className="bulk-label">GSTIN: </span>
//                                 {row.GSTIN || "N/A"}
//                             </div>
//                             <div>
//                                 <span className="bulk-label">
//                                     {type === "sale" ? "Invoice No" : "Bill No"}:{" "}
//                                 </span>
//                                 {documentNumber || "—"}
//                             </div>
//                             <div>
//                                 <span className="bulk-label">
//                                     {type === "sale" ? "Invoice Date" : "Bill Date"}:{" "}
//                                 </span>
//                                 {fmtDate(documentDate)}
//                             </div>
//                         </div>

//                         {/* items table */}
//                         <table className="bulk-items-table">
//                             <thead>
//                                 <tr>
//                                     <th style={{ width: "4%" }}>Sl</th>
//                                     <th style={{ width: "14%" }}>Category</th>
//                                     <th style={{ width: "26%" }}>Item</th>
//                                     <th style={{ width: "10%" }}>HSN</th>
//                                     <th style={{ width: "8%" }}>Qty</th>
//                                     <th style={{ width: "11%" }}>Price</th>

//                                     {hasDiscountColumn && <th>Discount</th>}
//                                     {showTaxColumns && (
//                                         <>
//                                             <th style={{ width: "10%" }}>
//                                                 CGST
//                                             </th>

//                                             <th style={{ width: "10%" }}>
//                                                 SGST
//                                             </th>
//                                         </>
//                                     )}
//                                     {/* <th style={{ width: "10%" }}>CGST</th>
//                                     <th style={{ width: "10%" }}>SGST</th> */}
//                                     <th style={{ width: "12%" }}>Amount</th>
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 {items.map((it, i) => {
//                                     const taxAmount = getTaxAmount(it);
//                                     const gstRate = getGstRate(it.Tax_Type);
//                                     const halfRate = gstRate / 2;

//                                     const itemCgst = taxAmount / 2;
//                                     const itemSgst = taxAmount / 2;

//                                     const isTaxable = gstRate > 0 && taxAmount > 0;
//                                     return (
//                                         <tr key={it.Sale_Items_Id || it.Purchase_items_Id || i}>
//                                             <td className="bulk-center">{i + 1}</td>
//                                             <td>{it.Item_Category || "—"}</td>
//                                             <td>{it.Item_Name}</td>
//                                             <td>{it.Item_HSN}</td>
//                                             <td className="bulk-center" style={{ whiteSpace: "nowrap" }}>
//                                                 {it.Quantity} {it.Item_Unit || it.Selected_Unit || ""}
//                                             </td>
//                                             <td className="bulk-right">
//                                                 ₹ {money(it.Sale_Price ?? it.Purchase_Price)}
//                                             </td>

//                                             {hasDiscountColumn && (
//                                                 <td
//                                                     className="bulk-center"
//                                                     style={{ whiteSpace: "nowrap" }}
//                                                 >
//                                                     {Number(it.Discount_Amount || 0) > 0
//                                                         ? it.Discount_Type_On_Sale_Price === "Percentage"
//                                                             ? `${it.Discount_On_Sale_Price}% (₹${money(it.Discount_Amount)})`
//                                                             : `₹${money(it.Discount_Amount)}`
//                                                         : "-"}
//                                                 </td>
//                                             )}
//                                             {showTaxColumns && (
//                                                 <>
//                                                     <td className="bulk-right" >
//                                                         {itemCgst > 0
//                                                             ? `₹ ${money(itemCgst)}${isTaxable ? ` (${formatRate(halfRate)})` : ""}`
//                                                             : "-"}
//                                                     </td>

//                                                     <td className="bulk-right" >
//                                                         {itemSgst > 0
//                                                             ? `₹ ${money(itemSgst)}${isTaxable ? ` (${formatRate(halfRate)})` : ""}`
//                                                             : "-"}
//                                                     </td>
//                                                 </>
//                                             )}
//                                             <td className="bulk-right">₹ {money(it.Amount)}</td>
//                                         </tr>
//                                     )
//                                 })}
//                             </tbody>
//                         </table>

//                         {/* payment splits */}
//                         {splits.length > 0 && (
//                             <div className="bulk-splits">
//                                 <span className="bulk-label">Payment: </span>
//                                 {splits
//                                     .map((s) =>
//                                         s.Payment_Type === "Bank"
//                                             ? `${s.Account_Display_Name || "Bank"} ₹${money(s.Amount)}`
//                                             : `${s.Payment_Type} ₹${money(s.Amount)}`
//                                     )
//                                     .join("  +  ")}
//                             </div>
//                         )}

//                         {/* totals */}
//                         <div className="bulk-totals">
//                             <div>
//                                 <span className="bulk-label">Total Amount</span>
//                                 <span className="bulk-bold">₹ {money(row.Total_Amount)}</span>
//                             </div>
//                             <div>
//                                 <span className="bulk-label">
//                                     {type === "sale" ? "Received" : "Paid"}
//                                 </span>
//                                 <span>₹ {money(row.Total_Received ?? row.Total_Paid)}</span>
//                             </div>
//                             <div>
//                                 <span className="bulk-label">Balance Due</span>
//                                 <span>₹ {money(row.Balance_Due)}</span>
//                             </div>
//                         </div>
//                         {hasTaxDetails && (
//                             <table className="bulk-tax-table">
//                                 <thead>
//                                     <tr>
//                                         <td className="bulk-label">Tax Details</td>
//                                         {taxGroupList.map((g) => (
//                                             <td key={g.halfRate} className="bulk-right">{g.halfRate}%</td>
//                                         ))}
//                                     </tr>
//                                 </thead>
//                                 <tbody>
//                                     <tr>
//                                         <td className="bulk-label">CGST</td>
//                                         {taxGroupList.map((g) => (
//                                             <td key={g.halfRate} className="bulk-right">₹ {money(g.cgst)}</td>
//                                         ))}
//                                     </tr>
//                                     <tr>
//                                         <td className="bulk-label">SGST</td>
//                                         {taxGroupList.map((g) => (
//                                             <td key={g.halfRate} className="bulk-right">₹ {money(g.sgst)}</td>
//                                         ))}
//                                     </tr>
//                                 </tbody>
//                             </table>
//                         )}

//                         {/* terms and conditions */}
//                         {terms && (
//                             <div className="bulk-terms">
//                                 <div className="bulk-terms-header">Terms and Conditions</div>
//                                 <div className="bulk-terms-body">
//                                     {String(terms)
//                                         .split("\n")
//                                         .filter(Boolean)
//                                         .map((t, i) => (
//                                             <div key={i}>{i + 1}. {t.replace(/^\d+\.\s*/, "")}</div>
//                                         ))}
//                                 </div>
//                             </div>
//                         )}

//                         {/* divider between invoices, except after the last one */}
//                         {idx < records.length - 1 && <div className="bulk-divider" />}
//                     </div>
//                 );
//             })}
//             {records.length > 0 && data?.summary && (
//                 <div className="bulk-summary">
//                     {/* <div>
//                         <strong>Total Invoices:</strong>{" "}
//                         {data.totalInvoices}
//                     </div> */}

//                     <div>
//                         <strong>Total Amount:</strong> ₹
//                         {money(data.summary.totalAmount)}
//                     </div>

//                     <div>
//                         <strong>
//                             {type === "purchase" ? "Total Paid: " : "Total Received: "}
//                         </strong>
//                         ₹ {money(type === "purchase"
//                             ? data.summary.totalPaid
//                             : data.summary.totalReceived)}
//                     </div>

//                     <div>
//                         <strong>Total Balance Due:</strong> ₹
//                         {money(data.summary.totalBalanceDue)}
//                     </div>

//                     {/* {Number(data.summary.totalDiscount) > 0 && (
//                         <div>
//                             <strong>Total Discount:</strong> ₹
//                             {money(data.summary.totalDiscount)}
//                         </div>
//                     )} */}
//                 </div>
//             )}
//             {records.length === 0 && (
//                 <div className="bulk-empty">No records found for this date range.</div>
//             )}

//         </div>
//     );
// });

// export default SalePurchaseBulkReportPrintTemplate;

import { forwardRef } from "react";
import "./SalePurchaseBulkReportPrintTemplate.css";

const TYPE_CONFIG = {
    sale: {
        title: "Sale Report",
        docLabel: "Invoice No.",
        dateLabel: "Invoice Date",
        docNumberKey: "Invoice_Number",
        dateKey: "Invoice_Date",
        amountKey: "Total_Amount",
        paidKey: "Total_Received",
        paidLabel: "Received",
        priceKey: "Sale_Price",
        discountKey: "Discount_On_Sale_Price",
        discountTypeKey: "Discount_Type_On_Sale_Price",
        showTerms: true,
    },
    purchase: {
        title: "Purchase Report",
        docLabel: "Bill No.",
        dateLabel: "Bill Date",
        docNumberKey: "Bill_Number",
        dateKey: "Bill_Date",
        amountKey: "Total_Amount",
        paidKey: "Total_Paid",
        paidLabel: "Paid",
        priceKey: "Purchase_Price",
        discountKey: "Discount_On_Purchase_Price",
        discountTypeKey: "Discount_Type_On_Purchase_Price",
        showTerms: true,
    },
    credit: {
        title: "Credit Note Report",
        docLabel: "Return No.",
        dateLabel: "Return Date",
        docNumberKey: "Return_Number",
        dateKey: "Return_Date",
        amountKey: "Total_Amount",
        paidKey: "Total_Paid",
        paidLabel: "Received",
        priceKey: "Sale_Price",
        discountKey: "Discount_On_Sale_Price",
        discountTypeKey: "Discount_Type_On_Sale_Price",
        showTerms: false,
    },
    debit: {
        title: "Debit Note Report",
        docLabel: "Return No.",
        dateLabel: "Return Date",
        docNumberKey: "Return_Number",
        dateKey: "Return_Date",
        amountKey: "Total_Amount",
        paidKey: "Total_Received",
        paidLabel: "Paid",
        priceKey: "Purchase_Price",
        discountKey: "Discount_On_Purchase_Price",
        discountTypeKey: "Discount_Type_On_Purchase_Price",
        showTerms: false,
    },
};

const getDoc = (record) =>
    record.invoicePartyDetails ||
    record.saleReturnDetails ||
    record.purchaseReturnDetails ||
    record.billPurchaseDetails ||
    record;

const getGstRate = (taxType) => {
    if (!taxType || taxType === "None") return 0;
    const match = String(taxType).match(/GST([\d.]+)/i);
    return match ? Number(match[1]) : 0;
};

const formatRate = (rate) =>
    Number.isInteger(rate) ? `${rate}%` : `${rate.toFixed(1)}%`;

const SalePurchaseBulkReportPrintTemplate = forwardRef(
    ({ type = "sale", data, fromDate, toDate }, ref) => {
        const records = Array.isArray(data)
            ? data
            : data?.invoices || data?.purchases || data?.saleReturns || data?.purchaseReturns || [];

        const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.sale;

        const money = (v) =>
            Number(v || 0).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });

        const formatDate = (d) =>
            d
                ? new Date(d).toLocaleDateString("en-IN", {
                    day: "2-digit", month: "2-digit", year: "numeric",
                })
                : "-";

        const grandTotal = records.reduce(
            (sum, r) => sum + Number(getDoc(r)[cfg.amountKey] || 0), 0
        );
        const grandPaid = records.reduce(
            (sum, r) => sum + Number(getDoc(r)[cfg.paidKey] || 0), 0
        );
        const grandBalance = records.reduce(
            (sum, r) => sum + Number(getDoc(r).Balance_Due || 0), 0
        );

        return (
            <div ref={ref} className="bulk-print">
                <div className="bulk-report-title" />
                <div className="bulk-report-subtitle">
                    {cfg.title}
                    {fromDate && toDate && (
                        <div style={{ fontSize: 12, fontWeight: 400, marginTop: 2 }}>
                            {formatDate(fromDate)} - {formatDate(toDate)}
                        </div>
                    )}
                </div>

                {records.length === 0 ? (
                    <div className="bulk-empty">No records found for this period.</div>
                ) : (
                    records.map((record, docIdx) => {
                        const doc = getDoc(record);
                        const items = record.items || doc.items || [];
                        const splits = record.splits || doc.splits || [];

                        const splitSummary =
                            splits.length > 0
                                ? splits
                                    .map((s) =>
                                        s.Payment_Type === "Bank"
                                            ? `${s.Account_Display_Name || "Bank"} ₹${money(s.Amount)}`
                                            : `${s.Payment_Type} ₹${money(s.Amount)}`
                                    )
                                    .join("  +  ")
                                : doc.Payment_Type_Display || "";

                        // 🔹 check across ALL items in this document — show column only if any item has it
                        const hasDiscountColumn = items.some(
                            (it) => Number(it[cfg.discountKey] || 0) > 0
                        );
                        const showTaxColumns = items.some(
                            (it) => Number(it.Tax_Amount || 0) > 0
                        );

                        const totalTax = items.reduce((s, i) => s + Number(i.Tax_Amount || 0), 0);
                        const cgstTotal = totalTax / 2;
                        const sgstTotal = totalTax / 2;

                        const terms = doc.Terms_Conditions_Description
                            ? doc.Terms_Conditions_Description.split("\n").filter(Boolean)
                            : [];

                        return (
                            <div
                                key={
                                    doc.Sale_Id || doc.Purchase_Id ||
                                    doc.Sale_Return_Id || doc.Purchase_Return_Id ||
                                    doc.id || docIdx
                                }
                                className="bulk-invoice-block"
                            >
                                {/* HEADER */}
                                <div className="bulk-invoice-header">
                                    <div>
                                        <span className="bulk-label">Party: </span>
                                        <span className="bulk-bold">{doc.Party_Name || "-"}</span>
                                    </div>
                                    <div>
                                        <span className="bulk-label">{cfg.docLabel} </span>
                                        <span className="bulk-bold">{doc[cfg.docNumberKey] || "-"}</span>
                                    </div>
                                    <div>
                                        <span className="bulk-label">GSTIN: </span>
                                        {doc.GSTIN || "-"}
                                    </div>
                                    <div>
                                        <span className="bulk-label">{cfg.dateLabel}: </span>
                                        {formatDate(doc[cfg.dateKey])}
                                    </div>
                                </div>

                                {/* ITEMS TABLE */}
                                <table className="bulk-items-table">
                                    <thead>
                                        <tr>
                                            <th className="bulk-center" style={{ width: "4%" }}>#</th>
                                            <th style={{ width: "22%" }}>Item name</th>
                                            <th style={{ width: "9%" }}>HSN</th>
                                            <th className="bulk-right" style={{ width: "8%" }}>Qty</th>
                                            <th className="bulk-center" style={{ width: "6%" }}>Unit</th>
                                            <th className="bulk-right" style={{ width: "10%" }}>Price</th>
                                            {hasDiscountColumn && (
                                                <th className="bulk-right" style={{ width: "10%" }}>Discount</th>
                                            )}
                                            {showTaxColumns && (
                                                <>
                                                    <th className="bulk-right" style={{ width: "9%" }}>CGST</th>
                                                    <th className="bulk-right" style={{ width: "9%" }}>SGST</th>
                                                </>
                                            )}
                                            <th className="bulk-right" style={{ width: "11%" }}>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, i) => {
                                            const taxAmt = Number(item.Tax_Amount || 0);
                                            const gstRate = getGstRate(item.Tax_Type);
                                            const halfRate = gstRate / 2;
                                            const isTaxable = gstRate > 0 && taxAmt > 0;
                                            const itemCgst = taxAmt / 2;
                                            const itemSgst = taxAmt / 2;

                                            return (
                                                <tr key={item.id || i}>
                                                    <td className="bulk-center">{i + 1}</td>
                                                    <td>{item.Item_Name || "-"}</td>
                                                    <td>{item.Item_HSN || "-"}</td>
                                                    <td className="bulk-right">{money(item.Quantity)}</td>
                                                    <td className="bulk-center">
                                                        {item.Selected_Unit || item.Item_Unit || "-"}
                                                    </td>
                                                    <td className="bulk-right">₹ {money(item[cfg.priceKey])}</td>

                                                    {hasDiscountColumn && (
                                                        <td className="bulk-right" style={{ whiteSpace: "nowrap" }}>
                                                            {Number(item[cfg.discountKey] || 0) > 0
                                                                ? item[cfg.discountTypeKey] === "Percentage"
                                                                    ? `${item[cfg.discountKey]}% (₹${money(item.Discount_Amount || 0)})`
                                                                    : `₹${money(item.Discount_Amount || 0)}`
                                                                : "-"}
                                                        </td>
                                                    )}

                                                    {showTaxColumns && (
                                                        <>
                                                            <td className="bulk-right">
                                                                {itemCgst > 0
                                                                    ? `₹ ${money(itemCgst)}${isTaxable ? ` (${formatRate(halfRate)})` : ""}`
                                                                    : "-"}
                                                            </td>
                                                            <td className="bulk-right">
                                                                {itemSgst > 0
                                                                    ? `₹ ${money(itemSgst)}${isTaxable ? ` (${formatRate(halfRate)})` : ""}`
                                                                    : "-"}
                                                            </td>
                                                        </>
                                                    )}

                                                    <td className="bulk-right">₹ {money(item.Amount)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        {/* {showTaxColumns && (
                                            <tr>
                                                <td colSpan={hasDiscountColumn ? 7 : 6} className="bulk-right bulk-bold">
                                                    Total Tax
                                                </td>
                                                <td className="bulk-right bulk-bold">₹ {money(cgstTotal)}</td>
                                                <td className="bulk-right bulk-bold">₹ {money(sgstTotal)}</td>
                                                <td />
                                            </tr>
                                        )} */}

                                        {/* 🔹 per-document totals row — quantity, discount, amount */}
                                        <tr>
                                            <td />
                                            <td className="bulk-bold">Total</td>
                                            <td />
                                            {/* <td colSpan={3} className="bulk-right bulk-bold">Total</td> */}
                                            <td className="bulk-right bulk-bold">
                                                {money(items.reduce((s, i) => s + Number(i.Quantity || 0), 0))}
                                            </td>
                                            <td />
                                            <td />
                                            {hasDiscountColumn && (
                                                <td className="bulk-right bulk-bold">
                                                    ₹ {money(items.reduce((s, i) => s + Number(i.Discount_Amount || 0), 0))}
                                                </td>
                                            )}
                                            {showTaxColumns && (
                                                <>
                                                    <td className="bulk-right bulk-bold">₹ {money(cgstTotal)}</td>
                                                    <td className="bulk-right bulk-bold">₹ {money(sgstTotal)}</td>
                                                    {/* <td />
                                                    <td /> */}
                                                </>
                                            )}
                                            <td className="bulk-right bulk-bold">
                                                ₹ {money(items.reduce((s, i) => s + Number(i.Amount || 0), 0))}
                                            </td>
                                        </tr>
                                    </tfoot>
                                    {/* {showTaxColumns && (
                                        <tfoot>
                                            <tr>
                                                <td
                                                    colSpan={hasDiscountColumn ? 7 : 6}
                                                    className="bulk-right bulk-bold"
                                                >
                                                    Total Tax
                                                </td>
                                                <td className="bulk-right bulk-bold">₹ {money(cgstTotal)}</td>
                                                <td className="bulk-right bulk-bold">₹ {money(sgstTotal)}</td>
                                                <td />
                                            </tr>
                                        </tfoot>
                                    )} */}
                                </table>

                                {/* PAYMENT SPLITS */}
                                {splitSummary && (
                                    <div className="bulk-splits">
                                        <span className="bulk-label">Payment: </span>
                                        {splitSummary}
                                    </div>
                                )}

                                {/* TERMS — only for sale/purchase */}
                                {cfg.showTerms && terms.length > 0 && (
                                    <div className="bulk-terms">
                                        <div className="bulk-terms-header">Terms and Conditions</div>
                                        <div className="bulk-terms-body">
                                            {terms.map((term, i) => (
                                                <div key={i}>{i + 1}. {term.replace(/^\d+\.\s*/, "")}</div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* TOTALS */}
                                <div className="bulk-totals">
                                    <div>
                                        <span className="bulk-label">Total</span>
                                        <span className="bulk-bold">₹ {money(doc[cfg.amountKey])}</span>
                                    </div>
                                    <div>
                                        <span className="bulk-label">{cfg.paidLabel}</span>
                                        <span className="bulk-bold">₹ {money(doc[cfg.paidKey])}</span>
                                    </div>
                                    <div>
                                        <span className="bulk-label">Balance Due</span>
                                        <span className="bulk-bold">₹ {money(doc.Balance_Due)}</span>
                                    </div>
                                </div>

                                {docIdx < records.length - 1 && <div className="bulk-divider" />}
                            </div>
                        );
                    })
                )}

                {/* GRAND SUMMARY */}
                {records.length > 0 && (
                    <div className="bulk-summary">
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>
                            Summary ({records.length} {cfg.docLabel.replace(" No.", "")}
                            {records.length > 1 ? "s" : ""})
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Total Amount</span>
                            <span className="bulk-bold">₹ {money(grandTotal)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>{cfg.paidLabel}</span>
                            <span className="bulk-bold">₹ {money(grandPaid)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Balance Due</span>
                            <span className="bulk-bold">₹ {money(grandBalance)}</span>
                        </div>
                    </div>
                )}
            </div>
        );
    }
);

export default SalePurchaseBulkReportPrintTemplate;