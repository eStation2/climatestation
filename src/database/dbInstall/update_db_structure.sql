SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;


/**********************************************************
  BEGIN TABLE CREATION
 *********************************************************/
 
/**********************************************************
  For version 1.0.0
 *********************************************************/

CREATE TABLE IF NOT EXISTS products.preproc_type
(
    preproc_type character varying COLLATE pg_catalog."default" NOT NULL,
    preproc_type_descr character varying COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT preproc_type_pk PRIMARY KEY (preproc_type)
)

TABLESPACE pg_default;

ALTER TABLE products.preproc_type
    OWNER to estation;


CREATE TABLE IF NOT EXISTS products.internet_type
(
    internet_type_id character varying COLLATE pg_catalog."default" NOT NULL,
    internet_type_name character varying COLLATE pg_catalog."default" NOT NULL,
    internet_type_descr character varying COLLATE pg_catalog."default",
    CONSTRAINT internet_type_pk PRIMARY KEY (internet_type_id)
)

TABLESPACE pg_default;

ALTER TABLE products.internet_type
    OWNER to estation;

/**********************************************************
  END TABLE CREATION
 *********************************************************/


/***************************************************************************************
  BEGIN  ALTER TABLE adding columns, triggers and indexes (always after TABLE CREATION)
 **************************************************************************************/

/**********************************************************
  For version 1.0.0
 *********************************************************/

ALTER TABLE products.eumetcast_source
    ADD COLUMN modified_by character varying;


/***************************************************************************************
  END  ALTER TABLE adding columns, triggers and indexes (always after TABLE CREATION)
 **************************************************************************************/
 

/**********************************************************
  BEGIN update insert functions
 *********************************************************/
CREATE OR REPLACE FUNCTION products.update_insert_preproc_type(
	preproc_type character varying,
	preproc_type_descr character varying)
    RETURNS boolean
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE
    _preproc_type ALIAS FOR $1;
    _preproc_type_descr ALIAS FOR $2;
BEGIN
    PERFORM * FROM products.preproc_type pt WHERE pt.preproc_type = TRIM(_preproc_type);
    IF FOUND THEN
        UPDATE products.preproc_type pt SET preproc_type_descr = TRIM(_preproc_type_descr) WHERE pt.preproc_type = TRIM(_preproc_type);
    ELSE
        INSERT INTO products.preproc_type (preproc_type, preproc_type_descr) VALUES (TRIM(_preproc_type), TRIM(_preproc_type_descr));
    END IF;
    RETURN TRUE;
END;
$BODY$;

ALTER FUNCTION products.update_insert_preproc_type(character varying, character varying)
    OWNER TO estation;



CREATE OR REPLACE FUNCTION products.update_insert_internet_type(
	internet_type_id character varying,
	internet_type_name character varying,
	internet_type_descr character varying)
    RETURNS boolean
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE
    _internet_type_id ALIAS FOR $1;
    _internet_type_name ALIAS FOR $2;
    _internet_type_descr ALIAS FOR $3;
BEGIN
    PERFORM * FROM products.internet_type it WHERE it.internet_type_id = TRIM(_internet_type_id);
    IF FOUND THEN
        UPDATE products.internet_type it
        SET internet_type_name = TRIM(_internet_type_name),
            internet_type_descr = TRIM(_internet_type_descr)
        WHERE it.internet_type_id = TRIM(_internet_type_id);
    ELSE
        INSERT INTO products.internet_type (internet_type_id, internet_type_name, internet_type_descr) VALUES (TRIM(_internet_type_id), TRIM(_internet_type_name), TRIM(_internet_type_descr));
    END IF;
    RETURN TRUE;
END;
$BODY$;

ALTER FUNCTION products.update_insert_internet_type(character varying, character varying, character varying)
    OWNER TO estation;



CREATE OR REPLACE FUNCTION products.export_jrc_data(
	full_copy boolean DEFAULT false)
    RETURNS SETOF text
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
DECLARE
    _full_copy ALIAS FOR $1;
