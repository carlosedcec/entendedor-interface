import globalConfigs from "../config/configs.js";
import AuthHelper from "../helpers/AuthHelper.js";
import StringHelper from "../helpers/StringHelper.js";
import FetchHelper from "../helpers/FetchHelper.js";
import { RecordsDataTable, NormalDataTable } from "../classes/Datatable.js";
import type { SymptomAPI, RecordAPI, EventAPI } from "../types/types.js";
import { jsPDF } from "jspdf";
import { autoTable } from 'jspdf-autotable'

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
    eventsDataTable: null
};

/** 
 * Load Data Tables
 */

const loadRecordsData = function() {
    
    // Busca os sintomas no banco
    FetchHelper.get(globalConfigs.server + '/get-symptoms', function (symptoms: SymptomAPI[]) {

        // Grava os sintomas na variável global
        $root.symptoms = symptoms.map((item) => {return item.name});

        // Agora busca o histórico de registros no banco
        FetchHelper.get(globalConfigs.server + '/get-records', function (records: RecordAPI[]) {

            const recordsData: Record<string, any>[] = [];
            const recordsColumns = [{ id: 'symptom', label: "Data/Registro" },];

            if (!records || records.length === 0) {
                $root.recordsDataTable?.loadData(recordsData, recordsColumns, 1);
                return;
            }

            // Prepara dados para formato do dataTable
            $root.symptoms.forEach((symptom, index) => {
                // Adiciona o symptom
                recordsData.push({ symptom: StringHelper.capitalizeFirstLetter(symptom) });
                // Adiciona o valor de cada data para o symptom em questão
                records.filter((item) => {
                    return item.symptom_name === symptom
                }).forEach((item) => {
                    recordsData[index][item.date] = item.average_value;
                });
            });

            // Cria um array com as datas distintas
            const distinctDates = new Set(records.map((item) => { return item.date }));

            // Adiciona um tipo "total" nos dados da tabela
            recordsData.push({ symptom: "Total" });

            distinctDates.forEach(date => {
                // Adiciona as datas distintas como colunas
                recordsColumns.push({
                    id: date,
                    label: String(date).split("-")[2] + "/" + String(date).split("-")[1]
                });
                // Soma os totais com base na data
                const dateTotal = records.filter((item) => {
                    return item.date === date
                }).reduce(function (n, item) {
                    return n + item.average_value
                }, 0
                );
                // Adiciona o total de cada data na tabela
                recordsData[recordsData.length - 1][date] = dateTotal;
            });

            // Configura a última página do datatable como a página atual base na quantidade de datas
            const page = Math.ceil(Array.from(distinctDates).length / $root.recordsDataTable?.options.columnsPerPage);

            // Carrega os dados na DataTable
            $root.recordsDataTable?.loadData(recordsData, recordsColumns, page);

        });

    });
    
};

const loadEventsData = function() {
    
    FetchHelper.get(globalConfigs.server + '/get-events', function (events: EventAPI[]) {

        const eventsData: Record<string, any>[] = [];
        const eventsColumns = [
            { id: "date", label: "Data" },
            { id: "event", label: "Evento" }
        ];

        events.forEach((item) => {
            eventsData.push({
                date: new Date(item.date + "T" + item.time + "-03:00").toLocaleDateString("pt-BR"),
                event: item.description + " [" + item.time + "h]"
            });
        });

        $root.eventsDataTable?.loadData(eventsData, eventsColumns);

    });

};

/** 
 * Export PDFs
 */

document.querySelector<HTMLButtonElement>("button#exportRecordsPDF")?.addEventListener("click", function() {

    const doc = new jsPDF({
        orientation: "landscape",
        unit: 'mm',
        format: 'a4'
    });

    doc.text("Histórico de Registros", 148, 15, { align: "center" })

    autoTable(doc, {
        html: '#recordsDataTable',
        margin: {
            top: 25,
            left: 12,
            right: 12
        },
        useCss: true
    });

    doc.save('historico-de-registros.pdf')

});


document.querySelector<HTMLButtonElement>("button#exportEventsPDF")?.addEventListener("click", function() {

    const doc = new jsPDF({
        orientation: "portrait",
        unit: 'mm',
        format: 'a4'
    });

    doc.text("Histórico de Eventos", 105, 20, { align: "center" });

    autoTable(doc, {
        html: '#eventsDataTable',
        margin: { top: 30 },
        useCss: true
    });

    doc.save('historico-de-eventos.pdf');

});

/** 
 * On DOMContentLoaded
 */

document.addEventListener('DOMContentLoaded', function () {

    // Cria uma instância do data table para os registros
    $root.recordsDataTable = new RecordsDataTable("#recordsDataTable", {
        fixedColumns: 1,
        columnsPerPage: 14,
        searchable: true,
        showRowAverage: true
    });

    // Busca os dados dos registros no banco
    loadRecordsData();

    // Cria uma instância do data table para os eventos
    $root.eventsDataTable = new NormalDataTable("#eventsDataTable", {
        pageSize: 25,
        searchable: true
    });

    // Busca os dados dos eventos no banco
    loadEventsData();

});