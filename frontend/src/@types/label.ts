
type Label = {
    id? : string;
    label: string;
    // description?: string;
    color?: string;

    createdAt?: Date;
    updatedAt?: Date;
    creator?: string;
    deleted?: boolean;
}

export  type {Label};