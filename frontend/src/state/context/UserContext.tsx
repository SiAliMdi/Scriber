import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../../@types/user';
import { getUser } from '../../utils/User';
import { useNavigate } from 'react-router-dom';

const UserContext = createContext<User | null>(null);



export const UserProvider: React.FC<React.ReactNode> = ( children ) => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
        getUser().then((response) => {
            setUser(response);
        } ).catch((error) => {
            console.error("Error fetching user:", error);
            navigate('/login');
        }
    );
    } 
  }, []);

  return (
    <UserContext.Provider value={user}>
        {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  return useContext(UserContext);
};