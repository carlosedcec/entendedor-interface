import globalConfigs from "../config/configs.js";
import AuthHelper from "../helpers/AuthHelper.js";
import StringHelper from "../helpers/StringHelper.js";
import FetchHelper from "../helpers/FetchHelper.js";
import InputHelper from "../helpers/InputHelper.js";
import FormHelper from "../helpers/FormHelper.js";
import { RecordsDataTable, NormalDataTable } from "../classes/Datatable.js";
import type { SymptomAPI, RecordAPI, EventAPI, RecordBySymptomAPI } from "../types/types.js";
import Sortable from 'sortablejs';
import tippy from 'tippy.js';

AuthHelper.checkAuth();
AuthHelper.addLogoutEvent();

/**
 * Root global variable
 */

const $root: {
    symptoms: SymptomAPI[];
    activeRecordTab: { id: string; name: string };
    symptomsDataTable: NormalDataTable | null;
    recordsDataTableBySymptom: NormalDataTable | null;
    eventsDataTable: NormalDataTable | null;
} = {
    activeRecordTab: { id: "0", name: "" },
    symptoms: [],
    symptomsDataTable: null,
    recordsDataTableBySymptom: null,
    eventsDataTable: null
};

/**
 * Date and Time Picker
 */

const datePickers = ["#recordDate", "#eventDate"];
datePickers.forEach((input) => InputHelper.createAndConfigureDatePicker(input));

const timePickers = ["#recordTime", "#eventTime"];
timePickers.forEach((input) => InputHelper.createAndConfigureTimePicker(input));


function configTooltips() {
    tippy('.edit-button', { content: 'Editar dados' });
    tippy('.delete-button', { content: 'Deletar dados' });
    tippy('.delete-date-button', { content: 'Deletar dia inteiro' });
};

/**
 * Record Tabs
 */

// Faz um get dos sintomas do banco e configura as abas de seleção dos sintomas
const loadAndConfigRecordsTabs = function() {
    
    FetchHelper.get(globalConfigs.server + '/get-symptoms', function (symptoms: SymptomAPI[]) {

        // Grava os sintomas na variável global
        $root.symptoms = symptoms;

        // Pega a ul "recordsTabs"
        const recordsTabs = document.getElementById("recordsTabs");
        if (recordsTabs)
            recordsTabs.innerHTML = "";

        // Povoa as tabs com os sintomass
        symptoms.forEach(function(item) {
            const li = document.createElement("li");
            li.innerHTML = StringHelper.capitalizeFirstLetter(item.name);
            li.setAttribute("data-tab-id", String(item.id));
            li.setAttribute("data-tab-name", item.name);
            recordsTabs?.appendChild(li);
        });

        // Configura o evento click para as tabs criadas e clica na primeira tab
        configTabsClicks();
        if (recordsTabs && recordsTabs.children[0])
            (recordsTabs.children[0] as HTMLLIElement).click();

    });

};

// Configura o evento click para as tabs
function configTabsClicks() {
    const tabs = document.querySelectorAll<HTMLLIElement>(".records-section .tabs-nav li");
    tabs.forEach(function(item) {
        item.addEventListener("click", function() {
            tabs.forEach(item => item.classList.remove("active"));
            this.classList.add("active");
            const tabId = item.getAttribute("data-tab-id");
            const tabName = item.getAttribute("data-tab-name");
            if (tabId && tabName) {
                $root.activeRecordTab = {
                    id: tabId,
                    name: tabName
                };
                loadRecordsDataTableBySymptom($root.activeRecordTab);
            }
        });
    });
};

/**
 * DataTables
 */

function loadSymptomsDataTable() {
    
    FetchHelper.get(globalConfigs.server + '/get-symptoms', function (symptoms: SymptomAPI[]) {

        const symptomData: Record<string, any>[] = [];
        const symptomColumns = [{ id: "name", label: "Sintoma" }];

        symptoms.forEach((item) => {
            symptomData.push({
                id: item.id,
                name: StringHelper.capitalizeFirstLetter(item.name),
                order: item.order
            });
        });

        $root.symptomsDataTable?.loadData(symptomData, symptomColumns);

    });

};

