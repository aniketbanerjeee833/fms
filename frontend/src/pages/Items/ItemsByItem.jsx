
import { useState, useEffect, useRef, useCallback } from "react";
import { NavLink, useNavigate, useSearchParams } from "react-router-dom";
import {
    LayoutDashboard,
    Search,
    MoreVertical,
    ChevronRight,
    Package,
    Eye,
    SquarePen,
    Trash2,
    Printer
} from "lucide-react";

import {
    itemApi,
    useDeleteItemMutation,
    useDeleteStockAdjustmentMutation,
    useGetAllItemsForLedgerQuery,
    useGetItemBillsQuery,
} from "../../redux/api/itemApi";

import AddItemModal from "../../components/Modal/AddItemModal";
import ItemModal from "../../components/Modal/ItemModal";
import StockAdjustmentModal from "../../components/Modal/StockAdjustmentModal";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { saleApi, useDeleteSaleMutation, useGetSingleSaleQuery } from "../../redux/api/saleApi";
import { purchaseApi, useDeletePurchaseMutation, useGetSinglePurchaseQuery } from "../../redux/api/purchaseApi";
import { useDeleteSaleReturnMutation, useGetSaleReturnByIdQuery } from "../../redux/api/saleReturnApi";
import { useDeletePaymentInMutation, useGetPaymentInByIdQuery } from "../../redux/api/paymentInApi";
import { useDeletePaymentOutMutation, useGetPaymentOutByIdQuery } from "../../redux/api/paymentOutApi";
import { useDeletePurchaseReturnMutation, useGetPurchaseReturnByIdQuery } from "../../redux/api/purchaseReturnApi";
import { partyApi } from "../../redux/api/partyAPi";
import { cashInHandApi } from "../../redux/api/cashInHandApi";
import { bankAccountApi } from "../../redux/api/bankAccountApi";
import DeleteConfirmModal from "../../components/Modal/DeleteConfirmModal";
import { useReactToPrint } from "react-to-print";
import PaymentInOutPrintTemplate from "../../components/PaymentInOutPrintTemplate";
import CreditDebitNotePrintTemplate from "../../components/CreditDebitNotePrintTemplate";
import InvoicePrintTemplate from "../../components/InvoicePrintTemplate";


