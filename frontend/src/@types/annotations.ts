import { JSONObject } from "./prompt";

type BinaryAnnotation = {
    id?: string,
    model_annotator?: string,
    creator?: string,
    decisionId: string,
    label: string,
    state?: string,
    trainedModelAnnotator?: string,
    updator ?: string,
    updated_at ?: Date,
}

type TextAnnotation = {
    id: string;
    text: string;
    start_offset: number;
    end_offset: number;
    label: {
        id: string;
        label: string;
        color: string;
    };
    decision: string;
    state?: string;
}

type ExtractionAnnotations = {
    id: string; // UUID
    decision: string; // UUID of DatasetsDecisionsModel
    llm_json_result?: JSONObject;
    model_annotator?: string;
    state?: string;
    creator: string; // UUID of ScriberUsers
    created_at: string; // ISO timestamp
    updated_at: string; // ISO timestamp
  };
  
  type ExtractionTextAnnotation = {
    id: string; // UUID
    extraction: string; // UUID of ExtractionAnnotations
    text?: string;
    start_offset?: number;
    end_offset?: number;
    label?: string;
  };
  
export type { BinaryAnnotation, TextAnnotation, ExtractionAnnotations, ExtractionTextAnnotation };