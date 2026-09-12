

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Settings, Trash2 } from "lucide-react";


import { useEditItemMutation, useGetItemsForDropdownQuery, useLazyGetItemByNameQuery } from "../../redux/api/itemApi";
import AddItemModal from "../../components/Modal/AddItemModal";
// import BarcodeLabelSheet from "../../components/Barcode/BarcodeLabelSheet";
import BarcodeLabelSheet from "../../components/Barcode/BarcodeLabelSheet"
import BarcodeSettingsDrawer from "../../components/Barcode/BarcodeSettingsDrawer";
import { useGetBarcodeSettingsQuery, useSelectBarcodeSettingMutation } from "../../redux/api/Settings/barcodeSettingsApi";
import { toast } from "react-toastify";
// =========================================================
// FIELD OPTIONS for Header/Line1-4 dropdowns
// =========================================================
const LABEL_FIELD_OPTIONS = [
    // { value: "", label: "None" },
    { value: "Company_Name", label: "Company Name" },
    { value: "Item_Name", label: "Item Name" },
    { value: "Sale_Price", label: "Sale Price" },
    { value: "Discount", label: "Discount" },
    { value: "MRP", label: "MRP" },
];

// =========================================================
// DEFAULT LABEL CONFIG
// =========================================================
// const DEFAULT_LABEL_CONFIG = {
//     header: "Company_Name",
//     line1: "Item_Name",
//     line2: "",
//     line3: "",
//     line4: "MRP",
// };

const DEFAULT_LABEL_CONFIG = {
    header: {
        field: "",
        value: "",
    },
    line1: {
        field: "",
        value: "",
    },
    line2: {
        field: "",
        value: "",
    },
    line3: {
        field: "",
        value: "",
    },
    line4: {
        field: "",
        value: "",
    },
};
// const DEFAULT_LABEL_CONFIG = {
//     header: "",
//     line1: "",
//     line2: "",
//     line3: "",
//     line4: "",
// };

// =========================================================
// Resolve a field key -> actual display value for a given item
// =========================================================
function resolveFieldValue(fieldKey, item, companyName) {
    if (!fieldKey) return "";

    switch (fieldKey) {
        case "Company_Name":
            return companyName || "";
        case "Item_Name":
            return item?.Item_Name || "";
        case "Sale_Price":
            return `Sale Price: ${item?.Sale_Price ?? 0}`;
        case "Discount":
            return `Discount: ${item?.Discount_On_Sale_Price ?? 0}${item?.Discount_Type_On_Sale_Price === "Percentage"
                ? "%"
                : ""
                }`;
        case "MRP":
            return `MRP: ${item?.MRP ?? 0}`;
        default:
            return "";
    }
}

