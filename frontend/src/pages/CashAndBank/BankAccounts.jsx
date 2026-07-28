

import { useEffect, useState, useRef, useCallback } from "react";

import { NavLink, useSearchParams } from "react-router-dom";
import { LayoutDashboard, Building2, SquarePen, ChevronRight, ArrowUpRight, Eye, ArrowDownLeft, CreditCard, Landmark, Wallet } from "lucide-react";
import {
  bankAccountApi,
  useGetAllBankAccountsQuery,
  useGetBankAccountByIdQuery,
} from "../../redux/api/bankAccountApi";
import BankAccountModal from "../../components/Modal/BankAccountModal";
import { useGetPaymentInByIdQuery, useUpdatePaymentInMutation } from "../../redux/api/paymentInApi";
import { useGetPaymentOutByIdQuery, useUpdatePaymentOutMutation } from "../../redux/api/paymentOutApi";
import PaymentOutModal from "../../components/Modal/PaymentOutModal";
import PaymentInModal from "../../components/Modal/PaymentInModal";
import { toast } from "react-toastify";
import { cashInHandApi } from "../../redux/api/cashInHandApi";
import { useDispatch } from "react-redux";
import { useGetAllPartiesQuery } from "../../redux/api/partyAPi";
import PartyAddModal from "../../components/Modal/PartyAddModal";

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
// function BankDetailPanel({ bankId, onEdit }) {
//   //const location = useLocation();
//   const dispatch=useDispatch();
//   const [page, setPage] = useState(1);

//   const { data, isLoading, isFetching } = useGetBankAccountByIdQuery(
//     { Bank_Account_Id: bankId, page, limit: 10 },
//     { skip: !bankId }
//   );
//     const { data: banks = [] } = useGetAllBankAccountsQuery();
//   const [modalState, setModalState] = useState({ open: false, type: null, id: null });
// const [updatePaymentOut, { isLoading: isUpdatingPaymentOut }] = useUpdatePaymentOutMutation();
//  const [updatePaymentIn, { isLoading: isUpdatingPaymentIn }] = useUpdatePaymentInMutation();
//   const openModal = (type, id) => {
//     setModalState({ open: true, type, id });
//   };

//   const closeModal = () => setModalState({ open: false, type: null, id: null });
//   const bank = data?.bankAccount;
//   const ledger = data?.transactions ?? [];
//   const totalPages = data?.totalPages ?? 1;

//   console.log({ bank, ledger, totalPages });

//   if (!bankId) {
//     return (
//       <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3" style={{ minHeight: "400px" }}>
//         <Landmark size={48} strokeWidth={1.2} />
//         <p className="text-base">Select a bank account to view details</p>
//       </div>
//     );
//   }

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center h-full text-gray-400" style={{ minHeight: "400px" }}>
//         <p>Loading...</p>
//       </div>
//     );
//   }
//  const handleSavePaymentIn = async (formData) => {
//   console.log("Form Data (from RHF):", formData);
//     try {
//       await updatePaymentIn({ id: modalState.id, ...formData }).unwrap();
//       dispatch(cashInHandApi.util.invalidateTags(["CashInHand"]));
//      dispatch(bankAccountApi.util.invalidateTags([
//   { type: "BankAccount", id: formData.Bank_Account_Id },
//   "BankAccount",   // ← this hits getAllBankAccounts which providesTags: ["BankAccount"]
// ]));
//       closeModal();
//       toast.success("Payment In updated");
//     } catch (err) {
//       console.error("Failed to save payment in:", err);
//       toast.error(err?.data?.message || "Failed to save payment in. Please try again.");
//     }
//   };

//   const handleSavePaymentOut = async (formData) => {
//     try {
//       await updatePaymentOut({ id: modalState.id, ...formData }).unwrap();
//       dispatch(cashInHandApi.util.invalidateTags(["CashInHand"]));
//      dispatch(bankAccountApi.util.invalidateTags([
//   { type: "BankAccount", id: formData.Bank_Account_Id },
//   "BankAccount",   // ← this hits getAllBankAccounts which providesTags: ["BankAccount"]
// ]));
//       closeModal();
//       toast.success("Payment Out updated");
//     } catch (err) {
//       console.error("Failed to save payment out:", err);
//       toast.error(err?.data?.message || "Failed to save payment out. Please try again.");
//     }
//   };

