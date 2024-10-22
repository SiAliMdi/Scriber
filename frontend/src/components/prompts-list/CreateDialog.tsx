import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import {Prompt, JSONObject} from "@/@types/prompt";
import { useState } from "react"

interface CreateDialogProps<TData> {
    categoryId: string;
    nextSerialNumber: number;
    createPrompt : (Prompt: TData) => Promise<unknown>;
    createDialogOpen: boolean;
    setCreateDialogOpen: (value: boolean) => void;
    setPrompts: (value: TData[]) => void;
}

const CreateDialog = <TData,>({categoryId, nextSerialNumber, createPrompt, createDialogOpen, setCreateDialogOpen, setPrompts }: CreateDialogProps<TData>) => {

    const [promptText, setPromptText] = useState("");
    const [jsonTemplate, setJsonTemplate] = useState<JSONObject>({} as JSONObject);
    const { toast } = useToast();


    const handleSave = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.preventDefault();

        const newPrompt : Prompt = {
            prompt: promptText,
            jsonTemplate,
            category: categoryId,
        };

        createPrompt(newPrompt).then((response) => {
            if (response.status === 200) {
                newPrompt.serialNumber = response.data.serial_number;
                newPrompt.createdAt = response.data.created_at;
                newPrompt.id = response.data.id;
                setPrompts((prev: TData[]) => [...prev, newPrompt]);
                toast({
                    title: "Prompt create success",
                    duration: 5000,
                    description: `Le prompt ${newPrompt.serialNumber} créé`,
                    // className: "bg-accent-foreground text-accent",
                    className: "text-green-700",
                });
            } else {
                toast({
                    variant: "destructive",
                    duration: 5000,
                    title: "Échec de la création du prompt",
                    description: `Le prompt ${newPrompt.serialNumber} n'a pas pu être créé`,
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
            </DialogTrigger>
            <DialogContent className="w-11/12 max-w-none mx-0">
                <DialogHeader>
                    <DialogTitle>Créer un nouveau prompt </DialogTitle>
                </DialogHeader>
                <div className="grid gap-1 py-1 w-full mx-0 px-0">
                    <div className="grid grid-cols-10  gap-1 w-full mx-0 px-0">
                        <Label htmlFor="promptText" className="flex items-center justify-center  col-span-1">
                            Prompt
                        </Label>
                        <Input
                            value={promptText}
                            id="promptText"
                            onChange={(e) => setPromptText(e.target.value)}
                            defaultValue={promptText}  className="col-span-9"
                        />
                    </div>
                    <div className="grid grid-cols-10 items-center gap-4 w-full px-0 mx-0">
                        <Label htmlFor="jsonTemplate" className="flex items-center justify-center  col-span-1">
                            Template JSON
                        </Label>
                        <Textarea 
                        defaultValue={JSON.stringify(jsonTemplate)} 
                        id="jsonTemplate" className="col-span-9" 
                         onChange={(e) => setJsonTemplate(JSON.parse(e.target.value))}
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
