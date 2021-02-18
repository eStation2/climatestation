Ext.define("climatestation.view.datamanagement.DataManagement",{
    extend: "Ext.grid.Panel",
    controller: "datamanagement-datamanagement",
    viewModel: {
       type: "datamanagement-datamanagement"
    },
    xtype  : 'datamanagement-main',

    name:'datamanagementmain',

    requires: [
        'Ext.XTemplate',
        'Ext.data.StoreManager',
        'Ext.grid.column.Action',
        'Ext.grid.column.Template',
        'Ext.grid.column.Widget',
        'Ext.util.DelayedTask',
        'climatestation.Utils',
        'climatestation.store.DataSetsStore',
        'climatestation.view.datamanagement.DataManagementController',
        'climatestation.view.datamanagement.DataManagementModel',
        'climatestation.view.datamanagement.ProductMapSet',
        'climatestation.view.datamanagement.requestsAdmin',
        'climatestation.view.datamanagement.sendRequest'
    ],

    store: 'DataSetsStore',
    // session: false,

    viewConfig: {
        stripeRows: false,
        enableTextSelection: true,
        draggable :false,
        markDirty: false,
        resizable: false,
        trackOver: false,
        // preserveScrollOnRefresh: false,
        // preserveScrollOnReload: false,
        scrollable: true,
        focusable: false,
        loadMask: true
        // focusOnToFront: false
    },

    bufferedRenderer: false,
    scrollable: true,
    collapsible: false,
    suspendLayout: false,
    disableSelection: true,
    enableColumnMove: false,
    enableColumnResize: false,
    multiColumnSort: false,
    columnLines: false,
    rowLines: true,
    frame: false,
    border: false,
    focusable: false,
    margin: '0 0 10 0',

    layout: 'fit',

    features: [{
        id: 'prodcat',
        ftype: 'grouping',
        groupHeaderTpl: Ext.create('Ext.XTemplate', '<div class="group-header-style">{name} ({children.length})</div>'),
        hideGroupedHeader: true,
        enableGroupingMenu: false,
        startCollapsed : true,
        // focusable: false,
        groupByText: climatestation.Utils.getTranslation('productcategories')  // 'Product category'
    }],

    config: {
        forceStoreLoad: false,
        dirtyStore: false
    },

    initComponent: function () {
        var me = this;

        me.mon(me, {
            loadstore: function() {
                var datasetsstore  = Ext.data.StoreManager.lookup('DataSetsStore');

                if (me.forceStoreLoad || !datasetsstore.isLoaded() || me.dirtyStore) {
                    if (datasetsstore.isStore) {
                        datasetsstore.proxy.extraParams = {force: true};
                        datasetsstore.load();
                    }
                    me.forceStoreLoad = false;
                    me.dirtyStore = false;
                }
            }
        });

        me.listeners = {
            groupcollapse: function(view, node, group) {
                me.hideCompletenessTooltip();
            },
            groupexpand: function(view, node, group){
                me.hideCompletenessTooltip();
                me.view.updateLayout();
                var taskRefresh = new Ext.util.DelayedTask(function() {
                    view.refresh();
                    view.updateLayout();
                });
                taskRefresh.delay(50);

            },
            afterrender: function(view){
                // Ext.util.Observable.capture(view, function(e){console.log('datamanagementgrid ' + view.id + ': ' + e);});
                var scroller = me.view.getScrollable();
                scroller.on('scroll', function(){
                    var completenessTooltips = Ext.ComponentQuery.query('tooltip{id.search("_completness_tooltip") != -1}');
                    Ext.each(completenessTooltips, function(item) {
                        // item.disable();
                        item.hide();
                    });
                }, scroller, {single: false});
            }
        }

        me.tbar = Ext.create('Ext.toolbar.Toolbar', {
            items: [{
                tooltip:  climatestation.Utils.getTranslation('expandall'),    // 'Expand All',
                iconCls: 'far fa-blinds-open',
                scale: 'medium',
                margin: 5,
                padding: 5,
                handler: function(btn) {
                    var view = btn.up().up().getView();
                    view.getFeature('prodcat').expandAll();
                    me.hideCompletenessTooltip();
                }
            }, {
                tooltip:  climatestation.Utils.getTranslation('collapseall'),    // 'Collapse All',
                iconCls: 'far fa-blinds-raised',
                scale: 'medium',
                margin: 5,
                padding: 5,
                handler: function(btn) {
                    var view = btn.up().up().getView();
                    view.getFeature('prodcat').collapseAll();
                    me.hideCompletenessTooltip();
                }
            }, ' ', ' ', ' ', {

                xtype: 'button',
                name: 'datamanagement-requests-btn',
                id: 'datamanagement-requests-btn',
                reference: 'datamanagement-requests-btn',
                text: climatestation.Utils.getTranslation('myrequests'),    // 'My requests',
                iconCls: 'far fa-cloud-download',
                style: {color: 'gray'},
                scale: 'medium',
                handler: 'showRequestsAdmin',
                listeners: {
                    afterrender: function (btn) {
                        btn.requestsAdminPanel = new climatestation.view.datamanagement.requestsAdmin({owner:btn});
                    }
                }
            },
            // add a vertical separator bar between toolbar items
            //'-', // same as {xtype: 'tbseparator'} to create Ext.toolbar.Separator
            '->', // same as { xtype: 'tbfill' }
            {
                xtype: 'button',
                iconCls: 'far fa-redo-alt',
                style: { color: 'gray' },
                enableToggle: false,
                scale: 'medium',
                handler:  function(btn) {
                    var completenessTooltips = Ext.ComponentQuery.query('tooltip{id.search("_completness_tooltip") != -1}');

                    Ext.each(completenessTooltips, function(item) {
                        item.hide();
                    });

                    me.forceStoreLoad = true;
                    me.fireEvent('loadstore');
                }
            }]
        });

        me.defaults = {
            menuDisabled: true,
            sortable: false,
            groupable:true,
            draggable:false,
            hideable: true,
            variableRowHeight: false
        };

        me.columns = [
        {
            header: '<div class="grid-header-style">' + climatestation.Utils.getTranslation('productcategories') + '</div>',
            menuDisabled: true,
            defaults: {
                menuDisabled: true,
                sortable: false,
                groupable:true,
                draggable:false,
                hideable: true,
                variableRowHeight: false
            },
            columns: [{
                xtype:'templatecolumn',
                header: climatestation.Utils.getTranslation('product'),    // 'Product',
                tpl: new Ext.XTemplate(
                        '<b>{prod_descriptive_name}</b>' +
                        '<tpl if="version != \'undefined\'">',
                            '<b class="smalltext"> - {version}</b>',
                        '</tpl>',
                        '</br>' +
                        '<b class="smalltext" style="color:darkgrey;">'+climatestation.Utils.getTranslation('productcode')+': {productcode}</b>' +
                        '</br>' +
                        '<b class="smalltext" style="color:darkgrey;">'+climatestation.Utils.getTranslation('provider')+': {provider}</b>' +
                        '</br>'
                    ),
                width: 250,
                cellWrap:true
            },{
                xtype: 'actioncolumn',
                header: climatestation.Utils.getTranslation('request'),    // 'Actions',
                width: 80,
                align:'center',
                menuDisabled: true,
                stopSelection: false,
                items: [{
                    // icon: 'resources/img/icons/download.png',
                    iconCls: 'far fa-download',
                    tooltip: climatestation.Utils.getTranslation('tipcompletedatasetall'),    // 'Complete all product data sets (all mapsets and its subproducts).',
                    scope: me,
                    handler: function (grid, rowIndex, colIndex, icon, e, record) {
                        //var rec = grid.getStore().getAt(rowIndex);

                        var sendRequestWin = new climatestation.view.datamanagement.sendRequest({
                            params: {
                                level: 'product',
                                record: record
                            }
                        });
                        sendRequestWin.show();
                    }
                }]
            }]
        }, {
            header:  '<div class="grid-header-style">' + climatestation.Utils.getTranslation('datasetcompleteness') + '</div>',
            menuDisabled: true,
            defaults: {
                menuDisabled: true,
                sortable: false,
                groupable:true,
                draggable:false,
                hideable: true
            }
            ,columns: [{
                xtype: 'widgetcolumn',
                //dataIndex: 'productmapsets',
                width: 1090,
                bodyPadding:0,
                variableRowHeight: false,
                scrollable: false,

                header: ' <div class="x-column-header  x-column-header-align-left x-box-item x-column-header-default x-unselectable" style="border-top: 0px; width: 200px; left: 0px;" tabindex="-1">' +
                '           <div data-ref="titleEl" class="x-column-header-inner">' +
                '               <span data-ref="textEl" class="x-column-header-text">' + climatestation.Utils.getTranslation('mapset') + '</span>' +
                '           </div>' +
                '       </div>' +
                '       <div class="x-column-header x-column-header-align-left x-box-item x-column-header-default x-unselectable" style="border-top: 0px; width: 70px; right: auto; left: 200px; margin: 0px; top: 0px;" tabindex="-1">' +
                '           <div data-ref="titleEl" class="x-column-header-inner">' +
                '               <span data-ref="textEl" class="x-column-header-text">' + climatestation.Utils.getTranslation('request') + '</span>' +
                '           </div>' +
                '       </div>' +
                '       <div class="x-column-header x-column-header-align-left x-box-item x-column-header-default x-unselectable" style="border-top: 0px; width: 255px; right: auto; left: 270px; margin: 0px; top: 0px;" tabindex="-1">' +
                '           <div data-ref="titleEl" class="x-column-header-inner">' +
                '               <span data-ref="textEl" class="x-column-header-text">' + climatestation.Utils.getTranslation('subproductname') + '</span>' +
                '           </div>' +
                '       </div>' +
                '       <div class="x-column-header x-column-header-align-left x-box-item x-column-header-default x-unselectable" style="border-top: 0px; width: 450px; right: auto; left: 525px; margin: 0px; top: 0px;" tabindex="-1">' +
                '           <div data-ref="titleEl" class="x-column-header-inner">' +
                '               <span data-ref="textEl" class="x-column-header-text">' + climatestation.Utils.getTranslation('status') + '</span>' +
                '           </div>' +
                '       </div>' +
                '       <div class="x-column-header x-column-header-align-left x-box-item x-column-header-default x-unselectable" style="border-top: 0px; border-right: 0px; width: 70px;  left: 975px; margin: 0px; top: 0px;" tabindex="-1">' +
                '           <div data-ref="titleEl" class="x-column-header-inner">' +
                '               <span data-ref="textEl" class="x-column-header-text">' + climatestation.Utils.getTranslation('request') + '</span>' +
                '           </div>' +
                '       </div>',
                // listeners: {
                //   render: function(column){
                //       //column.titleEl.removeCls('x-column-header-inner');
                //   }
                // },
                widget: {
                    xtype: 'productmapsetgrid',
                    widgetattached: false
                }
                ,onWidgetAttach: function(col,widget, record) {

                    // if (!widget.widgetattached) {
                        // Ext.suspendLayouts();
                        widget.getStore().setData(record.getData().productmapsets);
                        widget.widgetattached = true;
                        // Ext.resumeLayouts(true);
                    // }
                }
            }]
        }];

        me.callParent();

    }

    ,hideCompletenessTooltip: function(){
        // Hide the visible completness tooltips
        var completenessTooltips = Ext.ComponentQuery.query('tooltip{id.search("_completness_tooltip") != -1}');
        Ext.each(completenessTooltips, function(item) {
           item.hide();
        });
    }
});