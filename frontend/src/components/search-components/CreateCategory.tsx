import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    // DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { Categorie } from "@/@types/categorie";
import { createCategorie } from "@/services/CategoriesServices";
import { createDataset } from "@/services/DatasetsServices";
import { Dataset } from "@/@types/dataset";

interface CreateDialogProps {
    createCategorieOpen: boolean;
    setCreateCategorieOpen: (value: boolean) => void;
}
const CreateCategory = ({ createCategorieOpen, setCreateCategorieOpen }: CreateDialogProps) => {
    const [nomenclature, setNomenclature] = useState("");
    const [code, setCode] = useState("");
    const [norme, setNorme] = useState("");
    const [fondement, setFondement] = useState("");
    const [condition, setCondition] = useState("");
    const [object, setObject] = useState("");
    const [description, setDescription] = useState("");
    const { toast } = useToast();

    const handleSave = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.preventDefault();
        const categorie: Categorie = {
            nomenclature,
            code,
            description,
            norme,
            fondement,
            condition,
            object,
        };

        createCategorie(categorie).then((response) => {
            if (response.status === 200) {
                categorie.serialNumber = response.data.serial_number;
                categorie.createdAt = response.data.created_at;
                categorie.id = response.data.id;
                // setCategories((prev: TData[]) => [...prev, categorie]);
                const dataset : Dataset = {
                    name: "dataset-1",
                    description: "",
                    categorie: categorie.id
                };
                createDataset(dataset).then((response) => {
                    if (response.status === 200) {
                        dataset.serialNumber = response.data.serial_number;
                        dataset.createdAt = response.data.created_at;
                        dataset.size = 0;
                        dataset.annotatedDecisions = 0;
                        dataset.id = response.data.id;
                        //setDatasets((prev: Dataset[]) => [...prev, dataset]);
                        toast({
                            title: "Catégorie create success",
                            duration: 5000,
                            description: `La catégorie ${categorie.nomenclature} créée`,
                            // className: "bg-accent-foreground text-accent",
                            className: "text-green-700",
                        });
                    } else {
                        toast({
                            variant: "destructive",
                            duration: 5000,
                            title: "Échec de la création de la catégorie",
                            description: `La catégorie ${categorie.nomenclature} n'a pas pu être créée`,
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
                
            } else {
                toast({
                    variant: "destructive",
                    duration: 5000,
                    title: "Échec de la création de la catégorie",
                    description: `La catégorie ${categorie.nomenclature} n'a pas pu être créée`,
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
        <Dialog open={createCategorieOpen} onOpenChange={setCreateCategorieOpen}>
            <DialogTrigger asChild>

            </DialogTrigger>
            <DialogContent className="w-11/12 max-w-none mx-0">
                <DialogHeader>
                    <DialogTitle>Créer une catégorie</DialogTitle>
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
                            defaultValue={nomenclature} className="col-span-9"
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
                    <Button type="submit" onClick={(e) => {
                        handleSave(e);
                        setCreateCategorieOpen(false);
                    }}>Enregistrer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export { CreateCategory };