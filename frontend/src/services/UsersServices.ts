import { User } from "@/@types/user";
import axios from "axios";

const activateUser = async (user: User) => {
  try {
    const response = await axios.put(
      `${import.meta.env.VITE_BACKEND_APP_API_URL}users/user/`,
      {
        email: user?.email,
        is_staff: user?.isStaff,
      },
      {
        headers: {
          Authorization: `${sessionStorage.getItem("token")}`,
        },
      }
    );
    return response.status;
  } catch (error) {
    console.error("Error activating user:", error);
    throw error;
  }
};

const deleteUser = async (user: User) => {
  try {
    const response = await axios.delete(
      `${import.meta.env.VITE_BACKEND_APP_API_URL}users/user/`,
      {
        headers: {
          Authorization: `${sessionStorage.getItem("token")}`,
        },
        data: {
          email_to_delete: user?.email,
        },
      }
    );
    return response.status;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

export { activateUser, deleteUser };
