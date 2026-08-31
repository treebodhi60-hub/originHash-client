import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

const storedUser = localStorage.getItem('oh_user');

const initialState = {
  token: localStorage.getItem("oh_token") || null,
  user: storedUser ? JSON.parse(storedUser) : null,
  mobile: "",
  sessionId: null,
  demoOtp: null,
  status: "idle", // idle | loading | succeeded | failed
  error: null,
};

export const sendOtp = createAsyncThunk('auth/sendOtp', async (mobile, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/send-otp', { mobile });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not send OTP.');
  }
});

// export const verifyOtp = createAsyncThunk(
//   'auth/verifyOtp',
//   async ({ mobile, otp }, { rejectWithValue }) => {
//     try {
//       const { data } = await api.post('/auth/verify-otp', { mobile, otp });
//       return data;
//     } catch (err) {
//       return rejectWithValue(err.response?.data?.message || 'Could not verify OTP.');
//     }
//   }
// );

export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async ({ mobile, otp, sessionId }, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/auth/verify-otp", {
        mobile,
        otp,
        sessionId,
      });

      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Could not verify OTP.",
      );
    }
  },
);

export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/users/me');
    return data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not load profile.');
  }
});

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await api.put('/users/me', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data.user;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Could not update profile.');
    }
  }
);

export const skipOnboarding = createAsyncThunk(
  'auth/skipOnboarding',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/users/me/skip');
      return data.user;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Could not continue.');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      localStorage.removeItem('oh_token');
      localStorage.removeItem('oh_user');
    },
    clearError(state) {
      state.error = null;
    },
    setUser(state, action) {
      state.user = action.payload;
      localStorage.setItem('oh_user', JSON.stringify(action.payload));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendOtp.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      // .addCase(sendOtp.fulfilled, (state, action) => {
      //   state.status = 'succeeded';
      //   state.mobile = action.payload.mobile;
      //   state.demoOtp = action.payload.demoOtp;
      // })

      .addCase(sendOtp.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.mobile = action.payload.mobile;
        state.sessionId = action.payload.sessionId;
      })

      .addCase(sendOtp.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(verifyOtp.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.token = action.payload.token;
        state.user = action.payload.user;
        localStorage.setItem("oh_token", action.payload.token);
        localStorage.setItem("oh_user", JSON.stringify(action.payload.user));
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload;
        localStorage.setItem("oh_user", JSON.stringify(action.payload));
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        localStorage.setItem("oh_user", JSON.stringify(action.payload));
      })
      .addCase(skipOnboarding.fulfilled, (state, action) => {
        state.user = action.payload;
        localStorage.setItem("oh_user", JSON.stringify(action.payload));
      });
  },
});

export const { logout, clearError, setUser } = authSlice.actions;
export default authSlice.reducer;
