import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const reportApi = createApi({
  reducerPath: "reportApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4000/api/",
    credentials: "include",
  }),
 tagTypes: ["Sales", "Purchases", "New-Sale","DayWiseTransactions"],
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

      providesTags: ["DayWiseTransactions"],
    }),

  
getTransactionDetails: builder.query({
  query: ({
    date,
    fromDate,
    toDate,
    reportType = "",
    cursor = null,
    limit = 50,
    search = "",
  }) => {
    const params = new URLSearchParams({
      limit: String(limit),
    });

    // Single-day report.
    if (date) {
      params.set("date", date);
    } else {
      // Date-range report.
      if (fromDate) params.set("fromDate", fromDate);
      if (toDate) params.set("toDate", toDate);
    }

    // Optional transaction category.
    if (reportType && reportType !== "all") {
      params.set("reportType", reportType);
    }

    if (cursor) {
      params.set("cursor", cursor);
    }

    if (search.trim()) {
      params.set("search", search.trim());
    }

    return `report/transactions-details?${params.toString()}`;
  },

  // Keep separate cache entries for different report filters.
  serializeQueryArgs: ({ queryArgs }) => ({
    date: queryArgs.date ?? "",
    fromDate: queryArgs.fromDate ?? "",
    toDate: queryArgs.toDate ?? "",
    reportType: queryArgs.reportType ?? "",
    limit: queryArgs.limit ?? 50,
    search: queryArgs.search?.trim() ?? "",
  }),

  merge: (currentCache, newData, { arg }) => {
    // Replace cached data when fetching the first page.
    if (!arg.cursor) {
      return newData;
    }

    const categories = [
      "sales",
      "purchases",
      "saleReturns",
      "purchaseReturns",
      "expenses",
      "paymentIns",
      "paymentOuts",
    ];

    for (const category of categories) {
      currentCache.transactions[category].push(
        ...(newData.transactions?.[category] || [])
      );
    }

    currentCache.counts = newData.counts;
    currentCache.hasMore = newData.hasMore;
    currentCache.nextCursor = newData.nextCursor;
  },

  forceRefetch: ({ currentArg, previousArg }) =>
    currentArg?.date !== previousArg?.date ||
    currentArg?.fromDate !== previousArg?.fromDate ||
    currentArg?.toDate !== previousArg?.toDate ||
    currentArg?.reportType !== previousArg?.reportType ||
    currentArg?.cursor !== previousArg?.cursor ||
    currentArg?.limit !== previousArg?.limit ||
    currentArg?.search?.trim() !== previousArg?.search?.trim(),

  providesTags: ["DayWiseTransactions"],
}),



getDayWiseTransactionsDetailsPrint: builder.query({
  query: ({
    date,
    fromDate = "",
    toDate = "",
    reportType = "all",
    search = "",
  }) => {
    const params = new URLSearchParams();

    if (date) params.append("date", date);
    if (fromDate) params.append("fromDate", fromDate);
    if (toDate) params.append("toDate", toDate);
    if (reportType) params.append("reportType", reportType);
    if (search.trim()) params.append("search", search.trim());

    return `report/transactions-details-print?${params.toString()}`;
  },
  providesTags: ["DayWiseTransactions"],
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
useGetBalanceSheetQuery, useGetDayWiseTransactionsQuery,useGetTransactionDetailsQuery, 
useLazyGetDayWiseTransactionsDetailsPrintQuery} = reportApi
