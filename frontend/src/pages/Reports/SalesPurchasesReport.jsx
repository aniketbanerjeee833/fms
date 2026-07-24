

// export default function Reports() {
// //  const { data: user} = useGetUserByIdQuery()
// //    const {  userId } = useSelector((state) => state.user);
// //    const{selectedLeads,page}=useSelector((state) => state.lead);
// //    const dispatch = useDispatch();
// //    const { data, isLoading, isError } = useGetUserByIdQuery()
//  //const navigate=useNavigate()
// const { data: salesData } = useGetTotalSalesEachDayQuery();
// const[reportType, setReportType] = useState('');
// // const { data: newSalesData } = useGetTotalNewSalesEachDayQuery();
// const { data: purchasesData } = useGetTotalPurchasesEachDayQuery();
//   const [showRangeModal, setShowRangeModal] = useState(false);
//   const [dateRange, setDateRange] = useState({
//     startDate: '',
//     endDate: ''
//   });
// const totalSalesByDate = salesData?.data || [];
// // const totalNewSalesByDate = newSalesData?.data || [];
// const totalPurchasesByDate = purchasesData?.data || [];


// console.log(
//   totalSalesByDate,
  
//   totalPurchasesByDate,
// );
// //    useEffect(() => {
// //      if (isLoading) return;
 
// //      if (isError || !data?.user?.id) {
// //        dispatch(setLoggedIn(false));
// //        return;
// //      }
// //      dispatch(setUserId(data.user.id));
// //      dispatch(setLoggedIn(true));
// //    }, [data, isLoading, isError, dispatch]);
//      const today = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
//      console.log(today);
//    const [currentDate, setCurrentDate] = useState(new Date());
//    const [selectedDate, setSelectedDate] = useState(today);
   
//    // const [selectedLeads, setSelectedLeads] = useState([]);
   
 
 
 
//    // Only call the query when selectedDate exists
// //    const { data: leadsForToday, error: leadsForTodayError, isLoading: leadsLoading } = 
// //    useGetLeadsByFollowUpDateQuery({
// //      date: selectedDate,
// //      userId,page
// //    }, {
// //      skip:  !userId // Skip query if no date selected or no userId
// //    });
 
// //    const { data: leadsCountData, isLoading: leadsCountLoading } = useGetLeadCountEachDayQuery(userId);
 
// //    console.log(currentDate,leadsForToday,leadsCountData);
// //    // Handle leads data when it changes
// //    useEffect(() => {
// //      if (!selectedDate) {
// //        dispatch(clearSelectedLeads()); // Clear leads if no date is selected
// //        return;
// //      }
 
// //      if (leadsLoading) {
// //        return; // Keep current state while loading
// //      }
 
// //      if (leadsForToday && Array.isArray(leadsForToday?.results)) {
// //        console.log("Leads for today:", leadsForToday);
      
// //        dispatch(setSelectedLeads(leadsForToday?.results));
// //      } else if (leadsForToday?.message || leadsForTodayError) {
      
      
// //        dispatch(clearSelectedLeads()); // Clear leads when no leads found or error setSelectedLeads([]);
// //      }
// //    }, [leadsForToday, leadsForTodayError, leadsLoading, selectedDate]);
 
//    const getDaysInMonth = (year, month) => {
//      return new Date(year, month + 1, 0).getDate();
//    };
 
//    const getFirstDayOfMonth = (year, month) => {
//      return new Date(year, month, 1).getDay();
//    };
 
//    const formatDate = (year, month, day) => {
//      return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
//    };
 
//    const handleDateClick = (day) => {
//      const year = currentDate.getFullYear();
//      const month = currentDate.getMonth();
//      const dateStr = formatDate(year, month, day);
     
//      console.log("Selected date:", dateStr);
     
//    // Clear leads immediately when a new date is selected
//      // dispatch(clearSelectedLeads());
//      setSelectedDate(dateStr);
//      //navigate(`/day-wise-report/${dateStr}`);
//     window.open(`/day-wise-report/${dateStr}`,"_blank");
//      // Remove the manual fetchLeadsByDate call - let the query handle it
//    };
 
