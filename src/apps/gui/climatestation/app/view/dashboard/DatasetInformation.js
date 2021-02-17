Ext.define('climatestation.view.dashboard.DatasetInformation', {
    extend: 'Ext.Panel',
    controller: "dashboard-datasetinfo",
    viewModel: {
        type: "dashboard-datasetinfo"
    },

    xtype: 'dashboard-datasetinfo',

    requires: [
        'Ext.chart.theme.DefaultGradients',
        'climatestation.Utils'
    ],

    // cls: 'service-type shadow',
    height: 500,
    bodyPadding: 15,
    title: 'Dataset information',
    layout: {
        type: 'hbox',
        align: 'stretch'
    },

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
            captions: {
                title: 'Dataset completeness'
                // credits: {
                //     text: 'Data: IDC Predictions - 2017\n' +
                //         'Source: Internet',
                //     align: 'left'
                // }
            },
            theme: 'default-gradients',
            width: '50%',
            height: 500,
            insetPadding: 20,
            innerPadding: 20,
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
            captions: {
                title: 'Available products per category'
            },
            width: '50%',
            height: 500,
            innerPadding: 20,
            store: me.storeDatasetsCategory,
            legend: {
                docked: 'right'
            },
            interactions: ['rotate', 'itemhighlight'],
            series: [{
                type: 'pie',
                angleField: 'value',
                donut: 50,
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
