Ext.define('climatestation.view.dashboard.Services', {
    extend: 'Ext.Panel',
    controller: "dashboard-services",
    xtype: 'dashboard-services',

    requires: [
        'climatestation.view.widgets.ServiceMenuButton',
        'climatestation.Utils'
    ],

    // cls: 'service-type shadow',
    height: 325,
    bodyPadding: 15,
    title: 'Services',
    layout: {
        type: 'vbox',
        align: 'stretch'
    },
    config: {
        service_eumetcast: false,
        service_internet: false,
        service_ingest: false,
        service_processing: false,
        service_system: false
    },
    listeners: {
      afterrender: 'checkStatusServices'
    },

    initComponent: function () {
        var me = this;

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

        me.defaults = {
            padding: 10,
            margin: 5
        };

        me.items = [
            {
                xtype: 'servicemenubutton',
                service: 'eumetcast',
                text: climatestation.Utils.getTranslation('eumetcast'),     // 'Eumetcast',
                handler: 'checkStatusServices',
                iconCls: me.service_eumetcast_Style
                // style: {
                //     "color": me.service_eumetcast_Style
                // },
                // disabled: me.setdisabledPartial
            },
            {
                xtype: 'servicemenubutton',
                service: 'internet',
                text: climatestation.Utils.getTranslation('internet'),     // 'Internet',
                handler: 'checkStatusServices',
                iconCls: me.service_internet_Style
                // style: {
                //     "color": me.service_internet_Style
                // },
                // disabled: me.setdisabledPartial
            },
            {
                xtype: 'servicemenubutton',
                service: 'ingest',
                text: climatestation.Utils.getTranslation('ingest'),     // 'Ingest',
                handler: 'checkStatusServices',
                iconCls: me.service_ingest_Style
                // style: {
                //     "color": me.service_ingest_Style
                // },
                // disabled: me.setdisabledPartial
            },
            {
                xtype: 'servicemenubutton',
                service: 'processing',
                text: climatestation.Utils.getTranslation('processing'),     // 'Processing',
                handler: 'checkStatusServices',
                iconCls: me.service_processing_Style
                // style: {
                //     "color": me.service_processing_Style
                // },
                // disabled: me.setdisabledPartial
            },
            {
                xtype: 'servicemenubutton',
                service: 'system',
                text: climatestation.Utils.getTranslation('system'),     // 'System',
                handler: 'checkStatusServices',
                iconCls: me.service_system_Style
                // style: {
                //     "color": me.service_system_Style
                // },
                // disabled: me.setdisabledAll ? true : false // me.setdisabledPartial
            }
        ];

        me.callParent();
    }
});
