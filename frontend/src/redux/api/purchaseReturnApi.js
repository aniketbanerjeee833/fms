import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
 
export const purchaseReturnApi = createApi({
  reducerPath: "purchaseReturnApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:4000/api",credentials: "include", }),
  tagTypes: ["PurchaseReturn"],
 
  endpoints: (builder) => ({
 
    /* GET ALL */
    getAllPurchaseReturns: builder.query({
      query: ({ page = 1, search = "", fromDate = "", toDate = "" }) => {
        const params = new URLSearchParams({ page, search, fromDate, toDate });
        return `/purchase-return?${params.toString()}`;
      },
      providesTags: ["PurchaseReturn"],
    }),
 
    /* GET SINGLE */
    getPurchaseReturnById: builder.query({
      query: (Purchase_Return_Id) => `/purchase-return/${Purchase_Return_Id}`,
      providesTags: (_r, _e, id) => [{ type: "PurchaseReturn", id }],
    }),
 
    /* CREATE */
    createPurchaseReturn: builder.mutation({
      query: ({ Purchase_Id, ...body }) => ({
        url: `/purchase-return/${Purchase_Id}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["PurchaseReturn"],
    }),
 
    /* EDIT */
    updatePurchaseReturn: builder.mutation({
      query: ({ Purchase_Return_Id, ...body }) => ({
        url: `/purchase-return/${Purchase_Return_Id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["PurchaseReturn"],
    }),
 
    /* DELETE */
    deletePurchaseReturn: builder.mutation({
      query: (Purchase_Return_Id) => ({
        url: `/purchase-return/${Purchase_Return_Id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["PurchaseReturn"],
    }),
  }),
});
 
export const {
  useGetAllPurchaseReturnsQuery,
  useGetPurchaseReturnByIdQuery,
  useCreatePurchaseReturnMutation,
  useUpdatePurchaseReturnMutation,
  useDeletePurchaseReturnMutation,
} = purchaseReturnApi;
 