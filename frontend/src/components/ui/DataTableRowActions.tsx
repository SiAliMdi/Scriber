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
import DialogDemo from '../users-list/EditDialog';

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
  onEdit: (value: TData) => void;
  onDelete: (value: TData) => void;
}


const DataTableRowActions = <TData,>({ row, onEdit, onDelete }: DataTableRowActionsProps<TData>) => {
  const handleEditClick = (event: { stopPropagation: () => void; }) => {
    event.stopPropagation();
    onEdit(row.original);
  };
  return (
    <div className="flex items-center justify-end h-1 hover:cursor-pointer">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex h-8 w-8 p-0 data-[state=open]:bg-muted">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {/* <DropdownMenuItem className="hover:cursor-pointer" onClick={() => onEdit(row.original)}> */}
          <DropdownMenuItem className="hover:cursor-pointer" onClick={handleEditClick}>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="hover:cursor-pointer" onClick={() => onDelete(row.original)}>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogDemo />
    </div>
  );
};

export default DataTableRowActions;