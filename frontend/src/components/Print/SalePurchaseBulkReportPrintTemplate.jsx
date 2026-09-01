

import { forwardRef } from "react";
import "./SalePurchaseBulkReportPrintTemplate.css";

// const TYPE_CONFIG = {
//     sale: {
//         title: "Sale Report",
//         docLabel: "Invoice No.",
//         dateLabel: "Invoice Date",
//         docNumberKey: "Invoice_Number",
//         dateKey: "Invoice_Date",
//         amountKey: "Total_Amount",
//         paidKey: "Total_Received",
//         paidLabel: "Received",
//         priceKey: "Sale_Price",
//         discountKey: "Discount_On_Sale_Price",
//         discountTypeKey: "Discount_Type_On_Sale_Price",
//         showTerms: true,
//     },
//     purchase: {
//         title: "Purchase Report",
//         docLabel: "Bill No.",
//         dateLabel: "Bill Date",
//         docNumberKey: "Bill_Number",
//         dateKey: "Bill_Date",
//         amountKey: "Total_Amount",
//         paidKey: "Total_Paid",
//         paidLabel: "Paid",
//         priceKey: "Purchase_Price",
//         discountKey: "Discount_On_Purchase_Price",
//         discountTypeKey: "Discount_Type_On_Purchase_Price",
//         showTerms: true,
//     },
//     credit: {
//         title: "Credit Note Report",
//         docLabel: "Return No.",
//         dateLabel: "Return Date",
//         docNumberKey: "Return_Number",
//         dateKey: "Return_Date",
//         amountKey: "Total_Amount",
//         paidKey: "Total_Paid",
//         paidLabel: "Received",
//         priceKey: "Sale_Price",
//         discountKey: "Discount_On_Sale_Price",
//         discountTypeKey: "Discount_Type_On_Sale_Price",
//         showTerms: false,
//     },
//     debit: {
//         title: "Debit Note Report",
//         docLabel: "Return No.",
//         dateLabel: "Return Date",
//         docNumberKey: "Return_Number",
//         dateKey: "Return_Date",
//         amountKey: "Total_Amount",
//         paidKey: "Total_Received",
//         paidLabel: "Paid",
//         priceKey: "Purchase_Price",
//         discountKey: "Discount_On_Purchase_Price",
//         discountTypeKey: "Discount_Type_On_Purchase_Price",
//         showTerms: false,
//     },
// };
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
        mrpKey: "MRP",
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
        mrpKey: "MRP",
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
        mrpKey: "MRP",
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
        mrpKey: "MRP",
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
                        const hasMRPColumn = items.some(
                            (it) => Number(it[cfg.mrpKey] || 0) > 0
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
                                            {hasMRPColumn && (
                                                <th className="bulk-right" style={{ width: "8%" }}>
                                                    MRP
                                                </th>
                                            )}
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
                                                    {hasMRPColumn && (
                                                        <td className="bulk-right">
                                                            {Number(item[cfg.mrpKey] || 0) > 0
                                                                ? money(item[cfg.mrpKey])
                                                                : "-"}
                                                        </td>
                                                    )}
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
                                             {hasMRPColumn && <td />}
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