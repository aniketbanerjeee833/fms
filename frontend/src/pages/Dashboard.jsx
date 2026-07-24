import  { useState } from 'react';

import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, 
  Users, Package, AlertCircle, FileText, LayoutDashboard, CalendarDays, 
  Icon,
  IndianRupee} from 'lucide-react';
//import { NavLink } from 'react-router-dom';
import { 
  useGetTotalPayablesLeftQuery,
   useGetTotalReceivablesLeftQuery,
   useGetTotalSalesPurchasesReceivablesPayablesProfitQuery } from '../redux/api/dashboardApi';
import { toast } from 'react-toastify';



import {  useGetTotalSalesEachDayQuery } from "../redux/api/saleApi";
import { useGetTotalPurchasesEachDayQuery } from "../redux/api/purchaseApi";
import {  Filter, X } from 'lucide-react';
import { NavLink,  } from 'react-router-dom';




export default function Dashboard() {
  // const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
  // 🎨 Generate consistent color for each partyId
//const partyColorMap = new Map();


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

// 🌈 Generate a new color if we run out of base colors
// const generateDynamicColor = (index) => {
//   const hue = (index * 137.5) % 360; // golden angle → well-distributed hues
//   return `hsl(${hue}, 70%, 55%)`;
// };

//  const generateColor = (partyId, index = 0) => {
//   if (partyColorMap.has(partyId)) {
//     return partyColorMap.get(partyId);
//   }

//   // Pick from base palette first, then generate dynamically
//   const color =
//     BASE_COLORS[index % BASE_COLORS.length] ||
//     generateDynamicColor(index);

//   partyColorMap.set(partyId, color);
//   return color;
// };
// const generateCategoryColor = (str) => {
//   let hash = 0;
//   for (let i = 0; i < str.length; i++) {
//     hash = str.charCodeAt(i) + ((hash << 5) - hash);
//   }
//   const hue = Math.abs(hash % 360); // ensures it's within 0–360
//   return `hsl(${hue}, 70%, 55%)`; // vivid, medium-light colors
// };
       
// const formatDateDDMMYYYY = (dateStr) => {
//   if (!dateStr) return "";
//   const [y, m, d] = dateStr.split("-");
//   return `${d}-${m}-${y}`;
// };
//  const today = new Date().toLocaleDateString("en-CA");
//const currentYear=new Date().getFullYear();
//const currentMonth=new Date().toLocaleString('default', { month: 'long' });

  // const[selectedYear, setSelectedYear] = useState("2025");
  // const[selectedMonth, setSelectedMonth] = useState("October");
  // const[selectedYear, setSelectedYear] = useState(currentYear);
  // const[selectedMonth, setSelectedMonth] = useState(currentMonth);
  //const[selectedYearForCategory, setSelectedYearForCategory] = useState(currentYear);
  //const[selectedYearForPartyPurchases, setSelectedYearForPartyPurchases] = useState(currentYear);
  //const[selectedMonthForPartyPurchases, setSelectedMonthForPartyPurchases] = useState(currentMonth);

// const months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
// const year="2025"

// const {data: salesPurchasesProfitData} =
//    useGetAllSalesAndPurchasesYearWiseQuery({year:selectedYear})
  //Calculate metrics
  
// const {data: categoryWiseItemCount}
// =useGetCategoriesWiseItemCountQuery({month:selectedMonth,year:selectedYearForCategory});




    // const profitMargin=totalSalesPurchasesReceivablesPayablesProfit?.profit
    //    const{data: partyWiseSalesAndPurchases} =
    //    useGetPartyWiseSalesAndPurchasesQuery({month:selectedMonthForPartyPurchases,year:selectedYearForPartyPurchases});
      
     
//const navigate = useNavigate();
const { data: salesData } = useGetTotalSalesEachDayQuery();
const[reportType, setReportType] = useState('');
// const { data: newSalesData } = useGetTotalNewSalesEachDayQuery();
const { data: purchasesData } = useGetTotalPurchasesEachDayQuery();
  const [showRangeModal, setShowRangeModal] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
const totalSalesByDate = salesData?.data || [];
// const totalNewSalesByDate = newSalesData?.data || [];
const totalPurchasesByDate = purchasesData?.data || [];

console.log(
  totalSalesByDate,
  
  totalPurchasesByDate,
);
//    useEffect(() => {
//      if (isLoading) return;
 
//      if (isError || !data?.user?.id) {
//        dispatch(setLoggedIn(false));
//        return;
//      }
//      dispatch(setUserId(data.user.id));
//      dispatch(setLoggedIn(true));
//    }, [data, isLoading, isError, dispatch]);
     const today = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
     console.log(today);
   const [currentDate, setCurrentDate] = useState(new Date());
   const [selectedDate, setSelectedDate] = useState(today);
   const selectedYear = currentDate.getFullYear();
const selectedMonth = currentDate.getMonth() + 1; // JS month is 0-based
console.log("selectedMonth",selectedMonth,selectedYear);
   const {data:totalSalesPurchasesReceivablesPayablesProfit}=
useGetTotalSalesPurchasesReceivablesPayablesProfitQuery({month:selectedMonth,year:selectedYear});
  // Item-wise analysis
  console.log(totalSalesPurchasesReceivablesPayablesProfit,"totalSalesPurchasesReceivablesPayablesProfit");
  console.log("salesPurchasesProfitData",totalSalesPurchasesReceivablesPayablesProfit);
  //const itemAnalysis = {};
    const profitMargin = ((totalSalesPurchasesReceivablesPayablesProfit?.profit /
       totalSalesPurchasesReceivablesPayablesProfit?.sales) * 100).toFixed(1);

 const {data:totalPayablesLeftData}=useGetTotalPayablesLeftQuery();
 const{data: totalReceivablesLeftData}=useGetTotalReceivablesLeftQuery();

 const totalPayablesLeft=totalPayablesLeftData?.total_payables_left;
 const totalReceivablesLeft=totalReceivablesLeftData?.total_receivables_left;
 const partiesLeftInPayables=totalPayablesLeftData?.total_parties;
 const partiesLeftInReceivables=totalReceivablesLeftData?.total_parties;
console.log("totalPayablesLeft",totalPayablesLeft);
console.log("totalReceivablesLeft",totalReceivablesLeft);
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
    window.open(`/day-wise-report/${dateStr}`,"_blank");
     // Remove the manual fetchLeadsByDate call - let the query handle it
   };
 
   const navigateMonth = (direction) => {
     const newDate = new Date(currentDate);
     newDate.setMonth(newDate.getMonth() + direction);
   
         // dispatch(clearSelectedLeads()); // Clear leads when navigating months
     setCurrentDate(newDate);
     setSelectedDate(today);
     // setSelectedLeads([]);
  
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
  const today = new Date().getDate();

  // Convert API data → lookup maps
  const salesEachDay = totalSalesByDate?.reduce((acc, item) => {
    acc[item.date] = item.total_sales;
    return acc;
  }, {}) || {};


  const purchasesEachDay = totalPurchasesByDate?.reduce((acc, item) => {
    acc[item.date] = item.total_purchases;
    return acc;
  }, {}) || {};

  const days = [];

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`e-${i}`} className="h-24 bg-gray-50 border"></div>);
  }

  // Days with sales/purchase/new sale data
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = formatDate(year, month, d);

    const isToday =
      d === today &&
      month === new Date().getMonth() &&
      year === new Date().getFullYear();

    const isSelected = selectedDate === dateStr;

    const totalSales = salesEachDay[dateStr] || 0;
    const totalPurchases = purchasesEachDay[dateStr] || 0;
    // const totalNewSales = newSalesEachDay[dateStr] || 0;

    days.push(
    
    <div
  key={d}
  onClick={() => handleDateClick(d)}
  className={`
    h-24 border p-1 cursor-pointer relative rounded-md transition
    ${isSelected ? "bg-blue-100 border-blue-400" :
    isToday ? "bg-green-100 border-green-400" :
    "bg-white hover:bg-gray-50"}
  `}
>
  {/* Day number */}
  <div className="text-sm font-semibold text-gray-700">{d}</div>

  {/* BOTTOM STACKED SECTION */}
  <div className="absolute bottom-1 right-1 flex flex-col space-y-[2px]">

    {/* Total Sales */}
    {totalSales > 0 && (
      <span className="text-[12px] text-green-700 font-medium">
        Sales: {totalSales}
      </span>
    )}

    {/* Total Purchases */}
    {totalPurchases > 0 && (
      <span className="text-[12px] text-red-700 font-medium">
        Purchases: {totalPurchases}
      </span>
    )}

    {/* Total New Sales */}
    {/* {totalNewSales > 0 && (
      <span className="text-[12px] text-purple-700 font-medium">
        New Sales: {totalNewSales}
      </span>
    )} */}

  </div>
</div>

    
    );
  }

  return days;
};

 





