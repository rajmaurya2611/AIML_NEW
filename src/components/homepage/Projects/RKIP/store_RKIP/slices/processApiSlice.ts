import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Process API base URL from environment variable
const PROCESS_API_URL = import.meta.env.VITE_KIP_PROCESS_API_URL;

export const processApiSlice = createApi({
  reducerPath: "processApi",
  baseQuery: fetchBaseQuery({
    baseUrl: PROCESS_API_URL,  // Using the base URL for the Process API
  }),
  endpoints: (builder) => ({
    // 1️⃣ Chat API (Existing)
    sendProcessMessage: builder.mutation({
      query: (message: string) => ({
        url: "/chat",  // Chat endpoint
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: { query: message },
      }),
    }),

    // 2️⃣ Upload Documents (CSV file)
    uploadDocumentCSV: builder.mutation<{ message: string }, FormData>({
      query: (formData) => ({
        url: "/upload_documents",  // New endpoint to upload CSV files
        method: "POST",
        body: formData,
      }),
    }),

    // 3️⃣ Submit Query
    submitCustomQuery: builder.mutation<{ message: string }, { query: string; answer: string }>({
      query: (data) => ({
        url: "/submit_query",  // New endpoint to submit a query and its answer
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: data,
      }),
    }),
  }),
});

export const {
  useSendProcessMessageMutation,
  useUploadDocumentCSVMutation,
  useSubmitCustomQueryMutation,
} = processApiSlice;