function loadRecordsDataTableBySymptom(tab: { id: string, name: string }) {

    // Configura a label da tabela
    const recordTabLabel = document.getElementById("recordTabLabel")
    if (recordTabLabel)
        recordTabLabel.innerHTML = StringHelper.capitalizeFirstLetter(tab.name);

    // Faz a requisição dos registros para o sintoma selecionado na tab
    FetchHelper.get(globalConfigs.server + '/get-records-by-symptom/' + tab.id, function (records: RecordBySymptomAPI[]) {

        const recordsData: Record<string, any>[] = [];
        const recordColumn = [
            { id: "symptom_name", label: "Sintoma" },
            { id: "date", label: "Data" },
            { id: "time", label: "Hora" },
            { id: "value", label: "Valor" }
        ];

        if (records && records.length > 0) {
            records.forEach((item) => {
                recordsData.push({
                    id: item.id,
                    symptom_name: item.symptom_name,
                    date: new Date(item.date+"T"+item.time+"-03:00").toLocaleDateString("pt-BR"),
                    raw_date: item.date,
                    time: item.time,
                    value: item.value
                });
            });
        }

        $root.recordsDataTableBySymptom?.loadData(recordsData, recordColumn);

    });

};

function loadEventsDataTable() {

    FetchHelper.get(globalConfigs.server + "/get-events", function (events: EventAPI[]) {

        const eventsData: Record<string, any>[] = [];
        const eventsColumns = [
            { id: "date", label: "Data" },
            { id: "eventLabel", label: "Evento" }
        ];

        events.forEach((item) => {
            eventsData.push({
                id: item.id,
                date: new Date(item.date+"T"+item.time+"-03:00").toLocaleDateString("pt-BR"),
                time: item.time,
                description: item.description,
                eventLabel: item.description + " [" + item.time + "h]"
            });
        });

        $root.eventsDataTable?.loadData(eventsData, eventsColumns);
    
    });

};

/**
 * Modal
 */

function openAndConfigEditModal(row: Record<string, any>, button: HTMLButtonElement, fullfillValues: Function = function() {}) {

    // Abre o modal
    const modalId = button.getAttribute('data-open-modal');

    if (modalId) {

        const modal = document.getElementById(modalId);

        if (!modal || !(modal instanceof HTMLDialogElement))
            return;
        
        modal.showModal();

        // Preenche os inputs do modal com os valores    
        fullfillValues(modal, row);

        // Adiciona event listener de fechar modal
        modal.querySelector("[data-close-modal]")?.addEventListener('click', function (this: Element) {
            this.closest('dialog')?.close();
        });

    }

};

function closeModal(modalSelector: string) {
    const modal = document.querySelector(modalSelector);
    if (modal && modal instanceof HTMLDialogElement)
        modal.close();
}

/**
 * Edit Functions
 */

function getInputId(elementSelector: string) {
    const symptomIdInput = document.querySelector(elementSelector);
    if (symptomIdInput && symptomIdInput instanceof HTMLInputElement)
        return symptomIdInput.value;
    return "0";
}

function editSymptom(this: HTMLFormElement, event: Event) {

    const formItens = [
        { id: 'symptomName', key: "name", label: "Sintoma", type: "string", required: true }
    ];

    const url = globalConfigs.server + '/update-symptom/' + getInputId("#symptomId");

    const symptomForm = new FormHelper(this);

    symptomForm.updateData(event, formItens, url, function () {
        loadSymptomsDataTable();
        closeModal("#symptomModal");
        loadAndConfigRecordsTabs();
    });

};

document.getElementById("symptomForm")?.addEventListener("submit", editSymptom);

function editRecord(this: HTMLFormElement, event: Event) {

    const formItens = [
        { id: "recordDate", key: "date", label: "Data", type: "date", required: true },
        { id: "recordTime", key: "time", label: "Hora", type: "time", required: true },
        { id: "recordValue", key: "value", label: "Valor", type: "float", required: true, min: 0, max: 10 }
    ];

    const url = globalConfigs.server + '/update-record/' + getInputId("#recordId");

    const recordForm = new FormHelper(this);

    recordForm.updateData(event, formItens, url, function () {
        loadRecordsDataTableBySymptom($root.activeRecordTab);
        closeModal("#recordModal");
    });

};

document.getElementById("recordForm")?.addEventListener("submit", editRecord);

