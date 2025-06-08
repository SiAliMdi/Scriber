import AiModel from "@/@types/ai-model";
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import DataTableRowActions from "./DataTableRowActions"


export interface AiModelsColumnsProps {
    setAiModels: React.Dispatch<React.SetStateAction<AiModel[]>>;
    onEdit: (value: AiModel) => void;
    onDelete: (value: AiModel) => void;
}

const getColumns = ({ setAiModels, onEdit, onDelete }: AiModelsColumnsProps): ColumnDef<AiModel>[] => [
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
        accessorKey: "name",
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
        accessorFn: row => {
            if (!row.description) {
                return "";
            }
            else {
                return row.description.length > 10 ? row.description.slice(0, 10) + "..." : row.description;
            }
        }
    },
    {
        header: ({ column }) => {
            return (
                <Button
                    className="text-left font-bold"
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Catégorie
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        id: "modelType",
        accessorFn: row => {
            if (!row.modelType) {
                return "";
            }
            else {
                return row.modelType.length > 10 ? row.modelType.slice(0, 10) + "..." : row.modelType;
            }
        }
    },
    {
        header: ({ column }) => {
            return (
                <Button
                    className="text-left font-bold"
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Type
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        id: "type",
        accessorFn: row => {
            if (!row.type) {
                return "";
            }
            else {
                return row.type.length > 10 ? row.type.slice(0, 10) + "..." : row.type;
            }
        }
    },
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
        cell: ({ row }) => { return <DataTableRowActions row={row} setAiModels={setAiModels} onEdit={onEdit} onDelete={onDelete} /> },
        size: 10,
    }
]
export default getColumns;