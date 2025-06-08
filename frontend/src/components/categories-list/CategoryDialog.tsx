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
import { Categorie } from "@/@types/categorie"

interface ReadDialogProps {
    row: Row<Categorie>; 
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
                    <DialogTitle>La catégorie {row.original.serialNumber} </DialogTitle>
                </DialogHeader>
                <div className="grid gap-1 py-1 w-full mx-0 px-0">
                    <div className="grid grid-cols-10  gap-1 w-full mx-0 px-0">
                        <Label htmlFor="nomenclature" className="flex items-center justify-center  col-span-1">
                            Nomenclature
                        </Label>
                        <Input
                            readOnly={true}
                            value={row.original.nomenclature}
                            id="nomenclature"
                            defaultValue={row.original.nomenclature}  className="col-span-9"
                        />
                    </div>
                    <div className="grid grid-cols-10 items-center gap-4 w-full mx-0 px-0">
                        <Label htmlFor="code" className="flex items-center justify-center  col-span-1">
                            Code
                        </Label>
                        <Input
                            readOnly={true}
                            value={row.original.code}
                            id="code"
                            defaultValue={row.original.code} className="col-span-9"
                        />
                    </div>
                    <div className="grid grid-cols-10 items-center gap-4 w-full px-0 mx-0">
                        <Label htmlFor="norme" className="flex items-center justify-center  col-span-1">
                            Norme
                        </Label>

                        <Textarea value={row.original.norme} id="norme" className="col-span-9" 
                        defaultValue={row.original.norme} readOnly={true} />
                        
                    </div>
                    <div className="grid grid-cols-10 items-center gap-4 w-full px-0 mx-0">
                        <Label htmlFor="fondement" className="flex items-center justify-center  col-span-1">
                        Fondement
                        </Label>

                        <Textarea value={row.original.fondement} id="fondement" className="col-span-9" 
                        defaultValue={row.original.fondement} readOnly={true} />
                    </div>
                    <div className="grid grid-cols-10 items-center gap-4 w-full px-0 mx-0">
                        <Label htmlFor="condition" className="flex items-center justify-center  col-span-1">
                        Condition
                        </Label>

                        <Textarea value={row.original.condition} id="condition" className="col-span-9" 
                        defaultValue={row.original.condition} readOnly={true} />
                    </div>
                    <div className="grid grid-cols-10 items-center gap-4 w-full px-0 mx-0">
                        <Label htmlFor="object" className="flex items-center justify-center  col-span-1">
                            Object
                        </Label>

                        <Textarea value={row.original.object} id="object" className="col-span-9" 
                        defaultValue={row.original.object} readOnly={true} />
                    </div>
                    <div className="grid grid-cols-10 items-center gap-4 w-full px-0 mx-0">
                        <Label htmlFor="description" className="flex items-center justify-center  col-span-1">
                            Exemple
                        </Label>

                        <Textarea value={row.original.description} id="description" className="col-span-9" 
                        defaultValue={row.original.description} readOnly={true} />
                    </div>
                    
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default ReadDialog;
export type { ReadDialogProps };
