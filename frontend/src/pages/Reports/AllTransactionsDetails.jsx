import { useState, useEffect, useRef, useMemo, forwardRef } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { useReactToPrint } from "react-to-print";
import { Eye, MoreVertical, Printer, PrinterIcon, Trash2, Undo2 } from "lucide-react";

import { useGetDayWiseTransactionsDetailsQuery } from "../../redux/api/reportApi";
import { useDeleteSaleMutation, useGetSingleSaleQuery } from "../../redux/api/saleApi";
import { useDeletePurchaseMutation, useGetSinglePurchaseQuery } from "../../redux/api/purchaseApi";
import { useDeleteSaleReturnMutation, useGetSaleReturnByIdQuery } from "../../redux/api/saleReturnApi";
import { useDeletePurchaseReturnMutation, useGetPurchaseReturnByIdQuery } from "../../redux/api/purchaseReturnApi";
import { itemApi } from "../../redux/api/itemApi";

import DeleteConfirmModal from "../../components/Modal/DeleteConfirmModal";
import InvoicePrintTemplate from "../../components/InvoicePrintTemplate";
import CreditDebitNotePrintTemplate from "../../components/CreditDebitNotePrintTemplate";
import VirtualScrollList from "../../components/VirtualScrollList";
import { useGetPaymentInByIdQuery } from "../../redux/api/paymentInApi";
import { useGetPaymentOutByIdQuery } from "../../redux/api/paymentOutApi";

/* ------------------------------------------------------------------ */
/*  TRANSACTION TYPE CONFIG                                            */
/*  One object per type. Adjust field names / routes to your schema.   */
/*  - responseKey : key inside data.transactions from the backend      */
/*  - canReturn   : shows "Return" in the 3-dot menu (sale/purchase)   */
/*  - printMode   : "sale" | "purchase" use the invoice template;      */
/*                  "generic" prints a simple slip built from the row  */
/*  - hasBalance  : shows Balance column value                         */
/* ------------------------------------------------------------------ */
const TXN_TYPES = [
  {
    key: "sales",
    label: "Sale",
    plural: "Sales",
    color: "#16a34a",
    idOf: (r) => r.Sale_Id ?? r.id,
    numberOf: (r) => r.Invoice_Number,
    amountOf: (r) => r.Total_Amount,
    balanceOf: (r) => r.Balance_Due,
    hasBalance: true,
    canReturn: true,
    printMode: "sale",
    editPath: (id) => `/sale/edit/${id}`,
    returnPath: (id) => `/sale/return/add/${id}`,
    deleteMessage: "Are you sure you want to delete this sale invoice? This action cannot be undone.",
  },
  {
    key: "purchases",
    label: "Purchase",
    plural: "Purchases",
    color: "#dc2626",
    idOf: (r) => r.Purchase_Id ?? r.id,
    numberOf: (r) => r.Bill_Number,
    amountOf: (r) => r.Total_Amount,
    balanceOf: (r) => r.Balance_Due,
    hasBalance: true,
    canReturn: true,
    printMode: "purchase",
    editPath: (id) => `/purchase/edit/${id}`,
    returnPath: (id) => `/purchase/return/add/${id}`,
    deleteMessage: "Are you sure you want to delete this purchase bill? This action cannot be undone.",
  },
  {
    key: "saleReturns",
    label: "Sale Return",
    plural: "Sale Returns",
    color: "#ea580c",
    idOf: (r) => r.Return_Id ?? r.Sale_Return_Id ?? r.id,
    numberOf: (r) => r.Return_Number ?? r.Credit_Note_Number,
    amountOf: (r) => r.Total_Amount,
    hasBalance: false,
    canReturn: false,
    printMode: "saleReturn",
    editPath: (id) => `/sale/return/edit/${id}`,
    deleteMessage: "Are you sure you want to delete this sale return?",
  },
  {
    key: "purchaseReturns",
    label: "Purchase Return",
    plural: "Purchase Returns",
    color: "#9333ea",
    idOf: (r) => r.Return_Id ?? r.Purchase_Return_Id ?? r.id,
    numberOf: (r) => r.Return_Number ?? r.Debit_Note_Number,
    amountOf: (r) => r.Total_Amount,
    hasBalance: false,
    canReturn: false,
    printMode: "purchaseReturn",
    editPath: (id) => `/purchase/return/edit/${id}`,
    deleteMessage: "Are you sure you want to delete this purchase return?",
  },
  {
    key: "paymentIns",
    label: "Payment In",
    plural: "Payments In",
    color: "#2563eb",
    idOf: (r) => r.Payment_Id ?? r.id,
    numberOf: (r) => r.Receipt_Number ?? r.Payment_Number,
    amountOf: (r) => r.Amount ?? r.Total_Amount,
    hasBalance: false,
    canReturn: false,
    printMode: "generic",
    editPath: (id) => `/payment-in/edit/${id}`,
    deleteMessage: "Are you sure you want to delete this payment-in entry?",
  },
  {
    key: "paymentOuts",
    label: "Payment Out",
    plural: "Payments Out",
    color: "#db2777",
    idOf: (r) => r.Payment_Id ?? r.id,
    numberOf: (r) => r.Receipt_Number ?? r.Payment_Number,
    amountOf: (r) => r.Amount ?? r.Total_Amount,
    hasBalance: false,
    canReturn: false,
    printMode: "generic",
    editPath: (id) => `/payment-out/edit/${id}`,
    deleteMessage: "Are you sure you want to delete this payment-out entry?",
  },
  {
    key: "expenses",
    label: "Expense",
    plural: "Expenses",
    color: "#0891b2",
    idOf: (r) => r.Expense_Id ?? r.id,
    numberOf: (r) => r.Expense_Number ?? r.Expense_Category,
    amountOf: (r) => r.Total_Amount ?? r.Amount,
    hasBalance: false,
    canReturn: false,
    printMode: "generic",
    editPath: (id) => `/expense/edit/${id}`,
    deleteMessage: "Are you sure you want to delete this expense?",
  },
];

