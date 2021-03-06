Ext.define("climatestation.view.acquisition.product.ProductAdmin", {
    extend: "Ext.grid.Panel",

    controller: "acquisition-product-productadmin",
    viewModel: {
        type: "acquisition-product-productadmin"
    },
    xtype: "productadmin",

    requires: [
        'Ext.XTemplate',
        'Ext.data.StoreManager',
        'Ext.grid.column.Action',
        'climatestation.Utils',
        'climatestation.store.ProductsStore',
        'climatestation.view.acquisition.product.EumetcastSourceAdmin',
        'climatestation.view.acquisition.product.InternetSourceAdmin',
        'climatestation.view.acquisition.product.MapsetAdmin',
        'climatestation.view.acquisition.product.ProductAdminController',
        'climatestation.view.acquisition.product.ProductAdminModel',
        'climatestation.view.acquisition.product.editProduct'
    ],

    title: climatestation.Utils.getTranslation('productadministration'),  // 'Product Administration',
    header: {
        titlePosition: 0,
        titleAlign: 'center'
    },

    constrainHeader: true,
    //constrain: true,
    floating: true,
    modal: true,
    closable: true,
    // closeAction: 'destroy', // 'hide',
    resizable: true,
    resizeHandles: 'n,s',
    scrollable: 'y',    // vertical scrolling only
    maximizable: false,

    width: 720,
    height: Ext.getBody().getViewSize().height < 650 ? Ext.getBody().getViewSize().height - 10 : 650,  // 600,
    maxHeight: Ext.getBody().getViewSize().height,

    config: {
        changesmade: false,
        forceStoreLoad: false
    },

    listeners: {
        close: 'onClose'
    },

    store: 'ProductsStore',
    viewConfig: {
        stripeRows: false,
        enableTextSelection: true,
        draggable: false,
        markDirty: false,
        resizable: false,
        disableSelection: true,
        trackOver: true
    },

    bufferedRenderer: false,    // if true then the scrolling gives hickups so false
    // scrollable: 'y',    // vertical scrolling only
    collapsible: false,
    enableColumnMove: false,
    enableColumnResize: false,
    multiColumnSort: false,
    columnLines: false,
    rowLines: true,
    frame: false,
    border: false,

    initComponent: function () {
        let me = this;
        let user = climatestation.getUser();

        // me.setTitle('<div class="panel-title-style-16">' + climatestation.Utils.getTranslation('productadministration') + '</div>');
        me.setTitle('<div class="">' + climatestation.Utils.getTranslation('productadministration') + '</div>');

        if ((climatestation.Utils.objectExists(user) && user.userlevel == 1)) {
            me.width = 720;
        } else {
            me.width = 685;
        }

        me.listeners = {
            afterrender: function () {
                me.controller.loadProductsStore();
                // Ext.data.StoreManager.lookup('IngestSubProductsStore').load();
                // console.info(Ext.data.StoreManager.lookup('IngestSubProductsStore'));
            }
        };

        me.tbar = {
            padding: 0,
            margin: 0,
            defaults: {
                margin: 5,
                padding: 5,
            },
            items: [{
                text: climatestation.Utils.getTranslation('newproduct'),  // 'New product',
                name: 'newproduct',
                iconCls: 'far fa-plus-circle',
                // style: {color: 'green'},
                hidden: false,
                scale: 'medium',
                handler: function () {
                    let newProductWin = new climatestation.view.acquisition.product.editProduct({
                        params: {
                            new: true,
                            edit: false,
                            view: false
                        }
                    });
                    newProductWin.show();
                }
            }, {
                text: climatestation.Utils.getTranslation('eumetcastsources'),  // 'EUMETCAST Sources',
                name: 'eumetcastsources',
                iconCls: 'eumetsat-icon',
                // style: {color: 'green'},
                hidden: false,
                scale: 'medium',
                handler: function () {
                    // open EUMETCAST datasource administration window
                    let EumetcastSourceAdminWin = new climatestation.view.acquisition.product.EumetcastSourceAdmin({
                        params: {
                            assigntoproduct: false,
                            product: null
                        }
                    });

                    EumetcastSourceAdminWin.show();
                }
            }, {
                text: climatestation.Utils.getTranslation('internetsources'),  // 'INTERNET Sources',
                name: 'internetsources',
                iconCls: 'far fa-globe',  // 'internet-icon',    //
                // style: {color: 'green'},
                hidden: false,
                scale: 'medium',
                handler: function () {
                    // open INTERNET datasource administration window
                    let InternetSourceAdminWin = new climatestation.view.acquisition.product.InternetSourceAdmin({
                        params: {
                            assigntoproduct: false,
                            product: null
                        }
                    });

                    InternetSourceAdminWin.show();
                }
            }, {
                text: climatestation.Utils.getTranslation('mapsets'),  // 'Mapsets',
                name: 'mapsetsadmin',
                iconCls: 'mapset-icon',
                // style: {color: 'green'},
                hidden: false,
                scale: 'medium',
                handler: function () {
                    // open MAPSET administration window
                    let selectMapsetForIngestWin = new climatestation.view.acquisition.product.MapsetAdmin({
                        productcode: null,
                        productversion: null,
                        subproductcode: null
                    });
                    selectMapsetForIngestWin.show();
                }
            }, '->', {
                xtype: 'button',
                iconCls: 'far fa-redo-alt',
                style: {color: 'gray'},
                enableToggle: false,
                scale: 'medium',
                handler: function () {
                    me.forceStoreLoad = true;
                    me.controller.loadProductsStore();
                }
            }]
        };

        me.features = [{
            id: 'categoriesallproducts',
            ftype: 'grouping',
            groupHeaderTpl: Ext.create('Ext.XTemplate', '<div class="group-header-style">{name} ({children.length})</div>'),
            hideGroupedHeader: true,
            enableGroupingMenu: false,
            startCollapsed: true,
            groupByText: climatestation.Utils.getTranslation('productcategories')  // 'Product categories'
        }];

        me.defaults = {
            hideable: false,
            hidden: false
        };

        me.columns = [{
            xtype: 'actioncolumn',
            reference: 'editproduct',
            width: 40,
            menuDisabled: true,
            sortable: false,
            align: 'center',
            // shrinkWrap: 0,
            items: [{
                width: '35',
                disabled: false,
                //icon: 'resources/img/icons/edit.png',
                getClass: function (v, meta, rec) {
                    // return 'editproduct';
                    if (!rec.get('defined_by').includes('JRC') || (climatestation.Utils.objectExists(user) && user.userlevel <= 1)) {
                        return 'far fa-edit';
                    } else {
                        // return 'x-hide-display';
                        return 'far fa-eye';
                    }
                },
                getTip: function (v, meta, rec) {
                    // return climatestation.Utils.getTranslation('editproduct');    // 'Edit Product',
                    if (!rec.get('defined_by').includes('JRC') || (climatestation.Utils.objectExists(user) && user.userlevel <= 1)) {
                        return climatestation.Utils.getTranslation('editproduct');    // 'Edit Product',
                    }
                },
                //tooltip: climatestation.Utils.getTranslation('editproduct'),  // 'Edit Product',
                handler: 'editProduct'
            }]
        }, {
            xtype: 'templatecolumn',
            text: climatestation.Utils.getTranslation('product'),  // 'Product',
            reference: 'productinfocolumn',
            tpl: new Ext.XTemplate(
                '<b>{prod_descriptive_name}</b>' +
                '<tpl if="version != \'undefined\'">',
                '<b class="smalltext"> - {version}</b>',
                '</tpl>',
                '<span class="smalltext">' +
                '<b style="color:darkgrey;"> - {productcode}</b>' +
                '<tpl if="provider != \'undefined\'">',
                '</br><b style="color:darkgrey;">{provider}</b>',
                '</tpl>',
                // '<p>{description}</p>' +
                '</span>'
            ),
            minWidth: 300,
            menuDisabled: true,
            sortable: false,
            // cellWrap: true,
            variableRowHeight: true
        }, {
            xtype: 'actioncolumn',
            text: climatestation.Utils.getTranslation('activate'),  // 'Active',
            reference: 'activateproduct',
            width: 75,
            menuDisabled: true,
            sortable: false,
            align: 'center',
            // shrinkWrap: 0,
            // stopSelection: false,
            items: [{
                height: 85,
                getClass: function (v, meta, rec) {
                    if (rec.get('activated')) {
                        return 'far fa-check-square green';   // 'activated';
                    } else {
                        return 'far fa-square green';   // 'deactivated';
                    }
                },
                getTip: function (v, meta, rec) {
                    if (rec.get('activated')) {
                        return climatestation.Utils.getTranslation('deactivateproduct');  // 'Deactivate Product';
                    } else {
                        return climatestation.Utils.getTranslation('activateproduct');  // 'Activate Product';
                    }
                },
                // isActionDisabled: function(view, rowIndex, colIndex, item, record) {
                //     // Returns true if 'editable' is false (, null, or undefined)
                //     return false;    // !record.get('editable');
                // },
                handler: function (grid, rowIndex, colIndex, icon, e, record) {
                    let rec = record;
                    // var action = (rec.get('activated') ? 'deactivated' : 'activated');
                    rec.get('activated') ? rec.set('activated', false) : rec.set('activated', true);
                    // rec.save();
                    // rec.drop();
                    me.changesmade = true;
                    // grid.up().up().changesmade = true;

                    if (rec.get('activated')) {
                        Ext.toast({
                            html: climatestation.Utils.getTranslation('product') + ' <b>' + rec.get('prod_descriptive_name') + '</b> (' + rec.get('productcode') + ') ' + climatestation.Utils.getTranslation('activated') + '!',
                            title: climatestation.Utils.getTranslation('productactivated'), width: 300, align: 't'
                        });
                    } else {
                        Ext.toast({
                            html: climatestation.Utils.getTranslation('product') + ' <b>' + rec.get('prod_descriptive_name') + '</b> (' + rec.get('productcode') + ') ' + climatestation.Utils.getTranslation('deactivated') + '!',
                            title: climatestation.Utils.getTranslation('productdeactivated'), width: 300, align: 't'
                        });
                    }
                }
            }]
        }, {
            text: climatestation.Utils.getTranslation('nrsubproducts'),  // 'Subproducts',
            reference: 'totsubprods',
            dataIndex: 'totsubprods',
            width: 110,
            minWidth: 80,
            menuDisabled: true,
            sortable: false,
            align: 'center'
            // cellWrap: true
            // },{
            //     header: climatestation.Utils.getTranslation('nrdatasources'),  // 'Datasources',
            //     dataIndex: 'totdatasources',
            //     width: 110,
            //     minWidth: 80,
            //     align: 'center',
            //     menuDisabled: true,
            //     sortable: false,
            //     cellWrap:true
        }, {
            text: climatestation.Utils.getTranslation('definedby'),  // 'Defined by',
            reference: 'defined_by_column',
            dataIndex: 'defined_by',
            width: 100,
            minWidth: 95,
            menuDisabled: true,
            sortable: false,
            align: 'center',
            // cellWrap: true,
            hidden: (climatestation.Utils.objectExists(user) && user.userlevel == 1) ? false : true
        }, {
            xtype: 'actioncolumn',
            reference: 'deleteproduct',
            width: 35,
            menuDisabled: true,
            sortable: false,
            align: 'center',
            // shrinkWrap: 0,
            items: [{
                width: '35',
                disabled: false,
                isActionDisabled: function (view, rowIndex, colIndex, item, record) {
                    if (!record.get('defined_by').includes('JRC') || (climatestation.Utils.objectExists(user) && user.userlevel == 1)) {
                        return false;
                    } else {
                        return true;
                    }
                },
                getClass: function (cell, meta, rec) {
                    if (!rec.get('defined_by').includes('JRC') || (climatestation.Utils.objectExists(user) && user.userlevel == 1)) {
                        return 'far fa-trash-alt red';
                    } else {
                        // cell.setDisabled(true);   // This will not make syncing record content possible!
                        return 'x-hide-display';
                    }
                },
                getTip: function (v, meta, rec) {
                    // console.info(rec);
                    if (!rec.get('defined_by').includes('JRC') || (climatestation.Utils.objectExists(user) && user.userlevel == 1)) {
                        let tipText = climatestation.Utils.getTranslation('delete_product-and-its-subproducts') + ': <BR>' +
                            '<b>' + rec.get('prod_descriptive_name') + '</b>';

                        if (rec.get('version') != '') {
                            tipText += '<b> - ' + rec.get('version') + '</b>';
                            // tipText += '<span class="smalltext"><b> - ' + rec.get('version') + '</b></span>';
                        }
                        tipText += '<b> - ' + rec.get('productcode') + '</b>';
                        // tipText += '<span class="smalltext"><b style="color:darkgrey"> - ' + rec.get('productcode') + '</b></span>';
                        return tipText;
                    }
                },
                handler: 'deleteProduct'
            }]
        }];

        // me.bbar = {
        //     items: ['->', {
        //         text: climatestation.Utils.getTranslation('close'),  // 'Close',
        //         iconCls: 'far fa-times',
        //         style: { color: 'green' },
        //         hidden: false,
        //         scale: 'medium',
        //         handler: function () {
        //             me.close();
        //         }
        //     }]
        // };

        me.callParent();
    }
});
