

import { NavLink, useSearchParams } from "react-router-dom";

;
import { Download, Eye, FileSpreadsheet, LayoutDashboard, SquarePen, Trash2, Undo2 } from "lucide-react";
import { cashInHandApi, useGetCashBalanceQuery, useGetCashInHandQuery } from "../../redux/api/cashInHandApi";
import { useState } from "react";
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
    // const [fromDate, setFromDate] = useState('');
    // const [toDate, setToDate] = useState('');
    //   const { data: cashInHand, isLoading } = useGetAllSalesQuery({
    //     page,
    //     search: searchTerm,
    //     fromDate,
    //     toDate,
    //   });
    const { data: cashBalance } = useGetCashBalanceQuery();
    const { data: cashInHand, isLoading } = useGetCashInHandQuery({ fromDate, toDate, page, search: searchTerm });
    console.log(cashInHand, "cashInHand", cashBalance, "cashBalance");
    const [updatePaymentOut, { isLoading: isUpdatingPaymentOut }] = useUpdatePaymentOutMutation();
    const [updatePaymentIn, { isLoading: isUpdatingPaymentIn }] = useUpdatePaymentInMutation();
    const { data: banks = [] } = useGetAllBankAccountsQuery();
    const { data: partiesList } = useGetAllPartiesQuery();
    // const[selecedSales,setSelectedSales]= useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null); // holds the purchase to delete
    //const [deletePurchase, { isLoading: isDeleting }] = useDeletePurchaseMutation();
    //const navigate = useNavigate();
    const handlePageChange = (newPage) => {
        setSearchParams({
            page: newPage,
            search: searchTerm,
            fromDate,
            toDate,
        });
    };
    // const handlePageChange = (newPage) => {
    //   setPage(newPage);
    // }
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
    //   const handleExportExcel = () => {
    //     const params = new URLSearchParams();
    //     if (searchTerm) params.set("search", searchTerm);
    //     if (fromDate) params.set("fromDate", fromDate);
    //     if (toDate) params.set("toDate", toDate);

    //     // anchor download 
    //     const url = `http://localhost:4000/api/sale/export-sale-excel?${params.toString()}`;
    //     const a = document.createElement("a");
    //     a.href = url;
    //     a.download = "";          // filename comes from Content-Disposition header
    //     document.body.appendChild(a);
    //     a.click();
    //     document.body.removeChild(a);
    //   };


    //console.log(cashInHand?.cashInHand);
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
            {/* // <div className="container-fluid sb2  ">
        //     <div className="sale">
               
        //         <div className="sb2-1">

        //             <SideMenu/>
        //         </div>

               
        //         <div className="sb2-2"> */}
            {/* <div className="sb2-2-2">
                <ul >
                    <li>

                        <NavLink style={{ display: "flex", flexDirection: "row" }}
                            to="/home"

                        >
                            <LayoutDashboard size={20} style={{ marginRight: '8px' }} />
                            
                            Dashboard
                        </NavLink>
                    </li>

                </ul>
            </div> */}
            {/* <div className="sb2-2-3 ">
        <div className="row">
          <div className="col-md-12">
            <div className="box-inn-sp"> */}

            <div className="flex flex-col bg-white ">

                <div className="inn-title">
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

                    {/* <div className="flex flex-col bg-white p-6 rounded-xl shadow-md w-full max-w-sm">

            
            <div className="mb-2 text-left">
              <p className="text-sm font-medium text-black">Total Sales Amount</p>
              <h4 className="text-3xl font-bold text-black">₹ {cashInHand?.totals?.totalAmount}</h4>
            </div>

           
            <div className="border-t border-gray-300 mb-2"></div>

           
            <div className=" flex flex-col gap-2 sm:flex-row sm:-gap-4">
              <div className="flex  ">
                <span className="text-sm font-medium text-gray-500">Received &nbsp; &nbsp;</span>
                <span className="text-sm font-semibold text-black">₹ {cashInHand?.totals?.totalReceived}</span>
              </div>

              <div className="flex">
                <span className="text-sm font-medium text-gray-500">Balance Due &nbsp; &nbsp;</span>
                <span className="text-sm font-semibold text-black">₹ {cashInHand?.totals?.totalBalance}</span>
              </div>
            </div>

          </div> */}

                    <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-sm">
                        {/* <p className="text-sm font-medium text-gray-500 mb-2">
                            Cash In Hand
                        </p> */}

                        {/* <h4
                            className={`text-3xl font-bold ${Number(cashInHand?.cashInHand) < 0 ? "text-red-600" : "text-green-600"
                                }`}
                        >
                            ₹ {Number(cashInHand?.cashInHand ?? 0).toLocaleString("en-IN")}
                        </h4> */}
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





                <div className="tab-inn">
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
                                        {/* <th className="text-left">Balance Due</th> */}
                                        <th>View/Edit</th>
                                        <th>Delete</th>
                                        {/* <th>Return</th> */}

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
                                            return (
                                                <tr key={idx}>
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
                                                    {/* //<td>{row?.Balance_Due || "N/A"}</td> */}

                                                    {/* <td >
                       
                          <NavLink to={`/row/view/${row?.Sale_Id}${location.search}`}
                            state={{ from: "all-row-list" }}>
                            <Eye
                              style={{
                                cursor: "pointer",
                                backgroundColor: "transparent",
                                color: "#4CA1AF"
                              }} />
                          </NavLink>
                      
                        </td> */}
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
                                                                    state={{ from: "cash-in-hand" }}
                                                                >
                                                                    <Eye style={{ cursor: "pointer", color: "#4CA1AF" }} />
                                                                </NavLink>
                                                            )
                                                        )}
                                                    </td>
                                                    <td>
                                                        <Trash2
                                                            size={18}
                                                            style={{ cursor: "pointer", color: "#ef4444" }}
                                                            onClick={() =>
                                                                setDeleteTarget({
                                                                    Id: row.Formatted_Reference_Id,
                                                                    Txn_Type: row.Txn_Type,   // ✅ must be here
                                                                    //Doc_Number: row.Doc_Number,
                                                                })
                                                            }
                                                        />
                                                    </td>

                                                </tr>
                                            )
                                        })
                                    ) : (
                                        <tr>
                                            <td className="mx-auto text-center" colSpan={10}>
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

