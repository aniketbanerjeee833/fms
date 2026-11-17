import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
 
export const purchaseReturnApi = createApi({
  reducerPath: "purchaseReturnApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:4000/api",credentials: "include", }),
  tagTypes: ["PurchaseReturn"],
 
  endpoints: (builder) => ({
 
    /* GET ALL */
    // getAllPurchaseReturns: builder.query({
    //   query: ({ page = 1, search = "", fromDate = "", toDate = "" }) => {
    //     const params = new URLSearchParams({ page, search, fromDate, toDate });
    //     return `/purchase-return?${params.toString()}`;
    //   },
    //   providesTags: ["PurchaseReturn"],
    // }),
getAllPurchaseReturns: builder.query({
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

    return `/purchase-return?${params.toString()}`;
  },

  serializeQueryArgs: ({ queryArgs }) => ({
    search: queryArgs.search,
    fromDate: queryArgs.fromDate,
    toDate: queryArgs.toDate,
  }),

  // merge: (currentCache, newData, { arg }) => {
  //   // First request / filters changed
  //   if (!arg.cursor) {
  //     return newData;
  //   }

  //   // Load next cursor page
  //   currentCache.purchaseReturns.push(
  //     ...newData.purchaseReturns
  //   );

  //   currentCache.hasMore = newData.hasMore;
  //   currentCache.nextCursor = newData.nextCursor;

  //   // Keep totals updated
  //   if (newData.totals) {
  //     currentCache.totals = newData.totals;
  //   }

  //   currentCache.totalReturns =
  //     newData.totalReturns;
  // }
  merge: (currentCache, newData, { arg }) => {
  if (!arg.cursor) return newData;

  const existing = new Set(currentCache.purchaseReturns.map((r) => String(r.id)));
  currentCache.purchaseReturns.push(
    ...newData.purchaseReturns.filter((r) => !existing.has(String(r.id)))
  );

  currentCache.hasMore = newData.hasMore;
  currentCache.nextCursor = newData.nextCursor;
  if (newData.totals) currentCache.totals = newData.totals;
  currentCache.totalReturns = newData.totalReturns;
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
    { type: "PurchaseReturn", id: "LIST" },
  ],
}),
 
    /* GET SINGLE */
    getPurchaseReturnById: builder.query({
      query: (Purchase_Return_Id) => `/purchase-return/${Purchase_Return_Id}`,
      providesTags: (_r, _e, id) => [{ type: "PurchaseReturn", id }],
    }),
 
    /* CREATE */
    // createPurchaseReturn: builder.mutation({
    //   query: ({ Purchase_Id, ...body }) => ({
    //     url: `/purchase-return/${Purchase_Id}`,
    //     method: "POST",
    //     body,
    //   }),
    //   invalidatesTags: ["PurchaseReturn"],
    // }),
    createPurchaseReturn: builder.mutation({
  query: ({ Purchase_Id, ...body }) => ({
    url: Purchase_Id
      ? `/purchase-return/${Purchase_Id}`
      : `/purchase-return`,
    method: "POST",
    body,
  }),
  // create
invalidatesTags: [{ type: "PurchaseReturn", id: "LIST" }],
}),
 
    /* EDIT */
    updatePurchaseReturn: builder.mutation({
      query: ({ Purchase_Return_Id, ...body }) => ({
        url: `/purchase-return/${Purchase_Return_Id}`,
        method: "PUT",
        body,
      }),
      // update
invalidatesTags: (r, e, { Purchase_Return_Id }) => [
  { type: "PurchaseReturn", id: Purchase_Return_Id },
  { type: "PurchaseReturn", id: "LIST" },
],
      //invalidatesTags: ["PurchaseReturn"],
    }),
 
    /* DELETE */
   
// deletePurchaseReturn: builder.mutation({
//   query: (id) => ({
//     url: `/purchase-return/${id}`,
//     method: "DELETE",
//   }),

//   async onQueryStarted(id, { dispatch, queryFulfilled }) {
//     const patchResult = dispatch(
//       purchaseReturnApi.util.updateQueryData(
//         "getAllPurchaseReturns",
//         {
//           cursor: null,
//           search: "",
//           fromDate: "",
//           toDate: "",
//           limit: 10,
//         },
//         (draft) => {
//           if (!draft?.purchaseReturns) return;

//           draft.purchaseReturns =
//             draft.purchaseReturns.filter(
//               (item) => String(item.id) !== String(id)
//             );

//           if (draft.totalReturns != null) {
//             draft.totalReturns = Math.max(
//               0,
//               draft.totalReturns - 1
//             );
//           }
//         }
//       )
//     );

//     try {
//       await queryFulfilled;
//     } catch {
//       patchResult.undo();
//     }
//   },
// }),
deletePurchaseReturn: builder.mutation({
  query: (id) => ({
    url: `/purchase-return/${id}`,
    method: "DELETE",
  }),

  async onQueryStarted(id, { dispatch, queryFulfilled, getState }) {
    const cachedArgs = purchaseReturnApi.util.selectCachedArgsForQuery(
      getState(),
      "getAllPurchaseReturns"
    );

    const patches = cachedArgs.map((args) =>
      dispatch(
        purchaseReturnApi.util.updateQueryData("getAllPurchaseReturns", args, (draft) => {
          if (!draft?.purchaseReturns) return;

          const target = draft.purchaseReturns.find((r) => String(r.id) === String(id));
          if (!target) return;

          // adjust draft.totals here from the row's amount fields

          draft.purchaseReturns = draft.purchaseReturns.filter(
            (r) => String(r.id) !== String(id)
          );

          if (draft.totalReturns != null) {
            draft.totalReturns = Math.max(0, draft.totalReturns - 1);
          }
        })
      )
    );

    try {
      await queryFulfilled;
    } catch {
      patches.forEach((p) => p.undo());
    }
  },

  invalidatesTags: (result, error, id) => [{ type: "PurchaseReturn", id }],
}),
    
    getPurchaseReturnPrintReport: builder.query({
      query: ({
        search = "",
        fromDate = "",
        toDate = "",
      } = {}) => {
        const params = new URLSearchParams();

        if (search) params.append("search", search);
        if (fromDate) params.append("fromDate", fromDate);
        if (toDate) params.append("toDate", toDate);

        return `purchase-return/print-purchase-return-report?${params.toString()}`;
      },
      providesTags: ["PurchaseReturn"],
    })
  }),
});
 
export const {
  useGetAllPurchaseReturnsQuery,
  useGetPurchaseReturnByIdQuery,
  useCreatePurchaseReturnMutation,
  useUpdatePurchaseReturnMutation,
  useDeletePurchaseReturnMutation,
  useLazyGetPurchaseReturnPrintReportQuery
} = purchaseReturnApi;
 