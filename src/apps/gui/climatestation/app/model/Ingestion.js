Ext.define('climatestation.model.Ingestion', {
    extend : 'climatestation.model.Base',

    // idProperty : 'productid',
    fields: [
       {name: 'productid'}, // , reference: { parent: 'ProductAcquisition' }},
       {name: 'productcode'},
       {name: 'subproductcode'},
       {name: 'version'},
       {name: 'mapsetcode'},
       {name: 'defined_by'},
       {name: 'activated', type: 'boolean'},
       {name: 'mapsetname'},
       {name: 'datasetcompletenessimage'},
       {name: 'completeness_id', mapping:'productid'}
    ]
    // ,associations:[
    //     {
    //         type: 'hasOne',
    //         model: 'climatestation.model.Completeness',
    //         name : 'completeness'
    //     }
    // ]
});

Ext.define('climatestation.model.Completeness', {
    extend : 'climatestation.model.Base',

    fields: [
       {name: 'id', reference: 'Ingestion', mapping:'productid'},
       {name: 'firstdate'},
       {name: 'lastdate'},
       {name: 'totfiles'},
       {name: 'missingfiles'},
       {name: 'interval_id', mapping:'productid'}
    ]
    // ,associations:[
    //     {   type: 'hasMany',
    //         model: 'climatestation.model.Intervals',
    //         name: 'intervals'}
    // ]
});

Ext.define('climatestation.model.Intervals', {
    extend : 'climatestation.model.Base',

    fields: [
       {name: 'id', reference: 'Completeness', mapping:'productid'},
       {name: 'fromdate'},
       {name: 'todate'},
       {name: 'intervaltype'},
       {name: 'intervalpercentage', type:'int'}
    ]
});
