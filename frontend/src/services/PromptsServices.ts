import { Prompt } from "@/@types/prompt";
import axios from "axios";


const fetchPrompts = async (categoryId: string, setPrompts: React.Dispatch<React.SetStateAction<Prompt[]>>) => {
  const token = sessionStorage.getItem("token");
  await axios
    .get(
      `${import.meta.env.VITE_BACKEND_APP_API_URL}ai_models/${categoryId}/prompts/`,
      {
        headers: {
          Authorization: `${token}`,
        },
        withCredentials: true,
      }
    )
    .then((response) => {
      const prompts: Prompt[] = response.data.map(
        (prompt: Prompt) => {
            return {
                id: prompt.id,
                prompt: prompt.prompt,
                createdAt: prompt.created_at,
                updatedAt: prompt.updated_at,
                category: prompt.category,
                jsonTemplate: prompt.json_template,
                creator: prompt.creator,
                deleted: prompt.deleted,
                serialNumber: prompt.serial_number,
            };
        }
      );
      setPrompts(prompts);
    })
    .catch((error) => {
      console.log(error);
    });
}

const createPrompt = async (dataset: Prompt) => {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_BACKEND_APP_API_URL}ai_models/prompts/new/`,
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

const editPrompt = async (dataset: Prompt) => {
  try {
    const response = await axios.patch(
      `${import.meta.env.VITE_BACKEND_APP_API_URL}ai_models/prompt/${dataset.id}/`,
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

const deletePrompt = async (prompt: Prompt) => {
  try {
    const response = await axios.delete(
      `${import.meta.env.VITE_BACKEND_APP_API_URL}ai_models/prompt/${prompt.id}/`,
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

export {fetchPrompts, createPrompt, editPrompt, deletePrompt };
