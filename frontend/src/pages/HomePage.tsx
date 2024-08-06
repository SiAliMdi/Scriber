import { useContext } from "react";
import AuthContext from "../state/context/AuthContext";
import { AuthContextType } from "../@types/Auth.t";

const HomePage = () => {
    const isAuthenticated = false;
    const { user } = useContext(AuthContext) as AuthContextType;
    return (
        user ? (
        <h1>
            Welcome to Scriber!
        </h1>
        ):(
        <h1>
            Please login to access Scriber!
        </h1>
        )
    )
}

export default HomePage