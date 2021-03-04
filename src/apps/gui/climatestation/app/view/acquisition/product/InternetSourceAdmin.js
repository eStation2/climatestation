
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
    scrollable:true,
    maximizable: false,

    width: 1000,
    height: Ext.getBody().getViewSize().height < 650 ? Ext.getBody().getViewSize().height-10 : 650,  // 600,
    maxHeight: Ext.getBody().getViewSize().height,

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
            iconCls: 'far fa-link',
            // style: {color: 'green'},
            scale: 'medium',
            disabled: false,
            handler: 'onAssignInternetSourceClick'
        };
        var addButton = {
            text: climatestation.Utils.getTranslation('add'),  // 'Add',
            iconCls: 'far fa-plus-circle',
            // style: {color: 'green'},
            scale: 'medium',
            disabled: false,
            handler: 'onAddInternetSourceClick'
        };

        var refreshButton = {
            xtype: 'button',
            iconCls: 'far fa-redo-alt',
            // style: { color: 'gray' },
            enableToggle: false,
            scale: 'medium',
            handler: 'reloadStore'
        };
        // var deleteButton = {
        //     text: climatestation.Utils.getTranslation('delete'),  // 'Delete',
        //     iconCls: 'far fa-minus-circle',
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
            me.setTitle('<span class="">' + climatestation.Utils.getTranslation('assigninternetsource')
                + ': ' + me.params.product.productcode + ' ' + me.params.product.version + '</span>');

            me.bbar = ['->', assignButton];
        }
        else {
            // me.setTitle('<span class="panel-title-style">' + climatestation.Utils.getTranslation('internetsources') + '</span>');
            me.setTitle('<span class="">' + climatestation.Utils.getTranslation('internetsources') + '</span>');
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
                width: 35,
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
                           return 'far fa-edit';
                       }
                       else {
                           // return 'x-hide-display';
                           return 'far fa-eye';
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
                xtype:'templatecolumn',
                dataIndex: 'internet_id',
                header: climatestation.Utils.getTranslation('id'), // 'ID'
                width: 240,
                minWidth: 150,
                align: 'left',
                menuDisabled: true,
                sortable: true,
                cellWrap: true,
                tpl: new Ext.XTemplate(
                    '<b>{internet_id}</b></br>' +
                    '<span class="smalltext">' +
                    '<b style="color:darkgrey;"> '+ climatestation.Utils.getTranslation('lastupdated') + ' - {update_datetime}</b></br>' +
                    '<b style="color:darkgrey;"> '+ climatestation.Utils.getTranslation('type') + ' - {type}</b>' +
                    '</span>'
                )
            }, {
                dataIndex: 'descriptive_name',
                header: climatestation.Utils.getTranslation('name'), // 'Name'
                width: 320,
                minWidth: 150,
                align: 'left',
                menuDisabled: true,
                sortable: false,
                cellWrap: true
            }, {
                dataIndex: 'url',
                header: climatestation.Utils.getTranslation('url'), // 'URL'
                width: 350,
                minWidth: 200,
                align: 'left',
                menuDisabled: true,
                sortable: false,
                cellWrap: true
            // }, {
            //     dataIndex: 'type',
            //     header: climatestation.Utils.getTranslation('type'), // 'Type'
            //     width: 110,
            //     minWidth: 80,
            //     align: 'center',
            //     menuDisabled: true,
            //     sortable: true,
            //     cellWrap: true
            // }, {
            //     dataIndex: 'update_datetime',
            //     header: climatestation.Utils.getTranslation('lastupdated'), // 'Last updated'
            //     width: 130,
            //     minWidth: 120,
            //     align: 'center',
            //     menuDisabled: true,
            //     sortable: false,
            //     cellWrap: true
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
                   getClass: function(cell, meta, rec) {
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
