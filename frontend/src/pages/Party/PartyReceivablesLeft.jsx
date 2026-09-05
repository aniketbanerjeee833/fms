import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { useSearchParams } from "react-router-dom";
import { partyApi, useGetAllPartiesQuery, useGetAllReceivablePartiesQuery, useGetSinglePartyDetailsSalesPurchasesQuery, useLazyGetPartyPrintReportQuery } from "../../redux/api/partyAPi";
import { MoreVertical, Users, SquarePen, Trash2, Eye, Search, Printer, FileSpreadsheet, PrinterIcon } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import PartyAddModal from "../../components/Modal/PartyAddModal";
import { useDispatch } from "react-redux";
import { useDeletePaymentOutMutation, useGetPaymentOutByIdQuery, useUpdatePaymentOutMutation } from "../../redux/api/paymentOutApi";
import { useDeletePaymentInMutation, useGetPaymentInByIdQuery, useUpdatePaymentInMutation } from "../../redux/api/paymentInApi";
import { cashInHandApi } from "../../redux/api/cashInHandApi";
import { bankAccountApi, useGetAllBankAccountsQuery } from "../../redux/api/bankAccountApi";
import { toast } from "react-toastify";
import PaymentInModal from "../../components/Modal/PaymentInModal";
import PaymentOutModal from "../../components/Modal/PaymentOutModal";
import DeleteConfirmModal from "../../components/Modal/DeleteConfirmModal";
import { purchaseApi, useDeletePurchaseMutation, useGetSinglePurchaseQuery } from "../../redux/api/purchaseApi";
import { useDeletePurchaseReturnMutation, useGetPurchaseReturnByIdQuery } from "../../redux/api/purchaseReturnApi";

import { useDeleteSaleReturnMutation, useGetSaleReturnByIdQuery } from "../../redux/api/saleReturnApi";
import { saleApi, useDeleteSaleMutation, useGetSingleSaleQuery } from "../../redux/api/saleApi";
import { itemApi } from "../../redux/api/itemApi";
import PaymentInOutPrintTemplate from "../../components/PaymentInOutPrintTemplate";
import CreditDebitNotePrintTemplate from "../../components/CreditDebitNotePrintTemplate";
import InvoicePrintTemplate from "../../components/InvoicePrintTemplate";
import { useReactToPrint } from "react-to-print";
import PartyBulkReportPrintTemplate from "../../components/Print/PartyBulkReportPrintTemplate";
import ExpensePrintTemplate from "../../components/ExpensePrintTemplate";
import {
  useGetExpenseByIdQuery,
  useDeleteExpenseMutation,
} from "../../redux/api/expenseApi";
import VirtualScrollList from "../../components/VirtualScrollList";

const TXN_TYPE_ROUTE_MAP = {
  Sale: "sale",
  Purchase: "purchase",
  Expense: "expense",
  Sale_Return: "sale/return",
  Purchase_Return: "purchase/return",
};

const MODAL_TXN_TYPES = ["Payment_In", "Payment_Out"];

const PARTY_TYPE_META = {
  Sale: { label: "Sale", color: "#059669" },
  Purchase: { label: "Purchase", color: "#dc2626" },
  Expense: { label: "Expense", color: "#dc2626" },
  Sale_Return: { label: "Sale Return", color: "#059669" },
  Purchase_Return: { label: "Purchase Return", color: "#dc2626" },
  Payment_In: { label: "Payment In", color: "#059669" },
  Payment_Out: { label: "Payment Out", color: "#dc2626" },
};

