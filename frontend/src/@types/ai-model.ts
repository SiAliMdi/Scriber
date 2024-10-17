

type AiModel = {
    id?: string;
    name: string;
    description?: string;

    createdAt?: Date;
    updatedAt?: Date;
    category: string;
    modelType?: string;
    modelPath?: string;
    creator?: string;
    deleted?: boolean;
    serialNumber?: string;
}

export default AiModel;