const fmt = (n) =>
    Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ItemsByItem() {
    const DELETE_CONFIG = {
        Sale: {
            title: "Delete Sale",
            label: "sale invoice",
        },
        Purchase: {
            title: "Delete Purchase",
            label: "purchase bill",
        },
        Sale_Return: {
            title: "Delete Credit Note",
            label: "credit note",
        },
        Purchase_Return: {
            title: "Delete Debit Note",
            label: "debit note",
        },
        Payment_In: {
            title: "Delete Payment In",
            label: "payment in entry",
        },
        Payment_Out: {
            title: "Delete Payment Out",
            label: "payment out entry",
        },
    };
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [searchParams, setSearchParams] = useSearchParams();

    const selectedItemId = searchParams.get("itemId") || null;
    const itemSearch = searchParams.get("q") || "";
    const txnSearch = searchParams.get("txnSearch") || "";
    const itemTypeTab = searchParams.get("type") || "Product"; // "Product" | "Service"
    const [deleteItemTarget, setDeleteItemTarget] = useState(null); // holds { Item_Id, Item_Name }
    const [deleteItem, { isLoading: isDeletingItem }] = useDeleteItemMutation();
    const handleTypeTabChange = (type) => {
        const next = new URLSearchParams(searchParams);
        next.set("type", type);
        next.delete("itemId");   // clear selected item when switching tabs
        next.delete("q");
        next.delete("txnSearch");
        setSearchParams(next);
        setLeftCursor(null);
    };
    /* ── LEFT — item list cursor pagination (mirrors the right-side bills pattern) ── */
    const [leftCursor, setLeftCursor] = useState(null);
    const leftSentinelRef = useRef(null);
    const leftObserverRef = useRef(null);

    const {
        data: itemsResponse,
        isLoading,
        isFetching: isItemsFetching,
    } = useGetAllItemsForLedgerQuery({
        cursor: leftCursor,
        search: itemSearch,
        type: itemTypeTab,
        limit: 10,
    });

    const items = itemsResponse?.items || [];
    const totalItems = itemsResponse?.totalItems || 0;
    const itemsHasMore = itemsResponse?.hasMore ?? false;
    const itemsNextCursor = itemsResponse?.nextCursor ?? null;

    // reset left cursor whenever the item search changes — starts a fresh page-1 fetch
    // (matches serializeQueryArgs, which keys the cache purely on `search`)
    // useEffect(() => {
    //     setLeftCursor(null);
    // }, [itemSearch]);
    useEffect(() => {
        if (!selectedItemId && items.length > 0) {
            const next = new URLSearchParams(searchParams);
            next.set("itemId", items[0].Item_Id);
            setSearchParams(next, { replace: true });
        }
    }, [items, selectedItemId, itemTypeTab]);
    useEffect(() => {
        setLeftCursor(null);
    }, [itemSearch, itemTypeTab]);
    const handleLeftObserver = useCallback(
        (entries) => {
            if (
                entries[0].isIntersecting &&
                itemsHasMore &&
                itemsNextCursor &&
                !isItemsFetching &&
                !isLoading
            ) {
                setLeftCursor(itemsNextCursor);
            }
        },
        [itemsHasMore, itemsNextCursor, isItemsFetching, isLoading]
    );

    useEffect(() => {
        if (leftObserverRef.current) {
            leftObserverRef.current.disconnect();
        }

        leftObserverRef.current = new IntersectionObserver(handleLeftObserver, {
            root: null,
            rootMargin: "0px",
            threshold: 0.1,
        });

        if (leftSentinelRef.current) {
            leftObserverRef.current.observe(leftSentinelRef.current);
        }

        return () => leftObserverRef.current?.disconnect();
    }, [handleLeftObserver]);

    const [menuOpen, setMenuOpen] = useState(null);
    const [rowMenuOpen, setRowMenuOpen] = useState(null);
    const [showAddItemModal, setShowAddItemModal] = useState(false);
    const [showEditItemModal, setShowEditItemModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [showStockAdjustmentModal, setShowStockAdjustmentModal] = useState(false);
    const [editingAdjustment, setEditingAdjustment] = useState(null);
    ///const [selectedItemMeta, setSelectedItemMeta] = useState(null);
    // ── RIGHT — transactions cursor pagination (unchanged) ──
    const [cursor, setCursor] = useState(null);
    const sentinelRef = useRef(null);
    const observerRef = useRef(null);
    const itemRef = useRef(selectedItemId);

    const effectiveCursor = itemRef.current === selectedItemId ? cursor : null;

    const {
        data: billsResponse,
        isLoading: isBillsLoading,
        isFetching: isBillsFetching,
        refetch: refetchBills,
    } = useGetItemBillsQuery(
        {
            Item_Id: selectedItemId,
            cursor: effectiveCursor,
            search: txnSearch,
        },
        {
            skip: !selectedItemId,
        }
    );

    const transactions = billsResponse?.transactions || [];
    const liveItem = billsResponse?.item || null;
    const hasMore = billsResponse?.hasMore ?? false;
    const nextCursor = billsResponse?.nextCursor ?? null;



    const selectedItemMeta =
        items.find(
            (it) => String(it.Item_Id) === String(selectedItemId)
        ) || null;
    useEffect(() => {
        if (!items.length || selectedItemId) return;

        const next = new URLSearchParams(searchParams);
        next.set("itemId", items[0].Item_Id);

        setSearchParams(next, { replace: true });
    }, [items, selectedItemId]);

    // useEffect(() => {
    //     setCursor(null);
    // }, [selectedItemId, txnSearch]);
    useEffect(() => {
        itemRef.current = selectedItemId;
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

    // 🔹 items already come pre-filtered by the backend (search param), and RTK's
    //    merge() already accumulates every page — no client-side filtering needed
    const filteredItems = items;
    const handleSelectItem = (item) => {
        const next = new URLSearchParams(searchParams);

        next.set("itemId", item.Item_Id);
        next.delete("txnSearch");

        setSearchParams(next);
        //setSelectedItemMeta(item);   // 👈 add this
        setMenuOpen(null);
        setRowMenuOpen(null);
    };
    //const selectedItemMeta =items.find((it) => it.Item_Id === selectedItemId) || null;

    const fmtDate = (d) =>
        d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
            : "—";



    const handleTransactionEdit = (txn) => {
        setRowMenuOpen(null);

        if (
            txn?.Txn_Type === "Add_Adjustment" ||
            txn?.Txn_Type === "Reduce_Adjustment"
        ) {
            if (!txn?.Source_Id) {
                console.error(
                    "No Source_Id found for stock adjustment:",
                    txn
                );
                return;
            }

            setEditingAdjustment({
                ...txn,
                id: txn.Source_Id,
                Item_Id: txn.Item_Id || selectedItemId,
                Adjustment_Type:
                    txn.Adjustment_Type ||
                    (txn.Txn_Type === "Add_Adjustment"
                        ? "Add"
                        : "Reduce"),
            });

            setShowStockAdjustmentModal(true);

            return;
        }

        if (!txn?.Document_Id) {
            console.error(
                "No Document_Id found for transaction:",
                txn
            );
            return;
        }

        const navigationState = {
            from: "items-by-item",
            itemId: selectedItemId,
        };

        switch (txn.Txn_Type) {

            case "Sale":
                navigate(
                    {
                        pathname: `/sale/edit/${txn.Document_Id}`,
                        search: searchParams.toString(),
                    },
                    {
                        state: navigationState,
                    }
                );
                break;

            case "Purchase":
                navigate(
                    {
                        pathname: `/purchase/edit/${txn.Document_Id}`,
                        search: searchParams.toString(),
                    },
                    {
                        state: navigationState,
                    }
                );
                break;

            case "Sale_Return":
                navigate(
                    {
                        pathname: `/sale/return/edit/${txn.Document_Id}`,
                        search: searchParams.toString(),
                    },
                    {
                        state: navigationState,
                    }
                );
                break;

            case "Purchase_Return":
                navigate(
                    {
                        pathname: `/purchase/return/edit/${txn.Document_Id}`,
                        search: searchParams.toString(),
                    },
                    {
                        state: navigationState,
                    }
                );
                break;

            default:
                console.warn(
                    "No edit route configured for transaction type:",
                    txn.Txn_Type
                );
        }
    };

    // const handleItemAdded = (savedItem) => {
    //     setShowAddItemModal(false);

    //     if (savedItem?.Item_Id) {
    //         const next = new URLSearchParams(searchParams);

    //         next.set("itemId", savedItem.Item_Id);
    //         next.delete("q");
    //         next.delete("txnSearch");

    //         setSearchParams(next);
    //     }
    // };
    const handleItemAdded = (savedItem) => {
        setShowAddItemModal(false);

        if (savedItem?.Item_Id) {
            const next = new URLSearchParams(searchParams);
            next.set("itemId", savedItem.Item_Id);
            next.set("type", savedItem.Item_Type || itemTypeTab);  // ← keep tab in sync
            next.delete("q");
            next.delete("txnSearch");
            setSearchParams(next);
        }
    };

    const handleAdjustItem = () => {
        setEditingAdjustment(null);
        setShowStockAdjustmentModal(true);
    };
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteSale, { isLoading: isDeletingSale }] = useDeleteSaleMutation();
    const [deletePurchase, { isLoading: isDeletingPurchase }] = useDeletePurchaseMutation();
    const [deleteSaleReturn, { isLoading: isDeletingSaleReturn }] = useDeleteSaleReturnMutation();
    const [deletePurchaseReturn, { isLoading: isDeletingPurchaseReturn }] = useDeletePurchaseReturnMutation();
    const [deletePaymentIn, { isLoading: isDeletingPaymentIn }] = useDeletePaymentInMutation();
    const [deletePaymentOut, { isLoading: isDeletingPaymentOut }] = useDeletePaymentOutMutation();
    const [deleteStockAdjustment, { isLoading: isDeletingStockAdjustment }] = useDeleteStockAdjustmentMutation();
    const isDeleting =
        isDeletingSale ||
        isDeletingPurchase ||
        isDeletingSaleReturn ||
        isDeletingPurchaseReturn ||
        isDeletingPaymentIn ||
        isDeletingPaymentOut ||
        isDeletingStockAdjustment;
    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;

        try {
            let res;

            switch (deleteTarget.Txn_Type) {
                case "Sale":
                    res = await deleteSale(deleteTarget.Id).unwrap();
                    break;

                case "Purchase":
                    res = await deletePurchase(
                        deleteTarget.Id
                    ).unwrap();
                    break;

                case "Sale_Return":
                    res = await deleteSaleReturn(deleteTarget.Id).unwrap();
                    break;

                case "Purchase_Return":
                    res = await deletePurchaseReturn(deleteTarget.Id).unwrap();
                    break;

                case "Payment_In":
                    res = await deletePaymentIn(deleteTarget.Id).unwrap();
                    break;

                case "Payment_Out":
                    res = await deletePaymentOut(deleteTarget.Id).unwrap();
                    break;
                case "Add_Adjustment":
                case "Reduce_Adjustment":
                    res = await deleteStockAdjustment(deleteTarget.Id).unwrap();
                    break;

                default:
                    toast.error(
                        "Unknown transaction type — cannot delete"
                    );
                    return;
            }

            toast.success(res?.message || "Deleted successfully");

            setDeleteTarget(null);
            dispatch(partyApi.util.invalidateTags(["Party"]));

            dispatch(cashInHandApi.util.invalidateTags(["CashInHand"]));
            dispatch(
                bankAccountApi.util.invalidateTags(["BankAccount"])
            )
            dispatch(saleApi.util.invalidateTags(["Sale"]));
            dispatch(purchaseApi.util.invalidateTags(["Purchase"]));
            dispatch(
                itemApi.util.invalidateTags([
                    "Item",
                    "ItemLedger",
                ])
            );
        } catch (err) {

            console.error(
                "❌ Delete error:",
                err
            );

            toast.error(
                err?.data?.message ||
                "Failed to delete"
            );
            setDeleteTarget(null);
        }
    };
    const printRef = useRef(null);
    const [printTarget, setPrintTarget] = useState({ type: null, id: null });


    const { data: printSaleData } = useGetSingleSaleQuery(printTarget.id, {
        skip: printTarget.type !== "Sale" || !printTarget.id,
    });

    const { data: printPurchaseData } = useGetSinglePurchaseQuery(printTarget.id, {
        skip: printTarget.type !== "Purchase" || !printTarget.id,
    });

    const { data: printSaleReturnData } = useGetSaleReturnByIdQuery(printTarget.id, {
        skip: printTarget.type !== "Sale_Return" || !printTarget.id,
    });

    const { data: printPurchaseReturnData } = useGetPurchaseReturnByIdQuery(printTarget.id, {
        skip: printTarget.type !== "Purchase_Return" || !printTarget.id,
    });
    const { data: printPaymentInData } = useGetPaymentInByIdQuery(printTarget.id, {
        skip: printTarget.type !== "Payment_In" || !printTarget.id,
    });

    const { data: printPaymentOutData } = useGetPaymentOutByIdQuery(printTarget.id, {
        skip: printTarget.type !== "Payment_Out" || !printTarget.id,
    })
    const printReady =
        (printTarget.type === "Sale" && printSaleData?.invoicePartyDetails) ||
        (printTarget.type === "Purchase" && printPurchaseData?.billPurchaseDetails) ||
        (printTarget.type === "Sale_Return" && printSaleReturnData?.saleReturn) ||
        (printTarget.type === "Purchase_Return" && printPurchaseReturnData?.purchaseReturn) ||
        (printTarget.type === "Payment_In" && printPaymentInData?.paymentIn) ||
        (printTarget.type === "Payment_Out" && printPaymentOutData?.paymentOut);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: printTarget.id ? `${printTarget.type}-${printTarget.id}` : "Document",
        onAfterPrint: () => setPrintTarget({ type: null, id: null }),
    });

    useEffect(() => {
        if (printReady && printTarget.id) {
            handlePrint();
        }
    }, [printReady, printTarget.id]);
    const handlePrintClick = (row, transactionId) => {
        setPrintTarget({ type: row.Txn_Type, id: transactionId });
    };
    const isService = (liveItem?.Item_Type ?? selectedItemMeta?.Item_Type) === "Service";
    const handleConfirmDeleteItem = async () => {
        if (!deleteItemTarget) return;

        try {
            const res = await deleteItem(deleteItemTarget.Item_Id).unwrap();

            toast.success(res?.message || "Item deleted successfully");

            setDeleteItemTarget(null);

            // if the deleted item was the currently selected one, clear selection
            // so the auto-select effect picks a new first item
            if (selectedItemId === deleteItemTarget.Item_Id) {
                const next = new URLSearchParams(searchParams);
                next.delete("itemId");
                setSearchParams(next, { replace: true });
            }

            dispatch(
                itemApi.util.invalidateTags([
                    { type: "Item", id: "LIST" },
                    { type: "ItemsByCategory", id: "LIST" },
                    { type: "ItemLedger", id: "LIST" },
                ])
            );
        } catch (err) {
            console.error("❌ Delete item error:", err);
            toast.error(err?.data?.message || "Failed to delete item");
            setDeleteItemTarget(null);
        }
    };
    return (
        <>
            <div className="flex flex-col bg-white" style={{ minHeight: "100vh" }}>
                <div className="flex" style={{ borderBottom: "1px solid #f1f5f9" }}>
                    {["Product", "Service"].map((type) => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => handleTypeTabChange(type)}
                            className="flex-1 text-sm font-medium py-2.5 transition-colors"
                            style={{
                                background: "none",
                                cursor: "pointer",
                                borderBottom: itemTypeTab === type ? "2px solid #4CA1AF" : "2px solid transparent",
                                color: itemTypeTab === type ? "#4CA1AF" : "#6b7280",
                            }}
                        >
                            {type === "Product" ? "Products" : "Services"}
                        </button>
                    ))}
                </div>
                {/* ── PAGE HEADER ── */}
                <div className="inn-title">
                    <div className="flex flex-row justify-between items-center">
                        <div>
                            <h4 className="text-2xl font-bold mb-1">Items</h4>
                            <p className="text-gray-500 text-sm">Manage your items and their transactions</p>
                        </div>

                        {/* <button
                            type="button"
                            onClick={() => setShowAddItemModal(true)}
                            className="w-full sm:w-auto text-white px-4 py-2 rounded-md text-sm font-medium"
                            style={{ backgroundColor: "#4CA1AF", outline: "none", boxShadow: "none" }}
                        >
                            + Add Item
                        </button> */}
                        <button
                            type="button"
                            onClick={() => setShowAddItemModal(true)}
                            className="w-full sm:w-auto text-white px-4 py-2 rounded-md text-sm font-medium"
                            style={{ backgroundColor: "#4CA1AF", outline: "none", boxShadow: "none" }}
                        >
                            + Add {itemTypeTab === "Service" ? "Service" : "Item"}
                        </button>
                    </div>
                </div>

                {/* ── SPLIT LAYOUT ── */}
                <div
                    className="flex flex-col lg:flex-row gap-0"
                    style={{ flex: 1, borderTop: "1px solid #e2e8f0" }}
                >

                    {/* ══ LEFT — 30% — item list (now infinite scroll) ══ */}
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
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        const next = new URLSearchParams(searchParams);
                                        if (value) {
                                            next.set("q", value);
                                        } else {
                                            next.delete("q");
                                        }
                                        setSearchParams(next, { replace: true });
                                    }}
                                    placeholder="Search Item"
                                    className="border rounded-md text-sm outline-none"
                                    style={{
                                        width: "100%",
                                        height: 34,
                                        paddingLeft: 30,
                                        paddingRight: 8,
                                        borderColor: "#000000",
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
                            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Items ({totalItems})
                            </span>
                        </div>

                        {isLoading && !leftCursor ? (
                            <div className="p-10 text-center text-gray-400 text-sm">Loading...</div>
                        ) : filteredItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-10 text-gray-400 gap-2">
                                <Package size={36} strokeWidth={1.2} />
                                <p className="text-sm">No items found</p>
                            </div>
                        ) : (
                            <>
                                {filteredItems.map((item) => {
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
                                                    <p
                                                        className="font-semibold text-black truncate text-sm"
                                                        style={{ margin: 0 }}
                                                    >
                                                        {item.Item_Name}
                                                    </p>

                                                    {/* <p className="text-xs text-gray-600 truncate">
                                                        {item.Item_Category || "N/A"}
                                                    </p> */}
                                                    {item.Item_Category?.trim() && (
                                                        <p className="text-xs text-gray-600 truncate">
                                                            {item.Item_Category}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();

                                                        const next = new URLSearchParams(searchParams);
                                                        next.set("itemId", item.Item_Id);
                                                        next.delete("txnSearch");

                                                        setSearchParams(next);

                                                        setMenuOpen(
                                                            menuOpen === item.Item_Id ? null : item.Item_Id
                                                        );
                                                    }}
                                                    className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                                                    style={{ backgroundColor: "transparent" }}
                                                    title="More"
                                                >
                                                    <MoreVertical size={14} style={{ color: "#374151" }} />
                                                </button>

                                                <ChevronRight size={14} style={{ color: isSelected ? "#4CA1AF" : "#a5aab1" }} />
                                            </div>

                                            {menuOpen === item.Item_Id && (
                                                <div
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="absolute bg-white shadow-lg rounded-md"
                                                    style={{ right: 10, top: 48, width: 140, zIndex: 50, border: "1px solid #e2e8f0", overflow: "hidden" }}
                                                >
                                                    <button
                                                        className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                                                        style={{ color: "#374151" }}
                                                        onClick={() => {
                                                            setEditingItem(item);
                                                            setShowEditItemModal(true);
                                                            setMenuOpen(null);
                                                        }}
                                                    >
                                                        <SquarePen size={13} style={{ color: "#4CA1AF" }} />
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-red-50 text-sm"
                                                        title="Delete item"
                                                        style={{ cursor: "pointer", color: "#dc2626" }}
                                                        // onClick={() => {
                                                        //     console.log("Delete item:", item.Item_Id);
                                                        // }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setMenuOpen(null);
                                                            setDeleteItemTarget({ Item_Id: item.Item_Id, Item_Name: item.Item_Name });
                                                        }}

                                                    >
                                                        <Trash2 size={13} style={{ color: "#dc2626" }} />
                                                        Delete
                                                    </button>
                                                </div>
                                            )}

                                        </div>
                                    );
                                })}

                                {/* ── LEFT SENTINEL + LOADING/END INDICATORS ── */}
                                <div ref={leftSentinelRef} style={{ height: "1px" }} />

                                {isItemsFetching && leftCursor && (
                                    <div className="flex justify-center py-4">
                                        <span className="text-sm text-gray-400">Loading more...</span>
                                    </div>
                                )}

                                {!itemsHasMore && filteredItems.length > 0 && (
                                    <div className="flex justify-center py-4">
                                        <span className="text-xs text-gray-300">— End of items —</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* ══ RIGHT — 70% — detail panel ══ */}
                    <div
                        className="w-full lg:w-[70%] p-1 overflow-y-auto overflow-x-hidden"
                        style={{
                            maxHeight: "calc(100vh - 180px)",
                            minWidth: 0
                        }}
                    >
                        <div className="flex flex-col h-full">

                            {/* ── ITEM SUMMARY CARD ── */}
                            {selectedItemMeta && (
                                <div className="rounded-xl p-2 mb-2 flex flex-col gap-2">

                                    <div className="flex items-center justify-between gap-4 min-w-0">

                                        <div className="flex items-center gap-4 flex-1 min-w-0">

                                            <div
                                                className="flex items-center justify-center rounded-xl flex-shrink-0"
                                                style={{
                                                    width: 44,
                                                    height: 44,
                                                    backgroundColor: "#4CA1AF22"
                                                }}
                                            >
                                                <Package
                                                    size={22}
                                                    style={{ color: "#4CA1AF" }}
                                                />
                                            </div>

                                            <div className="min-w-0">

                                                <h6
                                                    className="font-bold text-black truncate"
                                                    style={{
                                                        fontSize: 15,
                                                        margin: 0
                                                    }}
                                                    title={
                                                        liveItem?.Item_Name ||
                                                        selectedItemMeta.Item_Name
                                                    }
                                                >
                                                    {liveItem?.Item_Name ||
                                                        selectedItemMeta.Item_Name}
                                                </h6>

                                                {/* <p className="text-gray-600 text-sm mt-0.5">
                                                    {selectedItemMeta.Item_Category || "N/A"}
                                                </p> */}
                                                {selectedItemMeta.Item_Category &&
                                                    selectedItemMeta.Item_Category.trim() !== "" && (
                                                        <p className="text-gray-600 text-sm mt-0.5">
                                                            {selectedItemMeta.Item_Category}
                                                        </p>
                                                    )}

                                            </div>

                                        </div>

                                        {itemTypeTab === "Product" && (<button
                                            type="button"
                                            onClick={handleAdjustItem}
                                            className="text-white px-4 py-2 rounded-md text-sm font-medium"
                                            style={{
                                                backgroundColor: "#4CA1AF",
                                                outline: "none",
                                                boxShadow: "none",
                                                whiteSpace: "nowrap"
                                            }}
                                        >
                                            + Adjust Item
                                        </button>)}

                                    </div>

                                    <div className="flex items-center justify-between">

                                        {/* <div>
                                            <p className="text-xs  mb-0.5" style={{ fontSize: 13, color: "#4CA1AF" }}>
                                                SALE PRICE: ₹ {fmt(liveItem?.Sale_Price ?? selectedItemMeta.Sale_Price)}
                                            </p>
                                            {!isService && (
                                                <p className="text-xs " style={{ fontSize: 13, color: "#4CA1AF" }}>
                                                    PURCHASE PRICE: ₹{" "}
                                                    {fmt(
                                                        liveItem?.Purchase_Price ??
                                                        selectedItemMeta.Purchase_Price
                                                    )}
                                                </p>
                                            )}
                                           
                                        </div> */}
                                        <div>
                                            <p className="text-xs mb-0.5" style={{ fontSize: 13 }}>
                                                SALE PRICE:{" "}
                                                <span style={{ color: "#4CA1AF" }}>
                                                    ₹ {fmt(liveItem?.Sale_Price ?? selectedItemMeta.Sale_Price)}
                                                </span>
                                            </p>

                                            {!isService && (
                                                <p className="text-xs" style={{ fontSize: 13 }}>
                                                    PURCHASE PRICE:{" "}
                                                    <span style={{ color: "#4CA1AF" }}>
                                                        ₹ {fmt(
                                                            liveItem?.Purchase_Price ??
                                                            selectedItemMeta.Purchase_Price
                                                        )}
                                                    </span>
                                                </p>
                                            )}
                                        </div>

                                        {!isService && (
                                            <div className="text-left">
                                                <p className="text-xs uppercase text-black mb-1">
                                                    Stock
                                                </p>

                                                <p
                                                    className="font-bold"
                                                    style={{
                                                        color:
                                                            (liveItem?.Stock_Quantity ??
                                                                selectedItemMeta.Stock_Quantity) < 0
                                                                ? "#dc2626"
                                                                : "#4CA1AF",
                                                        fontSize: 15,
                                                    }}
                                                >
                                                    {liveItem?.Stock_Quantity ??
                                                        selectedItemMeta.Stock_Quantity}
                                                    {" "}
                                                    {selectedItemMeta.Primary_Unit ||
                                                        selectedItemMeta.Item_Unit ||
                                                        ""}
                                                </p>
                                            </div>
                                        )}

                                        <div
                                            className="relative"
                                            style={{
                                                width: 220,
                                                minWidth: 0,
                                                maxWidth: 220,
                                                height: 36
                                            }}
                                        >

                                            <Search
                                                size={16}
                                                style={{
                                                    position: "absolute",
                                                    left: 10,
                                                    top: 10,
                                                    color: "#94a3b8",
                                                    pointerEvents: "none"
                                                }}
                                            />

                                            <input
                                                type="text"
                                                value={txnSearch}
                                                onChange={(e) => {
                                                    const value = e.target.value;

                                                    const next = new URLSearchParams(
                                                        searchParams
                                                    );

                                                    if (value) {
                                                        next.set("txnSearch", value);
                                                    } else {
                                                        next.delete("txnSearch");
                                                    }

                                                    setSearchParams(next, {
                                                        replace: true
                                                    });
                                                }}
                                                placeholder="Search"
                                                className="w-full h-full border rounded-md text-sm outline-none"
                                                style={{
                                                    width: "100%",
                                                    height: 36,
                                                    paddingLeft: 34,
                                                    paddingRight: 10,
                                                    borderColor: "#000000",
                                                    boxSizing: "border-box"
                                                }}
                                            />

                                        </div>

                                    </div>

                                </div>
                            )}

                            {/* ── ITEM LEDGER TABLE ── */}
                            <div className="table-responsive table-desi">
                                <table className="w-full min-w-[700px]">
                                    <thead>
                                        <tr>
                                            {[
                                                "Sl No.",
                                                "Date",
                                                "Bill No.",
                                                "Party",
                                                "Type",
                                                "Qty",
                                                "Price/Unit",
                                                ""
                                            ].map((h, index) => (
                                                <th
                                                    key={index}
                                                    style={{
                                                        textTransform: "uppercase",
                                                        letterSpacing: "0.05em",
                                                        whiteSpace: "nowrap"
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
                                                <td colSpan={7} className="text-center text-gray-400" style={{ padding: "48px 0" }}>
                                                    Loading...
                                                </td>
                                            </tr>
                                        ) : transactions.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="text-center text-gray-400" style={{ padding: "48px 0" }}>
                                                    No transactions to show
                                                </td>
                                            </tr>
                                        ) : (
                                            transactions.map((txn, idx) => (
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
                                                    <td>{idx + 1}.</td>
                                                    <td style={{ whiteSpace: "nowrap" }}>
                                                        {fmtDate(txn.Txn_Date)}
                                                    </td>

                                                    <td style={{ whiteSpace: "nowrap" }}>
                                                        {txn.Number || "—"}
                                                    </td>

                                                    <td>
                                                        {txn.Party_Name || "—"}
                                                    </td>

                                                    <td
                                                        style={{
                                                            color: txn.Direction === "In" ? "#16a34a" : "#dc2626",
                                                        }}
                                                    >
                                                        {txn.Txn_Type || "—"}
                                                    </td>

                                                    <td>
                                                        {fmt(txn.Quantity)}({txn.Selected_Unit})
                                                    </td>

                                                    <td>
                                                        {txn.Rate !== null
                                                            ? `₹ ${fmt(txn.Rate)}`
                                                            : "—"}
                                                    </td>

                                                    {txn.Txn_Type !== "Opening_Stock" && (
                                                        <td
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
                                                                    style={{ color: "#374151" }}
                                                                />
                                                            </button>

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
                                                                        overflow: "hidden",
                                                                    }}
                                                                >
                                                                    <button
                                                                        type="button"
                                                                        className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                                                                        style={{ color: "#374151" }}
                                                                        onClick={() => handleTransactionEdit(txn)}
                                                                    >
                                                                        <Eye size={13} style={{ color: "#4CA1AF" }} />
                                                                        View / Edit
                                                                    </button>

                                                                    {![
                                                                        "Add_Adjustment",
                                                                        "Reduce_Adjustment",
                                                                        "Opening Stock"
                                                                    ].includes(txn.Txn_Type) && (<button
                                                                        type="button"
                                                                        className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                                                                        style={{ color: "#374151" }}
                                                                        onClick={() => {
                                                                            setRowMenuOpen(null);
                                                                            handlePrintClick(txn, txn.Document_Id);
                                                                        }}
                                                                    >
                                                                        <Printer size={13} style={{ color: "#4CA1AF" }} />
                                                                        Print
                                                                    </button>)}

                                                                    <button
                                                                        type="button"
                                                                        className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-red-50 text-sm"
                                                                        title="Delete transaction"
                                                                        style={{ cursor: "pointer", color: "#dc2626" }}
                                                                        onClick={() =>
                                                                            setDeleteTarget({
                                                                                Id:
                                                                                    txn.Txn_Type === "Add_Adjustment" ||
                                                                                        txn.Txn_Type === "Reduce_Adjustment"
                                                                                        ? txn.Source_Id
                                                                                        : txn.Document_Id,
                                                                                Txn_Type: txn.Txn_Type,
                                                                            })
                                                                        }
                                                                    >
                                                                        <Trash2 size={13} style={{ color: "#dc2626" }} />
                                                                        Delete
                                                                    </button>
                                                                </div>
                                                            )}

                                                        </td>
                                                    )}
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
                    defaultItemType={itemTypeTab}   // ← add this
                    onClose={() => setShowAddItemModal(false)}
                    onSave={handleItemAdded}
                />
            )}

            {showEditItemModal && (
                <ItemModal
                    itemDetails={editingItem}
                    editingItem={true}
                    onRefreshBills={refetchBills}
                    onRefreshTab={handleTypeTabChange}
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
                    onRefresh={refetchBills}
                    onSave={() => {
                        setShowStockAdjustmentModal(false);
                        setEditingAdjustment(null);
                    }}
                />
            )}
            {deleteTarget && (
                <DeleteConfirmModal
                    title={DELETE_CONFIG[deleteTarget.Txn_Type]?.title || "Delete"}
                    message={`Are you sure you want to delete this ${DELETE_CONFIG[deleteTarget.Txn_Type]?.label || "record"
                        }? This action cannot be undone.`}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleConfirmDelete}
                    isDeleting={isDeleting}
                />
            )}
            {deleteItemTarget && (
                <DeleteConfirmModal
                    title="Delete Item"
                    message={`Are you sure you want to delete "${deleteItemTarget.Item_Name}"? This action cannot be undone.`}
                    onClose={() => setDeleteItemTarget(null)}
                    onConfirm={handleConfirmDeleteItem}
                    isDeleting={isDeletingItem}
                />
            )}
            <div style={{ display: "none" }}>

                {printTarget.type === "Sale" && printSaleData?.invoicePartyDetails && (
                    <InvoicePrintTemplate
                        ref={printRef}
                        type="sale"
                        invoice={{
                            ...printSaleData.invoicePartyDetails,
                            items: printSaleData.items || [],
                            companyDetails: {},
                        }}
                    />
                )}

                {printTarget.type === "Purchase" && printPurchaseData?.billPurchaseDetails && (
                    <InvoicePrintTemplate
                        ref={printRef}
                        type="purchase"
                        invoice={{
                            ...printPurchaseData.billPurchaseDetails,
                            items: printPurchaseData.items || [],
                            companyDetails: {},
                        }}
                    />
                )}

                {printTarget.type === "Sale_Return" && printSaleReturnData?.saleReturn && (
                    <CreditDebitNotePrintTemplate
                        ref={printRef}
                        type="credit"
                        invoice={{
                            ...printSaleReturnData.saleReturn,
                            items: printSaleReturnData.saleReturn.items || [],
                            companyDetails: {},
                        }}
                    />
                )}

                {printTarget.type === "Purchase_Return" && printPurchaseReturnData?.purchaseReturn && (
                    <CreditDebitNotePrintTemplate
                        ref={printRef}
                        type="debit"
                        invoice={{
                            ...printPurchaseReturnData.purchaseReturn,
                            items: printPurchaseReturnData.purchaseReturn.items || [],
                            companyDetails: {},
                        }}
                    />
                )}
                {printTarget.type === "Payment_In" && printPaymentInData?.paymentIn && (
                    <PaymentInOutPrintTemplate
                        ref={printRef}
                        payment={printPaymentInData.paymentIn}
                        type="in"
                    />
                )}

                {printTarget.type === "Payment_Out" && printPaymentOutData?.paymentOut && (
                    <PaymentInOutPrintTemplate
                        ref={printRef}
                        payment={printPaymentOutData.paymentOut}
                        type="out"
                    />
                )}

            </div>
        </>
    );
}