import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const reportApi = createApi({
  reducerPath: "reportApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4000/api/",
    credentials: "include",
  }),
 tagTypes: ["Sales", "Purchases", "New-Sale"],
  endpoints: (builder) => ({
    getSalesNewSalesPurchasesEachDay: builder.query({
        query: ({ date }) =>
            
        `report/get-sales-new-sales-purchases-each-day?date=${date}`,
      providesTags: ["Sales", "Purchases", "NewSales"],
    }),

    getSalesNewSalesPurchasesInDateRange: builder.query({
  query: ({ fromDate, toDate, reportType }) => {
    let url = `report/get-sales-new-sales-purchases-in-date-range?fromDate=${fromDate}&toDate=${toDate}`;

    // ✅ append only if reportType is passed
    if (reportType) {
      url += `&reportType=${reportType}`;
    }

    return url;
  },
  providesTags: ["Sales", "Purchases", "NewSales"],
}),

getSalesAndPurchasesDailyYearMonthWise: builder.query({
  query: ({year, month}) => `report/sales-purchases-daily-year-month-wise?month=${month}&year=${year}`,
}),

getSalesAndPurchasesWeeklyYearMonthWise: builder.query({
  query: ({year, month}) => `report/sales-purchases-weekly-year-month-wise?month=${month}&year=${year}`,
}),
    getSalesAndPurchasesMonthWise: builder.query({
    query: ({year}) => `report/sales-purchases-month-wise?year=${year}`,
    
  }),

  getSalesAndPurchasesYearWise: builder.query({
    query: ({year}) => `report/sales-purchases-year-wise?year=${year}`,
  }),

  // getPartyWiseSalesAndPurchasesDailyYearMonthWise: builder.query({
  //   query: ({year, month}) => `report/party-wise-sales-purchases-daily-year-month-wise?month=${month}&year=${year}`,
  // }),

  getPartyWiseSalesAndPurchasesOverall: builder.query({
    query: () => `report/party-wise-sales-purchases-overall`,
  }),

  printDailyReport: builder.mutation({
  query: (payload) => ({
    url: "report/print-daily-report",
    method: "POST",
    body: JSON.stringify(payload),   // IMPORTANT
    headers: {
      "Content-Type": "application/json",
    },
    responseHandler: (response) => response.blob(), 
  }),
}),
getBalanceSheet: builder.query({
  query: ({fromDate, toDate}) => `report/balance-sheet?fromDate=${fromDate}&toDate=${toDate}`,
  
}),
getDayWiseTransactions: builder.query({
  query: ({ startDate, endDate }) =>
    `report/day-wise-transactions-count?startDate=${startDate}&endDate=${endDate}`,
}),
getDayWiseTransactionsDetails: builder.query({
  query: (date) => `report/day-wise-transactions-details?date=${date}`
}),
  }),

  })

export const { useGetSalesNewSalesPurchasesEachDayQuery ,
useGetSalesNewSalesPurchasesInDateRangeQuery,
useGetSalesAndPurchasesDailyYearMonthWiseQuery,
useGetSalesAndPurchasesWeeklyYearMonthWiseQuery,
useGetSalesAndPurchasesMonthWiseQuery,
useGetSalesAndPurchasesYearWiseQuery,
// useGetPartyWiseSalesAndPurchasesDailyYearMonthWiseQuery,
useGetPartyWiseSalesAndPurchasesOverallQuery,
usePrintDailyReportMutation,
useGetBalanceSheetQuery, useGetDayWiseTransactionsQuery,useGetDayWiseTransactionsDetailsQuery} = reportApi
