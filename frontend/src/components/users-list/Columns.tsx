import { User } from "@/@types/user";
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import DataTableRowActions from "../ui/DataTableRowActions";


export interface UsersColumnsProps {
    setUsers: (value: User[]) => void;
    onEdit: (value: User) => void;
    onDelete: (value: User) => void;
}

const getColumns = ({setUsers, onEdit, onDelete }: UsersColumnsProps): ColumnDef<User>[] => [
    {
        header: ({ column }) => {
            return (
                <Button
                    className="text-left font-bold"
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        id: "name",
        accessorFn: row => `${row?.firstName} ${row?.lastName}`,
    },
    {
        header: ({ column }) => {
            return (
                <Button
                    className="text-left font-bold"
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Email
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        id: "email",
        accessorKey: "email",
        cell: props => {
            const email = props.getValue() as string;
            return (<a href={`mailto:${email}`}>{email}</a>)
        },
    },
    {
        header: ({ column }) => {
            return (
                <Button
                    className="text-left font-bold h-1"
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Activated
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        size: 10,
        id: "activated",
        accessorFn: row => row?.isStaff ? "Yes" : "No",
        meta: {
            filterVariant: 'select',
            filterOptions: [
                { label: "Yes", value: "Yes" },
                { label: "No", value: "No" },
            ],
        },
    },
    {
        header: ({ column }) => {
            return (
                <Button
                    className="text-left font-bold"
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Last Login
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        id: "lastLogin",
        accessorFn: row => row?.lastLogin ? new Date(row.lastLogin).toLocaleString() : "Never",
        sortingFn: (rowA, rowB, columnId) => {
            const dateA = new Date(rowA.original[columnId]).getTime();
            const dateB = new Date(rowB.original[columnId]).getTime();
            return dateA - dateB;
        },

    },
    {
        // header: "Actions",
        id: "actions",
        cell: ({ row }) => { return <DataTableRowActions row={row} setUsers={setUsers} onEdit={onEdit} onDelete={onDelete} /> },
        size: 10,
    }
]
export default getColumns;