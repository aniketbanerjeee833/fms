import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const paymentInApi = createApi({
  reducerPath: "paymentInApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4000/api/",
    credentials: "include",
  }),
  tagTypes: ["PaymentIn"],
  endpoints: (builder) => ({
    getAllPaymentIns: builder.query({
      query: ({ page = 1, search = "", fromDate = "", toDate = "" } = {}) => {
        const params = new URLSearchParams();
        params.set("page", page);
        if (search) params.set("search", search);
        if (fromDate) params.set("fromDate", fromDate);
        if (toDate) params.set("toDate", toDate);
        return `/payment-in?${params.toString()}`;
      },
      providesTags: (result) =>
        result?.paymentIns
          ? [
              ...result.paymentIns.map((p) => ({ type: "PaymentIn", id: p.Id })),
              { type: "PaymentIn", id: "LIST" },
            ]
          : [{ type: "PaymentIn", id: "LIST" }],
    }),

    getPaymentInById: builder.query({
      query: (id) => `/payment-in/${id}`,
      providesTags: (result, error, id) => [{ type: "PaymentIn", id }],
    }),

    addPaymentIn: builder.mutation({
      query: (body) => ({
        url: "/payment-in",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "PaymentIn", id: "LIST" }],
    }),

    updatePaymentIn: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/payment-in/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "PaymentIn", id },
        { type: "PaymentIn", id: "LIST" },
      ],
    }),

    deletePaymentIn: builder.mutation({
      query: (id) => ({
        url: `/payment-in/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "PaymentIn", id: "LIST" }],
    }),
    getPaymentInPrintReport: builder.query({
  query: ({
    search = "",
    fromDate = "",
    toDate = "",
  } = {}) => {
    const params = new URLSearchParams();

    if (search) params.append("search", search);
    if (fromDate) params.append("fromDate", fromDate);
    if (toDate) params.append("toDate", toDate);

    return `/payment-in/print-payment-in-report?${params.toString()}`;
  },

  providesTags: [{ type: "PaymentIn", id: "LIST" }],
}),
  }),
});

export const {
  useGetAllPaymentInsQuery,
  useGetPaymentInByIdQuery,
  useAddPaymentInMutation,
  useUpdatePaymentInMutation,
  useDeletePaymentInMutation,
  useLazyGetPaymentInPrintReportQuery
} = paymentInApi;
