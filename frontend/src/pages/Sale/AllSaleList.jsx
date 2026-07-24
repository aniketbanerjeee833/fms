
import { NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { useGetAllSalesQuery } from "../../redux/api/saleApi";
import { Download, Eye, FileSpreadsheet, LayoutDashboard, SquarePen } from "lucide-react";

// import { SiMicrosoftexcel } from "react-icons/si";
export default function AllSaleList() {
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
  const { data: sales, isLoading } = useGetAllSalesQuery({
    page,
    search: searchTerm,
    fromDate,
    toDate,
  });
  console.log(sales);

  // const[selecedSales,setSelectedSales]= useState(null);

  const navigate = useNavigate();
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


  console.log(sales?.sales);

  return (
    <>
      {/* // <div className="container-fluid sb2  ">
        //     <div className="row">
               
        //         <div className="sb2-1">

        //             <SideMenu/>
        //         </div>

               
        //         <div className="sb2-2"> */}
      <div className="sb2-2-2">
        <ul >
          <li>

            <NavLink style={{ display: "flex", flexDirection: "row" }}
              to="/home"

            >
              <LayoutDashboard size={20} style={{ marginRight: '8px' }} />
              {/* <i className="fa fa-home mr-2" aria-hidden="true"></i> */}
              Dashboard
            </NavLink>
          </li>

        </ul>
      </div>
      {/* <div className="sb2-2-3 ">
        <div className="row">
          <div className="col-md-12">
            <div className="box-inn-sp"> */}

      <div className="flex flex-col bg-white ">

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
                Add Sale
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
                  onClick={() => navigate("/sale/add")}
                >
                  Add Sale
                </button>
              </div>
            </div>


          </div>

          <div className="flex flex-col bg-white p-6 rounded-xl shadow-md w-full max-w-sm">

            {/* Total Sales */}
            <div className="mb-2 text-left">
              <p className="text-sm font-medium text-black">Total Sales Amount</p>
              <h4 className="text-3xl font-bold text-black">₹ {sales?.totals?.totalAmount}</h4>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-300 mb-2"></div>

            {/* Received & Balance */}
            <div className=" flex flex-col gap-2 sm:flex-row sm:-gap-4">
              <div className="flex  ">
                <span className="text-sm font-medium text-gray-500">Received &nbsp; &nbsp;</span>
                <span className="text-sm font-semibold text-black">₹ {sales?.totals?.totalReceived}</span>
              </div>

              <div className="flex">
                <span className="text-sm font-medium text-gray-500">Balance Due &nbsp; &nbsp;</span>
                <span className="text-sm font-semibold text-black">₹ {sales?.totals?.totalBalance}</span>
              </div>
            </div>

          </div>
          <div className="flex justify-end">
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
              <p className="text-center mt-4">Fetching sales...</p>
            ) : sales?.length === 0 ? (
              <p className="text-center mt-4">No sales found.</p>
            ) : (





              <table className="w-full min-w-[500px]">
                <thead>
                  <tr>
                    <th className="text-left">Sl.No</th>
                    <th className="text-left ">Invoice Date</th>
                    <th className="text-left ">Party Name</th>
                    <th className="text-left">Payment Type</th>
                    <th className="text-left">Amount </th>
                    <th className="text-left">Balance Due</th>
                    <th>View</th>
                    <th>Edit</th>

                  </tr>
                </thead>
                <tbody>
                  {sales && sales?.sales?.length > 0 ? (
                    sales?.sales?.map((sale, idx) => (
                      <tr key={sale?.Sale_Id}>
                        <td>
                          {(sales?.currentPage - 1) * 10 + (idx + 1)}.
                        </td>
                        <td >
                          {sale?.Invoice_Date
                            ? new Date(sale?.Invoice_Date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "numeric",
                              year: "numeric",
                            })
                            : "N/A"}
                        </td>
                        {/* <td>
                                {sale?.Invoice_Date
                                  ? sale?.Invoice_Date.split("T")[0]
                                  : "N/A"}
                              </td> */}
                        <td>{sale?.Party_Name || "N/A"}</td>
                        <td>{sale?.Payment_Type || "N/A"}</td>
                        <td>{sale?.Total_Amount || "N/A"}</td>
                        <td>{sale?.Balance_Due || "N/A"}</td>

                        <td >
                          {/* <NavLink
                                  to={`/sale/edit/${sale.Sale_Id}${location.search}`}

                                > */}
                          {/* <NavLink to={`/sale/view/${sale?.Sale_Id}`}
                                  state={{ from: "all-sale-list" }}> */}
                          <NavLink to={`/sale/view/${sale?.Sale_Id}${location.search}`}
                            state={{ from: "all-sale-list" }}>
                            <Eye
                              style={{
                                cursor: "pointer",
                                backgroundColor: "transparent",
                                color: "#4CA1AF"
                              }} />
                          </NavLink>
                          {/* <i
                                                                    style={{
                                                                        cursor: "pointer",
                                                                        backgroundColor: "transparent",
                                                                        color: "#7346ff"
                                                                    }}
                                                                    className="fa fa-eye mr-o" aria-hidden="true"></i> */}
                        </td>
                        <td>
                          {/* <NavLink to={`/sale/edit/${sale?.Sale_Id}`}
                                                                state={{from:"all-sale-list"}}>               */}
                          <NavLink
                            to={`/sale/edit/${sale.Sale_Id}${location.search}`}
                            state={{ from: "all-sale-list" }}

                          >

                            <SquarePen
                              style={{
                                cursor: "pointer",
                                backgroundColor: "transparent",
                                color: "#4CA1AF"
                              }} />
                          </NavLink>

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

            {/* CURRENT PAGE — MOBILE ONLY */}
            <div className="sm:hidden px-3 py-1 bg-gray-100 rounded text-sm">
              Page {page} / {sales?.totalPages || 1}
            </div>

            {/* NEXT */}
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
                {[...Array(sales?.totalPages).keys()].map((index) => (
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
                  disabled={page === sales?.totalPages || sales?.totalPages === 0}
                  className={`px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded
                ${page === sales?.totalPages || sales?.totalPages === 0 ? 'opacity-50 ' : ''}
                `}
                >
                  Next →
                </button>
              </div> */}
      </div>


    </>


  )
}