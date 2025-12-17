import { MaskedTextChangedListener } from 'ts-input-mask';

export default class CEPHelper {

    public static configCEPInput(selector: string) {
        const cepElement = document.querySelector(selector);
        if (cepElement && cepElement instanceof HTMLInputElement)
            MaskedTextChangedListener.installOn("[00000]-[000]", cepElement);
    }

    public static configStateInput(selector: string) {
        const stateElement = document.querySelector(selector);
        if (stateElement && stateElement instanceof HTMLInputElement)
            MaskedTextChangedListener.installOn("[AA]", stateElement);
    }

    public static async getCEPInfos(this: HTMLInputElement, event: Event) {

        function fillInput(selector: string, value: string) {
            const inputElement = document.querySelector(selector);
            if (inputElement && inputElement instanceof HTMLInputElement)
                inputElement.value = value;
        }

        try {

            fillInput("#city", "");
            fillInput("#state", "");

            const cep = this.value.replace(/\D/g, '');
            const cepRegex = /^[0-9]{8}$/;

            if (!cep || !cepRegex.test(cep))
                return;

            const url = `https://viacep.com.br/ws/${cep}/json/`;

            const response = await fetch(url);

            if (response.status === 200) {

                const json = await response.json();

                if (!json.error && json.localidade && json.uf) {
                    fillInput("#city", json.localidade);
                    fillInput("#state", json.uf);
                } else {
                    fillInput("#city", "");
                    fillInput("#state", "");
                }

            }

        } catch(e) {
            console.error(e);
        }

    }

}