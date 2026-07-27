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
    getBankAccountById: builder.query({
      query: ({ Bank_Account_Id, page = 1, limit = 10 }) =>
        `/bank/bank-account/${Bank_Account_Id}?page=${page}&limit=${limit}`,
      providesTags: (result, error, { Bank_Account_Id }) => [
        { type: "BankAccount", Bank_Account_Id },
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