//   return (
//     <div className="flex flex-col h-full">

//       {/* ── BANK SUMMARY CARD ── */}
//       <div
//         className="rounded-xl p-2 mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
//       //style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}
//       >
//         {/* <div className="flex items-center gap-4">
//           <div
//             className="flex items-center justify-center rounded-xl"
//             style={{ width: 20, height: 20, backgroundColor: "#4CA1AF22" }}
//           >
//             <Building2 size={26} style={{ color: "#4CA1AF" }} />
//           </div>
//           <div>
//             <h4 className="font-bold text-gray-900" style={{ fontSize: 18, margin: 0 }}>
//               {bank?.Bank_Name}
//             </h4>
//             <p className="text-gray-500 text-sm mt-0.5">
//               A/C: {bank?.Account_Number || "—"} &nbsp;·&nbsp; {bank?.Account_Type || "—"}
//             </p>
//             {bank?.IFSC_Code && (
//               <p className="text-gray-400 text-xs mt-0.5">IFSC: {bank?.IFSC_Code}</p>
//             )}
//           </div>
//         </div> */}
//         <div className="flex items-center gap-4">
//           <div
//             className="flex items-center justify-center rounded-xl"
//             style={{ width: 20, height: 20, backgroundColor: "#4CA1AF22" }}
//           >
//             <Building2 size={26} style={{ color: "#4CA1AF" }} />
//           </div>

//           <div>
//             <h6
//               className="font-bold text-gray-900"
//               style={{ fontSize: 18, margin: 0 }}
//             >
//               {bank?.Bank_Name}
//             </h6>

//             <p className="text-gray-500 text-sm mt-0.5">
//               A/C: <span className="font-medium">{bank?.Account_Number || "—"}</span>
//               {" • "}
//               IFSC: <span className="font-medium">{bank?.IFSC_Code || "—"}</span>
//             </p>
//           </div>
//         </div>

//         <div className="flex items-center gap-3">
//           {/* Balance chip */}
//           {/* <div
//             className="rounded-lg px-4 py-2 text-right"
//             style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", minWidth: 140 }}
//           >
//             <p className="text-xs text-gray-400 mb-0.5">Current Balance</p>
//             <p
//               className="font-bold"
//               style={{
//                 fontSize: 18,
//                 color: Number(bank?.Balance ?? 0) < 0 ? "#dc2626" : "#16a34a",
//               }}
//             >
//               ₹ {fmt(bank?.Balance ?? 0)}
//             </p>
//           </div> */}

//           {/* Edit button */}
//           {/* <button
//             type="button"
//             onClick={() => onEdit(bank)}
//             className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-white"
//             style={{ backgroundColor: "#4CA1AF", whiteSpace: "nowrap" }}
//           >
//             <SquarePen size={15} />
//             Edit
//           </button> */}
//         </div>
//       </div>

//       {/* ── MINI STATS ROW ── */}
//       {/* <div className="grid grid-cols-3 gap-3 mb-4">
//         {[
//           { label: "Total In",  value: data?.totalIn,  color: "#16a34a", bg: "#f0fdf4" },
//           { label: "Total Out", value: data?.totalOut, color: "#dc2626", bg: "#fff1f2" },
//           { label: "Net",       value: data?.net,      color: "#4CA1AF", bg: "#f0f9ff" },
//         ].map((s) => (
//           <div key={s.label} className="rounded-lg p-3" style={{ backgroundColor: s.bg, border: `1px solid ${s.color}22` }}>
//             <p className="text-xs font-medium mb-1" style={{ color: s.color }}>{s.label}</p>
//             <p className="font-bold text-sm" style={{ color: s.color }}>₹ {fmt(s.value)}</p>
//           </div>
//         ))}
//       </div> */}

