import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";








export const paymentOutApi = createApi({
  reducerPath: "paymentOutApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4000/api/",
    credentials: "include",
  }),
  tagTypes: ["PaymentOut" ],
  endpoints: (builder) => ({
   getAllPaymentOuts: builder.query({
      query: ({ page = 1, search = "", fromDate = "", toDate = "" } = {}) => {
        const params = new URLSearchParams();
        params.set("page", page);
        if (search) params.set("search", search);
        if (fromDate) params.set("fromDate", fromDate);
        if (toDate) params.set("toDate", toDate);
        return `/payment-out?${params.toString()}`;
      },
      providesTags: (result) =>
        result?.paymentOuts
          ? [
              ...result.paymentOuts.map((p) => ({ type: "PaymentOut", id: p.Payment_Out_Id })),
              { type: "PaymentOut", id: "LIST" },
            ]
          : [{ type: "PaymentOut", id: "LIST" }],
    }),
 
    getPaymentOutById: builder.query({
      query: (id) => `/payment-out/${id}`,
      providesTags: (result, error, id) => [{ type: "PaymentOut", id }],
    }),
 
    addPaymentOut: builder.mutation({
      query: (body) => ({
        url: "/payment-out",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "PaymentOut", id: "LIST" }],
    }),
 
    updatePaymentOut: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/payment-out/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "PaymentOut", id },
        { type: "PaymentOut", id: "LIST" },
      ],
    }),
 
    deletePaymentOut: builder.mutation({
      query: (id) => ({
        url: `/payment-out/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "PaymentOut", id: "LIST" }],
    }),
    getPaymentOutPrintReport: builder.query({
  query: ({
    search = "",
    fromDate = "",
    toDate = "",
  } = {}) => {
    const params =
      new URLSearchParams();

     if (search) params.append("search", search);
    if (fromDate) params.append("fromDate", fromDate);
    if (toDate) params.append("toDate", toDate);

    return `/payment-out/print-payment-out-report?${params.toString()}`;
  },

  providesTags: ["PaymentOut"],
}),
  }),
 

})
export const {
  useGetAllPaymentOutsQuery,
  useGetPaymentOutByIdQuery,
  useAddPaymentOutMutation,
  useUpdatePaymentOutMutation,
  useDeletePaymentOutMutation,
  useLazyGetPaymentOutPrintReportQuery
 
} = paymentOutApi;