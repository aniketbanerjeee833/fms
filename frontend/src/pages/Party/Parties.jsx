import { useCallback, useEffect, useRef, useState } from "react";

import { useSearchParams } from "react-router-dom";
import { useGetAllPartiesQuery, useGetSinglePartyDetailsSalesPurchasesQuery } from "../../redux/api/partyAPi";
import { MoreVertical, Users,SquarePen,Trash2, Eye } from "lucide-react";
import { NavLink } from "react-router-dom";
import PartyAddModal from "../../components/Modal/PartyAddModal";
import { useDispatch } from "react-redux";
import { useUpdatePaymentOutMutation } from "../../redux/api/paymentOutApi";
import { useUpdatePaymentInMutation } from "../../redux/api/paymentInApi";
import { cashInHandApi } from "../../redux/api/cashInHandApi";
import { bankAccountApi, useGetAllBankAccountsQuery } from "../../redux/api/bankAccountApi";
import {toast} from "react-toastify";

const TXN_TYPE_ROUTE_MAP = {
  Sale: "sale",
  Purchase: "purchase",
  Sale_Return: "sale/return",
  Purchase_Return: "purchase/return",
};

const MODAL_TXN_TYPES = ["Payment_In", "Payment_Out"];

const PARTY_TYPE_META = {
  Sale: { label: "Sale", color: "#059669" },
  Purchase: { label: "Purchase", color: "#dc2626" },
  Sale_Return: { label: "Sale Return", color: "#059669" },
  Purchase_Return: { label: "Purchase Return", color: "#dc2626" },
  Payment_In: { label: "Payment In", color: "#059669" },
  Payment_Out: { label: "Payment Out", color: "#dc2626" },
};

