import React from "react";
import { useNavigate } from "react-router-dom";



const RegisterPage = () => {
    const navigate = useNavigate();
    const registerUser = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const response = await fetch(`${import.meta.env.VITE_BACKEND_APP_API_URL}register/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: e.currentTarget.email.value,
                password: e.currentTarget.password.value,
                first_name: e.currentTarget.first_name.value,
                last_name: e.currentTarget.last_name.value
            })
        });
        const data = await response.json();
        if (response.ok) {
            navigate('/login');
        } else {
            console.log(`error: ${data}`);
        }
    }

  return <div>
    <h1>Register</h1>
    <form onSubmit={registerUser}>
      <input type="email" name="email" placeholder="Enter email"/>
        <input type="text" name="first_name" placeholder="Enter first name"/>
        <input type="text" name="last_name" placeholder="Enter last name"/>
      <input type="password" name="password" placeholder="Enter password"/>
        <input type="password" name="password2" placeholder="Re-enter password"/>
      <input type="submit"/>
    </form>

  </div>;
}

export default RegisterPage;
