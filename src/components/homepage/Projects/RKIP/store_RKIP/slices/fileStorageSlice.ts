import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface FileState {
  files: { id: string; name: string; url: string }[];
}

const initialState: FileState = {
  files: [],
};

const fileStorageSlice = createSlice({
  name: "fileStorage",
  initialState,
  reducers: {
    addFile: (state, action: PayloadAction<{ id: string; name: string; url: string }>) => {
      state.files.push(action.payload);
    },
    removeFile: (state, action: PayloadAction<string>) => {
      state.files = state.files.filter((file) => file.id !== action.payload);
    },
  },
});

export const { addFile, removeFile } = fileStorageSlice.actions;
export default fileStorageSlice.reducer;
