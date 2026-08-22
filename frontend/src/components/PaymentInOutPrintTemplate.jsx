
import { forwardRef } from "react";
import "./PaymentInOutPrintTemplate.css";

const PaymentInOutPrintTemplate = forwardRef(({ payment, type = "in" }, ref) => {
    if (!payment) return null;

    const {
        id,
        Receipt_No,
        Party_Name,
        GSTIN,
        State,
        Phone_Number,
        Billing_Address,
        State_Of_Supply,
        Payment_Date,
        Received,
        Paid,
        splits = [],
        companyDetails = {},
    } = payment;

    const amount = type === "in" ? Received : Paid;

    /* ── helpers ── */
    const money = (value) =>
        Number(value || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    const formattedDate = Payment_Date
        ? new Date(Payment_Date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        })
        : "-";

    /* ── amount in words ── */
    const ones = [
        "", "One", "Two", "Three", "Four", "Five", "Six", "Seven",
        "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen",
        "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
    ];
    const tens = [
        "", "", "Twenty", "Thirty", "Forty", "Fifty",
        "Sixty", "Seventy", "Eighty", "Ninety",
    ];

    const below1000 = (n) => {
        let r = "";
        if (n >= 100) { r += ones[Math.floor(n / 100)] + " Hundred"; n %= 100; if (n) r += " "; }
        if (n >= 20) { r += tens[Math.floor(n / 10)]; n %= 10; if (n) r += " " + ones[n]; }
        else if (n) { r += ones[n]; }
        return r;
    };

    const toWords = (num) => {
        num = Math.floor(Number(num || 0));
        if (!num) return "Zero";
        let r = "";
        const cr = Math.floor(num / 10000000); num %= 10000000;
        const lk = Math.floor(num / 100000); num %= 100000;
        const th = Math.floor(num / 1000); num %= 1000;
        if (cr) r += toWords(cr) + " Crore ";
        if (lk) r += below1000(lk) + " Lakh ";
        if (th) r += below1000(th) + " Thousand ";
        if (num) r += below1000(num);
        return r.trim();
    };

    const amountInWords = `${toWords(amount)} Rupees only`;

    /* ── company ── */
    console.log("companyDetails", companyDetails);
    const companyName = companyDetails?.name || "ANCO Innovation";
    const companyAddress = companyDetails?.address || "348/103/1, Netaji Subhas Chandra Bose Road, Naktala, Kolkata 700047.";
    const companyPhone = companyDetails?.phone || "9831166989";
    const companyEmail = companyDetails?.email || "sales@ancoinnovation.com";
    const companyGSTIN = companyDetails?.gstin || "19AOQPG1954B1ZY";
    const stateCodeMap = {
        "West Bengal": "19",
        "Haryana": "06",
        // add the remaining states here
    };

    const formatState = (state) => {
        if (!state) return "-";

        const code = stateCodeMap[state.trim()];

        return code ? `${code} - ${state}` : state;
    };
    return (
        <div ref={ref} className="receipt-print">

            {/* TITLE */}
            {type === "in" ? <div className="receipt-title">Payment Receipt</div> : <div className="receipt-title">Payment Out</div>}
            {/* COMPANY HEADER */}
            <div className="receipt-company-header">
                <div className="receipt-logo">
                    <img src="/assets/images/anco_logo.png" alt={companyName} />
                </div>
                <div className="receipt-company-details">
                    <div className="receipt-company-name">{companyName}</div>
                    <div className="receipt-company-address">{companyAddress}</div>
                    <div>Phone no.: {companyPhone} &nbsp; Email: {companyEmail}</div>
                    <div>GSTIN: {companyGSTIN}, State: 19-West Bengal</div>


                </div>
            </div>

            {/* PAID TO / RECEIPT DETAILS / AMOUNTS - single continuous table with rowspan */}
            <table className="receipt-table receipt-combined-table">
                <thead>
                    <tr>
                        <th className="receipt-section-header receipt-w50">
                            {type === "in" ? "Received From" : "Paid To"}
                        </th>
                        <th className="receipt-section-header receipt-section-header-right receipt-w50">
                            Receipt Details
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {/* PARTY + RECEIPT DETAILS */}
                    <tr>
                        <td className="receipt-cell receipt-party-cell">
                            {Party_Name && <div className="receipt-bold">{Party_Name}</div>}
                            {Billing_Address && <div>{Billing_Address}</div>}
                            {Phone_Number && <div>Contact No. : {Phone_Number}</div>}
                            {GSTIN && <div>GSTIN : {GSTIN}</div>}
                            {State && <div>State: {formatState(State)}</div>}
                        </td>

                        <td className="receipt-cell receipt-cell-right">
                            {Receipt_No && <div>Receipt No. : {Receipt_No}</div>}
                            <div>Date : {formattedDate}</div>
                        </td>
                    </tr>

                    {/* EMPTY LEFT + AMOUNTS RIGHT */}
                    <tr>
                        <td
                            className="receipt-cell receipt-empty-left"
                            rowSpan="2"
                        ></td>

                        <th className="receipt-section-header">
                            Amounts
                        </th>
                    </tr>

                    {/* EMPTY LEFT CONTINUES + PAID RIGHT */}
                    <tr>
                        <td className="receipt-cell">
                            <div className="receipt-amount-row">
                                <div className="receipt-amount-label">
                                    {type === "in" ? "Received" : "Paid"}
                                </div>

                                <div className="receipt-amount-value">
                                    ₹ {money(amount)}
                                </div>
                            </div>
                        </td>
                    </tr>

                    {/* AMOUNT IN WORDS LEFT + BIG EMPTY RIGHT */}
                    <tr>
                        <th className="receipt-section-header receipt-words-header">
                            Amount In Words
                        </th>

                        <td
                            className="receipt-cell receipt-empty-right"
                            rowSpan="2"
                        ></td>
                    </tr>

                    {/* WORDS LEFT + EMPTY RIGHT CONTINUES */}
                    <tr>
                        <td className="receipt-cell receipt-words-cell">
                            {amountInWords}
                        </td>
                    </tr>
                </tbody>
            </table>

            <div className="receipt-signature-row">
                <div className="receipt-signature-left"></div>

                <div className="receipt-signature-right">
                    <div>For : {companyName}</div>

                    <div className="receipt-signature-authorized">
                        Authorized Signatory
                    </div>
                </div>
            </div>

        </div>
    );
});

export default PaymentInOutPrintTemplate;