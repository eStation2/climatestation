Ext.define("climatestation.view.widgets.ServiceMenuButton",{
    extend: "Ext.button.Button",
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

    glyph: "xf013@'Font Awesome 5 Free'",   // 'xf013@FontAwesome',

    ui: 'servicemenubutton',

    config: {
        iconCls: 'gray',
        // style: {
        //     "color": 'gray'
        // },
        service: null,
        text: null,
        textAlign: 'left',
        scale: 'medium'
    },
    // handler: null,

    initComponent: function () {
        var me = this;

        me.name =  me.service + 'btn';

        me.menu = Ext.create('Ext.menu.Menu', {
            // width: 150,
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
                    // iconCls: 'far fa-play-circle menu-glyph-color-green', // xf01d   // fa-play xf04b
                    glyph: "xf04b@'Font Awesome 5 Free'",
                    cls:'menu-glyph-color-green',
                    handler: 'execServiceTask'
                },
                {   text: climatestation.Utils.getTranslation('stop'),    // 'Stop',
                    name: 'stop'+ me.service,
                    service: me.service,
                    task: 'stop',
                    // iconCls: 'far fa-stop',
                    glyph: "xf04d@'Font Awesome 5 Free'",
                    cls:'menu-glyph-color-red',
                    handler: 'execServiceTask'
                },
                {   text: climatestation.Utils.getTranslation('restart')+'          ',    // 'Restart          ',
                    name: 'restart'+ me.service,
                    service: me.service,
                    task: 'restart',
                    // iconCls: 'far fa-redo-alt',
                    glyph: "xf021@'Font Awesome 5 Free'",
                    cls:'menu-glyph-color-orange',
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
