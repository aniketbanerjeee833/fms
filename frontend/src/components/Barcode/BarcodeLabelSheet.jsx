// // BarcodeLabelSheet.jsx
// import { useEffect, useRef } from "react";
// import JsBarcode from "jsbarcode";

// // =========================================================
// // LABEL SIZE PRESETS
// // Backend will later drive which preset is active — for now,
// // hardcoded to "2 Labels (50x25mm)".
// // =========================================================
// const LABEL_SIZE_PRESETS = {
//     "2_labels_50x25": {
//         label: "2 Labels (50×25mm)",
//         labelWidthMm: 50,
//         labelHeightMm: 25,
//         columns: 2,
//     },
//     "1_label_100x50": {
//         label: "1 Label (100×50mm)",
//         labelWidthMm: 100,
//         labelHeightMm: 50,
//         columns: 1,
//     },
//     "1_label_50x25": {
//         label: "1 Label (50×25mm)",
//         labelWidthMm: 50,
//         labelHeightMm: 25,
//         columns: 1,
//     },
//     "2_labels_38x25": {
//         label: "2 Labels (38×25mm)",
//         labelWidthMm: 38,
//         labelHeightMm: 25,
//         columns: 2,
//     },
// };

// // TODO: replace with value from backend/user settings once available
// const ACTIVE_LABEL_SIZE_KEY = "2_labels_50x25";

// // TODO: later make this selectable per item instead of a fixed constant
// const LABELS_PER_ITEM = 2;

// // =========================================================
// // Single label's barcode SVG — inline, no separate file
// // =========================================================
// function LabelBarcodeSVG({ value }) {
//     const svgRef = useRef(null);

//     useEffect(() => {
//         if (!value || !svgRef.current) return;

//         try {
//             JsBarcode(svgRef.current, value, {
//                 format: "CODE128",
//                 displayValue: false,
//                 height: 26,
//                 width: 1.1,
//                 margin: 0,
//                 background: "transparent",
//             });
//         } catch (err) {
//             console.error("Barcode render error:", err);
//         }
//     }, [value]);

//     if (!value) return null;

//     return <svg ref={svgRef} />;
// }

// // =========================================================
// // MAIN — barcode label sheet (print-only, hidden on screen)
// // =========================================================
// export default function BarcodeLabelSheet({ barcodeItems }) {
//     const size = LABEL_SIZE_PRESETS[ACTIVE_LABEL_SIZE_KEY];

//     const pageWidthMm = size.labelWidthMm * size.columns;
//     const pageHeightMm = size.labelHeightMm;

//     // fixed 2 labels per item (selectable later) — ignores noOfLabels for now
//     const labels = barcodeItems.flatMap((row) =>
//         Array.from({ length: LABELS_PER_ITEM }, (_, i) => ({
//             ...row,
//             _key: `${row.itemCode}-${i}`,
//         }))
//     );

//     // dynamic print CSS — built from the active size preset
// const printStyles = `
// .barcode-print-only {
//     display: none;
// }

// @media print {

//     html,
//     body {
//         margin: 0 !important;
//         padding: 0 !important;
//         width: 100% !important;
//         height: auto !important;
//         overflow: visible !important;
//     }

//     body * {
//         visibility: hidden;
//     }

//     #barcode-print-root,
//     #barcode-print-root * {
//         visibility: visible;
//     }

//     #barcode-print-root {
//         display: block !important;
//         position: absolute !important;
//         top: 0 !important;
//         left: 0 !important;

//         width: ${pageWidthMm}mm !important;

//         margin: 0 !important;
//         padding: 0 !important;
//     }

//     @page {
//         size: ${pageWidthMm}mm ${pageHeightMm}mm;
//         margin: 0 !important;
//     }

//     .label-grid {
//         display: grid !important;

//         grid-template-columns: repeat(
//             ${size.columns},
//             ${size.labelWidthMm}mm
//         ) !important;

//         grid-auto-rows: ${size.labelHeightMm}mm !important;

//         width: ${pageWidthMm}mm !important;

//         margin: 0 !important;
//         padding: 0 !important;
//         gap: 0 !important;

