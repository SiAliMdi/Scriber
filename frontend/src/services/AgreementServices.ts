import axios from "axios";
import { AgreementResults } from "@/components/datasets-list/AgreementDialog";

const fetchBinaryAgreement = async (
  datasetId: string,
  setResults: React.Dispatch<React.SetStateAction<AgreementResults | null>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>
) => {
  const token = sessionStorage.getItem("token");
  setLoading(true);
  setError(null);

  try {
    const response = await axios.get(
      `${import.meta.env.VITE_BACKEND_APP_API_URL}annotations/binary/agreement/${datasetId}/`,
      {
        headers: { Authorization: `${token}` },
        withCredentials: true,
      }
    );
    console.log("Binary agreement response:", response.data);
    setResults(response.data);
  } catch (error: any) {
    console.error("Error fetching binary agreement:", error);
    setError(
      error.response?.data?.message ||
        error.response?.data?.error ||
        "Erreur lors du calcul des métriques d'accord"
    );
  } finally {
    setLoading(false);
  }
};

const fetchExtractiveAgreement = async (
  datasetId: string,
  setResults: React.Dispatch<React.SetStateAction<AgreementResults | null>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>
) => {
  const token = sessionStorage.getItem("token");
  setLoading(true);
  setError(null);

  try {
    const response = await axios.get(
      `${import.meta.env.VITE_BACKEND_APP_API_URL}annotations/extractive/agreement/${datasetId}/`,
      {
        headers: { Authorization: `${token}` },
        withCredentials: true,
      }
    );
    setResults(response.data);
  } catch (error: any) {
    console.error("Error fetching extractive agreement:", error);
    setError(
      error.response?.data?.message ||
        error.response?.data?.error ||
        "Erreur lors du calcul des métriques d'accord"
    );
  } finally {
    setLoading(false);
  }
};

export { fetchBinaryAgreement, fetchExtractiveAgreement };
