import { User } from "@/@types/user";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { UsersColumnsProps } from "../users-list/Columns";

const useUsersColumns = (getColumns:({onEdit, onDelete} : UsersColumnsProps)=>ColumnDef<User>[] 
) =>
  useMemo(() => getColumns, []);

export { useUsersColumns };
