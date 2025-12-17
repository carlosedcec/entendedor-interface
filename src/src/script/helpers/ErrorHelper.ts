export default class ErrorHelper {

    public static handleResponseError(response: Response, message?: string) {
        console.error('Error response:', response);
        if (message)
            alert(message);
    };
    
}