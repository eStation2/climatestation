Ext.define('climatestation.model.Version', {
    extend : 'climatestation.model.Base',

    requires: [
        'Ext.data.proxy.Ajax',
        'Ext.data.reader.Json'
    ],

    fields: [
       {name: 'version'}
    ]

    ,autoLoad: true

    ,proxy: {
        type : 'ajax',
        url : 'systemsettings/getversions',
        reader: {
             type: 'json'
            ,successProperty: 'success'
            ,rootProperty: 'versions'
            //,messageProperty: 'message'
        },
        listeners: {
            exception: function(proxy, response, operation){
                // ToDo: Translate message title or remove message, log error server side and reload proxy (could create and infinite loop?)!
                console.info('VERSIONS MODEL - REMOTE EXCEPTION - Reopen version selection window!');

                //Ext.Msg.show({
                //    title: 'VERSIONS MODEL- REMOTE EXCEPTION',
                //    msg: operation.getError(),
                //    icon: Ext.Msg.ERROR,
                //    buttons: Ext.Msg.OK
                //});
            }
        }
    }
});
