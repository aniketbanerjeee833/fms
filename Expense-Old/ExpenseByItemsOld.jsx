import { useMemo, useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Search,
  MoreVertical,
  ChevronRight,
  Package,
  Eye,
  Trash2,
  Copy,
  FileText,
  Printer,
  History,
} from "lucide-react";

import {
  useGetAllExpenseItemMastersQuery,
  useGetExpenseItemUsageQuery
} from "../../redux/api/expenseApi";

import EditExpenseItemModal from "../../components/Modal/EditExpenseItemModal";



const fmt = (n) =>
  Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* row-action menu options, mapped to icons */
const ROW_ACTIONS = [
  { key: "view", label: "View/Edit", icon: Eye },
  { key: "delete", label: "Delete", icon: Trash2, danger: true },
  { key: "duplicate", label: "Duplicate", icon: Copy },
  { key: "pdf", label: "Open PDF", icon: FileText },
  { key: "preview", label: "Preview", icon: Eye },
  { key: "print", label: "Print", icon: Printer },
  { key: "history", label: "View History", icon: History },
];

/* ════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════ */
export default function ExpensesByItems() {

  const navigate = useNavigate();
  const location = useLocation();

  const {
    data: itemResponse,
    //isLoading,
    //error,
  } = useGetAllExpenseItemMastersQuery();

  // console.log("itemResponse:", itemResponse);
  // console.log("itemError:", error);

  const items = itemResponse?.items || [];
  const [selectedItemId, setSelectedItemId] = useState(null);
  const {
    data: usageResponse,
    //isLoading: isUsageLoading,
  } = useGetExpenseItemUsageQuery(
    { masterItemId: selectedItemId },
    { skip: !selectedItemId }
  );

  const itemUsage = usageResponse?.usage || [];

  // console.log("usageResponse:", usageResponse);
  // console.log("itemUsage", itemUsage);

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
      setSelectedItemId(items[0].id);
    }
  }, [
    items,
    selectedItemId,
    navigate,
    location.pathname,
    location.state,
  ]);

  const [itemSearch, setItemSearch] = useState("");
  const [txnSearch, setTxnSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(null);
  const [rowMenuOpen, setRowMenuOpen] = useState(null);
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

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


  const itemsWithTotals = useMemo(() => {
    return items.map((item) => {
      const isSelected = item.id === selectedItemId;
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
          id: u.id,
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
    itemsWithTotals.find((it) => it.id === selectedItemId) || itemsWithTotals[0];

  const filteredItems = useMemo(() => {
    return itemsWithTotals.filter((it) =>
      it.name.toLowerCase().includes(itemSearch.toLowerCase())
    );
  }, [itemsWithTotals, itemSearch]);

  const filteredTransactions = useMemo(() => {
    if (!selectedItem) return [];
    return selectedItem.transactions.filter(
      (t) =>
        (t.party || "").toLowerCase().includes(txnSearch.toLowerCase()) ||
        (t.expNo || "").toLowerCase().includes(txnSearch.toLowerCase())
    );
  }, [selectedItem, txnSearch]);

  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
      : "—";

  const handleSelectItem = (item) => {
    setSelectedItemId(item.id);
    setTxnSearch("");
    setMenuOpen(null);
    setRowMenuOpen(null);
  };


  return (
    <>
      {/* ── BREADCRUMB ── */}


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

            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-10 text-gray-400 gap-2">
                <Package size={36} strokeWidth={1.2} />
                <p className="text-sm">No items found</p>
              </div>
            ) : (
              filteredItems.map((item) => {
                const isSelected =
                  selectedItemId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectItem(item)}

                    onDoubleClick={() => {

                      // Select the item
                      handleSelectItem(item);

                      // Get original object from API response
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

                    {/* right: amount + actions */}
                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                      {/* <span className="text-sm text-gray-600 mr-1">
                        ₹ {fmt(item.amount)}
                      </span> */}

                      <button
                        type="button"
                        onClick={(e) => {

                          e.stopPropagation();

                          // Select immediately (Vyapar behaviour)
                          setSelectedItemId(item.id);

                          setTxnSearch("");

                          setMenuOpen(
                            menuOpen === item.id
                              ? null
                              : item.id
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
                        <button className="w-full text-left px-4 py-2 hover:bg-red-50 text-sm text-red-500">
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
              <div className="flex-1 overflow-x-auto" style={{ position: "relative" }}>
                <table className="w-full min-w-[600px]" style={{ fontSize: 13, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                      {["Date", "Exp No.", "Party", "Payment Type", "Amount", "Balance", ""].map((h) => (
                        <th
                          key={h}
                          className="text-left py-2 px-3 font-semibold text-gray-500"
                          style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}
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
                                itemId: selectedItemId,
                                txnSearch,
                                itemSearch,
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
                          <td className="py-2 px-3" style={{ position: "relative" }}>
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
                                  top: 36,
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
                                    onClick={() => {
                                      setRowMenuOpen(null);

                                      if (key === "view") {
                                        navigate(`/expense/edit/${txn.id}`, {
                                          state: {
                                            from: location.pathname,
                                            itemId: selectedItemId,
                                            txnSearch,
                                            itemSearch,
                                          },
                                        });
                                      }
                                      if (key === "preview") {
                                        navigate(`/expense/preview/${txn.id}`, {
                                          state: {
                                            from: location.pathname,
                                            itemId: selectedItemId,
                                            txnSearch,
                                            itemSearch,
                                          },
                                        });
                                      }
                                      if (key === "print") {
                                        const url = `/expense/preview/${txn.id}?autoPrint=1`;
                                        window.open(url, "_blank");
                                      }
                                      // if (key === "print") {
                                      //   navigate(`/expense/preview/${txn.id}`, {
                                      //     state: {
                                      //       from: location.pathname,
                                      //       itemId: selectedItemId,
                                      //       txnSearch,
                                      //       itemSearch,
                                      //       autoPrint: true,
                                      //     },
                                      //   });
                                      // }
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

    </>
  );
}
