import { useState } from 'react';

import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart,
  Users, Package, AlertCircle, FileText, LayoutDashboard, CalendarDays,
  Icon,
  IndianRupee
} from 'lucide-react';
//import { NavLink } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  useGetSalesChartDataQuery,
  useGetTotalPayablesLeftQuery,
  useGetTotalReceivablesLeftQuery,
  useGetTotalSalesPurchasesReceivablesPayablesProfitQuery
} from '../redux/api/dashboardApi';




import { useGetTotalSalesEachDayQuery } from "../redux/api/saleApi";
import { useGetTotalPurchasesEachDayQuery } from "../redux/api/purchaseApi";
import { Filter, X } from 'lucide-react';
import { NavLink, } from 'react-router-dom';
import { useMemo } from 'react';



const ACCENT = "#4CA1AF";
 
const formatLocalDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const todayStr = () => formatLocalDate(new Date());

const firstOfMonthStr = () => {
  const d = new Date();
  return formatLocalDate(new Date(d.getFullYear(), d.getMonth(), 1));
};
 
/* format "2026-08-04" -> "4 Aug" for the x-axis */
const formatAxisDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};
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

  
  const { data: salesData } = useGetTotalSalesEachDayQuery();
  //const [reportType, setReportType] = useState('');
  // const { data: newSalesData } = useGetTotalNewSalesEachDayQuery();
  const { data: purchasesData } = useGetTotalPurchasesEachDayQuery();
  //const [showRangeModal, setShowRangeModal] = useState(false);
  // const [dateRange, setDateRange] = useState({
  //   startDate: '',
  //   endDate: ''
  // });
  const totalSalesByDate = salesData?.data || [];
  // const totalNewSalesByDate = newSalesData?.data || [];
  const totalPurchasesByDate = purchasesData?.data || [];

  console.log(
    totalSalesByDate,

    totalPurchasesByDate,
  );

  const today = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
  console.log(today);
  const [currentDate, setCurrentDate] = useState(new Date());
  //const [selectedDate, setSelectedDate] = useState(today);
  const selectedYear = currentDate.getFullYear();
  const selectedMonth = currentDate.getMonth() + 1; // JS month is 0-based
  console.log("selectedMonth", selectedMonth, selectedYear);
  const { data: totalSalesPurchasesReceivablesPayablesProfit } =
    useGetTotalSalesPurchasesReceivablesPayablesProfitQuery({ month: selectedMonth, year: selectedYear });
  // Item-wise analysis
  console.log(totalSalesPurchasesReceivablesPayablesProfit, "totalSalesPurchasesReceivablesPayablesProfit");
  console.log("salesPurchasesProfitData", totalSalesPurchasesReceivablesPayablesProfit);
  //const itemAnalysis = {};
  // const profitMargin = ((totalSalesPurchasesReceivablesPayablesProfit?.profit /
  //   totalSalesPurchasesReceivablesPayablesProfit?.sales) * 100).toFixed(1);

  const { data: totalPayablesLeftData } = useGetTotalPayablesLeftQuery();
  const { data: totalReceivablesLeftData } = useGetTotalReceivablesLeftQuery();

  const totalPayablesLeft = totalPayablesLeftData?.total_payables_left;
  const totalReceivablesLeft = totalReceivablesLeftData?.total_receivables_left;
  const partiesLeftInPayables = totalPayablesLeftData?.total_parties;
  const partiesLeftInReceivables = totalReceivablesLeftData?.total_parties;
  console.log("totalPayablesLeft", totalPayablesLeft);
  console.log("totalReceivablesLeft", totalReceivablesLeft);
   const [fromDate, setFromDate] = useState(firstOfMonthStr());
  const [toDate, setToDate]     = useState(todayStr());
 
  const { data, isLoading } = useGetSalesChartDataQuery({ fromDate, toDate });
 
  const series = data?.series || [];
  const totalSales = data?.totalSales || 0;
  const percentChange = data?.percentChange ?? 0;
  //const isPositive = percentChange >= 0;
 
  const chartData = useMemo(
    () => series.map((s) => ({ date: s.date, label: formatAxisDate(s.date), total: s.total })),
    [series]
  );
  // const getDaysInMonth = (year, month) => {
  //   return new Date(year, month + 1, 0).getDate();
  // };

  // const getFirstDayOfMonth = (year, month) => {
  //   return new Date(year, month, 1).getDay();
  // };

  // const formatDate = (year, month, day) => {
  //   return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  // };

  // const handleDateClick = (day) => {
  //   const year = currentDate.getFullYear();
  //   const month = currentDate.getMonth();
  //   const dateStr = formatDate(year, month, day);

  //   console.log("Selected date:", dateStr);

  //   // Clear leads immediately when a new date is selected
  //   // dispatch(clearSelectedLeads());
  //   setSelectedDate(dateStr);
  //   //navigate(`/day-wise-report/${dateStr}`);
  //   window.open(`/day-wise-report/${dateStr}`, "_blank");
  //   // Remove the manual fetchLeadsByDate call - let the query handle it
  // };

  // const navigateMonth = (direction) => {
  //   const newDate = new Date(currentDate);
  //   newDate.setMonth(newDate.getMonth() + direction);

  //   // dispatch(clearSelectedLeads()); // Clear leads when navigating months
  //   setCurrentDate(newDate);
  //   setSelectedDate(today);
  //   // setSelectedLeads([]);

  // };
  // const handleDateRangeSubmit = () => {
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
  //     console.log(url);
  //     window.open(url, "_blank");

  //     setShowRangeModal(false);
  //     setDateRange({ startDate: "", endDate: "" });
  //     setReportType("");
  //   } else {
  //     toast.error("Please select both start and end dates");
  //   }
  // };

  // const renderCalendar = () => {
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

  //       <div
  //         key={d}
  //         onClick={() => handleDateClick(d)}
  //         className={`
  //   h-24 border p-1 cursor-pointer relative rounded-md transition
  //   ${isSelected ? "bg-blue-100 border-blue-400" :
  //             isToday ? "bg-green-100 border-green-400" :
  //               "bg-white hover:bg-gray-50"}
  // `}
  //       >
  //         {/* Day number */}
  //         <div className="text-sm font-semibold text-gray-700">{d}</div>

  //         {/* BOTTOM STACKED SECTION */}
  //         <div className="absolute bottom-1 right-1 flex flex-col space-y-[2px]">

  //           {/* Total Sales */}
  //           {totalSales > 0 && (
  //             <span className="text-[12px] text-green-700 font-medium">
  //               Sales: {totalSales}
  //             </span>
  //           )}

  //           {/* Total Purchases */}
  //           {totalPurchases > 0 && (
  //             <span className="text-[12px] text-red-700 font-medium">
  //               Purchases: {totalPurchases}
  //             </span>
  //           )}

  //           {/* Total New Sales */}
  //           {/* {totalNewSales > 0 && (
  //     <span className="text-[12px] text-purple-700 font-medium">
  //       New Sales: {totalNewSales}
  //     </span>
  //   )} */}

  //         </div>
  //       </div>


  //     );
  //   }

  //   return days;
  // };







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
            <p style={{ color: "black" }} className="text-sm text-gray-600 font-medium truncate mt-2 ">{title}</p>
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

              {/*  Value */}
              <h4 className="text-2xl font-bold text-gray-900 mt-2">
                ₹{(Number(totalReceivablesLeft) || 0).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h4>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Total Parties</span>

                <h4 style={{ paddingBottom: "0px" }}
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
                {/* ₹{totalPayablesLeft ?? 0} */}
                ₹{(Number(totalPayablesLeft) || 0).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h4>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Total Parties</span>

                <h4 style={{ paddingBottom: "0px" }}
                  className="text-lg font-bold text-gray-900">
                  {partiesLeftInPayables}
                </h4>
              </div>
            </NavLink>
          </div>

        </div>

        {/* <div className="tab-inn"> */}
      <div
      className="tab-inn"
      //style={{ minHeight: 340 }}
    >
      {/* ── header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-2">
        <div>
          <p className="text-sm text-gray-500 mb-1">Total Sale</p>
          <div className="flex items-baseline gap-2 flex-wrap">
            <h4 className="text-2xl font-bold text-gray-900">
              ₹{totalSales.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </h4>
            {/* {data && (
              <span
                className="text-xs font-semibold"
                style={{ color: isPositive ? "#16a34a" : "#dc2626" }}
              >
                {isPositive ? "+" : ""}{percentChange}% {isPositive ? "more" : "less"} than previous period
              </span>
            )} */}
          </div>
        </div>
 
        {/* ── From / To date filters (no preset dropdown) ── */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex flex-col">
            <span className="text-[11px] mb-0.5">From</span>
            <input
              type="date"
              value={fromDate}
              max={toDate}
              onChange={(e) => setFromDate(e.target.value)}
             className="w-full outline-none border-b-2 text-gray-900"
              //style={{ borderColor: "#d1d5db" }}
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px]  mb-0.5">To</span>
            <input
              type="date"
              value={toDate}
              min={fromDate}
              max={todayStr()}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full outline-none border-b-2 text-gray-900"
              //style={{ borderColor: "#d1d5db" }}
            />
          </div>
        </div>
      </div>
 
      {/* ── chart ── */}
      <div 
      style={{ width: "100%",
       height: 360
        }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Loading chart...
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            No sales in this range
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="totalSaleGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"  stopColor={ACCENT} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={30}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
              />
              <Tooltip
                formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, "Sales"]}
                labelFormatter={(label) => label}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke={ACCENT}
                strokeWidth={2}
                fill="url(#totalSaleGradient)"
                dot={false}
                activeDot={{ r: 4, fill: ACCENT }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
      </div>

    </>
  );
}