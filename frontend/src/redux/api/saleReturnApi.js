import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const saleReturnApi = createApi({
  reducerPath: "saleReturnApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:4000/api", credentials: "include" }),
  tagTypes: ["SaleReturn"],

  endpoints: (builder) => ({

    /* GET ALL */
    // getAllSaleReturns: builder.query({
    //   query: ({ page = 1, search = "", fromDate = "", toDate = "" }) => {
    //     const params = new URLSearchParams({ page, search, fromDate, toDate });
    //     return `/sale-return?${params.toString()}`;
    //   },
    //   providesTags: ["SaleReturn"],
    // }),

    getAllSaleReturns: builder.query({
  query: ({
    cursor = null,
    search = "",
    fromDate = "",
    toDate = "",
    limit = 10,
  } = {}) => {
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

    return `/sale-return?${params.toString()}`;
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

    // Cursor request → append next batch
    currentCache.saleReturns.push(
      ...newData.saleReturns
    );

    currentCache.hasMore =
      newData.hasMore;

    currentCache.nextCursor =
      newData.nextCursor;

    currentCache.totalReturns =
      newData.totalReturns;

    if (newData.totals) {
      currentCache.totals =
        newData.totals;
    }
  },

  forceRefetch: ({
    currentArg,
    previousArg,
  }) =>
    currentArg?.cursor !==
      previousArg?.cursor ||
    currentArg?.search !==
      previousArg?.search ||
    currentArg?.fromDate !==
      previousArg?.fromDate ||
    currentArg?.toDate !==
      previousArg?.toDate ||
    currentArg?.limit !==
      previousArg?.limit,

  providesTags: [
    {
      type: "SaleReturn",
      id: "LIST",
    },
  ],
}),

    /* GET SINGLE */
    getSaleReturnById: builder.query({
      query: (Sale_Return_Id) => `/sale-return/${Sale_Return_Id}`,
      providesTags: (_r, _e, id) => [{ type: "SaleReturn", id }],
    }),

    getLatestSaleReturnNumber: builder.query({
    query: (prefix) => ({
        url: `/sale-return/get-latest-return-number`,
        params: { prefix },
    }),
    providesTags: [{ type: "SaleReturn", id: "LATEST_RETURN" }],
}),

    /* CREATE */
    createSaleReturn: builder.mutation({
      query: ({ Sale_Id, ...body }) => ({
        url: `/sale-return/${Sale_Id}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["SaleReturn"],
    }),

    /* EDIT */
    updateSaleReturn: builder.mutation({
      query: ({ Sale_Return_Id, ...body }) => ({
        url: `/sale-return/${Sale_Return_Id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["SaleReturn"],
    }),

    /* DELETE */
    deleteSaleReturn: builder.mutation({
      query: (Sale_Return_Id) => ({
        url: `/sale-return/${Sale_Return_Id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SaleReturn"],
    }),
    getSaleReturnPrintReport: builder.query({
      query: ({
        search = "",
        fromDate = "",
        toDate = "",
      } = {}) => {
        const params = new URLSearchParams();

        if (search) params.append("search", search);
        if (fromDate) params.append("fromDate", fromDate);
        if (toDate) params.append("toDate", toDate);

        return `sale-return/print-sale-return-report?${params.toString()}`;
      },
      providesTags: ["SaleReturn"],
    }),
  }),
});

export const {
  useGetAllSaleReturnsQuery,
  useGetSaleReturnByIdQuery,
  useCreateSaleReturnMutation,
  useUpdateSaleReturnMutation,
  useDeleteSaleReturnMutation,
  useLazyGetSaleReturnPrintReportQuery,
  useLazyGetLatestSaleReturnNumberQuery
} = saleReturnApi;