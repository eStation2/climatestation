
Ext.define('climatestation.store.ColorSchemesStore', {
    extend  : 'Ext.data.Store',
    alias: 'store.colorschemes',

    requires : [
        'climatestation.model.ColorScheme'
    ],

    model: 'climatestation.model.ColorScheme',

    storeId : 'colorschemes',

    autoLoad: false,

     proxy: {
        type: 'ajax',
        url: 'analysis/getcolorschemes',
        reader: {
            type: 'json',
            rootProperty: 'legends',
            successProperty: 'success',
            messageProperty: 'message'
        },

        listeners: {
            exception: function(proxy, response, operation){
                // ToDo: Translate message title or remove message, log error server side and reload proxy (could create and infinite loop?)!
                console.info('ALL COLOR SCHEMES MODEL - REMOTE EXCEPTION');
            }
        }
    }
});