// =========================================================
// ITEM DROPDOWN (adapted inline — barcode-specific instance,
// does NOT touch the globally-used ItemDropdownVirtualized)
// =========================================================
function BarcodeItemDropdown({
    items,
    isDropdownFetching,
    loadMoreItems,
    scrollRef,
    onAddItemClick,
    onSelectItem,
}) {
    const ROW_HEIGHT = 44;

    const rowVirtualizer = useVirtualizer({
        count: items.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => ROW_HEIGHT,
        overscan: 12,
    });

    const virtualItems = rowVirtualizer.getVirtualItems();

    useEffect(() => {
        const lastItem = virtualItems[virtualItems.length - 1];
        if (!lastItem) return;

        if (lastItem.index >= items.length - 15 && !isDropdownFetching) {
            loadMoreItems();
        }
    }, [virtualItems, items.length, isDropdownFetching, loadMoreItems]);

    return (
        <div
            style={{
                width: "45rem",
                maxWidth: "none",
                left: 0,
                top: "100%",
            }}
            //   style={{ width: "100%" }}
            className="absolute z-20 bg-white border border-gray-300 rounded-md shadow-lg"
        >
            <div
                onMouseDown={(e) => {
                    e.preventDefault();
                    onAddItemClick();
                }}
                className="flex items-center gap-1.5 px-3 py-2 cursor-pointer"
                style={{
                    borderBottom: "1px solid #e5e7eb",
                    color: "#4CA1AF",
                    fontWeight: 600,
                    fontSize: 13,
                    backgroundColor: "#fff",
                }}
            >
                <span style={{ fontSize: 17, lineHeight: 1 }}>⊕</span>
                Add Item
            </div>
            <div
                className="grid text-xs font-semibold bg-gray-100 border-b"
                style={{ gridTemplateColumns: "10% 40% 20% 20% 10%", }}
            >
                <div className="px-3 py-2">SL.NO</div>
                <div className="px-3 py-2">ITEM NAME</div>
                <div className="px-3 py-2">SALE PRICE</div>
                <div className="px-3 py-2">PURCHASE PRICE</div>
                <div className="px-3 py-2">STOCK</div>
            </div>

            <div
                ref={(el) => (scrollRef.current = el)}
                className="item-dropdown-scroll"
                style={{
                    height: Math.min(items.length * ROW_HEIGHT, 220),
                    overflowY: "auto",
                    position: "relative",
                }}
            >
                {items.length === 0 && !isDropdownFetching ? (
                    <div className="px-3 py-2 text-gray-400 text-center text-sm">No Item found</div>
                ) : (
                    <div style={{ height: rowVirtualizer.getTotalSize(), width: "100%", position: "relative" }}>
                        {virtualItems.map((virtualRow) => {
                            const it = items[virtualRow.index];
                            if (!it) return null;


                            return (
                                <div
                                    key={virtualRow.key}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        onSelectItem(it);
                                    }}
                                    //onClick={() => onSelectItem(it, virtualRow.index)}
                                    className="grid hover:bg-gray-100 cursor-pointer  text-sm"
                                    style={{
                                        gridTemplateColumns: "10% 40% 20% 20% 10%",
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        width: "100%",
                                        height: `${virtualRow.size}px`,
                                        transform: `translateY(${virtualRow.start}px)`,
                                        alignItems: "center",
                                    }}
                                >
                                    <div className="px-3">{virtualRow.index + 1}</div>

                                    <div className="px-3 truncate">
                                        {it.Item_Name}{" "}
                                        {it.Item_Code && (
                                            <span style={{ color: "#9ca3af", fontWeight: 400 }}>({it.Item_Code})</span>
                                        )}
                                    </div>

                                    <div className="px-3 text-gray-600">{it.Sale_Price || 0}</div>

                                    <div className="px-3 text-gray-600">
                                        {it.Item_Type === "Service" ? "" : it.Purchase_Price ?? 0}
                                    </div>

                                    <div
                                        className="px-3"
                                        style={{
                                            color: it.Stock_Quantity <= 0 ? "red" : "limegreen",
                                            fontWeight: 500,
                                        }}
                                    >
                                        {it.Item_Type === "Service" ? "" : `${it.Stock_Quantity ?? 0} ${it.Primary_Unit || ""}`}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {isDropdownFetching && (
                    <div className="text-center text-xs text-gray-400 py-2">Loading more...</div>
                )}
            </div>
        </div>
    );
}
// ══ OUTSIDE BarcodeGenerator, top-level of the file ══
function LabelFieldDropdown({
    fieldKey,
    value,
    onValueChange,
    onFieldSelect,
    labelDropdownOpen,
    setLabelDropdownOpen,
    labelDropdownRefs,
}) {
    const isOpen = labelDropdownOpen === fieldKey;

    const searchText = value?.value || "";

    const filteredOptions = LABEL_FIELD_OPTIONS.filter((option) =>
        option.label
            .toLowerCase()
            .includes(searchText.trim().toLowerCase())
    );

    const handleChange = (e) => {
        onValueChange(fieldKey, e.target.value);
        setLabelDropdownOpen(fieldKey);
    };

    return (
        <div
            ref={(el) => {
                labelDropdownRefs.current[fieldKey] = el;
            }}
            className="relative w-full"
        >
            <input
                type="text"
                value={value?.value || ""}
                onChange={handleChange}
                onFocus={() => {
                    setLabelDropdownOpen(fieldKey);
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    setLabelDropdownOpen(fieldKey);
                }}
                placeholder={`Enter ${fieldKey}`}
                className="w-full outline-none py-1 px-2 text-gray-900"
                style={{
                    marginBottom: 0,
                    marginTop: "4px",
                    border: "none",
                    borderBottom: "1px solid #9e9e9e",
                    height: "2rem",
                }}
            />

            {isOpen && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => (
                            <div
                                key={option.value}
                                onMouseDown={(e) => {
                                    e.preventDefault();

                                    onFieldSelect(
                                        fieldKey,
                                        option.value
                                    );

                                    setLabelDropdownOpen(null);
                                }}
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                            >
                                {option.label}
                            </div>
                        ))
                    ) : (
                        <div className="px-3 py-2 text-gray-500 text-sm">
                            No field found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
// =========================================================
// MAIN BARCODE GENERATOR
// =========================================================
export default function BarcodeGenerator() {
    //const companyName = useSelector((state) => state.company?.name) || ""; // adjust to actual state shape

    const [itemSearch, setItemSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [itemDropdownOpen, setItemDropdownOpen] = useState(false);
    const [itemCursor, setItemCursor] = useState(null);
    const scrollRef = useRef(null);

    const [selectedItem, setSelectedItem] = useState(null); // full item object or null
    const [noOfLabels, setNoOfLabels] = useState("");
    const [labelConfig, setLabelConfig] = useState(DEFAULT_LABEL_CONFIG);

    const [barcodeItems, setBarcodeItems] = useState([]); // rows added below
    const [labelDropdownOpen, setLabelDropdownOpen] = useState(null); // which Header/LineX dropdown is open
    const labelDropdownRefs = useRef({});
    const [showItemAddModal, setShowItemAddModal] = useState(false);
    const inputRef = useRef(null);
    const [barcodeValue, setBarcodeValue] = useState("");
    const [showBarcodeSettings, setShowBarcodeSettings] = useState(false);

    const [selectedBarcodeSizeId, setSelectedBarcodeSizeId] = useState(null);

    const [getItemByName] = useLazyGetItemByNameQuery();
    const [editItem] = useEditItemMutation()
    const {
        data: barcodeSettings = [],
        isLoading: isBarcodeSettingsLoading,
        isFetching: isBarcodeSettingsFetching,
    } = useGetBarcodeSettingsQuery();

    const [selectBarcodeSetting] = useSelectBarcodeSettingMutation();
    useEffect(() => {
        const activeSetting = barcodeSettings.find(
            (setting) => Number(setting.Is_Active) === 1
        );

        if (activeSetting) {
            setSelectedBarcodeSizeId(activeSetting.id);
        }
    }, [barcodeSettings]);
    // debounce search
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(itemSearch), 300);
        return () => clearTimeout(t);
    }, [itemSearch]);

    useEffect(() => {
        setItemCursor(null);
    }, [debouncedSearch]);

    const {
        data: itemsResponse,
        isFetching: isDropdownFetching,
        refetch: refetchItems
    } = useGetItemsForDropdownQuery(
        {
            cursor: itemCursor,
            search: debouncedSearch,
            limit: 20,
        },
        {
            skip: !itemDropdownOpen,
        }
    );

    const items = itemsResponse?.items || [];
    const nextCursor = itemsResponse?.nextCursor ?? null;
    const hasMore = itemsResponse?.hasMore ?? false;

    const loadMoreItems = useCallback(() => {
        if (hasMore && nextCursor) {
            setItemCursor(nextCursor);
        }
    }, [hasMore, nextCursor]);

    // =========================================================
    // ITEM SELECTION
    // =========================================================

    const handleSelectItem = (it) => {
        console.log("Selected item:", it);

        setSelectedItem(it);
        setItemSearch(it?.Item_Name || "");
        setItemDropdownOpen(false);
        setBarcodeValue(it?.Item_Code || "");
    };

    const canEditItemCode = !!selectedItem && !selectedItem.Item_Code;

    const handleItemNameChange = (val) => {
        setItemSearch(val);
        setItemDropdownOpen(true);

        // Once the user changes the text after selecting an item,
        // the previous item is no longer considered selected.
        if (
            selectedItem &&
            val.trim().toLowerCase() !==
            (selectedItem.Item_Name || "").trim().toLowerCase()
        ) {
            setSelectedItem(null);
        }
    };
    const handleItemNameBlur = () => {
        setTimeout(async () => {
            const typedValue = itemSearch?.trim() || "";

            // Empty input
            if (!typedValue) {
                setItemDropdownOpen(false);
                setSelectedItem(null);
                return;
            }

            // If the currently selected item already matches what is typed,
            // keep it and don't make another API request.
            if (
                selectedItem &&
                selectedItem.Item_Name?.trim().toLowerCase() ===
                typedValue.toLowerCase()
            ) {
                setItemDropdownOpen(false);
                return;
            }

            try {
                // Get the exact item from backend
                const response = await getItemByName(typedValue).unwrap();

                const matchedItem = response?.item;

                // No valid existing item found
                if (!matchedItem?.Item_Id) {
                    setSelectedItem(null);
                    setItemDropdownOpen(false);
                    return;
                }

                // Existing item found
                setSelectedItem(matchedItem);
                setBarcodeValue(matchedItem.Item_Code);
                setItemSearch(matchedItem.Item_Name || "");
                setItemDropdownOpen(false);

            } catch (error) {
                console.error(
                    " Error fetching item by name:",
                    error
                );

                // Never allow a free-typed item
                setSelectedItem(null);
                setItemDropdownOpen(false);
            }
        }, 150);
    };


    // =========================================================
    // NO OF LABELS — positive integers only
    // =========================================================

    const handleNoOfLabelsChange = (e) => {
        const raw = e.target.value.replace(/[^0-9]/g, "");
        // strip leading zeros, but allow empty while typing
        const cleaned = raw.replace(/^0+(?=\d)/, "");
        setNoOfLabels(cleaned);
    };

    // =========================================================
    // VALIDITY for Add for Barcode
    // =========================================================
    // const isAddValid =
    //     !!selectedItem &&
    //     !!selectedItem.Item_Code &&
    //     Number(noOfLabels) > 0 &&
    //     Number.isInteger(Number(noOfLabels));
    const isAddValid =
        !!selectedItem &&
        !!barcodeValue &&
        Number(noOfLabels) > 0 &&
        Number.isInteger(Number(noOfLabels));

    // =========================================================
    // ADD / REPLACE ROW
    // =========================================================
    const handleAddForBarcode = async () => {
        if (!isAddValid) return;

        const itemKey =
            selectedItem.Item_Id ??
            selectedItem.id ??
            selectedItem.Item_Code ??
            barcodeValue;

        // Save barcode to DB if item doesn't already have one
        if (!selectedItem.Item_Code && barcodeValue) {
            try {
                const payload = {
                    ...selectedItem,
                    Item_Code: barcodeValue,
                };

                await editItem({
                    body: payload,
                    Item_Id: selectedItem.Item_Id,
                }).unwrap();

            } catch (error) {
                console.error("Failed to save Item Code:", error);
                return;
            }
        }

        const newRow = {
            itemId: selectedItem.Item_Id ?? selectedItem.id ?? null,
            itemCode: barcodeValue,
            itemName: selectedItem.Item_Name,
            noOfLabels: Number(noOfLabels),
            header: labelConfig.header,
            line1: labelConfig.line1,
            line2: labelConfig.line2,
            line3: labelConfig.line3,
            line4: labelConfig.line4,
            selectedItem: {
                ...selectedItem,
                Item_Code: barcodeValue,
            },
        };

        setBarcodeItems((prev) => {
            const existingIndex = prev.findIndex((row) => {
                const rowKey = row.itemId ?? row.itemCode;
                return String(rowKey) === String(itemKey);
            });
            console.log("itemKey:", itemKey, "existingIndex:", existingIndex, "prev:", prev);

            if (existingIndex !== -1) {
                const updated = [...prev];
                updated[existingIndex] = newRow;
                return updated;
            }

            return [...prev, newRow];
        });

        // Reset fields
        setSelectedItem(null);
        setItemSearch("");
        setBarcodeValue("");
        setNoOfLabels("");

        setLabelConfig({
            header: { field: "", value: "" },
            line1: { field: "", value: "" },
            line2: { field: "", value: "" },
            line3: { field: "", value: "" },
            line4: { field: "", value: "" },
        });
    };

    const handleRemoveRow = (itemKey) => {
        setBarcodeItems((prev) =>
            prev.filter((row) => String(row.itemId ?? row.itemCode) !== String(itemKey))
        );
    };

    const totalLabels = useMemo(
        () => barcodeItems.reduce((sum, row) => sum + (row.noOfLabels || 0), 0),
        [barcodeItems]
    );

    const handleLabelFieldSelect = (fieldKey, selectedField) => {
        let initialValue = "";

        if (selectedField === "Company_Name") {
            initialValue = "Anco Innovation";
        } else if (selectedItem) {
            initialValue = resolveFieldValue(
                selectedField,
                selectedItem,

            );
        } else {
            const selectedOption = LABEL_FIELD_OPTIONS.find(
                (option) => option.value === selectedField
            );

            initialValue = selectedOption?.label || "";
        }

        setLabelConfig((prev) => ({
            ...prev,
            [fieldKey]: {
                field: selectedField,
                value: initialValue,
            },
        }));

        setLabelDropdownOpen(null);
    };


    // free typing — always allowed, always reflected in preview
    const handleLabelValueChange = (fieldKey, newValue) => {
        setLabelConfig((prev) => ({
            ...prev,
            [fieldKey]: {
                ...prev[fieldKey],
                value: newValue,
            },
        }));
    };

    // =========================================================
    // PREVIEW VALUES — resolved live from selectedItem + labelConfig
    // =========================================================
    const previewHeader = labelConfig.header?.value || "";
    const previewLine1 = labelConfig.line1?.value || "";
    const previewLine2 = labelConfig.line2?.value || "";
    const previewLine3 = labelConfig.line3?.value || "";
    const previewLine4 = labelConfig.line4?.value || "";

    //const previewBarcodeValue = selectedItem?.Item_Code || "";
    const previewBarcodeValue = barcodeValue || "";
    // const previewHeader = resolveFieldValue(labelConfig.header, selectedItem, companyName);
    // const previewLine1 = resolveFieldValue(labelConfig.line1, selectedItem, companyName);
    // const previewLine2 = resolveFieldValue(labelConfig.line2, selectedItem, companyName);
    // const previewLine3 = resolveFieldValue(labelConfig.line3, selectedItem, companyName);
    // const previewLine4 = resolveFieldValue(labelConfig.line4, selectedItem, companyName);
    // const previewBarcodeValue = selectedItem?.Item_Code || "";

    // =========================================================
    // LABEL FIELD DROPDOWN (Header / Line1-4)
    // =========================================================



    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (!labelDropdownOpen) return;

            const currentDropdown = labelDropdownRefs.current[labelDropdownOpen];

            if (currentDropdown && !currentDropdown.contains(event.target)) {
                setLabelDropdownOpen(null);
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, [labelDropdownOpen]);
    useEffect(() => {
        if (!selectedItem) return;

        setLabelConfig({
            header: {
                field: "Company_Name",
                value: "Anco Innovation",
            },
            line1: {
                field: "Discount",
                value: resolveFieldValue(
                    "Discount",
                    selectedItem
                ),
            },
            line2: {
                field: "Sale_Price",
                value: resolveFieldValue(
                    "Sale_Price",
                    selectedItem
                ),
            },
            line3: {
                field: "MRP",
                value: resolveFieldValue(
                    "MRP",
                    selectedItem
                ),
            },
            line4: {
                field: "",
                value: "",
            },
        });
    }, [selectedItem]);
    const printTriggerRef = useRef(null);
    const handleGenerate = () => {
        if (printTriggerRef.current) {
            printTriggerRef.current();
        }
    };
   console.log(selectedItem,"selectedItem");
    return (
        <>
            {/* <div className="flex flex-col bg-white" style={{ minHeight: "100%" }}> */}
            <div
                className="flex flex-col bg-white"
                style={{
                    height: "100%",
                    minHeight: 0,
                    overflowY: "auto",
                    overflowX: "hidden",
                }}
            >
                <div
                    className="inn-title flex items-start justify-between"
                    style={{
                        width: "100%",
                    }}
                >
                    <div>
                        <h4 className="text-2xl font-bold mb-1">
                            Barcode Generator
                        </h4>

                        <p className="text-gray-500 text-sm mb-4">
                            Enter item details to add for barcode
                        </p>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                        }}
                    >
                        <span
                            style={{
                                fontSize: "13px",
                                color: "#64748b",
                                whiteSpace: "nowrap",
                            }}
                        >
                            Size:{" "}
                            <span
                                style={{
                                    color: "#334155",
                                    fontWeight: 500,
                                }}
                            >
                                {barcodeSettings.find(
                                    (setting) => Number(setting.Is_Active) === 1
                                )?.Size_Label || "Not selected"}
                            </span>
                        </span>

                        <button
                            type="button"
                            onClick={() => setShowBarcodeSettings(true)}
                            title="Barcode Settings"
                            style={{
                                border: "none",
                                background: "transparent",
                                padding: "4px",
                                cursor: "pointer",
                                color: "#4CA1AF",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Settings size={21} strokeWidth={1.8} />
                        </button>
                    </div>
                </div>

                {/* ══ TOP: FORM (left) + PREVIEW (right) ══ */}
                <div className="flex flex-col lg:flex-row gap-6"
                    style={{ borderTop: "1px solid #e2e8f0", width: "100%" }}>

                    {/* ══ LEFT FORM ══ */}
                    {/* //style={{ flex: 1 }} */}
                    <div className="tab-inn">

                        <div className="flex gap-4" style={{ position: "relative" }}>

                            {/* ITEM NAME */}
                            <div className="input-field col s6" style={{ marginTop: "0px", position: "relative" }}>
                                <span className="active">
                                    Item Name<span className="text-red-500 font-bold text-lg">&nbsp;*</span>
                                </span>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={itemSearch}
                                    onChange={(e) => handleItemNameChange(e.target.value)}
                                    onFocus={() => setItemDropdownOpen(true)}
                                    onBlur={handleItemNameBlur}
                                    placeholder=" Search item"
                                    className="w-full outline-none border-b-2 text-gray-900"
                                    style={{ marginBottom: "0px" }}
                                />

                                {itemDropdownOpen && (
                                    <BarcodeItemDropdown
                                        items={items}
                                        isDropdownFetching={isDropdownFetching}
                                        loadMoreItems={loadMoreItems}
                                        scrollRef={scrollRef}
                                        onAddItemClick={() => {

                                            setShowItemAddModal(true);
                                        }}
                                        onSelectItem={handleSelectItem}
                                    />
                                )}
                            </div>

                            {/* ITEM CODE */}
                            <div className="input-field col s6" style={{ width: "33%", marginTop: "0px" }}>
                                <span className="active">
                                    Item Code<span className="text-red-500 font-bold text-lg">&nbsp;*</span>
                                </span>
                                <input
                                    type="text"
                                    value={barcodeValue}
                                    onChange={(e) => setBarcodeValue(e.target.value)}
                                    disabled={!canEditItemCode}
                                    placeholder={selectedItem
                                        ? "Enter barcode"
                                        : "Select an item"
                                    }
                                    className="w-full outline-none border-b-2 text-gray-900"
                                    style={{
                                        marginBottom: "0px",
                                        backgroundColor: canEditItemCode
                                            ? "#ffffff"
                                            : "#f9fafb",
                                        cursor: canEditItemCode
                                            ? "text"
                                            : "not-allowed",
                                    }}
                                />
                            </div>

                            {/* NO OF LABELS */}
                            <div className="input-field col s6" style={{ width: "33%", marginTop: "0px" }}>
                                <span className="active">
                                    No of Labels<span className="text-red-500 font-bold text-lg">&nbsp;*</span>
                                </span>
                                <input
                                    type="text"
                                    value={noOfLabels}
                                    onChange={handleNoOfLabelsChange}
                                    placeholder="Enter No of Labels"
                                    className="w-full outline-none border-b-2 text-gray-900"
                                    style={{ marginBottom: "0px" }}
                                />
                            </div>

                        </div>

                        {/* <div className="flex gap-4 mt-6">
                            <div className="input-field col s6" style={{ width: "33%", marginTop: "0px" }}>
                                <span className="active">Header</span>
                                <LabelFieldDropdown
                                    fieldKey="header"
                                    value={labelConfig.header}
                                    onChange={(val) => setLabelConfig((prev) => ({ ...prev, header: val }))}
                                />
                            </div>

                            <div className="input-field col s6" style={{ width: "33%", marginTop: "0px" }}>
                                <span className="active">Line 1</span>
                                <LabelFieldDropdown
                                    fieldKey="line1"
                                    value={labelConfig.line1}
                                    onChange={(val) => setLabelConfig((prev) => ({ ...prev, line1: val }))}
                                />
                            </div>

                            <div className="input-field col s6" style={{ width: "33%", marginTop: "0px" }}>
                                <span className="active">Line 2</span>
                                <LabelFieldDropdown
                                    fieldKey="line2"
                                    value={labelConfig.line2}
                                    onChange={(val) => setLabelConfig((prev) => ({ ...prev, line2: val }))}
                                />
                            </div>
                        </div> */}
                        <div className="flex gap-4 mt-6">

                            <div
                                className="input-field col s6"
                                style={{ width: "33%", marginTop: "0px" }}
                            >
                                <span className="active">Header</span>

                                {/* <LabelFieldDropdown
                                    fieldKey="header"
                                    value={labelConfig.header}
                                    onChange={(val) =>
                                        handleLabelFieldChange("header", val)
                                    }
                                /> */}
                                <LabelFieldDropdown
                                    fieldKey="header"
                                    value={labelConfig.header}
                                    onFieldSelect={handleLabelFieldSelect}
                                    onValueChange={handleLabelValueChange}
                                    labelDropdownOpen={labelDropdownOpen}
                                    setLabelDropdownOpen={setLabelDropdownOpen}
                                    labelDropdownRefs={labelDropdownRefs}
                                />
                            </div>

                            <div
                                className="input-field col s6"
                                style={{ width: "33%", marginTop: "0px" }}
                            >
                                <span className="active">Line 1</span>

                                <LabelFieldDropdown
                                    fieldKey="line1"
                                    value={labelConfig.line1}
                                    onFieldSelect={handleLabelFieldSelect}
                                    onValueChange={handleLabelValueChange}
                                    labelDropdownOpen={labelDropdownOpen}
                                    setLabelDropdownOpen={setLabelDropdownOpen}
                                    labelDropdownRefs={labelDropdownRefs}
                                />
                            </div>

                            <div
                                className="input-field col s6"
                                style={{ width: "33%", marginTop: "0px" }}
                            >
                                <span className="active">Line 2</span>

                                <LabelFieldDropdown
                                    fieldKey="line2"
                                    value={labelConfig.line2}
                                    onFieldSelect={handleLabelFieldSelect}
                                    onValueChange={handleLabelValueChange}
                                    labelDropdownOpen={labelDropdownOpen}
                                    setLabelDropdownOpen={setLabelDropdownOpen}
                                    labelDropdownRefs={labelDropdownRefs}
                                />
                            </div>

                        </div>

                        <div className="flex gap-4 mt-6 items-end">
                            <div className="input-field col s6" style={{ width: "33%", marginTop: "0px" }}>
                                <span className="active">Line 3</span>
                                {/* <LabelFieldDropdown
                                    fieldKey="line3"
                                    value={labelConfig.line3}
                                    onChange={(val) => setLabelConfig((prev) => ({ ...prev, line3: val }))}
                                /> */}
                                <LabelFieldDropdown
                                    fieldKey="line3"
                                    value={labelConfig.line3}
                                    onFieldSelect={handleLabelFieldSelect}
                                    onValueChange={handleLabelValueChange}
                                    labelDropdownOpen={labelDropdownOpen}
                                    setLabelDropdownOpen={setLabelDropdownOpen}
                                    labelDropdownRefs={labelDropdownRefs}
                                />
                            </div>

                            <div className="input-field col s6" style={{ width: "33%", marginTop: "0px" }}>
                                <span className="active">Line 4</span>
                                {/* <LabelFieldDropdown
                                    fieldKey="line4"
                                    value={labelConfig.line4}
                                    onChange={(val) => setLabelConfig((prev) => ({ ...prev, line4: val }))}
                                /> */}
                                <LabelFieldDropdown
                                    fieldKey="line4"
                                    value={labelConfig.line4}
                                    onFieldSelect={handleLabelFieldSelect}
                                    onValueChange={handleLabelValueChange}
                                    labelDropdownOpen={labelDropdownOpen}
                                    setLabelDropdownOpen={setLabelDropdownOpen}
                                    labelDropdownRefs={labelDropdownRefs}
                                />
                            </div>

                            <div style={{ width: "33%" }} className="flex justify-start">
                                <button
                                    type="button"
                                    disabled={!isAddValid}
                                    onClick={handleAddForBarcode}
                                    className="px-4 py-2 rounded-md text-white font-medium"
                                    style={{
                                        backgroundColor: isAddValid ? "#4CA1AF" : "#cbd5e1",
                                        cursor: isAddValid ? "pointer" : "not-allowed",
                                        border: "none",
                                    }}
                                >
                                    Add for Barcode
                                </button>
                            </div>
                        </div>

                    </div>

                    {/* ══ RIGHT PREVIEW ══ */}


                    <div
                        style={{
                            width: 280,
                            flexShrink: 0,
                            borderLeft: "1px solid #e2e8f0",
                            paddingLeft: "1.5rem",
                        }}
                    >
                        <p className="text-sm font-semibold text-gray-700 mb-3">
                            Preview
                        </p>

                        <div
                            className="rounded-md border flex flex-col items-center justify-center text-center p-4"
                            style={{
                                borderStyle: "dashed",
                                borderColor: "#cbd5e1",
                                minHeight: 180,
                                width: "100%",
                                maxWidth: "100%",
                                overflow: "hidden",
                                boxSizing: "border-box",
                            }}
                        >
                            {/* Common style for ALL preview text */}
                            {(() => {
                                const previewTextStyle = {
                                    width: "100%",
                                    maxWidth: "100%",
                                    overflowWrap: "anywhere",
                                    wordBreak: "break-word",
                                    whiteSpace: "normal",
                                    margin: 0,
                                };

                                return (
                                    <>
                                        {/* HEADER */}
                                        <p
                                            className="text-sm italic mb-1"
                                            style={previewTextStyle}
                                        >
                                            {previewHeader || "Header"}
                                        </p>

                                        {/* STATIC BARCODE */}
                                        {/* <div
                                            className="w-full flex items-center justify-center my-2"
                                            style={{
                                                height: 50,
                                                backgroundColor: "#f1f5f9",
                                                maxWidth: "100%",
                                                overflow: "hidden",
                                                boxSizing: "border-box",
                                            }}
                                        >
                                            <span
                                                className="text-xs text-gray-400"
                                                style={{
                                                    maxWidth: "100%",
                                                    overflowWrap: "anywhere",
                                                    wordBreak: "break-word",
                                                    whiteSpace: "normal",
                                                }}
                                            >
                                                [ barcode: {previewBarcodeValue || "Item Code"} ]
                                            </span>
                                        </div> */}
                                        <div
                                            className="w-full flex items-center justify-center my-2"
                                            style={{
                                                height: 50,
                                                //backgroundColor: "#f1f5f9",
                                                maxWidth: "100%",
                                                overflow: "hidden",
                                                boxSizing: "border-box",
                                            }}
                                        >
                                            <img
                                                src="/assets/images/barcode.png"
                                                alt="Barcode preview"
                                                style={{
                                                    maxWidth: "90%",
                                                    maxHeight: "90%",
                                                    objectFit: "contain",
                                                    display: "block",
                                                }}
                                            />
                                        </div>

                                        {/* ITEM CODE */}
                                        <p
                                            className="text-xs font-semibold mb-1"
                                            style={previewTextStyle}
                                        >
                                            {previewBarcodeValue || "Item Code"}
                                        </p>

                                        {/* LINE 1 */}
                                        <p
                                            className="text-xs"
                                            style={previewTextStyle}
                                        >
                                            {previewLine1 || "Line 1"}
                                        </p>

                                        {/* LINE 2 */}
                                        <p
                                            className="text-xs"
                                            style={previewTextStyle}
                                        >
                                            {previewLine2 || "Line 2"}
                                        </p>

                                        {/* LINE 3 */}
                                        <p
                                            className="text-xs"
                                            style={previewTextStyle}
                                        >
                                            {previewLine3 || "Line 3"}
                                        </p>

                                        {/* LINE 4 */}
                                        <p
                                            className="text-xs italic"
                                            style={previewTextStyle}
                                        >
                                            {previewLine4 || "Line 4"}
                                        </p>
                                    </>
                                );
                            })()}
                        </div>
                    </div>


                </div>

                {/* ══ BELOW: ITEMS TABLE ══ */}
                <div className="tab-inn">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Item List</p>

                    <div className="table-responsive table-desi barcode-table-scroll" style={{
                        width: "100%",
                        maxHeight: "200px",
                        overflowY: "auto",
                        overflowX: "auto",
                    }}>
                        <table className="w-full min-w-[800px]">
                            <thead>
                                <tr>
                                    {["Item", "Item Code", "No of Labels", "Header", "Line 1", "Line 2", "Line 3", "Line 4", ""].map((h, i) => (
                                        <th key={i} style={{ textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {barcodeItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="text-center text-gray-400" style={{ padding: "40px 0" }}>
                                            Added items for Barcode generation will appear here.
                                        </td>
                                    </tr>
                                ) : (
                                    barcodeItems.map((row) => {
                                        const rowKey = row.itemId ?? row.itemCode;
                                        return (
                                            <tr key={rowKey}>
                                                <td>{row.itemName}</td>
                                                <td>{row.itemCode}</td>
                                                <td>{row.noOfLabels}</td>
                                                <td>{row.header?.value || "—"}</td>
                                                <td>{row.line1?.value || "—"}</td>
                                                <td>{row.line2?.value || "—"}</td>
                                                <td>{row.line3?.value || "—"}</td>
                                                <td>{row.line4?.value || "—"}</td>
                                                {/* <td>{LABEL_FIELD_OPTIONS.find((o) => o.value === row.header)?.label || "—"}</td>
                                                <td>{LABEL_FIELD_OPTIONS.find((o) => o.value === row.line1)?.label || "—"}</td>
                                                <td>{LABEL_FIELD_OPTIONS.find((o) => o.value === row.line2)?.label || "—"}</td>
                                                <td>{LABEL_FIELD_OPTIONS.find((o) => o.value === row.line3)?.label || "—"}</td>
                                                <td>{LABEL_FIELD_OPTIONS.find((o) => o.value === row.line4)?.label || "—"}</td> */}
                                                <td>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveRow(rowKey)}
                                                        style={{ backgroundColor: "transparent", border: "none", cursor: "pointer" }}
                                                        title="Remove"
                                                    >
                                                        <Trash2 size={16} style={{ color: "#dc2626" }} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {barcodeItems.length > 0 && (
                        <div
                            className="flex items-center gap-2 mt-4 px-4 py-2 rounded-md"
                            style={{ backgroundColor: "#eff6ff", color: "#2563eb", width: "fit-content" }}
                        >
                            <span className="text-sm">You will need {totalLabels} labels for printing.</span>
                        </div>
                    )}
                    {barcodeItems.length > 0 && (
                        <div className="flex justify-end mt-4">
                            <button
                                type="button"
                                onClick={handleGenerate}
                                //onClick={() => setShowBarcodePreview(true)}
                                className="px-5 py-2 rounded-md text-white font-medium"
                                style={{
                                    backgroundColor: "#4CA1AF",
                                    border: "none",
                                    cursor: "pointer",
                                }}
                            >
                                Generate
                            </button>
                        </div>
                    )}
                </div>

            </div>
            {showItemAddModal && (
                <AddItemModal
                    onClose={() => {
                        setShowItemAddModal(false);


                    }}
                    onSave={async (savedItem) => {
                        if (!savedItem || typeof savedItem !== "object") {
                            setShowItemAddModal(false);
                            return;
                        }

                        await refetchItems();


                        setShowItemAddModal(false);

                    }}
                />
            )}
            <BarcodeSettingsDrawer
                open={showBarcodeSettings}
                sizes={barcodeSettings}
                selectedSizeId={selectedBarcodeSizeId}
                onChange={(sizeId) => {
                    setSelectedBarcodeSizeId(sizeId);
                }}
                onClose={() => {
                    setShowBarcodeSettings(false);
                }}
                onSave={async () => {
                    if (!selectedBarcodeSizeId) return;

                    try {
                        await selectBarcodeSetting({
                            id: selectedBarcodeSizeId,
                        }).unwrap();

                        setShowBarcodeSettings(false);
                        toast.success("Setting saved successfully");
                    } catch (error) {
                        // console.error(
                        //     "Failed to select barcode setting:",
                        //     error
                        // );
                        toast.error(error?.data?.message || "Failed to select barcode size");
                    }
                }}
                isLoading={isBarcodeSettingsLoading || isBarcodeSettingsFetching}
            />
            <BarcodeLabelSheet barcodeItems={barcodeItems} triggerPrint={printTriggerRef}
                labelSettings={barcodeSettings.find(
                    (setting) => Number(setting.Is_Active) === 1
                )}
            />
            <style>
                {`
 
    .item-dropdown-scroll {
  scrollbar-width: auto;
  scrollbar-color: #94a3b8 #f1f5f9;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}
.item-dropdown-scroll::-webkit-scrollbar { width: 14px; }
.item-dropdown-scroll::-webkit-scrollbar-track { background: #f1f5f9; }
.item-dropdown-scroll::-webkit-scrollbar-thumb {
  background-color: #94a3b8;
  border-radius: 8px;
  border: 3px solid #f1f5f9;
}
.item-dropdown-scroll::-webkit-scrollbar-thumb:hover { background-color: #64748b; }



.barcode-table-scroll {
    scrollbar-width: auto;
    scrollbar-color: #94a3b8 #f1f5f9;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
}

.barcode-table-scroll::-webkit-scrollbar {
    width: 14px;
    height: 14px;
}

.barcode-table-scroll::-webkit-scrollbar-track {
    background: #f1f5f9;
}

.barcode-table-scroll::-webkit-scrollbar-thumb {
    background-color: #94a3b8;
    border-radius: 8px;
    border: 3px solid #f1f5f9;
}

.barcode-table-scroll::-webkit-scrollbar-thumb:hover {
    background-color: #64748b;
}
`}
            </style>
        </>
    );
}