//         page-break-after: avoid !important;
//         break-after: avoid !important;
//     }

//     .label-cell {
//         width: ${size.labelWidthMm}mm !important;
//         height: ${size.labelHeightMm}mm !important;

//         box-sizing: border-box !important;

//         padding: 1mm 2mm !important;
//         margin: 0 !important;

//         display: flex !important;
//         flex-direction: column !important;
//         align-items: center !important;
//         justify-content: center !important;

//         text-align: center !important;

//         overflow: hidden !important;

//         page-break-inside: avoid !important;
//         break-inside: avoid !important;
//     }

//     .label-header {
//         width: 100% !important;
//         max-width: 100% !important;

//         font-size: 7px !important;
//         font-style: italic !important;
//         line-height: 1.1 !important;

//         margin: 0 !important;
//         padding: 0 !important;

//         overflow: hidden !important;
//         white-space: nowrap !important;
//         text-overflow: clip !important;
//     }

//     .label-cell svg {
//         display: block !important;

//         max-width: 100% !important;
//         height: auto !important;

//         margin: 0.5mm 0 !important;
//         padding: 0 !important;
//     }

//     .label-code {
//         width: 100% !important;
//         max-width: 100% !important;

//         font-size: 7px !important;
//         font-weight: 600 !important;
//         line-height: 1.1 !important;

//         margin: 0.5mm 0 0 !important;
//         padding: 0 !important;

//         overflow: hidden !important;
//         white-space: nowrap !important;
//         text-overflow: clip !important;
//     }

//     .label-line {
//         width: 100% !important;
//         max-width: 100% !important;

//         font-size: 6.5px !important;
//         line-height: 1.1 !important;

//         margin: 0 !important;
//         padding: 0 !important;

//         overflow: hidden !important;
//         white-space: nowrap !important;
//         text-overflow: clip !important;
//     }

//     /*
//        Prevent accidental extra page space
//     */
//     #barcode-print-root > .label-grid {
//         page-break-after: avoid !important;
//         break-after: avoid !important;
//     }
// }
// `;

//     return (
//         <>
//             <div id="barcode-print-root" className="barcode-print-only">
//                 <div className="label-grid">
//                     {labels.map((label) => (
//                         <div className="label-cell" key={label._key}>
//                             {label.header?.value && (
//                                 <div className="label-header">{label.header.value}</div>
//                             )}

//                             <LabelBarcodeSVG value={label.itemCode} />

//                             <div className="label-code">{label.itemCode}</div>

//                             {label.line1?.value && <div className="label-line">{label.line1.value}</div>}
//                             {label.line2?.value && <div className="label-line">{label.line2.value}</div>}
//                             {label.line3?.value && <div className="label-line">{label.line3.value}</div>}
//                             {label.line4?.value && <div className="label-line">{label.line4.value}</div>}
//                         </div>
//                     ))}
//                 </div>
//             </div>

//             <style>{printStyles}</style>
//         </>
//     );
// }


// BarcodeLabelSheet.jsx
import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

const LABEL_SIZE_PRESETS = {
    "2_labels_50x25": { labelWidthMm: 50, labelHeightMm: 25, columns: 2 },
    "1_label_100x50": { labelWidthMm: 100, labelHeightMm: 50, columns: 1 },
    "1_label_50x25": { labelWidthMm: 50, labelHeightMm: 25, columns: 1 },
    "2_labels_38x25": { labelWidthMm: 38, labelHeightMm: 25, columns: 2 },
};

const ACTIVE_LABEL_SIZE_KEY = "2_labels_50x25";
const LABELS_PER_ITEM = 2;

function LabelBarcodeSVG({ value }) {
    const svgRef = useRef(null);

    useEffect(() => {
        if (!value || !svgRef.current) return;
        try {
            JsBarcode(svgRef.current, value, {
                format: "CODE128",
                displayValue: false,
                height: 26,
                width: 1.1,
                margin: 0,
                background: "transparent",
            });
        } catch (err) {
            console.error("Barcode render error:", err);
        }
    }, [value]);

    if (!value) return null;
    return <svg ref={svgRef} />;
}

