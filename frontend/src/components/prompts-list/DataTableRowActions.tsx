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
import EditDialog from './EditDialog';
import ReadDialog from './PromptDialog';
import { Prompt } from '@/@types/prompt';

interface DataTableRowActionsProps {
  row: Row<Prompt>;
  setPrompts: React.Dispatch<React.SetStateAction<Prompt[]>>;
  onEdit: (value: Prompt) => void;
  onDelete: (value: Prompt) => void;
}



const DataTableRowActions = ({ row, setPrompts, onEdit, onDelete }: DataTableRowActionsProps) => {
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
          <ReadDialog {...{ row }} />
          <EditDialog {...{ row, onEdit, setPrompts, }} />
          <DropdownMenuSeparator />
          <DropdownMenuItem className="hover:cursor-pointer" onClick={() => onDelete(row.original)}>Supprimer</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default DataTableRowActions;