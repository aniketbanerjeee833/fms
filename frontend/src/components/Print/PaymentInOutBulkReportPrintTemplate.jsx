import { forwardRef } from "react";
import "./PaymentInOutBulkReportPrintTemplate.css";

/* ═══════════════════════════════════════════════════════════════════
   MATCHES YOUR ACTUAL RESPONSE SHAPE:

   Payment In:
   {
     success: true,
     totalPayments: N,
     paymentIns: [
       { paymentInDetails: { id, Party_Name, GSTIN, Receipt_No, Payment_Date, Received }, splits: [...] },
       ...
     ],
     summary: { totalReceived }
   }

   Payment Out (expected mirror):
   {
     success: true,
     totalPayments: N,
     paymentOuts: [
       { paymentOutDetails: { id, Party_Name, GSTIN, Receipt_No, Payment_Date, Paid }, splits: [...] },
       ...
     ],
     summary: { totalPaid }
   }

   type: "in" | "out"
═══════════════════════════════════════════════════════════════════ */

const TYPE_CONFIG = {
    in: {
        title: "Payment In Report",
        recordsKey: "paymentIns",
        detailsKey: "paymentInDetails",
        amountKey: "Received",
        amountLabel: "Received",
        summaryKey: "totalReceived",
    },
    out: {
        title: "Payment Out Report",
        recordsKey: "paymentOuts",
        detailsKey: "paymentOutDetails",
        amountKey: "Paid",
        amountLabel: "Paid",
        summaryKey: "totalPaid",
    },
};

const money = (v) =>
    Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (d) =>
    d
        ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
        : "-";

const PaymentInOutBulkReportPrintTemplate = forwardRef(
    ({ type = "in", data, fromDate, toDate }, ref) => {

        const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.in;

        //const records = data?.[cfg.recordsKey] || [];
        const records = Array.isArray(data)
            ? data
            : data?.[cfg.recordsKey] || [];
            console.log(records);
        const grandTotal = records.reduce(
            (sum, r) =>
                sum +
                Number(
                    r?.[cfg.detailsKey]?.[cfg.amountKey] || 0
                ),
            0
        );
        // const grandTotal =
        //   data?.summary?.[cfg.summaryKey] ??
        //   records.reduce((sum, r) => sum + Number(r[cfg.detailsKey]?.[cfg.amountKey] || 0), 0);

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
                    <div className="bulk-empty">
                        No records found for this period.
                    </div>
                ) : (
                    <table className="bulk-items-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Ref No.</th>
                                <th>Party Name</th>
                                <th>Payment Details</th>
                                <th className="bulk-right">
                                    {cfg.amountLabel}
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {records.map((record, index) => {
                                const details =
                                    record[cfg.detailsKey] || {};

                                const splits =
                                    record.splits || [];

                                const paymentDetails =
                                    splits.length > 0
                                        ? splits
                                            .map((s) => {
                                                const label =
                                                    s.Payment_Type === "Bank"
                                                        ? s.Account_Display_Name ||
                                                        "Bank"
                                                        : s.Payment_Type;

                                                return `${label} ₹${money(
                                                    s.Amount
                                                )}`;
                                            })
                                            .join(" , ")
                                        : "-";

                                return (
                                    <tr key={index}>
                                        <td>
                                            {formatDate(
                                                details.Payment_Date
                                            )}
                                        </td>

                                        <td>
                                            {details.Receipt_No ||
                                                
                                                "-"}
                                        </td>

                                        <td>
                                            {details.Party_Name ||
                                                "-"}
                                        </td>

                                        <td>
                                            {paymentDetails}
                                        </td>

                                        <td className="bulk-right">
                                            ₹{" "}
                                            {money(
                                                details[cfg.amountKey]
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>

                        <tfoot>
                            <tr>
                                <td
                                    colSpan={4}
                                    className="bulk-right bulk-bold"
                                >
                                    Total
                                </td>

                                <td className="bulk-right bulk-bold">
                                    ₹ {money(grandTotal)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                )}

                {/* GRAND SUMMARY */}
                {records.length > 0 && (
                    <div className="bulk-summary">
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>
                            Summary ({records.length} {type === "in" ? "Receipt" : "Payment"}
                            {records.length > 1 ? "s" : ""})
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Total {cfg.amountLabel}</span>
                            <span className="bulk-bold">₹ {money(grandTotal)}</span>
                        </div>
                    </div>
                )}

            </div>
        );
    }
);

export default PaymentInOutBulkReportPrintTemplate;


                {/* {records.length === 0 ? (
          <div className="bulk-empty">No records found for this period.</div>
        ) : (
          records.map((record, idx) => {
            const details = record[cfg.detailsKey] || {};
            const splits  = record.splits || [];

            const splitSummary =
              splits.length > 0
                ? splits
                    .map((s) =>
                      s.Payment_Type === "Bank"
                        ? `${s.Account_Display_Name || "Bank"} ₹${money(s.Amount)}`
                        : `${s.Payment_Type} ₹${money(s.Amount)}`
                    )
                    .join("  +  ")
                : "";

            return (
              <div key={details.id || idx} className="bulk-invoice-block">

                <div className="bulk-invoice-header">
                  <div>
                    <span className="bulk-label">Party: </span>
                    <span className="bulk-bold">{details.Party_Name || "-"}</span>
                  </div>
                  <div>
                    <span className="bulk-label">Receipt No. </span>
                    <span className="bulk-bold">{details.Receipt_No || "-"}</span>
                  </div>
                  <div>
                    <span className="bulk-label">GSTIN: </span>
                    {details.GSTIN || "-"}
                  </div>
                  <div>
                    <span className="bulk-label">Date: </span>
                    {formatDate(details.Payment_Date)}
                  </div>
                </div>

               
                {splitSummary && (
                  <div className="bulk-splits">
                    <span className="bulk-label">Payment: </span>
                    {splitSummary}
                  </div>
                )}

               
                <div className="bulk-totals">
                  <div>
                    <span className="bulk-label">{cfg.amountLabel}</span>
                    <span className="bulk-bold">
                      ₹ {money(details[cfg.amountKey])}
                    </span>
                  </div>
                </div>

                {idx < records.length - 1 && <div className="bulk-divider" />}
              </div>
            );
          })
        )} */}