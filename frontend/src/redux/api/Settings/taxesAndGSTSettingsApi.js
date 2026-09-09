import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const taxesAndGSTSettingsApi = createApi({
  reducerPath: "taxesAndGSTSettingsApi",

  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4000/api/",
    credentials: "include",
  }),

  tagTypes: ["TaxesAndGSTSettings"],

  endpoints: (builder) => ({

    // -------------------------------
    // GET ALL TAX / GST SETTINGS
    // -------------------------------

    getAllTaxesAndGSTSettings: builder.query({
      query: () => "taxes-gst-settings",
      providesTags: ["TaxesAndGSTSettings"],
    }),

    // -------------------------------
    // UPDATE ONE TAX / GST SETTING
    // -------------------------------

    updateTaxesAndGSTSetting: builder.mutation({
  query: ({ setting_key, setting_value }) => ({
    url: `taxes-gst-settings/${setting_key}`,
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
      taxesAndGSTSettingsApi.util.updateQueryData(
        "getAllTaxesAndGSTSettings",
        undefined,
        (draft) => {
          const target = draft.settings.find(
            (s) => s.setting_key === setting_key
          );

          if (target) {
            target.setting_value = setting_value;
          }

          // GST OFF → immediately turn dependent
          // settings OFF in the UI as well
          if (
            setting_key === "enable_gst" &&
            Number(setting_value) === 0
          ) {
            const hsnSetting = draft.settings.find(
              (s) => s.setting_key === "enable_hsn_sac"
            );

            const placeOfSupplySetting =
              draft.settings.find(
                (s) =>
                  s.setting_key ===
                  "enable_place_of_supply"
              );

            if (hsnSetting) {
              hsnSetting.setting_value = 0;
            }

            if (placeOfSupplySetting) {
              placeOfSupplySetting.setting_value = 0;
            }
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
        taxesAndGSTSettingsApi.util.updateQueryData(
          "getAllTaxesAndGSTSettings",
          undefined,
          () => data
        )
      );
    } catch  {
      // Backend failed → restore previous UI state
      patchResult.undo();
    }
  },
}),
  }),
});

export const {
  useGetAllTaxesAndGSTSettingsQuery,
  useUpdateTaxesAndGSTSettingMutation,
} = taxesAndGSTSettingsApi;