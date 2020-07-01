/**
 * This class is the main view for the application. It is specified in app.js as the
 * "autoCreateViewport" property. That setting automatically applies the "viewport"
 * plugin to promote that instance of this class to the body element.
 */

Ext.define('climatestation.view.main.Main', {
    extend: 'Ext.container.Viewport',

    xtype: 'app-main',
    requires: [
        'Ext.data.StoreManager',
        'Ext.form.field.ComboBox',
        'Ext.layout.container.Center',
        'climatestation.Utils',
        'climatestation.store.LanguagesStore',
        'climatestation.view.acquisition.Acquisition',
        'climatestation.view.analysis.analysisMain',
        'climatestation.view.dashboard.Dashboard',
        'climatestation.view.datamanagement.DataManagement',
        'climatestation.view.header.Header',
        'climatestation.view.help.help',
        'climatestation.view.main.MainController',
        'climatestation.view.main.MainModel',
        'climatestation.view.processing.Processing',
        'climatestation.view.system.systemsettings'
    ],
    controller: 'app-main',

    viewModel: {
        type: 'app-main'
    },
    autoRender : true,
    // autoScroll : true,

    layout: {
        type: 'border'
    },
    //ptype:'lazyitems',

    initComponent: function () {
        var me = this;

        // console.info('Type installation:' + climatestation.globals['typeinstallation']);

        me.dashboard = {
            title: climatestation.Utils.getTranslation('dashboard'),  // 'Dashboard',
            id:'dashboardtab',
            xtype:'container',
            hidden: true,
            autoScroll: true,
            layout : 'center',
            bodyCls:'dashboard-panel-body',
            items: [{
                xtype: 'dashboard-main'
            }],
            listeners: {
               activate: function (dashboardtab) {
                   var headerlogos = Ext.ComponentQuery.query('container[id=headerlogos]')[0];
                   headerlogos.setHidden(false);
                   //dashboardtab.up().down('container[id=acquisitionmaintab]').doLayout();
                   //dashboardtab.up().down('container[id=datamanagementmaintab]').doLayout();
                   //Ext.getCmp('dashboard-panel').getController().setupDashboard();
                   if (Ext.isObject(dashboardtab.down('panel[id=dashboardpc2]'))){
                        dashboardtab.down('panel[id=dashboardpc2]').getController().checkStatusServices();
                   }
               }
            }
        };

        me.acquisition = {
            title: climatestation.Utils.getTranslation('acquisition'),  // 'Acquisition',
            id:'acquisitionmaintab',
            xtype:'container',
            closable: false,
            autoScroll: true,
            hidden: true,
            layout: 'fit',
            items: [{
                // html: '<img alt="Mockup Acquisition" width="100%" height="100%" src="../resources/img/mockup_acquisition.png">'
                xtype: 'acquisition-main',
                id: 'acquisitionmain'
            }],
            listeners: {
               activate: function (acquisitiontab) {
                    var headerlogos = Ext.ComponentQuery.query('container[id=headerlogos]')[0];
                    headerlogos.setHidden(false);

                    var acquisitionmain = acquisitiontab.down('panel[name=acquisitionmain]');
                    acquisitionmain.getController().checkStatusServices();

                    acquisitionmain.fireEvent('loadstore');

                    // var productgridstore  = Ext.data.StoreManager.lookup('ProductsActiveStore');
                    // var acqgridsstore = Ext.data.StoreManager.lookup('DataAcquisitionsStore');
                    // var ingestiongridstore = Ext.data.StoreManager.lookup('IngestionsStore');
                    // var eumetcastsourcestore = Ext.data.StoreManager.lookup('EumetcastSourceStore');
                    // var internetsourcestore = Ext.data.StoreManager.lookup('InternetSourceStore');
                    //
                    // var myLoadMask = new Ext.LoadMask({
                    //     msg    : climatestation.Utils.getTranslation('loading'), // 'Loading...',
                    //     target : this
                    // });
                    //
                    // if (eumetcastsourcestore.isStore && !eumetcastsourcestore.isLoaded()) {
                    //     eumetcastsourcestore.load();
                    // }
                    // if (internetsourcestore.isStore && !internetsourcestore.isLoaded()) {
                    //     internetsourcestore.load();
                    // }
                    //
                    // if (ingestiongridstore.isStore && !ingestiongridstore.isLoaded() ){
                    //     myLoadMask.show();
                    //     ingestiongridstore.load({
                    //         callback: function(records, options, success){
                    //             myLoadMask.hide();
                    //             if (acqgridsstore.isStore && !acqgridsstore.isLoaded()) {
                    //                 myLoadMask.show();
                    //                 acqgridsstore.load({
                    //                     callback: function(records, options, success) {
                    //                         myLoadMask.hide();
                    //                         if (productgridstore.isStore && !productgridstore.isLoaded()) {
                    //                             myLoadMask.show();
                    //                             productgridstore.load({
                    //                                 callback: function(records, options, success){
                    //                                     myLoadMask.hide();
                    //                                 }
                    //                             });
                    //                         }
                    //                     }
                    //                 });
                    //             }
                    //         }
                    //     });
                    // }

                   //Ext.util.Observable.capture(acquisitionmain, function(e){console.log(e);});
                   //acquisitionmain.getView().getFeature('productcategories').expandAll();
                   //acquisitionmain.getView().refresh();
               },
               beforedeactivate: function (acquisitiontab) {
                   var completenessTooltips = Ext.ComponentQuery.query('tooltip{id.search("_completness_tooltip") != -1}');
                   // var completenessTooltips = Ext.ComponentQuery.query('tooltip{id.search("datasetchart-") != -1}');
                   Ext.each(completenessTooltips, function(item) {
                       item.hide();
                   });
               }
            }
        };

        me.processing = {
            title: climatestation.Utils.getTranslation('processing'),  // 'Processing',
            id:'processingmaintab',
            xtype:'container',
            autoScroll: true,
            hidden: true,
            layout: 'fit',
            items: [{
               xtype  : 'processing-main',
               id:'processingmain'
            }],
            listeners: {
               activate: function (processingtab) {
                   var headerlogos = Ext.ComponentQuery.query('container[id=headerlogos]')[0];
                   headerlogos.setHidden(false);
                   processingtab.down('panel[name=processingmain]').getController().checkStatusServices();
               }
            }
        };

        me.datamanagement = {
            title: climatestation.Utils.getTranslation('datamanagement'),  // 'Data Management',
            id:'datamanagementmaintab',
            xtype:'container',
            autoScroll: true,
            hidden: true,
            layout: 'fit',
            items: [{
               xtype  : 'datamanagement-main',
               id:'datamanagementmain'
            }],
            listeners: {
               activate: function (datamanagementtab) {
                    var headerlogos = Ext.ComponentQuery.query('container[id=headerlogos]')[0];
                    headerlogos.setHidden(false);

                    // var datasetsstore  = Ext.data.StoreManager.lookup('DataSetsStore');
                    // if (datasetsstore.isStore && !datasetsstore.isLoaded()) {
                    //     datasetsstore.load();
                    // }

                   var datamanagementmain = datamanagementtab.down('panel[name=datamanagementmain]');
                   datamanagementmain.fireEvent('loadstore');
                   //
                   ////datamanagementmain.getView().getFeature('prodcat').expandAll();
                   //datamanagementmain.getView().refresh();
               },
               beforedeactivate: function (acquisitiontab) {
                   var completenessTooltips = Ext.ComponentQuery.query('tooltip{id.search("_completness_tooltip") != -1}');
                   // var completenessTooltips = Ext.ComponentQuery.query('tooltip{id.search("datasetchart-") != -1}');
                   Ext.each(completenessTooltips, function(item) {
                       item.hide();
                   });
               }
            }
        };

        me.analysis = {
            title: climatestation.Utils.getTranslation('analysis'),  // 'Analysis',
            id:'analysistab',
            xtype:'container',
            autoScroll: true,
            layout : 'fit',
            hidden: true,
            items: [{
                xtype  : 'analysis-main',
                id:'analysismain',
                reference: 'analysismain'
                // hidden: false
            }],
            listeners: {
                activate: function (analysistab) {
                    // Ext.util.Observable.capture(analysistab, function(e){console.log(analysistab.id + ': ' + e);});
                    if (climatestation.globals['typeinstallation'].toLowerCase() === 'jrc_online'){
                        if (analysistab.layoutCounter > 0){
                            // Ext.getCmp('headerlogos').collapse();
                        }
                    }
                    else if (climatestation.globals['typeinstallation'].toLowerCase() !== 'windows' && climatestation.globals['typeinstallation'].toLowerCase() !== 'online'){
                        var headerlogos = Ext.ComponentQuery.query('container[id=headerlogos]')[0];
                        headerlogos.setHidden(true);
                    }

                    var datasetsstore  = Ext.data.StoreManager.lookup('DataSetsStore');
                    if (datasetsstore.isStore && (!datasetsstore.isLoaded() || datasetsstore.count() < 1)) {
                        datasetsstore.proxy.extraParams = {force: true};
                        datasetsstore.load();
                    }
                    // console.info('analysis tab activated!');
                    // var timeseriesChartSelectionWindow = this.down().lookupReference('timeserieschartselection');
                    // timeseriesChartSelectionWindow.fireEvent('align');
               }
            }
        };

        me.system = {
            title: climatestation.Utils.getTranslation('system'),  // 'System',
            id:'systemtab',
            xtype:'container',
            hidden: true,
            autoScroll: true,
            layout : 'center',
            items: [{
               xtype  : 'systemsettings',
               id:'systemsettingsview'
            }],
            listeners: {
               activate: function (systemtab) {
                    var headerlogos = Ext.ComponentQuery.query('container[id=headerlogos]')[0];
                    headerlogos.setHidden(false);

                    var systemsettingsstore  = Ext.data.StoreManager.lookup('SystemSettingsStore');
                    var formpanel = Ext.getCmp('systemsettingsview');
                    var systemsettingsrecord = systemsettingsstore.getModel().load(0, {
                        scope: formpanel,
                        loadmask: true,
                        failure: function(record, operation) {
                            //console.info('failure');
                        },
                        success: function(record, operation) {
                            if (operation.success){
                                formpanel.loadRecord(systemsettingsrecord);
                                formpanel.updateRecord();
                            }
                        }
                    });
               }
            }
        };

        me.help =  {
            title: climatestation.Utils.getTranslation('help'),  // 'Help',
            xtype: 'container',
            hidden: false,
            autoScroll: true,
            layout : 'center',
            items: [{
               xtype  : 'help',
               id:'helpview'
            }],
            listeners: {
                activate: function (helptab) {
                    if (climatestation.globals['typeinstallation'].toLowerCase() === 'jrc_online'){
                        Ext.getCmp('headerlogos').expand();
                    }
                    else {
                        var headerlogos = Ext.ComponentQuery.query('container[id=headerlogos]')[0];
                        headerlogos.setHidden(false);
                    }
                }
            }
        };


        if (climatestation.globals['typeinstallation'].toLowerCase() === 'jrc_online'){
            me.loginview = 'loginviewECAS';

            me.northheader = {
                region: 'north',
                id: 'headerlogos',
                // xtype:'container',
                minHeight: 165,
                maxHeight: 165,
                titleAlign: 'center',
                items:[{
                    xtype : 'headerLogos'
                }],
                split: true,
                alwaysOnTop: true,
                hideCollapseTool: true,
                header: false,
                collapsible: true,
                collapsed: false,
                autoScroll:false,
                floatable: false,

                listeners: {
                    collapse: function (headercontainer) {
                        // Ext.util.Observable.capture(headercontainer, function(e){console.log(headercontainer.id + ': ' + e);});
                        headercontainer.header =  true;
                        headercontainer.setTitle('<span class="panel-title-style">'+climatestation.Utils.getTranslation('Joint Research Centre - eStation 2 - EARTH OBSERVATION PROCESSING SERVICE')+'</span>');
                    },
                    expand: function (headercontainer) {
                        headercontainer.header =  false;
                        headercontainer.setTitle('');
                    },
                    focusenter: function(){
                        // Ext.getCmp('headerlogos').collapse();
                    }
                }
            }
        }
        else if (climatestation.globals['typeinstallation'].toLowerCase() === 'windows' || climatestation.globals['typeinstallation'].toLowerCase() === 'online'){
            me.loginview = 'loginview';

            me.northheader = {
                region: 'north',
                id: 'headerlogos',
                // xtype:'container',
                height: 68,
                titleAlign: 'center',
                items:[{
                    xtype : 'headerLogos'
                }],
                split: true,
                alwaysOnTop: true,
                hideCollapseTool: true,
                header: false,
                collapsible: true,
                collapsed: false,
                autoScroll:false,
                floatable: false,

                listeners: {
                    collapse: function (headercontainer) {
                        // Ext.util.Observable.capture(headercontainer, function(e){console.log(headercontainer.id + ': ' + e);});
                        headercontainer.header =  true;
                        headercontainer.setTitle('<span class="panel-title-style">'+climatestation.Utils.getTranslation('eStation 2 - EARTH OBSERVATION PROCESSING SERVICE')+'</span>');
                    },
                    expand: function (headercontainer) {
                        headercontainer.header =  false;
                        headercontainer.setTitle('');
                    },
                    focusenter: function(){
                        // Ext.getCmp('headerlogos').collapse();
                    }
                }
            }
        }
        else {
            me.loginview = 'loginview';

            me.northheader = {
                region: 'north',
                id: 'headerlogos',
                xtype: 'container',
                title: '',
                height: 71,
                items: [{
                    xtype: 'headerLogos'
                }],
                split: false,
                collapsible: false,
                collapsed: false
            }
        }


        me.maintabpanel = Ext.create('Ext.tab.Panel', {
            region: 'center',
            xtype: 'tabpanel',
            id: 'maintabpanel',
            // ui: 'navigation',
            layout: 'fit',
            deferredRender: false,
            layoutOnTabChange: true,
            // activeTab: 'dashboardtab',     // first tab initially active
            // defaults:{hideMode: 'offsets'}, // For performance resons to pre-render in the background.
            defaults: {
                hidden: true
            },
            listeners: {
                beforerender: function (tabpanel) {
                    var bar = tabpanel.tabBar;
                    bar.insert(tabpanel.tabBar.items.length, [{
                        xtype: 'component',
                        flex: 1
                    }, {
                        xtype: me.loginview     // 'loginview'
                    }, {
                        xtype: 'combo',
                        id: 'languageCombo',
                        name: 'languageCombo',
                        store: 'LanguagesStore',
                        displayField: 'langdescription',
                        valueField: 'langcode',
                        emptyText: climatestation.Utils.getTranslation('select'),  // 'Select...',
                        labelWidth: 50,
                        labelAlign: 'left',
                        publishes: ['langcode'],
                        typeAhead: true,
                        queryMode: 'local',
                        width: 120,
                        padding: 5,
                        listeners: {
                            select: function (languagecombo, record) {
                                //console.info(languagecombo.getValue());
                                if (climatestation.getUser() != null && climatestation.getUser() !== 'undefined'){
                                    window.location = '?lang=' + languagecombo.getValue() + '&usr='+climatestation.getUser().userid;
                                }
                                else {
                                    window.location = '?lang=' + languagecombo.getValue();
                                }
                            }
                        }
                    }]);
                    //console.info('language: ' + climatestation.globals['selectedLanguage']);
                    Ext.getCmp("languageCombo").setValue(climatestation.globals['selectedLanguage']);
                }
            }
        });

        var indexDashboardTab = 0;
        var indexAcquisitionTab = 1;
        var indexProcessingTab = 2;
        var indexDataManagementTab = 3;
        var indexAnalysisTab = 4; // maintabpanel.getTabBar().items.indexOf(analysistab);
        var indexSystemTab = 5;

        if (['online', 'jrc_online'].includes(climatestation.globals['typeinstallation'].toLowerCase())){
            me.maintabpanel.add(me.analysis);
            // me.maintabpanel.add(me.system);
            me.maintabpanel.add(me.help);

            me.maintabpanel.getTabBar().items.getAt(0).show();
        }
        else if (['windows', 'server', 'singlepc'].includes(climatestation.globals['typeinstallation'].toLowerCase())){
            // Pierluigi
            me.maintabpanel.add(me.dashboard);
            me.maintabpanel.add(me.acquisition);
            me.maintabpanel.add(me.processing);
            me.maintabpanel.add(me.datamanagement);
            // End
            me.maintabpanel.add(me.analysis);
            me.maintabpanel.add(me.system);
            me.maintabpanel.add(me.help);

            me.maintabpanel.getTabBar().items.getAt(indexDashboardTab).show();
            me.maintabpanel.getTabBar().items.getAt(indexAcquisitionTab).show();
            me.maintabpanel.getTabBar().items.getAt(indexProcessingTab).show();
            me.maintabpanel.getTabBar().items.getAt(indexDataManagementTab).show();
            me.maintabpanel.getTabBar().items.getAt(indexAnalysisTab).show();
            me.maintabpanel.getTabBar().items.getAt(indexSystemTab).show();

        }
        else if (climatestation.globals['typeinstallation'].toLowerCase() === 'full'){
            me.maintabpanel.add(me.dashboard);
            me.maintabpanel.add(me.acquisition);
            me.maintabpanel.add(me.processing);
            me.maintabpanel.add(me.datamanagement);
            me.maintabpanel.add(me.analysis);
            me.maintabpanel.add(me.system);
            me.maintabpanel.add(me.help);

           if (climatestation.globals['role'] === '') {
                me.maintabpanel.getTabBar().items.getAt(indexDashboardTab).hide();
                me.maintabpanel.getTabBar().items.getAt(indexAcquisitionTab).hide();
                me.maintabpanel.getTabBar().items.getAt(indexProcessingTab).hide();
                me.maintabpanel.getTabBar().items.getAt(indexDataManagementTab).hide();
                me.maintabpanel.getTabBar().items.getAt(indexAnalysisTab).hide();
                me.maintabpanel.getTabBar().items.getAt(indexSystemTab).show();
                me.maintabpanel.setActiveTab(indexSystemTab);
           }
           if (climatestation.globals['role'] === 'pc2') {
                me.maintabpanel.getTabBar().items.getAt(indexDashboardTab).show();
                me.maintabpanel.getTabBar().items.getAt(indexAcquisitionTab).show();
                me.maintabpanel.getTabBar().items.getAt(indexProcessingTab).show();
                me.maintabpanel.getTabBar().items.getAt(indexDataManagementTab).show();

                if (climatestation.globals['mode'] === 'nominal') {
                    me.maintabpanel.getTabBar().items.getAt(indexAnalysisTab).hide();
                }
                else if (climatestation.globals['mode'] === 'recovery'){
                    me.maintabpanel.getTabBar().items.getAt(indexAnalysisTab).show();
                }
                me.maintabpanel.getTabBar().items.getAt(indexSystemTab).show();
           }
           if (climatestation.globals['role'] === 'pc3') {
                if (climatestation.globals['mode'] === 'nominal') {
                    me.maintabpanel.getTabBar().items.getAt(indexDashboardTab).show();
                    me.maintabpanel.getTabBar().items.getAt(indexAcquisitionTab).hide();
                    me.maintabpanel.getTabBar().items.getAt(indexProcessingTab).hide();
                    me.maintabpanel.getTabBar().items.getAt(indexDataManagementTab).hide();
                    me.maintabpanel.getTabBar().items.getAt(indexAnalysisTab).show();
                    me.maintabpanel.getTabBar().items.getAt(indexSystemTab).show();
                }
                else if (climatestation.globals['mode'] === 'recovery') {
                    me.maintabpanel.getTabBar().items.getAt(indexDashboardTab).show();
                    me.maintabpanel.getTabBar().items.getAt(indexAcquisitionTab).show();
                    me.maintabpanel.getTabBar().items.getAt(indexProcessingTab).show();
                    me.maintabpanel.getTabBar().items.getAt(indexDataManagementTab).show();
                    me.maintabpanel.getTabBar().items.getAt(indexAnalysisTab).show();
                    me.maintabpanel.getTabBar().items.getAt(indexSystemTab).show();
                }
           }
        }
        else {
            me.maintabpanel.add(me.analysis);
            // me.maintabpanel.add(me.system);
            me.maintabpanel.add(me.help);
            me.maintabpanel.getTabBar().items.getAt(0).show();
        }

        me.items = [
            me.northheader,
            me.maintabpanel
        ];

        me.callParent();

        if (['online', 'jrc_online'].includes(climatestation.globals['typeinstallation'].toLowerCase())) {
            me.maintabpanel.setActiveTab('analysistab');
        }
        else {
            me.maintabpanel.setActiveTab('dashboardtab');
        }
    }
});