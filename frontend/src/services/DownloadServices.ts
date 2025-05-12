// src/services/DownloadServices.ts
import axios from "axios";
export const saveDownloadLog = async (datasetId: string, fileName: string) => {
  const token = sessionStorage.getItem("token");
  await axios.post(
    `${import.meta.env.VITE_BACKEND_APP_API_URL}decisions/log_download/`,
    { dataset_id: datasetId, file_name: fileName },
    { headers: { Authorization: `${token}` } }
  );
};