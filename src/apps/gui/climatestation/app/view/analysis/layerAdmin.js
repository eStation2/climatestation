
Ext.define("climatestation.view.analysis.layerAdmin",{
    extend: "Ext.window.Window",
    controller: "analysis-layeradmin",
    viewModel: {
        type: "analysis-layeradmin"
    },
    xtype  : 'layeradmin',

    requires: [
        'Ext.grid.column.Action',
        'climatestation.Utils',
        'climatestation.view.analysis.layerAdminController',
        'climatestation.view.analysis.layerAdminModel'
    ],
    id: 'layeradministration',
    title: '<div class="panel-title-style-16">' + climatestation.Utils.getTranslation('layeradministration') + '</div>',
    header: {
        titlePosition: 0,
        titleAlign: 'center',
        iconCls: 'layers'
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
    width: 1300,

    border:false,
    frame: false,
    bodyBorder: false,
    layout: {
        type  : 'fit',
        padding: 1
    },

    listeners: {
        close: 'onClose'
        // ,show: 'onShow'
    },
    session:true,

    initComponent: function () {
        var me = this;
        var user = climatestation.getUser();

        me.title = '<div class="panel-title-style-16">' + climatestation.Utils.getTranslation('layeradministration') + '</div>';
        me.height = Ext.getBody().getViewSize().height < 625 ? Ext.getBody().getViewSize().height-130 : 625;  // 600,
        me.width = climatestation.globals['typeinstallation'].toLowerCase() == 'jrc_online' ? 1080: 1300;

        me.tools = [
        {
            type: 'refresh',
            align: 'c-c',
            tooltip: climatestation.Utils.getTranslation('refreshlayerslist'),    // 'Refresh layers list',
            callback: 'loadLayersStore'
        }];

        me.tbar = Ext.create('Ext.toolbar.Toolbar', {
            padding: 3,
            items: [{
                xtype: 'button',
                text: climatestation.Utils.getTranslation('addlayer'),    // 'Add layer',
                name: 'addlayer',
                iconCls: 'far fa-plus-circle green',
                // style: {color: 'green'},
                hidden: false,
                // glyph: 'xf055@FontAwesome',
                scale: 'medium',
                handler: 'addLayer'
            },{
                xtype: 'container',
                html: '<div id="boundaries_disclaimer' + me.id + '" style="text-align:left; vertical-align: top; line-height:12px !important; font-size: 12px; font-weight: bold;">'+climatestation.Utils.getTranslation('boundaries_disclaimer')+'</div>',
                margin: '0 0 0 40',
                padding: 0
            }]
        });

        me.items = [{
            xtype : 'grid',
            reference: 'layersGrid',
            bind: '{layers}',

            bufferedRenderer: false,

            viewConfig: {
                stripeRows: false,
                enableTextSelection: true,
                draggable: false,
                markDirty: false,
                resizable: false,
                disableSelection: false,
                trackOver: true,
                forceFit:true,
                preserveScrollOnRefresh: true
            },

            selModel : {
                allowDeselect : false,
                mode:'SINGLE',
                listeners: {}
            },

            //cls: 'grid-color-yellow',
            hideHeaders: false,
            collapsible: false,
            enableColumnMove:false,
            enableColumnResize:true,
            sortableColumns:true,
            multiColumnSort: false,
            columnLines: true,
            rowLines: true,
            frame: false,
            border: false,
            bodyBorder: false,

            listeners: {
                //scope: 'controller',
                //afterrender: 'loadLayersGrid',
                //rowclick: 'layersGridRowClick'
            },

            columns: [{
                xtype: 'actioncolumn',
                header: climatestation.Utils.getTranslation('edit'),   // 'Edit layer',
                menuDisabled: true,
                sortable: true,
                variableRowHeight : true,
                draggable:false,
                groupable:false,
                hideable: false,
                width: 80,
                align: 'center',
                stopSelection: false,

                items: [{
                    // scope: me,
                    width:'35',
                    disabled: false,
                    getClass: function (v, meta, rec) {
                        if (rec.get('defined_by') != 'JRC' || (climatestation.Utils.objectExists(user) && user.userlevel == 1)){
                            return 'far fa-edit';
                        }
                        else return 'far fa-eye';
                    },
                    getTip: function (v, meta, rec) {
                        return climatestation.Utils.getTranslation('editlayerproperties') + ' ' + rec.get('layername');
                    },
                    handler: 'editLayer'
                }]
            }, {
                text: climatestation.Utils.getTranslation('layername'),  // 'Layer name',
                width: 200,
                dataIndex: 'layername',
                cellWrap:true,
                menuDisabled: true,
                sortable: true,
                variableRowHeight : true,
                draggable:false,
                groupable:false,
                hideable: false
            //}, {
            //    text: climatestation.Utils.getTranslation('description'),  // 'Description',
            //    width: 250,
            //    dataIndex: 'description',
            //    hidden: false
            //}, {
            //    text: 'Layer path',
            //    width: 200,
            //    dataIndex: 'layerpath',
            //    hidden: false
            }, {
                text: climatestation.Utils.getTranslation('layerfilename'),  // 'File name',
                width: 250,
                dataIndex: 'filename',
                hidden: false,
                menuDisabled: true,
                sortable: true,
                variableRowHeight : true,
                draggable:false,
                groupable:false,
                hideable: false
            }, {
                text: climatestation.Utils.getTranslation('layerorderindex'),  // 'Order index',
                width: 100,
                dataIndex: 'layerorderidx',
                hidden: false,
                menuDisabled: true,
                sortable: true,
                variableRowHeight : true,
                draggable:false,
                groupable:false,
                hideable: false
            //}, {
            //    text: climatestation.Utils.getTranslation('layertype'),  // 'Layer type',
            //    width: 110,
            //    dataIndex: 'layertype',
            //    hidden: false,
            //    menuDisabled: true,
            //    sortable: true,
            //    variableRowHeight : true,
            //    draggable:false,
            //    groupable:false,
            //    hideable: false
            //}, {
            //    text: 'projection',
            //    width: 110,
            //    dataIndex: 'projection',
            //    hidden: false
            }, {
                text: climatestation.Utils.getTranslation('layermenu'),  // 'Menu',
                width: 120,
                dataIndex: 'menu',
                hidden: false,
                menuDisabled: true,
                sortable: true,
                variableRowHeight : true,
                draggable:false,
                groupable:false,
                hideable: false,
                renderer: function(value){
                    return climatestation.Utils.getTranslation(value+'layers');
                }
            }, {
                text: climatestation.Utils.getTranslation('layersubmenu'),  // 'Sub menu',
                width: 200,
                dataIndex: 'submenu',
                hidden: false,
                menuDisabled: true,
                sortable: true,
                variableRowHeight : true,
                draggable:false,
                groupable:false,
                hideable: false
            }, {
                xtype: 'actioncolumn',
                header: climatestation.Utils.getTranslation('layeractive'),  // 'Active',
                menuDisabled: true,
                sortable: true,
                variableRowHeight : true,
                draggable:false,
                groupable:false,
                hideable: true,
                hidden: (climatestation.globals['typeinstallation'].toLowerCase() == 'jrc_online' || climatestation.globals['typeinstallation'].toLowerCase() == 'online'),
                width: 100,
                align: 'center',
                stopSelection: false,
                items: [{
                    // scope: me,
                    disabled: false,
                    style: {"line-height": "70px"},
                    getClass: function(v, meta, rec) {
                        if (rec.get('enabled')) {
                            return 'far fa-check-square green';   // 'activated';
                        } else {
                            return 'far fa-square green';   // 'deactivated';
                        }
                    },
                    getTip: function(v, meta, rec) {
                        if (rec.get('enabled')) {
                            return climatestation.Utils.getTranslation('tipdisablelayerinmenu');     // 'Disable layer to be visible in layer menu';
                        } else {
                            return climatestation.Utils.getTranslation('tipenablelayerinmenu');     // 'Enable layer to be visible in layer menu';
                        }
                    },
                    handler: function(grid, rowIndex, colIndex) {
                        var rec = grid.getStore().getAt(rowIndex),
                            action = (rec.get('enabled') ? 'deactivated' : 'activated');
                        // Ext.toast({ html: action + ' ' + rec.get('productcode'), title: 'Action', width: 300, align: 't' });
                        rec.get('enabled') ? rec.set('enabled', false) : rec.set('enabled', true);
                    }
                }]
            }, {
                xtype: 'actioncolumn',
                header: climatestation.Utils.getTranslation('autoloadinmapview'),  // 'Auto load in Mapview',
                menuDisabled: true,
                sortable: true,
                variableRowHeight: true,
                draggable: false,
                groupable: false,
                hideable: true,
                hidden: (climatestation.globals['typeinstallation'].toLowerCase() == 'jrc_online' || climatestation.globals['typeinstallation'].toLowerCase() == 'online'),
                width: 135,
                align: 'center',
                stopSelection: false,
                items: [{
                    // scope: me,
                    disabled: false,
                    style: {"line-height": "70px"},
                    getClass: function (v, meta, rec) {
                        if (rec.get('open_in_mapview')) {
                            return 'far fa-check-square green';   // 'activated';
                        } else {
                            return 'far fa-square green';   // 'deactivated';
                        }
                    },
                    getTip: function (v, meta, rec) {
                        if (rec.get('open_in_mapview')) {
                            return climatestation.Utils.getTranslation('tipnotautoloadinmapview');     // 'Do not auto load in new opened Mapviews';
                        } else {
                            return climatestation.Utils.getTranslation('tipautoloadinmapview');     // 'Auto load in new opened Mapviews';
                        }
                    },
                    handler: function (grid, rowIndex, colIndex) {
                        var rec = grid.getStore().getAt(rowIndex),
                            action = (rec.get('open_in_mapview') ? 'deactivated' : 'activated');
                        rec.get('open_in_mapview') ? rec.set('open_in_mapview', false) : rec.set('open_in_mapview', true);
                    }
                }]
            },{
                xtype: 'actioncolumn',
                header: climatestation.Utils.getTranslation('delete'),   // 'Edit layer',
                menuDisabled: true,
                sortable: true,
                variableRowHeight : true,
                draggable:false,
                groupable:false,
                hideable: false,
                width: 80,
                align: 'center',
                stopSelection: false,

                items: [{
                    // scope: me,
                    width:'45',
                    disabled: false,
                    getClass: function(v, meta, rec) {
                        if (rec.get('deletable') || rec.get('defined_by') != 'JRC' || (climatestation.Utils.objectExists(user) && user.userlevel == 1)){
                            return 'far fa-trash-alt red';
                        }
                    },
                    getTip: function(v, meta, rec) {
                        if (rec.get('deletable') || rec.get('defined_by') != 'JRC' || (climatestation.Utils.objectExists(user) && user.userlevel == 1)){
                            return climatestation.Utils.getTranslation('deletelayer') + ' ' + rec.get('layername');
                        }
                    },
                    handler: 'deleteLayer'
                }]
            }]
        }];

        me.callParent();
    }
});
