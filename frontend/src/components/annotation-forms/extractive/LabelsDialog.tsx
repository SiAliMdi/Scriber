import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { updateLabel, deleteLabel } from "@/services/LabelsServices"
import { NewLabelAlertDialog } from "@/components/categories-list/NewLabelAlertDialog"
import { Label as LabelType } from "@/@types/label"
import { useToast } from "@/components/ui/use-toast";

interface LabelsDialogProps {
    labels: LabelType[]
    setLabels: (labels: LabelType[]) => void
    datasetId: string
    datasetSerialNumber: string
    open: boolean
    onOpenChange: (open: boolean) => void
}

const LabelsDialog = ({
    labels,
    setLabels,
    datasetId,
    datasetSerialNumber,
    open,
    onOpenChange,
}: LabelsDialogProps) => {

    const { toast } = useToast();
    // Gestion améliorée de la modification des labels
    const handleUpdateLabel = async (index: number) => {
        const colorInput = document.getElementById(`color-${index}`) as HTMLInputElement
        const labelInput = document.getElementById(`label-${index}`) as HTMLInputElement
        
        const newLabels = [...labels]
        newLabels[index] = {
            ...newLabels[index],
            color: colorInput.value,
            label: labelInput.value
        }
        
        setLabels(newLabels);
        try {
            const response = await updateLabel(newLabels[index].id, newLabels[index]);
            if (response && response.status >= 200 && response.status < 300) {
                toast({
                    title: "Label modifié avec succès",
                    duration: 3000,
                    description: `Le label ${newLabels[index].label} a été modifié avec succès`,
                    className: "text-green-700",
                })
                
            }
            else {
                toast({
                    title: `${response.status} - Erreur de modification`,
                    duration: 3000,
                    description: `Le label ${newLabels[index].label} n'a pas pu être modifié`,
                    variant: "destructive",
                })
            }
            
            
        } catch (error) {
            toast({
                title: `${error} - Erreur de modification`,
                duration: 3000,
                description: `Le label ${newLabels[index].label} n'a pas pu être modifié`,
                variant: "destructive",
            })
        }
    }


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-11/12 max-w-none mx-0">
                <DialogHeader>
                    <DialogTitle>
                        Labels du dataset {datasetSerialNumber}
                    </DialogTitle>
                    <NewLabelAlertDialog 
                        datasetId={datasetId}
                        labels={labels} 
                        setLabels={setLabels} 
                    />
                </DialogHeader>
                
                <div className="grid gap-1 py-1 w-full mx-0 px-0">
                    {labels.map((label, index) => (
                        <div className="grid grid-cols-10 items-center gap-4 w-full px-0 mx-0" key={label.id}>
                            <input
                                type="color"
                                id={`color-${index}`}
                                className="col-span-1"
                                defaultValue={label.color}
                                disabled
                            />
                            <Input
                                id={`label-${index}`}
                                className="col-span-3"
                                defaultValue={label.label}
                                disabled
                            />
                            
                            <Button
                                variant="ghost"
                                className="col-span-1"
                                onClick={() => {
                                    const colorElem = document.getElementById(`color-${index}`)
                                    const labelElem = document.getElementById(`label-${index}`)
                                    const saveBtn = document.getElementById(`enregistrer-${index}`)
                                    const editBtn = document.getElementById(`modifier-${index}`)

                                    colorElem?.removeAttribute('disabled')
                                    labelElem?.removeAttribute('disabled')
                                    saveBtn?.classList.toggle('hidden')
                                    editBtn?.classList.toggle('hidden')
                                }}
                                id={`modifier-${index}`}
                            >
                                Modifier
                            </Button>

                            <Button
                                variant="ghost"
                                className="col-span-1 hidden"
                                onClick={() => handleUpdateLabel(index)}
                                id={`enregistrer-${index}`}
                            >
                                Enregistrer
                            </Button>

                            <Button
                                variant="ghost"
                                className="col-span-1"
                                onClick={() => {
                                    const newLabels = labels.filter((_, i) => i !== index)
                                    setLabels(newLabels)
                                    deleteLabel(label.id)
                                }}
                            >
                                Supprimer
                            </Button>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default LabelsDialog
export type { LabelsDialogProps }