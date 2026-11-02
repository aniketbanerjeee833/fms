

import { forwardRef } from "react";
import "./SalePurchaseBulkReportPrintTemplate.css";
import { useGetAllTaxesAndGSTSettingsQuery } from "../../redux/api/Settings/taxesAndGSTSettingsApi";


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

    expense: {
        title: "Expenses Report",
        docLabel: "Expense No.",
        dateLabel: "Expense Date",
        docNumberKey: "Expense_Number",
        dateKey: "Expense_Date",
        amountKey: "Total_Amount",
        paidKey: "Total_Amount",
        paidLabel: "Amount",
        priceKey: "Amount",
        mrpKey: "MRP",
        discountKey: "Discount",
        discountTypeKey: "Discount_Type",
        showTerms: false,
    },
};
const getDoc = (record) =>
    record.invoicePartyDetails ||
    record.saleReturnDetails ||
    record.purchaseReturnDetails ||
    record.billPurchaseDetails ||
    record.expenseDetails ||
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
        // ✅ HOOKS FIRST
        const { data: taxesGSTSettingsData } = useGetAllTaxesAndGSTSettingsQuery();

        const taxesGSTSettings =
            taxesGSTSettingsData?.settings || [];

        const enableHSNCode =
            Number(
                taxesGSTSettings.find(
                    (s) => s.setting_key === "enable_hsn_sac"
                )?.setting_value
            ) === 1;

        const records = Array.isArray(data)
            ? data
            : data?.invoices ||
              data?.purchases ||
              data?.saleReturns ||
              data?.purchaseReturns ||
              data?.expenses?.expenseBills ||
              data?.expenses ||
              data?.expenseBills ||
              [];

        const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.sale;
        const isExpense = type === "expense";

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

        const getRecordAmount = (record) => {
            const doc = getDoc(record);
            return Number(
                doc[cfg.amountKey] ??
                doc.Amount ??
                doc.Expense_Amount ??
                doc.Total_Expense ??
                0
            );
        };

        const grandTotal = records.reduce(
            (sum, record) => sum + getRecordAmount(record), 0
        );
        const grandPaid = records.reduce(
            (sum, record) =>
                sum + Number(
                    getDoc(record)[cfg.paidKey] ??
                    getDoc(record).Amount ??
                    getDoc(record).Expense_Amount ??
                    0
                ), 0
        );
        const grandBalance = records.reduce(
            (sum, record) => sum + Number(getDoc(record).Balance_Due || 0), 0
        );

        return (
            <div ref={ref} className="bulk-print">
                <div className="bulk-report-title" />
                <div
  className={`bulk-report-subtitle ${
    isExpense ? "bulk-expense-subtitle" : ""
  }`}
>
  {cfg.title}

  {fromDate && toDate && (
    <div style={{ fontSize: 12, fontWeight: 400, marginTop: 2 }}>
      {formatDate(fromDate)} - {formatDate(toDate)}
    </div>
  )}
</div>
                {/* <div className="bulk-report-subtitle">
                    {cfg.title}
                    {fromDate && toDate && (
                        <div style={{ fontSize: 12, fontWeight: 400, marginTop: 2 }}>
                            {formatDate(fromDate)} - {formatDate(toDate)}
                        </div>
                    )}
                </div> */}

                {records.length === 0 ? (
                    <div className="bulk-empty">No records found for this period.</div>
                ) : isExpense ? (
                    <div className="bulk-invoice-block">
                        {records.map((record, billIndex) => {
                            const expense = getDoc(record);
                            const items = Array.isArray(record.items)
                                ? record.items
                                : Array.isArray(expense.items)
                                    ? expense.items
                                    : [];
                            const splits = Array.isArray(record.splits)
                                ? record.splits
                                : Array.isArray(expense.splits)
                                    ? expense.splits
                                    : [];
                            const expenseDate =
                                expense[cfg.dateKey] ??
                                expense.Date ??
                                expense.created_at
                            const expenseNumber =
                                expense[cfg.docNumberKey] ??
                                expense.Expense_Id ??
                                expense.Expense_ID ??
                                expense.id ??
                                "-";
                            const expenseTotal = getRecordAmount(record);
                            const expensePaid = Number(
                                expense.Total_Paid ?? expense.Total_Amount ??
                                expense.Amount ?? expense.Expense_Amount ?? 0
                            );
                            const expenseBalance = Number(expense.Balance_Due ?? 0);
                            const itemColumns = enableHSNCode ? 7 : 6;

                            return (
                                <div key={expense.Expense_Id ?? expense.id ?? expenseNumber ?? billIndex}
                                     style={{ marginBottom: 18, marginTop: 0, pageBreakInside: "avoid" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, margin: "0 0 6px" }}>
                                        <div>
                                            <strong>Expense No.:</strong> {expenseNumber}
                                            <span style={{ marginLeft: 18 }}><strong>Date:</strong> {formatDate(expenseDate)}</span>
                                        </div>
                                        <div>
                                            <strong>Category:</strong> {expense.Category_Name ?? expense.Expense_Category ?? expense.Category ?? "-"}
                                        </div>
                                    </div>
                                    {(expense.Party_Name || expense.GSTIN) && (
                                        <div style={{ marginBottom: 8, fontSize: 12 }}>
                                            {expense.Party_Name && <span><strong>Party:</strong> {expense.Party_Name}</span>}
                                            {expense.GSTIN && <span style={{ marginLeft: 16 }}><strong>GSTIN:</strong> {expense.GSTIN}</span>}
                                        </div>
                                    )}
                                    <table className="bulk-items-table">
                                        <thead>
                                            <tr>
                                                <th className="bulk-center">#</th>
                                                <th>Expense Item</th>
                                                {enableHSNCode && <th>HSN/SAC</th>}
                                                <th className="bulk-right">Qty</th>
                                                <th className="bulk-right">Price</th>
                                                <th className="bulk-right">Discount</th>
                                                <th className="bulk-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.length > 0 && items.map((item, itemIndex) => {
                                                const quantity = Number(item.Quantity ?? item.quantity ?? 0);
                                                const price = Number(item.Price ?? item.Amount_Per_Unit ?? item.Unit_Price ?? item.price ?? 0);
                                                const discountValue = Number(item.Discount_On_Price ?? item.Discount_Amount ?? item.Discount ?? 0);
                                                const discountType = item.Discount_Type_On_Price ?? item.Discount_Type ?? "";
                                                const discountLabel = discountValue
                                                    ? `${money(discountValue)}${String(discountType).toLowerCase().includes("percent") ? "%" : ""}`
                                                    : "-";
                                                const amount = Number(item.Amount ?? item.Total_Amount ?? item.amount ?? (quantity * price));
                                                return (
                                                    <tr key={item.id ?? item.Id ?? item.Expense_Item_Id ?? itemIndex}>
                                                        <td className="bulk-center">{itemIndex + 1}</td>
                                                        <td>{item.Item_Name ?? item.Expense_Item_Name ?? item.Name ?? item.Description ?? "-"}</td>
                                                        {enableHSNCode && <td>{item.Item_HSN ?? item.HSN_Code ?? item.SAC_Code ?? "-"}</td>}
                                                        <td className="bulk-right">{money(quantity)}</td>
                                                        <td className="bulk-right">₹ {money(price)}</td>
                                                        <td className="bulk-right">{discountLabel}</td>
                                                        <td className="bulk-right">₹ {money(amount)}</td>
                                                    </tr>
                                                );
                                            }) 
                                            //: (
                                                // <tr>
                                                //     <td colSpan={itemColumns} style={{ textAlign: "center" }}>
                                                //         No item details returned for this expense.
                                                //     </td>
                                                // </tr>
                                            //)
                                        }
                                        </tbody>
                                        {items.length > 0 && (
                                            <tfoot>
                                                <tr>
                                                    <td colSpan={itemColumns - 1} className="bulk-right bulk-bold">Items Total</td>
                                                    <td className="bulk-right bulk-bold">₹ {money(items.reduce((sum, item) => sum + Number(item.Amount ?? item.Total_Amount ?? item.amount ?? (Number(item.Quantity ?? item.quantity ?? 0) * Number(item.Price ?? item.Amount_Per_Unit ?? item.Unit_Price ?? item.price ?? 0))), 0))}</td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </table>
                                    {splits.length > 0 && (
                                        <div style={{ marginTop: 6, fontSize: 12 }}>
                                            <strong>Payment:</strong> {splits.map((split, i) =>
                                                `${split.Payment_Type ?? split.paymentType ?? "Payment"} ₹${money(split.Amount ?? split.amount ?? 0)}`
                                            ).join(" | ")}
                                        </div>
                                    )}
                                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 24, marginTop: 8, fontSize: 12 }}>
                                        <span><strong>Total:</strong> ₹ {money(expenseTotal)}</span>
                                        <span><strong>Paid:</strong> ₹ {money(expensePaid)}</span>
                                        <span><strong>Balance:</strong> ₹ {money(expenseBalance)}</span>
                                    </div>
                                    {billIndex < records.length - 1 && <hr style={{ margin: "16px 0", borderTop: "1px solid #999" }} />}
                                </div>
                            );
                        })}
                        {/* <table className="bulk-items-table">
                            <tfoot>
                                <tr>
                                    <td className="bulk-right bulk-bold">Total Expenses</td>
                                    <td className="bulk-right bulk-bold">₹ {money(grandTotal)}</td>
                                </tr>
                            </tfoot>
                        </table> */}
                    </div>
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
                                {/* <div className="bulk-invoice-header">
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
                                </div> */}
                                <div className="bulk-invoice-header">
                                    {/* LEFT */}
                                    <div>
                                        <div>
                                            <span className="bulk-label">Party: </span>
                                            {/* <span className="bulk-bold">
                                                {doc.Party_Name || "-"}
                                            </span> */}
                                            <span className="bulk-bold">
                                                {doc.Billing_Name || doc.Party_Name || ""}
                                            </span>
                                        </div>

                                        {doc.GSTIN && (
                                            <div>
                                                <span className="bulk-label">GSTIN: </span>
                                                {doc.GSTIN}
                                            </div>
                                        )}

                                        {doc.Phone_Number && (
                                            <div>
                                                <span className="bulk-label">Phone: </span>
                                                {doc.Phone_Number}
                                            </div>
                                        )}
                                    </div>

                                    {/* RIGHT */}
                                    <div style={{ textAlign: "right" }}>
                                        <div>
                                            <span className="bulk-label">{cfg.docLabel} </span>
                                            <span className="bulk-bold">
                                                {doc[cfg.docNumberKey] || ""}
                                            </span>
                                        </div>

                                        <div>
                                            <span className="bulk-label">{cfg.dateLabel}: </span>
                                            {formatDate(doc[cfg.dateKey])}
                                        </div>
                                    </div>
                                </div>

                                {/* ITEMS TABLE */}
                                <table className="bulk-items-table">
                                    <thead>
                                        <tr>
                                            <th className="bulk-center" style={{ width: "4%" }}>#</th>
                                            <th style={{ width: "22%" }}>Item name</th>
                                            {/* <th style={{ width: "9%" }}>HSN</th> */}
                                            {enableHSNCode && (
                                                <th style={{ width: "9%" }}>HSN</th>
                                            )}
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
                                                    <td>{item.Item_Name || ""}</td>
                                                    {enableHSNCode && (
                                                        <td>{item.Item_HSN || ""}</td>
                                                    )}
                                                    {/* <td>{item.Item_HSN || "-"}</td> */}
                                                    {hasMRPColumn && (
                                                        <td className="bulk-right">
                                                            {Number(item[cfg.mrpKey] || 0) > 0
                                                                ? money(item[cfg.mrpKey])
                                                                : ""}
                                                        </td>
                                                    )}
                                                    <td className="bulk-right">
                                                        {Number(item.Quantity || 0)}

                                                        {item.Free_Quantity !== null &&
                                                            item.Free_Quantity !== undefined &&
                                                            Number(item.Free_Quantity) > 0 && (
                                                                <>
                                                                    {" + "}
                                                                    {Number(item.Free_Quantity)}
                                                                </>
                                                            )}
                                                    </td>
                                                    {/* <td className="bulk-right">{money(item.Quantity)}</td> */}
                                                    <td className="bulk-center">
                                                        {item.Selected_Unit || item.Item_Unit || ""}
                                                    </td>
                                                    <td className="bulk-right">₹ {money(item[cfg.priceKey])}</td>

                                                    {hasDiscountColumn && (
                                                        <td className="bulk-right" style={{ whiteSpace: "nowrap" }}>
                                                            {Number(item[cfg.discountKey] || 0) > 0
                                                                ? item[cfg.discountTypeKey] === "Percentage"
                                                                    ? `${item[cfg.discountKey]}% (₹${money(item.Discount_Amount || 0)})`
                                                                    : `₹${money(item.Discount_Amount || 0)}`
                                                                : ""}
                                                        </td>
                                                    )}

                                                    {showTaxColumns && (
                                                        <>
                                                            <td className="bulk-right">
                                                                {itemCgst > 0
                                                                    ? `₹ ${money(itemCgst)}${isTaxable ? ` (${formatRate(halfRate)})` : ""}`
                                                                    : ""}
                                                            </td>
                                                            <td className="bulk-right">
                                                                {itemSgst > 0
                                                                    ? `₹ ${money(itemSgst)}${isTaxable ? ` (${formatRate(halfRate)})` : ""}`
                                                                    : ""}
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
                                            {/* <td /> */}
                                            {enableHSNCode && <td />}
                                            {hasMRPColumn && <td />}
                                            {/* <td colSpan={3} className="bulk-right bulk-bold">Total</td> */}
                                            {/* <td className="bulk-right bulk-bold">
                                                {money(items.reduce((s, i) => s + Number(i.Quantity || 0), 0))}
                                            </td> */}
                                            <td className="bulk-right bulk-bold">
                                                {(() => {
                                                    const quantityTotal = items.reduce(
                                                        (sum, item) => {
                                                            // Don't include Service items
                                                            if (
                                                                String(item?.Item_Type || "").toLowerCase() ===
                                                                "service"
                                                            ) {
                                                                return sum;
                                                            }

                                                            sum.quantity += Number(item?.Quantity || 0);
                                                            sum.freeQuantity += Number(item?.Free_Quantity || 0);

                                                            return sum;
                                                        },
                                                        { quantity: 0, freeQuantity: 0 }
                                                    );

                                                    if (
                                                        quantityTotal.quantity === 0 &&
                                                        quantityTotal.freeQuantity === 0
                                                    ) {
                                                        return "";
                                                    }

                                                    return `${quantityTotal.quantity}${quantityTotal.freeQuantity > 0
                                                        ? ` + ${quantityTotal.freeQuantity}`
                                                        : ""
                                                        }`;
                                                })()}
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
                            Summary ({records.length} {isExpense ? "Expense" : cfg.docLabel.replace(" No.", "")}
                            {records.length > 1 ? "s" : ""})
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>{isExpense ? "Total Expenses" : "Total Amount"}</span>
                            <span className="bulk-bold">₹ {money(grandTotal)}</span>
                        </div>
                        {!isExpense && (
                            <>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span>{cfg.paidLabel}</span>
                                    <span className="bulk-bold">₹ {money(grandPaid)}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span>Balance Due</span>
                                    <span className="bulk-bold">₹ {money(grandBalance)}</span>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        );
    }
);

export default SalePurchaseBulkReportPrintTemplate;