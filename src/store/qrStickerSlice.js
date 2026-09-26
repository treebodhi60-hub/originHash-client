import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

const initialState = {
  codes: [],
  codesStatus: 'idle',
  filters: { producers: [], batchNos: [] },
  search: '',
  producerFilter: '',
  batchNoFilter: '',
  generating: false,
  generateError: null,
  lastResult: null, // { batch, codes } from the most recent successful generation
};

export const fetchCodes = createAsyncThunk(
  'qrSticker/fetchCodes',
  async ({ search = '', producer = '', batchNo = '' } = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/qr-stickers/codes', { params: { search, producer, batchNo } });
      return data.codes;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Could not load generated QR codes.');
    }
  }
);

export const fetchFilters = createAsyncThunk('qrSticker/fetchFilters', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/qr-stickers/filters');
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not load filters.');
  }
});

export const generateBatch = createAsyncThunk(
  'qrSticker/generateBatch',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/qr-stickers/batches', payload);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Could not generate QR stickers.');
    }
  }
);

// Whether a batch number is already used. Resolves to the warning to show, or '' when it's free.
export const checkBatchNo = async (batchNo) => {
  const { data } = await api.get('/qr-stickers/batches/check', { params: { batchNo } });
  return data.exists ? data.message : '';
};

export const downloadBatchPdf = async (batchId, fileNameHint = 'stickers') => {
  try {
    const { data } = await api.get(`/qr-stickers/batches/${batchId}/pdf`, { responseType: 'blob' });
    const blob = new Blob([data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileNameHint}-stickers.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    throw new Error(err.response?.data?.message || 'Could not download the PDF.');
  }
};

const qrStickerSlice = createSlice({
  name: 'qrSticker',
  initialState,
  reducers: {
    setSearch(state, action) {
      state.search = action.payload;
    },
    setProducerFilter(state, action) {
      state.producerFilter = action.payload;
    },
    setBatchNoFilter(state, action) {
      state.batchNoFilter = action.payload;
    },
    clearLastResult(state) {
      state.lastResult = null;
      state.generateError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCodes.pending, (state) => {
        state.codesStatus = 'loading';
      })
      .addCase(fetchCodes.fulfilled, (state, action) => {
        state.codesStatus = 'succeeded';
        state.codes = action.payload;
      })
      .addCase(fetchCodes.rejected, (state) => {
        state.codesStatus = 'failed';
      })
      .addCase(fetchFilters.fulfilled, (state, action) => {
        state.filters = action.payload;
      })
      .addCase(generateBatch.pending, (state) => {
        state.generating = true;
        state.generateError = null;
      })
      .addCase(generateBatch.fulfilled, (state, action) => {
        state.generating = false;
        state.lastResult = action.payload;
      })
      .addCase(generateBatch.rejected, (state, action) => {
        state.generating = false;
        state.generateError = action.payload;
      });
  },
});

export const { setSearch, setProducerFilter, setBatchNoFilter, clearLastResult } = qrStickerSlice.actions;
export default qrStickerSlice.reducer;
