
Ext.define("climatestation.view.dashboard.Dashboard",{
    extend: "Ext.panel.Panel",

    controller: "dashboard-dashboard",

    viewModel: {
        type: "dashboard-dashboard"
    },

    xtype  : 'dashboard-main',

    requires: [
        'Ext.ux.layout.ResponsiveColumn',
        'climatestation.Utils',
        'climatestation.view.dashboard.DashboardController',
        'climatestation.view.dashboard.DashboardModel',
        'climatestation.view.dashboard.Services',
        'climatestation.view.dashboard.ServerStatusInfo',
        'climatestation.view.dashboard.DatasetInformation'
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

    layout: 'responsivecolumn',

    // layout: {
    //     type: 'hbox'
    //     // pack: 'start'
    //     ,align: 'stretch'
    // },
    frame: false,
    border: false,
    bodyPadding: '15 0 15 15',

    initComponent: function () {
        // var pcs_container;
        var me = this;

        // me.title = '<span class="dashboard-header-title-style">' + climatestation.Utils.getTranslation('mesa_full_estation') + '</span>';

        me.tbar = Ext.create('Ext.toolbar.Toolbar', {
            items: [
            // '->', ' ', ' ', ' ', ' ', {
            //     xtype: 'tbtext',
            //     reference: 'dashboardtitle',
            //     text: '<span class="dashboard-header-title-style">' + climatestation.Utils.getTranslation('mesa_full_estation') + '</span>',
            //     cls: 'dashboard-header-style'
            // },
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

        me.items = [
            {
                xtype: 'dashboard-datasetinfo',
                userCls: 'big-100 small-100',
            },
            {
                xtype: 'dashboard-server-status-info',
                userCls: 'big-50 small-33'
            },
            {
                xtype: 'dashboard-services',
                // 60% width when viewport is big enough,
                // 100% when viewport is small
                userCls: 'big-20 small-33'
            }
            // {
            //     xtype: 'panel',
            //     title: 'PANEL 6',
            //     userCls: 'big-40 small-100',
            //     layout: {
            //         type: 'hbox',
            //         align: 'stretch'
            //     },
            //     bodyPadding: 15,
            //     height: 320,
            //     items: [
            //         {
            //             xtype: 'component',
            //             flex: 1,
            //             cls: 'top-info-container',
            //             html: '<div class="inner"><span class="x-fa fa-chart-pie"></span><span class="dashboard-analytics-percentage"> 25% </span>server load</div>',
            //             padding: '15 10 10 0'
            //         },
            //         {
            //             xtype: 'component',
            //             flex: 1,
            //             cls: 'top-info-container',
            //             html: '<div class="inner"><span class="x-fa fa-user"></span><span class="dashboard-analytics-percentage"> 156 </span> online users</div>',
            //             padding: '15 10 10 0'
            //         }
            //     ]
            // }
        ];


        // me.tools = [
        //     {
        //         type: 'refresh',
        //         handler: function(){
        //             me.getController().setupDashboard(true);
        //         }
        //     }
        // ]

        // me.pcs_container = new Ext.container.Container({
        //     id: 'pcs_container',
        //     name: 'pcs_container',
        //     reference: 'pcs_container',
        //     layout: {
        //         type: 'hbox',
        //         pack: 'start',
        //         align: 'stretch'
        //     },
        //     width: 1200,
        //     height: 500,
        //     defaults: {
        //         titleAlign: 'center',
        //         frame: true,
        //         border: false,
        //         bodyPadding: 10
        //     }
        // });
        //
        // me.items = [
        //     me.pcs_container,
        // ];

        // me.controller.setupDashboard();

        me.callParent();
    }
});
