Ext.define('climatestation.view.analysis.graphTemplateAdminModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.analysis-graphtemplateadmin',

    requires: [
        'Ext.data.proxy.Rest',
        'Ext.data.reader.Json',
        'Ext.data.writer.Json',
        'climatestation.Utils',
        'climatestation.model.UserGraphTemplate'
    ],
    stores: {
        usergraphtemplates: {
            model: 'climatestation.model.UserGraphTemplate',
            autoLoad: false,
            autoSync: true,
            session: true,
            storeId: 'usergraphtemplates',

            sorters: [{
                property: 'templatename',
                direction: 'ASC'
            }],

            proxy: {
                type: 'rest',

                appendId: false,

                //extraParams: {
                //    userid: null    // climatestation.getUser().userid  // 'jurvtk'
                //},

                api: {
                    read: 'analysis/usergraphtemplates',
                    create: 'analysis/usergraphtemplates/create',
                    update: 'analysis/usergraphtemplates/update',
                    destroy: 'analysis/usergraphtemplates/delete'
                },
                reader: {
                     type: 'json'
                    ,successProperty: 'success'
                    ,rootProperty: 'usergraphtemplates'
                    ,messageProperty: 'message'
                },
                writer: {
                    type: 'json',
                    writeAllFields: true,
                    rootProperty: 'usergraphtemplate'
                },
                listeners: {
                    exception: function(proxy, response, operation){
                        console.info('GRAPH TEMPLATE VIEW MODEL - REMOTE EXCEPTION - Error querying the users graph templates!');
                    }
                }
            }
            ,listeners: {
                remove: function(store, record,  index , isMove , eOpts  ){

                },
                update: function(store, record, operation, modifiedFieldNames, details, eOpts  ){
                    // This event is triggered on every change made in a record!
                },
                write: function(store, operation){
                    // var result = Ext.JSON.decode(operation.getResponse().responseText);
                    // var result = operation.getResponse().responseJson;
                    if (operation.success) {
                        Ext.toast({
                            html: operation.getRecords()[0].get('graph_tpl_name') + ' ' + climatestation.Utils.getTranslation('deleted'),
                            title: climatestation.Utils.getTranslation('graph_tpl_deleted'),
                            width: 300,
                            align: 't'
                        });   // "Graph template deleted"
                    }
                }
            }
        }
    }

});