//    const navigateMonth = (direction) => {
//      const newDate = new Date(currentDate);
//      newDate.setMonth(newDate.getMonth() + direction);
//          // dispatch(clearSelectedLeads()); // Clear leads when navigating months
//      setCurrentDate(newDate);
//      setSelectedDate(today);
//      // setSelectedLeads([]);
  
//    };
//    const handleDateRangeSubmit = () => {
//   if (dateRange.startDate && dateRange.endDate) {
//     if (new Date(dateRange.endDate) < new Date(dateRange.startDate)) {
//       alert("End date must be after start date");
//       return;
//     }

//     let url = `/date-range-report/${dateRange.startDate}/${dateRange.endDate}`;

//     // ✅ append only if passed
//     if (reportType) {
//       url += `?reportType=${reportType}`;
//     }
//     console.log(reportType)
// console.log(url);
//     window.open(url, "_blank");

//     setShowRangeModal(false);
//     setDateRange({ startDate: "", endDate: "" });
//     setReportType("");
//   } else {
//     toast.error("Please select both start and end dates");
//   }
// };
//   //   const handleDateRangeSubmit = () => {
//   //   if (dateRange.startDate && dateRange.endDate) {
//   //     // Validate that end date is after start date
//   //     if (new Date(dateRange.endDate) < new Date(dateRange.startDate)) {
//   //       alert('End date must be after start date');
//   //       return;
//   //     }
//   //      //window.open(`/accounts/date-range-report/${dateRange.startDate}/${dateRange.endDate}`, "_blank");

//   //     // Open report in new tab with date range
//   //     window.open(`/date-range-report/${dateRange.startDate}/${dateRange.endDate}`, "_blank");

//   //     //window.open(`/date-range-report?fromDate=${dateRange.startDate}&toDate=${dateRange.endDate}`, '_blank');
//   //     //window.open(`/date-range-report/${dateRange.startDate}/${dateRange.endDate}`, '_blank');
//   //     setShowRangeModal(false);
      
//   //     // Reset the form
//   //     setDateRange({ startDate: '', endDate: '' });
//   //   } else {
//   //    toast.error('Please select both start and end dates');
//   //   }
//   // };
//  const renderCalendar = () => {
//   const year = currentDate.getFullYear();
//   const month = currentDate.getMonth();
//   const daysInMonth = getDaysInMonth(year, month);
//   const firstDay = getFirstDayOfMonth(year, month);
//   const today = new Date().getDate();

//   // Convert API data → lookup maps
//   const salesEachDay = totalSalesByDate?.reduce((acc, item) => {
//     acc[item.date] = item.total_sales;
//     return acc;
//   }, {}) || {};


//   const purchasesEachDay = totalPurchasesByDate?.reduce((acc, item) => {
//     acc[item.date] = item.total_purchases;
//     return acc;
//   }, {}) || {};

//   const days = [];

//   // Empty cells before first day
//   for (let i = 0; i < firstDay; i++) {
//     days.push(<div key={`e-${i}`} className="h-24 bg-gray-50 border"></div>);
//   }

//   // Days with sales/purchase/new sale data
//   for (let d = 1; d <= daysInMonth; d++) {
//     const dateStr = formatDate(year, month, d);

//     const isToday =
//       d === today &&
//       month === new Date().getMonth() &&
//       year === new Date().getFullYear();

//     const isSelected = selectedDate === dateStr;

//     const totalSales = salesEachDay[dateStr] || 0;
//     const totalPurchases = purchasesEachDay[dateStr] || 0;
//     // const totalNewSales = newSalesEachDay[dateStr] || 0;

//     days.push(
    
//     <div
//   key={d}
//   onClick={() => handleDateClick(d)}
//   className={`
//     h-24 border p-1 cursor-pointer relative rounded-md transition
//     ${isSelected ? "bg-blue-100 border-blue-400" :
//     isToday ? "bg-green-100 border-green-400" :
//     "bg-white hover:bg-gray-50"}
//   `}
// >
//   {/* Day number */}
//   <div className="text-sm font-semibold text-gray-700">{d}</div>

//   {/* BOTTOM STACKED SECTION */}
//   <div className="absolute bottom-1 right-1 flex flex-col space-y-[2px]">

//     {/* Total Sales */}
//     {totalSales > 0 && (
//       <span className="text-[12px] text-green-700 font-medium">
//         Sales: {totalSales}
//       </span>
//     )}

