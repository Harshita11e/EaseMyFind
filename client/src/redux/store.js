import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import itemReducer from './slices/itemSlice';
import notificationReducer from './slices/notificationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    items: itemReducer,
    notifications: notificationReducer
  }
});

export default store;