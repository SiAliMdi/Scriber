// src/services/AnnotationServices.ts
import axios from "axios";
import { Decision } from "@/@types/decision";
import { TextAnnotation } from "@/@types/annotations";
import { User } from "@/@types/user";

export const fetchTextDecisionsWithAnnotations = async (
  datasetId: string,
  setDecisions: React.Dispatch<
    React.SetStateAction<Decision[]>
  >,
  setAnnotations: React.Dispatch<
    React.SetStateAction<Record<string, TextAnnotation[]>>
  >,
  setTotalAnnotationCounts: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >
) => {
  const token = sessionStorage.getItem("token");
  try {
    const response = await axios.get(
      `${
        import.meta.env.VITE_BACKEND_APP_API_URL
      }decisions/ext_dataset/${datasetId}/all/`,
      {
        headers: { Authorization: `${token}` },
        withCredentials: true,
      }
    );

    const { decisions, total_annotation_counts } =
      response.data;

    const mappedDecisions: Decision[] = decisions.map(
      (decision: any) => ({
        id: decision.id,
        j_texte: decision.raw_decision.texte_net,
        j_chambre: decision.raw_decision.j_chambre,
        j_date: decision.raw_decision.j_date,
        j_rg: decision.raw_decision.j_rg,
        j_ville: decision.raw_decision.j_ville,
        j_type: decision.raw_decision.j_type,
        j_juridiction: decision.raw_decision.j_juridiction,
      })
    );

    const annotationsByDecision: Record<
      string,
      TextAnnotation[]
    > = {};
    decisions.map((decision: any) => {
      annotationsByDecision[decision.id] =
        decision.annotations.map((annotation: any) => ({
          id: annotation.id,
          text: annotation.text,
          start_offset: annotation.start_offset,
          end_offset: annotation.end_offset,
          label: annotation.label,
          decision: annotation.decision,
          state: annotation.state || "",
        }));
    });

    setDecisions(mappedDecisions);
    setAnnotations(annotationsByDecision);
    setTotalAnnotationCounts(total_annotation_counts);
  } catch (error) {
    console.error(
      "Error fetching decisions and annotations:",
      error
    );
    throw error;
  }
};

export const createAnnotation = async (
  annotationData: any
) => {
  const token = sessionStorage.getItem("token");
  try {
    const response = await axios.post(
      `${
        import.meta.env.VITE_BACKEND_APP_API_URL
      }annotations/ext_annotation/`,
      annotationData,
      {
        headers: { Authorization: `${token}` },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating annotation:", error);
    throw error;
  }
};

export const deleteAnnotation = async (
  annotationId: string
) => {
  const token = sessionStorage.getItem("token");
  try {
    await axios.delete(
      `${
        import.meta.env.VITE_BACKEND_APP_API_URL
      }annotations/ext_annotation/${annotationId}/`,
      {
        headers: { Authorization: `${token}` },
        withCredentials: true,
      }
    );
  } catch (error) {
    console.error("Error deleting annotation:", error);
    throw error;
  }
};

export const deleteExtractiveDatasetDecisions = async (
  datasetId: string,
  decisionsIds: string[]
) => {
  try {
    const token = sessionStorage.getItem("token");
    const response = await axios.delete(
      `${
        import.meta.env.VITE_BACKEND_APP_API_URL
      }decisions/ext_dataset/${datasetId}/all/`,
      {
        headers: { Authorization: `${token}` },
        withCredentials: true,
        data: { decisionsIds },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error deleting extractive dataset decisions:",
      error
    );
    throw error;
  }
};

export const fetchExtractiveUsersWithAnnotations = async (
  datasetId: string
): Promise<User[]> => {
  const token = sessionStorage.getItem("token");
  const response = await axios.get(
    `${
      import.meta.env.VITE_BACKEND_APP_API_URL
    }annotations/extractive/users_with_annotations/${datasetId}/`,
    {
      headers: { Authorization: `${token}` },
      withCredentials: true,
    }
  );
  return response.data as User[];
};

export const fetchExtractiveModelsWithAnnotations = async (
  datasetId: string
): Promise<string[]> => {
  const token = sessionStorage.getItem("token");
  const response = await axios.get(
    `${
      import.meta.env.VITE_BACKEND_APP_API_URL
    }annotations/extractive/models_with_annotations/${datasetId}/`,
    {
      headers: { Authorization: `${token}` },
      withCredentials: true,
    }
  ); //11cf17bc-aed0-449c-b0f2-d3182aa1f9ca
  return response.data as string[];
};

export const validateDecisionAnnotations = async (
  decisionId: string
) => {
  const token = sessionStorage.getItem("token");
  try {
    await axios.patch(
      `${
        import.meta.env.VITE_BACKEND_APP_API_URL
      }annotations/ext_annotation/validate_decision/${decisionId}/`,
      {},
      {
        headers: { Authorization: `${token}` },
        withCredentials: true,
      }
    );
  } catch (error) {
    console.error(
      "Error validating decision annotations:",
      error
    );
    throw error;
  }
};
