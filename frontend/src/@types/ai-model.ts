type AiModel = {
  id?: string;
  name: string;
  description?: string;

  createdAt?: Date;
  updatedAt?: Date;
  category: string;
  modelType?: string;
  type?: string;
  modelPath?: string;
  creator?: string;
  deleted?: boolean;
  serialNumber?: string;
};

export type fetchedAiModel = {
  id?: string;
  name: string;
  description?: string;

  created_at?: Date;
  updated_at?: Date;
  category: string;
  model_type?: string;
  type?: string;
  model_path?: string;
  creator?: string;
  deleted?: boolean;
  serial_number?: string;
};

export interface AiModelType {
  id: string;
  type: string;
  created_at: string;
}

export interface TrainingConfig {
  modelId: string;
  datasets: string[];
  // modelType: string;
  splitMethod: "ratio" | "kfold";
  ratios?: { train: number; valid: number; test: number };
  k?: number;
}

export interface Training {
  id: string;
  type?: string;
  training_status: string;
  training_result: object;
  updated_at: string;
  modelId?: string;
}
export default AiModel;
