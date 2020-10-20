
Ext.define("climatestation.view.impact.impactMain",{
    extend: "Ext.tab.Panel",
    controller: "impact-impactmain",
    viewModel: {
        type: "impact-impactmain"
    },

    xtype  : 'impact-main',

    requires: [
        'Ext.data.StoreManager',
        'Ext.form.field.ComboBox',
        'Ext.layout.container.Card',
        'Ext.util.DelayedTask',
        'Ext.ux.TabReorderer',
        'climatestation.Utils',
        'climatestation.view.impact.impactMainController',
        'climatestation.view.impact.impactMainModel'
    ],

    id: 'impactmain',
    name: 'impactmain',
    reference: 'impactmain',

    plugins: ['tabreorderer'],

    layout: {
        type: 'card',
        padding: 0
    },
    frame: false,
    border: false,
    bodyPadding: '1 0 0 0',
    // ui: 'workspace',
    tabPosition: 'top',
    tabBar: {
        padding: 0
    },
    // tabRotation: 'default', // 0,

    initComponent: function () {
        var me = this;

        me.callParent();
    }
});
