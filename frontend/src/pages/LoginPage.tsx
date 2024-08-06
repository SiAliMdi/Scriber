import React, {useContext} from 'react'
import AuthContext from '../state/context/AuthContext'
import {AuthContextType} from '../@types/Auth.t'

const LoginPage = () => {

    let {loginUser} = useContext(AuthContext) as AuthContextType

    return (
        <div>
            <form onSubmit={loginUser}>
                <input type="email" name="email" placeholder="Enter email"/>
                <input type="password" name="password" placeholder="Enter password"/>
                <input type="submit"/>
            </form>
        </div>
    )
}

export default LoginPage