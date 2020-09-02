
Ext.define("climatestation.view.acquisition.product.MapsetAdmin",{
    extend: "Ext.window.Window",
    controller: "acquisition-product-mapsetadmin",
    viewModel: {
        type: "acquisition-product-mapsetadmin"
    },
    xtype: "mapsetadmin",

    requires: [
        'Ext.XTemplate',
        'Ext.layout.container.Center',
        'climatestation.Utils',
        'climatestation.view.acquisition.product.MapsetAdminController',
        'climatestation.view.acquisition.product.MapsetAdminModel'
    ],

    // title: '<div class="panel-title-style-16">' + climatestation.Utils.getTranslation('selectmapset') + '</div>',
    header: {
        titlePosition: 0,
        titleAlign: 'center'
    },
    constrainHeader: Ext.getBody(),

    modal: true,
    closable: true,
    closeAction: 'destroy', // 'hide',
    maximizable: false,
    resizable: true,
    resizeHandles: 'n,s',
    scrollable: true,
    width: 890,
    height: Ext.getBody().getViewSize().height < 650 ? Ext.getBody().getViewSize().height-10 : 650,
    maxHeight: Ext.getBody().getViewSize().height,

    border:false,
    frame: false,
    bodyBorder: false,
    layout: {
        type  : 'fit',
        padding: 15
    },

    listeners:  {
        close: 'onClose',
        beforerender: 'loadMapsetStore'
    },
    config: {
        assigntoproduct: false,
        productcode: null,
        productversion: null,
        subproductcode: null,
        selectedmapset: null
    },

    initComponent: function () {
        var me = this;
        var user = climatestation.getUser();

        var assignButton = {
            text: climatestation.Utils.getTranslation('assign'),  // 'Assign',
            reference: 'assignmapsetBtn',
            iconCls: 'far fa-link',
            // style: {color: 'green'},
            scale: 'medium',
            disabled: false,
            handler: 'onAssignMapsetClick'
        };
        var addButton = {
            text: climatestation.Utils.getTranslation('add'),  // 'Add',
            iconCls: 'far fa-plus-circle',
            // style: {color: 'green'},
            scale: 'medium',
            disabled: false,
            handler: 'onAddMapsetClick'
        };

        var refreshButton = {
            xtype: 'button',
            iconCls: 'far fa-redo-alt',
            // style: { color: 'gray' },
            enableToggle: false,
            scale: 'medium',
            handler: 'loadMapsetStore'
        };

        me.tbar = [addButton, '->', refreshButton];


        if (me.config.assigntoproduct){
            me.setTitle('<span class="">' + climatestation.Utils.getTranslation('assignmapset_toproduct')
                + ': ' + me.productcode + ' - ' + me.version + ' - ' + me.subproductcode + '</span>');

            me.bbar = ['->', assignButton];
        }
        else {
            // me.title = '<div class="panel-title-style-16">' + climatestation.Utils.getTranslation('mapsetadmin') + '</div>';
            me.title = '<div class="">' + climatestation.Utils.getTranslation('mapsetadmin') + '</div>';
        }

        me.items = [{
            xtype: 'grid',
            reference: 'mapsetGrid',
            bind: '{mapsets}',
            selModel: {
                type: 'rowmodel',
                allowDeselect: true
            },
            layout: 'fit',

            viewConfig: {
                stripeRows: false,
                enableTextSelection: true,
                draggable:false,
                markDirty: false,
                resizable:false,
                disableSelection: false,
                trackOver:true
            },

            bufferedRenderer: false,
            scrollable: 'y',    // vertical scrolling only
            collapsible: false,
            enableColumnMove:false,
            enableColumnResize:false,
            multiColumnSort: false,
            columnLines: false,
            rowLines: true,
            frame: false,
            border: false,

            columns: [{
                xtype: 'actioncolumn',
                hidden: false,
                width: 40,
                align: 'center',
                sortable: false,
                menuDisabled: true,
                shrinkWrap: 0,
                items: [{
                    getClass: function (v, meta, rec) {
                       if (!rec.get('defined_by').includes('JRC') || (climatestation.Utils.objectExists(user) && user.userlevel == 1)) {
                           return 'far fa-edit';
                       }
                       else {
                           // return 'x-hide-display';
                           return 'far fa-eye';
                       }
                    },
                    getTip: function (v, meta, rec) {
                       if (!rec.get('defined_by').includes('JRC') || (climatestation.Utils.objectExists(user) && user.userlevel == 1)) {
                           return climatestation.Utils.getTranslation('editmapset');    // 'Edit Mapset',
                       }
                    },
                    handler: 'onEditMapsetClick'
                }]
            }, {
                text: climatestation.Utils.getTranslation('mapsetcode'),
                dataIndex: 'mapsetcode',
                width: 220,
                minWidth: 150,
                align: 'left',
                menuDisabled: true,
                sortable: true,
                cellWrap:true
            }, {
                text: climatestation.Utils.getTranslation('name'),
                dataIndex: 'descriptive_name',
                width: 280,
                minWidth: 150,
                align: 'left',
                menuDisabled: true,
                sortable: true,
                cellWrap:true
            }, {
                text: climatestation.Utils.getTranslation('used_by_ingestions'),
                dataIndex: 'ingestions_assigned',
                width: 160,
                minWidth: 150,
                align: 'left',
                menuDisabled: true,
                sortable: false,
                cellWrap:true
            }, {
                xtype:'templatecolumn',
                // header: climatestation.Utils.getTranslation('footprint'),
                tpl: Ext.create('Ext.XTemplate',
                    '<tpl for=".">',
                        '<div class="mapset" id="{mapsetcode:stripTags}">',
                            '<img width="100px" height="80px" src="{footprint_image}" title="{descriptive_name:htmlEncode}">',
                            // '<span><strong>{descriptive_name:htmlEncode}</strong></span>',
                        '</div>',
                    '</tpl>'
                    // '<div class="x-clear"></div>'
                ),
                width: 120,
                // height: 100,
                cellWrap:true,
                sortable: false,
                hideable: false,
                variableRowHeight : true,
                menuDisabled:true
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
                   // disabled: false,
                   isActionDisabled: function(view, rowIndex, colIndex, item, record){
                        if (!record.get('defined_by').includes('JRC') || (climatestation.Utils.objectExists(user) && user.userlevel == 1)){
                            return false;
                        }
                        else {
                            return true;
                        }
                   },
                   getClass: function(v, meta, rec) {
                       if (!rec.get('defined_by').includes('JRC') || (climatestation.Utils.objectExists(user) && user.userlevel == 1)){
                           return 'far fa-trash-alt red';
                       }
                       else {
                           // v.setDisabled(true);
                           return 'x-hide-display';
                       }
                   },
                   getTip: function(v, meta, rec) {
                       if (!rec.get('defined_by').includes('JRC') || (climatestation.Utils.objectExists(user) && user.userlevel == 1)){
                           return climatestation.Utils.getTranslation('deletemapset');
                       }
                   },
                   handler: 'onRemoveMapsetClick'
               }]
            }]
        }];

        me.callParent();
    }
});
