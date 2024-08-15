import React from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginUser } from '../state/store/UserSlice';
import { UserDispatch } from '../state/store';


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
        <div>
            <form onSubmit={handleLoginSubmit}>
                <input type="email" name="email" placeholder="Enter email" required value={email} onChange={e => setEmail(e.target.value)}/>
                <input type="password" name="password" placeholder="Enter password" required value={password} onChange={e => setPassword(e.target.value)}/>
                <input type="submit" value={"Login"}/>
            </form>
            {/* in case the user did not have an account */}
            <Link to="/register">Register</Link>
        </div>
    )
}

export default LoginPage