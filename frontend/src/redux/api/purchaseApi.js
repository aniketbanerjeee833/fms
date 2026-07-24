import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";



// export const purchaseApi = createApi({
//   reducerPath: "purchaseApi",
//   baseQuery: fetchBaseQuery({
//     baseUrl: "http://localhost:4000/api/",
//     credentials: "include",
//   }),
//   tagTypes: ["Purchase" ],
//   endpoints: (builder) => ({


    
 
 
//     // ✅ Add a party
//     addPurchase: builder.mutation({
    
//       query: ({ body }) => ({
        
//         url: `purchase/add-purchase`,
//         method: "POST",
//         body,
//       }),
//       invalidatesTags: [
//         { type: "Purchase", id: "LIST" },
      
//       ],
//     }),
//   editPurchase: builder.mutation({
//       query: ({ body,Purchase_Id }) => ({
        
//         url: `purchase/edit-purchase/${Purchase_Id}`,
//         method: "PUT",
//         body,
//       }),
//       invalidatesTags: [
//         { type: "Purchase", id: "LIST" },
      
//       ],
//     }),

//    getAllPurchases: builder.query({
//   query: ({ page, search = "", fromDate = "", toDate = "" }) => {
//     const params = new URLSearchParams();

//     params.append("page", page); // always present
//     if (search) params.append("search", search);
//     if (fromDate) params.append("fromDate", fromDate);
//     if (toDate) params.append("toDate", toDate);

//     return `purchase/get-all-purchases?${params.toString()}`;
//   },
//   providesTags: [{ type: "Purchase", id: "LIST" }],
// }),

//       getSinglePurchase: builder.query({
//         query: (Purchase_Id) => `purchase/get-single-purchase/${Purchase_Id}`,
//         providesTags: [{
//           type: "Purchase",
//           id: "LIST"
//         }],
//       }),
  
//       getTotalPurchasesEachDay: builder.query({
//         query: () => `purchase/total-purchases-by-day`,
//         providesTags: [{ type: "Purchase", id: "LIST" }],
//       })

  
   
   
  
//   }),
// });
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

    getAllPurchases: builder.query({
      query: ({ page, search = "", fromDate = "", toDate = "" }) => {
        const params = new URLSearchParams();
     params.append("page", page || 1);
        if (search) params.append("search", search);
        if (fromDate) params.append("fromDate", fromDate);
        if (toDate) params.append("toDate", toDate);
        return `purchase/get-all-purchases?${params.toString()}`;
      },
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
    })

  }),
});

 export const {
   
    useAddPurchaseMutation,
    useEditPurchaseMutation,
    useGetAllPurchasesQuery,
    useGetSinglePurchaseQuery,
    useGetTotalPurchasesEachDayQuery,
    useUploadPurchaseBillMutation
 }=purchaseApi
   
