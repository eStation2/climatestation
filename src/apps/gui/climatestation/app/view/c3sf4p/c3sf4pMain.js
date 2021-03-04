
Ext.define("climatestation.view.c3sf4p.c3sf4pMain",{
    extend: "Ext.tab.Panel",
    controller: "c3sf4p-c3sf4pmain",
    viewModel: {
        type: "c3sf4p-c3sf4pmain"
    },

    xtype  : 'c3sf4p-main',

    requires: [
        'Ext.data.StoreManager',
        'Ext.form.field.ComboBox',
        'Ext.layout.container.Card',
        'Ext.util.DelayedTask',
        'Ext.ux.TabReorderer',
        'climatestation.Utils',
        'climatestation.view.c3sf4p.c3sf4pMainController',
        'climatestation.view.c3sf4p.c3sf4pMainModel'
    ],

    id: 'c3sf4pmain',
    name: 'c3sf4pmain',
    reference: 'c3sf4pmain',

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
