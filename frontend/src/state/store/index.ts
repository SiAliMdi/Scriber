import { configureStore, Tuple } from '@reduxjs/toolkit';
import userReducer from './UserSlice';
import {thunk} from 'redux-thunk';


const store = configureStore({
    reducer: {
        user: userReducer,
    },
    // middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
    middleware: () => new Tuple(thunk),
});

export type UserDispatch = typeof store.dispatch;

export default store;