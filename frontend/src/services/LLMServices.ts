import {
  ExtractionAnnotations,
  ExtractionTextAnnotation,
} from "@/@types/annotations";
import axios from "axios";

export interface LLMExtractionAnnotationsResponse {
  extractions: ExtractionAnnotations[];
  extraction_texts: ExtractionTextAnnotation[];
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