//       {/* ── LEDGER TABLE ── */}
//       <div className="flex-1 overflow-x-auto">
//         {/* <table className="w-full" style={{ fontSize: 13, borderCollapse: "collapse" }}>
//           <thead>
//             <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
//               {["Sl No", "Type", "Party", "Date", "Amount", ""].map((h) => (
//                 <th key={h} className="text-left py-2 px-2 font-semibold text-gray-500"
//                   style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
//                   {h}
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {ledger.length === 0 ? (
//               <tr>
//                 <td colSpan={6} className="text-center py-10 text-gray-400">
//                   No transactions found
//                 </td>
//               </tr>
//             ) : (
//               ledger.map((row, idx) => {
//                 const meta = TYPE_META[row.source_type] ?? { label: row.source_type, color: "#6b7280", bg: "#f9fafb", dir: "in" };
//                 return (
//                   <tr key={idx}
//                     style={{ borderBottom: "1px solid #f1f5f9" }}
//                     className="hover:bg-gray-50 transition-colors">
//                     <td className="py-2 px-2 text-gray-400" style={{ fontSize: 12 }}>
//                       {(page - 1) * 10 + idx + 1}
//                     </td>
//                     <td className="py-2 px-2">
//                       <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
//                         style={{ backgroundColor: meta.bg, color: meta.color }}>
//                         {meta.dir === "in"
//                           ? <ArrowDownLeft size={11} />
//                           : <ArrowUpRight size={11} />}
//                         {meta.label}
//                       </span>
//                     </td>
//                     <td className="py-2 px-2 text-gray-700">{row.party_name || "—"}</td>
//                     <td className="py-2 px-2 text-gray-500" style={{ whiteSpace: "nowrap" }}>
//                       {fmtDate(row.txn_date)}
//                     </td>
//                     <td className="py-2 px-2 font-semibold" style={{ color: meta.color, whiteSpace: "nowrap" }}>
//                       {meta.dir === "in" ? "+" : "−"} ₹ {fmt(row.amount)}
//                     </td>
//                     <td className="py-2 px-2">
//                       {row.source_id && row.source_type !== "adjustment" && (
//                         <NavLink
//                           to={`/${row.source_type.replace("_", "/")}/view/${row.source_id}`}
//                           className="text-xs"
//                           style={{ color: "#4CA1AF" }}
//                         >
//                           View
//                         </NavLink>
//                       )}
//                     </td>
//                   </tr>
//                 );
//               })
//             )}
//           </tbody>
//         </table> */}
//         <table className="w-full min-w-[500px]">
//           <thead>
//             <tr>
//               <th className="text-left">Sl.No</th>
//               <th className="text-left">Type</th>
//               <th className="text-left">Party</th>
//               <th className="text-left">Date</th>
//               <th className="text-left">Amount</th>
//               <th>View/Edit</th>
//             </tr>
//           </thead>

//           <tbody>
//             {ledger?.length > 0 ? (
//               ledger.map((row, idx) => {
//                 // const meta =
//                 //   TYPE_META[row.Txn_Type] ?? {
//                 //     label: row.Txn_Type,
//                 //     color: "#6b7280",
//                 //     dir: row.Direction === "Credit" ? "in" : "out",
//                 //   };
//                 const meta =
//                   TYPE_META[row.Txn_Type?.toLowerCase()] ?? {
//                     label: row.Txn_Type,
//                     color: "#6b7280",
//                     dir: row.Direction === "Credit" ? "in" : "out",
//                   };

//                 return (
//                   <tr key={row.id}>
//                     <td>{(page - 1) * 10 + idx + 1}.</td>

//                     <td>{meta.label}</td>

//                     <td>{row.Party_Name || "N/A"}</td>

//                     <td>
//                       {row.Txn_Date
//                         ? new Date(row.Txn_Date).toLocaleDateString("en-IN", {
//                           day: "numeric",
//                           month: "numeric",
//                           year: "numeric",
//                         })
//                         : "N/A"}
//                     </td>

//                     {/* <td
//                       style={{
//                         color: meta.color,
//                         fontWeight: 600,
//                       }}
//                     >
//                       {meta.dir === "in" ? "+" : "-"} ₹ {fmt(row.Amount)}
//                     </td> */}
//                     <td
//                       style={{
//                         color: meta.color,
//                         fontWeight: 600,
//                       }}
//                     >
//                       ₹ {fmt(row.Amount)}
//                     </td>


//       <td>
//         {row.Formatted_Reference_Id && (
//           MODAL_TXN_TYPES.includes(row.Txn_Type) ? (
//             <Eye
//               style={{ cursor: "pointer", color: "#4CA1AF" }}
//               onClick={() => openModal(row.Txn_Type, row.Formatted_Reference_Id)}
//             />
//           ) : (
//              <NavLink
//         to={`/${TXN_TYPE_ROUTE_MAP[row.Txn_Type]}/edit/${row.Formatted_Reference_Id}`}
//         state={{ from: "bank-accounts", bankId }}
//       >
//               <Eye style={{ cursor: "pointer", color: "#4CA1AF" }} />
//             </NavLink>
//           )
//         )}
//       </td>



//                     {/* <td>
//                       {row.Formatted_Reference_Id && (
//                         <NavLink
//                           to={`/${TXN_TYPE_ROUTE_MAP[row.Txn_Type]}/edit/${row.Formatted_Reference_Id}`}
//                         >
//                           <Eye
//                             style={{
//                               cursor: "pointer",
//                               color: "#4CA1AF",
//                             }}
//                           />
//                         </NavLink>
//                       )}
//                     </td> */}
//                   </tr>
//                 );
//               })
//             ) : (
//               <tr>
//                 <td className="text-center" colSpan={6}>
//                   No transactions found
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>
//            {modalState.open && modalState.type === "Payment_In" && (
//          <PaymentInModalLoader
//           id={modalState.id}
//           banks={banks}
//           onClose={closeModal}
//           onSave={handleSavePaymentIn}
//           isSaving={isUpdatingPaymentIn}
//         />
//       )}
//       {modalState.open && modalState.type === "Payment_Out" && (
//         <PaymentOutModalLoader
//           id={modalState.id}
//           banks={banks}
//           onClose={closeModal}
//           onSave={handleSavePaymentOut}
//           isSaving={isUpdatingPaymentOut}
//         />
//       )}

//       {/* ── PAGINATION ── */}
//       {totalPages > 1 && (
//         <div className="flex justify-center gap-2 pt-4 flex-wrap">
//           <button
//             disabled={page === 1}
//             onClick={() => setPage((p) => Math.max(1, p - 1))}
//             className={`px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm ${page === 1 ? "opacity-50" : ""}`}
//           >
//             ← Prev
//           </button>
//           {[...Array(totalPages).keys()].map((i) => (
//             <button key={i}
//               onClick={() => setPage(i + 1)}
//               className={`px-3 py-1 rounded text-sm ${page === i + 1 ? "text-white" : "bg-gray-200 hover:bg-gray-300"}`}
//               style={page === i + 1 ? { backgroundColor: "#4CA1AF" } : {}}
//             >
//               {i + 1}
//             </button>
//           ))}
//           <button
//             disabled={page === totalPages}
//             onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
//             className={`px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm ${page === totalPages ? "opacity-50" : ""}`}
//           >
//             Next →
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }
/* ═══════════════════════════════════════════════════════════════════
   Replace your BankDetailPanel function with this.
   Everything else in BankAccounts.jsx stays the same.

   KEY CHANGES:
   - page state starts at 1, increments on scroll
   - ledger state accumulates rows (never replaces)
   - IntersectionObserver watches a sentinel div at the bottom
   - When bankId changes → reset everything
   - RTK Query called per page, results appended to local state
═══════════════════════════════════════════════════════════════════ */



function BankDetailPanel({ bankId, onEdit }) {
  const dispatch = useDispatch();

  /* ── infinite scroll state ── */
  const [page, setPage] = useState(1);
  const [ledger, setLedger] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef(null);   // div at bottom of list
  const observerRef = useRef(null);   // IntersectionObserver instance

  /* ── modals ── */
  const [modalState, setModalState] = useState({ open: false, type: null, id: null });
  const openModal = (type, id) => setModalState({ open: true, type, id });
  const closeModal = () => setModalState({ open: false, type: null, id: null });

  /* ── mutations ── */
  const [updatePaymentOut, { isLoading: isUpdatingPaymentOut }] = useUpdatePaymentOutMutation();
  const [updatePaymentIn, { isLoading: isUpdatingPaymentIn }] = useUpdatePaymentInMutation();
const { data: partiesList } = useGetAllPartiesQuery();
  /* ── bank list for modals ── */
  const { data: banks = [] } = useGetAllBankAccountsQuery();

  /* ── RTK Query — one page at a time ── */
  const { data, isLoading, isFetching } = useGetBankAccountByIdQuery(
    { Bank_Account_Id: bankId, page, limit: 15 },
    { skip: !bankId }
  );

  /* ── Reset when bankId changes ── */
  useEffect(() => {
    setPage(1);
    setLedger([]);
    setHasMore(true);
  }, [bankId]);

  /* ── Append new page of transactions ── */
  useEffect(() => {
    if (!data?.transactions) return;

    setLedger((prev) => {
      /* deduplicate by bt.id in case RTK refetches */
      const existingIds = new Set(prev.map((r) => r.id));
      const fresh = data.transactions.filter((r) => !existingIds.has(r.id));
      return [...prev, ...fresh];
    });

    /* no more pages? */
    if (page >= (data.totalPages ?? 1)) {
      setHasMore(false);
    }
  }, [data]);

  /* ── IntersectionObserver: load next page when sentinel visible ── */
  const handleObserver = useCallback(
    (entries) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore && !isFetching && !isLoading) {
        setPage((prev) => prev + 1);
      }
    },
    [hasMore, isFetching, isLoading]
  );

  useEffect(() => {
    /* disconnect old observer */
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,       // viewport
      rootMargin: "0px",
      threshold: 0.1,
    });

    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [handleObserver]);

  /* ── handlers ── */
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

  const bank = data?.bankAccount;

  /* ── empty state ── */
  if (!bankId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3"
        style={{ minHeight: "400px" }}>
        <Landmark size={48} strokeWidth={1.2} />
        <p className="text-base">Select a bank account to view details</p>
      </div>
    );
  }

  /* ── first load skeleton ── */
  if (isLoading && page === 1) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400"
        style={{ minHeight: "400px" }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">

      {/* ── BANK SUMMARY CARD ── */}
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
          </div>
        </div>
      </div>

      {/* ── LEDGER TABLE ── */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full min-w-[500px]">
          <thead>
            <tr>
              <th className="text-left">Sl.No</th>
              <th className="text-left">Type</th>
              <th className="text-left">Party</th>
              <th className="text-left">Date</th>
              <th className="text-left">Amount</th>
              <th>View/Edit</th>
            </tr>
          </thead>

          <tbody>
            {ledger.length === 0 && !isLoading ? (
              <tr>
                <td className="text-center" colSpan={6} style={{ padding: "40px 0", color: "#9ca3af" }}>
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
                  <tr key={row.id}>
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
                    <td>
                      {row.Formatted_Reference_Id && (
                        MODAL_TXN_TYPES.includes(row.Txn_Type) ? (
                          <Eye
                            style={{ cursor: "pointer", color: "#4CA1AF" }}
                            onClick={() => openModal(row.Txn_Type, row.Formatted_Reference_Id)}
                          />
                        ) : (
                          <NavLink
                            to={`/${TXN_TYPE_ROUTE_MAP[row.Txn_Type]}/edit/${row.Formatted_Reference_Id}`}
                            state={{ from: "bank-accounts", bankId }}
                          >
                            <Eye style={{ cursor: "pointer", color: "#4CA1AF" }} />
                          </NavLink>
                        )
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* ── SENTINEL + LOADING INDICATOR ── */}
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
export default function BankAccounts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState(
    searchParams.get("bankId") ? Number(searchParams.get("bankId")) : null
  );
  //const [selectedId, setSelectedId] = useState(null);
  const [editingBank, setEditingBank] = useState(null); // for future edit modal
  const [bankModal, setBankModal] = useState({ open: false, mode: "add", data: null });
  const { data: banks = [], isLoading } = useGetAllBankAccountsQuery();
  useEffect(() => {
    const urlBankId = searchParams.get("bankId");
    if (urlBankId && Number(urlBankId) !== selectedId) {
      setSelectedId(Number(urlBankId));
    }
    // 🔹 If no bankId in URL yet but banks have loaded, default to the first account
    if (!urlBankId && !isLoading && banks.length > 0) {
      setSelectedId(banks[0].Bank_Account_Id);
      setSearchParams({ bankId: banks[0].Bank_Account_Id }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, banks]);
  const handleEdit = (bank) => {
    setEditingBank(bank);
    // TODO: open your BankEditModal here
    // setEditModalOpen(true);
    //console.log("Edit bank:", bank);
    setBankModal({ open: true, mode: "edit", data: bank });
  };
  const handleSelectBank = (bankAccountId) => {
    setSelectedId(bankAccountId);
    setSearchParams({ bankId: bankAccountId });   // 🔹 keep URL in sync when user clicks a row
  };

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
                const isSelected = selectedId === bank.Bank_Account_Id;
                return (
                  <div
                    key={bank.Bank_Account_Id}
                    onClick={() => handleSelectBank(bank.Bank_Account_Id)}
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