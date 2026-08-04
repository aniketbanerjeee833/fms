import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const termsConditionsApi = createApi({
  reducerPath: "termsConditionsApi",

  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4000/api/",
    credentials: "include",
  }),

  tagTypes: ["Terms"],

  endpoints: (builder) => ({
    getAllTerms: builder.query({
      query: (applicable = "") =>
        `terms-conditions${applicable ? `?applicable=${applicable}` : ""}`,

      transformResponse: (res) => res.templates,

      providesTags: ["Terms"],
    }),

    getTermsById: builder.query({
      query: (id) => `terms-conditions/${id}`,

      transformResponse: (res) => res.terms,

      providesTags: (result, error, id) => [
        { type: "Terms", id },
      ],
    }),

    createTerms: builder.mutation({
      query: (data) => ({
        url: "terms-conditions",
        method: "POST",
        body: data,
      }),

      invalidatesTags: ["Terms"],
    }),
  }),
});

export const {
  useGetAllTermsQuery,
  useGetTermsByIdQuery,
  
  useCreateTermsMutation,
  
} = termsConditionsApi;