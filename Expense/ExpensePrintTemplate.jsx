import React, { forwardRef, useMemo } from "react";
import "./ExpensePrintTemplate.css";

/* =========================================================
   HELPERS
========================================================= */

const num = (value) => {
    if (value === undefined || value === null || value === "") return 0;

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const money = (value) =>
    num(value).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

const formatDate = (value) => {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString("en-GB");
};

/* =========================================================
   GST RATE HELPERS

   Your Add Expense uses:
   GST0
   GST0.25
   GST3
   GST5
   GST12
   GST18
   GST28

   and:

   IGST0
   IGST0.25
   IGST3
   IGST5
   IGST12
   IGST18
   IGST28
========================================================= */

const getTaxRate = (taxType = "") => {
    if (!taxType || taxType === "None") return 0;

    const match = String(taxType).match(
        /(?:GST|IGST)(0(?:\.25)?|3|5|12|18|28)$/
    );

    return match ? Number(match[1]) : 0;
};

const isIGST = (taxType = "") =>
    String(taxType).toUpperCase().startsWith("IGST");

const isGST = (taxType = "") =>
    String(taxType).toUpperCase().startsWith("GST") &&
    !String(taxType).toUpperCase().startsWith("IGST");

/* =========================================================
   INDIAN NUMBER TO WORDS
========================================================= */

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

const twoDigitWords = (number) => {
    if (number < 20) return ones[number];

    return `${tens[Math.floor(number / 10)]}${number % 10 ? ` ${ones[number % 10]}` : ""
        }`;
};

const threeDigitWords = (number) => {
    if (number < 100) return twoDigitWords(number);

    const hundred = Math.floor(number / 100);
    const remainder = number % 100;

    return `${ones[hundred]} Hundred${remainder ? ` ${twoDigitWords(remainder)}` : ""
        }`;
};

const numberToIndianWords = (value) => {
    const amount = Math.round(num(value));

    if (amount === 0) return "Zero Rupees only";

    let number = amount;
    const parts = [];

    const crore = Math.floor(number / 10000000);

    if (crore) {
        parts.push(`${threeDigitWords(crore)} Crore`);
        number %= 10000000;
    }

    const lakh = Math.floor(number / 100000);

    if (lakh) {
        parts.push(`${twoDigitWords(lakh)} Lakh`);
        number %= 100000;
    }

    const thousand = Math.floor(number / 1000);

    if (thousand) {
        parts.push(`${twoDigitWords(thousand)} Thousand`);
        number %= 1000;
    }

    if (number) {
        parts.push(threeDigitWords(number));
    }

    return `${parts.join(" ")} Rupees only`;
};

/* =========================================================
   EXPENSE PRINT TEMPLATE
========================================================= */

const ExpensePrintTemplate = forwardRef(({ expense }, ref) => {
    const items = Array.isArray(expense?.items) ? expense.items : [];

    /* =======================================================
       ITEM / COLUMN CONDITIONS
    ======================================================= */

    const showHsnColumn = useMemo(() => {
        return items.some(
            (item) =>
                item?.Item_HSN !== undefined &&
                item?.Item_HSN !== null &&
                String(item.Item_HSN).trim() !== ""
        );
    }, [items]);

    const showDiscountColumn = useMemo(() => {
        return items.some((item) => num(item?.Discount_On_Price) > 0);
    }, [items]);

    const showTax = useMemo(() => {
        return (
            expense?.With_GST === true ||
            expense?.With_GST === 1 ||
            expense?.With_GST === "1"
        );
    }, [expense]);

    const showIGST = useMemo(() => {
        return items.some((item) => isIGST(item?.Tax_Type));
    }, [items]);

    const showCGSTSGST = useMemo(() => {
        return items.some((item) => isGST(item?.Tax_Type));
    }, [items]);


    /* =======================================================
   TAX SUMMARY
   Group GST exactly like PurchasePrintTemplate
======================================================= */

    const taxSummary = useMemo(() => {
        const summary = {
            cgst: 0,
            sgst: 0,
            igst: 0,
            rates: [],
        };

        const taxGroups = {};

        items.forEach((item) => {
            const taxType = item?.Tax_Type || "None";
            const taxAmount = num(item?.Tax_Amount);
            const rate = getTaxRate(taxType);

            if (isIGST(taxType)) {
                summary.igst += taxAmount;

                const key = `IGST-${rate}`;

                if (!taxGroups[key]) {
                    taxGroups[key] = {
                        type: "IGST",
                        rate,
                        cgst: 0,
                        sgst: 0,
                        igst: 0,
                    };
                }

                taxGroups[key].igst += taxAmount;
            }

            if (isGST(taxType)) {
                const halfRate = rate / 2;
                const key = `GST-${rate}`;

                if (!taxGroups[key]) {
                    taxGroups[key] = {
                        type: "GST",
                        rate: halfRate,
                        cgst: 0,
                        sgst: 0,
                        igst: 0,
                    };
                }

                taxGroups[key].cgst += taxAmount / 2;
                taxGroups[key].sgst += taxAmount / 2;

                summary.cgst += taxAmount / 2;
                summary.sgst += taxAmount / 2;
            }
        });

        summary.rates = Object.values(taxGroups).sort(
            (a, b) => a.rate - b.rate
        );

        return summary;
    }, [items]);

    /* =======================================================
       SUB TOTAL
  
       Item Amount already includes tax according to your
       Add Expense calculation.
  
       So taxable subtotal is calculated as:
  
         Amount - Tax Amount
    ======================================================= */

    const taxableSubtotal = useMemo(() => {
        return items.reduce((sum, item) => {
            const amount = num(item?.Amount);
            const taxAmount = num(item?.Tax_Amount);

            return sum + amount - taxAmount;
        }, 0);
    }, [items]);

    const itemSubtotal = useMemo(() => {
        return items.reduce((sum, item) => sum + num(item?.Amount), 0);
    }, [items]);

    const totalQuantity = useMemo(() => {
        return items.reduce(
            (sum, item) => sum + num(item?.Quantity),
            0
        );
    }, [items]);

    /* =======================================================
       TOTALS
    ======================================================= */

    const totalAmount = num(expense?.Total_Amount);

    const totalPaid = num(expense?.Total_Paid);

    const balanceDue =
        expense?.Balance_Due !== undefined &&
            expense?.Balance_Due !== null &&
            expense?.Balance_Due !== ""
            ? num(expense.Balance_Due)
            : Math.max(0, totalAmount - totalPaid);

    const roundOff = num(expense?.Round_Off);

    const showRoundOff =
        expense?.Round_Off !== undefined &&
        expense?.Round_Off !== null &&
        expense?.Round_Off !== "" &&
        Math.abs(roundOff) > 0;

    /* =======================================================
       DISCOUNT TOTAL
  
       Used later for "You Saved"
    ======================================================= */

    const totalDiscount = useMemo(() => {
        return items.reduce((sum, item) => {
            const price = num(item?.Price);
            const quantity = num(item?.Quantity);
            const discountValue = num(item?.Discount_On_Price);

            if (!discountValue) return sum;

            const subtotal = price * quantity;

            if (
                (item?.Discount_Type_On_Price || "Percentage") ===
                "Percentage"
            ) {
                return sum + (subtotal * discountValue) / 100;
            }

            return sum + discountValue * quantity;
        }, 0);
    }, [items]);

    const showYouSaved = totalDiscount > 0;

    /* =======================================================
       PARTY DETAILS
    ======================================================= */


    /* =======================================================
   COMPANY DETAILS
======================================================= */

    const companyDetails = expense?.companyDetails || {};

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

    return (
        <div ref={ref} className="expense-print">

            {/* =====================================================
          TITLE
      ===================================================== */}

            <div className="expense-title">
                Expense
            </div>


            {/* =====================================================
    COMPANY HEADER
===================================================== */}

            <div className="expense-company-header">

                {/* LOGO */}
                <div className="expense-logo">
                    <img
                        src="/assets/images/anco_logo.png"
                        alt="ANCO Innovation"
                    />
                </div>

                {/* COMPANY DETAILS */}
                <div className="expense-company-details">

                    <div className="expense-company-name">
                        {companyName}
                    </div>

                    <div>
                        {companyAddress}
                    </div>

                    <div>
                        Phone no.: {companyPhone} Email: {companyEmail}
                    </div>

                    <div>
                        GSTIN: {companyGSTIN}
                    </div>

                </div>

            </div>


            {/* =====================================================
          EXPENSE INFORMATION
      ===================================================== */}

            <table className="expense-table">

                <thead>
                    <tr>

                        <th className="expense-section-header">
                            Expense For
                        </th>

                        <th className="expense-section-header-right">
                            Expense Details
                        </th>

                    </tr>
                </thead>

                <tbody>

                    <tr>

                        {/* LEFT */}
                        <td className="expense-cell">

                            {expense?.Party_Name && (
                                <div className="expense-bold">
                                    {expense.Party_Name}
                                </div>
                            )}

                            {expense?.Party_Address && (
                                <div>
                                    {expense.Party_Address}
                                </div>
                            )}

                            {expense?.Party_GSTIN && (
                                <div>
                                    GSTIN : {expense.Party_GSTIN}
                                </div>
                            )}

                            {expense?.Party_State && (
                                <div>
                                    State: {expense.Party_State}
                                </div>
                            )}

                        </td>


                        {/* RIGHT */}
                        <td className="expense-cell-right">

                            {expense?.Expense_Number && (
                                <div>
                                    <strong>Expense No. :</strong>{" "}
                                    {expense.Expense_Number}
                                </div>
                            )}

                            {expense?.Expense_Date && (
                                <div>
                                    <strong>Date :</strong>{" "}
                                    {formatDate(expense.Expense_Date)}
                                </div>
                            )}

                            {expense?.Bill_Date && (
                                <div>
                                    <strong>Bill Date :</strong>{" "}
                                    {formatDate(expense.Bill_Date)}
                                </div>
                            )}

                            {expense?.State_Of_Supply && (
                                <div>
                                    <strong>Place of Supply :</strong>{" "}
                                    {expense.State_Of_Supply}
                                </div>
                            )}

                        </td>

                    </tr>

                </tbody>

            </table>


            {/* =====================================================
          ITEMS
      ===================================================== */}

            <table className="expense-table expense-items">

                <thead>

                    <tr>

                        <th className="expense-table-header">
                            #
                        </th>

                        <th className="expense-table-header">
                            Item name
                        </th>

                        {showHsnColumn && (
                            <th className="expense-table-header">
                                HSN/SAC
                            </th>
                        )}

                        <th className="expense-table-header">
                            Quantity
                        </th>

                        <th className="expense-table-header">
                            Price/Unit
                        </th>

                        {showTax && showDiscountColumn && (
                            <th className="expense-table-header">
                                Discount
                            </th>
                        )}

                        {showTax && (
                            <th className="expense-table-header">
                                Taxable Amount
                            </th>
                        )}

                        {showTax && showCGSTSGST && (
                            <>
                                <th className="expense-table-header">
                                    CGST
                                </th>

                                <th className="expense-table-header">
                                    SGST
                                </th>
                            </>
                        )}

                        {showTax && showIGST && (
                            <th className="expense-table-header">
                                IGST
                            </th>
                        )}

                        <th className="expense-table-header">
                            Amount
                        </th>

                    </tr>

                </thead>

                <tbody>

                    {items.length > 0 ? (
                        items.map((item, index) => {

                            const price = num(item?.Price);
                            const quantity = num(item?.Quantity);
                            const discount = num(item?.Discount_On_Price);
                            const taxAmount = num(item?.Tax_Amount);
                            const amount = num(item?.Amount);

                            const taxableAmount = Math.max(
                                0,
                                amount - taxAmount
                            );

                            const taxRate = getTaxRate(
                                item?.Tax_Type
                            );

                            const cgstAmount = isGST(item?.Tax_Type)
                                ? taxAmount / 2
                                : 0;

                            const sgstAmount = isGST(item?.Tax_Type)
                                ? taxAmount / 2
                                : 0;

                            const igstAmount = isIGST(item?.Tax_Type)
                                ? taxAmount
                                : 0;

                            const discountText =
                                discount > 0
                                    ? item?.Discount_Type_On_Price === "Percentage"
                                        ? `${money(discount)}%`
                                        : `₹${money(discount)}`
                                    : "";

                            return (
                                <tr key={item?.id || index}>

                                    <td className="expense-item-center">
                                        {index + 1}
                                    </td>

                                    <td className="expense-item-cell">
                                        <span className="expense-item-name">
                                            {item?.Item_Name || ""}
                                        </span>
                                    </td>

                                    {showHsnColumn && (
                                        <td className="expense-item-center">
                                            {item?.Item_HSN || ""}
                                        </td>
                                    )}

                                    <td className="expense-item-center">
                                        {item?.Quantity ?? ""}
                                    </td>

                                    <td className="expense-item-right">
                                        ₹{money(price)}
                                    </td>

                                    {!showTax && showDiscountColumn && (
                                        <td className="expense-item-right">
                                            {discountText}
                                        </td>
                                    )}

                                    {showTax && (
                                        <td className="expense-item-right">
                                            ₹{money(taxableAmount)}
                                        </td>
                                    )}

                                    {showTax && showCGSTSGST && (
                                        <>
                                            <td className="expense-item-right">
                                                {isGST(item?.Tax_Type) ? (
                                                    <>
                                                        ₹{money(cgstAmount)}
                                                        {taxRate > 0 && (
                                                            <div>
                                                                ({taxRate / 2}%)
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    ""
                                                )}
                                            </td>

                                            <td className="expense-item-right">
                                                {isGST(item?.Tax_Type) ? (
                                                    <>
                                                        ₹{money(sgstAmount)}
                                                        {taxRate > 0 && (
                                                            <div>
                                                                ({taxRate / 2}%)
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    ""
                                                )}
                                            </td>
                                        </>
                                    )}

                                    {showTax && showIGST && (
                                        <td className="expense-item-right">
                                            {isIGST(item?.Tax_Type) ? (
                                                <>
                                                    ₹{money(igstAmount)}
                                                    {taxRate > 0 && (
                                                        <div>
                                                            ({taxRate}%)
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                ""
                                            )}
                                        </td>
                                    )}

                                    <td className="expense-item-right">
                                        ₹{money(amount)}
                                    </td>

                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td
                                colSpan={
                                    5 +
                                    (showHsnColumn ? 1 : 0) +
                                    (!showTax && showDiscountColumn ? 1 : 0) +
                                    (showTax ? 1 : 0) +
                                    (showTax && showCGSTSGST ? 2 : 0) +
                                    (showTax && showIGST ? 1 : 0)
                                }
                                className="expense-item-center"
                            >
                                No items
                            </td>
                        </tr>
                    )}

                    {/* =================================================
                        TOTAL ROW
                    ================================================= */}

                    {items.length > 0 && (
                        <tr>

                            {/* # */}
                            <td className="expense-total-cell"></td>

                            {/* Item name */}
                            <td
                                className="expense-total-cell"
                                style={{ textAlign: "left" }}
                            >
                                Total
                            </td>

                            {/* HSN/SAC */}
                            {showHsnColumn && (
                                <td className="expense-total-cell"></td>
                            )}

                            {/* Quantity */}
                            <td className="expense-total-cell">
                                {money(totalQuantity)}
                            </td>

                            {/* Price/Unit */}
                            <td className="expense-total-cell"></td>

                            {/* Discount */}
                            {!showTax && showDiscountColumn && (
                                <td className="expense-total-cell"></td>
                            )}

                            {/* Taxable Amount */}
                            {showTax && (
                                <td className="expense-total-cell">
                                    ₹{money(taxableSubtotal)}
                                </td>
                            )}

                            {/* CGST + SGST */}
                            {showTax && showCGSTSGST && (
                                <>
                                    <td className="expense-total-cell">
                                        ₹{money(taxSummary.cgst)}
                                    </td>

                                    <td className="expense-total-cell">
                                        ₹{money(taxSummary.sgst)}
                                    </td>
                                </>
                            )}

                            {showTax && showIGST && (
                                <td className="expense-total-cell">
                                    ₹{money(taxSummary.igst)}
                                </td>
                            )}

                            {/* Amount */}
                            <td className="expense-total-cell">
                                ₹{money(totalAmount)}
                            </td>

                        </tr>
                    )}

                </tbody>

            </table>


            {/* =====================================================
          BOTTOM GRID
      ===================================================== */}

            <div className="expense-bottom-grid">

                {/* ===================================================
            TAX DETAILS
        =================================================== */}

                {showTax && (
                    <div className="expense-bottom-left">

                        <table className="expense-summary-table">

                            <thead>
                                <tr>

                                    <td className="expense-summary-cell">
                                        Tax Details
                                    </td>

                                    {taxSummary.rates.map((group) => (
                                        <td
                                            key={`${group.type}-${group.rate}`}
                                            className="expense-summary-cell-right"
                                        >
                                            {group.rate}%
                                        </td>
                                    ))}

                                </tr>
                            </thead>

                            <tbody>

                                {showCGSTSGST && (
                                    <>
                                        <tr>

                                            <td className="expense-summary-cell">
                                                CGST
                                            </td>

                                            {taxSummary.rates.map((group) => (
                                                <td
                                                    key={`cgst-${group.type}-${group.rate}`}
                                                    className="expense-summary-cell-right"
                                                >
                                                    {group.type === "GST"
                                                        ? `₹${money(group.cgst)}`
                                                        : ""}
                                                </td>
                                            ))}

                                        </tr>

                                        <tr>

                                            <td className="expense-summary-cell">
                                                SGST
                                            </td>

                                            {taxSummary.rates.map((group) => (
                                                <td
                                                    key={`sgst-${group.type}-${group.rate}`}
                                                    className="expense-summary-cell-right"
                                                >
                                                    {group.type === "GST"
                                                        ? `₹${money(group.sgst)}`
                                                        : ""}
                                                </td>
                                            ))}

                                        </tr>
                                    </>
                                )}

                                {showIGST && (
                                    <tr>
                                        <td className="expense-summary-cell">
                                            IGST
                                        </td>

                                        {taxSummary.rates.map((group) => (
                                            <td
                                                key={`igst-${group.type}-${group.rate}`}
                                                className="expense-summary-cell-right"
                                            >
                                                {group.type === "IGST"
                                                    ? `₹${money(group.igst)}`
                                                    : ""}
                                            </td>
                                        ))}
                                    </tr>
                                )}

                            </tbody>

                        </table>

                    </div>
                )}


                {/* ===================================================
            AMOUNTS
        =================================================== */}

                <div
                    className={
                        showTax
                            ? "expense-bottom-right"
                            : "expense-bottom-right expense-bottom-full"
                    }
                >

                    <div className="expense-summary-header">
                        Amounts
                    </div>

                    <table className="expense-summary-table">

                        <tbody>

                            {showTax && (
                                <tr>
                                    <td className="expense-summary-cell">
                                        Sub Total
                                    </td>

                                    <td className="expense-summary-cell-right">
                                        ₹{money(taxableSubtotal)}
                                    </td>
                                </tr>
                            )}

                            {!showTax && (
                                <tr>
                                    <td className="expense-summary-cell">
                                        Sub Total
                                    </td>

                                    <td className="expense-summary-cell-right">
                                        ₹{money(itemSubtotal)}
                                    </td>
                                </tr>
                            )}

                            {showRoundOff && (
                                <tr>
                                    <td className="expense-summary-cell">
                                        Round off
                                    </td>

                                    <td className="expense-summary-cell-right">
                                        ₹{money(roundOff)}
                                    </td>
                                </tr>
                            )}

                            <tr>
                                <td className="expense-summary-cell">
                                    <div className="expense-bold">
                                        Total
                                    </div>
                                    <div>
                                        Paid
                                    </div>
                                </td>

                                <td className="expense-summary-cell-right">
                                    <div className="expense-bold">
                                        ₹{money(totalAmount)}
                                    </div>
                                    <div>
                                        ₹{money(totalPaid)}
                                    </div>
                                </td>
                            </tr>

                            <tr>
                                <td className="expense-summary-cell">
                                    Balance
                                </td>

                                <td className="expense-summary-cell-right">
                                    ₹{money(balanceDue)}
                                </td>
                            </tr>

                            {showYouSaved && (
                                <tr>
                                    <td className="expense-summary-cell">
                                        You Saved
                                    </td>

                                    <td className="expense-summary-cell-right">
                                        ₹{money(totalDiscount)}
                                    </td>
                                </tr>
                            )}

                        </tbody>

                    </table>

                </div>

            </div>


            {/* =====================================================
          AMOUNT IN WORDS
      ===================================================== */}

            <div className="expense-bottom-grid">

                <div className="expense-bottom-left">

                    <div className="expense-words-header">
                        Amount in words
                    </div>

                    <div className="expense-words">
                        {numberToIndianWords(totalAmount)}
                    </div>

                </div>

                <div className="expense-bottom-right"></div>

            </div>


            {/* =====================================================
          TERMS / SIGNATURE
      ===================================================== */}

            <div className="expense-signature">

                <div className="expense-signature-company">
                    For : {companyName}
                </div>

                <div className="expense-signature-authorized">
                    Authorized Signatory
                </div>

            </div>

        </div>
    );
});

ExpensePrintTemplate.displayName =
    "ExpensePrintTemplate";

export default ExpensePrintTemplate;