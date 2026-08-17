// import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";




// export const itemApi = createApi({
//   reducerPath: "itemApi",
//   baseQuery: fetchBaseQuery({
//     baseUrl: "http://localhost:4000/api/",
//     credentials: "include",
//   }),
//   tagTypes: [
//     "Item",
//     "ItemConversion",
//     "ItemLedger",
//     "ItemConversions",
//     "ItemsByCategory",
//     "Items",
//     "Category",
//   ],

//   endpoints: (builder) => ({



//     getAllItems: builder.query({
//       query: ({ page, search = "", fromDate = "", toDate = "" } = {}) => {
//         const params = new URLSearchParams();

//         // ✅ Append only when defined
//         if (page) params.append("page", page);
//         if (search) params.append("search", search);
//         if (fromDate) params.append("fromDate", fromDate);
//         if (toDate) params.append("toDate", toDate);

//         const queryString = params.toString();
//         return queryString
//           ? `item/get-all-items?${queryString}`
//           : `item/get-all-items`;
//       },
//       providesTags: ["Item"],
//     }),

//     // ✅ Add a party
//     addItem: builder.mutation({

//       query: ({ body }) => ({

//         url: `item/add-item`,
//         method: "POST",
//         body,
//       }),
//       invalidatesTags: [
//         { type: "Item", id: "LIST" },

//       ],
//     }),

//     editItem: builder.mutation({
//       query: ({ body, Item_Id }) => ({
//         url: `item/edit-item/${Item_Id}`,
//         method: "PATCH",
//         body,
//       }),
//       invalidatesTags: ["Item"],
//     }),

//     deleteItem: builder.mutation({
//       query: (Item_Id) => ({
//         url: `item/delete-item/${Item_Id}`,
//         method: "DELETE",
//       }),
//       invalidatesTags: ["Item"],
//     }),
//     getItemConversions: builder.query({
//       query: (Item_Id) => `/item/item-conversions/${Item_Id}`,
//       transformResponse: (res) => res.conversions,
//       providesTags: ["ItemConversions"],
//     }),

//     addItemConversion: builder.mutation({
//       query: (body) => ({
//         url: "/item/item-conversions",
//         method: "POST",
//         body,
//       }),
//       invalidatesTags: ["ItemConversions"],
//     }),


//     getEachItemBillAndInvoiceNumbers: builder.query({
//       query: (Item_Id) => `item/each-item-bill-and-invoice-numbers/${Item_Id}`,
//       providesTags: ["Item"],
//     }),

//     addCategory: builder.mutation({
//       query: ({ body }) => ({
//         url: `item/add-category`,
//         method: "POST",
//         body,
//       }),
//       invalidatesTags: ["Category"],
//     }),

//     getAllCategories: builder.query({
//       query: () => `item/get-all-categories`,
//       providesTags: ["Category"],
//     }),
//     getEachItemSalesPurchasesDetails: builder.query({
//       query: (Item_Id) => `item/each-item-sales-purchase-details/${Item_Id}`,
//       providesTags: ["Item"],
//     }),


//     getAllCategoriesCursor: builder.query({
//       query: ({ cursor = null, search = "", limit = 10 } = {}) => {
//         const params = new URLSearchParams();
//         if (cursor) params.append("cursor", cursor);
//         if (search?.trim()) params.append("search", search.trim());
//         params.append("limit", limit);
//         return `item/get-all-categories/cursor?${params.toString()}`;
//       },

//       serializeQueryArgs: ({ queryArgs }) => ({
//         search: queryArgs.search ?? "",
//       }),

//       merge: (currentCache, newData, { arg }) => {
//         if (!arg.cursor) {
//           return newData;
//         }
//         currentCache.categories.push(...newData.categories);
//         currentCache.hasMore = newData.hasMore;
//         currentCache.nextCursor = newData.nextCursor;
//       },

//       forceRefetch: ({ currentArg, previousArg }) =>
//         currentArg?.cursor !== previousArg?.cursor ||
//         currentArg?.search !== previousArg?.search,

//       providesTags: ["Category"],
//     }),

