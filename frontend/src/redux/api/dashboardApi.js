import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";










export const dashboardApi = createApi({
  reducerPath: "dashboardApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4000/api/",
    credentials: "include",
  }),
  tagTypes: ["Dashboard" ],

  endpoints: (builder) => ({
    getTotalSalesPurchasesReceivablesPayablesProfit: builder.query({
  query: ({ year, month }) =>
    `dashboard/total-sales-purchases-receivables-payables-profit?year=${year}&month=${month}`,
  providesTags: ["Dashboard"],
}),
        getAllSalesAndPurchasesYearWise: builder.query({
    query: ({year}) => `dashboard/sales-purchases-profit?year=${year}`,
    providesTags: ["Dashboard"],
  }),

  getCategoriesWiseItemCount: builder.query({
    query: ({month, year}) => `dashboard/categories-wise-item-count?month=${month}&year=${year}`,
    providesTags: ["Dashboard"],
  }),
  getPartyWiseSalesAndPurchases: builder.query({
    query: ({month, year}) => `dashboard/party-wise-sales-purchases?month=${month}&year=${year}`,
    providesTags: ["Dashboard"],  

  }),
  getTotalPayablesLeft: builder.query({
    query: () => `dashboard/total-payables-left`,
    providesTags: ["Dashboard"],  
  }),
  getTotalReceivablesLeft: builder.query({
    query: () => `dashboard/total-receivables-left`,
    providesTags: ["Dashboard"],  
  }),
  getSalesChartData: builder.query({
      query: ({ fromDate, toDate } = {}) => {
        const params = new URLSearchParams();
        if (fromDate) params.append("fromDate", fromDate);
        if (toDate)   params.append("toDate", toDate);
        return `dashboard/sales-chart?${params.toString()}`; // adjust route to match yours
      },
      providesTags: ["Dashboard"],
    })
})

})

export const {
   useGetTotalSalesPurchasesReceivablesPayablesProfitQuery,
    useGetAllSalesAndPurchasesYearWiseQuery,
    useGetCategoriesWiseItemCountQuery,
    useGetPartyWiseSalesAndPurchasesQuery,
    useGetTotalPayablesLeftQuery,useGetTotalReceivablesLeftQuery,useGetSalesChartDataQuery } = dashboardApi