import { Categorie } from "@/@types/categorie";
import axios from "axios";


const fetchCategories = async (setCategories: React.Dispatch<React.SetStateAction<Categorie[]>>) => {
  const token = sessionStorage.getItem("token");
  await axios
    .get(
      `${import.meta.env.VITE_BACKEND_APP_API_URL}categories/`,
      {
        headers: {
          Authorization: `${token}`,
        },
        withCredentials: true,
      }
    )
    .then((response) => {
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
      setCategories(categories);
    })
    .catch((error) => {
      console.log(error);
    });
}

const createCategorie = async (categorie: Categorie) => {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_BACKEND_APP_API_URL}categories/`,
      {
        ...categorie
      },
      {
        headers: {
          Authorization: `${sessionStorage.getItem("token")}`,
        },
      }
    );
    return response.status;
  } catch (error) {
    return error;
  }
}

const editCategorie = async (categorie: Categorie) => {
  try {
    const response = await axios.patch(
      `${import.meta.env.VITE_BACKEND_APP_API_URL}categories/${categorie.id}/`,
      {
        ...categorie
      },
      {
        headers: {
          Authorization: `${sessionStorage.getItem("token")}`,
        },
      }
    );
    return response.status;
  } catch (error) {
    return error;
  }
};

const deleteCategorie = async (categorie: Categorie) => {
  try {
    const response = await axios.delete(
      `${import.meta.env.VITE_BACKEND_APP_API_URL}categories/${categorie.id}/`,
      {
        headers: {
          Authorization: `${sessionStorage.getItem("token")}`,
        },
        
      }
    );
    return response.status;
  } catch (error) {
    return error;
  }
};

export {fetchCategories,createCategorie, editCategorie, deleteCategorie };
