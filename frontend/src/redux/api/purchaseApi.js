import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";




export const purchaseApi = createApi({
  reducerPath: "purchaseApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4000/api/",
    credentials: "include",
  }),
  tagTypes: ["Purchase"],
  endpoints: (builder) => ({

    addPurchase: builder.mutation({
      query: ({ body }) => ({
        url: `purchase/add-purchase`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Purchase", id: "LIST" }],
    }),

    editPurchase: builder.mutation({
      query: ({ body, Purchase_Id }) => ({
        url: `purchase/edit-purchase/${Purchase_Id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { Purchase_Id }) => [
        { type: "Purchase", id: Purchase_Id },
        { type: "Purchase", id: "LIST" },
      ],
    }),

    // getAllPurchases: builder.query({
    //   query: ({ page, search = "", fromDate = "", toDate = "" }) => {
    //     const params = new URLSearchParams();
    //     params.append("page", page || 1);
    //     if (search) params.append("search", search);
    //     if (fromDate) params.append("fromDate", fromDate);
    //     if (toDate) params.append("toDate", toDate);
    //     return `purchase/get-all-purchases?${params.toString()}`;
    //   },
    //   providesTags: [{ type: "Purchase", id: "LIST" }],
    // }),
    getAllPurchases: builder.query({
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

    return `purchase/get-all-purchases?${params.toString()}`;
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
    currentCache.purchases.push(...newData.purchases);

    currentCache.hasMore = newData.hasMore;
    currentCache.nextCursor = newData.nextCursor;

    // Keep totals updated if backend sends them
    if (newData.totals) {
      currentCache.totals = newData.totals;
    }
  },

  forceRefetch: ({ currentArg, previousArg }) =>
    currentArg?.cursor !== previousArg?.cursor ||
    currentArg?.search !== previousArg?.search ||
    currentArg?.fromDate !== previousArg?.fromDate ||
    currentArg?.toDate !== previousArg?.toDate ||
    currentArg?.limit !== previousArg?.limit,

  providesTags: [{ type: "Purchase", id: "LIST" }],
}),

    getSinglePurchase: builder.query({
      query: (Purchase_Id) => `purchase/get-single-purchase/${Purchase_Id}`,
      providesTags: (result, error, Purchase_Id) => [
        { type: "Purchase", id: Purchase_Id },
      ],
    }),

    getTotalPurchasesEachDay: builder.query({
      query: () => `purchase/total-purchases-by-day`,
      providesTags: [{ type: "Purchase", id: "LIST" }],
    }),
    uploadPurchaseBill: builder.mutation({
      query: ({ body }) => ({
        url: `purchase/upload-bill`,
        method: "POST",
        body,
      }),
    }),
    deletePurchase: builder.mutation({
  query: (Purchase_Id) => ({
    url: `/purchase/delete-purchase/${Purchase_Id}`,
    method: "DELETE",
  }),

  async onQueryStarted(Purchase_Id, { dispatch, queryFulfilled }) {
    const patchResult = dispatch(
      purchaseApi.util.updateQueryData(
        "getAllPurchases",
        {
          cursor: null,
          search: "",
          fromDate: "",
          toDate: "",
          limit: 10,
        },
        (draft) => {
          draft.purchases = draft.purchases.filter(
            (p) =>
              String(p.Purchase_Id) !== String(Purchase_Id)
          );
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
    { type: "Purchase", id: "LIST" },
  ],
}),
//     deletePurchase: builder.mutation({
//   query: (Purchase_Id) => ({
//     url: `/purchase/delete-purchase/${Purchase_Id}`,
//     method: "DELETE",
//   }),
//   invalidatesTags: (result, error, Purchase_Id) => [
//     { type: "Purchase", id: Purchase_Id },
//     { type: "Purchase", id: "LIST" },
//   ],
// }),
getPurchasePrintReport: builder.query({
  query: ({
    search = "",
    fromDate = "",
    toDate = "",
  } = {}) => {
    const params = new URLSearchParams();

    if (search)
      params.append("search", search);

    if (fromDate)
      params.append("fromDate", fromDate);

    if (toDate)
      params.append("toDate", toDate);

    return `purchase/print-purchase-report?${params.toString()}`;
  },
}),

  }),
});

export const {

  useAddPurchaseMutation,
  useEditPurchaseMutation,
  useGetAllPurchasesQuery,
  useGetSinglePurchaseQuery,
  useGetTotalPurchasesEachDayQuery,
  useUploadPurchaseBillMutation,
  useDeletePurchaseMutation,
  useLazyGetPurchasePrintReportQuery
} = purchaseApi

