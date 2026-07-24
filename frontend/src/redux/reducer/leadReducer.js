import { createSlice } from '@reduxjs/toolkit';
import { set } from 'zod';

const initialState = {
  selectedLeads: [],
  page: 1,
  dashboardPage:1,

};

const leadSlice = createSlice({
  name: 'lead',
  initialState,
  reducers: {
    setSelectedLeads: (state, action) => {
      state.selectedLeads = action.payload;
    },

    clearSelectedLeads: (state) => {
      state.selectedLeads = [];
    },
    setPage: (state, action) => {
      state.page = action.payload;
    },
    setDashboardPage: (state, action) => {
      state.dashboardPage = action.payload;
    }
  },
});

export const { 
  setSelectedLeads, 
setPage,
setDashboardPage,
  clearSelectedLeads 
} = leadSlice.actions;

export default leadSlice.reducer;
