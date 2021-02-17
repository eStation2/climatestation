Ext.define('climatestation.view.dashboard.ServerStatusInfo', {
    extend: 'Ext.Panel',
    controller: "dashboard-server-status-info",
    xtype: 'dashboard-server-status-info',

    requires: [
        'climatestation.Utils'
    ],

    // cls: 'service-type shadow',
    height: 380,
    bodyPadding: 15,
    title: 'Server status information',
    layout: {
        type: 'hbox',
        align: 'stretch'
    },

    config: {
        dbstatus: false,
        internetconnection: true,
        dvb_status: false,
        tellicast_status: false,
        fts_status: false
    },

    initComponent: function () {
        var me = this;

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


        me.dvb_statusCls = '';
        if (me.dvb_status == true || me.dvb_status == 'true')
            me.dvb_statusCls = 'statusok';
        else if (me.dvb_status == false || me.dvb_status == 'false')
            me.dvb_statusCls = 'statusnotok';
        else if (me.dvb_status == null )
            me.dvb_statusCls = 'statuserror';

        me.tellicast_statusCls = '';
        if (me.tellicast_status == true || me.tellicast_status == 'true')
            me.tellicast_statusCls = 'statusok';
        else if (me.tellicast_status == false || me.tellicast_status == 'false')
            me.tellicast_statusCls = 'statusnotok';
        else if (me.tellicast_status == null )
            me.tellicast_statusCls = 'statuserror';

        me.fts_statusCls = '';
        if (me.fts_status == true || me.fts_status == 'true')
            me.fts_statusCls = 'statusok';
        else if (me.fts_status == false || me.fts_status == 'false')
            me.fts_statusCls = 'statusnotok';
        else if (me.fts_status == null )
            me.fts_statusCls = 'statuserror';

        me.defaults = {
            padding: 10,
            margin: 5
        };

        me.items = [{
            xtype: 'container',
            layout: {
                type: 'table',
                columns: 2,
                tableAttrs: {
                    style: {
                        width: '100%',
                        padding: 0
                    }
                }
            },
            bodyPadding: 10,
            defaults: {
                margin: '0 0 10 0'
            },
            items: [{
                xtype: 'box',
                html: climatestation.Utils.getTranslation('postgresql-status'),     // 'PostgreSQL Status:',
                cls: me.textCls,
                width: 150
            }, {
                xtype: 'box',
                height: 26,
                cls: me.dbstatusCls
                //src: 'resources/img/icons/check-square-o.png'
            }, {
                xtype: 'box',
                html: climatestation.Utils.getTranslation('internetconnection'),     // 'Internet connection:',
                cls: me.textCls,
                width: 150
            }, {
                xtype: 'box',
                height: 26,
                cls: me.internetCls
                //src: 'resources/img/icons/check-square-o.png'
            }]
        },{
            xtype: 'container',
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
                margin:'0 0 10 0',
                flex: 1
            },
            items: [{
                xtype: 'box',
                html: climatestation.Utils.getTranslation('services')+':</br></br>',
                cls: 'panel-textheader-style',
                colspan:2
            },{
                xtype: 'box',
                html: 'DVB',
                cls: 'panel-text-style',
                width: 120
            },{
                xtype: 'box',
                height:26,
                cls: me.dvb_statusCls,
                width: 120
            },{
                xtype: 'box',
                html: 'Tellicast',
                cls: 'panel-text-style',
                width: 120
            },{
                xtype: 'box',
                height:26,
                cls: me.tellicast_statusCls,
                width: 120
            },{
                xtype: 'box',
                html: 'FTS',
                cls: 'panel-text-style',
                width: 120
            },{
                xtype: 'box',
                height:26,
                cls: me.fts_statusCls,
                width: 120
            }]
        }];

        me.callParent();
    }
});
