import { useNavigate } from "react-router-dom";
import { getUser } from "../utils/utilities";
import { useEffect, useState } from "react";
import { User } from "../@types/user";
import Header from "../components/Header";

const HomePage = () => {
    const  [user, setUser]  = useState<User>(null);

    const navigate = useNavigate();
    
    useEffect(() => {
        getUser().then((response) => {
            setUser(response);
            if (!response) {
                navigate('/login');
            }
        });
    }, [])
    
    return (
        user ? (<Header {...user} />          
        ):<></>
    )
}

export default HomePage