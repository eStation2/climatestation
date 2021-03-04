Ext.define('climatestation.view.analysis.timeseriesProductSelectionModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.analysis-timeseriesproductselection',

    requires: [
        'Ext.data.proxy.Rest',
        'Ext.data.reader.Json',
        'Ext.data.writer.Json',
        'climatestation.model.ProductNavigatorDatasetColorScheme',
        'climatestation.model.SelectedTimeseriesMapSetDataSet',
        'climatestation.model.TSDrawProperties',
        'climatestation.model.TimeseriesProduct',
        'climatestation.model.Year'
    ],

    stores: {
        categories: {
            source: 'categories',
            session: true
            // ,proxy:{
            //   extraParams: {all: false}
            // }
        },
        // timeseriesproducts: {
        //     source: 'TimeseriesProductsStore',
        //     session: new Ext.data.Session()
        //     // xtype: 'store.tree',
        //     // model: 'climatestation.model.TimeseriesProduct',
        //     // autoLoad: true,
        //     // loadMask: true,
        //     // sorters: [ {property: 'display_index', direction: 'ASC'}]  // {property: 'mapsetcode', direction: 'DESC'},
        //     // ,folderSort: true
        //     // ,filterer: 'bottomup'
        //     //
        //     // ,proxy: {
        //     //     type: 'ajax',
        //     //     url: 'analysis/timeseriesproduct',
        //     //     reader: {
        //     //          type: 'json'
        //     //         // ,successProperty: 'success'
        //     //         ,rootProperty: 'children'
        //     //         // ,messageProperty: 'message'
        //     //     },
        //     //     listeners: {
        //     //         exception: function(proxy, response, operation){
        //     //             // ToDo: Translate message title or remove message, log error server side and reload proxy (could create and infinite loop?)!
        //     //             console.info('TIMESERIES PRODUCT VIEW MODEL - REMOTE EXCEPTION - Reload timeseries product grid!');
        //     //         }
        //     //     }
        //     // }
        //     // ,grouper:{
        //     //     groupFn : function (item) {
        //     //         return climatestation.Utils.getTranslation(item.get('category_id'));
        //     //         //return "<span style='display: none;'>" + item.get('order_index') + "</span>" + climatestation.Utils.getTranslation(item.get('category_id'))
        //     //      //return item.get('cat_descr_name')
        //     //     },
        //     //     property: 'category_id',
        //     //     sortProperty: 'order_index'
        //     // }
        //
        //     // ,grouper:{
        //     //          groupFn : function (item) {
        //     //              var version = item.get('version') != 'undefined' ? item.get('version') : '';
        //     //              return item.get('group_product_descriptive_name') + ' - <b class="smalltext" style="color:black">' +  version + ' - ' + item.get('productcode') + '</b>';
        //     //              // return item.get('group_product_descriptive_name');
        //     //              //return climatestation.Utils.getTranslation(item.get('category_id'));
        //     //              //return "<span style='display: none;'>" + item.get('order_index') + "</span>" + climatestation.Utils.getTranslation(item.get('category_id'))
        //     //              //return item.get('cat_descr_name')
        //     //          },
        //     //          property: 'group_product_descriptive_name'
        //     //          // sortProperty: 'display_index'
        //     //          // sortProperty: 'productmapsetid'
        //     // }
        // },

        selectedtimeseriesmapsetdatasets:{
            model: 'climatestation.model.SelectedTimeseriesMapSetDataSet'
            ,session: true
        },

        productcolorschemes: {
            model: 'climatestation.model.ProductNavigatorDatasetColorScheme',
            session: true
        },

        // timeseriesdrawproperties: {
        //     source: 'TSDrawPropertiesStore'
        //     // model: 'climatestation.model.TSDrawProperties',
        //     // // session: true,
        //     // autoLoad: false,
        //     // autoSync: false,
        //     //
        //     // proxy: {
        //     //     type: 'rest',
        //     //
        //     //     appendId: false,
        //     //
        //     //     api: {
        //     //         read: 'analysis/gettimeseriesdrawproperties',
        //     //         create: 'analysis/gettimeseriesdrawproperties/create',
        //     //         update: 'analysis/gettimeseriesdrawproperties/update',
        //     //         destroy: 'analysis/gettimeseriesdrawproperties/delete'
        //     //     },
        //     //     reader: {
        //     //          type: 'json'
        //     //         ,successProperty: 'success'
        //     //         ,rootProperty: 'tsdrawproperties'
        //     //         ,messageProperty: 'message'
        //     //     },
        //     //     writer: {
        //     //         type: 'json',
        //     //         writeAllFields: true,
        //     //         rootProperty: 'tsdrawproperties'
        //     //     },
        //     //     listeners: {
        //     //         exception: function(proxy, response, operation){
        //     //             console.info('TIMESERIES DRAW PROPERTIES VIEW MODEL - REMOTE EXCEPTION - Error querying the time series draw properties!');
        //     //         }
        //     //     }
        //     // }
        //     // ,listeners: {
        //     //     update: function(store, record, operation, modifiedFieldNames, details, eOpts  ){
        //     //         // This event is triggered on every change made in a record!
        //     //         //console.info('record updated!');
        //     //     },
        //     //     write: function(store, operation){
        //     //         // var result = Ext.JSON.decode(operation.getResponse().responseText);
        //     //         // var result = operation.getResponse().responseJson;
        //     //         // if (!operation.success) {
        //     //         //     //console.info(store);
        //     //         //     //console.info(operation);
        //     //         // }
        //     //     }
        //     // }
        // },

        years:{
            model: 'climatestation.model.Year',
            session: true,
            sorters: {property: 'year', direction: 'DESC'}
        }
    }

});
