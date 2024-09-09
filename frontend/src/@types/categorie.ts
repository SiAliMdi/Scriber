
type Categorie = {
    id : string;
    serialNumber: number;
    nomenclature : string;
    code : string;
    description : string;
    norme : string;
    fondement : string;
    condition : string;
    object : string;

    createdAt : Date;
    updatedAt : Date;
    creator : string;
    updater : string;
    deleted : boolean;
};

export type { Categorie };