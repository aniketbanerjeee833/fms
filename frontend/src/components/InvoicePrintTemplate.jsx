

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
    Phone_Number,
    State_Of_Supply,
    Total_Amount,
    Round_Off,
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


  // =========================================================
  // TAX
  // =========================================================
  // const getGstRate = (taxType) => {
  //   if (!taxType || taxType === "None") return 0;
  //   const match = taxType.match(/GST([\d.]+)/i);
  //   return match ? Number(match[1]) : 0;
  // };

  // const formatRate = (rate) => {
  //   // Avoid "6.00%" — show "6%" for whole numbers, "0.125%" for fractional
  //   return Number.isInteger(rate) ? `${rate}%` : `${rate}%`;
  // };

  // const getTaxAmount = (item) => Number(item?.Tax_Amount || 0);

  // console.log("items", items);
  // const taxGroups = {};
  // items.forEach((item) => {
  //   const gstRate = getGstRate(item.Tax_Type);
  //   const taxAmt = Number(item.Tax_Amount || 0);
  //   const halfRate = gstRate / 2;
  //   const key = String(halfRate); // "2.5", "9", "6" etc.

  //   if (!taxGroups[key]) {
  //     taxGroups[key] = { halfRate, taxable: 0, cgst: 0, sgst: 0 };
  //   }
  //   taxGroups[key].taxable += Number(item.Amount || 0) - taxAmt;
  //   taxGroups[key].cgst += taxAmt / 2;
  //   taxGroups[key].sgst += taxAmt / 2;
  // });

  // const taxGroupList = Object.values(taxGroups).filter((g) => g.halfRate > 0);
  // const totalTax = items.reduce((s, i) => s + Number(i.Tax_Amount || 0), 0);


  // const cgst = totalTax / 2;
  // const sgst = totalTax / 2;
  // =========================================================
  // TAX
  // =========================================================

  const getGstRate = (taxType) => {
    if (!taxType || taxType === "None") {
      return 0;
    }

    const match = String(taxType).match(
      /(?:IGST|GST)\s*([\d.]+)/i
    );

    return match ? Number(match[1]) : 0;
  };

  const isIGST = (taxType) => {
    return /igst/i.test(String(taxType || ""));
  };

  const formatRate = (rate) => {
    const n = Number(rate) || 0;

    return Number.isInteger(n)
      ? `${n}%`
      : `${n}%`;
  };

  const getTaxAmount = (item) => {
    return Number(item?.Tax_Amount || 0);
  };


  // =========================================================
  // BUILD TAX GROUPS
  // =========================================================

  const taxGroups = {};

  items.forEach((item) => {
    const taxType = String(item.Tax_Type || "");

    const gstRate = getGstRate(taxType);

    const taxAmount = getTaxAmount(item);

    if (
      gstRate <= 0 ||
      taxAmount <= 0 ||
      taxType === "None"
    ) {
      return;
    }

    const itemIsIGST = isIGST(taxType);

    // Keep GST and IGST separate.
    //
    // Example:
    // GST 5%  -> GST-5
    // IGST 5% -> IGST-5
    //
    const key = `${itemIsIGST ? "IGST" : "GST"}-${gstRate}`;

    if (!taxGroups[key]) {
      taxGroups[key] = {
        key,

        rate: gstRate,

        isIGST: itemIsIGST,

        taxable: 0,

        cgst: 0,

        sgst: 0,

        igst: 0,
      };
    }

    // Taxable value
    taxGroups[key].taxable +=
      Number(item.Amount || 0) - taxAmount;


    // =======================================================
    // IGST
    // =======================================================

    if (itemIsIGST) {
      taxGroups[key].igst += taxAmount;
    }


    // =======================================================
    // NORMAL GST
    // GST 12% -> CGST 6% + SGST 6%
    // =======================================================

    else {
      taxGroups[key].cgst += taxAmount / 2;

      taxGroups[key].sgst += taxAmount / 2;
    }
  });


  // =========================================================
  // TAX GROUP LIST
  // =========================================================

  const taxGroupList = Object.values(taxGroups)
    .filter((group) => group.rate > 0)
    .sort((a, b) => a.rate - b.rate);


  // =========================================================
  // TOTAL TAX
  // =========================================================

  // const totalTax = items.reduce(
  //   (sum, item) =>
  //     sum + Number(item.Tax_Amount || 0),
  //   0
  // );


  // =========================================================
  // TOTAL CGST
  // =========================================================

  const cgst = taxGroupList.reduce(
    (sum, group) =>
      sum + Number(group.cgst || 0),
    0
  );


  // =========================================================
  // TOTAL SGST
  // =========================================================

  const sgst = taxGroupList.reduce(
    (sum, group) =>
      sum + Number(group.sgst || 0),
    0
  );


  // =========================================================
  // TOTAL IGST
  // =========================================================

  const igst = taxGroupList.reduce(
    (sum, group) =>
      sum + Number(group.igst || 0),
    0
  );


  // =========================================================
  // TAX COLUMN VISIBILITY
  // =========================================================

  // At least one normal GST item
  const hasNormalGst = items.some((item) => {
    const taxType = String(item.Tax_Type || "");

    return (
      !isIGST(taxType) &&
      getGstRate(taxType) > 0 &&
      Number(item.Tax_Amount || 0) > 0
    );
  });


  // At least one IGST item
  const hasIGST = items.some((item) => {
    const taxType = String(item.Tax_Type || "");

    return (
      isIGST(taxType) &&
      getGstRate(taxType) > 0 &&
      Number(item.Tax_Amount || 0) > 0
    );
  });


  // Any tax at all
  const showTaxColumns =
    hasNormalGst || hasIGST;


  // CGST + SGST columns only when
  // at least one normal GST item exists
  const showCGSTSGSTColumns =
    hasNormalGst;


  // IGST column only when
  // at least one IGST item exists
  const showIGSTColumn =
    hasIGST;
  // =========================================================
  // QUANTITY
  // =========================================================

  const totalQuantity = items.reduce(
    (sum, item) => sum + Number(item?.Quantity || 0),
    0
  );

  const itemsSum = items.reduce(
    (sum, item) => sum + Number(item.Amount || 0),
    0
  );

  const hasRoundOff = Math.abs(Number(Round_Off || 0)) > 0;
  //const roundOff = Number(Total_Amount || 0) - itemsSum;

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
  //const hasTaxDetails = taxGroupList.length > 0;
  const showUnitColumn = items.some(
    (item) => item.Selected_Unit?.trim()
  );
  // const showTaxColumns = items.some(
  //   (item) => Number(item.Tax_Amount || 0) > 0
  // );
  const hasDiscountColumn = items.some(
    (item) => Number(item.Discount_Amount || 0) > 0
  );
  const hasMRPColumn =items?.some(
      (item) => item.hasHistoricalMRP === true
    );
  const hasItems = items.length > 0;
  //const MIN_ROWS = 10;
  //const emptyRows = Math.max(0, MIN_ROWS - items.length);
  const showTaxableColumns = items.some(
    (item) => Number(getTaxAmount(item)) > 0
  );
  //const hasTax = taxGroupList.length > 0;  // true if ANY item has GST
  const getLineDiscount = (item, type) => {
    const price = Number(
      item.Sale_Price || item.Purchase_Price || 0
    );

    const qty = Number(item.Quantity || 0);

    if (type === "sale") {
      const discount = Number(
        item.Discount_On_Sale_Price || 0
      );

      return item.Discount_Type_On_Sale_Price === "Percentage"
        ? (price * qty * discount) / 100
        : discount * qty;
    }

    const discount = Number(
      item.Discount_On_Purchase_Price || 0
    );

    return item.Discount_Type_On_Purchase_Price === "Percentage"
      ? (price * qty * discount) / 100
      : discount * qty;
  };
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

          <div className="invoice-company-address">
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
              {Phone_Number && <div>Contact No. : {Phone_Number}</div>}

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

             {hasMRPColumn && (
              <th
                className="invoice-table-header"
                style={{ width: "9%" }}
              >
                MRP
              </th>
            )}

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
            {hasDiscountColumn && (
              <th
                className="invoice-table-header"
                style={{ width: "12%" }}
              >
                Discount
              </th>
            )}

           
            {showTaxableColumns && (
              <th
                className="invoice-table-header"
                style={{ width: "13%" }}
              >
                Taxable Amount
              </th>
            )}
            {/* 
            {showTaxColumns && (
              <>
                <th className="invoice-table-header" style={{ width: "10%" }}>
                  CGST
                </th>

                <th className="invoice-table-header" style={{ width: "10%" }}>
                  SGST
                </th>
              </>
            )} */}
            {/* =====================================================
    CGST / SGST HEADERS
===================================================== */}

            {showCGSTSGSTColumns && (
              <>
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
              </>
            )}


            {/* =====================================================
    IGST HEADER
===================================================== */}

            {showIGSTColumn && (
              <th
                className="invoice-table-header"
                style={{ width: "10%" }}
              >
                IGST
              </th>
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


          {items.map((item, idx) => {
            console.log("item", item);
            const taxAmount = getTaxAmount(item);
            // const gstRate = getGstRate(item.Tax_Type);
            // const halfRate = gstRate / 2;

            // const itemCgst = taxAmount / 2;
            // const itemSgst = taxAmount / 2;

            // const isTaxable = gstRate > 0 && taxAmount > 0;
            const gstRate =
              getGstRate(item.Tax_Type);

            const itemIsIGST =
              isIGST(item.Tax_Type);

            const halfRate =
              gstRate / 2;
            // =====================================================
            // NORMAL GST
            // =====================================================

            const itemCgst =
              !itemIsIGST
                ? taxAmount / 2
                : 0;

            const itemSgst =
              !itemIsIGST
                ? taxAmount / 2
                : 0;


            // =====================================================
            // IGST
            // =====================================================

            const itemIgst =
              itemIsIGST
                ? taxAmount
                : 0;


            // const isTaxable =
            //   gstRate > 0 &&
            //   taxAmount > 0;


            return (
              <tr key={item.Sale_Items_Id || item.Purchase_Items_Id || idx}>
                <td className="invoice-item-center">{idx + 1}</td>

                <td className="invoice-item-cell invoice-bold">
                  {safe(item.Item_Name)}
                </td>

                <td className="invoice-item-cell">
                  {safe(item.Item_HSN)}
                </td>

                  {hasMRPColumn && (
                    <td className="invoice-item-right">
                      {safe(item.MRP)}
                    </td>
                  )}

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
                {hasDiscountColumn && (
                  <td className="invoice-item-right">
                    {getLineDiscount(item, type) > 0 ? (
                      type === "sale" ? (
                        item.Discount_Type_On_Sale_Price === "Percentage"
                          ? `${item.Discount_On_Sale_Price}% (₹${money(
                            getLineDiscount(item, type)
                          )})`
                          : `₹${money(getLineDiscount(item, type))}`
                      ) : (
                        item.Discount_Type_On_Purchase_Price === "Percentage"
                          ? `${item.Discount_On_Purchase_Price}% (₹${money(
                            getLineDiscount(item, type)
                          )})`
                          : `₹${money(getLineDiscount(item, type))}`
                      )
                    ) : (
                      ""
                    )}
                  </td>
                )}
                {/* {hasDiscountColumn && (
                  <td
                    className="invoice-item-right"

                  >
                    {Number(item.Discount_Amount || 0) > 0 ? (
                      type === "sale" ? (
                        item.Discount_Type_On_Sale_Price === "Percentage"
                          ? `${item.Discount_On_Sale_Price}% (₹${money(item.Discount_Amount)})`
                          : `₹${money(item.Discount_Amount)}`
                      ) : (
                        item.Discount_Type_On_Purchase_Price === "Percentage"
                          ? `${item.Discount_On_Purchase_Price}% (₹${money(item.Discount_Amount)})`
                          : `₹${money(item.Discount_Amount)}`
                      )
                    ) : (
                      "-"
                    )}
                  </td>
                )} */}

                {/* <td className="invoice-item-right">
                  ₹ {money(item.Tax_Amount)}
                </td> */}
                {showTaxableColumns && (
                  <td className="invoice-item-right">
                    ₹ {money(item.Tax_Amount)}
                  </td>
                )}

                {/* CGST — this item's own half-rate, not a shared 9% */}

                {/* {showTaxColumns && (
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
                )} */}
                {/* =====================================================
    CGST
===================================================== */}

                {showCGSTSGSTColumns && (
                  <>
                    <td className="invoice-item-right">
                      {!itemIsIGST && itemCgst > 0
                        ? `₹ ${money(itemCgst)} (${formatRate(halfRate)})`
                        : ""}
                    </td>


                    {/* =================================================
        SGST
    ================================================= */}

                    <td className="invoice-item-right">
                      {!itemIsIGST && itemSgst > 0
                        ? `₹ ${money(itemSgst)} (${formatRate(halfRate)})`
                        : ""}
                    </td>
                  </>
                )}


                {/* =====================================================
    IGST
===================================================== */}

                {showIGSTColumn && (
                  <td className="invoice-item-right">
                    {itemIsIGST && itemIgst > 0
                      ? `₹ ${money(itemIgst)} (${formatRate(gstRate)})`
                      : ""}
                  </td>
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


            <td className="invoice-total-cell"></td>

            {/* Item Name column */}
            <td className="invoice-total-cell " style={{ textAlign: "left" }}>
              Total
            </td>

            {/* HSN column */}
            <td className="invoice-total-cell"></td>
            {hasMRPColumn && (
              <td className="invoice-total-cell"></td>
            )}
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
            {/* {hasDiscountColumn && (
              <td className="invoice-total-cell">
                ₹ {money(
                  items.reduce(
                    (sum, item) =>
                      sum + Number(item.Discount_Amount || 0),
                    0
                  )
                )}
              </td>
            )} */}
            {hasDiscountColumn && (
              <td className="invoice-total-cell">
                ₹{" "}
                {money(
                  items.reduce(
                    (sum, item) => sum + getLineDiscount(item, type),
                    0
                  )
                )}
              </td>
            )}
            {showTaxableColumns && (
              <td className="invoice-total-cell">
                ₹ {money(
                  items.reduce(
                    (sum, item) => sum + Number(item.Tax_Amount || 0),
                    0
                  )
                )}
              </td>
            )}


            {/* {showTaxColumns && (
              <>
                <td className="invoice-total-cell">
                  ₹ {money(cgst)}
                </td>

                <td className="invoice-total-cell">
                  ₹ {money(sgst)}
                </td>
              </>
            )} */}

            {/* =====================================================
    TOTAL CGST + SGST
===================================================== */}

            {showCGSTSGSTColumns && (
              <>
                <td className="invoice-total-cell">
                  ₹ {money(cgst)}
                </td>

                <td className="invoice-total-cell">
                  ₹ {money(sgst)}
                </td>
              </>
            )}


            {/* =====================================================
    TOTAL IGST
===================================================== */}

            {showIGSTColumn && (
              <td className="invoice-total-cell">
                ₹ {money(igst)}
              </td>
            )}

            {/* <td className="invoice-total-cell">
              {hasItems ? `₹ ${money(Total_Amount)}` : ""}
            </td> */}
            <td className="invoice-total-cell">
              {hasItems ? `₹ ${money(itemsSum)}` : ""}
            </td>


          </tr>

        </tbody>

      </table>


      {/* =====================================================
          TAX DETAILS + AMOUNTS
      ===================================================== */}
      <div className="grid grid-cols-2  invoice-bottom-grid">

        {/* <div className="invoice-bottom-left"> */}


        {/* <div className="invoice-summary-column"> */}
        <div className="invoice-bottom-left">
          {/* {hasTaxDetails && (
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
            </table>)} */}
        {showTaxColumns && taxGroupList.length > 0 && (
  <table
    className="invoice-summary-table"
    style={{ width: "100%" }}
  >
    <thead>
      <tr>
        {/* EXACT SAME HEADING */}
        <td className="invoice-summary-cell">
          Tax Details
        </td>

        {taxGroupList.map((g) => {
          // IGST 5% → 5%
          // GST 12% → CGST 6% / SGST 6%
          const displayRate = g.isIGST
            ? g.rate
            : g.rate / 2;

          return (
            <td
              key={g.key}
              className="invoice-summary-cell-right"
            >
              {displayRate}%
            </td>
          );
        })}
      </tr>
    </thead>

    <tbody>

      {/* =========================
          CGST
      ========================== */}

      {hasNormalGst && (
        <tr>
          <td className="invoice-summary-cell">
            CGST
          </td>

          {taxGroupList.map((g) => (
            <td
              key={`cgst-${g.key}`}
              className="invoice-summary-cell-right"
            >
              {g.cgst > 0
                ? `₹ ${money(g.cgst)}`
                : ""}
            </td>
          ))}
        </tr>
      )}

      {/* =========================
          SGST
      ========================== */}

      {hasNormalGst && (
        <tr>
          <td className="invoice-summary-cell">
            SGST
          </td>

          {taxGroupList.map((g) => (
            <td
              key={`sgst-${g.key}`}
              className="invoice-summary-cell-right"
            >
              {g.sgst > 0
                ? `₹ ${money(g.sgst)}`
                : ""}
            </td>
          ))}
        </tr>
      )}

      {/* =========================
          IGST
      ========================== */}

      {hasIGST && (
        <tr>
          <td className="invoice-summary-cell">
            IGST
          </td>

          {taxGroupList.map((g) => (
            <td
              key={`igst-${g.key}`}
              className="invoice-summary-cell-right"
            >
              {g.igst > 0
                ? `₹ ${money(g.igst)}`
                : ""}
            </td>
          ))}
        </tr>
      )}

    </tbody>
  </table>
)}
        </div>





        <div className="invoice-bottom-right">
          {/* ===================================================
            AMOUNTS
        =================================================== */}

          {/* <div className="invoice-summary-column"> */}

          <div className="invoice-summary-header">
            Amounts
          </div>


          <table className="invoice-summary-table">
            <tbody>

              <tr>
                <td className="invoice-summary-cell">Sub Total</td>
                <td className="invoice-summary-cell-right">
                  ₹ {money(itemsSum)}
                </td>
              </tr>

              {/* ✅ Round Off row — only shown when it's non-zero */}
              {/* {Math.abs(roundOff) >= 0.01 && (
                <tr>
                  <td className="invoice-summary-cell">Round Off</td>
                
                  <td className="invoice-summary-cell-right">
                     ₹ {money(Math.abs(roundOff))}
                  </td>
                </tr>
              )} */}
              {hasRoundOff && (
                <tr>
                  <td className="invoice-summary-cell">
                    Round Off
                  </td>

                  <td className="invoice-summary-cell-right">
                    {Number(Round_Off) < 0 ? "- " : ""}
                    ₹ {money(Math.abs(Number(Round_Off)))}
                  </td>
                </tr>
              )}


              <tr>
                <td className="invoice-summary-cell">
                  <div className="invoice-bold">Total</div>
                  <div>{type === "sale" ? "Received" : "Paid"}</div>
                </td>
                <td className="invoice-summary-cell-right">
                  <div className="invoice-bold">₹ {money(Total_Amount)}</div>
                  <div>
                    {type === "sale" ? "₹ " + money(Total_Received) : "₹ " + money(Total_Paid)}
                  </div>
                </td>
              </tr>

              <tr>
                <td className="invoice-summary-cell">Balance</td>
                <td className="invoice-summary-cell-right">₹ {money(Balance_Due)}</td>
              </tr>

            </tbody>
          </table>

          {/* </div> */}


        </div>


      </div>

      <div className="grid grid-cols-2 invoice-bottom-grid">

        <div className="invoice-bottom-left">
          <div className="invoice-words-header">
            {type === "sale" ? "Invoice Amount In Words" : "Bill Amount In Words"}
          </div>

          <div className="invoice-words">
            {amountInWords}
          </div>
        </div>

        <div className="invoice-bottom-right">

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

