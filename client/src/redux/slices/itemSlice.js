import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  total: 0,
  pages: 0,
  currentPage: 1,
  loading: false,
  error: null,
  filters: {
    search: '',
    category: '',
    status: '',
    startDate: '',
    endDate: '',
    sort: 'newest'
  }
};

const itemSlice = createSlice({
  name: 'items',
  initialState,
  reducers: {
    setItems: (state, action) => {
      state.items = action.payload.items;
      state.total = action.payload.total;
      state.pages = action.payload.pages;
      state.currentPage = action.payload.currentPage;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    }
  }
});

export const { setItems, setFilters, resetFilters, setLoading, setError } = itemSlice.actions;
export default itemSlice.reducer;