
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
    width: 100,
    margin: '2px',
    //defaults: {
    //    width:35
    //},
    connected: true,
    direction: 'right',


    initComponent: function () {
        var me = this,
            alt = '',
            glyph = 'xf178@FontAwesome', // 'fa-long-arrow-right'
            colorCls = 'fa-8x glyph-color-green';

        if (me.connected){
            colorCls = 'fa-8x glyph-color-green';
            alt += 'Connected (green) '
        }
        else {
            colorCls = 'fa-8x glyph-color-red';
            alt += 'Not Connected (red) '
        }

        if (me.direction === 'right'){
            glyph = 'xf178@FontAwesome'; // 'fa-long-arrow-right'
            alt += 'arrow to right'
        }
        else {
            glyph = 'xf177@FontAwesome'; // 'fa-long-arrow-left'
            colorCls += ' arrow-left-style';
            alt += 'arrow to left'
        }

        me.items = [{
            xtype: 'image',
            glyph: glyph,
            cls: colorCls,
            alt: alt
        }];


        //if (me.connected){
        //    me.items = [{
        //        xtype: 'image',
        //        glyph: 'xf0e7@FontAwesome', // 'fa-flash'
        //        cls:'glyph-color-green fa-rotate-270 fa-3x'
        //    },{
        //        xtype: 'image',
        //        glyph: 'xf0c1@FontAwesome', // 'fa-chain'
        //        cls:'glyph-color-green fa-flip-horizontal fa-3x'
        //    },{
        //        xtype: 'image',
        //        glyph: 'xf0e7@FontAwesome', // 'fa-flash'
        //        cls:'glyph-color-green fa-rotate-90 fa-3x'
        //    }];
        //}
        //else {
        //    me.items = [{
        //        xtype: 'image',
        //        glyph: 'xf0e7@FontAwesome', // 'fa-flash'
        //        cls:'glyph-color-red fa-rotate-270 fa-3x'
        //    },{
        //        xtype: 'image',
        //        glyph: 'xf127@FontAwesome', // 'fa-chain-broken'
        //        cls:'glyph-color-red fa-flip-horizontal fa-3x'
        //    },{
        //        xtype: 'image',
        //        glyph: 'xf0e7@FontAwesome', // 'fa-flash'
        //        cls:'glyph-color-red fa-rotate-90 fa-3x'
        //    }];
        //}

        me.callParent();
    }

});
