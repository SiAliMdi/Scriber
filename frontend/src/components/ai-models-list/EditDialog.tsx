import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    // DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Row } from "@tanstack/react-table"
import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import cloneDeep from 'lodash/cloneDeep';
import { editAiModel, fetchAiModelTypes } from "@/services/AiModelsServices";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group"
import AiModel, { AiModelType } from "@/@types/ai-model"

interface EditDialogProps {
    row: Row<AiModel>;
    onEdit: (value: AiModel) => void;
    setAiModels: React.Dispatch<React.SetStateAction<AiModel[]>>;
}

const EditDialog = ({ row, onEdit, setAiModels }: EditDialogProps) => {

    const [name, setName] = useState(row.original.name);
    const [description, setDescription] = useState(row.original.description);
    const [modelType, setmodelType] = useState(row.original.modelType);
    const { toast } = useToast();
    const [aiModelType, setaiModelType] = useState("");
    const [aimodelTypes, setaiModelTypes] = useState<AiModelType[]>([]);

    useEffect(() => {
        fetchAiModelTypes().then(data =>
        {
            setaiModelTypes(data ?? []);
            if (data && data.length > 0) {
                setaiModelType(data[0].type);
            }
        }
        );
    }, []);
    const handleSave = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.preventDefault();
        const model = cloneDeep(row.original);
        model.name = name;
        model.description = description;
        model.modelType = modelType;
        model.type = aiModelType;
        onEdit(model);

        editAiModel(model).then((response) => {
            if (response === 200) {
                setAiModels((prev: AiModel[]) => {
                    const index = prev.findIndex(u => u.id === model.id);
                    prev[index] = model;
                    return [...prev];
                });
                toast({
                    title: "Modèle edit success",
                    duration: 5000,
                    description: `Le modèle ${row.original.serialNumber} modifié`,
                    // className: "bg-accent-foreground text-accent",
                    className: "text-green-700",
                });
            } else {
                toast({
                    variant: "destructive",
                    duration: 5000,
                    title: "Échec de la modification du modèle",
                    description: `Le modèle ${row.original.serialNumber} n'a pas pu être modifié`,
                });
            }
        }).catch(() => { });


    }

    return (
        (
            <Dialog >
                <DialogTrigger asChild>
                    <span className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-[#f5f5f5] hover:cursor-pointer">
                        Modifier
                    </span>
                </DialogTrigger>
                <DialogContent className="w-11/12 max-w-none mx-0">
                    <DialogHeader>
                        <DialogTitle>Modifier le modèle {row.original.serialNumber} </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-1 py-1 w-full mx-0 px-0">
                        <div className="grid grid-cols-10  gap-1 w-full mx-0 px-0">
                            <Label htmlFor="name" className="flex items-center justify-center  col-span-1">
                                Nom
                            </Label>
                            <Input
                                value={name}
                                id="name"
                                onChange={(e) => setName(e.target.value)}
                                defaultValue={name} className="col-span-9"
                            />
                        </div>
                        <div className="grid grid-cols-10 items-center gap-4 w-full px-0 mx-0">
                            <Label htmlFor="description" className="flex items-center justify-center  col-span-1">
                                Description
                            </Label> 

                            <Textarea value={description} id="description" className="col-span-9"
                                defaultValue={description} onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <RadioGroup >

                            <div className="grid grid-cols-10 items-center gap-4 w-full px-0 mx-0 space-y-2">
                                <Label htmlFor="description" className="flex items-center justify-center  col-span-1">
                                    Catégorie du modèle
                                </Label>
                                <div className="flex items-center space-x-2 justify-center  col-span-3">

                                    <RadioGroupItem value="classification binaire" id="binary" className="cursor-pointer"
                                        onClick={() => setmodelType("classification binaire")}
                                        checked={modelType === "classification binaire"}
                                    />
                                    <Label htmlFor="binary" className="cursor-pointer">Modèle de classification binaire</Label>
                                </div>
                                <div className="flex items-center space-x-2 justify-center col-span-3">
                                    <RadioGroupItem value="extractif" id="extractive" className="cursor-pointer"
                                        onClick={() => setmodelType("extractif")}
                                        checked={modelType === "extractif"}
                                    />
                                    <Label htmlFor="extractive" className="cursor-pointer">Modèle extractif</Label>
                                </div>
                            </div>
                        </RadioGroup>
                        {modelType !== "extractif" && (
                            <div>
                            <Label htmlFor="modelType">Type de modèle</Label>
                            <select
                                id="modelType"
                                value={aiModelType}
                                onChange={e => setaiModelType(e.target.value)}
                                
                                className="col-span-4 fill-border bg-white text-gray-900 border rounded-md shadow-sm focus:ring focus:ring-blue-500 focus:border-blue-500"
                            >
                                {aimodelTypes.map((type) => (
                                    <option key={type.id} value={type.type}>
                                        {type.type}
                                    </option>
                                ))}
                            </select>
                        </div>
                            
                            )}

                    </div>
                    <DialogFooter>
                        <Button type="submit" onClick={handleSave}>Enregistrer les modifications</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )
    )
}
export default EditDialog;
export type { EditDialogProps };