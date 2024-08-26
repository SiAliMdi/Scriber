import React from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";



const RegisterPage = () => {
    const navigate = useNavigate();
    const registerUser = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const email = e.currentTarget.email.value;
        const password = e.currentTarget.password.value;
        const password2 = e.currentTarget.password2.value;
        const first_name = e.currentTarget.first_name.value;
        const last_name = e.currentTarget.last_name.value;
        
        if (password !== password2) {
            console.log('Passwords do not match');
            return;
        }

        const response = await fetch(`${import.meta.env.VITE_BACKEND_APP_API_URL}users/register/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password,
                first_name,
                last_name
            })
        });
        const data = await response.json();
        if (response.ok) {
            navigate('/login');
        } else {
            console.log(`error: ${data}`);
        }
    }

  return <div className="flex items-center justify-center h-screen  bg-gray-100 ">
  <div className="w-full max-w-sm mx-auto overflow-hidden bg-white rounded-lg shadow-md dark:bg-gray-800">
  <div className="px-6 py-4">
      <h3 className="mt-3 text-xl font-medium text-center text-gray-600 dark:text-gray-200">Welcome Back to Scriber</h3>

      <p className="mt-1 text-center text-gray-500 dark:text-gray-400">Login or create account</p>

      <form onSubmit={registerUser}>
          <div className="w-full mt-4">
              <input className="block w-full px-4 py-2 mt-2 text-blue-800 placeholder-gray-500 bg-white border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 focus:border-blue-400 dark:focus:border-blue-300 focus:ring-opacity-40 focus:outline-none focus:ring focus:ring-blue-300" type="email" name="email" placeholder="Email Address" aria-label="Email Address" required />
          </div>
          <div className="w-full mt-4">
              <input className="block w-full px-4 py-2 mt-2 text-blue-800 placeholder-gray-500 bg-white border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 focus:border-blue-400 dark:focus:border-blue-300 focus:ring-opacity-40 focus:outline-none focus:ring focus:ring-blue-300" type="text" name="first_name" placeholder="First Name" aria-label="First Name" required  />
          </div>
          <div className="w-full mt-4">
              <input className="block w-full px-4 py-2 mt-2 text-blue-800 placeholder-gray-500 bg-white border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 focus:border-blue-400 dark:focus:border-blue-300 focus:ring-opacity-40 focus:outline-none focus:ring focus:ring-blue-300" type="text" name="last_name" placeholder="Last Name" aria-label="Last Name" required />
          </div>

          <div className="w-full mt-4">
              <input className="block w-full px-4 py-2 mt-2 text-blue-800 placeholder-gray-500 bg-white border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 focus:border-blue-400 dark:focus:border-blue-300 focus:ring-opacity-40 focus:outline-none focus:ring focus:ring-blue-300" type="password" name="password" placeholder="Password" aria-label="Password" required />
          </div>
          <div className="w-full mt-4">
              <input className="block w-full px-4 py-2 mt-2 text-blue-800 placeholder-gray-500 bg-white border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 focus:border-blue-400 dark:focus:border-blue-300 focus:ring-opacity-40 focus:outline-none focus:ring focus:ring-blue-300" type="password" name="password2" placeholder="Confirm Password" aria-label="Confirm Password" required />
          </div>

          <div className="flex items-center justify-center mt-4">
              <button className="px-6 py-2 text-sm font-medium tracking-wide text-blue-800 capitalize transition-colors duration-300 transform bg-blue-500 rounded-lg hover:bg-blue-400 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-50">
                  Register
              </button>
          </div>
      </form>
  </div>

  <div className="flex items-center justify-center py-4 text-center bg-gray-50 dark:bg-gray-700">
      <span className="text-sm text-gray-600 dark:text-gray-200">Do you already have an account? </span>
        <Link to="/login" className="mx-2 text-sm font-bold text-blue-500 dark:text-blue-400 hover:underline">Login</Link>
  </div>
</div>
</div>
}

export default RegisterPage;
