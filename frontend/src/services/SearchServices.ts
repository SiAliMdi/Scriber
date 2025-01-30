import { Categorie } from "@/@types/categorie";
import { Dataset } from "@/@types/dataset";
import axios from "axios";
import { Client } from "typesense";
import {
  Decision,
  SearchParameters,
  SearchResult,
} from "@/@types/search";

const TypesenseClient = new Client({
  nodes: [
    {
      host: `${import.meta.env.VITE_TYPESENSE_HOST}`,
      port: parseInt(
        import.meta.env.VITE_TYPESENSE_PORT || "1000"
      ),
      protocol: "http",
    },
  ],
  apiKey: `${import.meta.env.VITE_TYPESENSE_API_KEY}`,
  connectionTimeoutSeconds: 200,
});

const fetchCategories = async (
  setCategoriesDatasets: React.Dispatch<
    React.SetStateAction<Map<Categorie, Dataset[]>>
  >
) => {
  const categoriesMap = new Map<Categorie, Dataset[]>();
  try {
    const token = sessionStorage.getItem("token");
    const response = await axios.get(
      `${import.meta.env.VITE_BACKEND_APP_API_URL}categories/`,
      {
        headers: {
          Authorization: `${token}`,
        },
      }
    );
    const categories: Categorie[] = response.data.map(
      (categorie: {
        id: string;
        serial_number: number;
        nomenclature: string;
        code: string;
        description: string;
        norme: string;
        fondement: string;
        condition: string;
        object: string;
        created_at: Date;
        updated_at: Date;
        creator: string;
        updater: string;
        deleted: boolean;
      }) => {
        return {
          id: categorie.id,
          serialNumber: categorie.serial_number,
          nomenclature: categorie.nomenclature,
          code: categorie.code,
          description: categorie.description,
          norme: categorie.norme,
          fondement: categorie.fondement,
          condition: categorie.condition,
          object: categorie.object,
          createdAt: categorie.created_at,
          updatedAt: categorie.updated_at,
          creator: categorie.creator,
          updater: categorie.updater,
          deleted: categorie.deleted,
        };
      }
    );

    for (const categorie of categories) {
      const response2 = await axios.get(
        `${import.meta.env.VITE_BACKEND_APP_API_URL}datasets/${
          categorie.id
        }/`,
        {
          headers: {
            Authorization: `${token}`,
          },
          withCredentials: true,
        }
      );

      const datasets: Dataset[] = response2.data.map(
        (dataset: {
          id: string;
          serial_number: number;
          name: string;
          description: string;
          size: number;
          annotated_decisions: number;
          categorie: string;
          labels: string[];
          created_at: Date;
          updated_at: Date;
          creator: string;
          deleted: boolean;
        }) => {
          return {
            id: dataset.id,
            serialNumber: dataset.serial_number,
            name: dataset.name,
            description: dataset.description,
            size: dataset.size,
            annotatedDecisions: dataset.annotated_decisions,
            categorie: dataset.categorie,
            labels: dataset.labels,
            createdAt: dataset.created_at,
            updatedAt: dataset.updated_at,
            creator: dataset.creator,
            deleted: dataset.deleted,
          };
        }
      );
      categoriesMap.set(
        categorie,
        datasets.length > 0 ? datasets : []
      );
    }
  } catch (error) {
    console.error("Error fetching categories: " + error);
  }

  setCategoriesDatasets(categoriesMap);
};

const fetchVilles = async (
  setVilles: React.Dispatch<React.SetStateAction<string[]>>,
  juridictions: string[] = ["ca"]
) => {
  const token = sessionStorage.getItem("token");
  const response = await axios.get(
    `${
      import.meta.env.VITE_BACKEND_APP_API_URL
    }decisions/villes/`,
    {
      headers: {
        Authorization: `${token}`,
      },
      params: {
        juridictions,
      },
    }
  );
  try {
    const villes: string[] = response.data.map(
      (ville: string) => {
        return ville;
      }
    );
    villes.unshift("Toutes les villes");
    setVilles(villes);
  } catch (error) {
    console.error("Error fetching villes: " + error);
  }
};

