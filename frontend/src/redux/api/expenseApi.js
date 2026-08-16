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
    getAllExpenseItemMastersCursor: builder.query({
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
          params.append("search", search.trim());
        }

        params.append("limit", limit);

        return `expense-item/cursor?${params.toString()}`;
      },

      serializeQueryArgs: ({ queryArgs }) => ({
        search: queryArgs.search ?? "",
      }),

      merge: (currentCache, newData, { arg }) => {
        if (!arg.cursor) {
          return newData;
        }

        currentCache.items.push(...newData.items);
        currentCache.hasMore = newData.hasMore;
        currentCache.nextCursor = newData.nextCursor;
        currentCache.totalItems = newData.totalItems;
      },

      forceRefetch: ({
        currentArg,
        previousArg,
      }) =>
        currentArg?.cursor !== previousArg?.cursor ||
        currentArg?.search !== previousArg?.search,

      //providesTags: ["ExpenseItemMaster"],
      providesTags: [{ type: "ExpenseItem", id: "LIST" }]
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

    // getExpensesByCategory: builder.query({
    //   query: ({ categoryId, cursor = null, search = "", date = "" }) => {
    //     const params = new URLSearchParams();
    //     if (cursor) params.append("lastId", cursor);
    //     if (search) params.append("search", search);
    //     if (date) params.append("date", date);       // 🔹 single date
    //     const qs = params.toString();
    //     return `expense/by-category/${categoryId}${qs ? `?${qs}` : ""}`;
    //   },
    //   serializeQueryArgs: ({ queryArgs }) => ({
    //     categoryId: queryArgs.categoryId,
    //     search: queryArgs.search,
    //     date: queryArgs.date,
    //   }),
    //   merge: (currentCache, newData) => {
    //     currentCache.expenses.push(...newData.expenses);
    //     currentCache.hasMore = newData.hasMore;
    //     currentCache.nextCursor = newData.nextCursor;
    //   },
    //   forceRefetch: ({ currentArg, previousArg }) =>
    //     currentArg?.cursor !== previousArg?.cursor,
    //   providesTags: (result, error, { categoryId }) => [
    //     { type: "Expense", id: `CATEGORY_${categoryId}` },
    //   ],
    // }),
getExpensesByCategory: builder.query({
  query: ({
    categoryId,
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

    return (
      `expense/by-category/${categoryId}` +
      `?${params.toString()}`
    );
  },

  serializeQueryArgs: ({
    queryArgs,
  }) => {
    const {
      categoryId,
      search,
      date,
    } = queryArgs;

    return {
      categoryId,
      search,
      date,
    };
  },

  merge: (
    currentCache,
    newData,
    { arg }
  ) => {
    // First page / filter change
    if (!arg.cursor) {
      return newData;
    }

    // Next page
    currentCache.expenses.push(
      ...newData.expenses
    );

    currentCache.hasMore =
      newData.hasMore;

    currentCache.nextCursor =
      newData.nextCursor;
  },

  forceRefetch: ({
    currentArg,
    previousArg,
  }) =>
    currentArg?.cursor !==
      previousArg?.cursor ||
    currentArg?.search !==
      previousArg?.search ||
    currentArg?.date !==
      previousArg?.date ||
    currentArg?.categoryId !==
      previousArg?.categoryId,

   providesTags: [{ type: "Expense", id: "LIST" }],
}),
   getExpenseItemUsage: builder.query({
  query: ({
    masterItemId,
    cursor = null,
    date = "",
    search = "",
  }) => {
    const params = new URLSearchParams();

    if (masterItemId)
      params.append("masterItemId", masterItemId);

    if (cursor)
      params.append("lastId", cursor);

    if (date)
      params.append("date", date);

    if (search?.trim())
      params.append("search", search.trim());

    return `expense/item-usage?${params.toString()}`;
  },

  serializeQueryArgs: ({ queryArgs }) => {
    const {
      masterItemId,
      date,
      search,
    } = queryArgs;

    return {
      masterItemId,
      date,
      search,
    };
  },

  merge: (currentCache, newData, { arg }) => {
    if (!arg.cursor) {
      return newData;
    }

    currentCache.usage.push(...newData.usage);
    currentCache.hasMore = newData.hasMore;
    currentCache.nextCursor = newData.nextCursor;
  },

  forceRefetch: ({
    currentArg,
    previousArg,
  }) =>
    currentArg?.cursor !== previousArg?.cursor ||
    currentArg?.date !== previousArg?.date ||
    currentArg?.search !== previousArg?.search || // ← add this
    currentArg?.masterItemId !== previousArg?.masterItemId,


  providesTags: [{ type: "Expense", id: "LIST" }],
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
  useGetAllExpenseItemMastersCursorQuery,
  useCreateExpenseMutation,
  useEditExpenseMutation,
  useDeleteExpenseMutation,
  useGetExpenseByIdQuery,
  useGetExpensesByCategoryQuery,
  useGetExpenseItemUsageQuery,
} = expenseApi;