function PaymentInModalLoader({ id, banks, onClose, onSave, isSaving,parties  }) {
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

function PaymentOutModalLoader({ id, banks, onClose, onSave, isSaving, parties}) {
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

/* ════════════════════════════════════════════════════════════
   RIGHT PANEL — Party Detail (infinite scroll ledger)
════════════════════════════════════════════════════════════ */
function PartyDetailPanel({ partyId }) {
    const dispatch=useDispatch();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [ledger, setLedger] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef(null);
  const observerRef = useRef(null);
  const [modalState, setModalState] = useState({ open: false, type: null, id: null });
  const openModal = (type, id) => setModalState({ open: true, type, id });
  const closeModal = () => setModalState({ open: false, type: null, id: null });
   const { data: banks = []} = useGetAllBankAccountsQuery();
    const [updatePaymentOut, { isLoading: isUpdatingPaymentOut }] = useUpdatePaymentOutMutation();
    const [updatePaymentIn, { isLoading: isUpdatingPaymentIn }] = useUpdatePaymentInMutation();
  const { data, isLoading, isFetching } =  useGetSinglePartyDetailsSalesPurchasesQuery(
    { Party_Id: partyId, page, search },
    { skip: !partyId }
  );
 
const fmt = (n) =>
  Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  /* reset when party or search changes */
  useEffect(() => {
    setPage(1);
    setLedger([]);
    setHasMore(true);
  }, [partyId, search]);

  /* merge all txn types into one flat, date-sorted ledger */
  useEffect(() => {
    if (!data) return;

    const combined = [
      ...(data.sales || []).map((r) => ({ ...r, _date: r.Invoice_Date, _no: r.Invoice_Number })),
      ...(data.purchases || []).map((r) => ({ ...r, _date: r.Bill_Date, _no: r.Bill_Number })),
      ...(data.saleReturns || []).map((r) => ({ ...r, _date: r.Return_Date, _no: r.Return_Number })),
      ...(data.purchaseReturns || []).map((r) => ({ ...r, _date: r.Return_Date, _no: r.Return_Number })),
      ...(data.paymentIns || []).map((r) => ({ ...r, _date: r.Payment_Date, _no: r.Receipt_No })),
      ...(data.paymentOuts || []).map((r) => ({ ...r, _date: r.Payment_Date, _no: r.Receipt_No })),
    ].sort((a, b) => new Date(b._date) - new Date(a._date));

    setLedger((prev) => {
      const existingKeys = new Set(prev.map((r) => `${r.Type}-${r._no}-${r._date}`));
      const fresh = combined.filter((r) => !existingKeys.has(`${r.Type}-${r._no}-${r._date}`));
      return [...prev, ...fresh];
    });

    if (page >= (data.totalPages ?? 1)) setHasMore(false);
  }, [data]);

  const handleObserver = useCallback(
    (entries) => {
      if (entries[0].isIntersecting && hasMore && !isFetching && !isLoading) {
        setPage((prev) => prev + 1);
      }
    },
    [hasMore, isFetching, isLoading]
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

  const party = data?.partyDetails;
const handleSavePaymentIn = async (formData) => {
    try {
      await updatePaymentIn({ id: modalState.id, ...formData }).unwrap();
      dispatch(cashInHandApi.util.invalidateTags(["CashInHand"]));
      dispatch(bankAccountApi.util.invalidateTags([
        { type: "BankAccount", id: formData.Bank_Account_Id },
        "BankAccount",
      ]));
      /* reset scroll so updated data reloads */
      setPage(1);
      setLedger([]);
      setHasMore(true);
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
      dispatch(bankAccountApi.util.invalidateTags([
        { type: "BankAccount", id: formData.Bank_Account_Id },
        "BankAccount",
      ]));
      setPage(1);
      setLedger([]);
      setHasMore(true);
      closeModal();
      toast.success("Payment Out updated");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to save payment out.");
    }
  };
console.log(ledger)
  if (!partyId) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full text-gray-400 gap-3"
        style={{ minHeight: "400px" }}
      >
        <Users size={48} strokeWidth={1.2} />
        <p className="text-base">Select a party to view details</p>
      </div>
    );
  }

  if (isLoading && page === 1) {
    return (
      <div
        className="flex items-center justify-center h-full text-gray-400"
        style={{ minHeight: "400px" }}
      >
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── PARTY SUMMARY CARD ── */}
      <div className="rounded-xl p-2 mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="flex items-center justify-center rounded-xl"
            style={{ width: 20, height: 20, backgroundColor: "#4CA1AF22" }}
          >
            <Users size={26} style={{ color: "#4CA1AF" }} />
          </div>
          <div>
            <h6 className="font-bold text-gray-900" style={{ fontSize: 18, margin: 0 }}>
              {party?.Party_Name}
            </h6>
            <p className="text-gray-500 text-sm mt-0.5">
              GSTIN: <span className="font-medium">{party?.GSTIN || "—"}</span>
              {" • "}
              State: <span className="font-medium">{party?.State || "—"}</span>
            </p>
          </div>
        </div>

        {/* search bar — right side */}
        <div className="flex items-center w-full sm:w-56">
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-56"
          />
        </div>
      </div>

      {/* ── LEDGER TABLE ── */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full min-w-[500px]">
          <thead>
            <tr>
              <th className="text-left">Sl.No</th>
              <th className="text-left">Type</th>
              <th className="text-left">Date</th>
              <th className="text-left">Balance Due</th>
              <th>View/Edit</th>
            </tr>
          </thead>

          <tbody>
            {ledger.length === 0 && !isLoading ? (
              <tr>
                <td className="text-center" colSpan={5} style={{ padding: "40px 0", color: "#9ca3af" }}>
                  No transactions found
                </td>
              </tr>
            ) : (
              ledger.map((row, idx) => {
                const meta = PARTY_TYPE_META[row.Type] ?? { label: row.Type, color: "#6b7280" };
                const routeInfo = TXN_TYPE_ROUTE_MAP[row.Type];
                const refId =
                  row.Sale_Id || row.Purchase_Id || row.Sale_Return_Id ||
                  row.Purchase_Return_Id || row.Payment_In_Id || row.Payment_Out_Id;

                return (
                  <tr key={`${row.Type}-${refId}-${idx}`}>
                    <td>{idx + 1}.</td>
                    <td>{meta.label}</td>
                    <td>
                      {row._date
                        ? new Date(row._date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "numeric",
                            year: "numeric",
                          })
                        : "N/A"}
                    </td>
                    <td style={{ color: meta.color, fontWeight: 600 }}>
                      ₹ {fmt(row.Balance_Due)}
                    </td>
                    <td>
  {row.Formatted_Reference_Id && (
    MODAL_TXN_TYPES.includes(row.Type) ? (
      <Eye
        style={{ cursor: "pointer", color: "#4CA1AF" }}
        onClick={() => openModal(row.Type, row.Formatted_Reference_Id)}
      />
    ) : (
      <NavLink
        to={`/${TXN_TYPE_ROUTE_MAP[row.Type]}/edit/${row.Formatted_Reference_Id}`}
        state={{ from: "party-details", partyId }}
      >
        <Eye style={{ cursor: "pointer", color: "#4CA1AF" }} />
      </NavLink>
    )
  )}
</td>
                    {/* <td>
                      {routeInfo && refId && (
                        <NavLink to={`/${routeInfo}/edit/${refId}`} state={{ from: "party-details", partyId }}>
                          <Eye style={{ cursor: "pointer", color: "#4CA1AF" }} />
                        </NavLink>
                      )}
                    </td> */}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

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
           {/* ── MODALS ── */}
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
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════ */
 
// const PARTY_TYPE_META = {
//   Sale: { label: "Sale", color: "#059669" },
//   Purchase: { label: "Purchase", color: "#dc2626" },
//   Credit_Note: { label: "Credit Note", color: "#059669" },
//   Debit_Note: { label: "Debit Note", color: "#dc2626" },
//   Payment_In: { label: "Payment In", color: "#059669" },
//   Payment_Out: { label: "Payment Out", color: "#dc2626" },
// };

// const PARTY_TYPE_ROUTE_MAP = {
//   Sale: "sale",
//   Purchase: "purchase",
//   Credit_Note: "sale-return",
//   Debit_Note: "purchase-return",
//   Payment_In: "payment-in",
//   Payment_Out: "payment-out",
// };

export default function Parties() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState(
    searchParams.get("partyId") ? Number(searchParams.get("partyId")) : null
  );
  const [leftSearch, setLeftSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null); // 3-dot menu
  const [partyModal, setPartyModal] = useState({ open: false, mode: "add", data: null });
  //const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: partiesData, isLoading } = useGetAllPartiesQuery({ search: leftSearch });
  const parties = partiesData?.parties || [];

//   const [deleteParty] = useDeletePartyMutation();

  useEffect(() => {
    const urlPartyId = searchParams.get("partyId");
    if (urlPartyId && Number(urlPartyId) !== selectedId) {
      setSelectedId(Number(urlPartyId));
    }
    if (!urlPartyId && !isLoading && parties.length > 0) {
      setSelectedId(parties[0].Party_Id);
      setSearchParams({ partyId: parties[0].Party_Id }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, parties]);

  const handleSelectParty = (partyId) => {
    setSelectedId(partyId);
    setSearchParams({ partyId });
  };

  const handleEdit = (party) => {
    setPartyModal({ open: true, mode: "edit", data: party });
    setOpenMenuId(null);
  };

//   const handleDeleteConfirm = async () => {
//     try {
//       await deleteParty(deleteTarget.Party_Id).unwrap();
//       toast.success("Party deleted");
//       if (selectedId === deleteTarget.Party_Id) {
//         setSelectedId(null);
//         setSearchParams({}, { replace: true });
//       }
//     } catch (err) {
//       toast.error(err?.data?.message || "Failed to delete party.");
//     } finally {
//       setDeleteTarget(null);
//     }
//   };

  return (
    <>
      <div className="flex flex-col bg-white" style={{ minHeight: "100vh" }}>
        {/* ── PAGE HEADER ── */}
        <div className="inn-title">
          <div className="flex flex-row justify-between items-center">
            <div>
              <h4 className="text-2xl font-bold mb-1">All Parties</h4>
              <p className="text-gray-500 text-sm">All Parties Details</p>
            </div>
            <button
              type="button"
              className="text-white px-4 py-2 rounded-md text-sm font-medium"
              style={{ backgroundColor: "#4CA1AF", outline: "none", boxShadow: "none" }}
              onClick={() => setPartyModal({ open: true, mode: "add", data: null })}
            >
              + Add Party
            </button>
          </div>
        </div>

        {/* ── SPLIT LAYOUT ── */}
        <div className="flex flex-col lg:flex-row gap-0" style={{ flex: 1, borderTop: "1px solid #e2e8f0" }}>
          {/* ══ LEFT — 30% — party list ══ */}
          <div
            className="w-full lg:w-[30%] overflow-y-auto"
            style={{
              borderRight: "1px solid #e2e8f0",
              minHeight: "500px",
              maxHeight: "calc(100vh - 180px)",
            }}
          >
            <div
              className="px-4 py-3 flex flex-col gap-2"
              style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#fafafa" }}
            >
              <div className="flex items-center gap-2">
                <Users size={15} style={{ color: "#4CA1AF" }} />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Parties ({parties.length})
                </span>
              </div>
              <input
                type="text"
                placeholder="Search parties..."
                value={leftSearch}
                onChange={(e) => setLeftSearch(e.target.value)}
                className="w-full"
              />
            </div>

            {isLoading ? (
              <div className="p-4 text-gray-400 text-sm">Loading parties...</div>
            ) : parties.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-10 text-gray-400 gap-2">
                <Users size={36} strokeWidth={1.2} />
                <p className="text-sm">No parties yet</p>
              </div>
            ) : (
              parties.map((party) => {
                const isSelected = selectedId === party.Party_Id;
                return (
                  <div
                    key={party.Party_Id}
                    onClick={() => handleSelectParty(party.Party_Id)}
                    className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors relative"
                    style={{
                      backgroundColor: isSelected ? "#f0f9ff" : "transparent",
                      borderLeft: isSelected ? "3px solid #4CA1AF" : "3px solid transparent",
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className="flex items-center justify-center rounded-lg flex-shrink-0"
                        style={{
                          width: 36,
                          height: 36,
                          backgroundColor: isSelected ? "#4CA1AF22" : "#f1f5f9",
                        }}
                      >
                        <Users size={18} style={{ color: isSelected ? "#4CA1AF" : "#94a3b8" }} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 truncate text-sm" style={{ margin: 0 }}>
                          {party.Party_Name}
                        </p>
                        <p className="text-xs truncate text-gray-400">
                          {party.GSTIN || party.State || "—"}
                        </p>
                      </div>
                    </div>

                    {/* 3-dot menu */}
                    <div className="flex items-center ml-2 flex-shrink-0 relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === party.Party_Id ? null : party.Party_Id);
                        }}
                        className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                        style={{ backgroundColor: "transparent" }}
                      >
                        <MoreVertical size={16} style={{ color: "#94a3b8" }} />
                      </button>

                      {openMenuId === party.Party_Id && (
                        <div
                          className="absolute right-0 top-8 bg-white rounded-md shadow-lg z-10"
                          style={{ border: "1px solid #e2e8f0", minWidth: 120 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => handleEdit(party)}
                            className="flex items-center gap-2 px-3 py-2 w-full text-left text-sm hover:bg-gray-50"
                            style={{ backgroundColor: "transparent" }}
                          >
                            <SquarePen size={14} style={{ color: "#4CA1AF" }} /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              //setDeleteTarget(party);
                              setOpenMenuId(null);
                            }}
                            className="flex items-center gap-2 px-3 py-2 w-full text-left text-sm hover:bg-gray-50"
                            style={{ backgroundColor: "transparent" }}
                          >
                            <Trash2 size={14} style={{ color: "#dc2626" }} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ══ RIGHT — 70% — detail panel ══ */}
          <div className="w-full lg:w-[70%] p-1 overflow-y-auto" style={{ maxHeight: "calc(100vh - 180px)" }}>
            <PartyDetailPanel partyId={selectedId} />
          </div>
        </div>
      </div>

      {partyModal.open && (
        <PartyAddModal
          partyDetails={partyModal.data || {}}
          editingParty={partyModal.mode === "edit"}
          onClose={() => setPartyModal({ open: false, mode: "add", data: null })}
        />
      )}

      {/* {deleteTarget && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)", zIndex: 50 }}>
          <div className="bg-white rounded-lg p-6" style={{ minWidth: 320 }}>
            <p className="mb-4">Delete party "{deleteTarget.Party_Name}"?</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-md bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-md text-white"
                style={{ backgroundColor: "#dc2626" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )} */}
    </>
  );
}