const search = async (
  searchParameters: SearchParameters,
  setSearchResult: React.Dispatch<
    React.SetStateAction<SearchResult>
  >
): Promise<SearchResult> => {
  try {
    const searchResults = await TypesenseClient.collections(
      `${import.meta.env.VITE_TYPESENSE_COLLECTION_NAME}`
    )
      .documents()
      .search(searchParameters);

    const hits: Decision[] | [] =
      searchResults.hits?.map((hit: any) => {
        const intDate = hit.document.j_date; // Example timestamp
        const date = new Date(intDate * 1000); // Convert to milliseconds
        const formattedDate = date.toISOString().split("T")[0];

        return {
          id: hit.document.id,
          j_texte: hit.document.j_texte,
          j_chambre: hit.document.j_chambre,
          j_date: formattedDate,
          j_rg: hit.document.j_rg,
          j_ville: hit.document.j_ville,
          j_type: hit.document.j_type,
          j_juridiction: "ca",
          highlight: hit.highlight.j_texte.snippet,
        };
      }) || [];

    const searchResult: SearchResult = {
      hits,
      found: searchResults.found,
      total: searchResults.out_of,
      page: searchResults.page,
      search_time_ms: searchResults.search_time_ms,
    };
    setSearchResult(searchResult);

    return searchResult;
  } catch (error) {
    console.error("Error while querying Typesense:", error);
    throw error;
  }
};

const groupedSearch = async (
  searchParameters: SearchParameters,
  setSearchResult: React.Dispatch<React.SetStateAction<SearchResult>>
): Promise<SearchResult> => {
  try {
    const searchResults = await TypesenseClient.collections(
      `${import.meta.env.VITE_TYPESENSE_COLLECTION_NAME}`
    )
      .documents()
      .search(searchParameters);

    // Process grouped results
    const groups = searchResults.grouped_hits?.map((group: any) => {
      // Format group key according to your pattern: "15/05521-ca-paris-2025/01/12-sociale-arret"
      const [j_rg, j_juridiction, j_ville, j_date, j_chambre, j_type] = group.group_key;
      
      // Convert timestamp to formatted date string
      const date = new Date(parseInt(j_date) * 1000);
      const formattedDate = `${date.getFullYear()}/${(date.getMonth() + 1)
        .toString()
        .padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;

      // Create the group identifier string
      const groupKey = `${j_rg}-${j_juridiction}-${j_ville}-${formattedDate}-${j_chambre}-${j_type}`
        .toLowerCase()
        .replace(/\s+/g, '-');

      // Process hits within the group
      const hits: Decision[] = group.hits.map((hit: any) => {
        const document = hit.document;
        return {
          id: document.id,
          j_texte: document.j_texte,
          j_chambre: document.j_chambre,
          j_date: formattedDate,
          j_rg: document.j_rg,
          j_ville: document.j_ville,
          j_type: document.j_type,
          j_juridiction: document.j_juridiction,
          highlight: hit.highlight?.j_texte?.snippet || '',
        };
      });

      return {
        groupKey,
        hits,
        // Add any additional group-level information here
      };
    }) || [];

    const decisions: Decision[] = groups.map(group => group.hits).flat();
    const searchResult: SearchResult = {
      hits: decisions,
      found: searchResults.found,
      total: searchResults.out_of,
      page: searchResults.page,
      search_time_ms: searchResults.search_time_ms,
    };

    setSearchResult(searchResult);
    return searchResult;

  } catch (error) {
    console.error("Error while querying Typesense:", error);
    throw error;
  }
};

const logCollection = async () => {
  try {
    const collection = await TypesenseClient.collections(
      `${import.meta.env.VITE_TYPESENSE_COLLECTION_NAME}`
    ).retrieve();
    console.log(
      "**** mycollection " +
        collection["name"] +
        collection["num_documents"]
    );
    for (const field of collection["fields"] || []) {
      console.log(
        "**** field " + field["name"] + field["type"]
      );
    }
  } catch (error) {
    console.error("Error while retrieving collection:", error);
  }
};

const associerDecisions = async (
  datasetId: string,
  decisionIds: string[]
) => {
  console.log("Decisions associées avec succès 0");
  const token = sessionStorage.getItem("token");
  try {
    await axios.post(
      `${
        import.meta.env.VITE_BACKEND_APP_API_URL
      }decisions/associer/`,
      {
        dataset_id: datasetId,
        raw_decisions: decisionIds,
      },
      {
        headers: {
          Authorization: `${token}`,
        },
      }
    );
    console.log("Decisions associées avec succès 1");
  } catch (error) {
    console.error("Error while associating decisions:", error);
  }
  console.log("Decisions associées avec succès");
};
export {
  fetchCategories,
  fetchVilles,
  search,
  groupedSearch,
  logCollection,
  associerDecisions,
};
