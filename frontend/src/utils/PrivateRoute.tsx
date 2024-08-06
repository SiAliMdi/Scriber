import { Navigate } from 'react-router-dom'
import { useContext } from 'react'
import {AuthContextType} from '../@types/Auth.t'
import  AuthContext  from '../state/context/AuthContext'

const PrivateRoute:  React.FC<{ children: React.ReactNode }> = ({children}) => {
    const {user} = useContext(AuthContext) as AuthContextType;
    return !user ? <Navigate to='/login'/> : children;
}

export default PrivateRoute;