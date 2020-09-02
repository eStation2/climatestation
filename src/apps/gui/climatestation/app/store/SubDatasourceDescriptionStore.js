Ext.define('climatestation.store.SubDatasourceDescriptionStore', {
    extend  : 'Ext.data.Store',
    alias: 'store.subdatasourcedescription',

    model: 'climatestation.model.SubDatasourceDescription',

    requires: [
        'Ext.data.proxy.Rest',
        'climatestation.Utils',
        'climatestation.model.SubDatasourceDescription'
    ],

    storeId : 'SubDatasourceDescriptionStore'

    ,autoLoad: false
    ,autoSync: false
    //,session: true

    ,proxy: {
        type: 'rest',

        appendId: false,

        api: {
            read: 'subdatasourcedescription',
            create: 'subdatasourcedescription/create',
            update: 'subdatasourcedescription/update',
            destroy: 'subdatasourcedescription/delete'
        },
        reader: {
             type: 'json'
            ,successProperty: 'success'
            ,rootProperty: 'subdatasourcedescription'
            ,messageProperty: 'message'
        },
        writer: {
            type: 'json',
            writeAllFields: true,
            rootProperty: 'subdatasourcedescription'
        },
        listeners: {
            exception: function(proxy, response, operation){
                // ToDo: Translate message title or remove message, log error server side and reload proxy (could create and infinite loop?)!
                console.info('SUB DATASOURCE DESCRIPTION STORE - REMOTE EXCEPTION!');

                //Ext.Msg.show({
                //    title: 'SUB DATASOURCE DESCRIPTION STORE - REMOTE EXCEPTION',
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
                   title: climatestation.Utils.getTranslation('subdatasourcedescriptionupdated'),
                   width: 300, align: 't'
               });
            }
        }
    }

});