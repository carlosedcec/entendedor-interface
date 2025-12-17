import globalConfigs from "../config/configs.js";
import AuthHelper from "../helpers/AuthHelper.js";
import StringHelper from "../helpers/StringHelper.js";
import FetchHelper from "../helpers/FetchHelper.js";
import ApexCharts from 'apexcharts'
import type { SymptomAPI, RecordAPI, EventAPI, } from "../types/types.js";

AuthHelper.checkAuth();
AuthHelper.addLogoutEvent();

/**
 * Root global variable
 */

const $root: {
    chart1: any;
    chart2: any;
    symptoms: SymptomAPI[];
    records: Record<string, RecordAPI[]>;
    events: EventAPI[];
} = {
    chart1: null,
    chart2: null,
    symptoms: [],
    records: {},
    events: []
};

/** 
 * Load Data
 */

const loadSymptoms = function () {
    FetchHelper.get(globalConfigs.server + "/get-symptoms", function (categories: SymptomAPI[]) {
        $root.symptoms = categories;
    });
};

// Função de load dos registros, faz um get do banco, configura os dados e povoa a variável global
function loadRecordsData() {
    FetchHelper.get(globalConfigs.server + "/get-records", function (records: RecordAPI[]) {
        $root.records = Object.groupBy(records, record => record.date) as Record<string, RecordAPI[]>;
    });
};

// Função de load dos eventos, faz um get do banco, configura os dados e povoa a variável global
function loadEventsData() {
    FetchHelper.get(globalConfigs.server + "/get-events", function (events: EventAPI[]) {
        $root.events = events;
    });
};

// Função do Chart 1
function loadChart1(update = false) {

    const range = window.innerWidth > 768 ? 14 : 7;

    // Prepara os dados com base na página e chama a renderização
    function loadChartData(page: number, update: boolean = false) {

        const startIndex = page === 1 ? 0 : range * (page - 1);
        const endIndex = page * range;

        const recordsData = Object.entries($root.records).slice(startIndex, endIndex).map(entry => entry[1]);
        let recordsDates = Object.entries($root.records).slice(startIndex, endIndex).map(entry => entry[0]);
        recordsDates = recordsDates.map(date => new Date(date).toLocaleDateString("pt-BR"));

        const series: Record<string, any>[] = [];

        $root.symptoms.forEach((symptom: SymptomAPI) => {
            const serie: {
                name: string;
                data: number[];
            } = {
                name: StringHelper.capitalizeFirstLetter(symptom.name),
                data: []
            };
            recordsData.forEach(data => {
                const item = data.filter(item => item.symptom_name === symptom.name)[0];
                const average_value = item && item.average_value ? item.average_value : 0;
                serie.data.push(average_value);
            });
            series.push(serie);
        });

        if (update)
            updateChart(series, recordsDates);
        else
            renderChart(series, recordsDates);

        configPagesHTML(page);

    };

    function renderChart(series: Record<string, any>[], categories: string[]) {

        const chartOptions = {

            chart: {
                height: 500,
                type: 'bar',
                stacked: true,
                zoom: {
                    enabled: true
                },
                redrawOnWindowResize: false
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    borderRadius: 10,
                    borderRadiusApplication: 'end', // 'around', 'end'
                    borderRadiusWhenStacked: 'last', // 'all', 'last'
                    dataLabels: {
                        total: {
                            enabled: true,
                            style: {
                                fontSize: '13px',
                                fontWeight: 900
                            }
                        }
                    }
                },
            },
            fill: {
                opacity: 0.6
            },
            responsive: [{
                breakpoint: 480,
                options: {
                    legend: {
                        position: 'bottom',
                        offsetX: -10,
                        offsetY: 0
                    }
                }
            }],
            colors: ['#008ffb', '#00e396', '#feb019', '#ff4560', '#775dd0', '#1f836c', '#7a0000', '#f583e1', '#705e5e'],
            title: {
                text: 'Registros - Stacked Columns',
                align: 'left'
            },
            stroke: {
                width: 0,
                dashArray: 0
            },
            legend: {
                tooltipHoverFormatter: function(val: string, opts: any) {
                    return val + ' - <strong>' + opts.w.globals.series[opts.seriesIndex][opts.dataPointIndex] + '</ strong>'
                }
            },
            markers: {
                size: 0,
                hover: {
                    sizeOffset: 6
                }
            },

            series: series,
            xaxis: {
                categories: categories,
            },
            grid: {
                borderColor: '#f1f1f1',
            }
        };

        $root.chart1 = new ApexCharts(document.querySelector("#chart1 .chart-element"), chartOptions);
        $root.chart1.render();

    };

    function updateChart(series: Record<string, any>[], categories: string[]) {
        $root.chart1.updateOptions({
            series: series,
            xaxis: {
               categories: categories
            }
        });
    }

    // Configurações de paginação
    const dates = Object.entries($root.records).map(entry => entry[0]);
    const numberOfPages = Math.ceil(dates.length / range);

    function configPagesHTML(currentPage: number) {

        const chart1 = document.querySelector("#chart1");

        if (!chart1) return;

        const tablePageInfo = chart1.querySelector(".table-page-info");
        if (tablePageInfo)
            tablePageInfo.innerHTML = "Página " + currentPage + " de " + numberOfPages;

        chart1.setAttribute("data-current-page", String(currentPage));
    };

    document.querySelector("#chart1 .previous-page")?.addEventListener("click", function(event) {
        let currentPage: number = Number(document.querySelector("#chart1")?.getAttribute("data-current-page"));
        currentPage = --currentPage;
        if (currentPage >= 1)
            loadChartData(currentPage, true);
    });

    document.querySelector("#chart1 .next-page")?.addEventListener("click", function(event) {
        let currentPage: number = Number(document.querySelector("#chart1")?.getAttribute("data-current-page"));
        currentPage = ++currentPage;
        if (currentPage <= numberOfPages)
            loadChartData(currentPage, true);
    });

    loadChartData(1, update);

};

