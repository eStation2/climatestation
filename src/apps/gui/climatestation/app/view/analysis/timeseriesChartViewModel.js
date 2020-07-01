Ext.define('climatestation.view.analysis.timeseriesChartViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.analysis-timeserieschartview',

    requires: [
        'Ext.data.proxy.Rest',
        'Ext.data.reader.Json',
        'Ext.data.writer.Json',
        'climatestation.model.GraphProperties'
    ],
    stores: {
        graphproperties: {
            model: 'climatestation.model.GraphProperties',
            autoLoad: false,
            autoSync: false,
            session: true,

            proxy: {
                type: 'rest',

                appendId: false,

                api: {
                    read: 'analysis/getgraphproperties',
                    create: 'analysis/getgraphproperties/create',
                    update: 'analysis/getgraphproperties/update',
                    destroy: 'analysis/getgraphproperties/delete'
                },
                reader: {
                     type: 'json'
                    ,successProperty: 'success'
                    ,rootProperty: 'graphproperties'
                    ,messageProperty: 'message'
                },
                writer: {
                    type: 'json',
                    writeAllFields: true,
                    rootProperty: 'graphproperty'
                },
                listeners: {
                    exception: function(proxy, response, operation){
                        console.info('GRAPH PROPERTIES VIEW MODEL - REMOTE EXCEPTION - Error querying the graph properties!');
                    }
                }
            }
            ,listeners: {
                update: function(store, record, operation, modifiedFieldNames, details, eOpts  ){
                    // This event is triggered on every change made in a record!
                },
                write: function(store, operation){
                    var result = Ext.JSON.decode(operation.getResponse().responseText);
                    if (operation.success) {

                    }
                }
            }
        }
    }

});
