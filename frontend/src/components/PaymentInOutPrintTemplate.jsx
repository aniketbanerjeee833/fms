// import { forwardRef } from "react";
// import "./PaymentInOutPrintTemplate.css";

// /* ═══════════════════════════════════════════════════════════════════
//    SHARED PRINT TEMPLATE — used by both Payment In and Payment Out
//    type: "in"  → "Received From" / "Received"
//    type: "out" → "Paid To"       / "Paid"
// ═══════════════════════════════════════════════════════════════════ */

// const PaymentInOutPrintTemplate = forwardRef(({ payment, type = "in" }, ref) => {

//   if (!payment) return null;

//   const {
//     id,
//     Party_Name,
//     GSTIN,
//     Phone_Number,
//     Billing_Address,
//     Payment_Date,
//     Received,
//     Paid,
//     companyDetails = {},
//   } = payment;

//   const amount = type === "in" ? Received : Paid;

//   const stateCodeMap = {
//     "West Bengal": "19",
//     "Haryana": "06",
//   };

//   const formatState = (state) => {
//     if (!state) return "-";
//     const code = stateCodeMap[state.trim()];
//     return code ? `${code} - ${state}` : state;
//   };

//   const money = (value) =>
//     Number(value || 0).toLocaleString("en-IN", {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     });

//   const formattedDate = Payment_Date
//     ? new Date(Payment_Date).toLocaleDateString("en-IN", {
//         day: "2-digit",
//         month: "2-digit",
//         year: "numeric",
//       })
//     : "-";

//   /* ── amount in words ── */
//   const ones = ["", "One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten",
//     "Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
//   const tens = ["", "", "Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];

//   const numberToWordsBelow1000 = (num) => {
//     let result = "";
//     if (num >= 100) {
//       result += ones[Math.floor(num / 100)] + " Hundred";
//       num %= 100;
//       if (num > 0) result += " ";
//     }
//     if (num >= 20) {
//       result += tens[Math.floor(num / 10)];
//       num %= 10;
//       if (num > 0) result += " " + ones[num];
//     } else if (num > 0) {
//       result += ones[num];
//     }
//     return result;
//   };

//   const numberToIndianWords = (num) => {
//     num = Math.floor(Number(num || 0));
//     if (num === 0) return "Zero";
//     let result = "";
//     const crore = Math.floor(num / 10000000); num %= 10000000;
//     const lakh  = Math.floor(num / 100000);    num %= 100000;
//     const thousand = Math.floor(num / 1000);   num %= 1000;
//     if (crore) result += numberToIndianWords(crore) + " Crore ";
//     if (lakh) result += numberToWordsBelow1000(lakh) + " Lakh ";
//     if (thousand) result += numberToWordsBelow1000(thousand) + " Thousand ";
//     if (num) result += numberToWordsBelow1000(num);
//     return result.trim();
//   };

//   const amountInWords = `${numberToIndianWords(Number(amount || 0))} Rupees only`;

//   /* ── company ── */
//   const companyName    = companyDetails?.name    || "ANCO Innovation";
//   const companyAddress = companyDetails?.address || "348/103/1, Netaji Subhas Chandra Bose Road, Naktala, Kolkata 700047.";
//   const companyPhone   = companyDetails?.phone   || "9831166989";
//   const companyEmail   = companyDetails?.email   || "sales@ancoinnovation.com";
//   const companyGSTIN   = companyDetails?.gstin   || "19AOQPG1954B1ZY";

//   return (
//     <div ref={ref} className="receipt-print">

//       {/* TITLE */}
//       <div className="receipt-title">
//         Payment Receipt
//       </div>

//       {/* OUTER BOX */}
//       {/* <div className="receipt-box"> */}

//         {/* COMPANY HEADER */}
//         <div className="receipt-company-header">
//           <div className="receipt-logo">
//             <img src="/assets/images/anco_logo.png" alt={companyName} />
//           </div>

