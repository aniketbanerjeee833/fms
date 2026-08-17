
import { useEffect, useState, useRef, useCallback } from "react";

import { NavLink, useNavigate, useSearchParams } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  SquarePen,
  ChevronRight,
  ArrowUpRight,
  Eye,
  ArrowDownLeft,
  CreditCard,
  Landmark,
  Wallet,
  Trash2,
  MoreVertical,
  Printer
} from "lucide-react";

import {
  bankAccountApi,
  useGetAllBankAccountsQuery,
  useGetBankAccountByIdQuery,
} from "../../redux/api/bankAccountApi";

import BankAccountModal from "../../components/Modal/BankAccountModal";
import { useDeletePaymentInMutation, useGetPaymentInByIdQuery, useUpdatePaymentInMutation } from "../../redux/api/paymentInApi";
import { useDeletePaymentOutMutation, useGetPaymentOutByIdQuery, useUpdatePaymentOutMutation } from "../../redux/api/paymentOutApi";
import PaymentOutModal from "../../components/Modal/PaymentOutModal";
import PaymentInModal from "../../components/Modal/PaymentInModal";
import { toast } from "react-toastify";
import { cashInHandApi } from "../../redux/api/cashInHandApi";
import { useDispatch } from "react-redux";
import { partyApi, useGetAllPartiesQuery } from "../../redux/api/partyAPi";
import PartyAddModal from "../../components/Modal/PartyAddModal";
import DeleteConfirmModal from "../../components/Modal/DeleteConfirmModal";
import { purchaseApi, useDeletePurchaseMutation } from "../../redux/api/purchaseApi";
import { useDeletePurchaseReturnMutation } from "../../redux/api/purchaseReturnApi";
import { useDeleteSaleReturnMutation } from "../../redux/api/saleReturnApi";
import { saleApi, useDeleteSaleMutation } from "../../redux/api/saleApi";
import { itemApi } from "../../redux/api/itemApi";

/* ── source_type → icon + label ── */
const TYPE_META = {
  sale: { label: "Sale", color: "#16a34a", bg: "#f0fdf4", dir: "in" },
  purchase: { label: "Purchase", color: "#dc2626", bg: "#fff1f2", dir: "out" },
  payment_in: { label: "Payment In", color: "#16a34a", bg: "#f0fdf4", dir: "in" },
  payment_out: { label: "Payment Out", color: "#dc2626", bg: "#fff1f2", dir: "out" },
  purchase_return: { label: "Purchase Return", color: "#16a34a", bg: "#f0fdf4", dir: "in" },
  sale_return: { label: "Sale Return", color: "#dc2626", bg: "#fff1f2", dir: "out" },
  adjustment: { label: "Adjustment", color: "#4CA1AF", bg: "#f0f9ff", dir: "in" },
};
const TXN_TYPE_ROUTE_MAP = {
  Sale: "sale",
  Purchase: "purchase",

  Sale_Return: "sale/return",
  Purchase_Return: "purchase/return",
};
const MODAL_TXN_TYPES = ["Payment_In", "Payment_Out"];
const fmt = (n) =>
  Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// const fmtDate = (d) =>
//   d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

/* ════════════════════════════════════════════════════════════
   RIGHT PANEL — bank details + transaction ledger
════════════════════════════════════════════════════════════ */

function PaymentInModalLoader({ id, banks, onClose, onSave, isSaving, parties }) {
  const { data: record, isLoading } = useGetPaymentInByIdQuery(id);
  if (isLoading || !record) return null;

  return (
    <PaymentInModal
      mode="edit"          // or "edit" if you want it editable from here
      initialData={record?.paymentIn}
      onClose={onClose}
      banks={banks}
      onSave={onSave}
      isSaving={isSaving}
      parties={parties}
      PartyAddModal={PartyAddModal}

    />
  );
}

