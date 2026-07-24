import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";








export const dailyExpenseApi = createApi({
  reducerPath: "dailyExpenseApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4000/api/",
    credentials: "include",
  }),
  tagTypes: ["DailyExpense" ],
  endpoints: (builder) => ({
    addDailyExpense: builder.mutation({
        
      query: ({ body }) => ({
        
        url: `daily-expense/add-daily-expense`,
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "DailyExpense", id: "LIST" },
        
      ],
    }), 
    getAllDailyExpenses: builder.query({
   query: ({ page, search = "", fromDate = "", toDate = "" } = {}) => {
    const params = new URLSearchParams();

    // ✅ Append only when defined
    if (page) params.append("page", page);
    if (search) params.append("search", search);
    if (fromDate) params.append("fromDate", fromDate);
    if (toDate) params.append("toDate", toDate);

    const queryString = params.toString();
    return `daily-expense/get-all-daily-expenses?${queryString}`;
  },

    providesTags: [{ type: "DailyExpense", id: "LIST" }],
  }),
editSingleDailyExpense: builder.mutation({
  query: ({ expenseId, body }) => ({
    url: `daily-expense/edit-daily-expense`,
    method: "PATCH",
    body: { expenseId, ...body },    // Include expenseId in payload
  }),
  invalidatesTags: ["DailyExpense"], // simple invalidation to refresh
}),

// getSingleExpenseById: builder.mutation({
//   query: (expenseId) => ({
//     url: "daily-expense/get-single-expense",
//     method: "GET",
//     body: {expenseId},
//   }),
// })
 
})
})
export const { 
  useAddDailyExpenseMutation,useGetAllDailyExpensesQuery,
  useEditSingleDailyExpenseMutation
} = dailyExpenseApi
