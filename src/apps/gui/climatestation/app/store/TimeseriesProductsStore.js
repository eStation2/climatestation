Ext.define('climatestation.store.TimeseriesProductsStore', {
    extend  : 'Ext.data.TreeStore',
    alias: 'store.timeseriesproducts',

    requires: [
        'climatestation.model.TimeseriesProduct'
    ],

    model: 'climatestation.model.TimeseriesProduct',

    storeId : 'TimeseriesProductsStore'

    // ,session: new Ext.data.Session()
    ,autoLoad: false
    ,loadMask: true

    ,sorters: {property: 'display_index', direction: 'ASC'}
    //
    //,grouper:{
    //         groupFn : function (item) {
    //             return item.get('group_product_descriptive_name');
    //             //return climatestation.Utils.getTranslation(item.get('category_id'));
    //             //return "<span style='display: none;'>" + item.get('order_index') + "</span>" + climatestation.Utils.getTranslation(item.get('category_id'))
    //             //return item.get('cat_descr_name')
    //         },
    //         property: 'group_product_descriptive_name',
    //         sortProperty: 'productmapsetid'
    //}

    ,folderSort: true
    ,filterer: 'bottomup'

    ,proxy: {
        type: 'ajax',
        url: 'analysis/timeseriesproduct',
        reader: {
             type: 'json'
            // ,successProperty: 'success'
            ,rootProperty: 'children'
            // ,messageProperty: 'message'
        },
        listeners: {
            exception: function(proxy, response, operation){
                // ToDo: Translate message title or remove message, log error server side and reload proxy (could create and infinite loop?)!
                console.info('TIMESERIES PRODUCT VIEW MODEL - REMOTE EXCEPTION - Reload timeseries product grid!');
            }
        }
    }
});
