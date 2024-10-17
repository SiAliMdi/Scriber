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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/components/ui/use-toast"
import AiModel from "@/@types/ai-model";
import { useState } from "react"

interface CreateDialogProps<TData> {
    categoryId: string;
    nextSerialNumber: number;
    createAiModel : (AiModel: TData) => Promise<unknown>;
    createDialogOpen: boolean;
    setCreateDialogOpen: (value: boolean) => void;
    setAiModels: (value: TData[]) => void;
}

const CreateDialog = <TData,>({categoryId, nextSerialNumber, createAiModel, createDialogOpen, setCreateDialogOpen, setAiModels }: CreateDialogProps<TData>) => {

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [modelType, setModelType] = useState("");
    const { toast } = useToast();


    const handleSave = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.preventDefault();

        const model : AiModel = {
            name,
            description,
            modelType,
            category: categoryId,
        };

        createAiModel(model).then((response) => {
            if (response.status === 200) {
                model.serialNumber = response.data.serial_number;
                model.createdAt = response.data.created_at;
                model.id = response.data.id;
                setAiModels((prev: TData[]) => [...prev, model]);
                toast({
                    title: "Model create success",
                    duration: 5000,
                    description: `Le modèle ${model.name} créé`,
                    // className: "bg-accent-foreground text-accent",
                    className: "text-green-700",
                });
            } else {
                toast({
                    variant: "destructive",
                    duration: 5000,
                    title: "Échec de la création du modèle",
                    description: `Le modèle ${model.name} n'a pas pu être créé`,
                });
            }
        }
    ).catch((error) => {
        console.error(error);
        toast({
            variant: "destructive",
            duration: 5000,
            title: "Erreur",
            description: `${error}`,
        });

        }
        );
    }

    return (
        (
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} 
         >
            <DialogTrigger asChild>
                {/* <span className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-[#f5f5f5] hover:cursor-pointer">
                    Modifier
                </span> */}
            </DialogTrigger>
            <DialogContent className="w-11/12 max-w-none mx-0">
                <DialogHeader>
                    <DialogTitle>Créer un nouveau modèle d'IA </DialogTitle>
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
                            defaultValue={name}  className="col-span-9"
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
                            Type de modèle
                        </Label>
                        <div className="flex items-center space-x-2 justify-center  col-span-3">

    <RadioGroupItem value="classification binaire" id="binary" className="cursor-pointer" 
     onClick={ e => setModelType("classification binaire")}
    />
    <Label htmlFor="binary" className="cursor-pointer">Modèle de classification binaire</Label>
    </div>
  <div className="flex items-center space-x-2 justify-center col-span-3">
    <RadioGroupItem value="extractif" id="extractive" className="cursor-pointer" 
    onClick={ e => setModelType("extractif")}
    />
    <Label htmlFor="extractive" className="cursor-pointer">Modèle extractive</Label>
  </div>
                        </div>
</RadioGroup>

                    
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={handleSave}>Enregistrer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        )
    )
}

export default CreateDialog;
export type { CreateDialogProps };
