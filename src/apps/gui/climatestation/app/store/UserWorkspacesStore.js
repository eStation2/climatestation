Ext.define('climatestation.store.UserWorkspacesStore', {
    extend  : 'Ext.data.Store',
    alias: 'store.userworkspaces',

    model: 'climatestation.model.UserWorkspace',

    requires : [
        'climatestation.model.UserWorkspace',
        'Ext.data.proxy.Rest'
    ],

    storeId : 'UserWorkspacesStore',

    autoLoad: false,
    autoSync: false,
    // session: true,

    sorters: [{
        property: 'showindefault',
        direction: 'DESC'
    },{
        property: 'workspacename',
        direction: 'ASC'
    }],

    proxy: {
        type: 'rest',

        appendId: false,

        //extraParams: {
        //    userid: null    // climatestation.getUser().userid  // 'jurvtk'
        //},

        api: {
            read: 'analysis/userworkspaces',
            create: 'analysis/userworkspaces/create',
            update: 'analysis/userworkspaces/update',
            destroy: 'analysis/userworkspaces/delete'
        },
        reader: {
             type: 'json'
            ,successProperty: 'success'
            ,rootProperty: 'userworkspaces'
            ,messageProperty: 'message'
        },
        writer: {
            type: 'json',
            writeAllFields: true
            // ,rootProperty: 'userworkspace'
        },
        listeners: {
            exception: function(proxy, response, operation){
                console.info('USER WORKSPACE STORE - REMOTE EXCEPTION - Error querying the users workspaces!');
            }
        }
    },
    listeners: {
        remove: function(store, record,  index , isMove , eOpts  ){
            // console.info(store);
            // console.info(record);
            // console.info(index);
            // console.info(isMove);
            // var result = Ext.JSON.decode(operation.getResponse().responseText);
            // var result = operation.getResponse().responseJson;
            // if (operation.success) {
            //     Ext.toast({html: operation.getRecords()[0].get('workspacename') + ' ' + climatestation.Utils.getTranslation('deleted'), title: climatestation.Utils.getTranslation('workspace_deleted'), width: 300, align: 't'});   // "Workspace deleted"
            // }
        },
        update: function(store, record, operation, modifiedFieldNames, details, eOpts  ){
            // console.info(store);
            // console.info(record);
            // console.info(operation);
            // console.info(modifiedFieldNames);
            // console.info(details);
            // This event is triggered on every change made in a record!
            // var result = Ext.JSON.decode(operation.getResponse().responseText);
            // var result = operation.getResponse().responseJson;
            // if (operation.success) {
            //     Ext.toast({html: operation.getRecords()[0].get('workspacename') + ' ' + climatestation.Utils.getTranslation('updated'), title: climatestation.Utils.getTranslation('workspace_updated'), width: 300, align: 't'});   // "Workspace updated"
            // }
        },
        write: function(store, operation){

        }
    }

});