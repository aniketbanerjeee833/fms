
import { NavLink, useLocation, useSearchParams } from "react-router-dom";


import { Download, Eye, FileSpreadsheet, LayoutDashboard, Printer, SquarePen, Trash2 } from "lucide-react";
import { useDeleteSaleReturnMutation, useGetAllSaleReturnsQuery, useGetSaleReturnByIdQuery } from "../../redux/api/saleReturnApi";
import { useEffect, useRef, useState } from "react";
import DeleteConfirmModal from "../../components/Modal/DeleteConfirmModal";
import { toast } from "react-toastify";
import { itemApi } from "../../redux/api/itemApi";
import { useDispatch } from "react-redux";
import { useReactToPrint } from "react-to-print";
import CreditDebitNotePrintTemplate from "../../components/CreditDebitNotePrintTemplate";

// import { SiMicrosoftexcel } from "react-icons/si";
export default function SaleReturn() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const page = Number(searchParams.get("page")) || 1;
  const searchTerm = searchParams.get("search") || "";
  // const [page, setPage] = useState(1);
  //const [searchTerm, setSearchTerm] = useState("");
  const fromDate = searchParams.get("fromDate") || "";
  const toDate = searchParams.get("toDate") || "";
  // const [fromDate, setFromDate] = useState('');
  // const [toDate, setToDate] = useState('');
  // const { data: saleReturns, isLoading } = useGetAllSalesQuery({
  //   page,
  //   search: searchTerm,
  //   fromDate,
  //   toDate,
  // });
  const [deleteTarget, setDeleteTarget] = useState(null); // holds the purchase to delete
  const [deleteSaleReturn, { isLoading: isDeleting }] = useDeleteSaleReturnMutation();
  const { data: saleReturns, isLoading } = useGetAllSaleReturnsQuery({
    page,
    search: searchTerm,
    fromDate,
    toDate,
  });
  const [printSaleReturnId, setPrintSaleReturnId] = useState(null);
  const printRef = useRef(null);
  // const[selecedSales,setSelectedSales]= useState(null);
  const { data: printData } = useGetSaleReturnByIdQuery(printSaleReturnId, {
    skip: !printSaleReturnId,
  });
  //console.log(saleReturns);

  // const[selecedSales,setSelectedSales]= useState(null);


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
  const handleExportExcel = () => {
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
    documentTitle: printSaleReturnId ? `Purchase-${printSaleReturnId}` : "Purchase",
    onAfterPrint: () => setPrintSaleReturnId(null),
  });

  // once printData arrives, trigger the print dialog
  useEffect(() => {
    if (printData && printSaleReturnId) {
      handlePrint();
    }
  }, [printData, printSaleReturnId]);
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


              {/* <button
                style={{
                  outline: "none",
                  boxShadow: "none",
                  backgroundColor: "#4CA1AF",
                }}
                className="text-white px-4 py-2 rounded-md sm:hidden"
                onClick={() => navigate("/sale/add")}
              >
                Add Sale
              </button> */}
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


              {/* <div className="hidden sm:block">
                <button
                  style={{
                    outline: "none",
                    boxShadow: "none",
                    backgroundColor: "#4CA1AF",
                  }}
                  className="hidden sm:block text-white px-4 py-2 rounded-md sm:w-auto"
                  onClick={() => navigate("/sale/add")}
                >
                  Add Sale
                </button>
              </div> */}
            </div>


          </div>

          <div className="flex flex-col bg-white p-6 rounded-xl shadow-md w-full max-w-sm">

            {/* Total Sales */}
            <div className="mb-2 text-left">
              <p className="text-sm font-medium text-black">Total  Amount</p>
              <h4 className="text-3xl font-bold text-black">₹ {saleReturns?.totals?.totalAmount}</h4>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-300 mb-2"></div>

            {/* Received & Balance */}
            <div className=" flex flex-col gap-2 sm:flex-row sm:-gap-4">
              <div className="flex  ">
                <span className="text-sm font-medium text-gray-500">Total Paid &nbsp; &nbsp;</span>
                <span className="text-sm font-semibold text-black">₹ {saleReturns?.totals?.totalPaid}</span>
              </div>

              <div className="flex">
                <span className="text-sm font-medium text-gray-500">Balance Due &nbsp; &nbsp;</span>
                <span className="text-sm font-semibold text-black">₹ {saleReturns?.totals?.totalBalance}</span>
              </div>
            </div>

          </div>
          <div className="flex justify-end sm: mt-4">
            {/* <button
  type="button"
  onClick={handleExportExcel}
  className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#217346] text-white shadow-md transition-all hover:scale-105 hover:shadow-lg active:scale-95"
  title="Export to Excel"
>
  <SiMicrosoftexcel size={22} />
</button> */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="group flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow transition-all duration-200 hover:bg-emerald-700 hover:shadow-lg active:scale-95"
              title="Export to Excel"
            >
              <FileSpreadsheet
                size={22}
                className="transition-transform duration-200 group-hover:scale-110"
              />
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
                    {/* <th>View</th> */}
                    <th>View/Edit</th>
                    <th>Delete</th>
                    <th>Print</th>

                  </tr>
                </thead>
                <tbody>
                  {saleReturns && saleReturns?.saleReturns?.length > 0 ? (
                    saleReturns?.saleReturns?.map((saleReturn, idx) => (
                      <tr key={saleReturn?.id}>
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
                        {/* <td>
                          {saleReturn?.Payment_Type
                            ? saleReturn.Payment_Type === "Bank"
                              ? `Bank (${saleReturn?.Bank_Display_Name || "N/A"})`
                              : saleReturn.Payment_Type
                            : "N/A"}
                        </td> */}
                        <td>{saleReturn?.Payment_Type_Display || "N/A"}</td>
                        <td>{saleReturn?.Total_Amount || "N/A"}</td>
                        <td>{saleReturn?.Total_Paid || "N/A"}</td>
                        <td>{saleReturn?.Balance_Due || "N/A"}</td>

                        {/* <td > */}
                        {/* <NavLink
                                  to={`/saleReturn/edit/${saleReturn.Sale_Id}${location.search}`}

                                > */}
                        {/* <NavLink to={`/saleReturn/view/${saleReturn?.Sale_Id}`}
                                  state={{ from: "all-saleReturn-list" }}> */}
                        {/* <NavLink to={`/saleReturn/view/${saleReturn?.Sale_Id}${location.search}`}
                            state={{ from: "all-saleReturn-list" }}>
                            <Eye
                              style={{
                                cursor: "pointer",
                                backgroundColor: "transparent",
                                color: "#4CA1AF"
                              }} />
                          </NavLink> */}
                        {/* <i
                                                                    style={{
                                                                        cursor: "pointer",
                                                                        backgroundColor: "transparent",
                                                                        color: "#7346ff"
                                                                    }}
                                                                    className="fa fa-eye mr-o" aria-hidden="true"></i> */}
                        {/* //</td> */}
                        <td>
                          {/* <NavLink to={`/sale/edit/${saleReturn?.Sale_Id}`}
                                                                state={{from:"all-sale-list"}}>               */}
                          <NavLink
                            to={`/sale/return/edit/${saleReturn.id}${location.search}`}
                            state={{ from: "all-sale-return-list" }}

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
                                Sale_Return_Id: saleReturn.id,

                              })
                            }
                          />
                        </td>
                        <td>
                          <Printer
                            size={18}
                            style={{ cursor: "pointer", color: "#4CA1AF" }}
                            onClick={() => setPrintSaleReturnId(saleReturn.id)}
                          />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="mx-auto text-center" colSpan={10}>
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
                {[...Array(saleReturns?.totalPages).keys()].map((index) => (
                  <button
                    key={index}
                    onClick={() => handlePageChange(index + 1)}
                    // className={`px-3 py-1 rounded ${page === index + 1 ? 'bg-[#7346ff] text-white' : 'bg-gray-200 hover:bg-gray-300'
                    //   }`}
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
                  disabled={page === saleReturns?.totalPages || saleReturns?.totalPages === 0}
                  className={`px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded
                ${page === saleReturns?.totalPages || saleReturns?.totalPages === 0 ? 'opacity-50 ' : ''}
                `}
                >
                  Next →
                </button>
              </div> */}
      </div>
      {deleteTarget && (
        <DeleteConfirmModal
          title="Delete Credit Note"
          //message={`Are you sure you want to delete purchase bill "${deleteTarget.Bill_Number || deleteTarget.Purchase_Id}"? This action cannot be undone.`}
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
    

    </>


  )
}