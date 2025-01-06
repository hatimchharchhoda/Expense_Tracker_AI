import { createSlice } from "@reduxjs/toolkit";
import { stat } from "fs";

const initialState = {
    status : false,
    userData: null
}

const authSlice = createSlice({
    name: "auth",   
    initialState,
    reducers: {
        login: (state, action) => {
            state.status = true;
            state.userData = action.payload;
            console.log(state.userData,state.status)
        },
        logout: (state) => {
            state.status = false;
            state.userData = null;
        }
     }
})

export const {login, logout} = authSlice.actions;

export default authSlice.reducer;