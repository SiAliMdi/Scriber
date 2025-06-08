import { Button } from '@/components/ui/button';
import { Row } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import EditDialog from '../users-list/EditDialog';
import { User } from '@/@types/user';

interface DataTableRowActionsProps {
  row: Row<User>;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  onEdit: (value: User) => void;
  onDelete: (value: User) => void;
}



const DataTableRowActions =({ row, setUsers, onEdit, onDelete }: DataTableRowActionsProps) => {
  
  return (
    <div className="flex items-center justify-end h-1 hover:cursor-pointer">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="hover:cursor-pointer" asChild>
          </DropdownMenuItem>
          <EditDialog {...{ row: row, onEdit: onEdit, setUsers: setUsers, }} />
          <DropdownMenuSeparator />
          <DropdownMenuItem className="hover:cursor-pointer" onClick={() => onDelete(row.original)}>Supprimer</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default DataTableRowActions;