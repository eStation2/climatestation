Ext.define("climatestation.view.analysis.timeseriesProductSelection",{
    extend: "Ext.container.Container",

    requires: [
        "Ext.layout.container.Accordion",
        "climatestation.view.analysis.timeseriesProductSelectionController",
        "climatestation.view.analysis.timeseriesProductSelectionModel",
        'Ext.util.DelayedTask',
        'climatestation.Utils'
        // 'climatestation.view.analysis.timeseriesCategoryProducts'
    ],

    controller: "analysis-timeseriesproductselection",
    viewModel: {
        type: "analysis-timeseriesproductselection"
    },
    xtype: 'timeseriesproductselection',

    scrollable: true,
    reserveScrollbar: true,

    defaults: {
        margin: '5 3 5 3'
    },

    border: false,

    isTemplate: false,
    tplChartView: null,

    graphtype: 'xy',
    cumulative: false,
    ranking: false,
    matrix: false,
    multiplevariables: false,
    fromto: false,
    year: false,
    compareyears: false,
    multipleyears: false,

    listeners: {
        afterrender: function(){
            var me = this;
            var user = climatestation.getUser();
            // // var tsDrawPropertiesStore = me.getViewModel().get('timeseriesdrawproperties');
            var tsDrawPropertiesStore  = Ext.data.StoreManager.lookup('TSDrawPropertiesStore');

            // if (me.tplChartView) {
            //     me.getController().setTemplateSelections();
            // }
            if (tsDrawPropertiesStore.isLoaded()) {
                if (user != 'undefined' && user != null) {
                    tsDrawPropertiesStore.proxy.extraParams = {
                        userid: user.userid,
                        istemplate: me.isTemplate,
                        graph_type: me.graphtype,
                        graph_tpl_id: me.isTemplate ? me.tplChartView.graph_tpl_id : '-1',
                        graph_tpl_name: me.isTemplate ? me.tplChartView.graph_tpl_name : 'default'
                    };

                    tsDrawPropertiesStore.reload({
                        callback: function (records, options, success) {
                            if (me.tplChartView){
                                me.getController().setTemplateSelections();
                            }
                        }
                    });
                }
            }
            else {
                if (me.tplChartView) {
                    me.getController().setTemplateSelections();
                }
            }
        }
    },

    initComponent: function () {
        var me = this;
        var maxwidth = 455;

        me.idpostfix = me.isTemplate ? me.tplChartView.id : me.graphtype;
        me.reference = 'timeseriesproductselection_'+me.idpostfix;

        me.selectedtimeseries = {
            xtype: 'grid',
            // id: 'selected-timeseries-mapset-dataset-grid_'+me.idpostfix,
            reference: 'selected-timeseries-mapset-dataset-grid_'+me.idpostfix,
            // autoWidth: true,
            // minWidth: 385,
            // maxWidth: maxwidth,
            width: 455,
            minHeight: 150,
            maxHeight: 200,
            scrollable: true,
            hidden: false,
            bind: '{selectedtimeseriesmapsetdatasets}',
            // layout: 'fit',
            margin: '0 0 5 0',
            // flex: 1,

            viewConfig: {
                stripeRows: false,
                enableTextSelection: true,
                draggable: false,
                markDirty: false,
                resizable: false,
                disableSelection: false,
                trackOver: true
            },
            collapsible: false,
            enableColumnMove: false,
            enableColumnResize: false,
            multiColumnSort: false,
            columnLines: false,
            rowLines: true,
            frame: false,
            border: 1,
            bodyBorder: true,
            reserveScrollbar: (!me.matrix && !me.ranking),

            columns: {
                defaults: {
                    menuDisabled: true,
                    sortable: false,
                    variableRowHeight: true,
                    enableTextSelection: true,
                    draggable: false,
                    groupable: false,
                    hideable: false,
                    stopSelection: false,
                    // shrinkWrap: 0,
                    resizable: false
                },
                items: [{
                    xtype: 'actioncolumn',
                    hidden: false,
                    width: 30,
                    align: 'center',
                    items: [{
                        getClass: function (v, meta, rec) {
                            if (rec.get('selected')) {
                                return 'far fa-check-square green';   // 'activated';
                            } else {
                                return 'far fa-square green';   // 'deactivated';
                            }
                        },
                        getTip: function (v, meta, rec) {
                            //if (rec.get('selected')) {
                            //    return climatestation.Utils.getTranslation('deactivateproduct');   // 'Deactivate Product';
                            //} else {
                            //    return climatestation.Utils.getTranslation('activateproduct');   // 'Activate Product';
                            //}
                        },
                        handler: function (grid, rowIndex, colIndex, icon, e, record) {
                            // var rec = record;   // grid.getStore().getAt(rowIndex),
                            // selectedTimeseriesStore = grid.getStore();
                            // var selectedTimeseriesStore = Ext.getCmp('selected-timeseries-mapset-dataset-grid_'+ me.idpostfix).getStore();
                            var selectedTimeseriesStore = me.lookupReference("selected-timeseries-mapset-dataset-grid_"+me.idpostfix).getStore();
                            var yearsData = [];

                            selectedTimeseriesStore.remove(record);
                            // rec.get('selected') ? rec.set('selected', false) : rec.set('selected', true);
                            // if (!rec.get('selected')) {
                            //     selectedTimeseriesStore.remove(record);
                            // }

                            if (me.matrix){
                                // var colorSchemesStore = Ext.getCmp('colorschemesMatrixTSProductGrid_'+me.idpostfix).getStore();
                                var colorSchemesStore = me.lookupReference("colorschemesMatrixTSProductGrid_"+me.idpostfix).getStore();
                                colorSchemesStore.removeAll();
                            }
                            selectedTimeseriesStore.getData().each(function (product) {
                                yearsData = climatestation.Utils.union_arrays(yearsData, product.get('years'));
                            });

                            me.getViewModel().get('years').getData().each(function(year) {
                                if (!Ext.Array.contains(yearsData, year.get('year'))){
                                    me.getViewModel().get('years').remove(year);
                                }
                            });
                            me.updateLayout();

                            // var yearsDataDict = [];
                            // yearsData.forEach(function (year) {
                            //     yearsDataDict.push({'year': year});
                            // });
                            //
                            // //if (Ext.isObject(Ext.getCmp('ts_selectyearstocompare_'+me.idpostfix).searchPopup)) {
                            // //    Ext.getCmp('ts_selectyearstocompare_'+me.idpostfix).searchPopup.lookupReference('searchGrid').getSelectionModel().deselectAll();
                            // //}
                            // //Ext.getCmp('timeserieschartselection').getViewModel().getStore('years').setData(yearsDataDict);
                            // me.getViewModel().getStore('years').setData(yearsDataDict);
                        }
                    }]
                }, {
                    text: '<div class="grid-header-style">' + climatestation.Utils.getTranslation('selected_products') + '</div>',   //'<div class="grid-header-style">Time series</div>',
                    xtype: 'templatecolumn',
                    tpl: new Ext.XTemplate(
                        '<b>{product_descriptive_name}</b>' +
                        '<tpl if="version != \'undefined\'">',
                        '<b class="smalltext"> - {version} </b>',
                        '</tpl>',
                        // '</br>' +
                        '<span class="smalltext"> (<b style="color:darkgrey;">{productcode} - {subproductcode}</b> - <b>{mapsetcode}</b>)' +
                        '</span>'
                    ),
                    flex: 2,
                    cellWrap: true
                }, {
                    xtype: 'actioncolumn',
                    dataIndex: 'reference',
                    text: '<span style="font-size:12px;">' + climatestation.Utils.getTranslation('ref') + '</span>', // Ref
                    width: 50,
                    align: 'center',
                    hidden: !me.cumulative,
                    disabled: !me.cumulative,
                    items: [{
                        tooltip: climatestation.Utils.getTranslation('reference'),
                        getClass: function (v, meta, rec) {
                            // console.info(rec);
                            if (rec.get('reference') === ' '){
                                return ''
                            }
                            else if (rec.get('difference')){
                                return ''
                            }
                            else if (rec.get('reference') && !rec.get('difference')) {
                                return 'x-grid3-radio-col-on';
                            }
                            else {
                                return 'x-grid3-radio-col'
                            }
                        },
                        handler: function (grid, rowIndex, colIndex, icon, e, record) {
                            //console.info(record);
                            if (!record.get('reference')){
                                //record.set('reference', !record.get('reference'));
                                grid.getStore().each(function(rec){
                                    //console.info(rec);
                                    rec.set('reference', false);
                                    if (rec.get('frequency_id') !== record.get('frequency_id')){
                                        rec.set('difference', ' ');
                                    }
                                });
                                record.set('reference', true);
                            }
                            else {
                                grid.getStore().each(function(rec){
                                    //console.info(rec);
                                    rec.set('reference', false);
                                    rec.set('difference', false);
                                });
                                //record.set('reference', false);
                            }
                        }
                    }]
                },{
                    xtype: 'actioncolumn',
                    dataIndex: 'difference',
                    header: '<span style="font-size:12px;">' + climatestation.Utils.getTranslation('curr') + '</span>',   // Diff
                    width: 50,
                    align: 'center',
                    hidden: !me.cumulative,
                    disabled: !me.cumulative,
                    items: [{
                        tooltip: climatestation.Utils.getTranslation('difference'),
                        getClass: function (v, meta, rec) {
                            console.info(rec);
                            if (rec.get('difference') === ' '){
                                return ''
                            }
                            else if (rec.get('reference')){
                                return ''
                            }
                            else if (rec.get('difference') && !rec.get('reference')) {
                                return 'x-grid3-radio-col-on';
                            }
                            else {
                                return 'x-grid3-radio-col'
                            }
                        },
                        handler: function (grid, rowIndex, colIndex, icon, e, record) {
                            if (!record.get('difference')){
                                grid.getStore().each(function(rec){
                                    rec.set('difference', false);
                                    if (rec.get('frequency_id') !== record.get('frequency_id')){
                                        rec.set('reference', ' ');
                                    }
                                });
                                record.set('difference', true);
                            }
                            else {
                                grid.getStore().each(function(rec){
                                    //console.info(rec);
                                    rec.set('reference', false);
                                    rec.set('difference', false);
                                });
                                //record.set('difference', false);
                            }
                        }
                    }]
                }, {
                    xtype: 'checkcolumn',
                    dataIndex: 'zscore',
                    header: '<span style="font-size:12px;">' + climatestation.Utils.getTranslation('zccore') + '</span>',   // 'Z-Score'
                    width: 70,
                    align: 'center',
                    hidden: !me.ranking,
                    disabled: !me.ranking
                }, {
                    xtype: 'checkcolumn',
                    dataIndex: 'colorramp',
                    header: '<span style="font-size:12px;">' + climatestation.Utils.getTranslation('gradient') + '</span>',  // 'Gradient'
                    width: 75,
                    align: 'center',
                    hidden: !me.matrix,
                    disabled: !me.matrix
                }, {
                    xtype: 'actioncolumn',
                    //header: climatestation.Utils.getTranslation('actions'),   // 'Edit draw properties',
                    width: 30,
                    align: 'left',
                    hidden: !me.tplChartView || me.matrix,
                    disabled: me.matrix,
                    items: [{
                        // scope: me,
                        width: 30,
                        margin: 3,
                        disabled: false,
                        getClass: function (v, meta, rec) {
                            return 'chart-curve_edit size24';
                        },
                        getTip: function (v, meta, rec) {
                            return climatestation.Utils.getTranslation('edittimeseriesdrawproperties') + ' ' + rec.get('productcode') + ' - ' + rec.get('subproductcode');
                        },
                        handler: 'editTSDrawProperties'
                    }]
                }]
            }
        };

        me.colorschemesProduct = null;
        if (me.matrix) {
            me.colorschemesProduct = {
                xtype: 'grid',
                // id: 'colorschemesMatrixTSProductGrid_'+me.idpostfix,
                reference: 'colorschemesMatrixTSProductGrid_'+me.idpostfix,
                autoWidth: true,
                minWidth: 385,
                maxWidth: maxwidth,
                maxHeight: 170,
                // scrollable: 'vertical',
                scrollable: true,
                hidden: true,
                bind: '{productcolorschemes}',
                // layout: 'fit',
                margin: '0 3 10 3',
                flex: 1,

                viewConfig: {
                    stripeRows: false,
                    enableTextSelection: true,
                    draggable: false,
                    markDirty: false,
                    resizable: false,
                    disableSelection: false,
                    trackOver: false,
                    scrollable: 'vertical'
                },

                selModel: {
                    allowDeselect: true
                },
                reserveScrollbar: true,
                collapsible: false,
                enableColumnMove: false,
                enableColumnResize: false,
                multiColumnSort: false,
                columnLines: false,
                rowLines: true,
                frame: false,
                border: 1,
                bodyBorder: true,
                forceFit: true,

                listeners: {
                    rowclick: 'onRadioColumnAction'
                },

                columns: {
                    defaults: {
                        menuDisabled: true,
                        sortable: false,
                        variableRowHeight: false,
                        draggable: false,
                        groupable: false,
                        hideable: false,
                        stopSelection: false,
                        // shrinkWrap: 0
                    },
                    items: [{
                        xtype: 'actioncolumn',
                        maxWidth: 30,
                        align: 'center',
                        items: [{
                            tooltip: climatestation.Utils.getTranslation('selectacolorscheme'),    // 'Select color scheme',
                            getClass: function (v, meta, rec) {
                                return rec.get('defaulticon');
                            }
                            //,handler: 'onRadioColumnAction'
                        }]
                    }, {
                        xtype: 'templatecolumn',
                        text: '<div class="grid-header-style">' + climatestation.Utils.getTranslation('colorschemes') + '</div>',
                        maxWidth: 350,
                        tpl: new Ext.XTemplate(
                            '{colorschemeHTML}' +
                            '<b>{colorbar}</b>'
                        )
                    }]
                }
            };
        }

        me.timeframeselection =  Ext.create('Ext.form.FieldSet', {
            xtype: 'fieldset',
            // id: 'ts_timeframe_'+me.idpostfix,
            reference: 'ts_timeframe',
            title: '<b style="font-size:16px; color:#0065A2; line-height: 18px;">' + climatestation.Utils.getTranslation('timeframe') + '</b>',
            hidden: false,
            autoWidth: true,
            minWidth: 385,
            maxWidth: maxwidth,
            // autoHeight: true,
            height: 270,
            // flex: 1,
            // border: 2,
            padding: 5,
            style: {
                // borderColor: '#157FCC',
                borderStyle: 'solid'
            }
            // layout: 'vbox'
        });

        me.fromtoSelection = {
            xtype: 'container',
            layout: {
                type: 'hbox',
                align: 'stretch'
            },
            layoutConfig: {columns: 3, rows: 1},
            margin: 5,
            items: [{
                xtype: 'radio',
                reference: 'radio_fromto',
                checked: true,
                name: 'ts-period_'+me.id,
                //inputValue: 'year',
                style: {"margin-right": "5px"},
                disabled: false
            }, {
                xtype: 'datefield',
                reference: 'ts_from_period',
                fieldLabel: climatestation.Utils.getTranslation('from'),    // 'From',
                labelAlign: 'left',
                labelWidth: 35,
                style: {"margin-right": "10px"},
                width: 180,
                format: "d/m/Y",
                emptyText: 'dd/mm/yyyy ',
                allowBlank: true,
                maxValue: new Date(),
                listeners: {
                    change: function () {
                        me.lookupReference("radio_fromto").setValue(true);
                        // Ext.getCmp("radio_fromto_"+me.idpostfix).setValue(true);
                    }
                }
            }, {
                xtype: 'datefield',
                reference: 'ts_to_period',
                fieldLabel: climatestation.Utils.getTranslation('to'),    // 'To',
                labelAlign: 'left',
                labelWidth: 20,
                style: {"margin-right": "10px"},
                width: 180,
                format: "d/m/Y",
                emptyText: 'dd/mm/yyyy ',
                allowBlank: true,
                //maxValue: new Date(),
                //,value: new Date()
                listeners: {
                    change: function () {
                        me.lookupReference("radio_fromto").setValue(true);
                        // Ext.getCmp("radio_fromto_"+me.idpostfix).setValue(true);
                    }
                }
            }]
        };

        me.yearSelection = {
            xtype: 'container',
            layout: {
                type: 'hbox'
            },
            layoutConfig: {columns: 3, rows: 1},
            margin: 5,
            hidden: false,
            items: [{
                xtype: 'radio',
                reference: 'radio_year',
                checked: false,
                align: 'middle',
                name: 'ts-period_'+me.id,
                //inputValue: 'year',
                //style: {"margin-right": "5px"},
                margin: '8 5 0 0',
                disabled: false
            }, {
                xtype: 'combobox',
                reference: 'YearTimeseries',
                name: 'YearTimeseries',
                bind: {
                    store: '{years}'        // me.getViewModel().get('years')   //
                },
                //store: '{years}',
                fieldLabel: climatestation.Utils.getTranslation('year'),    // 'Year',
                labelWidth: 40,
                labelAlign: 'left',
                width: 155,
                margin: '5 20 0 0',
                //colspan: 2,
                valueField: 'year',
                displayField: 'year',
                //publishes: ['year'],
                typeAhead: true,
                queryMode: 'local',
                emptyText: climatestation.Utils.getTranslation('select'),    // 'Select...',
                listeners: {
                    select: function () {
                        me.lookupReference("radio_year").setValue(true);
                        // Ext.getCmp("radio_year_"+me.idpostfix).setValue(true);
                    }
                }
            }, {
                xtype: 'fieldset',
                title: '<b>' + climatestation.Utils.getTranslation('season') + '</b>',
                layout: 'vbox',
                layoutConfig: {columns: 1, rows: 2},
                // margin: '0 0 0 20',
                width: 190,
                items: [{
                    xtype: 'datefield',
                    reference: 'ts_from_season',
                    fieldLabel: climatestation.Utils.getTranslation('from'),    // 'From',
                    labelAlign: 'left',
                    labelWidth: 35,
                    style: {"margin-right": "10px"},
                    width: 150,
                    format: "d/m",
                    emptyText: 'dd/mm ',
                    allowBlank: true,
                    showToday: false,
                    //maxValue: new Date(),
                    listeners: {
                        change: function () {
                            me.lookupReference("radio_year").setValue(true);
                            // Ext.getCmp("radio_year_"+me.idpostfix).setValue(true);
                        }
                    }
                }, {
                    xtype: 'datefield',
                    reference: 'ts_to_season',
                    fieldLabel: climatestation.Utils.getTranslation('to'),    // 'To',
                    labelAlign: 'left',
                    labelWidth: 35,
                    style: {"margin-right": "10px"},
                    width: 150,
                    format: "d/m",
                    emptyText: 'dd/mm',
                    allowBlank: true,
                    showToday: false,
                    //maxValue: new Date(),
                    //,value: new Date()
                    listeners: {
                        change: function () {
                            me.lookupReference("radio_year").setValue(true);
                            // Ext.getCmp("radio_year_"+me.idpostfix).setValue(true);
                        }
                    }
                }]
            }]
        };

        me.multipleyearsSelection = {
            xtype: 'container',
            reference: 'multiyears_selection',
            layout: {
                type: 'hbox',
                align: 'stretch'
            },
            layoutConfig: {columns: 3, rows: 1},
            margin: 5,
            items: [{
                xtype: 'radio',
                reference: 'radio_multiyears',
                checked: !me.fromto,
                name: 'ts-period_'+me.id,
                //inputValue: 'year',
                style: {"margin-right": "5px"},
                disabled: false
            }, {
                xtype: 'grid',
                reference: 'ts_selectmultiyears',
                //title: 'Year(s) of interest',
                sortableColumns: true,
                reserveScrollbar: true,
                columnLines: true,
                frame: true,
                border: false,
                cls: 'newpanelstyle',
                style: { "margin-right": "20px" },
                width: 160,
                height: 140,
                // selType: 'checkboxmodel',
                selModel: {
                    type: 'checkboxmodel',
                    allowDeselect:false,
                    toggleOnClick:false,
                    mode:'SIMPLE',
                    listeners: {
                        selectionchange: function () {
                            me.lookupReference("radio_multiyears").setValue(true);
                            // console.info(me.lookupReference('multiyears_selection').down('radio'));
                            // me.lookupReference('multiyears_selection').down('radio').setValue(true);
                            // Ext.getCmp("radio_multiyears_"+me.idpostfix).setValue(true);
                        }
                    }
                },
                bind: {
                    store: '{years}'
                },
                listeners: {
                    scrolltotop: function (events) {
                        var records = me.getViewModel().getStore('years').getData().items;
                        if (records.length > 0)
                            this.ensureVisible(records[0], {focus: true});
                    }
                },
                defaults: {
                    sortable: true
                },
                columns: [
                    {
                        text: '<span class="smalltext">' + climatestation.Utils.getTranslation('available_years')+ '</span>',     // 'Available Years',
                        width: 108,
                        dataIndex: 'year',
                        menuDisabled: true,
                        sortable: true,
                        // shrinkWrap: 0,
                        stopSelection: false
                    }
                ]
            }, {
                xtype: 'fieldset',
                title: '<b>' + climatestation.Utils.getTranslation('season') + '</b>',   // '<b>Season</b>',
                layout: 'vbox',
                layoutConfig: {columns: 1, rows: 2},
                width: 190,
                items: [{
                    xtype: 'datefield',
                    reference: 'ts_from_seasonmulti',
                    fieldLabel: climatestation.Utils.getTranslation('from'),    // 'From',
                    labelAlign: 'left',
                    labelWidth: 35,
                    style: {"margin-right": "10px"},
                    width: 150,
                    format: "d/m",
                    emptyText: 'dd/mm ',
                    allowBlank: true,
                    showToday: false,
                    //maxValue: new Date(),
                    listeners: {
                        change: function () {
                            me.lookupReference("radio_multiyears").setValue(true);
                            // Ext.getCmp("radio_multiyears_"+me.idpostfix).setValue(true);
                        }
                    }
                }, {
                    xtype: 'datefield',
                    reference: 'ts_to_seasonmulti',
                    fieldLabel: climatestation.Utils.getTranslation('to'),    // 'To',
                    labelAlign: 'left',
                    labelWidth: 35,
                    style: {"margin-right": "10px"},
                    width: 150,
                    format: "d/m",
                    emptyText: 'dd/mm',
                    allowBlank: true,
                    showToday: false,
                    //maxValue: new Date(),
                    //,value: new Date()
                    listeners: {
                        change: function () {
                            me.lookupReference("radio_multiyears").setValue(true);
                            // Ext.getCmp("radio_multiyears_"+me.idpostfix).setValue(true);
                        }
                    }
                }]
            }]
        };

        // me.compareyearsSelection = {
        //     layout: 'hbox',
        //     layoutConfig: {columns: 3, rows: 1},
        //     margin: 5,
        //     items: [{
        //         xtype: 'radio',
        //         reference: 'radio_compareyears',
        //         checked: false,
        //         name: 'ts-period_'+me.idpostfix,
        //         //inputValue: 'year',
        //         style: {"margin-right": "5px"},
        //         disabled: false
        //     }, {
        //         xtype: 'multiselector',
        //         reference: 'ts_selectyearstocompare',
        //         title: climatestation.Utils.getTranslation('years_of_interest'),    // 'Year(s) of interest',
        //         cls: 'newpanelstyle',
        //         style: { "margin-right": "20px" },
        //         width: 160,
        //         height: 105,
        //         border: false,
        //         fieldName: 'year',
        //         viewConfig: {
        //             deferEmptyText: false,
        //             emptyText: climatestation.Utils.getTranslation('no_years_selected')  // 'No years selected'
        //         },
        //         search: {
        //             field: 'year',
        //             searchText: '',
        //             bind: {
        //                 store: '{years}'
        //             },
        //             cls: 'newpanelstyle',
        //             modal: false,
        //             shadow: false,
        //             border: false,
        //             frame: false,
        //             layout: '',
        //             floating: true,
        //             resizable: false,
        //             width: 110,
        //             height: 100,
        //             minWidth: 110,
        //             minHeight: 100,
        //             listeners: {
        //                 activate: function () {
        //                     me.lookupReference("radio_compareyears").setValue(true);
        //                     // Ext.getCmp("radio_compareyears_"+me.idpostfix).setValue(true);
        //                 },
        //                 show: function () {
        //                     me.lookupReference("radio_compareyears").setValue(true);
        //                     // Ext.getCmp("radio_compareyears_"+me.idpostfix).setValue(true);
        //                 }
        //             }
        //         },
        //         listeners: {
        //             containerclick: function () {
        //                 me.lookupReference("radio_compareyears").setValue(true);
        //                 // Ext.getCmp("radio_compareyears_"+me.idpostfix).setValue(true);
        //             },
        //             itemclick: function () {
        //                 me.lookupReference("radio_compareyears").setValue(true);
        //                 // Ext.getCmp("radio_compareyears_"+me.idpostfix).setValue(true);
        //             }
        //         }
        //
        //     }, {
        //         xtype: 'fieldset',
        //         //flex: 1,
        //         title: '<b>' + climatestation.Utils.getTranslation('compare_seasons') + '</b>',  // 'Compare seasons'
        //         layout: 'column',
        //         //layoutConfig: {columns: 2, rows: 2},
        //         defaults: {
        //             //anchor: '100%',
        //             //hideEmptyLabel: false
        //             layout: 'form',
        //             xtype: 'container',
        //             style: 'width: 50%'
        //         },
        //         items: [{
        //             items: [{
        //                 xtype: 'datefield',
        //                 reference: 'ts_from_seasoncompare',
        //                 fieldLabel: climatestation.Utils.getTranslation('from'),    // 'From',
        //                 labelAlign: 'left',
        //                 labelWidth: 35,
        //                 style: {"margin-right": "10px"},
        //                 width: 160,
        //                 format: "d/m",
        //                 emptyText: 'dd/mm ',
        //                 allowBlank: true,
        //                 showToday: false,
        //                 //maxValue: new Date(),
        //                 listeners: {
        //                     change: function () {
        //                         me.lookupReference("radio_compareyears").setValue(true);
        //                         // Ext.getCmp("radio_compareyears_"+me.idpostfix).setValue(true);
        //                     }
        //                 }
        //             }, {
        //                 xtype: 'datefield',
        //                 reference: 'ts_to_seasoncompare',
        //                 fieldLabel: climatestation.Utils.getTranslation('to'),    // 'To',
        //                 labelAlign: 'left',
        //                 labelWidth: 20,
        //                 style: {"margin-right": "10px"},
        //                 width: 160,
        //                 format: "d/m",
        //                 emptyText: 'dd/mm',
        //                 allowBlank: true,
        //                 showToday: false,
        //                 //maxValue: new Date(),
        //                 //,value: new Date()
        //                 listeners: {
        //                     change: function () {
        //                         me.lookupReference("radio_compareyears").setValue(true);
        //                         // Ext.getCmp("radio_compareyears_"+me.idpostfix).setValue(true);
        //                     }
        //                 }
        //             }]
        //         }]
        //     }]
        // };

        if (me.fromto){
            me.timeframeselection.add(me.fromtoSelection);
        }
        if (me.year){
            me.timeframeselection.add(me.yearSelection);
        }
        // if (me.compareyears){
        //     me.timeframeselection.add(me.compareyearsSelection);
        // }
        if (me.multipleyears){
            me.timeframeselection.add(me.multipleyearsSelection);
        }

        // console.info(me.getViewModel().getStore('timeseriesproducts'));

        me.TimeseriesProductsStore = Ext.create('Ext.data.TreeStore', {
            model: 'climatestation.model.TimeseriesProduct',
            autoLoad: false,
            session: new Ext.data.Session(),
            loadMask: true,
            sorters: [ {property: 'display_index', direction: 'ASC'}]  // {property: 'mapsetcode', direction: 'DESC'},
            ,folderSort: true
            ,filterer: 'bottomup'

            ,proxy: {
                type: 'ajax',
                url: 'analysis/timeseriesproduct',
                reader: {
                     type: 'json'
                    // ,successProperty: 'success'
                    ,rootProperty: 'children'
                    // ,messageProperty: 'message'
                },
                listeners: {
                    exception: function(proxy, response, operation){
                        // ToDo: Translate message title or remove message, log error server side and reload proxy (could create and infinite loop?)!
                        console.info('TIMESERIES PRODUCT VIEW MODEL - REMOTE EXCEPTION - Reload timeseries product grid!');
                    }
                }
            }

        });


        me.productcategoriesAvailable = {
            xtype: 'treepanel',
            store: me.TimeseriesProductsStore,
            // bind:'{timeseriesproducts}',
            reserveScrollbar: true,
            useArrows: true,
            rootVisible: false,
            multiSelect: false,
            singleExpand: true,
            root: {
                text: 'Products',
                // id: 'timeseriesproductdata',
                expanded: true
            },

            reference: 'availableproducts' + me.id,
            // title: climatestation.Utils.getTranslation('products'),  // 'Products',
            border: true,
            frame: false,
            // autoWidth: true,
            // minWidth: 360,
            // maxWidth: climatestation.Utils.objectExists(me.tplChartView) ? 360 : maxwidth,
            width: 455,
            flex: 1,
            height: 300,
            collapsible: true,
            bodyPadding: '0 0 0 0',
            style: {
                "font-size": 16
            },
            // layout: {
            //     // layout-specific configs
            //     type: 'accordion',
            //     titleCollapse: true,
            //     animate: false,
            //     activeOnTop: true
            // },
            defaults: {
                margin: '0 0 1 0',
                padding: '0 0 0 0'
            },
            plugins: {
                gridfilters: true
            },
            tools: [{
                type: 'refresh',
                tooltip: climatestation.Utils.getTranslation('refreshproductlist'),  // 'Refresh product list',
                callback: function (grid) {
                    // var timeseriesProductsStore = Ext.getStore('TimeseriesProductsStore');
                    // //var timeseriesProductsStore = me.getViewModel().getStore('products');
                    if (me.TimeseriesProductsStore.isStore) {
                        me.TimeseriesProductsStore.proxy.extraParams = {force: true};
                        me.TimeseriesProductsStore.reload({
                            callback: function (records, options, success) {
                                // var productpanelitems = me.lookupReference('productcategories');
                                // productpanelitems.removeAll();
                                // productpanelitems.fireEvent('afterrender');
                            }
                        });
                    }
                }
            }],

            header: {
                padding: '0 10px 0 10px',
                itemPosition: 0, // after title before collapse tool
                items: [{
                    xtype: 'combobox',
                    store: 'categories',
                    reference: 'categoriesCombo',
                    valueField: 'category_id',
                    displayField: 'descriptive_name',
                    // itemTpl: '<div class=""><span>{mapsetcode}</span>{descriptive_name}</div>',
                    width: 165,
                    padding: 0,
                    allowBlank: false,
                    typeAhead: false,
                    queryMode: 'local',
                    emptyText: climatestation.Utils.getTranslation('selectanacategory'),    // 'Select a category...'
                    listeners:{
                         scope: me.productcategoriesAvailable,
                         select: function(combo, rec, scope){
                             // var timeseriesProductsStore = Ext.getStore('TimeseriesProductsStore');
                             // Filter the TimeseriesProductsStore
                             me.TimeseriesProductsStore.setFilters({
                                property: 'category_id'
                                ,value: rec.get('category_id')
                                ,anyMatch: true
                             });
                         }
                    }
                },{
                    xtype : 'displayfield',
                    fieldLabel: climatestation.Utils.getTranslation('productcategory'),    // TODO add 'Product category',
                    padding: '0 0 0 5px',
                    width: 150,
                    labelWidth: 130,
                    labelSeparator : ''
                }]
            },
            // features: [{
            //     reference: 'tsproductcategories',
            //     ftype: 'grouping',
            //     groupHeaderTpl: Ext.create('Ext.XTemplate', '<div class="group-header-style">{name} ({children.length})</div>'),
            //     hideGroupedHeader: true,
            //     enableGroupingMenu: false,
            //     startCollapsed : true,
            //     depthToIndent: 150,
            //     groupByText: climatestation.Utils.getTranslation('productcategories')  // 'Product categories'
            // }],
            listeners: {
                afterrender: function (treegrid) {
                    var categoriesCombo = me.lookupReference('categoriesCombo');
                    // var timeseriesProductsStore = Ext.getStore('TimeseriesProductsStore');
                    var categoriesStoreData = Ext.getStore('categories').getData();
                    me.suspendLayouts();

                    // timeseriesProductsStore.proxy.extraParams = {force: true};
                    if (!me.TimeseriesProductsStore.isLoaded() || me.TimeseriesProductsStore.count() < 1) {
                        me.TimeseriesProductsStore.load({
                            callback: function (records, options, success) {
                                categoriesCombo.setValue(categoriesStoreData.items[0].get('category_id'));
                                // Filter the TimeseriesProductsStore
                                me.TimeseriesProductsStore.setFilters({
                                    property: 'category_id'
                                    , value: categoriesStoreData.items[0].get('category_id')
                                    , anyMatch: true
                                });
                                me.resumeLayouts();
                            }
                        });
                    }
                    else {
                        categoriesCombo.setValue(categoriesStoreData.items[0].get('category_id'));
                        // Filter the TimeseriesProductsStore
                        me.TimeseriesProductsStore.setFilters({
                            property: 'category_id'
                            , value: categoriesStoreData.items[0].get('category_id')
                            , anyMatch: true
                        });
                        me.resumeLayouts();
                    }

                    // var delay = 0;
                    // var myLoadMask = new Ext.LoadMask({
                    //     msg: climatestation.Utils.getTranslation('loading'), // 'Loading...',
                    //     target: me
                    // });
                    //
                    // if (!timeseriesProductsStore.isLoaded()) {
                    //     delay = 500;
                    //     // myLoadMask.show();
                    // }
                    // else if (timeseriesProductsStore.count() < 1){
                    //     timeseriesProductsStore.proxy.extraParams = {force: true};
                    //     timeseriesProductsStore.reload({
                    //         callback: function (records, options, success) {
                    //             myLoadMask.hide();
                    //         }
                    //     });
                    // }
                    //
                    // var task = new Ext.util.DelayedTask(function () {
                    //     if (!timeseriesProductsStore.isLoaded()) {
                    //         delay = 500;
                    //         task.delay(delay);
                    //     }
                    //     else {
                    //         myLoadMask.hide();
                    //         //me.lookupReference('productcategories').removeAll();
                    //         me.getViewModel().getStore('categories').each(function (record) {
                    //             me.lookupReference('productcategories').add({
                    //                 xtype: 'timeseriescategoryproducts',
                    //                 reference: 'productsPanel_' + record.get('category_id') + '_' + me.id,
                    //                 categoryid: record.get('category_id'),
                    //                 categoryname: record.get('descriptive_name'),
                    //                 title: '<span class="categorytitle"> ' + record.get('descriptive_name') + '</span>',
                    //                 graphtype: me.graphtype,
                    //                 cumulative: me.cumulative,
                    //                 multiplevariables: me.multiplevariables
                    //             });
                    //         });
                    //     }
                    // });
                    // task.delay(delay);
                }
            },
            columns: [{
                xtype: 'treecolumn', // this is so we know which column will show the tree
                text: '',
                width: 25,
                // flex: 2,
                sortable: true
            },{
                xtype: 'actioncolumn',
                hidden: false,
                width: 25,
                align: 'center',
                // shrinkWrap: 0,
                padding: 0,
                variableRowHeight: true,
                items: [{
                    getClass: function (v, meta, rec) {
                        if (!rec.get('leaf')){
                            return '';
                        }
                        else {
                            return 'far fa-plus-circle green';
                        }
                    },
                    getTip: function (v, meta, rec) {
                        if (!rec.get('leaf')){
                            return '';
                        }
                        else {
                            return climatestation.Utils.getTranslation('add_to_selected');   // 'Add to selected'
                        }
                    },
                    handler: 'TimeseriesProductsGridRowClick'       //  rowclick event takes over!
                }]
            },{
                xtype: 'templatecolumn',
                width: 350,
                //minWidth: 275,
                cellWrap: true,
                tpl: new Ext.XTemplate(
                    '<tpl if="leaf">',
                    '<b>{product_descriptive_name}</b>',
                    '<tpl else>',
                    '<b>{product_descriptive_name}</b>',
                    '</tpl>',
                    '<tpl if="version != \'undefined\'">',
                    '<b class="smalltext"> - {version}</b>',
                    '</tpl>',
                    '<tpl if="leaf">',
                    '</br>',
                    '<b class="smalltext" style="color:darkgrey;">{productcode} - {subproductcode}</b>',
                    '<b class="smalltext"> - {mapset_name}</b>',
                    '<tpl else>',
                    '<b class="smalltext" style="color:darkgrey;"> - {productcode}</b>',
                    '</br>',
                    '<b class="smalltext">   {mapset_name}</b>',
                    '</tpl>',

                    // ,'<span>&nbsp;&nbsp;(display_index: <b style="color:black">{display_index}</b>)</span>'
                    //'<tpl for="productmapsets">',
                    //'<b class="smalltext"> - {descriptive_name}</b>',
                    //'</tpl>'
                )
            },{
                xtype: 'actioncolumn',
                //header: climatestation.Utils.getTranslation('active'),   // 'Active',
                hidden: false,
                hideable: false,
                width: 25,
                align: 'center',
                // shrinkWrap: 0,
                variableRowHeight:true,
                items: [{
                    getClass: function(v, meta, rec) {
                        return 'info';
                    },
                    getTip: function(v, meta, rec) {
                        if (rec.get('leaf')){
                            return rec.get('product_description');
                        }
                        else {
                            return rec.get('group_product_description');
                        }
                    },
                    handler: function(grid, rowIndex, colIndex, icon, e, record) {

                    }
                }]
            }]
        };

        if (climatestation.Utils.objectExists(me.tplChartView)){
            // me.layout = {
            //     type: 'table',
            //     columns: 2,
            //     tdAttrs: {
            //         valign: 'top'
            //     }
            // };
            me.layout = {
                type: 'hbox',
                align: 'stretch'
            }

            me.items = [
                me.productcategoriesAvailable
                // xtype: 'container',
                // items: [
                //     me.productcategoriesAvailable
                // ]
            , {
                xtype: 'container',
                items: [
                    me.selectedtimeseries,
                    me.colorschemesProduct,
                    me.timeframeselection
                ]
            }];
        }
        else {
            me.items = [
                me.productcategoriesAvailable,
                me.selectedtimeseries,
                me.colorschemesProduct,
                me.timeframeselection
            ];
        }

        me.callParent();

    }
});



