Ext.define('climatestation.store.LanguagesStore', {
    extend  : 'Ext.data.Store',
    alias: 'store.languages',

    requires : [
        'climatestation.model.Language'
    ],

    model: 'climatestation.model.Language',

    storeId : 'LanguagesStore'

    //session: true,
    ,autoLoad: false
    //,remoteSort: false

    //sorters: {property: 'langcode', direction: 'ASC'}

    ,proxy: {
        type : 'ajax',
        url : 'getlanguages',
        reader: {
             type: 'json'
            ,successProperty: 'success'
            ,rootProperty: 'languages'
            ,messageProperty: 'message'
        },
        listeners: {
            exception: function(proxy, response, operation){
                // ToDo: Translate message title or remove message, log error server side and reload proxy (could create and infinite loop?)!
                console.info('LANGUAGES STORE - REMOTE EXCEPTION - Reload browser window!');

                //Ext.Msg.show({
                //    title: 'LANGUAGES STORE- REMOTE EXCEPTION',
                //    msg: operation.getError(),
                //    icon: Ext.Msg.ERROR,
                //    buttons: Ext.Msg.OK
                //});
            }
        }
    }
});
