import { ReactNode } from 'react';

export interface AuthProviderProps {
    children: ReactNode;
}

export type User = {
    email: string;
    password: string;
    isStaff?: boolean;
    isSuperuser?: boolean;
    isActive?: boolean;

    firstName?: string;
    lastName?: string;
    dateJoined?: string;
    lastLogin?: string;
    id?: string;
} | null;

export type AuthContextType = {
    user: User;
    authTokens: string ;
    loginUser: (e: React.FormEvent<HTMLFormElement>) => void;
    logoutUser: (e: React.MouseEvent<HTMLParagraphElement>) => void;
}