//           <div className="receipt-company-details">
//             <div className="receipt-company-name">{companyName}</div>
//             <div>{companyAddress}</div>
//             <div>Phone no.: {companyPhone} Email: {companyEmail}</div>
//             <div>GSTIN: {companyGSTIN}, State: 19-West Bengal</div>
//           </div>
//         </div>

//         {/* RECEIVED FROM / PAID TO  +  RECEIPT DETAILS */}
//         <table className="receipt-table">
//           <thead>
//             <tr>
//               <th className="receipt-section-header">
//                 {type === "in" ? "Received From" : "Paid To"}
//               </th>
//               <th className="receipt-section-header receipt-section-header-right">
//                 Receipt Details
//               </th>
//             </tr>
//           </thead>
//           <tbody>
//             <tr>
//               <td className="receipt-cell receipt-party-cell">
//                 {Party_Name && <div className="receipt-bold">{Party_Name}</div>}
//                 {Billing_Address && <div>{Billing_Address}</div>}
//                 {Phone_Number && <div>Contact No. : {Phone_Number}</div>}
//                 {GSTIN && <div>GSTIN : {GSTIN}</div>}
//               </td>

//               <td className="receipt-cell receipt-cell-right">
//                 {id && <div>Receipt No. : {id}</div>}
//                 <div>Date : {formattedDate}</div>
//               </td>
//             </tr>
//           </tbody>
//         </table>

//         {/* AMOUNTS */}
//         <table className="receipt-table">
//           <thead>
//             <tr>
//               <th className="receipt-section-header" colSpan={2}></th>
//             </tr>
//           </thead>
//           <tbody>
//             <tr>
//               <td colSpan={2} className="receipt-amounts-header">
//                 Amounts
//               </td>
//             </tr>
//             <tr>
//               <td className="receipt-cell">
//                 {type === "in" ? "Received" : "Paid"}
//               </td>
//               <td className="receipt-cell receipt-cell-right receipt-bold">
//                 ₹ {money(amount)}
//               </td>
//             </tr>
//           </tbody>
//         </table>

//         {/* AMOUNT IN WORDS */}
//         <table className="receipt-table">
//           <tbody>
//             <tr>
//               <td className="receipt-words-header">Amount in words</td>
//             </tr>
//             <tr>
//               <td className="receipt-words-body">{amountInWords}</td>
//             </tr>
//           </tbody>
//         </table>

//         {/* SIGNATURE */}
//         <div className="receipt-signature">
//           <div>For : {companyName}</div>
//           <div className="receipt-signature-space" />
//           <div className="receipt-signature-authorized">Authorized Signatory</div>
//         </div>

//       </div>
//     // </div>
//   );
// });

