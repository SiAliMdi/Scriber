import { useEffect, useState } from "react";
import BasePage from "./BasePage";
import { User } from "../@types/user";
import fetchUsers from "../utils/Users";
import EnhancedTable from "../components/DataTables/EnhancedTable";



const Users = () => {
    const [users, setUsers] = useState<User[]>([])

    useEffect(() => {
        fetchUsers(setUsers);
    }, [])

    
    
   
      
      

  return <>
  {<BasePage />}

  Users
  <EnhancedTable users={users} />   
  {/*
  {users.map((user, index) => {
    return (
      <div key={user?.id} className="mr-4">
       {index+1}  
       firstName: {user?.firstName} |
       lastName: {user?.lastName} |
       email: {user?.email} |
       isStaff: {user?.isStaff.toString()} |
       isActive: {user?.isActive.toString()} |
       {user?.dateJoined?.toString()} {user?.lastLogin?.toString()}
      </div>  
    )
  } )}
    */}
  </>;
};

export default Users;
