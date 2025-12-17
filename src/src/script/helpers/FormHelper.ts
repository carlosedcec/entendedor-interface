import FetchHelper from "./FetchHelper.js";

export default class FormHelper {

    form: HTMLFormElement | null;
    formObj: Record<string, any>;
    formInvalid: boolean | string;
    constructor(form: HTMLElement | null) {

        this.form = (form && form instanceof HTMLFormElement) ? form : null;

        this.formObj = {};
        this.formInvalid = false;

    };

    addData(event: Event, formItens: Record<string, any>[], url: string, successCallback: Function = function() {}) {
        this.addOrUpdateData(event, formItens, url, successCallback, "post", "inserir dados");            
    };

    updateData(event: Event, formItens: Record<string, any>[], url: string, successCallback: Function = function() {}) {
        this.addOrUpdateData(event, formItens, url, successCallback, "put", "editar dados");            
    };

    addOrUpdateData(event: Event, formItens: Record<string, any>[], url: string, successCallback: Function = function() {}, method: string, errorMessage: string) {

        event.preventDefault();
    
        this.processForm(formItens);
    
        if (!this.isValid()) {
            alert(this.getValidationError());
            return;
        }
    
        const requestObject = {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.getFormObject())
        }

        FetchHelper.post(url, requestObject, (data: any, message: string) => {
            this.form?.reset();
            successCallback();
            alert(message);
        }, errorMessage);
    
    };

    public static deleteData(url: string, successCallback: Function = function() {}) {
        FetchHelper.post(url, { method: "delete" }, (data: any, message: string) => {
            successCallback();
            alert(message);
        }, "excluir dados");
    };

    processForm(formItens: Record<string, any>[]) {

        this.formObj = {};
        this.formInvalid = false;

        for (const formItem of formItens) {

            const formItemElement = document.getElementById(formItem.id) as HTMLInputElement | HTMLSelectElement | null;

            if (formItem.type !== "self" && !formItemElement) {
                this.formInvalid = `O campo "${formItem.label}" não foi encontrado`;
                break;
            }

            if (formItem.type !== "self" && formItemElement) {
                formItemElement.classList.remove("invalid");
            }

            if (
                formItem.required && formItemElement
                && (formItem.type !== "self" && !formItemElement.value)
                || (formItem.type === "self" && !formItem.value)
            ) {
                this.formInvalid = `O campo "${formItem.label}" é obrigatório`;
                if (formItem.type !== "self" && formItemElement) {
                    formItemElement.classList.add("invalid");
                }
                break;
            }

            const value = this.processFormItem(formItem);
            
            if (this.formInvalid) {
                break;
            }

            this.formObj[formItem.key] = value;
        };

    };

    processFormItem(formItem: Record<string, any>) {
        let value;
        if (formItem.type === "string") {
            value = this.validateString(formItem);
        } else if (formItem.type === "cep") {
            value = this.validateString(formItem);
            value = this.validateCEP(formItem);
        } else if (formItem.type === "date") {
            value = this.validateDate(formItem);
        } else if (formItem.type === "time") {
            value = this.validateTime(formItem);
        } else if (formItem.type === "float") {
            value = this.validateFloat(formItem);
        } else if (formItem.type === "self") {
            value = formItem.value;
        } else {
            const element = document.getElementById(formItem.id) as HTMLInputElement | HTMLSelectElement | null;
            value = element?.value;
        }
        return value;
    }

    validateString(formItem: Record<string, any>) {

        const formItemElement = document.getElementById(formItem.id) as HTMLInputElement | HTMLSelectElement | null;

        if (!formItemElement)
            return

        const value = formItemElement.value;

        if (typeof value !== "string") {
            this.formInvalid = `O campo "${formItem.label}" está num formato inválido`;
            formItemElement.classList.add("invalid");
            return null;
        }

        return value;

    }

    validateCEP(formItem: Record<string, any>) {

        const formItemElement = document.getElementById(formItem.id) as HTMLInputElement | HTMLSelectElement | null;

        if (!formItemElement)
            return

        const value = formItemElement.value;
        const cepRegex = /^[0-9]{5}-[0-9]{3}$/;

        if (!cepRegex.test(value)) {
            this.formInvalid = `O campo "${formItem.label}" está num formato inválido`;
            formItemElement.classList.add("invalid");
            return null;
        }

        return value;

    }

    validateDate(formItem: Record<string, any>) {

        const formItemElement = document.getElementById(formItem.id) as HTMLInputElement | HTMLSelectElement | null;

        if (!formItemElement)
            return

        let value = formItemElement.value;

        const dateReg = new RegExp(/^\d{2}[/]\d{2}[/]\d{4}$/);
        if (!dateReg.test(value)) {
            this.formInvalid = `O campo "${formItem.label}" está num formato inválido`;
            formItemElement.classList.add("invalid");
            return null;
        }

        value = value.split("/")[2] + "-" + value.split("/")[1] + "-" + value.split("/")[0];

        const dateTest = new Date(value + "T00:00-03:00");
        if (Object.prototype.toString.call(dateTest) !== "[object Date]" || isNaN(Number(dateTest))) {
            this.formInvalid = `O campo "${formItem.label}" está inválido`;
            formItemElement.classList.add("invalid");
            return null;
        }

        return value;

    };

    validateTime(formItem: Record<string, any>) {

        const formItemElement = document.getElementById(formItem.id) as HTMLInputElement | HTMLSelectElement | null;

        if (!formItemElement)
            return
        
        const value = formItemElement.value;

        const timeReg = new RegExp(/^\d{2}[:]\d{2}$/);
        if (!timeReg.test(value)) {
            this.formInvalid = `O campo "${formItem.label}" está num formato inválido`;
            formItemElement.classList.add("invalid");
            return null;
        }

        const timeTest = new Date("2000-01-01T" + value + "-03:00");
        if (Object.prototype.toString.call(timeTest) !== "[object Date]" || isNaN(Number(timeTest))) {
            this.formInvalid = `O campo "${formItem.label}" está inválido`;
            formItemElement.classList.add("invalid");
            return null;
        }

        return value;

    };

    validateFloat(formItem: Record<string, any>) {

        const formItemElement = document.getElementById(formItem.id) as HTMLInputElement | HTMLSelectElement | null;

        if (!formItemElement)
            return

        const value = parseFloat(formItemElement.value);

        if (isNaN(value)) {
            this.formInvalid = `O campo "${formItem.label}" está inválido`;
            formItemElement.classList.add("invalid");
            return null;
        }

        if (formItem.min !== undefined && !isNaN(formItem.min) && value < formItem.min) {
            this.formInvalid = `O campo "${formItem.label}" está inválido`;
            formItemElement.classList.add("invalid");
            return null;
        }

        if (formItem.max !== undefined && !isNaN(formItem.max) && value > formItem.max) {
            this.formInvalid = `O campo "${formItem.label}" está inválido`;
            formItemElement.classList.add("invalid");
            return null;
        }

        return value;

    };

    getFormObject() {
        return this.formObj;
    };

    getValidationError() {
        return this.formInvalid;
    };

    isValid() {
        return !this.formInvalid;
    };

};