import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";



export const itemApi = createApi({
  reducerPath: "itemApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4000/api/",
    credentials: "include",
  }),
  invalidatesTags: ["Item","ItemConversion"],

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
    useAddItemConversionMutation
 }=itemApi
   