function loadChart2(update = false) {

    const range = window.innerWidth > 768 ? 30 : 14;

    // Prepara os dados com base na página e chama a renderização
    function loadChartData(page: number, update: boolean = false) {

        const startIndex = page === 1 ? 0 : range * (page - 1);
        const endIndex = page * range;

        const recordsData = Object.entries($root.records).slice(startIndex, endIndex).map(entry => entry[1]);
        const recordsDates = Object.entries($root.records).slice(startIndex,endIndex).map(entry => entry[0]);

        // Early return if no records to display
        if (recordsDates.length === 0) {
            if (update) {
                updateChart([], [], []);
            } else {
                renderChart([], [], []);
            }
            configPagesHTML(page);
            return;
        }

        const categories = recordsDates.map(date => new Date(date+"T00:00-03:00").getTime());
        if (endIndex >= Object.keys($root.records).length) {
            const lastDate = recordsDates[recordsDates.length-1];
            if (lastDate) {
                const tomorrow = new Date(lastDate+"T00:00-03:00");
                tomorrow.setDate(tomorrow.getDate() + 1);
                categories.push(tomorrow.getTime());
            }
        }

        const series: Record<string, any>[] = [];

        // Adiciona os valores dos registros
        const registros = [];

        if ($root.symptoms[0] && $root.symptoms[0].name)
            registros.push($root.symptoms[0].name);
        if ($root.symptoms[1] && $root.symptoms[1].name)
            registros.push($root.symptoms[1].name);
        if ($root.symptoms[2] && $root.symptoms[2].name)
            registros.push($root.symptoms[2].name);

        if ($root.symptoms.filter((item) => item.name == "dor").length > 0)
            registros[0] = "dor";
        if ($root.symptoms.filter((item) => item.name == "fadiga").length > 0)
            registros[1] = "fadiga";
        if ($root.symptoms.filter((item) => item.name == "sono").length > 0)
            registros[2] = "sono";
        if ($root.symptoms.filter((item) => item.name == "humor").length > 0)
            registros[3] = "humor";
        if ($root.symptoms.filter((item) => item.name == "mobilidade").length > 0)
            registros[4] = "mobilidade";
        if ($root.symptoms.filter((item) => item.name == "confiança").length > 0)
            registros[5] = "confiança";

        registros.forEach(function(registro) {
            const serie: {
                name: string;
                data: number[];
            } = {
                name: registro,
                data: []
            };
            recordsData.forEach(data => {
                const item = data.find(item => item.symptom_name === registro);
                const average_value = item && item.average_value ? item.average_value : 0;
                serie.data.push(average_value);
            });
            series.push(serie);
        });

        // Filtra os eventos de acordo com a página/data e adiciona eles na variável annotations
        const eventsData = $root.events.filter(item => item.date >= recordsDates[0] && item.date <= recordsDates[recordsDates.length-1]);
        const annotations: Record<string, any>[] = [];
        eventsData.forEach(function(event, index) {
            annotations.push({
                x: new Date(event.date + "T" + event.time + "-03:00").getTime(),
                strokeDashArray: 0,
                borderColor: '#bbb',
                label: {
                  borderColor: '#bbb',
                  style: {
                    color: '#fff',
                    background: '#bbb',
                    fontSize: "12px",
                  },
                  text: event.description,
                }
            });
        });

        if (update)
            updateChart(series, categories, annotations);
        else
            renderChart(series, categories, annotations);

        configPagesHTML(page);

    };

    function renderChart(series: Record<string, any>[], categories: number[], annotations: Record<string, any>[]) {

        const chartOptions = {

            chart: {
                height: 500,
                type: 'line',
                zoom: {
                    enabled: true
                },
                redrawOnWindowResize: false
            },
            fill: {
                opacity: 0.6
            },         
            responsive: [{
                breakpoint: 480,
                options: {
                    legend: {
                        position: 'bottom',
                        offsetX: -10,
                        offsetY: 0
                    }
                }
            }],
            colors: ['#008ffb', '#00e396', '#feb019', '#ff4560', '#775dd0', '#1f836c', '#7a0000', '#f583e1', '#705e5e'],
            title: {
                text: 'Registros - Progressão e Eventos',
                align: 'left'
            },
            stroke: {
                width: 2,
                curve: 'smooth'
            },
            legend: {
                tooltipHoverFormatter: function(val: string, opts: any) {
                    return val + ' - <strong>' + opts.w.globals.series[opts.seriesIndex][opts.dataPointIndex] + '</ strong>'
                }
            },
            series: series,
            xaxis: {
                categories: categories,
                type: "datetime"
            },
            yaxis: {
                min: 0,
                max: 10
            },
            annotations: {
                xaxis: annotations
            },
            grid: {
                borderColor: '#f1f1f1',
                padding: {
                    right: 30,
                    left: 20
                }
            }

        };

        $root.chart2 = new ApexCharts(document.querySelector("#chart2 .chart-element"), chartOptions);
        $root.chart2.render();

    };

    function updateChart(series: Record<string, any>[], categories: number[], annotations: Record<string, any>[]) {
        $root.chart2.updateOptions({
            series: series,
            xaxis: {
               categories: categories
            },
            annotations: {
                xaxis: annotations
            }
        });
    }

    // Configurações de paginação
    const dates = Object.entries($root.records).map(entry => entry[0]);
    const numberOfPages = Math.ceil(dates.length / range);

    function configPagesHTML(currentPage: number) {

        const chart2 = document.querySelector("#chart2");

        if (!chart2) return;

        const tablePageInfo = chart2.querySelector(".table-page-info");
        if (tablePageInfo)
            tablePageInfo.innerHTML = "Página " + currentPage + " de " + numberOfPages;

        chart2.setAttribute("data-current-page", String(currentPage));
    };

    document.querySelector("#chart2 .previous-page")?.addEventListener("click", function(event) {
        let currentPage: number = Number(document.querySelector("#chart2")?.getAttribute("data-current-page"));
        currentPage = --currentPage;
        if (currentPage >= 1)
            loadChartData(currentPage, true);
    });

    document.querySelector("#chart2 .next-page")?.addEventListener("click", function(event) {
        let currentPage: number = Number(document.querySelector("#chart2")?.getAttribute("data-current-page"));
        currentPage = ++currentPage;
        if (currentPage <= numberOfPages)
            loadChartData(currentPage, true);
    });

    loadChartData(1, update);

};

/**
 * On DOMContentLoaded
 */

document.addEventListener('DOMContentLoaded', function() {

    // Chama as funções que carregam os dados do banco
    loadSymptoms();
    loadRecordsData();
    loadEventsData();

    // Carrega os graficos depois de um timeout para ter certeza que os dados do banco foram carregados
    setTimeout(function() {
        loadChart1();
        loadChart2();
    }, 400);

    // Função para recarregar e reconfigurar os gráficos no resize da tela (responsividade)
    let resizeTimer: number | undefined;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            loadChart1(true);
            loadChart2(true);
        }, 200);
    });

});