// export default PaymentInOutPrintTemplate;
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
    //   const companyGSTIN   = companyDetails?.gstin   || "";
    //   const companyState=   companyDetails?.state   || "";

    //const companyPhone = companyDetails?.phone || "";
    //const companyEmail = companyDetails?.email || "";
    const companyGSTIN = companyDetails?.gstin || "19AOQPG1954B1ZY";
    //const companyState = companyDetails?.state || "19-West Bengal";


    /* ── payment method label ── */
    const paymentMethodLabel = splits?.length > 0
        ? splits.map((s) =>
            s.Payment_Type === "Bank"
                ? s.Account_Display_Name || "Bank"
                : s.Payment_Type
        ).join(" + ")
        : null;
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
            {/* <div className="receipt-title">Payment Receipt</div> */}
            {type === "in" ? <div className="receipt-title">Payment Receipt</div> : <div className="receipt-title">Payment Out</div>}
            {/* COMPANY HEADER */}
            <div className="receipt-company-header">
                <div className="receipt-logo">
                    <img src="/assets/images/anco_logo.png" alt={companyName} />
                </div>
                <div className="receipt-company-details">
                    <div className="receipt-company-name">{companyName}</div>
                    <div>{companyAddress}</div>
                    <div>Phone no.: {companyPhone} &nbsp; Email: {companyEmail}</div>
                    <div>GSTIN: {companyGSTIN}, State: 19-West Bengal</div>
                    {/* {companyPhone && (
                        <div>
                            <>Phone no.: {companyPhone}</>


                        </div>
                    )}

                    {companyEmail && (
                        <div>


                            <>Email: {companyEmail}</>
                        </div>
                    )} */}
                    {/* {companyGSTIN && <div>GSTIN: {companyGSTIN}</div>}
                    {companyState && (
                        <div>
                            State: {formatState(companyState)}
                        </div>
                    )} */}

                </div>
            </div>

            {/* RECEIVED FROM / RECEIPT DETAILS */}
            <table className="receipt-table">
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
                    <tr>
                        <td className="receipt-cell receipt-party-cell">
                            {Party_Name && <div className="receipt-bold">{Party_Name}</div>}
                            {Billing_Address && <div>{Billing_Address}</div>}
                            {Phone_Number && <div>Contact No. : {Phone_Number}</div>}
                            {GSTIN && <div>GSTIN : {GSTIN}</div>}
                            {State && <div>State: {formatState(State)}</div>}
                        </td>
                        <td className="receipt-cell receipt-cell-right">
                            {/* {id && <div>Receipt No. : {id}</div>} */}
                            {Receipt_No && <div>Receipt No. : {Receipt_No}</div>}
                            <div>Date : {formattedDate}</div>
                            {/* {paymentMethodLabel && (
                <div>Payment Mode : {paymentMethodLabel}</div>
              )} */}
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* AMOUNTS */}
            <div className="receipt-bottom-grid">
                <div className="receipt-bottom-left">

                    <table className="receipt-table">
                        <thead>
                            <tr>
                                <th className="receipt-section-header receipt-text-center">
                                    Amount in words
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="receipt-words-body">{amountInWords}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* AMOUNT IN WORDS */}
                <div className="receipt-bottom-right">
                    {/* <table className="receipt-table">
                <thead>
                    <tr>
                        <th className="receipt-section-header receipt-w70">Amounts</th>
                        <th className="receipt-section-header receipt-section-header-right receipt-w30"></th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="receipt-cell">
                            {type === "in" ? "Received" : "Paid"}
                        </td>
                        <td className="receipt-cell receipt-cell-right receipt-bold">
                            ₹ {money(amount)}
                        </td>
                    </tr>

               
                </tbody>
            </table> */}
                    <div className="receipt-amounts">

                        <div className="receipt-amounts-header">
                            <div>Amounts</div>
                        </div>

                        <div className="receipt-amount-row">
                            <div className="receipt-amount-label">
                                {type === "in" ? "Received" : "Paid"}
                            </div>

                            <div className="receipt-amount-value">
                                ₹ {money(amount)}
                            </div>
                        </div>

                    </div>

                </div>
            </div>

            {/* SIGNATURE — left blank, right authorized signatory */}
            {/* <table className="receipt-table">
                <tbody>
                    <tr>
                        <td className="receipt-sig-left receipt-w50"></td>
                        <td className="receipt-sig-right receipt-w50">
                            <div>For : {companyName}</div>
                            <div className="receipt-sig-space" />
                            <div className="receipt-bold">Authorized Signatory</div>
                        </td>
                    </tr>
                </tbody>
            </table> */}

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

{/* show split breakdown if multiple payment methods */ }
{/* {splits?.length > 1 && splits.map((s, i) => (
            <tr key={i}>
              <td className="receipt-cell receipt-indent">
                {s.Payment_Type === "Bank"
                  ? s.Account_Display_Name || "Bank"
                  : s.Payment_Type}
                {s.Reference_Number ? ` (Ref: ${s.Reference_Number})` : ""}
              </td>
              <td className="receipt-cell receipt-cell-right">
                ₹ {money(s.Amount)}
              </td>
            </tr>
          ))} */}