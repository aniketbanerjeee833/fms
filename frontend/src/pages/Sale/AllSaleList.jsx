
import { NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useDeleteSaleMutation, useGetAllSalesQuery, useGetSingleSaleQuery, useLazyGetSalesPrintReportQuery } from "../../redux/api/saleApi";

import {

  Eye,
  FileSpreadsheet,

  MoreVertical,
  Printer,
  PrinterIcon,
  Trash2,
  Undo2
} from "lucide-react";

import { useState, useEffect, useRef, useCallback } from "react";
import DeleteConfirmModal from "../../components/Modal/DeleteConfirmModal";
import { toast } from "react-toastify";
import { itemApi } from "../../redux/api/itemApi";
import { useDispatch } from "react-redux";
import InvoicePrintTemplate from "../../components/InvoicePrintTemplate";
import { useReactToPrint } from "react-to-print";
import SalePurchaseBulkReportPrintTemplate from "../../components/Print/SalePurchaseBulkReportPrintTemplate";
import VirtualScrollList from "../../components/VirtualScrollList";

export default function AllSaleList() {
  const dispatch = useDispatch()
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [cursor, setCursor] = useState(null);
  //const page = Number(searchParams.get("page")) || 1;
  const searchTerm = searchParams.get("search") || "";
  const fromDate = searchParams.get("fromDate") || "";
  const toDate = searchParams.get("toDate") || "";
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [rowMenuOpen, setRowMenuOpen] = useState(null);
  const [deleteSale, { isLoading: isDeleting }] = useDeleteSaleMutation();
  const [printSaleId, setPrintSaleId] = useState(null);
  const [showSaleBulkPrintPreview, setShowSaleBulkPrintPreview] = useState(false);
  const printRef = useRef(null);
  const bulkSalePrintRef = useRef(null);

  const { data: printData } = useGetSingleSaleQuery(printSaleId, {
    skip: !printSaleId,
  });
  // const { data: sales, isLoading } = useGetAllSalesQuery({
  //   page,
  //   search: searchTerm,
  //   fromDate,
  //   toDate,
  // });
  const {
    data: sales,
    isLoading,
    isFetching,
  } = useGetAllSalesQuery({
    cursor,
    search: searchTerm,
    fromDate,
    toDate,
    limit: 10,
  });
  console.log(sales);
  const salesList = sales?.sales ?? [];
  const hasMore = sales?.hasMore ?? false;
  const nextCursor = sales?.nextCursor ?? null;

  // For virtualization
  const handleLoadMore = useCallback(() => {
    if (!hasMore || !nextCursor || isFetching) return;

    setCursor(nextCursor);
  }, [hasMore, nextCursor, isFetching]);
  const [triggerSaleBulkReport, { data: bulkSaleReportData, isFetching: isBulkFetching }] =
    useLazyGetSalesPrintReportQuery();

  const navigate = useNavigate();

  useEffect(() => {
    const closeRowMenu = () => {
      setRowMenuOpen(null);
    };
    document.addEventListener("click", closeRowMenu);
    return () => {
      document.removeEventListener("click", closeRowMenu);
    };
  }, []);

  // const handlePageChange = (newPage) => {
  //   setSearchParams({
  //     page: newPage,
  //     search: searchTerm,
  //     fromDate,
  //     toDate,
  //   });
  // };

  // const handleNextPage = () => {
  //   setSearchParams({
  //     page: page + 1,
  //     search: searchTerm,
  //     fromDate,
  //     toDate,
  //   });
  // };

  // const handlePreviousPage = () => {
  //   setSearchParams({
  //     page: Math.max(1, page - 1),
  //     search: searchTerm,
  //     fromDate,
  //     toDate,
  //   });
  // };

  const handleExportSaleReportExcel = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    if (fromDate) params.set("fromDate", fromDate);
    if (toDate) params.set("toDate", toDate);

    // anchor download 
    const url = `http://localhost:4000/api/sale/export-sale-excel?${params.toString()}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = "";          // filename comes from Content-Disposition header
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // const handlePrint = (sale) => {
  //   console.log("Print sale:", sale);
  // };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      console.log(deleteTarget);
      const res = await deleteSale(deleteTarget.Sale_Id).unwrap();
      toast.success(res?.message || "Purchase deleted successfully");
      setDeleteTarget(null);
      dispatch(
        itemApi.util.invalidateTags([
          "Item",
          "ItemLedger",
        ])
      );
    } catch (err) {
      console.log(err);
      toast.error(err?.data?.message || "Failed to delete purchase");
    }
  };
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: printSaleId
      ? `Sale-${printSaleId}`
      : "Sale",
    onAfterPrint: () => setPrintSaleId(null),
  });

  useEffect(() => {
    if (printData && printSaleId) {
      handlePrint();
    }
  }, [printData, printSaleId]);
  console.log(sales?.sales);
  const handleBulkPrint = useReactToPrint({
    contentRef: bulkSalePrintRef,
    documentTitle: `Sales-Report-${fromDate || "all"}-to-${toDate || "all"}`,
    onAfterPrint: () => setShowSaleBulkPrintPreview(false),
  });

  /* trigger fetch on button click */
  const handlePrintAllClick = async () => {
    await triggerSaleBulkReport({ search: searchTerm, fromDate, toDate });
    setShowSaleBulkPrintPreview(true);
  };

  /* fire print once report data has arrived */
  useEffect(() => {
    if (bulkSaleReportData && showSaleBulkPrintPreview) {
      handleBulkPrint();
    }
  }, [bulkSaleReportData, showSaleBulkPrintPreview]);
  const virtualListRef = useRef(null);
  const hasScrolledToHighlightRef = useRef(false);

  const highlightTxnId = searchParams.get("highlightTxn");

  useEffect(() => {
    if (hasScrolledToHighlightRef.current) return;
    if (!highlightTxnId) return;
    if (isLoading || isFetching) return;

    const targetIndex = salesList.findIndex(
      (sale) =>
        String(sale?.Sale_Id) === String(highlightTxnId)
    );
    console.log("Target index for highlight:", targetIndex);
    if (targetIndex === -1) {
      if (hasMore && nextCursor && !isFetching) {
        handleLoadMore();
      }
      return;
    }

    // Wait until VirtualScrollList has rendered the new data
    const timer = setTimeout(() => {
      virtualListRef.current?.scrollToIndex(targetIndex, {
        align: "center",
        behavior: "auto",
      });

      hasScrolledToHighlightRef.current = true;
    }, 100);

    return () => clearTimeout(timer);
  }, [
    salesList,
    highlightTxnId,
    isLoading,
    isFetching,
    hasMore,
    nextCursor,
    handleLoadMore,
  ]);
  useEffect(() => {
    hasScrolledToHighlightRef.current = false;
  }, [highlightTxnId, searchTerm, fromDate, toDate])

  return (
    <>

      <div className="flex flex-col bg-white"
        //style={{ height: "100vh", minHeight: 0, overflow: "hidden" }}
        style={{
          flex: 1,
          minHeight: 0,
          height: "calc(100vh - 20px)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >

        <div className="inn-title">
          <div className="flex flex-col sm:flex-col lg:flex-row justify-between lg:items-center">

            <div className="flex flex-row justify-between items-center mb-4 sm:mb-4">
              <div>
                <h4 className="text-2xl font-bold mb-1">All Sales</h4>
                <p className="text-gray-500 text-sm sm:text-base">
                  All Sale Details
                </p>
              </div>


              <button
                style={{
                  outline: "none",
                  boxShadow: "none",
                  backgroundColor: "#4CA1AF",
                }}
                className="text-white px-4 py-2 rounded-md sm:hidden"
                onClick={() => navigate("/sale/add")}
              >
                + Add Sale
              </button>
            </div>

            <div

              className="
                      flex flex-col gap-2 md:flex-row md:gap-2 sm:flex-row sm:flex-wrap 
                        sm:space-x-4 space-y-3 sm:space-y-0 
                        sm:items-center 
                      sm:justify-between
        
                                  "
            >

              <div className="flex flex-col">
                <span className="text-sm text-gray-600 font-medium mb-1">From Date</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setSearchParams({
                      search: searchTerm,
                      fromDate: e.target.value,
                      toDate,
                    });
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
                    setSearchParams({
                      search: searchTerm,
                      fromDate,
                      toDate: e.target.value,
                    });
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
                    setSearchParams({
                      search: e.target.value,
                      fromDate,
                      toDate,
                    });
                    // setSearchParams({
                    //   page: 1,               // reset page on new search
                    //   search: e.target.value,
                    //   fromDate,
                    //   toDate,
                    // });
                  }}
                  className="w-full sm:w-56"
                />
              </div>


              <div className="hidden sm:block">
                <button
                  style={{
                    outline: "none",
                    boxShadow: "none",
                    backgroundColor: "#4CA1AF",
                  }}
                  className="hidden sm:block text-white px-4 py-2 rounded-md sm:w-auto"
                  onClick={() => navigate("/sale/add")}
                >
                  + Add Sale
                </button>
              </div>
            </div>

          </div>

          <div className="flex flex-col bg-white p-6 rounded-xl shadow-md w-full max-w-sm">

            {/* Total Sales */}
            <div className="mb-2 text-left">
              <p className="text-sm font-medium text-black">Total Sales Amount</p>
              <h4 className="text-3xl font-bold text-black">
                {/* ₹{sales?.totals?.totalAmount} */}
                ₹{(Number(sales?.totals?.totalAmount) || 0).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h4>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-300 mb-2"></div>

            {/* Received & Balance */}
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
              <div className="flex">
                <span className="text-sm font-medium text-gray-500">
                  Received&nbsp;&nbsp;
                </span>
                <span className="text-sm font-semibold text-black">
                  ₹{(Number(sales?.totals?.totalReceived) || 0).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className="flex">
                <span className="text-sm font-medium text-gray-500">
                  Balance Due&nbsp;&nbsp;
                </span>
                <span className="text-sm font-semibold text-black">
                  ₹{(Number(sales?.totals?.totalBalance) || 0).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

          </div>
          <div className="flex justify-end sm: mt-2 gap-2">

            {/* <button
              type="button"
              onClick={handleExportSaleReportExcel}
              className="group flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow transition-all duration-200 hover:bg-emerald-700 hover:shadow-lg active:scale-95"
              title="Export to Excel"
            >
              <FileSpreadsheet
                size={22}
                className="transition-transform duration-200 group-hover:scale-110"
              />
            </button> */}
            <button
              type="button"
              onClick={handleExportSaleReportExcel}
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
              disabled={isBulkFetching}
              className="group flex items-center gap-2 rounded-lg bg-blue-50 px-3.5 py-2 text-sm font-medium text-blue-700 ring-1 ring-blue-200 transition-all duration-200 hover:bg-blue-100 hover:ring-blue-300 active:scale-95 disabled:opacity-50"
              title="Print Reports"
            >
              <PrinterIcon size={16} strokeWidth={2.2} className="text-blue-600 transition-transform duration-200 group-hover:scale-110" />
              {isBulkFetching && <span>Loading...</span>}
            </button>

          </div>
        </div>
        <div
          className="tab-inn"
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {isLoading ? (
              <p className="text-center mt-4">
                Fetching sales...
              </p>
            ) : salesList.length === 0 ? (
              <p className="text-center mt-4">No sales found.</p>
            ) : (
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflowX: "auto",
                  overflowY: "hidden",   // fine to keep — this hides the OUTER wrapper's own vertical scrollbar
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div style={{
                  minWidth: 1062, display: "flex", flexDirection: "column",
                  flex: 1, minHeight: 0
                }}>
                  {/* HEADER */}
                  {/* <table
                    className="w-full min-w-[500px] table-responsive table-desi"
                    style={{
                      flexShrink: 0,
                    }}
                  >
                    <thead >
                      <tr>
                        <th className="text-left" style={{ width: 60 }}>Sl.No</th>
                        <th className="text-left" style={{ width: 110 }}>Date</th>
                        <th className="text-left" style={{ width: 130 }}>Invoice No.</th>
                        <th className="text-left" style={{ width: 300 }}>Party Name</th>
                        <th className="text-left" style={{ width: 160 }}>Payment Type</th>
                        <th className="text-left" style={{ width: 132 }}>Amount</th>
                        <th className="text-left" style={{ width: 120 }}>Balance</th>
                        <th style={{ width: 50 }}></th>
                      </tr>
                    </thead>
                  </table> */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "0.6fr 1.1fr 1.3fr 3fr 1.6fr 1.3fr 1.2fr 0.5fr",
                      //gridTemplateColumns: "60px 110px 130px minmax(300px, 1fr) 160px 132px 120px 50px",
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
                    <div>Date</div>
                    <div>Invoice No.</div>
                    <div>Party Name</div>
                    <div>Payment Type</div>
                    <div>Amount</div>
                    <div>Balance</div>
                    <div
                      style={{
                        position: "sticky",
                        right: 0,
                        //backgroundColor: "#fff",
                      }}
                    ></div>
                  </div>

                  {/* VIRTUALIZED BODY */}
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
                      items={salesList}
                      rowHeight={52}
                      height="100%"
                      dynamicHeight={true}
                      onLoadMore={() => {
                        if (
                          sales?.hasMore &&
                          sales?.nextCursor &&
                          !isFetching
                        ) {
                          setCursor(sales.nextCursor);
                        }
                      }}
                      isFetching={isFetching}
                      hasMore={sales?.hasMore || false}
                      getItemKey={(sale) => sale?.Sale_Id}
                      emptyMessage="No sale found"
                      endMessage="— End of sales —"
                      isRowActive={(sale) =>
                        rowMenuOpen === sale?.Sale_Id
                      }
                      renderRow={(sale, idx) => {
                        const isHighlighted =
                          String(searchParams.get("highlightTxn")) ===
                          String(sale?.Sale_Id);

                        return (
                          <div
                            key={sale?.Sale_Id}
                            onClick={() => {
                              const params = new URLSearchParams(
                                searchParams
                              );

                              params.set(
                                "highlightTxn",
                                sale?.Sale_Id
                              );

                              setSearchParams(params, {
                                replace: true,
                              });
                            }}
                            onDoubleClick={() => {
                              const params = new URLSearchParams(
                                searchParams
                              );

                              params.set(
                                "highlightTxn",
                                sale?.Sale_Id
                              );

                              navigate(
                                `/sale/edit/${sale?.Sale_Id}?${params.toString()}`,
                                {
                                  state: {
                                    from: "all-sale-list",
                                  },
                                }
                              );
                            }}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "0.6fr 1.1fr 1.3fr 3fr 1.6fr 1.3fr 1.2fr 0.5fr",
                              //gridTemplateColumns: "60px 110px 130px minmax(300px, 1fr) 160px 132px 120px 50px",
                              //gridTemplateColumns:"70px 110px 120px minmax(150px, 1fr) 130px 110px 110px 50px",
                              alignItems: "center",
                              minHeight: "52px",
                              columnGap: "10px",
                              width: "100%",
                              cursor: "pointer",
                              backgroundColor: isHighlighted
                                ? "#4CA1AF22"
                                : "transparent",
                              borderBottom:
                                "1px solid #f1f5f9",
                              boxSizing: "border-box",
                            }}
                          >
                            {/* SL.NO */}
                            <div className="table-desi-cell">
                              {idx + 1}.
                            </div>

                            {/* DATE */}
                            <div className="table-desi-cell">
                              {sale?.Invoice_Date
                                ? new Date(
                                  sale.Invoice_Date
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

                            {/* INVOICE NO */}
                            <div className="table-desi-cell">
                              {sale?.Invoice_Number || "N/A"}
                            </div>

                            {/* PARTY */}
                            <div
                              className="table-desi-cell"
                              style={{
                                overflowWrap: "break-word",
                                wordBreak: "break-word",
                              }}
                            >
                              {sale?.Party_Name || "N/A"}
                            </div>

                            {/* PAYMENT TYPE */}
                            <div className="table-desi-cell">
                              {!sale?.Payment_Type_Display ||
                                sale.Payment_Type_Display === "—"
                                ? "Cash"
                                : sale.Payment_Type_Display}
                            </div>

                            {/* AMOUNT */}
                            <div className="table-desi-cell">
                              ₹{sale?.Total_Amount || "N/A"}
                            </div>

                            {/* BALANCE */}
                            <div className="table-desi-cell">
                              ₹{sale?.Balance_Due || "N/A"}
                            </div>

                            {/* THREE DOT MENU */}
                            <div
                              className="py-2 px-2 table-desi-cell"
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

                                  setRowMenuOpen(
                                    rowMenuOpen === sale?.Sale_Id
                                      ? null
                                      : sale?.Sale_Id
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

                              {rowMenuOpen === sale?.Sale_Id && (
                                <div
                                  onClick={(e) =>
                                    e.stopPropagation()
                                  }
                                  className="absolute bg-white shadow-lg rounded-md"
                                  style={{
                                    right: 0,
                                    top: "100%",
                                    width: 150,
                                    zIndex: 100,
                                    border:
                                      "1px solid #e2e8f0",
                                    overflow: "hidden",
                                  }}
                                >
                                  {/* VIEW / EDIT */}
                                  <NavLink
                                    to={{
                                      pathname: `/sale/edit/${sale?.Sale_Id}`,
                                      search: (() => {
                                        const params =
                                          new URLSearchParams(
                                            searchParams
                                          );

                                        params.set(
                                          "highlightTxn",
                                          sale?.Sale_Id
                                        );

                                        return params.toString();
                                      })(),
                                    }}
                                    state={{
                                      from: "all-sale-list",
                                    }}
                                    className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                                    style={{
                                      color: "#374151",
                                      textDecoration: "none",
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

                                  {/* RETURN */}
                                  <NavLink
                                    to={`/sale/return/add/${sale?.Sale_Id}${location.search}`}
                                    state={{
                                      from: "sale-return-list",
                                    }}
                                    className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                                    style={{
                                      color: "#374151",
                                      textDecoration: "none",
                                    }}
                                    onClick={() =>
                                      setRowMenuOpen(null)
                                    }
                                  >
                                    <Undo2
                                      size={13}
                                      style={{
                                        color: "#4CA1AF",
                                      }}
                                    />

                                    Return
                                  </NavLink>

                                  {/* PRINT */}
                                  <button
                                    type="button"
                                    className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                                    style={{
                                      color: "#374151",
                                      backgroundColor:
                                        "transparent",
                                      border: "none",
                                      cursor: "pointer",
                                    }}
                                    onClick={() => {
                                      setRowMenuOpen(null);
                                      setPrintSaleId(
                                        sale.Sale_Id
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
                                    style={{
                                      cursor: "pointer",
                                      color: "#dc2626",
                                      backgroundColor:
                                        "transparent",
                                      border: "none",
                                    }}
                                    onClick={() => {
                                      setRowMenuOpen(null);

                                      setDeleteTarget({
                                        Sale_Id:
                                          sale?.Sale_Id,
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

        {/* <div className="flex justify-center align-center p-4">
          <div className="flex items-center space-x-2 flex-wrap justify-center">

           
            <button
              type="button"
              onClick={() => handlePreviousPage()}
              disabled={page === 1}
              className={`px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded
        ${page === 1 ? 'opacity-50 ' : ''}
      `}
            >
              ← Previous
            </button>

         
            <div style={{ marginRight: "0px" }}
              className="hidden sm:flex space-x-2">

              {(() => {
                const totalPages = sales?.totalPages || 1;
                const maxVisible = 5; // how many pages around current
                const pages = [];

                let start = Math.max(1, page - 2);
                let end = Math.min(totalPages, page + 2);

                // Adjust if near start
                if (page <= 3) {
                  end = Math.min(totalPages, maxVisible);
                }

                // Adjust if near end
                if (page > totalPages - 3) {
                  start = Math.max(1, totalPages - maxVisible + 1);
                }

                // First page + dots
                if (start > 1) {
                  pages.push(
                    <button
                      key={1}
                      onClick={() => handlePageChange(1)}
                      className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                    >
                      1
                    </button>
                  );

                  if (start > 2) {
                    pages.push(
                      <span key="start-dots" className="px-2">...</span>
                    );
                  }
                }

                // Middle pages
                for (let i = start; i <= end; i++) {
                  pages.push(
                    <button
                      key={i}
                      onClick={() => handlePageChange(i)}
                      className={`px-3 py-1 rounded ${page === i
                        ? 'bg-[#4CA1AF] text-white'
                        : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                    >
                      {i}
                    </button>
                  );
                }

                // Last page + dots
                if (end < totalPages) {
                  if (end < totalPages - 1) {
                    pages.push(
                      <span key="end-dots" className="px-2">...</span>
                    );
                  }

                  pages.push(
                    <button
                      key={totalPages}
                      onClick={() => handlePageChange(totalPages)}
                      className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                    >
                      {totalPages}
                    </button>
                  );
                }

                return pages;
              })()}
            </div>

         
            <div className="sm:hidden px-3 py-1 bg-gray-100 rounded text-sm">
              Page {page} / {sales?.totalPages || 1}
            </div>

           
            <button
              type="button"
              onClick={() => handleNextPage()}
              disabled={page === sales?.totalPages ||
                sales?.totalPages === 0}
              className={`px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded
        ${page === sales?.totalPages ||
                  sales?.totalPages === 0
                  ? 'opacity-50 '
                  : ''
                }
      `}
            >
              Next →
            </button>

          </div>
        </div> */}

      </div>

      {deleteTarget && (
        <DeleteConfirmModal
          title="Delete Sale"
          message={`Are you sure you want to delete this sale invoice ? This action cannot be undone.`}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
        />
      )}
      {printData?.invoicePartyDetails && (
        <div style={{ display: "none" }}>
          <InvoicePrintTemplate
            ref={printRef}
            type="sale"
            invoice={{
              ...printData.invoicePartyDetails,   // ✅ matches backend response key
              items: printData.items || [],
              companyDetails: {},

            }}
          />
        </div>
      )}
      {/* // check what your bulk report response actually wraps invoices in */}
      {bulkSaleReportData?.invoices?.length > 0 && (
        <div style={{ display: "none" }}>
          <SalePurchaseBulkReportPrintTemplate
            ref={bulkSalePrintRef}
            type="sale"
            data={bulkSaleReportData?.invoices || []}
            //data={bulkSaleReportData}   // 🔹 use .invoices not .sales
            fromDate={fromDate}
            toDate={toDate}
          />
        </div>
      )}
    </>

  )
}

