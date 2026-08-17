
import { NavLink, useSearchParams } from "react-router-dom";

import {
    MoreVertical,
    Eye,
    FileSpreadsheet,
    LayoutDashboard,
    Trash2,
    Printer
} from "lucide-react";

import PaymentOutModal from "../../components/Modal/PaymentOutModal";
import { partyApi, useGetAllPartiesQuery } from "../../redux/api/partyAPi";
import { useEffect, useRef, useState } from "react";
import { useAddPaymentOutMutation, useDeletePaymentOutMutation, useGetAllPaymentOutsQuery, useGetPaymentOutByIdQuery, useUpdatePaymentOutMutation } from "../../redux/api/paymentOutApi";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { cashInHandApi } from "../../redux/api/cashInHandApi";
import { bankAccountApi, useGetAllBankAccountsQuery } from "../../redux/api/bankAccountApi";
import PartyAddModal from "../../components/Modal/PartyAddModal";
import { itemApi } from "../../redux/api/itemApi";
import DeleteConfirmModal from "../../components/Modal/DeleteConfirmModal";
import { useReactToPrint } from "react-to-print";
import PaymentInOutPrintTemplate from "../../components/PaymentInOutPrintTemplate";


export default function PaymentOut() {

    const dispatch = useDispatch();
    const [searchParams, setSearchParams] = useSearchParams();

    const page = Number(searchParams.get("page")) || 1;
    const searchTerm = searchParams.get("search") || "";

    const fromDate = searchParams.get("fromDate") || "";
    const toDate = searchParams.get("toDate") || "";

    const [modal, setModal] = useState({ open: false, mode: "add", data: null });
    const { data: partiesList } = useGetAllPartiesQuery();

    const [addPaymentOut, { isLoading: isAdding }] = useAddPaymentOutMutation();
    const [updatePaymentOut, { isLoading: isUpdating }] = useUpdatePaymentOutMutation();
    const { data: banks = [] } = useGetAllBankAccountsQuery();
    const isSaving = isAdding || isUpdating;
    const [deleteTarget, setDeleteTarget] = useState(null); // holds the purchase to delete
    const [deletePaymentOut, { isLoading: isDeleting }] = useDeletePaymentOutMutation();
    const [rowMenuOpen, setRowMenuOpen] = useState(null);
    const [printPaymentOutId, setPrintPaymentOutId] = useState(null);
    const printRef = useRef(null);

    /* fetch the full payment (with Party details) only when printing */
    const { data: printData } = useGetPaymentOutByIdQuery(printPaymentOutId, {
        skip: !printPaymentOutId,
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

    const { data: paymentOutData, isLoading } = useGetAllPaymentOutsQuery({
        page,
        search: searchTerm,
        fromDate,
        toDate,
    });
    console.log(paymentOutData, fromDate, toDate);

    useEffect(() => {
        const closeRowMenu = () => {
            setRowMenuOpen(null);
        };

        document.addEventListener("click", closeRowMenu);

        return () => {
            document.removeEventListener("click", closeRowMenu);
        };
    }, []);

   

    const handleSavePaymentOut = async (formData) => {
        try {
            if (modal.mode === "edit") {
                await updatePaymentOut({ id: modal.data.id, ...formData }).unwrap();
            } else {
                await addPaymentOut(formData).unwrap();
            }
            dispatch(cashInHandApi.util.invalidateTags(["CashInHand"]));
            dispatch(bankAccountApi.util.invalidateTags([
                { type: "BankAccount", id: formData.Bank_Account_Id },
                "BankAccount",   // ← this hits getAllBankAccounts which providesTags: ["BankAccount"]
            ]));
            setModal({ open: false, mode: "add", data: null });
            toast.success("New Payment Out added")
        } catch (err) {
            console.error("Failed to save payment out:", err);
            toast.error(err?.data?.message || "Failed to save payment out. Please try again.");
        }
    };
    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;

        try {
            const res = await deletePaymentOut(
                deleteTarget.Payment_Out_Id
            ).unwrap();

            toast.success(
                res?.message || "Purchase deleted successfully"
            );

            setDeleteTarget(null);
            dispatch(partyApi.util.invalidateTags(["Party"]));
            dispatch(cashInHandApi.util.invalidateTags(["CashInHand"]));
            dispatch(
                bankAccountApi.util.invalidateTags(["BankAccount"])
            );

            dispatch(
                itemApi.util.invalidateTags([
                    "Item",
                    "ItemLedger",
                ])
            );
        } catch (err) {
            console.log(err);

            toast.error(
                err?.data?.message ||
                "Failed to delete purchase"
            );
        }
    };
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: printPaymentOutId ? `Receipt-${printPaymentOutId}` : "Payment In",
        onAfterPrint: () => setPrintPaymentOutId(null),
    });

    /* trigger print once data has loaded */
    useEffect(() => {
        if (printData?.paymentOut && printPaymentOutId) {
            handlePrint();
        }
    }, [printData, printPaymentOutId])
    const handleExportPaymentOutReportExcel = () => {

        const params = new URLSearchParams();

        if (searchTerm) params.set("search", searchTerm);
        if (fromDate) params.set("fromDate", fromDate);
        if (toDate) params.set("toDate", toDate);

        const a = document.createElement("a");
        console.log(fromDate, toDate);
        a.href = `http://localhost:4000/api/payment-out/export-payment-out-excel?${params.toString()}`;

        a.download = "";

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };
    return (
        <>

            <div className="flex flex-col bg-white">


                <div className="inn-title">
                    <div className="flex flex-col sm:flex-col lg:flex-row justify-between lg:items-center">

                        <div className="flex flex-row justify-between items-center mb-4 sm:mb-4">
                            <div>
                                <h4 className="text-2xl font-bold mb-1">Payment Out</h4>
                                <p className="text-gray-500 text-sm sm:text-base">
                                    All Payment Out Details
                                </p>
                            </div>


                            <button
                                style={{
                                    outline: "none",
                                    boxShadow: "none",
                                    backgroundColor: "#4CA1AF",
                                }}
                                className="text-white px-4 py-2 rounded-md sm:hidden"
                                onClick={() => setModal({ open: true, mode: "add", data: null })}
                            >
                                Add Payment Out
                            </button>
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


                            <div className="hidden sm:block">
                                <button
                                    style={{
                                        outline: "none",
                                        boxShadow: "none",
                                        backgroundColor: "#4CA1AF",
                                    }}
                                    className="hidden sm:block text-white px-4 py-2 rounded-md sm:w-auto"
                                    //   onClick={() => navigate("/paymentOut/add")}
                                    onClick={() => setModal({ open: true, mode: "add", data: null })}
                                >
                                    Add  Payment Out
                                </button>
                            </div>
                        </div>
                    </div>


                    {/* Paid + Unpaid = Total */}
                    <div className="flex flex-col bg-white p-6 rounded-xl shadow-md w-full max-w-sm">

                        {/* Total Sales */}
                        {/* <div className="mb-2 text-left">
                            <p className="text-sm font-medium text-black">Total Amount</p>
                            <h4 className="text-3xl font-bold text-black">₹  {paymentOutData?.totals?.totalPaid}</h4>
                        </div>

                      
                        <div className="border-t border-gray-300 mb-2"></div>

                       
                        <div className=" flex flex-col gap-2 sm:flex-row sm:-gap-4">
                            <div className="flex  ">
                                <span className="text-sm font-medium text-gray-500">Received &nbsp; &nbsp;</span>
                                <span className="text-sm font-semibold text-black">₹ {paymentOutData?.totals?.totalPaid}</span>
                            </div>

                        </div> */}
                        {/* Total Sales */}
                        <div className="mb-2 text-left">
                            <p className="text-sm font-medium text-black">Total Amount</p>
                            <h4 className="text-3xl font-bold text-black">
                                ₹{(Number(paymentOutData?.totals?.totalPaid) || 0).toLocaleString("en-IN", {
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
                                    Paid&nbsp;&nbsp;
                                </span>
                                <span className="text-sm font-semibold text-black">
                                    ₹{(Number(paymentOutData?.totals?.totalPaid) || 0).toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </span>
                            </div>
                        </div>

                    </div>
                    <div className="flex justify-end">
                        {/* <button
                            type="button"
                            onClick={ handleExportPaymentOutReportExcel}
                            className="flex items-center justify-center rounded-xl bg-emerald-600 p-2.5 text-white shadow-md transition-all duration-200 hover:bg-emerald-700 hover:shadow-lg active:scale-95"
                            title="Export to Excel"
                        >
                            <FileSpreadsheet size={22} strokeWidth={2} />
                        </button> */}
                        <button
                            type="button"
                            onClick={handleExportPaymentOutReportExcel}
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



                    </div>
                </div>
                <div className="tab-inn">
                    <div className="table-responsive table-desi">
                        {isLoading ? (
                            <p className="text-center mt-4">Fetching paymentOutData...</p>
                        ) : paymentOutData?.length === 0 ? (
                            <p className="text-center mt-4">No paymentOutData found.</p>
                        ) : (

                            <table className="w-full min-w-[500px]">
                                <thead>
                                    <tr>
                                        <th className="text-left">Sl.No</th>
                                        <th className="text-left ">Date</th>
                                        <th className="text-left ">Party Name</th>
                                        <th className="text-left">Payment Type</th>
                                        <th className="text-left">Total Paid</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paymentOutData && paymentOutData?.paymentOuts?.length > 0 ? (
                                        paymentOutData?.paymentOuts?.map((paymentOut, idx) => (
                                            <tr
                                                key={paymentOut?.id}
                                                onDoubleClick={() => {
                                                    setModal({
                                                        open: true,
                                                        mode: "edit",
                                                        data: paymentOut,
                                                    });
                                                }}
                                                style={{ cursor: "pointer", borderBottom: "1px solid #f1f5f9", }}
                                            >
                                                <td>
                                                    {(paymentOutData?.currentPage - 1) * 10 + (idx + 1)}.
                                                </td>

                                                <td>
                                                    {paymentOut?.Payment_Date
                                                        ? new Date(paymentOut?.Payment_Date).toLocaleDateString("en-IN", {
                                                            day: "numeric",
                                                            month: "numeric",
                                                            year: "numeric",
                                                        })
                                                        : "N/A"}
                                                </td>
                                                <td>{paymentOut?.Party_Name || "N/A"}</td>

                                                <td>
                                                    {paymentOut?.Payment_Type_Display || "N/A"}
                                                </td>
                                                <td>{paymentOut?.Paid || "N/A"}</td>

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
                                                                rowMenuOpen === paymentOut?.id
                                                                    ? null
                                                                    : paymentOut?.id
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
                                                    {rowMenuOpen === paymentOut?.id && (
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

                                                                    setModal({
                                                                        open: true,
                                                                        mode: "edit",
                                                                        data: paymentOut,
                                                                    });
                                                                }}
                                                            >
                                                                <Eye
                                                                    size={13}
                                                                    style={{ color: "#4CA1AF" }}
                                                                />

                                                                View / Edit
                                                            </button>

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
                                                                    setPrintPaymentOutId(paymentOut?.id)


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
                                                                title="Delete payment out"
                                                                style={{
                                                                    cursor: "pointer",
                                                                    color: "#dc2626",
                                                                    backgroundColor: "transparent",
                                                                    border: "none"
                                                                }}
                                                                onClick={() => {
                                                                    setRowMenuOpen(null);

                                                                    setDeleteTarget({
                                                                        Payment_Out_Id: paymentOut?.id
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
                                            <td className="mx-auto text-center" colSpan={6}>
                                                No payment out found
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
                                const totalPages = paymentOutData?.totalPages || 1;
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
                            Page {page} / {paymentOutData?.totalPages || 1}
                        </div>

                        {/* NEXT */}
                        <button
                            type="button"
                            onClick={() => handleNextPage()}
                            disabled={page === paymentOutData?.totalPages ||
                                paymentOutData?.totalPages === 0}
                            className={`px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded
                                ${page === paymentOutData?.totalPages ||
                                    paymentOutData?.totalPages === 0
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
            {modal.open && (
                <PaymentOutModal
                    mode={modal.mode}
                    initialData={modal.data}
                    parties={partiesList}
                    onClose={() => setModal({ open: false, mode: "add", data: null })}
                    onSave={handleSavePaymentOut}
                    banks={banks}
                    isSaving={isSaving}
                    PartyAddModal={PartyAddModal}
                />
            )}
            {deleteTarget && (
                <DeleteConfirmModal
                    title="Delete Payment Out"
                    message={`Are you sure you want to delete this payment out ? This action cannot be undone.`}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleConfirmDelete}
                    isDeleting={isDeleting}

                />
            )}
            {printData?.paymentOut && (
                <div style={{ display: "none" }}>
                    <PaymentInOutPrintTemplate
                        ref={printRef}
                        payment={printData?.paymentOut}
                        type="out"
                    />
                </div>
            )}

        </>


    )
}
