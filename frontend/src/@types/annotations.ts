type BinaryAnnotation = {
    id?: string,
    model_annotator?: string,
    creator: string,
    decisionId: string,
    label: string,
    updator ?: string,
    updated_at ?: Date,
}

type TextAnnotation = {
    id: string;
    text: string;
    start_offset: number;
    end_offset: number;
    label: {
        id: string;
        label: string;
        color: string;
    };
    decision: string;
}

export type { BinaryAnnotation, TextAnnotation };