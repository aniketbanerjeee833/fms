

// components/InvoicePrintTemplate.jsx

import { forwardRef } from "react";
import "./InvoicePrintTemplate.css";

// const InvoicePrintTemplate = forwardRef(({ purchase }, ref) => 
const InvoicePrintTemplate = forwardRef(({ invoice, type }, ref) => {


  if (!invoice) return null;

  const {
    Purchase_Id,
    Bill_Number,
    Bill_Date,

    Sale_Id,
    Invoice_Number,
    Invoice_Date,
    Party_Name,
    GSTIN,
    State,
    Billing_Address,
    State_Of_Supply,
    Total_Amount,
    Total_Paid,
    Balance_Due,
    Payment_Type_Display,
    Terms_Conditions_Description,
    items = [],
    companyDetails = {},
  } = invoice;
  const documentNumber =
    type === "sale"
      ? Invoice_Number
      : Bill_Number;

  const documentDate =
    type === "sale"
      ? Invoice_Date
      : Bill_Date;
  // =========================================================
  // HELPERS
  // =========================================================
  console.log("invoice", invoice);
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
  const safe = (value, fallback = "") =>
    value !== null && value !== undefined && value !== ""
      ? value
      : fallback;

  const money = (value) =>
    Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formattedDate = Bill_Date
    ? new Date(Bill_Date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    : "-";

  // =========================================================
  // TAX
  // =========================================================
  const getGstRate = (taxType) => {
    if (!taxType || taxType === "None") return 0;
    const match = taxType.match(/GST([\d.]+)/i);
    return match ? Number(match[1]) : 0;
  };

  const formatRate = (rate) => {
    // Avoid "6.00%" — show "6%" for whole numbers, "0.125%" for fractional
    return Number.isInteger(rate) ? `${rate}%` : `${rate}%`;
  };

  const getTaxAmount = (item) => Number(item?.Tax_Amount || 0);

  console.log("items", items);

  const totalTax = items.reduce(
    (sum, item) => sum + getTaxAmount(item),
    0
  );

  const cgst = totalTax / 2;
  const sgst = totalTax / 2;

  // =========================================================
  // QUANTITY
  // =========================================================

  const totalQuantity = items.reduce(
    (sum, item) => sum + Number(item?.Quantity || 0),
    0
  );

  // =========================================================
  // AMOUNT IN WORDS
  // =========================================================

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const numberToWordsBelow1000 = (num) => {
    let result = "";

    if (num >= 100) {
      result += ones[Math.floor(num / 100)] + " Hundred";
      num %= 100;

      if (num > 0) {
        result += " ";
      }
    }

    if (num >= 20) {
      result += tens[Math.floor(num / 10)];
      num %= 10;

      if (num > 0) {
        result += " " + ones[num];
      }
    } else if (num > 0) {
      result += ones[num];
    }

    return result;
  };

  const numberToIndianWords = (num) => {
    num = Math.floor(Number(num || 0));

    if (num === 0) return "Zero";

    let result = "";

    const crore = Math.floor(num / 10000000);
    num %= 10000000;

    const lakh = Math.floor(num / 100000);
    num %= 100000;

    const thousand = Math.floor(num / 1000);
    num %= 1000;

    if (crore) {
      result += numberToIndianWords(crore) + " Crore ";
    }

    if (lakh) {
      result += numberToWordsBelow1000(lakh) + " Lakh ";
    }

    if (thousand) {
      result += numberToWordsBelow1000(thousand) + " Thousand ";
    }

    if (num) {
      result += numberToWordsBelow1000(num);
    }

    return result.trim();
  };

  const amountInWords =
    `${numberToIndianWords(Number(Total_Amount || 0))} Rupees only`;

  // =========================================================
  // COMPANY
  // =========================================================

  const companyName =
    companyDetails?.name || "ANCO Innovation";

  const companyAddress =
    companyDetails?.address ||
    "348/103/1, Netaji Subhas Chandra Bose Road, Naktala, Kolkata 700047.";

  const companyPhone =
    companyDetails?.phone || "9831166989";

  const companyEmail =
    companyDetails?.email || "sales@ancoinnovation.com";

  const companyGSTIN =
    companyDetails?.gstin || "19AOQPG1954B1ZY";

  // =========================================================
  // TERMS
  // =========================================================

  const terms = Terms_Conditions_Description
    ? Terms_Conditions_Description.split("\n").filter(Boolean)
    : [];

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div
      ref={ref}
      className="invoice-print"
    >

      {/* =====================================================
          TITLE
      ===================================================== */}

      {/* <div className="invoice-title">
        Bill
      </div> */}
      <div className="invoice-title">
        {type === "sale" ? "Tax Invoice" : "Bill"}
      </div>

      {/* =====================================================
          COMPANY HEADER
      ===================================================== */}

      <div className="invoice-company-header">

        {/* LOGO */}
        <div className="invoice-logo">
          <img 
            src="/assets/images/anco_logo.png"
            alt="ANCO Innovation"
          />
        </div>

        {/* COMPANY DETAILS */}
        <div className="invoice-company-details">

          <div className="invoice-company-name">
            {companyName}
          </div>

          <div>
            {companyAddress}
          </div>

          <div>
            Phone no.: {companyPhone} Email: {companyEmail}
          </div>

          {/* <div>
            GSTIN: {companyGSTIN}, State: 19-West Bengal
          </div> */}
          <div>
            GSTIN: {companyGSTIN}
          </div>
        </div>

      </div>


      {/* =====================================================
          BILL FROM / BILL DETAILS
      ===================================================== */}

      <table className="invoice-table">

        <thead>
          <tr>
            {/* 
            <th className="invoice-section-header">
              Bill From
            </th>

            <th className="invoice-section-header invoice-section-header-right">
              Bill Details
            </th> */}
            <th className="invoice-section-header">
              {type === "sale" ? "Bill To" : "Bill From"}
            </th>

            <th className="invoice-section-header invoice-section-header-right">
              {type === "sale" ? "Invoice Details" : "Bill Details"}
            </th>

          </tr>
        </thead>

        <tbody>
          <tr>

            {/* BILL FROM */}

            <td className="invoice-cell invoice-party-cell">

              {Party_Name && (
                <div className="invoice-bold">
                  {Party_Name}
                </div>
              )}

              {Billing_Address && (
                <div>
                  {Billing_Address}
                </div>
              )}

              {GSTIN && (
                <div>
                  GSTIN : {GSTIN}
                </div>
              )}

              {State && (
                <div>
                  State: {formatState(State)}
                </div>
              )}

            </td>


            {/* BILL DETAILS */}

           <td className="invoice-cell invoice-cell-right">

  {documentNumber && (
    <div>
      {type === "sale" ? "Invoice No." : "Bill No."} :{" "}
      {documentNumber}
    </div>
  )}

  {documentDate && (
    <div>
      {type === "sale" ? "Invoice Date" : "Date"} :{" "}
      {new Date(documentDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })}
    </div>
  )}

  {State_Of_Supply && (
    <div>
      Place of Supply: {formatState(State_Of_Supply)}
    </div>
  )}

</td>


            {/* BILL DETAILS */}

            {/* <td className="invoice-cell invoice-cell-right">

              {/* <div>
                Bill No. : {safe(Bill_Number, Purchase_Id)}
              </div>

              <div>
                Date : {formattedDate}
              </div> 
              <div>
                {type === "sale" ? "Invoice No." : "Bill No."} :{" "}
                {safe(documentNumber)}
              </div>

              <div>
                {type === "sale" ? "Date" : "Date"} :{" "}
                {documentDate
                  ? new Date(documentDate).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                  : "-"}
              </div>

              {/* <div>
                Place of supply:{" "}
                {safe(State_Of_Supply, "19-West Bengal")}
              </div> 

              <div>
                Place of Supply: {formatState(State_Of_Supply)}
              </div>

            </td> */}

          </tr>
        </tbody>

      </table>


      {/* =====================================================
          ITEMS TABLE
      ===================================================== */}

      <table className="invoice-table invoice-items-table">

        <thead>
          <tr>

            <th
              className="invoice-table-header"
              style={{ width: "4%" }}
            >
              #
            </th>

            <th
              className="invoice-table-header"
              style={{ width: "23%" }}
            >
              Item name
            </th>

            <th
              className="invoice-table-header"
              style={{ width: "10%" }}
            >
              HSN/ SAC
            </th>

            <th
              className="invoice-table-header"
              style={{ width: "9%" }}
            >
              Quantity
            </th>

            <th
              className="invoice-table-header"
              style={{ width: "11%" }}
            >
              Price/ Unit
            </th>

            <th
              className="invoice-table-header"
              style={{ width: "13%" }}
            >
              Taxable amount
            </th>

            <th
              className="invoice-table-header"
              style={{ width: "10%" }}
            >
              CGST
            </th>

            <th
              className="invoice-table-header"
              style={{ width: "10%" }}
            >
              SGST
            </th>

            <th
              className="invoice-table-header"
              style={{ width: "10%" }}
            >
              Amount
            </th>

          </tr>
        </thead>


        <tbody>

          {/* {items.map((item, idx) => {

            const taxAmount = getTaxAmount(item);

            const itemCgst = taxAmount / 2;

            const itemSgst = taxAmount / 2;

            const isTaxable =
              item?.Tax_Type &&
              item.Tax_Type !== "None" &&
              taxAmount > 0;

            return (
              <tr
                key={item.Purchase_Items_Id || idx}
              >

               

                <td className="invoice-item-center">
                  {idx + 1}
                </td>



                <td className="invoice-item-cell invoice-bold">
                  {safe(item.Item_Name)}
                </td>


              

                <td className="invoice-item-cell">
                  {safe(item.Item_HSN)}
                </td>


                

                <td className="invoice-item-right">
                  {money(item.Quantity)}
                  {item.Item_Unit
                    ? ` ${item.Item_Unit}`
                    : ""}
                </td>


              

                <td className="invoice-item-right">
                  ₹ {money(item.Purchase_Price)}
                </td>


               

                <td className="invoice-item-right">
                  ₹ {money(item.Amount)}
                </td>


               

                <td className="invoice-item-right">
                  ₹ {money(itemCgst)}
                  {isTaxable ? " (9%)" : ""}
                </td>


              

                <td className="invoice-item-right">
                  ₹ {money(itemSgst)}
                  {isTaxable ? " (9%)" : ""}
                </td>


               

                <td className="invoice-item-right">
                  ₹ {money(item.Amount)}
                </td>

              </tr>
            );
          })} */}
          {items.map((item, idx) => {
            const taxAmount = getTaxAmount(item);
            const gstRate = getGstRate(item.Tax_Type);
            const halfRate = gstRate / 2;

            const itemCgst = taxAmount / 2;
            const itemSgst = taxAmount / 2;

            const isTaxable = gstRate > 0 && taxAmount > 0;

            return (
              <tr key={item.Sale_Items_Id || item.Purchase_Items_Id || idx}>
                <td className="invoice-item-center">{idx + 1}</td>

                <td className="invoice-item-cell invoice-bold">
                  {safe(item.Item_Name)}
                </td>

                <td className="invoice-item-cell">
                  {safe(item.Item_HSN)}
                </td>

                {/* QUANTITY — use Selected_Unit (the unit this line was actually entered in) */}
                <td className="invoice-item-right">
                  {money(item.Quantity)}
                  {item.Selected_Unit ? ` ${item.Selected_Unit}` : item.Item_Unit ? ` ${item.Item_Unit}` : ""}
                </td>

                <td className="invoice-item-right">
                  ₹ {money(item.Purchase_Price ?? item.Sale_Price)}
                </td>

                <td className="invoice-item-right">
                  ₹ {money(item.Amount)}
                </td>

                {/* CGST — this item's own half-rate, not a shared 9% */}
                <td className="invoice-item-right">
                  ₹ {money(itemCgst)}
                  {isTaxable ? ` (${formatRate(halfRate)})` : ""}
                </td>

                {/* SGST */}
                <td className="invoice-item-right">
                  ₹ {money(itemSgst)}
                  {isTaxable ? ` (${formatRate(halfRate)})` : ""}
                </td>

                <td className="invoice-item-right">
                  ₹ {money(item.Amount)}
                </td>
              </tr>
            );
          })}


          {/* =================================================
              TOTAL ROW
          ================================================= */}

          <tr>

            <td
              colSpan={3}
              className="invoice-total-cell"
            >
              Total
            </td>


            <td className="invoice-total-cell">
              {money(totalQuantity)}
            </td>


            <td className="invoice-item-cell">
            </td>


            <td className="invoice-total-cell">
              ₹{" "}
              {money(
                items.reduce(
                  (sum, item) =>
                    sum + Number(item.Amount || 0),
                  0
                )
              )}
            </td>


            <td className="invoice-total-cell">
              ₹ {money(cgst)}
            </td>


            <td className="invoice-total-cell">
              ₹ {money(sgst)}
            </td>


            <td className="invoice-total-cell">
              ₹ {money(Total_Amount)}
            </td>

          </tr>

        </tbody>

      </table>


      {/* =====================================================
          TAX DETAILS + AMOUNTS
      ===================================================== */}

      <div className="invoice-summary">

        {/* ===================================================
            TAX DETAILS
        =================================================== */}

        <div className="invoice-summary-column">

          <div className="invoice-summary-header-row">

            <div className="invoice-summary-header-title">
              Tax details
            </div>

            <div className="invoice-summary-header-value">
              {totalTax > 0 ? "9%" : ""}
            </div>

          </div>


          <table className="invoice-summary-table">

            <tbody>

              <tr>

                <td className="invoice-summary-cell">
                  CGST
                </td>

                <td className="invoice-summary-cell-right">
                  ₹ {money(cgst)}
                </td>

              </tr>


              <tr>

                <td className="invoice-summary-cell">
                  SGST
                </td>

                <td className="invoice-summary-cell-right">
                  ₹ {money(sgst)}
                </td>

              </tr>

            </tbody>

          </table>

        </div>


        {/* ===================================================
            AMOUNTS
        =================================================== */}

        <div className="invoice-summary-column">

          <div className="invoice-summary-header">
            Amounts
          </div>


          <table className="invoice-summary-table">

            <tbody>

              <tr>

                <td className="invoice-summary-cell">
                  Sub Total
                </td>

                <td className="invoice-summary-cell-right">
                  ₹ {money(Total_Amount)}
                </td>

              </tr>


              <tr>

                <td className="invoice-summary-cell invoice-bold">
                  Total
                </td>

                <td className="invoice-summary-cell-right invoice-bold">
                  ₹ {money(Total_Amount)}
                </td>

              </tr>


              <tr>

                  <td className="invoice-summary-cell">
                  {type === "sale" ? "Received" : "Paid"}
                </td>

                <td className="invoice-summary-cell-right">
                  ₹ {money(Total_Paid)}
                </td>

              </tr>


              <tr>

                <td className="invoice-summary-cell">
                  Balance
                </td>

                <td className="invoice-summary-cell-right">
                  ₹ {money(Balance_Due)}
                </td>

              </tr>

            </tbody>

          </table>

        </div>

      </div>


      {/* =====================================================
          BILL AMOUNT IN WORDS
      ===================================================== */}

      <div>

        <div className="invoice-words-header">
          Bill Amount In Words
        </div>

        <div className="invoice-words">
          {amountInWords}
        </div>

      </div>


      {/* =====================================================
          TERMS + SIGNATURE
      ===================================================== */}

      <div className="invoice-bottom">

        {/* ===================================================
            TERMS
        =================================================== */}

        <div>

          <div className="invoice-terms-header">
            Terms and Conditions
          </div>


          <div className="invoice-terms-body">

            {terms.length > 0 ? (

              terms.map((term, index) => (

                <div key={index}>
                  {index + 1}.{" "}
                  {term.replace(/^\d+\.\s*/, "")}
                </div>

              ))

            ) : (

              <>
                {/* <div>
                  1. Goods once sold cannot be taken back or exchange.
                </div>

                <div>
                  2. All disputes are subject to Kolkata jurisdiction.
                </div> */}
              </>

            )}

          </div>

        </div>


        {/* ===================================================
            SIGNATURE
        =================================================== */}

        <div className="invoice-signature">

          <div className="invoice-signature-company">
            For : {companyName}
          </div>

          <div className="invoice-signature-authorized">
            Authorized Signatory
          </div>

        </div>

      </div>

    </div>
  );
});

export default InvoicePrintTemplate;