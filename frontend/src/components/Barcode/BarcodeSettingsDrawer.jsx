import { X } from "lucide-react";

export default function BarcodeSettingsDrawer({
    open,
    sizes = [],
    selectedSizeId,
    onChange,
    onSave,
    onClose,
    isLoading = false,
    isSaving = false,
}) {

    console.log("BarcodeSettingsDrawer rendered with sizes:", sizes);
    if (!open) return null;

    return (
        <>
            {/* Overlay */}
            <div
                onClick={onClose}
                style={{
                    position: "fixed",
                    inset: 0,
                    backgroundColor: "rgba(0,0,0,0.15)",
                    zIndex: 9998,
                }}
            />

            {/* Right drawer */}
            <div
                style={{
                    position: "fixed",
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: "360px",
                    maxWidth: "90vw",
                    backgroundColor: "#fff",
                    zIndex: 9999,
                    boxShadow:
                        "-4px 0 15px rgba(0,0,0,0.12)",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between"
                    style={{
                        padding: "14px 16px",
                        borderBottom:
                            "1px solid #e2e8f0",
                    }}
                >
                    <h5
                        style={{
                            margin: 0,
                            fontSize: "16px",
                            fontWeight: 600,
                            color: "#374151",
                        }}
                    >
                        Barcode Settings
                    </h5>

                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            border: "none",
                            background:
                                "transparent",
                            cursor: "pointer",
                            padding: "4px",
                            color: "#64748b",
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div
                    style={{
                        padding: "22px 24px",
                        overflowY: "auto",
                        flex: 1,
                    }}
                >
                    <div
                        className="flex items-center justify-between"
                        style={{
                            marginBottom: "18px",
                        }}
                    >
                        <span
                            style={{
                                fontSize: "14px",
                                fontWeight: 600,
                                color: "#374151",
                            }}
                        >
                            Size
                        </span>

                        <span
                            style={{
                                fontSize: "13px",
                                fontStyle: "italic",
                                color: "#64748b",
                            }}
                        >
                            Select 1 option
                        </span>
                    </div>

                    {/* Sizes */}
                    {isLoading ? (
                        <div
                            className="text-sm text-gray-400"
                        >
                            Loading sizes...
                        </div>
                    ) : sizes.length === 0 ? (
                        <div
                            className="text-sm text-gray-400"
                        >
                            No barcode sizes available.
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {sizes.map((size) => (
                                <div
                                    key={size.id}
                                    className="flex  items-center gap-2"
                                    style={{
                                        marginBottom: "18px",
                                        cursor: "pointer",
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        name="barcodeLabelSize"
                                        value={size.id}
                                        checked={Number(selectedSizeId) === Number(size.id)}
                                        onChange={() => onChange(size.id)}
                                        style={{
                                            width: "16px",
                                            height: "16px",
                                            cursor: "pointer",
                                            accentColor: "#1479ff",
                                        }}
                                    />

                                    <span
                                        style={{
                                            fontSize: "13px",
                                            color: "#475569",
                                        }}
                                    >
                                        {size.Size_Label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div
                    style={{
                        padding: "14px 24px",
                        borderTop:
                            "1px solid #e2e8f0",
                        display: "flex",
                        justifyContent:
                            "flex-end",
                    }}
                >
                    <button
                        type="button"
                        onClick={onSave}
                        disabled={
                            !selectedSizeId ||
                            isSaving
                        }
                        style={{
                            border: "none",
                            borderRadius: "6px",
                            padding: "8px 20px",
                            backgroundColor:
                                selectedSizeId &&
                                    !isSaving
                                    ? "#4CA1AF"
                                    : "#cbd5e1",
                            color: "#fff",
                            fontWeight: 500,
                            cursor:
                                selectedSizeId &&
                                    !isSaving
                                    ? "pointer"
                                    : "not-allowed",
                        }}
                    >
                        {isSaving
                            ? "Saving..."
                            : "Save"}
                    </button>
                </div>
            </div>
        </>
    );
}