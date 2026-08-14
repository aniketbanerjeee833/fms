

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
    Total_Received,
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

  // const formattedDate = Bill_Date
  //   ? new Date(Bill_Date).toLocaleDateString("en-IN", {
  //     day: "2-digit",
  //     month: "2-digit",
  //     year: "numeric",
  //   })
  //   : "-";

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
  const taxGroups = {};
  items.forEach((item) => {
    const gstRate = getGstRate(item.Tax_Type);
    const taxAmt = Number(item.Tax_Amount || 0);
    const halfRate = gstRate / 2;
    const key = String(halfRate); // "2.5", "9", "6" etc.

    if (!taxGroups[key]) {
      taxGroups[key] = { halfRate, taxable: 0, cgst: 0, sgst: 0 };
    }
    taxGroups[key].taxable += Number(item.Amount || 0) - taxAmt;
    taxGroups[key].cgst += taxAmt / 2;
    taxGroups[key].sgst += taxAmt / 2;
  });

  const taxGroupList = Object.values(taxGroups).filter((g) => g.halfRate > 0);
  const totalTax = items.reduce((s, i) => s + Number(i.Tax_Amount || 0), 0);
  const cgstTotal = totalTax / 2;
  const sgstTotal = totalTax / 2;
  // const totalTax = items.reduce(
  //   (sum, item) => sum + getTaxAmount(item),
  //   0
  // );

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
  const hasTaxDetails = taxGroupList.length > 0;
  const showUnitColumn = items.some(
    (item) => item.Selected_Unit?.trim()
  );
  const showTaxColumns = items.some(
    (item) => Number(item.Tax_Amount || 0) > 0
  );
  const hasItems = items.length > 0;
  //const MIN_ROWS = 10;
  //const emptyRows = Math.max(0, MIN_ROWS - items.length);
  // const showTaxColumns = items.some(
  //   (item) => Number(getTaxAmount(item)) > 0
  // );
  //const hasTax = taxGroupList.length > 0;  // true if ANY item has GST
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
            {showUnitColumn && (
              <th
                className="invoice-table-header"
                style={{ width: "9%" }}
              >
                Unit
              </th>
            )}
            {/* <th
              className="invoice-table-header"
              style={{ width: "9%" }}
            >
              Unit
            </th> */}

            <th
              className="invoice-table-header"
              style={{ width: "11%" }}
            >
              Price/ Unit
            </th>

            {/* <th
              className="invoice-table-header"
              style={{ width: "13%" }}
            >
              Taxable amount
            </th> */}
            {showTaxColumns && (
              <th
                className="invoice-table-header"
                style={{ width: "13%" }}
              >
                Taxable Amount
              </th>
            )}

            {/* <th
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
            </th> */}
            {showTaxColumns && (
              <>
                <th className="invoice-table-header" style={{ width: "10%" }}>
                  CGST
                </th>

                <th className="invoice-table-header" style={{ width: "10%" }}>
                  SGST
                </th>
              </>
            )}

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
                {/* <td className="invoice-item-right">
                  {money(item.Quantity)}
                  {item.Selected_Unit ? ` ${item.Selected_Unit}` : item.Item_Unit ? ` ${item.Item_Unit}` : ""}
                </td> */}
                <td className="invoice-item-right">
                  {item.Quantity}
                  {/* {item.Selected_Unit ? ` ${item.Selected_Unit}` : ""} */}
                </td>

                {showUnitColumn && (<td className="invoice-item-right">

                  {item.Selected_Unit ? ` ${item.Selected_Unit}` : ""}
                </td>)}

                <td className="invoice-item-right">
                  ₹ {money(
                    type === "sale"
                      ? item.Sale_Price
                      : item.Purchase_Price
                  )}
                </td>

                {/* <td className="invoice-item-right">
                  ₹ {money(item.Tax_Amount)}
                </td> */}
                {showTaxColumns && (
                  <td className="invoice-item-right">
                    ₹ {money(item.Tax_Amount)}
                  </td>
                )}

                {/* CGST — this item's own half-rate, not a shared 9% */}
                {/* <td className="invoice-item-right">
                  ₹ {money(itemCgst)}
                  {isTaxable ? ` (${formatRate(halfRate)})` : ""}
                </td> */}


                {/* <td className="invoice-item-right">
                  {itemCgst > 0
                    ? `₹ ${money(itemCgst)}${isTaxable ? ` (${formatRate(halfRate)})` : ""}`
                    : ""}
                </td>

                <td className="invoice-item-right">
                  {itemSgst > 0
                    ? `₹ ${money(itemSgst)}${isTaxable ? ` (${formatRate(halfRate)})` : ""}`
                    : ""}
                </td> */}
                {showTaxColumns && (
                  <>
                    <td className="invoice-item-right">
                      {itemCgst > 0
                        ? `₹ ${money(itemCgst)}${isTaxable ? ` (${formatRate(halfRate)})` : ""}`
                        : ""}
                    </td>

                    <td className="invoice-item-right">
                      {itemSgst > 0
                        ? `₹ ${money(itemSgst)}${isTaxable ? ` (${formatRate(halfRate)})` : ""}`
                        : ""}
                    </td>
                  </>
                )}


                {/* <td className="invoice-item-right">
                  {itemCgst > 0
                    ? `₹ ${money(itemCgst)}${isTaxable ? ` (${formatRate(halfRate)})` : ""}`
                    : ""}
                </td>

               
                <td className="invoice-item-right">
                  {itemSgst > 0
                    ? `₹ ${money(itemSgst)}${isTaxable ? ` (${formatRate(halfRate)})` : ""}`
                    : ""}
                </td> */}
                {/* <td className="invoice-item-right">
                  ₹ {money(itemSgst)}
                  {isTaxable ? ` (${formatRate(halfRate)})` : ""}
                </td> */}

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

            {/* <td
              colSpan={3}
              className="invoice-total-cell"
            >
              Total
            </td>


            <td className="invoice-total-cell">
              {money(totalQuantity)}
            </td>


            <td className="invoice-item-cell">
            </td> */}
            <td className="invoice-total-cell"></td>

            {/* Item Name column */}
            <td className="invoice-total-cell "  style={{ textAlign: "left" }}>
              Total
            </td>

            {/* HSN column */}
            <td className="invoice-total-cell"></td>
            <td className="invoice-total-cell">
              {hasItems ? money(totalQuantity) : ""}
            </td>
            {/* <td className="invoice-total-cell">
              {money(totalQuantity)}
            </td> */}
            {showUnitColumn && (
              <td className="invoice-total-cell"></td>
            )}
            {/* Price/Unit */}
            <td className="invoice-total-cell"></td>
            {showTaxColumns && (
              <td className="invoice-total-cell">
                ₹ {money(
                  items.reduce(
                    (sum, item) => sum + Number(item.Tax_Amount || 0),
                    0
                  )
                )}
              </td>
            )}
            {/* <td className="invoice-total-cell">
              ₹{" "}
              {money(
                items.reduce(
                  (sum, item) =>
                    sum + Number(item.Amount || 0),
                  0
                )
              )}
            </td> */}

            {showTaxColumns && (
              <>
                <td className="invoice-total-cell">
                  ₹ {money(cgst)}
                </td>

                <td className="invoice-total-cell">
                  ₹ {money(sgst)}
                </td>
              </>
            )}
            {/* <td className="invoice-total-cell">
              ₹ {money(cgst)}
            </td>


            <td className="invoice-total-cell">
              ₹ {money(sgst)}
            </td> */}


            <td className="invoice-total-cell">
              {hasItems ? `₹ ${money(Total_Amount)}` : ""}
            </td>
            {/* <td className="invoice-total-cell">
              ₹ {money(Total_Amount)}
            </td> */}

          </tr>

        </tbody>

      </table>


      {/* =====================================================
          TAX DETAILS + AMOUNTS
      ===================================================== */}
      <div className="grid grid-cols-2  invoice-bottom-grid">

        <div className="invoice-bottom-left">


          <div className="invoice-summary-column">
            {hasTaxDetails ? (
              <table
                className="invoice-summary-table"
                style={{ width: "100%" }}
              >
                <thead>
                  <tr>
                    <td className="invoice-summary-cell">
                      Tax Details
                    </td>

                    {taxGroupList.map((g) => (
                      <td
                        key={g.halfRate}
                        className="invoice-summary-cell-right"
                      >
                        {g.halfRate}%
                      </td>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    <td className="invoice-summary-cell">
                      CGST
                    </td>

                    {taxGroupList.map((g) => (
                      <td
                        key={g.halfRate}
                        className="invoice-summary-cell-right"
                      >
                        ₹ {money(g.cgst)}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td className="invoice-summary-cell">
                      SGST
                    </td>

                    {taxGroupList.map((g) => (
                      <td
                        key={g.halfRate}
                        className="invoice-summary-cell-right"
                      >
                        ₹ {money(g.sgst)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>) : (
              <div
                style={{
                  border: "1px solid #777",
                  flex: 1,
                  //minHeight: "100%",
                  //height: "65px",
                  //height: "90px"
                  height: "100%"
                }}
              />
            )}
          </div>


          <div>
            <div className="invoice-words-header">
              {type==="sale" ? "Invoice Amount In Words" : "Bill Amount In Words"}
            </div>

            <div className="invoice-words">
              {amountInWords}
            </div>
          </div>

        </div>


        <div className="invoice-bottom-right">
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


                {/* <tr>

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

                </tr> */}
                <tr>
                  <td className="invoice-summary-cell">
                    <div className="invoice-bold">
                      Total
                    </div>
                    <div>
                      {type === "sale" ? "Received" : "Paid"}
                    </div>
                  </td>

                  <td className="invoice-summary-cell-right">
                    <div className="invoice-bold">
                      ₹ {money(Total_Amount)}
                    </div>
                    {/* <div>
                      ₹ {money(Total_Paid)}
                    </div> */}
                    <div>
                      {type === "sale" ? "₹ " + money(Total_Received) : "₹ " + money(Total_Paid)}
                    </div>
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

      </div>
      <div className="grid grid-cols-2">

        {terms.length > 0 && (
          <div>
            <div className="invoice-terms-header">
              Terms and Conditions
            </div>

            <div className="invoice-terms-body">
              {terms.map((term, index) => (
                <div key={index}>
                  {index + 1}. {term.replace(/^\d+\.\s*/, "")}
                </div>
              ))}
            </div>
          </div>
        )}

        <div
          className={`invoice-signature ${terms.length === 0 ? "col-span-2" : ""
            }`}
        >
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



{/* <div className="invoice-bottom-left">

         



          <div className="invoice-summary-column">




            
            <table className="invoice-summary-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <td className="invoice-summary-cell">Tax Details</td>
                  {taxGroupList.map((g) => (
                    <td key={g.halfRate} className="invoice-summary-cell-right">
                      {g.halfRate}%
                    </td>
                  ))}
               
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="invoice-summary-cell">CGST</td>
                  {taxGroupList.map((g) => (
                    <td key={g.halfRate} className="invoice-summary-cell-right">
                      ₹ {money(g.cgst)}
                    </td>
                  ))}
                 
                </tr>
                <tr>
                  <td className="invoice-summary-cell">SGST</td>
                  {taxGroupList.map((g) => (
                    <td key={g.halfRate} className="invoice-summary-cell-right">
                      ₹ {money(g.sgst)}
                    </td>
                  ))}
                
                </tr>
              </tbody>
            </table>

           




          </div>



          <div>

            <div className="invoice-words-header">
              Bill Amount In Words
            </div>

            <div className="invoice-words">
              {amountInWords}
            </div>

          </div>






        </div> */}