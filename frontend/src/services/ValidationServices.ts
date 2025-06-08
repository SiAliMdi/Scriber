import axios from "axios";
import { User } from "@/@types/user";
import AiModel, { Training } from "@/@types/ai-model";
import { BinaryAnnotation } from "@/@types/annotations";
import { Decision, fetchedDecision } from "@/@types/decision";


export const fetchUsersWithAnnotations = async (datasetId: string): Promise<User[]> => {
  const token = sessionStorage.getItem("token");
  const response = await axios.get(
    `${import.meta.env.VITE_BACKEND_APP_API_URL}annotations/users_with_annotations/${datasetId}/`,
    {
      headers: { Authorization: `${token}` },
      withCredentials: true,
    }
  );
  return response.data as User[];
};

export const fetchTrainedModelsForDataset = async (datasetId: string): Promise<{ models: AiModel[]; trained_models: Training[] }> => {
  const token = sessionStorage.getItem("token");
  const response = await axios.get(
    `${import.meta.env.VITE_BACKEND_APP_API_URL}annotations/trained_models/${datasetId}/`,
    {
      headers: { Authorization: `${token}` },
      withCredentials: true,
    }
  );
  return response.data as { models: AiModel[]; trained_models: Training[] };
};


export const fetchBinDecisionsWithAnnotations = async (
  datasetId: string,
  annotator: string ,
  trained_model_annotator: string ,
  setDecisions: React.Dispatch<React.SetStateAction<Decision[]>>,
  setAnnotations: React.Dispatch<React.SetStateAction<BinaryAnnotation[]>>
) => {
  const token = sessionStorage.getItem("token");
  try {
    let response;
    if (annotator || trained_model_annotator) {
      
       response = await axios.get(
        `${import.meta.env.VITE_BACKEND_APP_API_URL}annotations/validation/${datasetId}/`,
        {
          headers: { Authorization: `${token}` },
          params: {
            annotator,
            trained_model_annotator,
          },
          withCredentials: true,
        }
      );
    } else return;
    
    // Extract decisions
    const decisions: Decision[] = response.data.raw_decisions.map(
      (decision: fetchedDecision) => ({
        id: decision.id,
        j_texte: decision.texte_net,
        j_chambre: decision.j_chambre,
        j_date: decision.j_date,
        j_rg: decision.j_rg,
        j_ville: decision.j_ville,
        j_type: decision.j_type,
        j_juridiction: decision.j_juridiction,
      })
    );

    // Extract annotations
    const annotations: BinaryAnnotation[] = response.data.annotations.map(
      (annotation: {
        id: string;
        label: string;
        decision: string;
        state: string;
        creator?: string;
        model_annotator?: string;
        trained_model_annotator?: string;
        updated_at?: Date;
      }) => ({
        id: annotation.id,
        label: annotation.label,
        decisionId: annotation.decision,
        state: annotation.state,
        creator: annotation.creator,
        model_annotator: annotation.model_annotator,
        trainedModelAnnotator: annotation.trained_model_annotator,
        updated_at: annotation.updated_at,
      })
    );

    setDecisions(decisions);
    setAnnotations(annotations);
  } catch (error) {
    console.error("Error fetching decisions and annotations:", error);
  }
};

export const updateBinaryAnnotation = async (annotationId: string, state: string, label: string) => {
  try {
    const token = sessionStorage.getItem("token");
    await axios.patch(
      `${import.meta.env.VITE_BACKEND_APP_API_URL}annotations/validation/update/${annotationId}/`,
      { label, state },
      {
        headers: { Authorization: `${token}` },
        withCredentials: true,
      }
    );
  } catch (error) {
    console.error("Error updating binary annotation:", error);
  }
};