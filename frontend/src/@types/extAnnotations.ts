// Update your existing types with these comprehensive definitions

import { TextAnnotation } from "./annotations";

// Raw decision type based on RawDecisionsModel and RawDecisionsSerializer
type RawDecision = {
  id: string;
  j_texte?: string;
  j_chambre?: string;
  j_date?: string;
  j_rg: string;
  j_ville: string;
  j_type?: string;
  j_juridiction?: string;
  j_nac?: string;
  j_id?: string;
  texte_net: string; // Cleaned text from serializer
  j_zones_net: Record<string, { start: number; end: number }>; // Zone mappings
  created_at: string;
  updated_at: string;
  deleted: boolean;
};

// Dataset decision type based on DatasetsDecisionsModel
type DatasetDecision = {
  id: string;
  raw_decision: RawDecision;
  dataset: string; // UUID
  created_at: string;
  updated_at: string;
  deleted: boolean;
};

// Decision with annotations type based on DecisionWithAnnotationsSerializer
type DecisionWithAnnotations = {
  id: string;
  raw_decision: RawDecision;
  annotations: TextAnnotation[];
  annotation_counts: Record<string, number>; // label_id -> count
};

// Response type for ExtDatasetRawDecisionsView
type FetchTextDecisionsResponse = {
  decisions: DecisionWithAnnotations[];
  total_annotation_counts: Record<string, number>;
};

export type { RawDecision, DatasetDecision, DecisionWithAnnotations, FetchTextDecisionsResponse };