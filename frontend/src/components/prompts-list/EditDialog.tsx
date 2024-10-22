import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    // DialogjsonTemplate,
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
import { editPrompt } from "@/services/PromptsServices"

interface EditDialogProps<TData> {
    row: Row<TData>;
    onEdit: (value: TData) => void;
    setPrompts: (value: TData[]) => void;
}

const EditDialog = <TData,>({ row, onEdit, setPrompts }: EditDialogProps<TData>) => {

    const [prompt, setPrompt] = useState(row.original.prompt);
    const [jsonTemplate, setJsonTemplate] = useState(row.original.jsonTemplate);
    const { toast } = useToast();

    const handleSave = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.preventDefault();
        const newPrompt = cloneDeep(row.original);
        newPrompt.prompt = prompt;
        newPrompt.jsonTemplate = jsonTemplate;
        onEdit(newPrompt);

        editPrompt(newPrompt).then((response) => {
            if (response === 200) {
                setPrompts((prev: TData[]) => {
                    const index = prev.findIndex(u => u.id === newPrompt.id);
                    prev[index] = newPrompt;
                    return [...prev];
                });
                toast({
                    title: "Prompt edit success",
                    duration: 5000,
                    description: `Le prompt ${row.original.serialNumber} modifié`,
                    // className: "bg-accent-foreground text-accent",
                    className: "text-green-700",
                });
            } else {
                toast({
                    variant: "destructive",
                    duration: 5000,
                    title: "Échec de la modification du prompt",
                    description: `Le prompt ${row.original.serialNumber} n'a pas pu être modifié`,
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
                        <DialogTitle>Modifier le prompt {row.original.serialNumber} </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-1 py-1 w-full mx-0 px-0">
                        <div className="grid grid-cols-10  gap-1 w-full mx-0 px-0">
                            <Label htmlFor="prompt" className="flex items-center justify-center  col-span-1">
                                Prompt
                            </Label>
                            <Input
                                value={prompt}
                                id="prompt"
                                onChange={(e) => setPrompt(e.target.value)}
                                defaultValue={prompt} className="col-span-9"
                            />
                        </div>
                        <div className="grid grid-cols-10 items-center gap-4 w-full px-0 mx-0">
                            <Label htmlFor="jsonTemplate" className="flex items-center justify-center  col-span-1">
                                JSON template
                            </Label> 

                            <Textarea id="jsonTemplate" className="col-span-9"
                                defaultValue={JSON.stringify(jsonTemplate, null, 4)}
                                onKeyUp={(e) => setJsonTemplate(JSON.parse(e.currentTarget.value))}
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