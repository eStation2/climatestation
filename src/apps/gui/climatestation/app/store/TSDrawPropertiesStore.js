Ext.define('climatestation.store.TSDrawPropertiesStore', {
    extend  : 'Ext.data.Store',
    alias: 'store.tsdrawproperties',

    requires: [
        'Ext.data.proxy.Rest',
        'climatestation.model.TSDrawProperties'
    ],

    model: 'climatestation.model.TSDrawProperties',

    storeId : 'TSDrawPropertiesStore',

    autoLoad: true,
    autoSync: false,
    // session: new Ext.data.Session(),

    // asynchronousLoad: false,

    proxy: {
        type: 'rest',

        appendId: false,

        api: {
            read: 'analysis/gettimeseriesdrawproperties',
            create: 'analysis/gettimeseriesdrawproperties/create',
            update: 'analysis/gettimeseriesdrawproperties/update',
            destroy: 'analysis/gettimeseriesdrawproperties/delete'
        },
        reader: {
             type: 'json'
            ,successProperty: 'success'
            ,rootProperty: 'tsdrawproperties'
            ,messageProperty: 'message'
        },
        writer: {
            type: 'json',
            writeAllFields: true,
            rootProperty: 'tsdrawproperties'
        },
        listeners: {
            exception: function(proxy, response, operation){
                console.info('TIMESERIES DRAW PROPERTIES VIEW MODEL - REMOTE EXCEPTION - Error querying the time series draw properties!');
            }
        }
    }
    ,listeners: {
        update: function(store, record, operation, modifiedFieldNames, details, eOpts  ){
            // This event is triggered on every change made in a record!
            //console.info('record updated!');
        },
        write: function(store, operation){
            // // var result = Ext.JSON.decode(operation.getResponse().responseText);
            // var result = operation.getResponse().responseJson;
            // if (!operation.success) {
            //     //console.info(store);
            //     //console.info(operation);
            // }
        }
    }
});
