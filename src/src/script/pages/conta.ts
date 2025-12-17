import globalConfigs from "../config/configs.js";
import AuthHelper from "../helpers/AuthHelper.js";
import CEPHelper from "../helpers/CepHelper.js";
import FetchHelper from "../helpers/FetchHelper.js";
import FormHelper from "../helpers/FormHelper.js";
import type { UserAPI } from "../types/types.js";

AuthHelper.checkAuth();
AuthHelper.addLogoutEvent();

CEPHelper.configCEPInput("#cep");
CEPHelper.configStateInput("#state");
document.getElementById("cep")?.addEventListener("change", CEPHelper.getCEPInfos);

function loadUser() {

    FetchHelper.get(globalConfigs.server + "/get-user", function (user: UserAPI) {
        
        const userForm = document.getElementById("userForm");

        if (userForm && userForm instanceof HTMLFormElement) {
            userForm.username.value = user.username;
            userForm.email.value = user.email;
            userForm.cep.value = user.cep;
            userForm.city.value = user.city;
            userForm.state.value = user.state;
        }

    });

}

loadUser();

function updateUser(this: HTMLFormElement, event: Event) {

    const password = document.getElementById("password");
    const passwordConfirm = document.getElementById("passwordConfirm");

    if (password && password instanceof HTMLInputElement && passwordConfirm && passwordConfirm instanceof HTMLInputElement) {
        password.classList.remove("invalid");
        passwordConfirm.classList.remove("invalid");
        if (password.value && (password.value !== passwordConfirm.value)) {
            event.preventDefault();
            password.classList.add("invalid");
            passwordConfirm.classList.add("invalid");
            alert("As senhas precisam ser iguais");
            return;
        }
    }

    const formItens = [
        { id: "username", key: "username", label: "Usuário", type: "string", required: true },
        { id: "email", key: "email", label: "E-mail", type: "string", required: true },
        { id: "cep", key: "cep", label: "CEP", type: "cep", required: true },
        { id: "city", key: "city", label: "Cidade", type: "string", required: true },
        { id: "state", key: "state", label: "Estado", type: "string", required: true },
        { id: "password", key: "password", label: "Senha", type: "string" }
    ];

    const userForm = new FormHelper(this);

    userForm.updateData(event, formItens, globalConfigs.server + "/update-user", function () {
        loadUser();
    });

}

document.getElementById("userForm")?.addEventListener("submit", updateUser);
