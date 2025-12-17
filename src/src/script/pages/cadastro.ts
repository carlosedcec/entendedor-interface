import globalConfigs from "../config/configs.js";
import AuthHelper from "../helpers/AuthHelper.js";
import FormHelper from "../helpers/FormHelper.js";
import CEPHelper from "../helpers/CepHelper.js";

CEPHelper.configCEPInput("#cep");
CEPHelper.configStateInput("#state");
document.getElementById("cep")?.addEventListener("change", CEPHelper.getCEPInfos);

function cadastro(this: HTMLFormElement, event: Event) {

    const password = document.getElementById("password");
    const passwordConfirm = document.getElementById("passwordConfirm");

    if (password && password instanceof HTMLInputElement && passwordConfirm && passwordConfirm instanceof HTMLInputElement) {
        password.classList.remove("invalid");
        passwordConfirm.classList.remove("invalid");
        if (password.value !== passwordConfirm.value) {
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
        { id: "password", key: "password", label: "Senha", type: "string", required: true }
    ];

    const cadastroForm = new FormHelper(this);
    
    cadastroForm.addData(event, formItens, globalConfigs.server + "/add-user", () => {
        const formObj = cadastroForm.getFormObject();
        AuthHelper.login({ username: formObj.username, password: formObj.password });
    });

}

document.getElementById("cadastroForm")?.addEventListener("submit", cadastro);