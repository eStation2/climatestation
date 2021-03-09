
Ext.define("climatestation.view.analysis.logoAdmin",{
    extend: "Ext.window.Window",
    controller: "analysis-logoadmin",
    viewModel: {
        type: "analysis-logoadmin"
    },
    "xtype"  : 'logoadmin',

    requires: [
        'Ext.grid.column.Action',
        'climatestation.Utils',
        'climatestation.view.analysis.logoAdminController',
        'climatestation.view.analysis.logoAdminModel'
    ],
    id: 'logoadministration',
    title: '<div class="panel-title-style-16">' + climatestation.Utils.getTranslation('logoadministration') + '</div>',
    header: {
        titlePosition: 0,
        titleAlign: 'center',
        iconCls: 'far fa-globe-africa'
    },
    constrainHeader: Ext.getBody(),

    modal: true,
    closable: true,
    closeAction: 'destroy', // 'destroy',
    maximizable: false,
    resizable: true,
    //resizeHandles: 'n,s',
    scrollable: false,
    height: Ext.getBody().getViewSize().height < 625 ? Ext.getBody().getViewSize().height-130 : 625,  // 600,
    minHeight: 625,
    // maxHeight: 700,
    width: 800, // 1275,

    border:false,
    frame: false,
    bodyBorder: false,
    layout: {
        type  : 'fit',
        padding: 1
    },

    // listeners: {
    //     close: 'onClose'
    //     // ,show: 'onShow'
    // },
    session:true,

    initComponent: function () {
        var me = this;
        var user = climatestation.getUser();

        me.title = '<div class="panel-title-style-16">' + climatestation.Utils.getTranslation('logoadministration') + '</div>';
        me.height = Ext.getBody().getViewSize().height < 625 ? Ext.getBody().getViewSize().height-130 : 625;  // 600,

        me.tools = [
        {
            type: 'refresh',
            align: 'c-c',
            tooltip: climatestation.Utils.getTranslation('refreshlogolist'),    // 'Refresh logo list',
            callback: 'loadLogosStore'
        }];

        me.tbar = Ext.create('Ext.toolbar.Toolbar', {
            padding: 3,
            items: [{
                xtype: 'button',
                text: climatestation.Utils.getTranslation('addlogo'),    // 'Add logo',
                name: 'addlayer',
                iconCls: 'far fa-plus-circle green',
                // style: {color: 'green'},
                hidden: false,
                // glyph: 'xf055@FontAwesome',
                scale: 'medium',
                handler: 'addLogo'
            }]
        });

        me.items = [{
            xtype : 'grid',
            reference: 'logosGrid',
            bind: '{logos}',

            bufferedRenderer: false,

            viewConfig: {
                stripeRows: false,
                enableTextSelection: true,
                draggable: false,
                markDirty: false,
                resizable: false,
                disableSelection: false,
                trackOver: true,
                forceFit: true,
                preserveScrollOnRefresh: true
            },

            selModel : {
                type: 'cellmodel',
                allowDeselect : false,
                mode:'SINGLE',
                listeners: {}
            },

            plugins: {
                ptype: 'cellediting',
                clicksToEdit: 1
            },

            //cls: 'grid-color-yellow',
            hideHeaders: false,
            collapsible: false,
            enableColumnMove: false,
            enableColumnResize: false,
            sortableColumns: true,
            multiColumnSort: true,
            columnLines: true,
            rowLines: true,
            frame: false,
            border: false,
            bodyBorder: false,

            // listeners: {
                //scope: 'controller',
                //afterrender: 'loadLayersGrid',
                //rowclick: 'layersGridRowClick'
            // },

            columns: [{
                xtype: 'actioncolumn',
                // header: climatestation.Utils.getTranslation('actions'),   // 'Actions',
                menuDisabled: true,
                sortable: false,
                variableRowHeight : true,
                draggable:false,
                groupable:false,
                hideable: false,
                width: 35,
                align: 'center',
                stopSelection: false,

                items: [{
                //     // scope: me,
                //     width:'35',
                //     disabled: false,
                //     getClass: function (v, meta, rec) {
                //         if (rec.get('defined_by')!='JRC'){
                //             return 'far fa-edit';
                //         }
                //         else return 'far fa-eye';
                //     },
                //     getTip: function (v, meta, rec) {
                //         return climatestation.Utils.getTranslation('editlogoproperties') + ' ' + rec.get('logo_filename');
                //     },
                //     handler: 'editLogo'
                // },{
                    // scope: me,
                    width:'35',
                    disabled: false,
                    getClass: function(v, meta, rec) {
                        if ((rec.get('deletable') && rec.get('defined_by')!='JRC') || (climatestation.Utils.objectExists(user) && user.userlevel == 1)){
                            return 'far fa-trash-alt red';
                        }
                    },
                    getTip: function(v, meta, rec) {
                        if ((rec.get('deletable') && rec.get('defined_by')!='JRC') || (climatestation.Utils.objectExists(user) && user.userlevel == 1)){
                            return climatestation.Utils.getTranslation('deletelogo') + ': ' + rec.get('logo_filename');
                        }
                    },
                    handler: 'deleteLogo'
                }]
            }, {
                xtype: 'templatecolumn',
                text: climatestation.Utils.getTranslation('logo_src'), // 'Logo',
                width: 175,
                dataIndex: 'src',
                cellWrap:true,
                menuDisabled: true,
                sortable: false,
                variableRowHeight : true,
                draggable:false,
                groupable:false,
                hideable: false,
                tpl: new Ext.XTemplate(
                    '<tpl for=".">',
                        // '<tpl if="active">',
                        '<div class="maplogo-wrap" style="cursor: pointer;">',
                            '<div class="maplogo">',
                                '<img src="{src}" width="110" />',
                                '<span class="smalltext">{logo_filename:htmlEncode}</span>',
                            '</div>',
                        '</div>',
                        // '<tpl if="xindex % 4 === 0"><div class="x-clear"></div></tpl>',
                        // '</tpl>',
                    '</tpl>',
                    '<div class="x-clear"></div>'
                )
            // }, {
            //     text: climatestation.Utils.getTranslation('logo_filename'),  // 'File name',
            //     width: 200,
            //     dataIndex: 'logo_filename',
            //     cellWrap:true,
            //     menuDisabled: true,
            //     sortable: true,
            //     variableRowHeight : true,
            //     draggable:false,
            //     groupable:false,
            //     hideable: false
            }, {
                text: climatestation.Utils.getTranslation('description'),  // 'Description',
                width: 250,
                dataIndex: 'logo_description',
                hidden: false,
                menuDisabled: true,
                sortable: true,
                variableRowHeight : true,
                draggable:false,
                groupable:false,
                hideable: false,
                editor: 'textfield'
            }, {
                xtype: 'actioncolumn',
                header: climatestation.Utils.getTranslation('logoactive'),  // 'Active',
                menuDisabled: false,
                sortable: true,
                variableRowHeight : true,
                draggable:false,
                groupable:false,
                hideable: false,
                hidden: (climatestation.globals['typeinstallation'].toLowerCase() == 'jrc_online' || climatestation.globals['typeinstallation'].toLowerCase() == 'online'),
                width: 70,
                align: 'center',
                // stopSelection: false,
                items: [{
                    // scope: me,
                    disabled: false,
                    style: {"line-height": "70px"},
                    getClass: function(v, meta, rec) {
                        if (rec.get('active')) {
                            return 'far fa-check-square green';   // 'activated';
                        } else {
                            return 'far fa-square green';   // 'deactivated';
                        }
                    },
                    getTip: function(v, meta, rec) {
                        if (rec.get('active')) {
                            return climatestation.Utils.getTranslation('tipdisablelogofromselection');     // 'Disable logo from selection list';
                        } else {
                            return climatestation.Utils.getTranslation('tipenableinselection');     // 'Enable logo in selection list';
                        }
                    },
                    handler: function(grid, rowIndex, colIndex) {
                        var rec = grid.getStore().getAt(rowIndex);
                        // var action = (rec.get('active') ? 'deactivated' : 'activated');
                        // Ext.toast({ html: action + ' ' + rec.get('logo_filename'), title: 'Action', width: 300, align: 't' });
                        rec.get('active') ? rec.set('active', false) : rec.set('active', true);
                    }
                }]
            }, {
                xtype: 'actioncolumn',
                header: climatestation.Utils.getTranslation('isdefaultlogo'),  // 'Default logo',
                menuDisabled: false,
                sortable: true,
                variableRowHeight : true,
                draggable:false,
                groupable:false,
                hideable: false,
                hidden: (climatestation.globals['typeinstallation'].toLowerCase() == 'jrc_online' || climatestation.globals['typeinstallation'].toLowerCase() == 'online'),
                width: 100,
                align: 'center',
                // stopSelection: false,
                items: [{
                    // scope: me,
                    disabled: false,
                    style: {"line-height": "70px"},
                    getClass: function(v, meta, rec) {
                        if (rec.get('isdefault')) {
                            return 'far fa-check-square green';   // 'activated';
                        } else {
                            return 'far fa-square green';   // 'deactivated';
                        }
                    },
                    getTip: function(v, meta, rec) {
                        if (rec.get('isdefault')) {
                            return climatestation.Utils.getTranslation('tipunsetlogoasdefault');     // 'Unset logo as default';
                        } else {
                            return climatestation.Utils.getTranslation('tipsetlogoasdefault');     // 'Set logo as default';
                        }
                    },
                    handler: function(grid, rowIndex, colIndex) {
                        var rec = grid.getStore().getAt(rowIndex);
                        // var action = (rec.get('isdefault') ? 'deactivated' : 'activated');
                        rec.get('isdefault') ? rec.set('isdefault', false) : rec.set('isdefault', true);
                    }
                }]
            }, {
                text: climatestation.Utils.getTranslation('defaultlogoorderindex'),  // 'Default logo order index',
                width: 120,
                dataIndex: 'orderindex_defaults',
                hidden: false,
                menuDisabled: true,
                sortable: true,
                variableRowHeight : true,
                draggable:false,
                groupable:false,
                hideable: false,
                editor: 'numberfield'
            }]
        }];

        me.callParent();
    }
});
