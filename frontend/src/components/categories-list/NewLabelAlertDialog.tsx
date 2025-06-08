import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    // AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "../ui/input"
import { Label} from "../../@types/label"
import {createLabel } from "../../services/LabelsServices";
import { useToast } from "../ui/use-toast";

interface NewLabelAlertDialogProps {
    datasetId: string;
    labels: Label[];
    setLabels: (value: Label[]) => void;
}

export function NewLabelAlertDialog( {datasetId, labels, setLabels }: NewLabelAlertDialogProps) {
    const { toast } = useToast();
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="outline" className="absolute top-2 right-10">Nouveau label</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    {/* <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle> */}
                    <AlertDialogDescription>
                        <div className="grid gap-1 py-1 w-full mx-0 px-0">
                            <div className="grid grid-cols-10 items-center gap-4 w-full px-0 mx-0">
                                <label htmlFor="label" className="col-span-1">Label</label>
                                <Input id="label" className="col-span-5" ></Input>
                            </div>
                            <div className="grid grid-cols-10 items-center gap-4 w-full px-0 mx-0">
                                <label htmlFor="color" className="col-span-1" >Couleur</label>
                                <Input id="color" type="color" className="col-span-3"></Input>
                            </div>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={() => {
                            const newLabels = [...labels];
                            const newLabel = {
                                label: (document.getElementById("label") as HTMLInputElement).value,
                                color: (document.getElementById("color") as HTMLInputElement).value
                            };
                            newLabels.push(newLabel);
                            setLabels(newLabels);

                            createLabel(datasetId, newLabel).then((response) => {
                                if (response?.status === 200) {
                                    toast({
                                        title: "Label ajouté",
                                        duration: 3000,
                                        description: `Le label ${newLabel.label} a été ajouté avec succès`,
                                        className: "text-green-700",
                                    });
                                }
                                else {
                                    toast({
                                        variant: "destructive",
                                        duration: 3000,
                                        title: "Erreur d'ajout",
                                        description: `Le label ${newLabel.label} n'a pas pu être ajouté`,
                                    });
                                }
                            }).catch((error) => {
                                toast({
                                    variant: "destructive",
                                    duration: 3000,
                                    title: "Erreur d'ajout",
                                    description: `Le label ${newLabel.label} n'a pas pu être ajouté + ${error}`,
                                });
                            });
                        }
                        }
                    >Ajouter</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
