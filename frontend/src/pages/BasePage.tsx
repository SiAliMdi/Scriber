import { useNavigate } from "react-router-dom";
import { getUser } from "../utils/User";
import { useEffect, useState } from "react";
import { User } from "../@types/user";
import React from "react";
import Header from "../components/Header";

const BasePage: React.FC = () => {
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
        user ? (<div>
        <Header {...user} />

        </div>  

        ):<></>
    )
}

export default BasePage