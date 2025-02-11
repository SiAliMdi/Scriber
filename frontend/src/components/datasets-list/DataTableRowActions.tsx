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
import EditDialog, { EditDialogProps } from './EditDialog';
import ReadDialog, { ReadDialogProps } from './DatasetDialog';
import LabelsDialog, { LabelsDialogProps } from '../categories-list/LabelsDialog';
import { useNavigate } from 'react-router-dom';

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
  setDatasets: (value: TData[]) => void;
  onEdit: (value: TData) => void;
  onDelete: (value: TData) => void;
}



const DataTableRowActions = <TData,>({ row, setDatasets, onEdit, onDelete }: DataTableRowActionsProps<TData>) => {
  const navigate = useNavigate();
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
          <ReadDialog {...{ row } as ReadDialogProps<TData>} />
          <EditDialog {...{ row, onEdit, setDatasets, } as EditDialogProps<TData>}  />
          <DropdownMenuItem className="hover:cursor-pointer" onClick={() => onDelete(row.original)}>Supprimer</DropdownMenuItem>
          <DropdownMenuSeparator />
          <LabelsDialog {...{ row } as LabelsDialogProps<TData>} />
          <DropdownMenuItem className="hover:cursor-pointer" onClick={() => navigate(`/annoter_bin/${row.original.id}`,
            {
              state: {
                datasetId: row.original.id,
                datasetSerialNumber: row.original.serialNumber
              }
            })}>Annoter Binaire</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default DataTableRowActions;