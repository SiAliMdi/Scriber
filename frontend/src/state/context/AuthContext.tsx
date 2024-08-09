import React, { createContext, useEffect, useState } from 'react'
import {AuthProviderProps, AuthContextType, User} from '../../@types/Auth.t'
import { useNavigate } from "react-router-dom";


const AuthContext = createContext<AuthContextType | null>(null);

type Props = { children: React.ReactNode };
export default AuthContext;

export const AuthProvider: React.FC<AuthProviderProps> = ({children}: { children: React.ReactNode }) => {
    
    let [user, setUser] = useState<User>(null)
    let [authTokens, setAuthTokens] = useState("")
    let navigate = useNavigate();

    useEffect(() => {
        const currentUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        console.log(`Authcontext user: ${currentUser} ${token}`)
        if (currentUser && token) {
            setUser(JSON.parse(currentUser));
            setAuthTokens(token);
        }
    }, []);
    

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
            let gottenUser: User = {
                email: data.user.email,
                password: data.user.password.value,
                isStaff: data.user.is_staff,
                isSuperuser: data.user.is_superuser,
                isActive: data.user.is_active,
                firstName: data.user.first_name,
                lastName: data.user.last_name,
                dateJoined: data.user.date_joined,
                lastLogin: data.user.last_login,
                id: data.user.id
            }
            setUser(gottenUser);
            setAuthTokens(data.token);
            localStorage.setItem('user', JSON.stringify(gottenUser));
            localStorage.setItem('token', data.token);
            navigate('/');
            console.log(`Authcontext user: ${data.user.email} ${data.user.first_name} `)

        } else {
            console.log(`error ${data}`)
        }
    }
    
    let logoutUser = (e: React.MouseEvent<HTMLParagraphElement>) => {
        e.preventDefault()
        setUser(null);
        setAuthTokens("");
        navigate('/login');
        localStorage.removeItem('user');
        localStorage.removeItem('token');

    }

    let contextData = {
        user: user,
        authTokens: authTokens,
        loginUser: loginUser,
        logoutUser: logoutUser,
    }

	return (<AuthContext.Provider value={contextData}> {children} </AuthContext.Provider>)
}