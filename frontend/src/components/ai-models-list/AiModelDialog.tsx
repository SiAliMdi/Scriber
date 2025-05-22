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
import { useEffect, useState } from "react";
import { fetchTrainings } from "@/services/AiModelsServices";
import AiModel, { Training } from "@/@types/ai-model";

interface ReadDialogProps<AiModel> {
    row: Row<AiModel>;
}

const ReadDialog = ({ row }: ReadDialogProps<AiModel>) => {

    const [trainings, setTrainings] = useState<Training[]>([]);

    useEffect(() => {
        const loadTrainings = async () => {
            const data = await fetchTrainings(row.original.id as string);
            if (data) setTrainings(data);
            console.log("trainings", data);
        };
        loadTrainings();
    }, [row.original.id]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "attente":
                return "text-yellow-500";
            case "entraîné":
                return "text-green-500";
            case "erreur":
                return "text-red-500";
            default:
                return "text-gray-500";
        }
    };

    return (<Dialog >
        <DialogTrigger asChild>
            <span className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-[#f5f5f5] hover:cursor-pointer">
                Afficher
            </span>
        </DialogTrigger>
        <DialogContent className="w-11/12 max-w-none mx-0">
            <DialogHeader>
                <DialogTitle>Le modèle {row.original.serialNumber} </DialogTitle>
            </DialogHeader>
            <div className="grid gap-1 py-1 w-full mx-0 px-0 overflow-y-auto max-h-80">
                <div className="grid grid-cols-10  gap-1 w-full mx-0 px-0">
                    <Label htmlFor="name" className="flex items-center justify-center  col-span-1">
                        Nom
                    </Label>
                    <Input
                        readOnly={true}
                        value={row.original.name}
                        id="name"
                        defaultValue={row.original.name} className="col-span-9"
                    />
                </div>
                <div className="grid grid-cols-10 items-center gap-4 w-full px-0 mx-0">
                    <Label htmlFor="description" className="flex items-center justify-center  col-span-1">
                        Description
                    </Label>
                    <Textarea value={row.original.description} id="description" className="col-span-9"
                        defaultValue={row.original.description} readOnly={true} />
                </div>
                <div className="grid grid-cols-10 items-center gap-4 w-full px-0 mx-0">
                    <Label htmlFor="description" className="flex items-center justify-center  col-span-1">
                        Catégorie du modèle
                    </Label>
                    <Input readOnly={true}
                        value={row.original.modelType}
                        id="modelType"
                        defaultValue={row.original.modelType} className="col-span-9" />
                </div>
                <div className="grid grid-cols-10 items-center gap-4 w-full px-0 mx-0">
                    <Label htmlFor="description" className="flex items-center justify-center  col-span-1">
                        Type de modèle
                    </Label>
                    <Input readOnly={true}
                        value={row.original.type}
                        id="type"
                        defaultValue={row.original.type} className="col-span-9" />

                </div>

                <div className="grid grid-cols-10 items-center gap-4 w-full px-0 mx-0">
                    <Label htmlFor="description" className="flex items-center justify-center col-span-1">
                        Entraînements
                    </Label>
                    <div className="col-span-9 overflow-y-auto max-h-25">
                        {trainings.map((training, idx) => (
                            <div key={training.id} className="flex flex-row items-center">
                                <strong className="mr-2">{idx + 1}.</strong>
                                <div
                                    key={training.id}
                                    className={`p-2 border rounded mb-2 ${getStatusColor(training.training_status)}`}
                                >
                                    <p>Statut: {training.training_status}</p>
                                    <p>Résultat: {JSON.stringify(training.training_result)}</p>
                                    <p>Date: {new Date(training.updated_at).toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DialogContent>
    </Dialog>
    )
}

export default ReadDialog;
export type { ReadDialogProps };
