
Ext.define("climatestation.view.impact.impactMain",{
    extend: "Ext.panel.Panel",
    controller: "impact-impactmain",
    viewModel: {
        type: "impact-impactmain"
    },

    xtype  : 'impact-main',

    requires: [
        'Ext.layout.container.Card',
        'IMPACT.*',
        'climatestation.view.impact.impactMainController',
        'climatestation.view.impact.impactMainModel'
    ],

    id: 'impactmain',
    name: 'impactmain',
    reference: 'impactmain',

    layout: {
        type: 'card',
        padding: 0
    },
    frame: false,
    border: false,
    bodyPadding: '1 0 0 0',

    initComponent: function () {
        let me = this;

        me.items = [{
            xtype: 'panel',
            title: 'IMPACT toolbox',
            layout: 'fit',
            scrollable: true
        }];

        me.callParent();
    }
});