//  <div className="tab-inn"
//         //style={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}
//         >
//           <div className="table-responsive table-desi"
//           //style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "auto" }}
//           >
//             {isLoading ? (
//               <p className="text-center mt-4">Fetching sales...</p>
//             ) : sales?.length === 0 ? (
//               <p className="text-center mt-4">No sales found.</p>
//             ) : (

//               <table className="w-full min-w-[500px]">
//                 <thead>
//                   <tr>
//                     <th className="text-left">Sl.No</th>
//                     <th className="text-left ">Date</th>
//                     <th className="text-left ">Invoice No.</th>
//                     <th className="text-left ">Party Name</th>
//                     <th className="text-left">Payment Type</th>
//                     <th className="text-left">Amount </th>
//                     <th className="text-left">Balance </th>
//                     <th></th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {sales && sales?.sales?.length > 0 ? (
//                     sales?.sales?.map((sale, idx) => {
//                       const isHighlighted = String(searchParams.get("highlightTxn")) === String(sale?.Sale_Id);
//                       return (

//                         <tr
//                           key={sale?.Sale_Id}

//                           onClick={() => {
//                             const params = new URLSearchParams(searchParams);

//                             params.set(
//                               "highlightTxn",
//                               sale?.Sale_Id
//                             );

//                             setSearchParams(params, { replace: true });
//                           }}

