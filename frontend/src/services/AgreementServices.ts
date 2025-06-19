import axios from "axios";

const fetchBinaryAgreement = async (datasetId: string,
  //  user1?: string, user2?: string, model?: string
  ) => {
  const token = sessionStorage.getItem("token");
 /*  const params = new URLSearchParams();
  if (user1) params.append("user1", user1);
  if (user2) params.append("user2", user2);
  if (model) params.append("model", model); */

  const response = await axios.get(
    `${import.meta.env.VITE_BACKEND_APP_API_URL}annotations/binary/agreement/${datasetId}/`,
    // ?${params.toString()}
    {
      headers: { Authorization: `${token}` },
      withCredentials: true,
    }
  );
  return response.data;
};

const fetchExtractiveAgreement = async (datasetId: string, 
  // user1?: string, user2?: string, model?: string
) => {
  const token = sessionStorage.getItem("token");
  // const params = new URLSearchParams();
  /* if (user1) params.append("user1", user1);
  if (user2) params.append("user2", user2);
  if (model) params.append("model", model); */

  const response = await axios.get(
    `${import.meta.env.VITE_BACKEND_APP_API_URL}annotations/extractive/agreement/${datasetId}/`,
    // ?${params.toString()}
    {
      headers: { Authorization: `${token}` },
      withCredentials: true,
    }
  );
  return response.data;
};

export { fetchBinaryAgreement, fetchExtractiveAgreement };
