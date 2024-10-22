type Prompt = {
    id?: string,
    prompt: string,
    category: string,
    jsonTemplate?: JSONObject,
    createdAt? : Date,
    updatedAt? : Date,
    creator? : string,
    deleted? : boolean,
    serialNumber? : number,
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

interface JSONObject extends Array<JSONValue> { }

export type { Prompt, JSONValue, JSONTuple, JSONObject };