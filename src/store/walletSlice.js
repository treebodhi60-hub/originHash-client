import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';
import { generateBatch } from './qrStickerSlice';

// Whether billing is on and the price list are the same for everyone and rarely change, so they're
// remembered between visits: the Plans tab and price cards show at once on a reload while the
// user's own balance and plan load. (Balance is never cached — it always comes from the server.)
const CACHE_KEY = 'oh_billing';
const readCache = () => {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY)) || {};
  } catch {
    return {};
  }
};
const cached = readCache();

// The signed-in user's prepaid wallet (all amounts in paise). `enabled` is false until the
// server has Razorpay configured — stickers are free and no wallet UI is shown until then.
const initialState = {
  status: 'idle', // idle | loading | ready | failed
  enabled: Boolean(cached.enabled),
  catalog: cached.catalog || null, // the price list (config/plans.js on the server)
  balancePaise: 0,
  pricePerQrPaise: 0,
  minTopupPaise: 10000,
  maxTopupPaise: 20000000,
  maxBalancePaise: 100000000,
  razorpayKeyId: null,
  plan: null, // the user's ACTIVE or PAUSED plan (see planService.planJson), or null = Pay As You Go
};

export const fetchWallet = createAsyncThunk('wallet/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/wallet');
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not load your wallet.');
  }
});

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setBalance(state, action) {
      state.balancePaise = action.payload;
    },
    // After a plan change: { balancePaise, plan }.
    setWalletState(state, action) {
      state.balancePaise = action.payload.balancePaise;
      state.plan = action.payload.plan;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWallet.pending, (state) => {
        if (state.status !== 'ready') state.status = 'loading';
      })
      .addCase(fetchWallet.fulfilled, (state, action) => {
        const { enabled, balancePaise, pricePerQrPaise, minTopupPaise, maxTopupPaise, maxBalancePaise, razorpayKeyId } =
          action.payload;
        Object.assign(state, { enabled, balancePaise, pricePerQrPaise, minTopupPaise, maxTopupPaise, maxBalancePaise, razorpayKeyId });
        state.plan = action.payload.plan ?? null;
        state.catalog = action.payload.catalog ?? null;
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ enabled, catalog: state.catalog }));
        } catch {
          // Storage full or blocked: the page still works, it just can't show the tab early.
        }
        state.status = 'ready';
      })
      .addCase(fetchWallet.rejected, (state) => {
        if (state.status !== 'ready') state.status = 'failed';
      })
      // The server reports the balance after every charge (or refusal), so no refetch is needed.
      .addCase(generateBatch.fulfilled, (state, action) => {
        if (action.payload.wallet) {
          state.balancePaise = action.payload.wallet.balancePaise;
          state.plan = action.payload.wallet.plan ?? null;
        }
      })
      .addCase(generateBatch.rejected, (state, action) => {
        if (action.payload?.code === 'INSUFFICIENT_BALANCE') {
          state.balancePaise = action.payload.balancePaise;
          if ('plan' in action.payload) state.plan = action.payload.plan;
        }
      });
  },
});

export const { setBalance, setWalletState } = walletSlice.actions;

// How a batch of `count` stickers would be paid — the same rule the server applies: the plan's
// remaining monthly allowance first, the rest at the plan's overage price (or Pay As You Go).
export const quoteStickers = (count, { plan, pricePerQrPaise }) => {
  const active = plan?.status === 'ACTIVE' ? plan : null;
  const coveredCount = active ? Math.min(count, active.remaining) : 0;
  const extraCount = count - coveredCount;
  const extraPricePaise = active ? active.overagePricePaise : pricePerQrPaise;
  return { coveredCount, extraCount, extraPricePaise, totalPaise: extraCount * extraPricePaise };
};
export default walletSlice.reducer;