//                           onDoubleClick={() => {
//                             const params = new URLSearchParams(searchParams);

//                             params.set(
//                               "highlightTxn",
//                               sale?.Sale_Id
//                             );

//                             navigate(
//                               `/sale/edit/${sale?.Sale_Id}?${params.toString()}`,
//                               {
//                                 state: {
//                                   from: "all-sale-list",
//                                 },
//                               }
//                             );
//                           }}

//                           style={{
//                             cursor: "pointer",
//                             borderBottom: "1px solid #f1f5f9",
//                             backgroundColor: isHighlighted
//                               ? "#4CA1AF22"
//                               : "transparent",
//                           }}
//                         >
//                           <td>
//                             {(sales?.currentPage - 1) * 10 + (idx + 1)}.
//                           </td>
//                           <td >
//                             {sale?.Invoice_Date
//                               ? new Date(sale?.Invoice_Date).toLocaleDateString("en-IN", {
//                                 day: "numeric",
//                                 month: "numeric",
//                                 year: "numeric",
//                               })
//                               : "N/A"}
//                           </td>
//                           <td>
//                             {sale?.Invoice_Number
//                               ? sale?.Invoice_Number
//                               : "N/A"}
//                           </td>
//                           <td >{sale?.Party_Name || "N/A"}</td>
//                           <td>{!sale?.Payment_Type_Display || sale.Payment_Type_Display === "—" ? "Cash" : sale.Payment_Type_Display}</td>

