import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";




export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4000/api/",
    credentials: "include", // same as withCredentials: true
  }),
  tagTypes: ["User"], // 👈 added Location for countries/states/cities
  endpoints: (builder) => ({

    getUser: builder.query({
      query: () => `user/me`,
      providesTags: ["User"],
    }),

    registerUser: builder.mutation({
      query: (body) => ({
        url: `user/register`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    loginUser: builder.mutation({
      query: (body) => ({
        url: `user/login`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    logoutUser: builder.mutation({
      query: () => ({
        url: `user/logout`,
        method: "POST",
      }),
      invalidatesTags: ["User"],
    }),


  
  

    
  }),
});


export const {
 useGetUserQuery,
 useRegisterUserMutation,
  useLoginUserMutation,
  useLogoutUserMutation,
} = userApi;
