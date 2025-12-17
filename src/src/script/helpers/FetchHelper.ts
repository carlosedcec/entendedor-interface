import ErrorHelper from "./ErrorHelper.js";

export default class FetchHelper {

    public static async get(url: string, successCallback: Function) {
        this.fetchData(url, undefined, successCallback, "buscar dados");
    }

    public static async post(url: string, requestObject: RequestInit, successCallback: Function, errorMessage: string) {
        this.fetchData(url, requestObject, successCallback, errorMessage);
    }

    public static async fetchData(url: string, requestObject: RequestInit = {}, successCallback?: Function, errorMessage?: string) {

        requestObject.credentials = "include";

        const response = await fetch(url, requestObject);
    
        let json;

        try {
            json = await response.json();
        } catch(e) {
            console.error(e);
            const message = errorMessage ? errorMessage : "manipular dados";
            alert("Erro ao tentar " + message);
        }

        if (response.status === 200) {
            if (successCallback) {
                const responseData = json.data ? json.data : json;
                const responseMessage = json.message ? json.message : "Sucesso!";
                successCallback(responseData, responseMessage);
            }
        } else if (response.status === 401) {
            window.location.href = "/login";
        } else {
            const message = json.error ? json.error : errorMessage ? "Erro ao tentar " + errorMessage : null;
            ErrorHelper.handleResponseError(response, message);
        }

    }

}