//                           <td>₹{sale?.Total_Amount || "N/A"}</td>
//                           <td>₹{sale?.Balance_Due || "N/A"}</td>

//                           <td
//                             className="py-2 px-2"
//                             style={{
//                               position: "relative",
//                               width: 50,
//                               textAlign: "center"
//                             }}
//                           >
//                             {/* THREE DOT BUTTON */}
//                             <button
//                               type="button"
//                               onClick={(e) => {
//                                 e.stopPropagation();

//                                 setRowMenuOpen(
//                                   rowMenuOpen === sale?.Sale_Id
//                                     ? null
//                                     : sale?.Sale_Id
//                                 );
//                               }}
//                               className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
//                               style={{
//                                 backgroundColor: "transparent",
//                                 border: "none",
//                                 cursor: "pointer"
//                               }}
//                               title="More"
//                             >
//                               <MoreVertical
//                                 size={16}
//                                 style={{ color: "#374151" }}
//                               />
//                             </button>

//                             {/* THREE DOT MENU */}
//                             {rowMenuOpen === sale?.Sale_Id && (
//                               <div
//                                 onClick={(e) => e.stopPropagation()}
//                                 className="absolute bg-white shadow-lg rounded-md"
//                                 style={{
//                                   right: 0,
//                                   top: 32,
//                                   width: 150,
//                                   zIndex: 100,
//                                   border: "1px solid #e2e8f0",
//                                   overflow: "hidden"
//                                 }}
//                               >

