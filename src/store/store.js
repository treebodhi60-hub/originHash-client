import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import usersReducer from './usersSlice';
import adminsReducer from './adminsSlice';
import imageStockReducer from './imageStockSlice';
import qrStickerReducer from './qrStickerSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    admins: adminsReducer,
    imageStock: imageStockReducer,
    qrSticker: qrStickerReducer,
  },
});
