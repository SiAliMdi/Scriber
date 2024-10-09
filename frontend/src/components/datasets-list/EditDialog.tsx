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
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import cloneDeep from 'lodash/cloneDeep';
import { editDataset } from "@/services/DatasetsServices"

interface EditDialogProps<TData> {
    row: Row<TData>;
    onEdit: (value: TData) => void;
    setDatasets: (value: TData[]) => void;
}

const EditDialog = <TData,>({ row, onEdit, setDatasets }: EditDialogProps<TData>) => {

    const [name, setName] = useState(row.original.name);
    const [description, setDescription] = useState(row.original.description);
    const { toast } = useToast();

    const handleSave = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.preventDefault();
        const dataset = cloneDeep(row.original);
        dataset.name = name;
        dataset.description = description;
        // onEdit(dataset);
       
        editDataset(dataset).then((response) => {
            if (response === 200) {
                setDatasets((prev: TData[]) => {
                    const index = prev.findIndex(u => u.id === dataset.id);
                    prev[index] = dataset;
                    return [...prev];
                });
                toast({
                    title: "Dataset edit success",
                    duration: 5000,
                    description: `Le dataset ${row.original.serialNumber} modifié`,
                    // className: "bg-accent-foreground text-accent",
                    className: "text-green-700",
                });
            } else {
                toast({
                    variant: "destructive",
                    duration: 5000,
                    title: "Échec de la modification du dataset",
                    description: `Le dataset ${row.original.serialNumber} n'a pas pu être modifié`,
                });
            }
        }).catch(() => {});

       
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
                    <DialogTitle>Modifier le {row.original.serialNumber} </DialogTitle>
                </DialogHeader>
                <div className="grid gap-1 py-1 w-full mx-0 px-0">
                    <div className="grid grid-cols-10  gap-1 w-full mx-0 px-0">
                        <Label htmlFor="name" className="flex items-center justify-center  col-span-1">
                            name
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