//     {/* Total Purchases */}
//     {totalPurchases > 0 && (
//       <span className="text-[12px] text-red-700 font-medium">
//         Purchases: {totalPurchases}
//       </span>
//     )}

//     {/* Total New Sales */}
//     {/* {totalNewSales > 0 && (
//       <span className="text-[12px] text-purple-700 font-medium">
//         New Sales: {totalNewSales}
//       </span>
//     )} */}

//   </div>
// </div>

    
//     );
//   }

//   return days;
// };

 

 
//    return (
//   <>
//     {/* Sidebar */}
//     {/* <div className="sb2-1 ">
//       <SideMenu />
//     </div> */}

//     {/* Main content */}
   
//       {/* Breadcrumb / Nav */}
//       <div className="sb2-2-2">
//         <ul className="flex flex-wrap gap-2">
//           <li>
//             <NavLink to={"/home"}>
//               <i className="fa fa-home" aria-hidden="true"></i> Home
//             </NavLink>
//           </li>
//         </ul>
//       </div>

//       {/* Calendar & Leads */}
//       <div className="sb2-2-3">
//         <div className="row">
//           <div className="col-md-12">
//             <div className="box-inn-sp">
//             {/* Header with month and nav */}
//              <div className="inn-title ">
//             <div className="flex flex-col sm:flex-row items-center justify-between mb-4 mt-4 mx-auto px-4 gap-3">
//               <h4 >
//                 {currentDate.toLocaleString("default", {
//                   month: "long",
//                   year: "numeric",
//                 })}
//               </h4>

//               <div className="flex gap-2 sm:gap-4">
//                 <button style={{ outline: "none" }}
//                   onClick={() => navigateMonth(-1)}
//                   className="px-3 py-1 bg-gray-200 hover:bg-gray-300 
//                   focus:outline-none rounded text-sm sm:text-base"
//                 >
//                   ← Previous
//                 </button>
//                       <button  style={{ backgroundColor: "#4CA1AF" }}
//                 onClick={() => setShowRangeModal(true)}
//                 className="px-4 py-2 bg-blue-600  text-white rounded-lg transition text-sm sm:text-base  flex items-center gap-2"
//               >
//                 <Filter className="w-4 h-4" />
//                 Date Range Report
//               </button>
//                 <button  style={{ outline: "none" }}
//                   onClick={() => navigateMonth(1)}
//                   className="px-3 py-1 bg-gray-200
//                    rounded text-sm sm:text-base"
//                 >
//                   Next →
//                 </button>
//               </div>
//             </div>
//             </div>

//             {/* Calendar grid */}
//             <div className="tab-inn">
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//               <div className="lg:col-span-2">
//                 <div className="grid grid-cols-7 gap-1 mb-4 text-xs sm:text-sm">
//                   {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
//                     (day) => (
//                       <div
//                         key={day}
//                         className="text-center font-medium text-gray-600 py-2"
//                       >
//                         {day}
//                       </div>
//                     )
//                   )}
//                   {renderCalendar()}
//                 </div>
//               </div>

//               {/* Selected Leads */}
//               <div className="lg:col-span-1">
//                 {/* <div className="bg-gray-50 rounded-lg p-4 h-full">
//                   {renderSelectedLeads()}
//                 </div> */}
//               </div>
//             </div>
//             </div>
//           </div>
//           </div>
//         </div>
//       </div>
// {showRangeModal && (
//         // <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center
//         //  justify-center z-50 p-4">
//         <div
//   style={{
//     width: "100%",
//     position: "fixed",
//     inset: 0,
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "rgba(0,0,0,0.4)", // dim background
//     backdropFilter: "blur(4px)", // blur effect
//     zIndex: 50,
//     padding: "1rem", // ensures spacing on small screens
//   }}
// >
//           <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="text-xl font-bold text-gray-800">Select Date Range</h3>
//               <button
//                 onClick={() => setShowRangeModal(false)}
//                 className="text-gray-400 hover:text-gray-600 transition"
//               >
//                 <X className="w-6 h-6" />
//               </button>
//             </div>

