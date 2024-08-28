import { useCallback, useEffect, useMemo, useState } from "react";
import BasePage from "./BasePage";
import { User } from "../@types/user";
import fetchUsers from "../utils/Users";
import { DataTable } from "@/components/ui/DataTable";
import getColumns from '@/components/users-list/Columns';
import { ColumnDef } from "@tanstack/react-table";
import { activateUser, deleteUser } from "@/services/UsersServices";
import { useToast } from "@/components/ui/use-toast";

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [columns, setColumns] = useState<ColumnDef<User>[]>([]);
  const { toast } = useToast();

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
    deleteUser(value).then(response => {
      if (response === 200) {
        fetchUsers(setUsers);
        toast({
          title: "User deleted",
          duration: 3000,
          description: `User ${value.firstName} ${value.lastName} deleted`,
          className: "text-green-700",
        });
      } else {
        toast({
          variant: "destructive",
          duration: 3000,
          title: "User delete failed",
          description: `User ${value.firstName} ${value.lastName} could not be deleted`,
        });
      }
    }).catch(() => { })
  }, [toast]);


  useMemo(() =>
    setColumns(getColumns({ setUsers: setUsers, onEdit: onEdit, onDelete: onDelete })),
    [onEdit, onDelete]);

  useEffect(() => {
    fetchUsers(setUsers);
  }, [])

  return <div className="xl:w-screen">
    {<BasePage />}
    <div className="container mx-auto py-10 max-h-screen overflow-scroll xl:w-full">
      <DataTable columns={columns} data={users} />
    </div>
  </div>;
};

export default Users;
