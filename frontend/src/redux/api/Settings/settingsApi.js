import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const settingsApi = createApi({
  reducerPath: "settingsApi",

  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4000/api/",
    credentials: "include", // send cookies for userAuth middleware
  }),

  tagTypes: ["FinancialYear", "AppSettings"],  // helps for cache invalidation

  endpoints: (builder) => ({

    // -------------------------------
    // 1️⃣ Add Financial Year (POST)
    // -------------------------------
    addFinancialYear: builder.mutation({
      query: (data) => ({
        url: "settings/add-financial-year",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["FinancialYear"],
    }),

    // -------------------------------
    // 2️⃣ Get All Financial Years (GET)
    // -------------------------------
    getAllFinancialYears: builder.query({
      query: () => "settings/get-all-financial-years",
      providesTags: ["FinancialYear"],
    }),

    // -------------------------------
    // 3️⃣ Update Current Financial Year (PATCH)
    // -------------------------------
    updateCurrentFinancialYear: builder.mutation({
      query: ({ financialYearId }) => ({
        url: "settings/update-current-financial-year",
        method: "PATCH",
        body: { financialYearId },
      }),
      invalidatesTags: ["FinancialYear"], // auto-refresh list
    }),

    getAllSettings: builder.query({
      query: () => "settings/get-all-settings",
      providesTags: ["AppSettings"],
    }),

    // UPDATE ONE SETTING — optimistic update, no full refetch/re-render
    updateSetting: builder.mutation({
      query: ({ setting_key, setting_value }) => ({
        url: `settings/update-setting/${setting_key}`,
        method: "PATCH",
        body: {
          setting_value,
        },
      }),
      async onQueryStarted(
        { setting_key, setting_value },
        { dispatch, queryFulfilled }
      ) {
        // instantly flip the toggle in the cache — no waiting, no re-render bump
        const patchResult = dispatch(
          settingsApi.util.updateQueryData(
            "getAllSettings",
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
          const { data } = await queryFulfilled;
          // sync with the server's authoritative list — picks up cascaded
          // settings too (e.g. show_mrp turning off calculate_sale_price_from_mrp_disc)
          dispatch(
            settingsApi.util.updateQueryData(
              "getAllSettings",
              undefined,
              () => data
            )
          );
        } catch {
          patchResult.undo(); // revert optimistic change if the request failed
        }
      },
      // no invalidatesTags — cache is kept in sync manually above
    }),

  }),
});

export const {
  useAddFinancialYearMutation,
  useGetAllFinancialYearsQuery,
  useUpdateCurrentFinancialYearMutation,

  useGetAllSettingsQuery,
  useUpdateSettingMutation,
} = settingsApi;