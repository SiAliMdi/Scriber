import { useState } from "react"
import { User } from "../@types/user";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { UserDispatch } from "../state/store";
import { logoutUser } from "../state/store/UserSlice";



const Header = (props: User) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [user, setUser] = useState<User>(props);

    const navigate = useNavigate();
    const dispatch = useDispatch<UserDispatch>();

    const handleLogout = () => {
        dispatch(logoutUser()).then(() => {
            navigate('/login');
            setUser({} as User);
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
        }
        );
    }

    return (
        <header className="h-12 bg-blue-500 md:h-20 lg:h-14 flex items-center justify-between px-4">
            <div className="text-white text-lg md:text-xl lg:text-2xl hover:cursor-pointer" onClick={() => navigate('/')}>
                Scriber
            </div>
            <nav className="text-white flex items-center justify-between w-full" >
                <ul className="flex space-x-4 mx-auto">
                    <li className="hover:cursor-pointer "><a onClick={() => navigate('/categories')} className="hover:underline">Catégories des demandes</a></li>
                </ul>
                <div className="relative ml-auto">
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center space-x-2 focus:outline-none"
                    >
                        <span>{user?.firstName}</span>

                        {/** Drop down icon */}
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 9l-7 7-7-7"
                            ></path>
                        </svg>
                    </button>
                    {/** Drop down list */}
                    {dropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-2 z-20">
                            {user?.isSuperUser && (
                                <a onClick={() => { navigate('/users') }} className="block px-4 py-2 text-gray-800 hover:bg-gray-200 hover:cursor-pointer" >Utilisateurs</a>
                            )
                            }
                            {/*user?.isSuperUser && (
                                <a href={`${import.meta.env.VITE_BACKEND_APP_URL}admin`} className="block px-4 py-2 text-gray-800 hover:bg-gray-200 hover:cursor-pointer" >Page d'administration</a>
                            )*/
                            }
                            <a onClick={handleLogout} className="block px-4 py-2 text-gray-800 bg-red-500 hover:bg-gray-200 hover:cursor-pointer">Déconnexion</a>
                        </div>
                    )}
                </div>
            </nav>
        </header>
    );
}
export default Header;