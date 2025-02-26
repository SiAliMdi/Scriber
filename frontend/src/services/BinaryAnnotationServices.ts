import { BinaryAnnotation } from "@/@types/annotations";
import { Decision } from "@/@types/decision";
import axios from "axios";

const fetchBinDecisionsWithAnnotations = async (
  datasetId: string,
  setDecisions: React.Dispatch<React.SetStateAction<Decision[]>>,
  setAnnotations: React.Dispatch<React.SetStateAction<BinaryAnnotation[] | undefined>>
) => {
  const token = sessionStorage.getItem("token");

  try {
    const response = await axios.get(
      `${import.meta.env.VITE_BACKEND_APP_API_URL}decisions/bin_dataset/${datasetId}/all/`,
      {
        headers: { Authorization: `${token}` },
        withCredentials: true,
      }
    );

    // Extraire les décisions
    const decisions: Decision[] = response.data.raw_decisions.map(
      (decision: {
        id?: string;
        j_texte: string;
        j_chambre?: string;
        j_date?: string;
        j_rg: string;
        j_ville: string;
        j_type?: string;
        j_juridiction?: string;
      }) => ({
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

    // Extraire les annotations
    const annotations: BinaryAnnotation[] = response.data.annotations.map(
      (annotation: {
        id?: string,
        model_annotator?: string,
        creator: string,
        decisionId: string,
        label: string,
        updator?: string,
        updated_at?: Date,
      }) => ({
        id: annotation.id,
        label: annotation.label,
        decisionId: annotation.decision,
        creator: annotation.creator,
        model_annotator: annotation.model_annotator,
        updator: annotation.updator,
        updated_at: annotation.updated_at,
      })
    );

    setDecisions(decisions);
    setAnnotations(annotations);
  } catch (error) {
    console.error("Error fetching decisions and annotations:", error);
  }
};

const updateBinaryAnnotation = async (annotationId: string, label: string) => {
  try {
    const token = sessionStorage.getItem("token");
    await axios.patch(
      `${import.meta.env.VITE_BACKEND_APP_API_URL}annotations/bin_annotation/${annotationId}/`,
      { label },
      {
        headers: { Authorization: `${token}` },
        withCredentials: true,
      }
    );
  } catch (error) {
    console.error("Error updating binary annotation:", error);
  }
};

const deleteDatasetDecisions = async (datasetId: string, decisionsIds: string[]
) => {
  try {
    const token = sessionStorage.getItem("token");
    await axios.delete(
      `${import.meta.env.VITE_BACKEND_APP_API_URL}decisions/bin_dataset/${datasetId}/all/`,
      {
        headers: { Authorization: `${token}` },
        withCredentials: true,                                                                                                                    
        data: { decisionsIds }
      }
    );
  } catch (error) { 
    console.error("Error deleting dataset decisions:", error);
  }
};
export { fetchBinDecisionsWithAnnotations, updateBinaryAnnotation, deleteDatasetDecisions };
