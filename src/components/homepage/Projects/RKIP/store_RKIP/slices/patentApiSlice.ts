import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Use the Patent API base URL from the environment variable
const PATENT_API_URL = import.meta.env.VITE_KIP_PATENT_API_URL;

export const patentApiSlice = createApi({
  reducerPath: "patentApi",
  baseQuery: fetchBaseQuery({
    baseUrl: PATENT_API_URL,  // Use the base URL for the Patent API (e.g., http://127.0.0.1:8000)
  }),
  endpoints: (builder) => ({
    // Single mutation for Patent API to handle /query path
    sendPatentMessage: builder.mutation({
      query: (message: string) => ({
        url: "/query",  // This ensures it gets appended to base URL correctly (i.e., http://127.0.0.1:8000/query)
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: { query: message },
      }),
    }),
  }),
});

export const { useSendPatentMessageMutation } = patentApiSlice;
