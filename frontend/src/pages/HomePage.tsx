import { useNavigate } from "react-router-dom";
import { getUser } from "../utils/utilities";
import { useEffect, useState } from "react";
import { User } from "../@types/user";
import { UserDispatch } from "../state/store";
import { useDispatch } from "react-redux";
import { logoutUser } from "../state/store/UserSlice";

const HomePage = () => {
    const  [user, setUser]  = useState<User>(null);

    const navigate = useNavigate();
    const dispatch = useDispatch<UserDispatch>();

    const handleLogout = () => {
        dispatch(logoutUser()).then(() => { 
            navigate('/login');
            setUser(null);
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
            console.log("logged out1");
        }
    );
    }
    useEffect(() => {
        getUser().then((response) => {
            setUser(response);
            if (!response) {
                navigate('/login');
            }
        });
    }, [])
    
    return (
        user ? (
            <>
        <h1>
            Welcome {user.firstName} to Scriber!
        </h1>
        <button type="button" onClick={handleLogout}>Logout</button>
            </>
        ):<></>
    )
}

export default HomePage