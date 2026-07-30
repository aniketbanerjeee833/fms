import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const expenseApi = createApi({
  reducerPath: "expenseApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4000/api/",
    credentials: "include",
  }),
  tagTypes: ["Expense", "ExpenseCategory", "ExpenseItem"],
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

    deleteExpenseCategory: builder.mutation({
      query: ({ id }) => ({
        url: `expense-category/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "ExpenseCategory", id: "LIST" }],
    }),

    getAllExpenseCategories: builder.query({
      query: () => "expense-category/",
      providesTags: [{ type: "ExpenseCategory", id: "LIST" }],
    }),

    createExpenseItemMaster: builder.mutation({
      query: ({ body }) => ({
        url: "expense-item/",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "ExpenseItem", id: "LIST" }],
    }),

    editExpenseItemMaster: builder.mutation({
      query: ({ id, body }) => ({
        url: `expense-item/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: [{ type: "ExpenseItem", id: "LIST" }],
    }),

    deleteExpenseItemMaster: builder.mutation({
      query: ({ id }) => ({
        url: `expense-item/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "ExpenseItem", id: "LIST" }],
    }),

    getAllExpenseItemMasters: builder.query({
      query: ({ search = "" } = {}) => {
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        const queryString = params.toString();
        return `expense-item/${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: [{ type: "ExpenseItem", id: "LIST" }],
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

    deleteExpense: builder.mutation({
      query: ({ id }) => ({
        url: `expense/${id}`,
        method: "DELETE",
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

    getExpenseItemUsage: builder.query({
      query: ({ masterItemId, lastId }) => {
        const params = new URLSearchParams();
        if (masterItemId) params.append("masterItemId", masterItemId);
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
  useDeleteExpenseCategoryMutation,
  useGetAllExpenseCategoriesQuery,
  useCreateExpenseItemMasterMutation,
  useEditExpenseItemMasterMutation,
  useDeleteExpenseItemMasterMutation,
  useGetAllExpenseItemMastersQuery,
  useCreateExpenseMutation,
  useEditExpenseMutation,
  useDeleteExpenseMutation,
  useGetExpenseByIdQuery,
  useGetExpensesByCategoryQuery,
  useGetExpenseItemUsageQuery,
} = expenseApi;
