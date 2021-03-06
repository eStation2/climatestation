
Ext.define("climatestation.view.analysis.legendAdmin",{
    extend: "Ext.window.Window",

    requires: [
        "climatestation.view.analysis.legendAdminController",
        "climatestation.view.analysis.legendAdminModel",
        'Ext.grid.column.Action',
        'climatestation.Utils'
    ],

    controller: "analysis-legendadmin",
    viewModel: {
        type: "analysis-legendadmin"
    },

    id: 'legendsadministration',
    title: '<div class="panel-title-style-16">' + climatestation.Utils.getTranslation('legendsadministration') + '</div>',
    header: {
        titlePosition: 0,
        titleAlign: 'center',
        iconCls: 'legends'
    },
    // constrainHeader: Ext.getBody(),

    modal: true,
    closable: true,
    closeAction: 'destroy', // 'destroy',
    maximizable: false,
    resizable: false,
    //resizeHandles: 'n,s',
    scrollable: true,
    height: Ext.getBody().getViewSize().height < 625 ? Ext.getBody().getViewSize().height-130 : 625,  // 600,
    minHeight: 625,
    // maxHeight: 625,
    width: 860,
    // autoWidth: true,

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
    config: {
        assign: false,
        productname: null,
        productcode: null,
        productversion: null,
        subproductcode: null,
        productNavigatorObj: null
    },

    initComponent: function () {
        var me = this;
        var user = climatestation.getUser();
        var selMode = 'SINGLE'

        me.width = (climatestation.Utils.objectExists(user) && user.userlevel == 1) ? 860+90 : 860

        me.height = Ext.getBody().getViewSize().height < 625 ? Ext.getBody().getViewSize().height-130 : 625;  // 600,

        if (me.assign){
            me.title = '<div class="panel-title-style-16">' + climatestation.Utils.getTranslation('assign_legends_to') + ': ' + me.productname + '<b class="smalltext"> - ' + me.productcode + ' - '  + me.productversion + ' - '  + me.subproductcode + '</b>' + '</div>'  // 'Assign legends to <productname>'
            selMode = 'MULTI'

            me.bbar = [{
                xtype: 'box',
                html: '<b style="color:orangered">' + climatestation.Utils.getTranslation('hold_clrl_multiple_select') + '</b>'   // 'Hold the [Ctrl] key for multiple selections!'
            },
            '->',{
                reference: 'assignLegendsBtn',
                text: climatestation.Utils.getTranslation('assign_selected_legends'), // 'Assign selected legends'
                iconCls:'far fa-plus-circle green',
                // style: {color:'green'},
                handler: function(){
                    var selrec = me.lookupReference('legendsGrid').getSelectionModel().getSelected();
                    var selected_legendids = [];
                    for ( var i=0, len=selrec.items.length; i<len; ++i ){
                      selected_legendids.push(selrec.items[i].data.legendid);
                    }

                    Ext.Ajax.request({
                       url:'legends/assignlegends',
                       params:{
                           productcode: me.productcode,
                           productversion: me.productversion,
                           subproductcode: me.subproductcode,
                           legendids:Ext.util.JSON.encode(selected_legendids)
                       },
                       method: 'POST',
                       waitMsg: climatestation.Utils.getTranslation('assigning_legends'), // 'Assigning legends...',
                       scope:this,
                       success: function(result, request) {
                           // The success handler is called if the XHR request actually
                           // made it to the server and a response of some kind occurs.
                           var returnData = Ext.util.JSON.decode(result.responseText);
                           if (returnData.success){
                               // var selecteddataset = me.lookupReference('mapset-dataset-grid').getSelectionModel().getSelected().items[0];
                               // me.getController().mapsetDataSetGridRowClick(this, selecteddataset);

                               // filters.remove(excludeProductLegends);
                               Ext.toast({html: climatestation.Utils.getTranslation('legends_assiged'), title: climatestation.Utils.getTranslation('legends_assiged'), width: 200, align: 't'});
                               me.close();
                           } else if(!returnData.success){
                               climatestation.Utils.showError(returnData.message || result.responseText);
                           }
                       }, // eo function onSuccess
                       failure: function(result, request) {
                           // The failure handler is called if there's some sort of network error,
                           // like you've unplugged your ethernet cable, the server is down, etc.
                           var returnData = Ext.util.JSON.decode(result.responseText);
                           climatestation.Utils.showError(returnData.message || result.responseText);
                       } // eo function onFailure
                    });
                }
            }];
        }
        else {
            me.title = '<div class="panel-title-style-16">' + climatestation.Utils.getTranslation('legendsadministration') + '</div>';
        }

        me.tools = [
        {
            type: 'refresh',
            align: 'c-c',
            tooltip: climatestation.Utils.getTranslation('refreshlegendslist'),    // 'Refresh legend list',
            callback: 'loadLegendsStore'
        }];

        me.tbar = Ext.create('Ext.toolbar.Toolbar', {
            padding: 3,
            items: [{
                xtype: 'button',
                text: climatestation.Utils.getTranslation('newlegend'),    // 'New legend',
                name: 'newlegend',
                iconCls: 'far fa-plus-circle green',
                // style: {color: 'green'},
                hidden: false,
                // glyph: 'xf055@FontAwesome',
                scale: 'medium',
                handler: 'newLegend'
            },{
                xtype: 'button',
                text: climatestation.Utils.getTranslation('copylegend'),    // 'Copy legend',
                name: 'copylegend',
                iconCls: 'far fa-copy',
                // style: {color: 'black'},
                hidden: false,
                // glyph: 'xf055@FontAwesome',
                scale: 'medium',
                handler: 'copyLegend'
            // },{
            //     xtype: 'button',
            //     text: climatestation.Utils.getTranslation('exportlegend'),    // 'Export legend',
            //     name: 'exportlegend',
            //     iconCls: 'far fa-download',
            //     style: {color: 'black'},
            //     hidden: false,
            //     // glyph: 'xf055@FontAwesome',
            //     scale: 'medium',
            //     handler: 'exportLegend'
            // },{
            //     xtype: 'button',
            //     text: climatestation.Utils.getTranslation('importlegend'),    // 'Import legend',
            //     name: 'importlegend',
            //     iconCls: 'far fa-upload',
            //     style: {color: 'blue'},
            //     hidden: false,
            //     // glyph: 'xf055@FontAwesome',
            //     scale: 'medium',
            //     handler: 'importLegend'
            }]
        });

        me.items = [{
            xtype : 'grid',
            reference: 'legendsGrid',
            bind: '{legends}',
            bufferedRenderer: false,
            viewConfig: {
                stripeRows: false,
                enableTextSelection: true,
                draggable: false,
                markDirty: false,
                // resizable: true,
                // disableSelection: false,
                // trackOver: true,
                preserveScrollOnRefresh: true,
                forceFit:true
            },

            selModel : {
                allowDeselect : false,
                mode: selMode
                // ,listeners: {
                //     doubleclick: 'editLegend'
                // }
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

            // listeners: {
            //     // bodyscroll: function(scrollLeft, scrollTop){
            //     //      console.log('scrolling grid ... ');
            //     // },
            //     // scope: 'controller',
            //     // afterrender: 'loadLegendsStore',
            //     rowdblclick : 'editLegend'
            // },

            columns: [{
                xtype: 'actioncolumn',
                // header: climatestation.Utils.getTranslation('actions'),   // 'Actions',
                menuDisabled: true,
                sortable: true,
                variableRowHeight : true,
                draggable:false,
                groupable:false,
                hideable: false,
                width: 40,
                align: 'center',
                stopSelection: false,

                items: [{
                    // scope: me,
                    width:'35',
                    disabled: false,
                    getClass: function (v, meta, rec) {
                        if (rec.get('defined_by')!='JRC' || (climatestation.Utils.objectExists(user) && user.userlevel == 1)){   // JRC user has userlevel 1 and can always edit legends.
                            return 'far fa-edit';
                        }
                        else return 'far fa-eye';
                    },
                    getTip: function (v, meta, rec) {
                        if (rec.get('defined_by')!='JRC' || (climatestation.Utils.objectExists(user) && user.userlevel == 1)){   // JRC user has userlevel 1 and can always edit legends.
                            return climatestation.Utils.getTranslation('editlegendproperties') + ' "' + rec.get('legend_descriptive_name') + '"';
                        }
                    },
                    handler: 'editLegend'
                }]
            }, {
                text: climatestation.Utils.getTranslation('legend_descriptive_name'),  // 'Sub menu',
                width: 270,
                dataIndex: 'legend_descriptive_name',
                cellWrap:true,
                menuDisabled: true,
                sortable: true,
                variableRowHeight : true,
                draggable:false,
                groupable:false,
                hideable: false
            }, {
                text: climatestation.Utils.getTranslation('colourscheme'),  // 'Colour Scheme',
                width: 270,
                dataIndex: 'colourscheme',
                cellWrap:true,
                menuDisabled: true,
                sortable: true,
                variableRowHeight : true,
                draggable:false,
                groupable:false,
                hideable: false
            }, {
                text: climatestation.Utils.getTranslation('minvalue'),  // 'Min value',
                width: 105,
                dataIndex: 'minvalue',
                menuDisabled: true,
                sortable: true,
                variableRowHeight : true,
                draggable:false,
                groupable:false,
                hideable: false
            }, {
                text: climatestation.Utils.getTranslation('maxvalue'),  // 'Max value',
                width: 105,
                dataIndex: 'maxvalue',
                menuDisabled: true,
                sortable: true,
                variableRowHeight: true,
                draggable: false,
                groupable: false,
                hideable: false
            }, {
                text: climatestation.Utils.getTranslation('definedby'),  // 'Defined by',
                width: 90,
                dataIndex: 'defined_by',
                cellWrap:true,
                menuDisabled: true,
                sortable: true,
                variableRowHeight : true,
                draggable:false,
                groupable:false,
                hidden: (climatestation.Utils.objectExists(user) && user.userlevel == 1) ? false : true
            },{
                xtype: 'actioncolumn',
                // header: climatestation.Utils.getTranslation('delete'),   // 'Actions',
                menuDisabled: true,
                sortable: true,
                variableRowHeight : true,
                draggable:false,
                groupable:false,
                hideable: false,
                width: 40,
                align: 'center',
                stopSelection: false,

                items: [{
                    // scope: me,
                    width: '35',
                    disabled: false,
                    getClass: function (v, meta, rec) {
                        if (rec.get('defined_by') != 'JRC' || (climatestation.Utils.objectExists(user) && user.userlevel == 1)) {
                            return 'far fa-trash-alt red';
                        }
                    },
                    getTip: function (v, meta, rec) {
                        return climatestation.Utils.getTranslation('deletelegend') + ' "' + rec.get('legend_descriptive_name') + '"';
                    },
                    handler: 'deleteLegend'
                },{
                    width:'35',
                    disabled: false,
                    getClass: function(v, meta, rec) {
                        if ((climatestation.Utils.objectExists(user) && user.userlevel == 1)){
                            return 'download';
                        }
                    },
                    getTip: function(v, meta, rec) {
                        if ((climatestation.Utils.objectExists(user) && user.userlevel == 1)){
                            return climatestation.Utils.getTranslation('downloadlegend') + ' "' + rec.get('export_in_qgis_format') + '"';
                        }
                    },
                    handler: 'exportLegend'
                }]
            }]
        }];

        me.callParent();
    }
});
