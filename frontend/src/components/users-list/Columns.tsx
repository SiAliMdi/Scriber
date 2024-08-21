import { User } from "@/@types/user";
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"

const columns: ColumnDef<User>[] = [
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
                    className="text-left font-bold"
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Activated
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
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

]
export default columns;