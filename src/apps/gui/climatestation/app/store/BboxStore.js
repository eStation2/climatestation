Ext.define('climatestation.store.BboxStore', {
    extend  : 'Ext.data.Store',
    alias: 'store.bbox',

    requires : [
        'climatestation.model.Bbox'
    ],

    model: 'climatestation.model.Bbox',

    storeId : 'BboxStore'

    ,autoLoad: false

    ,proxy: {
        type : 'ajax',
        url : 'bboxes',
        reader: {
             type: 'json'
            ,successProperty: 'success'
            ,rootProperty: 'bboxes'
            //,messageProperty: 'message'
        },
        listeners: {
            exception: function(proxy, response, operation){
                // ToDo: Translate message title or remove message, log error server side and reload proxy (could create and infinite loop?)!
                console.info('BBOX STORE - REMOTE EXCEPTION!');
            }
        }
    }
});