


import { forwardRef } from "react";
import "./BalanceSheetPrintTemplate.css";

const fmt = (n) =>
    n == null
        ? "0.00"
        : Number(n).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
          });

const fmtDate = (d) =>
    d
        ? new Date(d).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "long",
              year: "numeric",
          })
        : "—";

function BalanceSheetPrintColumn({
    title,
    sections,
    total,
    totalLabel,
}) {
    return (
        <div className="balance-sheet-column">
            <div className="balance-sheet-column-header">
                <span>{title}</span>
                <span>AMOUNT (₹)</span>
            </div>

            <div className="balance-sheet-column-body">
                {sections.map((section) => (
                    <div
                        key={section.title}
                        className="balance-sheet-section"
                    >
                        <div className="balance-sheet-section-title">
                            <span>{section.title}</span>
                            <span>{fmt(section.total)}</span>
                        </div>

                        {section.rows?.map((row) => (
                            <div
                                key={row.label}
                                className="balance-sheet-section-row"
                            >
                                <span>{row.label}</span>
                                <span>{fmt(row.amount)}</span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            <div className="balance-sheet-column-total">
                <span>{totalLabel}</span>
                <span>{fmt(total)}</span>
            </div>
        </div>
    );
}

const BalanceSheetPrintTemplate = forwardRef(
    (
        {
            companyDetails,
            fromDate,
            toDate,
            equitySections = [],
            assetSections = [],
            totalEquities = 0,
            totalAssets = 0,
        },
        ref
    ) => {
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

        const diff = Math.abs(
            Number(totalEquities || 0) -
                Number(totalAssets || 0)
        );

        return (
            <div
                ref={ref}
                className="balance-sheet-print"
            >
                {/* COMPANY HEADER */}
                <div className="balance-sheet-company-header">
                    <div className="balance-sheet-logo">
                        <img
                            src="/assets/images/anco_logo.png"
                            alt={companyName}
                        />
                    </div>

                    <div className="balance-sheet-company-details">
                        <div className="balance-sheet-company-name">
                            {companyName}
                        </div>

                        <div className="balance-sheet-company-address">
                            {companyAddress}
                        </div>

                        <div className="balance-sheet-company-contact">
                            Phone no.: {companyPhone}
                            &nbsp; Email: {companyEmail}
                        </div>

                        <div className="balance-sheet-company-gstin">
                            GSTIN: {companyGSTIN}
                        </div>
                    </div>
                </div>

                {/* TITLE */}
                <div className="balance-sheet-title-container">
                    <div className="balance-sheet-title">
                        Balance Sheet
                    </div>

                    <div className="balance-sheet-period">
                        As of {fmtDate(fromDate)} to {fmtDate(toDate)}
                    </div>
                </div>

                {/* EQUITIES AND ASSETS */}
                <div className="balance-sheet-panels">
                    <BalanceSheetPrintColumn
                        title="Equities & Liabilities"
                        sections={equitySections}
                        total={totalEquities}
                        totalLabel="Total Equities & Liabilities"
                    />

                    <BalanceSheetPrintColumn
                        title="Assets"
                        sections={assetSections}
                        total={totalAssets}
                        totalLabel="Total Assets"
                    />
                </div>

                {/* BALANCE CHECK */}
                <div
                    className={`balance-sheet-check ${
                        diff < 0.01
                            ? "balance-sheet-check-balanced"
                            : "balance-sheet-check-difference"
                    }`}
                >
                    {diff < 0.01
                        ? "✓ Balance sheet is balanced"
                        : `⚠ Difference: ₹${fmt(diff)}`}
                </div>
            </div>
        );
    }
);

BalanceSheetPrintTemplate.displayName =
    "BalanceSheetPrintTemplate";

export default BalanceSheetPrintTemplate;
