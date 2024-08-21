import { User } from "@/@types/user";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

const useUsersColumns = (columns: ColumnDef<User>[]) =>
  useMemo(() => columns, []);

export { useUsersColumns };
