import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Row } from "@tanstack/react-table"
import { Switch } from "@/components/ui/switch"
import { useState } from "react"
import { activateUser } from "@/services/UsersServices"
import { useToast } from "@/components/ui/use-toast"
import cloneDeep from 'lodash/cloneDeep';

interface EditDialogProps<TData> {
    row: Row<TData>;
    onEdit: (value: TData) => void;
    setUsers: (value: TData[]) => void;
}

const EditDialog = <TData,>({ row, onEdit, setUsers }: EditDialogProps<TData>) => {

    const [isStaff, setIsStaff] = useState(row.original.isStaff);
    const { toast } = useToast();

    const handleSave = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.preventDefault();
        const user = cloneDeep(row.original);
        user.isStaff = isStaff;

        activateUser(user).then((response) => {
            if (response === 200) {
                setUsers((prev: TData[]) => {
                    const index = prev.findIndex(u => u.id === user.id);
                    prev[index] = user;
                    return [...prev];
                });
                toast({
                    title: "User edit success",
                    duration: 3000,
                    description: `User ${row.original.firstName} ${row.original.lastName} ${isStaff ? "activated" : "deactivated"}`,
                    // className: "bg-accent-foreground text-accent",
                    className: "text-green-700",
                });
            } else {
                toast({
                    variant: "destructive",
                    duration: 5000,
                    title: "User edit failed",
                    description: `User ${row.original.firstName} ${row.original.lastName} could not be edited`,
                });
            }
        }).catch(() => {});
    }

    return (
        (<Dialog>
            <DialogTrigger asChild>
                <span className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-[#f5f5f5] hover:cursor-pointer">
                    Edit
                </span>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit user</DialogTitle>
                    <DialogDescription>
                        Activate/Deactivate user here by toggling the switch.
                        <br />
                        Deactivated users will not be able to log in.
                        <br />
                        Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name
                        </Label>
                        <Input
                            disabled
                            value={row.original.firstName + " " + row.original.lastName}
                            id="name"
                            defaultValue="Pedro Duarte"
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                            Email
                        </Label>
                        <Input
                            disabled
                            value={row.original.email}
                            id="email"
                            defaultValue="@peduarte"
                            className="col-span-3"
                        />
                    </div>
                    <div>
                        <Label htmlFor="activated" className="text-right mr-4">
                            Activated
                        </Label>
                        <Switch
                            id="activated"
                            className="col-span-3"
                            defaultChecked={row.original.isStaff}
                            onCheckedChange={(checked) => setIsStaff(checked)}
                            checked={isStaff}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={handleSave}>Save changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>)
    )
}

export default EditDialog;
export type { EditDialogProps };
