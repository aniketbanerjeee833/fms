import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const saleReturnApi = createApi({
  reducerPath: "saleReturnApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:4000/api" }),
  tagTypes: ["SaleReturn"],

  endpoints: (builder) => ({

    /* GET ALL */
    getAllSaleReturns: builder.query({
      query: ({ page = 1, search = "", fromDate = "", toDate = "" }) => {
        const params = new URLSearchParams({ page, search, fromDate, toDate });
        return `/sale-return?${params.toString()}`;
      },
      providesTags: ["SaleReturn"],
    }),

    /* GET SINGLE */
    getSaleReturnById: builder.query({
      query: (id) => `/sale-return/${id}`,
      providesTags: (_r, _e, id) => [{ type: "SaleReturn", id }],
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
    editSaleReturn: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/sale-return/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["SaleReturn"],
    }),

    /* DELETE */
    deleteSaleReturn: builder.mutation({
      query: (id) => ({
        url: `/sale-return/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SaleReturn"],
    }),
  }),
});

export const {
  useGetAllSaleReturnsQuery,
  useGetSaleReturnByIdQuery,
  useCreateSaleReturnMutation,
  useEditSaleReturnMutation,
  useDeleteSaleReturnMutation,
} = saleReturnApi;