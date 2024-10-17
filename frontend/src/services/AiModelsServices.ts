import AiModel  from "@/@types/ai-model";
import axios from "axios";


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
        (model: AiModel) => {
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
        }
      );
      setAiModels(aimodels);
    })
    .catch((error) => {
      console.log(error);
    });
}

const createAiModel = async (dataset: AiModel) => {
  try {
    console.log('sending new model ====');
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
    console.log('new model sent ====');
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

export {fetchAiModels, createAiModel, editAiModel, deleteAiModel };
