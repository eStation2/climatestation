
Ext.define("climatestation.view.dashboard.PC2",{
    extend: "Ext.panel.Panel",
    controller: "dashboard-pc2",
    viewModel: {
        type: "dashboard-pc2"
    },
    xtype  : 'dashboard-pc2',

    requires: [
        'Ext.Img',
        'Ext.button.Split',
        'Ext.layout.container.Border',
        'Ext.layout.container.Table',
        'Ext.layout.container.VBox',
        'Ext.menu.Menu',
        'Ext.toolbar.Spacer',
        'Ext.toolbar.Toolbar',
        'climatestation.Utils',
        'climatestation.view.dashboard.PC2Controller',
        'climatestation.view.dashboard.PC2Model',
        'climatestation.view.widgets.ServiceMenuButton'
    ],

    name:'dashboardpc',
    id: 'dashboardpc',

    title: '<span class="panel-title-style">' + climatestation.Utils.getTranslation('processing_pc2') + '</span>',
    paneltitle:'',
    setdisabledPartial:false,
    setdisabledAll:false,
    activePC:false,
    activeversion: '',
    currentmode: '',
    dbstatus:false,
    internetconnection:false,
    dbautosync: false,
    datautosync: false,
    autosync_onoff: false,

    layout: 'border',
    bodyBorder: true,
    bodyPadding:0,
    flex:1,


    initComponent: function () {
        var me = this;
        me.setTitle('<span class="panel-title-style">' + me.paneltitle + '</span>');

        me.bodyPadding = 0;

        if (me.activePC) {
            me.toolbarCls = 'active-panel-body-style';
            me.textCls = 'panel-text-style';
        }
        else {
            me.toolbarCls = '';
            me.textCls = 'panel-text-style-gray';
        }

        me.diskstatusCls = '';
        if (me.diskstatus)
            me.diskstatusCls = 'x-tool-okay';
        else if (me.diskstatus === false)
            me.diskstatusCls = 'x-tool-notokay';

        me.dbstatusCls = '';
        if (me.dbstatus)
            me.dbstatusCls = 'running';
        else if (me.dbstatus === false)
            me.dbstatusCls = 'notrunning';

        me.internetCls = '';
        if (me.internetconnection === true || me.internetconnection === 'true')
            me.internetCls = 'connected';
        else if (me.internetconnection === false || me.internetconnection === 'false')
            me.internetCls = 'notconnected';

        me.service_eumetcast_Style = 'gray';
        me.service_internet_Style = 'gray';
        me.service_ingest_Style = 'gray';
        me.service_processing_Style = 'gray';
        me.service_system_Style = 'gray';

        if (me.service_eumetcast === 'true')
            me.service_eumetcast_Style = 'green';
        else if (me.service_eumetcast === 'false')
            me.service_eumetcast_Style = 'red';

        if (me.service_internet === 'true')
            me.service_internet_Style = 'green';
        else if (me.service_internet === 'false')
            me.service_internet_Style = 'red';

        if (me.service_ingest === 'true')
            me.service_ingest_Style = 'green';
        else if (me.service_ingest === 'false')
            me.service_ingest_Style = 'red';

        if (me.service_processing === 'true')
            me.service_processing_Style = 'green';
        else if (me.service_processing === 'false')
            me.service_processing_Style = 'red';

        if (me.service_system === 'true')
            me.service_system_Style = 'green';
        else if (me.service_system === 'false')
            me.service_system_Style = 'red';

        // me.autosync_onoff = me.currentmode != 'Recovery';

        me.tbar = Ext.create('Ext.toolbar.Toolbar', {
            layout: {
                type: 'vbox',
                // pack: 'left',
                align: 'middle'
            },
            // padding: '5 5 10 0',
            cls: me.toolbarCls,
            defaults: {
                minWidth: 175,
                textAlign: 'middle',
                disabled: me.setdisabledAll,
                // style: {
                //     "margin-right": '8px'
                // },
            },
            items: [
                {
                    xtype: 'servicemenubutton',
                    service: 'eumetcast',
                    text: climatestation.Utils.getTranslation('eumetcast'),     // 'Eumetcast',
                    handler: 'checkStatusServices',
                    iconCls: me.service_eumetcast_Style,
                    // style: {
                    //     "color": me.service_eumetcast_Style
                    // },
                    disabled: me.setdisabledPartial
                }, ' ',
                {
                    xtype: 'servicemenubutton',
                    service: 'internet',
                    text: climatestation.Utils.getTranslation('internet'),     // 'Internet',
                    handler: 'checkStatusServices',
                    iconCls: me.service_internet_Style,
                    // style: {
                    //     "color": me.service_internet_Style
                    // },
                    disabled: me.setdisabledPartial
                }, ' ',
                {
                    xtype: 'servicemenubutton',
                    service: 'ingest',
                    text: climatestation.Utils.getTranslation('ingest'),     // 'Ingest',
                    handler: 'checkStatusServices',
                    iconCls: me.service_ingest_Style,
                    // style: {
                    //     "color": me.service_ingest_Style
                    // },
                    disabled: me.setdisabledPartial
                }, ' ',
                {
                    xtype: 'servicemenubutton',
                    service: 'processing',
                    text: climatestation.Utils.getTranslation('processing'),     // 'Processing',
                    handler: 'checkStatusServices',
                    iconCls: me.service_processing_Style,
                    // style: {
                    //     "color": me.service_processing_Style
                    // },
                    disabled: me.setdisabledPartial
                }, ' ',
                {
                    xtype: 'servicemenubutton',
                    service: 'system',
                    text: climatestation.Utils.getTranslation('system'),     // 'System',
                    handler: 'checkStatusServices',
                    iconCls: me.service_system_Style,
                    // style: {
                    //     "color": me.service_system_Style
                    // },
                    disabled: me.setdisabledAll ? true : false // me.setdisabledPartial
                }, '-',
                {
                xtype: 'button',
                name: 'datasyncbtn',
                text: climatestation.Utils.getTranslation('datasynchronization'),     // 'Data Synchronization',
                iconCls: 'data-sync',       // 'far fa-exchange',  //  fa-spin 'icon-loop', // icomoon fonts
                //style: { color: 'blue' },
                scale: 'medium',
                width: 255,
                // handler: function(){this.showMenu();},
                menu: Ext.create('Ext.menu.Menu', {
                    width: 230,
                    margin: '0 0 10 0',
                    floating: true,
                    items: [
                        //{   xtype: 'checkbox',
                        //    boxLabel: climatestation.Utils.getTranslation('autosyncdata'),     // 'Auto Sync Data',
                        //    name: 'enabledisableautosync',
                        //    checked   : me.datautosync,
                        //    disabled: me.autosync_onoff,
                        //    handler: 'execEnableDisableAutoSync'
                        //},
                        {
                            text: climatestation.Utils.getTranslation('viewlogfile'),    // 'View log file',
                            name: 'view_logfile_datasync',
                            service: 'datasync',
                            task: 'logfile',
                            iconCls:'log-icon-small',
                            handler: 'viewLogFile'
                        }
                        //{   text: climatestation.Utils.getTranslation('executenow'),     // 'Execute Now',
                        //    name: 'executenow',
                        //    glyph: 'xf04b@FontAwesome',
                        //    cls:'menu-glyph-color-green',
                        //    handler: 'execManualDataSync'
                        //}
                    ]
                })
            },{
                xtype: 'button',
                name: 'dbsyncbtn',
                text: climatestation.Utils.getTranslation('dbsynchronization'),     // 'DB Synchronization',
                iconCls: 'db-sync',       // 'far fa-database',  //  fa-spin 'icon-loop', // icomoon fonts
                //style: { color: 'blue' },
                scale: 'medium',
                width: 255,
                // handler: function(){this.showMenu();},
                menu: Ext.create('Ext.menu.Menu', {
                    width: 230,
                    margin: '0 0 10 0',
                    floating: true,
                    items: [
//                        {   xtype: 'checkbox',
//                            boxLabel: climatestation.Utils.getTranslation('autosyncdb'),     // 'Auto Sync Database',
//                            name: 'enabledisableautodbsync',
//                            checked   : me.dbautosync,
//                            disabled: me.autosync_onoff,
////                            glyph: 'xf04b@FontAwesome',
////                            cls:'menu-glyph-color-green',
//                            handler: 'execEnableDisableAutoDBSync'
//                        },
                        {
                            text: climatestation.Utils.getTranslation('viewlogfile'),    // 'View log file',
                            name: 'view_logfile_dbsync',
                            service: 'dbsync',
                            task: 'logfile',
                            iconCls:'log-icon-small',
                            handler: 'viewLogFile'
                        }
                        //{   text: climatestation.Utils.getTranslation('executenow'),     // 'Execute Now',
                        //    name: 'executenow',
                        //    glyph: 'xf04b@FontAwesome',
                        //    cls:'menu-glyph-color-green',
                        //    handler: 'execManualDBSync'
                        //}
                    ]
                })
            }]
        });

        me.items = [{
            xtype: 'panel',
            region: 'center',
            layout: {
                type: 'table',
                columns: 2,
                tableAttrs: {
                    style: {
                        width: '100%',
                        padding:0
                    }
                }
            },
            bodyPadding:10,
            defaults: {
                margin:'0 0 10 0'
            },
            items: [{
                xtype: 'box',
                html: climatestation.Utils.getTranslation('activeversion'),     // 'Active version:',
                cls: me.textCls
            },{
                xtype: 'box',
                html: '<b>'+me.activeversion+'</b>',
                width: 120
            },{
                xtype: 'box',
                html: climatestation.Utils.getTranslation('mode'),     // 'Mode:',
                cls: me.textCls,
                width: 150
            },{
                xtype: 'box',
                html: '<b>'+me.currentmode+'</b>'
            },{
                xtype: 'box',
                html: climatestation.Utils.getTranslation('postgresql-status'),     // 'PostgreSQL Status:',
                cls: me.textCls,
                width: 150
            },{
                xtype: 'box',
                height:26,
                cls: me.dbstatusCls
                //src: 'resources/img/icons/check-square-o.png'
            },{
                xtype: 'box',
                html: climatestation.Utils.getTranslation('internetconnection'),     // 'Internet connection:',
                cls: me.textCls,
                width: 150
            },{
                xtype: 'box',
                height:26,
                cls: me.internetCls
                //src: 'resources/img/icons/check-square-o.png'
            }]
        //},{
        //    region: 'south',
        //    title: '&nbsp;' + climatestation.Utils.getTranslation('diskstatus'),     // , 'Disk status'
        //    split:false,
        //    collapsible:true,
        //    collapsed: true,
        //    hideCollapseTool: me.diskstatus == null ? true : false,
        //    // flex:1.5,
        //    iconCls: me.diskstatusCls,  // 'x-tool-okay', // 'far fa-check-circle-o', // fa-check-square fa-chevron-circle-down fa-check-circle fa-check
        //    iconAlign : 'left',
        //    height: 210,
        //    minHeight: 200,
        //    maxHeight: 210,
        //    layout: 'fit',
        //    style: {
        //        color: 'white'
        //    },
        //    items: [{
        //        xtype: 'image',
        //        src: 'resources/img/RAID_Monitor.png',
        //        width: 265,
        //        height: 158
        //    }]
        }];

        if (me.activePC) {
            me.items[0].bodyCls = 'active-panel-body-style';
            //me.bodyCls = 'active-panel-body-style';
            // me.controller.checkStatusServices();
        }
        else {
            me.items[0].bodyCls = '';
            //me.bodyCls = '';
        }


        me.callParent();
    }
});
