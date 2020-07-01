
Ext.define("climatestation.view.datamanagement.requestsAdmin",{
    extend: "Ext.grid.Panel",

    requires: [
        "Ext.grid.column.Action",
        "climatestation.view.datamanagement.requestsAdminController",
        "climatestation.view.datamanagement.requestsAdminModel",
        'climatestation.Utils'
    ],

    controller: "datamanagement-requestsadmin",
    viewModel: {
        type: "datamanagement-requestsadmin"
    },

    xtype  : 'requestsadmin',

    title: climatestation.Utils.getTranslation('myrequests'),
    header: {
        hidden: false,
        titlePosition: 0,
        titleAlign: 'center',
        focusable: true
    },

    autoShow : false,
    hidden: true,

    floating: true,
    closable: true,
    closeAction: 'hide',
    maximizable: false,
    collapsible: false,
    resizable: false,
    autoScroll: true,
    layout: 'fit',
    height: 300,
    width: 785,

    border:false,
    frame: false,
    bodyBorder: true,
    defaultAlign: 'tl-bc',
    bind: '{requests}',

    selModel : {
        allowDeselect : true,
        mode:'MULTI'
    },

    hideHeaders: false,
    enableColumnMove:false,
    enableColumnResize:true,
    sortableColumns:true,
    multiColumnSort: false,
    columnLines: true,
    rowLines: true,
    cls: 'newpanelstyle',

    config: {
        forceStoreLoad: false,
        dirtyStore: false
    },

    initComponent: function () {
        var me = this;

        me.title = climatestation.Utils.getTranslation('myrequests');

        me.hidden = true;

        me.viewConfig = {
            defaultAlign: 'tl-bc',
            stripeRows: false,
            enableTextSelection: true,
            draggable: false,
            markDirty: false,
            disableSelection: false,
            trackOver: true,
            forceFit: true
        };

        me.mon(me, {
            loadstore: function() {
                me.focus(true);

                if (me.forceStoreLoad || !me.getViewModel().getStore('requests').isLoaded() || me.dirtyStore) {
                    // me.getViewModel().getStore('requests').proxy.extraParams = {userid: climatestation.getUser().userid};
                    // var myMask = new Ext.LoadMask({
                    //     target : me
                    // });
                    // myMask.show();
                    me.getViewModel().getStore('requests').load({
                        callback: function (records, options, success, message) {
                            if (!success){
                                Ext.Msg.show({
                                    title: climatestation.Utils.getTranslation('internet_proxy_error_title'),
                                    message: climatestation.Utils.getTranslation('internet_proxy_error_msg'),
                                    buttons: Ext.Msg.OK,
                                    icon: Ext.Msg.WARNING,
                                    fn: function(btn) {
                                        if (btn === 'ok') {
                                            // todo: go to system tab?
                                        }
                                    }
                                });
                            }
                            // me.updateLayout();
                            // myMask.hide();
                        }
                    });
                    me.forceStoreLoad = false;
                    me.dirtyStore = false;
                    // console.info(me.getViewModel().getStore('requests'));
                }
            }
        });

        me.listeners = {
            afterrender: function(){
                me.alignTarget = me.owner;
                me.focus(true);
            },
            show: function(){
                me.dirtyStore = true;
                me.fireEvent('loadstore');
                me.focus(true);
            }
            ,focusleave: function(){
                if (Ext.isObject(me.myMask)) {
                    me.myMask.hide();
                }
                me.hide();
            }
        };

        me.tools = [
        {
            type: 'refresh',
            align: 'c-c',
            tooltip: climatestation.Utils.getTranslation('refreshrequestslist'),    // 'Refresh requests list',
            callback: function() {
                me.forceStoreLoad = true;
                me.fireEvent('loadstore');
            }
        }];

        // me.bbar = Ext.create('Ext.toolbar.Toolbar', {
        //     // focusable: true,
        //     items: [{
        //         xtype: 'button',
        //         text: climatestation.Utils.getTranslation('openselected'),    // 'Open selected',
        //         name: 'addlayer',
        //         iconCls: 'fa fa-folder-open-o fa-2x',
        //         style: {color: 'green'},
        //         hidden: false,
        //         // glyph: 'xf055@FontAwesome',
        //         scale: 'medium',
        //         handler: 'openMapTemplates'
        //     }]
        // });

        me.defaults =  {
            cellWrap:true,
            menuDisabled: true,
            sortable: false,
            variableRowHeight : true,
            draggable:false,
            groupable:false,
            hideable: false
        };

        me.columns = [{
            xtype: 'actioncolumn',
            header: climatestation.Utils.getTranslation('status'),   // 'Status',
            menuDisabled: true,
            sortable: false,
            variableRowHeight : true,
            draggable:false,
            groupable:false,
            hideable: false,
            width: 65,
            align: 'center',
            stopSelection: false,

            items: [{
                width:'45',
                disabled: false,
                getClass: function(v, meta, rec) {
                    if (rec.get('status').toLowerCase()=='running'){
                        // return 'fa fa-pause-circle-o fa-2x green';
                        return 'pause'
                    }
                    else if (rec.get('status').toLowerCase()=='paused'){
                        // return 'fa fa-play-circle-o fa-2x orange';
                        return 'play'
                    }
                    else if (rec.get('status').toLowerCase()=='finished'){
                        // return 'fa fa-play-circle-o fa-2x orange';
                        return 'finished'
                    }
                    else {
                        // return 'fa fa-exclamation-circle fa-2x red';
                        // There is an error in the request job, give the user the possibility to restart the job
                        return 'playred'     // 'exclamation'
                    }
                },
                getTip: function(v, meta, rec) {
                    if (rec.get('status').toLowerCase()=='running'){
                        return climatestation.Utils.getTranslation('request') + ' ' + rec.get('status').toLowerCase() + ', ' + climatestation.Utils.getTranslation('request_click_to_pause');   // 'Request'  'click to Pause request!'
                    }
                    else if (rec.get('status').toLowerCase()=='paused'){
                        return climatestation.Utils.getTranslation('request') + ' ' + rec.get('status').toLowerCase() + ', ' + climatestation.Utils.getTranslation('request_click_to_run');   // 'Request'  'click to Run request!'
                    }
                    else if (rec.get('status').toLowerCase()=='finished'){
                        return climatestation.Utils.getTranslation('request') + ' ' + rec.get('status').toLowerCase();   // 'Request'
                    }
                    else {
                       return climatestation.Utils.getTranslation('request_status') + ': ' + rec.get('status');   // 'Request status'
                    }
                },
                handler: 'runPauseRequest'
            }]
        },{
            text: climatestation.Utils.getTranslation('level'),  // 'Level',
            width: 75,
            dataIndex: 'level',
            cellWrap:true,
            menuDisabled: true,
            sortable: true,
            variableRowHeight : true,
            draggable:false,
            groupable:false,
            hideable: false
        },{
            xtype:'templatecolumn',
            header: climatestation.Utils.getTranslation('product'),    // 'Product',
            tpl: new Ext.XTemplate(
                '<b>{prod_descriptive_name}</b>' +
                '<tpl if="version != \'undefined\'">',
                    '<b class="smalltext"> - {version}</b>',
                '</tpl>',
                '</br><span class="smalltext">' +
                '<b>{productcode}</b>' +
                '<tpl if="version != \'undefined\'">',
                    '<b> - {version}</b>',
                '</tpl>',
                ' - <b>{mapsetcode}</b>' +
                '<tpl if="subproductcode != \'\'">',
                    ' - <b>{subproductcode}</b>',
                '</tpl>',
                '</span></br>' +
                '<span class="smalltext">' +
                '<b style="color:darkgrey;">' + climatestation.Utils.getTranslation("requestid") + ': {requestid}</b>' +
                '</span></br>'
            ),
            width: 350,
            cellWrap:true,
            menuDisabled: true,
            sortable: true,
            variableRowHeight : true,
            draggable:false,
            groupable:false,
            hideable: false
        },{
            text: climatestation.Utils.getTranslation('totalfiles'),  // 'Total files',
            width: 120,
            dataIndex: 'totfiles',
            cellWrap:true,
            menuDisabled: true,
            sortable: false,
            variableRowHeight : true,
            draggable:false,
            groupable:false,
            hideable: false
        },{
            text: climatestation.Utils.getTranslation('ok'),  // 'Ok',
            width: 45,
            dataIndex: 'totok',
            cellWrap:true,
            menuDisabled: true,
            sortable: false,
            variableRowHeight : true,
            draggable:false,
            groupable:false,
            hideable: false
        },{
            text: climatestation.Utils.getTranslation('error'),  // 'Error',
            width: 80,
            dataIndex: 'totko',
            cellWrap:true,
            menuDisabled: true,
            sortable: false,
            variableRowHeight : true,
            draggable:false,
            groupable:false,
            hideable: false
        },{
            xtype: 'actioncolumn',
            // header: climatestation.Utils.getTranslation('delete'),   // 'Delete',
            width: 45,
            align: 'center',
            stopSelection: false,
            cellWrap:true,
            menuDisabled: true,
            sortable: false,
            variableRowHeight : true,
            draggable:false,
            groupable:false,
            hideable: false,
            items: [{
                width:'45',
                disabled: false,
                getClass: function(v, meta, rec) {
                    return 'delete';
                    // if (rec.get('status').toLowerCase()!='running' && rec.get('status').toLowerCase()!='paused'){
                    //    return 'delete';
                    // }
                },
                getTip: function(v, meta, rec) {
                    return climatestation.Utils.getTranslation('delete_request') + ': ' + rec.get('requestid');   // 'Delete request'
                },
                handler: 'deleteRequest'
            }]
        }];

        me.callParent();

    }
});
