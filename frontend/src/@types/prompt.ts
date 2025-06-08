type Prompt = {
  id?: string;
  prompt: string;
  category: string;
  jsonTemplate?: JSONObject;
  createdAt?: Date;
  updatedAt?: Date;
  creator?: string;
  deleted?: boolean;
  serialNumber?: number;
};

type fetchedPrompt = {
  id?: string;
  prompt: string;
  category: string; // UUID string of the category
  json_template?: JSONObject | null; // JSON field can be any valid JSON
  created_at?: Date; // ISO date string from Django
  updated_at?: Date; // ISO date string from Django
  creator?: string; // UUID string of the creator
  deleted?: boolean;
  serial_number?: number;
};

interface CreatePromptResponse {
  status: number;
  data: {
    id: string;
    serial_number: number;
    prompt: string;
    category: string; // UUID string of the category
    json_template?: JSONObject | null; // JSON field can be any valid JSON
    created_at: string; // ISO date string from Django
    updated_at: string; // ISO date string from Django
    creator: string; // UUID string of the creator
    deleted: boolean;
  };
}

type JSONValue =
  | string
  | number
  | boolean
  | JSONTuple
  | JSONObject;

interface JSONTuple {
  [x: string]: JSONValue;
}

interface JSONObject extends Array<JSONValue> {}

export type {
  Prompt,
  fetchedPrompt,
  JSONValue,
  JSONTuple,
  JSONObject,
  CreatePromptResponse,
};
