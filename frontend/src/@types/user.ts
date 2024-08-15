
type User = {
    email: string;
    password: string;
    id?: string;

    isStaff?: boolean;
    isSuperuser?: boolean;
    isActive?: boolean;

    firstName?: string;
    lastName?: string;
    dateJoined?: Date;
    lastLogin?: Date;
} | null;

export type { User };