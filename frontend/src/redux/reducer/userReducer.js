import { createSlice } from "@reduxjs/toolkit";
import { set } from "zod";

const initialState = {
  loggedIn: false,
  userId: null,
  staffId:null,
  page:1,
  user:null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setLoggedIn: (state, action) => {
      state.loggedIn = action.payload;
    },
    setUserId: (state, action) => {
      state.userId = action.payload;
    },
     setStaffId: (state, action) => {
      state.staffId = action.payload;
    },
       setPage: (state, action) => {
          state.page = action.payload;
        },
        setUser: (state, action) => {
          state.user = action.payload;
        },
  },
});

export const { setUserId ,setStaffId,setLoggedIn,setPage,setUser} = userSlice.actions;
export default userSlice.reducer; // ✅ Export the reducer only
