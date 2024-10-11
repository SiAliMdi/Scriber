type Dataset = {
    id?: string,
    serialNumber? : number,
    name: string,
    description: string,
    size : number,
    annotatedDecisions : number,
    categorie : string,
    labels?: string[],

    createdAt? : Date,
    updatedAt? : Date,
    creator? : string,
    deleted? : boolean,
}

export type { Dataset };