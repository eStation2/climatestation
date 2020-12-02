/**
 * This class is the main view for the application. It is specified in app.js as the
 * "autoCreateViewport" property. That setting automatically applies the "viewport"
 * plugin to promote that instance of this class to the body element.
 */

Ext.define('climatestation.view.main.Main', {
    extend: 'Ext.container.Viewport',

    xtype: 'app-main',

    requires: [
        'Ext.form.field.ComboBox',
        'Ext.layout.container.Center',
        'Ext.layout.container.Card',
        'climatestation.view.header.Header',
        'climatestation.view.main.MainController',
        'climatestation.view.main.MainModel',
        'climatestation.view.widgets.LoginView'
    ],
    controller: 'app-main',
    viewModel: 'app-main',

    layout: {
        type: 'border'
        // ,align: 'stretch'
    },

    initComponent: function () {
        var me = this;

        me.listeners = {
            afterrender: function(){
                me.controller.doCardNavigation('analysismain');
            }
        };

        me.maincontentPanel = {
            xtype: 'panel',
            region: 'center',
            reference: 'maincontentPanel',
            itemId: 'maincontentPanel',
            layout: {
                type: 'card',
                anchor: '100%'
            },
            items: [{
                xtype: 'dashboard-main',
                itemId: 'dashboardmain',
                reference: 'dashboardmain',
                scrollable: true,
                layout : 'center',
                bodyCls:'dashboard-panel-body',
                listeners: {
                   activate: function (dashboardcard) {
                       if (Ext.isObject(dashboardcard.down('panel[id=dashboardpc2]'))){
                            dashboardcard.down('panel[id=dashboardpc2]').getController().checkStatusServices();
                       }
                       // console.info(me.lookupReference('header-section-title'));
                       me.lookupReference('header-section-title').setText(climatestation.Utils.getTranslation('Dashboard'));
                   }
                }
            }, {
                xtype: 'acquisition-main',
                itemId: 'acquisitionmain',
                reference: 'acquisitionmain',
                listeners: {
                    activate: function(acquisitioncard){
                        acquisitioncard.fireEvent('loadstore');
                        me.lookupReference('header-section-title').setText(climatestation.Utils.getTranslation('acquisition'));
                    }
                }
            },{
                xtype  : 'processing-main',
                itemId:'processingmain',
                reference: 'processingmain',
                listeners: {
                    activate: function(processingcard){
                        // processingcard.fireEvent('loadstore');
                        processingcard.controller.loadstore();
                        me.lookupReference('header-section-title').setText(climatestation.Utils.getTranslation('processing'));
                    }
                }
            },{
                xtype  : 'datamanagement-main',
                itemId:'datamanagementmain',
                reference: 'datamanagementmain',
                listeners: {
                    activate: function(datamanagementcard){
                        datamanagementcard.fireEvent('loadstore');
                        me.lookupReference('header-section-title').setText(climatestation.Utils.getTranslation('datamanagement'));
                    }
                }
            },{
                xtype  : 'analysis-main',
                itemId:'analysismain',
                reference: 'analysismain',
                listeners: {
                    activate: function(analysiscard){
                        analysiscard.fireEvent('loadstore');
                        me.lookupReference('header-section-title').setText(climatestation.Utils.getTranslation('analysis'));
                    }
                }
            },{
                xtype  : 'impact-main',
                itemId:'impactmain',
                reference: 'impactmain',
                listeners: {
                    activate: function(impactcard){
                        me.lookupReference('header-section-title').setText(climatestation.Utils.getTranslation('IMPACT toolbox'));
                    }
                }
            },{
                xtype  : 'c3sf4p-main',
                itemId:'c3sf4pmain',
                reference: 'c3sf4pmain',
                listeners: {
                    activate: function(c3sf4pcard){
                        me.lookupReference('header-section-title').setText(climatestation.Utils.getTranslation('Fitness For Purpose'));
                    }
                }
            },{
                xtype  : 'systemsettings',
                itemId:'systemsettingsview',
                reference: 'systemsettingsview',
                listeners: {
                    activate: function(systemsettingscard){
                        // systemsettingscard.fireEvent('loadstore');
                        me.lookupReference('header-section-title').setText(climatestation.Utils.getTranslation('systemsettings'));
                    }
                }
            },{
                xtype  : 'help',
                itemId:'helpview',
                reference: 'helpview',
                listeners: {
                    activate: function(helpcard){
                        helpcard.controller.loadstore();
                        me.lookupReference('header-section-title').setText(climatestation.Utils.getTranslation('helptitle'));
                    }
                }
            }]
        };

        me.HeaderBar =  {
            xtype: 'toolbar',
            region: 'north',
            cls: 'headerbar shadow',
            height: 75,
            itemId: 'headerBar',
            items: [
                {
                    xtype: 'component',
                    reference: 'logos',
                    cls: 'header-logo',
                    html: '<div class="main-logo">' +
                          '<img src="resources/img/logo/ACP_h110.jpg" height="75px">' +
                          '<img src="resources/img/logo/ec_logo_en.gif" height="75px">' +
                          '</div>',
                    width: 250
                },
                {
                    xtype: 'tbtext',
                    text: 'Climate station',
                    cls: 'header-title-text',
                    width: 250
                },
                // '->',
                {
                    xtype: 'tbtext',
                    reference: 'header-section-title',
                    itemId: 'header-section-title',
                    text: 'TEST',
                    cls: 'header-section-title-text',
                    width: 350
                },
                '->',
                {
                    xtype: 'loginview'
                },
                {
                    margin: '0 0 0 0',
                    height: 75,
                    width: 75,
                    ui: 'headerbtn',
                    scale: 'large',
                    iconCls: 'far fa-bars',
                    itemId: 'main-navigation-btn',
                    // handler: 'onToggleNavigationSize',
                    arrowVisible: false,
                    menu: {
                        // ui: 'mainmenu',
                        items: [{
                                text: 'Dashboard',
                                iconCls:'far fa-desktop',
                                handler: function(){
                                    me.controller.doCardNavigation('dashboardmain')
                                }
                            },{
                                text: 'Acquisition',
                                iconCls:'far fa-download',
                                handler: function(){
                                    me.controller.doCardNavigation('acquisitionmain')
                                }
                            },{
                                text: 'Processing',
                                iconCls:'far fa-cogs',
                                handler: function(){
                                    me.controller.doCardNavigation('processingmain')
                                }
                            },{
                                text: 'Data Management',
                                iconCls: 'far fa-folder-tree',  // 'x-fa fa-database'  //
                                handler: function(){
                                    me.controller.doCardNavigation('datamanagementmain')
                                }
                            },{
                                text: 'Analysis',
                                iconCls:'far fa-chart-bar',
                                handler: function(){
                                    me.controller.doCardNavigation('analysismain')
                                }
                            },{
                                text: 'IMPACT toolbox',
                                iconCls:'far fa-layer-group',
                                handler: function(){
                                    me.controller.doCardNavigation('impactmain')
                                }
                            },{
                                text: 'Fitness For Purpose',
                                iconCls:'far fa-chart-scatter',
                                handler: function(){
                                    me.controller.doCardNavigation('c3sf4pmain')
                                }
                            },{
                                text: 'System settings',
                                iconCls:'far fa-cog',
                                handler: function(){
                                    me.controller.doCardNavigation('systemsettingsview')
                                }
                            },{
                                text: 'Help',
                                iconCls:'far fa-question',
                                handler: function(){
                                    me.controller.doCardNavigation('helpview')
                                }
                            }
                        ]
                    }
                }
            ]
        };

        me.items = [
            me.HeaderBar,
            // {
            //     xtype: 'button',
            //     text: 'Medium',
            //     scale: 'medium',
            //     arrowVisible: true,
            //     menu: {
            //         items:[{
            //             text: 'hallo'
            //         },{
            //             text: 'hoi'
            //         }]
            //     }
            // },
            me.maincontentPanel
        ];

        // me.loginview = 'loginview';
//
// me.dashboard = {
//     title: climatestation.Utils.getTranslation('dashboard'),  // 'Dashboard',
//     itemId:'dashboardtab',
//     xtype:'container',
//     hidden: true,
//     scrollable: true,
//     layout : 'center',
//     bodyCls:'dashboard-panel-body',
//     items: [{
//         xtype: 'dashboard-main'
//     }],
//     listeners: {
//        activate: function (dashboardtab) {
//            var headerlogos = Ext.ComponentQuery.query('container[id=headerlogos]')[0];
//            headerlogos.setHidden(false);
//            //dashboardtab.up().down('container[id=acquisitionmaintab]').doLayout();
//            //dashboardtab.up().down('container[id=datamanagementmaintab]').doLayout();
//            //Ext.getCmp('dashboard-panel').getController().setupDashboard();
//            if (Ext.isObject(dashboardtab.down('panel[id=dashboardpc2]'))){
//                 dashboardtab.down('panel[id=dashboardpc2]').getController().checkStatusServices();
//            }
//        }
//     }
// };
//
// me.acquisition = {
//     title: climatestation.Utils.getTranslation('acquisition'),  // 'Acquisition',
//     itemId:'acquisitionmaintab',
//     xtype:'container',
//     closable: false,
//     scrollable: true,
//     hidden: true,
//     layout: 'fit',
//     items: [{
//         // html: '<img alt="Mockup Acquisition" width="100%" height="100%" src="../resources/img/mockup_acquisition.png">'
//         xtype: 'acquisition-main',
//         itemId: 'acquisitionmain'
//     }],
//     listeners: {
//        activate: function (acquisitiontab) {
//             var headerlogos = Ext.ComponentQuery.query('container[id=headerlogos]')[0];
//             headerlogos.setHidden(false);
//
//             var acquisitionmain = acquisitiontab.down('panel[name=acquisitionmain]');
//             acquisitionmain.getController().checkStatusServices();
//
//             acquisitionmain.fireEvent('loadstore');
//
//             // var productgridstore  = Ext.data.StoreManager.lookup('ProductsActiveStore');
//             // var acqgridsstore = Ext.data.StoreManager.lookup('DataAcquisitionsStore');
//             // var ingestiongridstore = Ext.data.StoreManager.lookup('IngestionsStore');
//             // var eumetcastsourcestore = Ext.data.StoreManager.lookup('EumetcastSourceStore');
//             // var internetsourcestore = Ext.data.StoreManager.lookup('InternetSourceStore');
//             //
//             // var myLoadMask = new Ext.LoadMask({
//             //     msg    : climatestation.Utils.getTranslation('loading'), // 'Loading...',
//             //     target : this
//             // });
//             //
//             // if (eumetcastsourcestore.isStore && !eumetcastsourcestore.isLoaded()) {
//             //     eumetcastsourcestore.load();
//             // }
//             // if (internetsourcestore.isStore && !internetsourcestore.isLoaded()) {
//             //     internetsourcestore.load();
//             // }
//             //
//             // if (ingestiongridstore.isStore && !ingestiongridstore.isLoaded() ){
//             //     myLoadMask.show();
//             //     ingestiongridstore.load({
//             //         callback: function(records, options, success){
//             //             myLoadMask.hide();
//             //             if (acqgridsstore.isStore && !acqgridsstore.isLoaded()) {
//             //                 myLoadMask.show();
//             //                 acqgridsstore.load({
//             //                     callback: function(records, options, success) {
//             //                         myLoadMask.hide();
//             //                         if (productgridstore.isStore && !productgridstore.isLoaded()) {
//             //                             myLoadMask.show();
//             //                             productgridstore.load({
//             //                                 callback: function(records, options, success){
//             //                                     myLoadMask.hide();
//             //                                 }
//             //                             });
//             //                         }
//             //                     }
//             //                 });
//             //             }
//             //         }
//             //     });
//             // }
//
//            //Ext.util.Observable.capture(acquisitionmain, function(e){console.log(e);});
//            //acquisitionmain.getView().getFeature('productcategories').expandAll();
//            //acquisitionmain.getView().refresh();
//        },
//        beforedeactivate: function (acquisitiontab) {
//            var completenessTooltips = Ext.ComponentQuery.query('tooltip{id.search("_completness_tooltip") != -1}');
//            // var completenessTooltips = Ext.ComponentQuery.query('tooltip{id.search("datasetchart-") != -1}');
//            Ext.each(completenessTooltips, function(item) {
//                item.hide();
//            });
//        }
//     }
// };
//
// me.processing = {
//     title: climatestation.Utils.getTranslation('processing'),  // 'Processing',
//     itemId:'processingmaintab',
//     xtype:'container',
//     scrollable: true,
//     hidden: true,
//     layout: 'fit',
//     items: [{
//        xtype  : 'processing-main',
//        itemId:'processingmain'
//     }],
//     listeners: {
//        activate: function (processingtab) {
//            var headerlogos = Ext.ComponentQuery.query('container[id=headerlogos]')[0];
//            headerlogos.setHidden(false);
//            processingtab.down('panel[name=processingmain]').getController().checkStatusServices();
//        }
//     }
// };
//
// me.datamanagement = {
//     title: climatestation.Utils.getTranslation('datamanagement'),  // 'Data Management',
//     itemId:'datamanagementmaintab',
//     xtype:'container',
//     scrollable: true,
//     hidden: true,
//     layout: 'fit',
//     items: [{
//        xtype  : 'datamanagement-main',
//        itemId:'datamanagementmain'
//     }],
//     listeners: {
//        activate: function (datamanagementtab) {
//             var headerlogos = Ext.ComponentQuery.query('container[id=headerlogos]')[0];
//             headerlogos.setHidden(false);
//
//             // var datasetsstore  = Ext.data.StoreManager.lookup('DataSetsStore');
//             // if (datasetsstore.isStore && !datasetsstore.isLoaded()) {
//             //     datasetsstore.load();
//             // }
//
//            var datamanagementmain = datamanagementtab.down('panel[name=datamanagementmain]');
//            datamanagementmain.fireEvent('loadstore');
//            //
//            ////datamanagementmain.getView().getFeature('prodcat').expandAll();
//            //datamanagementmain.getView().refresh();
//        },
//        beforedeactivate: function (acquisitiontab) {
//            var completenessTooltips = Ext.ComponentQuery.query('tooltip{id.search("_completness_tooltip") != -1}');
//            // var completenessTooltips = Ext.ComponentQuery.query('tooltip{id.search("datasetchart-") != -1}');
//            Ext.each(completenessTooltips, function(item) {
//                item.hide();
//            });
//        }
//     }
// };
//
// me.analysis = {
//     title: climatestation.Utils.getTranslation('analysis'),  // 'Analysis',
//     itemId:'analysistab',
//     xtype:'container',
//     scrollable: true,
//     layout : 'fit',
//     hidden: true,
//     items: [{
//         xtype  : 'analysis-main',
//         itemId:'analysismain',
//         reference: 'analysismain'
//         // hidden: false
//     }],
//     listeners: {
//         activate: function (analysistab) {
//             // Ext.util.Observable.capture(analysistab, function(e){console.log(analysistab.id + ': ' + e);});
//             if (climatestation.globals['typeinstallation'].toLowerCase() === 'jrc_online'){
//                 if (analysistab.layoutCounter > 0){
//                     // Ext.getCmp('headerlogos').collapse();
//                 }
//             }
//             else if (climatestation.globals['typeinstallation'].toLowerCase() !== 'windows' && climatestation.globals['typeinstallation'].toLowerCase() !== 'online'){
//                 var headerlogos = Ext.ComponentQuery.query('container[id=headerlogos]')[0];
//                 headerlogos.setHidden(true);
//             }
//
//             var datasetsstore  = Ext.data.StoreManager.lookup('DataSetsStore');
//             if (datasetsstore.isStore && (!datasetsstore.isLoaded() || datasetsstore.count() < 1)) {
//                 datasetsstore.proxy.extraParams = {force: true};
//                 datasetsstore.load();
//             }
//             // console.info('analysis tab activated!');
//             // var timeseriesChartSelectionWindow = this.down().lookupReference('timeserieschartselection');
//             // timeseriesChartSelectionWindow.fireEvent('align');
//        }
//     }
// };
//
// me.system = {
//     title: climatestation.Utils.getTranslation('system'),  // 'System',
//     itemId:'systemtab',
//     xtype:'container',
//     hidden: true,
//     scrollable: true,
//     layout : 'center',
//     items: [{
//        xtype  : 'systemsettings',
//        itemId:'systemsettingsview'
//     }],
//     listeners: {
//        activate: function (systemtab) {
//             var headerlogos = Ext.ComponentQuery.query('container[id=headerlogos]')[0];
//             headerlogos.setHidden(false);
//
//             var systemsettingsstore  = Ext.data.StoreManager.lookup('SystemSettingsStore');
//             var formpanel = Ext.getCmp('systemsettingsview');
//             var systemsettingsrecord = systemsettingsstore.getModel().load(0, {
//                 scope: formpanel,
//                 loadmask: true,
//                 failure: function(record, operation) {
//                     //console.info('failure');
//                 },
//                 success: function(record, operation) {
//                     if (operation.success){
//                         formpanel.loadRecord(systemsettingsrecord);
//                         formpanel.updateRecord();
//                     }
//                 }
//             });
//        }
//     }
// };
//
// me.help =  {
//     title: climatestation.Utils.getTranslation('help'),  // 'Help',
//     xtype: 'container',
//     hidden: false,
//     scrollable: true,
//     layout : 'center',
//     items: [{
//        xtype  : 'help',
//        itemId:'helpview'
//     }],
//     listeners: {
//         activate: function (helptab) {
//             if (climatestation.globals['typeinstallation'].toLowerCase() === 'jrc_online'){
//                 Ext.getCmp('headerlogos').expand();
//             }
//             else {
//                 var headerlogos = Ext.ComponentQuery.query('container[id=headerlogos]')[0];
//                 headerlogos.setHidden(false);
//             }
//         }
//     }
// };
        me.callParent();
    }
});