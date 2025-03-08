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
import ReadDialog, { ReadDialogProps } from './AiModelDialog';
import TrainDialog from './TrainDialog';
import { Dataset } from '@/@types/dataset';
import { Categorie } from '@/@types/categorie';
import { useEffect, useState } from 'react';
import { TrainingConfig } from '@/@types/ai-model';
import { fetchCategories } from "@/services/SearchServices"
interface DataTableRowActionsProps<TData> {
  row: Row<TData>;
  setAiModels: (value: TData[]) => void;
  onEdit: (value: TData) => void;
  onDelete: (value: TData) => void;
}



const DataTableRowActions = <TData,>({ row, setAiModels, onEdit, onDelete }: DataTableRowActionsProps<TData>) => {
  const [categoriesDatasets, setCategoriesDatasets] = useState<Map<Categorie, Dataset[]>>(new Map<Categorie, Dataset[]>());

  useEffect(() => {
    fetchCategories(setCategoriesDatasets);
  }, [])
  
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
          <EditDialog {...{ row, onEdit, setAiModels, } as EditDialogProps<TData>} />
          <DropdownMenuItem className="hover:cursor-pointer" onClick={() => onDelete(row.original)}>Supprimer</DropdownMenuItem>
          <DropdownMenuSeparator />
          {row.original.modelType != "extractif" && <TrainDialog
          row={row}
          categoriesDatasets={categoriesDatasets}
          onTrainStart={(config: TrainingConfig
          ) => {
            console.log("Training started", config);
          }}

          />}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default DataTableRowActions;