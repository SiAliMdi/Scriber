import { Categorie } from "@/@types/categorie";
import axios from "axios";

const fetchCategories = async (setCategoriesDatasets: React.Dispatch<React.SetStateAction<Map<string, string[]>>>  ) => {
    try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_APP_API_URL}categories/`, {
        headers: {
            Authorization: `${sessionStorage.getItem("token")}`,
        },
        });
        const categories: Categorie[] = response.data.map(
            (categorie: {
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
              updater: string;
              deleted: boolean;
            }) => {
              return {
                id: categorie.id,
                serialNumber: categorie.serial_number,
                nomenclature: categorie.nomenclature,
                code: categorie.code,
                description: categorie.description,
                norme: categorie.norme,
                fondement: categorie.fondement,
                condition: categorie.condition,
                object: categorie.object,
                createdAt: categorie.created_at,
                updatedAt: categorie.updated_at,
                creator: categorie.creator,
                updater: categorie.updater,
                deleted: categorie.deleted,
              };
            }
          );
        const categoriesMap = new Map<string, string[]>();
        categories.forEach((categorie) => {
            const 
        });
    } catch (error) {
        console.error(error);
    }
    };

export { fetchCategories };