// Builds a self-contained HTML document (with inline barcode SVGs already rendered)
// for the hidden print iframe.
function buildPrintHtml(labels, size, pageWidthMm, pageHeightMm) {
    const cellsHtml = labels
        .map((label) => {
            // render barcode as an SVG string via a throwaway container
            const svgContainer = document.createElement("div");
            const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svgContainer.appendChild(svgEl);

            try {
                JsBarcode(svgEl, label.itemCode, {
                    format: "CODE128",
                    displayValue: false,
                    height: 26,
                    width: 1.1,
                    margin: 0,
                    background: "transparent",
                });
            } catch (err) {
                console.error("Barcode render error:", err);
            }

            const barcodeSvgString = svgContainer.innerHTML;

            return `
                <div class="label-cell">
                    ${label.header?.value ? `<div class="label-header">${label.header.value}</div>` : ""}
                    ${barcodeSvgString}
                    <div class="label-code">${label.itemCode}</div>
                    ${label.line1?.value ? `<div class="label-line">${label.line1.value}</div>` : ""}
                    ${label.line2?.value ? `<div class="label-line">${label.line2.value}</div>` : ""}
                    ${label.line3?.value ? `<div class="label-line">${label.line3.value}</div>` : ""}
                    ${label.line4?.value ? `<div class="label-line">${label.line4.value}</div>` : ""}
                </div>
            `;
        })
        .join("");

    return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    @page {
        size: ${pageWidthMm}mm ${pageHeightMm}mm;
        margin: 0;
    }

    body {
        margin: 0;
    }

    .label-grid {
        display: grid;
        grid-template-columns: repeat(${size.columns}, ${size.labelWidthMm}mm);
        grid-auto-rows: ${size.labelHeightMm}mm;
        width: ${pageWidthMm}mm;
    }

    .label-cell {
        width: ${size.labelWidthMm}mm;
        height: ${size.labelHeightMm}mm;
        box-sizing: border-box;
        padding: 1mm 2mm;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        overflow: hidden;
        page-break-inside: avoid;
        font-family: Arial, sans-serif;
    }

    .label-header { font-size: 7px; font-style: italic; line-height: 1.1; }
    .label-code { font-size: 7px; font-weight: 600; margin-top: 0.5mm; }
    .label-line { font-size: 6.5px; line-height: 1.1; }

    svg { display: block; }
</style>
</head>
<body>
    <div class="label-grid">
        ${cellsHtml}
    </div>
</body>
</html>
    `;
}

export default function BarcodeLabelSheet({ barcodeItems, triggerPrint }) {
    const size = LABEL_SIZE_PRESETS[ACTIVE_LABEL_SIZE_KEY];
    const pageWidthMm = size.labelWidthMm * size.columns;
    const pageHeightMm = size.labelHeightMm;
    const iframeRef = useRef(null);

    const labels = barcodeItems.flatMap((row) =>
        Array.from({ length: LABELS_PER_ITEM }, (_, i) => ({
            ...row,
            _key: `${row.itemCode}-${i}`,
        }))
    );

    const handlePrint = () => {
        if (labels.length === 0) return;

        // remove any previous print iframe
        if (iframeRef.current) {
            document.body.removeChild(iframeRef.current);
            iframeRef.current = null;
        }

        const iframe = document.createElement("iframe");
        iframe.style.position = "fixed";
        iframe.style.right = "0";
        iframe.style.bottom = "0";
        iframe.style.width = "0";
        iframe.style.height = "0";
        iframe.style.border = "0";

        document.body.appendChild(iframe);
        iframeRef.current = iframe;

        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(buildPrintHtml(labels, size, pageWidthMm, pageHeightMm));
        doc.close();

        iframe.onload = () => {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
        };
    };

    // expose the print trigger to the parent via a ref callback prop
    useEffect(() => {
        if (triggerPrint) {
            triggerPrint.current = handlePrint;
        }
    }, [labels]);

    return null; // nothing rendered on the visible page — print happens via the iframe only
}