// Configura os dados para editar um evento chama a função genérica
function editEvent(this: HTMLFormElement, event: Event) {

    const formItens = [
        { id: "eventDescription", key: "description", label: "Descrição", type: "string", required: true },
        { id: "eventDate", key: "date", label: "Data", type: "date", required: true },
        { id: "eventTime", key: "time", label: "Hora", type: "time", required: true }
    ];

    const url = globalConfigs.server + '/update-event/' + getInputId("#eventId");

    const eventForm = new FormHelper(this);

    eventForm.updateData(event, formItens, url, function () {
        loadEventsDataTable();
        closeModal("#eventModal");
    });

};

document.getElementById("eventForm")?.addEventListener("submit", editEvent);

/**
 * Symptom Sorting
 */
// Função que ativa e configura o recurso de arrastar e soltar dos sintomas
function activateSymptomSorting() {

    if (!$root.symptoms || $root.symptoms.length === 0)
        return;

    document.getElementById("symptomDataSection")?.setAttribute("data-sorting", "true");

    const el = document.querySelector<HTMLElement>('#symptomsDataTable tbody');

    if (!el)
        return;

    Sortable.create(el, {

        onSort: function (event) {

            function configurateNextItemOrder(order: string, item: Element) {
                item.setAttribute("data-order", order);
                if (item.nextElementSibling)
                    configurateNextItemOrder(order + 1, item.nextElementSibling);
            };

            function configuratePreviousItemOrder(order: string, item: Element) {
                item.setAttribute("data-order", order);
                if (item.previousElementSibling)
                    configuratePreviousItemOrder(String(Number(order) - 1), item.previousElementSibling);
            };

            if (event.item.nextElementSibling) {
                const newOrder = event.item.nextElementSibling.getAttribute("data-order");
                if (newOrder)
                    configurateNextItemOrder(newOrder, event.item);
            } else if (event.item.previousElementSibling) {
                const newOrder = event.item.previousElementSibling.getAttribute("data-order");
                if (newOrder)
                    configuratePreviousItemOrder(newOrder, event.item);
            }

        }

    });

};

document.getElementById("sortSymptomsButton")?.addEventListener("click", activateSymptomSorting);

// Cancela e desativa o recurso de arrastar e soltar
function desactivateSymptomSorting() {
    document.getElementById("symptomDataSection")?.setAttribute("data-sorting", "false");
    loadSymptomsDataTable();
};

document.getElementById("desactivateSortButton")?.addEventListener("click", desactivateSymptomSorting);

// Salva a nova ordenação no banco
function saveSymptomSorting() {

    const symptomsOrder: { id: string; order: string }[] = [];
    document.querySelectorAll('#symptomsDataTable tbody tr').forEach(function(item) {
        const id = item.getAttribute("data-id");
        const order = item.getAttribute("data-order");
        if (id && order) 
            symptomsOrder.push({ id, order });
    });

    const formObj = { symptoms_order: symptomsOrder };

    const requestObject = {
        method: "put",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formObj)
    };

    FetchHelper.post(globalConfigs.server + '/update-symptom-order', requestObject, function(data: any, message: string) {
        loadAndConfigRecordsTabs();
        desactivateSymptomSorting();
        alert(message);
    }, "editar dados");

};

document.getElementById("saveSortButton")?.addEventListener("click", saveSymptomSorting);

/**
 * On DOMContentLoaded
 */

function assignValueToInput(element: Element | null, value: string) {
    if (element && element instanceof HTMLInputElement)
        element.value = value;
}

