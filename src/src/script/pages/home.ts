import globalConfigs from "../config/configs.js";
import AuthHelper from "../helpers/AuthHelper.js";
import StringHelper from "../helpers/StringHelper.js";
import FormHelper from "../helpers/FormHelper.js";
import FetchHelper from "../helpers/FetchHelper.js";
import InputHelper from "../helpers/InputHelper.js";
import { RecordsDataTable, NormalDataTable } from "../classes/Datatable.js";
import type { SymptomAPI, RecordAPI, EventAPI } from "../types/types.js";

AuthHelper.checkAuth();
AuthHelper.addLogoutEvent();

/**
 * Root global variable
 */

const $root: {
    symptoms: string[];
    recordsDataTable: RecordsDataTable | null;
    eventsDataTable: NormalDataTable | null;
} = {
    symptoms: [],
    recordsDataTable: null,
    eventsDataTable: null,
};

/**
 * Date and Time Picker
 */

const datePickers = ["#recordDate", "#batchRecordDate", "#eventDate"];
datePickers.forEach((input) => InputHelper.createAndConfigureDatePicker(input));

// Reseta o valor dos date pickers para hoje
function resetDatePickers() {
    datePickers.forEach((input) => InputHelper.resetDatePickers(input));
};

const timePickers = ["#recordTime", "#batchRecordTime", "#eventTime"];
timePickers.forEach((input) => InputHelper.createAndConfigureTimePicker(input));

function resetTimePickers() {
    timePickers.forEach((input) => InputHelper.resetTimePicker(input));
};

function resetPickers() {
    resetDatePickers();
    resetTimePickers();
};

/** 
 * Carrega os sintomas, povoa o select de sintomas e povoa o formulário de inserção em lote
 */

const loadSymptoms = function () {

    FetchHelper.get(globalConfigs.server + "/get-symptoms", function (symptoms: SymptomAPI[]) {

        // Grava os sintomas na variável global
        $root.symptoms = symptoms.map((item) => item.name);

        // Seleciona e limpa o select "Sintoma"
        const select = document.getElementById("symptomId");
        select?.querySelectorAll("option:not(:first-child)").forEach((option) => option.remove());

        // Seleciona e limpa formulário de inserção em lote
        const batchRecordsForm = document.getElementById("batchRecordsForm");
        const formGroups = batchRecordsForm?.querySelectorAll(".symptom-form-group");
        if (formGroups && formGroups.length > 0) formGroups.forEach((item) => item.remove());

        symptoms.forEach((symptom) => {
            // Povoa o select "Sintoma"
            const option = document.createElement("option");
            option.value = String(symptom.id);
            option.textContent = StringHelper.capitalizeFirstLetter(symptom.name);
            select?.appendChild(option);

            // Povoa o formulário de inserção em lote
            const formGroup = document.createElement("div");
            formGroup.className = "form-section-form-group symptom-form-group";

            const label = document.createElement("label");
            label.setAttribute("for", "recordValue" + StringHelper.capitalizeFirstLetter(symptom.name));
            label.innerHTML = "Valor de " + symptom.name + ":";
            formGroup.appendChild(label);

            const inputValue = document.createElement("input");
            inputValue.setAttribute("type", "number");
            inputValue.setAttribute("name", "recordValue" + StringHelper.capitalizeFirstLetter(symptom.name));
            inputValue.setAttribute("id", "recordValue" + StringHelper.capitalizeFirstLetter(symptom.name));
            inputValue.setAttribute("data-id", String(symptom.id));
            inputValue.setAttribute("placeholder", "0-10");
            inputValue.setAttribute("step", "0.1");
            inputValue.setAttribute("min", "0");
            inputValue.setAttribute("max", "10");
            formGroup.appendChild(inputValue);

            batchRecordsForm?.insertBefore(formGroup, batchRecordsForm.querySelector(".submit-btn"));

        });

    });

};

/**
 *  Configurações das abas de inserção de registros ("Simples" e "Lote")
 */