//                                 {/* VIEW / EDIT */}
//                                 {/* <NavLink
//                                   to={`/sale/edit/${sale?.Sale_Id}${location.search}`}
//                                   state={{
//                                     from: "all-sale-list"
//                                   }}
//                                   className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
//                                   style={{
//                                     color: "#374151",
//                                     textDecoration: "none"
//                                   }}
//                                   onClick={() => setRowMenuOpen(null)}
//                                 >
//                                   <Eye
//                                     size={13}
//                                     style={{ color: "#4CA1AF" }}
//                                   />

//                                   View / Edit
//                                 </NavLink> */}
//                                 <NavLink
//                                   to={{
//                                     pathname: `/sale/edit/${sale?.Sale_Id}`,
//                                     search: (() => {
//                                       const params = new URLSearchParams(searchParams);

//                                       params.set(
//                                         "highlightTxn",
//                                         sale?.Sale_Id
//                                       );

//                                       return params.toString();
//                                     })(),
//                                   }}
//                                   state={{
//                                     from: "all-sale-list",
//                                   }}
//                                   className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
//                                   style={{
//                                     color: "#374151",
//                                     textDecoration: "none",
//                                   }}
//                                   onClick={() => setRowMenuOpen(null)}
//                                 >
//                                   <Eye
//                                     size={13}
//                                     style={{ color: "#4CA1AF" }}
//                                   />

