import {  useEffect, useMemo, useState } from "react";
import BasePage from "./BasePage";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/DataTable";
import { Categorie } from "@/@types/categorie";
// import { deleteCategorie, editCategorie, fetchCategories } from "@/services/CategoriesServices";
import { fetchCategories } from "@/services/CategoriesServices";
// import { useToast } from "@/components/ui/use-toast";
import getColumns from "@/components/categories-list/Columns";


const CategoriesPage = () => {
    const [categories, setCategories] = useState<Categorie[]>([])
    const [columns, setColumns] = useState<ColumnDef<Categorie>[]>([]);
    // const { toast } = useToast();

    /* const onEdit = useCallback((value: Categorie) => {
        editCategorie(value).then((response) => {
            console.log(response);
        }
        ).catch((error) => {
            console.error(error);
        }
        );
    }, []);

    const onDelete = useCallback((value: Categorie) => {
        deleteCategorie(value).then(response => {
            if (response === 200) {
                fetchCategories(setCategories);
                toast({
                    title: "Catégorie supprimée",
                    duration: 3000,
                    description: `La catégorie ${value.serialNumber} supprimée avec succès`,
                    className: "text-green-700",});
            } else {
                toast({
                    variant: "destructive",
                    duration: 3000,
                    title: "Erreur de suppression",
                    description: `La catégorie ${value.serialNumber} n'a pas pu être supprimée`,
                });
            }
        }).catch(() => { })
    }, [toast]); */


    useMemo(() =>
        // setColumns(getColumns({ setCategories: setCategories, onEdit: onEdit, onDelete: onDelete })),
    // [onEdit, onDelete]);
        setColumns(getColumns()),
        []);

    useEffect(() => {
        fetchCategories(setCategories);
    }, [])
    return <div className="xl:w-screen">
        {<BasePage />}
        <div className="container mx-auto py-10 max-h-screen overflow-scroll xl:w-full">
            <DataTable columns={columns} data={categories} />
        </div>
    </div>;
}

export default CategoriesPage;
