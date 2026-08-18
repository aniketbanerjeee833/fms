// import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";



// export const miscellaneousApi = createApi({
//   reducerPath: "miscellaneousApi",
//   baseQuery: fetchBaseQuery({
//     baseUrl: "http://localhost:4000/api/misc/",
//     credentials: "include",
//   }),
//   invalidatesTags: ["Unit"],

//   endpoints: (builder) => ({



// getAllItemUnits: builder.query({
 
//   query: () => {
//     return `unit/get-all-units`;
   
//   },
//   providesTags: ["Unit"],
// }),

//     // ✅ Add a party
//     addItemUnit: builder.mutation({
    
//       query: ( body ) => ({
        
//         url: `unit/add-unit`,
//         method: "POST",
//         body,
//       }),
//    invalidatesTags: ["Unit"],
//     }),

// //   editItem: builder.mutation({
// //   query: ({ body, Item_Id }) => ({
// //     url: `item/edit-item/${Item_Id}`,
// //     method: "PATCH",
// //     body,
// //   }),
// //   invalidatesTags: ["Item", "Purchase", "Sale"],
// // }),

   
 
  

  
   
   
  
//   }),
// });


// export const { useGetAllItemUnitsQuery, useAddItemUnitMutation } = miscellaneousApi;