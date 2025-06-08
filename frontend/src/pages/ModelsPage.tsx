import { useCallback, useEffect, useMemo, useState } from "react";
import BasePage from "./BasePage";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/DataTable";
import AiModel from "@/@types/ai-model";
import { Button } from "@/components/ui/button"
import CreateDialog from "@/components/ai-models-list/CreateDialog";
import { fetchAiModels, createAiModel, editAiModel, deleteAiModel } from "@/services/AiModelsServices";
import { useToast } from "@/components/ui/use-toast";
import getColumns from "@/components/ai-models-list/Columns";
import { useLocation } from 'react-router-dom';


const ModelsPage = () => {
    const [AiModels, setAiModels] = useState<AiModel[]>([])
    const [columns, setColumns] = useState<ColumnDef<AiModel>[]>([]);
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [, setNextSerialNumber] = useState(0);
    const { toast } = useToast();
    const location = useLocation();

    const onEdit = useCallback((value: AiModel) => {
        editAiModel(value).then((response) => {
            console.log(response);
        }
        ).catch((error) => {
            console.error(error);
        }
        );
    }, []);

    const onDelete = useCallback((value: AiModel) => {
        deleteAiModel(value).then(response => {
            if (response === 200) {
                fetchAiModels(location.state.categoryId, setAiModels);
                toast({
                    title: "AiModel supprimé",
                    duration: 3000,
                    description: `Le AiModel ${value.serialNumber} supprimé avec succès`,
                    className: "text-green-700",
                });
            } else {
                toast({
                    variant: "destructive",
                    duration: 3000,
                    title: "Erreur de suppression",
                    description: `Le AiModel ${value.serialNumber} n'a pas pu être supprimé`,
                });
            }
        }).catch(() => { })
    }, [toast]);


    useMemo(() =>
        setColumns(getColumns({ setAiModels: setAiModels, onEdit: onEdit, onDelete: onDelete })),
        [onEdit, onDelete]);

    useEffect(() => {
        fetchAiModels(location.state.categoryId, setAiModels);
    }, [])

    return <div className="xl:w-screen">
        {<BasePage />}
        <div className="container mx-auto py-2 max-h-screen xl:w-full">
            <h1 className="text-2xl font-bold float-left mx-1 my-2">Modèles d'IA de la catégorie {location.state.categorySerialNumber} </h1>
            <Button variant="secondary" className="bg-blue-500 text-white float-right mx-1 my-2" onClick={() => {
                setNextSerialNumber(AiModels.length + 1);
                setCreateDialogOpen(true)
            }}>Ajouter un modèle d'IA

            </Button>
            {
                createDialogOpen && <CreateDialog categoryId={location.state.categoryId} createAiModel={createAiModel} setAiModels={setAiModels} createDialogOpen={createDialogOpen} setCreateDialogOpen={setCreateDialogOpen}
                />
            }

            <DataTable columns={columns} data={AiModels} />
        </div>
    </div>;
}

export default ModelsPage;
