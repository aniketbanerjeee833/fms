import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";



export const itemApi = createApi({
  reducerPath: "itemApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4000/api/",
    credentials: "include",
  }),
  invalidatesTags: ["Item","ItemConversion","ItemLedger"],

  endpoints: (builder) => ({



getAllItems: builder.query({
  query: ({ page, search = "", fromDate = "", toDate = "" } = {}) => {
    const params = new URLSearchParams();

    // ✅ Append only when defined
    if (page) params.append("page", page);
    if (search) params.append("search", search);
    if (fromDate) params.append("fromDate", fromDate);
    if (toDate) params.append("toDate", toDate);

    const queryString = params.toString();
    return queryString
      ? `item/get-all-items?${queryString}`
      : `item/get-all-items`;
  },
  providesTags: ["Item"],
}),

    // ✅ Add a party
    addItem: builder.mutation({
    
      query: ({ body }) => ({
        
        url: `item/add-item`,
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Item", id: "LIST" },
      
      ],
    }),

  editItem: builder.mutation({
  query: ({ body, Item_Id }) => ({
    url: `item/edit-item/${Item_Id}`,
    method: "PATCH",
    body,
  }),
  invalidatesTags: ["Item", "Purchase", "Sale"],
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
      invalidatesTags: ["ItemConversions"],
    }),

   
    getEachItemBillAndInvoiceNumbers: builder.query({
      query: (Item_Id) => `item/each-item-bill-and-invoice-numbers/${Item_Id}`,
      providesTags: ["Item"],
    }),

    addCategory: builder.mutation({
      query: ({ body }) => ({
        url: `item/add-category`,
        method: "POST",
        body,
      }),
     invalidatesTags:["Category"],
    }),

    getAllCategories: builder.query({
        query: () => `item/get-all-categories`,
        providesTags: ["Category"],
    }),
    getEachItemSalesPurchasesDetails: builder.query({
      query: (Item_Id) => `item/each-item-sales-purchase-details/${Item_Id}`,
      providesTags: ["Item"],
    }),

     /* ═══════════════════════════════════════
       ITEMS BY CATEGORY — right side, cursor paginated
       categoryId: "all" for the "All" bucket
    ═══════════════════════════════════════ */
    getItemsByCategory: builder.query({
      query: ({ categoryId, cursor = null, search = "" }) => {
        const params = new URLSearchParams();
        if (cursor) params.set("cursor", cursor);
        if (search?.trim()) params.set("search", search.trim());
        return `items-by-category/${categoryId}?${params.toString()}`;
      },

      // group pages under one cache entry per (categoryId, search) — cursor excluded
      serializeQueryArgs: ({ queryArgs }) => {
        const { categoryId, search } = queryArgs;
        return { categoryId, search };
      },
      merge: (currentCache, newData, { arg }) => {
        if (!arg.cursor) {
          // first page / fresh filter — replace entirely
          return newData;
        }
        currentCache.items.push(...newData.items);
        currentCache.hasMore = newData.hasMore;
        currentCache.nextCursor = newData.nextCursor;
      },
      forceRefetch: ({ currentArg, previousArg }) => currentArg?.cursor !== previousArg?.cursor,

      providesTags: (result, error, arg) => [
        { type: "ItemsByCategory", id: arg.categoryId },
      ],
    }),

  

    getAllItemsForLedger: builder.query({
      query: ({ search = "" } = {}) => ({
        url: "/items/ledger",
        method: "GET",
        params: {
          ...(search && { search }),
        },
      }),

      providesTags: ["Items"],
    }),

    // =====================================================
    // RIGHT SIDE
    // Bills containing selected item
    // =====================================================

  getItemBills: builder.query({
  query: ({
    Item_Id,
    cursor = null,
    search = "",
    date = "",
  }) => {

    const params =
      new URLSearchParams();

    if (cursor) {
      params.set(
        "cursor",
        cursor
      );
    }

    if (search?.trim()) {
      params.set(
        "search",
        search.trim()
      );
    }

    if (date) {
      params.set("date",date);
    }

    return (
      `item/get-item-bills/${Item_Id}` +
      `?${params.toString()}`
    );
  },

  // =====================================================
  // Same item + same filters = same cache.
  //
  // cursor is intentionally excluded.
  // =====================================================

  serializeQueryArgs: ({
    queryArgs,
  }) => {

    const {
      Item_Id,
      search,
      date,
    } = queryArgs;

    return {
      Item_Id,
      search,
      date,
    };
  },

  // =====================================================
  // INFINITE SCROLL MERGE
  // =====================================================

  merge: (
    currentCache,
    newData,
    { arg }
  ) => {

    // First request / changed filter
    if (!arg.cursor) {
      return newData;
    }

    // Next page
    currentCache.transactions.push(
      ...newData.transactions
    );

    currentCache.nextCursor =newData.nextCursor;

    currentCache.hasMore =newData.hasMore;

    // Item master doesn't normally change
    // between pages, but keep latest response.
    if (newData.item) {
      currentCache.item =newData.item;
    }
  },

  // Cursor changed → fetch next page
  forceRefetch: ({
    currentArg,
    previousArg,
  }) =>
    currentArg?.cursor !==previousArg?.cursor,

  providesTags: (
    result,
    error,
    arg
  ) => [
    {
      type: "ItemLedger",
      id: arg.Item_Id,
    },
  ],
}),
      printEachItemSalesPurchasesDetailsReport: builder.mutation({
  query: (payload) => ({
    url: "item/print-each-item-sales-purchases-report",
    method: "POST",
    body: JSON.stringify(payload),   // IMPORTANT
    headers: {
      "Content-Type": "application/json",
    },
    responseHandler: (response) => response.blob(), 
  }),
}),

  

  
   
   
  
  }),
});

 export const {
    useGetAllItemsQuery,
   
    useAddItemMutation,
    useEditItemMutation,
    useGetEachItemBillAndInvoiceNumbersQuery,
    
    useAddCategoryMutation,
    useGetAllCategoriesQuery,
    useGetEachItemSalesPurchasesDetailsQuery,
    usePrintEachItemSalesPurchasesDetailsReportMutation,
    useGetItemConversionsQuery,
    useAddItemConversionMutation,
    useGetItemsByCategoryQuery
 }=itemApi
   
