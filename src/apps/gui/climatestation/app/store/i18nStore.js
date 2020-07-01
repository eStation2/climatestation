Ext.define('climatestation.store.i18nStore', {
    extend  : 'Ext.data.Store',
    alias: 'store.i18nstore',

    requires : [
        'climatestation.model.i18n'
    ],

    model: 'climatestation.model.i18n',

    storeId : 'i18nStore'

    ,autoLoad: false

    ,proxy: {
        type : 'ajax',
        url : 'geti18n',
        extraParams:{
            lang: 'eng'     // climatestation.globals['selectedLanguage']
        },
        reader: {
             type: 'json'
            ,successProperty: 'success'
            ,rootProperty: 'translations'
            ,messageProperty: 'message'
        },
        listeners: {
            exception: function(proxy, response, operation){
                // ToDo: Translate message title or remove message, log error server side and reload proxy (could create and infinite loop?)
                console.info('I18N STORE - REMOTE EXCEPTION - Reload browser window!');

                //Ext.Msg.show({
                //    title: 'I18N STORE- REMOTE EXCEPTION',
                //    msg: operation.getError(),
                //    icon: Ext.Msg.ERROR,
                //    buttons: Ext.Msg.OK
                //});
            }
        }
    }
});
