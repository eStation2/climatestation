Ext.define('climatestation.view.dashboard.DatasetInformation', {
    extend: 'Ext.Panel',
    controller: "dashboard-datasetinfo",
    viewModel: {
        type: "dashboard-datasetinfo"
    },

    xtype: 'dashboard-datasetinfo',

    requires: [
        // 'Ext.chart.theme.DefaultGradients',
        'Ext.chart.PolarChart',
        'climatestation.Utils'
    ],

    // cls: 'service-type shadow',
    height: 350,
    bodyPadding: 5,
    title: 'Dataset information',
    layout: {
        type: 'hbox',
        align: 'stretch'
    },
    tools: [{
        type:'refresh',
        tooltip: 'Refresh Dataset information',
        handler: function(event, toolEl, panelHeader) {

        }
    }],
    config: {

    },

    initComponent: function () {
        var me = this;

        me.storeDatasetCompleteness = Ext.create('Ext.data.Store', {
            storeId: "datasetcompleteness",

            fields: ['completeness', 'value' ],
            data: [
                { completeness: 'Missing', value: 5.5 },
                { completeness: 'Present', value: 94.5 }
            ]
        });

        me.storeDatasetsCategory = Ext.create('Ext.data.Store', {
            storeId: "datasetcategory",

            fields: ['category', 'value' ],
            data: [
                { category: 'Rainfall', value: 25, products: 25 },
                { category: 'Vegetation', value: 25, products: 25},
                { category: 'Fire', value: 15, products: 15},
                { category: 'Inland water', value: 5, products: 5},
                { category: 'Oceanographic', value: 30, products: 30}
            ]
        });

        me.items = [{
            xtype: 'polar',
            reference: 'datasetscompleteness',
            downloadServerUrl: 'localhost',
            captions: {
                title: 'Dataset completeness'
                // credits: {
                //     text: 'Data: IDC Predictions - 2017\n' +
                //         'Source: Internet',
                //     align: 'left'
                // }
            },
            // theme: 'default-gradients',
            width: '50%',
            height: 350,
            // insetPadding: 20,
            innerPadding: 5,
            // store: {
            //     type: 'datasetinfo'
            // },
            store: me.storeDatasetCompleteness,
            // legend: {
            //     docked: 'bottom'
            // },
            legend: null,
            interactions: ['rotate'],
            series: [{
                type: 'pie',
                angleField: 'value',
                rotation:45,
                label: {
                    field: 'completeness',
                    calloutLine: {
                        length: 60,
                        width: 3
                        // specifying 'color' is also possible here
                    }
                },
                highlight: true,
                tooltip: {
                    trackMouse: true,
                    renderer: 'onSeriesTooltipRender'
                }
            }]
        },{
            xtype: 'polar',
            reference: 'chart',
            downloadServerUrl: 'localhost',
            captions: {
                title: 'Available products per category'
            },
            width: '50%',
            height: 350,
            innerPadding: 5,
            store: me.storeDatasetsCategory,
            legend: {
                docked: 'right'
            },
            interactions: ['rotate', 'itemhighlight'],
            series: [{
                type: 'pie',
                angleField: 'value',
                donut: 50,
                rotation:90,
                label: {
                    field: 'category',
                    display: 'outside'
                },
                highlight: true,
                tooltip: {
                    trackMouse: true,
                    renderer: 'onSeriesTooltipRender2'
                }
            }]
        }];

        me.callParent();
    }
});
