import { useMemo, useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Search,
  MoreVertical,
  SquarePen,
  ChevronRight,
  Receipt,
  Tags,
  Eye,
  Trash2,
  Copy,
  FileText,
  Printer,
  History
} from "lucide-react";

import {
  useGetAllExpenseCategoriesQuery,
  useGetExpensesByCategoryQuery,   // ✅ add
} from "../../redux/api/expenseApi";

import EditExpenseCategoryModal from "../../components/Modal/EditExpenseCategoryModal";



const fmt = (n) =>
  Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════ */
export default function ExpensesByCategories() {

  const navigate = useNavigate();
  const location = useLocation();

  const {
    data: categoryResponse,
    
  } = useGetAllExpenseCategoriesQuery();

  const categories = categoryResponse?.categories || [];
  // console.log("raw category object:", categories);

  const [selectedCategoryId, setSelectedCategoryId] = useState(null);


  const {
    data: expenseResponse,
    //isLoading: isExpensesLoading,
  } = useGetExpensesByCategoryQuery(
    { categoryId: selectedCategoryId },
    { skip: !selectedCategoryId }     // don't call until a category is selected
  );
  // console.log("Expense Response:", expenseResponse);

  const categoryExpenses = expenseResponse?.expenses || [];




  useEffect(() => {
    if (!categories.length) return;

    if (
      selectedCategoryId === null &&
      location.state?.categoryId
    ) {
      setSelectedCategoryId(location.state.categoryId);

      // Clear the state so it doesn't keep forcing the same category
      navigate(location.pathname, {
        replace: true,
        state: null,
      });

      return;
    }

    if (selectedCategoryId === null) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories, selectedCategoryId, navigate, location.pathname, location.state]);

  const [categorySearch, setCategorySearch] = useState("");
  const [txnSearch, setTxnSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(null);
  const [transactionMenu, setTransactionMenu] = useState(null);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);


  const ROW_ACTIONS = [
    {
      key: "view",
      label: "View/Edit",
      icon: Eye,
    },
    {
      key: "delete",
      label: "Delete",
      icon: Trash2,
      danger: true,
    },
    {
      key: "duplicate",
      label: "Duplicate",
      icon: Copy,
    },
    {
      key: "pdf",
      label: "Open PDF",
      icon: FileText,
    },
    {
      key: "preview",
      label: "Preview",
      icon: Eye,
    },
    {
      key: "print",
      label: "Print",
      icon: Printer,
    },
    {
      key: "history",
      label: "View History",
      icon: History,
    },
  ];


  useEffect(() => {

    const closeMenu = () => {

      setTransactionMenu(null);

      setMenuOpen(null);

    };

    document.addEventListener("click", closeMenu);

    return () =>
      document.removeEventListener(
        "click",
        closeMenu
      );

  }, []);



  const categoriesWithTotals = useMemo(() => {
    return categories.map((category) => {
      const isSelected = category.id === selectedCategoryId;
      const expensesForThisCategory = isSelected ? categoryExpenses : [];

      return {
        id: category.id,
        name: category.Category_Name,
        type:
          category.Category_Type === "Direct"
            ? "Direct Expense"
            : "Indirect Expense",
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
          party: e.Party_Name || "—",      // ⚠️ confirm field name below
          paymentType: e.Payment_Type_Display || "—", // ⚠️ confirm field name below
          amount: e.Total_Amount,
          balance: e.Balance_Due,
        })),
      };
    });
  }, [categories, categoryExpenses, selectedCategoryId]);   // ✅ new deps


  const selectedCategory =
    categoriesWithTotals.find(
      (c) => c.id === selectedCategoryId
    ) || null;

  const filteredCategories = useMemo(() => {
    return categoriesWithTotals.filter((item) =>
      item.name.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [categoriesWithTotals, categorySearch]);

  const filteredTransactions = useMemo(() => {
    if (!selectedCategory) return [];
    return selectedCategory.transactions.filter(
      (t) =>
        (t.party || "").toLowerCase().includes(txnSearch.toLowerCase()) ||
        (t.expNo || "").toLowerCase().includes(txnSearch.toLowerCase())
    );
  }, [selectedCategory, txnSearch]);

  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
      : "—";

  const handleSelectCategory = (category) => {
    setSelectedCategoryId(category.id);
    setTxnSearch("");
    setMenuOpen(null);
  };




  return (
    <>
      {/* ── BREADCRUMB ── */}
     

      <div className="flex flex-col bg-white" style={{ minHeight: "100vh" }}>

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
                  state: {
                    from: location.pathname,
                  },
                })
              }
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

          {/* ══ LEFT — 30% — category list ══ */}
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
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
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

            {/* list header */}
            <div
              className="px-4 py-3 flex items-center gap-2"
              style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#fafafa" }}
            >
              <Tags size={15} style={{ color: "#4CA1AF" }} />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Categories ({filteredCategories.length})
              </span>
            </div>

            {filteredCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-10 text-gray-400 gap-2">
                <Tags size={36} strokeWidth={1.2} />
                <p className="text-sm">No categories found</p>
              </div>
            ) : (
              filteredCategories.map((category) => {
                const isSelected =
                  selectedCategoryId === category.id;

                return (
                  <div
                    key={category.id}
                    onClick={() => handleSelectCategory(category)}

                    onDoubleClick={() => {

                      // Select the category
                      handleSelectCategory(category);

                      // Get original object from API response
                      const originalCategory = categories.find(
                        (c) => c.id === category.id
                      );

                      setEditingCategory(originalCategory);

                      setShowEditCategoryModal(true);

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
                        <Receipt size={18} style={{ color: isSelected ? "#4CA1AF" : "#94a3b8" }} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 truncate text-sm" style={{ margin: 0 }}>
                          {category.name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {category.type}
                        </p>
                      </div>
                    </div>

                    {/* right: amount + actions */}
                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                      {/* <span className="text-sm text-gray-600 mr-1">
                        ₹ {fmt(category.amount)}
                      </span> */}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();

                          // Select category immediately (Vyapar behaviour)
                          setSelectedCategoryId(category.id);

                          setTxnSearch("");

                          setMenuOpen(
                            menuOpen === category.id
                              ? null
                              : category.id
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

                    {menuOpen === category.id && (
                      <div
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

                            const originalCategory = categories.find(
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

              {/* ── CATEGORY SUMMARY CARD ── */}
              <div className="rounded-xl p-2 mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className="flex items-center justify-center rounded-xl"
                    style={{ width: 44, height: 44, backgroundColor: "#4CA1AF22" }}
                  >
                    <Receipt size={22} style={{ color: "#4CA1AF" }} />
                  </div>
                  <div>
                    <h6 className="font-bold text-gray-900" style={{ fontSize: 18, margin: 0 }}>
                      {selectedCategory?.name}
                    </h6>
                    <p className="text-gray-500 text-sm mt-0.5">
                      {selectedCategory?.type}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-xs uppercase text-gray-400 mb-1">Total</p>
                    <p className="font-bold" style={{ color: "#4CA1AF", fontSize: 18 }}>
                      ₹ {(selectedCategory?.total ?? 0).toLocaleString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs uppercase text-gray-400 mb-1">Balance</p>
                    <p
                      className="font-bold"
                      style={{
                        color: (selectedCategory?.balance ?? 0) > 0
                          ? "#dc2626"
                          : "#16a34a",
                        fontSize: 18,
                      }}
                    >
                      ₹ {(selectedCategory?.balance ?? 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── SEARCH TRANSACTIONS ── */}
              <div className="px-1 py-2" style={{ borderBottom: "1px solid #e2e8f0" }}>
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
              </div>

              {/* ── EXPENSE LEDGER TABLE ── */}
              <div className="flex-1 overflow-x-auto">
                <table className="w-full min-w-[600px]" style={{ fontSize: 13, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                      {["Date", "Exp No.", "Party", "Payment Type", "Amount", "Balance", ""].map((h, index) => (
                        <th
                          key={index}
                          className="text-left py-2 px-3 font-semibold text-gray-500"
                          style={{
                            fontSize: 11,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center text-gray-400" style={{ padding: "48px 0" }}>
                          No transactions to show
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((txn) => (
                        <tr
                          key={txn.id}
                          style={{ borderBottom: "1px solid #f1f5f9" }}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                          onDoubleClick={() => {
                            navigate(`/expense/edit/${txn.id}`, {
                              state: {
                                from: location.pathname,
                                categoryId: selectedCategoryId,
                                txnSearch,
                                categorySearch,
                              },
                            });
                          }}
                        >
                          <td className="py-2 px-3 text-gray-500" style={{ whiteSpace: "nowrap" }}>
                            {fmtDate(txn.date)}
                          </td>
                          <td className="py-2 px-3 text-gray-700">{txn.expNo || "—"}</td>
                          <td className="py-2 px-3 text-gray-700">{txn.party || "—"}</td>
                          <td className="py-2 px-3 text-gray-500">{txn.paymentType || "—"}</td>
                          <td className="py-2 px-3 font-semibold" style={{ color: "#4CA1AF", whiteSpace: "nowrap" }}>
                            ₹ {fmt(txn.amount)}
                          </td>
                          <td className="py-2 px-3" style={{ whiteSpace: "nowrap" }}>
                            ₹ {fmt(txn.balance)}
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-1">
                              <div className="relative">

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.currentTarget.blur();

                                    setTransactionMenu(
                                      transactionMenu === txn.id ? null : txn.id
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
                                              navigate(`/expense/edit/${txn.id}`, {
                                                state: {
                                                  from: location.pathname,
                                                  categoryId: selectedCategoryId,
                                                  txnSearch,
                                                  categorySearch,
                                                },
                                              });
                                            }

                                            if (key === "preview") {
                                              navigate(`/expense/preview/${txn.id}`, {
                                                state: {
                                                  from: location.pathname,
                                                  categoryId: selectedCategoryId,
                                                  txnSearch,
                                                  categorySearch,
                                                },
                                              });
                                            }

                                          }}

                                          onMouseOver={(e) =>

                                            e.currentTarget.style.backgroundColor =
                                            danger
                                              ? "#fef2f2"
                                              : "#f8fafc"

                                          }
                                          onMouseOut={(e) =>

                                            e.currentTarget.style.backgroundColor =
                                            "transparent"

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
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>
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

    </>
  );
}
