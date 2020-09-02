
Ext.define("climatestation.view.dashboard.Dashboard",{
    extend: "Ext.panel.Panel",

    controller: "dashboard-dashboard",

    viewModel: {
        type: "dashboard-dashboard"
    },

    xtype  : 'dashboard-main',

    requires: [
        'climatestation.Utils',
        'climatestation.view.dashboard.DashboardController',
        'climatestation.view.dashboard.DashboardModel'
    ],

    name:'dashboard-panel',
    id: 'dashboard-panel',
    reference: 'dashboard-panel',

    // title: '<span class="dashboard-header-title-style">' + climatestation.Utils.getTranslation('mesa_full_estation') + '</span>',
    // titleAlign: 'center',
    // header: {
    //     cls: 'dashboard-header-style'
    // },

    store: 'dashboard',

    layout: {
        type: 'hbox'
        // pack: 'start'
        // ,align: 'stretch'
    },
    frame: false,
    border: false,
    bodyPadding: '20 30 30 30',

    initComponent: function () {
        // var pcs_container;
        var me = this;

        // me.title = '<span class="dashboard-header-title-style">' + climatestation.Utils.getTranslation('mesa_full_estation') + '</span>';

        me.tbar = Ext.create('Ext.toolbar.Toolbar', {
            items: [
            '->', ' ', ' ', ' ', ' ', {
                xtype: 'tbtext',
                reference: 'dashboardtitle',
                text: '<span class="dashboard-header-title-style">' + climatestation.Utils.getTranslation('mesa_full_estation') + '</span>',
                cls: 'dashboard-header-style'
            },
            '->',
            {
                xtype: 'button',
                iconCls: 'far fa-redo-alt',
                style: { color: 'gray' },
                enableToggle: false,
                scale: 'medium',
                handler: function(){
                    me.getController().setupDashboard(true);
                }
            }]
        });

        // me.tools = [
        //     {
        //         type: 'refresh',
        //         handler: function(){
        //             me.getController().setupDashboard(true);
        //         }
        //     }
        // ]

        me.pcs_container = new Ext.container.Container({
            id: 'pcs_container',
            name: 'pcs_container',
            reference: 'pcs_container',
            layout: {
                type: 'hbox',
                pack: 'start',
                align: 'stretch'
            },
            width: 1200,
            height: 500,
            defaults: {
                titleAlign: 'center',
                frame: true,
                border: false,
                bodyPadding: 10
            }
        });

        me.items = [
            me.pcs_container,
        ];

        me.controller.setupDashboard();

        me.callParent();
    }
});
