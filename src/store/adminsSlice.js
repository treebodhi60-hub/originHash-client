import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

const initialState = {
  list: [],
  search: '',
  status: 'idle',
  error: null,
};

export const fetchAdmins = createAsyncThunk(
  'admins/fetchAdmins',
  async ({ search = '' } = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/admins', { params: { search } });
      return data.admins;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Could not load admins.');
    }
  }
);

export const addAdmin = createAsyncThunk('admins/addAdmin', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/admins', payload);
    return data.admin;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not add admin.');
  }
});

export const editAdmin = createAsyncThunk(
  'admins/editAdmin',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/admins/${id}`, payload);
      return data.admin;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Could not update admin.');
    }
  }
);

export const promoteUser = createAsyncThunk(
  'admins/promoteUser',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/admins/${id}/promote`, payload);
      return data.admin;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Could not promote user.');
    }
  }
);

export const demoteAdmin = createAsyncThunk(
  'admins/demoteAdmin',
  async ({ id, payload = {} }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/admins/${id}/demote`, payload);
      return data.user;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Could not demote admin.');
    }
  }
);

const adminsSlice = createSlice({
  name: 'admins',
  initialState,
  reducers: {
    setSearch(state, action) {
      state.search = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdmins.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAdmins.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload;
      })
      .addCase(fetchAdmins.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(addAdmin.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })
      .addCase(editAdmin.fulfilled, (state, action) => {
        const idx = state.list.findIndex((a) => a.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(promoteUser.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })
      .addCase(demoteAdmin.fulfilled, (state, action) => {
        state.list = state.list.filter((a) => a.id !== action.payload.id);
      });
  },
});

export const { setSearch } = adminsSlice.actions;
export default adminsSlice.reducer;
