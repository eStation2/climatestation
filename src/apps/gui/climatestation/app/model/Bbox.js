Ext.define('climatestation.model.Bbox', {
    extend : 'climatestation.model.Base',

    fields: [
        {name: 'bboxcode'},
        {name: 'descriptive_name'},
        {name: 'defined_by'},
        {name: 'upper_left_long'},
        {name: 'upper_left_lat'},
        {name: 'lower_right_long'},
        {name: 'lower_right_lat'},
        {name: 'predefined'}
    ]
});