document.addEventListener('DOMContentLoaded', function() {

    loadAndConfigRecordsTabs();

    // Cria uma instância do data table para os sintomass
    $root.symptomsDataTable = new NormalDataTable("#symptomsDataTable", {
        pageSize: 10,
        searchable: true,
        trAttributes: [
            { attributeName: "data-id", attributeId: "id" },
            { attributeName: "data-order", attributeId: "order" },
        ],
        actions: [
            {
                label: "edit",
                className: "edit-button",
                onClick: (row: Record<string, any>, button: HTMLButtonElement, event: MouseEvent) => {
                    // Chama e configura a função generica para abrir e configurar o modal de edição
                    openAndConfigEditModal(row, button, function(modal: HTMLDialogElement, row: Record<string, any>) {
                        assignValueToInput(modal.querySelector("#symptomId"), row.id);
                        assignValueToInput(modal.querySelector("#symptomName"), row.name);
                    });
                },
                attributes: {
                    "data-open-modal": "symptomModal"
                }
            },
            {
                label: "delete",
                className: "delete-button",
                onClick: (row: Record<string, any>) => {
                    // Pede confirmação e chama a função genérica de excluir dados
                    if (window.confirm("Você realmente deseja excluir este sintoma?")) {
                        const url = globalConfigs.server + '/delete-symptom/' + row.id;
                        FormHelper.deleteData(url, function() {
                            loadSymptomsDataTable();
                            loadAndConfigRecordsTabs();
                        });
                    }
                }
            }
        ],
        afterRender: function(data: Record<string, any>[], columns: Record<string, any>[]) {
            configTooltips();
            document.querySelectorAll("#symptomsDataTable tr td:first-child").forEach(function(item) {
                const icon = document.createElement("i");
                icon.className = "fa fa-solid fa-arrows-up-down sort-icon"
                item.prepend(icon);
            });
        }
    });

    // Busca os dados dos sintomass no banco
    loadSymptomsDataTable();

    // Cria uma instância do data table para os registros
    $root.recordsDataTableBySymptom = new NormalDataTable("#recordsDataTableBySymptom", {
        pageSize: 10,
        searchable: true,
        actions: [
            {
                label: "edit",
                className: "edit-button",
                onClick: (row: Record<string, any>, button: HTMLButtonElement, event: MouseEvent) => {
                    // Chama e configura a função generica para abrir e configurar o modal de edição
                    openAndConfigEditModal(row, button, function(modal: HTMLDialogElement, row: Record<string, any>) {
                        assignValueToInput(modal.querySelector("#recordId"), row.id);
                        assignValueToInput(modal.querySelector("#recordDate"), row.date);
                        assignValueToInput(modal.querySelector("#recordTime"), row.time);
                        assignValueToInput(modal.querySelector("#recordValue"), row.value);
                    });
                },
                attributes: {
                    "data-open-modal": "recordModal"
                }
            },
            {
                label: "delete",
                className: "delete-button",
                onClick: (row: Record<string, any>) => {
                    // Pede confirmação e chama a função genérica de excluir dados
                    if (window.confirm("Você realmente deseja excluir este registro?")) {
                        const url = globalConfigs.server + '/delete-record/' + row.id;
                        FormHelper.deleteData(url, function() {
                            loadRecordsDataTableBySymptom($root.activeRecordTab);
                        });
                    }
                }
            },
            {
                label: "delete-date",
                className: "delete-date-button",
                onClick: (row: Record<string, any>) => {
                    // Pede confirmação e chama a função genérica de excluir dados
                    if (window.confirm("Essa ação ira excluir todos os registros dessa data")) {
                        if (window.confirm("Você realmente deseja excluir todos os registros desse dia?")) {
                            const url = globalConfigs.server + '/delete-records-date/' + row.raw_date;
                            FormHelper.deleteData(url, function() {
                                loadRecordsDataTableBySymptom($root.activeRecordTab);
                            });
                        }
                    }
                }
            }
        ],
        afterRender: function() {
            configTooltips();
        }
    });

    // Cria uma instância do data table para os eventos
    $root.eventsDataTable = new NormalDataTable("#eventsDataTable", {
        pageSize: 10,
        searchable: true,
        actions: [
            {
                label: "edit",
                className: "edit-button",
                onClick: (row: Record<string, any>, button: HTMLButtonElement, event: MouseEvent) => {
                    // Chama e configura a função generica para abrir e configurar o modal de edição
                    openAndConfigEditModal(row, button, function(modal: HTMLDialogElement, row: Record<string, any>) {
                        assignValueToInput(modal.querySelector("#eventId"), row.id);
                        assignValueToInput(modal.querySelector("#eventDescription"), row.description);
                        assignValueToInput(modal.querySelector("#eventDate"), row.date);
                        assignValueToInput(modal.querySelector("#eventTime"), row.time);
                    });
                },
                attributes: {
                    "data-open-modal": "eventModal"
                }
            },
            {
                label: "delete",
                className: "delete-button",
                onClick: (row: Record<string, any>) => {
                    // Pede confirmação e chama a função genérica de excluir dados
                    if (window.confirm("Você realmente deseja excluir este evento?")) {
                        const url = globalConfigs.server + '/delete-event/' + row.id;
                        FormHelper.deleteData(url, function() {
                            loadEventsDataTable();
                        });
                    }
                }
            }
        ],
        afterRender: function() {
            configTooltips();
        }
    });

    // Busca os dados dos eventos no banco
    loadEventsDataTable();

});