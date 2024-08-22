import axios from "axios";
import { User } from "../@types/user";

const fetchUsers = async (setUsers: React.Dispatch<React.SetStateAction<User[]>>) => {

  const token = sessionStorage.getItem("token");
  await axios
    .get(
      import.meta.env.VITE_BACKEND_APP_API_URL + "users_list/",
      {
        headers: {
          Authorization: `${token}`,
        },
        withCredentials: true,
      }
    )
    .then((response) => {
      const users: User[] = response.data.map(
        (user: {
          id: number;
          first_name: string;
          last_name: string;
          email: string;
          is_staff: boolean;
          is_superuser: boolean;
          is_active: boolean;
          date_joined: string;
          last_login: string;
        }) => {
          return {
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            isStaff: user.is_staff,
            isSuperUser: user.is_superuser,
            isActive: user.is_active,
            dateJoined: user.date_joined,
            lastLogin: user.last_login,
          };
        }
      );
      console.log(
        "Users fetched in fetch function",
        users.length
      );
      setUsers(users);
    })
    .catch((error) => {
      console.log(error);
    });
};

export default fetchUsers;
