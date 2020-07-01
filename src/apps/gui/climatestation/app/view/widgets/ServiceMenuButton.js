Ext.define("climatestation.view.widgets.ServiceMenuButton",{
    extend: "Ext.button.Split",
    controller: "widgets-servicemenubutton",
    viewModel: {
        type: "widgets-servicemenubutton"
    },
    xtype: "servicemenubutton",

    requires: [
        'Ext.menu.Menu',
        'climatestation.Utils',
        'climatestation.view.widgets.ServiceMenuButtonController',
        'climatestation.view.widgets.ServiceMenuButtonModel'
    ],

    // iconCls: 'fa fa-cog fa-2x', // fa-spin 'icon-play', // icomoon fonts
    glyph: 'xf013@FontAwesome',
    scale: 'medium',

    config: {
        // style: "color: gray",
        // style: {
        //     color: 'gray'
        // },
        iconCls: 'gray',
        service: null,
        text: null,
    },
    // handler: null,

    initComponent: function () {
        var me = this;
// console.info(me);
// console.info(me.getService());
// console.info(me.getKleur());
// console.info(me.getStyle());
// me.setStyle("color:"+me.getKleur())
//         me.cls = me.getKleur();
// console.info(me.getStyle());
        me.name =  me.service + 'btn';
        //me.handler = 'checkStatusServices';

        me.menu = Ext.create('Ext.menu.Menu', {
            width: 150,
            margin: '0 0 10 0',
            floating: true,  // usually you want this set to True (default)
            collapseDirection: 'right',
            defaults: {
              align: 'right'
            },
            items: [
                // these will render as dropdown menu items when the arrow is clicked:
                {   text: climatestation.Utils.getTranslation('run'),    // 'Run',
                    name: 'run' + me.service,
                    service: me.service,
                    task: 'run',
                    // iconCls: 'fa-play-circle-o', // xf01d   // fa-play xf04b
                    glyph: 'xf04b@FontAwesome',
                    cls:'menu-glyph-color-green',
                    // style: { color: 'green' },
                    handler: 'execServiceTask'
                },
                {   text: climatestation.Utils.getTranslation('stop'),    // 'Stop',
                    name: 'stop'+ me.service,
                    service: me.service,
                    task: 'stop',
                    // iconCls: 'fa fa-stop',
                    glyph: 'xf04d@FontAwesome',
                    cls:'menu-glyph-color-red',
                    // style: { color: 'red' },
                    handler: 'execServiceTask'
                },
                {   text: climatestation.Utils.getTranslation('restart')+'          ',    // 'Restart          ',
                    name: 'restart'+ me.service,
                    service: me.service,
                    task: 'restart',
                    // iconCls: 'fa fa-refresh',
                    glyph: 'xf021@FontAwesome',
                    cls:'menu-glyph-color-orange',
                    // style: { color: 'orange' },
                    handler: 'execServiceTask'
                },
                {
                    text: climatestation.Utils.getTranslation('viewlogfile'),    // 'View log file',
                    name: 'view_logfile_' + me.service,
                    service: me.service,
                    task: 'logfile',
                    iconCls:'log-icon-small',
                    handler: 'viewLogFile'
                }
            ]
        });

        me.callParent();
    }
});