//   console.log(salesPurchasesProfitData?.data,categoryWiseItemCount);
//  console.log(partyWiseSalesAndPurchases,"partyWiseSalesAndPurchases",
//   partyWiseSalesAndPurchases?.data,profitMargin);
 

  
const StatCard = ({ title, value, icon: Icon, color }) => {
  // ✅ Determine the route dynamically
  //const lowerTitle = title.toLowerCase();
  //let route = "";
  // if (lowerTitle.includes("sale")) route = "/sale/all-sales";
  // else if (lowerTitle.includes("purchase")) route = "/purchase/all-purchases";

  return (
    <div
      className="flex flex-col justify-between bg-white rounded-xl shadow-sm 
                 border border-gray-100 hover:shadow-md transition-all 
                 p-4 w-full min-w-[180px] h-[120px]"
    >
      {/* 🔹 Icon + Title */}
      <div className="flex items-center mb-1">
        <div className="flex gap-2 items-center">
          <div className={`p-2 rounded-full ${color}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <p style={{color:"black"}} className="text-sm text-gray-600 font-medium truncate mt-2 ">{title}</p>
        </div>
      </div>

      {/* 💰 Value */}
      <h4 className="text-2xl font-bold text-gray-900 mt-2">
        ₹{value?.toLocaleString() || 0}
      </h4>

      {/* 🔗 “View all …” link — only this is clickable */}
      {/* {title.split(/\s+/).length > 1 && (
        <NavLink
          to={route}
          className="text-xs text-gray-500 hover:text-[#4CA1AF] mt-2 transition-colors self-start"
        >
          View all {title.split(/\s+/)[1]}
        </NavLink>
      )} */}
    </div>
  );
};




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
  
           <div className="flex flex-col bg-white">
      {/* Header */}

      
        
          <div className="inn-title flex flex-col sm:flex-row justify-between ">
           <div>
           <h4 className="text-2xl font-bold mb-2">Dashboard</h4>
              <p className="text-gray-500 mb-6">Sales & Purchase Analytics</p>
            </div>
         <div className="flex flex-col gap-2 sm:flex-row ">
   <NavLink
   to={`/party/receivables`}

  className="flex flex-col justify-between bg-white rounded-xl shadow-sm 
             border border-gray-100 hover:shadow-md transition-all 
             px-4 py-2 w-full min-w-[180px] h-[120px] cursor-pointer"
            
>
  {/* 🔹 Icon + Title */}
  <div className="flex items-center mb-1">
    <div className="flex gap-2 items-center">
      <div className="p-2 rounded-full bg-green-100">
        <IndianRupee className="w-5 h-5 text-green-600" />
      </div>

      <p
        style={{ color: "black" }}
        className="text-sm text-gray-600 font-medium truncate mt-2"
      >
        Total Receivables
      </p>
    </div>
  </div>

  {/* 💰 Value */}
  <h4 className="text-2xl font-bold text-gray-900 mt-2">
    ₹{totalReceivablesLeft ?? 0}
  </h4>

  <div className="flex items-center gap-2">
    <span className="text-sm text-gray-600">Total Parties</span>

    <h4 style={{paddingBottom:"0px"}}
    className="text-lg font-bold text-gray-900">
      {partiesLeftInReceivables}
    </h4>
  </div>
</NavLink>

{/* ================= PAYABLE CARD ================= */}

<NavLink to={`/party/payables`}
  className="flex flex-col justify-between bg-white rounded-xl shadow-sm 
             border border-gray-100 hover:shadow-md transition-all 
             px-4 py-2 w-full min-w-[180px] h-[120px] cursor-pointer"
             
>
  {/* 🔹 Icon + Title */}
  <div className="flex items-center mb-1">
    <div className="flex gap-2 items-center">
      <div 
      className="p-2 rounded-full bg-red-600">
        <AlertCircle className="w-5 h-5 text-white" />
      </div>

      <p
        style={{ color: "black" }}
        className="text-sm text-gray-600 font-medium truncate mt-2"
      >
        Total Payables
      </p>
    </div>
  </div>

  {/* 💰 Value */}
  <h4 className="text-2xl font-bold text-gray-900 mt-2">
    ₹{totalPayablesLeft ?? 0}
  </h4>

  <div className="flex items-center gap-2">
    <span className="text-sm text-gray-600">Total Parties</span>

    <h4 style={{paddingBottom:"0px"}}
     className="text-lg font-bold text-gray-900">
      {partiesLeftInPayables}
    </h4>
  </div>
</NavLink>
         </div>
       
        </div>
     
{/* <div className="tab-inn"> */}
      <div className="tab-inn">
                    {/* <div className="flex justify-end items-center p-2 gap-2">
                  <span className="border-b border-black">
                       {formatDateDDMMYYYY(selectedDate)}
                  </span>
    <div className="relative">
      {/* Hidden Date Input 
      <input
        type="date"
        id="dashboard-date"
        className="absolute inset-0 opacity-0 "
        onChange={(e) => {
       setSelectedDate(e.target.value);
          // 👉 call API / set state here
        }}
      />

      {/* Calendar Icon 
      <button
        type="button"
        className="flex items-center justify-center
                   w-10 h-10 rounded-full
                   border border-gray-300
                   hover:bg-gray-100"
      >
        <CalendarDays className="w-5 h-5 text-gray-600 cursor-pointer" />
      </button>
    </div>
  </div> */}
          {/* <div className='flex justify-end'>
                 <select 
        style={{width:"100px"}}
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1 mb-1 text-gray-700 cursor-pointer
           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        >
          <option value="2023">2023</option>
          <option value="2024">2024</option>
          <option value="2025">2025</option>
          <option value="2026">2026</option>
        </select>
          </div> */}
        {/* Stats Grid */}
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
            value={totalSalesPurchasesReceivablesPayablesProfit?.total_purchases|| 0}
            icon={ShoppingCart}
                 trend="up"
            trendValue="+12.5%"
            color="bg-purple-600"
          />
          <StatCard
            title="Receivables"
            value={totalSalesPurchasesReceivablesPayablesProfit?.total_receivables|| 0}
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
            
       {/* <div style={{"border-bottom":"1px solid #e8edf2"}}
        ></div> */}
          <>

  

 {/* <div className="sb2-2-3">
        <div className="row">
          <div className="col-md-12"> */}

 <div className="flex flex-col bg-white">
        
            
            {/* Header with month and nav */}
             <div className="inn-title ">
            <div className="flex flex-col sm:flex-row items-center justify-between 
            mb-2 mx-auto px-4 gap-3">
              <h4 >
                {currentDate.toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                })}
              </h4>

              <div className="flex gap-2 sm:gap-4">
                <button style={{ outline: "none" }}
                  onClick={() => navigateMonth(-1)}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 
                  focus:outline-none rounded text-sm sm:text-base"
                >
                  ← Previous
                </button>
                      <button  style={{ backgroundColor: "#4CA1AF" }}
                onClick={() => setShowRangeModal(true)}
                className="px-4 py-2 bg-blue-600  text-white rounded-lg transition text-sm sm:text-base  flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Date Range Report
              </button>
                <button  style={{ outline: "none" }}
                  onClick={() => navigateMonth(1)}
                  className="px-3 py-1 bg-gray-200
                   rounded text-sm sm:text-base"
                >
                  Next →
                </button>
              </div>

            </div>
            </div>

            
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-4 ">
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
            value={totalSalesPurchasesReceivablesPayablesProfit?.total_purchases|| 0}
            icon={ShoppingCart}
                 trend="up"
            trendValue="+12.5%"
            color="bg-purple-600"
          />
          <StatCard
            title="Receivables"
            value={totalSalesPurchasesReceivablesPayablesProfit?.total_receivables|| 0}
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
        </div>

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





            
          </>
       

       
      </div>
      </div>
     
    </>
  );
}