SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

SET search_path = products, analysis, pg_catalog;

/*******************************************************************************************
* PRE- update insert JRC data
*
* Put here all the needed TRUNCATE TABLE statements.
********************************************************************************************/
TRUNCATE TABLE analysis.legend CASCADE;


/*******************************************************************************************
* Update insert JRC data
********************************************************************************************/

-- COPY HERE THE FULL RESULT OF THE FUNCTION CALL:
--      select * from products.export_jrc_data();
-- Then CUT the lines of the layer table, which are in the end and look like:
--      PERFORM analysis.update_insert_layers ...
-- and paste these lines in the code indicated below.


DO $$
DECLARE current_layer_id integer;
BEGIN
	-- Save the latest layerid (it could be that the user installed the eStation-Apps-2.0.4 first and created a new layer
	-- before installing the eStation-Layers-2.0.4 package.

	SELECT INTO current_layer_id nextval('analysis.layers_layerid_seq');
	-- raise notice 'current_layer_id set to: %', current_layer_id;

	DELETE FROM analysis.layers WHERE layerid < 100;

	ALTER SEQUENCE analysis.layers_layerid_seq RESTART WITH 1;

  -- COPY HERE ALL THE RECORDS of the layers table, which look like:
  --    PERFORM analysis.update_insert_layers ...

	IF current_layer_id >= 100 THEN
		PERFORM setval('analysis.layers_layerid_seq', current_layer_id);
		--raise notice 'Sequence higher then 100 so the user created a new layer with current_layer_id: %', current_layer_id;
	ELSE
		ALTER SEQUENCE analysis.layers_layerid_seq RESTART WITH 100;
		-- raise notice 'current_layer_id set to: %', 100;
	END IF;
END $$;



/*******************************************************************************************
* POST- update insert JRC data
*
* Put in this section Create Update Delete queries like:
  -- De-activate 'new' products (i.e. products defined after 2.0.4): they are activated afterwards - according to thema_product
  -- Disable a list of products by deactivating them and put defined_by on JRC_test so that they will not appear in the GUI
  -- Delete the wrong modis-pp processing chain. In delete cascade of table products.process_product.
********************************************************************************************/

-- psql -h localhost -U estation -d estationdb -t -c "SELECT * FROM products.export_product_data('chirps-dekad', '2.0', true)" > product_db_records.sql
-- psql -h localhost -U estation -d estationdb -t -c "SELECT * FROM products.export_product_data('chirps-dekad', '2.0', true) as x(inserts text)" > product_db_records.sql

-- SELECT * FROM products.export_product_data('chirps-dekad', '2.0', true);

CREATE OR REPLACE FUNCTION products.export_product_data(
    productcode character varying DEFAULT NULL,
    version character varying DEFAULT NULL, 
    full_copy boolean DEFAULT false)
RETURNS SETOF text 
LANGUAGE 'plpgsql'
COST 100

AS $BODY$
DECLARE
    _productcode ALIAS FOR  $1;
    _version ALIAS FOR  $2;
    _full_copy ALIAS FOR  $3;
BEGIN

RETURN QUERY SELECT 'SELECT products.update_insert_product('
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
ORDER BY p.productcode, p.version, p.subproductcode;

RETURN QUERY SELECT chr(10);

RETURN QUERY SELECT 'SELECT products.update_insert_internet_source('
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
                      FROM products.product_acquisition_data_source pads
                      WHERE pads.productcode = _productcode
                        AND pads.version = _version);

RETURN QUERY SELECT chr(10);

RETURN QUERY SELECT 'SELECT products.update_insert_eumetcast_source('
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
                       FROM products.product_acquisition_data_source pads
                       WHERE pads.productcode = _productcode
                         AND pads.version = _version);

RETURN QUERY SELECT chr(10);

