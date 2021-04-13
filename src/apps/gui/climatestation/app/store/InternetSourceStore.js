Ext.define('climatestation.store.InternetSourceStore', {
    extend  : 'Ext.data.Store',
    alias: 'store.internetsource',

    model: 'climatestation.model.InternetSource',

    requires: [
        'Ext.data.proxy.Rest',
        'climatestation.Utils',
        'climatestation.model.InternetSource'
    ],

    storeId : 'InternetSourceStore'

    ,autoLoad: false
    ,autoSync: false
    //,session: true

    ,sorters: [{property: 'defined_by', direction: 'DESC'}, {property: 'internet_id', direction: 'ASC'}]

    ,proxy: {
        type: 'rest',

        appendId: false,

        api: {
            read: 'internetsource',
            create: 'internetsource/create',
            update: 'internetsource/update',
            destroy: 'internetsource/delete'
        },
        reader: {
             type: 'json'
            ,successProperty: 'success'
            ,rootProperty: 'internetsources'
            ,messageProperty: 'message'
        },
        writer: {
            type: 'json',
            writeAllFields: true,
            rootProperty: 'internetsources'
        },
        listeners: {
            exception: function(proxy, response, operation){
                // ToDo: Translate message title or remove message, log error server side and reload proxy (could create and infinite loop?)!
                console.info('INTERNET SOURCE STORE - REMOTE EXCEPTION - Reopen edit internet source window!');

                //Ext.Msg.show({
                //    title: 'INTERNET SOURCE STORE - REMOTE EXCEPTION',
                //    msg: operation.getError(),
                //    icon: Ext.Msg.ERROR,
                //    buttons: Ext.Msg.OK
                //});
            }
        }
    }
    ,listeners: {
        //update: function(store, record, operation, modifiedFieldNames, details, eOpts  ){
        //    // This event is triggered on every change made in a record!
        //},
        write: function(store, operation){
            // var result = Ext.JSON.decode(operation.getResponse().responseText);
            var result = operation.getResponse().responseJson;
            if (operation.success) {
               Ext.toast({
                   html: result.message,
                   title: climatestation.Utils.getTranslation('datasourceupdated'),
                   width: 300, align: 't'
               });
            }
        }
    }

});