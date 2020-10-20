Ext.define('climatestation.store.DataSetsStore', {
    extend  : 'Ext.data.Store',
    alias: 'store.dataset',

    model: 'climatestation.model.DataSet',

    requires: [
        'Ext.data.proxy.Rest',
        'Ext.window.Toast',
        'climatestation.Utils',
        'climatestation.model.DataSet'
    ],

    storeId : 'DataSetsStore'

    ,autoLoad: true
    ,autoSync: false
    ,remoteSort: false
    ,remoteGroup: false

    //,sorters: {property: 'order_index', direction: 'DESC'}

    ,proxy: {
        type: 'rest',
        timeout: 3000000,
        appendId: false,
        api: {
            read: 'datasets',
            create: 'datasets/create',
            update: 'datasets/update',
            destroy: 'datasets/delete'
        },
        reader: {
             type: 'json'
            ,successProperty: 'success'
            ,rootProperty: 'products'
            ,messageProperty: 'message'
        },
        writer: {
            type: 'json',
            writeAllFields: true,
            rootProperty: 'products'
        },
        listeners: {
            exception: function(proxy, response, operation){
                // ToDo: Translate message title or remove message, log error server side and reload proxy (could create and infinite loop?)!
                console.info('DATASETS STORE - REMOTE EXCEPTION - Reload data management page!');

                //Ext.Msg.show({
                //    title: 'DATASETS STORE - REMOTE EXCEPTION',
                //    msg: operation.getError(),
                //    icon: Ext.Msg.ERROR,
                //    buttons: Ext.Msg.OK
                //});
            }
        }
    }
    ,grouper:{
        groupFn : function (item) {
            return climatestation.Utils.getTranslation(item.get('category_id'));
            //return "<span style='display: none;'>" + item.get('order_index') + "</span>" + climatestation.Utils.getTranslation(item.get('category_id'))
            //return item.get('cat_descr_name')
        },
        property: 'order_index',
        sortProperty: 'order_index'
    }
    ,listeners: {
        write: function(store, operation){
            Ext.toast({ html: operation.getResultSet().message, title: operation.action, width: 300, align: 't' });
        }
    }

});