RETURN QUERY SELECT 'SELECT products.update_insert_projection('
    || 'proj_code := ''' || proj_code || ''''
    || ', descriptive_name := ' || COALESCE('''' || replace(replace(descriptive_name,'"',''''), '''', '''''') || '''', 'NULL')
    || ', description := ' || COALESCE('''' || replace(replace(description,'"',''''), '''', '''''') || '''', 'NULL')
    || ', srs_wkt := ' || COALESCE('''' || srs_wkt || '''', 'NULL')
    || ', full_copy := ' || FALSE
    || ' );'  as inserts
FROM products.projection;

RETURN QUERY SELECT chr(10);

RETURN QUERY SELECT 'SELECT products.update_insert_resolution('
    || 'resolutioncode := ''' || resolutioncode || ''''
    || ', descriptive_name := ' || COALESCE('''' || replace(replace(descriptive_name,'"',''''), '''', '''''') || '''', 'NULL')
    || ', description := ' || COALESCE('''' || replace(replace(description,'"',''''), '''', '''''') || '''', 'NULL')
    || ', pixel_shift_long := ' || pixel_shift_long
    || ', pixel_shift_lat := ' || pixel_shift_lat
    || ', full_copy := ' || FALSE
    || ' );'  as inserts
FROM products.resolution;

RETURN QUERY SELECT chr(10);

RETURN QUERY SELECT 'SELECT products.update_insert_bbox('
    || 'bboxcode := ''' || bboxcode || ''''
    || ', descriptive_name := ' || COALESCE('''' || replace(replace(descriptive_name,'"',''''), '''', '''''') || '''', 'NULL')
    || ', defined_by := ''' || defined_by || ''''
    || ', upper_left_long := ' || upper_left_long
    || ', upper_left_lat := ' || upper_left_lat
    || ', lower_right_long := ' || lower_right_long
    || ', lower_right_lat := ' || lower_right_lat
    || ', predefined := ' || predefined
    || ', full_copy := ' || FALSE
    || ' );'  as inserts
FROM products.bbox;

RETURN QUERY SELECT chr(10);

RETURN QUERY SELECT 'SELECT products.update_insert_mapset_new('
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
    || ', full_copy := ' || FALSE
    || ' );'  as inserts
FROM products.mapset_new
WHERE mapsetcode in (
        SELECT DISTINCT native_mapset as mapsetcode
        FROM products.datasource_description dd
        WHERE dd.datasource_descr_id IN (SELECT pads.data_source_id
                                         FROM products.product_acquisition_data_source pads
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
    );

RETURN QUERY SELECT chr(10);

RETURN QUERY SELECT 'SELECT products.update_insert_datasource_description('
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
                                 FROM products.product_acquisition_data_source pads
                                 WHERE pads.productcode = _productcode
                                   AND pads.version = _version);
RETURN QUERY SELECT chr(10);

RETURN QUERY SELECT 'SELECT products.update_insert_product_acquisition_data_source('
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
FROM products.product_acquisition_data_source pads
WHERE pads.productcode = _productcode
  AND pads.version = _version;

RETURN QUERY SELECT chr(10);

RETURN QUERY SELECT 'SELECT products.update_insert_sub_datasource_description('
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
  AND sdd.version = _version;

RETURN QUERY SELECT chr(10);

RETURN QUERY SELECT 'SELECT products.update_insert_ingestion('
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
  AND i.version = _version;

RETURN QUERY SELECT chr(10);

RETURN QUERY SELECT 'SELECT products.update_insert_processing('
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
                       AND pp.version = _version);

RETURN QUERY SELECT chr(10);

RETURN QUERY SELECT 'SELECT products.update_insert_process_product('
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
  AND pp.version = _version;

END;
$BODY$;

ALTER FUNCTION products.export_product_data(character varying, character varying, boolean)
    OWNER TO estation;


	RETURN QUERY SELECT 'SELECT analysis.update_insert_legend('
		|| ' legend_id := ' || legend_id
		|| ', legend_name := ' || COALESCE('''' || replace(replace(legend_name,'"',''''), '''', '''''') || '''', 'NULL')
		|| ', step_type := ' || COALESCE('''' || step_type || '''', 'NULL')
		|| ', min_value := ' || COALESCE(TRIM(to_char(min_value, '99999999D999999')), 'NULL')
		|| ', max_value := ' || COALESCE(TRIM(to_char(max_value, '99999999D999999')), 'NULL')
		|| ', min_real_value := ' || COALESCE('''' || min_real_value || '''', 'NULL')
		|| ', max_real_value := ''' || COALESCE(max_real_value, 'NULL') || ''''
		|| ', colorbar := ''' || COALESCE(colorbar, 'NULL') || ''''
		|| ', step := ' || COALESCE(TRIM(to_char(step, '99999999D999999')), 'NULL')
		|| ', step_range_from := ' || COALESCE(TRIM(to_char(step_range_from, '99999999D999999')), 'NULL')
		|| ', step_range_to := ' || COALESCE(TRIM(to_char(step_range_to, '99999999D999999')), 'NULL')
		|| ', unit := ' || COALESCE('''' || unit || '''', 'NULL')
		|| ', defined_by := ' || COALESCE('''' || defined_by || '''', 'NULL')
		|| ' );'  as inserts
	FROM analysis.legend
	WHERE legend_id IN (SELECT legend_id
						FROM analysis.product_legend
						WHERE productcode = _productcode
						  AND version = _version
					   )
	ORDER BY legend_id;

	RETURN QUERY SELECT chr(10);
	RETURN QUERY SELECT chr(10);


	RETURN QUERY SELECT 'SELECT analysis.update_insert_legend_step('
		|| ' legend_id := ' || legend_id
		|| ', from_step :=  ' || from_step
		|| ', to_step :=  ' || to_step
		|| ', color_rgb := ' || COALESCE('''' || color_rgb || '''', 'NULL')
		|| ', color_label := ' || COALESCE('''' || color_label || '''', 'NULL')
		|| ', group_label := ' || COALESCE('''' || group_label || '''', 'NULL')
		|| ' );'  as inserts
	FROM analysis.legend_step
	WHERE legend_id IN (SELECT legend_id
						FROM analysis.product_legend
						WHERE productcode = _productcode
						  AND version = _version
					   )
	ORDER BY legend_id;


	RETURN QUERY SELECT chr(10);
	RETURN QUERY SELECT chr(10);


	RETURN QUERY SELECT 'SELECT analysis.update_insert_product_legend('
		|| ' productcode := ' || COALESCE('''' || productcode || '''', 'NULL')
		|| ', subproductcode := ' || COALESCE('''' || subproductcode || '''', 'NULL')
		|| ', version := ' || COALESCE('''' || version || '''', 'NULL')
		|| ', legend_id := ' || legend_id
		|| ', default_legend := ' || default_legend
		|| ' );'  as inserts
	FROM analysis.product_legend pl
	WHERE productcode = _productcode
	  AND version = _version;

	RETURN QUERY SELECT chr(10);
	RETURN QUERY SELECT chr(10);




-- SELECT * FROM products.export_product_data('chirps-dekad', '2.0', true) as x(inserts text);
-- DROP FUNCTION products.export_product_data(character varying,character varying,boolean);
BEGIN;

SELECT products.export_product_data('chirps-dekad', '2.0', true);

FETCH ALL IN "ca_cur";
FETCH ALL IN "tx_cur";
COMMIT;


CREATE OR REPLACE FUNCTION products.export_product_data(
    productcode character varying DEFAULT NULL,
    version character varying DEFAULT NULL,
    full_copy boolean DEFAULT false)
RETURNS SETOF text
LANGUAGE 'plpgsql'
COST 100

AS $BODY$
DECLARE
    _productcode ALIAS FOR  $1;
    _version ALIAS FOR  $2;
    _full_copy ALIAS FOR  $3;

	cursor1 refcursor;
	cursor2 refcursor;
	cursor3 refcursor;
	cursor4 refcursor;
	cursor5 refcursor;
	cursor6 refcursor;
	cursor7 refcursor;
	cursor8 refcursor;
	cursor9 refcursor;
	cursor10 refcursor;
	cursor11 refcursor;
	cursor12 refcursor;
	cursor13 refcursor;
BEGIN

OPEN cursor1 FOR SELECT 'SELECT products.update_insert_product('
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
  AND p.version = _version;

RETURN NEXT cursor1;

OPEN cursor2 FOR SELECT 'SELECT products.update_insert_internet_source('
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
                      FROM products.product_acquisition_data_source pads
                      WHERE pads.productcode = _productcode
                        AND pads.version = _version);

RETURN NEXT cursor2;

OPEN cursor3 FOR SELECT 'SELECT products.update_insert_eumetcast_source('
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
                       FROM products.product_acquisition_data_source pads
                       WHERE pads.productcode = _productcode
                         AND pads.version = _version);

RETURN NEXT cursor3;

OPEN cursor4 FOR SELECT 'SELECT products.update_insert_projection('
    || 'proj_code := ''' || proj_code || ''''
    || ', descriptive_name := ' || COALESCE('''' || replace(replace(descriptive_name,'"',''''), '''', '''''') || '''', 'NULL')
    || ', description := ' || COALESCE('''' || replace(replace(description,'"',''''), '''', '''''') || '''', 'NULL')
    || ', srs_wkt := ' || COALESCE('''' || srs_wkt || '''', 'NULL')
    || ', full_copy := ' || FALSE
    || ' );'  as inserts
FROM products.projection;

RETURN NEXT cursor4;

OPEN cursor5 FOR SELECT 'SELECT products.update_insert_resolution('
    || 'resolutioncode := ''' || resolutioncode || ''''
    || ', descriptive_name := ' || COALESCE('''' || replace(replace(descriptive_name,'"',''''), '''', '''''') || '''', 'NULL')
    || ', description := ' || COALESCE('''' || replace(replace(description,'"',''''), '''', '''''') || '''', 'NULL')
    || ', pixel_shift_long := ' || pixel_shift_long
    || ', pixel_shift_lat := ' || pixel_shift_lat
    || ', full_copy := ' || FALSE
    || ' );'  as inserts
FROM products.resolution;

RETURN NEXT cursor5;

OPEN cursor6 FOR SELECT 'SELECT products.update_insert_bbox('
    || 'bboxcode := ''' || bboxcode || ''''
    || ', descriptive_name := ' || COALESCE('''' || replace(replace(descriptive_name,'"',''''), '''', '''''') || '''', 'NULL')
    || ', defined_by := ''' || defined_by || ''''
    || ', upper_left_long := ' || upper_left_long
    || ', upper_left_lat := ' || upper_left_lat
    || ', lower_right_long := ' || lower_right_long
    || ', lower_right_lat := ' || lower_right_lat
    || ', predefined := ' || predefined
    || ', full_copy := ' || FALSE
    || ' );'  as inserts
FROM products.bbox;

RETURN NEXT cursor6;

OPEN cursor7 FOR SELECT 'SELECT products.update_insert_mapset_new('
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
    || ', full_copy := ' || FALSE
    || ' );'  as inserts
FROM products.mapset_new
WHERE mapsetcode in (
        SELECT DISTINCT native_mapset as mapsetcode
        FROM products.datasource_description dd
        WHERE dd.datasource_descr_id IN (SELECT pads.data_source_id
                                         FROM products.product_acquisition_data_source pads
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
    );

RETURN NEXT cursor7;

OPEN cursor8 FOR SELECT 'SELECT products.update_insert_datasource_description('
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
                                 FROM products.product_acquisition_data_source pads
                                 WHERE pads.productcode = _productcode
                                   AND pads.version = _version);

RETURN NEXT cursor8;

OPEN cursor9 FOR SELECT 'SELECT products.update_insert_product_acquisition_data_source('
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
FROM products.product_acquisition_data_source pads
WHERE pads.productcode = _productcode
  AND pads.version = _version;

RETURN NEXT cursor9;

OPEN cursor10 FOR SELECT 'SELECT products.update_insert_sub_datasource_description('
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
  AND sdd.version = _version;

RETURN NEXT cursor10;

OPEN cursor11 FOR SELECT 'SELECT products.update_insert_ingestion('
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
  AND i.version = _version;

RETURN NEXT cursor11;

OPEN cursor12 FOR SELECT 'SELECT products.update_insert_processing('
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
                       AND pp.version = _version);

RETURN NEXT cursor12;

OPEN cursor13 FOR SELECT 'SELECT products.update_insert_process_product('
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
  AND pp.version = _version;

RETURN NEXT cursor13;

END;
$BODY$;

ALTER FUNCTION products.export_product_data(character varying, character varying, boolean)
    OWNER TO estation;

