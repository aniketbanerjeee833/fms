
import { NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";

import {
  Eye,
  FileSpreadsheet,
  LayoutDashboard,
  MoreVertical,
  Printer,
  PrinterIcon,
  Trash2
} from "lucide-react";

import { useEffect, useRef, useState } from "react";
import { useDeleteSaleReturnMutation, useGetAllSaleReturnsQuery, useGetSaleReturnByIdQuery, useLazyGetSaleReturnPrintReportQuery } from "../../redux/api/saleReturnApi";
import DeleteConfirmModal from "../../components/Modal/DeleteConfirmModal";
import { toast } from "react-toastify";
import { itemApi } from "../../redux/api/itemApi";
import { useDispatch } from "react-redux";
import { useReactToPrint } from "react-to-print";
import CreditDebitNotePrintTemplate from "../../components/CreditDebitNotePrintTemplate";
import SalePurchaseBulkReportPrintTemplate from "../../components/Print/SalePurchaseBulkReportPrintTemplate";




export default function SaleReturn() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const page = Number(searchParams.get("page")) || 1;
  const searchTerm = searchParams.get("search") || "";
  const fromDate = searchParams.get("fromDate") || "";
  const toDate = searchParams.get("toDate") || "";
  const [deleteTarget, setDeleteTarget] = useState(null); // holds the purchase to delete
  const [rowMenuOpen, setRowMenuOpen] = useState(null);
  const [deleteSaleReturn, { isLoading: isDeleting }] = useDeleteSaleReturnMutation();
  const { data: saleReturns, isLoading } = useGetAllSaleReturnsQuery({
    page,
    search: searchTerm,
    fromDate,
    toDate,
  });
  //console.log(saleReturns);
  const [printSaleReturnId, setPrintSaleReturnId] = useState(null);
  const printRef = useRef(null);
  const [showSaleReturnBulkPrintPreview, setShowSaleReturnBulkPrintPreview] = useState(false);
   
    const bulkSaleReturnPrintRef = useRef(null);
  // const[selecedSales,setSelectedSales]= useState(null);
  const { data: printData } = useGetSaleReturnByIdQuery(printSaleReturnId, {
    skip: !printSaleReturnId,
  });

    const [triggerSaleBulkReport, { data: bulkSaleReturnReportData, isFetching: isBulkFetching }] =
    useLazyGetSaleReturnPrintReportQuery();
    console.log(bulkSaleReturnReportData)
  useEffect(() => {
    const closeRowMenu = () => {
      setRowMenuOpen(null);
    };
    document.addEventListener("click", closeRowMenu);
    return () => {
      document.removeEventListener("click", closeRowMenu);
    };
  }, []);


  const handlePageChange = (newPage) => {
    setSearchParams({
      page: newPage,
      search: searchTerm,
      fromDate,
      toDate,
    });
  };

  const handleNextPage = () => {
    setSearchParams({
      page: page + 1,
      search: searchTerm,
      fromDate,
      toDate,
    });
  };

  const handlePreviousPage = () => {
    setSearchParams({
      page: Math.max(1, page - 1),
      search: searchTerm,
      fromDate,
      toDate,
    });
  };

  const handleExportSaleReturnExcel = () => {
    const params = new URLSearchParams();

    if (searchTerm) params.set("search", searchTerm);
    if (fromDate) params.set("fromDate", fromDate);
    if (toDate) params.set("toDate", toDate);

    const a = document.createElement("a");

    a.href =
      `http://localhost:4000/api/sale-return/export-sale-return-excel?${params.toString()}`;

    a.download = "";

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      console.log(deleteTarget);
      const res = await deleteSaleReturn(deleteTarget.Sale_Return_Id).unwrap();
      toast.success(res?.message || "Credit Note deleted successfully");
      setDeleteTarget(null);

      dispatch(
        itemApi.util.invalidateTags([
          "Item",
          "ItemLedger",
        ])
      );
    } catch (err) {
      console.log(err);
      toast.error(err?.data?.message || "Failed to delete credit note");
    }
  };
  // console.log(saleReturns?.saleReturns);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: printSaleReturnId ? `Sale-${printSaleReturnId}` : "Sale",
    onAfterPrint: () => setPrintSaleReturnId(null),
  });

  // once printData arrives, trigger the print dialog
  useEffect(() => {
    if (printData && printSaleReturnId) {
      handlePrint();
    }
  }, [printData, printSaleReturnId]);



  const handleBulkPrint = useReactToPrint({
    contentRef: bulkSaleReturnPrintRef,
    documentTitle: `Sales-Return-Report-${fromDate || "all"}-to-${toDate || "all"}`,
    onAfterPrint: () => setShowSaleReturnBulkPrintPreview(false),
  });
   
  /* trigger fetch on button click */
  const handlePrintAllClick = async () => {
    await triggerSaleBulkReport({ search: searchTerm, fromDate, toDate });
    setShowSaleReturnBulkPrintPreview(true);
  };
   
  /* fire print once report data has arrived */
  useEffect(() => {
    if (bulkSaleReturnReportData && showSaleReturnBulkPrintPreview) {
      handleBulkPrint();
    }
  }, [bulkSaleReturnReportData, showSaleReturnBulkPrintPreview]);

  return (
    <>

      <div className="flex flex-col bg-white ">

        <div className="inn-title">
          <div className="flex flex-col sm:flex-col lg:flex-row justify-between lg:items-center">

            <div className="flex flex-row justify-between items-center mb-4 sm:mb-4">
              <div>
                <h4 className="text-2xl font-bold mb-1">Credit Notes</h4>
                <p className="text-gray-500 text-sm sm:text-base">
                  All Credit Note Details
                </p>
              </div>

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
                      page: 1,
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
                      page: 1,
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
                      page: 1,               // reset page on new search
                      search: e.target.value,
                      fromDate,
                      toDate,
                    });
                  }}

                  className="w-full sm:w-56"
                />
              </div>

            </div>


          </div>

          <div className="flex flex-col bg-white p-6 rounded-xl shadow-md w-full max-w-sm">

            {/* Total Sales */}
            <div className="mb-2 text-left">
              <p className="text-sm font-medium text-black">Total  Amount</p>
              <h4 className="text-3xl font-bold text-black">
                {/* ₹{saleReturns?.totals?.totalAmount} */}
                ₹{(Number(saleReturns?.totals?.totalAmount) || 0).toLocaleString("en-IN", {
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
                  Total Paid&nbsp;&nbsp;
                </span>
                <span className="text-sm font-semibold text-black">
                  ₹{(Number(saleReturns?.totals?.totalPaid) || 0).toLocaleString("en-IN", {
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
                  ₹{(Number(saleReturns?.totals?.totalBalance) || 0).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

          </div>
          <div className="flex justify-end sm: mt-4 gap-2">

            <button
              type="button"
              onClick={handleExportSaleReturnExcel}
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

        <div className="tab-inn">
          <div className="table-responsive table-desi">
            {isLoading ? (
              <p className="text-center mt-4">Fetching saleReturns...</p>
            ) : saleReturns?.length === 0 ? (
              <p className="text-center mt-4">No saleReturns found.</p>
            ) : (

              <table className="w-full min-w-[500px]">
                <thead>
                  <tr>
                    <th className="text-left">Sl.No</th>
                    <th className="text-left ">Invoice Date</th>
                    <th className="text-left ">Party Name</th>
                    <th className="text-left">Payment Type</th>
                    <th className="text-left">Amount </th>
                    <th className="text-left">Paid</th>
                    <th className="text-left">Balance Due</th>
                    <th></th>

                  </tr>
                </thead>
                <tbody>
                  {saleReturns && saleReturns?.saleReturns?.length > 0 ? (
                    saleReturns?.saleReturns?.map((saleReturn, idx) => (
                      <tr
                        key={saleReturn?.id}
                        onDoubleClick={() => {
                          navigate(
                            `/sale/return/edit/${saleReturn?.id}${location.search}`,
                            {
                              state: {
                                from: "all-sale-return-list"
                              }
                            }
                          );
                        }}
                        style={{ cursor: "pointer", borderBottom: "1px solid #f1f5f9", }}
                      >
                        <td>
                          {(saleReturns?.currentPage - 1) * 10 + (idx + 1)}.
                        </td>
                        <td >
                          {saleReturn?.Invoice_Date
                            ? new Date(saleReturn?.Invoice_Date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "numeric",
                              year: "numeric",
                            })
                            : "N/A"}
                        </td>

                        <td>{saleReturn?.Party_Name || "N/A"}</td>

                        <td>{saleReturn?.Payment_Type_Display || "N/A"}</td>
                        <td>₹{saleReturn?.Total_Amount || "N/A"}</td>
                        <td>₹{saleReturn?.Total_Paid || "N/A"}</td>
                        <td>₹{saleReturn?.Balance_Due || "N/A"}</td>

                        <td
                          className="py-2 px-2"
                          style={{
                            position: "relative",
                            width: 50,
                            textAlign: "center"
                          }}
                        >
                          {/* THREE DOT BUTTON */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();

                              setRowMenuOpen(
                                rowMenuOpen === saleReturn?.id
                                  ? null
                                  : saleReturn?.id
                              );
                            }}
                            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                            style={{
                              backgroundColor: "transparent",
                              border: "none",
                              cursor: "pointer"
                            }}
                            title="More"
                          >
                            <MoreVertical
                              size={16}
                              style={{ color: "#374151" }}
                            />
                          </button>

                          {/* THREE DOT MENU */}
                          {rowMenuOpen === saleReturn?.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute bg-white shadow-lg rounded-md"
                              style={{
                                right: 0,
                                top: 32,
                                width: 150,
                                zIndex: 100,
                                border: "1px solid #e2e8f0",
                                overflow: "hidden"
                              }}
                            >

                              {/* VIEW / EDIT */}
                              <NavLink
                                to={`/sale/return/edit/${saleReturn?.id}${location.search}`}
                                state={{
                                  from: "all-sale-return-list"
                                }}
                                className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                                style={{
                                  color: "#374151",
                                  textDecoration: "none"
                                }}
                                onClick={() => setRowMenuOpen(null)}
                              >
                                <Eye
                                  size={13}
                                  style={{ color: "#4CA1AF" }}
                                />

                                View / Edit
                              </NavLink>

                              {/* PRINT */}
                              <button
                                type="button"
                                className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                                style={{
                                  color: "#374151",
                                  backgroundColor: "transparent",
                                  border: "none",
                                  cursor: "pointer"
                                }}
                                onClick={() => {
                                  setRowMenuOpen(null);
                                  setPrintSaleReturnId(saleReturn.id);
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
                                style={{
                                  cursor: "pointer",
                                  color: "#dc2626",
                                  backgroundColor: "transparent",
                                  border: "none"
                                }}
                                onClick={() => {
                                  setRowMenuOpen(null);

                                  setDeleteTarget({
                                    Sale_Return_Id: saleReturn?.id
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
                    ))
                  ) : (
                    <tr>
                      <td className="mx-auto text-center" colSpan={8}>
                        No sale found
                      </td>
                    </tr>
                  )}
                </tbody>

              </table>

            )}
          </div>
        </div>
        <div className="flex justify-center align-center p-4">
          <div className="flex items-center space-x-2 flex-wrap justify-center">

            {/* PREVIOUS */}
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

            {/* PAGE NUMBERS — DESKTOP / TABLET */}
            <div style={{ marginRight: "0px" }}
              className="hidden sm:flex space-x-2">

              {(() => {
                const totalPages = saleReturns?.totalPages || 1;
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

            {/* CURRENT PAGE — MOBILE ONLY */}
            <div className="sm:hidden px-3 py-1 bg-gray-100 rounded text-sm">
              Page {page} / {saleReturns?.totalPages || 1}
            </div>

            {/* NEXT */}
            <button
              type="button"
              onClick={() => handleNextPage()}
              disabled={page === saleReturns?.totalPages ||
                saleReturns?.totalPages === 0}
              className={`px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded
        ${page === saleReturns?.totalPages ||
                  saleReturns?.totalPages === 0
                  ? 'opacity-50 '
                  : ''
                }
      `}
            >
              Next →
            </button>

          </div>
        </div>

      </div>
      {deleteTarget && (
        <DeleteConfirmModal
          title="Delete Credit Note"
          message={`Are you sure you want to delete this credit note ? This action cannot be undone.`}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}

        />
      )}
      {printData?.saleReturn && (
        <div style={{ display: "none" }}>
          <CreditDebitNotePrintTemplate
            ref={printRef}
            type="credit"
            invoice={{
              ...printData.saleReturn,
              items: printData.saleReturn.items || [],
              companyDetails: {},

            }}
          />
        </div>
      )}
      {bulkSaleReturnReportData?.saleReturns?.length > 0 && (
        <div style={{ display: "none" }}>
          <SalePurchaseBulkReportPrintTemplate
            ref={bulkSaleReturnPrintRef}
            type="credit"
            data={bulkSaleReturnReportData?.saleReturns || []}   // 🔹 use .invoices not .sales
            fromDate={fromDate}
            toDate={toDate}
          />
        </div>
      )}

    </>

  )
}