Ext.define('climatestation.view.help.helpModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.help-help',

    requires: [
        'Ext.data.proxy.Ajax',
        'Ext.data.reader.Json'
    ],
    stores: {
        documentation: {
            fields: ['name', 'thumb', 'url', 'type'],

            proxy: {
                type: 'ajax',
                //url: 'resources/data/docs_data_'+climatestation.globals['selectedLanguage']+'.json',
                url: 'help',
                // extraParams: {
                //     type: 'docs',
                //     lang : 'eng'    // climatestation.globals['selectedLanguage']
                // },
                reader: {
                    type: 'json'
                }
            },

            autoLoad: false,
            loadMask: false
        },
        weblinks: {
            fields: ['name', 'thumb', 'url', 'type'],

            proxy: {
                type: 'ajax',
                //url: 'resources/data/links_data_'+climatestation.globals['selectedLanguage']+'.json',
                url: 'help',
                // extraParams: {
                //     type: 'links',
                //     lang:  'eng'    // climatestation.globals['selectedLanguage']
                // },
                reader: {
                    type: 'json'
                }
            },

            autoLoad: false,
            loadMask: false
        },
        notes: {
            fields: ['name', 'thumb', 'url', 'type'],

            proxy: {
                type: 'ajax',
                url: 'help',
                // extraParams: {
                //     type: 'notes',
                //     lang:  'eng'    // climatestation.globals['selectedLanguage']
                // },
                reader: {
                    type: 'json'
                }
            },

            autoLoad: false,
            loadMask: false
        }
    }

});
