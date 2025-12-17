export interface SymptomAPI {
    id: number;
    name: string;
    order: number;
}

export interface RecordAPI {
    id: number;
    date: string;
    time: string;
    symptom_id: number
    symptom_name: string;
    average_value: number
    total_value: number;
}

export interface RecordBySymptomAPI {
    id: number;
    date: string;
    time: string;
    symptom_id: number;
    symptom_name: string;
    value: number;
}

export interface EventAPI {
    id: number;
    description: string;
    date: string;
    time: string;
}

export interface UserAPI {
    username: string;
    email: string;
    cep: string;
    city: string;
    state: string;
}