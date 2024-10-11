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
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Dataset } from "@/@types/dataset";
import { CloudCog } from "lucide-react"

interface CreateDialogProps<TData> {
    categoryId: string;
    nextSerialNumber: number;
    createDataset : (dataset: TData) => Promise<number>;
    createDialogOpen: boolean;
    setCreateDialogOpen: (value: boolean) => void;
    setDatasets: (value: TData[]) => void;
}

const CreateDialog = <TData,>({categoryId, nextSerialNumber, createDataset, createDialogOpen, setCreateDialogOpen, setDatasets }: CreateDialogProps<TData>) => {

    const [name, setNomenclature] = useState("");
    const [description, setDescription] = useState("");
    const { toast } = useToast();

    const handleSave = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.preventDefault();
        const dataset : Dataset = {
            name,
            description,
            categorie: categoryId
        };
        
        createDataset(dataset).then((response) => {
            if (response.status === 200) {
                dataset.serialNumber = response.data.serial_number;
                dataset.createdAt = response.data.created_at;
                dataset.size = 0;
                dataset.annotatedDecisions = 0;
                dataset.id = response.data.id;
                setDatasets((prev: TData[]) => [...prev, dataset]);
                toast({
                    title: "Dataset create success",
                    duration: 5000,
                    description: `Le dataset ${dataset.name} créé`,
                    // className: "bg-accent-foreground text-accent",
                    className: "text-green-700",
                });
            } else {
                toast({
                    variant: "destructive",
                    duration: 5000,
                    title: "Échec de la création du dataset",
                    description: `Le dataset ${dataset.name} n'a pas pu être créée`,
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
    });
    }

    return (
        (
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} 
         >
            <DialogTrigger asChild>
            </DialogTrigger>
            <DialogContent className="w-11/12 max-w-none mx-0">
                <DialogHeader>
                    <DialogTitle>Créer un nouveau dataset de demande </DialogTitle>
                </DialogHeader>
                <div className="grid gap-1 py-1 w-full mx-0 px-0">
                    <div className="grid grid-cols-10  gap-1 w-full mx-0 px-0">
                        <Label htmlFor="name" className="flex items-center justify-center  col-span-1">
                            Nom
                        </Label>
                        <Input
                            value={name}
                            id="name"
                            onChange={(e) => setNomenclature(e.target.value)}
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
