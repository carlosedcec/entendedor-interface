import globalConfigs from "../config/configs.js";
import FetchHelper from "./FetchHelper.js";

export default class AuthHelper {

    public static async login(bodyObject: Record<string, any>) {

        try {

            const requestObject: Record<string, any> = {
                method: "post",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bodyObject)
            }

            requestObject.credentials = "include";

            const response = await fetch(globalConfigs.server + "/login", requestObject);
            const json = await response.json();

            if (response.status === 200) {
                window.location.href = "/";
            } else if (response.status === 401) {
                alert("Credenciais de login inválidas");
            } else {
                console.warn(response);
            }
    
        } catch(e) {
            console.error(e);
        }    

    }

    public static async checkAuth() {

        try {

            const response = await fetch(globalConfigs.server + "/auth/status", { "credentials": "include" });
            const json = await response.json();

            if (response.status === 200) {
                document.body.classList.add("sw");
            } else if (response.status === 401) {
                window.location.href = "/login";
            } else {
                console.warn(response);
            }
    
        } catch(e) {
            console.error(e);
        }
    }

    public static addLogoutEvent() {

        document.getElementById("logoutBtn")?.addEventListener("click", () => {
            FetchHelper.post(globalConfigs.server + "/logout", { method: "post" }, (data: any) => {
                window.location.href = "/login";
            }, "deslogar");
        });

    }

}