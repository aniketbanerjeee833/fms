import { NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useDeletePurchaseMutation, useGetAllPurchasesQuery, useGetSinglePurchaseQuery, useLazyGetPurchasePrintReportQuery } from "../../redux/api/purchaseApi";

import {
  MoreVertical,
  Eye,
  Printer,
  FileSpreadsheet,
  Trash2,
  Undo2,
  PrinterIcon,
} from "lucide-react";

import { useState, useEffect, useRef, useCallback } from "react";
import DeleteConfirmModal from "../../components/Modal/DeleteConfirmModal";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { partyApi } from "../../redux/api/partyAPi";
import { cashInHandApi } from "../../redux/api/cashInHandApi";
import { bankAccountApi } from "../../redux/api/bankAccountApi";
import { itemApi } from "../../redux/api/itemApi";
import { useReactToPrint } from "react-to-print";
import InvoicePrintTemplate from "../../components/InvoicePrintTemplate";
import SalePurchaseBulkReportPrintTemplate from "../../components/Print/SalePurchaseBulkReportPrintTemplate";
import VirtualScrollList from "../../components/VirtualScrollList";

export default function AllPurchaseList() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [cursor, setCursor] = useState(null);
  const searchTerm = searchParams.get("search") || "";
  const fromDate = searchParams.get("fromDate") || "";
  const toDate = searchParams.get("toDate") || "";
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [rowMenuOpen, setRowMenuOpen] = useState(null);
  const [deletePurchase, { isLoading: isDeleting }] = useDeletePurchaseMutation();

  useEffect(() => {
    const closeRowMenu = () => setRowMenuOpen(null);
    document.addEventListener("click", closeRowMenu);
    return () => document.removeEventListener("click", closeRowMenu);
  }, []);

  const [printPurchaseId, setPrintPurchaseId] = useState(null);
  const printRef = useRef(null);

  const [showPurchaseBulkPrintReview, setShowPurchaseBulkPrintPreview] = useState(false);
  const bulkPurchasePrintRef = useRef(null);

  const { data: printData } = useGetSinglePurchaseQuery(printPurchaseId, {
    skip: !printPurchaseId,
  });
  const navigate = useNavigate();

  const {
    data: purchases,
    isLoading,
    isFetching,
  } = useGetAllPurchasesQuery({
    cursor,
    search: searchTerm,
    fromDate,
    toDate,
    limit: 10,
  });
  const purchaseList = purchases?.purchases ?? [];
  const hasMore = purchases?.hasMore ?? false;
  const nextCursor = purchases?.nextCursor ?? null;

  const handleLoadMore = useCallback(() => {
    if (!hasMore || !nextCursor || isFetching) return;
    setCursor(nextCursor);
  }, [hasMore, nextCursor, isFetching]);

  const [
    triggerPurchaseBulkReport,
    { data: bulkPurchaseReportData, isFetching: isBulkPurchaseFetching },
  ] = useLazyGetPurchasePrintReportQuery();

  const handleExportPurchaseReportExcel = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    if (fromDate) params.set("fromDate", fromDate);
    if (toDate) params.set("toDate", toDate);

    const a = document.createElement("a");
    a.href = `http://localhost:4000/api/purchase/export-purchase-excel?${params.toString()}`;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      const res = await deletePurchase(deleteTarget.Purchase_Id).unwrap();
      toast.success(res?.message || "Purchase deleted successfully");
      setDeleteTarget(null);
      dispatch(partyApi.util.invalidateTags(["Party"]));
      dispatch(cashInHandApi.util.invalidateTags(["CashInHand"]));
      dispatch(bankAccountApi.util.invalidateTags(["BankAccount"]));
      dispatch(itemApi.util.invalidateTags(["Item", "ItemLedger"]));
    } catch (err) {
      console.log(err);
      toast.error(err?.data?.message || "Failed to delete purchase");
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: printPurchaseId ? `Purchase-${printPurchaseId}` : "Purchase",
    onAfterPrint: () => setPrintPurchaseId(null),
  });

  useEffect(() => {
    if (printData && printPurchaseId) {
      handlePrint();
    }
  }, [printData, printPurchaseId]);

  const handleBulkPrint = useReactToPrint({
    contentRef: bulkPurchasePrintRef,
    documentTitle: `Purchase-Report-${fromDate || "all"}-to-${toDate || "all"}`,
    onAfterPrint: () => setShowPurchaseBulkPrintPreview(false),
  });

  const handlePrintAllClick = async () => {
    await triggerPurchaseBulkReport({ search: searchTerm, fromDate, toDate });
    setShowPurchaseBulkPrintPreview(true);
  };

  useEffect(() => {
    if (bulkPurchaseReportData && showPurchaseBulkPrintReview) {
      handleBulkPrint();
    }
  }, [bulkPurchaseReportData, showPurchaseBulkPrintReview]);

  const virtualListRef = useRef(null);
  const mobileListRef = useRef(null);
  const hasScrolledToHighlightRef = useRef(false);
  const [clickHighlightId, setClickHighlightId] = useState(null);
  const highlightTxnId = searchParams.get("highlightTxn");

  useEffect(() => {
    if (hasScrolledToHighlightRef.current) return;
    if (!highlightTxnId) return;
    if (isLoading || isFetching) return;

    const targetIndex = purchaseList.findIndex(
      (purchase) => String(purchase?.Purchase_Id) === String(highlightTxnId)
    );

    if (targetIndex === -1) {
      if (hasMore && nextCursor && !isFetching) {
        handleLoadMore();
      }
      return;
    }

    const timer = setTimeout(() => {
      virtualListRef.current?.scrollToIndex(targetIndex, { align: "center", behavior: "auto" });
      mobileListRef.current?.scrollToIndex(targetIndex, { align: "center", behavior: "auto" });
      hasScrolledToHighlightRef.current = true;
    }, 100);

    return () => clearTimeout(timer);
  }, [purchaseList, highlightTxnId, isLoading, isFetching, hasMore, nextCursor, handleLoadMore]);

  useEffect(() => {
    hasScrolledToHighlightRef.current = false;
  }, [highlightTxnId, searchTerm, fromDate, toDate]);

  const isHighlightedRow = (purchase) =>
    clickHighlightId !== null
      ? String(clickHighlightId) === String(purchase?.Purchase_Id)
      : String(searchParams.get("highlightTxn")) === String(purchase?.Purchase_Id);

  const goToEdit = (purchase) => {
    setClickHighlightId(null);
    const params = new URLSearchParams(searchParams);
    params.set("highlightTxn", purchase?.Purchase_Id);
    navigate(`/purchase/edit/${purchase?.Purchase_Id}?${params.toString()}`, {
      state: { from: "all-purchase-list" },
    });
  };

  // Shared action menu — used by both desktop grid rows and mobile cards.
  // Plain positioned menu, no external UI library.
  const RowActionsMenu = ({ purchase }) => {
    const isOpen = rowMenuOpen === purchase?.Purchase_Id;

    return (
      <div style={{ position: "relative" }}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setClickHighlightId(purchase?.Purchase_Id);
            setRowMenuOpen(isOpen ? null : purchase?.Purchase_Id);
          }}
          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
          style={{ backgroundColor: "transparent", border: "none", cursor: "pointer" }}
          title="More"
        >
          <MoreVertical size={16} style={{ color: "#374151" }} />
        </button>

        {isOpen && (
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
            <button
              type="button"
              className="row-menu-item"
              onClick={() => {
                setRowMenuOpen(null);
                goToEdit(purchase);
              }}
            >
              <Eye size={13} style={{ color: "#4CA1AF" }} />
              <span>View / Edit</span>
            </button>

            <button
              type="button"
              className="row-menu-item"
              onClick={() => {
                setRowMenuOpen(null);
                setPrintPurchaseId(purchase.Purchase_Id);
              }}
            >
              <Printer size={13} style={{ color: "#4CA1AF" }} />
              <span>Print</span>
            </button>

            <button
              type="button"
              className="row-menu-item"
              onClick={() => {
                setRowMenuOpen(null);
                navigate(`/purchase/return/add/${purchase?.Purchase_Id}${location.search}`, {
                  state: { from: "purchase-return-list" },
                });
              }}
            >
              <Undo2 size={13} style={{ color: "#4CA1AF" }} />
              <span>Return</span>
            </button>

            <button
              type="button"
              className="row-menu-item delete-item"
              onClick={() => {
                setRowMenuOpen(null);
                setDeleteTarget({ Purchase_Id: purchase?.Purchase_Id });
              }}
            >
              <Trash2 size={13} style={{ color: "#dc2626" }} />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col bg-white" style={{ height: "100%", minHeight: 0, overflow: "hidden" }}>
        <div className="inn-title flex-shrink-0">
          <div className="flex flex-col sm:flex-col lg:flex-row justify-between lg:items-center">
            <div className="flex flex-row justify-between items-center mb-4 sm:mb-4">
              <div>
                <h4 className="text-2xl font-bold mb-1">All Purchases</h4>
                <p className="text-gray-500 text-sm sm:text-base">All Purchase Details</p>
              </div>

              <button
                style={{ outline: "none", boxShadow: "none", backgroundColor: "#4CA1AF" }}
                className="text-white px-4 py-2 rounded-md sm:hidden"
                onClick={() => navigate("/purchase/add")}
              >
                + Add Purchase
              </button>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap gap-0 sm:space-x-4 space-y-3 sm:space-y-0 sm:items-center sm:justify-between">
              <div className="flex flex-col">
                <span className="text-sm text-gray-600 font-medium mb-1">From Date</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setCursor(null);
                    setSearchParams({ search: searchTerm, fromDate: e.target.value, toDate });
                  }}
                  className="border p-1 rounded-md shadow-sm text-gray-700 sm:w-auto"
                  title="Search from date"
                />
              </div>

              <div className="flex flex-col">
                <span className="text-sm text-gray-600 font-medium mb-1">To Date</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setCursor(null);
                    setSearchParams({ search: searchTerm, fromDate, toDate: e.target.value });
                  }}
                  className="border p-1 rounded-md shadow-sm text-gray-700 sm:w-auto"
                  title="Search to date"
                />
              </div>

              <div className="flex items-center w-full sm:w-56">
                <input
                  type="text"
                  placeholder="Search ..."
                  value={searchTerm}
                  onChange={(e) => {
                    setCursor(null);
                    setSearchParams({ search: e.target.value, fromDate, toDate });
                  }}
                  className="w-full sm:w-56"
                />
              </div>

              <div className="hidden sm:block">
                <button
                  style={{ outline: "none", boxShadow: "none", backgroundColor: "#4CA1AF" }}
                  className="hidden sm:block text-white px-4 py-2 rounded-md sm:w-auto"
                  onClick={() => navigate("/purchase/add")}
                >
                  + Add Purchase
                </button>
              </div>
            </div>
          </div>

          {/* Paid + Unpaid = Total */}
          <div className="flex flex-col bg-white p-6 rounded-xl shadow-md w-full max-w-sm">
            <div className="mb-2 text-left">
              <p className="text-sm font-medium text-black">Total Purchase Amount</p>
              <h4 className="text-3xl font-bold text-black">
                ₹{(Number(purchases?.totals?.totalAmount) || 0).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h4>
            </div>

            <div className="border-t border-gray-300 mb-2"></div>

            <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
              <div className="flex">
                <span className="text-sm font-medium text-gray-500">Received&nbsp;&nbsp;</span>
                <span className="text-sm font-semibold text-black">
                  ₹{(Number(purchases?.totals?.totalPaid) || 0).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className="flex">
                <span className="text-sm font-medium text-gray-500">Balance Due&nbsp;&nbsp;</span>
                <span className="text-sm font-semibold text-black">
                  ₹{(Number(purchases?.totals?.totalUnpaid) || 0).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end sm: mt-2 gap-2">
            <button
              type="button"
              onClick={handleExportPurchaseReportExcel}
              className="group flex items-center gap-2 rounded-lg bg-emerald-50 px-3.5 py-2 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200 transition-all duration-200 hover:bg-emerald-100 hover:ring-emerald-300 active:scale-95"
              title="Export to Excel"
            >
              <FileSpreadsheet
                size={16}
                strokeWidth={2.2}
                className="text-emerald-600 transition-transform duration-200 group-hover:scale-110"
              />
            </button>

            <button
              type="button"
              onClick={handlePrintAllClick}
              disabled={isBulkPurchaseFetching}
              className="group flex items-center gap-2 rounded-lg bg-blue-50 px-3.5 py-2 text-sm font-medium text-blue-700 ring-1 ring-blue-200 transition-all duration-200 hover:bg-blue-100 hover:ring-blue-300 active:scale-95 disabled:opacity-50"
              title="Print Reports"
            >
              <PrinterIcon
                size={16}
                strokeWidth={2.2}
                className="text-blue-600 transition-transform duration-200 group-hover:scale-110"
              />
              {isBulkPurchaseFetching && <span>Loading...</span>}
            </button>
          </div>
        </div>

        <div className="tab-inn" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {isLoading ? (
            <p className="text-center mt-4">Fetching purchases...</p>
          ) : purchaseList.length === 0 ? (
            <p className="text-center mt-4">No purchases found.</p>
          ) : (
            <>
              {/* ---------- DESKTOP: grid table, sm and up ---------- */}
              <div
                className="hidden sm:flex"
                style={{ flex: 1, minHeight: 0, overflowX: "auto", overflowY: "hidden", flexDirection: "column" }}
              >
                <div style={{ minWidth: 962, display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "0.6fr 1.1fr 1.3fr 3fr 1.6fr 1.3fr 1.2fr 0.5fr",
                      width: "100%",
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
                    <div>Date</div>
                    <div>Bill No.</div>
                    <div>Party Name</div>
                    <div>Payment Type</div>
                    <div>Amount</div>
                    <div>Balance</div>
                    <div style={{ position: "sticky", right: 0 }} />
                  </div>

                  <div style={{ flex: 1, minHeight: 0, overflow: "hidden", position: "relative" }}>
                    <VirtualScrollList
                      ref={virtualListRef}
                      items={purchaseList}
                      rowHeight={52}
                      height="100%"
                      dynamicHeight={true}
                      onLoadMore={handleLoadMore}
                      isFetching={isFetching}
                      hasMore={hasMore}
                      getItemKey={(purchase) => purchase?.Purchase_Id}
                      emptyMessage="No purchase found"
                      endMessage="— End of purchases —"
                      isRowActive={(purchase) => rowMenuOpen === purchase?.Purchase_Id}
                      renderRow={(purchase, idx) => {
                        const isHighlighted = isHighlightedRow(purchase);
                        return (
                          <div
                            key={purchase?.Purchase_Id}
                            onClick={() => setClickHighlightId(purchase?.Purchase_Id)}
                            onDoubleClick={() => goToEdit(purchase)}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "0.6fr 1.1fr 1.3fr 3fr 1.6fr 1.3fr 1.2fr 0.5fr",
                              alignItems: "center",
                              minHeight: "52px",
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
                              {purchase?.Bill_Date
                                ? new Date(purchase.Bill_Date).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "numeric",
                                    year: "numeric",
                                  })
                                : "N/A"}
                            </div>

                            <div className="table-desi-cell">
                              {purchase?.Bill_Number ? purchase.Bill_Number.split("T")[0] : "N/A"}
                            </div>

                            <div className="table-desi-cell" style={{ overflowWrap: "break-word", wordBreak: "break-word" }}>
                              {purchase?.Party_Name || "N/A"}
                            </div>

                            <div className="table-desi-cell">{purchase?.Payment_Type_Display || "N/A"}</div>

                            <div className="table-desi-cell">₹ {purchase?.Total_Amount || "N/A"}</div>

                            <div className="table-desi-cell">₹ {purchase?.Balance_Due || "N/A"}</div>

                            <div
                              className="py-2 px-2 table-desi-cell"
                              style={{ position: "sticky", right: 0, width: 50, textAlign: "center" }}
                            >
                              <RowActionsMenu purchase={purchase} />
                            </div>
                          </div>
                        );
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* ---------- MOBILE: stacked cards, below sm ---------- */}
              <div className="sm:hidden" style={{ flex: 1, minHeight: 0, overflow: "hidden", position: "relative" }}>
                <VirtualScrollList
                  ref={mobileListRef}
                  items={purchaseList}
                  rowHeight={104}
                  height="100%"
                  dynamicHeight={true}
                  onLoadMore={handleLoadMore}
                  isFetching={isFetching}
                  hasMore={hasMore}
                  getItemKey={(purchase) => purchase?.Purchase_Id}
                  emptyMessage="No purchase found"
                  endMessage="— End of purchases —"
                  isRowActive={(purchase) => rowMenuOpen === purchase?.Purchase_Id}
                  renderRow={(purchase) => {
                    const isHighlighted = isHighlightedRow(purchase);
                    return (
                      <div
                        key={purchase?.Purchase_Id}
                        onClick={() => setClickHighlightId(purchase?.Purchase_Id)}
                        onDoubleClick={() => goToEdit(purchase)}
                        className="p-3 border-b border-gray-100"
                        style={{ backgroundColor: isHighlighted ? "#4CA1AF22" : "transparent" }}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{purchase?.Party_Name || "N/A"}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {purchase?.Bill_Date
                                ? new Date(purchase.Bill_Date).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "numeric",
                                    year: "numeric",
                                  })
                                : "N/A"}
                              {"  ·  "}
                              Bill {purchase?.Bill_Number ? purchase.Bill_Number.split("T")[0] : "N/A"}
                            </p>
                          </div>

                          <RowActionsMenu purchase={purchase} />
                        </div>

                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {purchase?.Payment_Type_Display || "N/A"}
                          </span>
                          <div className="text-right">
                            <p className="text-sm font-semibold">₹ {purchase?.Total_Amount || "N/A"}</p>
                            <p className="text-xs text-gray-500">Due ₹ {purchase?.Balance_Due || "N/A"}</p>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {deleteTarget && (
        <DeleteConfirmModal
          title="Delete Purchase"
          message="Are you sure you want to delete this purchase bill? This action cannot be undone."
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
        />
      )}

      {printData?.billPurchaseDetails && (
        <div style={{ display: "none" }}>
          <InvoicePrintTemplate
            ref={printRef}
            type="purchase"
            invoice={{
              ...printData.billPurchaseDetails,
              items: printData.items || [],
              companyDetails: {},
            }}
          />
        </div>
      )}

      {bulkPurchaseReportData?.purchaseBills?.length > 0 && (
        <div style={{ display: "none" }}>
          <SalePurchaseBulkReportPrintTemplate
            ref={bulkPurchasePrintRef}
            type="purchase"
            data={bulkPurchaseReportData?.purchaseBills || []}
            fromDate={fromDate}
            toDate={toDate}
          />
        </div>
      )}
    </>
  );
}