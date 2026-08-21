import React from 'react'

import { forwardRef } from "react";
import "./PartyBulkReportPrintTemplate.css";

/* ── which top-level `type` labels carry an items table ── */
// const ITEM_TXN_TYPES = ["Sale", "Purchase", "Sale Return", "Purchase Return"];
const ITEM_TXN_TYPES = [
  "Sale",
  "Purchase",
  "Sale Return",
  "Purchase Return",
  "Expense",
];
/* ── per-type config, mirrors SalePurchaseBulkReportPrintTemplate's TYPE_CONFIG ── */
const TYPE_CONFIG = {
    Sale: {
        docLabel: "Invoice No.",
        docNumberKey: "Invoice_Number",
        amountKey: "Total_Amount",
        paidKey: "Total_Received",
        paidLabel: "Received",
        priceKey: "Sale_Price",
        discountKey: "Discount_On_Sale_Price",
        discountTypeKey: "Discount_Type_On_Sale_Price",
    },
    Purchase: {
        docLabel: "Bill No.",
        docNumberKey: "Bill_Number",
        amountKey: "Total_Amount",
        paidKey: "Total_Paid",
        paidLabel: "Paid",
        priceKey: "Purchase_Price",
        discountKey: "Discount_On_Purchase_Price",
        discountTypeKey: "Discount_Type_On_Purchase_Price",
    },
    "Sale Return": {
        docLabel: "Return No.",
        docNumberKey: "Return_Number",
        amountKey: "Total_Amount",
        paidKey: "Total_Paid",
        paidLabel: "Received",
        priceKey: "Sale_Price",
        discountKey: "Discount_On_Sale_Price",
        discountTypeKey: "Discount_Type_On_Sale_Price",
    },
    "Purchase Return": {
        docLabel: "Return No.",
        docNumberKey: "Return_Number",
        amountKey: "Total_Amount",
        paidKey: "Total_Received",
        paidLabel: "Paid",
        priceKey: "Purchase_Price",
        discountKey: "Discount_On_Purchase_Price",
        discountTypeKey: "Discount_Type_On_Purchase_Price",
    },
    Expense: {
  docLabel: "Expense No.",
  docNumberKey: "Expense_Number",
  amountKey: "Total_Amount",
  paidKey: "Total_Amount",
  paidLabel: "Amount",
  priceKey: "Price",
  discountKey: "Discount_On_Price",
  discountTypeKey: "Discount_Type_On_Price",
},
};

/* ── pull the nested "doc" object out of record.data, whichever key it's under ── */
const getDoc = (data) =>
    data?.invoicePartyDetails ||
    data?.billPurchaseDetails ||
    data?.purchaseReturnDetails ||
    data?.saleReturnDetails ||
    data?.paymentInDetails ||
    data?.paymentOutDetails ||
    data ||
    {};

const getGstRate = (taxType) => {
    if (!taxType || taxType === "None") return 0;
    const match = String(taxType).match(/GST([\d.]+)/i);
    return match ? Number(match[1]) : 0;
};

const formatRate = (rate) =>
    Number.isInteger(rate) ? `${rate}%` : `${rate.toFixed(1)}%`;

const money = (v) =>
    Number(v || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

const fmtDate = (d) =>
    d
        ? new Date(d).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        })
        : "-";

const buildSplitSummary = (splits = []) =>
    splits.length > 0
        ? splits
            .map((s) =>
                s.Payment_Type === "Bank"
                    ? `${s.Account_Display_Name || "Bank"} ₹${money(s.Amount)}`
                    : `${s.Payment_Type} ₹${money(s.Amount)}`
            )
            .join("  +  ")
        : "";

