import { useCallback, useEffect, useMemo, useState } from "react";
import BasePage from "./BasePage";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/DataTable";
import { Prompt } from "@/@types/prompt";
import { Button } from "@/components/ui/button"
import CreateDialog from "@/components/prompts-list/CreateDialog";
import { fetchPrompts, createPrompt, editPrompt, deletePrompt } from "@/services/PromptsServices";
import { useToast } from "@/components/ui/use-toast";
import getColumns from "@/components/prompts-list/Columns";
import { useLocation } from 'react-router-dom';


const PromptsPage = () => {
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [columns, setColumns] = useState<ColumnDef<Prompt>[]>([]);
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [nextSerialNumber, setNextSerialNumber] = useState(0);
    const { toast } = useToast();
    const location = useLocation();

    const onEdit = useCallback((value: Prompt) => {
        editPrompt(value).then((response) => {
            console.log(response);
        }
        ).catch((error) => {
            console.error(error);
        }
        );
    }, []);

    const onDelete = useCallback((value: Prompt) => {
        deletePrompt(value).then(response => {
            if (response === 200) {
                fetchPrompts(location.state.categoryId, setPrompts);
                toast({
                    title: "Dataset supprimé",
                    duration: 3000,
                    description: `Le dataset ${value.serialNumber} supprimé avec succès`,
                    className: "text-green-700",
                });
            } else {
                toast({
                    variant: "destructive",
                    duration: 3000,
                    title: "Erreur de suppression",
                    description: `Le dataset ${value.serialNumber} n'a pas pu être supprimé`,
                });
            }
        }).catch(() => { })
    }, []);


    useMemo(() =>
        setColumns(getColumns({ setPrompts: setPrompts, onEdit: onEdit, onDelete: onDelete })),
        [onEdit, onDelete]);

    useEffect(() => {
        fetchPrompts(location.state.categoryId, setPrompts);
    }, [])
    
    return <div className="xl:w-screen">
        {<BasePage />}
        <div className="container mx-auto py-2 max-h-screen xl:w-full">
            {/* Aligner le bouton à droite  */}
            <h1 className="text-2xl font-bold float-left mx-1 my-2">Prompts de la catégorie {location.state.categorySerialNumber} </h1>
            <Button variant="secondary" className="bg-blue-500 text-white float-right mx-1 my-2" onClick={() => {
                setNextSerialNumber(prompts.length + 1);
                setCreateDialogOpen(true)
                console.log(nextSerialNumber)
            }}>Ajouter un prompt

            </Button>
            {
                createDialogOpen && <CreateDialog categoryId={location.state.categoryId} createPrompt={createPrompt} setPrompts={setPrompts} createDialogOpen={createDialogOpen} setCreateDialogOpen={setCreateDialogOpen}
                />
            }

            <DataTable columns={columns} data={prompts} />
        </div>
    </div>;
}

export default PromptsPage;
