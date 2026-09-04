import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

 
export const cashInHandApi = createApi({
  reducerPath: "cashInHandApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:4000/api" ,credentials: "include",}),
  tagTypes: ["CashInHand", "Adjustment"],
 
  endpoints: (builder) => ({
 
    /* summary + ledger — pass fromDate, toDate, page for filtering */
    // getCashInHand: builder.query({
    //   query: ({ fromDate = "", toDate = "", page = 1, limit = 10,search="" } = {}) => {
    //     const params = new URLSearchParams({ fromDate, toDate, page, limit,search });
    //     return `/cash-in-hand?${params.toString()}`;
    //   },
    //   providesTags: ["CashInHand"],
    // }),
    getCashInHand: builder.query({
  query: ({
    cursor = null,
    fromDate = "",
    toDate = "",
    limit = 10,
    search = "",
  } = {}) => {
    const params = new URLSearchParams();

    if (cursor) {
      params.append("cursor", cursor);
    }

    if (fromDate) {
      params.append("fromDate", fromDate);
    }

    if (toDate) {
      params.append("toDate", toDate);
    }

    if (search?.trim()) {
      params.append("search", search.trim());
    }

    params.append("limit", limit);

    return `/cash-in-hand?${params.toString()}`;
  },

  serializeQueryArgs: ({ queryArgs }) => ({
    fromDate: queryArgs.fromDate,
    toDate: queryArgs.toDate,
    search: queryArgs.search,
  }),

  merge: (currentCache, newData, { arg }) => {
    if (!arg.cursor) {
      return newData;
    }

    currentCache.ledger.push(...newData.ledger);

    currentCache.hasMore = newData.hasMore;
    currentCache.nextCursor = newData.nextCursor;

    currentCache.totalCount = newData.totalCount;
    currentCache.cashInHand = newData.cashInHand;
    currentCache.totalCashIn = newData.totalCashIn;
    currentCache.totalCashOut = newData.totalCashOut;
  },

  forceRefetch: ({
    currentArg,
    previousArg,
  }) =>
    currentArg?.cursor !== previousArg?.cursor ||
    currentArg?.fromDate !== previousArg?.fromDate ||
    currentArg?.toDate !== previousArg?.toDate ||
    currentArg?.search !== previousArg?.search ||
    currentArg?.limit !== previousArg?.limit,

  providesTags: [{ type: "CashInHand", id: "LIST" }],
}),
    getCashBalance: builder.query({
      query: () => `/cash-in-hand/cash-balance`,
      providesTags: ["CashInHand"],
    }),
 
    /* manual adjustments list */
    getAllAdjustments: builder.query({
      query: ({ page = 1 } = {}) => `/cash-in-hand/adjustments?page=${page}`,
      providesTags: ["Adjustment"],
    }),
 
    /* create adjustment */
    createAdjustment: builder.mutation({
      query: (body) => ({
        url:    "/cash-in-hand/adjustments",
        method: "POST",
        body,
      }),
      /* invalidate both — balance changes, ledger changes */
      invalidatesTags: ["CashInHand", "Adjustment"],
    }),
 
    /* edit adjustment */
    editAdjustment: builder.mutation({
      query: ({ id, ...body }) => ({
        url:    `/cash-in-hand/adjustments/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["CashInHand", "Adjustment"],
    }),
 
    /* delete adjustment */
    // deleteAdjustment: builder.mutation({
    //   query: (id) => ({
    //     url:    `/cash-in-hand/adjustments/${id}`,
    //     method: "DELETE",
    //   }),
    //   invalidatesTags: ["CashInHand", "Adjustment"],
    // }),
  }),
});
 
export const {
  useGetCashInHandQuery,
  useGetCashBalanceQuery,
  useGetAllAdjustmentsQuery,
  useCreateAdjustmentMutation,
  useEditAdjustmentMutation,
  //useDeleteAdjustmentMutation,
} = cashInHandApi;