

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
}

export interface AiModelType {
    id: string;
    type: string;
    created_at: string;
  }


export interface TrainingConfig {
    modelId: string;
    datasets: string[];
    modelType: string;
    splitMethod: 'ratio' | 'kfold';
    ratios?: { train: number; valid: number; test: number };
    k?: number;
  }

export default AiModel;
