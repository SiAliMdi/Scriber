import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import  AuthContext from '../state/context/AuthContext'
import {AuthContextType} from '../@types/Auth.t'

const Header = () => {
    

        let { user, logoutUser } = useContext(AuthContext) as AuthContextType;

    
    return (
        <div>
            <Link to="/">Scriber</Link>
            <span> | </span>
            {user ? (
                <p onClick={logoutUser}>Logout</p>
            ) : ( <div>

                <Link to="/login" >Login</Link>
                <span> | </span>
                <Link to="/register">Register</Link>
            </div>
            )}
            {user && <p>Hello {user.email.split('@')[0]}!</p>}

        </div>
    )
}

export default Header