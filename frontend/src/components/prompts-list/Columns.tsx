import {Prompt} from "@/@types/prompt";
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import DataTableRowActions from "./DataTableRowActions"


export interface PromptsColumnsProps {
    setPrompts: (value: Prompt[]) => void;
    onEdit: (value: Prompt) => void;
    onDelete: (value: Prompt) => void;
}

const getColumns = ({ setPrompts, onEdit, onDelete }: PromptsColumnsProps): ColumnDef<Prompt>[] => [
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
                    className="text-left font-bold h-1"
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Prompt
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        size: 10,
        id: "prompt",
        accessorFn: row =>  {
            if (!row.prompt) {
                return "";
            }
            else {
                return row.prompt.length > 10 ? row.prompt.slice(0, 10) + "..." : row.prompt;
            }
        }
            ,
            
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
        sortingFn: (rowA, rowB, columnId) => {
            const dateA = new Date(rowA.original[columnId]).getTime();
            const dateB = new Date(rowB.original[columnId]).getTime();
            return dateA - dateB;
        },
    },
    {
        id: "actions",
        cell: ({ row }) => { return <DataTableRowActions row={row} setPrompts={setPrompts} onEdit={onEdit} onDelete={onDelete} /> },
        size: 10,
    }
]
export default getColumns;