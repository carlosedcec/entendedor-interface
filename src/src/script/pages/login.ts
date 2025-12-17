import AuthHelper from "../helpers/AuthHelper.js";
import FormHelper from "../helpers/FormHelper.js";

function login(this: HTMLFormElement, event: Event) {

    event.preventDefault();

    const formItens = [
        { id: "username", key: "username", label: "Usuário", type: "string", required: true },
        { id: "password", key: "password", label: "Senha", type: "string", required: true }
    ];

    const loginForm = new FormHelper(this);
    
    loginForm.processForm(formItens);

    if (!loginForm.isValid()) {
        alert(loginForm.getValidationError());
        return;
    }

    AuthHelper.login(loginForm.getFormObject());

}

document.getElementById("loginForm")?.addEventListener("submit", login);