//     /* ═══════════════════════════════════════
//       ITEMS BY CATEGORY — right side, cursor paginated
//       categoryId: "all" for the "All" bucket
//    ═══════════════════════════════════════ */
   


//     // getAllItemsForLedger: builder.query({
//     //   query: ({ search = "" } = {}) => ({
//     //     url: "/item/ledger",
//     //     method: "GET",
//     //     params: {
//     //       ...(search && { search }),
//     //     },
//     //   }),

//     //   providesTags: ["Item"],
//     // }),

//     // =====================================================
//     // RIGHT SIDE
//     // Bills containing selected item
//     // =====================================================
//     getItemsByCategory: builder.query({
//   query: ({ categoryId, cursor = null, search = "" }) => {
//     const params = new URLSearchParams();

//     if (cursor) params.set("cursor", cursor);
//     if (search?.trim()) params.set("search", search.trim());

//     return `item/items-by-category/${categoryId}?${params.toString()}`;
//   },

//   serializeQueryArgs: ({ queryArgs }) => {
//     const { categoryId, search } = queryArgs;
//     return { categoryId, search };
//   },

//   merge: (currentCache, newData, { arg }) => {
//     if (!arg.cursor) {
//       return newData;
//     }

//     currentCache.items.push(...newData.items);
//     currentCache.hasMore = newData.hasMore;
//     currentCache.nextCursor = newData.nextCursor;
//   },

//   forceRefetch: ({ currentArg, previousArg }) =>
//     currentArg?.cursor !== previousArg?.cursor ||
//     currentArg?.categoryId !== previousArg?.categoryId ||
//     currentArg?.search !== previousArg?.search,

//   // providesTags: (result, error, arg) => [
//   //   { type: "ItemsByCategory", id: arg.categoryId },
//   // ],
//   providesTags: ["Item"]
// }),
    
//     getAllItemsForLedger: builder.query({
//       query: ({ cursor = null, search = "", limit = 10 }) => {
//         const params = new URLSearchParams();

//         if (cursor) params.append("cursor", cursor);
//         if (search?.trim()) params.append("search", search.trim());
//         params.append("limit", limit);

//         return `item/ledger?${params.toString()}`;
//       },

//       serializeQueryArgs: ({ queryArgs }) => ({
//         search: queryArgs.search,
//       }),

//       merge: (currentCache, newData, { arg }) => {
//         if (!arg.cursor) {
//           return newData;
//         }

//         currentCache.items.push(...newData.items);
//         currentCache.hasMore = newData.hasMore;
//         currentCache.nextCursor = newData.nextCursor;
//       },

//       forceRefetch: ({ currentArg, previousArg }) =>
//         currentArg?.cursor !== previousArg?.cursor ||
//         currentArg?.search !== previousArg?.search,

//       providesTags: ["ItemLedger"],
//     }),
//     getItemBills: builder.query({
//       query: ({
//         Item_Id,
//         cursor = null,
//         search = "",
//         date = "",
//       }) => {

//         const params =
//           new URLSearchParams();

//         if (cursor) {
//           params.set(
//             "cursor",
//             cursor
//           );
//         }

//         if (search?.trim()) {
//           params.set(
//             "search",
//             search.trim()
//           );
//         }

//         if (date) {
//           params.set("date", date);
//         }

//         return (
//           `item/${Item_Id}/bills` +
//           `?${params.toString()}`
//         );
//       },

//       // =====================================================
//       // Same item + same filters = same cache.
//       //
//       // cursor is intentionally excluded.
//       // =====================================================

//       serializeQueryArgs: ({
//         queryArgs,
//       }) => {

//         const {
//           Item_Id,
//           search,
//           date,
//         } = queryArgs;

//         return {
//           Item_Id,
//           search,
//           date,
//         };
//       },

//       // =====================================================
//       // INFINITE SCROLL MERGE
//       // =====================================================

//       merge: (
//         currentCache,
//         newData,
//         { arg }
//       ) => {

//         // First request / changed filter
//         if (!arg.cursor) {
//           return newData;
//         }

//         // Next page
//         currentCache.transactions.push(
//           ...newData.transactions
//         );

//         currentCache.nextCursor = newData.nextCursor;

