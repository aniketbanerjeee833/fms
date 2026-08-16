
import { NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  MoreVertical,
  Eye,
  FileSpreadsheet,
  LayoutDashboard,
  Trash2,
  Printer
} from "lucide-react";

import { useDeletePurchaseReturnMutation, useGetAllPurchaseReturnsQuery, useGetPurchaseReturnByIdQuery } from "../../redux/api/purchaseReturnApi";
import { useEffect, useRef, useState } from "react";
import DeleteConfirmModal from "../../components/Modal/DeleteConfirmModal";
import { toast } from "react-toastify";
import { itemApi } from "../../redux/api/itemApi";
import { useDispatch } from "react-redux";
import { useReactToPrint } from "react-to-print";
import CreditDebitNotePrintTemplate from "../../components/CreditDebitNotePrintTemplate";




export default function PurchaseReturn() {


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
  const [deletePurchaseReturn, { isLoading: isDeleting }] = useDeletePurchaseReturnMutation();
  const [printPurchaseReturnId, setPrintPurchaseReturnId] = useState(null);
  const printRef = useRef(null);
  // const[selecedSales,setSelectedSales]= useState(null);
  const { data: printData } = useGetPurchaseReturnByIdQuery(printPurchaseReturnId, {
    skip: !printPurchaseReturnId,
  });
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
  // const [searchTerm, setSearchTerm] = useState("");
  // const [fromDate, setFromDate] = useState('');
  // const [toDate, setToDate] = useState('');
  const { data: purchaseReturns, isLoading } = useGetAllPurchaseReturnsQuery({
    page,
    search: searchTerm,
    fromDate,
    toDate,
  });
  console.log(purchaseReturns, fromDate, toDate);

  useEffect(() => {
    const closeRowMenu = () => {
      setRowMenuOpen(null);
    };

    document.addEventListener("click", closeRowMenu);

    return () => {
      document.removeEventListener("click", closeRowMenu);
    };
  }, []);

  const handleExportExcel = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    if (fromDate) params.set("fromDate", fromDate);
    if (toDate) params.set("toDate", toDate);

    const a = document.createElement("a");
    a.href = `http://localhost:4000/api/purchaseReturn/export-purchaseReturn-excel?${params.toString()}`;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      console.log(deleteTarget);
      const res = await deletePurchaseReturn(deleteTarget.Purchase_Return_Id).unwrap();
      toast.success(res?.message || "Debit Note deleted successfully");
      setDeleteTarget(null);

      dispatch(
        itemApi.util.invalidateTags([
          "Item",
          "ItemLedger",
        ])
      );
    } catch (err) {
      console.log(err);
      toast.error(err?.data?.message || "Failed to delete debit note");
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: printPurchaseReturnId ? `Purchase-${printPurchaseReturnId}` : "Purchase",
    onAfterPrint: () => setPrintPurchaseReturnId(null),
  });

  // once printData arrives, trigger the print dialog
  useEffect(() => {
    if (printData && printPurchaseReturnId) {
      handlePrint();
    }
  }, [printData, printPurchaseReturnId]);

  return (
    <>

      <div className="flex flex-col bg-white">

        <div className="inn-title">
          <div className="flex flex-col sm:flex-col lg:flex-row justify-between lg:items-center">

            <div className="flex flex-row justify-between items-center mb-4 sm:mb-4">
              <div>
                <h4 className="text-2xl font-bold mb-1">Debit Notes</h4>
                <p className="text-gray-500 text-sm sm:text-base">
                  All Debit Note Details
                </p>
              </div>

            </div>


            <div
              className="
        flex flex-col gap-2 sm:flex-row sm:flex-wrap gap-0
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
                  // onChange={(e) => setFromDate(e.target.value)}
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
                  // onChange={(e) => setToDate(e.target.value)}
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
                  // onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-56"
                />
              </div>

            </div>
          </div>


          {/* Paid + Unpaid = Total */}
          <div className="flex flex-col bg-white p-6 rounded-xl shadow-md w-full max-w-sm">

            {/* Total Sales */}
            <div className="mb-2 text-left">
              <p className="text-sm font-medium text-black">Total Amount</p>
              <h4 className="text-3xl font-bold text-black">
                {/* ₹ {purchaseReturns?.totals?.totalAmount} */}
                ₹{(Number(purchaseReturns?.totals?.totalAmount) || 0).toLocaleString("en-IN", {
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
                  ₹{(Number(purchaseReturns?.totals?.totalReceived) || 0).toLocaleString("en-IN", {
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
                  ₹{(Number(purchaseReturns?.totals?.totalBalance) || 0).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

          </div>
          <div className="flex justify-end sm: mt-4">
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center justify-center rounded-xl bg-emerald-600 p-2.5 text-white shadow-md transition-all duration-200 hover:bg-emerald-700 hover:shadow-lg active:scale-95"
              title="Export to Excel"
            >
              <FileSpreadsheet size={22} strokeWidth={2} />
            </button>



          </div>
        </div>
        <div className="tab-inn">
          <div className="table-responsive table-desi">
            {isLoading ? (
              <p className="text-center mt-4">Fetching purchaseReturns...</p>
            ) : purchaseReturns?.length === 0 ? (
              <p className="text-center mt-4">No purchaseReturns found.</p>
            ) : (





              <table className="w-full min-w-[500px]">
                <thead>
                  <tr>
                    <th className="text-left">Sl.No</th>
                    <th className="text-left ">Bill Date</th>
                    <th className="text-left ">Party Name</th>
                    <th className="text-left">Payment Type</th>
                    <th className="text-left">Amount </th>
                    <th className="text-left">Received </th>
                    <th className="text-left">Balance Due</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseReturns && purchaseReturns?.purchaseReturns?.length > 0 ? (
                    purchaseReturns?.purchaseReturns?.map((purchaseReturn, idx) => (
                      <tr
                        key={purchaseReturn?.id}
                        onDoubleClick={() => {
                          navigate(
                            `/purchase/return/edit/${purchaseReturn?.id}${location.search}`,
                            {
                              state: {
                                from: "all-purchase-return-list"
                              }
                            }
                          );
                        }}
                        style={{ cursor: "pointer",borderBottom: "1px solid #f1f5f9", }}
                      >
                        <td>
                          {(purchaseReturns?.currentPage - 1) * 10 + (idx + 1)}.
                        </td>
                        <td>
                          {purchaseReturn?.Bill_Date
                            ? new Date(purchaseReturn?.Bill_Date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "numeric",
                              year: "numeric",
                            })
                            : "N/A"}
                        </td>
                        <td>{purchaseReturn?.Party_Name || "N/A"}</td>

                        <td>{purchaseReturn?.Payment_Type_Display || "N/A"}</td>
                        <td>₹{purchaseReturn?.Total_Amount || "N/A"}</td>
                        <td>₹{purchaseReturn?.Total_Received || "N/A"}</td>
                        <td>₹{purchaseReturn?.Balance_Due || "N/A"}</td>

                        <td
                          className="py-2 px-2"
                          style={{
                            position: "relative",
                            width: 50,
                            textAlign: "center"
                          }}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();

                              setRowMenuOpen(
                                rowMenuOpen === purchaseReturn.id
                                  ? null
                                  : purchaseReturn.id
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

                          {/* ROW MENU */}
                          {rowMenuOpen === purchaseReturn.id && (
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
                                to={`/purchase/return/edit/${purchaseReturn?.id}${location.search}`}
                                state={{
                                  from: "all-purchase-return-list"
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

                                  setPrintPurchaseReturnId(purchaseReturn.id)
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
                                title="Delete purchase return"
                                style={{
                                  cursor: "pointer",
                                  color: "#dc2626",
                                  backgroundColor: "transparent",
                                  border: "none"
                                }}
                                onClick={() => {
                                  setRowMenuOpen(null);

                                  setDeleteTarget({
                                    Purchase_Return_Id: purchaseReturn.id
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
                      <td className="mx-auto text-center" colSpan={10}>
                        No purchaseReturn found
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
                const totalPages = purchaseReturns?.totalPages || 1;
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
              Page {page} / {purchaseReturns?.totalPages || 1}
            </div>

            {/* NEXT */}
            <button
              type="button"
              onClick={() => handleNextPage()}
              disabled={page === purchaseReturns?.totalPages ||
                purchaseReturns?.totalPages === 0}
              className={`px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded
        ${page === purchaseReturns?.totalPages ||
                  purchaseReturns?.totalPages === 0
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
          title="Delete Debit Note"
          message={`Are you sure you want to delete this Debit Note ? This action cannot be undone.`}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
        />
      )}
      {printData?.purchaseReturn && (
        <div style={{ display: "none" }}>
          <CreditDebitNotePrintTemplate
            ref={printRef}
            type="debit"
            invoice={{
              ...printData.purchaseReturn,
              items: printData.purchaseReturn.items || [],
              companyDetails: {},

            }}
          />
        </div>
      )}
    </>

  )
}

