Ext.define('climatestation.store.FrequenciesStore', {
    extend  : 'Ext.data.Store',
    alias: 'store.frequencies',

    requires : [
        'climatestation.model.Frequency'
    ],

    model: 'climatestation.model.Frequency',

    storeId : 'frequencies'

    ,autoLoad: false

    ,proxy: {
        type : 'ajax',
        url : 'frequencies',
        reader: {
             type: 'json'
            ,successProperty: 'success'
            ,rootProperty: 'frequencies'
            //,messageProperty: 'message'
        },
        listeners: {
            exception: function(proxy, response, operation){
                // ToDo: Translate message title or remove message, log error server side and reload proxy (could create and infinite loop?)!
                console.info('FREQUENCIES STORE - REMOTE EXCEPTION - Reopen window (edit datasource or edit product!');

                //Ext.Msg.show({
                //    title: 'FREQUENCIES STORE- REMOTE EXCEPTION',
                //    msg: operation.getError(),
                //    icon: Ext.Msg.ERROR,
                //    buttons: Ext.Msg.OK
                //});
            }
        }
    }
});