const addRecordsButtons = document.getElementsByClassName("records-form-section-nav")[0].querySelectorAll("button");
addRecordsButtons.forEach(function (button) {

    button.addEventListener("click", function () {

        // Remove classe active dos botões
        addRecordsButtons.forEach((item) => item.classList.remove("active"));
        // Adiciona classe active no botão clicado
        button.classList.add("active");

        // Remove classe active dos formulários
        document
            .getElementById("recordsFormSection")
            ?.querySelectorAll("form")
            .forEach((item) => item.classList.remove("active"));

        // Adiciona classe active no formulário selecionado
        const formId = this.getAttribute("data-form");
        if (formId) {
            const form = document.getElementById(formId);
            form?.classList.add("active");
        }

    });

});

/**
 * Modal
 */

document.querySelectorAll("[data-open-modal]").forEach(function (button) {
    button.addEventListener("click", function (this: Element) {
        const modalId = this.getAttribute("data-open-modal");
        if (modalId) {
            const modal = document.querySelector<HTMLDialogElement>("#" + modalId);
            modal?.showModal();
        }
    });
});

document.querySelectorAll("[data-close-modal]").forEach(function (button) {
    button.addEventListener("click", function (this: Element) {
        this.closest("dialog")?.close();
    });
});

/**
 * Add Data
 */

document.querySelector<HTMLFormElement>("#symptomForm")?.addEventListener("submit", function (event) {

    const formItens = [
        { id: "symptomName", key: "name", label: "Sintoma", type: "string", required: true },
    ];

    const categoryForm = new FormHelper(this);

    categoryForm.addData(event, formItens, globalConfigs.server + "/add-symptom", function () {
        document.querySelector("dialog")?.close();
        loadSymptoms();
    });

});

document.querySelector<HTMLFormElement>("#recordForm")?.addEventListener("submit", function (event) {

    const formItens = [
        { id: "symptomId", key: "symptom_id", label: "Sintoma", type: "integer", required: true },
        { id: "recordDate", key: "date", label: "Data", type: "date", required: true },
        { id: "recordTime", key: "time", label: "Hora", type: "time", required: true },
        { id: "recordValue", key: "value", label: "Valor", type: "float", required: true, min: 0, max: 10 }
    ];

    const recordForm = new FormHelper(this);

    recordForm.addData(event, formItens, globalConfigs.server + "/add-record", function () {
        document.getElementById("symptomId")?.dispatchEvent(new Event("change"));
        resetPickers();
        loadRecordsData();
    });

});

document.querySelector<HTMLFormElement>("#batchRecordsForm")?.addEventListener("submit", function (event) {

    const batchRecordsValues = [];
    let batchRecordsInvalid: boolean | string = false;

    // Percorre os sintomas existentes e cada um dos inputs correspondentes, verificando se há algum valor inválido ou, senão, adicionando o valor correpondente no array
    for (const symptom of $root.symptoms) {
        const recordValueElement = document.getElementById("recordValue" + StringHelper.capitalizeFirstLetter(symptom)) as HTMLInputElement | null;

        let recordValue;

        if (recordValueElement) recordValue = parseFloat(recordValueElement.value);

        if (!recordValue) continue;

        if (isNaN(recordValue)) {
            batchRecordsInvalid = "Valor de registro inválido";
            break;
        }

        if (recordValue < 0 || recordValue > 10) {
            batchRecordsInvalid = "O valor do registro deve estar entre 0 e 10";
            break;
        }

        batchRecordsValues.push({
            symptom_id: recordValueElement?.getAttribute("data-id"),
            value: recordValue,
        });
    }

    // Se inválido, retorna um erro
    if (batchRecordsInvalid) {
        event.preventDefault();
        return alert(batchRecordsInvalid);
    } else if (batchRecordsValues.length === 0) {
        event.preventDefault();
        return alert("Insira pela menos um valor para fazer a inserção em lote");
    }

    // Senão, configura os formItens e chama a função genérica
    const formItens = [
        { id: "batchRecordDate", key: "date", label: "Data", type: "date", required: true },
        { id: "batchRecordTime", key: "time", label: "Hora", type: "time", required: true },
        { id: "batchRecords", key: "batch_records", label: "Valores", type: "self", value: batchRecordsValues, required: true },
    ];

    const batchRecordsForm = new FormHelper(this);

    batchRecordsForm.addData(event, formItens, globalConfigs.server + "/add-batch-records", function () {
        document.getElementById("symptomId")?.dispatchEvent(new Event("change"));
        resetPickers();
        loadRecordsData();
    });

});

