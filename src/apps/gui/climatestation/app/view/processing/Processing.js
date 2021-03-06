
Ext.define("climatestation.view.processing.Processing",{
    extend: "Ext.grid.Panel",
    controller: "processing-processing",
    viewModel: {
        type: "processing-processing"
    },
    xtype  : 'processing-main',

    name:'processingmain',

    requires: [
        'Ext.XTemplate',
        'Ext.button.Split',
        'Ext.data.JsonStore',
        'Ext.data.StoreManager',
        'Ext.grid.column.Check',
        'Ext.grid.column.Template',
        'Ext.grid.column.Widget',
        'Ext.menu.Menu',
        'climatestation.Utils',
        'climatestation.store.ProcessingStore',
        'climatestation.view.acquisition.logviewer.LogView',
        'climatestation.view.processing.ProcessFinalOutputSubProducts',
        'climatestation.view.processing.ProcessInputProducts',
        'climatestation.view.processing.ProcessingController',
        'climatestation.view.processing.ProcessingModel',
        'climatestation.view.widgets.ServiceMenuButton'
    ],

    store: 'ProcessingStore',
    bufferedRenderer: false,

    // title: 'Processing Dashboard',
    viewConfig: {
        stripeRows: false,
        enableTextSelection: true,
        draggable:false,
        markDirty: false,
        resizable:false,
        disableSelection: true,
        trackOver:true
    },

    //selModel: {listeners:{}},

    titleAlign: 'center',
    collapsible: false,
    enableColumnMove:false,
    enableColumnResize:false,
    multiColumnSort: false,
    columnLines: false,
    rowLines: true,
    frame: false,
    border: false,

    features: [{
        id: 'processprodcat',
        ftype: 'grouping',
        groupHeaderTpl: Ext.create('Ext.XTemplate', '<div class="group-header-style">{name} ({children.length})</div>'),
        hideGroupedHeader: true,
        enableGroupingMenu: false,
        startCollapsed : true,
        groupByText: climatestation.Utils.getTranslation('productcategories')  // 'Product category'
    }],

    config: {
        forceStoreLoad: false
    },

    // listeners: {
    //     afterrender: function(){
    //         this.controller.loadstore();
    //     },
    //     beforecellclick: function(view, td, cellIndex) {
    //        console.info('hallo cell: ' + cellIndex);
    //        if (cellIndex > 0) return false;    // check the cellIndex for whatever columns you need.
    //     }
    //     cellclick : function(view, cell, cellIndex, record, row, rowIndex, e) {
    //        //e.stopPropagation();
    //        //console.info('cellclick');
    //        return false;
    //     }
    // },

    initComponent: function () {
        var me = this;

        // me.setTitle('<span class="panel-title-style">' + climatestation.Utils.getTranslation('processing') + '</span>');

        // me.mon(me, {
        //     loadstore: function() {
        //         Ext.data.StoreManager.lookup('LayersStore').load();
        //     }
        // });

        me.tbar = Ext.create('Ext.toolbar.Toolbar', {
            items: [{
                tooltip: climatestation.Utils.getTranslation('expandall'),    // 'Expand All',
                iconCls: 'far fa-blinds-open',
                scale: 'medium',
                margin: 5,
                padding: 5,
                handler: function(btn) {
                    var view = btn.up().up().getView();
                    view.getFeature('processprodcat').expandAll();
                    view.refresh();
                }
            }, {
                tooltip: climatestation.Utils.getTranslation('collapseall'),    // 'Collapse All',
                iconCls: 'far fa-blinds-raised',
                scale: 'medium',
                margin: 5,
                padding: 5,
                handler: function(btn) {
                    var view = btn.up().up().getView();
                    view.getFeature('processprodcat').collapseAll();
                    view.refresh();
                }
            }, '->',
            {
                xtype: 'servicemenubutton',
                service: 'processing',
                text: climatestation.Utils.getTranslation('processing'),    // 'Processing',
                handler: 'checkStatusServices',
                listeners : {
                    afterrender: 'checkStatusServices'
                }
            },
            '->',
            {
                xtype: 'button',
                iconCls: 'far fa-redo-alt',
                style: { color: 'gray' },
                enableToggle: false,
                scale: 'medium',
                handler:  function(btn) {
                    me.forceStoreLoad = true;
                    me.controller.loadstore();
                }
            }]
        });

        me.defaults = {
            variableRowHeight : true,
            menuDisabled: true,
            sortable: false,
            groupable:false,
            draggable:false,
            hideable: false,
            stopSelection: true
        };

        me.columns = [{
            header: '<div class="grid-header-style">' + climatestation.Utils.getTranslation('processinginputs') + '</div>',
            menuDisabled: true,
            variableRowHeight: true,
            defaults: {
                menuDisabled: true,
                variableRowHeight: true,
                sortable: false,
                groupable: false,
                draggable: false,
                hideable: false,
                stopSelection: true
            },
            columns: [{
                xtype: 'widgetcolumn',
                width: 475,
                bodyPadding: 0,

                header: ' <div class="x-column-header  x-column-header-align-left x-box-item x-column-header-default x-unselectable" style="border-top: 0px; width: 200px; left: 0px;" tabindex="-1">' +
                '           <div data-ref="titleEl" class="x-column-header-inner">' +
                '               <span data-ref="textEl" class="x-column-header-text">' + climatestation.Utils.getTranslation('product') + '</span>' +
                '           </div>' +
                '       </div>' +
                '       <div class="x-column-header x-column-header-align-left x-box-item x-column-header-default x-unselectable" style="border-top: 0px; width: 100px; right: auto; left: 200px; margin: 0px; top: 0px;" tabindex="-1">' +
                '           <div data-ref="titleEl" class="x-column-header-inner">' +
                '               <span data-ref="textEl" class="x-column-header-text">' + climatestation.Utils.getTranslation('subproduct') + '</span>' +
                '           </div>' +
                '       </div>' +
                '       <div class="x-column-header x-column-header-align-left x-box-item x-column-header-default x-unselectable" style="border-top: 0px; border-right: 0px; width: 160px;  left: 300px; margin: 0px; top: 0px;" tabindex="-1">' +
                '           <div data-ref="titleEl" class="x-column-header-inner">' +
                '               <span data-ref="textEl" class="x-column-header-text">' + climatestation.Utils.getTranslation('mapset') + '</span>' +
                //'               <span data-ref="textEl" class="x-column-header-text"' + climatestation.Utils.getTranslation('mapset') + '></span>' +
                '           </div>' +
                '       </div>',
                listeners: {
                    render: function (column) {
                        column.titleEl.removeCls('x-column-header-inner');
                    }
                },
                widget: {
                    xtype: 'process-inputproductgrid',
                    widgetattached: false
                },
                onWidgetAttach: function (col, widget, record) {
                    // console.info('inputproducts');
                    // console.info(record);
                    if (!widget.widgetattached) {
                        Ext.suspendLayouts();

                        var inputproducts = record.getData().inputproducts;
                        // console.info(inputproducts);
                        var newstore = Ext.create('Ext.data.JsonStore', {
                            model: 'InputProducts',
                            data: inputproducts
                        });
                        widget.setStore(newstore);
                        widget.widgetattached = true;

                        Ext.resumeLayouts(true);
                    }
                }
            }]
        },{
            header: '<div class="grid-header-style">' + climatestation.Utils.getTranslation('algorithm') + '</div>',
            menuDisabled: true,
            variableRowHeight : true,
            defaults: {
                menuDisabled: true,
                variableRowHeight : true,
                sortable: false,
                groupable:false,
                draggable:false,
                hideable: false,
                stopSelection: true
            },
            columns: [{
                header: climatestation.Utils.getTranslation('type'),    // 'Type',
                width: 140,
                dataIndex: 'algorithm',
                cellWrap:true
            },{
                header: climatestation.Utils.getTranslation('options'),    // 'Options',
                width: 140,
                dataIndex: 'derivation_method',
                cellWrap:true
            },{
                xtype: 'actioncolumn',
                header: climatestation.Utils.getTranslation('active'),    // 'Active',
                hideable: false,
                hidden: false,
                width: 65,
                align: 'center',
                shrinkWrap: 0,
                items: [{
                    // scope: me,
                    // handler: me.onToggleActivation
                    getClass: function(v, meta, rec) {
                        if (rec.get('process_activated')) {
                            return 'far fa-check-square green';   // 'activated';
                        } else {
                            return 'far fa-square green';   // 'deactivated';
                        }
                    },
                    getTip: function(v, meta, rec) {
                        if (rec.get('process_activated')) {
                            return  climatestation.Utils.getTranslation('deactivateprocess');   // 'Deactivate Process';
                        } else {
                            return  climatestation.Utils.getTranslation('activateprocess');   // 'Activate Process';
                        }
                    },
                    handler: function(grid, rowIndex, colIndex, icon, e, record) {
                        var rec = record,   // grid.getStore().getAt(rowIndex),
                        action = (rec.get('process_activated') ? 'deactivated' : 'activated');
                        //console.info(rec);
                        rec.get('process_activated') ? rec.set('process_activated', false) : rec.set('process_activated', true);
                    }
                }]
            },{
                xtype: 'actioncolumn',
                text: climatestation.Utils.getTranslation('log'),    // 'Log',
                id: 'processinglogcolumn',
                width: 45,
                height:40,
                menuDisabled: true,
                align:'center',
                stopSelection: false,
                // cls:'x-grid3-td-ingestionlogcolumn',
                items: [{
                    //icon: 'resources/img/icons/file-extension-log-icon-32x32.png',
                    iconCls:'log-icon',
                    width:32,
                    height:32,
                    tooltip: climatestation.Utils.getTranslation('showprocessinglog'),     // 'Show log of this Ingestion',
                    scope: me,
                    handler: function (grid, rowIndex, colIndex, icon, e, record) {
                        var logViewWin = new climatestation.view.acquisition.logviewer.LogView({
                            params: {
                                logtype: 'processing',
                                record: record
                            }
                        });
                        logViewWin.show();
                    }
                }]
            }]
        }, {
            header:  '<div class="grid-header-style">' + climatestation.Utils.getTranslation('processingoutputs') + '</div>',
            menuDisabled: true,
            variableRowHeight : true,
            defaults: {
                menuDisabled: true,
                variableRowHeight : true,
                sortable: false,
                groupable:false,
                draggable:false,
                hideable: false,
                stopSelection: true
            }
            ,columns: [{
                xtype: 'widgetcolumn',
                width: 510,
                bodyPadding:0,

                header: ' <div class="x-column-header  x-column-header-align-left x-box-item x-column-header-default x-unselectable" style="border-top: 0px; width: 200px; left: 0px;" tabindex="-1">' +
                '           <div data-ref="titleEl" class="x-column-header-inner">' +
                '               <span data-ref="textEl" class="x-column-header-text">' + climatestation.Utils.getTranslation('subproductname') + '</span>' +
                '           </div>' +
                '       </div>' +
                '       <div class="x-column-header x-column-header-align-left x-box-item x-column-header-default x-unselectable" style="border-top: 0px; width: 150px; right: auto; left: 200px; margin: 0px; top: 0px;" tabindex="-1">' +
                '           <div data-ref="titleEl" class="x-column-header-inner">' +
                '               <span data-ref="textEl" class="x-column-header-text">' + climatestation.Utils.getTranslation('mapset') + '</span>' +
                '           </div>' +
                '       </div>' +
                '       <div class="x-column-header x-column-header-align-left x-box-item x-column-header-default x-unselectable" style="border-top: 0px; width: 160px; right: auto; left: 350px; margin: 0px; top: 0px;" tabindex="-1">' +
                '           <div data-ref="titleEl" class="x-column-header-inner">' +
                '               <span data-ref="textEl" class="x-column-header-text">' + climatestation.Utils.getTranslation('subproductcode') + '</span>' +
                '           </div>' +
                //'       </div>' +
                //'       <div class="x-column-header x-column-header-align-left x-box-item x-column-header-default x-unselectable" style="border-top: 0px; border-right: 0px; width: 70px;  left: 600px; margin: 0px; top: 0px;" tabindex="-1">' +
                //'           <div data-ref="titleEl" class="x-column-header-inner">' +
                //'               <span data-ref="textEl" class="x-column-header-text">' + climatestation.Utils.getTranslation('active') + '</span>' +
                //'           </div>' +
                '       </div>',
                listeners: {
                  render: function(column){
                      column.titleEl.removeCls('x-column-header-inner');
                  }
                },
                widget: {
                    xtype: 'process-finaloutputsubproducts-grid',
                    widgetattached: false
                },
                onWidgetAttach: function(col, widget, record) {
                    // console.info('outputproducts');
                    // console.info(record);
                    if (!widget.widgetattached) {
                        Ext.suspendLayouts();

                        var processrec = record.getData();
                        var outputproducts = processrec.outputproducts;

                        var newstore = Ext.create('Ext.data.JsonStore', {
                            model: 'OutputProducts',
                            data: outputproducts
                        });
                        widget.setStore(newstore);
                        widget.widgetattached = true;

                        Ext.resumeLayouts(true);
                    }
                }
            }]
        }];

        me.callParent();
    }
});
