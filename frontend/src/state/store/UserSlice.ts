import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { SliceState } from '../../@types/state';
import axios from 'axios';

export const loginUser = createAsyncThunk( 'user/loginUser', async (data: { email: string, password: string }, thunkAPI) => {
    try {
        const request = await axios.post(import.meta.env.VITE_BACKEND_APP_API_URL + 'users/login/', data);
        const response = request.data;
        
        sessionStorage.setItem('token', response.token);
        sessionStorage.setItem('user', JSON.stringify(response.user));
        // Cookies.set('jwt', response.token);
        return {user: response.user, token: response.token};
        
} catch (error) {
        return thunkAPI.rejectWithValue({ error });
    }
} );

export const logoutUser = createAsyncThunk('user/logoutUser', async (_, thunkAPI) => {
    try {
        const token = sessionStorage.getItem('token');
          const request = await axios.post(import.meta.env.VITE_BACKEND_APP_API_URL + 'users/logout/', {}, {
            headers: {
                'Authorization': `${token}`,
            },
            withCredentials: true,
        }); 
        const response = request.data;
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        return response;
    } catch (error) {
        return thunkAPI.rejectWithValue({ error });
    }
}   );



const initialState: SliceState = { loading: false, user: null, error: null };

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.user = null;
        state.error = null;
        })
        .addCase(loginUser.fulfilled, (state, action) => {
            state.loading = true;
            state.user = action.payload.user;
            state.error = null;
        })
        .addCase(loginUser.rejected, (state) => {
            state.loading = false;
            state.user = null;
            state.error = null ;
        });
    },
 });


const userReducer = userSlice.reducer;
export default userReducer;