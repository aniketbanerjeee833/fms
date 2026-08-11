import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const bankAccountApi = createApi({
  reducerPath: "bankAccountApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4000/api",
    credentials: "include",
  }),
  tagTypes: ["BankAccount"],

  endpoints: (builder) => ({

    /* Get all bank accounts */
    getAllBankAccounts: builder.query({
      query: () => "/bank/bank-accounts",
      transformResponse: (res) => res.bankAccounts,
      providesTags: ["BankAccount"],
    }),

    /* Get single bank account with transactions */
    // getBankAccountById: builder.query({
    //   query: ({ Bank_Account_Id, page = 1, limit = 10 }) =>
    //     `/bank/bank-account/${Bank_Account_Id}?page=${page}&limit=${limit}`,
    //   providesTags: (result, error, { Bank_Account_Id }) => [
    //      { type: "BankAccount", id: Bank_Account_Id },
    //     // { type: "BankAccount", Bank_Account_Id },
    //   ],
    // }),
    getBankAccountById: builder.query({
  query: ({ Bank_Account_Id, cursor = null }) => {
    //const params = new URLSearchParams({ limit });
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    return `/bank/bank-account/${Bank_Account_Id}?${params.toString()}`;
  },

  // 🔹 cache key ignores cursor — all pages for same account share one cache entry
  serializeQueryArgs: ({ queryArgs }) => ({
    Bank_Account_Id: queryArgs.Bank_Account_Id,
  }),

  // 🔹 merge incoming page into existing cache
  merge: (currentCache, newData) => {
    if (!currentCache.transactions) {
      // first page — replace entirely
      return newData;
    }
    // subsequent pages — append, deduplicate by id
    const existingIds = new Set(
      currentCache.transactions.map((t) => t.id)
    );
    const fresh = newData.transactions.filter(
      (t) => !existingIds.has(t.id)
    );
    return {
      ...newData,                              // hasMore, nextCursor, bankAccount, currentBalance
      transactions: [
        ...currentCache.transactions,
        ...fresh,
      ],
    };
  },

  // 🔹 re-fetch when cursor changes
  forceRefetch: ({ currentArg, previousArg }) =>
    currentArg?.cursor !== previousArg?.cursor,

  providesTags: (result, error, { Bank_Account_Id }) => [
    { type: "BankAccount", id: Bank_Account_Id },
    "BankAccount",
  ],
}),

    /* Create bank account */
    createBankAccount: builder.mutation({
      query: (body) => ({
        url: "/bank/bank-account",
        method: "POST",
        body,
      }),
      invalidatesTags: ["BankAccount"],
    }),

    /* Edit bank account */
    editBankAccount: builder.mutation({
      query: ({ Bank_Account_Id, ...body }) => ({
        url: `/bank/bank-account/${Bank_Account_Id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { Bank_Account_Id }) => [
        { type: "BankAccount", Bank_Account_Id },
        "BankAccount",
      ],
    }),

    /* Delete bank account */
    // deleteBankAccount: builder.mutation({
    //   query: (Bank_Account_Id) => ({
    //     url: `/bank/bank-account/${Bank_Account_Id}`,
    //     method: "DELETE",
    //   }),
    //   invalidatesTags: ["BankAccount"],
    // }),
  }),
});

export const {
  useGetAllBankAccountsQuery,
  useGetBankAccountByIdQuery,
  useCreateBankAccountMutation,
  useEditBankAccountMutation,
  // useDeleteBankAccountMutation,
} = bankAccountApi;