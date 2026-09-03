import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const barcodeSettingsApi = createApi({
    reducerPath: "barcodeSettingsApi",

    baseQuery: fetchBaseQuery({
        baseUrl: "http://localhost:4000/api/",
        credentials: "include",
    }),

    tagTypes: ["BarcodeSettings"],

    endpoints: (builder) => ({

        // --------------------------------
        // 1️⃣ Get All Barcode Settings
        // --------------------------------
        getBarcodeSettings: builder.query({
            query: () => "barcode-settings",
            providesTags: ["BarcodeSettings"],
        }),

        // --------------------------------
        // 2️⃣ Select Barcode Setting
        // --------------------------------
        selectBarcodeSetting: builder.mutation({
            query: ({ id }) => ({
                url: "barcode-settings/select",
                method: "PUT",
                body: { id },
            }),
            invalidatesTags: ["BarcodeSettings"],
        }),

    }),
});

export const {
    useGetBarcodeSettingsQuery,
    useSelectBarcodeSettingMutation,
} = barcodeSettingsApi;