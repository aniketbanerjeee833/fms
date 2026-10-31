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

    // getDayWiseTransactionsDetails: builder.query({
    //   query: (date) =>
    //     `report/day-wise-transactions-details?date=${date}`,

    //   providesTags: ["DayWiseTransactions"],
    // })

getDayWiseTransactionsDetails: builder.query({
  query: ({ date, cursor = null, limit = 50, search = "" }) => {
    const params = new URLSearchParams({
      date,
      limit: String(limit),
    });

    if (cursor) {
      params.set("cursor", cursor);
    }

    if (search.trim()) {
      params.set("search", search.trim());
    }

    return `report/day-wise-transactions-details?${params.toString()}`;
  },

  // Separate cached results for each date and search term.
  serializeQueryArgs: ({ queryArgs }) => ({
    date: queryArgs.date,
    limit: queryArgs.limit ?? 50,
    search: queryArgs.search?.trim() ?? "",
  }),

  merge: (currentCache, newData, { arg }) => {
    // Replace cached results for the first page.
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
    currentArg?.cursor !== previousArg?.cursor ||
    currentArg?.limit !== previousArg?.limit ||
    currentArg?.search?.trim() !== previousArg?.search?.trim(),

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
useGetBalanceSheetQuery, useGetDayWiseTransactionsQuery,useGetDayWiseTransactionsDetailsQuery} = reportApi
