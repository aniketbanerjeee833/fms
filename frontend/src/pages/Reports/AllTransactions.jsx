import { useState,useEffect } from 'react';

// import {
//   TrendingUp, TrendingDown, DollarSign, ShoppingCart,
//   Users, Package, AlertCircle, FileText, LayoutDashboard, CalendarDays
  
// } from 'lucide-react';
//import { NavLink } from 'react-router-dom';
import {
  
  useGetTotalSalesPurchasesReceivablesPayablesProfitQuery
} from '../../redux/api/dashboardApi';
import { toast } from 'react-toastify';



// import { useGetTotalSalesEachDayQuery } from "../../redux/api/saleApi";
// import { useGetTotalPurchasesEachDayQuery } from "../../redux/api/purchaseApi";
import { Filter, X } from 'lucide-react';
import { useGetDayWiseTransactionsQuery } from '../../redux/api/reportApi';
import { useNavigate, useLocation } from 'react-router-dom';




export default function AllTransactions() {
  // const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
  // 🎨 Generate consistent color for each partyId
  //const partyColorMap = new Map();
const navigate = useNavigate();
const location = useLocation();

  // 🎨 Base color palette to start cycling from
  const BASE_COLORS = [
    "#3b82f6", // Blue
    "#8b5cf6", // Purple
    "#ef4444", // Red
    "#10b981", // Green
    "#f59e0b", // Amber
    "#ec4899", // Pink
    "#6366f1", // Indigo
    "#14b8a6", // Teal
    "#f97316", // Orange
    "#84cc16", // Lime
  ];


  //const { data: salesData } = useGetTotalSalesEachDayQuery();
  const [reportType, setReportType] = useState('');
  // const { data: newSalesData } = useGetTotalNewSalesEachDayQuery();
  //const { data: purchasesData } = useGetTotalPurchasesEachDayQuery();
  const [showRangeModal, setShowRangeModal] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  //const totalSalesByDate = salesData?.data || [];
  // const totalNewSalesByDate = newSalesData?.data || [];
 // const totalPurchasesByDate = purchasesData?.data || [];

  

  const today = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
  console.log(today);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  useEffect(() => {
  const savedDate = location.state?.selectedDate;

  if (savedDate) {
    const [year, month] = savedDate.split("-").map(Number);

    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(savedDate);
  }
}, [location.key]);
  const selectedYear = currentDate.getFullYear();
  const selectedMonth = currentDate.getMonth() + 1; // JS month is 0-based
  console.log("selectedMonth", selectedMonth, selectedYear);
  // Calculate the first and last day of the displayed month
const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;

const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(
  new Date(selectedYear, selectedMonth, 0).getDate()
).padStart(2, "0")}`;

// Fetch all transaction counts for the displayed month
const {
  data: transactionsData,
  
} = useGetDayWiseTransactionsQuery({
  startDate,
  endDate,
});

// Create a lookup using the date as the key
const transactionsByDate = Object.fromEntries(
  (transactionsData?.data || []).map((item) => [item.date, item])
);
  const { data: totalSalesPurchasesReceivablesPayablesProfit } =
    useGetTotalSalesPurchasesReceivablesPayablesProfitQuery({ month: selectedMonth, year: selectedYear });
  // Item-wise analysis
  console.log(totalSalesPurchasesReceivablesPayablesProfit, "totalSalesPurchasesReceivablesPayablesProfit");
  console.log("salesPurchasesProfitData", totalSalesPurchasesReceivablesPayablesProfit);
  //const itemAnalysis = {};
//   const profitMargin = ((totalSalesPurchasesReceivablesPayablesProfit?.profit /
//     totalSalesPurchasesReceivablesPayablesProfit?.sales) * 100).toFixed(1);

//   const { data: totalPayablesLeftData } = useGetTotalPayablesLeftQuery();
//   const { data: totalReceivablesLeftData } = useGetTotalReceivablesLeftQuery();

//   const totalPayablesLeft = totalPayablesLeftData?.total_payables_left;
//   const totalReceivablesLeft = totalReceivablesLeftData?.total_receivables_left;
//   const partiesLeftInPayables = totalPayablesLeftData?.total_parties;
//   const partiesLeftInReceivables = totalReceivablesLeftData?.total_parties;
//   console.log("totalPayablesLeft", totalPayablesLeft);
//   console.log("totalReceivablesLeft", totalReceivablesLeft);
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const formatDate = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const handleDateClick = (day) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const dateStr = formatDate(year, month, day);

    console.log("Selected date:", dateStr);

    // Clear leads immediately when a new date is selected
    // dispatch(clearSelectedLeads());
    setSelectedDate(dateStr);
    //navigate(`/day-wise-report/${dateStr}`);
    //window.open(`/reports/all-transactions-details-day-wise/${dateStr}`, "_blank");
   navigate(`/reports/all-transactions-details-day-wise/${dateStr}`, {
state: {
selectedDate: dateStr,
calendarYear: year,
calendarMonth: month,
},
});
    // Remove the manual fetchLeadsByDate call - let the query handle it
  };

  // const navigateMonth = (direction) => {
  //   const newDate = new Date(currentDate);
  //   newDate.setMonth(newDate.getMonth() + direction);

  //   // dispatch(clearSelectedLeads()); // Clear leads when navigating months
  //   setCurrentDate(newDate);
  //   setSelectedDate(today);
  //   // setSelectedLeads([]);

  // };
  const navigateMonth = (direction) => {
  setCurrentDate((previousDate) => {
    const newDate = new Date(previousDate);

    // Prevent month-end date rollover
    newDate.setDate(1);
    newDate.setMonth(newDate.getMonth() + direction);

    return newDate;
  });
};
  const handleDateRangeSubmit = () => {
    if (dateRange.startDate && dateRange.endDate) {
      if (new Date(dateRange.endDate) < new Date(dateRange.startDate)) {
        alert("End date must be after start date");
        return;
      }

      let url = `/date-range-report/${dateRange.startDate}/${dateRange.endDate}`;

      // ✅ append only if passed
      if (reportType) {
        url += `?reportType=${reportType}`;
      }
      console.log(reportType)
      console.log(url);
      window.open(url, "_blank");

      setShowRangeModal(false);
      setDateRange({ startDate: "", endDate: "" });
      setReportType("");
    } else {
      toast.error("Please select both start and end dates");
    }
  };


  const renderCalendar = () => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();

  const days = [];

  // Empty cells before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(
      <div
        key={`empty-${i}`}
        className="h-20 min-w-0 rounded-md border bg-gray-50"
      />
    );
  }

  // Render each day of the month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = formatDate(year, month, d);

    const isToday =
      d === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear();

    const isSelected = selectedDate === dateStr;

    // Find all transactions for this date
    const dayTransactions = transactionsByDate[dateStr];

    const totalSales = Number(dayTransactions?.total_sales ?? 0);
    const totalPurchases = Number(dayTransactions?.total_purchases ?? 0);

    const totalSalesReturns = Number(
      dayTransactions?.total_sales_returns ?? 0
    );
const totalExpenses = Number(dayTransactions?.total_expenses ?? 0);
    const totalPurchaseReturns = Number(
      dayTransactions?.total_purchase_returns ?? 0
    );

    const totalPaymentsIn = Number(
      dayTransactions?.total_payments_in ?? 0
    );

    const totalPaymentsOut = Number(
      dayTransactions?.total_payments_out ?? 0
    );

    days.push(
      <div
        key={dateStr}
        onClick={() => handleDateClick(d)}
        className={`
          relative min-w-0 h-20 sm:h-20
          border p-1 sm:p-2 rounded-md cursor-pointer
          transition overflow-hidden
          ${
            isSelected
              ? "bg-blue-100 border-blue-400"
              : isToday
              ? "bg-green-100 border-green-400"
              : "bg-white hover:bg-gray-50"
          }
        `}
      >
        {/* Day number */}
        <div className="text-xs sm:text-sm font-semibold text-gray-700">
          {d}
        </div>

        {/* Daily transaction counts */}
        <div className="absolute left-1 right-1 bottom-1 flex flex-col gap-0.5 overflow-y-auto overflow-x-hidden max-h-[calc(100%-24px)]">

          {/* Sales */}
          {totalSales > 0 && (
            <div className="text-[7px] sm:text-xs text-green-700 font-medium whitespace-nowrap">
              <span className="sm:hidden">S:</span>
              <span className="hidden sm:inline">Sales:</span>{" "}
              {totalSales.toLocaleString("en-IN")}
            </div>
          )}

          {/* Purchases */}
          {totalPurchases > 0 && (
            <div className="text-[7px] sm:text-xs text-red-700 font-medium whitespace-nowrap">
              <span className="sm:hidden">P:</span>
              <span className="hidden sm:inline">Purchases:</span>{" "}
              {totalPurchases.toLocaleString("en-IN")}
            </div>
          )}
          {/* Expenses */}
{totalExpenses > 0 && (
  <div className="text-[7px] sm:text-xs text-amber-700 font-medium whitespace-nowrap">
    <span className="sm:hidden">E:</span>
    <span className="hidden sm:inline">Expenses:</span>{" "}
    {totalExpenses.toLocaleString("en-IN")}
  </div>
)}

          {/* Sales Returns */}
          {totalSalesReturns > 0 && (
            <div className="text-[7px] sm:text-xs text-orange-700 font-medium whitespace-nowrap">
              <span className="sm:hidden">SR:</span>
              <span className="hidden sm:inline">Sales Returns:</span>{" "}
              {totalSalesReturns.toLocaleString("en-IN")}
            </div>
          )}

          {/* Purchase Returns */}
          {totalPurchaseReturns > 0 && (
            <div className="text-[7px] sm:text-xs text-purple-700 font-medium whitespace-nowrap">
              <span className="sm:hidden">PR:</span>
              <span className="hidden sm:inline">Purchase Returns:</span>{" "}
              {totalPurchaseReturns.toLocaleString("en-IN")}
            </div>
          )}

          {/* Payments In */}
          {totalPaymentsIn > 0 && (
            <div className="text-[7px] sm:text-xs text-blue-700 font-medium whitespace-nowrap">
              <span className="sm:hidden">PI:</span>
              <span className="hidden sm:inline">Payments In:</span>{" "}
              {totalPaymentsIn.toLocaleString("en-IN")}
            </div>
          )}

          {/* Payments Out */}
          {totalPaymentsOut > 0 && (
            <div className="text-[7px] sm:text-xs text-pink-700 font-medium whitespace-nowrap">
              <span className="sm:hidden">PO:</span>
              <span className="hidden sm:inline">Payments Out:</span>{" "}
              {totalPaymentsOut.toLocaleString("en-IN")}
            </div>
          )}
        </div>
      </div>
    );
  }

  return days;
};







  //   console.log(salesPurchasesProfitData?.data,categoryWiseItemCount);
  //  console.log(partyWiseSalesAndPurchases,"partyWiseSalesAndPurchases",
  //   partyWiseSalesAndPurchases?.data,profitMargin);



//   const StatCard = ({ title, value, icon: Icon, color }) => {
//     // ✅ Determine the route dynamically
//     //const lowerTitle = title.toLowerCase();
//     //let route = "";
//     // if (lowerTitle.includes("sale")) route = "/sale/all-sales";
//     // else if (lowerTitle.includes("purchase")) route = "/purchase/all-purchases";

//     return (
//       <div
//         className="flex flex-col justify-between bg-white rounded-xl shadow-sm 
//                  border border-gray-100 hover:shadow-md transition-all 
//                  p-4 w-full min-w-[180px] h-[100px]"
//       >
//         {/* 🔹 Icon + Title */}
//         <div className="flex items-center mb-1">
//           <div className="flex gap-2 items-center">
//             <div className={`p-2 rounded-full ${color}`}>
//               <Icon className="w-5 h-5 text-white" />
//             </div>
//             <p style={{ color: "black" }} className="text-sm text-gray-600 font-medium truncate mt-2 ">{title}</p>
//           </div>
//         </div>

//         {/* 💰 Value */}
//         <h4 className="text-2xl font-bold text-gray-900 mt-2">
//           ₹{value?.toLocaleString() || 0}
//         </h4>

//         {/* 🔗 “View all …” link — only this is clickable */}
//         {/* {title.split(/\s+/).length > 1 && (
//         <NavLink
//           to={route}
//           className="text-xs text-gray-500 hover:text-[#4CA1AF] mt-2 transition-colors self-start"
//         >
//           View all {title.split(/\s+/)[1]}
//         </NavLink>
//       )} */}
//       </div>
//     );
//   };




  return (
    <>
      {/* <div className="sb2-2-2">
          <ul >
            <li>
              <NavLink style={{display:"flex",flexDirection:"row"}}
                to="/home"
    
              >
                <LayoutDashboard size={20} style={{ marginRight: '8px' }} />
               
                Dashboard
              </NavLink>
            </li>
    
          </ul>
        </div> */}
      {/* <div className="max-h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-y-auto"> */}
      {/* <div className='sb2-2-3'> 
       <div className="row">
        <div className="col-md-12">
         <div className="box-inn-sp"> */}

      <div  className="flex flex-col bg-white"
  style={{
    height: "100%",
    minHeight: 0,
    overflow: "hidden",
  }}>
        {/* Header */}



        {/* <div className="inn-title flex flex-col sm:flex-row justify-between ">
          <div>
            {/* <h4 className="text-2xl font-bold mb-2">All Transactions</h4> */}
            {/* <p className="text-gray-500 mb-6">Sales & Purchase Analytics</p> 
          </div>
     

        </div> */}

        {/* <div className="tab-inn"> */}
        <div className="tab-inn">
    
        



            {/* <div className="sb2-2-3">
        <div className="row">
          <div className="col-md-12"> */}

            <div className="flex flex-col bg-white">


              {/* Header with month and nav */}
              <div className="inn-title ">
                <div className="flex flex-col sm:flex-row items-center justify-between 
             mx-auto px-4 gap-3">
                <div>

                
                  <h4 className="text-2xl font-bold mb-2">All Transactions</h4>
                  <p style={{color:"black"}}>
                    {currentDate.toLocaleString("default", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  </div>

                  <div className="flex gap-2 sm:gap-4">
                    <button style={{ outline: "none" }}
                      onClick={() => navigateMonth(-1)}
                      className="px-3 py-1 bg-gray-200 hover:bg-gray-300 
                  focus:outline-none rounded text-sm sm:text-base"
                    >
                      ← Previous
                    </button>
                    {/* <button style={{ backgroundColor: "#4CA1AF" }}
                      onClick={() => setShowRangeModal(true)}
                      className="px-4 py-2 bg-blue-600  text-white rounded-lg transition text-sm sm:text-base  flex items-center gap-2"
                    >
                      <Filter className="w-4 h-4" />
                      Date Range Report
                    </button> */}
                    <button style={{ outline: "none" }}
                      onClick={() => navigateMonth(1)}
                      className="px-3 py-1 bg-gray-200
                   rounded text-sm sm:text-base"
                    >
                      Next →
                    </button>
                  </div>

                </div>
              </div>


              {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-4 ">
                <StatCard
                  title="Total Sales"
                  value={totalSalesPurchasesReceivablesPayablesProfit?.total_sales || 0}
                  icon={TrendingUp}
                  trend="up"
                  trendValue="+12.5%"
                  color="bg-blue-600"
                />
                <StatCard
                  title="Total Purchases"
                  value={totalSalesPurchasesReceivablesPayablesProfit?.total_purchases || 0}
                  icon={ShoppingCart}
                  trend="up"
                  trendValue="+12.5%"
                  color="bg-purple-600"
                />
                <StatCard
                  title="Receivables"
                  value={totalSalesPurchasesReceivablesPayablesProfit?.total_receivables || 0}
                  icon={AlertCircle}
                  color="bg-orange-600"
                />
                <StatCard
                  title="Payables"
                  value={totalSalesPurchasesReceivablesPayablesProfit?.total_payables || 0}
                  icon={DollarSign}
                  color="bg-red-600"
                />
                <StatCard
                  title="Profit"
                  value={totalSalesPurchasesReceivablesPayablesProfit?.profit || 0}
                  icon={profitMargin > 0 ? TrendingUp : TrendingDown}
                  trend={profitMargin > 0 ? 'up' : 'down'}
                  trendValue={profitMargin + '%'}
                  color={profitMargin > 0 ? "bg-green-600" : "bg-red-600"}
                />
              </div> */}

              {/* Calendar grid */}
              <div className="tab-inn">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="lg:col-span-2">
                    <div className="grid grid-cols-7 gap-1 mb-4 text-xs sm:text-sm">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                        (day) => (
                          <div
                            key={day}
                            className="text-center font-medium text-gray-600 py-2"
                          >
                            {day}
                          </div>
                        )
                      )}
                      {renderCalendar()}
                    </div>
                  </div>

                  {/* Selected Leads */}
                  <div className="lg:col-span-1">
                    {/* <div className="bg-gray-50 rounded-lg p-4 h-full">
                  {renderSelectedLeads()}
                </div> */}
                  </div>
                </div>
              </div>

            </div>
            {showRangeModal && (
              // <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center
              //  justify-center z-50 p-4">
              <div
                style={{
                  width: "100%",
                  position: "fixed",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(0,0,0,0.4)", // dim background
                  backdropFilter: "blur(4px)", // blur effect
                  zIndex: 50,
                  padding: "1rem", // ensures spacing on small screens
                }}
              >
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Select Date Range</h3>
                    <button
                      onClick={() => setShowRangeModal(false)}
                      className="text-gray-400 hover:text-gray-600 transition"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={dateRange.startDate}
                        onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                        className="w-full outline-none border-b-2 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={dateRange.endDate}
                        onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                        min={dateRange.startDate}
                        className="w-full outline-none border-b-2 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Report Type
                      </label>

                      <select
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)} // ✅ CORRECT
                        className="w-full outline-none border-b-2 text-gray-900"
                      >
                        <option value="">Full Report (Sales + Purchases)</option>
                        <option value="sales">Sales Report</option>
                        <option value="purchases">Purchases Report</option>
                      </select>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button
                        style={{ backgroundColor: "lightgray" }}
                        onClick={() => setShowRangeModal(false)}
                        className="flex-1 px-4 py-2 
                   text-gray-800 rounded-lg  font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDateRangeSubmit}
                        style={{ backgroundColor: "#4CA1AF" }}
                        className="flex-1 px-4 py-2 
                  text-white rounded-lg  font-medium"
                      >
                        Generate Report
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}






          



        </div>
      </div>

    </>
  );
}