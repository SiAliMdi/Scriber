import { useEffect, useState } from "react";
import BasePage from "./BasePage";
import { User } from "../@types/user";
import fetchUsers from "../utils/Users";
import { DataTable } from "@/components/ui/DataTable";
import columns from '@/components/users-list/Columns';
import { useUsersColumns } from "@/components/custom-hooks/UseColumns";

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const usersColumns = useUsersColumns(columns);

  useEffect(() => {
    fetchUsers(setUsers);
  }, [])

  return <>
    {<BasePage />}
    <div className="container mx-auto py-10 max-h-screen overflow-scroll">
      <DataTable columns={usersColumns} data={users} />
    </div>
  </>;
};

export default Users;
