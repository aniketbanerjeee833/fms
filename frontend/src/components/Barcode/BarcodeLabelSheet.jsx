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

// const LABEL_SIZE_PRESETS = {
//     "2_labels_50x25": { labelWidthMm: 50, labelHeightMm: 25, columns: 2 },
//     "1_label_100x50": { labelWidthMm: 100, labelHeightMm: 50, columns: 1 },
//     "1_label_50x25": { labelWidthMm: 50, labelHeightMm: 25, columns: 1 },
//     "2_labels_38x25": { labelWidthMm: 38, labelHeightMm: 25, columns: 2 },
// };

// const ACTIVE_LABEL_SIZE_KEY = "2_labels_50x25";
// const LABELS_PER_ITEM = 2;

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

function buildPrintHtml(labels, size, pageWidthMm, pageHeightMm, gapMm = 2) {
    const scale = size.labelHeightMm / 50;

    const barcodeWidth = Math.max(1.6 * scale, 1.5);
    const barcodeHeight = Math.max(32 * scale, 18);
    const headerFontSize = Math.max(9 * scale, 7);
    const codeFontSize = Math.max(9 * scale, 7);
    const lineFontSize = Math.max(8 * scale, 6.5);

    // Shrink each label's width to make room for gaps, keeping total page width fixed.
    const totalGap = gapMm * (size.columns - 1);
    const effectiveLabelWidthMm =
        (size.labelWidthMm * size.columns - totalGap) / size.columns;

    const cellsHtml = labels
        .map((label) => {
            const svgContainer = document.createElement("div");
            const svgEl = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "svg"
            );
            svgContainer.appendChild(svgEl);

            try {
                JsBarcode(svgEl, label.itemCode, {
                    format: "CODE128",
                    displayValue: false,
                    height: barcodeHeight,
                    width: barcodeWidth,
                    margin: 2,
                    background: "transparent",
                });
            } catch (err) {
                console.error("Barcode render error:", err);
            }

            const barcodeSvgString = svgContainer.innerHTML;

            return `
                <div class="label-cell">
                    ${
                        label.header?.value
                            ? `<div class="label-header">${label.header.value}</div>`
                            : ""
                    }
                    ${barcodeSvgString}
                    <div class="label-code">${label.itemCode}</div>
                    ${
                        label.line1?.value
                            ? `<div class="label-line">${label.line1.value}</div>`
                            : ""
                    }
                    ${
                        label.line2?.value
                            ? `<div class="label-line">${label.line2.value}</div>`
                            : ""
                    }
                    ${
                        label.line3?.value
                            ? `<div class="label-line">${label.line3.value}</div>`
                            : ""
                    }
                    ${
                        label.line4?.value
                            ? `<div class="label-line">${label.line4.value}</div>`
                            : ""
                    }
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
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    @page {
        size: ${pageWidthMm}mm ${pageHeightMm}mm;
        margin: 0;
    }

    body {
        margin: 0;
    }

    .label-grid {
        display: grid;
        grid-template-columns: repeat(
            ${size.columns},
            ${effectiveLabelWidthMm}mm
        );
        grid-auto-rows: ${size.labelHeightMm}mm;
        column-gap: ${gapMm}mm;
        row-gap: ${gapMm}mm;
        width: ${pageWidthMm}mm;
    }

    .label-cell {
        width: ${effectiveLabelWidthMm}mm;
        height: ${size.labelHeightMm}mm;

        box-sizing: border-box;
        padding: ${Math.max(0.5 * scale, 0.5)}mm ${Math.max(1 * scale, 1)}mm;

        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        text-align: center;
        overflow: hidden;

        page-break-inside: avoid;

        font-family: Arial, sans-serif;
    }

    .label-header {
        font-size: ${headerFontSize}px;
        font-style: italic;
        line-height: 1.1;
    }

    .label-code {
        font-size: ${codeFontSize}px;
        font-weight: 600;
        margin-top: ${Math.max(0.5 * scale, 0.3)}mm;
    }

    .label-line {
        font-size: ${lineFontSize}px;
        line-height: 1.1;
    }

    svg {
        display: block;
    }
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
// function buildPrintHtml(labels, size, pageWidthMm, pageHeightMm) {
//     // Scale everything based on label height.
//     // 50mm height = 100% scale
//     // 25mm height = 50% scale
//     const scale = size.labelHeightMm / 50;

//     const barcodeHeight = 26 * scale;
//     const barcodeWidth = 1.1 * scale;

//     const headerFontSize = 7 * scale;
//     const codeFontSize = 7 * scale;
//     const lineFontSize = 6.5 * scale;

//     const cellsHtml = labels
//         .map((label) => {
//             const svgContainer = document.createElement("div");
//             const svgEl = document.createElementNS(
//                 "http://www.w3.org/2000/svg",
//                 "svg"
//             );

//             svgContainer.appendChild(svgEl);

//             try {
//                 JsBarcode(svgEl, label.itemCode, {
//                     format: "CODE128",
//                     displayValue: false,
//                     height: barcodeHeight,
//                     width: barcodeWidth,
//                     margin: 0,
//                     background: "transparent",
//                 });
//             } catch (err) {
//                 console.error("Barcode render error:", err);
//             }

//             const barcodeSvgString = svgContainer.innerHTML;

//             return `
//                 <div class="label-cell">
//                     ${
//                         label.header?.value
//                             ? `<div class="label-header">${label.header.value}</div>`
//                             : ""
//                     }

//                     ${barcodeSvgString}

//                     <div class="label-code">${label.itemCode}</div>

//                     ${
//                         label.line1?.value
//                             ? `<div class="label-line">${label.line1.value}</div>`
//                             : ""
//                     }

//                     ${
//                         label.line2?.value
//                             ? `<div class="label-line">${label.line2.value}</div>`
//                             : ""
//                     }

//                     ${
//                         label.line3?.value
//                             ? `<div class="label-line">${label.line3.value}</div>`
//                             : ""
//                     }

//                     ${
//                         label.line4?.value
//                             ? `<div class="label-line">${label.line4.value}</div>`
//                             : ""
//                     }
//                 </div>
//             `;
//         })
//         .join("");

//     return `
// <!DOCTYPE html>
// <html>
// <head>
// <meta charset="utf-8" />

// <style>
//     * {
//         margin: 0;
//         padding: 0;
//         box-sizing: border-box;
//     }

//     @page {
//         size: ${pageWidthMm}mm ${pageHeightMm}mm;
//         margin: 0;
//     }

//     body {
//         margin: 0;
//     }

//     .label-grid {
//         display: grid;
//         grid-template-columns: repeat(
//             ${size.columns},
//             ${size.labelWidthMm}mm
//         );
//         grid-auto-rows: ${size.labelHeightMm}mm;
//         width: ${pageWidthMm}mm;
//     }

//     .label-cell {
//         width: ${size.labelWidthMm}mm;
//         height: ${size.labelHeightMm}mm;

//         box-sizing: border-box;

//         padding: ${1 * scale}mm ${2 * scale}mm;

//         display: flex;
//         flex-direction: column;
//         align-items: center;
//         justify-content: center;

//         text-align: center;
//         overflow: hidden;

//         page-break-inside: avoid;

//         font-family: Arial, sans-serif;
//     }

//     .label-header {
//         font-size: ${headerFontSize}px;
//         font-style: italic;
//         line-height: 1.1;
//     }

//     .label-code {
//         font-size: ${codeFontSize}px;
//         font-weight: 600;
//         margin-top: ${0.5 * scale}mm;
//     }

//     .label-line {
//         font-size: ${lineFontSize}px;
//         line-height: 1.1;
//     }

//     svg {
//         display: block;
//     }
// </style>

// </head>

// <body>
//     <div class="label-grid">
//         ${cellsHtml}
//     </div>
// </body>
// </html>
//     `;
// }
export default function BarcodeLabelSheet({ barcodeItems, triggerPrint, labelSettings }) {
    console.log("BarcodeLabelSheet render", { barcodeItems, labelSettings });
    const iframeRef = useRef(null);
    //const size = LABEL_SIZE_PRESETS[ACTIVE_LABEL_SIZE_KEY];
const GAP_MM = 4; // adjust to taste — 2mm is a decent visible gap for label sheets


    const size = labelSettings
        ? {
            labelWidthMm: Number(labelSettings.Label_Width_Mm),
            labelHeightMm: Number(labelSettings.Label_Height_Mm),
            columns: Number(labelSettings.Columns_Count),
        }
        : null;

    // const pageWidthMm = size
    //     ? size.labelWidthMm * size.columns
    //     : 0;

    // const pageHeightMm = size
    //     ? size.labelHeightMm
    //     : 0;
const pageWidthMm = size
    ? size.labelWidthMm * size.columns + GAP_MM * (size.columns - 1)
    : 0;

const pageHeightMm = size
    ? size.labelHeightMm
    : 0;

    // const labels = barcodeItems.flatMap((row) =>
    //     Array.from({ length: LABELS_PER_ITEM }, (_, i) => ({
    //         ...row,
    //         _key: `${row.itemCode}-${i}`,
    //     }))
    // );
const labelsPerItem = Number(labelSettings?.Columns_Count) || 1;

const labels = barcodeItems.flatMap((row) =>
    Array.from(
        { length: labelsPerItem },
        (_, i) => ({
            ...row,
            _key: `${row.itemCode}-${i}`,
        })
    )
);

console.log("labelSettings:", labelSettings);
console.log("size:", size);
console.log("barcodeItems:", barcodeItems);
console.log("labels.length:", labels.length);
console.log("labels:", labels);
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
        //doc.write(buildPrintHtml(labels, size, pageWidthMm, pageHeightMm));
        doc.write(buildPrintHtml(labels, size, pageWidthMm, pageHeightMm, GAP_MM));
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

    if (!labelSettings) return null;

    return null;
}