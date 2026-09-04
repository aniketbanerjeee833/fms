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

  merge: (currentCache, newData, { arg }) => {
    // First request / filters changed
    if (!arg.cursor) {
      return newData;
    }

    // Load next cursor page
    currentCache.purchaseReturns.push(
      ...newData.purchaseReturns
    );

    currentCache.hasMore = newData.hasMore;
    currentCache.nextCursor = newData.nextCursor;

    // Keep totals updated
    if (newData.totals) {
      currentCache.totals = newData.totals;
    }

    currentCache.totalReturns =
      newData.totalReturns;
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
    // deletePurchaseReturn: builder.mutation({
    //   query: (Purchase_Return_Id) => ({
    //     url: `/purchase-return/${Purchase_Return_Id}`,
    //     method: "DELETE",
    //   }),
    //   invalidatesTags: ["PurchaseReturn"],
    // }),
      deletePurchaseReturn: builder.mutation({
  query: (Purchase_Return_Id) => ({
    url: `/purchase-return/${Purchase_Return_Id}`,
    method: "DELETE",
  }),

  async onQueryStarted(
    Purchase_Return_Id,
    { dispatch, queryFulfilled }
  ) {
    const patchResult = dispatch(
      purchaseReturnApi.util.updateQueryData(
        "getAllPurchaseReturns",
        {
          cursor: null,
          search: "",
          fromDate: "",
          toDate: "",
          limit: 10,
        },
        (draft) => {
          if (!draft?.purchaseReturns) return;

          draft.purchaseReturns =
            draft.purchaseReturns.filter(
              (item) =>
                String(item.id) !==
                String(Purchase_Return_Id)
            );

          if (draft.totalReturns != null) {
            draft.totalReturns = Math.max(
              0,
              draft.totalReturns - 1
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
    { type: "PurchaseReturn", id: "LIST" },
  ],
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
 