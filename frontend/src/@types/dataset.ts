import { Label } from "./label";

type Dataset = {
    id?: string,
    serialNumber? : number,
    name: string,
    description: string,
    size? : number,
    annotatedDecisions? : number,
    categorie : string,
    labels?: Label[],

    createdAt? : Date,
    updatedAt? : Date,
    creator? : string,
    deleted? : boolean,
}

interface CreateDatasetResponse {
  status: number;
  data: {
    id: string;
    serial_number: number;
    name: string;
    description: string;
    size: number;
    annotated_decisions: number;
    categorie: string;
    labels?: Label[];
    created_at: string; // ISO date string from Django
    updated_at: string; // ISO date string from Django
    creator: string;
    updater: string | null;
    deleted: boolean;
  };
}
export type { Dataset, CreateDatasetResponse };