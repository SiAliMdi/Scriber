import { useCallback, useEffect, useMemo, useState } from "react";
import BasePage from "./BasePage";
import { User } from "../@types/user";
import fetchUsers from "../utils/Users";
import { DataTable } from "@/components/ui/DataTable";
import getColumns from '@/components/users-list/Columns';
import { ColumnDef } from "@tanstack/react-table";
import { activateUser, deleteUser } from "@/services/UsersServices";

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [columns, setColumns] = useState<ColumnDef<User>[]>([]);

  const onEdit = useCallback((value: User) => {
    activateUser(value).then((response) => {
      console.log(response);
    }
    ).catch((error) => {
      console.error(error);
    }
    );
  }, []);

  const onDelete = useCallback((value: User) => {
      deleteUser(value).then(() => {
        console.log("User deleted");
        fetchUsers(setUsers);
      }
      ).catch((error) => {
        console.error(error + " not deleted");
      }
      );
   
  }, []);


  useMemo(() =>
    setColumns(getColumns({ onEdit: onEdit, onDelete: onDelete })),
    [onEdit, onDelete]);

  useEffect(() => {
    fetchUsers(setUsers);
  }, [])

  return <>
    {<BasePage />}
    <div className="container mx-auto py-10 max-h-screen overflow-scroll">
      <DataTable columns={columns} data={users} />
    </div>
  </>;
};

export default Users;
