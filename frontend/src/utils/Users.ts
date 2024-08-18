import axios from 'axios';
import { User } from '../@types/user';

const fetchUsers = async (setUsers: React.Dispatch<React.SetStateAction<User[]>>) => {
    const token = sessionStorage.getItem('token');
    await axios.get(import.meta.env.VITE_BACKEND_APP_API_URL + 'users_list/', {
        headers: {
            'Authorization': `${token}`,
        },
        withCredentials: true,
    })
    .then((response) => {
        let users: User[] = response.data.map((user:any) => {
            return {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                isStaff: user.is_staff,
                isActive: user.is_active,
                dateJoined: user.date_joined,
                lastLogin: user.last_login,
            }
        })
        setUsers(users);
    })
    .catch((error) => {
        console.log(error);
    })
}

export default fetchUsers;