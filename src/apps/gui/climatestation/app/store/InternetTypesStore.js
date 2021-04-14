Ext.define('climatestation.store.InternetTypesStore', {
    extend  : 'Ext.data.Store',
    alias: 'store.internettypes',

    requires : [
        'climatestation.model.InternetType'
    ],

    model: 'climatestation.model.InternetType',

    storeId : 'internettypes'

    ,autoLoad: false

    ,proxy: {
        type : 'ajax',
        url : 'internettypes',
        reader: {
             type: 'json'
            ,successProperty: 'success'
            ,rootProperty: 'internettypes'
        },
        listeners: {
            exception: function(proxy, response, operation){
                // ToDo: Translate message title or remove message, log error server side and reload proxy (could create and infinite loop?)!
                console.info('INTERNET TYPES STORE - REMOTE EXCEPTION - Reopen window (edit internet_source!');
            }
        }
    }
});
