Ext.define('climatestation.store.PreProcTypesStore', {
    extend  : 'Ext.data.Store',
    alias: 'store.preproctypes',

    requires : [
        'climatestation.model.PreprocType'
    ],

    model: 'climatestation.model.PreprocType',

    storeId : 'preproctypes'

    ,autoLoad: false

    ,proxy: {
        type : 'ajax',
        url : 'preproctypes',
        reader: {
             type: 'json'
            ,successProperty: 'success'
            ,rootProperty: 'preproctypes'
        },
        listeners: {
            exception: function(proxy, response, operation){
                // ToDo: Translate message title or remove message, log error server side and reload proxy (could create and infinite loop?)!
                console.info('PREPROC TYPES STORE - REMOTE EXCEPTION - Reopen window (edit eumetcast_source or edit internet_source!');
            }
        }
    }
});
