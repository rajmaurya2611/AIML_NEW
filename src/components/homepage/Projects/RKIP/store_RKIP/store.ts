import { configureStore } from "@reduxjs/toolkit";
import appReducer from "./slices/appSlice";
import fileStorageReducer from "./slices/fileStorageSlice";
import { mainApiSlice } from "./slices/mainApiSlice"; // Correct import
import { patentApiSlice } from "./slices/patentApiSlice"; // Add new slice for Patent API
import { processApiSlice } from "./slices/processApiSlice"; // Add new slice for Process API

const store = configureStore({
  reducer: {
    app: appReducer,
    fileStorage: fileStorageReducer,
    [mainApiSlice.reducerPath]: mainApiSlice.reducer, // Correct reference to mainApiSlice.reducerPath
    [patentApiSlice.reducerPath]: patentApiSlice.reducer, // Add Patent API slice reducer
    [processApiSlice.reducerPath]: processApiSlice.reducer, // Add Process API slice reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(mainApiSlice.middleware) // RTK Query middleware for main API
      .concat(patentApiSlice.middleware) // RTK Query middleware for Patent API
      .concat(processApiSlice.middleware), // RTK Query middleware for Process API
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
