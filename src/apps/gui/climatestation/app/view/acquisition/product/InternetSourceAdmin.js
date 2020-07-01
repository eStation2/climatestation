
Ext.define("climatestation.view.acquisition.product.InternetSourceAdmin",{
    extend: "Ext.window.Window",
    controller: "acquisition-product-internetsourceadmin",
    viewModel: {
        type: "acquisition-product-internetsourceadmin"
    },

    requires: [
        'Ext.grid.column.Action',
        'Ext.grid.plugin.CellEditing',
        'Ext.layout.container.Center',
        'climatestation.Utils',
        'climatestation.view.acquisition.product.InternetSourceAdminController',
        'climatestation.view.acquisition.product.InternetSourceAdminModel'
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

    width: 1200,
    height: Ext.getBody().getViewSize().height < 625 ? Ext.getBody().getViewSize().height-10 : 800,  // 600,
    maxHeight: 800,

    frame: true,
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
            handler: 'onAssignInternetSourceClick'
        };
        var addButton = {
            text: climatestation.Utils.getTranslation('add'),  // 'Add',
            iconCls: 'fa fa-plus-circle fa-2x',
            style: {color: 'green'},
            scale: 'medium',
            disabled: false,
            handler: 'onAddInternetSourceClick'
        };

        var refreshButton = {
            xtype: 'button',
            iconCls: 'fa fa-refresh fa-2x',
            style: { color: 'gray' },
            enableToggle: false,
            scale: 'medium',
            handler: 'reloadStore'
        };
        // var deleteButton = {
        //     text: climatestation.Utils.getTranslation('delete'),  // 'Delete',
        //     iconCls: 'fa fa-minus-circle fa-2x',
        //     style: {color: 'red'},
        //     scale: 'medium',
        //     disabled: true,
        //     handler: 'onRemoveInternetSourceClick',
        //     bind: {
        //         disabled: '{!internetSourceGrid.selection}'
        //     }
        // };


        me.tbar = [addButton, '->', refreshButton];

        if (me.params.assigntoproduct){
            me.setTitle('<span class="panel-title-style">' + climatestation.Utils.getTranslation('assigninternetsource')
                + ': ' + me.params.product.productcode + ' ' + me.params.product.version + '</span>');

            me.bbar = ['->', assignButton];
        }
        else {
            me.setTitle('<span class="panel-title-style">' + climatestation.Utils.getTranslation('internetsources') + '</span>');
        }

        me.items = [{
            xtype: 'grid',
            reference: 'internetSourceGrid',
            bind: '{internetsources}',
            listeners: {
                itemdblclick: 'onEditInternetSourceClick'
            },
            selModel: {
                allowDeselect: true
            },
            layout: 'fit',

            viewConfig: {
                stripeRows: false,
                enableTextSelection: true,
                draggable: false,
                markDirty: false,
                resizable: false,
                disableSelection: false,
                trackOver: true
            },

            bufferedRenderer: false,
            scrollable: 'y',    // vertical scrolling only
            collapsible: false,
            enableColumnMove: false,
            enableColumnResize: true,
            multiColumnSort: false,
            columnLines: false,
            rowLines: true,
            frame: false,
            border: false,

            cls: 'grid-column-header-multiline',

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
                    // tooltip: climatestation.Utils.getTranslation('editinternetsource') // 'Edit Internet Source'
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
                           return climatestation.Utils.getTranslation('editinternetsource');    // 'Edit Internet datasource',
                       }
                    },
                    handler: 'onEditInternetSourceClick'
                }]
            }, {
                dataIndex: 'internet_id',
                header: climatestation.Utils.getTranslation('id'), // 'ID'
                width: 280,
                minWidth: 150,
                align: 'left',
                menuDisabled: true,
                sortable: true,
                cellWrap: true
            }, {
                dataIndex: 'descriptive_name',
                header: climatestation.Utils.getTranslation('name'), // 'Name'
                width: 250,
                minWidth: 150,
                align: 'left',
                menuDisabled: true,
                sortable: false,
                cellWrap: true
            }, {
                dataIndex: 'url',
                header: climatestation.Utils.getTranslation('url'), // 'URL'
                width: 320,
                minWidth: 200,
                align: 'left',
                menuDisabled: true,
                sortable: false,
                cellWrap: true
            }, {
                dataIndex: 'type',
                header: climatestation.Utils.getTranslation('type'), // 'Type'
                width: 110,
                minWidth: 80,
                align: 'center',
                menuDisabled: true,
                sortable: true,
                cellWrap: true
            }, {
                dataIndex: 'update_datetime',
                header: climatestation.Utils.getTranslation('lastupdated'), // 'Last updated'
                width: 130,
                minWidth: 120,
                align: 'center',
                menuDisabled: true,
                sortable: false,
                cellWrap: true
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
                           return climatestation.Utils.getTranslation('deleteinternetsource');    // 'Delete Internet datasource',
                       }
                   },
                   handler: 'onRemoveInternetSourceClick'
               }]
            }]
        }];


        me.callParent();
    }
});
