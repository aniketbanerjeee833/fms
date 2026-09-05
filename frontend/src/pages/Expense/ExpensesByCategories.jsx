import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import {  useNavigate, useLocation, useSearchParams } from "react-router-dom";
import {
  
  Search,
  MoreVertical,
  
  ChevronRight,
  Receipt,
  Tags,
  Eye,
  Trash2,
  Printer,
 
} from "lucide-react";

import ExpensePrintTemplate from "../../components/ExpensePrintTemplate";
import DeleteConfirmModal from "../../components/Modal/DeleteConfirmModal";
import { toast } from "react-toastify";

import {
  useGetAllExpenseCategoriesQuery,
  useGetExpensesByCategoryQuery,
  useGetExpenseByIdQuery,
  useDeleteExpenseMutation,
  useDeleteExpenseCategoryMutation
} from "../../redux/api/expenseApi";

import EditExpenseCategoryModal from "../../components/Modal/EditExpenseCategoryModal";
import VirtualScrollList from "../../components/VirtualScrollList";



const fmt = (n) =>
  Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════ */
export default function ExpensesByCategories() {
  const ROW_ACTIONS = [
    { key: "view", label: "View/Edit", icon: Eye },
    { key: "delete", label: "Delete", icon: Trash2, danger: true },
    { key: "print", label: "Print", icon: Printer },
  ];

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  /* ── EXPENSE PRINT ── */
  const [printExpenseId, setPrintExpenseId] = useState(null);
  const printRef = useRef(null);

  // ── state now lives in the URL, same pattern as ExpensesByItems ──
  const selectedCategoryId = searchParams.get("categoryId") || null;
  const categorySearch = searchParams.get("q") || "";
  const txnSearch = searchParams.get("txnSearch") || "";

  const [menuOpen, setMenuOpen] = useState(null);
  const [transactionMenu, setTransactionMenu] = useState(null);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  /* ── helpers for merging into existing search params ── */
  const setSelectedCategoryId = (id) => {
    const next = new URLSearchParams(searchParams);
    if (id === null) {
      next.delete("categoryId");
    } else {
      next.set("categoryId", id);
    }
    setSearchParams(next);
  };

  const handleCategorySearchChange = (value) => {
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

  const { data: categoryResponse } = useGetAllExpenseCategoriesQuery();
  const categories = categoryResponse?.categories || [];

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

  /* ── RIGHT SIDE — cursor-based infinite scroll (transactions) ── */
  const [rightCursor, setRightCursor] = useState(null);
  //const rightSentinelRef = useRef(null);
  //const rightObserverRef = useRef(null);
  const initialRightLimit = useRef(
            Number(sessionStorage.getItem("expensesByCategory:rightCount")) || 10
        );
    // const categoryRef = useRef(selectedCategoryId);
    
    // const effectiveCursor = categoryRef.current === selectedCategoryId ? rightCursor : null;

  const {
    data: expenseResponse,
    isLoading: isExpensesLoading,
    isFetching: isExpensesFetching,
  } = useGetExpensesByCategoryQuery(
    {
      categoryId: selectedCategoryId,
    
      cursor: rightCursor,
      search: txnSearch,
       limit: initialRightLimit.current
    },
    {
      skip: !selectedCategoryId,
    }
  );

  const categoryExpenses = expenseResponse?.expenses || [];
  const expensesHasMore = expenseResponse?.hasMore ?? false;
  const expensesNextCursor = expenseResponse?.nextCursor ?? null;


const handleRightLoadMore = useCallback(() => {
  if (
    isExpensesFetching ||
    isExpensesLoading ||
    !expensesHasMore ||
    !expensesNextCursor
  ) {
    return;
  }

  setRightCursor(expensesNextCursor);
}, [
  isExpensesFetching,
  isExpensesLoading,
  expensesHasMore,
  expensesNextCursor,
]);
  const [deleteExpense, { isLoading: isDeletingExpense }] =
    useDeleteExpenseMutation();

  const [deleteExpenseCategory, { isLoading: isDeletingCategory }] =
    useDeleteExpenseCategoryMutation();

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      // DELETE CATEGORY
      if (deleteTarget.type === "category") {
        const res = await deleteExpenseCategory({
          id: deleteTarget.categoryId,
        }).unwrap();

        toast.success(
          res?.message || "Expense category deleted successfully"
        );

        // If deleted category was selected, clear it
        if (
          String(selectedCategoryId) ===
          String(deleteTarget.categoryId)
        ) {
          setSelectedCategoryId(null);
        }

        setMenuOpen(null);
        setDeleteTarget(null);

        return;
      }

      // DELETE EXPENSE
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

      // Close modal even when deletion fails
      setDeleteTarget(null);
    }
  };

  const categoriesWithTotals = useMemo(() => {
    return categories.map((category) => {
      const isSelected = String(category.id) === String(selectedCategoryId);
      const expensesForThisCategory = isSelected ? categoryExpenses : [];

      return {
        id: category.id,
        name: category.Category_Name,
        type: category.Category_Type === "Direct" ? "Direct Expense" : "Indirect Expense",
        amount: Number(category.Total_Spent) || 0,
        total: Number(category.Total_Spent) || 0,
        balance: expensesForThisCategory.reduce(
          (sum, e) => sum + Number(e.Balance_Due || 0),
          0
        ),
        transactions: expensesForThisCategory.map((e) => ({
          id: e.id,
          date: e.Expense_Date,
          expNo: e.Expense_Number,
          party: e.Party_Name || "—",
          paymentType: e.Payment_Type_Display || "—",
          amount: e.Total_Amount,
          balance: e.Balance_Due,
        })),
      };
    });
  }, [categories, categoryExpenses, selectedCategoryId]);

  const selectedCategory =
    categoriesWithTotals.find((c) => String(c.id) === String(selectedCategoryId)) ||
    categoriesWithTotals[0];

  const filteredTransactions = selectedCategory?.transactions || [];
  const isHighlighted = (expenseId) => String(searchParams.get("highlightTxn")) === String(expenseId);
  // 🔹 left side stays CLIENT-SIDE filtered — no server search param for categories
  const filteredCategories = useMemo(() => {
    return categoriesWithTotals.filter((item) =>
      item.name.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [categoriesWithTotals, categorySearch]);

  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
      : "—";

  const handleSelectCategory = (category) => {
    const next = new URLSearchParams(searchParams);
    next.set("categoryId", category.id);
    next.delete("txnSearch");
    setSearchParams(next);

    setMenuOpen(null);
  };

  /* ── auto-select first category / restore from navigation state ── */
  useEffect(() => {
    if (!categories.length) return;

    if (!selectedCategoryId && location.state?.categoryId) {
      setSelectedCategoryId(location.state.categoryId);

      navigate(location.pathname + location.search, {
        replace: true,
        state: null,
      });

      return;
    }

    if (!selectedCategoryId) {
      setSelectedCategoryId(categories[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, selectedCategoryId, navigate, location.pathname, location.state]);

  /* reset right cursor when selected category or txn search changes */
  //  useEffect(() => {
  //         // categoryRef.current = selectedCategoryId;
  //         setRightCursor(null);
  //     }, [selectedCategoryId, txnSearch]);
  // useEffect(() => {
  //   setRightCursor(null);
  // }, [selectedCategoryId, txnSearch]);

  // const handleRightObserver = useCallback(
  //   (entries) => {
  //     if (
  //       entries[0].isIntersecting &&
  //       expensesHasMore &&
  //       expensesNextCursor &&
  //       !isExpensesFetching &&
  //       !isExpensesLoading
  //     ) {
  //       setRightCursor(expensesNextCursor);
  //     }
  //   },
  //   [expensesHasMore, expensesNextCursor, isExpensesFetching, isExpensesLoading]
  // );

  // useEffect(() => {
  //   if (rightObserverRef.current) {
  //     rightObserverRef.current.disconnect();
  //   }

  //   rightObserverRef.current = new IntersectionObserver(handleRightObserver, {
  //     root: null,
  //     rootMargin: "0px",
  //     threshold: 0.1,
  //   });

  //   if (rightSentinelRef.current) {
  //     rightObserverRef.current.observe(rightSentinelRef.current);
  //   }

  //   return () => rightObserverRef.current?.disconnect();
  // }, [handleRightObserver]);

  useEffect(() => {
    const closeMenu = () => {
      setTransactionMenu(null);
      setMenuOpen(null);
    };

    document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, []);

    
    //     const rightPanelRef = useRef(null);
   
    // const highlightedRowRef = useRef(null);
    //     useEffect(() => {
            
    //         const rightEl = rightPanelRef.current;
    
            
    //         const saveRight = () => {
    //             console.log("saveRight fired", rightEl.scrollTop, filteredTransactions.length);
    //             sessionStorage.setItem("expensesByCategory:rightScroll", rightEl.scrollTop);
    //             sessionStorage.setItem("expensesByCategory:rightCount", filteredTransactions.length);
    //             // sessionStorage.setItem("expensesByCategory:rightScroll", rightEl.scrollTop);
    //             // sessionStorage.setItem("expensesByCategory:rightCount", transactions.length);
    //         };
    
            
    //         rightEl?.addEventListener("scroll", saveRight);
    
    //         return () => {

    //             rightEl?.removeEventListener("scroll", saveRight);
    //         };
    //     }, [categories.length, filteredTransactions.length]);
    
    
    
    
    
    
  //   const hasRestoredRightRef = useRef(false);
  //  const [isRestoringRight, setIsRestoringRight] = useState(true);


  //   useLayoutEffect(() => {
  //     if (hasRestoredRightRef.current) {
  //       setIsRestoringRight(false);
  //       return;
  //     }
  //     if (isExpensesLoading || isExpensesFetching) return;
  
  //     const savedCount = Number(sessionStorage.getItem("expensesByCategory:rightCount")) || 0;
  //     // keep waiting only if we might still get more data
  //     if (filteredTransactions.length < savedCount && expensesHasMore) return;
  
  //     highlightedRowRef.current?.scrollIntoView({ block: "center", behavior: "auto" });
  //     hasRestoredRightRef.current = true;
  //     setIsRestoringRight(false); // reveal now, correctly positioned
  //   }, [isExpensesLoading, isExpensesFetching, filteredTransactions.length, expensesHasMore]);
  
  const virtualLeftListRef = useRef(null);
const hasScrolledToSelectedRef = useRef(false);

useEffect(() => {
  if (hasScrolledToSelectedRef.current) return;
  if (!selectedCategoryId || !categories.length) return;

  const targetIndex = categories.findIndex(
    (category) =>
      String(category.id) === String(selectedCategoryId)
  );

  if (targetIndex === -1) return;

  virtualLeftListRef.current?.scrollToIndex(targetIndex, {
    align: "center",
    behavior: "auto",
  });

  hasScrolledToSelectedRef.current = true;
}, [categories, selectedCategoryId]);

useEffect(() => {
  hasScrolledToSelectedRef.current = false;
}, [selectedCategoryId]);
  const virtualRightListRef = useRef(null);
const hasScrolledToHighlightRef = useRef(false);

const highlightTxnId = searchParams.get("highlightTxn");

useEffect(() => {
  hasScrolledToHighlightRef.current = false;
}, [selectedCategoryId, highlightTxnId, txnSearch]);

useEffect(() => {
  if (hasScrolledToHighlightRef.current) return;
  if (!highlightTxnId) return;
  if (isExpensesLoading || isExpensesFetching) return;
  if (!filteredTransactions.length) return;

  const targetIndex = filteredTransactions.findIndex(
    (txn) =>
      String(txn.id) === String(highlightTxnId)
  );

  if (targetIndex === -1) {
    if (
      expensesHasMore &&
      expensesNextCursor &&
      !isExpensesFetching
    ) {
      handleRightLoadMore();
    }

    return;
  }

  const timer = setTimeout(() => {
    virtualRightListRef.current?.scrollToIndex(
      targetIndex,
      {
        align: "center",
        behavior: "auto",
      }
    );

    hasScrolledToHighlightRef.current = true;
  }, 100);

  return () => clearTimeout(timer);
}, [
  filteredTransactions,
  highlightTxnId,
  isExpensesLoading,
  isExpensesFetching,
  expensesHasMore,
  expensesNextCursor,
  handleRightLoadMore,
]);
useEffect(() => {
  sessionStorage.setItem(
    "expensesByCategory:rightCount",
    filteredTransactions.length
  );
}, [filteredTransactions.length]);
  return (
    <>
      <div className="flex flex-col bg-white"
      style={{ height: "100vh",overflow: "hidden" }}
        //style={{ minHeight: "100vh" }}
    //      style={{
    //  height: "100vh",
    //   //minHeight: 0,
    //   overflow: "hidden",
    // }}
      >

        {/* ── PAGE HEADER ── */}
        <div className="inn-title">
          <div className="flex flex-row justify-between items-center">
            <div>
              <h4 className="text-2xl font-bold mb-1">Expenses By Categories</h4>
              <p className="text-gray-500 text-sm">Manage your expense categories and items</p>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate("/expense/add", {
                  state: { from: location.pathname },
                })
              }
              className="text-white px-4 py-2 rounded-md"
              style={{ backgroundColor: "#4CA1AF", outline: "none", boxShadow: "none" }}
            >
              + Add Expense
            </button>
          </div>
        </div>

        {/* ── SPLIT LAYOUT ── */}
        <div
          className="flex flex-col lg:flex-row gap-0"
          style={{ flex: 1,  minHeight: 0, 
            overflowY: "auto",
             borderTop: "1px solid #e2e8f0" }}
        >

          {/* ══ LEFT — 30% — category list (client-side filtered) ══ */}
          {/* */}
         <div
  className="w-full lg:w-[30%] flex flex-col flex-none lg:h-auto"
  style={{
    borderRight: "1px solid #e2e8f0",
    minHeight: 0,
    boxSizing: "border-box",
  }}
>
  {/* SEARCH */}
  <div
    className="p-3"
    style={{
      borderBottom: "1px solid #f1f5f9",
      boxSizing: "border-box",
      flexShrink: 0,
    }}
  >
    <div
      className="relative"
      style={{
        width: "100%",
        maxWidth: 180,
        height: 34,
      }}
    >
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
        value={categorySearch}
        onChange={(e) => handleCategorySearchChange(e.target.value)}
        placeholder="Search Category"
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

  {/* LIST HEADER */}
  <div
    className="px-4 py-3 flex items-center gap-2"
    style={{
      borderBottom: "1px solid #f1f5f9",
      backgroundColor: "#fafafa",
      flexShrink: 0,
    }}
  >
    <Tags size={15} style={{ color: "#4CA1AF" }} />

    <span className="text-xs font-semibold uppercase tracking-wider">
      Categories ({filteredCategories.length})
    </span>
  </div>

  {/* VIRTUAL CATEGORY LIST */}
  <div
    style={{
      flex: 1,
      minHeight: 0,
      overflow: "hidden",
      position: "relative",
    }}
  >
    <VirtualScrollList
      ref={virtualLeftListRef}
      items={filteredCategories}
      rowHeight={64}
      height="100%"
      getItemKey={(category) => category.id}
      emptyMessage="No categories found"
      endMessage="— End of categories —"
      renderRow={(category) => {
        const isSelected =
          String(selectedCategoryId) === String(category.id);

        return (
          <div
            key={category.id}
            onClick={() => handleSelectCategory(category)}
            onDoubleClick={() => {
              handleSelectCategory(category);

              const originalCategory = categories.find(
                (c) => c.id === category.id
              );

              setEditingCategory(originalCategory);
              setShowEditCategoryModal(true);
              setMenuOpen(null);
            }}
            className="relative flex items-center justify-between px-4 py-3 cursor-pointer transition-colors"
            style={{
              minHeight: 64,
              boxSizing: "border-box",
              backgroundColor: isSelected
                ? "#f0f9ff"
                : "transparent",
              borderLeft: isSelected
                ? "3px solid #4CA1AF"
                : "3px solid transparent",
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className="flex items-center justify-center rounded-lg flex-shrink-0"
                style={{
                  width: 36,
                  height: 36,
                  backgroundColor: isSelected
                    ? "#4CA1AF22"
                    : "#f1f5f9",
                }}
              >
                <Receipt
                  size={18}
                  style={{
                    color: isSelected
                      ? "#4CA1AF"
                      : "#94a3b8",
                  }}
                />
              </div>

              <div className="min-w-0">
                <p
                  className="font-semibold text-gray-800 truncate text-sm"
                  style={{ margin: 0 }}
                >
                  {category.name}
                </p>

                <p className="text-xs text-gray-400 truncate">
                  {category.type}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();

                  const next = new URLSearchParams(searchParams);
                  next.set("categoryId", category.id);
                  next.delete("txnSearch");

                  setSearchParams(next);

                  setMenuOpen(
                    menuOpen === category.id
                      ? null
                      : category.id
                  );
                }}
                className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                style={{
                  backgroundColor: "transparent",
                }}
                title="More"
              >
                <MoreVertical
                  size={14}
                  style={{ color: "#94a3b8" }}
                />
              </button>

              <ChevronRight
                size={14}
                style={{
                  color: isSelected
                    ? "#4CA1AF"
                    : "#cbd5e1",
                }}
              />
            </div>

            {menuOpen === category.id && (
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
                  type="button"
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    const originalCategory =
                      categories.find(
                        (c) => c.id === category.id
                      );

                    setEditingCategory(originalCategory);
                    setShowEditCategoryModal(true);
                    setMenuOpen(null);
                  }}
                >
                  View/Edit
                </button>

                <button
                  type="button"
                  className="w-full px-4 py-3 text-left text-sm hover:bg-red-50 text-red-500 transition-colors"
                  onClick={() => {
                    setDeleteTarget({
                      type: "category",
                      categoryId: category.id,
                      categoryName: category.name,
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
      }}
    />
  </div>
</div>

          {/* ══ RIGHT — 70% — detail panel ══ */}
          {/* <div 
          className="w-full lg:w-[70%] p-1"
            // style={{ maxHeight: "calc(100vh - 180px)" }}
           
           style={{
              maxHeight: "calc(100vh - 180px)",
              minHeight: 0,      // 👈 add this
              minWidth: 0
            }}
          > */}
            <div className="w-full lg:w-[70%] p-1 flex-none lg:flex-1 h-auto"
                        style={{
                            minHeight: 0,
                            display: "flex",
                            flexDirection: "column",
                            minWidth: 0,
                            
                        }}
                    >
            {/* <div className="flex flex-col"
               style={{
                height: "100%",

                minHeight: 0,
                overflow: "hidden",
              }}
            > */}

              {/* ── CATEGORY SUMMARY CARD ── */}
             
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">

                {/* Category Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="flex items-center justify-center rounded-xl flex-shrink-0"
                    style={{
                      width: 44,
                      height: 44,
                      backgroundColor: "#4CA1AF22"
                    }}
                  >
                    <Receipt
                      size={22}
                      style={{ color: "#4CA1AF" }}
                    />
                  </div>

                  <div className="min-w-0">
                    <h6
                      className="font-bold text-gray-900 break-words"
                      style={{
                        fontSize: 18,
                        margin: 0
                      }}
                    >
                      {selectedCategory?.name}
                    </h6>

                    <p className="text-gray-500 text-sm mt-0.5">
                      {selectedCategory?.type}
                    </p>
                  </div>
                </div>

                {/* Total + Balance */}
                <div className="flex items-center gap-6 text-right shrink-0">

                  {/* Total */}
                  <div>
                    <p className="text-xs uppercase text-gray-400 mb-1">
                      Total
                    </p>

                    <p
                      className="font-bold"
                      style={{
                        color: "#4CA1AF",
                        fontSize: 18
                      }}
                    >
                      ₹ {(selectedCategory?.total ?? 0).toLocaleString()}
                    </p>
                  </div>

                  {/* Balance */}
                  <div>
                    <p className="text-xs uppercase text-gray-400 mb-1">
                      Balance
                    </p>

                    <p
                      className="font-bold"
                      style={{
                        color:
                          (selectedCategory?.balance ?? 0) > 0
                            ? "#dc2626"
                            : "#16a34a",
                        fontSize: 18
                      }}
                    >
                      ₹ {(selectedCategory?.balance ?? 0).toLocaleString()}
                    </p>
                  </div>

                </div>

              </div>

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
 
  {/* RIGHT HEADER */}
  <div
    style={{
      display: "grid",
      gridTemplateColumns:
        "0.6fr 1.1fr 1.2fr 2.8fr 1.3fr 1.3fr 1.3fr 50px",
      width: "100%",
      //minWidth: "850px",
      boxSizing: "border-box",
      alignItems: "center",
      minHeight: 40,
      padding: "0 8px",
      flexShrink: 0,
      borderBottom: "2px solid #e2e8f0",
      fontWeight: 600,
      fontSize: 13,
      color: "#333",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    }}
  >
    <div>Sl.No</div>
    <div>Date</div>
    <div>Exp No.</div>
    <div>Party</div>
    <div>Payment Type</div>
    <div>Amount</div>
    <div>Balance</div>
    <div style={{
                                position: "sticky",
                                right: 0,

                            }} />
  </div>

  {/* RIGHT VIRTUAL LIST */}
              <div
  style={{
    flex: 1,
    minHeight: 0,
    //height: 0,
    overflow: "hidden",
    position: "relative",
  }}
>
  <VirtualScrollList
    ref={virtualRightListRef}
    items={filteredTransactions}
    rowHeight={48}
    height="100%"
    onLoadMore={handleRightLoadMore}
    isFetching={isExpensesFetching}
    hasMore={expensesHasMore}
    dynamicHeight={true}
    getItemKey={(txn) => txn.id}
    emptyMessage="No transactions to show"
    endMessage="— End of transactions —"
    isRowActive={(txn) => isHighlighted(txn.id)}
    renderRow={(txn, idx) => (
      <div
        key={txn.id}
        onClick={() => {
          const params = new URLSearchParams(searchParams);

          params.set(
            "highlightTxn",
            String(txn.id)
          );

          setSearchParams(params, {
            replace: true,
          });
        }}
        onDoubleClick={() => {
          const params = new URLSearchParams(searchParams);

          params.set(
            "highlightTxn",
            String(txn.id)
          );

          navigate(
            {
              pathname: `/expense/edit/${txn.id}`,
              search: params.toString(),
            },
            {
              state: {
                from: "expense-categories",
                categoryId: selectedCategoryId,
                txnSearch,
                categorySearch,
              },
            }
          );
        }}
        style={{
          display: "grid",
          gridTemplateColumns:
            "0.6fr 1.1fr 1.2fr 2.8fr 1.3fr 1.3fr 1.3fr 50px",
          //minWidth: "850px",
          width: "100%",
          minHeight: 48,
          boxSizing: "border-box",
          alignItems: "center",
          padding: "0 8px",
          borderBottom: "1px solid #f1f5f9",
          position: "relative",
          cursor: "pointer",
          backgroundColor: isHighlighted(txn.id)
            ? "#4CA1AF22"
            : "transparent",
        }}
        className="hover:bg-gray-50 transition-colors"
      >
        <div className="table-desi-cell">
          {idx + 1}.
        </div>

        <div
          className="table-desi-cell"
          style={{ whiteSpace: "nowrap" }}
        >
          {fmtDate(txn.date)}
        </div>

        <div className="table-desi-cell">
          {txn.expNo || "—"}
        </div>

        <div className="table-desi-cell"
         style={{
            overflowWrap: "break-word",
            wordBreak: "break-word",
             padding: "0 5px"
  }}
        >
          {txn.party || "—"}
        </div>

        <div lassName="table-desi-cell"
          style={{
           overflowWrap: "break-word",
             wordBreak: "break-word",
              padding: "0 5px"
          }}
        >
          {txn.paymentType || "—"}
        </div>

        <div lassName="table-desi-cell"
          style={{
            color: "#4CA1AF",
            whiteSpace: "nowrap",
          }}
        >
          ₹ {fmt(txn.amount)}
        </div>

        <div style={{ whiteSpace: "nowrap" }}>
          ₹ {fmt(txn.balance)}
        </div>

        {/* MENU */}
        <div>
          <div className="py-2 px-2 table-desi-cell">
            <div 
            style={{
                position: "sticky",   // 👈 was "relative", now sticky
                 right: 0,              // 👈 pins to the right edge of the SCROLL viewport
                 width: 50,
                  //position: "relative",
                     //width: 50,
                     textAlign: "center",
                     }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.currentTarget.blur();

                  setTransactionMenu(
                    transactionMenu === txn.id
                      ? null
                      : txn.id
                  );
                }}
                className="p-1.5 rounded-md hover:bg-gray-100 focus:outline-none"
                style={{
                  background: "transparent",
                  boxShadow: "none",
                }}
              >
                <MoreVertical
                  size={14}
                  style={{ color: "#94a3b8" }}
                />
              </button>

              {transactionMenu === txn.id && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-8 bg-white rounded-lg shadow-xl border overflow-hidden"
                  style={{
                    width: 180,
                    zIndex: 999,
                    borderColor: "#e5e7eb",
                  }}
                >
                  {ROW_ACTIONS.map(
                    ({
                      key,
                      label,
                      icon: Icon,
                      danger,
                    }) => (
                      <button
                        key={key}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm flex items-center gap-2"
                        style={{
                          color: danger
                            ? "#dc2626"
                            : "#374151",
                        }}
                        onClick={() => {
                          setTransactionMenu(null);

                          if (key === "view") {
                            const params =
                              new URLSearchParams(
                                searchParams
                              );

                            params.set(
                              "highlightTxn",
                              String(txn.id)
                            );

                            navigate(
                              {
                                pathname: `/expense/edit/${txn.id}`,
                                search: params.toString(),
                              },
                              {
                                state: {
                                  from: "expense-categories",
                                  categoryId:
                                    selectedCategoryId,
                                  txnSearch,
                                  categorySearch,
                                },
                              }
                            );
                          }

                          if (key === "delete") {
                            setDeleteTarget({
                              type: "expense",
                              expenseId: txn.id,
                            });

                            return;
                          }

                          if (key === "print") {
                            setPrintExpenseId(txn.id);
                          }
                        }}
                        onMouseOver={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            danger
                              ? "#fef2f2"
                              : "#f8fafc")
                        }
                        onMouseOut={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            "transparent")
                        }
                      >
                        <Icon
                          size={13}
                          style={{
                            color: danger
                              ? "#dc2626"
                              : "#4CA1AF",
                          }}
                        />
                        {label}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )}
  />
</div>

            {/* </div> */}
          </div>

        </div>
      </div>

      {showEditCategoryModal && (
        <EditExpenseCategoryModal
          category={editingCategory}
          onClose={() => {
            setShowEditCategoryModal(false);
            setEditingCategory(null);
          }}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          title={
            deleteTarget.type === "category"
              ? "Delete Expense Category"
              : "Delete Expense"
          }
          message={
            deleteTarget.type === "category"
              ? `Are you sure you want to delete "${deleteTarget.categoryName}"? This action cannot be undone.`
              : "Are you sure you want to delete this expense? This action cannot be undone."
          }
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          isDeleting={
            deleteTarget.type === "category"
              ? isDeletingCategory
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

//  <div className="w-full lg:w-[30%] flex flex-col flex-none   lg:h-auto "
//           // w-full lg:w-[30%] overflow-y-auto
//             // style={{
//             //   borderRight: "1px solid #e2e8f0",
//             //   minHeight: "500px",
//             //   maxHeight: "calc(100vh - 180px)",
//             //   //borderRight: "1px solid #e2e8f0",
//             //   //height: "100%",
//             //   //minHeight: 0,
//             //   //boxSizing: "border-box",
//             // }}
//              style={{
//                             borderRight: "1px solid #e2e8f0",
//                             minHeight: 0,
//                             boxSizing: "border-box",
//                             overflowY: "auto",
//                         }}
//           >
//             {/* search */}
//             <div className="p-3" style={{ borderBottom: "1px solid #f1f5f9", boxSizing: "border-box" }}>
//               <div className="relative" style={{ width: "100%", maxWidth: 180, height: 34 }}>
//                 <Search
//                   size={14}
//                   style={{ position: "absolute", left: 9, top: 10, color: "#94a3b8", pointerEvents: "none" }}
//                 />
//                 <input
//                   type="text"
//                   value={categorySearch}
//                   onChange={(e) => handleCategorySearchChange(e.target.value)}
//                   placeholder="Search Category"
//                   className="border rounded-md text-sm outline-none"
//                   style={{
//                     width: "100%",
//                     height: 34,
//                     paddingLeft: 30,
//                     paddingRight: 8,
//                     borderColor: "#dbe3ea",
//                     boxSizing: "border-box",
//                   }}
//                 />
//               </div>
//             </div>

//             {/* list header */}
//             <div
//               className="px-4 py-3 flex items-center gap-2"
//               style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#fafafa" }}
//             >
//               <Tags size={15} style={{ color: "#4CA1AF" }} />
//               <span className="text-xs font-semibold  uppercase tracking-wider">
//                 Categories ({filteredCategories.length})
//               </span>
//             </div>

//             {filteredCategories.length === 0 ? (
//               <div className="flex flex-col items-center justify-center p-10 text-gray-400 gap-2">
//                 <Tags size={36} strokeWidth={1.2} />
//                 <p className="text-sm">No categories found</p>
//               </div>
//             ) : (
//               filteredCategories.map((category) => {
//                 const isSelected = String(selectedCategoryId) === String(category.id);

//                 return (
//                   <div
//                     key={category.id}
//                     onClick={() => handleSelectCategory(category)}
//                     onDoubleClick={() => {
//                       handleSelectCategory(category);

//                       const originalCategory = categories.find((c) => c.id === category.id);
//                       setEditingCategory(originalCategory);
//                       setShowEditCategoryModal(true);
//                       setMenuOpen(null);
//                     }}
//                     className="relative flex items-center justify-between px-4 py-3 cursor-pointer transition-colors"
//                     style={{
//                       backgroundColor: isSelected ? "#f0f9ff" : "transparent",
//                       borderLeft: isSelected ? "3px solid #4CA1AF" : "3px solid transparent",
//                       borderBottom: "1px solid #f1f5f9",
//                     }}
//                   >
//                     <div className="flex items-center gap-3 flex-1 min-w-0">
//                       <div
//                         className="flex items-center justify-center rounded-lg flex-shrink-0"
//                         style={{ width: 36, height: 36, backgroundColor: isSelected ? "#4CA1AF22" : "#f1f5f9" }}
//                       >
//                         <Receipt size={18} style={{ color: isSelected ? "#4CA1AF" : "#94a3b8" }} />
//                       </div>
//                       <div className="min-w-0">
//                         <p className="font-semibold text-gray-800 truncate text-sm" style={{ margin: 0 }}>
//                           {category.name}
//                         </p>
//                         <p className="text-xs text-gray-400 truncate">{category.type}</p>
//                       </div>
//                     </div>

//                     <div className="flex items-center gap-1 ml-2 flex-shrink-0">
//                       <button
//                         type="button"
//                         onClick={(e) => {
//                           e.stopPropagation();

//                           const next = new URLSearchParams(searchParams);
//                           next.set("categoryId", category.id);
//                           next.delete("txnSearch");
//                           setSearchParams(next);

//                           setMenuOpen(menuOpen === category.id ? null : category.id);
//                         }}
//                         className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
//                         style={{ backgroundColor: "transparent" }}
//                         title="More"
//                       >
//                         <MoreVertical size={14} style={{ color: "#94a3b8" }} />
//                       </button>

//                       <ChevronRight size={14} style={{ color: isSelected ? "#4CA1AF" : "#cbd5e1" }} />
//                     </div>

//                     {menuOpen === category.id && (
//                       <div
//                         onClick={(e) => e.stopPropagation()}
//                         className="absolute bg-white shadow-lg rounded-md"
//                         style={{ right: 10, top: 48, width: 140, zIndex: 50, border: "1px solid #e2e8f0" }}
//                       >
//                         <button
//                           type="button"
//                           className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
//                           onClick={() => {
//                             const originalCategory = categories.find((c) => c.id === category.id);
//                             setEditingCategory(originalCategory);
//                             setShowEditCategoryModal(true);
//                             setMenuOpen(null);
//                           }}
//                         >
//                           View/Edit
//                         </button>

//                         <button
//                           type="button"
//                           className="w-full px-4 py-3 text-left text-sm hover:bg-red-50 text-red-500 transition-colors"
//                           onClick={() => {
//                             setDeleteTarget({
//                               type: "category",
//                               categoryId: category.id,
//                               categoryName: category.name,
//                             });

//                             setMenuOpen(null);
//                           }}
//                         >
//                           Delete
//                         </button>

//                       </div>
//                     )}
//                   </div>
//                 );
//               })
//             )}
//           </div>


//  <div ref={rightPanelRef} className="table-responsive table-desi"
//                 // style={{
//                 //   flex: 1,
//                 //   minHeight: 0,
//                 //   overflowY: "auto",
//                 // }}
//                 style={{

//                   flex: 1,
//                   minHeight: 0,
//                   overflowY: "auto",
//                   visibility: isRestoringRight ? "hidden" : "visible",
//                   // if using the placeholder above, also collapse height so it doesn't take double space
//                   // ...(isRestoringRight ? { position: "absolute", height: 0, overflow: "hidden" } : {}),
//                 }}
//               >
//                 <table className="w-full min-w-[600px]">
//                   <thead>
//                     <tr>
//                       {["Sl.No", "Date", "Exp No.", "Party", "Payment Type", "Amount", "Balance", ""].map((h, index) => (
//                         <th
//                           key={index}
//                           className="text-left py-2 px-3"
//                           style={{ textTransform: "uppercase", letterSpacing: "0.05em",whiteSpace: "nowrap" }}
//                         >
//                           {h}
//                         </th>
//                       ))}
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {isExpensesLoading && !rightCursor ? (
//                       <tr>
//                         <td colSpan={7} className="text-center" style={{ padding: "48px 0" }}>
//                           Loading...
//                         </td>
//                       </tr>
//                     ) : filteredTransactions.length === 0 ? (
//                       <tr>
//                         <td colSpan={7} className="text-center text-gray-400" style={{ padding: "48px 0" }}>
//                           No transactions to show
//                         </td>
//                       </tr>
//                     ) : (
//                       filteredTransactions.map((txn,idx) => (
                        
//                         <tr
//                           key={txn.id}
//                            ref={isHighlighted ? highlightedRowRef : null}

//                           onClick={() => {
//                             const params = new URLSearchParams(searchParams);

//                             params.set(
//                               "highlightTxn",
//                               String(txn.id)
//                             );

//                             setSearchParams(params, { replace: true });
//                           }}

//                           onDoubleClick={() => {
//                             const params = new URLSearchParams(searchParams);

//                             params.set(
//                               "highlightTxn",
//                               String(txn.id)
//                             );

//                             navigate(
//                               {
//                                 pathname: `/expense/edit/${txn.id}`,
//                                 search: params.toString(),
//                               },
//                               {
//                                 state: {
//                                   from: "expense-categories",
//                                   categoryId: selectedCategoryId,
//                                   txnSearch,
//                                   categorySearch,
//                                 },
//                               }
//                             );
//                           }}

//                           style={{
//                             borderBottom: "1px solid #f1f5f9",
//                             position: "relative",
//                             cursor: "pointer",

//                             backgroundColor: isHighlighted(txn.id)
//                               ? "#4CA1AF22"
//                               : "transparent",
//                           }}

//                           className="hover:bg-gray-50 transition-colors cursor-pointer"
//                         >
//                           <td>{idx + 1}.</td>
//                           <td className="py-2 px-3 text-gray-500" style={{ whiteSpace: "nowrap" }}>
//                             {fmtDate(txn.date)}
//                           </td>
//                           <td>{txn.expNo || "—"}</td>
//                           <td>{txn.party || "—"}</td>
//                           <td>{txn.paymentType || "—"}</td>
//                           <td style={{ color: "#4CA1AF", whiteSpace: "nowrap" }}>₹ {fmt(txn.amount)}</td>
//                           <td style={{ whiteSpace: "nowrap" }}>₹ {fmt(txn.balance)}</td>
//                           <td>
//                             <div className="flex items-center gap-1">
//                               <div className="relative">
//                                 <button
//                                   type="button"
//                                   onClick={(e) => {
//                                     e.stopPropagation();
//                                     e.currentTarget.blur();
//                                     setTransactionMenu(transactionMenu === txn.id ? null : txn.id);
//                                   }}
//                                   className="p-1.5 rounded-md hover:bg-gray-100 focus:outline-none"
//                                   style={{ background: "transparent", boxShadow: "none" }}
//                                 >
//                                   <MoreVertical size={14} style={{ color: "#94a3b8" }} />
//                                 </button>

//                                 {transactionMenu === txn.id && (
//                                   <div
//                                     onClick={(e) => e.stopPropagation()}
//                                     className="absolute right-0 top-8 bg-white rounded-lg shadow-xl border overflow-hidden"
//                                     style={{ width: 180, zIndex: 999, borderColor: "#e5e7eb" }}
//                                   >
//                                     {ROW_ACTIONS.map(({ key, label, icon: Icon, danger }) => (
//                                       <button
//                                         key={key}
//                                         type="button"
//                                         className="w-full text-left px-3 py-2 text-sm flex items-center gap-2"
//                                         style={{ color: danger ? "#dc2626" : "#374151" }}

//                                         onClick={() => {
//                                           setTransactionMenu(null);

//                                           // if (key === "view") {
//                                           //   navigate(
//                                           //     {
//                                           //       pathname: `/expense/edit/${txn.id}`,
//                                           //       search: searchParams.toString(),
//                                           //     },
//                                           //     {
//                                           //       state: {
//                                           //         from: "expense-categories",
//                                           //         categoryId: selectedCategoryId,
//                                           //         txnSearch,
//                                           //         categorySearch,
//                                           //       },
//                                           //     }
//                                           //   );
//                                           // }
//                                           if (key === "view") {
//                                             const params = new URLSearchParams(searchParams);

//                                             params.set(
//                                               "highlightTxn",
//                                               String(txn.id)
//                                             );

//                                             navigate(
//                                               {
//                                                 pathname: `/expense/edit/${txn.id}`,
//                                                 search: params.toString(),
//                                               },
//                                               {
//                                                 state: {
//                                                   from: "expense-categories",
//                                                   categoryId: selectedCategoryId,
//                                                   txnSearch,
//                                                   categorySearch,
//                                                 },
//                                               }
//                                             );
//                                           }

//                                           if (key === "delete") {
//                                             setDeleteTarget({
//                                               type: "expense",
//                                               expenseId: txn.id,
//                                             });

//                                             return;
//                                           }

//                                           if (key === "print") {
//                                             setPrintExpenseId(txn.id);
//                                           }
//                                         }}
//                                         onMouseOver={(e) => (e.currentTarget.style.backgroundColor = danger ? "#fef2f2" : "#f8fafc")}
//                                         onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
//                                       >
//                                         <Icon size={13} style={{ color: danger ? "#dc2626" : "#4CA1AF" }} />
//                                         {label}
//                                       </button>
//                                     ))}
//                                   </div>
//                                 )}
//                               </div>
//                             </div>
//                           </td>
//                         </tr>
//                       ))
//                     )}
//                   </tbody>
//                 </table>

//                 {/* ── SENTINEL + LOADING INDICATOR (RIGHT) ── */}
//                 <div ref={rightSentinelRef} style={{ height: "1px" }} />

//                 {isExpensesFetching && rightCursor && (
//                   <div className="flex justify-center py-4">
//                     <span className="text-sm text-gray-400">Loading more...</span>
//                   </div>
//                 )}

//                 {!expensesHasMore && categoryExpenses.length > 0 && (
//                   <div className="flex justify-center py-4">
//                     <span className="text-xs text-gray-300">— End of transactions —</span>
//                   </div>
//                 )}
//               </div>