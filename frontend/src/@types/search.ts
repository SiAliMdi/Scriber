type Keyword = {
  id: number;
  value: string;
  matchExact: boolean;
  exclude: boolean;
};

type SearchParameters = {
  q: string;
  query_by: string | string[];
  filter_by: string;
  sort_by: string;
  page: number;
  per_page: number;
  num_typos: number;
  group_by?: string;
  group_limit?: number;
  prioritize_exact_match?: boolean;
  pre_segmented_query?: boolean;
};

type Decision = {
  id: string;
  j_texte: string;
  j_chambre: string;
  j_date: number;
  j_rg: string;
  j_ville: string;
  j_type: string;
  j_juridiction?: string;
  highlight?: string;
};

type SearchResult = {
  hits: Decision[];
  found: number;
  total: number;
  page: number;
  search_time_ms: number;
};

export type {
  SearchParameters,
  Keyword,
  Decision,
  SearchResult,
};
