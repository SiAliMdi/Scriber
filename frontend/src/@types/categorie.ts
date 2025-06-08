type Categorie = {
  id?: string;
  serialNumber?: number;
  nomenclature: string;
  code: string;
  description?: string;
  norme?: string;
  fondement?: string;
  condition?: string;
  object?: string;

  createdAt?: Date;
  updatedAt?: Date;
  creator?: string;
  updater?: string;
  deleted?: boolean;
};

type CreateCategorieResponse = {
  status: number;
  data: {
    id: string;
    serial_number: number;
    nomenclature: string;
    code: string;
    description: string;
    norme: string;
    fondement: string;
    condition: string;
    object: string;
    created_at: Date;
    updated_at: Date;
    creator: string;
    updater?: string | null;
    deleted: boolean;
  };
};

export type { Categorie, CreateCategorieResponse };
