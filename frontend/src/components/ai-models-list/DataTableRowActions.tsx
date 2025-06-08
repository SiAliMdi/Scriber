import { Button } from '@/components/ui/button';
import { Row } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  // DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import EditDialog from './EditDialog';
import ReadDialog from './AiModelDialog';
import TrainDialog from './TrainDialog';
import { Dataset } from '@/@types/dataset';
// import { Categorie } from '@/@types/categorie';
import { useEffect, useState } from 'react';
import AiModel from '@/@types/ai-model';
// import { fetchCategories } from "@/services/SearchServices"
import { fetchAiModel } from '@/services/AiModelsServices';
import { fetchDatasets } from '@/services/DatasetsServices';
interface DataTableRowActionsProps {
  row: Row<AiModel>;
  setAiModels: React.Dispatch<React.SetStateAction<AiModel[]>>;
  onEdit: (value: AiModel) => void;
  onDelete: (value: AiModel) => void;
}



const DataTableRowActions = ({ row, setAiModels, onEdit, onDelete }: DataTableRowActionsProps) => {
  // const [categoriesDatasets, setCategoriesDatasets] = useState<Map<Categorie, Dataset[]>>(new Map<Categorie, Dataset[]>());
  const [model, setModel] = useState<AiModel | undefined>(undefined);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  useEffect(() => {
    // fetchCategories(setCategoriesDatasets);
    fetchAiModel(row.original.id || "").then((m) => {
      setModel(m);
      if (m?.category) {
        fetchDatasets(m.category.split(" - ")[0], setDatasets);
      }
    });
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
          <ReadDialog {...{ row: row }} />
          <EditDialog {...{ row, onEdit, setAiModels, }} />
          <DropdownMenuItem className="hover:cursor-pointer" onClick={() => onDelete(row.original)}>Supprimer</DropdownMenuItem>
          {/* <DropdownMenuSeparator /> */}
          {model?.modelType != "extractif" && <TrainDialog
            row={row}
            // filter dataset of the current model's category
            datasets={datasets}
          //categoriesDatasets.get(model?.category.id) || []}
          // categoriesDatasets={categoriesDatasets}
          /* onTrainStart={(config: TrainingConfig
          ) => {
            console.log("Training started", config);
          }} */

          />}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default DataTableRowActions;