//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Start Date
//                 </label>
//                 <input
//                   type="date"
//                   value={dateRange.startDate}
//                   onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
//                   className="w-full outline-none border-b-2 text-gray-900"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   End Date
//                 </label>
//                 <input
//                   type="date"
//                   value={dateRange.endDate}
//                   onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
//                   min={dateRange.startDate}
//                   className="w-full outline-none border-b-2 text-gray-900"
//                 />
//               </div>
//               <div>
//   <label className="block text-sm font-medium text-gray-700 mb-2">
//     Report Type
//   </label>

//  <select
//   value={reportType}
//   onChange={(e) => setReportType(e.target.value)} // ✅ CORRECT
//   className="w-full outline-none border-b-2 text-gray-900"
// >
//   <option value="">Full Report (Sales + Purchases)</option>
//   <option value="sales">Sales Report</option>
//   <option value="purchases">Purchases Report</option>
// </select>
// </div>

//               <div className="flex gap-3 mt-6">
//                 <button
//                  style={{ backgroundColor: "lightgray" }}
//                   onClick={() => setShowRangeModal(false)}
//                   className="flex-1 px-4 py-2 
//                    text-gray-800 rounded-lg  font-medium"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleDateRangeSubmit}
//                   style={{ backgroundColor: "#4CA1AF" }}
//                   className="flex-1 px-4 py-2 
//                   text-white rounded-lg  font-medium"
//                 >
//                   Generate Report
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
    
//   </>
// );

// }
import { useState } from "react";
import { useMemo } from "react";
import {
    
    useGetPartyWiseSalesAndPurchasesOverallQuery,
    useGetSalesAndPurchasesDailyYearMonthWiseQuery, 
    useGetSalesAndPurchasesMonthWiseQuery, 
    useGetSalesAndPurchasesWeeklyYearMonthWiseQuery, 
    useGetSalesAndPurchasesYearWiseQuery } from "../../redux/api/reportApi";

import {ResponsiveContainer, BarChart, Bar, Area,AreaChart,
   XAxis, YAxis, CartesianGrid, Tooltip, Legend,
   LabelList,
   Pie,PieChart,
   Cell} from 'recharts';


export default function SalesPurchasesReport() {
  const months = [
  { label: "January", value: "january" },
  { label: "February", value: "february" },
  { label: "March", value: "march" },
  { label: "April", value: "april" },
  { label: "May", value: "may" },
  { label: "June", value: "june" },
  { label: "July", value: "july" },
  { label: "August", value: "august" },
  { label: "September", value: "september" },
  { label: "October", value: "october" },
  { label: "November", value: "november" },
  { label: "December", value: "december" },
];

const years=[
  
  { label: "2025", value: "2025" },
  { label: "2026", value: "2026" },
  { label: "2027", value: "2027" },
  { label: "2028", value: "2028" },
  { label: "2029", value: "2029" },
  { label: "2030", value: "2030" },
]
const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];
const now = new Date();
const currentMonthName = MONTHS[now.getMonth()]; // 👈 0-based
const currentYear = String(now.getFullYear());
const [selectedMonth, setSelectedMonth] = useState(currentMonthName);
const[selectedYear, setSelectedYear] = useState(currentYear);

//const [selectedPartyMonth, setPartySelectedMonth] = useState(currentMonthName);
//const[selectedPartyYear, setSelectedPartyYear] = useState(currentYear);
  const [timeFrame, setTimeFrame] = useState("daily");
  //const[partyTimeFrame, setPartyTimeFrame] = useState("daily");
//   const { data: categories } = useGetAllCategoriesQuery()    
const partyColorMap = new Map();

const generateColor = (partyId, index = 0) => {
  if (partyColorMap.has(partyId)) {
    return partyColorMap.get(partyId);
  }

  const color = COLORS[index % COLORS.length];
  partyColorMap.set(partyId, color);
  return color;
};
// const year="2026"
// const month="january"
//useGetSalesAndPurchasesDailyYearMonthWiseQuery
const {
  data: dailyData,
  // isLoading: dailyLoading,
} = useGetSalesAndPurchasesDailyYearMonthWiseQuery(
  { year: selectedYear, month: selectedMonth },
  { skip: timeFrame !== "daily" }
);

//useGetSalesAndPurchasesWeeklyYearMonthWiseQuery
// ;
const {
  data: weeklyData,
  // isLoading: weeklyLoading,
} = useGetSalesAndPurchasesWeeklyYearMonthWiseQuery(
  { year: selectedYear, month: selectedMonth },
  { skip: timeFrame !== "weekly" }
);
//useGetSalesAndPurchasesMonthWiseQuery

