import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const expenseApi = createApi({
  reducerPath: "expenseApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4000/api/",
    credentials: "include",
  }),
  tagTypes: ["Expense", "ExpenseCategory"],
  endpoints: (builder) => ({
    createExpenseCategory: builder.mutation({
      query: ({ body }) => ({
        url: "expense-category/",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "ExpenseCategory", id: "LIST" }],
    }),

    editExpenseCategory: builder.mutation({
      query: ({ id, body }) => ({
        url: `expense-category/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: [{ type: "ExpenseCategory", id: "LIST" }],
    }),

    getAllExpenseCategories: builder.query({
      query: () => "expense-category/",
      providesTags: [{ type: "ExpenseCategory", id: "LIST" }],
    }),

    createExpense: builder.mutation({
      query: ({ body }) => ({
        url: "expense/",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Expense", id: "LIST" }],
    }),

    editExpense: builder.mutation({
      query: ({ id, body }) => ({
        url: `expense/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: [{ type: "Expense", id: "LIST" }],
    }),

    getExpenseById: builder.query({
      query: (id) => `expense/${id}`,
      providesTags: (result, error, id) => [{ type: "Expense", id }],
    }),

    getExpensesByCategory: builder.query({
      query: ({ categoryId, lastId, search = "", fromDate = "", toDate = "" }) => {
        const params = new URLSearchParams();
        if (lastId) params.append("lastId", lastId);
        if (search) params.append("search", search);
        if (fromDate) params.append("fromDate", fromDate);
        if (toDate) params.append("toDate", toDate);
        const queryString = params.toString();
        return `expense/by-category/${categoryId}${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: [{ type: "Expense", id: "LIST" }],
    }),

    getDistinctExpenseItems: builder.query({
      query: ({ search = "" } = {}) => {
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        const queryString = params.toString();
        return `expense/items${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: [{ type: "Expense", id: "ITEMS" }],
    }),

    getExpenseItemUsage: builder.query({
      query: ({ itemName, lastId }) => {
        const params = new URLSearchParams();
        if (itemName) params.append("itemName", itemName);
        if (lastId) params.append("lastId", lastId);
        const queryString = params.toString();
        return `expense/item-usage${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: [{ type: "Expense", id: "USAGE" }],
    }),
  }),
});

export const {
  useCreateExpenseCategoryMutation,
  useEditExpenseCategoryMutation,
  useGetAllExpenseCategoriesQuery,
  useCreateExpenseMutation,
  useEditExpenseMutation,
  useGetExpenseByIdQuery,
  useGetExpensesByCategoryQuery,
  useGetDistinctExpenseItemsQuery,
  useGetExpenseItemUsageQuery,
} = expenseApi;
