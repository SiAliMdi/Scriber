import { Categorie } from "@/@types/categorie";
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import DataTableRowActions from "./DataTableRowActions";


export interface CategoriesColumnsProps {
    setCategories: React.Dispatch<React.SetStateAction<Categorie[]>>;
    // onEdit: (value: Categorie) => void;
    onDelete: (value: Categorie) => void;
}

const getColumns = ({ setCategories, onDelete }: CategoriesColumnsProps): ColumnDef<Categorie>[] => [
    // (): ColumnDef<Categorie>[] => [
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
                    Nomenclature
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        id: "nomenclature",
        accessorKey: "nomenclature",
    },
    {
        header: ({ column }) => {
            return (
                <Button
                    className="text-left font-bold h-1"
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Code
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        size: 10,
        id: "code",
        accessorFn: row => row.code.length > 10 ? row.code.slice(0, 10) + "..." : row.code,
    },
    {
        header: ({ column }) => {
            return (
                <Button
                    className="text-left font-bold"
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Norme
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        id: "norme",
        accessorFn: row => row.norme?.length || 0 > 10 ? row.norme?.slice(0, 10) + "..." : row.norme,
    },
    {
        header: ({ column }) => {
            return (
                <Button
                    className="text-left font-bold"
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Fondement
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        id: "fondement",
        accessorFn: row => row.fondement?.length || 0 > 10 ? row.fondement?.slice(0, 10) + "..." : row.fondement,
    },
    {
        header: ({ column }) => {
            return (
                <Button
                    className="text-left font-bold"
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    Condition
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        id: "condition",
        accessorFn: row => row.condition?.length || 0 > 10 ? row.condition?.slice(0, 10) + "..." : row.condition,
    },
    {
        header: ({ column }) => {
            return (
                <Button
                    className="text-left font-bold"
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Objet
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        id: "object",
        accessorFn: row => row.object?.length || 0 > 10 ? row.object?.slice(0, 10) + "..." : row.object,
        // accessorKey : "object",
    },
    // header: "Actions",
    {
        id: "actions",
        cell: ({ row }) => { return <DataTableRowActions row={row} setCategories={setCategories} onDelete={onDelete} /> },
        size: 10,
    }
]
export default getColumns;