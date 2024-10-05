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
import { editCategorie } from "@/services/CategoriesServices";

interface EditDialogProps<TData> {
    row: Row<TData>;
    onEdit: (value: TData) => void;
    setCategories: (value: TData[]) => void;
}

const EditDialog = <TData,>({ row, onEdit, setCategories }: EditDialogProps<TData>) => {

    const [nomenclature, setNomenclature] = useState(row.original.nomenclature);
    const [code, setCode] = useState(row.original.code);
    const [norme, setNorme] = useState(row.original.norme);
    const [fondement, setFondement] = useState(row.original.fondement);
    const [condition, setCondition] = useState(row.original.condition);
    const [object, setObject] = useState(row.original.object);
    const [description, setDescription] = useState(row.original.description);
    const { toast } = useToast();

    const handleSave = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.preventDefault();
        const categorie = cloneDeep(row.original);
        categorie.nomenclature = nomenclature;
        categorie.code = code;
        categorie.norme = norme;
        categorie.fondement = fondement;
        categorie.condition = condition;
        categorie.object = object;
        categorie.description = description;
        categorie.serialNumber = row.original.serialNumber;
        // onEdit(categorie);
       
        editCategorie(categorie).then((response) => {
            if (response === 200) {
                setCategories((prev: TData[]) => {
                    const index = prev.findIndex(u => u.id === categorie.id);
                    prev[index] = categorie;
                    return [...prev];
                });
                toast({
                    title: "Catégorie edit success",
                    duration: 5000,
                    description: `La catégorie ${row.original.serialNumber} modifiée`,
                    // className: "bg-accent-foreground text-accent",
                    className: "text-green-700",
                });
            } else {
                toast({
                    variant: "destructive",
                    duration: 5000,
                    title: "Échec de la modification de la catégorie",
                    description: `La catégorie ${row.original.serialNumber} n'a pas pu être modifiée`,
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
                    <DialogTitle>Modifier la catégorie {row.original.serialNumber} </DialogTitle>
                    {/* <DialogDescription>
                    Activer/désactiver l'utilisateur ici en basculant le switch.
                        <br />
                        Les utilisateurs désactivés ne pourront plus se connecter.
                        <br />
                        Cliquez sur enregistrer lorsque vous avez terminé.
                    </DialogDescription> */}
                </DialogHeader>
                <div className="grid gap-1 py-1 w-full mx-0 px-0">
                    <div className="grid grid-cols-10  gap-1 w-full mx-0 px-0">
                        <Label htmlFor="nomenclature" className="flex items-center justify-center  col-span-1">
                            Nomenclature
                        </Label>
                        <Input
                            value={nomenclature}
                            id="nomenclature"
                            onChange={(e) => setNomenclature(e.target.value)}
                            defaultValue={nomenclature}  className="col-span-9"
                        />
                    </div>
                    <div className="grid grid-cols-10 items-center gap-4 w-full mx-0 px-0">
                        <Label htmlFor="code" className="flex items-center justify-center  col-span-1">
                            Code
                        </Label>
                        <Input
                            
                            value={code}
                            id="code"
                            onChange={(e) => setCode(e.target.value)}
                            defaultValue={code} className="col-span-9"
                        />
                    </div>
                    <div className="grid grid-cols-10 items-center gap-4 w-full px-0 mx-0">
                        <Label htmlFor="norme" className="flex items-center justify-center  col-span-1">
                            Norme
                        </Label>

                        <Textarea value={norme} id="norme" className="col-span-9" 
                        defaultValue={norme} onChange={(e) => setNorme(e.target.value)} />
                        
                    </div>
                    <div className="grid grid-cols-10 items-center gap-4 w-full px-0 mx-0">
                        <Label htmlFor="fondement" className="flex items-center justify-center  col-span-1">
                        Fondement
                        </Label>

                        <Textarea value={fondement} id="fondement" className="col-span-9" 
                        defaultValue={fondement} onChange={(e) => setFondement(e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-10 items-center gap-4 w-full px-0 mx-0">
                        <Label htmlFor="condition" className="flex items-center justify-center  col-span-1">
                        Condition
                        </Label>

                        <Textarea value={condition} id="condition" className="col-span-9" 
                        defaultValue={condition} onChange={(e) => setCondition(e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-10 items-center gap-4 w-full px-0 mx-0">
                        <Label htmlFor="object" className="flex items-center justify-center  col-span-1">
                            Object
                        </Label>

                        <Textarea value={object} id="object" className="col-span-9" 
                        defaultValue={object} onChange={(e) => setObject(e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-10 items-center gap-4 w-full px-0 mx-0">
                        <Label htmlFor="description" className="flex items-center justify-center  col-span-1">
                            Exemple
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
