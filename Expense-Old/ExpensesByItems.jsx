import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useReactToPrint } from "react-to-print";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import {
  Search,
  MoreVertical,
  ChevronRight,
  Package,
  Eye,
  Trash2,
  Printer,

} from "lucide-react";

import EditExpenseItemModal from "../../components/Modal/EditExpenseItemModal";
import ExpensePrintTemplate from "../../components/ExpensePrintTemplate";
import DeleteConfirmModal from "../../components/Modal/DeleteConfirmModal";
import { toast } from "react-toastify";

import {
  useGetAllExpenseItemMastersCursorQuery,
  useGetExpenseItemUsageQuery,
  useGetExpenseByIdQuery,
  useDeleteExpenseMutation,
  useDeleteExpenseItemMasterMutation
} from "../../redux/api/expenseApi";

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ROW_ACTIONS = [
  { key: "view", label: "View/Edit", icon: Eye },
  { key: "delete", label: "Delete", icon: Trash2, danger: true },
  //{ key: "duplicate", label: "Duplicate", icon: Copy },
  //{ key: "pdf", label: "Open PDF", icon: FileText },
  //{ key: "preview", label: "Preview", icon: Eye },
  { key: "print", label: "Print", icon: Printer },
  //{ key: "history", label: "View History", icon: History },
];

