import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

const initialState = {
  list: [],
  total: 0,
  active: 0,
  blocked: 0,
  status: 'idle',
  error: null,
  search: '',
  statusFilter: 'all',
};

export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async ({ search = '', status = 'all' } = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/users', { params: { search, status } });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Could not load users.');
    }
  }
);

export const addUser = createAsyncThunk('users/addUser', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/users', payload);
    return data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not add user.');
  }
});

export const editUser = createAsyncThunk(
  'users/editUser',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/users/${id}`, payload);
      return data.user;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Could not update user.');
    }
  }
);

export const toggleBlock = createAsyncThunk(
  'users/toggleBlock',
  async ({ id, block }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/users/${id}/${block ? 'block' : 'unblock'}`);
      return data.user;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Could not update user status.');
    }
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setSearch(state, action) {
      state.search = action.payload;
    },
    setStatusFilter(state, action) {
      state.statusFilter = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload.users;
        state.total = action.payload.total;
        state.active = action.payload.active;
        state.blocked = action.payload.blocked;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(addUser.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
        state.total += 1;
        state.active += 1;
      })
      .addCase(editUser.fulfilled, (state, action) => {
        const idx = state.list.findIndex((u) => u.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(toggleBlock.fulfilled, (state, action) => {
        const idx = state.list.findIndex((u) => u.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
        state.blocked = state.list.filter((u) => u.isBlocked).length;
        state.active = state.list.length - state.blocked;
      });
  },
});

export const { setSearch, setStatusFilter } = usersSlice.actions;
export default usersSlice.reducer;
