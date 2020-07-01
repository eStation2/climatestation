
Ext.define("climatestation.view.acquisition.product.EumetcastSourceAdmin",{
    extend: "Ext.window.Window",
    controller: "acquisition-product-eumetcastsourceadmin",
    viewModel: {
        type: "acquisition-product-eumetcastsourceadmin"
    },

    requires: [
        'Ext.grid.column.Action',
        'Ext.grid.plugin.CellEditing',
        'Ext.layout.container.Center',
        'climatestation.Utils',
        'climatestation.view.acquisition.product.EumetcastSourceAdminController',
        'climatestation.view.acquisition.product.EumetcastSourceAdminModel'
    ],

    title: '',
    header: {
        titlePosition: 0,
        titleAlign: 'center'
    },

    constrainHeader: true,
    //constrain: true,
    modal: true,
    closable: true,
    closeAction: 'destroy', // 'hide',
    resizable: true,
    autoScroll:true,
    maximizable: false,

    frame: true,
    width: 1000,
    height: Ext.getBody().getViewSize().height < 625 ? Ext.getBody().getViewSize().height-10 : 800,  // 600,
    maxHeight: 800,

    layout: {
        type: 'fit'
    },

    params: {},

    // Create a session for this view
    session: true,

    initComponent: function () {
        var me = this;
        var user = climatestation.getUser();

        var assignButton = {
            text: climatestation.Utils.getTranslation('assign'),  // 'Assign',
            iconCls: 'fa fa-link fa-2x',
            style: {color: 'green'},
            scale: 'medium',
            disabled: false,
            handler: 'onAssignEumetcastSourceClick'
        };
        var addButton = {
            text: climatestation.Utils.getTranslation('add'),  // 'Add',
            iconCls: 'fa fa-plus-circle fa-2x',
            style: {color: 'green'},
            scale: 'medium',
            disabled: false,
            handler: 'onAddEumetcastSourceClick'
        };

        var refreshButton = {
            xtype: 'button',
            iconCls: 'fa fa-refresh fa-2x',
            style: { color: 'gray' },
            enableToggle: false,
            scale: 'medium',
            handler: 'reloadStore'
        };

        me.tbar = [addButton, '->', refreshButton];

        if (me.params.assigntoproduct){
            me.setTitle('<span class="panel-title-style">' + climatestation.Utils.getTranslation('assigneumetcastsource')
                + ': ' + me.params.product.productcode + ' ' + me.params.product.version + '</span>');

            me.bbar = ['->', assignButton];
        }
        else {
            me.setTitle('<span class="panel-title-style">' + climatestation.Utils.getTranslation('eumetcastsources') + '</span>');
        }

        me.items = [{
            xtype: 'grid',
            reference: 'eumetcastSourceGrid',
            bind: '{eumetcastsources}',
            // listeners: {
            //     rowdblclick: 'onEditEumetcastSourceClick'
            // },
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
                    // icon: 'resources/img/icons/edit.png',
                    // tooltip: climatestation.Utils.getTranslation('editeumetcastsource') // 'Edit Eumetcast Source'
                    width:'35',
                    disabled: false,
                    getClass: function (v, meta, rec) {
                       if (!rec.get('defined_by').includes('JRC') || (climatestation.Utils.objectExists(user) && user.userlevel <= 1)) {
                           return 'edit';
                       }
                       else {
                           // return 'x-hide-display';
                           return 'vieweye';
                       }
                    },
                    getTip: function (v, meta, rec) {
                       if (!rec.get('defined_by').includes('JRC') || (climatestation.Utils.objectExists(user) && user.userlevel <= 1)) {
                           return climatestation.Utils.getTranslation('editeumetcastsource');    // 'Edit Eumetcast Source',
                       }
                    },
                    handler: 'onEditEumetcastSourceClick'
                }]
            }, {
                text: climatestation.Utils.getTranslation('id'),   // 'ID',
                dataIndex: 'eumetcast_id',
                width: 280,
                minWidth: 150,
                align: 'left',
                menuDisabled: true,
                sortable: true,
                cellWrap:true
            }, {
                text: climatestation.Utils.getTranslation('collection_name'),   // 'Collection name',
                dataIndex: 'collection_name',
                width: 280,
                minWidth: 150,
                align: 'left',
                menuDisabled: true,
                sortable: true,
                cellWrap:true
            }, {
                text: climatestation.Utils.getTranslation('filter_expression'),   // 'Filter expression',
                dataIndex: 'filter_expression_jrc',
                width: 330,
                minWidth: 200,
                align: 'left',
                menuDisabled: true,
                sortable: false,
                cellWrap:true
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
                   isDisabled: function(view, rowIndex, colIndex, item, record){
                        if (!record.get('defined_by').includes('JRC') || (climatestation.Utils.objectExists(user) && user.userlevel == 1)){
                            return false;
                        }
                        else {
                            return true;
                        }
                   },
                   getClass: function(cell, meta, rec) {
                       if (!rec.get('defined_by').includes('JRC') || (climatestation.Utils.objectExists(user) && user.userlevel == 1)){
                           return 'delete';
                       }
                       else {
                           // cell.setDisabled(true);
                           return 'x-hide-display';
                       }
                   },
                   getTip: function(cell, meta, rec) {
                       if (!rec.get('defined_by').includes('JRC') || (climatestation.Utils.objectExists(user) && user.userlevel == 1)){
                           return climatestation.Utils.getTranslation('deleteeumetcastsource');    // 'Delete Eumetcast datasource',
                       }
                   },
                   handler: 'onRemoveEumetcastSourceClick'
               }]
            }]
        }];


        me.callParent();
    }
});
