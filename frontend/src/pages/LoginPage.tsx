import React from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { UserDispatch } from '../state/store';
import { loginUser } from '../state/store/UserSlice';


const LoginPage = () => {
    const [email, setEmail] = React.useState<string>("");
    const [password, setPassword] = React.useState<string>("");

    // const {loading, error} =  useSelector((state: SliceState) => state);

    const dispatch = useDispatch<UserDispatch>();
    const navigate = useNavigate();

    const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        let userCredentials = { email, password };
        dispatch(loginUser(userCredentials )).then((response) => {
            if (response.payload) {
                setEmail("");
                setPassword("");
                navigate("/");
            }      
        });
    };

    return (
        <div className="flex items-center justify-center h-screen  bg-gray-100 ">
        <div className="w-full max-w-sm mx-auto overflow-hidden bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div className="px-6 py-4">
            <h3 className="mt-3 text-xl font-medium text-center text-gray-600 dark:text-gray-200 ">Welcome Back to Scriber</h3>
    
            <p className="mt-1 text-center text-gray-500 dark:text-gray-400">Login or create account</p>
    
            <form onSubmit={handleLoginSubmit}>
                <div className="w-full mt-4">
                    <input className="block w-full px-4 py-2 mt-2 text-white placeholder-gray-500 bg-white border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 focus:border-blue-400 dark:focus:border-blue-300 focus:ring-opacity-40 focus:outline-none focus:ring focus:ring-blue-300" type="email" name="email" placeholder="Email Address" aria-label="Email Address" required onChange={e => setEmail(e.target.value)} value={email} />
                </div>
    
                <div className="w-full mt-4">
                    <input className="block w-full px-4 py-2 mt-2 text-white placeholder-gray-500 bg-white border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 focus:border-blue-400 dark:focus:border-blue-300 focus:ring-opacity-40 focus:outline-none focus:ring focus:ring-blue-300" type="password" name="password" placeholder="Password" aria-label="Password" required onChange={e => setPassword(e.target.value)} value={password}/>
                </div>
    
                <div className="flex items-center justify-center mt-4">
                    <button className="px-6 py-2 text-sm font-medium tracking-wide text-white capitalize transition-colors duration-300 transform bg-blue-500 rounded-lg hover:bg-blue-400 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-50">
                        Sign In
                    </button>
                </div>
            </form>
        </div>
    
        <div className="flex items-center justify-center py-4 text-center bg-gray-50 dark:bg-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-200">Don't have an account? </span>
            <Link to="/register" className="mx-2 text-sm font-bold text-blue-500 dark:text-blue-400 hover:underline">Register</Link>
        </div>
    </div>
    </div>  
    
  

      
    )
}

export default LoginPage