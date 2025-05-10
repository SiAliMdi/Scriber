import {
  ExtractionAnnotations,
} from "@/@types/annotations";
import { Decision } from "@/@types/decision";
import { JSONObject } from "@/@types/prompt";
import axios from "axios";



export interface DecisionWithExtraction {
  decision: Decision;
  extraction: ExtractionAnnotations | null;
}

export async function fetchLLMExtractionAnnotations(
  datasetId: string,
  modelAnnotator: string
): Promise<ExtractionAnnotations[]> {
  const token = sessionStorage.getItem("token");

  const res = await axios.get(
    `${
      import.meta.env.VITE_BACKEND_APP_API_URL
    }annotations/extractive/llm_annotations/${datasetId}/`,
    {
      headers: {
        Authorization: `${token}`,
        "Content-Type": "application/json",
      },
      params: {
        model_annotator: modelAnnotator,
      },
    }
  );
  return res.data;
}

export async function fetchDecisionsWithLLMExtractions(
  datasetId: string,
  modelAnnotator: string
): Promise<DecisionWithExtraction[]> {
  const token = sessionStorage.getItem("token");
  const res = await axios.get(
    `${
      import.meta.env.VITE_BACKEND_APP_API_URL
    }annotations/extractive/llm_decisions_with_annotations/${datasetId}/`,
    {
      headers: {
        Authorization: `${token}`,
        "Content-Type": "application/json",
      },
      params: {
        model_annotator: modelAnnotator,
      },
    }
  );
  return res.data;
}

export async function saveExtractionValidation(
  extractionId: string,
  llm_json_result: JSONObject,
  state: string
): Promise<void> {
  const token = sessionStorage.getItem("token");
  await axios.patch(
    `${
      import.meta.env.VITE_BACKEND_APP_API_URL
    }annotations/extractive/llm_extraction/${extractionId}/`,
    {
      llm_json_result,
      state,
    },
    {
      headers: {
        Authorization: `${token}`,
        "Content-Type": "application/json",
      },
    }
  );
}


export const deleteLLMDatasetDecisions = async (
  datasetId: string,
  decisionsIds: string[],
  modelAnnotator: string
) => {
  const token = sessionStorage.getItem("token");
  return axios.delete(
    `${
      import.meta.env.VITE_BACKEND_APP_API_URL
    }decisions/llm_dataset/${datasetId}/all/`,
    {
      headers: { Authorization: `${token}` },
      withCredentials: true,
      data: { decisionsIds, modelAnnotator },
    }
  );
};