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
      invalidatesTags: [
        { type: "Expense", id: "LIST" },
        { type: "ExpenseCategory", id: "LIST" },
        { type: "ExpenseItem", id: "LIST" },
      ],
    }),

    editExpense: builder.mutation({
      query: ({ id, body }) => ({
        url: `expense/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: [
        { type: "Expense", id: "LIST" },
        { type: "ExpenseCategory", id: "LIST" },
        { type: "ExpenseItem", id: "LIST" },
      ],
    }),

    deleteExpense: builder.mutation({
      query: ({ id }) => ({
        url: `expense/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: "Expense", id: "LIST" },
        { type: "ExpenseCategory", id: "LIST" },
        { type: "ExpenseItem", id: "LIST" },
      ],
    }),

    getExpenseById: builder.query({
      query: (id) => `expense/${id}`,
      providesTags: (result, error, id) => [{ type: "Expense", id }],
    }),

    getExpensesByCategory: builder.query({
      query: ({ categoryId, cursor = null, search = "", date = "" }) => {
        const params = new URLSearchParams();
        if (cursor) params.append("lastId", cursor);
        if (search) params.append("search", search);
        if (date) params.append("date", date);       // 🔹 single date
        const qs = params.toString();
        return `expense/by-category/${categoryId}${qs ? `?${qs}` : ""}`;
      },
      serializeQueryArgs: ({ queryArgs }) => ({
        categoryId: queryArgs.categoryId,
        search: queryArgs.search,
        date: queryArgs.date,
      }),
      merge: (currentCache, newData) => {
        currentCache.expenses.push(...newData.expenses);
        currentCache.hasMore = newData.hasMore;
        currentCache.nextCursor = newData.nextCursor;
      },
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.cursor !== previousArg?.cursor,
      providesTags: (result, error, { categoryId }) => [
        { type: "Expense", id: `CATEGORY_${categoryId}` },
      ],
    }),

    // getExpenseItemUsage: builder.query({
    //   query: ({ masterItemId, cursor = null, date = "" }) => {
    //     const params = new URLSearchParams();
    //     if (masterItemId) params.append("masterItemId", masterItemId);
    //     if (cursor) params.append("lastId", cursor);
    //     if (date) params.append("date", date);   // 🔹 single date
    //     const qs = params.toString();
    //     return `expense/item-usage${qs ? `?${qs}` : ""}`;
    //   },
    //   serializeQueryArgs: ({ queryArgs }) => ({
    //     masterItemId: queryArgs.masterItemId,
    //     date: queryArgs.date,
    //   }),
    //   merge: (currentCache, newData) => {
    //     currentCache.usage.push(...newData.usage);
    //     currentCache.hasMore = newData.hasMore;
    //     currentCache.nextCursor = newData.nextCursor;
    //   },
    //   forceRefetch: ({ currentArg, previousArg }) =>
    //     currentArg?.cursor !== previousArg?.cursor,
    //   providesTags: (result, error, { masterItemId }) => [
    //     { type: "Expense", id: `ITEM_${masterItemId}` },
    //   ],
    // }),
    getExpenseItemUsage: builder.query({
  query: ({ masterItemId, cursor = null, date = "", search = "" }) => {
    const params = new URLSearchParams();
    if (masterItemId) params.append("masterItemId", masterItemId);
    if (cursor) params.append("cursor", cursor);   // 🔹 renamed from lastId — matches new compound cursor param
    if (date) params.append("date", date);
    if (search?.trim()) params.append("search", search.trim());
    const qs = params.toString();
    return `expense/item-usage${qs ? `?${qs}` : ""}`;
  },

  serializeQueryArgs: ({ queryArgs }) => ({
    masterItemId: queryArgs.masterItemId,
    date: queryArgs.date,
    search: queryArgs.search,
  }),

  merge: (currentCache, newData, { arg }) => {
    if (!arg.cursor) {
      // first page / fresh filter — replace, don't append
      return newData;
    }
    currentCache.usage.push(...newData.usage);
    currentCache.hasMore = newData.hasMore;
    currentCache.nextCursor = newData.nextCursor;
  },

  forceRefetch: ({ currentArg, previousArg }) =>
    currentArg?.cursor !== previousArg?.cursor,

  providesTags: (result, error, { masterItemId }) => [
    { type: "Expense", id: `ITEM_${masterItemId}` },
  ],
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
