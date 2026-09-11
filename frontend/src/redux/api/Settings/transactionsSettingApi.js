
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const transactionsSettingApi = createApi({
  reducerPath: "transactionsSettingApi",

  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4000/api/",
    credentials: "include",
  }),

  tagTypes: [
    "TransactionsSettings",
    "TransactionPrefixes",
  ],

  endpoints: (builder) => ({

    // ============================================================
    // GET ALL TRANSACTIONS SETTINGS
    // ============================================================

    getAllTransactionsSettings: builder.query({
      query: () => "transactions-settings",
      providesTags: ["TransactionsSettings"],
    }),


    // ============================================================
    // UPDATE ONE TRANSACTIONS SETTING
    // ============================================================

    updateTransactionsSetting: builder.mutation({
      query: ({ setting_key, setting_value }) => ({
        url: `transactions-settings/${setting_key}`,
        method: "PATCH",
        body: {
          setting_value,
        },
      }),

      async onQueryStarted(
        { setting_key, setting_value },
        { dispatch, queryFulfilled }
      ) {
        // Change the UI immediately
        const patchResult = dispatch(
          transactionsSettingApi.util.updateQueryData(
            "getAllTransactionsSettings",
            undefined,
            (draft) => {
              const target = draft.settings.find(
                (s) => s.setting_key === setting_key
              );

              if (target) {
                target.setting_value = setting_value;
              }
            }
          )
        );

        try {
          // Wait for backend
          const { data } = await queryFulfilled;

          // Backend is authoritative
          dispatch(
            transactionsSettingApi.util.updateQueryData(
              "getAllTransactionsSettings",
              undefined,
              () => data
            )
          );
        } catch {
          // Backend failed → restore previous UI state
          patchResult.undo();
        }
      },
    }),


    // ============================================================
    // GET ALL TRANSACTION PREFIXES
    // ============================================================

    getTransactionPrefixes: builder.query({
      query: () => "transactions-settings/prefixes",
      providesTags: ["TransactionPrefixes"],
    }),

    // ============================================================
// GET TRANSACTION PREFIXES BY TYPE
// ============================================================

getTransactionPrefixesByType: builder.query({

  query: (transaction_type) =>
    `transactions-settings/prefixes/type/${transaction_type}`,

  providesTags: (result, error, transaction_type) => [
    {
      type: "TransactionPrefixes",
      id: transaction_type,
    },
  ],
}),


    // ============================================================
    // ADD TRANSACTION PREFIX
    // ============================================================

    addTransactionPrefix: builder.mutation({
      query: ({ transaction_type, prefix_name }) => ({
        url: "transactions-settings/prefixes",
        method: "POST",
        body: {
          transaction_type,
          prefix_name,
        },
      }),

      invalidatesTags: ["TransactionPrefixes"],
    }),


    // ============================================================
    // TOGGLE TRANSACTION PREFIX ACTIVE / INACTIVE
    // ============================================================

    toggleTransactionPrefix: builder.mutation({
      query: ({ id, is_active }) => ({
        url: `transactions-settings/prefixes/${id}/toggle`,
        method: "PATCH",
        body: {
          is_active,
        },
      }),

      invalidatesTags: ["TransactionPrefixes"],
    }),


    // ============================================================
    // DELETE TRANSACTION PREFIX
    // ============================================================

    deleteTransactionPrefix: builder.mutation({
      query: (id) => ({
        url: `transactions-settings/prefixes/${id}`,
        method: "DELETE",
      }),

      invalidatesTags: ["TransactionPrefixes"],
    }),

  }),
});


export const {
  // Transactions settings
  useGetAllTransactionsSettingsQuery,
  useUpdateTransactionsSettingMutation,

  // Transaction prefixes
  useGetTransactionPrefixesQuery,
  useGetTransactionPrefixesByTypeQuery,
  useAddTransactionPrefixMutation,
  useToggleTransactionPrefixMutation,
  useDeleteTransactionPrefixMutation,
} = transactionsSettingApi;