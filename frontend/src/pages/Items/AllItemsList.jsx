import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Search,
    MoreVertical,
    ChevronRight,
    Package,
    Eye,
    Trash2,
} from "lucide-react";

import {
    useGetAllItemsForLedgerQuery,
    useGetItemBillsQuery,
} from "../../redux/api/itemApi";

import AddItemModal from "../../components/Modal/AddItemModal";
import ItemModal from "../../components/Modal/ItemModal";
import StockAdjustmentModal from "../../components/Modal/StockAdjustmentModal";

const fmt = (n) =>
    Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════ */
export default function ItemsByItem() {

    const navigate = useNavigate();
    const location = useLocation();

    const {
        data: itemsResponse,
        isLoading,
    } = useGetAllItemsForLedgerQuery({});

    const items = itemsResponse?.items || [];

    const [selectedItemId, setSelectedItemId] = useState(null);
    const [itemSearch, setItemSearch] = useState("");
    const [txnSearch, setTxnSearch] = useState("");
    const [menuOpen, setMenuOpen] = useState(null);
    const [rowMenuOpen, setRowMenuOpen] = useState(null);
    const [showAddItemModal, setShowAddItemModal] = useState(false);
    const [showEditItemModal, setShowEditItemModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    // Cursor pagination
    const [cursor, setCursor] = useState(null);
    const sentinelRef = useRef(null);
    const observerRef = useRef(null);


    const {
        data: billsResponse,
        isLoading: isBillsLoading,
        isFetching: isBillsFetching,
    } = useGetItemBillsQuery(
        {
            Item_Id: selectedItemId,
            cursor,
            search: txnSearch,
        },
        {
            skip: !selectedItemId,
        }
    );
    console.log("itemsResponse", itemsResponse);
    // DEBUG LOGS
    // console.log("========== ITEM BILLS DEBUG ==========");
    // console.log("Selected Item ID:", selectedItemId);
    // console.log("Cursor:", cursor);
    // console.log("Transaction Search:", txnSearch);
    console.log("Bills Response:", billsResponse);
    // console.log("Transactions:", billsResponse?.transactions);
    // console.log("Transactions Length:", billsResponse?.transactions?.length);
    // console.log("Has More:", billsResponse?.hasMore);
    // console.log("Next Cursor:", billsResponse?.nextCursor);
    // console.log("======================================");

    const transactions = billsResponse?.transactions || [];
    const liveItem = billsResponse?.item || null;
    const hasMore = billsResponse?.hasMore ?? false;
    const nextCursor = billsResponse?.nextCursor ?? null;


    useEffect(() => {
        if (!items.length) return;

        if (
            selectedItemId === null &&
            location.state?.itemId
        ) {
            setSelectedItemId(location.state.itemId);

            navigate(location.pathname, {
                replace: true,
                state: null,
            });

            return;
        }

        if (selectedItemId === null) {
            setSelectedItemId(items[0].Item_Id);
        }
    }, [items, selectedItemId, navigate, location.pathname, location.state]);


    useEffect(() => {
        setCursor(null);
    }, [selectedItemId, txnSearch]);

    const handleObserver = useCallback(
        (entries) => {
            if (
                entries[0].isIntersecting &&
                hasMore &&
                nextCursor &&
                !isBillsFetching &&
                !isBillsLoading
            ) {
                setCursor(nextCursor);
            }
        },
        [
            hasMore,
            nextCursor,
            isBillsFetching,
            isBillsLoading,
        ]
    );

    useEffect(() => {
        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        observerRef.current = new IntersectionObserver(
            handleObserver,
            {
                root: null,
                rootMargin: "0px",
                threshold: 0.1,
            }
        );

        if (sentinelRef.current) {
            observerRef.current.observe(sentinelRef.current);
        }

        return () => observerRef.current?.disconnect();
    }, [handleObserver]);


    useEffect(() => {
        const closeMenus = () => {
            setMenuOpen(null);
            setRowMenuOpen(null);
        };
        document.addEventListener("click", closeMenus);
        return () => document.removeEventListener("click", closeMenus);
    }, []);

    const filteredItems = useMemo(() => {
        return items.filter((it) =>
            it.Item_Name.toLowerCase().includes(itemSearch.toLowerCase())
        );
    }, [items, itemSearch]);

    const selectedItemMeta = items.find((it) => it.Item_Id === selectedItemId) || null;

    const fmtDate = (d) =>
        d
            ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
            : "—";

    const handleSelectItem = (item) => {

        // console.log("========== ITEM SELECTED ==========");
        // console.log("Full Item:", item);
        // console.log("Item_Id being selected:", item.Item_Id);
        // console.log("Item Name:", item.Item_Name);
        // console.log("====================================");

        setSelectedItemId(item.Item_Id);
        setTxnSearch("");
        setMenuOpen(null);
        setRowMenuOpen(null);
    };

    // const handleTransactionEdit = (txn) => {
    //     setRowMenuOpen(null);

    //     if (!txn?.Source_Id) {
    //         console.error("No Source_Id found for transaction:", txn);
    //         return;
    //     }

    //     const navigationState = {
    //         from: "items-by-item",
    //         itemId: selectedItemId,
    //     };

    //     switch (txn.Txn_Type) {
    //         case "Sale":
    //             navigate(`/sale/edit/${txn.Source_Id}`, {
    //                 state: navigationState,
    //             });
    //             break;

    //         case "Purchase":
    //             navigate(`/purchase/edit/${txn.Source_Id}`, {
    //                 state: navigationState,
    //             });
    //             break;

    //         case "Sale_Return":
    //             navigate(`/sale/return/edit/${txn.Source_Id}`, {
    //                 state: navigationState,
    //             });
    //             break;

    //         case "Purchase_Return":
    //             navigate(`/purchase/return/edit/${txn.Source_Id}`, {
    //                 state: navigationState,
    //             });
    //             break;

    //         default:
    //             console.warn(
    //                 "No edit route configured for transaction type:",
    //                 txn.Txn_Type
    //             );
    //     }
    // };
const handleTransactionEdit = (txn) => {
    console.log("handleTransactionEdit called with txn:", txn);
    setRowMenuOpen(null);

    if (!txn?.Source_Id) {
        console.error("No Source_Id found for transaction:", txn);
        return;
    }

    const navigationState = {
        from: "items-by-item",
        itemId: selectedItemId,
    };

    switch (txn.Txn_Type) {

        case "Sale":
            navigate(`/sale/edit/${txn.Document_Id}`, {
                state: navigationState,
            });
            break;

        case "Purchase":
            navigate(`/purchase/edit/${txn.Document_Id}`, {
                state: navigationState,
            });
            break;

        case "Sale_Return":
            navigate(`/sale/return/edit/${txn.Document_Id}`, {
                state: navigationState,
            });
            break;

        case "Purchase_Return":
            navigate(`/purchase/return/edit/${txn.Document_Id}`, {
                state: navigationState,
            });
            break;

        case "Add_Adjustment":
        case "Reduce_Adjustment":
            setEditingAdjustment({
                ...txn,
                id: txn.Source_Id,
                Item_Id: txn.Item_Id || selectedItemId,
            });

            setShowStockAdjustmentModal(true);
            break;

        default:
            console.warn(
                "No edit route configured for transaction type:",
                txn.Txn_Type
            );
    }
};
    const handleItemAdded = (savedItem) => {
        setShowAddItemModal(false);
        if (savedItem?.Item_Id) {
            setSelectedItemId(savedItem.Item_Id);
            setItemSearch("");
        }
    };

    // const handleAdjustItem = () => {
    //     // TODO: wire up actual adjust-item flow
    //     console.log("Adjust Item clicked for:", selectedItemMeta?.Item_Id);
    // };
    const [showStockAdjustmentModal, setShowStockAdjustmentModal] = useState(false);
    const [editingAdjustment, setEditingAdjustment] = useState(null);

    // replace handleAdjustItem:
    const handleAdjustItem = () => {
        setEditingAdjustment(null); // Add mode
        setShowStockAdjustmentModal(true);
    };

    // new handler for editing an existing adjustment row from the ledger:
    // const handleEditAdjustment = (txn) => {
    //   setEditingAdjustment(txn); // pass the row — needs id/Adjustment_Type/etc.
    //   setShowStockAdjustmentModal(true);
    // };

    return (
        <>
            {/* ── BREADCRUMB ── */}
            <div className="sb2-2-2">
                <ul>
                    <li>
                        <NavLink style={{ display: "flex", flexDirection: "row" }} to="/home">
                            <LayoutDashboard size={20} style={{ marginRight: "8px" }} />
                            Dashboard
                        </NavLink>
                    </li>
                </ul>
            </div>

            <div className="flex flex-col bg-white" style={{ minHeight: "100vh" }}>

                {/* ── PAGE HEADER ── */}
                <div className="inn-title">
                    <div className="flex flex-row justify-between items-center">
                        <div>
                            <h4 className="text-2xl font-bold mb-1">Items By Item</h4>
                            <p className="text-gray-500 text-sm">Manage your items and their transactions</p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowAddItemModal(true)}
                            className="text-white px-4 py-2 rounded-md text-sm font-medium"
                            style={{ backgroundColor: "#4CA1AF", outline: "none", boxShadow: "none" }}
                        >
                            + Add Item
                        </button>
                    </div>
                </div>

                {/* ── SPLIT LAYOUT ── */}
                <div
                    className="flex flex-col lg:flex-row gap-0"
                    style={{ flex: 1, borderTop: "1px solid #e2e8f0" }}
                >

                    {/* ══ LEFT — 30% — item list ══ */}
                    <div
                        className="w-full lg:w-[30%] overflow-y-auto overflow-x-hidden"
                        style={{
                            borderRight: "1px solid #e2e8f0",
                            minHeight: "500px",
                            maxHeight: "calc(100vh - 180px)",
                            boxSizing: "border-box",
                        }}
                    >
                        {/* search */}
                        <div className="p-3" style={{ borderBottom: "1px solid #f1f5f9", boxSizing: "border-box" }}>
                            <div className="relative" style={{ width: "100%", maxWidth: 180, height: 34 }}>
                                <Search
                                    size={14}
                                    style={{ position: "absolute", left: 9, top: 10, color: "#94a3b8", pointerEvents: "none" }}
                                />
                                <input
                                    type="text"
                                    value={itemSearch}
                                    onChange={(e) => setItemSearch(e.target.value)}
                                    placeholder="Search Item"
                                    className="border rounded-md text-sm outline-none"
                                    style={{
                                        width: "100%",
                                        height: 34,
                                        paddingLeft: 30,
                                        paddingRight: 8,
                                        borderColor: "#dbe3ea",
                                        boxSizing: "border-box",
                                    }}
                                />
                            </div>
                        </div>

                        {/* list header */}
                        <div
                            className="px-4 py-3 flex items-center gap-2"
                            style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#fafafa" }}
                        >
                            <Package size={15} style={{ color: "#4CA1AF" }} />
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Items ({filteredItems.length})
                            </span>
                        </div>

                        {isLoading ? (
                            <div className="p-10 text-center text-gray-400 text-sm">Loading...</div>
                        ) : filteredItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-10 text-gray-400 gap-2">
                                <Package size={36} strokeWidth={1.2} />
                                <p className="text-sm">No items found</p>
                            </div>
                        ) : (
                            filteredItems.map((item) => {
                                const isSelected = selectedItemId === item.Item_Id;

                                return (
                                    <div
                                        key={item.Item_Id}
                                        onClick={() => handleSelectItem(item)}
                                        onDoubleClick={() => {
                                            handleSelectItem(item);
                                            setEditingItem(item);
                                            setShowEditItemModal(true);
                                            setMenuOpen(null);
                                        }}
                                        className="relative flex items-center justify-between px-4 py-3 cursor-pointer transition-colors"
                                        style={{
                                            backgroundColor: isSelected ? "#f0f9ff" : "transparent",
                                            borderLeft: isSelected ? "3px solid #4CA1AF" : "3px solid transparent",
                                            borderBottom: "1px solid #f1f5f9",
                                        }}
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div
                                                className="flex items-center justify-center rounded-lg flex-shrink-0"
                                                style={{ width: 36, height: 36, backgroundColor: isSelected ? "#4CA1AF22" : "#f1f5f9" }}
                                            >
                                                <Package size={18} style={{ color: isSelected ? "#4CA1AF" : "#94a3b8" }} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-gray-800 truncate text-sm" style={{ margin: 0 }}>
                                                    {item.Item_Name}
                                                </p>
                                                <p className="text-xs text-gray-400 truncate">
                                                    {item.Item_Category || "N/A"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedItemId(item.Item_Id);
                                                    setTxnSearch("");
                                                    setMenuOpen(menuOpen === item.Item_Id ? null : item.Item_Id);
                                                }}
                                                className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                                                style={{ backgroundColor: "transparent" }}
                                                title="More"
                                            >
                                                <MoreVertical size={14} style={{ color: "#94a3b8" }} />
                                            </button>

                                            <ChevronRight size={14} style={{ color: isSelected ? "#4CA1AF" : "#cbd5e1" }} />
                                        </div>

                                        {menuOpen === item.Item_Id && (
                                            <div
                                                onClick={(e) => e.stopPropagation()}
                                                className="absolute bg-white shadow-lg rounded-md"
                                                style={{ right: 10, top: 48, width: 140, zIndex: 50, border: "1px solid #e2e8f0" }}
                                            >
                                                <button
                                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                                                    onClick={() => {
                                                        setEditingItem(item);
                                                        setShowEditItemModal(true);
                                                        setMenuOpen(null);
                                                    }}
                                                >
                                                    View/Edit
                                                </button>
                                                <button
                                                    className="w-full text-left px-4 py-2 hover:bg-red-50 text-sm text-red-500"
                                                    disabled
                                                    title="Delete item — coming soon"
                                                    style={{ opacity: 0.5, cursor: "not-allowed" }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* ══ RIGHT — 70% — detail panel ══ */}
                    <div
                        className="w-full lg:w-[70%] p-1 overflow-y-auto"
                        style={{ maxHeight: "calc(100vh - 180px)" }}
                    >
                        <div className="flex flex-col h-full">

                            {/* ── ITEM SUMMARY CARD ── */}
                            {selectedItemMeta && (
                                <div className="rounded-xl p-2 mb-2 flex flex-col gap-2">
                                    {/* Row 1: icon + name/category on left, Adjust Item button on right */}
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="flex items-center justify-center rounded-xl"
                                                style={{ width: 44, height: 44, backgroundColor: "#4CA1AF22" }}
                                            >
                                                <Package size={22} style={{ color: "#4CA1AF" }} />
                                            </div>
                                            <div>
                                                <h6 className="font-bold text-gray-900" style={{ fontSize: 18, margin: 0 }}>
                                                    {liveItem?.Item_Name || selectedItemMeta.Item_Name}
                                                </h6>
                                                <p className="text-gray-500 text-sm mt-0.5">
                                                    {selectedItemMeta.Item_Category || "N/A"}
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleAdjustItem}
                                            className="text-white px-4 py-2 rounded-md text-sm font-medium"
                                            style={{
                                                backgroundColor: "#4CA1AF",
                                                outline: "none",
                                                boxShadow: "none",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            + Adjust Item
                                        </button>
                                    </div>

                                    {/* Row 2: search bar (rendered below) aligns with Stock/HSN on the right */}
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div className="relative" style={{ width: "40%", minWidth: 220, maxWidth: 300, height: 36 }}>
                                            <Search
                                                size={16}
                                                style={{
                                                    position: "absolute",
                                                    left: 10,
                                                    top: 10,
                                                    color: "#94a3b8",
                                                    pointerEvents: "none",
                                                }}
                                            />
                                            <input
                                                type="text"
                                                value={txnSearch}
                                                onChange={(e) => setTxnSearch(e.target.value)}
                                                placeholder="Search"
                                                className="w-full h-full border rounded-md text-sm outline-none"
                                                style={{
                                                    height: 36,
                                                    paddingLeft: 34,
                                                    paddingRight: 10,
                                                    borderColor: "#dbe3ea",
                                                }}
                                            />
                                        </div>

                                        <div className="flex items-center gap-8">
                                            <div className="text-right">
                                                <p className="text-xs uppercase text-gray-400 mb-1">Stock</p>
                                                <p
                                                    className="font-bold"
                                                    style={{
                                                        color: (liveItem?.Stock_Quantity ?? selectedItemMeta.Stock_Quantity) < 0
                                                            ? "#dc2626"
                                                            : "#4CA1AF",
                                                        fontSize: 18,
                                                    }}
                                                >
                                                    {liveItem?.Stock_Quantity ?? selectedItemMeta.Stock_Quantity}
                                                    {" "}
                                                    {selectedItemMeta.Primary_Unit || selectedItemMeta.Item_Unit || ""}
                                                </p>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-xs uppercase text-gray-400 mb-1">HSN</p>
                                                <p className="font-bold" style={{ fontSize: 18, color: "#374151" }}>
                                                    {selectedItemMeta.Item_HSN || "—"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── ITEM LEDGER TABLE ── */}
                            <div className="flex-1 overflow-x-auto">
                                <table className="w-full min-w-[700px]" style={{ fontSize: 13, borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                                            {[
                                                "Date",
                                                "Bill No.",
                                                "Party",
                                                "Type",
                                                "Qty",
                                                "Rate",
                                                "Running Stock",
                                                ""
                                            ].map((h, index) => (
                                                <th
                                                    key={index}
                                                    className="text-left py-2 px-3 font-semibold text-gray-500"
                                                    style={{
                                                        fontSize: 11,
                                                        textTransform: "uppercase",
                                                        letterSpacing: "0.05em",
                                                        width: index === 7 ? 50 : "auto"
                                                    }}
                                                >
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isBillsLoading && !cursor ? (
                                            <tr>
                                                <td colSpan={8} className="text-center text-gray-400" style={{ padding: "48px 0" }}>
                                                    Loading...
                                                </td>
                                            </tr>
                                        ) : transactions.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="text-center text-gray-400" style={{ padding: "48px 0" }}>
                                                    No transactions to show
                                                </td>
                                            </tr>
                                        ) : (
                                            transactions.map((txn) => (
                                                <tr
                                                    key={txn.Ledger_Id}
                                                    onDoubleClick={() => handleTransactionEdit(txn)}
                                                    style={{
                                                        borderBottom: "1px solid #f1f5f9",
                                                        position: "relative",
                                                        cursor: "pointer",
                                                    }}
                                                    className="hover:bg-gray-50 transition-colors"
                                                >
                                                    {/* DATE */}
                                                    <td
                                                        className="py-2 px-3 text-gray-500"
                                                        style={{ whiteSpace: "nowrap" }}
                                                    >
                                                        {fmtDate(txn.Txn_Date)}
                                                    </td>

                                                    {/* BILL NUMBER */}
                                                    <td className="py-2 px-3 text-gray-700">
                                                        {txn.Bill_Number || "—"}
                                                    </td>

                                                    {/* PARTY */}
                                                    <td className="py-2 px-3 text-gray-700">
                                                        {txn.Party_Name || "—"}
                                                    </td>

                                                    {/* TYPE */}
                                                    <td
                                                        className="py-2 px-3"
                                                        style={{
                                                            color:
                                                                txn.Direction === "In"
                                                                    ? "#16a34a"
                                                                    : "#dc2626",
                                                        }}
                                                    >
                                                        {txn.Txn_Type || "—"}
                                                    </td>

                                                    {/* QTY */}
                                                    <td className="py-2 px-3 text-gray-700">
                                                        {fmt(txn.Quantity)}
                                                    </td>

                                                    {/* RATE */}
                                                    <td className="py-2 px-3 text-gray-700">
                                                        {txn.Rate !== null
                                                            ? `₹ ${fmt(txn.Rate)}`
                                                            : "—"}
                                                    </td>

                                                    {/* RUNNING STOCK */}
                                                    <td
                                                        className="py-2 px-3 font-semibold"
                                                        style={{ color: "#4CA1AF" }}
                                                    >
                                                        {fmt(txn.Running_Stock)}
                                                    </td>

                                                    {/* THREE DOT MENU */}
                                                    <td
                                                        className="py-2 px-2"
                                                        style={{
                                                            position: "relative",
                                                            width: 50,
                                                            textAlign: "center",
                                                        }}
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();

                                                                setRowMenuOpen(
                                                                    rowMenuOpen === txn.Ledger_Id
                                                                        ? null
                                                                        : txn.Ledger_Id
                                                                );
                                                            }}
                                                            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                                                            style={{
                                                                backgroundColor: "transparent",
                                                                border: "none",
                                                                cursor: "pointer",
                                                            }}
                                                            title="More"
                                                        >
                                                            <MoreVertical
                                                                size={16}
                                                                style={{ color: "#94a3b8" }}
                                                            />
                                                        </button>

                                                        {/* ROW MENU */}
                                                        {rowMenuOpen === txn.Ledger_Id && (
                                                            <div
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="absolute bg-white shadow-lg rounded-md"
                                                                style={{
                                                                    right: 10,
                                                                    top: 36,
                                                                    width: 150,
                                                                    zIndex: 100,
                                                                    border: "1px solid #e2e8f0",
                                                                }}
                                                            >
                                                                <button
                                                                    type="button"
                                                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                                                                    onClick={() => handleTransactionEdit(txn)}
                                                                >
                                                                    View / Edit
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>

                                <div
                                    ref={sentinelRef}
                                    style={{ height: "1px" }}
                                />

                                {isBillsFetching && cursor && (
                                    <div className="flex justify-center py-4">
                                        <span className="text-sm text-gray-400">
                                            Loading more...
                                        </span>
                                    </div>
                                )}

                                {!hasMore && transactions.length > 0 && (
                                    <div className="flex justify-center py-4">
                                        <span className="text-xs text-gray-300">
                                            — End of transactions —
                                        </span>
                                    </div>
                                )}

                            </div>

                        </div>
                    </div>

                </div>
            </div>

            {showAddItemModal && (
                <AddItemModal
                    onClose={() => setShowAddItemModal(false)}
                    onSave={handleItemAdded}
                />
            )}

            {showEditItemModal && (
                <ItemModal
                    itemDetails={editingItem}
                    editingItem={true}
                    onClose={() => {
                        setShowEditItemModal(false);
                        setEditingItem(null);
                    }}
                />
            )}
            {showStockAdjustmentModal && (
                <StockAdjustmentModal
                    itemDetails={liveItem || selectedItemMeta}
                    editingAdjustment={editingAdjustment}
                    onClose={() => {
                        setShowStockAdjustmentModal(false);
                        setEditingAdjustment(null);
                    }}
                    onSave={() => {
                        // RTK invalidatesTags refetches item + bills automatically
                        setShowStockAdjustmentModal(false);
                        setEditingAdjustment(null);
                    }}
                />
            )}

        </>
    );
}