BEGIN
    -- full_copy := FALSE;

    RETURN QUERY SELECT 'SELECT products.update_insert_product_category('
                            || 'category_id := ''' || category_id || ''''
                            || ', order_index := ' || order_index
                            || ', descriptive_name := ' ||
                        COALESCE('''' || replace(replace(descriptive_name, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ' );' as inserts
                 FROM products.product_category
				 ORDER BY descriptive_name;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT products.update_insert_frequency('
                            || 'frequency_id := ''' || frequency_id || ''''
                            || ', time_unit := ''' || time_unit || ''''
                            || ', frequency := ' || frequency
                            || ', frequency_type := ' || COALESCE('''' || frequency_type || '''', 'NULL')
                            || ', description := ' ||
                        COALESCE('''' || replace(replace(description, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ' );' as inserts
                 FROM products.frequency;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT products.update_insert_date_format('
                            || 'date_format := ''' || date_format || ''''
                            || ', definition := ' || COALESCE('''' || definition || '''', 'NULL')
                            || ' );' as inserts
                 FROM products.date_format
				 ORDER BY date_format;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT products.update_insert_data_type('
                            || 'data_type_id := ''' || data_type_id || ''''
                            || ', description := ' ||
                        COALESCE('''' || replace(replace(description, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ' );' as inserts
                 FROM products.data_type
				 ORDER BY data_type_id;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT products.update_insert_preproc_type('
                            || 'preproc_type := ''' || preproc_type || ''''
                            || ', preproc_type_descr := ' || COALESCE('''' || preproc_type_descr || '''', 'NULL')
                            || ' );' as inserts
                 FROM products.preproc_type
				 ORDER BY preproc_type;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT products.update_insert_internet_type('
                            || 'internet_type_id := ''' || internet_type_id || ''''
                            || ', internet_type_name := ' || COALESCE('''' || internet_type_name || '''', 'NULL')
                            || ', internet_type_descr := ' || COALESCE('''' || internet_type_descr || '''', 'NULL')
                            || ' );' as inserts
                 FROM products.internet_type
				 ORDER BY internet_type_id;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT products.update_insert_projection('
                            || 'proj_code := ''' || proj_code || ''''
                            || ', descriptive_name := ' || COALESCE(
                                    '''' || replace(replace(descriptive_name, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ', description := ' || COALESCE(
                                '''' || replace(replace(description, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ', srs_wkt := ' || COALESCE('''' || srs_wkt || '''', 'NULL')
                            || ', full_copy := ' || _full_copy
                            || ' );' as inserts
                 FROM products.projection
				 ORDER BY proj_code;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT products.update_insert_resolution('
                            || 'resolutioncode := ''' || resolutioncode || ''''
                            || ', descriptive_name := ' || COALESCE(
                                    '''' || replace(replace(descriptive_name, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ', description := ' || COALESCE(
                                '''' || replace(replace(description, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ', pixel_shift_long := ' || pixel_shift_long
                            || ', pixel_shift_lat := ' || pixel_shift_lat
                            || ', full_copy := ' || _full_copy
                            || ' );' as inserts
                 FROM products.resolution
				 ORDER BY resolutioncode;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT products.update_insert_bbox('
                            || 'bboxcode := ''' || bboxcode || ''''
                            || ', descriptive_name := ' ||
                        COALESCE('''' || replace(replace(descriptive_name, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ', defined_by := ''' || defined_by || ''''
                            || ', upper_left_long := ' || upper_left_long
                            || ', upper_left_lat := ' || upper_left_lat
                            || ', lower_right_long := ' || lower_right_long
                            || ', lower_right_lat := ' || lower_right_lat
                            || ', predefined := ' || predefined
                            || ', full_copy := ' || _full_copy
                            || ' );' as inserts
                 FROM products.bbox
				 ORDER BY bboxcode;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT products.update_insert_mapset('
                            || 'mapsetcode := ''' || mapsetcode || ''''
                            || ', descriptive_name := ' ||
                        COALESCE('''' || replace(replace(descriptive_name, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ', description := ' ||
                        COALESCE('''' || replace(replace(description, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ', defined_by := ''' || defined_by || ''''
                            || ', proj_code := ''' || proj_code || ''''
                            || ', resolutioncode := ''' || resolutioncode || ''''
                            || ', bboxcode := ''' || bboxcode || ''''
                            || ', pixel_size_x := ' || pixel_size_x
                            || ', pixel_size_y:= ' || pixel_size_y
                            || ', footprint_image := ''' || COALESCE(footprint_image, 'NULL') || ''''
                            || ', center_of_pixel:= ' || center_of_pixel
                            || ', full_copy := ' || _full_copy
                            || ' );' as inserts
                 FROM products.mapset
                 WHERE defined_by = 'JRC'
				 ORDER BY mapsetcode;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT products.update_insert_thema('
                            || 'thema_id := ''' || thema_id || ''''
                            || ', description := ' ||
                        COALESCE('''' || replace(replace(description, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ', activated := ' || activated
                            || ' );' as inserts
                 FROM products.thema
				 ORDER BY thema_id;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT products.update_insert_product('
                            || '  productcode := ' || COALESCE('''' || productcode || '''', 'NULL')
                            || ', version := ' || COALESCE('''' || version || '''', 'NULL')
                            || ', defined_by := ' || COALESCE('''' || defined_by || '''', 'NULL')
                            || ', activated := ' || activated
                            || ', category_id := ' || COALESCE('''' || category_id || '''', 'NULL')
                            || ', descriptive_name := ' || COALESCE(
                                    '''' || replace(replace(descriptive_name, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ', description := ' || COALESCE(
                                '''' || replace(replace(description, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ', provider := ' || COALESCE('''' || provider || '''', 'NULL')
                            || ', masked := ' || masked
                            || ', acquisition_period := ' || COALESCE('''' || acquisition_period || '''', 'NULL')
                            || ', keyword := ' || COALESCE('''' || keyword || '''', 'NULL')
                            || ', spatial_repres := ' || COALESCE('''' || spatial_repres || '''', 'NULL')
                            || ', citation := ' || COALESCE('''' || citation || '''', 'NULL')
                            || ', access_constraints := ' || COALESCE('''' || access_constraints || '''', 'NULL')
                            || ', use_constraints := ' || COALESCE('''' || use_constraints || '''', 'NULL')
                            || ', full_copy := ' || _full_copy
		|| ' );'  as inserts
	FROM products.product
	WHERE defined_by = 'JRC'
    ORDER BY productcode, version;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT products.update_insert_sub_product('
                            || '  productcode := ' || COALESCE('''' || productcode || '''', 'NULL')
                            || ', subproductcode := ' || COALESCE('''' || subproductcode || '''', 'NULL')
                            || ', version := ' || COALESCE('''' || version || '''', 'NULL')
                            || ', defined_by := ' || COALESCE('''' || defined_by || '''', 'NULL')
                            || ', product_type := ' || COALESCE('''' || product_type || '''', 'NULL')
                            || ', descriptive_name := ' || COALESCE(
                                    '''' || replace(replace(descriptive_name, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ', description := ' || COALESCE(
                                '''' || replace(replace(description, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ', frequency_id := ' || COALESCE('''' || frequency_id || '''', '''undefined''')
                            || ', date_format := ' || COALESCE('''' || date_format || '''', '''undefined''')
                            || ', scale_factor := ' || COALESCE(TRIM(to_char(scale_factor, '99999999D999999')), 'NULL')
                            || ', scale_offset := ' || COALESCE(TRIM(to_char(scale_offset, '99999999D999999')), 'NULL')
                            || ', nodata := ' || COALESCE(TRIM(to_char(nodata, '99999999')), 'NULL')
                            || ', mask_min := ' || COALESCE(TRIM(to_char(mask_min, '99999999D999999')), 'NULL')
                            || ', mask_max := ' || COALESCE(TRIM(to_char(mask_max, '99999999D999999')), 'NULL')
                            || ', unit := ' || COALESCE('''' || unit || '''', 'NULL')
                            || ', data_type_id := ' || COALESCE('''' || data_type_id || '''', '''undefined''')
                            || ', masked := ' || masked
                            || ', timeseries_role := ' || COALESCE('''' || timeseries_role || '''', 'NULL')
                            || ', display_index := ' || COALESCE(TRIM(to_char(display_index, '99999999')), 'NULL')
                            || ', update_frequency := ' || COALESCE('''' || update_frequency || '''', 'NULL')
                            || ', reference := ' || COALESCE('''' || reference || '''', 'NULL')
                            || ', keywords := ' || COALESCE('''' || keywords || '''', 'NULL')
                            || ', use_conditions := ' || COALESCE('''' || use_conditions || '''', 'NULL')
                            || ', quality_scope := ' || COALESCE('''' || quality_scope || '''', 'NULL')
                            || ', quality_title := ' || COALESCE('''' || quality_title || '''', 'NULL')
                            || ', quality_explanation := ' || COALESCE('''' || quality_explanation || '''', 'NULL')
                            || ', quality_statement := ' || COALESCE('''' || quality_statement || '''', 'NULL')
                            || ', spatial_repres := ' || COALESCE('''' || spatial_repres || '''', 'NULL')
                            || ', resource_url := ' || COALESCE('''' || resource_url || '''', 'NULL')
                            || ', full_copy := ' || _full_copy
		|| ' );'  as inserts
	FROM products.sub_product
	WHERE defined_by = 'JRC'
    ORDER BY productcode, version, subproductcode;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT products.update_insert_thema_product('
                            || 'thema_id := ''' || thema_id || ''''
                            || ', productcode := ''' || productcode || ''''
                            || ', version := ''' || version || ''''
                            || ', mapsetcode := ''' || mapsetcode || ''''
                            || ', activated := ' || activated
                            || ' );' as inserts
                 FROM products.thema_product tp
                 WHERE (tp.productcode, tp.version) in
                       (SELECT productcode, version FROM products.product WHERE defined_by = 'JRC')
                 ORDER BY thema_id;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    -- insert into products.datasource_description (datasource_descr_id) select internet_id from products.internet_source where internet_id not in (select datasource_descr_id from products.datasource_description)

    RETURN QUERY SELECT 'SELECT products.update_insert_internet_source('
                            || 'internet_id := ''' || internet_id || ''''
                            || ', defined_by := ''' || defined_by || ''''
                            || ', descriptive_name := ' ||
                        COALESCE('''' || replace(replace(descriptive_name, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ', description := ' ||
                        COALESCE('''' || replace(replace(description, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ', modified_by := ' || COALESCE('''' || modified_by || '''', 'NULL')
                            || ', update_datetime := ''' || COALESCE(update_datetime, now()) || ''''
                            || ', url := ' || COALESCE('''' || url || '''', 'NULL')
                            || ', user_name := ' || COALESCE('''' || user_name || '''', 'NULL')
                            || ', password := ' || COALESCE('''' || password || '''', 'NULL')
                            || ', type := ' || COALESCE('''' || type || '''', 'NULL')
                            || ', include_files_expression := ' ||
                        COALESCE('''' || include_files_expression || '''', 'NULL')
                            || ', files_filter_expression := ' ||
                        COALESCE('''' || files_filter_expression || '''', 'NULL')
                            || ', status := ' || status
                            || ', pull_frequency:= ' || pull_frequency
                            || ', datasource_descr_id := ' || COALESCE('''' || internet_id || '''', 'NULL')
                            || ', frequency_id := ' || COALESCE('''' || frequency_id || '''', '''undefined''')
                            || ', start_date:=   ' || COALESCE(TRIM(to_char(start_date, '999999999999')), 'NULL')
                            || ', end_date:= ' || COALESCE(TRIM(to_char(end_date, '999999999999')), 'NULL')
                            || ', https_params := ' || COALESCE('''' || https_params || '''', 'NULL')
                            || ', full_copy := ' || _full_copy
                            || ' );' as inserts
                 FROM products.internet_source
                 WHERE defined_by = 'JRC'
				 ORDER BY internet_id;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    -- insert into products.datasource_description (datasource_descr_id) select eumetcast_id from products.eumetcast_source where eumetcast_id not in (select datasource_descr_id from products.datasource_description)

    RETURN QUERY SELECT 'SELECT products.update_insert_eumetcast_source('
                            || '  eumetcast_id := ' || COALESCE('''' || eumetcast_id || '''', 'NULL')
                            || ', filter_expression_jrc := ' || COALESCE('''' || filter_expression_jrc || '''', 'NULL')
                            || ', collection_name := ' || COALESCE('''' || collection_name || '''', 'NULL')
                            || ', status := ' || status
                            || ', internal_identifier := ' || COALESCE('''' || internal_identifier || '''', 'NULL')
                            || ', collection_reference := ' || COALESCE('''' || collection_reference || '''', 'NULL')
                            || ', acronym := ' || COALESCE('''' || acronym || '''', 'NULL')
                            || ', description := ' || COALESCE(
                                '''' || replace(replace(description, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ', product_status := ' || COALESCE('''' || product_status || '''', 'NULL')
                            || ', date_creation := ' ||
                        COALESCE('''' || to_char(date_creation, 'YYYY-MM-DD') || '''', 'NULL')
                            || ', date_revision := ' ||
                        COALESCE('''' || to_char(date_revision, 'YYYY-MM-DD') || '''', 'NULL')
                            || ', date_publication := ' || COALESCE(
                                '''' || to_char(date_publication, 'YYYY-MM-DD') || '''', 'NULL')
                            || ', west_bound_longitude := ' || COALESCE(
                                TRIM(to_char(west_bound_longitude, '99999999D999999')), 'NULL')
                            || ', east_bound_longitude := ' || COALESCE(
                                TRIM(to_char(east_bound_longitude, '99999999D999999')), 'NULL')
                            || ', north_bound_latitude := ' || COALESCE(
                                TRIM(to_char(north_bound_latitude, '99999999D999999')), 'NULL')
                            || ', south_bound_latitude := ' || COALESCE(
                                TRIM(to_char(south_bound_latitude, '99999999D999999')), 'NULL')
                            || ', provider_short_name := ' || COALESCE('''' || provider_short_name || '''', 'NULL')
                            || ', collection_type := ' || COALESCE('''' || collection_type || '''', 'NULL')
                            || ', keywords_distribution := ' || COALESCE('''' || keywords_distribution || '''', 'NULL')
                            || ', keywords_theme := ' || COALESCE('''' || keywords_theme || '''', 'NULL')
                            || ', keywords_societal_benefit_area := ' ||
                        COALESCE('''' || keywords_societal_benefit_area || '''', 'NULL')
                            || ', orbit_type := ' || COALESCE('''' || orbit_type || '''', 'NULL')
                            || ', satellite := ' || COALESCE('''' || satellite || '''', 'NULL')
                            || ', satellite_description := ' || COALESCE('''' || satellite_description || '''', 'NULL')
                            || ', instrument := ' || COALESCE('''' || instrument || '''', 'NULL')
                            || ', spatial_coverage := ' || COALESCE('''' || spatial_coverage || '''', 'NULL')
                            || ', thumbnails := ' || COALESCE('''' || thumbnails || '''', 'NULL')
                            || ', online_resources := ' || COALESCE(
                                    '''' || replace(replace(online_resources, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ', distribution := ' || COALESCE('''' || distribution || '''', 'NULL')
                            || ', channels := ' || COALESCE('''' || channels || '''', 'NULL')
                            || ', data_access := ' || COALESCE(
                                '''' || replace(replace(data_access, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ', available_format := ' || COALESCE('''' || available_format || '''', 'NULL')
                            || ', version := ' || COALESCE('''' || version || '''', 'NULL')
                            || ', typical_file_name := ' || COALESCE('''' || typical_file_name || '''', 'NULL')
                            || ', average_file_size := ' || COALESCE('''' || average_file_size || '''', 'NULL')
                            || ', frequency := ' || COALESCE('''' || frequency || '''', 'NULL')
                            || ', legal_constraints_access_constraint := ' ||
                        COALESCE('''' || legal_constraints_access_constraint || '''', 'NULL')
                            || ', legal_use_constraint := ' || COALESCE('''' || legal_use_constraint || '''', 'NULL')
                            || ', legal_constraints_data_policy := ' ||
                        COALESCE('''' || legal_constraints_data_policy || '''', 'NULL')
                            || ', entry_date := ' || COALESCE('''' || to_char(entry_date, 'YYYY-MM-DD') || '''', 'NULL')
                            || ', reference_file := ' || COALESCE('''' || reference_file || '''', 'NULL')
                            || ', datasource_descr_id := ' || COALESCE('''' || eumetcast_id || '''', 'NULL')
                            || ', full_copy := ' || _full_copy
                            || ' );' as inserts
                 FROM products.eumetcast_source
				 ORDER BY eumetcast_id;

    RETURN QUERY SELECT chr(10);
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
                            || ' );' as inserts
                 FROM products.datasource_description dd
                 WHERE dd.datasource_descr_id in (SELECT eumetcast_id FROM products.eumetcast_source)
                    OR dd.datasource_descr_id in
                       (SELECT internet_id FROM products.internet_source WHERE defined_by = 'JRC')
				 ORDER BY datasource_descr_id;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT products.update_insert_acquisition('
                            || ' productcode := ''' || productcode || ''''
                            || ', version := ''' || version || ''''
                            || ', data_source_id := ''' || data_source_id || ''''
                            || ', defined_by := ''' || defined_by || ''''
                            || ', type := ''' || type || ''''
                            || ', activated := ' || activated
                            || ', store_original_data := ' || store_original_data
                            || ', full_copy := TRUE '
		|| ' );'  as inserts
	FROM products.acquisition pads
	WHERE defined_by = 'JRC'
        AND (pads.productcode, pads.version) in
            (SELECT productcode, version FROM products.product WHERE defined_by = 'JRC')
	ORDER BY productcode, version, data_source_id;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT products.update_insert_sub_datasource_description('
                            || '  productcode := ' || COALESCE('''' || productcode || '''', 'NULL')
                            || ', subproductcode := ' || COALESCE('''' || subproductcode || '''', 'NULL')
                            || ', version := ' || COALESCE('''' || version || '''', 'NULL')
                            || ', datasource_descr_id := ' || COALESCE('''' || datasource_descr_id || '''', 'NULL')
                            || ', scale_factor := ' || COALESCE(TRIM(to_char(scale_factor, '99999999D999999')), 'NULL')
                            || ', scale_offset := ' || COALESCE(TRIM(to_char(scale_offset, '99999999D999999')), 'NULL')
                            || ', no_data := ' || COALESCE(TRIM(to_char(no_data, '99999999D999999')), 'NULL')
                            || ', data_type_id := ' || COALESCE('''' || data_type_id || '''', '''undefined''')
                            || ', mask_min := ' || COALESCE(TRIM(to_char(mask_min, '99999999D999999')), 'NULL')
                            || ', mask_max := ' || COALESCE(TRIM(to_char(mask_max, '99999999D999999')), 'NULL')
                            || ', re_process := ' || COALESCE('''' || re_process || '''', 'NULL')
                            || ', re_extract := ' || COALESCE('''' || re_extract || '''', 'NULL')
                            || ', scale_type := ' || COALESCE('''' || scale_type || '''', 'NULL')
                            || ', full_copy := ' || _full_copy
                            || ' );' as inserts
                 FROM products.sub_datasource_description sdd
                 WHERE (sdd.productcode, sdd.version, sdd.subproductcode) in
                       (SELECT productcode, version, subproductcode FROM products.sub_product WHERE defined_by = 'JRC')
                   AND (sdd.datasource_descr_id in (SELECT eumetcast_id FROM products.eumetcast_source)
                     OR sdd.datasource_descr_id in
                        (SELECT internet_id FROM products.internet_source WHERE defined_by = 'JRC'))
				 ORDER BY productcode, version, subproductcode, datasource_descr_id;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT products.update_insert_ingestion('
                            || '  productcode := ' || COALESCE('''' || productcode || '''', 'NULL')
                            || ', subproductcode := ' || COALESCE('''' || subproductcode || '''', 'NULL')
                            || ', version := ' || COALESCE('''' || version || '''', 'NULL')
                            || ', mapsetcode := ' || COALESCE('''' || mapsetcode || '''', 'NULL')
                            || ', defined_by := ' || COALESCE('''' || defined_by || '''', 'NULL')
                            || ', activated := ' || activated
                            || ', wait_for_all_files := ' || wait_for_all_files
                            || ', input_to_process_re := ' || COALESCE('''' || input_to_process_re || '''', 'NULL')
                            || ', enabled := ' || enabled
                            || ', full_copy := FALSE '
		|| ' );'  as inserts
	FROM products.ingestion i
	WHERE defined_by = 'JRC'
        AND (i.productcode, i.version, i.subproductcode) in
            (SELECT productcode, version, subproductcode FROM products.sub_product WHERE defined_by = 'JRC')
	ORDER BY productcode, version, subproductcode, mapsetcode;

    RETURN QUERY SELECT chr(10);
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
                            || ', full_copy := FALSE '
		|| ' );'  as inserts
	FROM products.processing
	WHERE defined_by = 'JRC'
	ORDER BY process_id;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT products.update_insert_process_product('
                            || ' process_id := ' || process_id
                            || ', productcode := ' || COALESCE('''' || productcode || '''', 'NULL')
                            || ', subproductcode := ' || COALESCE('''' || subproductcode || '''', 'NULL')
                            || ', version := ' || COALESCE('''' || version || '''', 'NULL')
                            || ', mapsetcode := ' || COALESCE('''' || mapsetcode || '''', 'NULL')
                            || ', type := ' || COALESCE('''' || type || '''', 'NULL')
                            || ', activated := ' || activated
                            || ', final := ' || final
                            || ', date_format := ' || COALESCE('''' || date_format || '''', '''undefined''')
                            || ', start_date:=   ' || COALESCE(TRIM(to_char(start_date, '999999999999')), 'NULL')
                            || ', end_date:= ' || COALESCE(TRIM(to_char(end_date, '999999999999')), 'NULL')
                            || ', full_copy := ' || _full_copy
                            || ' );' as inserts
                 FROM products.process_product pp
                 WHERE process_id IN (SELECT process_id FROM products.processing WHERE defined_by = 'JRC')
                   AND (pp.productcode, pp.version, pp.subproductcode) in
                       (SELECT productcode, version, subproductcode FROM products.sub_product WHERE defined_by = 'JRC')
				 ORDER BY process_id, productcode, version, subproductcode, mapsetcode;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT analysis.update_insert_i18n('
                            || ' label := ' || COALESCE('''' || label || '''', 'NULL')
                            || ', eng := ''' || COALESCE(replace(replace(eng, '"', ''''), '''', ''''''), 'NULL') || ''''
                            || ', fra := ''' || COALESCE(replace(replace(fra, '"', ''''), '''', ''''''), 'NULL') || ''''
                            || ', por := ''' || COALESCE(replace(replace(por, '"', ''''), '''', ''''''), 'NULL') || ''''
                            || ', lang1 := ''' || COALESCE(replace(replace(lang1, '"', ''''), '''', ''''''), 'NULL') ||
                        ''''
                            || ', lang2 := ''' || COALESCE(replace(replace(lang2, '"', ''''), '''', ''''''), 'NULL') ||
                        ''''
                            || ', lang3 := ''' || COALESCE(replace(replace(lang3, '"', ''''), '''', ''''''), 'NULL') ||
                        ''''
                            || ' );' as inserts
                 FROM analysis.i18n
				 ORDER BY label;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT analysis.update_insert_languages('
                            || ' langcode := ' || COALESCE('''' || langcode || '''', 'NULL')
                            || ', langdescription := ' || COALESCE('''' || langdescription || '''', 'NULL')
                            || ', active := ' || active
                            || ' );' as inserts
                 FROM analysis.languages
				 ORDER BY langcode;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT products.update_insert_spirits('
                            || '  productcode := ' || COALESCE('''' || productcode || '''', 'NULL')
                            || ', subproductcode := ' || COALESCE('''' || subproductcode || '''', 'NULL')
                            || ', version := ' || COALESCE('''' || version || '''', 'NULL')
                            || ', mapsetcode := ' || COALESCE('''' || mapsetcode || '''', 'NULL')
                            || ', prod_values := ' || COALESCE('''' || prod_values || '''', 'NULL')
                            || ', flags := ' || COALESCE('''' || flags || '''', 'NULL')
                            || ', data_ignore_value := ' ||
                        COALESCE(TRIM(to_char(data_ignore_value, '99999999')), 'NULL')
                            || ', days := ' || COALESCE(TRIM(to_char(days, '99999999')), 'NULL')
                            || ', start_date := ' || COALESCE(TRIM(to_char(start_date, '99999999')), 'NULL')
                            || ', end_date := ' || COALESCE(TRIM(to_char(end_date, '99999999')), 'NULL')
                            || ', sensor_type := ' || COALESCE('''' || sensor_type || '''', 'NULL')
                            || ', comment := ' || COALESCE('''' || comment || '''', 'NULL')
                            || ', sensor_filename_prefix := ' ||
                        COALESCE('''' || sensor_filename_prefix || '''', 'NULL')
                            || ', frequency_filename_prefix := ' ||
                        COALESCE('''' || frequency_filename_prefix || '''', 'NULL')
                            || ', product_anomaly_filename_prefix := ' ||
                        COALESCE('''' || product_anomaly_filename_prefix || '''', 'NULL')
                            || ', activated := ' || activated
                            || ', out_data_type := ' || COALESCE('''' || out_data_type || '''', 'NULL')
                            || ', out_scale_factor := ' || COALESCE(TRIM(to_char(out_scale_factor, '99999999D999999')),
                                                                    'NULL')
                            || ', out_offset := ' || COALESCE(TRIM(to_char(out_offset, '99999999D999999')), 'NULL')
                            || ' );' as inserts
                 FROM products.spirits
				 ORDER BY productcode, version, subproductcode, mapsetcode;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT analysis.update_insert_graph_yaxes('
                            || ' yaxe_id := ' || COALESCE('''' || yaxe_id || '''', 'NULL')
                            || ', title := ' || COALESCE('''' || title || '''', 'NULL')
                            || ', title_color := ' || COALESCE('''' || title_color || '''', 'NULL')
                            || ', title_font_size := ' || COALESCE(TRIM(to_char(title_font_size, '99999999')), 'NULL')
                            || ', min := ' || COALESCE(TRIM(to_char(min, '99999999D999999')), 'NULL')
                            || ', max := ' || COALESCE(TRIM(to_char(max, '99999999D999999')), 'NULL')
                            || ', unit := ' || COALESCE('''' || unit || '''', 'NULL')
                            || ', opposite := ' || opposite
                            || ', aggregation_type := ' || COALESCE('''' || aggregation_type || '''', 'NULL')
                            || ', aggregation_min := ' || COALESCE(TRIM(to_char(aggregation_min, '99999999D999999')),
                                                                   'NULL')
                            || ', aggregation_max := ' ||
                        COALESCE(TRIM(to_char(aggregation_max, '99999999D999999')), 'NULL')
                            || ' );' as inserts
                 FROM analysis.graph_yaxes
				 ORDER BY yaxe_id;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT analysis.update_insert_timeseries_drawproperties('
                            || ' productcode := ' || COALESCE('''' || productcode || '''', 'NULL')
                            || ', subproductcode := ' || COALESCE('''' || subproductcode || '''', 'NULL')
                            || ', version := ' || COALESCE('''' || version || '''', 'NULL')
                            || ', tsname_in_legend := ' || COALESCE('''' || tsname_in_legend || '''', 'NULL')
                            || ', charttype := ' || COALESCE('''' || charttype || '''', 'NULL')
                            || ', linestyle := ' || COALESCE('''' || linestyle || '''', 'NULL')
                            || ', linewidth := ' || COALESCE(TRIM(to_char(linewidth, '99999999')), 'NULL')
                            || ', color := ' || COALESCE('''' || color || '''', 'NULL')
                            || ', yaxe_id := ' || COALESCE('''' || yaxe_id || '''', 'NULL')
                            || ' );' as inserts
                 FROM analysis.timeseries_drawproperties
				 ORDER BY productcode, version, subproductcode;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT analysis.update_insert_graph_drawproperties('
                            || ' graph_type := ' || COALESCE('''' || graph_type || '''', 'NULL')
                            || ', graph_width := ' || graph_width
                            || ', graph_height := ' || graph_height
                            || ', graph_title := ' || COALESCE('''' || graph_title || '''', 'NULL')
                            || ', graph_title_font_size := ' || graph_title_font_size
                            || ', graph_title_font_color := ' ||
                        COALESCE('''' || graph_title_font_color || '''', 'NULL')
                            || ', graph_subtitle := ' || COALESCE('''' || graph_subtitle || '''', 'NULL')
                            || ', graph_subtitle_font_size := ' || graph_subtitle_font_size
                            || ', graph_subtitle_font_color := ' ||
                        COALESCE('''' || graph_subtitle_font_color || '''', 'NULL')
                            || ', legend_position := ' || COALESCE('''' || legend_position || '''', 'NULL')
                            || ', legend_font_size := ' || legend_font_size
                            || ', legend_font_color := ' || COALESCE('''' || legend_font_color || '''', 'NULL')
                            || ', xaxe_font_size := ' || xaxe_font_size
                            || ', xaxe_font_color := ' || COALESCE('''' || xaxe_font_color || '''', 'NULL')
                            || ' );' as inserts
                 FROM analysis.graph_drawproperties
				 ORDER BY graph_type;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'PERFORM analysis.update_insert_layers('
                            || ' layerid := ' || layerid
                            || ', layerlevel := ' || COALESCE('''' || layerlevel || '''', 'NULL')
                            || ', layername := ' || COALESCE('''' || layername || '''', 'NULL')
                            || ', description := ' || COALESCE(
                                '''' || replace(replace(description, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ', filename := ' || COALESCE('''' || filename || '''', 'NULL')
                            || ', layerorderidx := ' || layerorderidx
                            || ', layertype := ' || COALESCE('''' || layertype || '''', 'NULL')
                            || ', polygon_outlinecolor := ' || COALESCE('''' || polygon_outlinecolor || '''', 'NULL')
                            || ', polygon_outlinewidth := ' || polygon_outlinewidth
                            || ', polygon_fillcolor := ' || COALESCE('''' || polygon_fillcolor || '''', 'NULL')
                            || ', polygon_fillopacity := ' || polygon_fillopacity
                            || ', feature_display_column := ' ||
                        COALESCE('''' || feature_display_column || '''', 'NULL')
                            || ', feature_highlight_outlinecolor := ' ||
                        COALESCE('''' || feature_highlight_outlinecolor || '''', 'NULL')
                            || ', feature_highlight_outlinewidth := ' || feature_highlight_outlinewidth
                            || ', feature_highlight_fillcolor := ' ||
                        COALESCE('''' || feature_highlight_fillcolor || '''', 'NULL')
                            || ', feature_highlight_fillopacity := ' || feature_highlight_fillopacity
                            || ', feature_selected_outlinecolor := ' ||
                        COALESCE('''' || feature_selected_outlinecolor || '''', 'NULL')
                            || ', feature_selected_outlinewidth := ' || feature_selected_outlinewidth
                            || ', enabled := ' || enabled
                            || ', deletable := ' || deletable
                            || ', background_legend_image_filename := ' ||
                        COALESCE('''' || background_legend_image_filename || '''', 'NULL')
                            || ', projection := ' || COALESCE('''' || projection || '''', 'NULL')
                            || ', submenu := ' || COALESCE('''' || submenu || '''', 'NULL')
                            || ', menu := ' || COALESCE('''' || menu || '''', 'NULL')
                            || ', defined_by := ' || COALESCE('''' || defined_by || '''', 'NULL')
                            || ', open_in_mapview := ' || open_in_mapview
                            || ', provider := ' || COALESCE('''' || provider || '''', 'NULL')
                            || ', full_copy := ' || _full_copy
                            || ' );' as inserts
                 FROM analysis.layers
                 WHERE layerid < 100
                 ORDER BY layerid;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'PERFORM analysis.update_insert_logo('
                            || ' logo_id := ' || logo_id
                            || ', logo_filename := ' || COALESCE('''' || logo_filename || '''', 'NULL')
                            || ', logo_description := ' || COALESCE(
                                    '''' || replace(replace(logo_description, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ', active :=  ' || active
                            || ', deletable :=  ' || deletable
                            || ', defined_by := ' || COALESCE('''' || defined_by || '''', 'NULL')
                            || ', isdefault :=  ' || isdefault
                            || ', orderindex_defaults := ' ||
                        COALESCE(TRIM(to_char(orderindex_defaults, '99999999')), 'NULL')
                            || ' );' as inserts
                 FROM analysis.logos
                 WHERE logo_id < 100
                 ORDER BY logo_id;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'PERFORM analysis.update_insert_legend('
                            || ' legend_id := ' || legend_id
                            || ', legend_name := ' || COALESCE(
                                '''' || replace(replace(legend_name, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ', step_type := ' || COALESCE('''' || step_type || '''', 'NULL')
                            || ', min_value := ' || COALESCE(TRIM(to_char(min_value, '99999999D999999')), 'NULL')
                            || ', max_value := ' || COALESCE(TRIM(to_char(max_value, '99999999D999999')), 'NULL')
                            || ', min_real_value := ' || COALESCE('''' || min_real_value || '''', 'NULL')
                            || ', max_real_value := ''' || COALESCE(max_real_value, 'NULL') || ''''
                            || ', colorbar := ''' || COALESCE(colorbar, 'NULL') || ''''
                            || ', step := ' || COALESCE(TRIM(to_char(step, '99999999D999999')), 'NULL')
                            || ', step_range_from := ' || COALESCE(TRIM(to_char(step_range_from, '99999999D999999')),
                                                                   'NULL')
                            || ', step_range_to := ' ||
                        COALESCE(TRIM(to_char(step_range_to, '99999999D999999')), 'NULL')
                            || ', unit := ' || COALESCE('''' || unit || '''', 'NULL')
                            || ', defined_by := ' || COALESCE('''' || defined_by || '''', 'NULL')
                            || ' );' as inserts
                 FROM analysis.legend
                 WHERE legend_id < 400
                   AND defined_by = 'JRC'
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
                            || ' );' as inserts
                 FROM analysis.legend_step
                 ORDER BY legend_id;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT analysis.update_insert_product_legend('
                            || ' productcode := ' || COALESCE('''' || productcode || '''', 'NULL')
                            || ', subproductcode := ' || COALESCE('''' || subproductcode || '''', 'NULL')
                            || ', version := ' || COALESCE('''' || version || '''', 'NULL')
                            || ', legend_id := ' || legend_id
                            || ', default_legend := ' || default_legend
                            || ' );' as inserts
                 FROM analysis.product_legend pl
                 WHERE (pl.productcode, pl.version, pl.subproductcode) in
                       (SELECT productcode, version, subproductcode FROM products.sub_product WHERE defined_by = 'JRC')
				 ORDER BY productcode, version, subproductcode, legend_id;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

END;
$BODY$;

ALTER FUNCTION products.export_jrc_data(boolean)
    OWNER TO estation;



CREATE OR REPLACE FUNCTION products.export_all_data(
	full_copy boolean DEFAULT true)
    RETURNS SETOF text
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
DECLARE
	_full_copy 			ALIAS FOR  $1;
BEGIN

    RETURN QUERY SELECT 'SELECT products.update_insert_product_category('
                            || 'category_id := ''' || category_id || ''''
                            || ', order_index := ' || order_index
                            || ', descriptive_name := ' ||
                        COALESCE('''' || replace(replace(descriptive_name, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ' );' as inserts
                 FROM products.product_category
				 ORDER BY descriptive_name;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT products.update_insert_frequency('
                            || 'frequency_id := ''' || frequency_id || ''''
                            || ', time_unit := ''' || time_unit || ''''
                            || ', frequency := ' || frequency
                            || ', frequency_type := ' || COALESCE('''' || frequency_type || '''', 'NULL')
                            || ', description := ' ||
                        COALESCE('''' || replace(replace(description, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ' );' as inserts
                 FROM products.frequency;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT products.update_insert_date_format('
                            || 'date_format := ''' || date_format || ''''
                            || ', definition := ' || COALESCE('''' || definition || '''', 'NULL')
                            || ' );' as inserts
                 FROM products.date_format
				 ORDER BY date_format;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT products.update_insert_data_type('
                            || 'data_type_id := ''' || data_type_id || ''''
                            || ', description := ' ||
                        COALESCE('''' || replace(replace(description, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ' );' as inserts
                 FROM products.data_type
				 ORDER BY data_type_id;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT products.update_insert_preproc_type('
                            || 'preproc_type := ''' || preproc_type || ''''
                            || ', preproc_type_descr := ' || COALESCE('''' || preproc_type_descr || '''', 'NULL')
                            || ' );' as inserts
                 FROM products.preproc_type
				 ORDER BY preproc_type;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT products.update_insert_internet_type('
                            || 'internet_type_id := ''' || internet_type_id || ''''
                            || ', internet_type_name := ' || COALESCE('''' || internet_type_name || '''', 'NULL')
                            || ', internet_type_descr := ' || COALESCE('''' || internet_type_descr || '''', 'NULL')
                            || ' );' as inserts
                 FROM products.internet_type
				 ORDER BY internet_type_id;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT products.update_insert_projection('
                            || 'proj_code := ''' || proj_code || ''''
                            || ', descriptive_name := ' || COALESCE(
                                    '''' || replace(replace(descriptive_name, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ', description := ' || COALESCE(
                                '''' || replace(replace(description, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ', srs_wkt := ' || COALESCE('''' || srs_wkt || '''', 'NULL')
                            || ', full_copy := ' || _full_copy
                            || ' );' as inserts
                 FROM products.projection
				 ORDER BY proj_code;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT products.update_insert_resolution('
                            || 'resolutioncode := ''' || resolutioncode || ''''
                            || ', descriptive_name := ' || COALESCE(
                                    '''' || replace(replace(descriptive_name, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ', description := ' || COALESCE(
                                '''' || replace(replace(description, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ', pixel_shift_long := ' || pixel_shift_long
                            || ', pixel_shift_lat := ' || pixel_shift_lat
                            || ', full_copy := ' || _full_copy
                            || ' );' as inserts
                 FROM products.resolution
				 ORDER BY resolutioncode;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT products.update_insert_bbox('
                            || 'bboxcode := ''' || bboxcode || ''''
                            || ', descriptive_name := ' ||
                        COALESCE('''' || replace(replace(descriptive_name, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ', defined_by := ''' || defined_by || ''''
                            || ', upper_left_long := ' || upper_left_long
                            || ', upper_left_lat := ' || upper_left_lat
                            || ', lower_right_long := ' || lower_right_long
                            || ', lower_right_lat := ' || lower_right_lat
                            || ', predefined := ' || predefined
                            || ', full_copy := ' || _full_copy
                            || ' );' as inserts
                 FROM products.bbox
				 ORDER BY bboxcode;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT products.update_insert_mapset('
                            || 'mapsetcode := ''' || mapsetcode || ''''
                            || ', descriptive_name := ' ||
                        COALESCE('''' || replace(replace(descriptive_name, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ', description := ' ||
                        COALESCE('''' || replace(replace(description, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ', defined_by := ''' || defined_by || ''''
                            || ', proj_code := ''' || proj_code || ''''
                            || ', resolutioncode := ''' || resolutioncode || ''''
                            || ', bboxcode := ''' || bboxcode || ''''
                            || ', pixel_size_x := ' || pixel_size_x
                            || ', pixel_size_y:= ' || pixel_size_y
                            || ', footprint_image := ''' || COALESCE(footprint_image, 'NULL') || ''''
                            || ', center_of_pixel:= ' || center_of_pixel
                            || ', full_copy := ' || _full_copy
                            || ' );' as inserts
                 FROM products.mapset
				 ORDER BY mapsetcode;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT products.update_insert_thema('
                            || 'thema_id := ''' || thema_id || ''''
                            || ', description := ' ||
                        COALESCE('''' || replace(replace(description, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ', activated := ' || activated
                            || ' );' as inserts
                 FROM products.thema
				 ORDER BY thema_id;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT products.update_insert_product('
                            || '  productcode := ' || COALESCE('''' || productcode || '''', 'NULL')
                            || ', version := ' || COALESCE('''' || version || '''', 'NULL')
                            || ', defined_by := ' || COALESCE('''' || defined_by || '''', 'NULL')
                            || ', activated := ' || activated
                            || ', category_id := ' || COALESCE('''' || category_id || '''', 'NULL')
                            || ', descriptive_name := ' || COALESCE(
                                    '''' || replace(replace(descriptive_name, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ', description := ' || COALESCE(
                                '''' || replace(replace(description, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ', provider := ' || COALESCE('''' || provider || '''', 'NULL')
                            || ', masked := ' || masked
                            || ', acquisition_period := ' || COALESCE('''' || acquisition_period || '''', 'NULL')
                            || ', keyword := ' || COALESCE('''' || keyword || '''', 'NULL')
                            || ', spatial_repres := ' || COALESCE('''' || spatial_repres || '''', 'NULL')
                            || ', citation := ' || COALESCE('''' || citation || '''', 'NULL')
                            || ', access_constraints := ' || COALESCE('''' || access_constraints || '''', 'NULL')
                            || ', use_constraints := ' || COALESCE('''' || use_constraints || '''', 'NULL')
                            || ', full_copy := ' || _full_copy
		|| ' );'  as inserts
	FROM products.product
    ORDER BY productcode, version;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT products.update_insert_sub_product('
                            || '  productcode := ' || COALESCE('''' || productcode || '''', 'NULL')
                            || ', subproductcode := ' || COALESCE('''' || subproductcode || '''', 'NULL')
                            || ', version := ' || COALESCE('''' || version || '''', 'NULL')
                            || ', defined_by := ' || COALESCE('''' || defined_by || '''', 'NULL')
                            || ', product_type := ' || COALESCE('''' || product_type || '''', 'NULL')
                            || ', descriptive_name := ' || COALESCE(
                                    '''' || replace(replace(descriptive_name, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ', description := ' || COALESCE(
                                '''' || replace(replace(description, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ', frequency_id := ' || COALESCE('''' || frequency_id || '''', '''undefined''')
                            || ', date_format := ' || COALESCE('''' || date_format || '''', '''undefined''')
                            || ', scale_factor := ' || COALESCE(TRIM(to_char(scale_factor, '99999999D999999')), 'NULL')
                            || ', scale_offset := ' || COALESCE(TRIM(to_char(scale_offset, '99999999D999999')), 'NULL')
                            || ', nodata := ' || COALESCE(TRIM(to_char(nodata, '99999999')), 'NULL')
                            || ', mask_min := ' || COALESCE(TRIM(to_char(mask_min, '99999999D999999')), 'NULL')
                            || ', mask_max := ' || COALESCE(TRIM(to_char(mask_max, '99999999D999999')), 'NULL')
                            || ', unit := ' || COALESCE('''' || unit || '''', 'NULL')
                            || ', data_type_id := ' || COALESCE('''' || data_type_id || '''', '''undefined''')
                            || ', masked := ' || masked
                            || ', timeseries_role := ' || COALESCE('''' || timeseries_role || '''', 'NULL')
                            || ', display_index := ' || COALESCE(TRIM(to_char(display_index, '99999999')), 'NULL')
                            || ', update_frequency := ' || COALESCE('''' || update_frequency || '''', 'NULL')
                            || ', reference := ' || COALESCE('''' || reference || '''', 'NULL')
                            || ', keywords := ' || COALESCE('''' || keywords || '''', 'NULL')
                            || ', use_conditions := ' || COALESCE('''' || use_conditions || '''', 'NULL')
                            || ', quality_scope := ' || COALESCE('''' || quality_scope || '''', 'NULL')
                            || ', quality_title := ' || COALESCE('''' || quality_title || '''', 'NULL')
                            || ', quality_explanation := ' || COALESCE('''' || quality_explanation || '''', 'NULL')
                            || ', quality_statement := ' || COALESCE('''' || quality_statement || '''', 'NULL')
                            || ', spatial_repres := ' || COALESCE('''' || spatial_repres || '''', 'NULL')
                            || ', resource_url := ' || COALESCE('''' || resource_url || '''', 'NULL')
                            || ', full_copy := ' || _full_copy
		|| ' );'  as inserts
	FROM products.sub_product
    ORDER BY productcode, version, subproductcode;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT products.update_insert_thema_product('
                            || 'thema_id := ''' || thema_id || ''''
                            || ', productcode := ''' || productcode || ''''
                            || ', version := ''' || version || ''''
                            || ', mapsetcode := ''' || mapsetcode || ''''
                            || ', activated := ' || activated
                            || ' );' as inserts
                 FROM products.thema_product tp
                 ORDER BY thema_id;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    -- insert into products.datasource_description (datasource_descr_id) select internet_id from products.internet_source where internet_id not in (select datasource_descr_id from products.datasource_description)

    RETURN QUERY SELECT 'SELECT products.update_insert_internet_source('
                            || 'internet_id := ''' || internet_id || ''''
                            || ', defined_by := ''' || defined_by || ''''
                            || ', descriptive_name := ' ||
                        COALESCE('''' || replace(replace(descriptive_name, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ', description := ' ||
                        COALESCE('''' || replace(replace(description, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ', modified_by := ' || COALESCE('''' || modified_by || '''', 'NULL')
                            || ', update_datetime := ''' || COALESCE(update_datetime, now()) || ''''
                            || ', url := ' || COALESCE('''' || url || '''', 'NULL')
                            || ', user_name := ' || COALESCE('''' || user_name || '''', 'NULL')
                            || ', password := ' || COALESCE('''' || password || '''', 'NULL')
                            || ', type := ' || COALESCE('''' || type || '''', 'NULL')
                            || ', include_files_expression := ' ||
                        COALESCE('''' || include_files_expression || '''', 'NULL')
                            || ', files_filter_expression := ' ||
                        COALESCE('''' || files_filter_expression || '''', 'NULL')
                            || ', status := ' || status
                            || ', pull_frequency:= ' || pull_frequency
                            || ', datasource_descr_id := ' || COALESCE('''' || internet_id || '''', 'NULL')
                            || ', frequency_id := ' || COALESCE('''' || frequency_id || '''', '''undefined''')
                            || ', start_date:=   ' || COALESCE(TRIM(to_char(start_date, '999999999999')), 'NULL')
                            || ', end_date:= ' || COALESCE(TRIM(to_char(end_date, '999999999999')), 'NULL')
                            || ', https_params := ' || COALESCE('''' || https_params || '''', 'NULL')
                            || ', full_copy := ' || _full_copy
                            || ' );' as inserts
                 FROM products.internet_source
				 ORDER BY internet_id;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    -- insert into products.datasource_description (datasource_descr_id) select eumetcast_id from products.eumetcast_source where eumetcast_id not in (select datasource_descr_id from products.datasource_description)

    RETURN QUERY SELECT 'SELECT products.update_insert_eumetcast_source('
                            || '  eumetcast_id := ' || COALESCE('''' || eumetcast_id || '''', 'NULL')
                            || ', filter_expression_jrc := ' || COALESCE('''' || filter_expression_jrc || '''', 'NULL')
                            || ', collection_name := ' || COALESCE('''' || collection_name || '''', 'NULL')
                            || ', status := ' || status
                            || ', internal_identifier := ' || COALESCE('''' || internal_identifier || '''', 'NULL')
                            || ', collection_reference := ' || COALESCE('''' || collection_reference || '''', 'NULL')
                            || ', acronym := ' || COALESCE('''' || acronym || '''', 'NULL')
                            || ', description := ' || COALESCE(
                                '''' || replace(replace(description, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ', product_status := ' || COALESCE('''' || product_status || '''', 'NULL')
                            || ', date_creation := ' ||
                        COALESCE('''' || to_char(date_creation, 'YYYY-MM-DD') || '''', 'NULL')
                            || ', date_revision := ' ||
                        COALESCE('''' || to_char(date_revision, 'YYYY-MM-DD') || '''', 'NULL')
                            || ', date_publication := ' || COALESCE(
                                '''' || to_char(date_publication, 'YYYY-MM-DD') || '''', 'NULL')
                            || ', west_bound_longitude := ' || COALESCE(
                                TRIM(to_char(west_bound_longitude, '99999999D999999')), 'NULL')
                            || ', east_bound_longitude := ' || COALESCE(
                                TRIM(to_char(east_bound_longitude, '99999999D999999')), 'NULL')
                            || ', north_bound_latitude := ' || COALESCE(
                                TRIM(to_char(north_bound_latitude, '99999999D999999')), 'NULL')
                            || ', south_bound_latitude := ' || COALESCE(
                                TRIM(to_char(south_bound_latitude, '99999999D999999')), 'NULL')
                            || ', provider_short_name := ' || COALESCE('''' || provider_short_name || '''', 'NULL')
                            || ', collection_type := ' || COALESCE('''' || collection_type || '''', 'NULL')
                            || ', keywords_distribution := ' || COALESCE('''' || keywords_distribution || '''', 'NULL')
                            || ', keywords_theme := ' || COALESCE('''' || keywords_theme || '''', 'NULL')
                            || ', keywords_societal_benefit_area := ' ||
                        COALESCE('''' || keywords_societal_benefit_area || '''', 'NULL')
                            || ', orbit_type := ' || COALESCE('''' || orbit_type || '''', 'NULL')
                            || ', satellite := ' || COALESCE('''' || satellite || '''', 'NULL')
                            || ', satellite_description := ' || COALESCE('''' || satellite_description || '''', 'NULL')
                            || ', instrument := ' || COALESCE('''' || instrument || '''', 'NULL')
                            || ', spatial_coverage := ' || COALESCE('''' || spatial_coverage || '''', 'NULL')
                            || ', thumbnails := ' || COALESCE('''' || thumbnails || '''', 'NULL')
                            || ', online_resources := ' || COALESCE(
                                    '''' || replace(replace(online_resources, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ', distribution := ' || COALESCE('''' || distribution || '''', 'NULL')
                            || ', channels := ' || COALESCE('''' || channels || '''', 'NULL')
                            || ', data_access := ' || COALESCE(
                                '''' || replace(replace(data_access, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ', available_format := ' || COALESCE('''' || available_format || '''', 'NULL')
                            || ', version := ' || COALESCE('''' || version || '''', 'NULL')
                            || ', typical_file_name := ' || COALESCE('''' || typical_file_name || '''', 'NULL')
                            || ', average_file_size := ' || COALESCE('''' || average_file_size || '''', 'NULL')
                            || ', frequency := ' || COALESCE('''' || frequency || '''', 'NULL')
                            || ', legal_constraints_access_constraint := ' ||
                        COALESCE('''' || legal_constraints_access_constraint || '''', 'NULL')
                            || ', legal_use_constraint := ' || COALESCE('''' || legal_use_constraint || '''', 'NULL')
                            || ', legal_constraints_data_policy := ' ||
                        COALESCE('''' || legal_constraints_data_policy || '''', 'NULL')
                            || ', entry_date := ' || COALESCE('''' || to_char(entry_date, 'YYYY-MM-DD') || '''', 'NULL')
                            || ', reference_file := ' || COALESCE('''' || reference_file || '''', 'NULL')
                            || ', datasource_descr_id := ' || COALESCE('''' || eumetcast_id || '''', 'NULL')
                            || ', full_copy := ' || _full_copy
                            || ' );' as inserts
                 FROM products.eumetcast_source
				 ORDER BY eumetcast_id;

    RETURN QUERY SELECT chr(10);
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
                            || ' );' as inserts
                 FROM products.datasource_description dd
				 ORDER BY datasource_descr_id;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT products.update_insert_acquisition('
                            || ' productcode := ''' || productcode || ''''
                            || ', version := ''' || version || ''''
                            || ', data_source_id := ''' || data_source_id || ''''
                            || ', defined_by := ''' || defined_by || ''''
                            || ', type := ''' || type || ''''
                            || ', activated := ' || activated
                            || ', store_original_data := ' || store_original_data
                            || ', full_copy := ' || _full_copy
		|| ' );'  as inserts
	FROM products.acquisition pads
	ORDER BY productcode, version, data_source_id;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT products.update_insert_sub_datasource_description('
                            || '  productcode := ' || COALESCE('''' || productcode || '''', 'NULL')
                            || ', subproductcode := ' || COALESCE('''' || subproductcode || '''', 'NULL')
                            || ', version := ' || COALESCE('''' || version || '''', 'NULL')
                            || ', datasource_descr_id := ' || COALESCE('''' || datasource_descr_id || '''', 'NULL')
                            || ', scale_factor := ' || COALESCE(TRIM(to_char(scale_factor, '99999999D999999')), 'NULL')
                            || ', scale_offset := ' || COALESCE(TRIM(to_char(scale_offset, '99999999D999999')), 'NULL')
                            || ', no_data := ' || COALESCE(TRIM(to_char(no_data, '99999999D999999')), 'NULL')
                            || ', data_type_id := ' || COALESCE('''' || data_type_id || '''', '''undefined''')
                            || ', mask_min := ' || COALESCE(TRIM(to_char(mask_min, '99999999D999999')), 'NULL')
                            || ', mask_max := ' || COALESCE(TRIM(to_char(mask_max, '99999999D999999')), 'NULL')
                            || ', re_process := ' || COALESCE('''' || re_process || '''', 'NULL')
                            || ', re_extract := ' || COALESCE('''' || re_extract || '''', 'NULL')
                            || ', scale_type := ' || COALESCE('''' || scale_type || '''', 'NULL')
                            || ', full_copy := ' || _full_copy
                            || ' );' as inserts
                 FROM products.sub_datasource_description sdd
				 ORDER BY productcode, version, subproductcode, datasource_descr_id;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT products.update_insert_ingestion('
                            || '  productcode := ' || COALESCE('''' || productcode || '''', 'NULL')
                            || ', subproductcode := ' || COALESCE('''' || subproductcode || '''', 'NULL')
                            || ', version := ' || COALESCE('''' || version || '''', 'NULL')
                            || ', mapsetcode := ' || COALESCE('''' || mapsetcode || '''', 'NULL')
                            || ', defined_by := ' || COALESCE('''' || defined_by || '''', 'NULL')
                            || ', activated := ' || activated
                            || ', wait_for_all_files := ' || wait_for_all_files
                            || ', input_to_process_re := ' || COALESCE('''' || input_to_process_re || '''', 'NULL')
                            || ', enabled := ' || enabled
                            || ', full_copy := ' || _full_copy
		|| ' );'  as inserts
	FROM products.ingestion i
	ORDER BY productcode, version, subproductcode, mapsetcode;

    RETURN QUERY SELECT chr(10);
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
	ORDER BY process_id;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT products.update_insert_process_product('
                            || ' process_id := ' || process_id
                            || ', productcode := ' || COALESCE('''' || productcode || '''', 'NULL')
                            || ', subproductcode := ' || COALESCE('''' || subproductcode || '''', 'NULL')
                            || ', version := ' || COALESCE('''' || version || '''', 'NULL')
                            || ', mapsetcode := ' || COALESCE('''' || mapsetcode || '''', 'NULL')
                            || ', type := ' || COALESCE('''' || type || '''', 'NULL')
                            || ', activated := ' || activated
                            || ', final := ' || final
                            || ', date_format := ' || COALESCE('''' || date_format || '''', '''undefined''')
                            || ', start_date:=   ' || COALESCE(TRIM(to_char(start_date, '999999999999')), 'NULL')
                            || ', end_date:= ' || COALESCE(TRIM(to_char(end_date, '999999999999')), 'NULL')
                            || ', full_copy := ' || _full_copy
                            || ' );' as inserts
                 FROM products.process_product pp
				 ORDER BY process_id, productcode, version, subproductcode, mapsetcode;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT analysis.update_insert_i18n('
                            || ' label := ' || COALESCE('''' || label || '''', 'NULL')
                            || ', eng := ''' || COALESCE(replace(replace(eng, '"', ''''), '''', ''''''), 'NULL') || ''''
                            || ', fra := ''' || COALESCE(replace(replace(fra, '"', ''''), '''', ''''''), 'NULL') || ''''
                            || ', por := ''' || COALESCE(replace(replace(por, '"', ''''), '''', ''''''), 'NULL') || ''''
                            || ', lang1 := ''' || COALESCE(replace(replace(lang1, '"', ''''), '''', ''''''), 'NULL') ||
                        ''''
                            || ', lang2 := ''' || COALESCE(replace(replace(lang2, '"', ''''), '''', ''''''), 'NULL') ||
                        ''''
                            || ', lang3 := ''' || COALESCE(replace(replace(lang3, '"', ''''), '''', ''''''), 'NULL') ||
                        ''''
                            || ' );' as inserts
                 FROM analysis.i18n
				 ORDER BY label;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT analysis.update_insert_languages('
                            || ' langcode := ' || COALESCE('''' || langcode || '''', 'NULL')
                            || ', langdescription := ' || COALESCE('''' || langdescription || '''', 'NULL')
                            || ', active := ' || active
                            || ' );' as inserts
                 FROM analysis.languages
				 ORDER BY langcode;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT products.update_insert_spirits('
                            || '  productcode := ' || COALESCE('''' || productcode || '''', 'NULL')
                            || ', subproductcode := ' || COALESCE('''' || subproductcode || '''', 'NULL')
                            || ', version := ' || COALESCE('''' || version || '''', 'NULL')
                            || ', mapsetcode := ' || COALESCE('''' || mapsetcode || '''', 'NULL')
                            || ', prod_values := ' || COALESCE('''' || prod_values || '''', 'NULL')
                            || ', flags := ' || COALESCE('''' || flags || '''', 'NULL')
                            || ', data_ignore_value := ' ||
                        COALESCE(TRIM(to_char(data_ignore_value, '99999999')), 'NULL')
                            || ', days := ' || COALESCE(TRIM(to_char(days, '99999999')), 'NULL')
                            || ', start_date := ' || COALESCE(TRIM(to_char(start_date, '99999999')), 'NULL')
                            || ', end_date := ' || COALESCE(TRIM(to_char(end_date, '99999999')), 'NULL')
                            || ', sensor_type := ' || COALESCE('''' || sensor_type || '''', 'NULL')
                            || ', comment := ' || COALESCE('''' || comment || '''', 'NULL')
                            || ', sensor_filename_prefix := ' ||
                        COALESCE('''' || sensor_filename_prefix || '''', 'NULL')
                            || ', frequency_filename_prefix := ' ||
                        COALESCE('''' || frequency_filename_prefix || '''', 'NULL')
                            || ', product_anomaly_filename_prefix := ' ||
                        COALESCE('''' || product_anomaly_filename_prefix || '''', 'NULL')
                            || ', activated := ' || activated
                            || ', out_data_type := ' || COALESCE('''' || out_data_type || '''', 'NULL')
                            || ', out_scale_factor := ' || COALESCE(TRIM(to_char(out_scale_factor, '99999999D999999')),
                                                                    'NULL')
                            || ', out_offset := ' || COALESCE(TRIM(to_char(out_offset, '99999999D999999')), 'NULL')
                            || ' );' as inserts
                 FROM products.spirits
				 ORDER BY productcode, version, subproductcode, mapsetcode;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT analysis.update_insert_graph_yaxes('
                            || ' yaxe_id := ' || COALESCE('''' || yaxe_id || '''', 'NULL')
                            || ', title := ' || COALESCE('''' || title || '''', 'NULL')
                            || ', title_color := ' || COALESCE('''' || title_color || '''', 'NULL')
                            || ', title_font_size := ' || COALESCE(TRIM(to_char(title_font_size, '99999999')), 'NULL')
                            || ', min := ' || COALESCE(TRIM(to_char(min, '99999999D999999')), 'NULL')
                            || ', max := ' || COALESCE(TRIM(to_char(max, '99999999D999999')), 'NULL')
                            || ', unit := ' || COALESCE('''' || unit || '''', 'NULL')
                            || ', opposite := ' || opposite
                            || ', aggregation_type := ' || COALESCE('''' || aggregation_type || '''', 'NULL')
                            || ', aggregation_min := ' || COALESCE(TRIM(to_char(aggregation_min, '99999999D999999')),
                                                                   'NULL')
                            || ', aggregation_max := ' ||
                        COALESCE(TRIM(to_char(aggregation_max, '99999999D999999')), 'NULL')
                            || ' );' as inserts
                 FROM analysis.graph_yaxes
				 ORDER BY yaxe_id;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT analysis.update_insert_timeseries_drawproperties('
                            || ' productcode := ' || COALESCE('''' || productcode || '''', 'NULL')
                            || ', subproductcode := ' || COALESCE('''' || subproductcode || '''', 'NULL')
                            || ', version := ' || COALESCE('''' || version || '''', 'NULL')
                            || ', tsname_in_legend := ' || COALESCE('''' || tsname_in_legend || '''', 'NULL')
                            || ', charttype := ' || COALESCE('''' || charttype || '''', 'NULL')
                            || ', linestyle := ' || COALESCE('''' || linestyle || '''', 'NULL')
                            || ', linewidth := ' || COALESCE(TRIM(to_char(linewidth, '99999999')), 'NULL')
                            || ', color := ' || COALESCE('''' || color || '''', 'NULL')
                            || ', yaxe_id := ' || COALESCE('''' || yaxe_id || '''', 'NULL')
                            || ' );' as inserts
                 FROM analysis.timeseries_drawproperties
				 ORDER BY productcode, version, subproductcode;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT analysis.update_insert_graph_drawproperties('
                            || ' graph_type := ' || COALESCE('''' || graph_type || '''', 'NULL')
                            || ', graph_width := ' || graph_width
                            || ', graph_height := ' || graph_height
                            || ', graph_title := ' || COALESCE('''' || graph_title || '''', 'NULL')
                            || ', graph_title_font_size := ' || graph_title_font_size
                            || ', graph_title_font_color := ' ||
                        COALESCE('''' || graph_title_font_color || '''', 'NULL')
                            || ', graph_subtitle := ' || COALESCE('''' || graph_subtitle || '''', 'NULL')
                            || ', graph_subtitle_font_size := ' || graph_subtitle_font_size
                            || ', graph_subtitle_font_color := ' ||
                        COALESCE('''' || graph_subtitle_font_color || '''', 'NULL')
                            || ', legend_position := ' || COALESCE('''' || legend_position || '''', 'NULL')
                            || ', legend_font_size := ' || legend_font_size
                            || ', legend_font_color := ' || COALESCE('''' || legend_font_color || '''', 'NULL')
                            || ', xaxe_font_size := ' || xaxe_font_size
                            || ', xaxe_font_color := ' || COALESCE('''' || xaxe_font_color || '''', 'NULL')
                            || ' );' as inserts
                 FROM analysis.graph_drawproperties
				 ORDER BY graph_type;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'PERFORM analysis.update_insert_layers('
                            || ' layerid := ' || layerid
                            || ', layerlevel := ' || COALESCE('''' || layerlevel || '''', 'NULL')
                            || ', layername := ' || COALESCE('''' || layername || '''', 'NULL')
                            || ', description := ' || COALESCE(
                                '''' || replace(replace(description, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ', filename := ' || COALESCE('''' || filename || '''', 'NULL')
                            || ', layerorderidx := ' || layerorderidx
                            || ', layertype := ' || COALESCE('''' || layertype || '''', 'NULL')
                            || ', polygon_outlinecolor := ' || COALESCE('''' || polygon_outlinecolor || '''', 'NULL')
                            || ', polygon_outlinewidth := ' || polygon_outlinewidth
                            || ', polygon_fillcolor := ' || COALESCE('''' || polygon_fillcolor || '''', 'NULL')
                            || ', polygon_fillopacity := ' || polygon_fillopacity
                            || ', feature_display_column := ' ||
                        COALESCE('''' || feature_display_column || '''', 'NULL')
                            || ', feature_highlight_outlinecolor := ' ||
                        COALESCE('''' || feature_highlight_outlinecolor || '''', 'NULL')
                            || ', feature_highlight_outlinewidth := ' || feature_highlight_outlinewidth
                            || ', feature_highlight_fillcolor := ' ||
                        COALESCE('''' || feature_highlight_fillcolor || '''', 'NULL')
                            || ', feature_highlight_fillopacity := ' || feature_highlight_fillopacity
                            || ', feature_selected_outlinecolor := ' ||
                        COALESCE('''' || feature_selected_outlinecolor || '''', 'NULL')
                            || ', feature_selected_outlinewidth := ' || feature_selected_outlinewidth
                            || ', enabled := ' || enabled
                            || ', deletable := ' || deletable
                            || ', background_legend_image_filename := ' ||
                        COALESCE('''' || background_legend_image_filename || '''', 'NULL')
                            || ', projection := ' || COALESCE('''' || projection || '''', 'NULL')
                            || ', submenu := ' || COALESCE('''' || submenu || '''', 'NULL')
                            || ', menu := ' || COALESCE('''' || menu || '''', 'NULL')
                            || ', defined_by := ' || COALESCE('''' || defined_by || '''', 'NULL')
                            || ', open_in_mapview := ' || open_in_mapview
                            || ', provider := ' || COALESCE('''' || provider || '''', 'NULL')
                            || ', full_copy := ' || _full_copy
                            || ' );' as inserts
                 FROM analysis.layers
                 ORDER BY layerid;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'PERFORM analysis.update_insert_logo('
                            || ' logo_id := ' || logo_id
                            || ', logo_filename := ' || COALESCE('''' || logo_filename || '''', 'NULL')
                            || ', logo_description := ' || COALESCE(
                                    '''' || replace(replace(logo_description, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ', active :=  ' || active
                            || ', deletable :=  ' || deletable
                            || ', defined_by := ' || COALESCE('''' || defined_by || '''', 'NULL')
                            || ', isdefault :=  ' || isdefault
                            || ', orderindex_defaults := ' ||
                        COALESCE(TRIM(to_char(orderindex_defaults, '99999999')), 'NULL')
                            || ' );' as inserts
                 FROM analysis.logos
                 ORDER BY logo_id;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'PERFORM analysis.update_insert_legend('
                            || ' legend_id := ' || legend_id
                            || ', legend_name := ' || COALESCE(
                                '''' || replace(replace(legend_name, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ', step_type := ' || COALESCE('''' || step_type || '''', 'NULL')
                            || ', min_value := ' || COALESCE(TRIM(to_char(min_value, '99999999D999999')), 'NULL')
                            || ', max_value := ' || COALESCE(TRIM(to_char(max_value, '99999999D999999')), 'NULL')
                            || ', min_real_value := ' || COALESCE('''' || min_real_value || '''', 'NULL')
                            || ', max_real_value := ''' || COALESCE(max_real_value, 'NULL') || ''''
                            || ', colorbar := ''' || COALESCE(colorbar, 'NULL') || ''''
                            || ', step := ' || COALESCE(TRIM(to_char(step, '99999999D999999')), 'NULL')
                            || ', step_range_from := ' || COALESCE(TRIM(to_char(step_range_from, '99999999D999999')),
                                                                   'NULL')
                            || ', step_range_to := ' ||
                        COALESCE(TRIM(to_char(step_range_to, '99999999D999999')), 'NULL')
                            || ', unit := ' || COALESCE('''' || unit || '''', 'NULL')
                            || ', defined_by := ' || COALESCE('''' || defined_by || '''', 'NULL')
                            || ' );' as inserts
                 FROM analysis.legend
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
                            || ' );' as inserts
                 FROM analysis.legend_step
                 ORDER BY legend_id;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

    RETURN QUERY SELECT 'SELECT analysis.update_insert_product_legend('
                            || ' productcode := ' || COALESCE('''' || productcode || '''', 'NULL')
                            || ', subproductcode := ' || COALESCE('''' || subproductcode || '''', 'NULL')
                            || ', version := ' || COALESCE('''' || version || '''', 'NULL')
                            || ', legend_id := ' || legend_id
                            || ', default_legend := ' || default_legend
                            || ' );' as inserts
                 FROM analysis.product_legend pl
				 ORDER BY productcode, version, subproductcode, legend_id;

    RETURN QUERY SELECT chr(10);
    RETURN QUERY SELECT chr(10);

END;
$BODY$;

ALTER FUNCTION products.export_all_data(boolean)
    OWNER TO estation;



-- FUNCTION: products.export_product_data(character varying, character varying, boolean)

-- DROP FUNCTION products.export_product_data(character varying, character varying, boolean);

CREATE OR REPLACE FUNCTION products.export_product_data(
	productcode character varying DEFAULT NULL::character varying,
	version character varying DEFAULT NULL::character varying,
	full_copy boolean DEFAULT false)
    RETURNS TABLE(inserts text)
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
DECLARE
    _productcode ALIAS FOR $1;
    _version ALIAS FOR $2;
    _full_copy ALIAS FOR $3;
    allrecords record;
BEGIN

    for allrecords in (
        SELECT 'SELECT products.update_insert_product('
                            || '  productcode := ' || COALESCE('''' || p.productcode || '''', 'NULL')
                            || ', version := ' || COALESCE('''' || p.version || '''', 'NULL')
                            || ', defined_by := ' || COALESCE('''' || p.defined_by || '''', 'NULL')
                            || ', activated := ' || p.activated
                            || ', category_id := ' || COALESCE('''' || p.category_id || '''', 'NULL')
                            || ', descriptive_name := ' || COALESCE(
                                    '''' || replace(replace(p.descriptive_name, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ', description := ' || COALESCE(
                                '''' || replace(replace(p.description, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ', provider := ' || COALESCE('''' || p.provider || '''', 'NULL')
                            || ', masked := ' || p.masked
                            || ', acquisition_period := ' || COALESCE('''' || p.acquisition_period || '''', 'NULL')
                            || ', keyword := ' || COALESCE('''' || p.keyword || '''', 'NULL')
                            || ', spatial_repres := ' || COALESCE('''' || p.spatial_repres || '''', 'NULL')
                            || ', citation := ' || COALESCE('''' || p.citation || '''', 'NULL')
                            || ', access_constraints := ' || COALESCE('''' || p.access_constraints || '''', 'NULL')
                            || ', use_constraints := ' || COALESCE('''' || p.use_constraints || '''', 'NULL')
                            || ', full_copy := ' || _full_copy
            || ' );'  as inserts
        FROM products.product p
        WHERE p.productcode = _productcode
          AND p.version = _version
    )
        loop
            inserts := allrecords.inserts;
            return next;
        end loop;

    for allrecords in (
        SELECT 'SELECT products.update_insert_sub_product('
                            || '  productcode := ' || COALESCE('''' || sp.productcode || '''', 'NULL')
                            || ', subproductcode := ' || COALESCE('''' || sp.subproductcode || '''', 'NULL')
                            || ', version := ' || COALESCE('''' || sp.version || '''', 'NULL')
                            || ', defined_by := ' || COALESCE('''' || sp.defined_by || '''', 'NULL')
                            || ', product_type := ' || COALESCE('''' || sp.product_type || '''', 'NULL')
                            || ', descriptive_name := ' || COALESCE(
                                    '''' || replace(replace(sp.descriptive_name, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ', description := ' || COALESCE(
                                '''' || replace(replace(sp.description, '"', ''''), '''', '''''') || '''', 'NULL')
                            || ', frequency_id := ' || COALESCE('''' || sp.frequency_id || '''', '''undefined''')
                            || ', date_format := ' || COALESCE('''' || sp.date_format || '''', '''undefined''')
                            || ', scale_factor := ' || COALESCE(TRIM(to_char(sp.scale_factor, '99999999D999999')), 'NULL')
                            || ', scale_offset := ' || COALESCE(TRIM(to_char(sp.scale_offset, '99999999D999999')), 'NULL')
                            || ', nodata := ' || COALESCE(TRIM(to_char(sp.nodata, '99999999')), 'NULL')
                            || ', mask_min := ' || COALESCE(TRIM(to_char(sp.mask_min, '99999999D999999')), 'NULL')
                            || ', mask_max := ' || COALESCE(TRIM(to_char(sp.mask_max, '99999999D999999')), 'NULL')
                            || ', unit := ' || COALESCE('''' || sp.unit || '''', 'NULL')
                            || ', data_type_id := ' || COALESCE('''' || sp.data_type_id || '''', '''undefined''')
                            || ', masked := ' || sp.masked
                            || ', timeseries_role := ' || COALESCE('''' || sp.timeseries_role || '''', 'NULL')
                            || ', display_index := ' || COALESCE(TRIM(to_char(sp.display_index, '99999999')), 'NULL')
                            || ', update_frequency := ' || COALESCE('''' || sp.update_frequency || '''', 'NULL')
                            || ', reference := ' || COALESCE('''' || sp.reference || '''', 'NULL')
                            || ', keywords := ' || COALESCE('''' || sp.keywords || '''', 'NULL')
                            || ', use_conditions := ' || COALESCE('''' || sp.use_conditions || '''', 'NULL')
                            || ', quality_scope := ' || COALESCE('''' || sp.quality_scope || '''', 'NULL')
                            || ', quality_title := ' || COALESCE('''' || sp.quality_title || '''', 'NULL')
                            || ', quality_explanation := ' || COALESCE('''' || sp.quality_explanation || '''', 'NULL')
                            || ', quality_statement := ' || COALESCE('''' || sp.quality_statement || '''', 'NULL')
                            || ', spatial_repres := ' || COALESCE('''' || sp.spatial_repres || '''', 'NULL')
                            || ', resource_url := ' || COALESCE('''' || sp.resource_url || '''', 'NULL')
                            || ', full_copy := ' || _full_copy
            || ' );'  as inserts
        FROM products.sub_product sp
        WHERE sp.productcode = _productcode
          AND sp.version = _version
    )
        loop
            inserts := allrecords.inserts;
            return next;
        end loop;

    for allrecords in (
        SELECT 'SELECT products.update_insert_internet_source('
                   || 'internet_id := ''' || internet_id || ''''
                   || ', defined_by := ''' || defined_by || ''''
                   || ', descriptive_name := ' || COALESCE(
                           '''' || replace(replace(descriptive_name, '"', ''''), '''', '''''') || '''', 'NULL')
                   || ', description := ' ||
               COALESCE('''' || replace(replace(description, '"', ''''), '''', '''''') || '''', 'NULL')
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
                   || ' );' as inserts
        FROM products.internet_source
        WHERE internet_id IN (SELECT pads.data_source_id
                              FROM products.acquisition pads
                              WHERE pads.productcode = _productcode
                                AND pads.version = _version)
    )
        loop
            inserts := allrecords.inserts;
            return next;
        end loop;

    for allrecords in (
        SELECT 'SELECT products.update_insert_eumetcast_source('
                   || '  eumetcast_id := ' || COALESCE('''' || es.eumetcast_id || '''', 'NULL')
                   || ', filter_expression_jrc := ' || COALESCE('''' || es.filter_expression_jrc || '''', 'NULL')
                   || ', collection_name := ' || COALESCE('''' || es.collection_name || '''', 'NULL')
                   || ', status := ' || status
                   || ', internal_identifier := ' || COALESCE('''' || es.internal_identifier || '''', 'NULL')
                   || ', collection_reference := ' || COALESCE('''' || es.collection_reference || '''', 'NULL')
                   || ', acronym := ' || COALESCE('''' || es.acronym || '''', 'NULL')
                   || ', description := ' || COALESCE(
                           '''' || replace(replace(es.description, '"', ''''), '''', '''''') || '''', 'NULL')
                   || ', product_status := ' || COALESCE('''' || es.product_status || '''', 'NULL')
                   || ', date_creation := ' || COALESCE('''' || to_char(es.date_creation, 'YYYY-MM-DD') || '''', 'NULL')
                   || ', date_revision := ' || COALESCE('''' || to_char(es.date_revision, 'YYYY-MM-DD') || '''', 'NULL')
                   || ', date_publication := ' || COALESCE('''' || to_char(es.date_publication, 'YYYY-MM-DD') || '''',
                                                           'NULL')
                   || ', west_bound_longitude := ' || COALESCE(
                       TRIM(to_char(es.west_bound_longitude, '99999999D999999')), 'NULL')
                   || ', east_bound_longitude := ' || COALESCE(
                       TRIM(to_char(es.east_bound_longitude, '99999999D999999')), 'NULL')
                   || ', north_bound_latitude := ' || COALESCE(
                       TRIM(to_char(es.north_bound_latitude, '99999999D999999')), 'NULL')
                   || ', south_bound_latitude := ' || COALESCE(
                       TRIM(to_char(es.south_bound_latitude, '99999999D999999')), 'NULL')
                   || ', provider_short_name := ' || COALESCE('''' || es.provider_short_name || '''', 'NULL')
                   || ', collection_type := ' || COALESCE('''' || es.collection_type || '''', 'NULL')
                   || ', keywords_distribution := ' || COALESCE('''' || es.keywords_distribution || '''', 'NULL')
                   || ', keywords_theme := ' || COALESCE('''' || es.keywords_theme || '''', 'NULL')
                   || ', keywords_societal_benefit_area := ' ||
               COALESCE('''' || es.keywords_societal_benefit_area || '''', 'NULL')
                   || ', orbit_type := ' || COALESCE('''' || es.orbit_type || '''', 'NULL')
                   || ', satellite := ' || COALESCE('''' || es.satellite || '''', 'NULL')
                   || ', satellite_description := ' || COALESCE('''' || es.satellite_description || '''', 'NULL')
                   || ', instrument := ' || COALESCE('''' || es.instrument || '''', 'NULL')
                   || ', spatial_coverage := ' || COALESCE('''' || es.spatial_coverage || '''', 'NULL')
                   || ', thumbnails := ' || COALESCE('''' || es.thumbnails || '''', 'NULL')
                   || ', online_resources := ' || COALESCE(
                               '''' || replace(replace(es.online_resources, '"', ''''), '''', '''''') || '''', 'NULL')
                   || ', distribution := ' || COALESCE('''' || es.distribution || '''', 'NULL')
                   || ', channels := ' || COALESCE('''' || es.channels || '''', 'NULL')
                   || ', data_access := ' || COALESCE(
                           '''' || replace(replace(es.data_access, '"', ''''), '''', '''''') || '''', 'NULL')
                   || ', available_format := ' || COALESCE('''' || es.available_format || '''', 'NULL')
                   || ', version := ' || COALESCE('''' || es.version || '''', 'NULL')
                   || ', typical_file_name := ' || COALESCE('''' || es.typical_file_name || '''', 'NULL')
                   || ', average_file_size := ' || COALESCE('''' || es.average_file_size || '''', 'NULL')
                   || ', frequency := ' || COALESCE('''' || es.frequency || '''', 'NULL')
                   || ', legal_constraints_access_constraint := ' || COALESCE(
                       '''' || es.legal_constraints_access_constraint || '''', 'NULL')
                   || ', legal_use_constraint := ' || COALESCE('''' || es.legal_use_constraint || '''', 'NULL')
                   || ', legal_constraints_data_policy := ' ||
               COALESCE('''' || es.legal_constraints_data_policy || '''', 'NULL')
                   || ', entry_date := ' || COALESCE('''' || to_char(es.entry_date, 'YYYY-MM-DD') || '''', 'NULL')
                   || ', reference_file := ' || COALESCE('''' || es.reference_file || '''', 'NULL')
                   || ', datasource_descr_id := ' || COALESCE('''' || es.eumetcast_id || '''', 'NULL')
                   || ', full_copy := ' || _full_copy
                   || ' );' as inserts
        FROM products.eumetcast_source es
        WHERE eumetcast_id IN (SELECT pads.data_source_id
                               FROM products.acquisition pads
                               WHERE pads.productcode = _productcode
                                 AND pads.version = _version)
    )
        loop
            inserts := allrecords.inserts;
            return next;
        end loop;

    for allrecords in (
        SELECT 'SELECT products.update_insert_projection('
                   || 'proj_code := ''' || proj_code || ''''
                   || ', descriptive_name := ' || COALESCE(
                           '''' || replace(replace(descriptive_name, '"', ''''), '''', '''''') || '''', 'NULL')
                   || ', description := ' || COALESCE(
                       '''' || replace(replace(description, '"', ''''), '''', '''''') || '''', 'NULL')
                   || ', srs_wkt := ' || COALESCE('''' || srs_wkt || '''', 'NULL')
                   || ', full_copy := ' || 'FALSE'
                   || ' );' as inserts
        FROM products.projection
    )
        loop
            inserts := allrecords.inserts;
            return next;
        end loop;

    for allrecords in (
        SELECT 'SELECT products.update_insert_resolution('
                   || 'resolutioncode := ''' || resolutioncode || ''''
                   || ', descriptive_name := ' || COALESCE(
                           '''' || replace(replace(descriptive_name, '"', ''''), '''', '''''') || '''', 'NULL')
                   || ', description := ' || COALESCE(
                       '''' || replace(replace(description, '"', ''''), '''', '''''') || '''', 'NULL')
                   || ', pixel_shift_long := ' || pixel_shift_long
                   || ', pixel_shift_lat := ' || pixel_shift_lat
                   || ', full_copy := ' || 'FALSE'
                   || ' );' as inserts
        FROM products.resolution
    )
        loop
            inserts := allrecords.inserts;
            return next;
        end loop;

    for allrecords in (
        SELECT 'SELECT products.update_insert_bbox('
                   || 'bboxcode := ''' || bboxcode || ''''
                   || ', descriptive_name := ' ||
               COALESCE('''' || replace(replace(descriptive_name, '"', ''''), '''', '''''') || '''', 'NULL')
                   || ', defined_by := ''' || defined_by || ''''
                   || ', upper_left_long := ' || upper_left_long
                   || ', upper_left_lat := ' || upper_left_lat
                   || ', lower_right_long := ' || lower_right_long
                   || ', lower_right_lat := ' || lower_right_lat
                   || ', predefined := ' || predefined
                   || ', full_copy := ' || 'FALSE'
                   || ' );' as inserts
        FROM products.bbox
    )
        loop
            inserts := allrecords.inserts;
            return next;
        end loop;

    for allrecords in (
        SELECT 'SELECT products.update_insert_mapset('
                   || 'mapsetcode := ''' || mapsetcode || ''''
                   || ', descriptive_name := ' ||
               COALESCE('''' || replace(replace(descriptive_name, '"', ''''), '''', '''''') || '''', 'NULL')
                   || ', description := ' ||
               COALESCE('''' || replace(replace(description, '"', ''''), '''', '''''') || '''', 'NULL')
                   || ', defined_by := ''' || defined_by || ''''
                   || ', proj_code := ''' || proj_code || ''''
                   || ', resolutioncode := ''' || resolutioncode || ''''
                   || ', bboxcode := ''' || bboxcode || ''''
                   || ', pixel_size_x := ' || pixel_size_x
                   || ', pixel_size_y:= ' || pixel_size_y
                   || ', footprint_image := ''' || COALESCE(footprint_image, 'NULL') || ''''
                   || ', center_of_pixel:= ' || center_of_pixel
                   || ', full_copy := ' || 'FALSE'
                   || ' );' as inserts
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
    )
        loop
            inserts := allrecords.inserts;
            return next;
        end loop;

    for allrecords in (
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
                   || ' );' as inserts
        FROM products.datasource_description dd
        WHERE dd.datasource_descr_id IN (SELECT pads.data_source_id
                                         FROM products.acquisition pads
                                         WHERE pads.productcode = _productcode
                                           AND pads.version = _version)
    )
        loop
            inserts := allrecords.inserts;
            return next;
        end loop;

    for allrecords in (
        SELECT 'SELECT products.update_insert_acquisition('
                   || ' productcode := ''' || pads.productcode || ''''
                   || ', version := ''' || pads.version || ''''
                   || ', data_source_id := ''' || pads.data_source_id || ''''
                   || ', defined_by := ''' || pads.defined_by || ''''
                   || ', type := ''' || pads.type || ''''
                   || ', activated := ' || pads.activated
                   || ', store_original_data := ' || pads.store_original_data
                   || ', full_copy := ' || _full_copy
                   || ' );' as inserts
        FROM products.acquisition pads
        WHERE pads.productcode = _productcode
          AND pads.version = _version
    )
        loop
            inserts := allrecords.inserts;
            return next;
        end loop;

    for allrecords in (
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
                   || ' );' as inserts
        FROM products.sub_datasource_description sdd
        WHERE sdd.productcode = _productcode
          AND sdd.version = _version
    )
        loop
            inserts := allrecords.inserts;
            return next;
        end loop;

    for allrecords in (
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
                   || ' );' as inserts
        FROM products.ingestion i
        WHERE i.productcode = _productcode
          AND i.version = _version
    )
        loop
            inserts := allrecords.inserts;
            return next;
        end loop;

    for allrecords in (
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
                   || ' );' as inserts
        FROM products.processing
        WHERE process_id IN (SELECT DISTINCT pp.process_id
                             FROM products.process_product pp
                             WHERE pp.productcode = _productcode
                               AND pp.version = _version)
    )
        loop
            inserts := allrecords.inserts;
            return next;
        end loop;

    for allrecords in (
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
                   || ' );' as inserts
        FROM products.process_product pp
        WHERE pp.productcode = _productcode
          AND pp.version = _version
    )
        loop
            inserts := allrecords.inserts;
            return next;
        end loop;

    for allrecords in (
    	SELECT 'SELECT analysis.update_insert_legend('
				|| ' legend_id := ' || legend_id
				|| ', legend_name := ' || COALESCE(
					'''' || replace(replace(legend_name, '"', ''''), '''', '''''') || '''', 'NULL')
				|| ', step_type := ' || COALESCE('''' || step_type || '''', 'NULL')
				|| ', min_value := ' || COALESCE(TRIM(to_char(min_value, '99999999D999999')), 'NULL')
				|| ', max_value := ' || COALESCE(TRIM(to_char(max_value, '99999999D999999')), 'NULL')
				|| ', min_real_value := ' || COALESCE('''' || min_real_value || '''', 'NULL')
				|| ', max_real_value := ''' || COALESCE(max_real_value, 'NULL') || ''''
				|| ', colorbar := ''' || COALESCE(colorbar, 'NULL') || ''''
				|| ', step := ' || COALESCE(TRIM(to_char(step, '99999999D999999')), 'NULL')
				|| ', step_range_from := ' || COALESCE(TRIM(to_char(step_range_from, '99999999D999999')),
													   'NULL')
				|| ', step_range_to := ' || COALESCE(TRIM(to_char(step_range_to, '99999999D999999')), 'NULL')
				|| ', unit := ' || COALESCE('''' || unit || '''', 'NULL')
				|| ', defined_by := ' || COALESCE('''' || defined_by || '''', 'NULL')
				|| ' );' as inserts
		 FROM analysis.legend l
		 WHERE (l.legend_id) in (SELECT legend_id FROM analysis.product_legend pl WHERE pl.productcode = _productcode AND pl.version = _version)
		 ORDER BY l.legend_id
    )
        loop
            inserts := allrecords.inserts;
            return next;
        end loop;

    for allrecords in (
    	SELECT 'SELECT analysis.update_insert_legend_step('
				|| ' legend_id := ' || ls.legend_id
				|| ', from_step :=  ' || ls.from_step
				|| ', to_step :=  ' || ls.to_step
				|| ', color_rgb := ' || COALESCE('''' || ls.color_rgb || '''', 'NULL')
				|| ', color_label := ' || COALESCE('''' || ls.color_label || '''', 'NULL')
				|| ', group_label := ' || COALESCE('''' || ls.group_label || '''', 'NULL')
				|| ' );' as inserts
		 FROM analysis.legend_step ls
		 WHERE (ls.legend_id) in (SELECT pl.legend_id FROM analysis.product_legend pl WHERE pl.productcode = _productcode AND pl.version = _version)
		 ORDER BY ls.legend_id
    )
        loop
            inserts := allrecords.inserts;
            return next;
        end loop;

    for allrecords in (
    	SELECT 'SELECT analysis.update_insert_product_legend('
				|| ' productcode := ' || COALESCE('''' || pl.productcode || '''', 'NULL')
				|| ', subproductcode := ' || COALESCE('''' || pl.subproductcode || '''', 'NULL')
				|| ', version := ' || COALESCE('''' || pl.version || '''', 'NULL')
				|| ', legend_id := ' || pl.legend_id
				|| ', default_legend := ' || pl.default_legend
				|| ' );' as inserts
		 FROM analysis.product_legend pl
		 WHERE pl.productcode = _productcode AND pl.version = _version
		 ORDER BY pl.productcode, pl.version, pl.subproductcode, pl.legend_id
    )
        loop
            inserts := allrecords.inserts;
            return next;
        end loop;

END
$BODY$;

ALTER FUNCTION products.export_product_data(character varying, character varying, boolean)
    OWNER TO estation;

/**********************************************************
  END update insert functions
 *********************************************************/