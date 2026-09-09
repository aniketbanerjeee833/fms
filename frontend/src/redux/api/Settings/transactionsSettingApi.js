import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const transactionsSettingApi = createApi({
  reducerPath: "transactionsSettingApi",

  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4000/api/",
    credentials: "include",
  }),

  tagTypes: ["TransactionsSettings"],

  endpoints: (builder) => ({

    // -------------------------------
    // GET ALL TRANSACTIONS SETTINGS
    // -------------------------------

    getAllTransactionsSettings: builder.query({
      query: () => "transactions-settings",
      providesTags: ["TransactionsSettings"],
    }),

    // -------------------------------
    // UPDATE ONE TRANSACTIONS SETTING
    // -------------------------------

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

          // Backend is authoritative.
          // Sync the cache with its response.
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
  }),
});

export const {
  useGetAllTransactionsSettingsQuery,
  useUpdateTransactionsSettingMutation,
} = transactionsSettingApi;