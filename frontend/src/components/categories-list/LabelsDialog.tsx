import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Row } from "@tanstack/react-table"
import { useEffect, useState } from "react"
import {fetchLabels, updateLabel, deleteLabel} from "@/services/LabelsServices";
import { NewLabelAlertDialog } from "./NewLabelAlertDialog"
import { Dataset } from "@/@types/dataset"
import { Label } from "@/@types/label"

interface LabelsDialogProps {
    row: Row<Dataset>;
}

const LabelsDialog = ({ row }: LabelsDialogProps) => {

    const [labels, setLabels] = useState<Label[] >(row.original.labels || []);
    
    useEffect(() => {
        fetchLabels(row.original.id || "", setLabels);
    }, [row.original.labels]);
   
    return (
        (
            <Dialog >
                <DialogTrigger asChild>
                    <span className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-[#f5f5f5] hover:cursor-pointer">
                        Labels
                    </span>
                </DialogTrigger>
                <DialogContent className="w-11/12 max-w-none mx-0">
                    <DialogHeader>
                        <DialogTitle>Labels du dataset {row.original.serialNumber} </DialogTitle>
                        <NewLabelAlertDialog datasetId={row.original.id || ""}
                         labels={labels} setLabels={setLabels} />
                    </DialogHeader>
                    <div className="grid gap-1 py-1 w-full mx-0 px-0">
                        {
                            labels.map((label, index) => (
                                <div className="grid grid-cols-10 items-center gap-4 w-full px-0 mx-0" key={index}>
                                    <input type="color" id={"color-" + index} className="col-span-1" defaultValue={label.color} onChange={(e) => {
                                        const newLabels = [...labels];
                                        newLabels[index].color = e.target.value;
                                        setLabels(newLabels);
                                    }
                                    } disabled />
                                    <Input disabled value={label.label} id={"label-" + index} className="col-span-3"
                                        defaultValue={label.label} onChange={(e) => {
                                            const newLabels = [...labels];
                                            newLabels[index].label = e.target.value;
                                            setLabels(newLabels);
                                        }}
                                    />
                                    {
                                    <Button variant="ghost" className="col-span-1"  
                                    id={"modifier-" + index}
                                    onClick={() => {
                                        document.getElementById("color-" + index)?.removeAttribute("disabled");
                                        document.getElementById("label-" + index)?.removeAttribute("disabled");
                                        document.getElementById("enregistrer-" + index)?.classList.toggle("hidden");   
                                        document.getElementById("modifier-" + index)?.classList.toggle("hidden");
                                    }
                                    }>Modifier</Button>}
                                    {
                                    <Button variant="ghost" className="col-span-1 hidden" 
                                    id={"enregistrer-" + index}
                                    onClick={() => {
                                        document.getElementById("color-" + index)?.setAttribute("disabled", "true");
                                        document.getElementById("label-" + index)?.setAttribute("disabled", "true");
                                        const newLabels = [...labels];
                                        newLabels[index].color = document.getElementById("color-" + index)?.getAttribute("value") as string;
                                        newLabels[index].label = document.getElementById("label-" + index)?.getAttribute("value") as string;
                                        setLabels(newLabels);
                                        updateLabel(newLabels[index].id as string, newLabels[index]);                                        
                                        document.getElementById("enregistrer-" + index)?.classList.toggle("hidden");
                                        // document.getElementById("modifier-" + index)?.classList.toggle("hidden");
                                    }
                                    }>Enregistrer</Button>}
                                    <Button variant="ghost" className="col-span-1" 
                                    id={"supprimer-" + index}
                                    onClick={() => {
                                        const newLabels = [...labels];
                                        newLabels.splice(index, 1);
                                        setLabels(newLabels);
                                        deleteLabel(label.id as string);
                                    }
                                    }>Supprimer</Button>
                                </div>
                            ))
                        }

                    </div>
                    {/* <DialogFooter>
                    <Button type="submit" onClick={handleSave}>Enregistrer les modifications</Button>
                </DialogFooter> */}
                </DialogContent>
            </Dialog>
        )
    )
}

export default LabelsDialog;
export type { LabelsDialogProps };
