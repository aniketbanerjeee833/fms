import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";





export const saleApi = createApi({
  reducerPath: "saleApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4000/api/",
    credentials: "include",
  }),
  tagTypes: ["Sale", "Invoice"],
  endpoints: (builder) => ({

    // ------------------------------------
    // INVOICE
    // ------------------------------------
    addInvoice: builder.mutation({
      query: ({ body }) => ({
        url: `sale/add-invoice`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Invoice", id: "SINGLE" }],
    }),

    updateInvoice: builder.mutation({
      query: ({ body }) => ({
        url: `sale/update-invoice`,
        method: "PUT",
        body,
      }),
      invalidatesTags: [{ type: "Invoice", id: "SINGLE" }],
    }),

    getSingleInvoice: builder.query({
      query: () => `sale/get-single-invoice`,
      providesTags: [{ type: "Invoice", id: "SINGLE" }],
    }),

    getNewSaleSingleInvoice: builder.query({
      query: () => `sale/get-single-new-sale-invoice`,
      providesTags: [{ type: "Invoice", id: "SINGLE-NEW" }],
    }),

    // ------------------------------------
    // SALE CREATE
    // ------------------------------------
    addSale: builder.mutation({
      query: ({ body }) => ({
        url: `sale/add-sale`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Sale", id: "LIST" }],
    }),

    // ------------------------------------
    // SALE EDIT
    // ------------------------------------
    editSale: builder.mutation({
      query: ({ body, Sale_Id }) => ({
        url: `sale/edit-sale/${Sale_Id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { Sale_Id }) => [
        { type: "Sale", id: Sale_Id },
        { type: "Sale", id: "LIST" },
      ],
    }),

    // ------------------------------------
    // ALL SALES
    // ------------------------------------
    // getAllSales: builder.query({
    //   query: ({ page, search = "", fromDate = "", toDate = "" }) => {
    //     const params = new URLSearchParams();
    //    params.append("page", page || 1);
    //     if (search) params.append("search", search);
    //     if (fromDate) params.append("fromDate", fromDate);
    //     if (toDate) params.append("toDate", toDate);
    //     return `sale/get-all-sales?${params.toString()}`;
    //   },
    //   providesTags: [{ type: "Sale", id: "LIST" }],
    // }),

    getAllSales: builder.query({
  query: ({
    cursor = null,
    search = "",
    fromDate = "",
    toDate = "",
    limit = 10,
  }) => {
    const params = new URLSearchParams();

    if (cursor) {
      params.append("cursor", cursor);
    }

    if (search?.trim()) {
      params.append("search", search.trim());
    }

    if (fromDate) {
      params.append("fromDate", fromDate);
    }

    if (toDate) {
      params.append("toDate", toDate);
    }

    params.append("limit", limit);

    return `sale/get-all-sales?${params.toString()}`;
  },

  serializeQueryArgs: ({ queryArgs }) => ({
    search: queryArgs.search,
    fromDate: queryArgs.fromDate,
    toDate: queryArgs.toDate,
  }),

  merge: (currentCache, newData, { arg }) => {
    // First request / filters changed
    if (!arg.cursor) {
      return newData;
    }

    // Load next cursor page
    currentCache.sales.push(...newData.sales);

    currentCache.hasMore = newData.hasMore;
    currentCache.nextCursor = newData.nextCursor;

    // Keep totals updated
    if (newData.totals) {
      currentCache.totals = newData.totals;
    }

    currentCache.totalSales = newData.totalSales;
  },

  forceRefetch: ({ currentArg, previousArg }) =>
    currentArg?.cursor !== previousArg?.cursor ||
    currentArg?.search !== previousArg?.search ||
    currentArg?.fromDate !== previousArg?.fromDate ||
    currentArg?.toDate !== previousArg?.toDate ||
    currentArg?.limit !== previousArg?.limit,

  providesTags: [{ type: "Sale", id: "LIST" }],
}),

    // ------------------------------------
    // LATEST INVOICE NUMBER
    // ------------------------------------
    // getLatestInvoiceNumber: builder.query({
    //   query: () => `sale/get-latest-invoice-number`,
    //   providesTags: [{ type: "Invoice", id: "LATEST" }],
    // }),
    getLatestInvoiceNumber: builder.query({
  query: (prefix) => ({
    url: `sale/get-latest-invoice-number`,
    params: {
      prefix,
    },
  }),
  providesTags: [{ type: "Invoice", id: "LATEST" }],
}),

    // ------------------------------------
    // SPECIFIC SALE
    // ------------------------------------
    getSingleSale: builder.query({
      query: (Sale_Id) => `sale/get-single-sale/${Sale_Id}`,
      providesTags: (result, error, Sale_Id) => [
        { type: "Sale", id: Sale_Id },
      ],
    }),

    // ------------------------------------
    // PRINT BILL
    // ------------------------------------
    printSaleBill: builder.mutation({
      query: (sale) => ({
        url: `sale/print-sale-invoice`,
        method: "POST",
        body: sale,
        responseHandler: (response) => response.blob(),
      }),
      invalidatesTags: [{ type: "Sale", id: "LIST" }],
    }),

    // ------------------------------------
    // TOTAL SALES PER DAY
    // ------------------------------------
    getTotalSalesEachDay: builder.query({
      query: () => `sale/total-sales-by-day`,
      providesTags: [{ type: "Sale", id: "DASHBOARD" }],
    }),
  //      deleteSale: builder.mutation({
  //     query: (Sale_Id) => ({
  //       url: `/sale/delete-sale/${Sale_Id}`,
  //       method: "DELETE",
  //     }),
  //      invalidatesTags: (result, error, Sale_Id) => [
  //   { type: "Sale", id: Sale_Id },
  //   { type: "Sale", id: "LIST" },
  // ],
  //   }),
 
deleteSale: builder.mutation({
  query: (Sale_Id) => ({
    url: `/sale/delete-sale/${Sale_Id}`,
    method: "DELETE",
  }),

  async onQueryStarted(Sale_Id, { dispatch, queryFulfilled }) {
    const patchResult = dispatch(
      saleApi.util.updateQueryData(
        "getAllSales",
        {
          cursor: null,
          search: "",
          fromDate: "",
          toDate: "",
          limit: 10,
        },
        (draft) => {
          draft.sales = draft.sales.filter(
            (s) =>
              String(s.Sale_Id) !== String(Sale_Id)
          );

          if (draft.totalSales != null) {
            draft.totalSales = Math.max(
              0,
              draft.totalSales - 1
            );
          }
        }
      )
    );

    try {
      await queryFulfilled;
    } catch {
      patchResult.undo();
    }
  },

  invalidatesTags: [
    { type: "Sale", id: "LIST" },
  ],
}),
  getSalesPrintReport: builder.query({
  query: ({ search = "", fromDate = "", toDate = "" } = {}) => {
    const params = new URLSearchParams();

    if (search) params.append("search", search);
    if (fromDate) params.append("fromDate", fromDate);
    if (toDate) params.append("toDate", toDate);

    return `/sale/print-sales-report?${params.toString()}`;
  },
}),

  }),
});



 export const {
   
  useAddInvoiceMutation,
    useUpdateInvoiceMutation,
    useGetSingleInvoiceQuery,

    useGetNewSaleSingleInvoiceQuery,

    useAddSaleMutation,
   
    useEditSaleMutation,
    useDeleteSaleMutation,
   
   
    useGetAllSalesQuery,
    

    //useGetLatestInvoiceNumberQuery,
   
    useLazyGetLatestInvoiceNumberQuery,
    useGetSingleSaleQuery,
    usePrintSaleBillMutation,

    
    useGetTotalSalesEachDayQuery,
     useLazyGetSalesPrintReportQuery

   
 }=saleApi
   