const TYPE_MAP = Object.fromEntries(TXN_TYPES.map((t) => [t.key, t]));

const GRID_COLS = "0.6fr 1.2fr 1.2fr 2.6fr 1.5fr 1.3fr 1.2fr 0.9fr";

const money = (v) =>
  `₹${(Number(v) || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const paymentTypeOf = (row) =>
  !row.Payment_Type_Display || row.Payment_Type_Display === "—"
    ? row._type === "sales" || row._type === "purchases"
      ? "Cash"
      : "—"
    : row.Payment_Type_Display;

/* ------------------------------------------------------------------ */
/*  Generic print template (for returns / payments / expenses / list)  */
/* ------------------------------------------------------------------ */
const DayTxnPrintTemplate = forwardRef(({ title, rows }, ref) => {
  const total = rows.reduce((s, r) => s + (Number(r._amount) || 0), 0);
  const cell = { border: "1px solid #999", padding: "4px 6px", fontSize: 12, textAlign: "left" };
  return (
    <div ref={ref} style={{ padding: 24, fontFamily: "Arial, sans-serif", color: "#000" }}>
      <h2 style={{ margin: 0 }}>{title}</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
        <thead>
          <tr style={{ background: "#eee" }}>
            {["#", "Type", "No.", "Party", "Payment Type", "Amount", "Balance"].map((h) => (
              <th key={h} style={cell}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r._key}>
              <td style={cell}>{i + 1}</td>
              <td style={cell}>{r._cfg.label}</td>
              <td style={cell}>{r._number || "N/A"}</td>
              <td style={cell}>{r.Party_Name || ""}</td>
              <td style={cell}>{paymentTypeOf(r)}</td>
              <td style={cell}>{money(r._amount)}</td>
              <td style={cell}>{r._cfg.hasBalance ? money(r._balance) : "—"}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td style={{ ...cell, fontWeight: 700 }} colSpan={5}>Total</td>
            <td style={{ ...cell, fontWeight: 700 }} colSpan={2}>{money(total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
});

/* ------------------------------------------------------------------ */
/*  PAGE                                                               */
/* ------------------------------------------------------------------ */
export default function AllTransactionsDetails() {
  const { date } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [activeType, setActiveType] = useState("all");
  const [search, setSearch] = useState("");
  const [rowMenuOpen, setRowMenuOpen] = useState(null);
  const [clickHighlightId, setClickHighlightId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [print, setPrint] = useState(null); // { mode, id?, rows?, title? }
  const printRef = useRef(null);

  const { data, isLoading, isFetching, isError, refetch } =
    useGetDayWiseTransactionsDetailsQuery(date, { skip: !date });

  /* ---------- delete mutations (only sale & purchase wired) ---------- */
  const [deleteSale, { isLoading: deletingSale }] = useDeleteSaleMutation();
  const [deletePurchase, { isLoading: deletingPurchase }] = useDeletePurchaseMutation();
    const [deletePurchaseReturn, { isLoading: deletingPurchaseReturn }] = useDeletePurchaseReturnMutation();
    const [deleteSaleReturn, { isLoading: deletingSaleReturn }] = useDeleteSaleReturnMutation();
  // To enable delete for other types, add their mutation here, e.g.
  // saleReturns: (id) => deleteSaleReturn(id).unwrap(),
  const deleteFns = {
    sales: (id) => deleteSale(id).unwrap(),
    purchases: (id) => deletePurchase(id).unwrap(),
    purchaseReturns:(id)=>deletePurchaseReturn(id).unwrap(),
    saleReturns: (id) => deleteSaleReturn(id).unwrap(),
  };

  /* ---------- flatten all types into one list ---------- */
  const allRows = useMemo(() => {
    const t = data?.transactions || {};
    return TXN_TYPES.flatMap((cfg) =>
      (t[cfg.key] || []).map((r) => {
        const id = cfg.idOf(r);
        return {
          ...r,
          _type: cfg.key,
          _cfg: cfg,
          _id: id,
          _key: `${cfg.key}-${id}`,
          _number: cfg.numberOf(r),
          _amount: Number(cfg.amountOf(r)) || 0,
          _balance: cfg.balanceOf ? Number(cfg.balanceOf(r)) || 0 : 0,
        };
      })
    );
  }, [data]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allRows.filter((r) => {
      if (activeType !== "all" && r._type !== activeType) return false;
      if (!q) return true;
      return (
        String(r.Party_Name || "").toLowerCase().includes(q) ||
        String(r._number || "").toLowerCase().includes(q)
      );
    });
  }, [allRows, activeType, search]);

  const totalsByType = useMemo(() => {
    const out = {};
    TXN_TYPES.forEach((c) => (out[c.key] = { count: 0, amount: 0 }));
    allRows.forEach((r) => {
      out[r._type].count += 1;
      out[r._type].amount += r._amount;
    });
    return out;
  }, [allRows]);

  /* ---------- close 3-dot menu on outside click ---------- */
  useEffect(() => {
    const close = () => setRowMenuOpen(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  /* ---------- printing ---------- */
  const { currentData: saleData } = useGetSingleSaleQuery(print?.id, {
    skip: print?.mode !== "sale",
  });
  const { currentData: purchaseData } = useGetSinglePurchaseQuery(print?.id, {
    skip: print?.mode !== "purchase",
  });
  const { currentData: saleReturnData } = useGetSaleReturnByIdQuery(print?.id, {
    skip: print?.mode !== "saleReturn",
  });
  const { currentData: purchaseReturnData } = useGetPurchaseReturnByIdQuery(print?.id, {
    skip: print?.mode !== "purchaseReturn",
  });
  const { currentData: paymentInData } = useGetPaymentInByIdQuery(print?.id, {
  skip: print?.mode !== "paymentIn",
});
const { currentData: paymentOutData } = useGetPaymentOutByIdQuery(
  print?.id,
  {
    skip: print?.mode !== "paymentOut",
  }
);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: print?.title || "Transaction",
    onAfterPrint: () => setPrint(null),
  });

  useEffect(() => {
    if (!print) return;
    const ready =
      (print.mode === "sale" && saleData?.invoicePartyDetails) ||
      (print.mode === "purchase" && purchaseData?.billPurchaseDetails) ||
      (print.mode === "saleReturn" && saleReturnData?.saleReturn) ||
      (print.mode === "purchaseReturn" && purchaseReturnData?.purchaseReturn) ||
      (print.mode === "paymentIn" && paymentInData?.paymentIn) ||
      (print.mode === "paymentOut" && paymentOutData?.paymentOut) ||
      print.mode === "generic";
    if (ready) handlePrint();
  }, [print, saleData, purchaseData, saleReturnData, purchaseReturnData,paymentInData,paymentOutData, handlePrint]);

  const startRowPrint = (row) => {
    const mode = row._cfg.printMode;
    if (mode === "generic") {
      setPrint({
        mode,
        rows: [row],
        title: `${row._cfg.label}-${row._number || row._id}`,
      });
    } else {
      setPrint({ mode, id: row._id, title: `${row._cfg.label}-${row._number || row._id}` });
    }
  };

  const startListPrint = () => {
    if (!rows.length) return toast.info("Nothing to print");
    const label = activeType === "all" ? "All Transactions" : TYPE_MAP[activeType].plural;
    setPrint({ mode: "generic", rows, title: `${label} - ${date}` });
  };

  /* ---------- delete ---------- */
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const fn = deleteFns[deleteTarget._type];
      const res = await fn(deleteTarget._id);
      toast.success(res?.message || "Deleted successfully");
      setDeleteTarget(null);
      dispatch(itemApi.util.invalidateTags(["Item", "ItemLedger"]));
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete");
    }
  };

  /* ---------- helpers ---------- */
  const prettyDate = date
    ? new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const chip = (key, label, count, color) => {
    const active = activeType === key;
    return (
      <button
        key={key}
        type="button"
        onClick={() => setActiveType(key)}
        style={{
          outline: "none",
          border: `1px solid ${active ? color : "#e2e8f0"}`,
          backgroundColor: active ? color : "#fff",
          color: active ? "#fff" : "#374151",
          borderRadius: 999,
          padding: "4px 12px",
          fontSize: 13,
          fontWeight: 500,
          whiteSpace: "nowrap",
          cursor: "pointer",
        }}
      >
        {label} ({count})
      </button>
    );
  };

  const isDeleting = deletingSale || deletingPurchase || deletingPurchaseReturn || deletingSaleReturn;

  return (
    <>
      <div
        className="flex flex-col bg-white"
        style={{ height: "100%", minHeight: 0, overflow: "hidden" }}
      >
        {/* HEADER */}
        <div className="inn-title">
          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-3">
            <div>
              <h4 className="text-2xl font-bold mb-1">Day Transactions</h4>
              <p className="text-gray-500 text-sm sm:text-base">{prettyDate}</p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              {/* <div className="flex flex-col">
                <span className="text-sm text-gray-600 font-medium mb-1">Date</span>
                <input
                  type="date"
                  value={date || ""}
                  onChange={(e) => e.target.value && navigate(`/day-wise-report/${e.target.value}`)}
                  className="border p-1 rounded-md shadow-sm text-gray-700"
                />
              </div> */}
              <input
                type="text"
                placeholder="Search party / number ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-56"
              />
              {/* <button
                type="button"
                onClick={startListPrint}
                className="group flex items-center gap-2 rounded-lg bg-blue-50 px-3.5 py-2 text-sm font-medium text-blue-700 ring-1 ring-blue-200 hover:bg-blue-100 active:scale-95"
                title="Print list"
              >
                <PrinterIcon size={16} strokeWidth={2.2} className="text-blue-600" />
              </button> */}
            </div>
          </div>

          {/* FILTER CHIPS */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {chip("all", "All", allRows.length, "#4CA1AF")}
            {TXN_TYPES.map((c) =>
              chip(c.key, c.plural, totalsByType[c.key].count, c.color)
            )}
          </div>

          {/* TOTALS STRIP */}
          <div className="flex gap-3 mt-3 overflow-x-auto pb-1">
            {TXN_TYPES.map((c) => (
              <div
                key={c.key}
                style={{
                  borderLeft: `4px solid ${c.color}`,
                  minWidth: 150,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}
                className="bg-white rounded-md px-3 py-2"
              >
                <p className="text-xs text-gray-500">{c.plural}</p>
                <p className="text-sm font-semibold text-black">
                  {money(totalsByType[c.key].amount)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* LIST */}
        <div
          className="tab-inn"
          style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}
        >
          {isLoading ? (
            <p className="text-center mt-4">Fetching transactions...</p>
          ) : isError ? (
            <p className="text-center mt-4 text-red-600">Failed to load transactions.</p>
          ) : rows.length === 0 ? (
            <p className="text-center mt-4">No transactions found for this day.</p>
          ) : (
            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflowX: "auto",
                overflowY: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ minWidth: 1062, display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                {/* HEADER ROW */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: GRID_COLS,
                    width: "100%",
                    minWidth: "1062px",
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
                  }}
                >
                  <div>Sl.No</div>
                  <div>Type</div>
                  <div>No.</div>
                  <div>Party Name</div>
                  <div>Payment Type</div>
                  <div>Amount</div>
                  <div>Balance</div>
                  <div>Action</div>
                </div>

                {/* VIRTUALIZED BODY */}
                <div style={{ flex: 1, minHeight: 0, height: 0, overflow: "hidden", position: "relative" }}>
                  <VirtualScrollList
                    items={rows}
                    rowHeight={52}
                    height="100%"
                    onLoadMore={() => {}}
                    isFetching={isFetching}
                    hasMore={false}
                    getItemKey={(r) => r._key}
                    emptyMessage="No transactions found"
                    endMessage="— End of transactions —"
                    isRowActive={(r) => rowMenuOpen === r._key}
                    renderRow={(row, idx) => {
                      const cfg = row._cfg;
                      const isHighlighted = clickHighlightId === row._key;
                      const canDelete = !!deleteFns[row._type];

                      return (
                        <div
                          key={row._key}
                          onClick={() => setClickHighlightId(row._key)}
                          onDoubleClick={() =>
                            navigate(cfg.editPath(row._id), { state: { from: "day-wise-report" } })
                          }
                          style={{
                            display: "grid",
                            gridTemplateColumns: GRID_COLS,
                            alignItems: "center",
                            height: 52,
                            columnGap: "10px",
                            width: "100%",
                            cursor: "pointer",
                            backgroundColor: isHighlighted ? "#4CA1AF22" : "transparent",
                            borderBottom: "1px solid #f1f5f9",
                            boxSizing: "border-box",
                          }}
                        >
                          <div className="table-desi-cell">{idx + 1}.</div>

                          <div className="table-desi-cell">
                            <span
                              style={{
                                backgroundColor: `${cfg.color}1a`,
                                color: cfg.color,
                                borderRadius: 6,
                                padding: "2px 8px",
                                fontSize: 12,
                                fontWeight: 600,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {cfg.label}
                            </span>
                          </div>

                          <div className="table-desi-cell">{row._number || "N/A"}</div>

                          <div className="table-desi-cell truncate" title={row.Party_Name || ""}>
                            {row.Party_Name || ""}
                          </div>

                          <div className="table-desi-cell">{paymentTypeOf(row)}</div>

                          <div className="table-desi-cell">{money(row._amount)}</div>

                          <div className="table-desi-cell">
                            {cfg.hasBalance ? money(row._balance) : "—"}
                          </div>

                          {/* ACTION */}
                          <div
                            className="py-2 px-2 table-desi-cell"
                            style={{
                              position: "sticky",
                              right: 0,
                              width: 80,
                              textAlign: "center",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "2px",
                            }}
                          >
                            {/* PRINT */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setClickHighlightId(row._key);
                                startRowPrint(row);
                              }}
                              className="group p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                              style={{ backgroundColor: "transparent", border: "none", cursor: "pointer" }}
                              title="Print"
                            >
                              <Printer
                                size={16}
                                className="text-[#4CA1AF] group-hover:text-[#374151] transition-colors"
                              />
                            </button>

                            {/* 3 DOT */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setClickHighlightId(row._key);
                                setRowMenuOpen(rowMenuOpen === row._key ? null : row._key);
                              }}
                              className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                              style={{ backgroundColor: "transparent", border: "none", cursor: "pointer" }}
                              title="More"
                            >
                              <MoreVertical size={16} style={{ color: "#374151" }} />
                            </button>

                            {/* DROPDOWN */}
                            {rowMenuOpen === row._key && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute bg-white shadow-lg rounded-md"
                                style={{
                                  right: 0,
                                  top: "100%",
                                  width: 150,
                                  zIndex: 100,
                                  border: "1px solid #e2e8f0",
                                  overflow: "hidden",
                                }}
                              >
                                <NavLink
                                  to={cfg.editPath(row._id)}
                                  state={{ from: "day-wise-report" }}
                                  className="row-menu-item"
                                  onClick={() => {
                                    setClickHighlightId(null);
                                    setRowMenuOpen(null);
                                  }}
                                >
                                  <Eye size={13} style={{ color: "#4CA1AF" }} />
                                  <span>View / Edit</span>
                                </NavLink>

                                {/* Return only for sale & purchase */}
                                {cfg.canReturn && (
                                  <NavLink
                                    to={cfg.returnPath(row._id)}
                                    state={{ from: "day-wise-report" }}
                                    className="row-menu-item"
                                    onClick={() => setRowMenuOpen(null)}
                                  >
                                    <Undo2 size={13} style={{ color: "#4CA1AF" }} />
                                    <span>Return</span>
                                  </NavLink>
                                )}

                                <button
                                  type="button"
                                  className="row-menu-item"
                                  onClick={() => {
                                    setRowMenuOpen(null);
                                    startRowPrint(row);
                                  }}
                                >
                                  <Printer size={13} style={{ color: "#4CA1AF" }} />
                                  <span>Print</span>
                                </button>

                                {canDelete && (
                                  <button
                                    type="button"
                                    className="row-menu-item delete-item"
                                    onClick={() => {
                                      setRowMenuOpen(null);
                                      setDeleteTarget({ _type: row._type, _id: row._id });
                                    }}
                                  >
                                    <Trash2 size={13} style={{ color: "#dc2626" }} />
                                    <span>Delete</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DELETE MODAL */}
      {deleteTarget && (
        <DeleteConfirmModal
          title={`Delete ${TYPE_MAP[deleteTarget._type].label}`}
          message={TYPE_MAP[deleteTarget._type].deleteMessage}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
        />
      )}

      {/* HIDDEN PRINT TARGETS (only one is mounted at a time) */}
      {print?.mode === "sale" && saleData?.invoicePartyDetails && (
        <div style={{ display: "none" }}>
          <InvoicePrintTemplate
            ref={printRef}
            type="sale"
            invoice={{
              ...saleData.invoicePartyDetails,
              items: saleData.items || [],
              companyDetails: {},
            }}
          />
        </div>
      )}
      {print?.mode === "purchase" && purchaseData?.billPurchaseDetails && (
        <div style={{ display: "none" }}>
          <InvoicePrintTemplate
            ref={printRef}
            type="purchase"
            invoice={{
              ...purchaseData.billPurchaseDetails,
              items: purchaseData.items || [],
              companyDetails: {},
            }}
          />
        </div>
      )}
      {print?.mode === "saleReturn" && saleReturnData?.saleReturn && (
        <div style={{ display: "none" }}>
          <CreditDebitNotePrintTemplate
            ref={printRef}
            type="credit"
            invoice={{
              ...saleReturnData.saleReturn,
              items: saleReturnData.saleReturn.items || [],
              companyDetails: {},
            }}
          />
        </div>
      )}
      {print?.mode === "purchaseReturn" && purchaseReturnData?.purchaseReturn && (
        <div style={{ display: "none" }}>
          <CreditDebitNotePrintTemplate
            ref={printRef}
            type="debit"
            invoice={{
              ...purchaseReturnData.purchaseReturn,
              items: purchaseReturnData.purchaseReturn.items || [],
              companyDetails: {},
            }}
          />
        </div>
      )}
      {print?.mode === "paymentIn" && paymentInData?.paymentIn && (
  <div style={{ display: "none" }}>
    <PaymentInOutPrintTemplate
      ref={printRef}
      payment={paymentInData.paymentIn}
      type="in"
    />
  </div>
)}
{print?.mode === "paymentOut" && paymentOutData?.paymentOut && (
  <div style={{ display: "none" }}>
    <PaymentInOutPrintTemplate
      ref={printRef}
      payment={paymentOutData.paymentOut}
      type="out"
    />
  </div>
)}
      {print?.mode === "generic" && (
        <div style={{ display: "none" }}>
          <DayTxnPrintTemplate ref={printRef} title={print.title} rows={print.rows} />
        </div>
      )}
    </>
  );
}