import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
 
export const cashInHandApi = createApi({
  reducerPath: "cashInHandApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:4000/api" }),
  tagTypes: ["CashInHand", "Adjustment"],
 
  endpoints: (builder) => ({
 
    /* summary + ledger — pass fromDate, toDate, page for filtering */
    getCashInHand: builder.query({
      query: ({ fromDate = "", toDate = "", page = 1, limit = 10,search="" } = {}) => {
        const params = new URLSearchParams({ fromDate, toDate, page, limit,search });
        return `/cash-in-hand?${params.toString()}`;
      },
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
  useGetAllAdjustmentsQuery,
  useCreateAdjustmentMutation,
  useEditAdjustmentMutation,
  //useDeleteAdjustmentMutation,
} = cashInHandApi;