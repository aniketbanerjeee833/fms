
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";





export const partyApi = createApi({
  reducerPath: "partyApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4000/api/",
    credentials: "include",
  }),
  tagTypes: ["Party" ],
  endpoints: (builder) => ({


    // // ✅ Get all leads (paginated)
    // getAllLeads: builder.query({
    //   query: ({ userId, page }) => `lead/${userId}?page=${page}`,
    //   providesTags: (result) =>
    //     result && Array.isArray(result.data)
    //       ? [
    //           { type: "Lead", id: "LIST" },
    //           ...result.data.map((lead) => ({ type: "Lead", id: lead.id })),
    //         ]
    //       : [{ type: "Lead", id: "LIST" }],
    // }),

 
    // getAllParties: builder.query({
    //     query: ({page}) => `party/get-all-parties?page=${page}`,
    //     providesTags: ["Party"],
    // }),
 

    // getAllParties: builder.query({
    //   query:(args) => {
    //     const page = args?.page; // optional
    //     return page
    //       ? `party/get-all-parties?page=${page}`
    //       : `party/get-all-parties`; // no pagination param
    //   },
    //   providesTags: ["Party"],
    // }),
    getAllParties: builder.query({
  query: ({ page, search = "" } = {}) => {
    const params = new URLSearchParams();
    if (page) params.append("page", page);
    if (search) params.append("search", search);
    const queryString = params.toString();
    // return `party/get-all-parties?${params.toString()}`;
    return queryString
      ? `party/get-all-parties?${queryString}`
      : `party/get-all-parties`;
  },
  providesTags: ["Party"],
}),

    // ✅ Add a party
    addParty: builder.mutation({
      query: ({ body }) => ({
        url: `party/add-party`,
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Party", id: "LIST" },
      
      ],
    }),

    editParty: builder.mutation({
      query: ({ body, Party_Id }) => ({
        url: `party/edit-party/${Party_Id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { Party_Id }) => [
        { type: "Party", id: Party_Id },
        { type: "Party", id: "LIST" },
      ],
    }),

    getSinglePartyDetailsSalesPurchases: builder.query({
      query: ({Party_Id, page}) => `party/get-single-party-details-sales-purchases/${Party_Id}?page=${page}`,
      providesTags: ["Party"],
    }),

  printSinglePartyDetailsSalesPurchasesReport: builder.mutation({
  query: (payload) => ({
    url: "party/print-single-party-details-sales-purchases-report",
    method: "POST",
    body: JSON.stringify(payload),   // IMPORTANT
    headers: {
      "Content-Type": "application/json",
    },
    responseHandler: (response) => response.blob(), 
  }),
}),

// getAllPartiesReceivablesLeft: builder.query({
//   query: () => `party/all-parties-receivables-left`,
//   providesTags: ["Party"],
// }),

//  getAllSales: builder.query({
//       query: ({ page, search = "", fromDate = "", toDate = "" }) => {
//         const params = new URLSearchParams();
//        params.append("page", page || 1);
//         if (search) params.append("search", search);
//         if (fromDate) params.append("fromDate", fromDate);
//         if (toDate) params.append("toDate", toDate);
//         return `sale/get-all-sales?${params.toString()}`;
//       },
//       providesTags: [{ type: "Sale", id: "LIST" }],
//     }),
 getAllPartiesReceivablesLeft: builder.query({
  query: ({ page, search = "", fromDate = "", toDate = "" } = {}) => {
    const params = new URLSearchParams();
    if (page) params.append("page", page);
    if (search) params.append("search", search);
      if (fromDate) params.append("fromDate", fromDate);
        if (toDate) params.append("toDate", toDate);
    const queryString = params.toString();
    // return `party/get-all-parties?${params.toString()}`;
    return  `party/all-parties-receivables-left?${queryString}`
      
  },
  providesTags: ["Party"],
}),

 getAllPartiesPayablesLeft: builder.query({
  query: ({ page, search = "", fromDate = "", toDate = "" } = {}) => {
    const params = new URLSearchParams();
    if (page) params.append("page", page);
    if (search) params.append("search", search);
      if (fromDate) params.append("fromDate", fromDate);
        if (toDate) params.append("toDate", toDate);
    const queryString = params.toString();
    // return `party/get-all-parties?${params.toString()}`;
    return  `party/all-parties-payables-left?${queryString}`
      
  },
  providesTags: ["Party"],
}),
// getAllPartiesPayablesLeft: builder.query({
//   query: () => `party/all-parties-payables-left`,
//   providesTags: ["Party"],
// }),
    

  

  
   
   
  
  }),
});

 export const {
    useGetAllPartiesQuery,
    useAddPartyMutation,
    useEditPartyMutation,
    useGetSinglePartyDetailsSalesPurchasesQuery,
    usePrintSinglePartyDetailsSalesPurchasesReportMutation,
    useGetAllPartiesReceivablesLeftQuery,useGetAllPartiesPayablesLeftQuery

 }=partyApi
   