//                                   View / Edit
//                                 </NavLink>


//                                 {/* RETURN */}
//                                 <NavLink
//                                   to={`/sale/return/add/${sale?.Sale_Id}${location.search}`}
//                                   state={{
//                                     from: "sale-return-list"
//                                   }}
//                                   className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
//                                   style={{
//                                     color: "#374151",
//                                     textDecoration: "none"
//                                   }}
//                                   onClick={() => setRowMenuOpen(null)}
//                                 >
//                                   <Undo2
//                                     size={13}
//                                     style={{ color: "#4CA1AF" }}
//                                   />

//                                   Return
//                                 </NavLink>


//                                 {/* PRINT */}
//                                 <button
//                                   type="button"
//                                   className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
//                                   style={{
//                                     color: "#374151",
//                                     backgroundColor: "transparent",
//                                     border: "none",
//                                     cursor: "pointer"
//                                   }}
//                                   onClick={() => {
//                                     setRowMenuOpen(null);
//                                     setPrintSaleId(sale.Sale_Id)
//                                   }}
//                                 >
//                                   <Printer
//                                     size={13}
//                                     style={{ color: "#4CA1AF" }}
//                                   />

//                                   Print
//                                 </button>


//                                 {/* DELETE */}
//                                 <button
//                                   type="button"
//                                   className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-red-50 text-sm"
//                                   style={{
//                                     cursor: "pointer",
//                                     color: "#dc2626",
//                                     backgroundColor: "transparent",
//                                     border: "none"
//                                   }}
//                                   onClick={() => {
//                                     setRowMenuOpen(null);

//                                     setDeleteTarget({
//                                       Sale_Id: sale?.Sale_Id
//                                     });
//                                   }}
//                                 >
//                                   <Trash2
//                                     size={13}
//                                     style={{ color: "#dc2626" }}
//                                   />

//                                   Delete
//                                 </button>

//                               </div>
//                             )}
//                           </td>

//                         </tr>
//                       )
//                     })
//                   ) : (
//                     <tr>
//                       <td className="mx-auto text-center" colSpan={8}>
//                         No sale found
//                       </td>
//                     </tr>
//                   )}
//                 </tbody>

//               </table>

//             )}
//           </div>
//         </div>