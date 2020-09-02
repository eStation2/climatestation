Ext.define('climatestation.view.analysis.mapTemplateAdminModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.analysis-maptemplateadmin',

    requires: [
        'Ext.data.proxy.Rest',
        'Ext.data.reader.Json',
        'Ext.data.writer.Json',
        'climatestation.Utils',
        'climatestation.model.UserMapTemplate'
    ],
    stores: {
        usermaptemplates: {
            model: 'climatestation.model.UserMapTemplate',
            autoLoad: false,
            autoSync: true,
            session: true,
            storeId: 'usermaptemplates',

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
                    read: 'analysis/usermaptemplates',
                    create: 'analysis/usermaptemplates/create',
                    update: 'analysis/usermaptemplates/update',
                    destroy: 'analysis/usermaptemplates/delete'
                },
                reader: {
                     type: 'json'
                    ,successProperty: 'success'
                    ,rootProperty: 'usermaptemplates'
                    ,messageProperty: 'message'
                },
                writer: {
                    type: 'json',
                    writeAllFields: true,
                    rootProperty: 'usermaptemplate'
                },
                listeners: {
                    exception: function(proxy, response, operation){
                        console.info('MAP TEMPLATE VIEW MODEL - REMOTE EXCEPTION - Error querying the users map templates!');
                    }
                }
            }
            ,listeners: {
                remove: function(store, record,  index , isMove , eOpts  ){
                    //console.info(store);
                    //console.info(record);
                    //console.info(index);
                },
                update: function(store, record, operation, modifiedFieldNames, details, eOpts  ){
                    // This event is triggered on every change made in a record!
                    //console.info('record updated!');
                },
                write: function(store, operation){
                    // var result = Ext.JSON.decode(operation.getResponse().responseText);
                    // var result = operation.getResponse().responseJson;

                    if (operation.success) {
                        Ext.toast({
                            html: operation.getRecords()[0].get('templatename') + ' ' + climatestation.Utils.getTranslation('deleted'),
                            title: climatestation.Utils.getTranslation('map_tpl_deleted'),
                            width: 300,
                            align: 't'
                        });   // "Map template deleted"
                    }
                }
            }
        }
    }

});
