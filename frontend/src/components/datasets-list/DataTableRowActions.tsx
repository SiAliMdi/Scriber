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
import AnnotateDialog from "./AnnotateBinDialog";
import AnnotateExtractDialog from "./AnnotateExtractDialog";
import { useLocation, useNavigate } from 'react-router-dom';
import ValidationDialog from './ValidationDialog';

interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
  setDatasets: (value: TData[]) => void;
  onEdit: (value: TData) => void;
  onDelete: (value: TData) => void;
}



const DataTableRowActions = <TData,>({ row, setDatasets, onEdit, onDelete }: DataTableRowActionsProps<TData>) => {
  const navigate = useNavigate();
  const location = useLocation();
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
          <EditDialog {...{ row, onEdit, setDatasets, } as EditDialogProps<TData>} />
          <DropdownMenuItem className="hover:cursor-pointer" onClick={() => onDelete(row.original)}>Supprimer</DropdownMenuItem>
          <DropdownMenuSeparator />
          <LabelsDialog {...{ row } as LabelsDialogProps<TData>} />
          <AnnotateDialog
            categoryId={location.state.categoryId}
            datasetId={row.original.id}
            datasetSerialNumber={row.original.serialNumber}
          />
          <AnnotateExtractDialog
            categoryId={location.state.categoryId}
            datasetId={row.original.id}
            datasetSerialNumber={row.original.serialNumber}
          />
          {/* <DropdownMenuItem className="hover:cursor-pointer" onClick={() => navigate(`/annoter_ext/${row.original.id}`,
            {
              state: {
                datasetId: row.original.id,
                datasetSerialNumber: row.original.serialNumber,
                labels : row.original.labels,
              }
            })} >Annoter Extractif</DropdownMenuItem> */}

          <ValidationDialog
            datasetId={row.original.id}
            datasetSerialNumber={row.original.serialNumber}
            categoryId={location.state.categoryId}
          />

        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default DataTableRowActions;