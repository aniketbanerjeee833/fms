import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useGetAllDailyExpensesQuery } from "../../redux/api/dailyExpenseApi";
import { Eye, LayoutDashboard, SquarePen } from "lucide-react";
import DailyExpenseModal from "../../components/Modal/DailyExpenseModal";


export default function DailyExpenseList() {
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const[fromDate,setFromDate]= useState('');
    const[toDate,setToDate]= useState('');
    const[dailyExpenseModal,setDailyExpenseModal]= useState(false);
    const[editingDailyExpense,setEditingDailyExpense]= useState(false);
    const{data:dailyExpenses,isLoading}=useGetAllDailyExpensesQuery({
        page,
        search:searchTerm,
        fromDate,
        toDate,
    });
    const[selectedExpense,setSelectedExpense]= useState(null);
  const navigate = useNavigate();
  console.log(dailyExpenses);
    const handlePageChange = (newPage) => {
      setPage(newPage);
    }
    const handleNextPage = () => {
      setPage(page + 1);
    }
    const handlePreviousPage = () => {
      setPage(page - 1);
    }
    
  return (
     <>
       
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
                       <h4 className="text-2xl font-bold mb-1">All Daily Expenses</h4>
                       <p className="text-gray-500 text-sm sm:text-base">
                         All Daily Expenses Details
                       </p>
                     </div>
 
 
                     <button
                       style={{
                         outline: "none",
                         boxShadow: "none",
                         backgroundColor: "#4CA1AF",
                       }}
                       className="text-white px-4 py-2 rounded-md sm:hidden"
                       onClick={() => navigate("/daily-expense/add")}
                     >
                       Add Daily Expense
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
                         onChange={(e) => setFromDate(e.target.value)}
                         className="border p-1 rounded-md shadow-sm text-gray-700 sm:w-auto"
                         title="Search from date"
                       />
                     </div>
 
 
                     <div className="flex flex-col">
                       <span className="text-sm text-gray-600 font-medium mb-1">To Date</span>
                       <input
                         type="date"
                         value={toDate}
                         onChange={(e) => setToDate(e.target.value)}
                         className="border p-1 rounded-md shadow-sm text-gray-700 sm:w-auto"
                         title="Search to date"
                       />
                     </div>
 
 
                     <div className="flex items-center w-full sm:w-56">
                       <input
                         type="text"
                         placeholder="Search ..."
                         value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
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
                         onClick={() => navigate("/daily-expense/add")}
                       >
                         Add Daily Expense
                       </button>
                     </div>
                   </div>
                 </div>
               </div>
              
 
 
 
 
               <div className="tab-inn">
                 <div className="table-responsive table-desi">
                   {isLoading ? (
                     <p className="text-center mt-4">Fetching dailyExpenses...</p>
                   ) : dailyExpenses?.length === 0 ? (
                     <p className="text-center mt-4">No dailyExpenses found.</p>
                   ) : (
 
 
 
 
 
                     <table className="w-full min-w-[500px]">
                       <thead>
                         <tr>
                           <th className="text-left">Sl.No</th>
                           <th className="text-left ">Date</th>
                           <th className="text-left ">Purpose</th>
                           <th className="text-left">Amount</th>
                           <th className="text-left">Payment Method</th>
                           <th className="text-left">Paid Via</th>
                           <th>View</th>
                           <th>Edit</th>
 
                         </tr>
                       </thead>
                       <tbody>
                         {dailyExpenses && dailyExpenses?.dailyExpenses?.length > 0 ? (
                           dailyExpenses?.dailyExpenses?.map((dailyExpense, idx) => (
                             <tr key={dailyExpense?.Expense_Id}>
                               <td>
                                 {(dailyExpenses?.currentPage - 1) * 10 + (idx + 1)}.
                               </td>
                               <td >
                                 {dailyExpense?.Date
                                   ? new Date(dailyExpense?.Date).toLocaleDateString("en-IN", {
                                     day: "numeric",
                                     month: "numeric",
                                     year: "numeric",
                                   })
                                   : "N/A"}
                               </td>
                               <td>{dailyExpense?.Purpose || "N/A"}</td>
                               <td>{dailyExpense?.Amount || "N/A"}</td>
                               <td>{dailyExpense?.Payment_Method || "N/A"}</td>
                               <td>{dailyExpense?.Paid_Via || "N/A"}</td>
 
                               <td >
                                 {/* <NavLink to={`/dailyExpense/view/${dailyExpense?.dailyExpense_Id}`}
                                   state={{ from: "all-dailyExpense-list" }}> */}
      
                                   {/* <Eye
                                    onClick={() => setDailyExpenseModal((prev) => !prev)}
                                     style={{
                                       cursor: "pointer",
                                       backgroundColor: "transparent",
                                       color: "#4CA1AF"
                                     }} /> */}
                                     <Eye
  onClick={() => {
    setSelectedExpense(dailyExpense);  // pass row data
    setDailyExpenseModal(true);
    setEditingDailyExpense(false);
  }}
  style={{
    cursor: "pointer",
    backgroundColor: "transparent",
    color: "#4CA1AF"
  }}
/>
                                 
                                                      
                                                        {/* Add Party Modal */}
                                                        {dailyExpenseModal && (
                                                          <DailyExpenseModal
                                                           dailyExpense={selectedExpense}
                                                            setDailyExpense={setSelectedExpense}  // ⬅ PASS THE SETTER HERE
                                                           editingDailyExpense={editingDailyExpense}
                                                          // dailyExpense={dailyExpense}
                                                            onClose={() => setDailyExpenseModal(false)}
                                                            
                                                          />
                                                        )}


                                 {/* <i
                                                                     style={{
                                                                         cursor: "pointer",
                                                                         backgroundColor: "transparent",
                                                                         color: "#7346ff"
                                                                     }}
                                                                     className="fa fa-eye mr-o" aria-hidden="true"></i> */}
                               </td>
                               <td>
                                 {/* <NavLink to={`/dailyExpense/edit/${dailyExpense?.dailyExpense_Id}`}
                                                                 state={{from:"all-dailyExpense-list"}}>               */}
                                 {/* <NavLink
                                   to={`/dailyExpense/edit/${dailyExpense?.dailyExpense_Id}`}
                                   state={{ from: "all-dailyExpense-list" }}> */}
                             
                                   <SquarePen
                                    onClick={() => {
    setSelectedExpense(dailyExpense);  // pass row data
    setDailyExpenseModal(true);
    setEditingDailyExpense(true);
  }}
                                     style={{
                                       cursor: "pointer",
                                       backgroundColor: "transparent",
                                       color: "#4CA1AF"
                                     }} />
                                 
                                        {dailyExpenseModal && (
                                                          <DailyExpenseModal
                                                           dailyExpense={selectedExpense}
                                                            setDailyExpense={setSelectedExpense}  // ⬅ PASS THE SETTER HERE
                                                           editingDailyExpense={editingDailyExpense}
                                                          // dailyExpense={dailyExpense}
                                                            onClose={() => setDailyExpenseModal(false)}
                                                            // onSave={(newExpense) => {
                                                            //   // setPartySearch(newParty);
                                                            //   //setValue("Party_Name", newParty, { shouldValidate: true });
                                                            //   setDailyExpenseModal(false);
                                                            // }}
                                                          />
                                                        )}
                               </td>
                             </tr>
                           ))
                         ) : (
                           <tr>
                             <td className="mx-auto text-center" colSpan={10}>
                               No dailyExpense found
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
    <div style={{marginRight:"0px"}}
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
  const totalPages = dailyExpenses?.totalPages || 1;
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
        className={`px-3 py-1 rounded ${
          page === i
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
      Page {page} / {dailyExpenses?.totalPages || 1}
    </div>

    {/* NEXT */}
    <button
      type="button"
      onClick={() => handleNextPage()}
      disabled={page === dailyExpenses?.totalPages || 
        dailyExpenses?.totalPages === 0}
      className={`px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded
        ${
          page === dailyExpenses?.totalPages ||
          dailyExpenses?.totalPages === 0
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
         
 
     </>
 
 
   )
}
