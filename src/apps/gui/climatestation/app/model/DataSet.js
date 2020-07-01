Ext.define('climatestation.model.DataSet', {
    extend : 'climatestation.model.Base',

//    idProperty : 'productid',
    fields: [
       {name: 'productid', type: 'string', mapping: 'productid'},
       {name: 'productcode', mapping: 'productcode'},
       {name: 'subproductcode', mapping: 'subproductcode'},
       {name: 'version', mapping: 'version'},
       {name: 'defined_by', mapping: 'defined_by'},
       {name: 'product_type', mapping: 'product_type'},
       {name: 'activated', type: 'boolean', mapping: 'activated'},
       {name: 'prod_descriptive_name', mapping: 'prod_descriptive_name'},
       {name: 'description', mapping: 'description'},
       {name: 'category_id', mapping: 'category_id'},
       {name: 'cat_descr_name', mapping: 'cat_descr_name'},
       {name: 'order_index', mapping: 'order_index'}
    ]
    // ,hasMany: 'ProductMapSet'
//    ,associations:[
//        {
//            type: 'hasMany',
////            model: 'climatestation.model.ProductMapset',
//            model: 'ProductMapset',
//            name: 'productmapsets'
//        }
//    ]
});


Ext.define('climatestation.model.ProductMapSet', {
    extend : 'climatestation.model.Base',

    fields: [
        {name: 'productid', reference:'DataSet', type: 'string', mapping:'productmapsets'},
        {name: 'productcode'},
        {name: 'version'},
        {name: 'mapsetcode'},
        {name: 'defined_by'},
        {name: 'descriptive_name'},
        {name: 'description'},
        {name: 'srs_wkt'},
        {name: 'upper_left_long'},
        {name: 'pixel_shift_long'},
        {name: 'rotation_factor_long'},
        {name: 'upper_left_lat'},
        {name: 'pixel_shift_lat'},
        {name: 'rotation_factor_lat'},
        {name: 'pixel_size_x'},
        {name: 'pixel_size_y'},
        {name: 'footprint_image'}
    ]
    // ,hasMany: 'MapSetDataSet'
//    ,associations:[
//        {
//            type: 'hasMany',
//            model: 'MapSetDataSet',
////            model: 'climatestation.model.MapSetDataSet',
//            name: 'mapsetdatasets'
//        }
//    ]
});


Ext.define('climatestation.model.MapSetDataSet', {
    extend : 'climatestation.model.Base',

    fields: [
        {name: 'mapsetcode', reference:'ProductMapSet', type: 'string', mapping:'mapsetdatasets'},
        {name: 'mapset_descriptive_name'},
        {name: 'productcode'},
        {name: 'subproductcode'},
        {name: 'version'},
        {name: 'defined_by'},
        {name: 'activated', type: 'boolean'},
        {name: 'product_type'},
        {name: 'prod_descriptive_name'},
        {name: 'description'},
        {name: 'display_index', type: 'number'},
        {name: 'datasetcompletenessimage'},
        {name: 'datasetcompleteness_id', mapping:'productid'}
    ]
    // ,hasOne: 'DataSetCompleteness'
    // ,associations:[
    //     {
    //         type: 'hasOne',
    //         model: 'DataSetCompleteness',
    //         name : 'datasetcompleteness'
    //     }
    // ]
});

Ext.define('climatestation.model.DataSetCompleteness', {
    extend : 'climatestation.model.Base',

    fields: [
       {name: 'datasetcompleteness_id', reference:'MapSetDataSet', type: 'string', mapping:'datasetcompleteness'},
       {name: 'firstdate'},
       {name: 'lastdate'},
       {name: 'totfiles'},
       {name: 'missingfiles'}
    ]
    // ,hasMany: 'DataSetIntervals'
    // ,associations:[
    //     {
    //         type: 'hasMany',
    //         model: 'DataSetIntervals',
    //         name: 'datasetintervals'
    //     }
    // ]
});

Ext.define('climatestation.model.DataSetIntervals', {
    extend : 'climatestation.model.Base',

    fields: [
        {name: 'datasetcompleteness_id', reference: 'DataSetCompleteness', type: 'string', mapping:'intervals'},
        {name: 'fromdate'},
        {name: 'todate'},
        {name: 'intervaltype'},
        {name: 'intervalpercentage', type:'int'}
    ]
});
