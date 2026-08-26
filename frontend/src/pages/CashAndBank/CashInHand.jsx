
import { NavLink, useNavigate, useSearchParams } from "react-router-dom";
import {
    Download,
    Eye,
    FileSpreadsheet,
    LayoutDashboard,
    MoreVertical,
    Printer,
    SquarePen,
    Trash2,
    Undo2
} from "lucide-react";

import { cashInHandApi, useGetCashBalanceQuery, useGetCashInHandQuery } from "../../redux/api/cashInHandApi";
import { useEffect, useState } from "react";
import CashAdjustmentModal from "../../components/Modal/CashAdjustmentModal";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { bankAccountApi, useGetAllBankAccountsQuery } from "../../redux/api/bankAccountApi";
import { useDeletePaymentOutMutation, useGetPaymentOutByIdQuery, useUpdatePaymentOutMutation } from "../../redux/api/paymentOutApi";
import { useDeletePaymentInMutation, useGetPaymentInByIdQuery, useUpdatePaymentInMutation } from "../../redux/api/paymentInApi";
import PaymentOutModal from "../../components/Modal/PaymentOutModal";
import PaymentInModal from "../../components/Modal/PaymentInModal";
import { partyApi, useGetAllPartiesQuery } from "../../redux/api/partyAPi";
import PartyAddModal from "../../components/Modal/PartyAddModal";
import DeleteConfirmModal from "../../components/Modal/DeleteConfirmModal";
import { purchaseApi, useDeletePurchaseMutation } from "../../redux/api/purchaseApi";
import { useDeletePurchaseReturnMutation } from "../../redux/api/purchaseReturnApi";
import { useDeleteSaleReturnMutation } from "../../redux/api/saleReturnApi";
import { saleApi, useDeleteSaleMutation } from "../../redux/api/saleApi";
import { itemApi } from "../../redux/api/itemApi";

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
            PartyAddModal={PartyAddModal}
        />
    );
}
export default function CashInHand() {
    const TYPE_META = {
        row: { label: "Sale", color: "#16a34a", bg: "#f0fdf4", dir: "in" },
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
    const [modalState, setModalState] = useState({ open: false, type: null, id: null });
    const openModal = (type, id) => setModalState({ open: true, type, id });
    const closeModal = () => setModalState({ open: false, type: null, id: null });
    const [rowMenuOpen, setRowMenuOpen] = useState(null);
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    //const location = useLocation();
    const page = Number(searchParams.get("page")) || 1;
    const searchTerm = searchParams.get("search") || "";
    const dispatch = useDispatch();
    // const [page, setPage] = useState(1);
    //const [searchTerm, setSearchTerm] = useState("");
    const fromDate = searchParams.get("fromDate") || "";
    const toDate = searchParams.get("toDate") || "";
    const [cashAdjustmentModal, setCashAdjustmentModal] = useState({ open: false, mode: "add", data: null })

    const { data: cashBalance } = useGetCashBalanceQuery();
    const { data: cashInHand, isLoading } = useGetCashInHandQuery({ fromDate, toDate, page, search: searchTerm });
    console.log(cashInHand, "cashInHand", cashBalance, "cashBalance");
    const [updatePaymentOut, { isLoading: isUpdatingPaymentOut }] = useUpdatePaymentOutMutation();
    const [updatePaymentIn, { isLoading: isUpdatingPaymentIn }] = useUpdatePaymentInMutation();
    const { data: banks = [] } = useGetAllBankAccountsQuery();
    const { data: partiesList } = useGetAllPartiesQuery();
    const [deleteTarget, setDeleteTarget] = useState(null); // holds the purchase to delete

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
    const handleTransactionEdit = (row) => {
        if (!row?.Formatted_Reference_Id) return;

        // Payment In / Payment Out → modal
        if (MODAL_TXN_TYPES.includes(row.Txn_Type)) {
            const params = new URLSearchParams(searchParams);

            params.set("highlightTxn", row.id);

            setSearchParams(params, { replace: true });

            openModal(
                row.Txn_Type,
                row.Formatted_Reference_Id
            );

            return;
        }

        // Other transactions → edit page
        const route = TXN_TYPE_ROUTE_MAP[row.Txn_Type];

        if (!route) return;

        const params = new URLSearchParams(searchParams);

        // KEEP existing page/search/fromDate/toDate
        // and only add the highlighted transaction
        params.set("highlightTxn", row.id);

        navigate(
            {
                pathname: `/${route}/edit/${row.Formatted_Reference_Id}`,
                search: `?${params.toString()}`,
            },
            {
                state: {
                    from: "cash-in-hand",
                    highlightTxn: row.id,
                },
            }
        );
    };

    // const handleTransactionEdit = (row) => {
    //     if (!row?.Formatted_Reference_Id) return;

    //     // Payment In / Payment Out open their edit modals
    //     if (MODAL_TXN_TYPES.includes(row.Txn_Type)) {
    //         openModal(
    //             row.Txn_Type,
    //             row.Formatted_Reference_Id
    //         );
    //         return;
    //     }

    //     // Other transactions open their edit page
    //     const route = TXN_TYPE_ROUTE_MAP[row.Txn_Type];

    //     if (!route) return;

    //     navigate(
    //         `/${route}/edit/${row.Formatted_Reference_Id}`,
    //         {
    //             state: {
    //                 from: "cash-in-hand"
    //             }
    //         }
    //     );
    // };

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


    const handleSavePaymentIn = async (formData) => {
        try {
            await updatePaymentIn({ id: modalState.id, ...formData }).unwrap();
            dispatch(cashInHandApi.util.invalidateTags(["CashInHand"]));
            dispatch(bankAccountApi.util.invalidateTags([
                { type: "BankAccount", id: formData.Bank_Account_Id },
                "BankAccount",
            ]));
            /* reset scroll so updated data reloads */

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

    const isDeleting =
        isDeletingSale ||
        isDeletingPurchase ||
        isDeletingSaleReturn ||
        isDeletingPurchaseReturn ||
        isDeletingPaymentIn ||
        isDeletingPaymentOut;

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
            dispatch(partyApi.util.invalidateTags(["Party"]));
            dispatch(cashInHandApi.util.invalidateTags(["CashInHand"]));
            dispatch(
                bankAccountApi.util.invalidateTags(["BankAccount"])
            );
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
    }


    return (
        <>

            <div className="flex flex-col bg-white"
              style={{ height: "100vh", minHeight: 0, overflow: "hidden" }}
            >

                <div className="inn-title" style={{ flexShrink: 0 }}>
                    <div className="flex flex-col sm:flex-col lg:flex-row justify-between lg:items-center">

                        <div className="flex flex-row justify-between items-center mb-4 sm:mb-4">
                            <div>
                                <h4 className="text-2xl font-bold mb-1">Cash In Hand</h4>
                                <p className="text-gray-500 text-sm sm:text-base">
                                    All Cash In  Details
                                </p>
                            </div>


                            <button
                                style={{
                                    outline: "none",
                                    boxShadow: "none",
                                    backgroundColor: "#4CA1AF",
                                }}
                                className="text-white px-4 py-2 rounded-md sm:hidden"
                                // onClick={() => navigate("/sale/add")}
                                onClick={() => setCashAdjustmentModal({ open: true, mode: "add", data: null })}
                            >
                                Adjust Cash
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
                                    onClick={() => setCashAdjustmentModal({ open: true, mode: "add", data: null })}
                                //   onClick={() => navigate("/sale/add")}
                                >
                                    Adjust Cash
                                </button>
                            </div>
                        </div>


                    </div>


                    <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-sm">

                        <h4
                            style={{
                                fontSize: "26px",
                                fontWeight: "700",
                                margin: 0,
                                color:
                                    Number(cashInHand?.cashInHand) < 0
                                        ? "#DC2626" // red
                                        : "#16A34A", // green
                            }}
                        >
                            ₹ {Number(cashInHand?.cashInHand ?? 0).toLocaleString("en-IN")}
                        </h4>
                    </div>

                </div>


                {/* <div className="tab-inn"
                style={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}
                > */}
                <div className="tab-inn"
                style={{ flex: 1, minHeight: 0, overflow: "hidden" }}
                > 
                    <div className="table-responsive table-desi">
                        {isLoading ? (
                            <p className="text-center mt-4">Fetching ...</p>
                        ) : cashInHand?.length === 0 ? (
                            <p className="text-center mt-4">No cash in hand found.</p>
                        ) : (





                            <table className="w-full min-w-[500px]">
                                <thead>

                                    <tr>
                                        <th className="text-left">Sl.No</th>
                                        <th className="text-left ">Type</th>
                                        <th className="text-left ">Name</th>
                                        <th className="text-left">Date</th>
                                        <th className="text-left">Amount </th>
                                        <th></th>
                                    </tr>

                                </thead>
                                <tbody>
                                    {cashInHand && cashInHand?.ledger?.length > 0 ? (
                                        cashInHand?.ledger?.map((row, idx) => {
                                            const meta =
                                                TYPE_META[row.Txn_Type?.toLowerCase()] ?? {
                                                    label: row.Txn_Type,
                                                    color: "#6b7280",
                                                    dir: row.Direction === "Credit" ? "in" : "out",
                                                };
                                            const isHighlighted =
                                                String(searchParams.get("highlightTxn")) ===
                                                String(row.id);
                                            //const isHighlighted = String(searchParams.get("highlightTxn")) === String(row.Formatted_Reference_Id);

                                            return (
                                                // <tr
                                                //     key={idx}
                                                //     onDoubleClick={() => handleTransactionEdit(row)}
                                                //     className="cursor-pointer"
                                                // >
                                                <tr
                                                    key={idx}

                                                    onClick={() => {
                                                        const params = new URLSearchParams(searchParams);

                                                        params.set(
                                                            "highlightTxn",
                                                            row.id
                                                        );

                                                        setSearchParams(params, { replace: true });
                                                    }}

                                                    onDoubleClick={() => {
                                                        const params = new URLSearchParams(searchParams);

                                                        params.set(
                                                            "highlightTxn",
                                                            row.id
                                                        );

                                                        setSearchParams(params, { replace: true });

                                                        handleTransactionEdit(row);
                                                    }}

                                                    className="cursor-pointer"
                                                    style={{
                                                        backgroundColor: isHighlighted
                                                            ? "#4CA1AF22"
                                                            : "transparent",
                                                    }}
                                                >
                                                    <td>
                                                        {(cashInHand?.currentPage - 1) * 10 + (idx + 1)}.
                                                    </td>


                                                    <td>{row?.Txn_Type || "N/A"}</td>
                                                    <td>{row?.Party_Name || "N/A"}</td>
                                                    <td >
                                                        {row?.Txn_Date
                                                            ? new Date(row?.Txn_Date).toLocaleDateString("en-IN", {
                                                                day: "numeric",
                                                                month: "numeric",
                                                                year: "numeric",
                                                            })
                                                            : "N/A"}
                                                    </td>
                                                    <td style={{ color: meta.color, fontWeight: 600 }}>
                                                        {row?.Amount || "N/A"}</td>

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
                                                                            // onClick={() => {
                                                                            //     setRowMenuOpen(null);
                                                                            //     openModal(
                                                                            //         row.Txn_Type,
                                                                            //         row.Formatted_Reference_Id
                                                                            //     );
                                                                            // }}
                                                                            onClick={() => {
                                                                                setRowMenuOpen(null);

                                                                                const params = new URLSearchParams(searchParams);

                                                                                params.set(
                                                                                    "highlightTxn",
                                                                                    row.id
                                                                                );

                                                                                setSearchParams(params, { replace: true });

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
                                                                            to={{
                                                                                pathname: `/${TXN_TYPE_ROUTE_MAP[row.Txn_Type]}/edit/${row.Formatted_Reference_Id}`,
                                                                                search: (() => {
                                                                                    const params = new URLSearchParams(searchParams);

                                                                                    params.set(
                                                                                        "highlightTxn",
                                                                                        row.id
                                                                                    );

                                                                                    return `?${params.toString()}`;
                                                                                })(),
                                                                            }}
                                                                            state={{
                                                                                from: "cash-in-hand",
                                                                                highlightTxn: row.id,
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
                                                                        // <NavLink
                                                                        //     to={{
                                                                        //         pathname: `/${TXN_TYPE_ROUTE_MAP[row.Txn_Type]}/edit/${row.Formatted_Reference_Id}`,
                                                                        //         search: `?highlightTxn=${encodeURIComponent(row.id)}`,
                                                                        //     }}
                                                                        //     state={{
                                                                        //         from: "cash-in-hand",
                                                                        //         highlightTxn: row.id,
                                                                        //     }}
                                                                        //     className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                                                                        //     style={{
                                                                        //         color: "#374151",
                                                                        //         textDecoration: "none",
                                                                        //     }}
                                                                        //     onClick={() => setRowMenuOpen(null)}
                                                                        // >
                                                                        //     <Eye
                                                                        //         size={13}
                                                                        //         style={{ color: "#4CA1AF" }}
                                                                        //     />
                                                                        //     View / Edit
                                                                        // </NavLink>
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
                                            )
                                        })
                                    ) : (
                                        <tr>
                                            <td className="mx-auto text-center" colSpan={6}>
                                                No cash in hand found
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
                            {/* {[...Array(foodItems?.totalPages).keys()].map((index) => (
        <button
          key={index}
          onClick={() => handlePageChange(index + 1)}
          className={
            `px-3 py-1 rounded ${
              page === index + 1
                ? 'bg-[#ff0000] text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`
          }
        >
          {index + 1}
        </button>
      ))} */}
                            {(() => {
                                const totalPages = cashInHand?.totalPages || 1;
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
                            Page {page} / {cashInHand?.totalPages || 1}
                        </div>

                        {/* NEXT */}
                        <button
                            type="button"
                            onClick={() => handleNextPage()}
                            disabled={page === cashInHand?.totalPages ||
                                cashInHand?.totalPages === 0}
                            className={`px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded
        ${page === cashInHand?.totalPages ||
                                    cashInHand?.totalPages === 0
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

            {cashAdjustmentModal.open && (
                <CashAdjustmentModal
                    mode={cashAdjustmentModal.mode}
                    data={cashAdjustmentModal.data}
                    currentBalance={Number(cashInHand?.cashInHand ?? 0)}
                    onClose={() => setCashAdjustmentModal({ open: false, mode: "add", data: null })}
                />
            )}
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
                //isDeleting={false}
                />
            )}
        </>


    )
}