function PaymentInModalLoader({ id, banks, onClose, onSave, isSaving, parties }) {
  const { data: record, isLoading } = useGetPaymentInByIdQuery(id);
  if (isLoading || !record) return null;

  return (
    <PaymentInModal
      mode="edit"
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
      PartyAddModal={PartyAddModal}
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
  Expense: {
    title: "Delete Expense",
    label: "expense",
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
/* ════════════════════════════════════════════════════════════
   RIGHT PANEL — Party Detail (infinite scroll ledger)
   Transaction search persists in the URL (?txnSearch=...) so it
   survives refresh / back-navigation, same as the left party list.
   Note: `cursor` (pagination position) intentionally stays local —
   only the search TEXT needs to persist, not "which page you were on".
════════════════════════════════════════════════════════════ */
function PartyDetailPanel({ partyId, setSelectedPartyDetails }) {

  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const search = searchParams.get("txnSearch") || "";
  const [cursor, setCursor] = useState(null);

  //const sentinelRef = useRef(null);
  //const observerRef = useRef(null);
  const [modalState, setModalState] = useState({ open: false, type: null, id: null });
  const openModal = (type, id) => setModalState({ open: true, type, id });
  const closeModal = () => setModalState({ open: false, type: null, id: null });
  const [rowMenuOpen, setRowMenuOpen] = useState(null);

  const { data: partiesList } = useGetAllPartiesQuery();
  const { data: banks = [] } = useGetAllBankAccountsQuery();
  const [updatePaymentOut, { isLoading: isUpdatingPaymentOut }] = useUpdatePaymentOutMutation();
  const [updatePaymentIn, { isLoading: isUpdatingPaymentIn }] = useUpdatePaymentInMutation();
  const initialRightLimit = useRef(
    Number(sessionStorage.getItem("partiesByPartyReceivable:rightCount")) || 10
  );
  const { data, isLoading, isFetching } = useGetSinglePartyDetailsSalesPurchasesQuery(
    { Party_Id: partyId, cursor, search, limit: initialRightLimit.current },
    { skip: !partyId }
  );
  const [deleteTarget, setDeleteTarget] = useState(null); // holds the purchase to delete
  const printRef = useRef(null);
  // const[selecedSales,setSelectedSales]= useState(null);
  const [showPartyBulkPrintReview, setShowPartyBulkPrintPreview] = useState(false);

  const bulkPartyPrintRef = useRef(null);
  const [printTarget, setPrintTarget] = useState({ type: null, id: null });


  /* fire the correct query hook — only ONE will actually run at a time
     because of the `skip` condition on each  
     
     */

  const [
    triggerPartyPrintBulkReport,
    {
      data: bulkPartyPrintReportData,
      isFetching: isBulkPartyFetching,
    },
  ] = useLazyGetPartyPrintReportQuery();
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
  const { data: printExpenseData } = useGetExpenseByIdQuery(printTarget.id, {
    skip: printTarget.type !== "Expense" || !printTarget.id,
  });
  const printReady =
    (printTarget.type === "Sale" && printSaleData?.invoicePartyDetails) ||
    (printTarget.type === "Purchase" && printPurchaseData?.billPurchaseDetails) ||
    (printTarget.type === "Expense" && printExpenseData?.expense) ||
    (printTarget.type === "Sale_Return" && printSaleReturnData?.saleReturn) ||
    (printTarget.type === "Purchase_Return" && printPurchaseReturnData?.purchaseReturn) ||
    (printTarget.type === "Payment_In" && printPaymentInData?.paymentIn) ||
    (printTarget.type === "Payment_Out" && printPaymentOutData?.paymentOut);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: printTarget.id ? `${printTarget.type}-${printTarget.id}` : "Document",
    onAfterPrint: () => setPrintTarget({ type: null, id: null }),
  });

  /* fire print automatically once the right data has arrived */
  useEffect(() => {
    if (printReady && printTarget.id) {
      handlePrint();
    }
  }, [printReady, printTarget.id]);
  useEffect(() => {
    if (data?.partyDetails) {
      setSelectedPartyDetails(data.partyDetails);
    }
  }, [data, setSelectedPartyDetails]);
  console.log("data", data);
  const fmt = (n) =>
    Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleSearchChange = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set("txnSearch", value);
    } else {
      next.delete("txnSearch");
    }
    setSearchParams(next, { replace: true });
  };

  /* reset pagination when party or search changes */
  useEffect(() => {
    setCursor(null);
  }, [partyId, search]);

  // RTK Query's merge() already accumulates every page into data.transactions
  // for this cache key — no local ledger state or manual merge needed.
  const ledger = data?.transactions || [];
  const hasMore = data?.hasMore ?? false;
  const nextCursor = data?.nextCursor ?? null;
  const handleLoadMore = useCallback(() => {
    if (!hasMore || !nextCursor || isFetching) return;
    setCursor(nextCursor);
  }, [hasMore, nextCursor, isFetching]);
  // const handleObserver = useCallback(
  //   (entries) => {
  //     if (entries[0].isIntersecting && hasMore && nextCursor && !isFetching && !isLoading) {
  //       setCursor(nextCursor);
  //     }
  //   },
  //   [hasMore, nextCursor, isFetching, isLoading]
  // );

  // useEffect(() => {
  //   if (observerRef.current) observerRef.current.disconnect();
  //   observerRef.current = new IntersectionObserver(handleObserver, {
  //     root: null,
  //     rootMargin: "0px",
  //     threshold: 0.1,
  //   });
  //   if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
  //   return () => observerRef.current?.disconnect();
  // }, [handleObserver]);


  useEffect(() => {
    const closeRowMenu = () => {
      setRowMenuOpen(null);
    };

    document.addEventListener("click", closeRowMenu);

    return () => {
      document.removeEventListener("click", closeRowMenu);
    };
  }, []);

  const party = data?.partyDetails;

  // const handleTransactionDoubleClick = (row, transactionId) => {
  //   if (MODAL_TXN_TYPES.includes(row.Txn_Type)) {
  //     openModal(row.Txn_Type, transactionId);
  //     return;
  //   }

  //   const route = TXN_TYPE_ROUTE_MAP[row.Txn_Type];

  //   if (route) {
  //     navigate(
  //       {
  //         pathname: `/${route}/edit/${transactionId}`,
  //         search: searchParams.toString(),
  //       },
  //       { state: { from: "party-details", partyId } }
  //     );
  //   }
  // };

  const handleSavePaymentIn = async (formData) => {
    try {
      await updatePaymentIn({ id: modalState.id, ...formData }).unwrap();
      dispatch(cashInHandApi.util.invalidateTags(["CashInHand"]));
      dispatch(bankAccountApi.util.invalidateTags([
        { type: "BankAccount", id: formData.Bank_Account_Id },
        "BankAccount",
      ]));
      setCursor(null);
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
      setCursor(null);
      closeModal();
      toast.success("Payment Out updated");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to save payment out.");
    }
  };

  const [deleteSale, { isLoading: isDeletingSale }] = useDeleteSaleMutation();
  const [deletePurchase, { isLoading: isDeletingPurchase }] = useDeletePurchaseMutation();
  const [deleteSaleReturn, { isLoading: isDeletingSaleReturn }] = useDeleteSaleReturnMutation();
  const [deletePurchaseReturn, { isLoading: isDeletingPurchaseReturn }] = useDeletePurchaseReturnMutation();
  const [deletePaymentIn, { isLoading: isDeletingPaymentIn }] = useDeletePaymentInMutation();
  const [deletePaymentOut, { isLoading: isDeletingPaymentOut }] = useDeletePaymentOutMutation();
  const [deleteExpense, { isLoading: isDeletingExpense }] = useDeleteExpenseMutation();
  const isDeleting =
    isDeletingSale ||
    isDeletingPurchase ||
    isDeletingSaleReturn ||
    isDeletingPurchaseReturn ||
    isDeletingPaymentIn ||
    isDeletingPaymentOut ||
    isDeletingExpense;
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

        case "Expense":
          res = await deleteExpense({
            id: deleteTarget.Id,
          }).unwrap();
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

        default:
          toast.error(
            "Unknown transaction type — cannot delete"
          );
          return;
      }

      toast.success(res?.message || "Deleted successfully");

      setDeleteTarget(null);

      dispatch(
        partyApi.util.invalidateTags([
          "Party",
          "PartyLedger"
        ])
      );
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

      // IMPORTANT:
      // Don't close modal here.
      // User should see the error and can close it manually.
    }
  };
  const handleBulkPrint = useReactToPrint({
    contentRef: bulkPartyPrintRef,
    documentTitle: `Party-Report`,
    onAfterPrint: () => setShowPartyBulkPrintPreview(false),
  });

  /* trigger fetch on button click */
  const handlePrintAllClick = async () => {
    await triggerPartyPrintBulkReport({ Party_Id: partyId, search });
    setShowPartyBulkPrintPreview(true);
  };

  /* fire print once report data has arrived */
  useEffect(() => {
    if (bulkPartyPrintReportData && showPartyBulkPrintReview) {
      handleBulkPrint();
    }
  }, [bulkPartyPrintReportData, showPartyBulkPrintReview]);
  // const rightPanelRef = useRef(null);

  // const highlightedRowRef = useRef(null);
  //     useEffect(() => {

  //         const rightEl = rightPanelRef.current;


  //         const saveRight = () => {
  //             console.log("saveRight fired", rightEl.scrollTop, ledger.length);
  //             sessionStorage.setItem("partiesByPartyReceivable:rightScroll", rightEl.scrollTop);
  //             sessionStorage.setItem("partiesByPartyReceivable:rightCount", ledger.length);
  //             // sessionStorage.setItem("itemsByItem:rightScroll", rightEl.scrollTop);
  //             // sessionStorage.setItem("itemsByItem:rightCount", transactions.length);
  //         };


  //         rightEl?.addEventListener("scroll", saveRight);

  //         return () => {

  //             rightEl?.removeEventListener("scroll", saveRight);
  //         };
  //     }, [ ledger.length]);
  // const hasRestoredRightRef = useRef(false);
  //  const [isRestoringRight, setIsRestoringRight] = useState(true);


  //  useLayoutEffect(() => {
  //     if (hasRestoredRightRef.current) {
  //         setIsRestoringRight(false);
  //         return;
  //     }
  //     if (isLoading || isFetching) return;

  //     const savedCount = Number(sessionStorage.getItem("partiesByPartyReceivable:rightCount")) || 0;
  //      // keep waiting only if we might still get more data
  //     if (ledger.length < savedCount && hasMore) return;

  //     highlightedRowRef.current?.scrollIntoView({ block: "center", behavior: "auto" });
  //     hasRestoredRightRef.current = true;
  //     setIsRestoringRight(false); // reveal now, correctly positioned
  // }, [isLoading, isFetching, ledger.length, hasMore]);
  const virtualListRef = useRef(null);
  const hasScrolledToHighlightRef = useRef(false);

  useEffect(() => {
    if (hasScrolledToHighlightRef.current) return;

    const highlightTxnId =
      searchParams.get("highlightTxn");

    if (!highlightTxnId) return;
    if (isLoading || isFetching) return;
    if (!ledger?.length) return;

    const targetIndex = ledger.findIndex((row) => {
      const refId =
        row.Sale_Id ||
        row.Purchase_Id ||
        row.Expense_Id ||
        row.Sale_Return_Id ||
        row.Purchase_Return_Id ||
        row.Payment_In_Id ||
        row.Payment_Out_Id;

      const transactionId =
        row.Expense_Id ||
        row.Formatted_Reference_Id ||
        refId;

      return (
        String(transactionId) ===
        String(highlightTxnId)
      );
    });

    if (targetIndex === -1) {
      if (hasMore && !isFetching) {
        handleLoadMore();
      }
      return;
    }

    const timer = setTimeout(() => {
      virtualListRef.current?.scrollToIndex(
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
    ledger,
    isLoading,
    isFetching,
    hasMore,
    searchParams,
    handleLoadMore,
  ]);
  useEffect(() => {
    hasScrolledToHighlightRef.current = false;
  }, [partyId]);
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

  if (isLoading && !cursor) {
    return (
      <div
        className="flex items-center justify-center h-full text-gray-400"
        style={{ minHeight: "400px" }}
      >
        <p>Loading...</p>
      </div>
    );
  }
  const handlePrintClick = (row, transactionId) => {
    console.log(row, "row", transactionId, "transactionId");
    setPrintTarget({ type: row.Txn_Type, id: transactionId });
  };
  const handleExportPartyReportExcel = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);

    const a = document.createElement("a");
    a.href = `http://localhost:4000/api/party/export-party-report-excel/${partyId}?${params.toString()}`;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    // <div ref={rightPanelRef}
    <div
      className="flex flex-col "

      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* ── PARTY SUMMARY CARD ── */}
      <div className="rounded-xl p-2 mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="flex items-center justify-center rounded-xl"
            style={{ width: 20, height: 20, backgroundColor: "#4CA1AF22" }}
          >
            <Users size={26} style={{ color: "#4CA1AF" }} />
          </div>
          {/* <div>
            <h6 className="font-bold text-gray-900" style={{ fontSize: 18, margin: 0 }}>
              {party?.Party_Name}
            </h6>
            <p className="text-gray-500 text-sm mt-0.5">
             
              {" • "}
              State: <span className="font-medium">{party?.State || "—"}</span>
            </p>
          </div> */}
          <div>
            <h6
              className="font-bold text-gray-900"
              style={{ fontSize: 18, margin: 0 }}
            >
              {party?.Party_Name}
            </h6>

            {/* Contact Info */}
            <div className="mt-1 text-sm text-gray-600">
              {party?.Phone_Number && (
                <p className="m-0">
                  📞 {party.Phone_Number}
                </p>
              )}



              {party?.addresses?.[0]?.Address_Text && (
                <p className="m-0 truncate">
                  📍 {party.addresses[0].Address_Text}
                </p>
              )}
            </div>

            {/* Financial Info */}
            <div className="flex flex-wrap gap-4 mt-2 text-xs">
              {party?.Credit_Limit_Type !== "No_Limit" &&
                party?.Credit_Limit && (
                  <span className="text-gray-600">
                    Credit Limit: ₹{Number(party.Credit_Limit).toFixed(2)}
                  </span>
                )}


            </div>
          </div>
        </div>

        {/* search bar — right side, persisted as ?txnSearch= */}
        <div className="flex justify-end">

          <div
            className="relative"
            style={{
              width: 220,
              minWidth: 0,
              maxWidth: 220,
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
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search"
              className="w-full h-full border rounded-md text-sm outline-none"
              style={{
                width: "100%",
                height: 36,
                paddingLeft: 34,
                paddingRight: 10,
                borderColor: "#dbe3ea",
                boxSizing: "border-box",
              }}
            />
          </div>

        </div>

      </div>
      <div className="flex justify-end gap-2 mr-2">
        <button
          type="button"
          onClick={handleExportPartyReportExcel}
          className="group flex items-center gap-2 rounded-lg bg-emerald-50 px-3.5 py-2 
                                                                                text-sm font-medium text-emerald-700 ring-1 ring-emerald-200 transition-all duration-200 hover:bg-emerald-100 hover:ring-emerald-300 active:scale-95"
          title="Export to Excel"
        >
          <FileSpreadsheet
            size={16}
            strokeWidth={2.2}
            className="text-emerald-600 transition-transform duration-200 group-hover:scale-110"
          />
          {/* Export Excel */}
        </button>
        <button
          type="button"
          onClick={handlePrintAllClick}
          disabled={isBulkPartyFetching}
          className="group flex items-center gap-2 rounded-lg bg-blue-50 px-3.5 py-2 text-sm font-medium text-blue-700 ring-1 ring-blue-200 transition-all duration-200 hover:bg-blue-100 hover:ring-blue-300 active:scale-95 disabled:opacity-50"
          title="Print  Reports"
        >
          <PrinterIcon size={16} strokeWidth={2.2} className="text-blue-600 transition-transform duration-200 group-hover:scale-110" />
          {isBulkPartyFetching && <span>Loading...</span>}
        </button>


      </div>

      {/* ── LEDGER TABLE ── */}

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          overflowX: "auto",
          overflowY: "hidden",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "0.7fr 1.2fr 1.5fr 1.2fr 1.2fr 1.2fr 0.5fr",
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
          }}
        >
          <div>Sl.No</div>
          <div>Type</div>
          <div>Number</div>
          <div>Date</div>
          <div>Total</div>
          <div>Balance Due</div>
          <div
            style={{
              position: "sticky",
              right: 0,
              //backgroundColor: "#fff",
            }}
          />
        </div>

        {/* VIRTUAL BODY */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            height: 0,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <VirtualScrollList
            ref={virtualListRef}
            items={ledger}
            rowHeight={52}
            height="100%"
            dynamicHeight={true}
            isFetching={isFetching}
            hasMore={hasMore}
            getItemKey={(row) =>
              `${row.Txn_Type}-${row.id || row.Formatted_Reference_Id}`
            }
            emptyMessage="No transactions found"
            endMessage="— End of transactions —"
            onLoadMore={handleLoadMore}
            isRowActive={(row, idx) =>
              rowMenuOpen ===
              `${row.Txn_Type}-${row.Formatted_Reference_Id || row.id}-${idx}`
            }
            renderRow={(row, idx) => {
              const meta =
                PARTY_TYPE_META[row.Txn_Type] ?? {
                  label: row.Txn_Type,
                  color: "#6b7280",
                };

              const refId =
                row.Sale_Id ||
                row.Purchase_Id ||
                row.Expense_Id ||
                row.Sale_Return_Id ||
                row.Purchase_Return_Id ||
                row.Payment_In_Id ||
                row.Payment_Out_Id;

              const transactionId =
                row.Expense_Id ||
                row.Formatted_Reference_Id ||
                refId;

              const menuId =
                `${row.Txn_Type}-${transactionId || idx}`;

              const isHighlighted =
                String(searchParams.get("highlightTxn")) ===
                String(transactionId);

              return (
                <div
                  key={`${row.Txn_Type}-${transactionId || idx}`}
                  //ref={isHighlighted ? highlightedRowRef : null}
                  onClick={() => {
                    const params = new URLSearchParams(searchParams);

                    params.set(
                      "highlightTxn",
                      transactionId
                    );

                    setSearchParams(params, {
                      replace: true,
                    });
                  }}
                  onDoubleClick={() => {
                    if (
                      MODAL_TXN_TYPES.includes(
                        row.Txn_Type
                      )
                    ) {
                      const params =
                        new URLSearchParams(searchParams);

                      params.set(
                        "highlightTxn",
                        transactionId
                      );

                      setSearchParams(params, {
                        replace: true,
                      });

                      openModal(
                        row.Txn_Type,
                        transactionId
                      );

                      return;
                    }

                    const route = TXN_TYPE_ROUTE_MAP[row.Txn_Type];

                    if (route) {
                      navigate(
                        {
                          pathname: `/${route}/edit/${transactionId}`,
                          search: (() => {
                            const params =
                              new URLSearchParams(
                                searchParams
                              );

                            params.set(
                              "highlightTxn",
                              transactionId
                            );

                            return params.toString();
                          })(),
                        },
                        {
                          state: {
                            from: "party-receivables",
                            partyId,
                          },
                        }
                      );
                    }
                  }}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "0.7fr 1.2fr 1.5fr 1.2fr 1.2fr 1.2fr 0.5fr",
                    width: "100%",
                    //minWidth: "850px",
                    minHeight: 52,
                    alignItems: "center",
                    boxSizing: "border-box",
                    cursor: "pointer",
                    borderBottom:
                      "1px solid #f1f5f9",
                    backgroundColor:
                      isHighlighted
                        ? "#4CA1AF22"
                        : "transparent",
                  }}
                >
                  {/* SL.NO */}
                  <div
                    className="table-desi-cell"
                    style={{ padding: "0 5px" }}
                  >
                    {idx + 1}.
                  </div>

                  {/* TYPE */}
                  <div
                    className="table-desi-cell"
                    style={{ padding: "0 5px" }}
                  >
                    {row.Txn_Type ===
                      "Opening_Balance"
                      ? row.Direction === "Credit"
                        ? "Receivable Opening Balance"
                        : "Payable Opening Balance"
                      : meta.label}
                  </div>

                  {/* NUMBER */}
                  <div
                    className="table-desi-cell"
                    style={{
                      padding: "0 5px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row.Doc_Number || "—"}
                  </div>

                  {/* DATE */}
                  <div
                    className="table-desi-cell"
                    style={{ padding: "0 5px" }}
                  >
                    {row.Txn_Date
                      ? new Date(
                        row.Txn_Date
                      ).toLocaleDateString(
                        "en-IN",
                        {
                          day: "numeric",
                          month: "numeric",
                          year: "numeric",
                        }
                      )
                      : "N/A"}
                  </div>

                  {/* TOTAL */}
                  <div
                    className="table-desi-cell"
                    style={{ padding: "0 5px" }}
                  >
                    ₹ {fmt(row.Amount)}
                  </div>

                  {/* BALANCE */}
                  <div
                    className="table-desi-cell"
                    style={{ padding: "0 5px" }}
                  >
                    ₹ {fmt(row.Balance_Due)}
                  </div>

                  {/* MENU */}
                  <div
                    className="table-desi-cell"
                    style={{
                      position: "sticky",
                      right: 0,
                      width: "100%",
                      textAlign: "center",
                    }}
                  >
                    {row.Txn_Type !==
                      "Opening_Balance" && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();

                              setRowMenuOpen(
                                rowMenuOpen === menuId
                                  ? null
                                  : menuId
                              );
                            }}
                            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                            style={{
                              backgroundColor:
                                "transparent",
                              border: "none",
                              cursor: "pointer",
                            }}
                            title="More"
                          >
                            <MoreVertical
                              size={16}
                              style={{
                                color: "#374151",
                              }}
                            />
                          </button>

                          {rowMenuOpen === menuId && (
                            <div
                              onClick={(e) =>
                                e.stopPropagation()
                              }
                              className="absolute bg-white shadow-lg rounded-md"
                              style={{
                                right: 0,
                                top: 32,
                                width: 150,
                                zIndex: 100,
                                border:
                                  "1px solid #e2e8f0",
                                overflow: "hidden",
                              }}
                            >
                              {/* VIEW / EDIT */}
                              {MODAL_TXN_TYPES.includes(
                                row.Txn_Type
                              ) ? (
                                <button
                                  type="button"
                                  className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                                  style={{
                                    color: "#374151",
                                  }}
                                  onClick={() => {
                                    setRowMenuOpen(null);

                                    const params =
                                      new URLSearchParams(
                                        searchParams
                                      );

                                    params.set(
                                      "highlightTxn",
                                      transactionId
                                    );

                                    setSearchParams(
                                      params,
                                      {
                                        replace: true,
                                      }
                                    );

                                    openModal(
                                      row.Txn_Type,
                                      transactionId
                                    );
                                  }}
                                >
                                  <Eye
                                    size={13}
                                    style={{
                                      color: "#4CA1AF",
                                    }}
                                  />
                                  View / Edit
                                </button>
                              ) : (
                                <NavLink
                                  to={{
                                    pathname: `/${TXN_TYPE_ROUTE_MAP[row.Txn_Type]}/edit/${transactionId}`,
                                    search: (() => {
                                      const params =
                                        new URLSearchParams(
                                          searchParams
                                        );

                                      params.set(
                                        "highlightTxn",
                                        transactionId
                                      );

                                      return `?${params.toString()}`;
                                    })(),
                                  }}
                                  state={{
                                    from:
                                      "party-receivables",
                                    partyId,
                                  }}
                                  className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                                  style={{
                                    color: "#374151",
                                    textDecoration:
                                      "none",
                                  }}
                                  onClick={() =>
                                    setRowMenuOpen(null)
                                  }
                                >
                                  <Eye
                                    size={13}
                                    style={{
                                      color: "#4CA1AF",
                                    }}
                                  />
                                  View / Edit
                                </NavLink>
                              )}

                              {/* PRINT */}
                              <button
                                type="button"
                                className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                                style={{
                                  color: "#374151",
                                }}
                                onClick={() => {
                                  setRowMenuOpen(null);
                                  handlePrintClick(
                                    row,
                                    transactionId
                                  );
                                }}
                              >
                                <Printer
                                  size={13}
                                  style={{
                                    color: "#4CA1AF",
                                  }}
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
                                    Id: transactionId,
                                    Txn_Type:
                                      row.Txn_Type,
                                  });
                                }}
                              >
                                <Trash2
                                  size={13}
                                  style={{
                                    color: "#dc2626",
                                  }}
                                />
                                Delete
                              </button>
                            </div>
                          )}
                        </>
                      )}
                  </div>
                </div>
              );
            }}
          />
        </div>
      </div>

      {/* ── MODALS ── */}
      {modalState.open && modalState.type === "Payment_In" && (
        <PaymentInModalLoader
          id={modalState.id}
          banks={banks}
          onClose={closeModal}
          onSave={handleSavePaymentIn}
          isSaving={isUpdatingPaymentIn}
          //parties={partiesList}
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
        //isDeleting={false}
        />
      )}
      <div style={{ display: "none" }}>

        {/* SALE — Tax Invoice */}
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

        {/* PURCHASE — Bill */}
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
        {printTarget.type === "Expense" && printExpenseData?.expense && (
          <ExpensePrintTemplate
            ref={printRef}
            expense={printExpenseData.expense}
          />
        )}

        {/* SALE RETURN — Credit Note */}
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

        {/* PURCHASE RETURN — Debit Note */}
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
        {/* ✅ PAYMENT IN — Receipt */}
        {printTarget.type === "Payment_In" && printPaymentInData?.paymentIn && (
          <PaymentInOutPrintTemplate
            ref={printRef}
            payment={printPaymentInData.paymentIn}
            type="in"
          />
        )}

        {/* ✅ PAYMENT OUT — Receipt */}
        {printTarget.type === "Payment_Out" && printPaymentOutData?.paymentOut && (
          <PaymentInOutPrintTemplate
            ref={printRef}
            payment={printPaymentOutData.paymentOut}
            type="out"
          />
        )}
        {bulkPartyPrintReportData?.transactions?.length > 0 && (
          <div style={{ display: "none" }}>
            <PartyBulkReportPrintTemplate
              ref={bulkPartyPrintRef}
              data={bulkPartyPrintReportData}
            />
          </div>
        )}

      </div>

    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN PAGE
   Both `partyId` and the left party-list search (?q=) now live in
   the URL. Every update MERGES into a copy of the current params
   instead of replacing the whole query string — the old
   setSearchParams({ partyId }) call was wiping out ?q=/?txnSearch=
   whenever a party got auto-selected.
