import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

const initialState = {
  folders: [],
  foldersStatus: 'idle',
  images: [],
  imagesStatus: 'idle',
  error: null,
  lastRejected: [],
};

export const fetchFolders = createAsyncThunk('imageStock/fetchFolders', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/image-stock/folders');
    return data.folders;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not load folders.');
  }
});

export const createFolder = createAsyncThunk(
  'imageStock/createFolder',
  async (name, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/image-stock/folders', { name });
      return data.folder;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Could not create folder.');
    }
  }
);

// Admin: a new randomly named sample folder with 10 photos of different categories.
export const generateSampleFolder = createAsyncThunk(
  'imageStock/generateSampleFolder',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/image-stock/folders/sample');
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Could not generate a sample folder.');
    }
  }
);

// Admin: only sample folders that no QR batch has used can be deleted.
export const deleteFolder = createAsyncThunk('imageStock/deleteFolder', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/image-stock/folders/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not delete folder.');
  }
});

export const fetchImages = createAsyncThunk(
  'imageStock/fetchImages',
  async ({ folderId, search = '' } = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/image-stock/images', { params: { folderId, search } });
      return data.images;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Could not load images.');
    }
  }
);

export const uploadImages = createAsyncThunk(
  'imageStock/uploadImages',
  async ({ folderId, files }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append('images', file));
      const { data } = await api.post(`/image-stock/folders/${folderId}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return { folderId, ...data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Could not upload images.');
    }
  }
);

export const toggleImageBlock = createAsyncThunk(
  'imageStock/toggleImageBlock',
  async ({ id, block }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/image-stock/images/${id}/${block ? 'block' : 'unblock'}`);
      return data.image;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Could not update image status.');
    }
  }
);

const imageStockSlice = createSlice({
  name: 'imageStock',
  initialState,
  reducers: {
    clearRejected(state) {
      state.lastRejected = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFolders.pending, (state) => {
        state.foldersStatus = 'loading';
      })
      .addCase(fetchFolders.fulfilled, (state, action) => {
        state.foldersStatus = 'succeeded';
        state.folders = action.payload;
      })
      .addCase(fetchFolders.rejected, (state, action) => {
        state.foldersStatus = 'failed';
        state.error = action.payload;
      })
      .addCase(createFolder.fulfilled, (state, action) => {
        state.folders.unshift(action.payload);
      })
      .addCase(generateSampleFolder.fulfilled, (state, action) => {
        state.folders.unshift(action.payload.folder);
        state.images = [...action.payload.images, ...state.images];
      })
      .addCase(deleteFolder.fulfilled, (state, action) => {
        state.folders = state.folders.filter((f) => f.id !== action.payload);
        state.images = state.images.filter((img) => img.folderId !== action.payload);
      })
      .addCase(fetchImages.pending, (state) => {
        state.imagesStatus = 'loading';
      })
      .addCase(fetchImages.fulfilled, (state, action) => {
        state.imagesStatus = 'succeeded';
        state.images = action.payload;
      })
      .addCase(fetchImages.rejected, (state, action) => {
        state.imagesStatus = 'failed';
        state.error = action.payload;
      })
      .addCase(uploadImages.fulfilled, (state, action) => {
        state.images = [...action.payload.images, ...state.images];
        state.lastRejected = action.payload.rejected || [];
        const folder = state.folders.find((f) => f.id === action.payload.folderId);
        if (folder) folder.imagesCount = (folder.imagesCount || 0) + action.payload.images.length;
      })
      .addCase(toggleImageBlock.fulfilled, (state, action) => {
        const idx = state.images.findIndex((img) => img.id === action.payload.id);
        if (idx !== -1) state.images[idx] = action.payload;
      });
  },
});

export const { clearRejected } = imageStockSlice.actions;
export default imageStockSlice.reducer;