//         currentCache.hasMore = newData.hasMore;

//         // Item master doesn't normally change
//         // between pages, but keep latest response.
//         if (newData.item) {
//           currentCache.item = newData.item;
//         }
//       },

//       // Cursor changed → fetch next page
//       // forceRefetch: ({
//       //   currentArg,
//       //   previousArg,
//       // }) =>
//       //   currentArg?.cursor !== previousArg?.cursor,
//       forceRefetch: ({
//         currentArg,
//         previousArg,
//       }) =>
//         currentArg?.cursor !== previousArg?.cursor ||
//         currentArg?.search !== previousArg?.search ||
//         currentArg?.date !== previousArg?.date ||
//         currentArg?.Item_Id !== previousArg?.Item_Id,

//       providesTags: (
//         result,
//         error,
//         arg
//       ) => [
//           {
//             type: "ItemLedger",
//             id: arg.Item_Id,
//           },
//         ],
//     }),
//     printEachItemSalesPurchasesDetailsReport: builder.mutation({
//       query: (payload) => ({
//         url: "item/print-each-item-sales-purchases-report",
//         method: "POST",
//         body: JSON.stringify(payload),   // IMPORTANT
//         headers: {
//           "Content-Type": "application/json",
//         },
//         responseHandler: (response) => response.blob(),
//       }),
//     }),

//     // addStockAdjustment: builder.mutation({
//     //   query: (body) => ({
//     //     url: "/item/stock-adjustment/add",
//     //     method: "POST",
//     //     body,
//     //   }),
//     //   invalidatesTags: ["Item","ItemLedger"],
//     // }),
//     // editStockAdjustment: builder.mutation({
//     //   query: ({ id, ...body }) => ({
//     //     url: `/item/stock-adjustment/${id}`,
//     //     method: "PUT",
//     //     body,
//     //   }),
//     //   invalidatesTags: ["Item","ItemLedger"],
//     // }),

//     //   deleteStockAdjustment: builder.mutation({
//     //   query: (id) => ({
//     //     url: `/item/stock-adjustment/${id}`,
//     //     method: "DELETE",
//     //   }),
//     //   invalidatesTags: ["Item", "ItemLedger"],
//     // }),
//     addStockAdjustment: builder.mutation({
//       query: (body) => ({
//         url: "/item/stock-adjustment/add",
//         method: "POST",
//         body,
//       }),
//       invalidatesTags: (result, error, arg) => [
//         "Item",
//         { type: "ItemLedger", id: arg.Item_Id },
//       ],
//     }),

//     editStockAdjustment: builder.mutation({
//       query: ({ id, ...body }) => ({
//         url: `/item/stock-adjustment/${id}`,
//         method: "PUT",
//         body,
//       }),
//       invalidatesTags: (result, error, arg) => [
//         "Item",
//         { type: "ItemLedger", id: arg.Item_Id },
//       ],
//     }),

//     deleteStockAdjustment: builder.mutation({
//       query: (id) => ({
//         url: `/item/stock-adjustment/${id}`,
//         method: "DELETE",
//       }),
//       invalidatesTags: (result, error, payload) => [
//         "Item",
//         { type: "ItemLedger", id: payload.Item_Id },
//       ],
//     }),




//   }),
// });

// export const {
//   useGetAllItemsQuery,

//   useAddItemMutation,
//   useEditItemMutation,
//   useDeleteItemMutation,
//   useGetEachItemBillAndInvoiceNumbersQuery,

//   useAddCategoryMutation,
//   useGetAllCategoriesQuery,
//   useGetAllCategoriesCursorQuery,
//   useGetEachItemSalesPurchasesDetailsQuery,
//   usePrintEachItemSalesPurchasesDetailsReportMutation,
//   useGetItemConversionsQuery,
//   useAddItemConversionMutation,
//   useGetItemsByCategoryQuery,
//   useGetItemBillsQuery,
//   useGetAllItemsForLedgerQuery,
//   useAddStockAdjustmentMutation,
//   useEditStockAdjustmentMutation,
//   useDeleteStockAdjustmentMutation,
// } = itemApi




