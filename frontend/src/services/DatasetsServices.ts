import { Dataset } from "@/@types/dataset";
import axios from "axios";


const fetchDatasets = async (categoryId: string, setDatasets: React.Dispatch<React.SetStateAction<Dataset[]>>) => {
  const token = sessionStorage.getItem("token");
  await axios
    .get(
      `${import.meta.env.VITE_BACKEND_APP_API_URL}datasets/${categoryId}/`,
      {
        headers: {
          Authorization: `${token}`,
        },
        withCredentials: true,
      }
    )
    .then((response) => {
      const datasets: Dataset[] = response.data.map(
        (dataset: {
          id: string;
          serial_number: number;
          name: string;
          description: string;
          size: number;
          annotated_decisions: number;
          categorie: string;
          labels: string[];
          created_at: Date;
          updated_at: Date;
          creator: string;
          deleted: boolean;
        }) => {
            return {
                id: dataset.id,
                serialNumber: dataset.serial_number,
                name: dataset.name,
                description: dataset.description,
                size: dataset.size,
                annotatedDecisions: dataset.annotated_decisions,
                categorie: dataset.categorie,
                labels: dataset.labels,
                createdAt: dataset.created_at,
                updatedAt: dataset.updated_at,
                creator: dataset.creator,
                deleted: dataset.deleted,
            };
        }
      );
      setDatasets(datasets);
      console.log("Datasets fetched " + datasets.length);
    })
    .catch((error) => {
      console.log(error);
    });
}



const createDataset = async (dataset: Dataset) => {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_BACKEND_APP_API_URL}datasets/1/new/`,
      {
        ...dataset
      },
      {
        headers: {
          Authorization: `${sessionStorage.getItem("token")}`,
        },
      }
    );
    return response;
  } catch (error) {
    return error;
  }
}

const editDataset = async (dataset: Dataset) => {
  try {
    const response = await axios.patch(
      `${import.meta.env.VITE_BACKEND_APP_API_URL}datasets/1/${dataset.id}/`,
      {
        ...dataset
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

const deleteDataset = async (dataset: Dataset) => {
  try {
    const response = await axios.delete(
      `${import.meta.env.VITE_BACKEND_APP_API_URL}datasets/1/${dataset.id}/`,
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

export {fetchDatasets, createDataset, editDataset, deleteDataset };
