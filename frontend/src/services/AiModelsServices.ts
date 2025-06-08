import AiModel, { AiModelType, fetchedAiModel }  from "@/@types/ai-model";
import axios from "axios";
import { Training } from "@/@types/ai-model";


const fetchAiModels = async (categoryId: string, setAiModels: React.Dispatch<React.SetStateAction<AiModel[]>>) => {
  const token = sessionStorage.getItem("token");
  await axios
    .get(
      `${import.meta.env.VITE_BACKEND_APP_API_URL}ai_models/${categoryId}/`,
      {
        headers: {
          Authorization: `${token}`,
        },
        withCredentials: true,
      }
    )
    .then((response) => {
      const aimodels: AiModel[] = response.data.map(
        (model: fetchedAiModel) => {
            return {
                id: model.id,
                name: model.name,
                description: model.description,
                createdAt: model.created_at,
                updatedAt: model.updated_at,
                category: model.category,
                modelType: model.model_type,
                type: model.type,
                modelPath: model.model_path,
                creator: model.creator,
                deleted: model.deleted,
                serialNumber: model.serial_number,

            };
        }
      );
      setAiModels(aimodels);
    })
    .catch((error) => {
      console.log(error);
    });
}

const fetchAiModel = async (id: string): Promise<AiModel | undefined> => {
  try {
    const token = sessionStorage.getItem("token");
    const response = await axios.get(
      `${import.meta.env.VITE_BACKEND_APP_API_URL}ai_models/1/${id}/`,
      {
        headers: { Authorization: `${token}` },
        withCredentials: true
      }
    );
    const model:fetchedAiModel = response.data;
    return {
      id: model.id,
      name: model.name,
      description: model.description,
      createdAt: model.created_at,
      updatedAt: model.updated_at,
      category: model.category,
      modelType: model.model_type,
      modelPath: model.model_path,
      creator: model.creator,
      deleted: model.deleted,
      serialNumber: model.serial_number,

  };
  } catch (error) {
    console.error("Error fetching model:", error);
    return undefined;
  }
};

const createAiModel = async (dataset: AiModel) => {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_BACKEND_APP_API_URL}ai_models/new/`,
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

const editAiModel = async (dataset: AiModel) => {
  try {
    const response = await axios.patch(
      `${import.meta.env.VITE_BACKEND_APP_API_URL}ai_models/1/${dataset.id}/`,
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

const deleteAiModel = async (model: AiModel) => {
  try {
    const response = await axios.delete(
      `${import.meta.env.VITE_BACKEND_APP_API_URL}ai_models/1/${model.id}/`,
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

const fetchAiModelTypes = async (): Promise<AiModelType[] | undefined> => {
  try {
    const token = sessionStorage.getItem("token");
    const response = await axios.get(
      `${import.meta.env.VITE_BACKEND_APP_API_URL}ai_models/model-types/`,
      {
        headers: { Authorization: `${token}` },
        withCredentials: true
      }
    );
    return response.data as AiModelType[];
  } catch (error) {
    console.error("Error fetching model types:", error);
    return undefined;
  }
};

const fetchTrainings = async (modelId: string): Promise<Training[] | undefined> => {
  try {
    const token = sessionStorage.getItem("token");
    const response = await axios.get(
      `${import.meta.env.VITE_BACKEND_APP_API_URL}ai_models/trainings/${modelId}/`,
      {
        headers: { Authorization: `${token}` },
        withCredentials: true,
      }
    );
    return response.data as Training[];
  } catch (error) {
    console.error("Error fetching trainings:", error);
    return undefined;
  }
};

export {fetchAiModels, fetchAiModel, createAiModel, editAiModel, deleteAiModel, fetchAiModelTypes, fetchTrainings };