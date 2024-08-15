import { User } from "../@types/user";
import axios from "axios";

const getUser = async (): Promise<User | null> =>  {
    let savedUser = sessionStorage.getItem('user');
    let token = sessionStorage.getItem('token');
    if (savedUser && token) {
        let resultUser = JSON.parse(savedUser);
        resultUser = {
            ...resultUser,
            firstName: resultUser?.first_name,
            lastName: resultUser?.last_name,
            isActive: resultUser?.is_active,
            isStaff: resultUser?.is_staff,
            isSuperUser: resultUser?.is_superuser,
            lastLogin: resultUser?.last_login,
            dateJoined: resultUser?.date_joined,
        };
        
        try {
            let response = await axios.post(import.meta.env.VITE_BACKEND_APP_API_URL + 'user_password/',  {
                email: resultUser.email,
                password: resultUser.password
            });
            if (response.status !== 200) {
                return null;
            } else {
                console.log("User is valid");
                return resultUser;
            }
        } catch (error) {
            console.log(error);
            return null;
        }
        }
        return null;
    }

const  getCookie = (name: string) => {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            // trim whithout jQuery
            var cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
export { getUser, getCookie };