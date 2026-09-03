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
        //url: "financial-year/add-financial-year",
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

    // UPDATE ONE SETTING
    updateSetting: builder.mutation({
      query: ({ setting_key, setting_value }) => ({
        url: `settings/update-setting/${setting_key}`,
        method: "PATCH",
        body: {
          setting_value,
        },
      }),
      invalidatesTags: ["AppSettings"],
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