════════════════════════════════════════════════════════════ */
export default function PartyReceivablesLeft() {
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedId = searchParams.get("partyId") || null;
  const leftSearch = searchParams.get("q") || "";
  const [selectedPartyDetails, setSelectedPartyDetails] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null); // 3-dot menu
  const [partyModal, setPartyModal] = useState({ open: false, mode: "add", data: null });
  const [leftCursor, setLeftCursor] = useState(null);
  //const leftSentinelRef = useRef(null);
  //const leftObserverRef = useRef(null);
  const initialLeftLimit = useRef(Number(sessionStorage.getItem("partiesByPartyReceivable:leftCount")) || 10);
  const { data: partiesData, isLoading: isLoading,
    isFetching: isPartiesFetching } =
    useGetAllReceivablePartiesQuery({
      cursor: leftCursor,
      search: leftSearch,
      limit: leftCursor ? 10 : initialLeftLimit.current
    });
  const parties = partiesData?.parties || [];
  const totalParties = partiesData?.totalParties || 0;
  console.log("parties", parties);
  const menuRef = useRef(null);
  // auto-select the first party only if nothing is selected yet
  useEffect(() => {
    if (!searchParams.get("partyId") && !isLoading && parties.length > 0) {
      const next = new URLSearchParams(searchParams);
      next.set("partyId", parties[0].Party_Id);
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, parties]);

  const handleSelectParty = (partyId) => {
    const next = new URLSearchParams(searchParams);
    next.set("partyId", partyId);
    setSearchParams(next);
  };

  const handleLeftSearchChange = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set("q", value);
    } else {
      next.delete("q");
    }
    setSearchParams(next, { replace: true });
  };
  const partiesHasMore = partiesData?.hasMore ?? false;
  const partiesNextCursor = partiesData?.nextCursor ?? null;
  const handleLeftLoadMore = useCallback(() => {
    if (!partiesHasMore || !partiesNextCursor || isPartiesFetching) return;

    setLeftCursor(partiesNextCursor);
  }, [partiesHasMore, partiesNextCursor, isPartiesFetching])
  // useEffect(() => {
  //   setLeftCursor(null);
  // }, [leftSearch]);

  // const handleLeftObserver = useCallback(
  //   (entries) => {
  //     if (
  //       entries[0].isIntersecting &&
  //       partiesHasMore &&
  //       partiesNextCursor &&
  //       !isPartiesFetching &&
  //       !isLoading
  //     ) {
  //       setLeftCursor(partiesNextCursor);
  //     }
  //   },
  //   [partiesHasMore, partiesNextCursor, isPartiesFetching, isLoading]
  // );

  // useEffect(() => {
  //   if (leftObserverRef.current) {
  //     leftObserverRef.current.disconnect();
  //   }

  //   leftObserverRef.current = new IntersectionObserver(handleLeftObserver, {
  //     root: null,
  //     rootMargin: "0px",
  //     threshold: 0.1,
  //   });

  //   if (leftSentinelRef.current) {
  //     leftObserverRef.current.observe(leftSentinelRef.current);
  //   }

  //   return () => leftObserverRef.current?.disconnect();
  // }, [handleLeftObserver]);
  const handleEdit = (party) => {
    console.log("Editing party:", party);
    setPartyModal({
      open: true,
      mode: "edit",
      data: party,   // <-- use clicked party
    });
    //setPartyModal({ open: true, mode: "edit", data: selectedPartyDetails, });
    setOpenMenuId(null);
  };


  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  //  const leftListRef = useRef(null);

  //       const selectedItemRowRef = useRef(null);

  //       useEffect(() => {
  //           const leftEl = leftListRef.current;


  //           const saveLeft = () => {
  //               sessionStorage.setItem("partiesByPartyReceivable:leftScroll", leftEl.scrollTop);
  //               sessionStorage.setItem("partiesByPartyReceivable:leftCount", parties.length);
  //           };


  //           leftEl?.addEventListener("scroll", saveLeft);


  //           return () => {
  //               leftEl?.removeEventListener("scroll", saveLeft);

  //           };
  //       }, [parties.length]);



  //   const hasRestoredLeftRef = useRef(false);

  //   useLayoutEffect(() => {
  //       if (hasRestoredLeftRef.current) return; // only do this once per mount
  //       if (isLoading || isPartiesFetching) return;

  //       const savedCount = Number(sessionStorage.getItem("partiesByPartyReceivable:leftCount")) || 0;
  //       if (parties.length < savedCount) return;

  //       selectedItemRowRef.current?.scrollIntoView({ block: "center", behavior: "auto" });
  //       hasRestoredLeftRef.current = true; // mark done — won't fire again this mount
  //   }, [isLoading, isPartiesFetching, parties.length, selectedId]);

  const virtualLeftListRef = useRef(null);
  const hasScrolledToSelectedRef = useRef(false);
  useEffect(() => {
    hasScrolledToSelectedRef.current = false;
  }, [leftSearch]);

  useEffect(() => {
    if (hasScrolledToSelectedRef.current) return;
    if (isLoading || isPartiesFetching) return;
    if (!selectedId || !parties.length) return;

    const targetIndex = parties.findIndex(
      (party) => String(party.Party_Id) === String(selectedId)
    );

    if (targetIndex === -1) {
      if (partiesHasMore && partiesNextCursor && !isPartiesFetching) {
        setLeftCursor(partiesNextCursor);
      }
      return;
    }

    const timer = setTimeout(() => {
      virtualLeftListRef.current?.scrollToIndex(targetIndex, {
        align: "center",
        behavior: "auto",
      });

      hasScrolledToSelectedRef.current = true;
    }, 100);

    return () => clearTimeout(timer);
  }, [
    parties,
    isLoading,
    isPartiesFetching,
    selectedId,
    partiesHasMore,
    partiesNextCursor,
  ]);
  useEffect(() => {
    sessionStorage.setItem(
      "partiesByPartyReceivable:leftCount",
      parties.length
    );
  }, [parties.length]);
  return (
    <>
      <div className="flex flex-col bg-white"
        style={{ height: "100vh", overflow: "hidden" }}
      //  style={{ minHeight: "100vh" }}
      >
        {/* ── PAGE HEADER ── */}
        <div className="inn-title">
          <div className="flex flex-row justify-between items-center">
            <div>
              <h4 className="text-2xl font-bold mb-1">All Parties Receivables</h4>
              <p className="text-gray-500 text-sm">All Parties Receivables Details</p>
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
        <div
          className="flex flex-col lg:flex-row gap-0"
          style={{
            flex: 1,
            minHeight: 0,
            height: "calc(100vh - 180px)",
            borderTop: "1px solid #e2e8f0",
          }}
        >
          {/* ══ LEFT — 30% — party list ══ */}
          <div
            className="w-full lg:w-[30%] flex flex-col"
             style={{
              borderRight: "1px solid #e2e8f0",
              height: "100%",
              minHeight: 0,
              minWidth: 0,
            }}
          >
            {/* search */}
            <div
              className="p-3"
              style={{
                borderBottom: "1px solid #f1f5f9",
                boxSizing: "border-box",
              }}
            >
              <div
                className="relative"
                style={{ width: "100%", maxWidth: 180, height: 34 }}
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
                  value={leftSearch}
                  onChange={(e) => handleLeftSearchChange(e.target.value)}
                  placeholder="Search Party"
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
              style={{
                borderBottom: "1px solid #f1f5f9",
                backgroundColor: "#fafafa",
              }}
            >
              <Users size={15} style={{ color: "#4CA1AF" }} />

              <span className="text-xs font-semibold text-black uppercase tracking-wider">
                Parties ({totalParties})
              </span>
            </div>

            {/* {isLoading ? (
              <div className="p-4 text-gray-400 text-sm">Loading parties...</div>
            ) : parties.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-10 text-gray-400 gap-2">
                <Users size={36} strokeWidth={1.2} />
                <p className="text-sm">No parties yet</p>
              </div>
            ) : ( */}
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  height: 0,
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                
                <VirtualScrollList
                  ref={virtualLeftListRef}
                  items={parties}
                  rowHeight={64}
                  height="100%"
                  onLoadMore={handleLeftLoadMore}
                  isFetching={isPartiesFetching}
                  hasMore={partiesHasMore}
                  getItemKey={(party) => party.Party_Id}
                  emptyMessage="No parties yet"
                  endMessage="— End of parties —"
                  isRowActive={(party) => openMenuId === party.Party_Id}
                  renderRow={(party) => {
                    const isSelected =
                      String(selectedId) === String(party.Party_Id);

                    return (
                      <div
                        key={party.Party_Id}
                        onClick={() => handleSelectParty(party.Party_Id)}
                        onDoubleClick={() => {
                          if (party.Party_Name === "Cash Sale") return;

                          handleSelectParty(party.Party_Id);
                          handleEdit(party);
                          setOpenMenuId(null);
                        }}
                        className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors relative"
                        style={{
                          backgroundColor: isSelected
                            ? "#f0f9ff"
                            : "transparent",
                          borderLeft: isSelected
                            ? "3px solid #4CA1AF"
                            : "3px solid transparent",
                          borderBottom: "1px solid #f1f5f9",
                          boxSizing: "border-box",
                          minHeight: 64,
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
                            <Users
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
                              {party.Party_Name}
                            </p>

                            <p
                              className="text-xs truncate font-medium"
                              style={{
                                color:
                                  Number(party.Current_Balance) < 0
                                    ? "#dc2626"
                                    : "#16a34a",
                              }}
                            >
                              ₹{" "}
                              {Math.abs(
                                Number(party.Current_Balance || 0)
                              ).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </p>
                          </div>
                        </div>

                        {/* 3-dot menu */}
                        {party.Party_Name !== "Cash Sale" && (
                          <div
                            ref={
                              openMenuId === party.Party_Id
                                ? menuRef
                                : null
                            }
                            className="flex items-center ml-2 flex-shrink-0 relative"
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();

                                handleSelectParty(party.Party_Id);

                                setOpenMenuId(
                                  openMenuId === party.Party_Id
                                    ? null
                                    : party.Party_Id
                                );
                              }}
                              className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                              style={{
                                backgroundColor: "transparent",
                              }}
                            >
                              <MoreVertical
                                size={16}
                                style={{ color: "#374151" }}
                              />
                            </button>

                            {openMenuId === party.Party_Id && (
                              <div
                                className="absolute right-0 top-8 bg-white rounded-md shadow-lg z-10"
                                style={{
                                  border: "1px solid #e2e8f0",
                                  minWidth: 120,
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleEdit(party);
                                    setOpenMenuId(null);
                                  }}
                                  className="flex items-center gap-2 px-3 py-2 w-full text-left text-sm hover:bg-gray-50"
                                  style={{
                                    backgroundColor: "transparent",
                                  }}
                                >
                                  <SquarePen
                                    size={14}
                                    style={{ color: "#4CA1AF" }}
                                  />
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                  }}
                                  className="flex items-center gap-2 px-3 py-2 w-full text-left text-sm hover:bg-gray-50"
                                  style={{
                                    backgroundColor: "transparent",
                                  }}
                                >
                                  <Trash2
                                    size={14}
                                    style={{ color: "#dc2626" }}
                                  />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }}
                />
                
              </div>
            {/* // )} */}
            {/* <div ref={leftSentinelRef} style={{ height: "1px" }} />

            {isPartiesFetching && leftCursor && (
              <div className="flex justify-center py-3">
                <span className="text-sm text-gray-400">Loading more...</span>
              </div>
            )}

            {!partiesHasMore && parties.length > 0 && (
              <div className="flex justify-center py-3">
                <span className="text-xs text-gray-300">— End of parties —</span>
              </div>
            )} */}
          </div>


          {/* ══ RIGHT — 70% — detail panel ══ */}
          <div className="w-full lg:w-[70%] p-1"
            // style={{ height: "100%", minHeight: 0 }}
            style={{
              height: "100%",
              minHeight: 0,
              display: "flex",        // 👈 add this
              flexDirection: "column", // 👈 add this
            }}
          >
            <PartyDetailPanel partyId={selectedId} key={selectedId} setSelectedPartyDetails={setSelectedPartyDetails} />
          </div>
        </div>
      </div>

      {partyModal.open && (
        <PartyAddModal
          partyDetails={partyModal.data || {}}
          editingParty={partyModal.mode === "edit"}
          onClose={() => {
            setPartyModal({ open: false, mode: "add", data: null })
            //setSelectedPartyDetails(null);   // 🔹 add this}
          }}
        //onClose={() => setPartyModal({ open: false, mode: "add", data: null })}
        />
      )}
    </>
  );
}













// <div
//                     key={party.Party_Id}
//                     ref={isSelected ? selectedItemRowRef : null}
//                     onClick={() => handleSelectParty(party.Party_Id)}
//                     onDoubleClick={() => {
//                       if (party.Party_Name === "Cash Sale") return;
//                       handleSelectParty(party.Party_Id);
//                       handleEdit(party);
//                       setOpenMenuId(null);
//                     }}
//                     className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors relative"
//                     style={{
//                       backgroundColor: isSelected ? "#f0f9ff" : "transparent",
//                       borderLeft: isSelected ? "3px solid #4CA1AF" : "3px solid transparent",
//                       borderBottom: "1px solid #f1f5f9",
//                     }}
//                   >
//                     <div className="flex items-center gap-3 flex-1 min-w-0">
//                       <div
//                         className="flex items-center justify-center rounded-lg flex-shrink-0"
//                         style={{
//                           width: 36,
//                           height: 36,
//                           backgroundColor: isSelected ? "#4CA1AF22" : "#f1f5f9",
//                         }}
//                       >
//                         <Users size={18} style={{ color: isSelected ? "#4CA1AF" : "#94a3b8" }} />
//                       </div>
//                       {/* <div className="min-w-0">
//                         <p className="font-semibold text-gray-800 truncate text-sm" style={{ margin: 0 }}>
//                           {party.Party_Name}
//                         </p>
//                         <p className="text-xs truncate text-gray-400">
//                           {party.GSTIN || party.State || "—"}
//                         </p>
//                       </div> */}
//                       <div className="min-w-0">
//                         <p
//                           className="font-semibold text-gray-800 truncate text-sm"
//                           style={{ margin: 0 }}
//                         >
//                           {party.Party_Name}
//                         </p>

//                         <p
//                           className="text-xs truncate font-medium"
//                           style={{
//                             color:
//                               Number(party.Current_Balance) < 0
//                                 ? "#dc2626" // red
//                                 : "#16a34a", // green
//                           }}
//                         >
//                           ₹ {Math.abs(Number(party.Current_Balance || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
//                         </p>
//                       </div>
//                     </div>

//                     {/* 3-dot menu */}

//                     {party.Party_Name !== "Cash Sale" && (
//                       <div ref={openMenuId === party.Party_Id ? menuRef : null}
//                         className="flex items-center ml-2 flex-shrink-0 relative">

//                         <button
//                           type="button"
//                           onClick={(e) => {
//                             e.stopPropagation();

//                             // Select this party
//                             handleSelectParty(party.Party_Id);

//                             // Open/close menu
//                             setOpenMenuId(
//                               openMenuId === party.Party_Id ? null : party.Party_Id
//                             );
//                           }}
//                           className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
//                           style={{ backgroundColor: "transparent" }}
//                         >
//                           <MoreVertical size={16} style={{ color: "#374151" }} />
//                         </button>

//                         {openMenuId === party.Party_Id && (
//                           <div
//                             className="absolute right-0 top-8 bg-white rounded-md shadow-lg z-10"
//                             style={{ border: "1px solid #e2e8f0", minWidth: 120 }}
//                             onClick={(e) => e.stopPropagation()}
//                           >
//                             <button
//                               type="button"
//                               //onClick={handleEdit}
//                               onClick={() => handleEdit(party)}
//                               className="flex items-center gap-2 px-3 py-2 w-full text-left text-sm hover:bg-gray-50"
//                               style={{ backgroundColor: "transparent" }}
//                             >
//                               <SquarePen size={14} style={{ color: "#4CA1AF" }} /> Edit
//                             </button>
//                             <button
//                               type="button"
//                               onClick={() => {
//                                 setOpenMenuId(null);
//                               }}
//                               className="flex items-center gap-2 px-3 py-2 w-full text-left text-sm hover:bg-gray-50"
//                               style={{ backgroundColor: "transparent" }}
//                             >
//                               <Trash2 size={14} style={{ color: "#dc2626" }} /> Delete
//                             </button>
//                           </div>
//                         )}
//                       </div>
//                     )}

//                   </div>