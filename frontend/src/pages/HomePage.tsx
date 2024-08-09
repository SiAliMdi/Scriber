import { useContext } from "react";
import AuthContext from "../state/context/AuthContext";
import { AuthContextType } from "../@types/Auth.t";

const HomePage = () => {
    const { user } = useContext(AuthContext) as AuthContextType;
    console.log(`HomePage user: ${user?.dateJoined} ${user?.email} ${user?.firstName} `)
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