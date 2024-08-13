import { Link } from "react-router-dom";
import { getUser } from "../utils/utilities";
import { useEffect, useState } from "react";
import { User } from "../@types/user";

const HomePage = () => {
    const  [user, setUser]  = useState<User>(null);
    useEffect(() => {
        getUser().then((response) => {
            setUser(response);
        });
    }, [])
    
    return (
        user ? (
        <h1>
            Welcome {user.firstName} to Scriber!
        </h1>
        ):(
            <>
        <Link to="/login">Login</Link>
        <p>{user}</p>
            </>
        )
    )
}

export default HomePage