import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const saleReturnApi = createApi({
  reducerPath: "saleReturnApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:4000/api", credentials: "include" }),
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
      query: (Sale_Return_Id) => `/sale-return/${Sale_Return_Id}`,
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
    }),
  }),
});

export const {
  useGetAllSaleReturnsQuery,
  useGetSaleReturnByIdQuery,
  useCreateSaleReturnMutation,
  useUpdateSaleReturnMutation,
  useDeleteSaleReturnMutation,
  useLazyGetSaleReturnPrintReportQuery
} = saleReturnApi;