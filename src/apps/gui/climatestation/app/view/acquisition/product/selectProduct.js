
Ext.define("climatestation.view.acquisition.product.selectProduct",{
    extend: "Ext.window.Window",

    controller: "acquisition-product-selectproduct",
    viewModel: {
        type: "acquisition-product-selectproduct"
    },
    xtype: "selectproduct",

    requires: [
        'Ext.XTemplate',
        'Ext.grid.column.Action',
        'climatestation.Utils',
        'climatestation.view.acquisition.product.selectProductController',
        'climatestation.view.acquisition.product.selectProductModel'
    ],

    title: climatestation.Utils.getTranslation('activateproduct'),  // 'Activate Product',
    header: {
        titlePosition: 0,
        titleAlign: 'center'
    },

    constrainHeader: true,
    //constrain: true,
    modal: true,
    closable: true,
    closeAction: 'destroy', // 'hide',
    resizable: false,
    autoScroll: true,
    maximizable: false,

    // minWidth: 700,
    width: 640,
    height: Ext.getBody().getViewSize().height < 625 ? Ext.getBody().getViewSize().height-10 : 800,  // 600,
    maxHeight: 800,

    layout: {
        type  : 'fit'
    },

    config: {
        changesmade:false
    },

    initComponent: function () {
        var me = this;

        me.setTitle('<div class="panel-title-style-16">' + climatestation.Utils.getTranslation('activateproduct') + '</div>');

        me.listeners = {
            close: me.onClose
        };

        me.tbar = {
            items: [
            // {
            //    text: climatestation.Utils.getTranslation('newproduct'),  // 'New product',
            //    name: 'newproduct',
            //    iconCls: 'fa fa-plus-circle fa-2x',
            //    style: {color: 'green'},
            //    hidden: false,
            //    scale: 'medium',
            //    handler: function () {
            //        var newProductWin = new climatestation.view.acquisition.product.editProduct({
            //            params: {
            //                edit: false
            //            }
            //        });
            //        newProductWin.show();
            //    }
            // },
                '->', {
                xtype: 'button',
                iconCls: 'fa fa-refresh fa-2x',
                style: { color: 'gray' },
                enableToggle: false,
                scale: 'medium',
                handler: 'loadInactiveProductsGrid'
            }]
        };

        me.bbar = {
            items: ['->', {
                text: climatestation.Utils.getTranslation('close'),  // 'Close',
                iconCls: 'fa fa-times fa-2x',
                style: { color: 'green' },
                hidden: false,
                scale: 'medium',
                handler: function () {
                    me.close();
                }
            }]
        };

        me.items = [{
                xtype : 'grid',
                layout: 'fit',
                // store: 'ProductsInactiveStore',
                bind: '{products}',

                viewConfig: {
                    stripeRows: false,
                    enableTextSelection: true,
                    draggable:false,
                    markDirty: false,
                    resizable:false,
                    disableSelection: true,
                    trackOver:true
                },

                collapsible: false,
                enableColumnMove:false,
                enableColumnResize:false,
                multiColumnSort: false,
                columnLines: false,
                rowLines: true,
                frame: false,
                border: false,

                features: [{
                    id: 'categoriesactivateproducts',
                    ftype: 'grouping',
                    groupHeaderTpl: Ext.create('Ext.XTemplate', '<div class="group-header-style">{name} ({children.length})</div>'),
                    hideGroupedHeader: true,
                    enableGroupingMenu: false,
                    startCollapsed : true,
                    groupByText: climatestation.Utils.getTranslation('productcategories')  // 'Product categories'
                }],

                // columns : [{
                    // text: '<div class="grid-header-style">' + climatestation.Utils.getTranslation('productcategories') + '</div>',
                    // menuDisabled: true,
                    columns: [{
                    //    xtype: 'actioncolumn',
                    //    hidden:false,
                    //    width: 35,
                    //    align: 'center',
                    //    sortable: false,
                    //    menuDisabled: true,
                    //    shrinkWrap: 0,
                    //    items: [{
                    //        //icon: 'resources/img/icons/edit.png',
                    //        getClass: function(v, meta, rec) {
                    //            return 'editproduct';
                    //            // if (rec.get('defined_by') != 'JRC') {
                    //            //     return 'editproduct';
                    //            // }
                    //            // else {
                    //            //     return 'x-hide-display';
                    //            // }
                    //        },
                    //        getTip: function(v, meta, rec) {
                    //            return climatestation.Utils.getTranslation('editproduct');    // 'Edit Product',
                    //            // if (rec.get('defined_by') != 'JRC') {
                    //            //     return climatestation.Utils.getTranslation('editproduct');    // 'Edit Product',
                    //            // }
                    //        },
                    //        //tooltip: climatestation.Utils.getTranslation('editproduct'),  // 'Edit Product',
                    //        handler: 'editProduct'
                    //    }]
                    // }, {
                        xtype:'templatecolumn',
                        header: climatestation.Utils.getTranslation('product'),  // 'Product',
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
                                '<p>{description}</p>' +
                                '</span>'
                            ),
                        minWidth: 515,
                        cellWrap:true,
                        sortable: false,
                        hideable: false,
                        variableRowHeight : true,
                        menuDisabled:true
                    }, {
                        xtype: 'actioncolumn',
                        header: climatestation.Utils.getTranslation('activate'),  // 'Active',
                        hideable: false,
                        hidden: false,
                        width: 90,
                        align: 'center',
                        shrinkWrap: 0,
                        menuDisabled: true,
                        stopSelection: false,
                        items: [{
                            height: 85,
                            getClass: function(v, meta, rec) {
                                if (rec.get('activated')) {
                                    return 'activated';
                                } else {
                                    return 'deactivated';
                                }
                            },
                            getTip: function(v, meta, rec) {
                                if (rec.get('activated')) {
                                    return climatestation.Utils.getTranslation('deactivateproduct');  // 'Deactivate Product';
                                } else {
                                    return climatestation.Utils.getTranslation('activateproduct');  // 'Activate Product';
                                }
                            },
                            // isDisabled: function(view, rowIndex, colIndex, item, record) {
                            //     // Returns true if 'editable' is false (, null, or undefined)
                            //     return false;    // !record.get('editable');
                            // },
                            handler: function(grid, rowIndex, colIndex, icon, e, record) {
                                var rec = record;
                                // var action = (rec.get('activated') ? 'deactivated' : 'activated');
                                rec.get('activated') ? rec.set('activated', false) : rec.set('activated', true);
                                rec.save();
                                rec.drop();
                                grid.up().up().changesmade = true;
                                Ext.toast({ html: climatestation.Utils.getTranslation('product') + ' <b>' + rec.get('prod_descriptive_name') + '</b> (' + rec.get('productcode') + ') ' + climatestation.Utils.getTranslation('activated') + '!',
                                            title: 'Product activated', width: 300, align: 't' });
                            }
                        }]
                    }]
                // }]
            }];

        me.callParent();
    }
    ,onClose: function(win, ev) {
        if (win.changesmade){
            var acquisitionmain = Ext.getCmp('acquisitionmain');
            acquisitionmain.setDirtyStore(true);
            acquisitionmain.fireEvent('loadstore');
        }
    }
});
