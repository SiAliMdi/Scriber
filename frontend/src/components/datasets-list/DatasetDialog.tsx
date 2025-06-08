import {
    Dialog,
    DialogContent,
    // DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Row } from "@tanstack/react-table"
import { Dataset } from "@/@types/dataset"

interface ReadDialogProps {
    row: Row<Dataset>; 
}

const ReadDialog = ({ row }: ReadDialogProps) => {

    return (<Dialog >
            <DialogTrigger asChild>
                <span className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-[#f5f5f5] hover:cursor-pointer">
                    Afficher
                </span>
            </DialogTrigger>
            <DialogContent className="w-11/12 max-w-none mx-0">
                <DialogHeader>
                    <DialogTitle>Le dataset {row.original.serialNumber} </DialogTitle>
                </DialogHeader>
                <div className="grid gap-1 py-1 w-full mx-0 px-0">
                    <div className="grid grid-cols-10  gap-1 w-full mx-0 px-0">
                        <Label htmlFor="name" className="flex items-center justify-center  col-span-1">
                            Nom
                        </Label>
                        <Input
                            readOnly={true}
                            value={row.original.name}
                            id="name"
                            defaultValue={row.original.name}  className="col-span-9"
                        />
                    </div>
                    <div className="grid grid-cols-10 items-center gap-4 w-full mx-0 px-0">
                        <Label htmlFor="description" className="flex items-center justify-center  col-span-1">
                            Description
                        </Label>
                        <Input
                            readOnly={true}
                            value={row.original.description}
                            id="description"
                            defaultValue={row.original.description} className="col-span-9"
                        />
                    </div>
                    <div className="grid grid-cols-10 items-center gap-4 w-full px-0 mx-0">
                        <Label htmlFor="size" className="flex items-center justify-center  col-span-1">
                            Taille
                        </Label>
                        <Input
                            readOnly={true}
                            value={row.original.size}
                            id="size"
                            defaultValue={row.original.size} className="col-span-9"
                         />
                        
                    </div>
                    <div className="grid grid-cols-10 items-center gap-4 w-full px-0 mx-0">
                        <Label htmlFor="annotatedDecisions" className="flex items-center justify-center  col-span-1">
                        Etat
                        </Label>

                        <Textarea value={row.original.annotatedDecisions} id="annotatedDecisions" className="col-span-9" 
                        defaultValue={row.original.annotatedDecisions} readOnly={true} />
                    </div>
                    
                    
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default ReadDialog;
export type { ReadDialogProps };