document.querySelector<HTMLFormElement>("#eventForm")?.addEventListener("submit", function (event) {

    const formItens = [
        { id: "eventDescription", key: "description", label: "Descrição", type: "string", required: true },
        { id: "eventDate", key: "date", label: "Data", type: "date", required: true },
        { id: "eventTime", key: "time", label: "Hora", type: "time", required: true },
    ];

    const eventForm = new FormHelper(this);

    eventForm.addData(event, formItens, globalConfigs.server + "/add-event", function () {
        resetPickers();
        loadEventsData();
    });

});

/**
 * Data Tables
 */

const loadRecordsData = function () {

    FetchHelper.get(globalConfigs.server + "/get-records", function (records: RecordAPI[]) {

        const recordsData: Record<string, any>[] = [];
        const recordsColumns = [{ id: "symptom", label: "Data/Registro" }];

        if (!records || records.length === 0) {
            $root.recordsDataTable?.loadData(recordsData, recordsColumns, 1);
            return;
        }

        // Prepara dados para formato do dataTable
        $root.symptoms.forEach((symptom, index) => {
            // Adiciona o sintoma
            recordsData.push({ symptom: StringHelper.capitalizeFirstLetter(symptom) });
            // Adiciona o valor de cada data para o sintoma em questão
            records
                .filter((item) => {
                    return item.symptom_name === symptom;
                })
                .forEach((item) => {
                    recordsData[index][item.date] = item.average_value;
                });
        });

        // Cria um array com as datas distintas
        const distinctDates = new Set(records.map((item) => item.date));

        // Adiciona um tipo "total" nos dados da tabela
        recordsData.push({ symptom: "Total" });

        distinctDates.forEach((date) => {
            // Adiciona as datas distintas como colunas
            recordsColumns.push({
                id: date,
                label: String(date).split("-")[2] + "/" + String(date).split("-")[1],
            });
            // Soma os totais com base na data
            const dateTotal = records
                .filter((item) => {
                    return item.date === date;
                })
                .reduce(function (n, item) {
                    return n + item.average_value;
                }, 0);
            // Adiciona o total de cada data na tabela
            recordsData[recordsData.length - 1][date] = dateTotal;
        });

        // Configura a última página do datatable como a página atual com base na quantidade de datas
        const page = Math.ceil(Array.from(distinctDates).length / $root.recordsDataTable?.options.columnsPerPage);

        // Carrega os dados na DataTable
        $root.recordsDataTable?.loadData(recordsData, recordsColumns, page);

    });

};

const loadEventsData = function () {

    FetchHelper.get(globalConfigs.server + "/get-events", function (events: EventAPI[]) {

        const eventsData: Record<string, any>[] = [];
        const eventsColumns = [
            { id: "date", label: "Data" },
            { id: "event", label: "Evento" },
        ];

        events.forEach((item) => {
            eventsData.push({
                date: new Date(item.date + "T" + item.time + "-03:00").toLocaleDateString("pt-BR"),
                event: item.description + " [" + item.time + "h]",
            });
        });

        $root.eventsDataTable?.loadData(eventsData, eventsColumns);

    });

};

/**
 * On DOMContentLoaded
 */

document.addEventListener("DOMContentLoaded", function () {

    // Reseta os pickers e carrega os dados dos selects
    resetPickers();
    loadSymptoms();

    // Cria um timeout para ter certeza que os sintomas foram carregados antes de chamar os outros dados
    const timeout = ($root.symptoms && $root.symptoms.length) > 0 ? 0 : 200;

    setTimeout(function () {

        // Cria uma instância do data table para os registros
        $root.recordsDataTable = new RecordsDataTable("#recordsDataTable", {
            fixedColumns: 1,
            columnsPerPage: 7,
            searchable: true,
        });

        // Busca os dados dos registros no banco
        loadRecordsData();

        // Cria uma instância do data table para os eventos
        $root.eventsDataTable = new NormalDataTable("#eventsDataTable", {
            pageSize: 10,
            searchable: true,
        });

        // Busca os dados dos eventos no banco
        loadEventsData();

    }, timeout);

});