function PaymentOutModalLoader({ id, banks, onClose, onSave, isSaving, parties }) {
  const { data: record, isLoading } = useGetPaymentOutByIdQuery(id);
  console.log(record, "BankAccounts Payment Out");
  if (isLoading || !record) return null;

  return (
    <PaymentOutModal
      mode="edit"
      initialData={record?.paymentOut}
      banks={banks}
      onClose={onClose}
      onSave={onSave}
      isSaving={isSaving}
      parties={parties}
      PartyAddModal={PartyAddModal}   // 🔹 add this
    />
  );
}
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

function BankDetailPanel({ bankId }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // 🔹 only cursor state needed — no page, no manual ledger array
  const [cursor, setCursor] = useState(null);
  const sentinelRef = useRef(null);
  const observerRef = useRef(null);

  const [modalState, setModalState] = useState({ open: false, type: null, id: null });
  const openModal = (type, id) => setModalState({ open: true, type, id });
  const closeModal = () => setModalState({ open: false, type: null, id: null });
  const [rowMenuOpen, setRowMenuOpen] = useState(null);

  useEffect(() => {
    const closeRowMenu = () => {
      setRowMenuOpen(null);
    };

    document.addEventListener("click", closeRowMenu);

    return () => {
      document.removeEventListener("click", closeRowMenu);
    };
  }, []);

  const [updatePaymentOut, { isLoading: isUpdatingPaymentOut }] = useUpdatePaymentOutMutation();
  const [updatePaymentIn, { isLoading: isUpdatingPaymentIn }] = useUpdatePaymentInMutation();
  const { data: partiesList } = useGetAllPartiesQuery();
  const { data: banks = [] } = useGetAllBankAccountsQuery();

  const { data, isLoading, isFetching } = useGetBankAccountByIdQuery(
    { Bank_Account_Id: bankId, cursor },
    { skip: !bankId }
  );



  // 🔹 RTK merge gives us the full accumulated list in data.transactions
  const ledger = data?.transactions ?? [];
  const hasMore = data?.hasMore ?? false;
  const nextCursor = data?.nextCursor ?? null;

  // 🔹 reset cursor when bank changes

  useEffect(() => {
    setCursor(null);
  }, [bankId]);

  // 🔹 intersection observer
  const handleObserver = useCallback(
    (entries) => {
      if (
        entries[0].isIntersecting &&
        hasMore &&
        nextCursor &&
        !isFetching &&
        !isLoading
      ) {
        setCursor(nextCursor);
      }
    },
    [hasMore, nextCursor, isFetching, isLoading]
  );

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
    });
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [handleObserver]);

  const handleTransactionEdit = (row) => {
    if (!row?.Formatted_Reference_Id) return;

    // Payment In / Payment Out open their edit modals
    if (MODAL_TXN_TYPES.includes(row.Txn_Type)) {
      openModal(
        row.Txn_Type,
        row.Formatted_Reference_Id
      );
      return;
    }

    // Other transactions open their edit page
    const route = TXN_TYPE_ROUTE_MAP[row.Txn_Type];

    if (!route) return;

    navigate(
      `/${route}/edit/${row.Formatted_Reference_Id}`,
      {
        state: {
          from: "bank-accounts",
          bankId,
        },
      }
    );
  };

  // 🔹 after save/delete — reset cursor to reload from top
  const resetLedger = () => {
    setCursor(null);
    dispatch(
      bankAccountApi.util.invalidateTags([
        { type: "BankAccount", id: bankId },
        "BankAccount",
      ])
    );
  };

  const handleSavePaymentIn = async (formData) => {
    try {
      await updatePaymentIn({ id: modalState.id, ...formData }).unwrap();
      dispatch(cashInHandApi.util.invalidateTags(["CashInHand"]));
      resetLedger();
      closeModal();
      toast.success("Payment In updated");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to save payment in.");
    }
  };

  const handleSavePaymentOut = async (formData) => {
    try {
      await updatePaymentOut({ id: modalState.id, ...formData }).unwrap();
      dispatch(cashInHandApi.util.invalidateTags(["CashInHand"]));
      resetLedger();
      closeModal();
      toast.success("Payment Out updated");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to save payment out.");
    }
  };

  // delete mutations
  const [deleteSale, { isLoading: isDeletingSale }] = useDeleteSaleMutation();
  const [deletePurchase, { isLoading: isDeletingPurchase }] = useDeletePurchaseMutation();
  const [deleteSaleReturn, { isLoading: isDeletingSaleReturn }] = useDeleteSaleReturnMutation();
  const [deletePurchaseReturn, { isLoading: isDeletingPurchaseReturn }] = useDeletePurchaseReturnMutation();
  const [deletePaymentIn, { isLoading: isDeletingPaymentIn }] = useDeletePaymentInMutation();
  const [deletePaymentOut, { isLoading: isDeletingPaymentOut }] = useDeletePaymentOutMutation();

  const isDeleting =
    isDeletingSale || isDeletingPurchase ||
    isDeletingSaleReturn || isDeletingPurchaseReturn ||
    isDeletingPaymentIn || isDeletingPaymentOut;

  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      let res;
      switch (deleteTarget.Txn_Type) {
        case "Sale": res = await deleteSale(deleteTarget.Id).unwrap(); break;
        case "Purchase": res = await deletePurchase(deleteTarget.Id).unwrap(); break;
        case "Sale_Return": res = await deleteSaleReturn(deleteTarget.Id).unwrap(); break;
        case "Purchase_Return": res = await deletePurchaseReturn(deleteTarget.Id).unwrap(); break;
        case "Payment_In": res = await deletePaymentIn(deleteTarget.Id).unwrap(); break;
        case "Payment_Out": res = await deletePaymentOut(deleteTarget.Id).unwrap(); break;
        default:
          toast.error("Unknown transaction type — cannot delete");
          return;
      }
      toast.success(res?.message || "Deleted successfully");
      setDeleteTarget(null);
      dispatch(partyApi.util.invalidateTags(["Party"]));
      dispatch(cashInHandApi.util.invalidateTags(["CashInHand"]));
      dispatch(saleApi.util.invalidateTags(["Sale"]));
      dispatch(purchaseApi.util.invalidateTags(["Purchase"]));
      dispatch(
  itemApi.util.invalidateTags([
    { type: "Item", id: "LIST" },
    { type: "ItemsByCategory", id: "LIST" },
    { type: "ItemLedger", id: "LIST" },
  ])
);;
      resetLedger();   // 🔹 reload bank ledger from top
    } catch (err) {
      console.error("❌ Delete error:", err);
      toast.error(err?.data?.message || "Failed to delete");
      setDeleteTarget(null);
    }
  };

  const bank = data?.bankAccount;

  if (!bankId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3"
        style={{ minHeight: "400px" }}>
        <Landmark size={48} strokeWidth={1.2} />
        <p className="text-base">Select a bank account to view details</p>
      </div>
    );
  }

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400"
        style={{ minHeight: "400px" }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-y-auto"
     style={{
        maxHeight: "calc(100vh - 180px)",
        minWidth: 0
      }}>

      {/* bank summary card */}
      <div className="rounded-xl p-2 mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center rounded-xl"
            style={{ width: 20, height: 20, backgroundColor: "#4CA1AF22" }}>
            <Building2 size={26} style={{ color: "#4CA1AF" }} />
          </div>
          <div>
            <h6 className="font-bold text-gray-900" style={{ fontSize: 18, margin: 0 }}>
              {bank?.Bank_Name}
            </h6>
            <p className="text-gray-500 text-sm mt-0.5">
              A/C: <span className="font-medium">{bank?.Account_Number || "—"}</span>
              {" • "}
              IFSC: <span className="font-medium">{bank?.IFSC_Code || "—"}</span>
            </p>
            <p className="text-sm font-semibold" style={{ color: "#4CA1AF" }}>
              Balance: ₹{Number(data?.currentBalance || 0).toLocaleString("en-IN", {
                minimumFractionDigits: 2
              })}
            </p>
          </div>
        </div>
      </div>

      {/* ledger table */}
      <div className="table-responsive table-desi">
        <table className="w-full min-w-[500px]">
          <thead>
            <tr>
              <th className="text-left">SL.NO</th>
              <th className="text-left">TYPE</th>
              <th className="text-left">PARTY</th>
              <th className="text-left">DATE</th>
              <th className="text-left">AMOUNT</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {ledger.length === 0 && !isLoading ? (
              <tr>
                <td className="text-center" colSpan={6}
                  style={{ padding: "40px 0", color: "#9ca3af" }}>
                  No transactions found
                </td>
              </tr>
            ) : (
              ledger.map((row, idx) => {
                const meta =
                  TYPE_META[row.Txn_Type?.toLowerCase()] ?? {
                    label: row.Txn_Type,
                    color: "#6b7280",
                    dir: row.Direction === "Credit" ? "in" : "out",
                  };
                return (
                  <tr
                    key={row.id}
                    onDoubleClick={() => handleTransactionEdit(row)}
                    className="cursor-pointer"
                  >
                    <td>{idx + 1}.</td>
                    <td>{meta.label}</td>
                    <td>{row.Party_Name || "N/A"}</td>
                    <td>
                      {row.Txn_Date
                        ? new Date(row.Txn_Date).toLocaleDateString("en-IN", {
                          day: "numeric", month: "numeric", year: "numeric",
                        })
                        : "N/A"}
                    </td>
                    <td style={{ color: meta.color, fontWeight: 600 }}>
                      ₹ {fmt(row.Amount)}
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

                          const menuId = `${row.Txn_Type}-${row.Formatted_Reference_Id}-${idx}`;

                          setRowMenuOpen(
                            rowMenuOpen === menuId ? null : menuId
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

                      {/* ROW MENU */}
                      {rowMenuOpen === `${row.Txn_Type}-${row.Formatted_Reference_Id}-${idx}` && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute bg-white shadow-lg rounded-md"
                          style={{
                            right: 0,
                            top: 32,
                            width: 150,
                            zIndex: 100,
                            border: "1px solid #e2e8f0",
                            overflow: "hidden",
                          }}
                        >

                          {/* VIEW / EDIT */}
                          {row.Formatted_Reference_Id && (
                            MODAL_TXN_TYPES.includes(row.Txn_Type) ? (
                              <button
                                type="button"
                                className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                                style={{ color: "#374151" }}
                                onClick={() => {
                                  setRowMenuOpen(null);

                                  openModal(
                                    row.Txn_Type,
                                    row.Formatted_Reference_Id
                                  );
                                }}
                              >
                                <Eye
                                  size={13}
                                  style={{ color: "#4CA1AF" }}
                                />
                                View / Edit
                              </button>
                            ) : (
                              <NavLink
                                to={`/${TXN_TYPE_ROUTE_MAP[row.Txn_Type]}/edit/${row.Formatted_Reference_Id}`}
                                state={{
                                  from: "bank-accounts",
                                  bankId
                                }}
                                className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                                style={{
                                  color: "#374151",
                                  textDecoration: "none",
                                }}
                                onClick={() => setRowMenuOpen(null)}
                              >
                                <Eye
                                  size={13}
                                  style={{ color: "#4CA1AF" }}
                                />
                                View / Edit
                              </NavLink>
                            )
                          )}

                          {/* PRINT */}
                          <button
                            type="button"
                            className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                            style={{ color: "#374151" }}
                            onClick={() => {
                              setRowMenuOpen(null);
                              console.log("Print transaction:", row);
                            }}
                          >
                            <Printer
                              size={13}
                              style={{ color: "#4CA1AF" }}
                            />
                            Print
                          </button>

                          {/* DELETE */}
                          <button
                            type="button"
                            className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-red-50 text-sm"
                            title="Delete transaction"
                            style={{
                              cursor: "pointer",
                              color: "#dc2626",
                            }}
                            onClick={() => {
                              setRowMenuOpen(null);

                              setDeleteTarget({
                                Id: row.Formatted_Reference_Id,
                                Txn_Type: row.Txn_Type,
                              });
                            }}
                          >
                            <Trash2
                              size={13}
                              style={{ color: "#dc2626" }}
                            />
                            Delete
                          </button>

                        </div>
                      )}
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* sentinel */}
        <div ref={sentinelRef} style={{ height: "1px" }} />

        {isFetching && (
          <div className="flex justify-center py-4">
            <span className="text-sm text-gray-400">Loading more...</span>
          </div>
        )}

        {!hasMore && ledger.length > 0 && (
          <div className="flex justify-center py-4">
            <span className="text-xs text-gray-300">— End of transactions —</span>
          </div>
        )}
      </div>

      {/* modals */}
      {modalState.open && modalState.type === "Payment_In" && (
        <PaymentInModalLoader
          id={modalState.id}
          banks={banks}
          onClose={closeModal}
          onSave={handleSavePaymentIn}
          isSaving={isUpdatingPaymentIn}
          parties={partiesList}
        />
      )}
      {modalState.open && modalState.type === "Payment_Out" && (
        <PaymentOutModalLoader
          id={modalState.id}
          banks={banks}
          onClose={closeModal}
          onSave={handleSavePaymentOut}
          isSaving={isUpdatingPaymentOut}
          parties={partiesList}
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
    </div>
  );
}
/* ════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════ */
export default function BankAccounts() {
  const [searchParams, setSearchParams] = useSearchParams();
  // const [selectedId, setSelectedId] = useState(
  //   searchParams.get("bankId") ? Number(searchParams.get("bankId")) : null
  // );
  const selectedId = searchParams.get("bankId") || null;
  console.log("selectedId", selectedId);
  //const [selectedId, setSelectedId] = useState(null);
  const [editingBank, setEditingBank] = useState(null); // for future edit modal
  const [bankModal, setBankModal] = useState({ open: false, mode: "add", data: null });
  const { data: banks = [], isLoading } = useGetAllBankAccountsQuery();
  // useEffect(() => {
  //   const urlBankId = searchParams.get("bankId");
  //   if (urlBankId && Number(urlBankId) !== selectedId) {
  //     setSelectedId(Number(urlBankId));
  //   }
  //   // 🔹 If no bankId in URL yet but banks have loaded, default to the first account
  //   if (!urlBankId && !isLoading && banks.length > 0) {
  //     setSelectedId(banks[0].Bank_Account_Id);
  //     setSearchParams({ bankId: banks[0].Bank_Account_Id }, { replace: true });
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [isLoading, banks]);
  useEffect(() => {
    if (!searchParams.get("bankId") && !isLoading && banks.length > 0) {
      const next = new URLSearchParams(searchParams);
      next.set("bankId", banks[0].Bank_Account_Id);
      setSearchParams(next, { replace: true });
    }
  }, [isLoading, banks]);
  const handleEdit = (bank) => {
    setEditingBank(bank);
    // TODO: open your BankEditModal here
    // setEditModalOpen(true);
    //console.log("Edit bank:", bank);
    setBankModal({ open: true, mode: "edit", data: bank });
  };
  // const handleSelectBank = (bankAccountId) => {
  //   setSelectedId(bankAccountId);
  //   setSearchParams({ bankId: bankAccountId });   // 🔹 keep URL in sync when user clicks a row
  // };
  const handleSelectBank = (bankAccountId) => {
    const next = new URLSearchParams(searchParams);
    next.set("bankId", bankAccountId);
    setSearchParams(next);
  };

  return (
    <>
      {/* ── BREADCRUMB ── */}
      {/* <div className="sb2-2-2">
        <ul>
          <li>
            <NavLink style={{ display: "flex", flexDirection: "row" }} to="/home">
              <LayoutDashboard size={20} style={{ marginRight: "8px" }} />
              Dashboard
            </NavLink>
          </li>
        </ul>
      </div> */}

      <div className="flex flex-col bg-white" style={{ minHeight: "100vh" }}>

        {/* ── PAGE HEADER ── */}
        <div className="inn-title">
          <div className="flex flex-row justify-between items-center">
            <div>
              <h4 className="text-2xl font-bold mb-1">Bank Accounts</h4>
              <p className="text-gray-500 text-sm">Manage your bank accounts and transactions</p>
            </div>
            {/* Add Bank button — wire to your modal */}
            <button
              type="button"
              className="text-white px-4 py-2 rounded-md text-sm font-medium"
              style={{ backgroundColor: "#4CA1AF", outline: "none", boxShadow: "none" }}
              onClick={() => setBankModal({ open: true, mode: "add", data: null })}
            >
              + Add Bank
            </button>
          </div>
        </div>

        {/* ── SPLIT LAYOUT ── */}
        <div
          className="flex flex-col lg:flex-row gap-0"
          style={{ flex: 1, borderTop: "1px solid #e2e8f0" }}
        >

          {/* ══ LEFT — 30% — bank list ══ */}
          <div
            className="w-full lg:w-[30%] overflow-y-auto"
            style={{
              borderRight: "1px solid #e2e8f0",
              minHeight: "500px",
              maxHeight: "calc(100vh - 180px)",
            }}
          >
            {/* list header */}
            <div className="px-4 py-3 flex items-center gap-2"
              style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#fafafa" }}>
              <CreditCard size={15} style={{ color: "#4CA1AF" }} />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Accounts ({banks.length})
              </span>
            </div>

            {isLoading ? (
              <div className="p-4 text-gray-400 text-sm">Loading accounts...</div>
            ) : banks.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-10 text-gray-400 gap-2">
                <Wallet size={36} strokeWidth={1.2} />
                <p className="text-sm">No bank accounts yet</p>
              </div>
            ) : (
              banks.map((bank) => {
                //const isSelected = selectedId === bank.Bank_Account_Id;
                const isSelected =
                  String(selectedId) === String(bank.Bank_Account_Id);
                return (
                  <div
                    key={bank.Bank_Account_Id}
                    onClick={() => handleSelectBank(bank.Bank_Account_Id)}
                    onDoubleClick={() => handleEdit(bank)}
                    className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors"
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
                          width: 36, height: 36,
                          backgroundColor: isSelected ? "#4CA1AF22" : "#f1f5f9",
                        }}
                      >
                        <Building2 size={18} style={{ color: isSelected ? "#4CA1AF" : "#94a3b8" }} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 truncate text-sm" style={{ margin: 0 }}>
                          {bank.Account_Display_Name}
                        </p>
                        <p
                          className={`text-xs truncate ${Number(bank.Current_Balance) > 0
                            ? "text-green-600"
                            : Number(bank.Current_Balance) < 0
                              ? "text-red-600"
                              : "text-gray-400"
                            }`}
                        >
                          {bank.Current_Balance != null
                            ? Number(bank.Current_Balance).toLocaleString("en-IN")
                            : "—"}
                        </p>
                        {/* <p className="text-xs text-gray-400 truncate">
                          {bank.Current_Balance
                            ? `${String(bank.Current_Balance)}`
                            : bank.Current_Balance || "—"}
                        </p> */}
                      </div>
                    </div>

                    {/* right: actions + chevron */}
                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                      {/* Edit */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation(); // don't trigger row select
                          handleEdit(bank);
                        }}
                        className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                        style={{ backgroundColor: "transparent" }}
                        title="Edit"
                      >
                        <SquarePen size={14} style={{ color: "#4CA1AF" }} />
                      </button>

                      <ChevronRight
                        size={14}
                        style={{ color: isSelected ? "#4CA1AF" : "#cbd5e1" }}
                      />
                    </div>
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
            <BankDetailPanel
              bankId={selectedId}
              onEdit={handleEdit}
            />
          </div>

        </div>
      </div>
      {bankModal.open && (
        <BankAccountModal
          mode={bankModal.mode}
          data={bankModal.data}
          onClose={() => setBankModal({ open: false, mode: "add", data: null })}
        />
      )}
    </>
  );
}