import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice'; // Import your reducer

const store = configureStore({
  reducer: {
    auth: authReducer, // Add your reducer to the store
  },
});

export default store;
