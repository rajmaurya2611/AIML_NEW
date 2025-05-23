import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

interface TrainingData {
  id: number;
  query: string;
  answer: string;
  updated?: string;
}

interface UploadedFile {
  id: string;
  name: string;
  url: string;
}

interface Feedback {
  name: string;
  feedback: string;
}

interface KnowledgeBaseFile {
  file_name: string;
  download_url: string;
  size: number;
  uploaded_at: string;
}

interface DatabaseFile {
  file_name: string;
  download_url: string;
  size: number;
  uploaded_at: string;
}

interface FeedbackQuestion {
  question: string;
  answer: string;
  starRating: number;
  feedbackText: string;
}

const BASE_URL = import.meta.env.VITE_KIP_API_BASE_URL;

export const mainApiSlice = createApi({
  reducerPath: "mainApi",
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
  }),
  tagTypes: ["TrainingData", "Feedback", "FeedbackQuestion", "KnowledgeBase", "Database"],

  endpoints: (builder) => ({
    // ✅ Fetch Training Data
    fetchTrainingData: builder.query<TrainingData[], void>({
      query: () => "/api/training-data",
      providesTags: ["TrainingData"],
    }),

    // ✅ Add Training Data
    addTrainingData: builder.mutation<TrainingData, { query: string; answer: string }>({
      query: (data) => ({
        url: "/api/training-data",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["TrainingData"],
    }),

    // ✅ Update Training Data
    updateTrainingData: builder.mutation<TrainingData, { id: number; query: string; answer: string }>({
      query: ({ id, query, answer }) => ({
        url: `/api/training-data/${id}`,
        method: "PUT",
        body: { query, answer },
      }),
      invalidatesTags: ["TrainingData"],
    }),

    // ✅ Delete Training Data
    deleteTrainingData: builder.mutation<void, number>({
      query: (id) => ({
        url: `/api/training-data/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["TrainingData"],
    }),

    // ✅ Upload File
    uploadFile: builder.mutation<{ message: string; file: UploadedFile }, FormData>({
      query: (formData) => ({
        url: "/upload",
        method: "POST",
        body: formData,
      }),
    }),

    // ✅ Submit Feedback (Auto-Refreshes Feedback List)
    submitFeedback: builder.mutation<{ message: string; recent_feedback: Feedback[] }, Feedback>({
      query: (data) => ({
        url: "/submit-feedback",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: data,
      }),
      invalidatesTags: ["Feedback"],
    }),

    // Feedback for Each Question
    submitFeedbackQuestion: builder.mutation<{message: string}, FeedbackQuestion>({
      query: (data) =>({
        url: "/submit-feedback_question",
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: data,
      }),
      invalidatesTags: ["FeedbackQuestion"],
    }),

    // ✅ Fetch Recent Feedback
    fetchRecentFeedback: builder.query<{ recent_feedback: Feedback[] }, void>({
      query: () => "/get-recent-feedback",
      providesTags: ["Feedback"],
    }),

    // ✅ Fetch Knowledge Base Files
    fetchKnowledgeBaseFiles: builder.query<KnowledgeBaseFile[], void>({
      query: () => "/api/knowledgebase/files",
      providesTags: ["KnowledgeBase"],
    }),

    // ✅ Download Knowledge Base File
    downloadKnowledgeBaseFile: builder.query<string, string>({
      query: (filename) => `/uploads/knowledgebase/${filename}`,
    }),

    // ✅ Upload Database File
    uploadDatabaseFile: builder.mutation<{ message: string; file: UploadedFile }, FormData>({
      query: (formData) => ({
        url: "/api/Database/upload",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Database"],
    }),

    // ✅ Fetch Database Files
    fetchDatabaseFiles: builder.query<DatabaseFile[], void>({
      query: () => "/api/Database/files",
      providesTags: ["Database"],
    }),

    // ✅ Download Database File
    downloadDatabaseFile: builder.query<string, string>({
      query: (filename) => `/uploads/Database/${filename}`,
    }),
  }),
});

export const {
  useFetchTrainingDataQuery,
  useAddTrainingDataMutation,
  useUpdateTrainingDataMutation,
  useDeleteTrainingDataMutation,
  useUploadFileMutation,
  useSubmitFeedbackMutation,
  useSubmitFeedbackQuestionMutation,
  useFetchRecentFeedbackQuery,
  useFetchKnowledgeBaseFilesQuery,
  useDownloadKnowledgeBaseFileQuery,
  useUploadDatabaseFileMutation,
  useFetchDatabaseFilesQuery,
  useDownloadDatabaseFileQuery,
} = mainApiSlice;



// import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// interface TrainingData {
//   id: number;
//   query: string;
//   answer: string;
//   updated?: string;
// }

// interface UploadedFile {
//   id: string;
//   name: string;
//   url: string;
// }

// interface Feedback {
//   name: string;
//   feedback: string;
// }

// const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// export const mainApiSlice = createApi({
//   reducerPath: "mainApi",
//   baseQuery: fetchBaseQuery({
//     baseUrl: BASE_URL,
//   }),
//   tagTypes: ["TrainingData", "Feedback"],

//   endpoints: (builder) => ({
//     // ✅ Fetch Training Data
//     fetchTrainingData: builder.query<TrainingData[], void>({
//       query: () => "/api/training-data",
//       providesTags: ["TrainingData"],
//     }),

//     // ✅ Add Training Data
//     addTrainingData: builder.mutation<TrainingData, { query: string; answer: string }>({
//       query: (data) => ({
//         url: "/api/training-data",
//         method: "POST",
//         body: data,
//       }),
//       invalidatesTags: ["TrainingData"],
//     }),

//     // ✅ Update Training Data
//     updateTrainingData: builder.mutation<TrainingData, { id: number; query: string; answer: string }>({
//       query: ({ id, query, answer }) => ({
//         url: `/api/training-data/${id}`,
//         method: "PUT",
//         body: { query, answer },
//       }),
//       invalidatesTags: ["TrainingData"],
//     }),

//     // ✅ Delete Training Data
//     deleteTrainingData: builder.mutation<void, number>({
//       query: (id) => ({
//         url: `/api/training-data/${id}`,
//         method: "DELETE",
//       }),
//       invalidatesTags: ["TrainingData"],
//     }),

//     // ✅ Upload File
//     uploadFile: builder.mutation<{ message: string; file: UploadedFile }, FormData>({
//       query: (formData) => ({
//         url: "/upload",
//         method: "POST",
//         body: formData,
//       }),
//     }),

//     // ✅ Submit Feedback (Auto-Refreshes Feedback List)
//     submitFeedback: builder.mutation<{ message: string; recent_feedback: Feedback[] }, Feedback>({
//       query: (data) => ({
//         url: "/submit-feedback",
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: data,
//       }),
//       invalidatesTags: ["Feedback"], // Auto-refresh recent feedback
//     }),

//     // ✅ Fetch Recent Feedback (Auto-Refresh Enabled)
//     fetchRecentFeedback: builder.query<{ recent_feedback: Feedback[] }, void>({
//       query: () => "/get-recent-feedback",
//       providesTags: (result) =>
//         result
//           ? [...result.recent_feedback.map(() => ({ type: "Feedback" as const }))] 
//           : ["Feedback"],
//     }),
//   }),
// });

// export const {
//   useFetchTrainingDataQuery,
//   useAddTrainingDataMutation,
//   useUpdateTrainingDataMutation,
//   useDeleteTrainingDataMutation,
//   useUploadFileMutation,
//   useSubmitFeedbackMutation,
//   useFetchRecentFeedbackQuery,
// } = mainApiSlice;
