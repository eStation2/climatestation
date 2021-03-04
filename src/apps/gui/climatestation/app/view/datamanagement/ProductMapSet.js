
Ext.define("climatestation.view.datamanagement.ProductMapSet",{
    extend: "Ext.grid.Panel",

    controller: "datamanagement-productmapset",

    viewModel: {
       type: "datamanagement-productmapset"
    },

    xtype  : 'productmapsetgrid',

    requires: [
        'Ext.grid.column.Action',
        'Ext.grid.column.Widget',
        'climatestation.Utils',
        'climatestation.view.datamanagement.MapSetDataSet',
        'climatestation.view.datamanagement.ProductMapSetController',
        'climatestation.view.datamanagement.ProductMapSetModel',
        'climatestation.view.datamanagement.sendRequest'
    ],
    store : {
        model: 'ProductMapSet'
    },
    // session: false,

    viewConfig: {
        stripeRows: false,
        enableTextSelection: true,
        draggable: false,
        markDirty: false,
        resizable: false,
        disableSelection: true,
        trackOver: false,
        preserveScrollOnRefresh: false,
        preserveScrollOnReload: false,
        focusable: false,
        forceFit: false
    },

    hideHeaders: true,
    columnLines: false,
    rowLines: false,
    minHeight: 65,
    focusable: false,
    forceFit: false,
    scrollToTop: false,
    focusOnToFront: false,

    margin: '0 0 25 0',

    initComponent: function () {
        var me = this;

        me.defaults = {
            menuDisabled: true,
            draggable:false,
            groupable:false,
            hideable: false,
            variableRowHeight: false
        };

        me.columns = [{
            header: '',     // 'Mapset',
            dataIndex: 'descriptive_name',
            width: 200
        },{
            xtype: 'actioncolumn',
            width: 65,
            align:'center',
            stopSelection: false,
            items: [{
                // icon: 'resources/img/icons/download.png',
                iconCls: 'far fa-download',
                tooltip: climatestation.Utils.getTranslation('tipcompletedatasetmapset'),    // 'Complete all data sets for this product\'s mapset',
                scope: me,
                handler: function (grid, rowIndex) {
                    var rec = grid.getStore().getAt(rowIndex);

                    var sendRequestWin = new climatestation.view.datamanagement.sendRequest({
                        params: {
                            level: 'mapset',
                            record: rec
                        }
                    });
                    sendRequestWin.show();
                }
            }]
        }, {
            header: '',
            xtype: 'widgetcolumn',
            width: 800,
            widget: {
                xtype: 'mapsetdatasetgrid',
                widgetattached: false
            },
            onWidgetAttach: function(col, widget, record) {
                // if (!widget.widgetattached) {
                    // Ext.suspendLayouts();
                    widget.getStore().setData(record.getData().mapsetdatasets);
                    widget.widgetattached = true;
                    // Ext.resumeLayouts(true);
                // }
            }
        }];

        me.callParent();
    }

});