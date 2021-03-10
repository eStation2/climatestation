-- psql -h localhost -U estation -d estationdb -t -c "SELECT * FROM products.export_product_data('chirps-dekad', '2.0', true)" > product_db_records.sql
-- SELECT * FROM products.export_product_data('chirps-dekad', '2.0', true);
-- DROP FUNCTION products.export_product_data(character varying,character varying,boolean);

CREATE OR REPLACE FUNCTION products.export_product_data(
    productcode character varying DEFAULT NULL,
    version character varying DEFAULT NULL,
    full_copy boolean DEFAULT false)
RETURNS table (
	inserts text
)
LANGUAGE 'plpgsql'
COST 100

AS $BODY$
DECLARE
    _productcode ALIAS FOR  $1;
    _version ALIAS FOR  $2;
    _full_copy ALIAS FOR  $3;

    allrecords record;
BEGIN

for allrecords in(
    SELECT 'SELECT products.update_insert_product('
        || '  productcode := ' || COALESCE('''' || p.productcode || '''', 'NULL')
        || ', subproductcode := ' || COALESCE('''' || p.subproductcode || '''', 'NULL')
        || ', version := ' || COALESCE('''' || p.version || '''', 'NULL')
        || ', defined_by := ' || COALESCE('''' || p.defined_by || '''', 'NULL')
        || ', activated := ' || p.activated
        || ', category_id := ' || COALESCE('''' || p.category_id || '''', 'NULL')
        || ', product_type := ' || COALESCE('''' || p.product_type || '''', 'NULL')
        || ', descriptive_name := ' || COALESCE('''' || replace(replace(p.descriptive_name,'"',''''), '''', '''''') || '''', 'NULL')
        || ', description := ' || COALESCE('''' || replace(replace(p.description,'"',''''), '''', '''''') || '''', 'NULL')
        || ', provider := ' || COALESCE('''' || p.provider || '''', 'NULL')
        || ', frequency_id := ' || COALESCE('''' || p.frequency_id || '''', '''undefined''')
        || ', date_format := ' || COALESCE('''' || p.date_format || '''', '''undefined''')
        || ', scale_factor := ' || COALESCE(TRIM(to_char(p.scale_factor, '99999999D999999')), 'NULL')
        || ', scale_offset := ' || COALESCE(TRIM(to_char(p.scale_offset, '99999999D999999')), 'NULL')
        || ', nodata := ' || COALESCE(TRIM(to_char(p.nodata, '99999999')), 'NULL')
        || ', mask_min := ' || COALESCE(TRIM(to_char(p.mask_min, '99999999D999999')), 'NULL')
        || ', mask_max := ' || COALESCE(TRIM(to_char(p.mask_max, '99999999D999999')), 'NULL')
        || ', unit := ' || COALESCE('''' || p.unit || '''', 'NULL')
        || ', data_type_id := ' || COALESCE('''' || p.data_type_id || '''', '''undefined''')
        || ', masked := ' || p.masked
        || ', timeseries_role := ' || COALESCE('''' || p.timeseries_role || '''', 'NULL')
        || ', display_index := ' || COALESCE(TRIM(to_char(p.display_index, '99999999')), 'NULL')
        || ', full_copy := ' || _full_copy
        || ' );'  as inserts
    FROM products.product p
    WHERE p.productcode = _productcode
      AND p.version = _version
) loop
     inserts := allrecords.inserts;
     return next;
end loop;


for allrecords in(
    SELECT 'SELECT products.update_insert_internet_source('
        || 'internet_id := ''' || internet_id || ''''
        || ', defined_by := ''' || defined_by || ''''
        || ', descriptive_name := ' || COALESCE('''' || replace(replace(descriptive_name,'"',''''), '''', '''''') || '''', 'NULL')
        || ', description := ' || COALESCE('''' || replace(replace(description,'"',''''), '''', '''''') || '''', 'NULL')
        || ', modified_by := ' || COALESCE('''' || modified_by || '''', 'NULL')
        || ', update_datetime := ''' || COALESCE(update_datetime, now()) || ''''
        || ', url := ' || COALESCE('''' || url || '''', 'NULL')
        || ', user_name := ' || COALESCE('''' || user_name || '''', 'NULL')
        || ', password := ' || COALESCE('''' || password || '''', 'NULL')
        || ', type := ' || COALESCE('''' || type || '''', 'NULL')
        || ', include_files_expression := ' || COALESCE('''' || include_files_expression || '''', 'NULL')
        || ', files_filter_expression := ' || COALESCE('''' || files_filter_expression || '''', 'NULL')
        || ', status := ' || status
        || ', pull_frequency:= ' || pull_frequency
        || ', datasource_descr_id := ' || COALESCE('''' || internet_id || '''', 'NULL')
        || ', frequency_id := ' || COALESCE('''' || frequency_id || '''', '''undefined''')
        || ', start_date:=   ' || COALESCE(TRIM(to_char(start_date, '999999999999')), 'NULL')
        || ', end_date:= ' || COALESCE(TRIM(to_char(end_date, '999999999999')), 'NULL')
        || ', https_params := ' || COALESCE('''' || https_params || '''', 'NULL')
        || ', full_copy := ' || _full_copy
        || ' );'  as inserts
    FROM products.internet_source
    WHERE internet_id IN (SELECT pads.data_source_id
                          FROM products.acquisition pads
                          WHERE pads.productcode = _productcode
                            AND pads.version = _version)
) loop
	 inserts := allrecords.inserts;
	 return next;
end loop;


for allrecords in(
    SELECT 'SELECT products.update_insert_eumetcast_source('
        || '  eumetcast_id := ' || COALESCE('''' || es.eumetcast_id || '''', 'NULL')
        || ', filter_expression_jrc := ' || COALESCE('''' || es.filter_expression_jrc || '''', 'NULL')
        || ', collection_name := ' || COALESCE('''' || es.collection_name || '''', 'NULL')
        || ', status := ' || status
        || ', internal_identifier := ' || COALESCE('''' || es.internal_identifier || '''', 'NULL')
        || ', collection_reference := ' || COALESCE('''' || es.collection_reference || '''', 'NULL')
        || ', acronym := ' || COALESCE('''' || es.acronym || '''', 'NULL')
        || ', description := ' || COALESCE('''' || replace(replace(es.description,'"',''''), '''', '''''') || '''', 'NULL')
        || ', product_status := ' || COALESCE('''' || es.product_status || '''', 'NULL')
        || ', date_creation := ' || COALESCE('''' || to_char(es.date_creation, 'YYYY-MM-DD') || '''', 'NULL')
        || ', date_revision := ' || COALESCE('''' || to_char(es.date_revision, 'YYYY-MM-DD') || '''', 'NULL')
        || ', date_publication := ' || COALESCE('''' || to_char(es.date_publication, 'YYYY-MM-DD') || '''', 'NULL')
        || ', west_bound_longitude := ' || COALESCE(TRIM(to_char(es.west_bound_longitude, '99999999D999999')), 'NULL')
        || ', east_bound_longitude := ' || COALESCE(TRIM(to_char(es.east_bound_longitude, '99999999D999999')), 'NULL')
        || ', north_bound_latitude := ' || COALESCE(TRIM(to_char(es.north_bound_latitude, '99999999D999999')), 'NULL')
        || ', south_bound_latitude := ' || COALESCE(TRIM(to_char(es.south_bound_latitude, '99999999D999999')), 'NULL')
        || ', provider_short_name := ' || COALESCE('''' || es.provider_short_name || '''', 'NULL')
        || ', collection_type := ' || COALESCE('''' || es.collection_type || '''', 'NULL')
        || ', keywords_distribution := ' || COALESCE('''' || es.keywords_distribution || '''', 'NULL')
        || ', keywords_theme := ' || COALESCE('''' || es.keywords_theme || '''', 'NULL')
        || ', keywords_societal_benefit_area := ' || COALESCE('''' || es.keywords_societal_benefit_area || '''', 'NULL')
        || ', orbit_type := ' || COALESCE('''' || es.orbit_type || '''', 'NULL')
        || ', satellite := ' || COALESCE('''' || es.satellite || '''', 'NULL')
        || ', satellite_description := ' || COALESCE('''' || es.satellite_description || '''', 'NULL')
        || ', instrument := ' || COALESCE('''' || es.instrument || '''', 'NULL')
        || ', spatial_coverage := ' || COALESCE('''' || es.spatial_coverage || '''', 'NULL')
        || ', thumbnails := ' || COALESCE('''' || es.thumbnails || '''', 'NULL')
        || ', online_resources := ' || COALESCE('''' || replace(replace(es.online_resources,'"',''''), '''', '''''') || '''', 'NULL')
        || ', distribution := ' || COALESCE('''' || es.distribution || '''', 'NULL')
        || ', channels := ' || COALESCE('''' || es.channels || '''', 'NULL')
        || ', data_access := ' || COALESCE('''' || replace(replace(es.data_access,'"',''''), '''', '''''') || '''', 'NULL')
        || ', available_format := ' || COALESCE('''' || es.available_format || '''', 'NULL')
        || ', version := ' || COALESCE('''' || es.version || '''', 'NULL')
        || ', typical_file_name := ' || COALESCE('''' || es.typical_file_name || '''', 'NULL')
        || ', average_file_size := ' || COALESCE('''' || es.average_file_size || '''', 'NULL')
        || ', frequency := ' || COALESCE('''' || es.frequency || '''', 'NULL')
        || ', legal_constraints_access_constraint := ' || COALESCE('''' || es.legal_constraints_access_constraint || '''', 'NULL')
        || ', legal_use_constraint := ' || COALESCE('''' || es.legal_use_constraint || '''', 'NULL')
        || ', legal_constraints_data_policy := ' || COALESCE('''' || es.legal_constraints_data_policy || '''', 'NULL')
        || ', entry_date := ' || COALESCE('''' || to_char(es.entry_date, 'YYYY-MM-DD') || '''', 'NULL')
        || ', reference_file := ' || COALESCE('''' || es.reference_file || '''', 'NULL')
        || ', datasource_descr_id := ' || COALESCE('''' || es.eumetcast_id || '''', 'NULL')
        || ', full_copy := ' || _full_copy
        || ' );'  as inserts
    FROM products.eumetcast_source es
    WHERE eumetcast_id IN (SELECT pads.data_source_id
                           FROM products.acquisition pads
                           WHERE pads.productcode = _productcode
                             AND pads.version = _version)
) loop
     inserts := allrecords.inserts;
     return next;
end loop;


for allrecords in(
    SELECT 'SELECT products.update_insert_projection('
        || 'proj_code := ''' || proj_code || ''''
        || ', descriptive_name := ' || COALESCE('''' || replace(replace(descriptive_name,'"',''''), '''', '''''') || '''', 'NULL')
        || ', description := ' || COALESCE('''' || replace(replace(description,'"',''''), '''', '''''') || '''', 'NULL')
        || ', srs_wkt := ' || COALESCE('''' || srs_wkt || '''', 'NULL')
        || ', full_copy := ' || 'FALSE'
        || ' );'  as inserts
    FROM products.projection
) loop
     inserts := allrecords.inserts;
     return next;
end loop;


for allrecords in(
    SELECT 'SELECT products.update_insert_resolution('
        || 'resolutioncode := ''' || resolutioncode || ''''
        || ', descriptive_name := ' || COALESCE('''' || replace(replace(descriptive_name,'"',''''), '''', '''''') || '''', 'NULL')
        || ', description := ' || COALESCE('''' || replace(replace(description,'"',''''), '''', '''''') || '''', 'NULL')
        || ', pixel_shift_long := ' || pixel_shift_long
        || ', pixel_shift_lat := ' || pixel_shift_lat
        || ', full_copy := ' || 'FALSE'
        || ' );'  as inserts
    FROM products.resolution
) loop
     inserts := allrecords.inserts;
     return next;
end loop;


for allrecords in(
    SELECT 'SELECT products.update_insert_bbox('
        || 'bboxcode := ''' || bboxcode || ''''
        || ', descriptive_name := ' || COALESCE('''' || replace(replace(descriptive_name,'"',''''), '''', '''''') || '''', 'NULL')
        || ', defined_by := ''' || defined_by || ''''
        || ', upper_left_long := ' || upper_left_long
        || ', upper_left_lat := ' || upper_left_lat
        || ', lower_right_long := ' || lower_right_long
        || ', lower_right_lat := ' || lower_right_lat
        || ', predefined := ' || predefined
        || ', full_copy := ' || 'FALSE'
        || ' );'  as inserts
    FROM products.bbox
) loop
     inserts := allrecords.inserts;
     return next;
end loop;


for allrecords in(
    SELECT 'SELECT products.update_insert_mapset('
        || 'mapsetcode := ''' || mapsetcode || ''''
        || ', descriptive_name := ' || COALESCE('''' || replace(replace(descriptive_name,'"',''''), '''', '''''') || '''', 'NULL')
        || ', description := ' || COALESCE('''' || replace(replace(description,'"',''''), '''', '''''') || '''', 'NULL')
        || ', defined_by := ''' || defined_by || ''''
        || ', proj_code := ''' || proj_code || ''''
        || ', resolutioncode := ''' || resolutioncode || ''''
        || ', bboxcode := ''' || bboxcode || ''''
        || ', pixel_size_x := ' || pixel_size_x
        || ', pixel_size_y:= ' || pixel_size_y
        || ', footprint_image := ''' || COALESCE(footprint_image, 'NULL') || ''''
        || ', center_of_pixel:= ' || center_of_pixel
        || ', full_copy := ' || 'FALSE'
        || ' );'  as inserts
    FROM products.mapset
    WHERE mapsetcode in (
            SELECT DISTINCT native_mapset as mapsetcode
            FROM products.datasource_description dd
            WHERE dd.datasource_descr_id IN (SELECT pads.data_source_id
                                             FROM products.acquisition pads
                                             WHERE pads.productcode = _productcode
                                               AND pads.version = _version)
            UNION
            SELECT DISTINCT mapsetcode
            FROM products.ingestion i
            WHERE i.productcode = _productcode
              AND i.version = _version
            UNION
            SELECT DISTINCT mapsetcode
            FROM products.process_product pp
            WHERE pp.productcode = _productcode
              AND pp.version = _version
        )
) loop
     inserts := allrecords.inserts;
     return next;
end loop;


for allrecords in(
    SELECT 'SELECT products.update_insert_datasource_description('
        || '  datasource_descr_id := ' || COALESCE('''' || datasource_descr_id || '''', 'NULL')
        || ', format_type := ' || COALESCE('''' || format_type || '''', 'NULL')
        || ', file_extension := ' || COALESCE('''' || file_extension || '''', 'NULL')
        || ', delimiter := ' || COALESCE('''' || delimiter || '''', 'NULL')
        || ', date_format := ' || COALESCE('''' || date_format || '''', '''undefined''')
        || ', date_position := ' || COALESCE('''' || date_position || '''', 'NULL')
        || ', product_identifier := ' || COALESCE('''' || product_identifier || '''', 'NULL')
        || ', prod_id_position := ' || COALESCE(TRIM(to_char(prod_id_position, '99999999')), 'NULL')
        || ', prod_id_length := ' || COALESCE(TRIM(to_char(prod_id_length, '99999999')), 'NULL')
        || ', area_type := ' || COALESCE('''' || area_type || '''', 'NULL')
        || ', area_position := ' || COALESCE('''' || area_position || '''', 'NULL')
        || ', area_length := ' || COALESCE(TRIM(to_char(area_length, '99999999')), 'NULL')
        || ', preproc_type := ' || COALESCE('''' || preproc_type || '''', 'NULL')
        || ', product_release := ' || COALESCE('''' || product_release || '''', 'NULL')
        || ', release_position := ' || COALESCE('''' || release_position || '''', 'NULL')
        || ', release_length := ' || COALESCE(TRIM(to_char(release_length, '99999999')), 'NULL')
        || ', native_mapset := ' || COALESCE('''' || native_mapset || '''', 'NULL')
        || ', full_copy := ' || _full_copy
        || ' );'  as inserts
    FROM products.datasource_description dd
    WHERE dd.datasource_descr_id IN (SELECT pads.data_source_id
                                     FROM products.acquisition pads
                                     WHERE pads.productcode = _productcode
                                       AND pads.version = _version)
) loop
     inserts := allrecords.inserts;
     return next;
end loop;


for allrecords in(
    SELECT 'SELECT products.update_insert_acquisition('
        || ' productcode := ''' || pads.productcode || ''''
        || ', subproductcode := ''' || pads.subproductcode || ''''
        || ', version := ''' || pads.version || ''''
        || ', data_source_id := ''' || pads.data_source_id || ''''
        || ', defined_by := ''' || pads.defined_by || ''''
        || ', type := ''' || pads.type || ''''
        || ', activated := ' || pads.activated
        || ', store_original_data := ' || pads.store_original_data
        || ', full_copy := ' || _full_copy
        || ' );'  as inserts
    FROM products.acquisition pads
    WHERE pads.productcode = _productcode
      AND pads.version = _version
) loop
     inserts := allrecords.inserts;
     return next;
end loop;


for allrecords in(
    SELECT 'SELECT products.update_insert_sub_datasource_description('
        || '  productcode := ' || COALESCE('''' || sdd.productcode || '''', 'NULL')
        || ', subproductcode := ' || COALESCE('''' || sdd.subproductcode || '''', 'NULL')
        || ', version := ' || COALESCE('''' || sdd.version || '''', 'NULL')
        || ', datasource_descr_id := ' || COALESCE('''' || sdd.datasource_descr_id || '''', 'NULL')
        || ', scale_factor := ' || COALESCE(TRIM(to_char(sdd.scale_factor, '99999999D999999')), 'NULL')
        || ', scale_offset := ' || COALESCE(TRIM(to_char(sdd.scale_offset, '99999999D999999')), 'NULL')
        || ', no_data := ' || COALESCE(TRIM(to_char(sdd.no_data, '99999999D999999')), 'NULL')
        || ', data_type_id := ' || COALESCE('''' || sdd.data_type_id || '''', '''undefined''')
        || ', mask_min := ' || COALESCE(TRIM(to_char(sdd.mask_min, '99999999D999999')), 'NULL')
        || ', mask_max := ' || COALESCE(TRIM(to_char(sdd.mask_max, '99999999D999999')), 'NULL')
        || ', re_process := ' || COALESCE('''' || sdd.re_process || '''', 'NULL')
        || ', re_extract := ' || COALESCE('''' || sdd.re_extract || '''', 'NULL')
        || ', scale_type := ' || COALESCE('''' || sdd.scale_type || '''', 'NULL')
        || ', full_copy := ' || _full_copy
        || ' );'  as inserts
    FROM products.sub_datasource_description sdd
    WHERE sdd.productcode = _productcode
      AND sdd.version = _version
) loop
     inserts := allrecords.inserts;
     return next;
end loop;


for allrecords in(
    SELECT 'SELECT products.update_insert_ingestion('
        || '  productcode := ' || COALESCE('''' || i.productcode || '''', 'NULL')
        || ', subproductcode := ' || COALESCE('''' || i.subproductcode || '''', 'NULL')
        || ', version := ' || COALESCE('''' || i.version || '''', 'NULL')
        || ', mapsetcode := ' || COALESCE('''' || i.mapsetcode || '''', 'NULL')
        || ', defined_by := ' || COALESCE('''' || i.defined_by || '''', 'NULL')
        || ', activated := ' || i.activated
        || ', wait_for_all_files := ' || i.wait_for_all_files
        || ', input_to_process_re := ' || COALESCE('''' || i.input_to_process_re || '''', 'NULL')
        || ', enabled := ' || i.enabled
        || ', full_copy := ' || _full_copy
        || ' );'  as inserts
    FROM products.ingestion i
    WHERE i.productcode = _productcode
      AND i.version = _version
) loop
     inserts := allrecords.inserts;
     return next;
end loop;


for allrecords in(
    SELECT 'SELECT products.update_insert_processing('
        || ' process_id := ' || process_id
        || ', defined_by := ' || COALESCE('''' || defined_by || '''', 'NULL')
        || ', output_mapsetcode := ' || COALESCE('''' || output_mapsetcode || '''', 'NULL')
        || ', activated := ' || activated
        || ', derivation_method := ' || COALESCE('''' || derivation_method || '''', 'NULL')
        || ', algorithm := ' || COALESCE('''' || algorithm || '''', 'NULL')
        || ', priority := ' || COALESCE('''' || priority || '''', 'NULL')
        || ', enabled := ' || enabled
        || ', full_copy := ' || _full_copy
        || ' );'  as inserts
    FROM products.processing
    WHERE process_id IN (SELECT DISTINCT pp.process_id
                         FROM products.process_product pp
                         WHERE pp.productcode = _productcode
                           AND pp.version = _version)
) loop
     inserts := allrecords.inserts;
     return next;
end loop;


for allrecords in(
    SELECT 'SELECT products.update_insert_process_product('
        || ' process_id := ' || pp.process_id
        || ', productcode := ' || COALESCE('''' || pp.productcode || '''', 'NULL')
        || ', subproductcode := ' || COALESCE('''' || pp.subproductcode || '''', 'NULL')
        || ', version := ' || COALESCE('''' || pp.version || '''', 'NULL')
        || ', mapsetcode := ' || COALESCE('''' || pp.mapsetcode || '''', 'NULL')
        || ', type := ' || COALESCE('''' || pp.type || '''', 'NULL')
        || ', activated := ' || pp.activated
        || ', final := ' || pp.final
        || ', date_format := ' || COALESCE('''' || pp.date_format || '''', '''undefined''')
        || ', start_date:=   ' || COALESCE(TRIM(to_char(pp.start_date, '999999999999')), 'NULL')
        || ', end_date:= ' || COALESCE(TRIM(to_char(pp.end_date, '999999999999')), 'NULL')
        || ', full_copy := ' || _full_copy
        || ' );'  as inserts
    FROM products.process_product pp
    WHERE pp.productcode = _productcode
  AND pp.version = _version
) loop
     inserts := allrecords.inserts;
     return next;
end loop;

END
$BODY$;

ALTER FUNCTION products.export_product_data(character varying, character varying, boolean)
    OWNER TO estation;