import React, { createContext, useState } from 'react'
import {AuthProviderProps, AuthContextType, User} from '../../@types/Auth.t'
import { useNavigate } from "react-router-dom";


const AuthContext = createContext<AuthContextType | null>(null);


export default AuthContext;

export const AuthProvider: React.FC<AuthProviderProps> = ({children}) => {
    
    let [user, setUser] = useState<User>(null)
    let [authTokens, setAuthTokens] = useState("")
    let navigate = useNavigate();
    

    let loginUser = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const response = await fetch(`${import.meta.env.VITE_BACKEND_APP_API_URL}login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: e.currentTarget.email.value,
                password: e.currentTarget.password.value
            })
        });
        const data = await response.json();
        if (response.ok) {
            setUser(data.user);
            setAuthTokens(data.token);
            navigate('/');

        } else {
            alert(`error ${data}`)
        }
    }

    let logoutUser = (e: React.MouseEvent<HTMLParagraphElement>) => {
        e.preventDefault()
    }

    let contextData = {
        user: user,
        authTokens: authTokens,
        loginUser: loginUser,
        logoutUser: logoutUser,
    }

	return (<AuthContext.Provider value={contextData}> {children} </AuthContext.Provider>)
}