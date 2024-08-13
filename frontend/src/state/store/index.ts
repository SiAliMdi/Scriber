import { configureStore } from '@reduxjs/toolkit';
import userReducer from './UserSlice';


const store = configureStore({
    reducer: {
        user: userReducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
});

export type UserDispatch = typeof store.dispatch;

export default store;