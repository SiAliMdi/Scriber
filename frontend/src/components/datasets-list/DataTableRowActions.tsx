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
import ReadDialog from './DatasetDialog';
import LabelsDialog from '../categories-list/LabelsDialog';
import AnnotateDialog from "./AnnotateBinDialog";
import AnnotateExtractDialog from "./AnnotateExtractDialog";
import { useLocation } from 'react-router-dom';
import ValidationDialog from './ValidationDialog';
import ExtValidationDialog from './ExtValidationDialog';
import DownloadDatasetDialog from './DownloadDatasetDialog';
import { Dataset } from '@/@types/dataset';

interface DataTableRowActionsProps {
  row: Row<Dataset>;
  setDatasets: React.Dispatch<React.SetStateAction<Dataset[]>>;
  // onEdit: (value: Dataset) => void;
  onDelete: (value: Dataset) => void;
}



const DataTableRowActions = ({ row, setDatasets,  onDelete }: DataTableRowActionsProps) => {
  // const navigate = useNavigate();
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
          <ReadDialog {...{ row }} />
          <EditDialog {...{ row,  setDatasets}} />
          <DropdownMenuItem className="hover:cursor-pointer" onClick={() => onDelete(row.original)}>Supprimer</DropdownMenuItem>
          <DropdownMenuSeparator />
          <LabelsDialog {...{ row }} />

          <AnnotateDialog
            categoryId={location.state.categoryId}
            datasetId={row.original.id || ''}
            datasetSerialNumber={row.original.serialNumber}
          />
          <AnnotateExtractDialog
            categoryId={location.state.categoryId}
            datasetId={row.original.id || ''}
            datasetSerialNumber={row.original.serialNumber}
          />

          <ValidationDialog
            datasetId={row.original.id || ''}
            datasetSerialNumber={row.original.serialNumber}
          // categoryId={location.state.categoryId}
          />

          <ExtValidationDialog
            datasetId={row.original.id || ''}
            datasetSerialNumber={row.original.serialNumber}
          // categoryId={location.state.categoryId}
          />

          <DownloadDatasetDialog
            datasetId={row.original.id || ''}
            datasetName={row.original.name || row.original.serialNumber?.toString() || ''}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default DataTableRowActions;