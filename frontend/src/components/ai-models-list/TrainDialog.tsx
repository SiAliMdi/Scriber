import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Row } from "@tanstack/react-table";
import { useToast } from "@/components/ui/use-toast";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Dataset } from "@/@types/dataset";
import { Categorie } from "@/@types/categorie";
import { AiModelType, TrainingConfig } from "@/@types/ai-model";
import { fetchAiModelTypes } from "@/services/AiModelsServices";
import {v4 as uuidv4} from 'uuid';

interface TrainingDialogProps<TData> {
  row: Row<TData>;
  // categoriesDatasets: Map<Categorie, Dataset[]>;
  datasets: Dataset[];
  // onTrainStart: (config: TrainingConfig) => void;
}

interface TrainingResult {
  accuracy?: number;
  splits_info?: string;
  error?: string;
}
interface TrainingNotification {
  training_id: string;
  status: string;
  result: TrainingResult;
  message: string;
}

const TrainDialog = <TData,>({ row, datasets }: TrainingDialogProps<TData>) => {
  // const [selectedCategory, setSelectedCategory] = useState<Categorie | null>(null);
  const [selectedDatasets, setSelectedDatasets] = useState<string[]>([]);
  const [splitMethod, setSplitMethod] = useState<'ratio' | 'kfold'>('ratio');
  const [ratios, setRatios] = useState({ train: 70, valid: 15, test: 15 });
  const [kValue, setKValue] = useState<number>(5);
  /* const [modelTypes, setModelTypes] = useState<AiModelType[]>([]);
  const [selectedModelType, setSelectedModelType] = useState<string>(''); */
  // const [searchQuery, setSearchQuery] = useState('');
  /* const filteredCategories = Array.from(categoriesDatasets.keys()).filter(category => {
    const searchString = `${category.serialNumber} ${category.nomenclature} ${category.code}`.toLowerCase();
    return searchString.includes(searchQuery.toLowerCase());
  }); */
  const { toast } = useToast();

  /* useEffect(() => {
    const loadModelTypes = async () => {
      const types = await fetchAiModelTypes();
      if (types) {
        setModelTypes(types);
        if (types.length > 0) {
          setSelectedModelType(types[0].id);
        }
      }
    };

    loadModelTypes();
  }, []); */

  /* const handleCategorySelect = (category: Categorie) => {
    setSelectedCategory(category);
    setSelectedDatasets([]); // Reset datasets when category changes
  }; */

  const handleDatasetSelect = (datasetId: string) => {
    setSelectedDatasets(prev =>
      prev.includes(datasetId)
        ? prev.filter(id => id !== datasetId)
        : [...prev, datasetId]
    );
  };

  const validateInputs = () => {
    if (selectedDatasets.length === 0) {
      toast({ variant: "destructive", title: "Sélectionner au moins un ensemble de données" });
      return false;
    }

    /* if (!selectedModelType) {
      toast({ variant: "destructive", title: "Sélectionner un type de modèle" });
      return false;
    } */

    if (splitMethod === 'ratio' && (ratios.train + ratios.valid + ratios.test) !== 100) {
      toast({ variant: "destructive", title: "La somme des ratios doit être de 100 %." });
      return false;
    }

    if (splitMethod === 'kfold' && (kValue < 2 || kValue > 10)) {
      toast({ variant: "destructive", title: "K doit être compris entre 2 et 10" });
      return false;
    }

    return true;
  };

  const handleStartTraining = () => {
    if (!validateInputs()) return;

    const token = sessionStorage.getItem('token') || '';
    const trainingId = uuidv4();
    const url = `${import.meta.env.VITE_WEB_SOCKET_URL}ws/training/notifications/?token=${encodeURIComponent(token)}&training_id=${encodeURIComponent(trainingId)}`;
    const ws = new WebSocket(url);

    const config: TrainingConfig = {
      modelId: row.original.id,
      // modelType: selectedModelType,
      datasets: selectedDatasets,
      splitMethod,
      ...(splitMethod === 'ratio' ? { ratios } : { k: kValue })
    };

    // onTrainStart(config);
    ws.onopen = () => {
      toast({ title: "Entraînement commencé", description: "L'entraînement a commencé avec succès." ,
        className: "text-green-700", });
      ws.send(JSON.stringify(config));
    }

    ws.onmessage = (event: MessageEvent) => {
      const data: TrainingNotification = JSON.parse(event.data);
      toast({ title: "Notification d'entraînement", description: `Data received ${data.message}` });
    };

    ws.onclose = () => {
      toast({ title: "Entraînement terminé", description: "L'entraînement a été terminé avec succès." ,
        className: "text-green-700", });
    }

    ws.onerror = (error) => {
      toast({ title: "Erreur d'entraînement", description: `Une erreur s'est produite lors de l'entraînement. ${error}` ,
        className: "text-red-700", });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <span className='hover:cursor-pointer'>
          Entraîner un modèle
        </span>
        
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Configuration d'entraînement - {row.original.name}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Category Selection */}
          <div className="space-y-2">
            {/* <Label>Sélectionner une catégorie</Label>
  <div className="relative">
    <input
      type="text"
      placeholder="Rechercher une catégorie..."
      className="w-full p-2 border rounded-md mb-2"
      onChange={(e) => setSearchQuery(e.target.value)}
      value={searchQuery}
    />
    <div className="border rounded-md max-h-48 overflow-y-auto">
      <div className="grid grid-cols-1 gap-1 p-2">
        {filteredCategories.map(category => (
          <div
            key={category.id}
            className={`flex items-center p-2 rounded cursor-pointer hover:bg-gray-100 ${
              selectedCategory?.id === category.id ? 'bg-blue-50' : ''
            }`}
            onClick={() => handleCategorySelect(category)}
          >
            <input
              type="radio"
              checked={selectedCategory?.id === category.id}
              readOnly
              className="h-4 w-4 text-blue-600 cursor-pointer"
            />
            <Label className="ml-2 cursor-pointer">
              {category.serialNumber} - {category.nomenclature} ({category.code})
            </Label>
          </div>
        ))}
        {filteredCategories.length === 0 && (
          <div className="p-2 text-gray-500">Aucune catégorie trouvée</div>
        )}
      </div>
    </div>
  </div> */}
          </div>

          {/* Dataset Selection (only show for selected category) */}
          {//selectedCategory && 
            (
              <div className="space-y-2">
                <Label>Sélectionner les Datasets {/* ({selectedCategory.nomenclature}) */}

                </Label>
                <div className="border rounded-md p-4 max-h-64 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-2">
                    {/* {categoriesDatasets.get(selectedCategory)?.map(dataset => ( */}
                    {datasets.map(dataset => (
                      <div key={dataset.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={dataset.id}
                          checked={selectedDatasets.includes(dataset.id)}
                          onCheckedChange={() => handleDatasetSelect(dataset.id)}
                        />
                        <Label htmlFor={dataset.id} className="text-sm">
                          {dataset.serialNumber} - {dataset.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          {/* Split Configuration */}
          <div className="space-y-4">
            <RadioGroup value={splitMethod} onValueChange={v => setSplitMethod(v as 'ratio' | 'kfold')}>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ratio" id="ratio" />
                  <Label htmlFor="ratio">Train/Valid/Test Split</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="kfold" id="kfold" />
                  <Label htmlFor="kfold">K-Fold Cross Validation</Label>
                </div>
              </div>
            </RadioGroup>

            {splitMethod === 'ratio' ? (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Train (%)</Label>
                  <Input
                    type="number"
                    value={ratios.train}
                    onChange={e => setRatios({ ...ratios, train: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valid (%)</Label>
                  <Input
                    type="number"
                    value={ratios.valid}
                    onChange={e => setRatios({ ...ratios, valid: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Test (%)</Label>
                  <Input
                    type="number"
                    value={ratios.test}
                    onChange={e => setRatios({ ...ratios, test: Number(e.target.value) })}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Nombre de Folds (K)</Label>
                <Input
                  type="number"
                  min="2"
                  max="10"
                  value={kValue}
                  onChange={e => setKValue(Number(e.target.value))}
                />
              </div>
            )}
          </div>

          {/* Model Type Selection */}
          {/* <div className="space-y-2">
            <Label>
              Sélectionner le type de modèle
            </Label>
            <select
              value={selectedModelType}
              onChange={(e) => setSelectedModelType(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              {modelTypes.map((type, idx) => (
                <option key={type.id} value={type.id}>
                  {idx + 1}- {type.type}
                </option>
              ))}
            </select>
          </div> */}
        </div>

        <DialogFooter>
          <Button onClick={handleStartTraining}>Commencer l'entraînement</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TrainDialog;
export type { TrainingDialogProps };