import { MaskedTextChangedListener } from 'ts-input-mask';
import datepicker from 'js-datepicker';

export default class InputHelper {

    public static today = new Date();

    public static datePickerMask = "[00]/[00]/[0000]";

    public static datePickerConfigs = {
        formatter: function (input: HTMLInputElement, date: Date) {
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            input.value = `${day}/${month}/${year}`;
        },
        customDays: ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"] as [string, string, string, string, string, string, string],
        customMonths: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"] as [string, string, string, string, string, string, string, string, string, string, string, string],
        overlayPlaceholder: "Ano de 4 dígitos",
        overlayButton: "Selecionar",
    };

    public static createAndConfigureDatePicker(selector: string) {
        const datePickerElement = document.querySelector(selector);
        if (datePickerElement && datePickerElement instanceof HTMLInputElement) {
            datepicker(datePickerElement, InputHelper.datePickerConfigs);
            MaskedTextChangedListener.installOn(InputHelper.datePickerMask, datePickerElement);
        }
    }

    public static resetDatePickers(selector: string) {
        const datePickerElement = document.querySelector(selector);
        if (datePickerElement && datePickerElement instanceof HTMLInputElement) {
            datePickerElement.value = InputHelper.today.toLocaleDateString("pt-BR");
        }
    }

    public static timePickerMask = "[00]:[00]";

    public static createAndConfigureTimePicker(selector: string) {
        const timePickerElement = document.querySelector(selector);
        if (timePickerElement && timePickerElement instanceof HTMLInputElement)
            MaskedTextChangedListener.installOn(InputHelper.timePickerMask, timePickerElement);
    }

    public static resetTimePicker(selector: string) {
        const timePickerElement = document.querySelector(selector);
        const nowHour = InputHelper.today.getHours() + ':' + (InputHelper.today.getMinutes().toString().padStart(2, '0'));
        if (timePickerElement && timePickerElement instanceof HTMLInputElement)
            timePickerElement.value = nowHour;
    }

}