// Ext.define("climatestation.view.analysis.timeseriesCategoryProducts",{
//     extend: "Ext.grid.Panel",
//
//     requires: [
//         "climatestation.view.analysis.timeseriesProductSelectionController",
//         "climatestation.view.analysis.timeseriesProductSelectionModel",
//         'Ext.util.DelayedTask',
//         'climatestation.Utils'
//     ],
//
//     controller: "analysis-timeseriesproductselection",
//     viewModel: {
//         type: "analysis-timeseriesproductselection"
//     },
//     xtype: 'timeseriescategoryproducts',
//
//     //title: climatestation.Utils.getTranslation('products'),  // 'Products',
//     //reference: 'TimeSeriesCategoryProductsGrid',
//
//     //bind: '{products}',
//     session: true,
//     viewConfig: {
//         stripeRows: false,
//         enableTextSelection: true,
//         draggable: false,
//         markDirty: false,
//         resizable: false,
//         disableSelection: false,
//         trackOver: true
//     },
//     layout: 'fit',
//     autoWidth: true,
//     maxWidth: 440,
//     height: 400,
//     hideHeaders: true,
//
//     //selType: 'checkboxmodel',
//     //selModel: {
//     //    allowDeselect: true,
//     //    checkOnly: false,
//     //    mode: 'SIMPLE'
//     //    //,listeners: {}
//     //},
//
//     collapsible: false,
//     enableColumnMove: false,
//     enableColumnResize: true,
//     multiColumnSort: false,
//     columnLines: false,
//     rowLines: true,
//     frame: false,
//     border: false,
//     bodyBorder: false,
//     forceFit: true,
//     reserveScrollbar: true,
//
//     //tools: [{
//     //    type: 'refresh',
//     //    tooltip: climatestation.Utils.getTranslation('refreshproductlist'),  // 'Refresh product list',
//     //    callback: function (grid) {
//     //        var timeseriesProductsStore = grid.getStore('products');
//     //
//     //        if (timeseriesProductsStore.isStore) {
//     //            timeseriesProductsStore.load();
//     //        }
//     //    }
//     //}],
//     //
//     //onRender: function() {
//     //    var me = this;
//     //    me.callParent(arguments);
//     //    if(me.border){
//     //        me.el.setStyle("border","1px solid #333");
//     //    }
//     //
//     //},
//
//     cls: 'group-header-style',      // grid-color-yellow
//     style: {"margin-right": "15px", cursor: 'pointer'},
//
//     features: [{
//         reference: 'timeseriesproductcategories',
//         ftype: 'grouping',
//         groupHeaderTpl: Ext.create('Ext.XTemplate',
//             '<div class="product-group-header-style">',
//                 //'{[children[0].product_descriptive_name]}',
//             //'<tpl for="children">',
//             //    '<tpl if="timeseries_role == \'Initial\'">',
//             //        '<b>{product_descriptive_name}</b>',
//             //    '</tpl>',
//             //'</tpl>',
//             ' {name} <span style="color:black; font-size:12px;"> ({children.length})</span></div>'
//         ),
//         hideGroupedHeader: true,
//         enableGroupingMenu: false,
//         startCollapsed: true,
//         depthToIndent: 150
//         //,groupByText: climatestation.Utils.getTranslation('productcategories')  // 'Product category'
//     }],
//
//     //plugins: [{
//     //    ptype: 'rowexpander',
//     //    //cellWrap:true,
//     //    //layout:'fit',
//     //    useArrows: true,
//     //    rowBodyTpl: [
//     //        '<div class="subproducts"></div>'
//     //    ]
//     //    //rowBodyTpl: new Ext.XTemplate(
//     //    //    '<span class="smalltext">' +
//     //    //    '<p>{description}</p>' +
//     //    //    '</span>'
//     //    //)
//     //}],
//     //
//     //listeners: {
//     //    //afterrender: 'loadTimeseriesProductsGrid',
//     //    rowclick: 'TimeseriesProductsGridRowClick'
//     //},
//
//     categoryid: null,
//     categoryname: null,
//     graphtype: '',
//     cumulative: false,
//     multiplevariables: false,
//
//     initComponent: function () {
//         var me = this;
//         var productsStore = me.getViewModel().get('products');
//         me.store = productsStore;
//
//         me.listeners = {
//             rowclick: 'TimeseriesProductsGridRowClick',
//             beforerender: function(){
//                 var delay = 0;
//                 if (productsStore == null || !productsStore.isLoaded()){
//                     delay = 1000;
//                 }
//
//                 var task = new Ext.util.DelayedTask(function() {
//                     //if (productsStore.getFilters().items.length == 0) {
//                     productsStore.setFilters({
//                         property: 'category_id'
//                         ,value: me.categoryid
//                         ,anyMatch: true
//                     });
//                     //}
//                     if (!me.multiplevariables){
//                         productsStore.setFilters({
//                             property: 'date_format'
//                             ,value: 'YYYMMDD'
//                             ,anyMatch: true
//                         });
//                     }
//                     productsStore.setSorters({property: 'display_index', direction: 'ASC'});
//                     me.store = productsStore;
//                 });
//                 task.delay(delay);
//             }
//         };
//
//
//         me.columns = [{
//             xtype: 'actioncolumn',
//             hidden: false,
//             width: 25,
//             align: 'center',
//             shrinkWrap: 0,
//             padding: 0,
//             variableRowHeight: true,
//             items: [{
//                 getClass: function (v, meta, rec) {
//                     return 'far fa-plus-circle green';
//                 },
//                 getTip: function (v, meta, rec) {
//                     return climatestation.Utils.getTranslation('add_to_selected');   // 'Add to selected'
//                 }
//                 //,handler: 'TimeseriesProductsGridRowClick'       //  rowclick event takes over!
//             }]
//         },{
//             xtype: 'templatecolumn',
//             width: 275,
//             //minWidth: 275,
//             cellWrap: true,
//             tpl: new Ext.XTemplate(
//                 '<b>{product_descriptive_name}</b>',
//                 '<tpl if="version != \'undefined\'">',
//                 '<b class="smalltext"> - {version}</b>',
//                 '</tpl>',
//                 '</br>',
//                 '<b class="smalltext" style="color:darkgrey;">{productcode} - {subproductcode}</b>',
//                 '<b class="smalltext"> - {mapset_name}</b>'
//                 // ,'<span>&nbsp;&nbsp;(display_index: <b style="color:black">{display_index}</b>)</span>'
//                 //'<tpl for="productmapsets">',
//                 //'<b class="smalltext"> - {descriptive_name}</b>',
//                 //'</tpl>'
//             )
//         },{
//             xtype: 'actioncolumn',
//             //header: climatestation.Utils.getTranslation('active'),   // 'Active',
//             hidden: false,
//             hideable: false,
//             width: 25,
//             align: 'center',
//             shrinkWrap: 0,
//             variableRowHeight:true,
//             items: [{
//                 getClass: function(v, meta, rec) {
//                     return 'info';
//                 },
//                 getTip: function(v, meta, rec) {
//                     return rec.get('product_description');
//                 },
//                 handler: function(grid, rowIndex, colIndex, icon, e, record) {
//
//                 }
//             }]
//         }];
//
//         me.callParent();
//     }
// });
