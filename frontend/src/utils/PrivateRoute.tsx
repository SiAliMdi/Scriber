import { Navigate } from 'react-router-dom'

const PrivateRoute:  React.FC<{ children: React.ReactNode }> = ({children}) => {

    let gottenUser = localStorage.getItem('user');
    return !gottenUser ? <Navigate to='/login'/> : children;
}

export default PrivateRoute;