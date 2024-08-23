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
import EditDialog, { EditDialogProps } from '../users-list/EditDialog';

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
  setUsers: (value: TData[]) => void;
  onEdit: (value: TData) => void;
  onDelete: (value: TData) => void;
}



const DataTableRowActions = <TData,>({ row, setUsers, onEdit, onDelete }: DataTableRowActionsProps<TData>) => {
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
          <EditDialog {...{ row: row, onEdit: onEdit,  setUsers: setUsers } as EditDialogProps<TData>} />
          <DropdownMenuSeparator />
          <DropdownMenuItem className="hover:cursor-pointer" onClick={() => onDelete(row.original)}>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default DataTableRowActions;