const PartyBulkReportPrintTemplate = forwardRef(({ data }, ref) => {
    const party = data?.partyDetails || {};
    const transactions = data?.transactions || [];
    console.log(transactions);


    const defaultBilling = party.addresses?.find(
        (a) => a.Address_Type === "Billing" && a.Is_Default
    );

    /* ── group transactions by date, preserving original order ── */
    const grouped = [];
    const dateIndex = new Map();

    transactions.forEach((txn) => {
        const key = fmtDate(txn.date);
        if (!dateIndex.has(key)) {
            dateIndex.set(key, { date: key, rows: [] });
            grouped.push(dateIndex.get(key));
        }
        dateIndex.get(key).rows.push(txn);
    });

    return (
        <div ref={ref} className="bulk-print">
            {/* ── REPORT TITLE ── */}
            <div className="bulk-report-title">Party Statement</div>
            {/* {fromDate && toDate && (
                <div className="bulk-report-subtitle" style={{ fontSize: 13 }}>
                    {fmtDate(fromDate)} - {fmtDate(toDate)}
                </div>
            )} */}

            {/* ── PARTY HEADER BLOCK ── */}
            <div className="bulk-party-header">
                <div className="bulk-party-name">{party.Party_Name || "-"}</div>
                <div className="bulk-party-details">
                    {party.Phone_Number && (
                        <div>
                            <span className="bulk-label">Contact No.: </span>
                            {party.Phone_Number}
                        </div>
                    )}
                    {(defaultBilling?.Address_Text || party.addresses?.[0]?.Address_Text) && (
                        <div>
                            <span className="bulk-label">Address: </span>
                            {defaultBilling?.Address_Text || party.addresses[0].Address_Text}
                        </div>
                    )}
                    {party.GSTIN && (
                        <div>
                            <span className="bulk-label">GSTIN: </span>
                            {party.GSTIN}
                        </div>
                    )}
                </div>
            </div>

            {/* ── TRANSACTIONS, GROUPED BY DATE ── */}
            {grouped.length === 0 ? (
                <div className="bulk-empty">No transactions found for this party.</div>
            ) : (
                grouped.map((group, gIdx) => (
                    <div key={group.date + gIdx} className="bulk-date-group">
                        <div className="bulk-date-heading">{group.date}</div>

                        {group.rows.map((txn, rIdx) => {
                            const hasItems =
                                ITEM_TXN_TYPES.includes(txn.type) &&
                                Array.isArray(txn.data?.items) &&
                                txn.data.items.length > 0;

                            const cfg = TYPE_CONFIG[txn.type];

                            /* ══════════════════════════════════════════
                               ITEM-BEARING DOCUMENT — Sale / Purchase / Returns
                            ══════════════════════════════════════════ */
                            if (hasItems && cfg) {
                                const doc = getDoc(txn.data);

                                const items = txn.data.items || [];
                                const splits = txn.data.splits || [];
                                const splitSummary =
                                    buildSplitSummary(splits) || doc.Payment_Type_Display || "";

                                const hasDiscountColumn = items.some(
                                    (it) => Number(it[cfg.discountKey] || 0) > 0
                                );
                                const showTaxColumns = items.some(
                                    (it) => Number(it.Tax_Amount || 0) > 0
                                );

                                /* tax breakdown grouped by half-rate, same as InvoicePrintTemplate */
                                const taxGroups = {};
                                items.forEach((item) => {
                                    const gstRate = getGstRate(item.Tax_Type);
                                    const taxAmt = Number(item.Tax_Amount || 0);
                                    const halfRate = gstRate / 2;
                                    const key = String(halfRate);
                                    if (!taxGroups[key]) {
                                        taxGroups[key] = { halfRate, cgst: 0, sgst: 0 };
                                    }
                                    taxGroups[key].cgst += taxAmt / 2;
                                    taxGroups[key].sgst += taxAmt / 2;
                                });
                                // const taxGroupList = Object.values(taxGroups).filter(
                                //     (g) => g.halfRate > 0
                                // );
                                //const hasTaxDetails = taxGroupList.length > 0;

                                return (
                                    <div
                                        key={`${txn.type}-${gIdx}-${rIdx}`}
                                        className="bulk-invoice-block"
                                    >
                                        {/* doc header — no party name, already shown above */}
                                        <div className="bulk-invoice-header bulk-invoice-header-compact">
                                            {/* <div>
                                                <span className="bulk-label">{txn.type} : </span>
                                                <span className="bulk-bold">
                                                    {doc[cfg.docNumberKey] || txn.number || "-"}
                                                </span>
                                            </div> */}
                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: "8px",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <span className="bulk-label">
                                                    {txn.type} :
                                                </span>

                                                <span className="bulk-bold">
                                                    {doc[cfg.docNumberKey] || txn.number || "-"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* items table */}
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
                                                <tr>
                                                    <td />
                                                    <td className="bulk-bold">Total</td>
                                                    <td />
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
                                                            <td className="bulk-right bulk-bold">
                                                                ₹ {money(items.reduce((s, i) => s + Number(i.Tax_Amount || 0), 0) / 2)}
                                                            </td>
                                                            <td className="bulk-right bulk-bold">
                                                                ₹ {money(items.reduce((s, i) => s + Number(i.Tax_Amount || 0), 0) / 2)}
                                                            </td>
                                                        </>
                                                    )}
                                                    <td className="bulk-right bulk-bold">
                                                        ₹ {money(items.reduce((s, i) => s + Number(i.Amount || 0), 0))}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>

                                        {/* tax breakdown table — CGST/SGST by rate */}
                                        {/* {hasTaxDetails && (
                                            <table className="bulk-tax-table">
                                                <thead>
                                                    <tr>
                                                        <td className="bulk-label">Tax Details</td>
                                                        {taxGroupList.map((g) => (
                                                            <td key={g.halfRate} className="bulk-right">{g.halfRate}%</td>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td className="bulk-label">CGST</td>
                                                        {taxGroupList.map((g) => (
                                                            <td key={g.halfRate} className="bulk-right">₹ {money(g.cgst)}</td>
                                                        ))}
                                                    </tr>
                                                    <tr>
                                                        <td className="bulk-label">SGST</td>
                                                        {taxGroupList.map((g) => (
                                                            <td key={g.halfRate} className="bulk-right">₹ {money(g.sgst)}</td>
                                                        ))}
                                                    </tr>
                                                </tbody>
                                            </table>
                                        )} */}

                                        {/* payment splits */}
                                        {splitSummary && (
                                            <div className="bulk-splits">
                                                <span className="bulk-label">Payment: </span>
                                                {splitSummary}
                                            </div>
                                        )}

                                        {/* totals */}
                                        <div className="bulk-totals">
                                            <div>
                                                <span className="bulk-label">Total</span>
                                                <span className="bulk-bold">₹ {money(doc[cfg.amountKey] ?? txn.amount)}</span>
                                            </div>
                                            <div>
                                                <span className="bulk-label">{cfg.paidLabel}</span>
                                                <span className="bulk-bold">
                                                    ₹ {money(doc[cfg.paidKey] ?? (txn.amount - txn.balance))}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="bulk-label">Balance Due</span>
                                                <span className="bulk-bold">₹ {money(doc.Balance_Due ?? txn.balance)}</span>
                                            </div>
                                        </div>
                                        {doc.Terms_Conditions_Description && (
                                            <div className="bulk-terms">
                                                <div className="bulk-terms-header">Terms and Conditions</div>
                                                <div className="bulk-terms-body">
                                                    {String(doc.Terms_Conditions_Description)
                                                        .split("\n")
                                                        .filter(Boolean)
                                                        .map((line, i) => (
                                                            <div key={i}>{i + 1}. {line.replace(/^\d+\.\s*/, "")}</div>
                                                        ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            /* ══════════════════════════════════════════
                               SINGLE-LINE ROW — Payment In / Out / Opening Balance
                            ══════════════════════════════════════════ */
                            const doc = getDoc(txn.data);
                            const splits = txn.data?.splits || [];
                            const splitSummary = buildSplitSummary(splits);
                            const direction = txn.data?.Direction;


                            if (txn.type === "Payment In") {
                                const details = txn.data?.paymentInDetails || {};
                                const splits = txn.data?.splits || [];

                                const paymentDetails =
                                    splits.length > 0
                                        ? splits
                                            .map((s) => {
                                                const label =
                                                    s.Payment_Type === "Bank"
                                                        ? s.Account_Display_Name || "Bank"
                                                        : s.Payment_Type;

                                                return `${label} ₹${money(s.Amount)}`;
                                            })
                                            .join(" , ")
                                        : "-";

                                return (
                                    <div
                                        key={`${txn.type}-${gIdx}-${rIdx}`}
                                        className="bulk-invoice-block"
                                    >
                                        <div className="bulk-invoice-header bulk-invoice-header-compact">
                                            <span className="bulk-label">
                                                Payment In
                                            </span>
                                        </div>

                                        <table className="bulk-items-table">
                                            <thead>
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Receipt No.</th>
                                                    <th>Party Name</th>
                                                    <th>Payment Details</th>
                                                    <th className="bulk-right">
                                                        Received
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                <tr>
                                                    <td>
                                                        {fmtDate(
                                                            details.Payment_Date
                                                        )}
                                                    </td>

                                                    <td>
                                                        {details.Receipt_No || "-"}
                                                    </td>

                                                    <td>
                                                        {details.Party_Name || "-"}
                                                    </td>

                                                    <td>{paymentDetails}</td>

                                                    <td className="bulk-right">
                                                        ₹ {money(details.Received)}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            }
                            if (txn.type === "Payment Out") {
                                const details = txn.data?.paymentOutDetails || {};
                                const splits = txn.data?.splits || [];

                                const paymentDetails =
                                    splits.length > 0
                                        ? splits
                                            .map((s) => {
                                                const label =
                                                    s.Payment_Type === "Bank"
                                                        ? s.Account_Display_Name || "Bank"
                                                        : s.Payment_Type;

                                                return `${label} ₹${money(s.Amount)}`;
                                            })
                                            .join(" , ")
                                        : "-";

                                return (
                                    <div
                                        key={`${txn.type}-${gIdx}-${rIdx}`}
                                        className="bulk-invoice-block"
                                    >
                                        <div className="bulk-invoice-header bulk-invoice-header-compact">
                                            <span className="bulk-label">
                                                Payment Out
                                            </span>
                                        </div>

                                        <table className="bulk-items-table">
                                            <thead>
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Payment No.</th>
                                                    <th>Party Name</th>
                                                    <th>Payment Details</th>
                                                    <th className="bulk-right">
                                                        Paid
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                <tr>
                                                    <td>
                                                        {fmtDate(
                                                            details.Payment_Date
                                                        )}
                                                    </td>

                                                    <td>
                                                        {details.Payment_Number || "-"}
                                                    </td>

                                                    <td>
                                                        {details.Party_Name || "-"}
                                                    </td>

                                                    <td>{paymentDetails}</td>

                                                    <td className="bulk-right">
                                                        ₹ {money(details.Paid)}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            }

                            return (
                                <div
                                    key={`${txn.type}-${gIdx}-${rIdx}`}
                                    style={{
                                        border: "1px solid #d1d5db",
                                        marginBottom: "8px",
                                    }}
                                >
                                    <table
                                        style={{
                                            width: "100%",
                                            borderCollapse: "collapse",
                                        }}
                                    >
                                        <tbody>
                                            <tr>
                                                <td
                                                    style={{
                                                        padding: "6px",
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {txn.type}
                                                </td>

                                                <td style={{ padding: "6px" }}>
                                                    {txn.number || "-"}
                                                </td>

                                                <td style={{ padding: "6px" }}>
                                                    {fmtDate(txn.date)}
                                                </td>

                                                <td
                                                    style={{
                                                        padding: "6px",
                                                        textAlign: "right",
                                                    }}
                                                >
                                                    ₹ {money(txn.amount)}
                                                </td>


                                                {splitSummary && (

                                                    <td
                                                        colSpan={4}
                                                        style={{
                                                            padding: "6px",
                                                            borderTop: "1px solid #e5e7eb",
                                                        }}
                                                    >
                                                        <strong>Payment :</strong>{" "}
                                                        {splitSummary}
                                                    </td>

                                                )}
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            );



                        })}
                    </div>
                ))
            )}
        </div>
    );
});

export default PartyBulkReportPrintTemplate;

// <div
//     key={`${txn.type}-${gIdx}-${rIdx}`}
//     className="bulk-single-line"
// >
//     <span className="bulk-single-type">{txn.type}</span>

//     {txn.number && txn.number !== "-" && (
//         <span className="bulk-single-number">{txn.number}</span>
//     )}

//     {splitSummary && (
//         <span className="bulk-single-splits">{splitSummary}</span>
//     )}

//     <span
//         className="bulk-single-amount"
//         style={{
//             color:
//                 direction === "Credit"
//                     ? "#166534"
//                     : direction === "Debit"
//                         ? "#991b1b"
//                         : "#111827",
//         }}
//     >
//         ₹ {money(txn.amount)}
//     </span>
// </div>

