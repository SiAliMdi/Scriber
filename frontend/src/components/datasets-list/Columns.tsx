import { Dataset } from "@/@types/dataset";
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import DataTableRowActions from "./DataTableRowActions";


export interface DatasetsColumnsProps {
    setDatasets: React.Dispatch<React.SetStateAction<Dataset[]>>;
    // onEdit: (value: Dataset) => void;
    onDelete: (value: Dataset) => void;
}

const getColumns =  ({ setDatasets,  onDelete }: DatasetsColumnsProps): ColumnDef<Dataset>[] => [
    {
        header: ({ column }) => {
            return (
                <Button
                    className="text-left font-bold"
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Indice
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        id: "serialNumber",
        accessorFn: row => `${row.serialNumber}`,
    },
    {
        header: ({ column }) => {
            return (
                <Button
                    className="text-left font-bold"
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Nom
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        id: "name",
        accessorFn: row => row.name.length > 11 ? row.name.substring(0, 11) + "..." : row.name,
    },
    {
        header: ({ column }) => {
            return (
                <Button
                    className="text-left font-bold h-1"
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Description
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        size: 10,
        id: "description",
        accessorFn: row => row.description.length > 11 ? row.description.substring(0, 11) + "..." : row.description,
    },
    {
        header: ({ column }) => {
            return (
                <Button
                    className="text-left font-bold"
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Taille
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        id: "size",
        accessorKey : "size",
    },
    /* {
        header: ({ column }) => {
            return (
                <Button
                    className="text-left font-bold"
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Etat de l'annotation
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        id: "annotatedDecisions",
        accessorKey : "annotatedDecisions",
    }, */
    {
        header: ({ column }) => {
            return (
                <Button
                    className="text-left font-bold"
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Date de création
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        id: "createdAt",
        accessorFn: row => row?.createdAt ? new Date(row.createdAt).toLocaleString() : "Never",
        sortingFn: (rowA, rowB) => {
            const dateA = new Date(rowA.original.createdAt ?? 0).getTime();
            const dateB = new Date(rowB.original.createdAt ?? 0).getTime();
            return dateA - dateB;
        },

    },
    {
        id: "actions",
        cell: ({ row }) => { return <DataTableRowActions row={row} setDatasets={setDatasets} onDelete={onDelete} /> },
        size: 10,
    }
]
export default getColumns;