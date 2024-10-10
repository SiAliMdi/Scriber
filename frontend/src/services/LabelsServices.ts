import axios from "axios";
import { Label } from "../@types/label";

const fetchLabels = async (datasetId: string, setLabels: React.Dispatch<React.SetStateAction<Label[]>>) => { 
    const token = sessionStorage.getItem("token");
    await axios
      .get(
        `${import.meta.env.VITE_BACKEND_APP_API_URL}datasets/${datasetId}/labels/`,
        {
          headers: {
            Authorization: `${token}`,
          },
          withCredentials: true,
        }
      )
      .then((response) => {
        const labels: Label[] = response.data.map(
          (label: {
            id: string;
            label: string;
            description: string;
            color: string;
            created_at: Date;
            updated_at: Date;
            creator: string;
          }) => {
              return {
                  id: label.id,
                  label: label.label,
                  description: label.description,
                  color: label.color,
                  createdAt: label.created_at,
                  updatedAt: label.updated_at,
                  creator: label.creator,
              };
          }
        );
        setLabels(labels);
        console.log("Labels fetched " + labels.length);
      })
      .catch((error) => {
        console.log(error);
      });
  }

const createLabel = async (datasetId: string, label: Label) => {
    try {
      const token = sessionStorage.getItem("token");
      const response = await axios.post(
        // <str:dataset_id>/new_label/
        `${import.meta.env.VITE_BACKEND_APP_API_URL}datasets/${datasetId}/new_label/`,
        label,
        {
          headers: {
            Authorization: `${token}`,
          },
          withCredentials: true,
        }
      );
      return response;
    } catch (error) {
      console.error(error);
    }
  }

const updateLabel = async (labelId: string, label: Label) => {
    try {
      const token = sessionStorage.getItem("token");
      const response = await axios.patch(
        `${import.meta.env.VITE_BACKEND_APP_API_URL}datasets/label/${labelId}/`,
        label,
        {
          headers: {
            Authorization: `${token}`,
          },
          withCredentials: true,
        }
      );
      return response;
    } catch (error) {
      console.error(error);
    }
  }

const deleteLabel = async (labelId: string) => {
    try {
      const token = sessionStorage.getItem("token");
      const response = await axios.delete(
        `${import.meta.env.VITE_BACKEND_APP_API_URL}datasets/label/${labelId}/`,
        {
          headers: {
            Authorization: `${token}`,
          },
          withCredentials: true,
        }
      );
      return response;
    } catch (error) {
      console.error(error);
    }
  }

export { fetchLabels, createLabel, updateLabel, deleteLabel };