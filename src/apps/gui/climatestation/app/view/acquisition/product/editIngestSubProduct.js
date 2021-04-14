
Ext.define("climatestation.view.acquisition.product.editIngestSubProduct",{
    extend: "Ext.window.Window",
    controller: "acquisition-product-editingestsubproduct",
    viewModel: {
        type: "acquisition-product-editingestsubproduct"
    },

    xtype: 'editingestsubproduct',

    requires: [
        'Ext.data.StoreManager',
        'Ext.layout.container.Center',
        'climatestation.Utils',
        'climatestation.store.DataTypesStore',
        'climatestation.store.DateFormatsStore',
        'climatestation.store.DefinedByStore',
        'climatestation.store.FrequenciesStore',
        'climatestation.view.acquisition.product.editIngestSubProductController',
        'climatestation.view.acquisition.product.editIngestSubProductModel'
    ],

    bind: {
        title: '{title}'
    },
    header: {
        titlePosition: 0,
        titleAlign: 'center'
    },

    constrainHeader: true,
    //constrain: true,
    modal: true,
    closable: true,
    closeAction: 'hide', // 'destroy',
    resizable: true,
    scrollable: 'y',
    maximizable: false,

    width: 710,
    height: Ext.getBody().getViewSize().height < 650 ? Ext.getBody().getViewSize().height-50 : Ext.getBody().getViewSize().height-200,
    maxHeight: 760,

    frame: true,
    border: true,
    // bodyStyle: 'padding:5px 0px 0',

    viewConfig:{forceFit:true},
    layout:'vbox',

    params: {
        // productcode: null,
        // version: null,
        // category_id: null,
        // provider: null,
        // defined_by: null,
        // product_type: 'Ingest'
        create: false,
        view: true,
        edit: false,
        ingestsubproductrecord: null,
        orig_subproductcode: null
    },

    initComponent: function () {
        let me = this;
        me.changes_saved = false;
        let labelwidth = 120;
        let user = climatestation.getUser();
        let categoriesall = Ext.data.StoreManager.lookup('categoriesall');
        categoriesall.load();
        let categoryrec = categoriesall.findRecord('category_id', me.params.ingestsubproductrecord.get('category_id'), 0, true, false, false);

        me.params.categoryname = categoryrec.get('descriptive_name');

        if (me.params.edit){
            me.setTitle('<span class="panel-title-style">' + climatestation.Utils.getTranslation('editingestsubproduct') + '</span>');
            me.params.orig_subproductcode = me.params.ingestsubproductrecord.get('subproductcode');
        }
        else {
            me.setTitle('<span class="panel-title-style">' + climatestation.Utils.getTranslation('newingestsubproduct') + '</span>');
            me.height = 700;
        }

        me.listeners = {
            // beforerender: function(){
            //     let categoriesall = Ext.data.StoreManager.lookup('categoriesall');
            //     Ext.data.StoreManager.lookup('SubDatasourceDescriptionStore').load();
            //     categoriesall.load();
            //
            //     let categoryrec = categoriesall.findRecord('category_id', me.params.ingestsubproductrecord.get('category_id'), 0, true, false, false);
            //
            //     me.params.categoryname = categoryrec.get('descriptive_name');
            //     console.info(me);
            // },
            afterrender: function(){
                let frequenciesStore = Ext.data.StoreManager.lookup('frequencies');
                let dateformatsStore = Ext.data.StoreManager.lookup('dateformats');
                let datatypesStore = Ext.data.StoreManager.lookup('datatypes');
                if (!frequenciesStore.isLoaded()) frequenciesStore.load();
                if (!dateformatsStore.isLoaded()) dateformatsStore.load();
                if (!datatypesStore.isLoaded()) datatypesStore.load();
                me.controller.setup();
                // if (me.params.create){
                //     me.lookupReference('productid').setValue('');
                // }
            },
            close: function(){
                if (Ext.data.StoreManager.lookup('IngestSubProductsStore').getUpdatedRecords() !== []){
                    Ext.data.StoreManager.lookup('IngestSubProductsStore').rejectChanges();
                }

                if (me.changes_saved) {
                    Ext.data.StoreManager.lookup('IngestSubProductsStore').load();
                }
                me = null;
            }
        };

        me.items = [{
            xtype: 'form',
            reference: 'ingestsubproductform',
            border: false,
            // use the Model's validations for displaying form errors
            // modelValidation: true,
            fieldDefaults: {
                labelAlign: 'left',
                labelStyle: 'font-weight: bold;',
                msgTarget: 'right',
                preventMark: false
            },

            items: [{
                xtype: 'fieldset',
                title: '<div class="grid-header-style">' + climatestation.Utils.getTranslation('ingestsubproductdefinition') + '</div>',  // '<b>Ingested Sub Product definition</b>',
                reference: 'ingestsubproductinfofieldset',
                hidden: false,
                collapsible: false,
                padding: '0 10 10 10',
                margin: '10 10 10 15',
                width: 660,
                defaults: {
                    width: 630,
                    labelWidth: labelwidth,
                    msgTarget: 'side'
                },
                items: [{
                    xtype: 'container',
                    defaults: {
                        disabled: me.params.view ? true : false,
                        labelWidth: labelwidth,
                        padding: '0 10 0 10'
                    },
                    layout: {
                        type: 'hbox'
                        // , align: 'stretch'
                    },
                    items: [{
                        xtype: 'displayfield',
                        fieldLabel: climatestation.Utils.getTranslation('category'),
                        labelAlign: 'top',
                        reference: 'category',
                        value: me.params.categoryname,
                        // bind: '{theIngestSubProduct.category_id}',
                        allowBlank: false,
                        padding: '0 10 5 0',
                        cls:'greenbold',
                        width: 120
                    }, {
                        xtype: 'displayfield',
                        fieldLabel: climatestation.Utils.getTranslation('productcode'),
                        labelAlign: 'top',
                        reference: 'productcode',
                        bind: '{theIngestSubProduct.productcode}',
                        allowBlank: false,
                        cls:'greenbold',
                        width: 120
                    }, {
                        xtype: 'displayfield',
                        fieldLabel: climatestation.Utils.getTranslation('version'),
                        labelAlign: 'top',
                        reference: 'version',
                        bind: '{theIngestSubProduct.version}',
                        allowBlank: false,
                        cls:'greenbold',
                        width: 100
                    }, {
                        xtype: 'displayfield',
                        fieldLabel: climatestation.Utils.getTranslation('provider'),
                        labelAlign: 'top',
                        reference: 'provider',
                        bind: '{theIngestSubProduct.provider}',
                        cls:'greenbold',
                        width: 250
                    }]
                }, {
                    xtype: 'textfield',
                    fieldLabel: climatestation.Utils.getTranslation('subproductcode'),    // 'Sub product code',
                    reference: 'subproductcode',
                    bind: '{theIngestSubProduct.subproductcode}',
                    allowBlank: false,
                    width: 150 + labelwidth
                }, {
                    xtype: 'textfield',
                    fieldLabel: climatestation.Utils.getTranslation('product_name'),    // 'Product name',
                    reference: 'descriptive_name',
                    width: 610,
                    allowBlank: false,
                    bind: '{theIngestSubProduct.descriptive_name}'
                }, {
                    xtype: 'textareafield',
                    // xtype: 'htmleditor',
                    fieldLabel: climatestation.Utils.getTranslation('description'),    // 'Description',
                    reference: 'description',
                    // bind: '{theIngestSubProduct.description}',
                    labelAlign: 'top',
                    width: 610,
                    allowBlank: true,
                    // grow: true,
                    // growMax: 130,
                    height: 60,
                    minHeight: 60,
                    scrollable: true,

                    layout: 'fit',
                    resizable: true,
                    resizeHandles: 's',
                    // style: 'background: white;',
                    hidden: false
                    // enableAlignments: false,
                    // enableColors: true,
                    // enableFont: true,
                    // enableFontSize: true,
                    // enableFormat: true,
                    // enableLinks: false,
                    // enableLists: false,
                    // enableSourceEdit: true
                }, {
                    xtype: 'container',
                    defaults: {
                        disabled: me.params.view ? true : false,
                        labelWidth: labelwidth,
                        padding: '10 10 5 0'
                    },
                    layout: {
                        type: 'hbox'
                        , align: 'stretch'
                    },
                    items: [{
                        xtype: 'container',
                        defaults: {
                            disabled: me.params.view ? true : false,
                            labelWidth: 100,
                            padding: '0 10 5 10'
                        },
                        flex: 1,
                        layout: {
                            type: 'vbox'
                        },
                        items: [{
                            name: 'ingest_subproduct_frequency',
                            reference: 'ingest_subproduct_frequency',
                            xtype: 'combobox',
                            fieldLabel: climatestation.Utils.getTranslation('frequency'),    // 'Frequency',
                            width: 175 + labelwidth,
                            allowBlank: false,
                            bind: '{theIngestSubProduct.frequency_id}',
                            store: {
                                type: 'frequencies'
                            },
                            valueField: 'frequency_id',
                            displayField: 'frequency_id',
                            typeAhead: false,
                            queryMode: 'local',
                            emptyText: climatestation.Utils.getTranslation('selectafrequency')    // 'Select a frequency...'
                        }, {
                            name: 'ingest_subproduct_date_format',
                            reference: 'ingest_subproduct_date_format',
                            xtype: 'combobox',
                            fieldLabel: climatestation.Utils.getTranslation('date_format'),    // 'Date format',
                            width: 175 + labelwidth,
                            allowBlank: false,
                            bind: '{theIngestSubProduct.date_format}',
                            store: {
                                type: 'dateformats'
                            },
                            valueField: 'date_format',
                            displayField: 'date_format',
                            typeAhead: false,
                            queryMode: 'local',
                            emptyText: climatestation.Utils.getTranslation('selectadateformat')    // 'Select a date format...'
                        }, {
                            name: 'ingest_subproduct_data_type',
                            reference: 'ingest_subproduct_data_type',
                            xtype: 'combobox',
                            fieldLabel: climatestation.Utils.getTranslation('data_type'),    // 'Data type',
                            width: 175 + labelwidth,
                            allowBlank: false,
                            bind: '{theIngestSubProduct.data_type_id}',
                            store: {
                                type: 'datatypes'
                            },
                            valueField: 'data_type_id',
                            displayField: 'data_type_id',
                            typeAhead: false,
                            queryMode: 'local',
                            emptyText: climatestation.Utils.getTranslation('selectadatatype')    // 'Select a data type...'
                        }, {
                            xtype: 'numberfield',
                            fieldLabel: climatestation.Utils.getTranslation('scale_offset'),    // 'Scale offset',
                            reference: 'ingest_subproduct_scale_offset',
                            width: 100 + labelwidth,
                            allowBlank: true,
                            maxValue: 99999999.99999,
                            minValue: -99999999.99999,
                            allowDecimals: true,
                            decimalPrecision: 5,
                            decimalSeparator: '.',
                            hideTrigger: false,
                            bind: '{theIngestSubProduct.scale_offset}'
                        }, {
                            xtype: 'numberfield',
                            fieldLabel: climatestation.Utils.getTranslation('scale_factor'),    // 'Scale factor',
                            reference: 'ingest_subproduct_scale_factor',
                            width: 100 + labelwidth,
                            allowBlank: true,
                            maxValue: 99999999.99999,
                            minValue: -99999999.99999,
                            allowDecimals: true,
                            decimalPrecision: 5,
                            decimalSeparator: '.',
                            hideTrigger: false,
                            bind: '{theIngestSubProduct.scale_factor}'
                        }, {
                            xtype: 'numberfield',
                            fieldLabel: climatestation.Utils.getTranslation('nodata'),    // 'No data value',
                            reference: 'ingest_subproduct_nodata',
                            width: 100 + labelwidth,
                            allowBlank: true,
                            maxValue: 99999999.99999,
                            minValue: -99999999.99999,
                            allowDecimals: true,
                            decimalPrecision: 5,
                            decimalSeparator: '.',
                            hideTrigger: false,
                            bind: '{theIngestSubProduct.nodata}'
                        }]
                    }, {
                        xtype: 'container',
                        defaults: {
                            disabled: me.params.view ? true : false,
                            labelWidth: 130,
                            padding: '0 10 5 10'
                        },
                        flex: 1,
                        layout: {
                            type: 'vbox'
                        },
                        items: [{
                            xtype: 'numberfield',
                            fieldLabel: climatestation.Utils.getTranslation('mask_min'),    // 'Mask min',
                            reference: 'ingest_subproduct_mask_min',
                            width: 100 + 130,
                            allowBlank: true,
                            maxValue: 99999999,
                            minValue: -99999999,
                            allowDecimals: true,
                            hideTrigger: false,
                            bind: '{theIngestSubProduct.mask_min}'
                        }, {
                            xtype: 'numberfield',
                            fieldLabel: climatestation.Utils.getTranslation('mask_max'),    // 'Mask max',
                            reference: 'ingest_subproduct_mask_max',
                            width: 100 + 130,
                            allowBlank: true,
                            maxValue: 99999999,
                            minValue: -99999999,
                            allowDecimals: true,
                            hideTrigger: false,
                            bind: '{theIngestSubProduct.mask_max}'
                        }, {
                            xtype: 'textfield',
                            fieldLabel: climatestation.Utils.getTranslation('unit'),    // 'Unit',
                            reference: 'ingest_subproduct_unit',
                            width: 100 + 130,
                            allowBlank: true,
                            bind: '{theIngestSubProduct.unit}'
                        }, {
                            xtype: 'checkboxfield',
                            fieldLabel: climatestation.Utils.getTranslation('show_in_analysistool'),    // 'Show in Analysis tool',
                            reference: 'masked',
                            width: 100 + 130,
                            allowBlank: true
                            // ,bind: '{theIngestSubProduct.masked}'
                        }, {
                            xtype: 'checkboxfield',
                            fieldLabel: climatestation.Utils.getTranslation('enable_timeseries'),    // 'Enable time series',
                            reference: 'enable_in_timeseries',
                            width: 100 + 130,
                            allowBlank: true,
                            bind: '{theIngestSubProduct.enable_in_timeseries}'
                        },{
                            reference: 'defined_by_field',
                            xtype: 'combobox',
                            fieldLabel: climatestation.Utils.getTranslation('definedby'),
                            labelWidth: 100,
                            width: 150 + 100,
                            // margin: '0 0 5 80',
                            allowBlank: false,
                            editable: false,
                            store: {
                                type: 'definedby'
                            },
                            valueField: 'defined_by',
                            displayField: 'defined_by_descr',
                            typeAhead: false,
                            queryMode: 'local',
                            emptyText: climatestation.Utils.getTranslation('select'),    // 'Select...'
                            hidden: (climatestation.Utils.objectExists(user) && user.userlevel == 1) ? false : true
                        }]
                    }]
                },{
                    xtype: 'button',
                    text: climatestation.Utils.getTranslation('save'),    // 'Save',
                    iconCls: 'far fa-save',    // 'icon-disk',
                    style: {color: 'lightblue'},
                    scale: 'medium',
                    width: 135,
                    disabled: false,
                    handler: 'saveIngestSubProductInfo'
                }]
            }]
        },{
            items: [{
                xtype: 'fieldset',
                title: '<div class="grid-header-style">'+climatestation.Utils.getTranslation('datasourceingestparameters')+'</div>',   // '<b>Datasource Ingest parameters</b>',
                reference: 'ingestsubproductdatasourcesfieldset',
                hidden: true,
                collapsible: false,
                padding: '0 10 10 10',
                margin: '10 10 10 15',
                width: 660,

                items:[{
                    xtype: 'grid',
                    reference: 'ingestsubproductDataSourcesGrid',
                    //store: 'subdatasourcedescriptions',
                    bind:{
                        store:'{subdatasourcedescriptions}'
                    },
                    // session: true,
                    // stateful: false,

                    viewConfig: {
                        stripeRows: false,
                        enableTextSelection: true,
                        draggable: false,
                        markDirty: false,
                        resizable: false,
                        disableSelection: false,
                        trackOver: true
                    },

                    selModel: {
                        allowDeselect: true
                        ,listeners: {
                            selectionchange: function (sm, selections) {
                                // if (selections.length) {
                                //     me.lookupReference('unassignDataSource-btn').enable();
                                //     // unassignDataSourceAction.enable();
                                // } else {
                                //     me.lookupReference('unassignDataSource-btn').disable();
                                //     // unassignDataSourceAction.disable();
                                // }
                            }
                        }
                    },

                    layout: 'fit',
                    autoHeight: true,
                    minHeight: 105,
                    collapsible: false,
                    enableColumnMove: false,
                    enableColumnResize: false,
                    multiColumnSort: false,
                    columnLines: false,
                    rowLines: true,
                    frame: false,
                    border: true,

                    // defaults: {
                    //     disabled: me.params.view ? true : false
                    // },

                    columns: [{
                        header: climatestation.Utils.getTranslation('type'),    // 'Type',
                        dataIndex: 'pads_type',
                        // bind: '{subdatasourcedescriptions.pads_type}',
                        width: 120,
                        sortable: false,
                        hideable: false,
                        variableRowHeight: true,
                        menuDisabled: true
                    },{
                        header: climatestation.Utils.getTranslation('id'),    // 'ID',
                        dataIndex: 'pads_data_source_id',
                        // bind: '{subdatasourcedescriptions.pads_data_source_id}',
                        width: 250,
                        sortable: false,
                        hideable: false,
                        variableRowHeight: true,
                        menuDisabled: true
                    // },{
                    //     header: climatestation.Utils.getTranslation('description'),    // 'ID',
                    //     dataIndex: 'datasource_descriptivename',
                    //     // bind: '{subdatasourcedescriptions.datasource_descriptivename}',
                    //     width: 55,
                    //     sortable: false,
                    //     hideable: false,
                    //     variableRowHeight: true,
                    //     menuDisabled: true
                    },{
                        xtype: 'actioncolumn',
                        header: climatestation.Utils.getTranslation('ingestparameters'),    // 'ID',
                        hidden: false,
                        width: 140,
                        align: 'center',
                        sortable: false,
                        menuDisabled: true,
                        items: [{
                            getClass: function (v, meta, rec) {
                                // console.info(rec.get('ingestparameters'));
                               if (rec.get('productcode') != '' ) {
                                   return 'far fa-edit';
                               }
                               else {
                                   // return 'x-hide-display';
                                   return 'far fa-plus-circle';
                               }
                            },
                            getTip: function (v, meta, rec) {
                               if (rec.get('productcode') != '' ) {
                                   return climatestation.Utils.getTranslation('editingestparameters')    // 'Edit Ingest parameters',
                               }
                               else {
                                   return climatestation.Utils.getTranslation('addingestparameters')    // 'Add Ingest parameters',
                               }
                            },
                            handler: 'addEditIngestParameters'
                        }]
                    // },{
                    //    xtype: 'actioncolumn',
                    //    // header: 'Delete',
                    //    hidden: false,
                    //    width: 70,
                    //    align: 'center',
                    //    sortable: false,
                    //    menuDisabled: true,
                    //    items: [{
                    //        getClass: function(v, meta, rec) {
                    //            // return 'far fa-trash-alt red';
                    //            if (rec.get('productcode') != '' && (climatestation.Utils.objectExists(user) && user.userlevel == 1)){
                    //                return 'far fa-trash-alt red';
                    //            }
                    //            else {
                    //                return 'x-hide-display';
                    //            }
                    //        },
                    //        getTip: function(v, meta, rec) {
                    //            if (rec.get('productcode') != '' && (climatestation.Utils.objectExists(user) && user.userlevel == 1)){
                    //                var tipText = climatestation.Utils.getTranslation('deleteingestparameters') + ': <BR>' +
                    //                    '<b>' + rec.get('pads_data_source_id') + '</b>';
                    //                return tipText;
                    //            }
                    //        },
                    //        handler: 'deleteIngestParameters'
                    //    }]
                    }]
                }]
            }]
        }];

                // },{
                //     // xtype: 'container',
                //     // items: [{
                //     xtype: 'fieldset',
                //     title: '<div class="grid-header-style">'+climatestation.Utils.getTranslation('assignedmapset')+'</div>',   // '<b>Assigned mapset</b>',
                //     reference: 'ingestion-mapset-dataview',
                //     collapsible:false,
                //     border: true,
                //     padding:'10 10 10 10',
                //     margin: '10 10 10 5',
                //     defaults: {
                //         labelWidth: labelwidth
                //     },
                //     autoWidth: true,
                //     //height: 250,
                //     layout: 'fit',
                //
                //     items:[ Ext.create('Ext.view.View', {
                //         bind: '{ingestionmapset}',
                //         //reference: 'mapsets',
                //         //boxLabel: '{descriptive_name}',
                //         tpl: Ext.create('Ext.XTemplate',
                //             '<tpl for=".">',
                //             '<div class="mapset" id="{mapsetcode:stripTags}">',
                //             '<img src="{footprint_image}" title="{descriptive_name:htmlEncode}">',
                //             '<span><strong>{descriptive_name:htmlEncode}</strong></span>',
                //             '</div>',
                //             '</tpl>',
                //             '<div class="x-clear"></div>'
                //         ),
                //         multiSelect: false,
                //         height: 160,
                //         width: 140,
                //         trackOver: true,
                //         cls: 'mapsets',
                //         overItemCls: 'mapset-hover',
                //         itemSelector: 'div.mapset',
                //         emptyText: climatestation.Utils.getTranslation('nomapsetassignedtoingestion'),    // 'No Mapset assigned to Ingestion. Please assign a Mapset.',
                //         scrollable: true,
                //         listeners: {
                //             itemclick: 'mapsetItemClick'
                //         }
                //     }),{
                //         xtype: 'button',
                //         text: climatestation.Utils.getTranslation('assignmapset'),    // 'Assign a mapset',
                //         //scope:me,
                //         iconCls: 'far fa-plus-circle',
                //         style: { color: 'lightblue' },
                //         scale: 'medium',
                //         disabled: false,
                //         handler: 'AssignMapset'
                //     }]

        me.callParent();
    }
});
