Ext.define('climatestation.store.ProjectionsStore', {
    extend  : 'Ext.data.Store',
    alias: 'store.projections',

    requires : [
        'climatestation.model.Projection'
    ],

    model: 'climatestation.model.Projection',

    storeId : 'ProjectionsStore'

    ,autoLoad: true

    ,proxy: {
        type : 'ajax',
        url : 'projections',
        reader: {
             type: 'json'
            ,successProperty: 'success'
            ,rootProperty: 'projections'
            //,messageProperty: 'message'
        },
        listeners: {
            exception: function(proxy, response, operation){
                // ToDo: Translate message title or remove message, log error server side and reload proxy (could create and infinite loop?)!
                console.info('PROJECTIONS STORE - REMOTE EXCEPTION!');
            }
        }
    }
});