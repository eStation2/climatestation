
/**
 * The main application class. An instance of this class is created by app.js when it calls
 * Ext.application(). This is the ideal place to handle application launch and initialization
 * details.
 * DO NOT PUT ANY CODE ABOVE, OTHERWISE THE PRODUCTION BUILD WILL NOT LAUNCH APP.JS
 */
Ext.define('climatestation.Application', {
    extend: 'Ext.app.Application',

    name: 'climatestation',

    // appFolder: Ext.manifest.paths['climatestation'],

    requires: [
        'climatestation.*',
        // 'climatestation.view.*',
        // 'climatestation.Utils',
        'Ext.state.*',
        'Ext.tip.QuickTipManager'
    ],

    //controllers: [
    //    'Root@climatestation.controller'
    //],

    stores: [
        'i18nStore'             // autoload
        ,'LanguagesStore'       // autoload
        ,'SystemSettingsStore'
        ,'CategoriesStore'      // autoload
        ,'CategoriesAllStore'
        ,'FrequenciesStore'
        ,'DateFormatsStore'
        ,'DataTypesStore'
        ,'DefinedByStore'
        ,'ProjectionsStore'
        ,'ResolutionsStore'
        ,'BboxStore'
        ,'RefWorkspacesStore'
        ,'LogosStore'
        ,'LayersStore'
        ,'LegendsStore'
        ,'EumetcastSourceStore'
        ,'InternetSourceStore'
        ,'MapsetsStore'             // no autoload
        ,'ProductsStore'            // no autoload
        // ,'ProductsInactiveStore' // Not used anymore, instead climatestation.model.Product is used. (todo: remove)
        ,'ProductsActiveStore'      // no autoload
        ,'DataAcquisitionsStore'    // no autoload
        ,'IngestionsStore'          // no autoload
        ,'ProcessingStore'          // no autoload
        // ,'TimeseriesProductsStore'  // no autoload
        ,'TSDrawPropertiesStore'
        ,"ColorSchemesStore"
        ,'DataSetsStore'            // no autoload
        ,'UserWorkspacesStore'      // no autoload
        ,'IngestSubProductsStore'   // no autoload
        ,'SubDatasourceDescriptionStore'
        ,'ProductNavigatorStore'
    ],

    // create a reference in Ext.application so we can access it from multiple functions
    splashscreen: {},

    //init: function () {
    onBeforeLaunch: function () {
        var me = this;

        // Ext.Loader.loadScript({
        //     url: '/lib/js/ol-layerswitcher-master/src/ol-layerswitcher.js',
        //     onLoad: function (options) {
        //         console.info('layerswitcher');
        //     }
        // });

        Ext.ariaWarn = Ext.emptyFn;

        Ext.tip.QuickTipManager.init();
        // Apply a set of config properties to the singleton
        Ext.apply(Ext.tip.QuickTipManager.getQuickTip(), {
            shadow: false,
            frame: true,
            trackMouse: true,
            showDelay: 50      // Show 50ms after entering target
            // dismissDelay: 20000
        });


        Ext.setGlyphFontFamily('FontAwesomePro');

        Ext.state.Manager.setProvider(Ext.create('Ext.state.CookieProvider'));

        Ext.Ajax.timeout = 300000; // 300 seconds
        Ext.override(Ext.data.proxy.Server, { timeout: Ext.Ajax.timeout });
        Ext.override(Ext.data.proxy.Rest, { timeout: Ext.Ajax.timeout });
        Ext.override(Ext.data.proxy.Ajax, { timeout: Ext.Ajax.timeout });
        Ext.override(Ext.data.Connection, { timeout: Ext.Ajax.timeout });


        if (Ext.util.Cookies.get('estation2_userid') != null){
            var userinfo = {
                userid: Ext.util.Cookies.get('estation2_userid'),
                username: Ext.util.Cookies.get('estation2_username'),
                email: Ext.util.Cookies.get('estation2_useremail'),
                userlevel: Ext.util.Cookies.get('estation2_userlevel'),
                prefered_language: Ext.util.Cookies.get('estation2_userlanguage')
            };

            climatestation.setUser(userinfo);
        }

        climatestation.globals = [];

        climatestation.globals['typeinstallation'] = 'Full';       // 'jrc_online'
        // climatestation.globals['role'] = 'pc2';
        // climatestation.globals['mode'] = 'nominal';
        Ext.Ajax.request({
            method: 'POST',
            url: 'typeinstallation',
            success: function(response, opts){
                var resp = Ext.JSON.decode(response.responseText);
                if (resp.typeinstallation != ''){
                    climatestation.globals['typeinstallation'] = resp.typeinstallation;
                }
                if (resp.role != ''){
                    climatestation.globals['role'] = resp.role;
                }
                if (resp.mode != ''){
                    climatestation.globals['mode'] = resp.mode;
                }
            },
            failure: function(response, opts) {
                console.info(response.status);
            }
        });


        climatestation.globals['selectedLanguage'] = 'eng';
        Ext.data.StoreManager.lookup('LanguagesStore').load({
            callback: function(records, options, success){
                var getParams = document.URL.split("?");    // separating the GET parameters from the current URL
                var params = Ext.urlDecode(getParams[getParams.length - 1]);    // transforming the GET parameters into a dictionnary
                if (climatestation.Utils.objectExists(params.lang) && params.lang != ''){
                    climatestation.globals['selectedLanguage'] = params.lang;
                    // Removing the url parameter lang= from the current url is the browsers address bar
                    window.history.pushState({}, "", window.location.href.split("?")[0]);

                    if (Ext.util.Cookies.get('estation2_userid') != null){
                        Ext.util.Cookies.set('estation2_userlanguage', params.lang);
                    }
                }
                else if (Ext.util.Cookies.get('estation2_userid') != null){
                    climatestation.globals['selectedLanguage'] = Ext.util.Cookies.get('estation2_userlanguage')
                }
                else {
                    records.forEach(function (language) {
                        if (language.get('selected') == true) {
                            climatestation.globals['selectedLanguage'] = language.get('langcode')
                        }
                    });
                }

                Ext.data.StoreManager.lookup('i18nStore').load({
                    params:{lang:climatestation.globals['selectedLanguage']},
                    callback: function(records, options, success){

                        // start the mask on the body and get a reference to the mask
                        var splashscreen = Ext.getBody().mask(climatestation.Utils.getTranslation('splashscreenmessage'), 'splashscreen');
                        // fade out the body mask
                        splashscreen.fadeOut({
                            duration: 2000,
                            remove: true
                        });
                        // console.info(splashscreen);

                        Ext.Loader.loadScript({
                            url: 'app/CustomVTypes.js',
                            onLoad: function (options) {
                                //console.info('CustomVTypes');
                            }
                        });

                        var taskLaunch = new Ext.util.DelayedTask(function() {
                            me.launch();
                        });
                        taskLaunch.delay(200);

                    }
                });

                //if (climatestation.globals['selectedLanguage'] == 'fra')
                //    Ext.require('Ext.locale.fr');
                //else Ext.require('Ext.locale.en');
                //
                //Ext.getCmp("languageCombo").setValue(climatestation.globals['selectedLanguage']);
                //console.info(climatestation.globals['selectedLanguage']);

                if (climatestation.globals['selectedLanguage'] == 'fra') {

                    // var url = '../static/ext/packages/ext-locale/build/ext-locale-fr.js';
                    var url = '/resources/ext-locale-fr.js';
                    Ext.Loader.loadScript({
                        url: url,
                        onLoad: function (options) {
                            //console.info('French local loaded!');
                        }
                    });

                    Highcharts.setOptions({
                        //global: {
                        //    canvasToolsURL: ''
                        //},
                        lang: {
                            contextButtonTitle: 'Graphique menu contextuel',  // 'Chart context menu',
                            downloadJPEG: 'Télécharger image JPEG',  // 'Download JPEG image',
                            downloadPDF: 'Télécharger le document PDF',  // 'Download PDF document',
                            downloadPNG: 'Télécharger l\'image PNG',  // 'Download PNG image',
                            downloadSVG: 'Télécharger image vectorielle SVG',  // 'Download SVG vector image',
                            drillUpText: 'Retour à {series.name}',  // 'Back to {series.name}',
                            loading: 'Chargement...',  // 'Loading...',
                            noData: 'Aucune donnée à afficher',  // 'No data to display',
                            printChart: 'Imprimer tableau',  // 'Print chart',
                            rangeSelectorFrom:'De',
                            rangeSelectorTo: 'à',
                            resetZoom: 'Réinitialiser zoom',  // 'Reset zoom',
                            resetZoomTitle: 'Niveau de zoom réinitialiser 1:1',  // 'Reset zoom level 1:1',
                            shortMonths: [ "Janv." , "Févr." , "Mars" , "Avril" , "Mai" , "Juin" , "Juil." , "Août" , "Sept." , "Oct." , "Nov." , "Déc."],
                            months: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
                            weekdays: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
                        }
                    });
                }
            }
        });

        //this.callParent();
    },

    launch: function () {
        //console.info('launch');
        // Ext.getBody().addCls('graybgcolor');

        //var link = '<link rel="icon" href="resources/img/africa.ico" type="image/gif" sizes="16x16">'
        var link = document.createElement('link');
        link.type = 'image/gif';  // 'image/ico';
        link.rel = 'icon';
        link.href = 'resources/img/africa.ico';
        link.sizes = '16x16';
        document.getElementsByTagName('head')[0].appendChild(link);

        var taskMain = new Ext.util.DelayedTask(function() {
            Ext.create('climatestation.view.main.Main');
        });
        taskMain.delay(1000);

        // if (climatestation.globals['typeinstallation'].toLowerCase() == 'windows' ||
        //     climatestation.globals['typeinstallation'].toLowerCase() == 'online' ||
        //     climatestation.globals['typeinstallation'].toLowerCase() == 'jrc_online')
        // {
        //     var datasetsstore  = Ext.data.StoreManager.lookup('DataSetsStore');
        //
        //     if (datasetsstore.isStore) {
        //         // datasetsstore.proxy.extraParams = {force: true};
        //         datasetsstore.load();
        //     }
        //     // Ext.data.StoreManager.lookup('DataSetsStore').load();
        // }
        // else {
        //     if (climatestation.globals['role'] == 'pc2') {
        //         Ext.data.StoreManager.lookup('ProductsStore').load();
        //         Ext.data.StoreManager.lookup('ProductsActiveStore').load();
        //         Ext.data.StoreManager.lookup('DataAcquisitionsStore').load();
        //         Ext.data.StoreManager.lookup('IngestionsStore').load();
        //     }
        //     if (climatestation.globals['role'] == 'pc3' && climatestation.globals['mode'] == 'recovery'){
        //         Ext.data.StoreManager.lookup('ProductsStore').load();
        //         Ext.data.StoreManager.lookup('ProductsActiveStore').load();
        //         Ext.data.StoreManager.lookup('DataAcquisitionsStore').load();
        //         Ext.data.StoreManager.lookup('IngestionsStore').load();
        //     }
        //     Ext.data.StoreManager.lookup('ProcessingStore').load();
        //     Ext.data.StoreManager.lookup('DataSetsStore').load();
        // }
        //
        // // var delay = 500;
        // // if (!Ext.data.StoreManager.lookup('TimeseriesProductsStore').isLoaded()){
        // //     delay = 2000;
        // // }

        this.callParent();
    },

    onAppUpdate: function () {
        Ext.Msg.confirm('Application Update', 'This application has an update, reload?',
            function (choice) {
                if (choice === 'yes') {
                    window.location.reload();
                }
            }
        );
    }
});


