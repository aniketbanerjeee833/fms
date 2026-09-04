import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const paymentInApi = createApi({
  reducerPath: "paymentInApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4000/api/",
    credentials: "include",
  }),
  tagTypes: ["PaymentIn"],
  endpoints: (builder) => ({
    // getAllPaymentIns: builder.query({
    //   query: ({ page = 1, search = "", fromDate = "", toDate = "" } = {}) => {
    //     const params = new URLSearchParams();
    //     params.set("page", page);
    //     if (search) params.set("search", search);
    //     if (fromDate) params.set("fromDate", fromDate);
    //     if (toDate) params.set("toDate", toDate);
    //     return `/payment-in?${params.toString()}`;
    //   },
    //   providesTags: (result) =>
    //     result?.paymentIns
    //       ? [
    //           ...result.paymentIns.map((p) => ({ type: "PaymentIn", id: p.Id })),
    //           { type: "PaymentIn", id: "LIST" },
    //         ]
    //       : [{ type: "PaymentIn", id: "LIST" }],
    // }),

getAllPaymentIns: builder.query({
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

    return `/payment-in?${params.toString()}`;
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
    currentCache.paymentIns.push(
      ...newData.paymentIns
    );

    currentCache.hasMore =
      newData.hasMore;

    currentCache.nextCursor =
      newData.nextCursor;

    // Keep totals updated
    if (newData.totals) {
      currentCache.totals =
        newData.totals;
    }

    currentCache.totalPayments =
      newData.totalPayments;
  },

  forceRefetch: ({
    currentArg,
    previousArg,
  }) =>
    currentArg?.cursor !== previousArg?.cursor ||
    currentArg?.search !== previousArg?.search ||
    currentArg?.fromDate !== previousArg?.fromDate ||
    currentArg?.toDate !== previousArg?.toDate ||
    currentArg?.limit !== previousArg?.limit,

  providesTags: [
    {
      type: "PaymentIn",
      id: "LIST",
    },
  ],
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

    // deletePaymentIn: builder.mutation({
    //   query: (id) => ({
    //     url: `/payment-in/${id}`,
    //     method: "DELETE",
    //   }),
    //   invalidatesTags: [{ type: "PaymentIn", id: "LIST" }],
    // }),
    deletePaymentIn: builder.mutation({
  query: (id) => ({
    url: `/payment-in/${id}`,
    method: "DELETE",
  }),

  async onQueryStarted(
    id,
    { dispatch, queryFulfilled }
  ) {
    const patchResult = dispatch(
      paymentInApi.util.updateQueryData(
        "getAllPaymentIns",
        {
          cursor: null,
          search: "",
          fromDate: "",
          toDate: "",
          limit: 10,
        },
        (draft) => {
          if (!draft?.paymentIns) return;

          const deletedPayment =
            draft.paymentIns.find(
              (item) =>
                String(item.id) === String(id)
            );

          draft.paymentIns =
            draft.paymentIns.filter(
              (item) =>
                String(item.id) !== String(id)
            );

          if (draft.totalPayments != null) {
            draft.totalPayments = Math.max(
              0,
              draft.totalPayments - 1
            );
          }

          if (
            draft.totals?.totalReceived != null &&
            deletedPayment
          ) {
            draft.totals.totalReceived =
              Math.max(
                0,
                Number(
                  draft.totals.totalReceived
                ) -
                  Number(
                    deletedPayment.Received || 0
                  )
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
    {
      type: "PaymentIn",
      id: "LIST",
    },
  ],
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
