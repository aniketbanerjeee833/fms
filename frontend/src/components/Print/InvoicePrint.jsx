import "./InvoicePrint.css";

export default function InvoicePrint({ sale }) {
  const { invoicePartyDetails = {}, items = [] } = sale || {};
  console.log("Invoice Data:", sale);
  const safe = (v) => (v ? v : "N/A");

  return (
    <div className="invoice-container">
 <div className="invoice-inner">
      <h1 className="text-center">INVOICE</h1>

      <div className="text-center">
        <p><b>Invoice No:</b> {safe(invoicePartyDetails.Invoice_Number)}</p>
        <p>
          <b>Date:</b>{" "}
          {invoicePartyDetails.Invoice_Date
            ? new Date(invoicePartyDetails.Invoice_Date).toLocaleDateString("en-IN")
            : "N/A"}
        </p>
      </div>

      {/* PARTY DETAILS */}
     {/* 🔥 PARTY DETAILS (FIXED LIKE BACKEND) */}
<div className="invoice-party-section">
  <div className="party-left">

    {invoicePartyDetails?.Party_Name && (
      <div className="field-row">
        <span className="label">Party Name</span>
        <span className="value">{safe(invoicePartyDetails.Party_Name)}</span>
      </div>
    )}

    <div className="field-row">
  <span className="label">GSTIN</span>
  <span className="value">
    {invoicePartyDetails?.GSTIN ? invoicePartyDetails.GSTIN : "N/A"}
  </span>
</div>
  {invoicePartyDetails?.Billing_Address && (
      <div className="field-row">
      <span className="label">Billed To</span>
      <p className="value">{invoicePartyDetails.Billing_Address}</p>
    </div>
  )}

  </div>

  <div className="party-right">

    {invoicePartyDetails?.State_Of_Supply && (
      <div className="field-row">
        <span className="label">State of Supply</span>
        <span className="value">{safe(invoicePartyDetails.State_Of_Supply)}</span>
      </div>
    )}

    <div className="field-row">
      <span className="label">Payment Type</span>
      <span className="value">{safe(invoicePartyDetails.Payment_Type)}</span>
    </div>
{invoicePartyDetails?.Shipping_Address && (
     <div className="field-row">
      <span className="label">Shipped To</span>
      <p className="value">{invoicePartyDetails.Shipping_Address}</p>
    </div>
  )}
  </div>
</div>
    <div className="address-section">
      {/* <div className="party-left">
  {invoicePartyDetails?.Billing_Address && (
      <div className="field-row">
      <span className="label">Billed To</span>
      <p className="value">{invoicePartyDetails.Billing_Address}</p>
    </div>
  )}
  </div> */}
 {/* <div className="party-right">
  {invoicePartyDetails?.Shipping_Address && (
     <div className="field-row">
      <span className="label">Shipped To</span>
      <p className="value">{invoicePartyDetails.Shipping_Address}</p>
    </div>
  )}
  </div> */}
</div>

      {/* TABLE */}
      <table className="invoice-table">
        <thead>
          <tr>
            <th>Sl</th>
            <th>Item</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Tax</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => (
            <tr key={idx}>
              <td>{idx + 1}</td>
              <td>{safe(it.Item_Name)}</td>
              <td>{it.Quantity}</td>
              <td>{it.Sale_Price}</td>
              <td>{it.Tax_Amount}</td>
              <td>{it.Amount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* TOTALS */}
      <div className="totals">
        <p><b>Total:</b> ₹{invoicePartyDetails.Total_Amount || 0}</p>
        <p><b>Received:</b> ₹{invoicePartyDetails.Total_Received || 0}</p>
        <p className="balance">
          <b>Balance:</b> ₹{invoicePartyDetails.Balance_Due || 0}
        </p>
      </div>

      <div className="footer">
        Thank you for your business!
      </div>
      </div>
    </div>
  );
}



// import "./Print.css";

// // ─── small helpers ────────────────────────────────────────────────────────────
// const safe = (v) => (v ?? "N/A");

// const fmt = (n) =>
//   Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// const fmtDate = (d) =>
//   d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "N/A";

// // Very basic number-to-words (covers amounts up to crores — extend as needed)
// function numberToWords(amount) {
//   const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
//     "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
//     "Seventeen", "Eighteen", "Nineteen"];
//   const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

//   if (!amount || isNaN(amount)) return "Zero Rupees Only";

//   const [rupeePart, paisePart] = Number(amount).toFixed(2).split(".");

//   const convert = (n) => {
//     n = parseInt(n);
//     if (n === 0) return "";
//     if (n < 20) return ones[n] + " ";
//     if (n < 100) return tens[Math.floor(n / 10)] + " " + ones[n % 10] + " ";
//     if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred " + convert(n % 100);
//     if (n < 100000) return convert(Math.floor(n / 1000)) + "Thousand " + convert(n % 1000);
//     if (n < 10000000) return convert(Math.floor(n / 100000)) + "Lakh " + convert(n % 100000);
//     return convert(Math.floor(n / 10000000)) + "Crore " + convert(n % 10000000);
//   };

//   const rupeeWords = convert(parseInt(rupeePart)).trim() || "Zero";
//   const paiseWords = parseInt(paisePart) > 0 ? ` and ${convert(parseInt(paisePart)).trim()} Paise` : "";
//   return `Rupees ${rupeeWords}${paiseWords} Only`;
// }

// // ─── main component ───────────────────────────────────────────────────────────
// export default function InvoicePrint({ sale }) {
//   const { invoicePartyDetails: p = {}, items = [] } = sale || {};

//   // Totals
//   const subTotal     = Number(p.Sub_Total   || 0);
//   const discount     = Number(p.Discount    || 0);
//   const taxable      = subTotal - discount;
//   const cgst         = Number(p.CGST        || 0);
//   const sgst         = Number(p.SGST        || 0);
//   const igst         = Number(p.IGST        || 0);
//   const totalTax     = cgst + sgst + igst;
//   const roundOff     = Number(p.Round_Off   || 0);
//   const grandTotal   = Number(p.Total_Amount|| 0);
//   const received     = Number(p.Total_Received || 0);
//   const balanceDue   = Number(p.Balance_Due || 0);

//   return (
//     <div className="inv-wrap">
//       <div className="inv">

//         {/* ── Company header ── */}
//         <div className="co-name">{safe(p.Company_Name || "YOUR COMPANY NAME PVT. LTD.")}</div>
//         {p.Company_Address && <div className="co-sub">{p.Company_Address}</div>}
//         <div className="co-sub">
//           {p.GSTIN        && <>GSTIN: {p.GSTIN} &nbsp;|&nbsp;</>}
//           {p.PAN          && <>PAN: {p.PAN} &nbsp;|&nbsp;</>}
//           {p.Company_Phone && <>Ph: {p.Company_Phone}</>}
//         </div>
//         {p.Company_Email && (
//           <div className="co-sub">
//             Email: {p.Company_Email}
//             {p.Company_Website && <> &nbsp;|&nbsp; {p.Company_Website}</>}
//           </div>
//         )}

//         <div className="doc-title">TAX INVOICE</div>

//         {/* ── Meta: invoice info + party ── */}
//         <div className="meta-grid">
//           {/* LEFT — invoice details */}
//           <div className="meta-left">
//             <div className="field"><span className="lbl">Invoice No.</span>   <span className="val">{safe(p.Invoice_Number)}</span></div>
//             <div className="field"><span className="lbl">Invoice Date</span>  <span className="val">{fmtDate(p.Invoice_Date)}</span></div>
//             {p.Due_Date && (
//               <div className="field"><span className="lbl">Due Date</span>    <span className="val">{fmtDate(p.Due_Date)}</span></div>
//             )}
//             {p.State_Of_Supply && (
//               <div className="field"><span className="lbl">Place of Supply</span><span className="val">{p.State_Of_Supply}</span></div>
//             )}
//             <div className="field"><span className="lbl">Payment Mode</span> <span className="val">{safe(p.Payment_Type)}</span></div>
//           </div>

//           {/* RIGHT — party */}
//           <div className="meta-right">
//             <div className="party-label">BILL TO</div>
//             {p.Party_Name && (
//               <div className="field"><span className="lbl">Party Name</span> <span className="val">{p.Party_Name}</span></div>
//             )}
//             <div className="field"><span className="lbl">GSTIN</span>        <span className="val">{p.GSTIN_Party || "N/A"}</span></div>
//             {p.Billing_Address && (
//               <div className="field"><span className="lbl">Address</span>    <span className="val">{p.Billing_Address}</span></div>
//             )}
//             {p.State_Of_Supply && (
//               <div className="field"><span className="lbl">State</span>      <span className="val">{p.State_Of_Supply}</span></div>
//             )}
//             {p.Shipping_Address && (
//               <div className="field"><span className="lbl">Ship To</span>    <span className="val">{p.Shipping_Address}</span></div>
//             )}
//           </div>
//         </div>

//         <hr className="divider" />

//         {/* ── Items table ── */}
//         <table className="inv-table">
//           <thead>
//             <tr>
//               <th className="c-c" style={{ width: "4%" }}>Sl.</th>
//               <th style={{ width: "28%", textAlign: "left" }}>Item / Description</th>
//               <th className="c-c" style={{ width: "9%" }}>HSN</th>
//               <th className="c-c" style={{ width: "7%" }}>Qty</th>
//               <th className="c-c" style={{ width: "7%" }}>Unit</th>
//               <th className="c-r" style={{ width: "10%" }}>Rate (₹)</th>
//               <th className="c-c" style={{ width: "7%" }}>Disc%</th>
//               <th className="c-c" style={{ width: "7%" }}>Tax%</th>
//               <th className="c-r" style={{ width: "11%" }}>Amount (₹)</th>
//             </tr>
//           </thead>
//           <tbody>
//             {items.map((it, idx) => (
//               <tr key={idx}>
//                 <td className="c-c">{idx + 1}</td>
//                 <td className="item-name">
//                   {safe(it.Item_Name)}
//                   {it.Description && (
//                     <div className="item-sub">{it.Description}</div>
//                   )}
//                 </td>
//                 <td className="c-c">{it.HSN_Code || "—"}</td>
//                 <td className="c-c">{it.Quantity ?? it.Item_Quantity ?? "—"}</td>
//                 <td className="c-c">{it.Unit || "Nos"}</td>
//                 <td className="c-r">{fmt(it.Sale_Price ?? it.Item_Price)}</td>
//                 <td className="c-c">{it.Discount_Percent ? `${it.Discount_Percent}%` : "—"}</td>
//                 <td className="c-c">{it.Tax_Percent   ? `${it.Tax_Percent}%`   : safe(p.Tax_Type)}</td>
//                 <td className="c-r">{fmt(it.Amount)}</td>
//               </tr>
//             ))}
//             <tr className="sub-row">
//               <td colSpan={8} className="c-r">Sub Total</td>
//               <td className="c-r">₹ {fmt(subTotal)}</td>
//             </tr>
//           </tbody>
//         </table>

//         {/* ── Tax summary ── */}
//         {(cgst > 0 || sgst > 0 || igst > 0) && (
//           <div className="tax-summary">
//             <table>
//               <thead>
//                 <tr>
//                   <th>HSN</th>
//                   <th>Taxable Value (₹)</th>
//                   <th>CGST %</th><th>CGST (₹)</th>
//                   <th>SGST %</th><th>SGST (₹)</th>
//                   <th>IGST %</th><th>IGST (₹)</th>
//                   <th>Total Tax (₹)</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {items.map((it, i) => (
//                   <tr key={i}>
//                     <td className="c-c">{it.HSN_Code || "—"}</td>
//                     <td className="c-r">{fmt(it.Taxable_Value ?? it.Amount)}</td>
//                     <td className="c-c">{it.CGST_Rate ? `${it.CGST_Rate}%` : "—"}</td>
//                     <td className="c-r">{fmt(it.CGST_Amount)}</td>
//                     <td className="c-c">{it.SGST_Rate ? `${it.SGST_Rate}%` : "—"}</td>
//                     <td className="c-r">{fmt(it.SGST_Amount)}</td>
//                     <td className="c-c">{it.IGST_Rate ? `${it.IGST_Rate}%` : "—"}</td>
//                     <td className="c-r">{fmt(it.IGST_Amount)}</td>
//                     <td className="c-r">{fmt(it.Tax_Amount)}</td>
//                   </tr>
//                 ))}
//                 <tr className="sub-row">
//                   <td className="c-c">Total</td>
//                   <td className="c-r">{fmt(taxable)}</td>
//                   <td>—</td><td className="c-r">{fmt(cgst)}</td>
//                   <td>—</td><td className="c-r">{fmt(sgst)}</td>
//                   <td>—</td><td className="c-r">{fmt(igst)}</td>
//                   <td className="c-r">{fmt(totalTax)}</td>
//                 </tr>
//               </tbody>
//             </table>
//           </div>
//         )}

//         {/* ── Totals + bank details ── */}
//         <div className="totals-grid">

//           {/* LEFT — words, bank, terms */}
//           <div className="totals-left">
//             <div className="amount-words">
//               <strong>Amount in Words:</strong><br />
//               {numberToWords(grandTotal)}
//             </div>

//             {(p.Bank_Name || p.Account_Number) && (
//               <div className="bank-box">
//                 <strong>Bank Details</strong><br />
//                 {p.Bank_Name    && <>Bank: {p.Bank_Name}<br /></>}
//                 {p.Bank_Branch  && <>Branch: {p.Bank_Branch}<br /></>}
//                 {p.Account_Number && <>A/c No.: {p.Account_Number}<br /></>}
//                 {p.IFSC_Code    && <>IFSC: {p.IFSC_Code}<br /></>}
//                 {p.Account_Type && <>A/c Type: {p.Account_Type}</>}
//               </div>
//             )}

//             <div className="terms">
//               <strong>Terms &amp; Conditions:</strong><br />
//               1. Goods once sold will not be taken back.<br />
//               2. Interest @18% p.a. on delayed payments.<br />
//               3. Subject to local jurisdiction only.
//             </div>
//           </div>

//           {/* RIGHT — numeric totals */}
//           <div className="totals-right">
//             <div className="tot-row"><span>Sub Total</span>         <span>₹ {fmt(subTotal)}</span></div>
//             {discount > 0 && (
//               <div className="tot-row"><span>Discount</span>        <span>– ₹ {fmt(discount)}</span></div>
//             )}
//             <div className="tot-row"><span>Taxable Amount</span>   <span>₹ {fmt(taxable)}</span></div>
//             {cgst > 0  && <div className="tot-row"><span>CGST</span>   <span>₹ {fmt(cgst)}</span></div>}
//             {sgst > 0  && <div className="tot-row"><span>SGST</span>   <span>₹ {fmt(sgst)}</span></div>}
//             {igst > 0  && <div className="tot-row"><span>IGST</span>   <span>₹ {fmt(igst)}</span></div>}
//             {roundOff !== 0 && (
//               <div className="tot-row">
//                 <span>Round Off</span>
//                 <span>{roundOff > 0 ? "+" : "–"} ₹ {fmt(Math.abs(roundOff))}</span>
//               </div>
//             )}
//             <div className="tot-row strong">
//               <span>Grand Total</span>
//               <span>₹ {fmt(grandTotal)}</span>
//             </div>
//             <div style={{ height: 8 }} />
//             <div className="tot-row"><span>Amount Received</span>  <span>₹ {fmt(received)}</span></div>
//             <div className="tot-row balance">
//               <span>Balance Due</span>
//               <span>₹ {fmt(balanceDue)}</span>
//             </div>
//           </div>
//         </div>

//         {/* ── Signatures ── */}
//         <div className="sig-row">
//           <div>Prepared By</div>
//           <div>Checked By</div>
//           <div>
//             For {safe(p.Company_Name || "YOUR COMPANY NAME PVT. LTD.")}
//             <br /><br /><br />
//             Authorised Signatory
//           </div>
//         </div>

//         <div className="footer-note">
//           This is a computer-generated invoice.
//           {p.GSTIN && <> &nbsp;|&nbsp; GSTIN: {p.GSTIN}</>}
//         </div>

//       </div>
//     </div>
//   );
// }