/* ════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════ */
export default function ExpensesByItems() {

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  /* ── EXPENSE PRINT ── */
  const [printExpenseId, setPrintExpenseId] = useState(null);
  const printRef = useRef(null);

  // ── state now lives in the URL ──
  const selectedItemId = searchParams.get("itemId") || null;
  const itemSearch = searchParams.get("q") || "";
  const txnSearch = searchParams.get("txnSearch") || "";

  const [menuOpen, setMenuOpen] = useState(null);
  const [rowMenuOpen, setRowMenuOpen] = useState(null);
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  /* ── helpers for merging into existing search params ── */
  const setSelectedItemId = (id) => {
    const next = new URLSearchParams(searchParams);
    if (id === null) {
      next.delete("itemId");
    } else {
      next.set("itemId", id);
    }
    setSearchParams(next);
  };

  const handleItemSearchChange = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set("q", value);
    } else {
      next.delete("q");
    }
    setSearchParams(next, { replace: true });
  };

  const handleTxnSearchChange = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set("txnSearch", value);
    } else {
      next.delete("txnSearch");
    }
    setSearchParams(next, { replace: true });
  };

  /* ── LEFT SIDE — cursor-based infinite scroll (item list) ── */
  const [leftCursor, setLeftCursor] = useState(null);
  const leftSentinelRef = useRef(null);
  const leftObserverRef = useRef(null);

  const {
    data: itemResponse,
    isLoading: isItemsLoading,
    isFetching: isItemsFetching,
  } = useGetAllExpenseItemMastersCursorQuery({
    cursor: leftCursor,
    search: itemSearch,
    limit: 10,
  });

  const items = itemResponse?.items || [];
  const totalItems = itemResponse?.totalItems || 0;
  const itemsHasMore = itemResponse?.hasMore ?? false;
  const itemsNextCursor = itemResponse?.nextCursor ?? null;

  /* reset left cursor when item search changes */
  useEffect(() => {
    setLeftCursor(null);
  }, [itemSearch]);

  const handleLeftObserver = useCallback(
    (entries) => {
      if (
        entries[0].isIntersecting &&
        itemsHasMore &&
        itemsNextCursor &&
        !isItemsFetching &&
        !isItemsLoading
      ) {
        setLeftCursor(itemsNextCursor);
      }
    },
    [itemsHasMore, itemsNextCursor, isItemsFetching, isItemsLoading]
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

  /* ── RIGHT SIDE — cursor-based infinite scroll (transactions/usage) ── */
  const [rightCursor, setRightCursor] = useState(null);
  const rightSentinelRef = useRef(null);
  const rightObserverRef = useRef(null);

  const {
    data: usageResponse,
    isLoading: isUsageLoading,
    isFetching: isUsageFetching,
  } = useGetExpenseItemUsageQuery(
    {
      masterItemId: selectedItemId,
      cursor: rightCursor,
      search: txnSearch, // ← add
    },
    {
      skip: !selectedItemId,
    }
  );

  const [deleteExpense, { isLoading: isDeletingExpense }] =
    useDeleteExpenseMutation();

  const [deleteExpenseItem, { isLoading: isDeletingExpenseItem }] =
    useDeleteExpenseItemMasterMutation();

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      /* =====================================================
         DELETE EXPENSE ITEM MASTER
      ===================================================== */
      if (deleteTarget.type === "item") {

        // Reset left-side pagination
        setLeftCursor(null);

        const res = await deleteExpenseItem({
          id: deleteTarget.itemId,
        }).unwrap();

        toast.success(
          res?.message || "Expense item deleted successfully"
        );

        // If the deleted item was selected,
        // clear selection so another item can be selected.
        if (
          String(selectedItemId) ===
          String(deleteTarget.itemId)
        ) {
          setSelectedItemId(null);
        }

        setMenuOpen(null);
        setDeleteTarget(null);

        return;
      }

      /* =====================================================
         DELETE EXPENSE TRANSACTION
      ===================================================== */
      setRightCursor(null);

      const res = await deleteExpense({
        id: deleteTarget.expenseId,
      }).unwrap();

      toast.success(
        res?.message || "Expense deleted successfully"
      );

      setDeleteTarget(null);

    } catch (error) {
      console.error("Failed to delete:", error);

      toast.error(
        error?.data?.message ||
        "Failed to delete. Please try again."
      );

      // Close the confirmation modal even when deletion fails
      setDeleteTarget(null);

    }
  };

  /* ── EXPENSE PRINT DATA ── */

  const {
    data: printExpenseData,
    isFetching: isPrintExpenseFetching,
  } = useGetExpenseByIdQuery(printExpenseId, {
    skip: !printExpenseId,
  });

  const handlePrint = useReactToPrint({
    contentRef: printRef,

    documentTitle: printExpenseId
      ? `Expense-${printExpenseId}`
      : "Expense",

    onAfterPrint: () => {
      setPrintExpenseId(null);
    },
  });

  useEffect(() => {
    if (
      printExpenseData?.expense &&
      printExpenseId &&
      !isPrintExpenseFetching
    ) {
      handlePrint();
    }
  }, [
    printExpenseData,
    printExpenseId,
    isPrintExpenseFetching,
    handlePrint,
  ]);


  const itemUsage = usageResponse?.usage || [];

  const usageHasMore = usageResponse?.hasMore ?? false;
  const usageNextCursor = usageResponse?.nextCursor ?? null;

  /* reset right cursor when selected item changes */
  useEffect(() => {
    setRightCursor(null);
  }, [selectedItemId, txnSearch]);

  const handleRightObserver = useCallback(
    (entries) => {
      if (
        entries[0].isIntersecting &&
        usageHasMore &&
        usageNextCursor &&
        !isUsageFetching &&
        !isUsageLoading
      ) {
        setRightCursor(usageNextCursor);
      }
    },
    [usageHasMore, usageNextCursor, isUsageFetching, isUsageLoading]
  );

  useEffect(() => {
    if (rightObserverRef.current) {
      rightObserverRef.current.disconnect();
    }

    rightObserverRef.current = new IntersectionObserver(handleRightObserver, {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
    });

    if (rightSentinelRef.current) {
      rightObserverRef.current.observe(rightSentinelRef.current);
    }

    return () => rightObserverRef.current?.disconnect();
  }, [handleRightObserver]);

  /* ── auto-select first item / restore from navigation state ── */
  useEffect(() => {
    if (!items.length) return;

    if (!selectedItemId && location.state?.itemId) {
      setSelectedItemId(location.state.itemId);

      navigate(location.pathname + location.search, {
        replace: true,
        state: null,
      });

      return;
    }

    if (!selectedItemId) {
      setSelectedItemId(items[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, selectedItemId, navigate, location.pathname, location.state]);

  useEffect(() => {
    const closeMenus = () => {
      setMenuOpen(null);
      setRowMenuOpen(null);
    };

    document.addEventListener("click", closeMenus);

    return () => {
      document.removeEventListener("click", closeMenus);
    };
  }, []);

  /* items no longer need client-side name filtering — search now
     happens server-side via the cursor query's `search` param */
  const itemsWithTotals = useMemo(() => {
    return items.map((item) => {
      const isSelected = String(item.id) === String(selectedItemId);
      const usageForThisItem = isSelected ? itemUsage : [];

      return {
        id: item.id,
        name: item.Item_Name,
        amount: 0,
        total: usageForThisItem.reduce(
          (sum, u) => sum + Number(u.Amount || 0),
          0
        ),
        balance: usageForThisItem.reduce(
          (sum, u) => sum + Number(u.Balance_Due || 0),
          0
        ),
        transactions: usageForThisItem.map((u) => ({
          id: u.id,                    // expense item/usage ID
          expenseId: u.Expense_Id,     // actual expense ID
          date: u.Expense_Date,
          expNo: u.Expense_Number,
          party: u.Party_Name || "—",
          paymentType: u.Payment_Type_Display || "—",
          amount: u.Amount,
          balance: u.Balance_Due,
        })),
      };
    });
  }, [items, itemUsage, selectedItemId]);

  const selectedItem =
    itemsWithTotals.find((it) => String(it.id) === String(selectedItemId)) || itemsWithTotals[0];

  /* transaction search still client-side filters the currently-loaded
     page(s) of usage rows — server-side date filter is separate (date param) */
  // const filteredTransactions = useMemo(() => {
  //   if (!selectedItem) return [];
  //   return selectedItem.transactions.filter(
  //     (t) =>
  //       (t.party || "").toLowerCase().includes(txnSearch.toLowerCase()) ||
  //       (t.expNo || "").toLowerCase().includes(txnSearch.toLowerCase())
  //   );
  // }, [selectedItem, txnSearch]);
  const filteredTransactions =
    selectedItem?.transactions || [];

  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
      : "—";

  // const handleSelectItem = (item) => {
  //   setSelectedItemId(item.id);
  //   handleTxnSearchChange("");
  //   setMenuOpen(null);
  //   setRowMenuOpen(null);
  // };
  const handleSelectItem = (item) => {
    const next = new URLSearchParams(searchParams);
    next.set("itemId", item.id);
    next.delete("txnSearch");
    setSearchParams(next);

    setMenuOpen(null);
    setRowMenuOpen(null);
  };

  return (
    <>
      <div className="flex flex-col bg-white" style={{ minHeight: "100vh" }}>

        {/* ── PAGE HEADER ── */}
        <div className="inn-title">
          <div className="flex flex-row justify-between items-center">
            <div>
              <h4 className="text-2xl font-bold mb-1">Expenses By Items</h4>
              <p className="text-gray-500 text-sm">Manage your expense items and their transactions</p>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate("/expense/add", {
                  state: {
                    from: location.pathname,
                  },
                })}
              className="text-white px-4 py-2 rounded-md text-sm font-medium"
              style={{
                backgroundColor: "#4CA1AF",
                outline: "none",
                boxShadow: "none",
              }}
            >
              + Add Expense
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
                  style={{
                    position: "absolute",
                    left: 9,
                    top: 10,
                    color: "#94a3b8",
                    pointerEvents: "none",
                  }}
                />
                <input
                  type="text"
                  value={itemSearch}
                  onChange={(e) => handleItemSearchChange(e.target.value)}
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
                Items ({totalItems})
              </span>
            </div>

            {isItemsLoading ? (
              <div className="p-4 text-gray-400 text-sm">Loading items...</div>
            ) : itemsWithTotals.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-10 text-gray-400 gap-2">
                <Package size={36} strokeWidth={1.2} />
                <p className="text-sm">No items found</p>
              </div>
            ) : (
              <>
                {itemsWithTotals.map((item) => {
                  const isSelected = String(selectedItemId) === String(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectItem(item)}

                      onDoubleClick={() => {

                        handleSelectItem(item);

                        const originalItem = items.find(
                          (i) => i.id === item.id
                        );

                        setEditingItem(originalItem);

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
                      {/* left: icon + name */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className="flex items-center justify-center rounded-lg flex-shrink-0"
                          style={{
                            width: 36,
                            height: 36,
                            backgroundColor: isSelected ? "#4CA1AF22" : "#f1f5f9",
                          }}
                        >
                          <Package size={18} style={{ color: isSelected ? "#4CA1AF" : "#94a3b8" }} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 truncate text-sm" style={{ margin: 0 }}>
                            {item.name}
                          </p>
                        </div>
                      </div>

                      {/* right: actions */}
                      <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();

                            const next = new URLSearchParams(searchParams);
                            next.set("itemId", item.id);
                            next.delete("txnSearch");
                            setSearchParams(next);

                            setMenuOpen(
                              menuOpen === item.id ? null : item.id
                            );
                          }}
                          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                          style={{ backgroundColor: "transparent" }}
                          title="More"
                        >
                          <MoreVertical size={14} style={{ color: "#94a3b8" }} />
                        </button>

                        <ChevronRight
                          size={14}
                          style={{ color: isSelected ? "#4CA1AF" : "#cbd5e1" }}
                        />
                      </div>

                      {menuOpen === item.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute bg-white shadow-lg rounded-md"
                          style={{
                            right: 10,
                            top: 48,
                            width: 140,
                            zIndex: 50,
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          <button
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                            onClick={() => {

                              const originalItem = items.find(
                                (i) => i.id === item.id
                              );

                              setEditingItem(originalItem);

                              setShowEditItemModal(true);

                              setMenuOpen(null);

                            }}
                          >
                            View/Edit
                          </button>

                          <button
                            className="w-full text-left px-4 py-2 hover:bg-red-50 text-sm text-red-500"
                            onClick={() => {
                              setDeleteTarget({
                                type: "item",
                                itemId: item.id,
                                itemName: item.name,
                              });

                              setMenuOpen(null);
                            }}
                          >
                            Delete
                          </button>

                        </div>
                      )}
                    </div>
                  );
                })}

                {/* ── SENTINEL + LOADING INDICATOR (LEFT) ── */}
                <div ref={leftSentinelRef} style={{ height: "1px" }} />

                {isItemsFetching && leftCursor && (
                  <div className="flex justify-center py-3">
                    <span className="text-xs text-gray-400">Loading more...</span>
                  </div>
                )}

                {!itemsHasMore && itemsWithTotals.length > 0 && (
                  <div className="flex justify-center py-3">
                    <span className="text-xs text-gray-300">— End of items —</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ══ RIGHT — 70% — detail panel ══ */}
          <div
            className="w-full lg:w-[70%] p-1 overflow-y-auto"
            style={{ maxHeight: "calc(100vh - 180px)" }}
          >
            <div className="flex flex-col h-full">

              {/* ── ITEM SUMMARY CARD ── */}
              {selectedItem && (
                <div className="rounded-xl p-2 mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="flex items-center justify-center rounded-xl"
                      style={{ width: 44, height: 44, backgroundColor: "#4CA1AF22" }}
                    >
                      <Package size={22} style={{ color: "#4CA1AF" }} />
                    </div>
                    <div>
                      <h6 className="font-bold text-gray-900" style={{ fontSize: 18, margin: 0 }}>
                        {selectedItem?.name}
                      </h6>
                      <p className="text-gray-500 text-sm mt-0.5">
                        Expense Item
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-xs uppercase text-gray-400 mb-1">Total</p>
                      <p className="font-bold" style={{ color: "#4CA1AF", fontSize: 18 }}>
                        ₹ {(selectedItem?.total ?? 0).toLocaleString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs uppercase text-gray-400 mb-1">Balance</p>
                      <p
                        className="font-bold"
                        style={{
                          color: (selectedItem?.balance ?? 0) > 0 ? "#dc2626" : "#16a34a",
                          fontSize: 18,
                        }}
                      >
                        ₹ {(selectedItem?.balance ?? 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── SEARCH TRANSACTIONS + EXPORT BUTTONS ── */}
              <div
                className="px-1 py-2"
                style={{
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <div className="flex items-center justify-between gap-3">

                  {/* SEARCH */}
                  <div
                    className="relative"
                    style={{
                      width: "40%",
                      minWidth: 220,
                      maxWidth: 300,
                      height: 36,
                    }}
                  >
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
                      onChange={(e) => handleTxnSearchChange(e.target.value)}
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

                  {/* EXCEL + PRINT BUTTONS */}
                  <div className="flex items-center gap-2">

                    {/* EXCEL */}
                    {/* <button
                      type="button"
                      className="group flex items-center gap-2 rounded-lg bg-emerald-50 px-3.5 py-2 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200 transition-all duration-200 hover:bg-emerald-100 hover:ring-emerald-300 active:scale-95"
                      title="Export to Excel"
                    >
                      <FileSpreadsheet
                        size={16}
                        strokeWidth={2.2}
                        className="text-emerald-600 transition-transform duration-200 group-hover:scale-110"
                      />
                    </button> */}

                    {/* PRINT */}
                    {/* <button
                      type="button"
                      className="group flex items-center gap-2 rounded-lg bg-blue-50 px-3.5 py-2 text-sm font-medium text-blue-700 ring-1 ring-blue-200 transition-all duration-200 hover:bg-blue-100 hover:ring-blue-300 active:scale-95"
                      title="Print Reports"
                    >
                      <PrinterIcon
                        size={16}
                        strokeWidth={2.2}
                        className="text-blue-600 transition-transform duration-200 group-hover:scale-110"
                      />
                    </button> */}

                  </div>

                </div>
              </div>

              {/* ── EXPENSE LEDGER TABLE ── */}
              <div className="table-responsive table-desi">
                <table className="w-full h-full min-w-[700px]" >
                  <thead>
                    <tr >
                      {["Date", "Exp No.", "Party", "Payment Type", "Amount", "Balance", ""].map((h) => (
                        <th
                          key={h}
                          //className="text-left py-2 px-3 "
                          style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isUsageLoading && !rightCursor ? (
                      <tr>
                        <td colSpan={7} className="text-center" style={{ padding: "48px 0" }}>
                          Loading...
                        </td>
                      </tr>
                    ) : filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center" style={{ padding: "48px 0" }}>
                          No transactions to show
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((txn) => (

                        <tr
                          key={txn.id}
                          style={{
                            borderBottom: "1px solid #f1f5f9",
                            position: "relative",
                            cursor: "pointer",
                          }}
                          //style={{ borderBottom: "1px solid #f1f5f9" }}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"

                          onDoubleClick={() => {
                            navigate(
                              {
                                pathname: `/expense/edit/${txn.expenseId}`,
                                search: searchParams.toString(),
                              },
                              {
                                state: {
                                  from: "expense-items",
                                  itemId: selectedItemId,
                                  txnSearch,
                                  itemSearch,
                                },
                              }
                            );
                          }}

                        >
                          <td style={{ whiteSpace: "nowrap" }}>
                            {fmtDate(txn.date)}
                          </td>
                          <td >{txn.expNo || "—"}</td>
                          <td >{txn.party || "—"}</td>
                          <td >{txn.paymentType || "—"}</td>
                          <td style={{ color: "#4CA1AF", whiteSpace: "nowrap" }}>
                            ₹ {fmt(txn.amount)}
                          </td>
                          <td style={{ whiteSpace: "nowrap" }}>
                            ₹ {fmt(txn.balance)}
                          </td>
                          <td style={{ position: "relative" }}>
                            <button
                              type="button"
                              onClick={(e) => {

                                e.stopPropagation();

                                setRowMenuOpen(
                                  rowMenuOpen === txn.id
                                    ? null
                                    : txn.id
                                );

                              }}
                              className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                              style={{ backgroundColor: "transparent" }}
                              title="More"
                            >
                              <MoreVertical size={14} style={{ color: "#94a3b8" }} />
                            </button>

                            {rowMenuOpen === txn.id && (
                              <div
                                className="absolute bg-white shadow-lg rounded-md"
                                style={{
                                  right: 10,
                                  top: 66,
                                  width: 160,
                                  zIndex: 50,
                                  border: "1px solid #e2e8f0",
                                  overflow: "hidden",
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {ROW_ACTIONS.map(({ key, label, icon: Icon, danger }) => (
                                  <button
                                    key={key}
                                    className="w-full text-left px-3 py-2 text-sm flex items-center gap-2"
                                    style={{ color: danger ? "#dc2626" : "#374151" }}
                                    onClick={async () => {
                                      setRowMenuOpen(null);

                                      if (key === "view") {
                                        navigate(
                                          {
                                            pathname: `/expense/edit/${txn.expenseId}`,
                                            search: searchParams.toString(),
                                          },
                                          {
                                            state: {
                                              from: "expense-items",
                                              itemId: selectedItemId,
                                              txnSearch,
                                              itemSearch,
                                            },
                                          }
                                        );
                                      }

                                      if (key === "delete") {
                                        setDeleteTarget({
                                          expenseId: txn.expenseId,
                                        });

                                        return;
                                      }

                                      if (key === "print") {
                                        setPrintExpenseId(txn.expenseId);
                                      }
                                    }}
                                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = danger ? "#fef2f2" : "#f8fafc")}
                                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                  >
                                    <Icon size={13} style={{ color: danger ? "#dc2626" : "#4CA1AF" }} />
                                    {label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* ── SENTINEL + LOADING INDICATOR (RIGHT) ── */}
                <div ref={rightSentinelRef} style={{ height: "1px" }} />

                {isUsageFetching && rightCursor && (
                  <div className="flex justify-center py-4">
                    <span className="text-sm text-gray-400">Loading more...</span>
                  </div>
                )}

                {!usageHasMore && itemUsage.length > 0 && (
                  <div className="flex justify-center py-4">
                    <span className="text-xs text-gray-300">— End of transactions —</span>
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>
      </div>

      {showEditItemModal && (
        <EditExpenseItemModal
          item={editingItem}
          onClose={() => {
            setShowEditItemModal(false);
            setEditingItem(null);
          }}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          title={
            deleteTarget.type === "item"
              ? "Delete Expense Item"
              : "Delete Expense"
          }
          message={
            deleteTarget.type === "item"
              ? `Are you sure you want to delete "${deleteTarget.itemName}"? This action cannot be undone.`
              : "Are you sure you want to delete this expense? This action cannot be undone."
          }
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          isDeleting={
            deleteTarget.type === "item"
              ? isDeletingExpenseItem
              : isDeletingExpense
          }
        />
      )}

      {/* ── EXPENSE PRINT TEMPLATE ── */}
      {printExpenseData?.expense && (
        <div
          style={{
            position: "absolute",
            left: "-99999px",
            top: 0,
          }}
        >
          <ExpensePrintTemplate
            ref={printRef}
            expense={printExpenseData.expense}
          />
        </div>
      )}

    </>
  );
}