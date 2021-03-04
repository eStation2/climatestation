
Ext.define("climatestation.view.dashboard.Connection",{
    extend: "Ext.container.Container",
    controller: "dashboard-connection",
    viewModel: {
        type: "dashboard-connection"
    },
    xtype  : 'dashboard-connection',

    requires: [
        'climatestation.view.dashboard.ConnectionController',
        'climatestation.view.dashboard.ConnectionModel'
    ],

    layout: {
        type: 'hbox',
        pack: 'start',
        align: 'middle'
    },
    width: 103,
    // margin: '2px',
    //defaults: {
    //    width:35
    //},
    connected: true,
    direction: 'right',


    initComponent: function () {
        var me = this,
            alt = '',
            glyph = "xf178@'Font Awesome 5 Free'",
            colorCls = 'fa-9x glyph-color-green';

        if (me.connected){
            colorCls = 'fa-9x glyph-color-green';
            alt += 'Connected (green) '
        }
        else {
            colorCls = 'fa-9x glyph-color-red';
            alt += 'Not Connected (red) '
        }

        if (me.direction === 'right'){
            glyph = "xf30b@'Font Awesome 5 Free'"; // 'fa-long-arrow-alt-right'
            alt += 'arrow to right';
        }
        else {
            glyph = "xf30a@'Font Awesome 5 Free'"; // 'fa-long-arrow-alt-left'
            colorCls += ' arrow-left-style';
            alt += 'arrow to left';
        }

        me.items = [{
            xtype: 'image',
            glyph: glyph,
            cls: colorCls,
            alt: alt
        }];

        me.callParent();
    }
});
