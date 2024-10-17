import { useCallback, useEffect, useMemo, useState } from "react";
import BasePage from "./BasePage";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/DataTable";
import { Dataset } from "@/@types/dataset";
import { Button } from "@/components/ui/button"
import CreateDialog from "@/components/datasets-list/CreateDialog";
import { fetchDatasets, createDataset, editDataset, deleteDataset } from "@/services/DatasetsServices";
import { useToast } from "@/components/ui/use-toast";
import getColumns from "@/components/datasets-list/Columns";
import { useLocation } from 'react-router-dom';


const PromptsPage = () => {
    const [datasets, setDatasets] = useState<Dataset[]>([])
    const [columns, setColumns] = useState<ColumnDef<Dataset>[]>([]);
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [nextSerialNumber, setNextSerialNumber] = useState(0);
    const { toast } = useToast();
    const location = useLocation();

    const onEdit = useCallback((value: Dataset) => {
        editDataset(value).then((response) => {
            console.log(response);
        }
        ).catch((error) => {
            console.error(error);
        }
        );
    }, []);

    const onDelete = useCallback((value: Dataset) => {
        deleteDataset(value).then(response => {
            if (response === 200) {
                fetchDatasets(location.state.categoryId, setDatasets);
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
    }, [toast]);


    useMemo(() =>
        setColumns(getColumns({ setDatasets: setDatasets, onEdit: onEdit, onDelete: onDelete })),
        [onEdit, onDelete]);

    useEffect(() => {
        fetchDatasets(location.state.categoryId, setDatasets);
    }, [])
    return <div className="xl:w-screen">
        {<BasePage />}
        <div className="container mx-auto py-2 max-h-screen xl:w-full">
            {/* Aligner le bouton à droite  */}
            <h1 className="text-2xl font-bold float-left mx-1 my-2">Prompts de la catégorie {location.state.categorySerialNumber} </h1>
            <Button variant="secondary" className="bg-blue-500 text-white float-right mx-1 my-2" onClick={() => {
                setNextSerialNumber(datasets.length + 1);
                setCreateDialogOpen(true)
            }}>Ajouter un dataset

            </Button>
            {
                createDialogOpen && <CreateDialog categoryId={location.state.categoryId} nextSerialNumber={nextSerialNumber} createDataset={createDataset} setDatasets={setDatasets} createDialogOpen={createDialogOpen} setCreateDialogOpen={setCreateDialogOpen}
                />
            }

            <DataTable columns={columns} data={datasets} />
        </div>
    </div>;
}

export default PromptsPage;
