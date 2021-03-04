Ext.define('climatestation.view.datamanagement.requestsAdminModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.datamanagement-requestsadmin',

    requires: [
        'Ext.data.proxy.Ajax',
        'Ext.data.reader.Json',
        'climatestation.model.Request'
    ],
    stores: {
        requests: {
            model: 'climatestation.model.Request',
            autoLoad: false,
            autoSync: false,
            session: true,
            storeId: 'requests',

            sorters: [{
                property: 'requestid',
                direction: 'ASC'
            }],

            proxy: {
                type: 'ajax',

                appendId: false,
                url: 'datamanagement/requests',

                reader: {
                     type: 'json'
                    ,successProperty: 'success'
                    ,rootProperty: 'requests'
                    ,messageProperty: 'message'
                },

                listeners: {
                    exception: function(proxy, response, operation){
                        console.info('REQUESTS VIEW MODEL - REMOTE EXCEPTION - Error querying the requests!');
                    }
                }
            }
        }
    }

});
