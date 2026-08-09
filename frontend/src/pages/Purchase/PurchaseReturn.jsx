
import { NavLink, useLocation, useSearchParams } from "react-router-dom";


import { Eye, FileSpreadsheet, LayoutDashboard, SquarePen, Trash2 } from "lucide-react";
import { useDeletePurchaseReturnMutation, useGetAllPurchaseReturnsQuery } from "../../redux/api/purchaseReturnApi";
import { useState } from "react";
import DeleteConfirmModal from "../../components/Modal/DeleteConfirmModal";
import { toast } from "react-toastify";
import { itemApi } from "../../redux/api/itemApi";
import { useDispatch } from "react-redux";


export default function PurchaseReturn() {

  // const [page, setPage] = useState(1);


  // const [selectedPurchase, setSelectedpurchaseReturns] = useState(null);
  // const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const page = Number(searchParams.get("page")) || 1;
  const searchTerm = searchParams.get("search") || "";
  // const [page, setPage] = useState(1);
  //const [searchTerm, setSearchTerm] = useState("");
  const fromDate = searchParams.get("fromDate") || "";
  const toDate = searchParams.get("toDate") || "";
  const [deleteTarget, setDeleteTarget] = useState(null); // holds the purchase to delete
  const [deletePurchaseReturn, { isLoading: isDeleting }] = useDeletePurchaseReturnMutation();
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
  return (
    <>
      {/* // <div className="container-fluid sb2  ">
        //     <div className="row">
               
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


              {/* <button
                style={{
                  outline: "none",
                  boxShadow: "none",
                  backgroundColor: "#4CA1AF",
                }}
                className="text-white px-4 py-2 rounded-md sm:hidden"
                onClick={() => navigate("/purchaseReturn/return/add")}
              >
                Add Debit Note
              </button> */}
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


              {/* <div className="hidden sm:block">
                <button
                  style={{
                    outline: "none",
                    boxShadow: "none",
                    backgroundColor: "#4CA1AF",
                  }}
                  className="hidden sm:block text-white px-4 py-2 rounded-md sm:w-auto"
                  onClick={() => navigate("/purchaseReturn/return/add")}
                >
                  Add  Debit Note
                </button>
              </div> */}
            </div>
          </div>


          {/* Paid + Unpaid = Total */}
          <div className="flex flex-col bg-white p-6 rounded-xl shadow-md w-full max-w-sm">

            {/* Total Sales */}
            <div className="mb-2 text-left">
              <p className="text-sm font-medium text-black">Total Amount</p>
              <h4 className="text-3xl font-bold text-black">₹  {purchaseReturns?.totals?.totalAmount}</h4>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-300 mb-2"></div>

            {/* Received & Balance */}
            <div className=" flex flex-col gap-2 sm:flex-row sm:-gap-4">
              <div className="flex  ">
                <span className="text-sm font-medium text-gray-500">Received &nbsp; &nbsp;</span>
                <span className="text-sm font-semibold text-black">₹ {purchaseReturns?.totals?.totalReceived}</span>
              </div>

              <div className="flex">
                <span className="text-sm font-medium text-gray-500">Balance Due &nbsp; &nbsp;</span>
                <span className="text-sm font-semibold text-black">₹{purchaseReturns?.totals?.totalBalance}</span>
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
                    <th>View/Edit</th>
                    <th>Delete</th>
                    {/* <th>Edit</th> */}
                  </tr>
                </thead>
                <tbody>
                  {purchaseReturns && purchaseReturns?.purchaseReturns?.length > 0 ? (
                    purchaseReturns?.purchaseReturns?.map((purchaseReturn, idx) => (
                      <tr key={purchaseReturn?.id}>
                        <td>
                          {(purchaseReturns?.currentPage - 1) * 10 + (idx + 1)}.
                        </td>
                        {/* <td>
  {purchaseReturn?.Bill_Date
    ? purchaseReturn.Bill_Date.split("T")[0]
    : "N/A"}
</td> */}
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
                        {/* <td>
                          {purchaseReturn?.Payment_Type
                            ? purchaseReturn.Payment_Type === "Bank"
                              ? `Bank (${purchaseReturn?.Bank_Display_Name || "N/A"})`
                              : purchaseReturn.Payment_Type
                            : "N/A"}
                        </td> */}
                        <td>{purchaseReturn?.Payment_Type_Display || "N/A"}</td>
                        <td>{purchaseReturn?.Total_Amount || "N/A"}</td>
                        <td>{purchaseReturn?.Total_Received || "N/A"}</td>
                        <td>{purchaseReturn?.Balance_Due || "N/A"}</td>

                        {/* <td >
                           
                            <NavLink to={`/purchaseReturn/view/${purchaseReturn?.Purchase_Id}${location.search}`}
                              state={{ from: "all-purchaseReturn-list" }}>
                              <Eye
                                style={{
                                  cursor: "pointer",
                                  backgroundColor: "transparent",
                                  color: "#4CA1AF"
                                }} />
                            </NavLink>
                          </td> */}
                        <td
                        >
                          <NavLink
                            to={`/purchase/return/edit/${purchaseReturn?.id}${location.search}`}
                            state={{ from: "all-purchase-return-list" }}

                          >

                            <SquarePen
                              style={{
                                cursor: "pointer",
                                backgroundColor: "transparent",
                                color: "#4CA1AF"
                              }} />
                          </NavLink>


                        </td>
                        <td>
                          <Trash2
                            size={18}
                            style={{ cursor: "pointer", color: "#ef4444" }}
                            onClick={() =>
                              setDeleteTarget({
                                Purchase_Return_Id: purchaseReturn.id,

                              })
                            }
                          />
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
        {/* <div className="flex justify-center align-center space-x-2 p-4">
                <button type="button"
                  onClick={() => handlePreviousPage()}
                  disabled={page === 1}
                  className={`px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded
                ${page === 1 ? 'opacity-50 ' : ''}
                `}
                >
                  ← Previous
                </button>
                {[...Array(purchaseReturns?.totalPages).keys()].map((index) => (
                  <button
                    key={index}
                    onClick={() => handlePageChange(index + 1)}
                    //   className={`px-3 py-1 rounded ${page === index + 1 ? 'bg-[#7346ff] text-white' : 'bg-gray-200 hover:bg-gray-300'
                    //     }`}
                    className={
                      `px-3 py-1 rounded ${page === index + 1 ? 'bg-[#4CA1AF] text-white' :
                        'bg-gray-200 hover:bg-gray-300'
                      }`}
                  >
                    {index + 1}
                  </button>
                ))}

                <button type="button"
                  onClick={() => handleNextPage()}
                  disabled={page === purchaseReturns?.totalPages || purchaseReturns?.totalPages === 0}
                  className={`px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded
                ${page === purchaseReturns?.totalPages || purchaseReturns?.totalPages === 0 ? 'opacity-50 ' : ''}
                `}
                >
                  Next →
                </button>
              </div> */}
      </div>

   {deleteTarget && (
        <DeleteConfirmModal
          title="Delete Debit Note"
          message={`Are you sure you want to delete this Debit Note ? This action cannot be undone.`}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
          //isDeleting={false}
        />
      )}
    </>
    


  )
}