// const {
//   data: monthlyData,
//   // isLoading: monthlyLoading,
// } = useGetTotalSalesDineInTakeawayMonthlyAnalysisQuery(
//   { year: selectedYear },
//   { skip: timeFrame !== "monthly" }
// );

const {
  data: monthlyData,
  // isLoading: monthlyLoading,
} = useGetSalesAndPurchasesMonthWiseQuery(
  { year: selectedYear },
  { skip: timeFrame !== "monthly" }
);



//useGetSalesAndPurchasesYearWiseQuery
const {
  data: yearlyData,
  // isLoading: yearlyLoading,
} = useGetSalesAndPurchasesYearWiseQuery(
  { year: selectedYear },
  { skip: timeFrame !== "yearly" }
);

//console.log(monthlyData,dailyData,weeklyData,yearlyData)

const {data:partyWiseSalesPurchasesOverall}=
useGetPartyWiseSalesAndPurchasesOverallQuery();

console.log(partyWiseSalesPurchasesOverall,"partyWiseSalesPurchasesOverall")
    //    const{data: partyWiseSalesAndPurchasesDailyYearMonth} =
    //    useGetpartyWiseSalesAndPurchasesDailyYearMonthQuery({month:selectedMonth,year:selectedYear});
//           const{data: partyWiseSalesAndPurchasesDailyYearMonth} =
// useGetPartyWiseSalesAndPurchasesDailyYearMonthWiseQuery({
//     month:selectedPartyMonth,year:selectedPartyYear},{ skip: partyTimeFrame !== "daily" });   
     //console.log(partyWiseSalesAndPurchasesDailyYearMonth)
     //const salesDataDailyYearMonthWise =partyWiseSalesPurchasesOverall?.data?.filter((d) => d.sales > 0) || [];

//const purchaseDataDailyYearMonthWise =partyWiseSalesPurchasesOverall?.data?.filter((d) => d.purchases > 0) || [];

  //console.log(salesDataDailyYearMonthWise,purchaseDataDailyYearMonthWise)
const chartData = useMemo(() => {
  switch (timeFrame) {
    case "daily":
      return dailyData?.data ?? [];

    case "weekly":
      return weeklyData?.data ?? [];

    case "monthly":
      return monthlyData?.data ?? [];

    case "yearly":
      return yearlyData?.data ?? [];

    default:
      return [];
  }
}, [timeFrame,  dailyData, weeklyData, monthlyData, yearlyData]);

// const{data:itemsSoldCategoryWiseData}=useGetItemsSoldDailyCategoryWiseAnalysisQuery({
//   year:selectedYear,
//   month:selectedMonth
// })
// const apiData = itemsSoldCategoryWiseData?.data ?? [];
// console.log(apiData)
// const categoryWiseData = apiData.map(d => {
//   const row = { day: d.day };

//   d.categories.forEach(c => {
//     row[c.category] = c.total_sales;
//   });

//   return row;
// });
//console.log("categoryWiseData:", categoryWiseData);
 const hasData = Array.isArray(chartData) && chartData.length > 0;

const COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan,
  "#f472b6", // pink
  "#fbbf24", // yellow
  "#22c55e", // emerald
  "#f87171", // rose
  "#a3e635", // lime
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
];
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const sales = Number(payload.find((p) => p.dataKey === "sales")?.value || 0);
    const purchases = Number(payload.find((p) => p.dataKey === "purchases")?.value || 0);

    const total = sales + purchases;

    const formatNumber = (num) =>
      Number(num).toLocaleString("en-IN", {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
      });

    return (
      <div
        style={{
          background: "#fff",
          border: "1px solid #ccc",
          padding: "10px",
          borderRadius: "6px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}
      >
        <p style={{ fontWeight: "bold", marginBottom: "5px" }}>{label}</p>

        <p style={{ color: "green" }}>
          Sales: ₹{formatNumber(sales)}
        </p>

        <p style={{ color: "red" }}>
          Purchases: ₹{formatNumber(purchases)}
        </p>

        <p style={{ fontWeight: "bold", marginTop: "6px" }}>
          Total: ₹{formatNumber(total)}
        </p>
      </div>
    );
  }

  return null;
};
const formatCurrency = (value) => {
  if (value >= 1e7) return `${(value / 1e7).toFixed(2)} Cr`;
  if (value >= 1e5) return `${(value / 1e5).toFixed(2)} L`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)} K`;
  return value;
};
const NoData = ({ text = "No data available" }) => (
  <div className="flex items-center justify-center h-[300px] text-black text-lg">
    {text}
  </div>
);


  return (
    <div className="min-h-screen bg-white  p-6">
      <div className="flex flex-col justify-center items-center mb-2 sm:flex-row
       sm:justify-between">
      <h1 className=" text-2xl sm:whitespace-nowrap sm:text-3xl sm:font-bold ">
        Sales And Purchase Analytics Dashboard</h1>
      
  <div className="flex justify-center items-center gap-2" >
       {  (timeFrame === "daily" || timeFrame === "weekly")  && (
        <div >
          <select
          id="monthSelect"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="
              border rounded-md px-3 py-2
              bg-white shadow-md
              w-60
              outline-none
              focus:ring-2 focus:ring-blue-500
            "
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      )}
      {(timeFrame=== "yearly" || timeFrame === "monthly" || timeFrame === "daily"
        || timeFrame === "weekly"
      ) && <div>
          <select
          id="yearSelect"
             value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="
              border rounded-md px-3 py-2
              bg-white shadow-md
              w-40
              outline-none
              focus:ring-2 focus:ring-blue-500
            "
          >
            {years.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          </div>}
        
      </div>
      </div>

<div className="relative grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
  {["daily", "weekly", "monthly", "yearly"].map((p) => (
    <div key={p} className="relative ">
      <button
      style={{border:"none",cursor:"pointer",backgroundColor:"#4CA1AF "}}
        onClick={() => setTimeFrame(p)}
        className={`px-4 py-2 rounded ${
          timeFrame === p ? "bg-[#4CA1AF] text-white" : "bg-white"
        }`}
      >
        {p.toUpperCase()}
      </button>

      {/* 🔽 Month dropdown directly under DAILY */}
   
    </div>
  ))}
</div>


      {/* Charts */}
        <div className="grid grid-cols-1 grid-rows-3 sm:grid-cols-1 sm:grid-rows-1 gap-4  mb-6">
        <div>
          
        <h4 className="text-xl font-bold  flex  justify-center items-center gap-2 mb-4">
            Sales And Purchases Analytics</h4>
      

{hasData ? (
  <>
    <ResponsiveContainer width="100%" height={350}>
      <BarChart
        data={chartData}
        margin={{ top: 40, right: 20, left: 10, bottom: 10 }}
      >
        <XAxis
          dataKey={
            timeFrame === "daily"
              ? "date"
              : timeFrame === "weekly"
              ? "week"
              : timeFrame === "monthly"
              ? "month"
              : "year"
          }
        />

        <YAxis
          tickFormatter={formatCurrency}
          domain={[0, (dataMax) => dataMax * 1.2]}
        />
        <Tooltip content={<CustomTooltip />} />
        {/* <Tooltip
          formatter={(value) => [`₹ ${formatCurrency(value)}`, "Total"]}
        /> */}

        <Bar dataKey="sales" fill="green" radius={[6, 6, 0, 0]}>
          <LabelList
            dataKey="sales"
            position="top"
            offset={10}
            style={{ fontSize: 12, fontWeight: 600 }}
            formatter={(value) => `₹${formatCurrency(value)}`}
          />
        </Bar>

        <Bar dataKey="purchases" fill="red" radius={[6, 6, 0, 0]}>
          <LabelList
            dataKey="purchases"
            position="top"
            offset={10}
            style={{ fontSize: 12, fontWeight: 600 }}
            formatter={(value) => `₹${formatCurrency(value)}`}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>

    {/* Summary / Legend */}
    <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginTop: "10px", fontWeight: 500 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span style={{ width: 12, height: 12, background: "green", display: "inline-block", borderRadius: 2 }}></span>
        Sales
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span style={{ width: 12, height: 12, background: "red", display: "inline-block", borderRadius: 2 }}></span>
        Purchases
      </div>
    </div>
  </>
) : (
  <NoData text="No sales and purchases data for selected period" />
)}

        </div>
     {/* <div className="bg-white mb-4 rounded-xl   p-4 sm:p-6 ">
    <div className='flex  justify-around justify-items-center'>
   <h4 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 mt-1 text-center">
     Party-wise Sales, Purchases Distribution
   </h4>
   
</div>

  {/* Responsive 1-3 column grid
  <div className="flex flex-col md:flex-col gap-4">
 

    {/* 🟦 SALES PIE
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
 <div className="flex flex-col items-center justify-center w-full">
  <h4 className="text-sm sm:text-base font-medium text-gray-700 mb-2 text-center">
    Sales Distribution
  </h4>

  {salesDataDailyYearMonthWise  && salesDataDailyYearMonthWise?.length > 0 ?<div className="w-full h-[220px] sm:h-[250px] md:h-[300px]">
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={salesDataDailyYearMonthWise}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius="80%"
          dataKey="sales"
          nameKey="partyName"
        >
          {/* {partyWiseSalesAndPurchasesDailyYearMonth?.data?.map((entry, index) => (
            <Cell
              key={`sales-${entry.partyId}`}
              fill={generateColor(entry.partyId, index)}// ✅ fixed dynamic colors
            />
          ))} 
           {salesDataDailyYearMonthWise.map((entry, index) => (
    <Cell
      key={`sales-${entry.partyId}`}
      fill={generateColor(entry.partyId, index)}
    />
  ))}
        </Pie>

        {/* <Tooltip
          formatter={(value) => `₹${value.toLocaleString()}`}
          labelFormatter={(label) => `Party: ${label}`}
        /> 
  <Tooltip
  wrapperStyle={{ pointerEvents: "none" }}
  formatter={(value) => `₹${Number(value || 0).toLocaleString("en-IN")}`}
/>
      </PieChart>
    </ResponsiveContainer>
  </div>:(

      <div className="flex items-center justify-center mx-auto
       w-full h-[250px] sm:h-[350px] md:h-[300px] ">
        No party wise sales data available for this month
      </div>
  )}
</div>

{/* 🟪 PURCHASE PIE 
<div className="flex flex-col items-center justify-center w-full">
  <h4 className="text-sm sm:text-base font-medium text-gray-700 mb-2 text-center">
    Purchases Distribution
  </h4>
  {purchaseDataDailyYearMonthWise && purchaseDataDailyYearMonthWise?.length > 0 ?<div className="w-full h-[220px] sm:h-[250px] md:h-[300px]">
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={purchaseDataDailyYearMonthWise}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius="80%"
          dataKey="purchases"
          nameKey="partyName"
        >
          {/* {partyWiseSalesAndPurchasesDailyYearMonth?.data?.map((entry, index) => (
            <Cell
              key={`purchase-${entry.partyId}`}
              fill={generateColor(entry.partyId, index)} // ✅ consistent color mapping
            />
          ))} 
           {purchaseDataDailyYearMonthWise.map((entry, index) => (
    <Cell
      key={`purchase-${entry.partyId}`}
      fill={generateColor(entry.partyId, index)}
    />
  ))}
        </Pie>
        {/* <Tooltip
          formatter={(value) => `₹${value.toLocaleString()}`}
          labelFormatter={(label) => `Party: ${label}`}
        /> 
<Tooltip
  wrapperStyle={{ pointerEvents: "none" }}
  formatter={(value) => `₹${Number(value || 0).toLocaleString("en-IN")}`}
/>
      </PieChart>
    </ResponsiveContainer>
  </div>:(
        <div className="flex items-center justify-center mx-auto
       w-full h-[250px] sm:h-[350px] md:h-[300px] ">
        No party wise sales data available for this month
      </div>
  )}
</div>
</div>
    </div>
     <div className="mt-6 flex flex-wrap justify-center gap-4 pb-2">
   {partyWiseSalesPurchasesOverall?.data?.map((party, index) => (
     <div
       key={party.partyId}
       className="flex items-center space-x-2"
    >
       <span
         className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: generateColor(party.partyId, index) }}
       />
       <span className="text-gray-700 text-sm whitespace-nowrap">
         {party.partyName}
       </span>
     </div>
   ))}
    </div>
      
         </div> */}
      </div>
      </div>
  );
}
