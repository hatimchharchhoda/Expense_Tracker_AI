// authSlice.ts (redux slice)
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  session: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('session') || 'null') : null,
  transactions: [],
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action) => {
      state.session = action.payload;
      // Persist session in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('session', JSON.stringify(action.payload));
      }
    },
    logout: (state) => {
      state.session = null;
      state.transactions = [];
      // Remove session from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('session');
      }
    },
    setTransactions: (state, action) => {
      state.transactions = action.payload;
    },
  },
});

export const { login, logout, setTransactions } = authSlice.actions;

export default authSlice.reducer;