//  // getItemsByCategory: builder.query({
//     //   query: ({ categoryId, cursor = null, search = "" }) => {
//     //     const params = new URLSearchParams();
//     //     if (cursor) params.set("cursor", cursor);
//     //     if (search?.trim()) params.set("search", search.trim());
//     //     return `item/items-by-category/${categoryId}?${params.toString()}`;
//     //   },

//     //   // group pages under one cache entry per (categoryId, search) — cursor excluded
//     //   serializeQueryArgs: ({ queryArgs }) => {
//     //     const { categoryId, search } = queryArgs;
//     //     return { categoryId, search };
//     //   },
//     //   merge: (currentCache, newData, { arg }) => {
//     //     if (!arg.cursor) {
//     //       // first page / fresh filter — replace entirely
//     //       return newData;
//     //     }
//     //     currentCache.items.push(...newData.items);
//     //     currentCache.hasMore = newData.hasMore;
//     //     currentCache.nextCursor = newData.nextCursor;
//     //   },
//     //   forceRefetch: ({ currentArg, previousArg }) => currentArg?.cursor !== previousArg?.cursor,

//     //   providesTags: (result, error, arg) => [
//     //     { type: "ItemsByCategory", id: arg.categoryId },
//     //   ],
//     // }),


import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const itemApi = createApi({
  reducerPath: "itemApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4000/api/",
    credentials: "include",
  }),
  tagTypes: [
    "Item",
    "ItemConversion",
    "ItemLedger",
    "ItemConversions",
    "ItemsByCategory",
    "Items",
    "Category",
  ],

  endpoints: (builder) => ({

    getAllItems: builder.query({
      query: ({ page, search = "", fromDate = "", toDate = "" } = {}) => {
        const params = new URLSearchParams();
        if (page) params.append("page", page);
        if (search) params.append("search", search);
        if (fromDate) params.append("fromDate", fromDate);
        if (toDate) params.append("toDate", toDate);

        const queryString = params.toString();
        return queryString
          ? `item/get-all-items?${queryString}`
          : `item/get-all-items`;
      },
      /* ✅ FIX 1 — scoped to LIST id, matches your invalidation bundle */
      providesTags: [{ type: "Item", id: "LIST" }],
    }),

    addItem: builder.mutation({
      query: ({ body }) => ({
        url: `item/add-item`,
        method: "POST",
        body,
      }),
      /* ✅ FIX 2 — added ItemsByCategory + ItemLedger so category view
         and ledger view also refresh when a brand-new item is created */
      invalidatesTags: [
        { type: "Item", id: "LIST" },
        { type: "ItemsByCategory", id: "LIST" },
        { type: "ItemLedger", id: "LIST" },
      ],
    }),

    editItem: builder.mutation({
      query: ({ body, Item_Id }) => ({
        url: `item/edit-item/${Item_Id}`,
        method: "PATCH",
        body,
      }),
      /* ✅ FIX 2 — same bundle */
      invalidatesTags: [
        { type: "Item", id: "LIST" },
        { type: "ItemsByCategory", id: "LIST" },
        { type: "ItemLedger", id: "LIST" },
      ],
    }),

    deleteItem: builder.mutation({
      query: (Item_Id) => ({
        url: `item/delete-item/${Item_Id}`,
        method: "DELETE",
      }),
      /* ✅ FIX 2 — same bundle */
      invalidatesTags: [
        { type: "Item", id: "LIST" },
        { type: "ItemsByCategory", id: "LIST" },
        { type: "ItemLedger", id: "LIST" },
      ],
    }),

    getItemConversions: builder.query({
      query: (Item_Id) => `/item/item-conversions/${Item_Id}`,
      transformResponse: (res) => res.conversions,
      providesTags: ["ItemConversions"],
    }),

    addItemConversion: builder.mutation({
      query: (body) => ({
        url: "/item/item-conversions",
        method: "POST",
        body,
      }),
      /* left as-is — conversions don't affect stock/category views directly */
      invalidatesTags: ["ItemConversions"],
    }),

    getEachItemBillAndInvoiceNumbers: builder.query({
      query: (Item_Id) => `item/each-item-bill-and-invoice-numbers/${Item_Id}`,
      /* ✅ FIX 3 — scoped by Item_Id instead of blanket "Item" */
      providesTags: (result, error, Item_Id) => [{ type: "Item", id: Item_Id }],
    }),

    addCategory: builder.mutation({
      query: ({ body }) => ({
        url: `item/add-category`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Category"],
    }),

    editCategory: builder.mutation({
      query: ({ categoryId, body }) => ({
         url: `item/edit-category/${categoryId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Category"],
    }),

    getAllCategories: builder.query({
      query: () => `item/get-all-categories`,
      providesTags: ["Category"],
    }),

    getEachItemSalesPurchasesDetails: builder.query({
      query: (Item_Id) => `item/each-item-sales-purchase-details/${Item_Id}`,
      /* ✅ FIX 3 — scoped by Item_Id instead of blanket "Item" */
      providesTags: (result, error, Item_Id) => [{ type: "Item", id: Item_Id }],
    }),

    getAllCategoriesCursor: builder.query({
      query: ({ cursor = null, search = "", limit = 10 } = {}) => {
        const params = new URLSearchParams();
        if (cursor) params.append("cursor", cursor);
        if (search?.trim()) params.append("search", search.trim());
        params.append("limit", limit);
        return `item/get-all-categories/cursor?${params.toString()}`;
      },
      serializeQueryArgs: ({ queryArgs }) => ({
        search: queryArgs.search ?? "",
      }),
      merge: (currentCache, newData, { arg }) => {
        if (!arg.cursor) {
          return newData;
        }
        currentCache.categories.push(...newData.categories);
        currentCache.hasMore = newData.hasMore;
        currentCache.nextCursor = newData.nextCursor;
      },
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.cursor !== previousArg?.cursor ||
        currentArg?.search !== previousArg?.search,
      providesTags: ["Category"],
    }),

  // categoryApi.js

getItemsNotInCategory: builder.query({
  query: (Category_Id) => ({
    url: `/item/available-items/${Category_Id}`,
    method: "GET",
  }),
  providesTags: ["Item"],
}),
moveItemsToCategory: builder.mutation({
  query: (body) => ({
    url: "/item/move-items-to-category",
    method: "PUT",
    body,
  }),
    invalidatesTags: [
    { type: "Item", id: "LIST" },
    { type: "ItemsByCategory", id: "LIST" }
  ],
}),
    getItemsByCategory: builder.query({
      query: ({ categoryId, cursor = null, search = "" }) => {
        const params = new URLSearchParams();
        if (cursor) params.set("cursor", cursor);
        if (search?.trim()) params.set("search", search.trim());
        return `item/items-by-category/${categoryId}?${params.toString()}`;
      },
      serializeQueryArgs: ({ queryArgs }) => {
        const { categoryId, search } = queryArgs;
        return { categoryId, search };
      },
      merge: (currentCache, newData, { arg }) => {
        if (!arg.cursor) {
          return newData;
        }
        currentCache.items.push(...newData.items);
        currentCache.hasMore = newData.hasMore;
        currentCache.nextCursor = newData.nextCursor;
      },
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.cursor !== previousArg?.cursor ||
        currentArg?.categoryId !== previousArg?.categoryId ||
        currentArg?.search !== previousArg?.search,

      /* ✅ FIX 4 — THE MAIN FIX YOU ASKED ABOUT
         was: providesTags: ["Item"]  ← too broad, ANY item change anywhere
         resets this cursor-paginated list back to page 1.
         now: scoped per-category + a LIST catch-all for bulk invalidation */
      providesTags: (result, error, arg) => [
        { type: "ItemsByCategory", id: arg.categoryId },
        { type: "ItemsByCategory", id: "LIST" },
      ],
    }),

    getAllItemsForLedger: builder.query({
      query: ({ cursor = null, search = "", limit = 10 }) => {
        const params = new URLSearchParams();
        if (cursor) params.append("cursor", cursor);
        if (search?.trim()) params.append("search", search.trim());
        params.append("limit", limit);
        return `item/ledger?${params.toString()}`;
      },
      serializeQueryArgs: ({ queryArgs }) => ({
        search: queryArgs.search,
      }),
      merge: (currentCache, newData, { arg }) => {
        if (!arg.cursor) {
          return newData;
        }
        currentCache.items.push(...newData.items);
        currentCache.hasMore = newData.hasMore;
        currentCache.nextCursor = newData.nextCursor;
      },
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.cursor !== previousArg?.cursor ||
        currentArg?.search !== previousArg?.search,
      /* already correctly scoped — matches your invalidation bundle's
         { type: "ItemLedger", id: "LIST" } */
      providesTags: [{ type: "ItemLedger", id: "LIST" }],
    }),

    getItemBills: builder.query({
      query: ({ Item_Id, cursor = null, search = "", date = "" }) => {
        const params = new URLSearchParams();
        if (cursor) params.set("cursor", cursor);
        if (search?.trim()) params.set("search", search.trim());
        if (date) params.set("date", date);
        return `item/${Item_Id}/bills?${params.toString()}`;
      },
      serializeQueryArgs: ({ queryArgs }) => {
        const { Item_Id, search, date } = queryArgs;
        return { Item_Id, search, date };
      },
      merge: (currentCache, newData, { arg }) => {
        if (!arg.cursor) {
          return newData;
        }
        currentCache.transactions.push(...newData.transactions);
        currentCache.nextCursor = newData.nextCursor;
        currentCache.hasMore = newData.hasMore;
        if (newData.item) {
          currentCache.item = newData.item;
        }
      },
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.cursor !== previousArg?.cursor ||
        currentArg?.search !== previousArg?.search ||
        currentArg?.date !== previousArg?.date ||
        currentArg?.Item_Id !== previousArg?.Item_Id,
      /* already correctly scoped by Item_Id — no change needed */
      providesTags: (result, error, arg) => [
        { type: "ItemLedger", id: arg.Item_Id },
      ],
    }),

    printEachItemSalesPurchasesDetailsReport: builder.mutation({
      query: (payload) => ({
        url: "item/print-each-item-sales-purchases-report",
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
        responseHandler: (response) => response.blob(),
      }),
    }),

    addStockAdjustment: builder.mutation({
      query: (body) => ({
        url: "/item/stock-adjustment/add",
        method: "POST",
        body,
      }),
      /* ✅ FIX 2 — added ItemsByCategory so category view refreshes too */
      invalidatesTags: (result, error, arg) => [
        { type: "Item", id: "LIST" },
        { type: "ItemsByCategory", id: "LIST" },
        { type: "ItemLedger", id: "LIST" },
        { type: "ItemLedger", id: arg.Item_Id },
      ],
    }),

    editStockAdjustment: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/item/stock-adjustment/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Item", id: "LIST" },
        { type: "ItemsByCategory", id: "LIST" },
        { type: "ItemLedger", id: "LIST" },
        { type: "ItemLedger", id: arg.Item_Id },
      ],
    }),

    deleteStockAdjustment: builder.mutation({
      query: (id) => ({
        url: `/item/stock-adjustment/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, payload) => [
        { type: "Item", id: "LIST" },
        { type: "ItemsByCategory", id: "LIST" },
        { type: "ItemLedger", id: "LIST" },
        { type: "ItemLedger", id: payload.Item_Id },
      ],
    }),

  }),
});

export const {
  useGetAllItemsQuery,
  useAddItemMutation,
  useEditItemMutation,
  useDeleteItemMutation,
  useGetEachItemBillAndInvoiceNumbersQuery,
  useAddCategoryMutation,
  useEditCategoryMutation,
  useGetAllCategoriesQuery,
  useGetItemsNotInCategoryQuery,
  useMoveItemsToCategoryMutation,
  useGetAllCategoriesCursorQuery,
  useGetEachItemSalesPurchasesDetailsQuery,
  usePrintEachItemSalesPurchasesDetailsReportMutation,
  useGetItemConversionsQuery,
  useAddItemConversionMutation,
  useGetItemsByCategoryQuery,
  useGetItemBillsQuery,
  useGetAllItemsForLedgerQuery,
  useAddStockAdjustmentMutation,
  useEditStockAdjustmentMutation,
  useDeleteStockAdjustmentMutation,
} = itemApi;