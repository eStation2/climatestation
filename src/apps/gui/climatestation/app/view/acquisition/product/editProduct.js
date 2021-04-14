
Ext.define("climatestation.view.acquisition.product.editProduct",{
    extend: "Ext.window.Window",
    controller: "acquisition-product-editproduct",
    viewModel: {
        type: "acquisition-product-editproduct"
    },
    xtype: "editproduct",

    requires: [
        'Ext.Action',
        'Ext.data.StoreManager',
        'Ext.form.FieldSet',
        'Ext.form.field.Number',
        'climatestation.Utils',
        'climatestation.store.CategoriesAllStore',
        'climatestation.store.DefinedByStore',
        'climatestation.view.acquisition.product.EumetcastSourceAdmin',
        'climatestation.view.acquisition.product.InternetSourceAdmin',
        'climatestation.view.acquisition.product.editIngestSubProduct',
        'climatestation.view.acquisition.product.editProductController',
        'climatestation.view.acquisition.product.editProductModel'
    ],

    // session:true,

    title: '',
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
    scrollable: true,
    maximizable: false,
    width: 735,
    height: Ext.getBody().getViewSize().height < 650 ? Ext.getBody().getViewSize().height-50 : Ext.getBody().getViewSize().height-100,
    maxHeight: 900,

    border: true,
    frame: true,
    fieldDefaults: {
        labelWidth: 120,
        labelAlign: 'left'
    },
    bodyPadding: '10 15 5 15',
    viewConfig: {forceFit:true},
    layout: 'vbox',

    params: {
        new: false,
        view: true,
        edit: false,
        product: null,
        orig_productcode: '',
        orig_version: ''
    },

    listeners:  {
        close: 'onClose'
    },

    initComponent: function () {
        let me = this;
        let user = climatestation.getUser();
        let width_fieldsets = 685;

        me.changes_saved = false;

        if (me.params.edit){
            me.setTitle('<span class="panel-title-style">' + climatestation.Utils.getTranslation('editproduct') + '</span>');
        }
        else if (me.params.view){
            me.setTitle('<span class="panel-title-style">' + climatestation.Utils.getTranslation('viewproduct') + '</span>');
        }
        else {
            me.setTitle('<span class="panel-title-style">' + climatestation.Utils.getTranslation('newproduct') + '</span>');
            me.height = 550;
        }

        me.listeners = {
            afterrender: function(){
                me.controller.setup();
            }
        };

        me.items = [{
            items: [{
                xtype: 'fieldset',
                title: '<div class="grid-header-style">'+climatestation.Utils.getTranslation('productinfo')+'</div>',   // '<b>Product info</b>',
                collapsible: false,
                width: width_fieldsets,
                padding: '10 5 10 10',
                defaults: {
                    disabled: me.params.view ? true : false,
                    labelWidth: 120
                },
                items:[{
                    xtype: 'container',
                    disabled: false,
                    width: width_fieldsets,
                    layout: 'hbox',
                    defaults: {
                        disabled: me.params.view ? true : false,
                        labelWidth: 120
                    },
                    items: [{
                        reference: 'category',
                        name: 'category',
                        //bind: '{product.category_id}',
                        xtype: 'combobox',
                        fieldLabel: climatestation.Utils.getTranslation('category'),    // 'Category',
                        width: 160+120,
                        allowBlank: false,
                        // store: 'categories',
                        store: {
                            type: 'categoriesall'
                        },
                        valueField: 'category_id',
                        displayField: 'descriptive_name',
                        typeAhead: false,
                        queryMode: 'local',
                        emptyText: climatestation.Utils.getTranslation('selectacategory')    // 'Select a category...'
                    },{
                        reference: 'activate_product_field',
                        name: 'activate_product_field',
                        xtype: 'checkboxfield',
                        boxLabel : climatestation.Utils.getTranslation('activate'),
                        labelWidth: 100,
                        inputValue: '0',
                        margin: '0 0 5 80',
                        hidden: (climatestation.Utils.objectExists(user) && user.userlevel == 1) ? false : true
                    }]
                },{
                    xtype: 'container',
                    disabled: false,
                    width: width_fieldsets,
                    layout: 'hbox',
                    padding: '10 5 10 0',
                    defaults: {
                        disabled: me.params.view ? true : false,
                        labelWidth: 120
                    },
                    items: [{
                        reference: 'productcode',
                        name: 'productcode',
                        //bind: '{product.productcode}',
                        xtype: 'textfield',
                        fieldLabel: climatestation.Utils.getTranslation('productcode'),    // 'Product code',
                        width: 160+120,
                        allowBlank: false
                    },{
                        reference: 'defined_by_field',
                        name: 'defined_by_field',
                        xtype: 'combobox',
                        fieldLabel: climatestation.Utils.getTranslation('definedby'),
                        labelWidth: 100,
                        width: 250,
                        margin: '0 0 5 80',
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
                },{
                    reference: 'version',
                    name: 'version',
                    //bind: '{product.version}',
                    xtype: 'textfield',
                    fieldLabel: climatestation.Utils.getTranslation('version'),    // 'Version',
                    width:160+120,
                    allowBlank: false
                },{
                    reference: 'provider',
                    name: 'provider',
                    //bind: '{product.provider}',
                    xtype: 'textfield',
                    fieldLabel: climatestation.Utils.getTranslation('provider'),    // 'Provider',
                    width:530,
                    allowBlank: true
                },{
                    reference: 'product_name',
                    name: 'product_name',
                    //bind: '{product.prod_descriptive_name}',
                    xtype: 'textfield',
                    fieldLabel: climatestation.Utils.getTranslation('product_name'),    // 'Product name',
                    width:530,
                    allowBlank: true
                }, {
                    reference: 'productdescription',
                    name: 'productdescription',
                    //bind: '{product.description}',
                    xtype: 'textareafield',
                    // xtype: 'htmleditor',
                    fieldLabel: climatestation.Utils.getTranslation('productdescription'),    // 'Product description',
                    labelAlign: 'top',
                    height: 80,
                    minHeight: 80,
                    anchor: '100%',
                    scrollable: true,
                    allowBlank: true,
                    // grow: true,
                    // growMax: 130,
                    // layout: 'fit',
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
                },{
                    xtype: 'button',
                    text: climatestation.Utils.getTranslation('save'),    // 'Save',
                    //scope:me,
                    iconCls: 'far fa-save',    // 'icon-disk',
                    style: { color: 'lightblue' },
                    scale: 'medium',
                    hidden: me.params.view ? true : false,
                    handler: 'saveProductInfo'
                }]
            }]
        },{
            items: [{
                xtype: 'fieldset',
                title: '<div class="grid-header-style">'+climatestation.Utils.getTranslation('datasources')+'</div>',   // '<b>Data sources</b>',
                reference: 'datasourcesfieldset',
                hidden: true,
                collapsible: false,
                padding: '10 10 10 10',
                width: width_fieldsets,

                items:[{
                    xtype: 'grid',
                    reference: 'productDataSourcesGrid',
                    //store: 'productdatasources',
                    bind:{
                        store:'{productdatasources}'
                    },
                    dockedItems: [{
                        xtype: 'toolbar',
                        dock: 'bottom',
                        // disabled: me.params.view ? true : false,
                        items: [
                            '->',
                            {
                                reference: 'addDataSource-btn',
                                text: climatestation.Utils.getTranslation('add'),    // 'Add',
                                iconCls: 'far fa-plus-circle',
                                style: { color: 'green' },
                                scale: 'medium',
                                disabled: false,
                                handler: 'addDataSource'
                            // },{
                            //     reference: 'unassignDataSource-btn',
                            //     text: climatestation.Utils.getTranslation('unassign'),    // 'Unassign',
                            //     iconCls: 'far fa-chain-broken',
                            //     style: { color: 'red' },
                            //     scale: 'medium',
                            //     disabled: true,
                            //     handler: 'unassignDataSource'
                            }
                            // addDataSourceAction, unassignDataSourceAction
                        ]
                    }],

                    viewConfig: {
                        stripeRows: false,
                        enableTextSelection: true,
                        draggable: false,
                        markDirty: false,
                        resizable: false,
                        disableSelection: false,
                        trackOver: true
                    },

                    // selModel: {
                    //     allowDeselect: true
                    //     ,listeners: {
                    //         selectionchange: function (sm, selections) {
                    //             // if (selections.length) {
                    //             //     me.lookupReference('unassignDataSource-btn').enable();
                    //             //     // unassignDataSourceAction.enable();
                    //             // } else {
                    //             //     me.lookupReference('unassignDataSource-btn').disable();
                    //             //     // unassignDataSourceAction.disable();
                    //             // }
                    //         }
                    //     }
                    // },

                    layout: 'fit',
                    autoHeight: true,
                    minHeight: 105,
                    collapsible: false,
                    enableColumnMove: false,
                    enableColumnResize: true,
                    multiColumnSort: false,
                    columnLines: false,
                    rowLines: true,
                    frame: false,
                    border: true,

                    cls: 'grid-column-header-multiline',

                    // defaults: {
                    //     disabled: me.params.view ? true : false
                    // },

                    columns: [{
                        xtype: 'actioncolumn',
                        hidden: false,
                        width: 40,
                        align: 'center',
                        sortable: false,
                        menuDisabled: true,
                        items: [{
                            getClass: function (cell, meta, rec) {
                                // console.info(rec.get('defined_by'));
                                // data sources are always editable by the user. so will not enter the else!
                               if (!rec.get('defined_by').includes('JRC') || (climatestation.Utils.objectExists(user) && user.userlevel <= 1)) {
                                   return 'far fa-edit';
                               }
                               else {
                                   // return 'x-hide-display';
                                   return 'far fa-eye';
                               }
                            },
                            getTip: function (cell, meta, rec) {
                               if (!rec.get('defined_by').includes('JRC') || (climatestation.Utils.objectExists(user) && user.userlevel <= 1)) {
                                   return climatestation.Utils.getTranslation('editdatasource')    // 'Edit Data Source',
                               }
                            },
                            handler: 'editDataSource'
                        }]
                    }, {
                        header: climatestation.Utils.getTranslation('type'),    // 'Type',
                        dataIndex: 'type',
                        //bind: '{productdatasources.type}',
                        width: 110,
                        sortable: false,
                        hideable: false,
                        variableRowHeight: true,
                        menuDisabled: true
                    }, {
                        header: climatestation.Utils.getTranslation('id'),    // 'ID',
                        dataIndex: 'data_source_id',
                        //bind: '{productdatasources.data_source_id}',
                        width: 270,
                        sortable: false,
                        hideable: false,
                        variableRowHeight: true,
                        menuDisabled: true
                    }, {
                        xtype: 'actioncolumn',
                        header: climatestation.Utils.getTranslation('storenative'),    // 'Active',
                        hideable: false,
                        hidden: false,
                        menuDisabled: true,
                        width: 130,
                        align: 'center',
                        shrinkWrap: 0,
                        items: [{
                            // scope: me,
                            disabled: false,
                            getClass: function(cell, meta, rec) {
                                if (rec.get('store_original_data')) {
                                    return 'far fa-check-square green';   // 'activated';
                                } else {
                                    return 'far fa-square green';   // 'deactivated';
                                }
                            },
                            getTip: function(cell, meta, rec) {
                                if (rec.get('store_original_data')) {
                                    return climatestation.Utils.getTranslation('tipdeactivatestoreoriginalget');     // 'Deactivate store original data for this Get';
                                } else {
                                    return climatestation.Utils.getTranslation('tipactivatestoreoriginalget');     // 'Activate store original data for this Get';
                                }
                            },
                            handler: function(grid, rowIndex, colIndex) {
                                let rec = grid.getStore().getAt(rowIndex),
                                    action = (rec.get('store_original_data') ? 'deactivated' : 'activated');
                                // Ext.toast({ html: action + ' ' + rec.get('productcode'), title: 'Action', width: 300, align: 't' });
                                rec.get('store_original_data') ? rec.set('store_original_data', false) : rec.set('store_original_data', true);
                                grid.up().up().changesmade = true;
                            }
                        }]
                    }, {
                        xtype: 'actioncolumn',
                        header: climatestation.Utils.getTranslation('active'),    // 'Active',
                        hideable: false,
                        hidden: false,
                        menuDisabled: true,
                        width: 70,
                        align: 'center',
                        shrinkWrap: 0,
                        items: [{
                            getClass: function (cell, meta, rec) {
                                if (rec.get('activated')) {
                                    return 'far fa-check-square green';   // 'activated';
                                } else {
                                    return 'far fa-square green';   // 'deactivated';
                                }
                            },
                            getTip: function (cell, meta, rec) {
                                if (rec.get('activated')) {
                                    return climatestation.Utils.getTranslation('deactivatedatasource');    // 'Deactivate Data Source';
                                } else {
                                    return climatestation.Utils.getTranslation('activatedatasource');    // 'Activate Data Source';
                                }
                            },
                            isActionDisabled: function (view, rowIndex, colIndex, item, record) {
                                // Returns true if 'editable' is false (, null, or undefined)
                                return false;    // !record.get('editable');
                            },
                            handler: function (grid, rowIndex, colIndex) {
                                let rec = grid.getStore().getAt(rowIndex),
                                    action = (rec.get('activated') ? 'deactivated' : 'activated');
                                // Ext.toast({ html: action + ' ' + rec.get('productcode'), title: 'Action', width: 300, align: 't' });
                                rec.get('activated') ? rec.set('activated', false) : rec.set('activated', true);
                                grid.up().up().changesmade = true;
                            }
                        }]
                    },{
                       xtype: 'actioncolumn',
                       hidden: false,
                       width: 35,
                       align: 'center',
                       sortable: false,
                       menuDisabled: true,
                       shrinkWrap: 0,
                       items: [{
                           width:'35',
                           isActionDisabled: function(view, rowIndex, colIndex, item, record){
                                return !(!record.get('defined_by').includes('JRC') || (climatestation.Utils.objectExists(user) && user.userlevel <= 1));
                           },
                           getClass: function(cell, meta, rec) {
                               // return 'far fa-trash-alt red';
                               if (!rec.get('defined_by').includes('JRC') || (climatestation.Utils.objectExists(user) && user.userlevel <= 1)){
                                   return 'far fa-trash-alt red';
                               }
                               else {
                                   // cell.setDisabled(true);
                                   return 'x-hide-display';
                               }
                           },
                           getTip: function(cell, meta, rec) {
                               if (!rec.get('defined_by').includes('JRC') || (climatestation.Utils.objectExists(user) && user.userlevel <= 1)){
                                   let tipText = climatestation.Utils.getTranslation('unassignproductdatasource') + ': <BR>' +
                                       '<b>' + me.lookupReference('product_name').getValue() + '</b>';

                                   if (me.lookupReference('version').getValue() != ''){
                                       tipText += '<b> - ' + me.lookupReference('version').getValue() + '</b>' ;
                                       // tipText += '<span class="smalltext">' + '<b> - ' + me.lookupReference('version').getValue() + '</b></span>' ;
                                   }

                                   tipText += '<b style="color:darkgrey;"> - ' + me.lookupReference('productcode').getValue() + '</b>';
                                   // tipText += '<span class="smalltext">' + '<b style="color:darkgrey"> - ' + me.lookupReference('productcode').getValue() + '</b></span>';
                                   return tipText;
                               }
                           },
                           handler: 'unassignDataSource'
                       }]
                    }]
                }]
            }]
        },{
            items: [{
                xtype: 'fieldset',
                title: '<div class="grid-header-style">'+climatestation.Utils.getTranslation('ingestedproducts')+'</div>',   // 'Ingested SubProducts',
                reference: 'ingestionsfieldset',
                hidden: true,
                collapsible:false,
                padding:'10 10 10 10',
                width: width_fieldsets,

                items:[{
                    xtype: 'grid',
                    reference: 'productIngestionsGrid',
                    //store: 'ingestsubproducts',
                    bind:{
                        store:'{ingestsubproducts}'
                    },
                    // session: true,
                    // stateful: false,

                    dockedItems: [{
                        xtype: 'toolbar',
                        dock: 'bottom',
                        disabled: me.params.view ? true : false,
                        items: [
                            '->',
                            {
                                reference: 'addIngestion-btn',
                                text: climatestation.Utils.getTranslation('add'),    // 'Add',
                                iconCls: 'far fa-plus-circle',
                                style: { color: 'green' },
                                scale: 'medium',
                                disabled: false,
                                handler: 'addIngestSubProduct'
                            // },{
                            //     reference: 'deleteIngestion-btn',
                            //     text: climatestation.Utils.getTranslation('delete'),    // 'Delete',
                            //     iconCls: 'far fa-trash-o',
                            //     style: { color: 'red' },
                            //     scale: 'medium',
                            //     disabled: true,
                            //     handler: 'deleteIngestion'
                            }
                        ]
                    }],

                    viewConfig: {
                        stripeRows: false,
                        enableTextSelection: true,
                        draggable: false,
                        markDirty: false,
                        resizable: false,
                        disableSelection: false,
                        trackOver: true
                    },

                    // selModel: {
                    //     allowDeselect: true
                    //     ,listeners: {
                    //         selectionchange: function (sm, selections) {
                    //             // if (selections.length) {
                    //             //     me.lookupReference('deleteIngestion-btn').enable();
                    //             //     // deleteIngestionAction.enable();
                    //             // } else {
                    //             //     me.lookupReference('deleteIngestion-btn').disable();
                    //             //     // deleteIngestionAction.disable();
                    //             // }
                    //         }
                    //     }
                    // },

                    layout: 'fit',
                    autoHeight: true,
                    minHeight: 105,
                    collapsible: false,
                    enableColumnMove: false,
                    enableColumnResize: true,
                    multiColumnSort: false,
                    columnLines: false,
                    rowLines: true,
                    frame: false,
                    border: true,

                    cls: 'grid-column-header-multiline',

                    // defaults: {
                    //     disabled: me.params.view ? true : false
                    // },

                    columns: [{
                        xtype: 'actioncolumn',
                        hidden: false,
                        width: 40,
                        align: 'center',
                        sortable: false,
                        menuDisabled: true,
                        items: [{
                            // icon: 'resources/img/icons/edit.png',
                            // tooltip: climatestation.Utils.getTranslation('editingestion'),    // 'Edit Ingestion',
                            getClass: function (cell, meta, rec) {
                                // console.info(rec.get('defined_by'));
                               if (!rec.get('defined_by').includes('JRC') || (climatestation.Utils.objectExists(user) && user.userlevel <= 1)) {
                                   return 'far fa-edit';
                               }
                               else {
                                   // return 'x-hide-display';
                                   return 'far fa-eye';
                               }
                            },
                            getTip: function (cell, meta, rec) {
                               if (!rec.get('defined_by').includes('JRC') || (climatestation.Utils.objectExists(user) && user.userlevel <= 1)) {
                                   return climatestation.Utils.getTranslation('editingestsubproduct')    // 'Edit Ingest Sub Product',
                               }
                            },
                            handler: 'editIngestSubProduct'
                        }]
                    }, {
                        xtype:'templatecolumn',
                        text: climatestation.Utils.getTranslation('subproduct'),
                        tpl: new Ext.XTemplate(
                                '<b>{descriptive_name}</b>' +
                                // '<tpl if="version != \'undefined\'">',
                                //     '<b class="smalltext"> - {version}</b>',
                                // '</tpl>',
                                '<BR><span class="smalltext"><b style="color:darkgrey;">' +
                                '{productcode}' +
                                '<tpl if="version != \'undefined\'">',
                                    ' - {version}',
                                '</tpl>',
                                ' - {subproductcode}' +
                                '</span></b>'
                            ),
                        width: 200,
                        cellWrap:true,
                        sortable: false,
                        hideable: false,
                        variableRowHeight : true,
                        menuDisabled:true
                    }, {
                        text: climatestation.Utils.getTranslation('scale_factor'),
                        headerWrap: true,
                        dataIndex: 'scale_factor',
                        width: 95,
                        sortable: false,
                        hideable: false,
                        variableRowHeight: true,
                        menuDisabled: true
                    }, {
                        text: climatestation.Utils.getTranslation('scale_offset'),
                        headerWrap: true,
                        dataIndex: 'scale_offset',
                        width: 95,
                        sortable: false,
                        hideable: false,
                        variableRowHeight: true,
                        menuDisabled: true
                    }, {
                        text: climatestation.Utils.getTranslation('nodata'),
                        headerWrap: true,
                        dataIndex: 'nodata',
                        width: 105,
                        sortable: false,
                        hideable: false,
                        variableRowHeight: true,
                        menuDisabled: true
                    },{
                        text: climatestation.Utils.getTranslation('definedby'),  // 'Defined by',
                        dataIndex: 'defined_by',
                        width: 90,
                        align: 'center',
                        menuDisabled: true,
                        sortable: false,
                        cellWrap:true,
                        hidden: (climatestation.Utils.objectExists(user) && user.userlevel == 1) ? false : true
                    },{
                       xtype: 'actioncolumn',
                       hidden: false,
                       width: 35,
                       align: 'center',
                       sortable: false,
                       menuDisabled: true,
                       shrinkWrap: 0,
                       items: [{
                           width:'35',
                           disabled: false,
                           getClass: function(cell, meta, rec) {
                               // return 'far fa-trash-alt red';
                               // console.info(rec);
                               if (!rec.get('defined_by').includes('JRC') || (climatestation.Utils.objectExists(user) && user.userlevel == 1)){
                                   return 'far fa-trash-alt red';
                               }
                               else {
                                   // cell.setDisabled(true);
                                   return 'x-hide-display';
                               }
                           },
                           getTip: function(cell, meta, rec) {
                               if (!rec.get('defined_by').includes('JRC') || (climatestation.Utils.objectExists(user) && user.userlevel == 1)){
                                   let tipText = climatestation.Utils.getTranslation('delete_ingest_product') + ': <BR>' +
                                       '<b>' + rec.get('descriptive_name') + '</b>';

                                   if (rec.get('version') != ''){
                                       tipText += '<b> - ' + rec.get('version') + '</b>' ;
                                       // tipText += '<span class="smalltext">' + '<b> - ' + me.lookupReference('version').getValue() + '</b></span>' ;
                                   }

                                   tipText += '<b> - ' + rec.get('productcode') + '</b>';
                                   tipText += '<b> - ' + rec.get('subproductcode') + '</b>';
                                   // tipText += '<span class="smalltext">' + '<b style="color:darkgrey"> - ' + me.lookupReference('productcode').getValue() + '</b></span>';
                                   return tipText;
                               }
                           },
                           handler: 'deleteIngestSubProduct'
                       }]
                    }]
                }]

            }]
        }];

        me.callParent();
    }
});
