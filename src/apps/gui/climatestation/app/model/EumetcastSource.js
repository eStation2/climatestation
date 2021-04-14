Ext.define('climatestation.model.EumetcastSource', {
    extend: 'climatestation.model.Base',

    fields: [
        {name: 'eumetcast_id'},
        {name: 'orig_eumetcast_id'},
        {name: 'collection_name'},
        {name: 'filter_expression_jrc'},
        {name: 'frequency'},
        {name: 'description'},
        {name: 'typical_file_name'},
        {name: 'keywords_theme'},
        {name: 'keywords_societal_benefit_area'},
        {name: 'defined_by'},
        {name: 'modified_by'},
        {name: 'datasource_descr_id'},
        {name: 'format_type'},
        {name: 'file_extension'},
        {name: 'delimiter'},
        {name: 'date_format'},
        {name: 'date_position'},
        {name: 'product_identifier'},
        {name: 'prod_id_position', type: 'number'},
        {name: 'prod_id_length', type: 'number'},
        {name: 'area_type'},
        {name: 'area_position'},
        {name: 'area_length', type: 'number'},
        {name: 'preproc_type'},
        {name: 'product_release'},
        {name: 'release_position'},
        {name: 'release_length', type: 'number'},
        {name: 'native_mapset'}
    ]
});
