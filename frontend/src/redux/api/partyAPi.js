
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";





export const partyApi = createApi({
  reducerPath: "partyApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4000/api/",
    credentials: "include",
  }),
 tagTypes: ["Party", "PartyLedger"],
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

getAllPartiesCursor: builder.query({
      query: ({ cursor = null, search = "", limit = 10 } = {}) => {
        const params = new URLSearchParams();
        if (cursor)        params.append("cursor", cursor);
        if (search?.trim()) params.append("search", search.trim());
        params.append("limit", limit);
        return `party/cursor?${params.toString()}`;  // adjust route to match yours
      },
 
      // Cache key = search term only — different cursors for the SAME search
      // merge into the same cache entry
      serializeQueryArgs: ({ queryArgs }) => ({
        search: queryArgs.search ?? "",
      }),
 
      // Merge incoming page into existing cache
      merge: (currentCache, newData, { arg }) => {
        if (!arg.cursor) {
          // First page (no cursor) — replace entirely
          return newData;
        }
        // Subsequent pages — append
        currentCache.parties.push(...newData.parties);
        currentCache.hasMore    = newData.hasMore;
        currentCache.nextCursor = newData.nextCursor;
      },
 
      // Re-fetch when cursor or search changes
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.cursor !== previousArg?.cursor ||
        currentArg?.search !== previousArg?.search,
 
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

    // getSinglePartyDetailsSalesPurchases: builder.query({
    //   query: ({Party_Id, page}) => `party/get-single-party-details-sales-purchases/${Party_Id}?page=${page}`,
    //   providesTags: ["Party"],
    // }),
    getSinglePartyDetailsSalesPurchases: builder.query({
  query: ({
    Party_Id,
    cursor = null,
    search = "",
    date = "",
  }) => {
    const params = new URLSearchParams();

    if (cursor) {
      params.set("cursor", cursor);
    }

    if (search?.trim()) {
      params.set("search", search.trim());
    }

    if (date) {
      params.set("date", date);
    }

    return `party/get-single-party-details-sales-purchases/${Party_Id}?${params.toString()}`;
  },

  // merge pages for infinite scroll
  serializeQueryArgs: ({ queryArgs }) => {
    const { Party_Id, search, date } = queryArgs;
    return { Party_Id, search, date }; // cursor excluded — same cache entry across pages
  },
  merge: (currentCache, newData, { arg }) => {
    if (!arg.cursor) {
      // first page / fresh filter — replace
      return newData;
    }
    // subsequent pages — append
    currentCache.transactions.push(...newData.transactions);
    currentCache.nextCursor = newData.nextCursor;
    currentCache.hasMore = newData.hasMore;
  },
  //forceRefetch: ({ currentArg, previousArg }) => currentArg?.cursor !== previousArg?.cursor,
forceRefetch: ({
  currentArg,
  previousArg,
}) =>
  currentArg?.cursor !== previousArg?.cursor ||
  currentArg?.search !== previousArg?.search ||
  currentArg?.date !== previousArg?.date ||
  currentArg?.Party_Id !== previousArg?.Party_Id,
  //providesTags: ["Party"],
  providesTags: (result, error, arg) => [
 {
      type: "PartyLedger",
      id: arg.Party_Id,
    },
],
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
    

//   getAllPayableParties: builder.query({
//    query: ({ search = "" } = {}) => {
//     const params = new URLSearchParams();

//     if (search) {
//       params.set("search", search);
//     }

//     return `/party/payables?${params.toString()}`;
//   },

//     providesTags: ["Party"],
// }),
getAllPayableParties: builder.query({
  query: ({
    cursor = null,
    search = "",
    limit = 10,
  } = {}) => {
    const params = new URLSearchParams();

    if (cursor) {
      params.append("cursor", cursor);
    }

    if (search?.trim()) {
      params.append(
        "search",
        search.trim()
      );
    }

    params.append("limit", limit);

    return `party/payables?${params.toString()}`;
  },

  serializeQueryArgs: ({
    queryArgs,
  }) => ({
    search: queryArgs.search ?? "",
  }),

  merge: (
    currentCache,
    newData,
    { arg }
  ) => {
    if (!arg.cursor) {
      return newData;
    }

    currentCache.parties.push(
      ...newData.parties
    );

    currentCache.hasMore =
      newData.hasMore;

    currentCache.nextCursor =
      newData.nextCursor;

    currentCache.totalParties =
      newData.totalParties;
  },

  forceRefetch: ({
    currentArg,
    previousArg,
  }) =>
    currentArg?.cursor !==
      previousArg?.cursor ||
    currentArg?.search !==
      previousArg?.search,
  providesTags: ["Party"],
  // providesTags: [
  //   {
  //     type: "Party",
  //     id: "PAYABLE_LIST",
  //   },
  // ],
}),
getAllReceivableParties: builder.query({
  query: ({
    cursor = null,
    search = "",
    limit = 10,
  } = {}) => {
    const params = new URLSearchParams();

    if (cursor) {
      params.append("cursor", cursor);
    }

    if (search?.trim()) {
      params.append(
        "search",
        search.trim()
      );
    }

    params.append("limit", limit);

    return `party/receivables?${params.toString()}`;
  },

  serializeQueryArgs: ({
    queryArgs,
  }) => ({
    search: queryArgs.search ?? "",
  }),

  merge: (
    currentCache,
    newData,
    { arg }
  ) => {
    if (!arg.cursor) {
      return newData;
    }

    currentCache.parties.push(
      ...newData.parties
    );

    currentCache.hasMore =
      newData.hasMore;

    currentCache.nextCursor =
      newData.nextCursor;

    currentCache.totalParties =
      newData.totalParties;
  },

  forceRefetch: ({
    currentArg,
    previousArg,
  }) =>
    currentArg?.cursor !==
      previousArg?.cursor ||
    currentArg?.search !==
      previousArg?.search,

  providesTags: ["Party"],
}),
  getPartyPrintReport: builder.query({
  query: ({
    Party_Id,
    search,
   
  }) => {
    const params = new URLSearchParams();

    if (search?.trim()) {
      params.append(
        "search",
        search.trim()
      );
    }

    // if (date) {
    //   params.append("date", date);
    // }

    return {
      url: `/party/print-report/${Party_Id}?${params.toString()}`,
      method: "GET",
    };
  },
}),
   
   
  
  }),
});

 export const {
    useGetAllPartiesQuery,
    useAddPartyMutation,
    useEditPartyMutation,
    useGetSinglePartyDetailsSalesPurchasesQuery,
    usePrintSinglePartyDetailsSalesPurchasesReportMutation,
    useGetAllPartiesReceivablesLeftQuery,useGetAllPartiesPayablesLeftQuery,
    useGetAllPayablePartiesQuery,
    useGetAllReceivablePartiesQuery,
    useGetAllPartiesCursorQuery,
    useLazyGetPartyPrintReportQuery

 }=partyApi
   
