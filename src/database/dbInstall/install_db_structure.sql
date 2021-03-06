--
-- PostgreSQL database dump
--

-- Dumped from database version 12.2 (Debian 12.2-2.pgdg100+1)
-- Dumped by pg_dump version 13.1

-- Started on 2021-03-08 17:40:51 CET

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


--
-- TOC entry 7 (class 2615 OID 100455)
-- Name: products; Type: SCHEMA; Schema: -; Owner: estation
--

CREATE SCHEMA products;


ALTER SCHEMA products OWNER TO estation;

--
-- TOC entry 974 (class 1255 OID 100456)
-- Name: activate_deactivate_product(character varying, character varying, boolean); Type: FUNCTION; Schema: products; Owner: estation
--

CREATE FUNCTION products.activate_deactivate_product(productcode character varying, version character varying, activate boolean DEFAULT false) RETURNS boolean
    LANGUAGE plpgsql STRICT
    AS $_$
DECLARE
    _productcode ALIAS FOR $1;
    _version ALIAS FOR $2;
    _activate ALIAS FOR $3;
BEGIN
    IF TRIM(_productcode) != '' AND TRIM(_version) != '' THEN
        UPDATE products.product p
        SET activated = _activate
        WHERE p.productcode = _productcode
          AND p.version = _version;


        UPDATE products.ingestion i
        SET activated = _activate,
            enabled   = _activate
        WHERE i.productcode = _productcode
          AND i.version = _version
          AND i.mapsetcode IN (
            SELECT tp.mapsetcode
            FROM products.thema_product tp
            WHERE tp.thema_id IN (SELECT t.thema_id FROM products.thema t WHERE t.activated IS TRUE)
              AND tp.productcode = _productcode
              AND tp.version = _version);


        UPDATE products.process_product pp
        SET activated = _activate
        WHERE pp.productcode = _productcode
          AND pp.version = _version
          AND pp.mapsetcode IN (
            SELECT tp.mapsetcode
            FROM products.thema_product tp
            WHERE tp.thema_id IN (SELECT t.thema_id FROM products.thema t WHERE t.activated IS TRUE)
              AND tp.productcode = _productcode
              AND tp.version = _version);


        UPDATE products.processing p
        SET activated = _activate,
            enabled   = _activate
        WHERE (p.process_id) in (SELECT distinct process_id
                                 FROM products.process_product pp
                                 WHERE pp.productcode = _productcode
                                   AND pp.version = _version)
          AND p.output_mapsetcode in (SELECT DISTINCT mapsetcode
                                      FROM products.thema_product tp
                                      WHERE tp.thema_id = (SELECT thema_id FROM products.thema WHERE activated = TRUE)
                                        AND tp.activated = TRUE
                                        AND tp.productcode = _productcode
                                        AND tp.version = _version);

        /* UPDATE products.processing p
        SET activated = _activate,
            enabled = _activate
        WHERE (p.process_id) in (SELECT process_id
                                 FROM products.process_product pp
                                 WHERE pp.productcode = _productcode
                                   AND pp.version = _version
                                   AND pp.mapsetcode IN (
                                      SELECT tp.mapsetcode FROM products.thema_product tp
                                      WHERE tp.thema_id IN (SELECT t.thema_id FROM products.thema t WHERE t.activated IS TRUE)
                                      AND tp.productcode = _productcode
                                      AND tp.version = _version));  */

        UPDATE products.acquisition pads
        SET activated = _activate
        WHERE pads.productcode = _productcode
          AND pads.version = _version;

        RETURN TRUE;

    ELSE
        RETURN FALSE;
    END IF;

END;
$_$;


ALTER FUNCTION products.activate_deactivate_product(productcode character varying, version character varying, activate boolean) OWNER TO estation;

--
-- TOC entry 975 (class 1255 OID 100457)
-- Name: activate_deactivate_product_ingestion_pads_processing(character varying, character varying, boolean, boolean); Type: FUNCTION; Schema: products; Owner: estation
--

CREATE FUNCTION products.activate_deactivate_product_ingestion_pads_processing(productcode character varying, version character varying, activate boolean DEFAULT false, forse boolean DEFAULT false) RETURNS boolean
    LANGUAGE plpgsql STRICT
    AS $_$
DECLARE
    _productcode ALIAS FOR $1;
    _version ALIAS FOR $2;
    _activate ALIAS FOR $3;
    _forse ALIAS FOR $4;
BEGIN
    IF TRIM(_productcode) != '' AND TRIM(_version) != '' THEN
        -- BEGIN
        IF _forse = TRUE THEN
            UPDATE products.product p
            SET activated = _activate
            WHERE p.productcode = _productcode
              AND p.version = _version
              AND (p.productcode, p.version) IN (SELECT DISTINCT tp.productcode, tp.version
                                                 FROM products.thema_product tp
                                                 WHERE tp.thema_id =
                                                       (SELECT thema_id FROM products.thema WHERE activated = TRUE)
                                                   -- AND activated = TRUE
                                                   AND tp.productcode = _productcode
                                                   AND tp.version = _version);

            UPDATE products.ingestion i
            SET activated = _activate,
                enabled   = _activate
            WHERE i.productcode = _productcode
              AND i.version = _version
              AND i.mapsetcode in (SELECT DISTINCT mapsetcode
                                   FROM products.thema_product tp
                                   WHERE tp.thema_id = (SELECT thema_id FROM products.thema WHERE activated = TRUE)
                                     -- AND activated = TRUE
                                     AND tp.productcode = _productcode
                                     AND tp.version = _version);

            UPDATE products.process_product pp
            SET activated = _activate
            WHERE pp.productcode = _productcode
              AND pp.version = _version
              AND pp.mapsetcode in (SELECT DISTINCT mapsetcode
                                    FROM products.thema_product tp
                                    WHERE tp.thema_id = (SELECT thema_id FROM products.thema WHERE activated = TRUE)
                                      -- AND activated = TRUE
                                      AND tp.productcode = _productcode
                                      AND tp.version = _version);

            UPDATE products.processing p
            SET activated = _activate,
                enabled   = _activate
            WHERE (p.process_id) in (SELECT distinct process_id
                                     FROM products.process_product pp
                                     WHERE pp.productcode = _productcode
                                       AND pp.version = _version)
              AND p.output_mapsetcode in (SELECT DISTINCT mapsetcode
                                          FROM products.thema_product tp
                                          WHERE tp.thema_id =
                                                (SELECT thema_id FROM products.thema WHERE activated = TRUE)
                                            -- AND tp.activated = TRUE
                                            AND tp.productcode = _productcode
                                            AND tp.version = _version);

        ELSE
            UPDATE products.product p
            SET activated = _activate
            WHERE p.productcode = _productcode
              AND p.version = _version
              AND (p.productcode, p.version) IN (SELECT DISTINCT tp.productcode, tp.version
                                                 FROM products.thema_product tp
                                                 WHERE tp.thema_id =
                                                       (SELECT thema_id FROM products.thema WHERE activated = TRUE)
                                                   AND activated = TRUE
                                                   AND tp.productcode = _productcode
                                                   AND tp.version = _version);

            UPDATE products.ingestion i
            SET activated = _activate,
                enabled   = _activate
            WHERE i.productcode = _productcode
              AND i.version = _version
              AND i.mapsetcode in (SELECT DISTINCT mapsetcode
                                   FROM products.thema_product tp
                                   WHERE tp.thema_id = (SELECT thema_id FROM products.thema WHERE activated = TRUE)
                                     AND tp.activated = TRUE
                                     AND tp.productcode = _productcode
                                     AND tp.version = _version);

            UPDATE products.process_product pp
            SET activated = _activate
            WHERE pp.productcode = _productcode
              AND pp.version = _version
              AND pp.mapsetcode in (SELECT DISTINCT mapsetcode
                                    FROM products.thema_product tp
                                    WHERE tp.thema_id = (SELECT thema_id FROM products.thema WHERE activated = TRUE)
                                      AND tp.activated = TRUE
                                      AND tp.productcode = _productcode
                                      AND tp.version = _version);

            UPDATE products.processing p
            SET activated = _activate,
                enabled   = _activate
            WHERE (p.process_id) in (SELECT distinct process_id
                                     FROM products.process_product pp
                                     WHERE pp.productcode = _productcode
                                       AND pp.version = _version)
              AND p.output_mapsetcode in (SELECT DISTINCT mapsetcode
                                          FROM products.thema_product tp
                                          WHERE tp.thema_id =
                                                (SELECT thema_id FROM products.thema WHERE activated = TRUE)
                                            AND tp.activated = TRUE
                                            AND tp.productcode = _productcode
                                            AND tp.version = _version);

            /*
    -- wrong update query, updates all mapsets!
    UPDATE products.processing p
    SET activated = _activate,
        enabled = _activate
    WHERE (p.process_id) in (SELECT process_id
           FROM products.process_product pp
           WHERE pp.productcode = _productcode
         AND pp.version = _version
         AND pp.mapsetcode in (SELECT DISTINCT mapsetcode FROM products.thema_product tp
                       WHERE tp.thema_id = (SELECT thema_id FROM products.thema WHERE activated = TRUE)
                     AND tp.activated = TRUE
                     AND tp.productcode = _productcode
                     AND tp.version = _version));

    UPDATE products.acquisition pads
    SET activated = _activate
    WHERE pads.productcode = _productcode AND pads.version = _version
    AND (pads.productcode, pads.version) in (SELECT tp.productcode, tp.version
                         FROM products.thema_product tp
                         WHERE tp.thema_id = (SELECT thema_id FROM products.thema WHERE activated = TRUE)
                         AND tp.activated = TRUE); */

        END IF;

        RETURN TRUE;

    ELSE
        RETURN FALSE;
    END IF;

END;
$_$;


ALTER FUNCTION products.activate_deactivate_product_ingestion_pads_processing(productcode character varying, version character varying, activate boolean, forse boolean) OWNER TO estation;

--
-- TOC entry 976 (class 1255 OID 100458)
-- Name: check_datasource(character varying, character varying); Type: FUNCTION; Schema: products; Owner: estation
--

CREATE FUNCTION products.check_datasource(datasourceid character varying, type character varying) RETURNS boolean
    LANGUAGE plpgsql STRICT
    AS $_$
DECLARE
    datasourceid ALIAS FOR $1;
    type ALIAS FOR $2;
BEGIN
    IF $2 = 'EUMETCAST' THEN
        PERFORM * FROM products.eumetcast_source WHERE eumetcast_id = $1;
    ELSIF $2 = 'INTERNET' THEN
        PERFORM * FROM products.internet_source WHERE internet_id = $1;
    ELSE
        -- PERFORM * FROM other WHERE other_id = $1;
    END IF;
    RETURN FOUND;
END;
$_$;


ALTER FUNCTION products.check_datasource(datasourceid character varying, type character varying) OWNER TO estation;

--
-- TOC entry 977 (class 1255 OID 100459)
-- Name: check_eumetcast_source_datasource_description(); Type: FUNCTION; Schema: products; Owner: estation
--

CREATE FUNCTION products.check_eumetcast_source_datasource_description() RETURNS trigger
    LANGUAGE plpgsql STRICT
    AS $$
BEGIN
    PERFORM * FROM products.datasource_description dd WHERE dd.datasource_descr_id = NEW.eumetcast_id;

    IF NOT FOUND THEN
        NEW.datasource_descr_id = NEW.eumetcast_id;

        INSERT INTO products.datasource_description(datasource_descr_id)
        VALUES (NEW.eumetcast_id);
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION products.check_eumetcast_source_datasource_description() OWNER TO estation;

--
-- TOC entry 978 (class 1255 OID 100460)
-- Name: check_internet_source_datasource_description(); Type: FUNCTION; Schema: products; Owner: estation
--

CREATE FUNCTION products.check_internet_source_datasource_description() RETURNS trigger
    LANGUAGE plpgsql STRICT
    AS $$
BEGIN
    PERFORM * FROM products.datasource_description dd WHERE dd.datasource_descr_id = NEW.internet_id;

    --		OR TRIM(NEW.datasource_descr_id) != NEW.internet_id) THEN
    IF NOT FOUND THEN
        NEW.datasource_descr_id = NEW.internet_id;

        INSERT INTO products.datasource_description(datasource_descr_id)
        VALUES (NEW.internet_id);
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION products.check_internet_source_datasource_description() OWNER TO estation;

--
-- TOC entry 979 (class 1255 OID 100461)
-- Name: check_mapset(character varying); Type: FUNCTION; Schema: products; Owner: estation
--

CREATE FUNCTION products.check_mapset(mapsetid character varying) RETURNS boolean
    LANGUAGE plpgsql STRICT
    AS $_$
DECLARE
    mapset_id ALIAS FOR $1;
BEGIN
    PERFORM * FROM products.mapset WHERE mapsetcode = mapset_id;
    RETURN FOUND;
END;
$_$;


ALTER FUNCTION products.check_mapset(mapsetid character varying) OWNER TO estation;

--
-- TOC entry 980 (class 1255 OID 100462)
-- Name: check_update_internet_source(); Type: FUNCTION; Schema: products; Owner: estation
--

CREATE FUNCTION products.check_update_internet_source() RETURNS trigger
    LANGUAGE plpgsql STRICT
    AS $$
BEGIN
    NEW.update_datetime = now();

    RETURN NEW;
END;
$$;


ALTER FUNCTION products.check_update_internet_source() OWNER TO estation;

--
-- TOC entry 981 (class 1255 OID 100463)
-- Name: deactivate_ingestion_when_disabled(); Type: FUNCTION; Schema: products; Owner: estation
--

CREATE FUNCTION products.deactivate_ingestion_when_disabled() RETURNS trigger
    LANGUAGE plpgsql STRICT
    AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- If both enabled and activated are updated
        IF (OLD.enabled IS DISTINCT FROM NEW.enabled) AND (OLD.activated IS DISTINCT FROM NEW.activated) THEN
            IF NOT NEW.enabled AND NEW.activated THEN
                NEW.activated = FALSE;
            END IF;
        END IF;

        -- If enabled is updated but activated is not updated (not present in update statement)
        IF (OLD.enabled IS DISTINCT FROM NEW.enabled) AND (OLD.activated IS NOT DISTINCT FROM NEW.activated) THEN
            IF NOT NEW.enabled AND OLD.activated THEN
                NEW.activated = FALSE;
            END IF;
        END IF;

        -- If enabled is not updated (not present in update statement) and activated is updated
        IF (OLD.enabled IS NOT DISTINCT FROM NEW.enabled) AND (OLD.activated IS DISTINCT FROM NEW.activated) THEN
            IF NOT OLD.enabled AND NEW.activated THEN
                NEW.activated = FALSE;
            END IF;
        END IF;
    ELSE
        -- If a new ingestion is inserted
        IF NOT NEW.enabled AND NEW.activated THEN
            NEW.activated = FALSE;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION products.deactivate_ingestion_when_disabled() OWNER TO estation;

--
-- TOC entry 982 (class 1255 OID 100464)
-- Name: export_all_data(boolean); Type: FUNCTION; Schema: products; Owner: estation
--

CREATE FUNCTION products.export_all_data(full_copy boolean DEFAULT true) RETURNS SETOF text
    LANGUAGE plpgsql
    AS $_$
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
$_$;


ALTER FUNCTION products.export_all_data(full_copy boolean) OWNER TO estation;

--
-- TOC entry 983 (class 1255 OID 100466)
-- Name: export_jrc_data(boolean); Type: FUNCTION; Schema: products; Owner: estation
--

CREATE FUNCTION products.export_jrc_data(full_copy boolean DEFAULT false) RETURNS SETOF text
    LANGUAGE plpgsql
    AS $_$
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
$_$;


ALTER FUNCTION products.export_jrc_data(full_copy boolean) OWNER TO estation;

--
-- TOC entry 984 (class 1255 OID 100468)
-- Name: export_product_data(character varying, character varying, boolean); Type: FUNCTION; Schema: products; Owner: estation
--

CREATE FUNCTION products.export_product_data(productcode character varying DEFAULT NULL::character varying, version character varying DEFAULT NULL::character varying, full_copy boolean DEFAULT false) RETURNS TABLE(inserts text)
    LANGUAGE plpgsql
    AS $_$
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

END
$_$;


ALTER FUNCTION products.export_product_data(productcode character varying, version character varying, full_copy boolean) OWNER TO estation;

--
-- TOC entry 985 (class 1255 OID 100470)
-- Name: populate_geoserver(boolean); Type: FUNCTION; Schema: products; Owner: estation
--

CREATE FUNCTION products.populate_geoserver(full_copy boolean DEFAULT false) RETURNS boolean
    LANGUAGE plpgsql
    AS $_$
DECLARE

    _full_copy ALIAS FOR $1;
    prods CURSOR FOR SELECT productcode,
                            subproductcode,
                            version,
                            defined_by,
                            FALSE as activated,
                            NULL  as "startdate",
                            NULL  as "enddate"
                     FROM products.sub_product
                     WHERE defined_by = 'JRC';
    prods_row       RECORD;
    _productcode    VARCHAR;
    _subproductcode VARCHAR;
    _version        VARCHAR;
    _defined_by     VARCHAR;
    _activated      BOOLEAN;
    _startdate      BIGINT;
    _enddate        BIGINT;
BEGIN
    OPEN prods;

    LOOP
        FETCH prods INTO prods_row;
        EXIT WHEN NOT FOUND;

        _productcode = prods_row.productcode;
        _subproductcode = prods_row.subproductcode;
        _version = prods_row.version;
        _defined_by = prods_row.defined_by;
        _activated = prods_row.activated;
        _startdate = prods_row.startdate;
        _enddate = prods_row.enddate;

        PERFORM *
        FROM products.geoserver g
        WHERE g.productcode = TRIM(_productcode)
          AND g.subproductcode = TRIM(_subproductcode)
          AND g.version = TRIM(_version);

        IF FOUND THEN
            -- RAISE NOTICE 'START UPDATING Product';
            IF _full_copy THEN
                UPDATE products.geoserver g
                SET defined_by = TRIM(_defined_by),
                    activated  = _activated,
                    startdate  = _startdate,
                    enddate    = _enddate
                WHERE g.productcode = TRIM(_productcode)
                  AND g.subproductcode = TRIM(_subproductcode)
                  AND g.version = TRIM(_version);
            ELSE
                UPDATE products.geoserver g
                SET defined_by = TRIM(_defined_by)
                    -- activated = _activated,
                    -- startdate = _startdate,
                    -- enddate = _enddate
                WHERE g.productcode = TRIM(_productcode)
                  AND g.subproductcode = TRIM(_subproductcode)
                  AND g.version = TRIM(_version);
            END IF;
            -- RAISE NOTICE 'Product updated';
        ELSE
            -- RAISE NOTICE 'START INSERTING Product';

            INSERT INTO products.geoserver (productcode,
                                            subproductcode,
                                            version,
                                            defined_by,
                                            activated,
                                            startdate,
                                            enddate)
            VALUES (TRIM(_productcode),
                    TRIM(_subproductcode),
                    TRIM(_version),
                    TRIM(_defined_by),
                    _activated,
                    _startdate,
                    _enddate);

            -- RAISE NOTICE 'Product inserted';
        END IF;
    END LOOP;
    CLOSE prods;

    RETURN TRUE;

EXCEPTION
    WHEN numeric_value_out_of_range THEN
        RAISE NOTICE 'ERROR: numeric_value_out_of_range.';
        RETURN FALSE;

    WHEN OTHERS THEN
        RAISE NOTICE 'ERROR...';
        RAISE NOTICE '% %', SQLERRM, SQLSTATE;
        RETURN FALSE;

END;
$_$;


ALTER FUNCTION products.populate_geoserver(full_copy boolean) OWNER TO estation;

--
-- TOC entry 986 (class 1255 OID 100471)
-- Name: set_thema(character varying); Type: FUNCTION; Schema: products; Owner: estation
--

CREATE FUNCTION products.set_thema(themaid character varying) RETURNS boolean
    LANGUAGE plpgsql STRICT
    AS $_$
DECLARE
    themaid ALIAS FOR $1;
BEGIN
    IF themaid != '' THEN
        -- BEGIN
        UPDATE products.thema set activated = FALSE;
        UPDATE products.thema set activated = TRUE WHERE thema_id = themaid;

        UPDATE products.product
        SET activated = FALSE
        WHERE defined_by = 'JRC';

        UPDATE products.ingestion
        SET activated = FALSE,
            enabled   = FALSE
        WHERE defined_by = 'JRC';

        UPDATE products.processing
        SET activated = FALSE,
            enabled   = FALSE
        WHERE defined_by = 'JRC';

        UPDATE products.process_product pp
        SET activated = FALSE
        WHERE (pp.process_id) in (SELECT process_id FROM products.processing WHERE defined_by = 'JRC');

        /* UPDATE products.acquisition
      SET activated = FALSE
      WHERE defined_by = 'JRC'; */


        IF themaid != 'ALL' THEN
            UPDATE products.product p
            SET activated = TRUE
            WHERE (p.productcode, p.version) in (SELECT productcode, version
                                                 FROM products.thema_product
                                                 WHERE thema_id = themaid AND activated = TRUE);

            UPDATE products.ingestion i
            SET activated = TRUE,
                enabled   = TRUE
            WHERE (i.productcode, i.version, i.mapsetcode) in (SELECT productcode, version, mapsetcode
                                                               FROM products.thema_product
                                                               WHERE thema_id = themaid AND activated = TRUE);

            UPDATE products.process_product pp
            SET activated = TRUE
            WHERE (pp.productcode, pp.version, pp.mapsetcode) in (SELECT productcode, version, mapsetcode
                                                                  FROM products.thema_product
                                                                  WHERE thema_id = themaid AND activated = TRUE);

            UPDATE products.processing p
            SET activated = TRUE,
                enabled   = TRUE
            WHERE (p.process_id) in (SELECT process_id
                                     FROM products.process_product pp
                                     WHERE pp.type = 'INPUT'
                                       AND (pp.productcode, pp.version, pp.mapsetcode) in
                                           (SELECT productcode, version, mapsetcode
                                            FROM products.thema_product
                                            WHERE thema_id = themaid AND activated = TRUE));

            /* UPDATE products.acquisition pads
          SET activated = TRUE
          WHERE (pads.productcode, pads.version) in (SELECT productcode, version FROM products.thema_product WHERE thema_id = themaid AND activated = TRUE); */

        ELSE
            UPDATE products.product p
            SET activated = TRUE
            WHERE (p.productcode, p.version) in (SELECT productcode, version
                                                 FROM products.thema_product
                                                 WHERE thema_id != themaid AND activated = TRUE);

            UPDATE products.ingestion i
            SET activated = TRUE,
                enabled   = TRUE
            WHERE (i.productcode, i.version, i.mapsetcode) in (SELECT productcode, version, mapsetcode
                                                               FROM products.thema_product
                                                               WHERE thema_id != themaid AND activated = TRUE);

            UPDATE products.process_product pp
            SET activated = TRUE
            WHERE (pp.productcode, pp.version, pp.mapsetcode) in (SELECT productcode, version, mapsetcode
                                                                  FROM products.thema_product
                                                                  WHERE thema_id != themaid AND activated = TRUE);

            UPDATE products.processing p
            SET activated = TRUE,
                enabled   = TRUE
            WHERE (p.process_id) in (SELECT process_id
                                     FROM products.process_product pp
                                     WHERE pp.type = 'INPUT'
                                       AND (pp.productcode, pp.version, pp.mapsetcode) in
                                           (SELECT productcode, version, mapsetcode
                                            FROM products.thema_product
                                            WHERE thema_id != themaid AND activated = TRUE));

            /* UPDATE products.acquisition pads
          SET activated = TRUE
          WHERE (pads.productcode, pads.version) in (SELECT productcode, version FROM products.thema_product WHERE thema_id != themaid AND activated = TRUE); */
        END IF;

        RETURN TRUE;

    ELSE
        RETURN FALSE;
    END IF;

END;
$_$;


ALTER FUNCTION products.set_thema(themaid character varying) OWNER TO estation;

--
-- TOC entry 987 (class 1255 OID 100472)
-- Name: update_insert_acquisition(character varying, character varying, character varying, character varying, character varying, boolean, boolean, boolean); Type: FUNCTION; Schema: products; Owner: estation
--

CREATE FUNCTION products.update_insert_acquisition(productcode character varying, version character varying, data_source_id character varying, defined_by character varying, type character varying, activated boolean, store_original_data boolean, full_copy boolean DEFAULT false) RETURNS boolean
    LANGUAGE plpgsql
    AS $_$
DECLARE
    _productcode ALIAS FOR $1;
    _version ALIAS FOR $2;
    _data_source_id ALIAS FOR $3;
    _defined_by ALIAS FOR $4;
    _type ALIAS FOR $5;
    _activated ALIAS FOR $6;
    _store_original_data ALIAS FOR $7;
    _full_copy ALIAS FOR $8;

BEGIN
    PERFORM *
    FROM products.acquisition pads
    WHERE pads.productcode = TRIM(_productcode)
      AND pads.version = TRIM(_version)
      AND pads.data_source_id = TRIM(_data_source_id);
    -- AND pads.defined_by = TRIM(_defined_by);

    IF FOUND THEN
        IF _full_copy THEN
            UPDATE products.acquisition pads
            SET type                = TRIM(_type)
              , defined_by          = _defined_by
              , activated           = _activated
              , store_original_data = _store_original_data
            WHERE pads.productcode = TRIM(_productcode)
              AND pads.version = TRIM(_version)
              AND pads.data_source_id = TRIM(_data_source_id);
        ELSE
            RAISE NOTICE 'Of existing JRC PADS all columns can be updated by the User, do not overwrite!';
            /*
				UPDATE products.acquisition pads
				SET type = TRIM(_type)
					-- ,defined_by = _defined_by
					-- ,activated = _activated
					-- ,store_original_data = _store_original_data
				WHERE pads.productcode = TRIM(_productcode)
				  AND pads.subproductcode = TRIM(_subproductcode)
				  AND pads.version = TRIM(_version)
				  AND pads.data_source_id = TRIM(_data_source_id);
				*/
        END IF;
    ELSE
        INSERT INTO products.acquisition (productcode,
                                                              version,
                                                              data_source_id,
                                                              defined_by,
                                                              type,
                                                              activated,
                                                              store_original_data)
        VALUES (TRIM(_productcode),
                TRIM(_version),
                TRIM(_data_source_id),
                TRIM(_defined_by),
                TRIM(_type),
                _activated,
                _store_original_data);
    END IF;
    RETURN TRUE;
END;
$_$;


ALTER FUNCTION products.update_insert_acquisition(productcode character varying, version character varying, data_source_id character varying, defined_by character varying, type character varying, activated boolean, store_original_data boolean, full_copy boolean) OWNER TO estation;

--
-- TOC entry 988 (class 1255 OID 100473)
-- Name: update_insert_bbox(character varying, character varying, character varying, double precision, double precision, double precision, double precision, boolean, boolean); Type: FUNCTION; Schema: products; Owner: estation
--

CREATE FUNCTION products.update_insert_bbox(bboxcode character varying, descriptive_name character varying, defined_by character varying, upper_left_long double precision, upper_left_lat double precision, lower_right_long double precision, lower_right_lat double precision, predefined boolean DEFAULT false, full_copy boolean DEFAULT false) RETURNS boolean
    LANGUAGE plpgsql
    AS $_$
DECLARE
    _bboxcode ALIAS FOR $1;
    _descriptive_name ALIAS FOR $2;
    _defined_by ALIAS FOR $3;
    _upper_left_long ALIAS FOR $4;
    _upper_left_lat ALIAS FOR $5;
    _lower_right_long ALIAS FOR $6;
    _lower_right_lat ALIAS FOR $7;
    _predefined ALIAS FOR $8;
    _full_copy ALIAS FOR $9;

BEGIN

    PERFORM * FROM products.bbox p WHERE p.bboxcode = TRIM(_bboxcode);

    IF FOUND THEN
        IF _full_copy THEN
            UPDATE products.bbox bb
            SET descriptive_name = TRIM(_descriptive_name),
                defined_by       = TRIM(_defined_by),
                upper_left_long  = _upper_left_long,
                upper_left_lat   = _upper_left_lat,
                lower_right_long = _lower_right_long,
                lower_right_lat  = _lower_right_lat,
                predefined       = _predefined
            WHERE bb.bboxcode = TRIM(_bboxcode);
        ELSE
            RAISE NOTICE 'Of existing JRC bboxes all columns can be updated by the User, do not overwrite!';
            /*
				UPDATE products.bbox bb
				SET descriptive_name = TRIM(_descriptive_name),
				    defined_by = TRIM(_defined_by),
				    upper_left_long = _upper_left_long,
				    upper_left_lat = _upper_left_lat,
				    lower_right_long = _lower_right_long,
				    lower_right_lat = _lower_right_lat,
				    predefined = _predefined
				WHERE bb.bboxcode = TRIM(_bboxcode);
				*/
        END IF;
    ELSE
        INSERT INTO products.bbox (bboxcode,
                                   descriptive_name,
                                   defined_by,
                                   upper_left_long,
                                   upper_left_lat,
                                   lower_right_long,
                                   lower_right_lat,
                                   predefined)
        VALUES (TRIM(_bboxcode),
                TRIM(_descriptive_name),
                TRIM(_defined_by),
                _upper_left_long,
                _upper_left_lat,
                _lower_right_long,
                _lower_right_lat,
                _predefined);
    END IF;
    RETURN TRUE;
END;
$_$;


ALTER FUNCTION products.update_insert_bbox(bboxcode character varying, descriptive_name character varying, defined_by character varying, upper_left_long double precision, upper_left_lat double precision, lower_right_long double precision, lower_right_lat double precision, predefined boolean, full_copy boolean) OWNER TO estation;

--
-- TOC entry 989 (class 1255 OID 100474)
-- Name: update_insert_data_type(character varying, character varying); Type: FUNCTION; Schema: products; Owner: estation
--

CREATE FUNCTION products.update_insert_data_type(data_type_id character varying, description character varying) RETURNS boolean
    LANGUAGE plpgsql
    AS $_$
DECLARE
    _data_type_id ALIAS FOR $1;
    _description ALIAS FOR $2;
BEGIN
    PERFORM * FROM products.data_type dt WHERE dt.data_type_id = TRIM(_data_type_id);
    IF FOUND THEN
        UPDATE products.data_type dt SET description = TRIM(_description) WHERE dt.data_type_id = TRIM(_data_type_id);
    ELSE
        INSERT INTO products.data_type (data_type_id, description) VALUES (TRIM(_data_type_id), TRIM(_description));
    END IF;
    RETURN TRUE;
END;
$_$;


ALTER FUNCTION products.update_insert_data_type(data_type_id character varying, description character varying) OWNER TO estation;

--
-- TOC entry 990 (class 1255 OID 100475)
-- Name: update_insert_datasource_description(character varying, character varying, character varying, character varying, character varying, character varying, character varying, integer, integer, character varying, character varying, integer, character varying, character varying, character varying, integer, character varying, boolean); Type: FUNCTION; Schema: products; Owner: estation
--

CREATE FUNCTION products.update_insert_datasource_description(datasource_descr_id character varying, format_type character varying, file_extension character varying, delimiter character varying, date_format character varying, date_position character varying, product_identifier character varying, prod_id_position integer, prod_id_length integer, area_type character varying, area_position character varying, area_length integer, preproc_type character varying, product_release character varying, release_position character varying, release_length integer, native_mapset character varying, full_copy boolean DEFAULT false) RETURNS boolean
    LANGUAGE plpgsql
    AS $_$
DECLARE
    _datasource_descr_id ALIAS FOR $1;
    _format_type ALIAS FOR $2;
    _file_extension ALIAS FOR $3;
    _delimiter ALIAS FOR $4;
    _date_format ALIAS FOR $5;
    _date_position ALIAS FOR $6;
    _product_identifier ALIAS FOR $7;
    _prod_id_position ALIAS FOR $8;
    _prod_id_length ALIAS FOR $9;
    _area_type ALIAS FOR $10;
    _area_position ALIAS FOR $11;
    _area_length ALIAS FOR $12;
    _preproc_type ALIAS FOR $13;
    _product_release ALIAS FOR $14;
    _release_position ALIAS FOR $15;
    _release_length ALIAS FOR $16;
    _native_mapset ALIAS FOR $17;
    _full_copy ALIAS FOR $18;

BEGIN
    PERFORM * FROM products.datasource_description dd WHERE dd.datasource_descr_id = TRIM(_datasource_descr_id);

    IF FOUND THEN
        IF _full_copy THEN
            UPDATE products.datasource_description dd
            SET format_type        = TRIM(_format_type),
                file_extension     = TRIM(_file_extension),
                delimiter          = TRIM(_delimiter),
                date_format        = TRIM(_date_format),
                date_position      = TRIM(_date_position),
                product_identifier = TRIM(_product_identifier),
                prod_id_position   = _prod_id_position,
                prod_id_length     = _prod_id_length,
                area_type          = TRIM(_area_type),
                area_position      = TRIM(_area_position),
                area_length        = _area_length,
                preproc_type       = TRIM(_preproc_type),
                product_release    = TRIM(_product_release),
                release_position   = TRIM(_release_position),
                release_length     = _release_length,
                native_mapset      = TRIM(_native_mapset)
            WHERE dd.datasource_descr_id = TRIM(_datasource_descr_id);
        ELSE
            RAISE NOTICE 'Of existing JRC datasource descriptions  all columns can be updated by the User, do not overwrite!';
            /*
				UPDATE products.datasource_description dd
				SET format_type = TRIM(_format_type),
					file_extension = TRIM(_file_extension),
					delimiter = TRIM(_delimiter),
					date_format = TRIM(_date_format),
					date_position = TRIM(_date_position),
					product_identifier = TRIM(_product_identifier),
					prod_id_position = _prod_id_position,
					prod_id_length = _prod_id_length,
					area_type = TRIM(_area_type),
					area_position = TRIM(_area_position),
					area_length = _area_length,
					preproc_type = TRIM(_preproc_type),
					product_release = TRIM(_product_release),
					release_position = TRIM(_release_position),
					release_length = _release_length,
					native_mapset = TRIM(_native_mapset)
				WHERE dd.datasource_descr_id = TRIM(_datasource_descr_id);
				*/
        END IF;
    ELSE
        INSERT INTO products.datasource_description (datasource_descr_id,
                                                     format_type,
                                                     file_extension,
                                                     delimiter,
                                                     date_format,
                                                     date_position,
                                                     product_identifier,
                                                     prod_id_position,
                                                     prod_id_length,
                                                     area_type,
                                                     area_position,
                                                     area_length,
                                                     preproc_type,
                                                     product_release,
                                                     release_position,
                                                     release_length,
                                                     native_mapset)
        VALUES (TRIM(_datasource_descr_id),
                TRIM(_format_type),
                TRIM(_file_extension),
                TRIM(_delimiter),
                TRIM(_date_format),
                TRIM(_date_position),
                TRIM(_product_identifier),
                _prod_id_position,
                _prod_id_length,
                TRIM(_area_type),
                TRIM(_area_position),
                _area_length,
                TRIM(_preproc_type),
                TRIM(_product_release),
                TRIM(_release_position),
                _release_length,
                TRIM(_native_mapset));
    END IF;
    RETURN TRUE;
END;
$_$;


ALTER FUNCTION products.update_insert_datasource_description(datasource_descr_id character varying, format_type character varying, file_extension character varying, delimiter character varying, date_format character varying, date_position character varying, product_identifier character varying, prod_id_position integer, prod_id_length integer, area_type character varying, area_position character varying, area_length integer, preproc_type character varying, product_release character varying, release_position character varying, release_length integer, native_mapset character varying, full_copy boolean) OWNER TO estation;

--
-- TOC entry 991 (class 1255 OID 100476)
-- Name: update_insert_date_format(character varying, character varying); Type: FUNCTION; Schema: products; Owner: estation
--

CREATE FUNCTION products.update_insert_date_format(date_format character varying, definition character varying) RETURNS boolean
    LANGUAGE plpgsql
    AS $_$
DECLARE
    _date_format ALIAS FOR $1;
    _definition ALIAS FOR $2;
BEGIN
    PERFORM * FROM products.date_format df WHERE df.date_format = TRIM(_date_format);
    IF FOUND THEN
        UPDATE products.date_format df SET definition = TRIM(_definition) WHERE df.date_format = TRIM(_date_format);
    ELSE
        INSERT INTO products.date_format (date_format, definition) VALUES (TRIM(_date_format), TRIM(_definition));
    END IF;
    RETURN TRUE;
END;
$_$;


ALTER FUNCTION products.update_insert_date_format(date_format character varying, definition character varying) OWNER TO estation;

--
-- TOC entry 992 (class 1255 OID 100477)
-- Name: update_insert_eumetcast_source(character varying, character varying, character varying, boolean, character varying, character varying, character varying, character varying, character varying, date, date, date, double precision, double precision, double precision, double precision, character varying, character varying, character varying, character varying, character varying, character varying, character varying, character varying, character varying, character varying, character varying, character varying, character varying, character varying, character varying, character varying, character varying, character varying, character varying, character varying, character varying, character varying, character varying, date, character varying, character varying, boolean); Type: FUNCTION; Schema: products; Owner: estation
--

CREATE FUNCTION products.update_insert_eumetcast_source(eumetcast_id character varying, filter_expression_jrc character varying, collection_name character varying, status boolean, internal_identifier character varying, collection_reference character varying, acronym character varying, description character varying, product_status character varying, date_creation date, date_revision date, date_publication date, west_bound_longitude double precision, east_bound_longitude double precision, north_bound_latitude double precision, south_bound_latitude double precision, provider_short_name character varying, collection_type character varying, keywords_distribution character varying, keywords_theme character varying, keywords_societal_benefit_area character varying, orbit_type character varying, satellite character varying, satellite_description character varying, instrument character varying, spatial_coverage character varying, thumbnails character varying, online_resources character varying, distribution character varying, channels character varying, data_access character varying, available_format character varying, version character varying, typical_file_name character varying, average_file_size character varying, frequency character varying, legal_constraints_access_constraint character varying, legal_use_constraint character varying, legal_constraints_data_policy character varying, entry_date date, reference_file character varying, datasource_descr_id character varying, full_copy boolean DEFAULT false) RETURNS boolean
    LANGUAGE plpgsql
    AS $_$
DECLARE
    _eumetcast_id ALIAS FOR $1;
    _filter_expression_jrc ALIAS FOR $2;
    _collection_name ALIAS FOR $3;
    _status ALIAS FOR $4;
    _internal_identifier ALIAS FOR $5;
    _collection_reference ALIAS FOR $6;
    _acronym ALIAS FOR $7;
    _description ALIAS FOR $8;
    _product_status ALIAS FOR $9;
    _date_creation ALIAS FOR $10;
    _date_revision ALIAS FOR $11;
    _date_publication ALIAS FOR $12;
    _west_bound_longitude ALIAS FOR $13;
    _east_bound_longitude ALIAS FOR $14;
    _north_bound_latitude ALIAS FOR $15;
    _south_bound_latitude ALIAS FOR $16;
    _provider_short_name ALIAS FOR $17;
    _collection_type ALIAS FOR $18;
    _keywords_distribution ALIAS FOR $19;
    _keywords_theme ALIAS FOR $20;
    _keywords_societal_benefit_area ALIAS FOR $21;
    _orbit_type ALIAS FOR $22;
    _satellite ALIAS FOR $23;
    _satellite_description ALIAS FOR $24;
    _instrument ALIAS FOR $25;
    _spatial_coverage ALIAS FOR $26;
    _thumbnails ALIAS FOR $27;
    _online_resources ALIAS FOR $28;
    _distribution ALIAS FOR $29;
    _channels ALIAS FOR $30;
    _data_access ALIAS FOR $31;
    _available_format ALIAS FOR $32;
    _version ALIAS FOR $33;
    _typical_file_name ALIAS FOR $34;
    _average_file_size ALIAS FOR $35;
    _frequency ALIAS FOR $36;
    _legal_constraints_access_constraint ALIAS FOR $37;
    _legal_use_constraint ALIAS FOR $38;
    _legal_constraints_data_policy ALIAS FOR $39;
    _entry_date ALIAS FOR $40;
    _reference_file ALIAS FOR $41;
    _datasource_descr_id ALIAS FOR $42;
    _full_copy ALIAS FOR $43;

BEGIN
    PERFORM * FROM products.eumetcast_source i WHERE i.eumetcast_id = TRIM(_eumetcast_id);

    IF FOUND THEN
        IF _full_copy THEN
            UPDATE products.eumetcast_source i
            SET eumetcast_id                        = TRIM(_eumetcast_id),
                filter_expression_jrc               = _filter_expression_jrc,
                collection_name                     = TRIM(_collection_name),
                status                              = _status,
                internal_identifier                 = TRIM(_internal_identifier),
                collection_reference                = TRIM(_collection_reference),
                acronym                             = TRIM(_acronym),
                description                         = TRIM(_description),
                product_status                      = TRIM(_product_status),
                date_creation                       = _date_creation,
                date_revision                       = _date_revision,
                date_publication                    = _date_publication,
                west_bound_longitude                = _west_bound_longitude,
                east_bound_longitude                = _east_bound_longitude,
                north_bound_latitude                = _north_bound_latitude,
                south_bound_latitude                = _south_bound_latitude,
                provider_short_name                 = TRIM(_provider_short_name),
                collection_type                     = TRIM(_collection_type),
                keywords_distribution               = TRIM(_keywords_distribution),
                keywords_theme                      = TRIM(_keywords_theme),
                keywords_societal_benefit_area      = TRIM(_keywords_societal_benefit_area),
                orbit_type                          = TRIM(_orbit_type),
                satellite                           = TRIM(_satellite),
                satellite_description               = TRIM(_satellite_description),
                instrument                          = TRIM(_instrument),
                spatial_coverage                    = TRIM(_spatial_coverage),
                thumbnails                          = TRIM(_thumbnails),
                online_resources                    = TRIM(_online_resources),
                distribution                        = TRIM(_distribution),
                channels                            = TRIM(_channels),
                data_access                         = TRIM(_data_access),
                available_format                    = TRIM(_available_format),
                version                             = TRIM(_version),
                typical_file_name                   = TRIM(_typical_file_name),
                average_file_size                   = TRIM(_average_file_size),
                frequency                           = TRIM(_frequency),
                legal_constraints_access_constraint = TRIM(_legal_constraints_access_constraint),
                legal_use_constraint                = TRIM(_legal_use_constraint),
                legal_constraints_data_policy       = TRIM(_legal_constraints_data_policy),
                entry_date                          = _entry_date,
                reference_file                      = TRIM(_reference_file),
                datasource_descr_id                 = TRIM(_datasource_descr_id)
            WHERE i.eumetcast_id = TRIM(_eumetcast_id);
        ELSE
            UPDATE products.eumetcast_source i
            SET eumetcast_id                        = TRIM(_eumetcast_id),
                -- filter_expression_jrc = _filter_expression_jrc,
                collection_name                     = TRIM(_collection_name),
                status                              = _status,
                internal_identifier                 = TRIM(_internal_identifier),
                collection_reference                = TRIM(_collection_reference),
                acronym                             = TRIM(_acronym),
                description                         = TRIM(_description),
                product_status                      = TRIM(_product_status),
                date_creation                       = _date_creation,
                date_revision                       = _date_revision,
                date_publication                    = _date_publication,
                west_bound_longitude                = _west_bound_longitude,
                east_bound_longitude                = _east_bound_longitude,
                north_bound_latitude                = _north_bound_latitude,
                south_bound_latitude                = _south_bound_latitude,
                provider_short_name                 = TRIM(_provider_short_name),
                collection_type                     = TRIM(_collection_type),
                keywords_distribution               = TRIM(_keywords_distribution),
                keywords_theme                      = TRIM(_keywords_theme),
                keywords_societal_benefit_area      = TRIM(_keywords_societal_benefit_area),
                orbit_type                          = TRIM(_orbit_type),
                satellite                           = TRIM(_satellite),
                satellite_description               = TRIM(_satellite_description),
                instrument                          = TRIM(_instrument),
                spatial_coverage                    = TRIM(_spatial_coverage),
                thumbnails                          = TRIM(_thumbnails),
                online_resources                    = TRIM(_online_resources),
                distribution                        = TRIM(_distribution),
                channels                            = TRIM(_channels),
                data_access                         = TRIM(_data_access),
                available_format                    = TRIM(_available_format),
                version                             = TRIM(_version),
                typical_file_name                   = TRIM(_typical_file_name),
                average_file_size                   = TRIM(_average_file_size),
                frequency                           = TRIM(_frequency),
                legal_constraints_access_constraint = TRIM(_legal_constraints_access_constraint),
                legal_use_constraint                = TRIM(_legal_use_constraint),
                legal_constraints_data_policy       = TRIM(_legal_constraints_data_policy),
                entry_date                          = _entry_date,
                reference_file                      = TRIM(_reference_file),
                datasource_descr_id                 = TRIM(_datasource_descr_id)
            WHERE i.eumetcast_id = TRIM(_eumetcast_id);
        END IF;
    ELSE
        INSERT INTO products.eumetcast_source (eumetcast_id,
                                               filter_expression_jrc,
                                               collection_name,
                                               status,
                                               internal_identifier,
                                               collection_reference,
                                               acronym,
                                               description,
                                               product_status,
                                               date_creation,
                                               date_revision,
                                               date_publication,
                                               west_bound_longitude,
                                               east_bound_longitude,
                                               north_bound_latitude,
                                               south_bound_latitude,
                                               provider_short_name,
                                               collection_type,
                                               keywords_distribution,
                                               keywords_theme,
                                               keywords_societal_benefit_area,
                                               orbit_type,
                                               satellite,
                                               satellite_description,
                                               instrument,
                                               spatial_coverage,
                                               thumbnails,
                                               online_resources,
                                               distribution,
                                               channels,
                                               data_access,
                                               available_format,
                                               version,
                                               typical_file_name,
                                               average_file_size,
                                               frequency,
                                               legal_constraints_access_constraint,
                                               legal_use_constraint,
                                               legal_constraints_data_policy,
                                               entry_date,
                                               reference_file,
                                               datasource_descr_id)
        VALUES (TRIM(_eumetcast_id),
                TRIM(_filter_expression_jrc),
                TRIM(_collection_name),
                _status,
                TRIM(_internal_identifier),
                TRIM(_collection_reference),
                TRIM(_acronym),
                TRIM(_description),
                TRIM(_product_status),
                _date_creation,
                _date_revision,
                _date_publication,
                _west_bound_longitude,
                _east_bound_longitude,
                _north_bound_latitude,
                _south_bound_latitude,
                TRIM(_provider_short_name),
                TRIM(_collection_type),
                TRIM(_keywords_distribution),
                TRIM(_keywords_theme),
                TRIM(_keywords_societal_benefit_area),
                TRIM(_orbit_type),
                TRIM(_satellite),
                TRIM(_satellite_description),
                TRIM(_instrument),
                TRIM(_spatial_coverage),
                TRIM(_thumbnails),
                TRIM(_online_resources),
                TRIM(_distribution),
                TRIM(_channels),
                TRIM(_data_access),
                TRIM(_available_format),
                TRIM(_version),
                TRIM(_typical_file_name),
                TRIM(_average_file_size),
                TRIM(_frequency),
                TRIM(_legal_constraints_access_constraint),
                TRIM(_legal_use_constraint),
                TRIM(_legal_constraints_data_policy),
                _entry_date,
                TRIM(_reference_file),
                TRIM(_datasource_descr_id));
    END IF;
    RETURN TRUE;
END;
$_$;


ALTER FUNCTION products.update_insert_eumetcast_source(eumetcast_id character varying, filter_expression_jrc character varying, collection_name character varying, status boolean, internal_identifier character varying, collection_reference character varying, acronym character varying, description character varying, product_status character varying, date_creation date, date_revision date, date_publication date, west_bound_longitude double precision, east_bound_longitude double precision, north_bound_latitude double precision, south_bound_latitude double precision, provider_short_name character varying, collection_type character varying, keywords_distribution character varying, keywords_theme character varying, keywords_societal_benefit_area character varying, orbit_type character varying, satellite character varying, satellite_description character varying, instrument character varying, spatial_coverage character varying, thumbnails character varying, online_resources character varying, distribution character varying, channels character varying, data_access character varying, available_format character varying, version character varying, typical_file_name character varying, average_file_size character varying, frequency character varying, legal_constraints_access_constraint character varying, legal_use_constraint character varying, legal_constraints_data_policy character varying, entry_date date, reference_file character varying, datasource_descr_id character varying, full_copy boolean) OWNER TO estation;

--
-- TOC entry 993 (class 1255 OID 100479)
-- Name: update_insert_frequency(character varying, character varying, real, character varying, character varying); Type: FUNCTION; Schema: products; Owner: estation
--

CREATE FUNCTION products.update_insert_frequency(frequency_id character varying, time_unit character varying, frequency real, frequency_type character varying, description character varying) RETURNS boolean
    LANGUAGE plpgsql
    AS $_$
DECLARE
    _frequency_id ALIAS FOR $1;
    _time_unit ALIAS FOR $2;
    _frequency ALIAS FOR $3;
    _frequency_type ALIAS FOR $4;
    _description ALIAS FOR $5;
BEGIN
    PERFORM * FROM products.frequency f WHERE f.frequency_id = TRIM(_frequency_id);
    IF FOUND THEN
        UPDATE products.frequency f
        SET time_unit      = TRIM(_time_unit),
            frequency      = _frequency,
            frequency_type = TRIM(_frequency_type),
            description    = TRIM(_description)
        WHERE f.frequency_id = TRIM(_frequency_id);
    ELSE
        INSERT INTO products.frequency (frequency_id, time_unit, frequency, frequency_type, description)
        VALUES (TRIM(_frequency_id), TRIM(_time_unit), _frequency, TRIM(_frequency_type), TRIM(_description));
    END IF;
    RETURN TRUE;
END;
$_$;


ALTER FUNCTION products.update_insert_frequency(frequency_id character varying, time_unit character varying, frequency real, frequency_type character varying, description character varying) OWNER TO estation;

--
-- TOC entry 994 (class 1255 OID 100480)
-- Name: update_insert_ingestion(character varying, character varying, character varying, character varying, character varying, boolean, boolean, character varying, boolean, boolean); Type: FUNCTION; Schema: products; Owner: estation
--

CREATE FUNCTION products.update_insert_ingestion(productcode character varying, subproductcode character varying, version character varying, mapsetcode character varying, defined_by character varying, activated boolean, wait_for_all_files boolean, input_to_process_re character varying, enabled boolean, full_copy boolean DEFAULT false) RETURNS boolean
    LANGUAGE plpgsql
    AS $_$
DECLARE
    _productcode ALIAS FOR $1;
    _subproductcode ALIAS FOR $2;
    _version ALIAS FOR $3;
    _mapsetcode ALIAS FOR $4;
    _defined_by ALIAS FOR $5;
    _activated ALIAS FOR $6;
    _wait_for_all_files ALIAS FOR $7;
    _input_to_process_re ALIAS FOR $8;
    _enabled ALIAS FOR $9;
    _full_copy ALIAS FOR $10;

BEGIN
    PERFORM *
    FROM products.ingestion i
    WHERE i.productcode = TRIM(_productcode)
      AND i.subproductcode = TRIM(_subproductcode)
      AND i.version = TRIM(_version)
      AND i.mapsetcode = TRIM(_mapsetcode);
    -- AND i.defined_by = TRIM(_defined_by);

    IF FOUND THEN
        IF _full_copy THEN
            UPDATE products.ingestion i
            SET defined_by          = TRIM(_defined_by),
                activated           = _activated,
                wait_for_all_files  = _wait_for_all_files,
                input_to_process_re = TRIM(_input_to_process_re),
                enabled             = _enabled
            WHERE i.productcode = TRIM(_productcode)
              AND i.subproductcode = TRIM(_subproductcode)
              AND i.version = TRIM(_version)
              AND i.mapsetcode = TRIM(_mapsetcode);
        ELSE
            UPDATE products.ingestion i
            SET input_to_process_re = TRIM(_input_to_process_re)
                -- ,enabled = _enabled
                -- ,defined_by = TRIM(_defined_by)
                -- ,activated = _activated
                -- ,wait_for_all_files = _wait_for_all_files
            WHERE i.productcode = TRIM(_productcode)
              AND i.subproductcode = TRIM(_subproductcode)
              AND i.version = TRIM(_version)
              AND i.mapsetcode = TRIM(_mapsetcode);
            -- AND i.defined_by = TRIM(_defined_by);
        END IF;
    ELSE
        INSERT INTO products.ingestion (productcode,
                                        subproductcode,
                                        version,
                                        mapsetcode,
                                        defined_by,
                                        activated,
                                        wait_for_all_files,
                                        input_to_process_re,
                                        enabled)
        VALUES (TRIM(_productcode),
                TRIM(_subproductcode),
                TRIM(_version),
                TRIM(_mapsetcode),
                TRIM(_defined_by),
                _activated,
                _wait_for_all_files,
                TRIM(_input_to_process_re),
                _enabled);
    END IF;
    RETURN TRUE;
END;
$_$;


ALTER FUNCTION products.update_insert_ingestion(productcode character varying, subproductcode character varying, version character varying, mapsetcode character varying, defined_by character varying, activated boolean, wait_for_all_files boolean, input_to_process_re character varying, enabled boolean, full_copy boolean) OWNER TO estation;

--
-- TOC entry 995 (class 1255 OID 100481)
-- Name: update_insert_internet_source(character varying, character varying, character varying, character varying, character varying, timestamp without time zone, character varying, character varying, character varying, character varying, character varying, character varying, boolean, integer, character varying, character varying, bigint, bigint, character varying, boolean); Type: FUNCTION; Schema: products; Owner: estation
--

CREATE FUNCTION products.update_insert_internet_source(internet_id character varying, defined_by character varying, descriptive_name character varying, description character varying, modified_by character varying, update_datetime timestamp without time zone, url character varying, user_name character varying, password character varying, type character varying, include_files_expression character varying, files_filter_expression character varying, status boolean, pull_frequency integer, datasource_descr_id character varying, frequency_id character varying, start_date bigint, end_date bigint, https_params character varying, full_copy boolean DEFAULT false) RETURNS boolean
    LANGUAGE plpgsql
    AS $_$
DECLARE
    _internet_id ALIAS FOR $1;
    _defined_by ALIAS FOR $2;
    _descriptive_name ALIAS FOR $3;
    _description ALIAS FOR $4;
    _modified_by ALIAS FOR $5;
    _update_datetime ALIAS FOR $6;
    _url ALIAS FOR $7;
    _user_name ALIAS FOR $8;
    _password ALIAS FOR $9;
    _type ALIAS FOR $10;
    _include_files_expression ALIAS FOR $11;
    _files_filter_expression ALIAS FOR $12;
    _status ALIAS FOR $13;
    _pull_frequency ALIAS FOR $14;
    _datasource_descr_id ALIAS FOR $15;
    _frequency_id ALIAS FOR $16;
    _start_date ALIAS FOR $17;
    _end_date ALIAS FOR $18;
    _https_params ALIAS FOR $19;
    _full_copy ALIAS FOR $20;
BEGIN
    PERFORM * FROM products.internet_source i WHERE i.internet_id = TRIM(_internet_id);

    IF FOUND THEN
        IF _full_copy THEN
            UPDATE products.internet_source i
            SET defined_by               = TRIM(_defined_by),
                descriptive_name         = TRIM(_descriptive_name),
                description              = TRIM(_description),
                modified_by              = TRIM(_modified_by),
                update_datetime          = _update_datetime,
                url                      = TRIM(_url),
                user_name                = TRIM(_user_name),
                password                 = TRIM(_password),
                type                     = TRIM(_type),
                include_files_expression = TRIM(_include_files_expression),
                files_filter_expression  = TRIM(_files_filter_expression),
                status                   = _status,
                pull_frequency           = _pull_frequency,
                datasource_descr_id      = TRIM(_datasource_descr_id),
                frequency_id             = TRIM(_frequency_id),
                start_date               = _start_date,
                end_date                 = _end_date,
                https_params             = _https_params
            WHERE i.internet_id = TRIM(_internet_id);
        ELSE
            UPDATE products.internet_source i
            SET defined_by          = TRIM(_defined_by),
                -- descriptive_name = TRIM(_descriptive_name),
                -- description = TRIM(_description),
                modified_by         = TRIM(_modified_by),
                update_datetime     = _update_datetime,
                -- url = TRIM(_url),
                -- user_name = TRIM(_user_name),
                -- password = TRIM(_password),
                type                = TRIM(_type),
                -- include_files_expression = TRIM(_include_files_expression),
                -- files_filter_expression = TRIM(_files_filter_expression),
                status              = _status,
                -- pull_frequency = _pull_frequency,
                datasource_descr_id = TRIM(_datasource_descr_id),
                frequency_id        = TRIM(_frequency_id)
                -- , start_date = _start_date
                -- , end_date = _end_date
                -- , https_params = _https_params
            WHERE i.internet_id = TRIM(_internet_id);
        END IF;
    ELSE
        INSERT INTO products.internet_source (internet_id,
                                              defined_by,
                                              descriptive_name,
                                              description,
                                              modified_by,
                                              update_datetime,
                                              url,
                                              user_name,
                                              password,
                                              type,
                                              include_files_expression,
                                              files_filter_expression,
                                              status,
                                              pull_frequency,
                                              datasource_descr_id,
                                              frequency_id,
                                              start_date,
                                              end_date,
                                              https_params)
        VALUES (TRIM(_internet_id),
                TRIM(_defined_by),
                TRIM(_descriptive_name),
                TRIM(_description),
                TRIM(_modified_by),
                _update_datetime,
                TRIM(_url),
                TRIM(_user_name),
                TRIM(_password),
                TRIM(_type),
                TRIM(_include_files_expression),
                TRIM(_files_filter_expression),
                _status,
                _pull_frequency,
                TRIM(_datasource_descr_id),
                TRIM(_frequency_id),
                _start_date,
                _end_date,
                TRIM(_https_params));
    END IF;
    RETURN TRUE;
END;
$_$;


ALTER FUNCTION products.update_insert_internet_source(internet_id character varying, defined_by character varying, descriptive_name character varying, description character varying, modified_by character varying, update_datetime timestamp without time zone, url character varying, user_name character varying, password character varying, type character varying, include_files_expression character varying, files_filter_expression character varying, status boolean, pull_frequency integer, datasource_descr_id character varying, frequency_id character varying, start_date bigint, end_date bigint, https_params character varying, full_copy boolean) OWNER TO estation;

--
-- TOC entry 996 (class 1255 OID 100482)
-- Name: update_insert_mapset(character varying, character varying, character varying, character varying, character varying, character varying, character varying, integer, integer, text, boolean, boolean); Type: FUNCTION; Schema: products; Owner: estation
--

CREATE FUNCTION products.update_insert_mapset(mapsetcode character varying, descriptive_name character varying, description character varying, defined_by character varying, proj_code character varying, resolutioncode character varying, bboxcode character varying, pixel_size_x integer, pixel_size_y integer, footprint_image text, center_of_pixel boolean DEFAULT false, full_copy boolean DEFAULT false) RETURNS boolean
    LANGUAGE plpgsql
    AS $_$
DECLARE
    _mapsetcode ALIAS FOR $1;
    _descriptive_name ALIAS FOR $2;
    _description ALIAS FOR $3;
    _defined_by ALIAS FOR $4;
    _proj_code ALIAS FOR $5;
    _resolutioncode ALIAS FOR $6;
    _bboxcode ALIAS FOR $7;
    _pixel_size_x ALIAS FOR $8;
    _pixel_size_y ALIAS FOR $9;
    _footprint_image ALIAS FOR $10;
    _center_of_pixel ALIAS FOR $11;
    _full_copy ALIAS FOR $12;

BEGIN
    IF _footprint_image = 'NULL' THEN
        _footprint_image = NULL;
    END IF;

    PERFORM * FROM products.mapset m WHERE m.mapsetcode = TRIM(_mapsetcode);

    IF FOUND THEN
        IF _full_copy THEN
            UPDATE products.mapset m
            SET defined_by       = TRIM(_defined_by),
                descriptive_name = TRIM(_descriptive_name),
                description      = TRIM(_description),
                proj_code        = TRIM(_proj_code),
                resolutioncode   = TRIM(_resolutioncode),
                bboxcode         = TRIM(_bboxcode),
                pixel_size_x     = _pixel_size_x,
                pixel_size_y     = _pixel_size_y,
                footprint_image  = TRIM(_footprint_image),
                center_of_pixel  = _center_of_pixel
            WHERE m.mapsetcode = TRIM(_mapsetcode);
        ELSE
            RAISE NOTICE 'Of existing JRC mapsets all columns can be updated by the User, do not overwrite!';
            /*
				UPDATE products.mapset m
				SET defined_by = TRIM(_defined_by),
				    descriptive_name = TRIM(_descriptive_name),
				    description = TRIM(_description),
				    proj_code = TRIM(_proj_code),
				    resolutioncode = TRIM(_resolutioncode),
				    bboxcode = TRIM(_bboxcode),
				    pixel_size_x = _pixel_size_x,
				    pixel_size_y = _pixel_size_y,
				    footprint_image = TRIM(_footprint_image),
				    center_of_pixel = TRIM(_center_of_pixel)
				WHERE m.mapsetcode = TRIM(_mapsetcode);
				*/
        END IF;
    ELSE
        INSERT INTO products.mapset (mapsetcode,
                                         descriptive_name,
                                         description,
                                         defined_by,
                                         proj_code,
                                         resolutioncode,
                                         bboxcode,
                                         pixel_size_x,
                                         pixel_size_y,
                                         footprint_image,
                                         center_of_pixel)
        VALUES (TRIM(_mapsetcode),
                TRIM(_descriptive_name),
                TRIM(_description),
                TRIM(_defined_by),
                TRIM(_proj_code),
                TRIM(_resolutioncode),
                TRIM(_bboxcode),
                _pixel_size_x,
                _pixel_size_y,
                _footprint_image,
                _center_of_pixel);
    END IF;
    RETURN TRUE;
END;
$_$;


ALTER FUNCTION products.update_insert_mapset(mapsetcode character varying, descriptive_name character varying, description character varying, defined_by character varying, proj_code character varying, resolutioncode character varying, bboxcode character varying, pixel_size_x integer, pixel_size_y integer, footprint_image text, center_of_pixel boolean, full_copy boolean) OWNER TO estation;

--
-- TOC entry 997 (class 1255 OID 100483)
-- Name: update_insert_process_product(integer, character varying, character varying, character varying, character varying, character varying, boolean, boolean, character varying, bigint, bigint, boolean); Type: FUNCTION; Schema: products; Owner: estation
--

CREATE FUNCTION products.update_insert_process_product(process_id integer, productcode character varying, subproductcode character varying, version character varying, mapsetcode character varying, type character varying, activated boolean, final boolean, date_format character varying, start_date bigint, end_date bigint, full_copy boolean DEFAULT false) RETURNS boolean
    LANGUAGE plpgsql
    AS $_$
DECLARE
    _process_id ALIAS FOR $1;
    _productcode ALIAS FOR $2;
    _subproductcode ALIAS FOR $3;
    _version ALIAS FOR $4;
    _mapsetcode ALIAS FOR $5;
    _type ALIAS FOR $6;
    _activated ALIAS FOR $7;
    _final ALIAS FOR $8;
    _date_format ALIAS FOR $9;
    _start_date ALIAS FOR $10;
    _end_date ALIAS FOR $11;
    _full_copy ALIAS FOR $12;

BEGIN
    PERFORM *
    FROM products.process_product pp
    WHERE pp.process_id = _process_id
      AND pp.productcode = TRIM(_productcode)
      AND pp.subproductcode = TRIM(_subproductcode)
      AND pp.version = TRIM(_version)
      AND pp.mapsetcode = TRIM(_mapsetcode);

    IF FOUND THEN
        IF _full_copy THEN
            UPDATE products.process_product pp
            SET type        = TRIM(_type),
                final       = _final,
                date_format = TRIM(_date_format),
                start_date  = _start_date,
                end_date    = _end_date
                    ,
                activated   = _activated
            WHERE pp.process_id = _process_id
              AND pp.productcode = TRIM(_productcode)
              AND pp.subproductcode = TRIM(_subproductcode)
              AND pp.version = TRIM(_version)
              AND pp.mapsetcode = TRIM(_mapsetcode);
        ELSE
            UPDATE products.process_product pp
            SET type        = TRIM(_type),
                final       = _final,
                date_format = TRIM(_date_format),
                start_date  = _start_date,
                end_date    = _end_date
                -- ,activated = _activated
            WHERE pp.process_id = _process_id
              AND pp.productcode = TRIM(_productcode)
              AND pp.subproductcode = TRIM(_subproductcode)
              AND pp.version = TRIM(_version)
              AND pp.mapsetcode = TRIM(_mapsetcode);

        END IF;
    ELSE
        INSERT INTO products.process_product (process_id,
                                              productcode,
                                              subproductcode,
                                              version,
                                              mapsetcode,
                                              type,
                                              activated,
                                              final,
                                              date_format,
                                              start_date,
                                              end_date)
        VALUES (_process_id,
                TRIM(_productcode),
                TRIM(_subproductcode),
                TRIM(_version),
                TRIM(_mapsetcode),
                TRIM(_type),
                _activated,
                _final,
                TRIM(_date_format),
                _start_date,
                _end_date);
    END IF;
    RETURN TRUE;
END;
$_$;


ALTER FUNCTION products.update_insert_process_product(process_id integer, productcode character varying, subproductcode character varying, version character varying, mapsetcode character varying, type character varying, activated boolean, final boolean, date_format character varying, start_date bigint, end_date bigint, full_copy boolean) OWNER TO estation;

--
-- TOC entry 998 (class 1255 OID 100484)
-- Name: update_insert_processing(integer, character varying, character varying, boolean, character varying, character varying, character varying, boolean, boolean); Type: FUNCTION; Schema: products; Owner: estation
--

CREATE FUNCTION products.update_insert_processing(process_id integer, defined_by character varying, output_mapsetcode character varying, activated boolean, derivation_method character varying, algorithm character varying, priority character varying, enabled boolean, full_copy boolean DEFAULT false) RETURNS boolean
    LANGUAGE plpgsql
    AS $_$
DECLARE
    _process_id ALIAS FOR $1;
    _defined_by ALIAS FOR $2;
    _output_mapsetcode ALIAS FOR $3;
    _activated ALIAS FOR $4;
    _derivation_method ALIAS FOR $5;
    _algorithm ALIAS FOR $6;
    _priority ALIAS FOR $7;
    _enabled ALIAS FOR $8;
    _full_copy ALIAS FOR $9;

BEGIN
    PERFORM *
    FROM products.processing p
    WHERE p.process_id = _process_id;
    -- AND p.defined_by = TRIM(_defined_by);

    IF FOUND THEN
        IF _full_copy THEN
            UPDATE products.processing p
            SET output_mapsetcode = TRIM(_output_mapsetcode),
                derivation_method = TRIM(_derivation_method),
                algorithm         = TRIM(_algorithm),
                priority          = TRIM(_priority),
                enabled           = _enabled
                    ,
                defined_by        = _defined_by
                    ,
                activated         = _activated
            WHERE p.process_id = _process_id;
        ELSE
            UPDATE products.processing p
            SET output_mapsetcode = TRIM(_output_mapsetcode),
                derivation_method = TRIM(_derivation_method),
                algorithm         = TRIM(_algorithm),
                priority          = TRIM(_priority)
                -- ,enabled = _enabled
                -- ,defined_by = _defined_by
                -- ,activated = _activated
            WHERE p.process_id = _process_id;
        END IF;
    ELSE
        INSERT INTO products.processing (process_id,
                                         defined_by,
                                         output_mapsetcode,
                                         activated,
                                         derivation_method,
                                         algorithm,
                                         priority,
                                         enabled)
        VALUES (_process_id,
                TRIM(_defined_by),
                TRIM(_output_mapsetcode),
                _activated,
                TRIM(_derivation_method),
                TRIM(_algorithm),
                TRIM(_priority),
                _enabled);
    END IF;
    RETURN TRUE;
END;
$_$;


ALTER FUNCTION products.update_insert_processing(process_id integer, defined_by character varying, output_mapsetcode character varying, activated boolean, derivation_method character varying, algorithm character varying, priority character varying, enabled boolean, full_copy boolean) OWNER TO estation;

--
-- TOC entry 999 (class 1255 OID 100485)
-- Name: update_insert_product(character varying, character varying, character varying, boolean, character varying, character varying, character varying, character varying, boolean, character varying, character varying, character varying, character varying, character varying, character varying, boolean); Type: FUNCTION; Schema: products; Owner: estation
--

CREATE FUNCTION products.update_insert_product(productcode character varying, version character varying, defined_by character varying, activated boolean, category_id character varying, descriptive_name character varying, description character varying, provider character varying, masked boolean, acquisition_period character varying, keyword character varying, spatial_repres character varying, citation character varying, access_constraints character varying, use_constraints character varying, full_copy boolean DEFAULT false) RETURNS boolean
    LANGUAGE plpgsql
    AS $_$
DECLARE
    _productcode ALIAS FOR $1;
    _version ALIAS FOR $2;
    _defined_by ALIAS FOR $3;
    _activated ALIAS FOR $4;
    _category_id ALIAS FOR $5;
    _descriptive_name ALIAS FOR $6;
    _description ALIAS FOR $7;
    _provider ALIAS FOR $8;
    _masked ALIAS FOR $9;
    _acquisition_period ALIAS FOR $10;
    _keyword ALIAS FOR $11;
    _spatial_repres ALIAS FOR $12;
    _citation ALIAS FOR $13;
    _access_constraints ALIAS FOR $14;
    _use_constraints ALIAS FOR $15;
    _full_copy ALIAS FOR $16;

BEGIN
    PERFORM *
    FROM products.product p
    WHERE p.productcode = TRIM(_productcode)
      AND p.version = TRIM(_version);
    -- AND p.defined_by = TRIM(_defined_by);

    IF FOUND THEN
        -- RAISE NOTICE 'START UPDATING Product';
        IF _full_copy THEN
            UPDATE products.product p
            SET defined_by       = TRIM(_defined_by),
                activated        = _activated,
                category_id      = TRIM(_category_id),
                descriptive_name = TRIM(_descriptive_name),
                description      = TRIM(_description),
                provider         = TRIM(_provider),
                masked           = _masked,
                acquisition_period  = TRIM(_acquisition_period),
                keyword  = TRIM(_keyword),
                spatial_repres  = TRIM(_spatial_repres),
                citation  = TRIM(_citation),
                access_constraints  = TRIM(_access_constraints),
                use_constraints  = TRIM(_use_constraints)
            WHERE p.productcode = TRIM(_productcode)
              AND p.version = TRIM(_version);
        ELSE
            UPDATE products.product p
            SET defined_by       = TRIM(_defined_by),
                -- activated        = _activated,
                category_id      = TRIM(_category_id),
                descriptive_name = TRIM(_descriptive_name),
                description      = TRIM(_description),
                provider         = TRIM(_provider),
                -- masked           = _masked,
                acquisition_period  = TRIM(_acquisition_period),
                keyword  = TRIM(_keyword),
                spatial_repres  = TRIM(_spatial_repres),
                citation  = TRIM(_citation),
                access_constraints  = TRIM(_access_constraints),
                use_constraints  = TRIM(_use_constraints)
            WHERE p.productcode = TRIM(_productcode)
              AND p.version = TRIM(_version);

        END IF;
        -- RAISE NOTICE 'Product updated';
    ELSE
        -- RAISE NOTICE 'START INSERTING Product';

        INSERT INTO products.product (productcode,
                                      version,
                                      defined_by,
                                      activated,
                                      category_id,
                                      descriptive_name,
                                      description,
                                      provider,
                                      masked,
                                      acquisition_period,
                                      keyword,
                                      spatial_repres,
                                      citation,
                                      access_constraints,
                                      use_constraints
                                      )
        VALUES (TRIM(_productcode),
                TRIM(_version),
                TRIM(_defined_by),
                _activated,
                TRIM(_category_id),
                TRIM(_descriptive_name),
                TRIM(_description),
                TRIM(_provider),
                _masked,
                TRIM(_acquisition_period),
                TRIM(_keyword),
                TRIM(_spatial_repres),
                TRIM(_citation),
                TRIM(_access_constraints),
                TRIM(_use_constraints));

        -- RAISE NOTICE 'Product inserted';
    END IF;
    RETURN TRUE;

EXCEPTION
    WHEN numeric_value_out_of_range THEN
        RAISE NOTICE 'ERROR: numeric_value_out_of_range.';
        RETURN FALSE;

    WHEN OTHERS THEN
        RAISE NOTICE 'ERROR...';
        RAISE NOTICE '% %', SQLERRM, SQLSTATE;
        RETURN FALSE;
END;
$_$;


ALTER FUNCTION products.update_insert_product(productcode character varying, version character varying, defined_by character varying, activated boolean, category_id character varying, descriptive_name character varying, description character varying, provider character varying, masked boolean, acquisition_period character varying, keyword character varying, spatial_repres character varying, citation character varying, access_constraints character varying, use_constraints character varying, full_copy boolean) OWNER TO estation;

--
-- TOC entry 1000 (class 1255 OID 100486)
-- Name: update_insert_product_category(character varying, character varying, integer); Type: FUNCTION; Schema: products; Owner: estation
--

CREATE FUNCTION products.update_insert_product_category(category_id character varying, descriptive_name character varying, order_index integer) RETURNS boolean
    LANGUAGE plpgsql
    AS $_$
DECLARE
    _category_id ALIAS FOR $1;
    _descriptive_name ALIAS FOR $2;
    _order_index ALIAS FOR $3;
BEGIN
    PERFORM * FROM products.product_category pc WHERE pc.category_id = TRIM(_category_id);
    IF FOUND THEN
        UPDATE products.product_category pc
        SET descriptive_name = TRIM(_descriptive_name),
            order_index      = _order_index
        WHERE pc.category_id = TRIM(_category_id);
    ELSE
        INSERT INTO products.product_category (category_id, descriptive_name, order_index)
        VALUES (TRIM(_category_id), TRIM(_descriptive_name), _order_index);
    END IF;
    RETURN TRUE;
END;
$_$;


ALTER FUNCTION products.update_insert_product_category(category_id character varying, descriptive_name character varying, order_index integer) OWNER TO estation;

--
-- TOC entry 1001 (class 1255 OID 100487)
-- Name: update_insert_projection(character varying, character varying, character varying, character varying, boolean); Type: FUNCTION; Schema: products; Owner: estation
--

CREATE FUNCTION products.update_insert_projection(proj_code character varying, descriptive_name character varying, description character varying, srs_wkt character varying, full_copy boolean DEFAULT false) RETURNS boolean
    LANGUAGE plpgsql
    AS $_$
DECLARE
    _proj_code ALIAS FOR $1;
    _descriptive_name ALIAS FOR $2;
    _description ALIAS FOR $3;
    _srs_wkt ALIAS FOR $4;
    _full_copy ALIAS FOR $5;

BEGIN
    IF _srs_wkt = 'NULL' THEN
        _srs_wkt = NULL;
    END IF;

    PERFORM * FROM products.projection p WHERE p.proj_code = TRIM(_proj_code);

    IF FOUND THEN
        IF _full_copy THEN
            UPDATE products.projection p
            SET descriptive_name = TRIM(_descriptive_name),
                description      = TRIM(_description),
                srs_wkt          = _srs_wkt
            WHERE p.proj_code = TRIM(_proj_code);
        ELSE
            RAISE NOTICE 'Of existing JRC projections all columns can be updated by the User, do not overwrite!';
            /*
				UPDATE products.projection p
				SET descriptive_name = TRIM(_descriptive_name),
				    description = TRIM(_description),
				    srs_wkt = _srs_wkt
				WHERE p.proj_code = TRIM(_proj_code);
				*/
        END IF;
    ELSE
        INSERT INTO products.projection (proj_code,
                                         descriptive_name,
                                         description,
                                         srs_wkt)
        VALUES (TRIM(_proj_code),
                TRIM(_descriptive_name),
                TRIM(_description),
                TRIM(_srs_wkt));
    END IF;
    RETURN TRUE;
END;
$_$;


ALTER FUNCTION products.update_insert_projection(proj_code character varying, descriptive_name character varying, description character varying, srs_wkt character varying, full_copy boolean) OWNER TO estation;

--
-- TOC entry 1002 (class 1255 OID 100488)
-- Name: update_insert_resolution(character varying, character varying, character varying, double precision, double precision, boolean); Type: FUNCTION; Schema: products; Owner: estation
--

CREATE FUNCTION products.update_insert_resolution(resolutioncode character varying, descriptive_name character varying, description character varying, pixel_shift_long double precision, pixel_shift_lat double precision, full_copy boolean DEFAULT false) RETURNS boolean
    LANGUAGE plpgsql
    AS $_$
DECLARE
    _resolutioncode ALIAS FOR $1;
    _descriptive_name ALIAS FOR $2;
    _description ALIAS FOR $3;
    _pixel_shift_long ALIAS FOR $4;
    _pixel_shift_lat ALIAS FOR $5;
    _full_copy ALIAS FOR $6;

BEGIN

    PERFORM * FROM products.resolution p WHERE p.resolutioncode = TRIM(_resolutioncode);

    IF FOUND THEN
        IF _full_copy THEN
            UPDATE products.resolution p
            SET descriptive_name = TRIM(_descriptive_name),
                description      = TRIM(_description),
                pixel_shift_long = _pixel_shift_long,
                pixel_shift_lat  = _pixel_shift_lat
            WHERE p.resolutioncode = TRIM(_resolutioncode);
        ELSE
            RAISE NOTICE 'Of existing JRC resolutions all columns can be updated by the User, do not overwrite!';
            /*
				UPDATE products.resolution p
				SET descriptive_name = TRIM(_descriptive_name),
				    description = TRIM(_description),
				    pixel_shift_long = _pixel_shift_long,
				    pixel_shift_lat = _pixel_shift_lat
				WHERE p.resolutioncode = TRIM(_resolutioncode);
				*/
        END IF;
    ELSE
        INSERT INTO products.resolution (resolutioncode,
                                         descriptive_name,
                                         description,
                                         pixel_shift_long,
                                         pixel_shift_lat)
        VALUES (TRIM(_resolutioncode),
                TRIM(_descriptive_name),
                TRIM(_description),
                _pixel_shift_long,
                _pixel_shift_lat);
    END IF;
    RETURN TRUE;
END;
$_$;


ALTER FUNCTION products.update_insert_resolution(resolutioncode character varying, descriptive_name character varying, description character varying, pixel_shift_long double precision, pixel_shift_lat double precision, full_copy boolean) OWNER TO estation;

--
-- TOC entry 1003 (class 1255 OID 100489)
-- Name: update_insert_spirits(character varying, character varying, character varying, character varying, character varying, character varying, integer, integer, integer, integer, character varying, character varying, character varying, character varying, character varying, boolean, character varying, double precision, double precision); Type: FUNCTION; Schema: products; Owner: estation
--

CREATE FUNCTION products.update_insert_spirits(productcode character varying, subproductcode character varying, version character varying, mapsetcode character varying, prod_values character varying, flags character varying, data_ignore_value integer, days integer, start_date integer, end_date integer, sensor_type character varying, comment character varying, sensor_filename_prefix character varying, frequency_filename_prefix character varying, product_anomaly_filename_prefix character varying, activated boolean, out_data_type character varying, out_scale_factor double precision, out_offset double precision) RETURNS boolean
    LANGUAGE plpgsql
    AS $_$
DECLARE
    _productcode ALIAS FOR $1;
    _subproductcode ALIAS FOR $2;
    _version ALIAS FOR $3;
    _mapsetcode ALIAS FOR $4;
    _prod_values ALIAS FOR $5;
    _flags ALIAS FOR $6;
    _data_ignore_value ALIAS FOR $7;
    _days ALIAS FOR $8;
    _start_date ALIAS FOR $9;
    _end_date ALIAS FOR $10;
    _sensor_type ALIAS FOR $11;
    _comment ALIAS FOR $12;
    _sensor_filename_prefix ALIAS FOR $13;
    _frequency_filename_prefix ALIAS FOR $14;
    _product_anomaly_filename_prefix ALIAS FOR $15;
    _activated ALIAS FOR $16;
    _out_data_type ALIAS FOR $17;
    _out_scale_factor ALIAS FOR $18;
    _out_offset ALIAS FOR $19;

BEGIN
    PERFORM *
    FROM products.spirits s
    WHERE s.productcode = TRIM(_productcode)
      AND s.subproductcode = TRIM(_subproductcode)
      AND s.version = TRIM(_version);

    IF FOUND THEN
        UPDATE products.spirits s
        SET mapsetcode                      = TRIM(_mapsetcode),
            prod_values                     = TRIM(_prod_values),
            flags                           = TRIM(_flags),
            data_ignore_value               = _data_ignore_value,
            days                            = _days,
            start_date                      = _start_date,
            end_date                        = _end_date,
            sensor_type                     = TRIM(_sensor_type),
            comment                         = TRIM(_comment),
            sensor_filename_prefix          = TRIM(_sensor_filename_prefix),
            frequency_filename_prefix       = TRIM(_frequency_filename_prefix),
            product_anomaly_filename_prefix = TRIM(_product_anomaly_filename_prefix),
            activated                       = _activated,
            out_data_type                   = TRIM(_out_data_type),
            out_scale_factor                = _out_scale_factor,
            out_offset                      = _out_offset
        WHERE s.productcode = TRIM(_productcode)
          AND s.subproductcode = TRIM(_subproductcode)
          AND s.version = TRIM(_version);
    ELSE
        INSERT INTO products.spirits (productcode,
                                      subproductcode,
                                      version,
                                      mapsetcode,
                                      prod_values,
                                      flags,
                                      data_ignore_value,
                                      days,
                                      start_date,
                                      end_date,
                                      sensor_type,
                                      comment,
                                      sensor_filename_prefix,
                                      frequency_filename_prefix,
                                      product_anomaly_filename_prefix,
                                      activated,
                                      out_data_type,
                                      out_scale_factor,
                                      out_offset)
        VALUES (TRIM(_productcode), TRIM(_subproductcode), TRIM(_version), TRIM(_mapsetcode), TRIM(_prod_values),
                TRIM(_flags), _data_ignore_value, _days, _start_date, _end_date, TRIM(_sensor_type),
                TRIM(_comment), TRIM(_sensor_filename_prefix), TRIM(_frequency_filename_prefix),
                TRIM(_product_anomaly_filename_prefix), _activated, TRIM(_out_data_type), _out_scale_factor,
                _out_offset);
    END IF;
    RETURN TRUE;
END;
$_$;


ALTER FUNCTION products.update_insert_spirits(productcode character varying, subproductcode character varying, version character varying, mapsetcode character varying, prod_values character varying, flags character varying, data_ignore_value integer, days integer, start_date integer, end_date integer, sensor_type character varying, comment character varying, sensor_filename_prefix character varying, frequency_filename_prefix character varying, product_anomaly_filename_prefix character varying, activated boolean, out_data_type character varying, out_scale_factor double precision, out_offset double precision) OWNER TO estation;

--
-- TOC entry 1004 (class 1255 OID 100490)
-- Name: update_insert_sub_datasource_description(character varying, character varying, character varying, character varying, double precision, double precision, double precision, character varying, double precision, double precision, character varying, character varying, character varying, boolean); Type: FUNCTION; Schema: products; Owner: estation
--

CREATE FUNCTION products.update_insert_sub_datasource_description(productcode character varying, subproductcode character varying, version character varying, datasource_descr_id character varying, scale_factor double precision, scale_offset double precision, no_data double precision, data_type_id character varying, mask_min double precision, mask_max double precision, re_process character varying, re_extract character varying, scale_type character varying, full_copy boolean DEFAULT false) RETURNS boolean
    LANGUAGE plpgsql
    AS $_$
DECLARE
    _productcode ALIAS FOR $1;
    _subproductcode ALIAS FOR $2;
    _version ALIAS FOR $3;
    _datasource_descr_id ALIAS FOR $4;
    _scale_factor ALIAS FOR $5;
    _scale_offset ALIAS FOR $6;
    _no_data ALIAS FOR $7;
    _data_type_id ALIAS FOR $8;
    _mask_min ALIAS FOR $9;
    _mask_max ALIAS FOR $10;
    _re_process ALIAS FOR $11;
    _re_extract ALIAS FOR $12;
    _scale_type ALIAS FOR $13;
    _full_copy ALIAS FOR $14;
BEGIN
    PERFORM *
    FROM products.sub_datasource_description sdd
    WHERE sdd.productcode = TRIM(_productcode)
      AND sdd.subproductcode = TRIM(_subproductcode)
      AND sdd.version = TRIM(_version)
      AND sdd.datasource_descr_id = TRIM(_datasource_descr_id);
    -- AND join with product and check if defined_by == 'JRC'
    -- AND join with datasource_description and join with internet_source and check if defined_by == 'JRC'

    IF FOUND THEN
        IF _full_copy THEN
            UPDATE products.sub_datasource_description sdd
            SET scale_factor = _scale_factor,
                scale_offset = _scale_offset,
                no_data      = _no_data,
                data_type_id = TRIM(_data_type_id),
                mask_min     = _mask_min,
                mask_max     = _mask_max,
                re_process   = TRIM(_re_process),
                re_extract   = TRIM(_re_extract),
                scale_type   = TRIM(_scale_type)
            WHERE sdd.productcode = TRIM(_productcode)
              AND sdd.subproductcode = TRIM(_subproductcode)
              AND sdd.version = TRIM(_version)
              AND sdd.datasource_descr_id = TRIM(_datasource_descr_id);
        ELSE
            RAISE NOTICE 'Of existing JRC sub_datasource_descriptions all columns can be updated by the User, do not overwrite!';
            /*
				UPDATE products.sub_datasource_description sdd
				SET -- scale_factor = _scale_factor,
					-- scale_offset = _scale_offset,
					-- no_data = _no_data,
					-- data_type_id = TRIM(_data_type_id),
					-- mask_min = _mask_min,
					-- mask_max = _mask_max,
					re_process = TRIM(_re_process),
					re_extract = TRIM(_re_extract)
				WHERE sdd.productcode = TRIM(_productcode)
				  AND sdd.subproductcode = TRIM(_subproductcode)
				  AND sdd.version = TRIM(_version)
				  AND sdd.datasource_descr_id = TRIM(_datasource_descr_id);
				*/
        END IF;
    ELSE
        INSERT INTO products.sub_datasource_description (productcode,
                                                         subproductcode,
                                                         version,
                                                         datasource_descr_id,
                                                         scale_factor,
                                                         scale_offset,
                                                         no_data,
                                                         data_type_id,
                                                         mask_min,
                                                         mask_max,
                                                         re_process,
                                                         re_extract,
                                                         scale_type)
        VALUES (TRIM(_productcode),
                TRIM(_subproductcode),
                TRIM(_version),
                TRIM(_datasource_descr_id),
                _scale_factor,
                _scale_offset,
                _no_data,
                TRIM(_data_type_id),
                _mask_min,
                _mask_max,
                TRIM(_re_process),
                TRIM(_re_extract),
                TRIM(_scale_type));
    END IF;
    RETURN TRUE;
END;
$_$;


ALTER FUNCTION products.update_insert_sub_datasource_description(productcode character varying, subproductcode character varying, version character varying, datasource_descr_id character varying, scale_factor double precision, scale_offset double precision, no_data double precision, data_type_id character varying, mask_min double precision, mask_max double precision, re_process character varying, re_extract character varying, scale_type character varying, full_copy boolean) OWNER TO estation;

--
-- TOC entry 1005 (class 1255 OID 100491)
-- Name: update_insert_sub_product(character varying, character varying, character varying, character varying, character varying, character varying, character varying, character varying, character varying, double precision, double precision, bigint, double precision, double precision, character varying, character varying, boolean, character varying, integer, character varying, character varying, character varying, character varying, character varying, character varying, character varying, character varying, character varying, character varying, boolean); Type: FUNCTION; Schema: products; Owner: estation
--

CREATE FUNCTION products.update_insert_sub_product(productcode character varying, subproductcode character varying, version character varying, defined_by character varying, product_type character varying, descriptive_name character varying, description character varying, frequency_id character varying, date_format character varying, scale_factor double precision, scale_offset double precision, nodata bigint, mask_min double precision, mask_max double precision, unit character varying, data_type_id character varying, masked boolean, timeseries_role character varying, display_index integer, update_frequency character varying, reference character varying, keywords character varying, use_conditions character varying, quality_scope character varying, quality_title character varying, quality_explanation character varying, quality_statement character varying, spatial_repres character varying, resource_url character varying, full_copy boolean DEFAULT false) RETURNS boolean
    LANGUAGE plpgsql
    AS $_$
DECLARE
    _productcode ALIAS FOR $1;
    _subproductcode ALIAS FOR $2;
    _version ALIAS FOR $3;
    _defined_by ALIAS FOR $4;
    _product_type ALIAS FOR $5;
    _descriptive_name ALIAS FOR $6;
    _description ALIAS FOR $7;
    _frequency_id ALIAS FOR $8;
    _date_format ALIAS FOR $9;
    _scale_factor ALIAS FOR $10;
    _scale_offset ALIAS FOR $11;
    _nodata ALIAS FOR $12;
    _mask_min ALIAS FOR $13;
    _mask_max ALIAS FOR $14;
    _unit ALIAS FOR $15;
    _data_type_id ALIAS FOR $16;
    _masked ALIAS FOR $17;
    _timeseries_role ALIAS FOR $18;
    _display_index ALIAS FOR $19;
    _update_frequency ALIAS FOR $20;
    _reference ALIAS FOR $21;
    _keywords ALIAS FOR $22;
    _use_conditions ALIAS FOR $23;
    _quality_scope ALIAS FOR $24;
    _quality_title ALIAS FOR $25;
    _quality_explanation ALIAS FOR $26;
    _quality_statement ALIAS FOR $27;
    _spatial_repres ALIAS FOR $28;
    _resource_url ALIAS FOR $29;
    _full_copy ALIAS FOR $30;

BEGIN
    PERFORM *
    FROM products.sub_product p
    WHERE p.productcode = TRIM(_productcode)
      AND p.subproductcode = TRIM(_subproductcode)
      AND p.version = TRIM(_version);
    -- AND p.defined_by = TRIM(_defined_by);

    IF FOUND THEN
        -- RAISE NOTICE 'START UPDATING Product';
        IF _full_copy THEN
            UPDATE products.sub_product p
            SET defined_by       = TRIM(_defined_by),
                product_type     = TRIM(_product_type),
                descriptive_name = TRIM(_descriptive_name),
                description      = TRIM(_description),
                frequency_id     = TRIM(_frequency_id),
                date_format      = TRIM(_date_format),
                scale_factor     = _scale_factor,
                scale_offset     = _scale_offset,
                nodata           = _nodata,
                mask_min         = _mask_min,
                mask_max         = _mask_max,
                unit             = TRIM(_unit),
                data_type_id     = TRIM(_data_type_id),
                masked           = _masked,
                timeseries_role  = TRIM(_timeseries_role),
                display_index    = _display_index,
                update_frequency  = TRIM(_update_frequency),
                reference  = TRIM(_reference),
                keywords  = TRIM(_keywords),
                use_conditions  = TRIM(_use_conditions),
                quality_scope  = TRIM(_quality_scope),
                quality_title  = TRIM(_quality_title),
                quality_explanation  = TRIM(_quality_explanation),
                quality_statement  = TRIM(_quality_statement),
                spatial_repres  = TRIM(_spatial_repres),
                resource_url  = TRIM(_resource_url)
            WHERE p.productcode = TRIM(_productcode)
              AND p.subproductcode = TRIM(_subproductcode)
              AND p.version = TRIM(_version);
        ELSE
            UPDATE products.sub_product p
            SET defined_by       = TRIM(_defined_by),
                product_type     = TRIM(_product_type),
                descriptive_name = TRIM(_descriptive_name),
                description      = TRIM(_description),
                frequency_id     = TRIM(_frequency_id),
                date_format      = TRIM(_date_format),
                scale_factor     = _scale_factor,
                scale_offset     = _scale_offset,
                nodata           = _nodata,
                mask_min         = _mask_min,
                mask_max         = _mask_max,
                unit             = TRIM(_unit),
                data_type_id     = TRIM(_data_type_id),
                masked           = _masked,
                timeseries_role  = TRIM(_timeseries_role),
                display_index    = _display_index,
                update_frequency  = TRIM(_update_frequency),
                reference  = TRIM(_reference),
                keywords  = TRIM(_keywords),
                use_conditions  = TRIM(_use_conditions),
                quality_scope  = TRIM(_quality_scope),
                quality_title  = TRIM(_quality_title),
                quality_explanation  = TRIM(_quality_explanation),
                quality_statement  = TRIM(_quality_statement),
                spatial_repres  = TRIM(_spatial_repres),
                resource_url  = TRIM(_resource_url)
            WHERE p.productcode = TRIM(_productcode)
              AND p.subproductcode = TRIM(_subproductcode)
              AND p.version = TRIM(_version);

        END IF;
        -- RAISE NOTICE 'Product updated';
    ELSE
        -- RAISE NOTICE 'START INSERTING Product';

        INSERT INTO products.sub_product (productcode,
                                      subproductcode,
                                      version,
                                      defined_by,
                                      product_type,
                                      descriptive_name,
                                      description,
                                      frequency_id,
                                      date_format,
                                      scale_factor,
                                      scale_offset,
                                      nodata,
                                      mask_min,
                                      mask_max,
                                      unit,
                                      data_type_id,
                                      masked,
                                      timeseries_role,
                                      display_index,
                                      update_frequency,
                                      reference,
                                      keywords,
                                      use_conditions,
                                      quality_scope,
                                      quality_title,
                                      quality_explanation,
                                      quality_statement,
                                      spatial_repres,
                                      resource_url
                                      )
        VALUES (TRIM(_productcode),
                TRIM(_subproductcode),
                TRIM(_version),
                TRIM(_defined_by),
                TRIM(_product_type),
                TRIM(_descriptive_name),
                TRIM(_description),
                TRIM(_frequency_id),
                TRIM(_date_format),
                _scale_factor,
                _scale_offset,
                _nodata,
                _mask_min,
                _mask_max,
                TRIM(_unit),
                TRIM(_data_type_id),
                _masked,
                TRIM(_timeseries_role),
                _display_index,
                TRIM(_update_frequency),
                TRIM(_reference),
                TRIM(_keywords),
                TRIM(_use_conditions),
                TRIM(_quality_scope),
                TRIM(_quality_title),
                TRIM(_quality_explanation),
                TRIM(_quality_statement),
                TRIM(_spatial_repres),
                TRIM(_resource_url)
                );

        -- RAISE NOTICE 'Product inserted';
    END IF;
    RETURN TRUE;

EXCEPTION
    WHEN numeric_value_out_of_range THEN
        RAISE NOTICE 'ERROR: numeric_value_out_of_range.';
        RETURN FALSE;

    WHEN OTHERS THEN
        RAISE NOTICE 'ERROR...';
        RAISE NOTICE '% %', SQLERRM, SQLSTATE;
        RETURN FALSE;
END;
$_$;


ALTER FUNCTION products.update_insert_sub_product(productcode character varying, subproductcode character varying, version character varying, defined_by character varying, product_type character varying, descriptive_name character varying, description character varying, frequency_id character varying, date_format character varying, scale_factor double precision, scale_offset double precision, nodata bigint, mask_min double precision, mask_max double precision, unit character varying, data_type_id character varying, masked boolean, timeseries_role character varying, display_index integer, update_frequency character varying, reference character varying, keywords character varying, use_conditions character varying, quality_scope character varying, quality_title character varying, quality_explanation character varying, quality_statement character varying, spatial_repres character varying, resource_url character varying, full_copy boolean) OWNER TO estation;

--
-- TOC entry 1006 (class 1255 OID 100493)
-- Name: update_insert_thema(character varying, character varying, boolean); Type: FUNCTION; Schema: products; Owner: estation
--

CREATE FUNCTION products.update_insert_thema(thema_id character varying, description character varying, activated boolean) RETURNS boolean
    LANGUAGE plpgsql
    AS $_$
DECLARE
    _thema_id ALIAS FOR $1;
    _description ALIAS FOR $2;
    _activated ALIAS FOR $3;
BEGIN
    PERFORM * FROM products.thema t WHERE t.thema_id = TRIM(_thema_id);
    IF FOUND THEN
        UPDATE products.thema t SET description = TRIM(_description) WHERE t.thema_id = TRIM(_thema_id);
    ELSE
        INSERT INTO products.thema (thema_id, description, activated)
        VALUES (TRIM(_thema_id), TRIM(_description), FALSE);
    END IF;
    RETURN TRUE;
END;
$_$;


ALTER FUNCTION products.update_insert_thema(thema_id character varying, description character varying, activated boolean) OWNER TO estation;

--
-- TOC entry 1007 (class 1255 OID 100494)
-- Name: update_insert_thema_product(character varying, character varying, character varying, character varying, boolean); Type: FUNCTION; Schema: products; Owner: estation
--

CREATE FUNCTION products.update_insert_thema_product(thema_id character varying, productcode character varying, version character varying, mapsetcode character varying, activated boolean) RETURNS boolean
    LANGUAGE plpgsql
    AS $_$
DECLARE
    _thema_id ALIAS FOR $1;
    _productcode ALIAS FOR $2;
    _version ALIAS FOR $3;
    _mapsetcode ALIAS FOR $4;
    _activated ALIAS FOR $5;
BEGIN
    PERFORM *
    FROM products.thema_product tp
    WHERE tp.thema_id = TRIM(_thema_id)
      AND tp.productcode = TRIM(_productcode)
      AND tp.version = TRIM(_version)
      AND tp.mapsetcode = TRIM(_mapsetcode);

    IF FOUND THEN
        UPDATE products.thema_product tp
        SET activated = _activated
        WHERE tp.thema_id = TRIM(_thema_id)
          AND tp.productcode = TRIM(_productcode)
          AND tp.version = TRIM(_version)
          AND tp.mapsetcode = TRIM(_mapsetcode);
    ELSE
        INSERT INTO products.thema_product (thema_id, productcode, version, mapsetcode, activated)
        VALUES (TRIM(_thema_id), TRIM(_productcode), TRIM(_version), TRIM(_mapsetcode), _activated);
    END IF;
    RETURN TRUE;
END;
$_$;


ALTER FUNCTION products.update_insert_thema_product(thema_id character varying, productcode character varying, version character varying, mapsetcode character varying, activated boolean) OWNER TO estation;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 212 (class 1259 OID 100495)
-- Name: acquisition; Type: TABLE; Schema: products; Owner: estation
--

CREATE TABLE products.acquisition (
    productcode character varying NOT NULL,
    version character varying NOT NULL,
    data_source_id character varying NOT NULL,
    defined_by character varying NOT NULL,
    type character varying,
    activated boolean DEFAULT false NOT NULL,
    store_original_data boolean DEFAULT false NOT NULL
);


ALTER TABLE products.acquisition OWNER TO estation;

--
-- TOC entry 4141 (class 0 OID 0)
-- Dependencies: 212
-- Name: COLUMN acquisition.defined_by; Type: COMMENT; Schema: products; Owner: estation
--

COMMENT ON COLUMN products.acquisition.defined_by IS 'values: JRC or USER';


--
-- TOC entry 4142 (class 0 OID 0)
-- Dependencies: 212
-- Name: COLUMN acquisition.type; Type: COMMENT; Schema: products; Owner: estation
--

COMMENT ON COLUMN products.acquisition.type IS 'Values: EUMETCAST, INTERNET, OTHER';


--
-- TOC entry 213 (class 1259 OID 100503)
-- Name: bbox; Type: TABLE; Schema: products; Owner: estation
--

CREATE TABLE products.bbox (
    bboxcode character varying NOT NULL,
    descriptive_name character varying,
    defined_by character varying NOT NULL,
    upper_left_long double precision,
    upper_left_lat double precision,
    lower_right_long double precision,
    lower_right_lat double precision,
    predefined boolean DEFAULT false NOT NULL
);


ALTER TABLE products.bbox OWNER TO estation;

--
-- TOC entry 214 (class 1259 OID 100510)
-- Name: data_type; Type: TABLE; Schema: products; Owner: estation
--

CREATE TABLE products.data_type (
    data_type_id character varying NOT NULL,
    description character varying NOT NULL
);


ALTER TABLE products.data_type OWNER TO estation;

--
-- TOC entry 215 (class 1259 OID 100516)
-- Name: datasource_description; Type: TABLE; Schema: products; Owner: estation
--

CREATE TABLE products.datasource_description (
    datasource_descr_id character varying NOT NULL,
    format_type character varying,
    file_extension character varying,
    delimiter character varying,
    date_format character varying,
    date_position character varying,
    product_identifier character varying,
    prod_id_position integer,
    prod_id_length integer,
    area_type character varying,
    area_position character varying,
    area_length integer,
    preproc_type character varying,
    product_release character varying,
    release_position character varying,
    release_length integer,
    native_mapset character varying DEFAULT 'default'::character varying
);


ALTER TABLE products.datasource_description OWNER TO estation;

--
-- TOC entry 4143 (class 0 OID 0)
-- Dependencies: 215
-- Name: COLUMN datasource_description.format_type; Type: COMMENT; Schema: products; Owner: estation
--

COMMENT ON COLUMN products.datasource_description.format_type IS 'Values:
- DELIMITED
- FIXED';


--
-- TOC entry 4144 (class 0 OID 0)
-- Dependencies: 215
-- Name: COLUMN datasource_description.date_format; Type: COMMENT; Schema: products; Owner: estation
--

COMMENT ON COLUMN products.datasource_description.date_format IS 'A string, case insensitive, in YYYYMMDD, YYYYMMDDHHMM,YYYY,MMDD,HHMM. HHMM (may be used for MSG 15 minutes synthesis). This list may change with the project life. It is maintained by JRC';


--
-- TOC entry 4145 (class 0 OID 0)
-- Dependencies: 215
-- Name: COLUMN datasource_description.product_identifier; Type: COMMENT; Schema: products; Owner: estation
--

COMMENT ON COLUMN products.datasource_description.product_identifier IS 'Comma-separated list of strings present in the filename that form the Product Identifier';


--
-- TOC entry 4146 (class 0 OID 0)
-- Dependencies: 215
-- Name: COLUMN datasource_description.prod_id_position; Type: COMMENT; Schema: products; Owner: estation
--

COMMENT ON COLUMN products.datasource_description.prod_id_position IS 'In case of:
FIXED - integer value of the start position of the Product Identifier

DELIMITED - comma-separated integers indicating the delimiter positions of the Product Identifier to concatinate.';


--
-- TOC entry 4147 (class 0 OID 0)
-- Dependencies: 215
-- Name: COLUMN datasource_description.prod_id_length; Type: COMMENT; Schema: products; Owner: estation
--

COMMENT ON COLUMN products.datasource_description.prod_id_length IS 'In case of FIXED format this field indicates the string length to take starting from the prod_id_position.';


--
-- TOC entry 4148 (class 0 OID 0)
-- Dependencies: 215
-- Name: COLUMN datasource_description.area_type; Type: COMMENT; Schema: products; Owner: estation
--

COMMENT ON COLUMN products.datasource_description.area_type IS 'Values:
- REGION
- SEGMENT
- TILE
- GLOBAL';


--
-- TOC entry 4149 (class 0 OID 0)
-- Dependencies: 215
-- Name: COLUMN datasource_description.area_position; Type: COMMENT; Schema: products; Owner: estation
--

COMMENT ON COLUMN products.datasource_description.area_position IS 'In case of:
FIXED - integer value of the start position of the Area

DELIMITED - comma-separated integers indicating the delimiter positions of the Area to concatinate.';


--
-- TOC entry 4150 (class 0 OID 0)
-- Dependencies: 215
-- Name: COLUMN datasource_description.area_length; Type: COMMENT; Schema: products; Owner: estation
--

COMMENT ON COLUMN products.datasource_description.area_length IS 'In case of FIXED format this field indicates the string length to take starting from the area_position.';


--
-- TOC entry 4151 (class 0 OID 0)
-- Dependencies: 215
-- Name: COLUMN datasource_description.product_release; Type: COMMENT; Schema: products; Owner: estation
--

COMMENT ON COLUMN products.datasource_description.product_release IS 'String indicating the Product Release present in the filename.';


--
-- TOC entry 4152 (class 0 OID 0)
-- Dependencies: 215
-- Name: COLUMN datasource_description.release_position; Type: COMMENT; Schema: products; Owner: estation
--

COMMENT ON COLUMN products.datasource_description.release_position IS 'In case of:
FIXED - integer value of the start position of the Release

DELIMITED - comma-separated integers indicating the delimiter positions of the Release to concatinate.';


--
-- TOC entry 4153 (class 0 OID 0)
-- Dependencies: 215
-- Name: COLUMN datasource_description.release_length; Type: COMMENT; Schema: products; Owner: estation
--

COMMENT ON COLUMN products.datasource_description.release_length IS 'In case of FIXED format this field indicates the string length to take starting from the release_position.';


--
-- TOC entry 216 (class 1259 OID 100523)
-- Name: date_format; Type: TABLE; Schema: products; Owner: estation
--

CREATE TABLE products.date_format (
    date_format character varying NOT NULL,
    definition character varying
);


ALTER TABLE products.date_format OWNER TO estation;

--
-- TOC entry 4154 (class 0 OID 0)
-- Dependencies: 216
-- Name: COLUMN date_format.date_format; Type: COMMENT; Schema: products; Owner: estation
--

COMMENT ON COLUMN products.date_format.date_format IS 'A string, case insensitive, in YYYYMMDD, YYYYMMDDHHMM,YYYY,MMDD,HHMM. HHMM (may be used for MSG 15 minutes synthesis). This list may change with the project life. It is maintained by JRC';


--
-- TOC entry 4155 (class 0 OID 0)
-- Dependencies: 216
-- Name: COLUMN date_format.definition; Type: COMMENT; Schema: products; Owner: estation
--

COMMENT ON COLUMN products.date_format.definition IS 'A text defining the date type.';


--
-- TOC entry 217 (class 1259 OID 100529)
-- Name: db_version; Type: TABLE; Schema: products; Owner: estation
--

CREATE TABLE products.db_version (
    db_version integer NOT NULL
);


ALTER TABLE products.db_version OWNER TO estation;

--
-- TOC entry 218 (class 1259 OID 100532)
-- Name: ecoagris; Type: TABLE; Schema: products; Owner: estation
--

CREATE TABLE products.ecoagris (
    recordid integer NOT NULL,
    productcode character varying NOT NULL,
    subproductcode character varying NOT NULL,
    version character varying NOT NULL,
    mapsetcode character varying NOT NULL,
    product_descriptive_name character varying(255),
    product_description character varying,
    provider character varying,
    regionid character varying,
    regionlevel character varying,
    aggregation_type character varying DEFAULT 'mean'::character varying,
    aggregation_min double precision,
    aggregation_max double precision,
    product_dateformat character varying NOT NULL,
    product_date character varying,
    tsvalue double precision
);


ALTER TABLE products.ecoagris OWNER TO estation;

--
-- TOC entry 219 (class 1259 OID 100539)
-- Name: ecoagris_recordid_seq; Type: SEQUENCE; Schema: products; Owner: estation
--

CREATE SEQUENCE products.ecoagris_recordid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE products.ecoagris_recordid_seq OWNER TO estation;

--
-- TOC entry 4156 (class 0 OID 0)
-- Dependencies: 219
-- Name: ecoagris_recordid_seq; Type: SEQUENCE OWNED BY; Schema: products; Owner: estation
--

ALTER SEQUENCE products.ecoagris_recordid_seq OWNED BY products.ecoagris.recordid;


--
-- TOC entry 220 (class 1259 OID 100541)
-- Name: eumetcast_source; Type: TABLE; Schema: products; Owner: estation
--

CREATE TABLE products.eumetcast_source (
    eumetcast_id character varying NOT NULL,
    filter_expression_jrc character varying,
    collection_name character varying,
    status boolean DEFAULT false NOT NULL,
    internal_identifier character varying,
    collection_reference character varying,
    acronym character varying,
    description character varying,
    product_status character varying,
    date_creation date,
    date_revision date,
    date_publication date,
    west_bound_longitude double precision,
    east_bound_longitude double precision,
    north_bound_latitude double precision,
    south_bound_latitude double precision,
    provider_short_name character varying,
    collection_type character varying,
    keywords_distribution character varying,
    keywords_theme character varying,
    keywords_societal_benefit_area character varying,
    orbit_type character varying,
    satellite character varying,
    satellite_description character varying,
    instrument character varying,
    spatial_coverage character varying,
    thumbnails character varying,
    online_resources character varying,
    distribution character varying,
    channels character varying,
    data_access character varying,
    available_format character varying,
    version character varying,
    typical_file_name character varying,
    average_file_size character varying,
    frequency character varying,
    legal_constraints_access_constraint character varying,
    legal_use_constraint character varying,
    legal_constraints_data_policy character varying,
    entry_date date,
    reference_file character varying,
    datasource_descr_id character varying,
    defined_by character varying
);


ALTER TABLE products.eumetcast_source OWNER TO estation;

--
-- TOC entry 4157 (class 0 OID 0)
-- Dependencies: 220
-- Name: COLUMN eumetcast_source.status; Type: COMMENT; Schema: products; Owner: estation
--

COMMENT ON COLUMN products.eumetcast_source.status IS 'On/Off
Active/Non active';


--
-- TOC entry 221 (class 1259 OID 100548)
-- Name: frequency; Type: TABLE; Schema: products; Owner: estation
--

CREATE TABLE products.frequency (
    frequency_id character varying NOT NULL,
    time_unit character varying(10) NOT NULL,
    frequency real NOT NULL,
    frequency_type character varying(1) DEFAULT 'E'::character varying NOT NULL,
    description character varying
);


ALTER TABLE products.frequency OWNER TO estation;

--
-- TOC entry 4158 (class 0 OID 0)
-- Dependencies: 221
-- Name: COLUMN frequency.frequency_id; Type: COMMENT; Schema: products; Owner: estation
--

COMMENT ON COLUMN products.frequency.frequency_id IS 'A string, case insensitive, indicating the time-span that the product represents (is distributed):
undefined
INSTANTANEOUS
DEKAD!=10-days
8days
1month
1week
24hours (for MSG products)
1year';


--
-- TOC entry 4159 (class 0 OID 0)
-- Dependencies: 221
-- Name: COLUMN frequency.frequency_type; Type: COMMENT; Schema: products; Owner: estation
--

COMMENT ON COLUMN products.frequency.frequency_type IS 'Binary flag indicating:
- every Nth ''Time Unit'' (every 15th  = ogni 15 min)
- N per ''Time Unit'' (4 per hour)

Values:
E = every
P = per';


--
-- TOC entry 222 (class 1259 OID 100555)
-- Name: geoserver; Type: TABLE; Schema: products; Owner: estation
--

CREATE TABLE products.geoserver (
    geoserver_id integer NOT NULL,
    productcode character varying NOT NULL,
    subproductcode character varying NOT NULL,
    version character varying NOT NULL,
    defined_by character varying NOT NULL,
    activated boolean DEFAULT false NOT NULL,
    startdate bigint,
    enddate bigint
);


ALTER TABLE products.geoserver OWNER TO estation;

--
-- TOC entry 4160 (class 0 OID 0)
-- Dependencies: 222
-- Name: TABLE geoserver; Type: COMMENT; Schema: products; Owner: estation
--

COMMENT ON TABLE products.geoserver IS 'Define which products/versions/subproducts have to be synchronized.';


--
-- TOC entry 223 (class 1259 OID 100562)
-- Name: geoserver_geoserver_id_seq; Type: SEQUENCE; Schema: products; Owner: estation
--

CREATE SEQUENCE products.geoserver_geoserver_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE products.geoserver_geoserver_id_seq OWNER TO estation;

--
-- TOC entry 4161 (class 0 OID 0)
-- Dependencies: 223
-- Name: geoserver_geoserver_id_seq; Type: SEQUENCE OWNED BY; Schema: products; Owner: estation
--

ALTER SEQUENCE products.geoserver_geoserver_id_seq OWNED BY products.geoserver.geoserver_id;


--
-- TOC entry 224 (class 1259 OID 100564)
-- Name: ingestion; Type: TABLE; Schema: products; Owner: estation
--

CREATE TABLE products.ingestion (
    productcode character varying NOT NULL,
    subproductcode character varying NOT NULL,
    version character varying NOT NULL,
    mapsetcode character varying NOT NULL,
    defined_by character varying NOT NULL,
    activated boolean DEFAULT false NOT NULL,
    wait_for_all_files boolean NOT NULL,
    input_to_process_re character varying,
    enabled boolean DEFAULT false NOT NULL
);


ALTER TABLE products.ingestion OWNER TO estation;

--
-- TOC entry 4162 (class 0 OID 0)
-- Dependencies: 224
-- Name: TABLE ingestion; Type: COMMENT; Schema: products; Owner: estation
--

COMMENT ON TABLE products.ingestion IS 'Define which products/versions have to be ingested, and for which mapsets.';


--
-- TOC entry 4163 (class 0 OID 0)
-- Dependencies: 224
-- Name: COLUMN ingestion.defined_by; Type: COMMENT; Schema: products; Owner: estation
--

COMMENT ON COLUMN products.ingestion.defined_by IS 'values: JRC or USER';


--
-- TOC entry 4164 (class 0 OID 0)
-- Dependencies: 224
-- Name: COLUMN ingestion.wait_for_all_files; Type: COMMENT; Schema: products; Owner: estation
--

COMMENT ON COLUMN products.ingestion.wait_for_all_files IS 'When incomming files need to be mosaicked
this boolean when TRUE, will indicate to ingestion to wait for all the needed files to come in before mosaicking. When FALSE mosaicking will be done even if not all files arrived.';


--
-- TOC entry 225 (class 1259 OID 100572)
-- Name: internet_source; Type: TABLE; Schema: products; Owner: estation
--

CREATE TABLE products.internet_source (
    internet_id character varying NOT NULL,
    defined_by character varying DEFAULT 'JRC'::character varying NOT NULL,
    descriptive_name character varying,
    description character varying,
    modified_by character varying,
    update_datetime timestamp without time zone DEFAULT now(),
    url character varying,
    user_name character varying,
    password character varying,
    type character varying,
    include_files_expression character varying,
    files_filter_expression character varying,
    status boolean DEFAULT false NOT NULL,
    pull_frequency integer,
    datasource_descr_id character varying,
    frequency_id character varying,
    start_date bigint,
    end_date bigint,
    https_params character varying
);


ALTER TABLE products.internet_source OWNER TO estation;

--
-- TOC entry 4165 (class 0 OID 0)
-- Dependencies: 225
-- Name: COLUMN internet_source.defined_by; Type: COMMENT; Schema: products; Owner: estation
--

COMMENT ON COLUMN products.internet_source.defined_by IS 'values: JRC or USER';


--
-- TOC entry 4166 (class 0 OID 0)
-- Dependencies: 225
-- Name: COLUMN internet_source.modified_by; Type: COMMENT; Schema: products; Owner: estation
--

COMMENT ON COLUMN products.internet_source.modified_by IS 'Username as value';


--
-- TOC entry 4167 (class 0 OID 0)
-- Dependencies: 225
-- Name: COLUMN internet_source.status; Type: COMMENT; Schema: products; Owner: estation
--

COMMENT ON COLUMN products.internet_source.status IS 'On/Off
Active/Non active';


--
-- TOC entry 4168 (class 0 OID 0)
-- Dependencies: 225
-- Name: COLUMN internet_source.pull_frequency; Type: COMMENT; Schema: products; Owner: estation
--

COMMENT ON COLUMN products.internet_source.pull_frequency IS 'In seconds';


--
-- TOC entry 226 (class 1259 OID 100581)
-- Name: mapset; Type: TABLE; Schema: products; Owner: estation
--

CREATE TABLE products.mapset (
    mapsetcode character varying NOT NULL,
    descriptive_name character varying NOT NULL,
    description character varying,
    defined_by character varying NOT NULL,
    proj_code character varying,
    resolutioncode character varying,
    bboxcode character varying,
    pixel_size_x integer,
    pixel_size_y integer,
    footprint_image text,
    center_of_pixel boolean DEFAULT false
);


ALTER TABLE products.mapset OWNER TO estation;

--
-- TOC entry 4169 (class 0 OID 0)
-- Dependencies: 226
-- Name: COLUMN mapset.defined_by; Type: COMMENT; Schema: products; Owner: estation
--

COMMENT ON COLUMN products.mapset.defined_by IS 'values: JRC or USER';


--
-- TOC entry 227 (class 1259 OID 100588)
-- Name: process_product; Type: TABLE; Schema: products; Owner: estation
--

CREATE TABLE products.process_product (
    process_id integer NOT NULL,
    productcode character varying NOT NULL,
    subproductcode character varying NOT NULL,
    version character varying NOT NULL,
    mapsetcode character varying NOT NULL,
    type character varying NOT NULL,
    activated boolean NOT NULL,
    final boolean NOT NULL,
    date_format character varying,
    start_date bigint,
    end_date bigint
);


ALTER TABLE products.process_product OWNER TO estation;

--
-- TOC entry 228 (class 1259 OID 100594)
-- Name: processing; Type: TABLE; Schema: products; Owner: estation
--

CREATE TABLE products.processing (
    process_id integer NOT NULL,
    defined_by character varying NOT NULL,
    output_mapsetcode character varying NOT NULL,
    activated boolean DEFAULT false NOT NULL,
    derivation_method character varying NOT NULL,
    algorithm character varying NOT NULL,
    priority character varying NOT NULL,
    enabled boolean DEFAULT false NOT NULL
);


ALTER TABLE products.processing OWNER TO estation;

--
-- TOC entry 229 (class 1259 OID 100602)
-- Name: product; Type: TABLE; Schema: products; Owner: estation
--

CREATE TABLE products.product (
    productcode character varying NOT NULL,
    version character varying NOT NULL,
    defined_by character varying NOT NULL,
    activated boolean DEFAULT false NOT NULL,
    category_id character varying NOT NULL,
    descriptive_name character varying(255),
    description character varying,
    provider character varying,
    masked boolean NOT NULL,
    acquisition_period character varying,
    keyword character varying,
    spatial_repres character varying,
    citation character varying,
    access_constraints character varying,
    use_constraints character varying
);


ALTER TABLE products.product OWNER TO estation;

--
-- TOC entry 4170 (class 0 OID 0)
-- Dependencies: 229
-- Name: COLUMN product.defined_by; Type: COMMENT; Schema: products; Owner: estation
--

COMMENT ON COLUMN products.product.defined_by IS 'values: JRC or USER';


--
-- TOC entry 4171 (class 0 OID 0)
-- Dependencies: 229
-- Name: COLUMN product.descriptive_name; Type: COMMENT; Schema: products; Owner: estation
--

COMMENT ON COLUMN products.product.descriptive_name IS 'A clear and descriptive name of the product.';


--
-- TOC entry 230 (class 1259 OID 100609)
-- Name: product_category; Type: TABLE; Schema: products; Owner: estation
--

CREATE TABLE products.product_category (
    category_id character varying NOT NULL,
    descriptive_name character varying,
    order_index integer
);


ALTER TABLE products.product_category OWNER TO estation;

--
-- TOC entry 231 (class 1259 OID 100615)
-- Name: projection; Type: TABLE; Schema: products; Owner: estation
--

CREATE TABLE products.projection (
    proj_code character varying NOT NULL,
    descriptive_name character varying,
    description character varying,
    srs_wkt character varying
);


ALTER TABLE products.projection OWNER TO estation;

--
-- TOC entry 232 (class 1259 OID 100621)
-- Name: resolution; Type: TABLE; Schema: products; Owner: estation
--

CREATE TABLE products.resolution (
    resolutioncode character varying NOT NULL,
    descriptive_name character varying,
    description character varying,
    pixel_shift_long double precision,
    pixel_shift_lat double precision
);


ALTER TABLE products.resolution OWNER TO estation;

--
-- TOC entry 233 (class 1259 OID 100627)
-- Name: spirits; Type: TABLE; Schema: products; Owner: estation
--

CREATE TABLE products.spirits (
    productcode character varying NOT NULL,
    subproductcode character varying NOT NULL,
    version character varying NOT NULL,
    mapsetcode character varying,
    prod_values character varying,
    flags character varying,
    data_ignore_value integer,
    days integer,
    start_date integer,
    end_date integer,
    sensor_type character varying,
    comment character varying,
    sensor_filename_prefix character varying,
    frequency_filename_prefix character varying,
    product_anomaly_filename_prefix character varying,
    activated boolean DEFAULT false NOT NULL,
    out_data_type character varying,
    out_scale_factor double precision,
    out_offset double precision
);


ALTER TABLE products.spirits OWNER TO estation;

--
-- TOC entry 234 (class 1259 OID 100634)
-- Name: sub_datasource_description; Type: TABLE; Schema: products; Owner: estation
--

CREATE TABLE products.sub_datasource_description (
    productcode character varying NOT NULL,
    subproductcode character varying NOT NULL,
    version character varying NOT NULL,
    datasource_descr_id character varying NOT NULL,
    scale_factor double precision NOT NULL,
    scale_offset double precision NOT NULL,
    no_data double precision,
    data_type_id character varying NOT NULL,
    mask_min double precision,
    mask_max double precision,
    re_process character varying,
    re_extract character varying,
    scale_type character varying DEFAULT 'linear'::character varying
);


ALTER TABLE products.sub_datasource_description OWNER TO estation;

--
-- TOC entry 235 (class 1259 OID 100641)
-- Name: sub_product; Type: TABLE; Schema: products; Owner: estation
--

CREATE TABLE products.sub_product (
    productcode character varying NOT NULL,
    subproductcode character varying NOT NULL,
    version character varying NOT NULL,
    defined_by character varying NOT NULL,
    product_type character varying,
    descriptive_name character varying(255),
    description character varying,
    frequency_id character varying NOT NULL,
    date_format character varying NOT NULL,
    scale_factor double precision,
    scale_offset double precision,
    nodata bigint,
    mask_min double precision,
    mask_max double precision,
    unit character varying,
    data_type_id character varying NOT NULL,
    masked boolean NOT NULL,
    timeseries_role character varying,
    display_index integer,
    update_frequency character varying,
    reference character varying,
    keywords character varying,
    use_conditions character varying,
    quality_scope character varying,
    quality_title character varying,
    quality_explanation character varying,
    quality_statement character varying,
    spatial_repres character varying,
    resource_url character varying
);


ALTER TABLE products.sub_product OWNER TO estation;

--
-- TOC entry 4172 (class 0 OID 0)
-- Dependencies: 235
-- Name: COLUMN sub_product.defined_by; Type: COMMENT; Schema: products; Owner: estation
--

COMMENT ON COLUMN products.sub_product.defined_by IS 'values: JRC or USER';


--
-- TOC entry 4173 (class 0 OID 0)
-- Dependencies: 235
-- Name: COLUMN sub_product.product_type; Type: COMMENT; Schema: products; Owner: estation
--

COMMENT ON COLUMN products.sub_product.product_type IS 'A product can be of type Native, Ingest or Derived.';


--
-- TOC entry 4174 (class 0 OID 0)
-- Dependencies: 235
-- Name: COLUMN sub_product.descriptive_name; Type: COMMENT; Schema: products; Owner: estation
--

COMMENT ON COLUMN products.sub_product.descriptive_name IS 'A clear and descriptive name of the product.';


--
-- TOC entry 4175 (class 0 OID 0)
-- Dependencies: 235
-- Name: COLUMN sub_product.frequency_id; Type: COMMENT; Schema: products; Owner: estation
--

COMMENT ON COLUMN products.sub_product.frequency_id IS 'A string, case insensitive, indicating the time-span that the product represents (is distributed): \nundefined\nINSTANTANEOUS\nDEKAD!=10-days\n8days\n1month\n1week\n24hours (for MSG products)\n1year';


--
-- TOC entry 4176 (class 0 OID 0)
-- Dependencies: 235
-- Name: COLUMN sub_product.date_format; Type: COMMENT; Schema: products; Owner: estation
--

COMMENT ON COLUMN products.sub_product.date_format IS 'A string, case insensitive, in YYYYMMDD, YYYYMMDDHHMM,YYYY,MMDD,HHMM. HHMM (may be used for MSG 15 minutes synthesis). This list may change with the project life. It is maintained by JRC';


--
-- TOC entry 4177 (class 0 OID 0)
-- Dependencies: 235
-- Name: COLUMN sub_product.timeseries_role; Type: COMMENT; Schema: products; Owner: estation
--

COMMENT ON COLUMN products.sub_product.timeseries_role IS 'Defines the role of the product in TS:\n<empty> or Null -> not considered\n''Initial'' -> it is represented as ''base'' TS (YYYYMMDD date type)\n<subproductcode> -> it is represented as ''derived'' from the <subproductcode> (which must be ''Initial'')';


--
-- TOC entry 236 (class 1259 OID 100647)
-- Name: thema; Type: TABLE; Schema: products; Owner: estation
--

CREATE TABLE products.thema (
    thema_id character varying NOT NULL,
    description character varying NOT NULL,
    activated boolean DEFAULT false
);


ALTER TABLE products.thema OWNER TO estation;

--
-- TOC entry 237 (class 1259 OID 100654)
-- Name: thema_product; Type: TABLE; Schema: products; Owner: estation
--

CREATE TABLE products.thema_product (
    thema_id character varying NOT NULL,
    productcode character varying NOT NULL,
    version character varying NOT NULL,
    mapsetcode character varying NOT NULL,
    activated boolean NOT NULL
);


ALTER TABLE products.thema_product OWNER TO estation;

--
-- TOC entry 3903 (class 2604 OID 100660)
-- Name: ecoagris recordid; Type: DEFAULT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.ecoagris ALTER COLUMN recordid SET DEFAULT nextval('products.ecoagris_recordid_seq'::regclass);


--
-- TOC entry 3907 (class 2604 OID 100661)
-- Name: geoserver geoserver_id; Type: DEFAULT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.geoserver ALTER COLUMN geoserver_id SET DEFAULT nextval('products.geoserver_geoserver_id_seq'::regclass);


--
-- TOC entry 3923 (class 2606 OID 100663)
-- Name: bbox bbox_pk; Type: CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.bbox
    ADD CONSTRAINT bbox_pk PRIMARY KEY (bboxcode);


--
-- TOC entry 3925 (class 2606 OID 100665)
-- Name: data_type data_type_pk; Type: CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.data_type
    ADD CONSTRAINT data_type_pk PRIMARY KEY (data_type_id);


--
-- TOC entry 3927 (class 2606 OID 100667)
-- Name: datasource_description datasource_description_pk; Type: CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.datasource_description
    ADD CONSTRAINT datasource_description_pk PRIMARY KEY (datasource_descr_id);


--
-- TOC entry 3929 (class 2606 OID 100669)
-- Name: date_format date_format_pk; Type: CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.date_format
    ADD CONSTRAINT date_format_pk PRIMARY KEY (date_format);


--
-- TOC entry 3931 (class 2606 OID 100671)
-- Name: db_version db_version_pk; Type: CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.db_version
    ADD CONSTRAINT db_version_pk PRIMARY KEY (db_version);


--
-- TOC entry 3933 (class 2606 OID 100673)
-- Name: ecoagris ecoagris_pk; Type: CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.ecoagris
    ADD CONSTRAINT ecoagris_pk PRIMARY KEY (recordid);


--
-- TOC entry 3935 (class 2606 OID 100675)
-- Name: eumetcast_source eumetcast_source_pk; Type: CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.eumetcast_source
    ADD CONSTRAINT eumetcast_source_pk PRIMARY KEY (eumetcast_id);


--
-- TOC entry 3937 (class 2606 OID 100677)
-- Name: frequency frequency_pk; Type: CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.frequency
    ADD CONSTRAINT frequency_pk PRIMARY KEY (frequency_id);


--
-- TOC entry 3939 (class 2606 OID 100679)
-- Name: geoserver geoserver_pk; Type: CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.geoserver
    ADD CONSTRAINT geoserver_pk PRIMARY KEY (geoserver_id);


--
-- TOC entry 3942 (class 2606 OID 100681)
-- Name: ingestion ingestion_pk; Type: CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.ingestion
    ADD CONSTRAINT ingestion_pk PRIMARY KEY (productcode, subproductcode, version, mapsetcode);


--
-- TOC entry 3944 (class 2606 OID 100683)
-- Name: internet_source internet_source_pk; Type: CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.internet_source
    ADD CONSTRAINT internet_source_pk PRIMARY KEY (internet_id);


--
-- TOC entry 3946 (class 2606 OID 100685)
-- Name: mapset mapset_new_pk; Type: CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.mapset
    ADD CONSTRAINT mapset_new_pk PRIMARY KEY (mapsetcode);


--
-- TOC entry 3948 (class 2606 OID 100687)
-- Name: process_product process_input_product_pk; Type: CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.process_product
    ADD CONSTRAINT process_input_product_pk PRIMARY KEY (process_id, productcode, subproductcode, version, mapsetcode);


--
-- TOC entry 3950 (class 2606 OID 100689)
-- Name: processing processing_pk; Type: CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.processing
    ADD CONSTRAINT processing_pk PRIMARY KEY (process_id);


--
-- TOC entry 3921 (class 2606 OID 100691)
-- Name: acquisition product_acquisition_data_source_pk; Type: CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.acquisition
    ADD CONSTRAINT product_acquisition_data_source_pk PRIMARY KEY (productcode, version, data_source_id);


--
-- TOC entry 3955 (class 2606 OID 100693)
-- Name: product_category product_category_pk; Type: CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.product_category
    ADD CONSTRAINT product_category_pk PRIMARY KEY (category_id);


--
-- TOC entry 3952 (class 2606 OID 115740)
-- Name: product product_pk; Type: CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.product
    ADD CONSTRAINT product_pk PRIMARY KEY (productcode, version);


--
-- TOC entry 3958 (class 2606 OID 100697)
-- Name: projection projection_pk; Type: CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.projection
    ADD CONSTRAINT projection_pk PRIMARY KEY (proj_code);


--
-- TOC entry 3960 (class 2606 OID 100699)
-- Name: resolution resolution_pk; Type: CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.resolution
    ADD CONSTRAINT resolution_pk PRIMARY KEY (resolutioncode);


--
-- TOC entry 3962 (class 2606 OID 100701)
-- Name: spirits spirits_pk; Type: CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.spirits
    ADD CONSTRAINT spirits_pk PRIMARY KEY (productcode, subproductcode, version);


--
-- TOC entry 3964 (class 2606 OID 100703)
-- Name: sub_datasource_description sub_datasource_description_pk; Type: CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.sub_datasource_description
    ADD CONSTRAINT sub_datasource_description_pk PRIMARY KEY (productcode, subproductcode, version, datasource_descr_id);


--
-- TOC entry 3966 (class 2606 OID 100695)
-- Name: sub_product sub_product_pk; Type: CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.sub_product
    ADD CONSTRAINT sub_product_pk PRIMARY KEY (productcode, subproductcode, version);


--
-- TOC entry 3968 (class 2606 OID 100705)
-- Name: thema thema_pk; Type: CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.thema
    ADD CONSTRAINT thema_pk PRIMARY KEY (thema_id);


--
-- TOC entry 3970 (class 2606 OID 100707)
-- Name: thema_product thema_product_pk; Type: CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.thema_product
    ADD CONSTRAINT thema_product_pk PRIMARY KEY (thema_id, productcode, version, mapsetcode);


--
-- TOC entry 3940 (class 1259 OID 100710)
-- Name: ingestion_mapsetcode_idx; Type: INDEX; Schema: products; Owner: estation
--

CREATE INDEX ingestion_mapsetcode_idx ON products.ingestion USING btree (mapsetcode);


--
-- TOC entry 3953 (class 1259 OID 100711)
-- Name: product_categories_order_index_key; Type: INDEX; Schema: products; Owner: estation
--

CREATE UNIQUE INDEX product_categories_order_index_key ON products.product_category USING btree (order_index);


--
-- TOC entry 3956 (class 1259 OID 100712)
-- Name: unique_product_category_name; Type: INDEX; Schema: products; Owner: estation
--

CREATE UNIQUE INDEX unique_product_category_name ON products.product_category USING btree (descriptive_name);


--
-- TOC entry 4001 (class 2620 OID 100713)
-- Name: ingestion check_update; Type: TRIGGER; Schema: products; Owner: estation
--

CREATE TRIGGER check_update BEFORE UPDATE ON products.ingestion FOR EACH ROW WHEN (((old.enabled IS DISTINCT FROM new.enabled) OR (old.activated IS DISTINCT FROM new.activated))) EXECUTE FUNCTION products.deactivate_ingestion_when_disabled();


--
-- TOC entry 4000 (class 2620 OID 100714)
-- Name: eumetcast_source insert_eumetcast_source; Type: TRIGGER; Schema: products; Owner: estation
--

CREATE TRIGGER insert_eumetcast_source BEFORE INSERT ON products.eumetcast_source FOR EACH ROW EXECUTE FUNCTION products.check_eumetcast_source_datasource_description();


--
-- TOC entry 4002 (class 2620 OID 100715)
-- Name: ingestion insert_ingestion; Type: TRIGGER; Schema: products; Owner: estation
--

CREATE TRIGGER insert_ingestion BEFORE INSERT ON products.ingestion FOR EACH ROW EXECUTE FUNCTION products.deactivate_ingestion_when_disabled();


--
-- TOC entry 4003 (class 2620 OID 100716)
-- Name: internet_source insert_internet_source; Type: TRIGGER; Schema: products; Owner: estation
--

CREATE TRIGGER insert_internet_source BEFORE INSERT ON products.internet_source FOR EACH ROW EXECUTE FUNCTION products.check_internet_source_datasource_description();


--
-- TOC entry 4004 (class 2620 OID 100717)
-- Name: internet_source update_internet_source; Type: TRIGGER; Schema: products; Owner: estation
--

CREATE TRIGGER update_internet_source BEFORE UPDATE ON products.internet_source FOR EACH ROW EXECUTE FUNCTION products.check_update_internet_source();


--
-- TOC entry 3994 (class 2606 OID 100718)
-- Name: sub_product data_type_product_fk_0; Type: FK CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.sub_product
    ADD CONSTRAINT data_type_product_fk_0 FOREIGN KEY (data_type_id) REFERENCES products.data_type(data_type_id) ON UPDATE RESTRICT ON DELETE SET NULL;


--
-- TOC entry 3991 (class 2606 OID 100723)
-- Name: sub_datasource_description data_type_sub_datasource_description_fk; Type: FK CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.sub_datasource_description
    ADD CONSTRAINT data_type_sub_datasource_description_fk FOREIGN KEY (data_type_id) REFERENCES products.data_type(data_type_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 3974 (class 2606 OID 100728)
-- Name: eumetcast_source datasource_description_eumetcast_source_fk; Type: FK CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.eumetcast_source
    ADD CONSTRAINT datasource_description_eumetcast_source_fk FOREIGN KEY (datasource_descr_id) REFERENCES products.datasource_description(datasource_descr_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3978 (class 2606 OID 100733)
-- Name: internet_source datasource_description_internet_source_fk; Type: FK CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.internet_source
    ADD CONSTRAINT datasource_description_internet_source_fk FOREIGN KEY (datasource_descr_id) REFERENCES products.datasource_description(datasource_descr_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3992 (class 2606 OID 100738)
-- Name: sub_datasource_description datasource_description_sub_datasource_description_fk; Type: FK CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.sub_datasource_description
    ADD CONSTRAINT datasource_description_sub_datasource_description_fk FOREIGN KEY (datasource_descr_id) REFERENCES products.datasource_description(datasource_descr_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 3983 (class 2606 OID 100743)
-- Name: process_product date_format_process_product_fk; Type: FK CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.process_product
    ADD CONSTRAINT date_format_process_product_fk FOREIGN KEY (date_format) REFERENCES products.date_format(date_format) ON UPDATE RESTRICT ON DELETE SET NULL;


--
-- TOC entry 3972 (class 2606 OID 100748)
-- Name: datasource_description dateformat_datasource_description_fk; Type: FK CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.datasource_description
    ADD CONSTRAINT dateformat_datasource_description_fk FOREIGN KEY (date_format) REFERENCES products.date_format(date_format) ON UPDATE RESTRICT ON DELETE SET NULL;


--
-- TOC entry 3995 (class 2606 OID 100753)
-- Name: sub_product datetype_product_fk_0; Type: FK CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.sub_product
    ADD CONSTRAINT datetype_product_fk_0 FOREIGN KEY (date_format) REFERENCES products.date_format(date_format) ON UPDATE RESTRICT ON DELETE SET NULL;


--
-- TOC entry 3996 (class 2606 OID 100758)
-- Name: sub_product distribution_frequency_product_fk_0; Type: FK CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.sub_product
    ADD CONSTRAINT distribution_frequency_product_fk_0 FOREIGN KEY (frequency_id) REFERENCES products.frequency(frequency_id) ON UPDATE RESTRICT ON DELETE SET NULL;


--
-- TOC entry 3997 (class 2606 OID 115751)
-- Name: sub_product fk_sub_product_product; Type: FK CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.sub_product
    ADD CONSTRAINT fk_sub_product_product FOREIGN KEY (productcode, version) REFERENCES products.product(productcode, version) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;


--
-- TOC entry 3979 (class 2606 OID 100768)
-- Name: internet_source frequency_internet_source_fk; Type: FK CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.internet_source
    ADD CONSTRAINT frequency_internet_source_fk FOREIGN KEY (frequency_id) REFERENCES products.frequency(frequency_id) ON UPDATE RESTRICT ON DELETE SET NULL;


--
-- TOC entry 3980 (class 2606 OID 100773)
-- Name: mapset mapset_new_bbox_fk; Type: FK CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.mapset
    ADD CONSTRAINT mapset_new_bbox_fk FOREIGN KEY (bboxcode) REFERENCES products.bbox(bboxcode) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3973 (class 2606 OID 100778)
-- Name: datasource_description mapset_new_datasource_description_fk; Type: FK CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.datasource_description
    ADD CONSTRAINT mapset_new_datasource_description_fk FOREIGN KEY (native_mapset) REFERENCES products.mapset(mapsetcode) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3976 (class 2606 OID 100783)
-- Name: ingestion mapset_new_ingestion_fk; Type: FK CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.ingestion
    ADD CONSTRAINT mapset_new_ingestion_fk FOREIGN KEY (mapsetcode) REFERENCES products.mapset(mapsetcode) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3984 (class 2606 OID 100788)
-- Name: process_product mapset_new_process_input_product_fk; Type: FK CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.process_product
    ADD CONSTRAINT mapset_new_process_input_product_fk FOREIGN KEY (mapsetcode) REFERENCES products.mapset(mapsetcode) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3987 (class 2606 OID 100793)
-- Name: processing mapset_new_processing_fk; Type: FK CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.processing
    ADD CONSTRAINT mapset_new_processing_fk FOREIGN KEY (output_mapsetcode) REFERENCES products.mapset(mapsetcode) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3981 (class 2606 OID 100798)
-- Name: mapset mapset_new_projection_fk; Type: FK CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.mapset
    ADD CONSTRAINT mapset_new_projection_fk FOREIGN KEY (proj_code) REFERENCES products.projection(proj_code) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3982 (class 2606 OID 100803)
-- Name: mapset mapset_new_resolution_fk; Type: FK CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.mapset
    ADD CONSTRAINT mapset_new_resolution_fk FOREIGN KEY (resolutioncode) REFERENCES products.resolution(resolutioncode) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3989 (class 2606 OID 100808)
-- Name: spirits mapset_new_spirits_fk; Type: FK CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.spirits
    ADD CONSTRAINT mapset_new_spirits_fk FOREIGN KEY (mapsetcode) REFERENCES products.mapset(mapsetcode) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3998 (class 2606 OID 100813)
-- Name: thema_product mapset_new_thema_product_fk; Type: FK CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.thema_product
    ADD CONSTRAINT mapset_new_thema_product_fk FOREIGN KEY (mapsetcode) REFERENCES products.mapset(mapsetcode) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3985 (class 2606 OID 100818)
-- Name: process_product processing_dependencies_fk; Type: FK CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.process_product
    ADD CONSTRAINT processing_dependencies_fk FOREIGN KEY (process_id) REFERENCES products.processing(process_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3971 (class 2606 OID 115746)
-- Name: acquisition product_acquisition_fk; Type: FK CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.acquisition
    ADD CONSTRAINT product_acquisition_fk FOREIGN KEY (productcode, version) REFERENCES products.product(productcode, version) ON UPDATE CASCADE ON DELETE CASCADE NOT VALID;


--
-- TOC entry 3988 (class 2606 OID 100823)
-- Name: product product_category_product_fk_0; Type: FK CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.product
    ADD CONSTRAINT product_category_product_fk_0 FOREIGN KEY (category_id) REFERENCES products.product_category(category_id) ON UPDATE RESTRICT ON DELETE SET NULL;


--
-- TOC entry 3975 (class 2606 OID 100828)
-- Name: geoserver product_geoserver_fk; Type: FK CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.geoserver
    ADD CONSTRAINT product_geoserver_fk FOREIGN KEY (productcode, version, subproductcode) REFERENCES products.sub_product(productcode, version, subproductcode) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3990 (class 2606 OID 100838)
-- Name: spirits spirits_product_fk; Type: FK CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.spirits
    ADD CONSTRAINT spirits_product_fk FOREIGN KEY (productcode, version, subproductcode) REFERENCES products.sub_product(productcode, version, subproductcode) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3986 (class 2606 OID 100843)
-- Name: process_product sub_product_dependencies_fk; Type: FK CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.process_product
    ADD CONSTRAINT sub_product_dependencies_fk FOREIGN KEY (productcode, version, subproductcode) REFERENCES products.sub_product(productcode, version, subproductcode) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3977 (class 2606 OID 100848)
-- Name: ingestion sub_product_ingestion_fk; Type: FK CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.ingestion
    ADD CONSTRAINT sub_product_ingestion_fk FOREIGN KEY (productcode, version, subproductcode) REFERENCES products.sub_product(productcode, version, subproductcode) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3993 (class 2606 OID 100853)
-- Name: sub_datasource_description sub_product_sub_datasource_description_fk; Type: FK CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.sub_datasource_description
    ADD CONSTRAINT sub_product_sub_datasource_description_fk FOREIGN KEY (productcode, version, subproductcode) REFERENCES products.sub_product(productcode, version, subproductcode) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3999 (class 2606 OID 100858)
-- Name: thema_product thema_thema_product_fk; Type: FK CONSTRAINT; Schema: products; Owner: estation
--

ALTER TABLE ONLY products.thema_product
    ADD CONSTRAINT thema_thema_product_fk FOREIGN KEY (thema_id) REFERENCES products.thema(thema_id) ON UPDATE CASCADE ON DELETE CASCADE;


-- Completed on 2021-03-09 15:03:32 CET

--
-- PostgreSQL database dump complete
--


--
-- TOC entry 7 (class 2615 OID 99355)
-- Name: analysis; Type: SCHEMA; Schema: -; Owner: estation
--

CREATE SCHEMA analysis;


ALTER SCHEMA analysis OWNER TO estation;

--
-- TOC entry 1009 (class 1255 OID 100397)
-- Name: copylegend(bigint, text); Type: FUNCTION; Schema: analysis; Owner: estation
--

CREATE FUNCTION analysis.copylegend(tocopylegendid bigint, newlegendname text) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    newlegendid INT8;
BEGIN

  PERFORM nextval('analysis.legend_legend_id_seq');
  SELECT INTO newlegendid currval('analysis.legend_legend_id_seq');

  INSERT INTO analysis.legend (legend_id, legend_name, step_type, min_value, max_value, min_real_value, max_real_value, colorbar, step, step_range_from, step_range_to, unit )
  (SELECT newlegendid, legend_name, step_type, min_value, max_value, min_real_value, max_real_value, newlegendname, step, step_range_from, step_range_to, unit
   FROM analysis.legend
   WHERE legend_id = tocopylegendid );

  INSERT INTO analysis.legend_step ( legend_id, from_step, to_step, color_rgb, color_label, group_label )
  (SELECT newlegendid, from_step, to_step, color_rgb, color_label, group_label
   FROM analysis.legend_step
   WHERE legend_id = tocopylegendid);

  RETURN newlegendid;

END;
$$;


ALTER FUNCTION analysis.copylegend(tocopylegendid bigint, newlegendname text) OWNER TO estation;

--
-- TOC entry 1010 (class 1255 OID 100398)
-- Name: update_insert_chart_drawproperties(character varying, integer, integer, integer, character varying, integer, character varying, integer, integer, integer, character varying, integer, character varying, integer); Type: FUNCTION; Schema: analysis; Owner: estation
--

CREATE FUNCTION analysis.update_insert_chart_drawproperties(chart_type character varying, chart_width integer, chart_height integer, chart_title_font_size integer, chart_title_font_color character varying, chart_subtitle_font_size integer, chart_subtitle_font_color character varying, yaxe1_font_size integer, yaxe2_font_size integer, legend_font_size integer, legend_font_color character varying, xaxe_font_size integer, xaxe_font_color character varying, yaxe3_font_size integer) RETURNS boolean
    LANGUAGE plpgsql
    AS $_$
	DECLARE

	  _chart_type 			ALIAS FOR  $1;
	  _chart_width 			ALIAS FOR  $2;
	  _chart_height 		ALIAS FOR  $3;
	  _chart_title_font_size 	ALIAS FOR  $4;
	  _chart_title_font_color 	ALIAS FOR  $5;
	  _chart_subtitle_font_size 	ALIAS FOR  $6;
	  _chart_subtitle_font_color 	ALIAS FOR  $7;
	  _yaxe1_font_size 		ALIAS FOR  $8;
	  _yaxe2_font_size 		ALIAS FOR  $9;
	  _legend_font_size 		ALIAS FOR  $10;
	  _legend_font_color 		ALIAS FOR  $11;
	  _xaxe_font_size 		ALIAS FOR  $12;
	  _xaxe_font_color 		ALIAS FOR  $13;
	  _yaxe3_font_size 		ALIAS FOR  $14;

	BEGIN
		PERFORM * FROM analysis.chart_drawproperties cd WHERE cd.chart_type = _chart_type;
		IF FOUND THEN
			UPDATE analysis.chart_drawproperties cd
			SET chart_width = _chart_width,
			    chart_height = _chart_height,
			    chart_title_font_size = _chart_title_font_size,
			    chart_title_font_color = TRIM(_chart_title_font_color),
			    chart_subtitle_font_size = _chart_subtitle_font_size,
			    chart_subtitle_font_color = TRIM(_chart_subtitle_font_color),
			    yaxe1_font_size = _yaxe1_font_size,
			    yaxe2_font_size = _yaxe2_font_size,
			    legend_font_size = _legend_font_size,
			    legend_font_color = TRIM(_legend_font_color),
			    xaxe_font_size = _xaxe_font_size,
			    xaxe_font_color = TRIM(_xaxe_font_color),
			    yaxe3_font_size = _yaxe3_font_size
			WHERE cd.chart_type = _chart_type;
		ELSE
			INSERT INTO analysis.chart_drawproperties (
				chart_type,
				chart_width,
				chart_height,
				chart_title_font_size,
				chart_title_font_color,
				chart_subtitle_font_size,
				chart_subtitle_font_color,
				yaxe1_font_size,
				yaxe2_font_size,
				legend_font_size,
				legend_font_color,
				xaxe_font_size,
				xaxe_font_color,
				yaxe3_font_size
			)
			VALUES (
			    TRIM(_chart_type),
			    _chart_width,
			    _chart_height,
			    _chart_title_font_size,
			    TRIM(_chart_title_font_color),
			    _chart_subtitle_font_size,
			    TRIM(_chart_subtitle_font_color),
			    _yaxe1_font_size,
			    _yaxe2_font_size,
			    _legend_font_size,
			    TRIM(_legend_font_color),
			    _xaxe_font_size,
			    TRIM(_xaxe_font_color),
			    _yaxe3_font_size
			);
		END IF;
		RETURN TRUE;
	END;
$_$;


ALTER FUNCTION analysis.update_insert_chart_drawproperties(chart_type character varying, chart_width integer, chart_height integer, chart_title_font_size integer, chart_title_font_color character varying, chart_subtitle_font_size integer, chart_subtitle_font_color character varying, yaxe1_font_size integer, yaxe2_font_size integer, legend_font_size integer, legend_font_color character varying, xaxe_font_size integer, xaxe_font_color character varying, yaxe3_font_size integer) OWNER TO estation;

--
-- TOC entry 1011 (class 1255 OID 100399)
-- Name: update_insert_chart_drawproperties(character varying, integer, integer, integer, character varying, integer, character varying, integer, integer, integer, character varying, integer, character varying, integer, integer); Type: FUNCTION; Schema: analysis; Owner: estation
--

CREATE FUNCTION analysis.update_insert_chart_drawproperties(chart_type character varying, chart_width integer, chart_height integer, chart_title_font_size integer, chart_title_font_color character varying, chart_subtitle_font_size integer, chart_subtitle_font_color character varying, yaxe1_font_size integer, yaxe2_font_size integer, legend_font_size integer, legend_font_color character varying, xaxe_font_size integer, xaxe_font_color character varying, yaxe3_font_size integer, yaxe4_font_size integer) RETURNS boolean
    LANGUAGE plpgsql
    AS $_$
	DECLARE

	  _chart_type 			ALIAS FOR  $1;
	  _chart_width 			ALIAS FOR  $2;
	  _chart_height 		ALIAS FOR  $3;
	  _chart_title_font_size 	ALIAS FOR  $4;
	  _chart_title_font_color 	ALIAS FOR  $5;
	  _chart_subtitle_font_size 	ALIAS FOR  $6;
	  _chart_subtitle_font_color 	ALIAS FOR  $7;
	  _yaxe1_font_size 		ALIAS FOR  $8;
	  _yaxe2_font_size 		ALIAS FOR  $9;
	  _legend_font_size 		ALIAS FOR  $10;
	  _legend_font_color 		ALIAS FOR  $11;
	  _xaxe_font_size 		ALIAS FOR  $12;
	  _xaxe_font_color 		ALIAS FOR  $13;
	  _yaxe3_font_size 		ALIAS FOR  $14;
	  _yaxe4_font_size 		ALIAS FOR  $15;

	BEGIN
		PERFORM * FROM analysis.chart_drawproperties cd WHERE cd.chart_type = _chart_type;
		IF FOUND THEN
			UPDATE analysis.chart_drawproperties cd
			SET chart_width = _chart_width,
			    chart_height = _chart_height,
			    chart_title_font_size = _chart_title_font_size,
			    chart_title_font_color = TRIM(_chart_title_font_color),
			    chart_subtitle_font_size = _chart_subtitle_font_size,
			    chart_subtitle_font_color = TRIM(_chart_subtitle_font_color),
			    yaxe1_font_size = _yaxe1_font_size,
			    yaxe2_font_size = _yaxe2_font_size,
			    legend_font_size = _legend_font_size,
			    legend_font_color = TRIM(_legend_font_color),
			    xaxe_font_size = _xaxe_font_size,
			    xaxe_font_color = TRIM(_xaxe_font_color),
			    yaxe3_font_size = _yaxe3_font_size,
			    yaxe4_font_size = _yaxe4_font_size
			WHERE cd.chart_type = _chart_type;
		ELSE
			INSERT INTO analysis.chart_drawproperties (
				chart_type,
				chart_width,
				chart_height,
				chart_title_font_size,
				chart_title_font_color,
				chart_subtitle_font_size,
				chart_subtitle_font_color,
				yaxe1_font_size,
				yaxe2_font_size,
				legend_font_size,
				legend_font_color,
				xaxe_font_size,
				xaxe_font_color,
				yaxe3_font_size,
				yaxe4_font_size
			)
			VALUES (
			    TRIM(_chart_type),
			    _chart_width,
			    _chart_height,
			    _chart_title_font_size,
			    TRIM(_chart_title_font_color),
			    _chart_subtitle_font_size,
			    TRIM(_chart_subtitle_font_color),
			    _yaxe1_font_size,
			    _yaxe2_font_size,
			    _legend_font_size,
			    TRIM(_legend_font_color),
			    _xaxe_font_size,
			    TRIM(_xaxe_font_color),
			    _yaxe3_font_size,
			    _yaxe4_font_size
			);
		END IF;
		RETURN TRUE;
	END;
$_$;


ALTER FUNCTION analysis.update_insert_chart_drawproperties(chart_type character varying, chart_width integer, chart_height integer, chart_title_font_size integer, chart_title_font_color character varying, chart_subtitle_font_size integer, chart_subtitle_font_color character varying, yaxe1_font_size integer, yaxe2_font_size integer, legend_font_size integer, legend_font_color character varying, xaxe_font_size integer, xaxe_font_color character varying, yaxe3_font_size integer, yaxe4_font_size integer) OWNER TO estation;

--
-- TOC entry 1012 (class 1255 OID 100400)
-- Name: update_insert_graph_drawproperties(character varying, integer, integer, character varying, integer, character varying, character varying, integer, character varying, character varying, integer, character varying, integer, character varying); Type: FUNCTION; Schema: analysis; Owner: estation
--

CREATE FUNCTION analysis.update_insert_graph_drawproperties(graph_type character varying, graph_width integer, graph_height integer, graph_title character varying, graph_title_font_size integer, graph_title_font_color character varying, graph_subtitle character varying, graph_subtitle_font_size integer, graph_subtitle_font_color character varying, legend_position character varying, legend_font_size integer, legend_font_color character varying, xaxe_font_size integer, xaxe_font_color character varying) RETURNS boolean
    LANGUAGE plpgsql
    AS $_$
	DECLARE

	  _graph_type 					ALIAS FOR  $1;
	  _graph_width 					ALIAS FOR  $2;
	  _graph_height 				ALIAS FOR  $3;
	  _graph_title 					ALIAS FOR  $4;
	  _graph_title_font_size 		ALIAS FOR  $5;
	  _graph_title_font_color 		ALIAS FOR  $6;
	  _graph_subtitle 				ALIAS FOR  $7;
	  _graph_subtitle_font_size 	ALIAS FOR  $8;
	  _graph_subtitle_font_color 	ALIAS FOR  $9;
	  _legend_position 				ALIAS FOR  $10;
	  _legend_font_size 			ALIAS FOR  $11;
	  _legend_font_color 			ALIAS FOR  $12;
	  _xaxe_font_size 				ALIAS FOR  $13;
	  _xaxe_font_color 				ALIAS FOR  $14;


	BEGIN
		PERFORM * FROM analysis.graph_drawproperties gd WHERE gd.graph_type = _graph_type;
		IF FOUND THEN
			UPDATE analysis.graph_drawproperties cd
			SET graph_width = _graph_width,
			    graph_height = _graph_height,
				graph_title = TRIM(_graph_title),
			    graph_title_font_size = _graph_title_font_size,
			    graph_title_font_color = TRIM(_graph_title_font_color),
				graph_subtitle = TRIM(_graph_subtitle),
			    graph_subtitle_font_size = _graph_subtitle_font_size,
			    graph_subtitle_font_color = TRIM(_graph_subtitle_font_color),
				legend_position = TRIM(_legend_position),
			    legend_font_size = _legend_font_size,
			    legend_font_color = TRIM(_legend_font_color),
			    xaxe_font_size = _xaxe_font_size,
			    xaxe_font_color = TRIM(_xaxe_font_color)
			WHERE cd.graph_type = _graph_type;
		ELSE
			INSERT INTO analysis.graph_drawproperties (
			  graph_type,
			  graph_width,
			  graph_height,
			  graph_title,
			  graph_title_font_size,
			  graph_title_font_color,
			  graph_subtitle,
			  graph_subtitle_font_size,
			  graph_subtitle_font_color,
			  legend_position,
			  legend_font_size ,
			  legend_font_color,
			  xaxe_font_size ,
			  xaxe_font_color
			)
			VALUES (
			    TRIM(_graph_type),
			    _graph_width,
			    _graph_height,
				TRIM(_graph_title),
			    _graph_title_font_size,
			    TRIM(_graph_title_font_color),
				TRIM(_graph_subtitle),
			    _graph_subtitle_font_size,
			    TRIM(_graph_subtitle_font_color),
				TRIM(_legend_position),
			    _legend_font_size,
			    TRIM(_legend_font_color),
			    _xaxe_font_size,
			    TRIM(_xaxe_font_color)
			);
		END IF;
		RETURN TRUE;
	END;
$_$;


ALTER FUNCTION analysis.update_insert_graph_drawproperties(graph_type character varying, graph_width integer, graph_height integer, graph_title character varying, graph_title_font_size integer, graph_title_font_color character varying, graph_subtitle character varying, graph_subtitle_font_size integer, graph_subtitle_font_color character varying, legend_position character varying, legend_font_size integer, legend_font_color character varying, xaxe_font_size integer, xaxe_font_color character varying) OWNER TO estation;

--
-- TOC entry 1013 (class 1255 OID 100401)
-- Name: update_insert_graph_yaxes(character varying, character varying, character varying, integer, double precision, double precision, character varying, boolean, character varying, double precision, double precision); Type: FUNCTION; Schema: analysis; Owner: estation
--

CREATE FUNCTION analysis.update_insert_graph_yaxes(yaxe_id character varying, title character varying, title_color character varying, title_font_size integer, min double precision, max double precision, unit character varying, opposite boolean, aggregation_type character varying, aggregation_min double precision, aggregation_max double precision) RETURNS boolean
    LANGUAGE plpgsql
    AS $_$
	DECLARE
		_yaxe_id 			ALIAS FOR  $1;
		_title 				ALIAS FOR  $2;
		_title_color 		ALIAS FOR  $3;
		_title_font_size 	ALIAS FOR  $4;
		_min 				ALIAS FOR  $5;
		_max 				ALIAS FOR  $6;
		_unit 				ALIAS FOR  $7;
		_opposite 			ALIAS FOR  $8;
		_aggregation_type	ALIAS FOR  $9;
		_aggregation_min	ALIAS FOR  $10;
		_aggregation_max	ALIAS FOR  $11;

	BEGIN
		PERFORM * FROM analysis.graph_yaxes gy WHERE gy.yaxe_id = TRIM(_yaxe_id);
		IF FOUND THEN
			UPDATE analysis.graph_yaxes gy
			SET title = TRIM(_title),
			    title_color = TRIM(_title_color),
				title_font_size = _title_font_size,
			    min = _min,
			    max = _max,
			    unit = TRIM(_unit),
			    opposite = _opposite,
			    aggregation_type = TRIM(_aggregation_type),
			    aggregation_min = _aggregation_min,
			    aggregation_max = _aggregation_max
			WHERE gy.yaxe_id = TRIM(_yaxe_id);
		ELSE
			INSERT INTO analysis.graph_yaxes (
				yaxe_id,
				title,
				title_color,
				title_font_size,
				min,
				max,
				unit,
				opposite,
				aggregation_type,
				aggregation_min,
				aggregation_max
				)
			VALUES (
				TRIM(_yaxe_id),
				TRIM(_title),
				TRIM(_title_color),
				_title_font_size,
				_min,
				_max,
				TRIM(_unit),
				_opposite,
				TRIM(_aggregation_type),
				_aggregation_min,
				_aggregation_max
				);
		END IF;
		RETURN TRUE;
	END;
$_$;


ALTER FUNCTION analysis.update_insert_graph_yaxes(yaxe_id character varying, title character varying, title_color character varying, title_font_size integer, min double precision, max double precision, unit character varying, opposite boolean, aggregation_type character varying, aggregation_min double precision, aggregation_max double precision) OWNER TO estation;

--
-- TOC entry 1014 (class 1255 OID 100402)
-- Name: update_insert_i18n(character varying, text, text, text, text, text, text); Type: FUNCTION; Schema: analysis; Owner: estation
--

CREATE FUNCTION analysis.update_insert_i18n(label character varying, eng text, fra text, por text, lang1 text, lang2 text, lang3 text) RETURNS boolean
    LANGUAGE plpgsql
    AS $_$
	DECLARE
		_label  ALIAS FOR  $1;
		_eng  	ALIAS FOR  $2;
		_fra   	ALIAS FOR  $3;
		_por   	ALIAS FOR  $4;
		_lang1  ALIAS FOR  $5;
		_lang2  ALIAS FOR  $6;
		_lang3  ALIAS FOR  $7;

	BEGIN
		IF _eng= 'NULL' THEN
			_eng = NULL;
		END IF;
		IF _fra = 'NULL' THEN
			_fra = NULL;
		END IF;
		IF _por = 'NULL' THEN
			_por = NULL;
		END IF;
		IF _lang1 = 'NULL' THEN
			_lang1 = NULL;
		END IF;
		IF _lang2 = 'NULL' THEN
			_lang2 = NULL;
		END IF;
		IF _lang3 = 'NULL' THEN
			_lang3 = NULL;
		END IF;

		PERFORM * FROM analysis.i18n WHERE i18n.label = TRIM(_label);
		IF FOUND THEN
			UPDATE analysis.i18n
			SET eng = TRIM(_eng),
			    fra = TRIM(_fra),
			    por = TRIM(_por),
			    lang1 = TRIM(_lang1),
			    lang2 = TRIM(_lang2),
			    lang3 = TRIM(_lang3)
			WHERE i18n.label = TRIM(_label);
		ELSE
			INSERT INTO analysis.i18n (label, eng, fra, por, lang1, lang2, lang3)
			VALUES (TRIM(_label), TRIM(_eng), TRIM(_fra), TRIM(_por), TRIM(_lang1), TRIM(_lang2), TRIM(_lang3));
		END IF;
		RETURN TRUE;
	END;
$_$;


ALTER FUNCTION analysis.update_insert_i18n(label character varying, eng text, fra text, por text, lang1 text, lang2 text, lang3 text) OWNER TO estation;

--
-- TOC entry 1015 (class 1255 OID 100403)
-- Name: update_insert_languages(character varying, character varying, boolean); Type: FUNCTION; Schema: analysis; Owner: estation
--

CREATE FUNCTION analysis.update_insert_languages(langcode character varying, langdescription character varying, active boolean) RETURNS boolean
    LANGUAGE plpgsql
    AS $_$
	DECLARE
		_langcode  		ALIAS FOR  $1;
		_langdescription  	ALIAS FOR  $2;
		_active   		ALIAS FOR  $3;

	BEGIN
		PERFORM * FROM analysis.languages l WHERE l.langcode = TRIM(_langcode);
		IF FOUND THEN
			UPDATE analysis.languages l
			SET langdescription = TRIM(_langdescription),
			    active = _active
			WHERE l.langcode = TRIM(_langcode);
		ELSE
			INSERT INTO analysis.languages (langcode, langdescription, active)
			VALUES (TRIM(_langcode), TRIM(_langdescription), _active);
		END IF;
		RETURN TRUE;
	END;
$_$;


ALTER FUNCTION analysis.update_insert_languages(langcode character varying, langdescription character varying, active boolean) OWNER TO estation;

--
-- TOC entry 1016 (class 1255 OID 100404)
-- Name: update_insert_layers(integer, character varying, character varying, text, character varying, integer, character varying, character varying, integer, character varying, integer, character varying, character varying, integer, character varying, integer, character varying, integer, boolean, boolean, character varying, character varying, character varying, character varying, character varying, boolean, text, boolean); Type: FUNCTION; Schema: analysis; Owner: estation
--

CREATE FUNCTION analysis.update_insert_layers(layerid integer, layerlevel character varying, layername character varying, description text, filename character varying, layerorderidx integer, layertype character varying, polygon_outlinecolor character varying, polygon_outlinewidth integer, polygon_fillcolor character varying, polygon_fillopacity integer, feature_display_column character varying, feature_highlight_outlinecolor character varying, feature_highlight_outlinewidth integer, feature_highlight_fillcolor character varying, feature_highlight_fillopacity integer, feature_selected_outlinecolor character varying, feature_selected_outlinewidth integer, enabled boolean, deletable boolean, background_legend_image_filename character varying, projection character varying, submenu character varying, menu character varying, defined_by character varying, open_in_mapview boolean, provider text, full_copy boolean DEFAULT false) RETURNS boolean
    LANGUAGE plpgsql
    AS $_$
	DECLARE

	  _layerid 				ALIAS FOR  $1;
	  _layerlevel 				ALIAS FOR  $2;
	  _layername 				ALIAS FOR  $3;
	  _description 				ALIAS FOR  $4;
	  _filename 				ALIAS FOR  $5;
	  _layerorderidx 			ALIAS FOR  $6;
	  _layertype 				ALIAS FOR  $7;
	  _polygon_outlinecolor 		ALIAS FOR  $8;
	  _polygon_outlinewidth 		ALIAS FOR  $9;
	  _polygon_fillcolor 			ALIAS FOR  $10;
	  _polygon_fillopacity 			ALIAS FOR  $11;
	  _feature_display_column 		ALIAS FOR  $12;
	  _feature_highlight_outlinecolor 	ALIAS FOR  $13;
	  _feature_highlight_outlinewidth 	ALIAS FOR  $14;
	  _feature_highlight_fillcolor	  	ALIAS FOR  $15;
	  _feature_highlight_fillopacity  	ALIAS FOR  $16;
	  _feature_selected_outlinecolor  	ALIAS FOR  $17;
	  _feature_selected_outlinewidth  	ALIAS FOR  $18;
	  _enabled 			  	ALIAS FOR  $19;
	  _deletable 			  	ALIAS FOR  $20;
	  _background_legend_image_filename 	ALIAS FOR  $21;
	  _projection 				ALIAS FOR  $22;
	  _submenu 				ALIAS FOR  $23;
	  _menu 				ALIAS FOR  $24;
	  _defined_by 				ALIAS FOR  $25;
	  _open_in_mapview			ALIAS FOR  $26;
	  _provider 				ALIAS FOR  $27;
	  _full_copy 				ALIAS FOR  $28;

	BEGIN
		PERFORM * FROM analysis.layers l WHERE l.layerid = _layerid;
		IF FOUND THEN
			IF _full_copy THEN
				UPDATE analysis.layers l
				SET layerlevel = TRIM(_layerlevel),
				    layername = TRIM(_layername),
				    description = TRIM(_description),
				    filename = TRIM(_filename),
				    layerorderidx = _layerorderidx,
				    layertype = TRIM(_layertype),
				    polygon_outlinecolor = TRIM(_polygon_outlinecolor),
				    polygon_outlinewidth = _polygon_outlinewidth,
				    polygon_fillcolor = TRIM(_polygon_fillcolor),
				    polygon_fillopacity = _polygon_fillopacity,
				    feature_display_column = TRIM(_feature_display_column),
				    feature_highlight_outlinecolor = TRIM(_feature_highlight_outlinecolor),
				    feature_highlight_outlinewidth = _feature_highlight_outlinewidth,
				    feature_highlight_fillcolor = TRIM(_feature_highlight_fillcolor),
				    feature_highlight_fillopacity = _feature_highlight_fillopacity,
				    feature_selected_outlinecolor = TRIM(_feature_selected_outlinecolor),
				    feature_selected_outlinewidth = _feature_selected_outlinewidth,
				    enabled = _enabled,
				    deletable = _deletable,
				    background_legend_image_filename = TRIM(_background_legend_image_filename),
				    projection = TRIM(_projection),
				    submenu = TRIM(_submenu),
				    menu = TRIM(_menu),
				    defined_by = TRIM(_defined_by),
				    open_in_mapview = _open_in_mapview,
				    provider = TRIM(_provider)
				WHERE l.layerid = _layerid;
			ELSE
				UPDATE analysis.layers l
				SET layerlevel = TRIM(_layerlevel),
				    layername = TRIM(_layername),
				    description = TRIM(_description),
				    filename = TRIM(_filename),
				    layerorderidx = _layerorderidx,
				    layertype = TRIM(_layertype),
				    -- polygon_outlinecolor = TRIM(_polygon_outlinecolor),
				    -- polygon_outlinewidth = _polygon_outlinewidth,
				    -- polygon_fillcolor = TRIM(_polygon_fillcolor),
				    -- polygon_fillopacity = _polygon_fillopacity,
				    -- feature_display_column = TRIM(_feature_display_column),
				    -- feature_highlight_outlinecolor = TRIM(_feature_highlight_outlinecolor),
				    -- feature_highlight_outlinewidth = _feature_highlight_outlinewidth,
				    -- feature_highlight_fillcolor = TRIM(_feature_highlight_fillcolor),
				    -- feature_highlight_fillopacity = _feature_highlight_fillopacity,
				    -- feature_selected_outlinecolor = TRIM(_feature_selected_outlinecolor),
				    -- feature_selected_outlinewidth = _feature_selected_outlinewidth,
				    -- enabled = _enabled,
				    deletable = _deletable,
				    background_legend_image_filename = TRIM(_background_legend_image_filename),
				    projection = TRIM(_projection),
				    submenu = TRIM(_submenu),
				    menu = TRIM(_menu),
				    defined_by = TRIM(_defined_by),
				    -- open_in_mapview = _open_in_mapview,
				    provider = TRIM(_provider)
				WHERE l.layerid = _layerid;
			END IF;

		ELSE
			INSERT INTO analysis.layers (
			  -- layerid,
				layerlevel,
				layername,
				description,
				filename,
				layerorderidx,
				layertype,
				polygon_outlinecolor,
				polygon_outlinewidth,
				polygon_fillcolor,
				polygon_fillopacity,
				feature_display_column,
				feature_highlight_outlinecolor,
				feature_highlight_outlinewidth,
				feature_highlight_fillcolor,
				feature_highlight_fillopacity,
				feature_selected_outlinecolor,
				feature_selected_outlinewidth,
				enabled,
				deletable,
				background_legend_image_filename,
				projection,
				submenu,
				menu,
				defined_by,
				open_in_mapview,
				provider
			)
			VALUES (
			    -- _layerid,
			    TRIM(_layerlevel),
			    TRIM(_layername),
			    TRIM(_description),
			    TRIM(_filename),
			    _layerorderidx,
			    TRIM(_layertype),
			    TRIM(_polygon_outlinecolor),
			    _polygon_outlinewidth,
			    TRIM(_polygon_fillcolor),
			    _polygon_fillopacity,
			    TRIM(_feature_display_column),
			    TRIM(_feature_highlight_outlinecolor),
			    _feature_highlight_outlinewidth,
			    TRIM(_feature_highlight_fillcolor),
			    _feature_highlight_fillopacity,
			    TRIM(_feature_selected_outlinecolor),
			    _feature_selected_outlinewidth,
			    _enabled,
			    _deletable,
			    TRIM(_background_legend_image_filename),
			    TRIM(_projection),
			    TRIM(_submenu),
			    TRIM(_menu),
			    TRIM(_defined_by),
			    _open_in_mapview,
			    TRIM(_provider)
			);
		END IF;
		RETURN TRUE;
	END;
$_$;


ALTER FUNCTION analysis.update_insert_layers(layerid integer, layerlevel character varying, layername character varying, description text, filename character varying, layerorderidx integer, layertype character varying, polygon_outlinecolor character varying, polygon_outlinewidth integer, polygon_fillcolor character varying, polygon_fillopacity integer, feature_display_column character varying, feature_highlight_outlinecolor character varying, feature_highlight_outlinewidth integer, feature_highlight_fillcolor character varying, feature_highlight_fillopacity integer, feature_selected_outlinecolor character varying, feature_selected_outlinewidth integer, enabled boolean, deletable boolean, background_legend_image_filename character varying, projection character varying, submenu character varying, menu character varying, defined_by character varying, open_in_mapview boolean, provider text, full_copy boolean) OWNER TO estation;

--
-- TOC entry 1017 (class 1255 OID 100406)
-- Name: update_insert_legend(integer, character varying, character varying, double precision, double precision, character varying, text, text, double precision, double precision, double precision, character varying); Type: FUNCTION; Schema: analysis; Owner: estation
--

CREATE FUNCTION analysis.update_insert_legend(legend_id integer, legend_name character varying, step_type character varying, min_value double precision, max_value double precision, min_real_value character varying, max_real_value text, colorbar text, step double precision, step_range_from double precision, step_range_to double precision, unit character varying) RETURNS boolean
    LANGUAGE plpgsql
    AS $_$
	DECLARE
		_legend_id 		ALIAS FOR  $1;
		_legend_name 		ALIAS FOR  $2;
		_step_type 		ALIAS FOR  $3;
		_min_value 		ALIAS FOR  $4;
		_max_value 		ALIAS FOR  $5;
		_min_real_value 	ALIAS FOR  $6;
		_max_real_value 	ALIAS FOR  $7;
		_colorbar 		ALIAS FOR  $8;
		_step 			ALIAS FOR  $9;
		_step_range_from	ALIAS FOR  $10;
		_step_range_to 		ALIAS FOR  $11;
		_unit 			ALIAS FOR  $12;

	BEGIN
		IF _max_real_value= 'NULL' THEN
			_max_real_value = NULL;
		END IF;
		IF _colorbar= 'NULL' THEN
			_colorbar = NULL;
		END IF;

		PERFORM * FROM analysis.legend l WHERE l.legend_id = _legend_id;
		IF FOUND THEN
			UPDATE analysis.legend l
			SET legend_name = TRIM(_legend_name),
			    step_type = TRIM(_step_type),
			    min_value = _min_value,
			    max_value = _max_value,
			    min_real_value = TRIM(_min_real_value),
			    max_real_value = TRIM(_max_real_value),
			    colorbar = TRIM(_colorbar),
			    step = _step,
			    step_range_from = _step_range_from,
			    step_range_to = _step_range_to,
			    unit = TRIM(_unit)
			WHERE l.legend_id = _legend_id;
		ELSE
			INSERT INTO analysis.legend (legend_id, legend_name, step_type, min_value, max_value, min_real_value, max_real_value, colorbar, step, step_range_from, step_range_to, unit)
			VALUES (_legend_id, TRIM(legend_name), TRIM(_step_type), _min_value, _max_value, TRIM(_min_real_value), TRIM(_max_real_value), TRIM(_colorbar), _step, _step_range_from, _step_range_to, _unit);
		END IF;
		RETURN TRUE;
	END;
$_$;


ALTER FUNCTION analysis.update_insert_legend(legend_id integer, legend_name character varying, step_type character varying, min_value double precision, max_value double precision, min_real_value character varying, max_real_value text, colorbar text, step double precision, step_range_from double precision, step_range_to double precision, unit character varying) OWNER TO estation;

--
-- TOC entry 1018 (class 1255 OID 100407)
-- Name: update_insert_legend(integer, character varying, character varying, double precision, double precision, character varying, text, text, double precision, double precision, double precision, character varying, character varying); Type: FUNCTION; Schema: analysis; Owner: estation
--

CREATE FUNCTION analysis.update_insert_legend(legend_id integer, legend_name character varying, step_type character varying, min_value double precision, max_value double precision, min_real_value character varying, max_real_value text, colorbar text, step double precision, step_range_from double precision, step_range_to double precision, unit character varying, defined_by character varying) RETURNS boolean
    LANGUAGE plpgsql
    AS $_$
	DECLARE
		_legend_id 		ALIAS FOR  $1;
		_legend_name 		ALIAS FOR  $2;
		_step_type 		ALIAS FOR  $3;
		_min_value 		ALIAS FOR  $4;
		_max_value 		ALIAS FOR  $5;
		_min_real_value 	ALIAS FOR  $6;
		_max_real_value 	ALIAS FOR  $7;
		_colorbar 		ALIAS FOR  $8;
		_step 			ALIAS FOR  $9;
		_step_range_from	ALIAS FOR  $10;
		_step_range_to 		ALIAS FOR  $11;
		_unit 			ALIAS FOR  $12;
		_defined_by 		ALIAS FOR  $13;

	BEGIN
		IF _max_real_value= 'NULL' THEN
			_max_real_value = NULL;
		END IF;
		IF _colorbar= 'NULL' THEN
			_colorbar = NULL;
		END IF;

		PERFORM * FROM analysis.legend l WHERE l.legend_id = _legend_id;
		IF FOUND THEN
			UPDATE analysis.legend l
			SET legend_name = TRIM(_legend_name),
			    step_type = TRIM(_step_type),
			    min_value = _min_value,
			    max_value = _max_value,
			    min_real_value = TRIM(_min_real_value),
			    max_real_value = TRIM(_max_real_value),
			    colorbar = TRIM(_colorbar),
			    step = _step,
			    step_range_from = _step_range_from,
			    step_range_to = _step_range_to,
			    unit = TRIM(_unit),
			    defined_by = TRIM(_defined_by)
			WHERE l.legend_id = _legend_id;
		ELSE
			INSERT INTO analysis.legend (legend_id, legend_name, step_type, min_value, max_value, min_real_value, max_real_value, colorbar, step, step_range_from, step_range_to, unit, defined_by)
			VALUES (_legend_id, TRIM(legend_name), TRIM(_step_type), _min_value, _max_value, TRIM(_min_real_value), TRIM(_max_real_value), TRIM(_colorbar), _step, _step_range_from, _step_range_to, _unit, _defined_by);
		END IF;
		RETURN TRUE;
	END;
$_$;


ALTER FUNCTION analysis.update_insert_legend(legend_id integer, legend_name character varying, step_type character varying, min_value double precision, max_value double precision, min_real_value character varying, max_real_value text, colorbar text, step double precision, step_range_from double precision, step_range_to double precision, unit character varying, defined_by character varying) OWNER TO estation;

--
-- TOC entry 1019 (class 1255 OID 100408)
-- Name: update_insert_legend_step(integer, double precision, double precision, character varying, character varying, character varying); Type: FUNCTION; Schema: analysis; Owner: estation
--

CREATE FUNCTION analysis.update_insert_legend_step(legend_id integer, from_step double precision, to_step double precision, color_rgb character varying, color_label character varying, group_label character varying) RETURNS boolean
    LANGUAGE plpgsql
    AS $_$
	DECLARE
		_legend_id 	ALIAS FOR  $1;
		_from_step 	ALIAS FOR  $2;
		_to_step 	ALIAS FOR  $3;
		_color_rgb 	ALIAS FOR  $4;
		_color_label 	ALIAS FOR  $5;
		_group_label 	ALIAS FOR  $6;

	BEGIN
		IF _color_rgb = 'NULL' THEN
			_color_rgb = NULL;
		END IF;
		IF _color_label = 'NULL' THEN
			_color_label = NULL;
		END IF;
		IF _group_label = 'NULL' THEN
			_group_label = NULL;
		END IF;

		PERFORM * FROM analysis.legend_step ls WHERE ls.legend_id = _legend_id AND ls.from_step = _from_step AND ls.to_step = _to_step;
		IF FOUND THEN
			UPDATE analysis.legend_step ls
			SET color_rgb = TRIM(_color_rgb),
			    color_label = TRIM(_color_label),
			    group_label = TRIM(_group_label)
			WHERE ls.legend_id = _legend_id AND ls.from_step = _from_step AND ls.to_step = _to_step;
		ELSE
			INSERT INTO analysis.legend_step (legend_id, from_step, to_step, color_rgb, color_label, group_label)
			VALUES (_legend_id, _from_step, _to_step, TRIM(_color_rgb), TRIM(_color_label), TRIM(_group_label));
		END IF;
		RETURN TRUE;
	END;
$_$;


ALTER FUNCTION analysis.update_insert_legend_step(legend_id integer, from_step double precision, to_step double precision, color_rgb character varying, color_label character varying, group_label character varying) OWNER TO estation;

--
-- TOC entry 1020 (class 1255 OID 100409)
-- Name: update_insert_logo(integer, character varying, character varying, boolean, boolean, character varying, boolean, integer); Type: FUNCTION; Schema: analysis; Owner: estation
--

CREATE FUNCTION analysis.update_insert_logo(logo_id integer, logo_filename character varying, logo_description character varying, active boolean, deletable boolean, defined_by character varying, isdefault boolean, orderindex_defaults integer) RETURNS boolean
    LANGUAGE plpgsql
    AS $_$
	DECLARE
		_logo_id 		ALIAS FOR  $1;
		_logo_filename 		ALIAS FOR  $2;
		_logo_description 	ALIAS FOR  $3;
		_active 		ALIAS FOR  $4;
		_deletable 		ALIAS FOR  $5;
		_defined_by 		ALIAS FOR  $6;
		_isdefault 		ALIAS FOR  $7;
		_orderindex_defaults 	ALIAS FOR  $8;

	BEGIN
		PERFORM * FROM analysis.logos l WHERE l.logo_id = _logo_id;
		IF FOUND THEN
			UPDATE analysis.logos l
			SET logo_filename = TRIM(_logo_filename),
			    logo_description = TRIM(_logo_description),
			    active = _active,
			    deletable = _deletable,
			    defined_by = TRIM(_defined_by),
			    isdefault = _isdefault,
			    orderindex_defaults = _orderindex_defaults
			WHERE l.logo_id = _logo_id;
		ELSE
			INSERT INTO analysis.logos (logo_id, logo_filename, logo_description, active, deletable, defined_by, isdefault, orderindex_defaults)
			VALUES (_logo_id,
				TRIM(_logo_filename),
				TRIM(_logo_description),
				_active,
				_deletable,
				TRIM(_defined_by),
				_isdefault,
				_orderindex_defaults);
		END IF;
		RETURN TRUE;
	END;
$_$;


ALTER FUNCTION analysis.update_insert_logo(logo_id integer, logo_filename character varying, logo_description character varying, active boolean, deletable boolean, defined_by character varying, isdefault boolean, orderindex_defaults integer) OWNER TO estation;

--
-- TOC entry 1021 (class 1255 OID 100410)
-- Name: update_insert_product_legend(character varying, character varying, character varying, bigint, boolean); Type: FUNCTION; Schema: analysis; Owner: estation
--

CREATE FUNCTION analysis.update_insert_product_legend(productcode character varying, subproductcode character varying, version character varying, legend_id bigint, default_legend boolean) RETURNS boolean
    LANGUAGE plpgsql
    AS $_$
	DECLARE
		_productcode 		ALIAS FOR  $1;
		_subproductcode 	ALIAS FOR  $2;
		_version 		ALIAS FOR  $3;
		_legend_id 		ALIAS FOR  $4;
		_default_legend 	ALIAS FOR  $5;

	BEGIN
		PERFORM * FROM analysis.product_legend pl WHERE pl.productcode = TRIM(_productcode) AND pl.subproductcode = TRIM(_subproductcode) AND pl.version = TRIM(_version) AND pl.legend_id = _legend_id;
		IF FOUND THEN
			UPDATE analysis.product_legend pl
			SET default_legend = _default_legend
			WHERE pl.productcode = TRIM(_productcode) AND pl.subproductcode = TRIM(_subproductcode) AND pl.version = TRIM(_version) AND pl.legend_id = _legend_id;
		ELSE
			INSERT INTO analysis.product_legend (productcode, subproductcode, version, legend_id, default_legend)
			VALUES (TRIM(_productcode), TRIM(_subproductcode), TRIM(_version), _legend_id, _default_legend);
		END IF;
		RETURN TRUE;
	END;
$_$;


ALTER FUNCTION analysis.update_insert_product_legend(productcode character varying, subproductcode character varying, version character varying, legend_id bigint, default_legend boolean) OWNER TO estation;

--
-- TOC entry 1022 (class 1255 OID 100411)
-- Name: update_insert_timeseries_drawproperties(character varying, character varying, character varying, character varying, character varying, character varying, integer, character varying, character varying); Type: FUNCTION; Schema: analysis; Owner: estation
--

CREATE FUNCTION analysis.update_insert_timeseries_drawproperties(productcode character varying, subproductcode character varying, version character varying, tsname_in_legend character varying, charttype character varying, linestyle character varying, linewidth integer, color character varying, yaxe_id character varying) RETURNS boolean
    LANGUAGE plpgsql
    AS $_$
	DECLARE
		_productcode 		ALIAS FOR  $1;
		_subproductcode 	ALIAS FOR  $2;
		_version 		ALIAS FOR  $3;
		_tsname_in_legend 	ALIAS FOR  $4;
		_charttype 		ALIAS FOR  $5;
		_linestyle 		ALIAS FOR  $6;
		_linewidth 		ALIAS FOR  $7;
		_color 			ALIAS FOR  $8;
		_yaxe_id 		ALIAS FOR  $9;


	BEGIN
		PERFORM * FROM analysis.timeseries_drawproperties tsdp WHERE tsdp.productcode = TRIM(_productcode) AND tsdp.subproductcode = TRIM(_subproductcode) AND tsdp.version = TRIM(_version);
		IF FOUND THEN
			UPDATE analysis.timeseries_drawproperties tsdp
			SET tsname_in_legend = TRIM(_tsname_in_legend),
    			charttype = TRIM(_charttype),
			    linestyle = TRIM(_linestyle),
			    linewidth = _linewidth,
			    color = TRIM(_color),
			    yaxe_id = TRIM(_yaxe_id)
			WHERE tsdp.productcode = TRIM(_productcode) AND tsdp.subproductcode = TRIM(_subproductcode) AND tsdp.version = TRIM(_version);
		ELSE
			INSERT INTO analysis.timeseries_drawproperties (productcode,
									subproductcode,
									version,
									tsname_in_legend,
									charttype,
									linestyle,
									linewidth,
									color,
									yaxe_id
									)
			VALUES (TRIM(_productcode),
				TRIM(_subproductcode),
				TRIM(_version),
				TRIM(_tsname_in_legend),
				TRIM(_charttype),
				TRIM(_linestyle),
				_linewidth,
				TRIM(_color),
				TRIM(_yaxe_id)
				);
		END IF;
		RETURN TRUE;
	END;
$_$;


ALTER FUNCTION analysis.update_insert_timeseries_drawproperties(productcode character varying, subproductcode character varying, version character varying, tsname_in_legend character varying, charttype character varying, linestyle character varying, linewidth integer, color character varying, yaxe_id character varying) OWNER TO estation;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 256 (class 1259 OID 100034)
-- Name: graph_drawproperties; Type: TABLE; Schema: analysis; Owner: estation
--

CREATE TABLE analysis.graph_drawproperties (
    graph_type character varying NOT NULL,
    graph_width integer,
    graph_height integer,
    graph_title character varying,
    graph_title_font_size integer,
    graph_title_font_color character varying,
    graph_subtitle character varying,
    graph_subtitle_font_size integer,
    graph_subtitle_font_color character varying,
    legend_position character varying,
    legend_font_size integer,
    legend_font_color character varying,
    xaxe_font_size integer,
    xaxe_font_color character varying
);


ALTER TABLE analysis.graph_drawproperties OWNER TO estation;

--
-- TOC entry 257 (class 1259 OID 100042)
-- Name: graph_yaxes; Type: TABLE; Schema: analysis; Owner: estation
--

CREATE TABLE analysis.graph_yaxes (
    yaxe_id character varying NOT NULL,
    title character varying,
    title_color character varying,
    title_font_size integer,
    min double precision,
    max double precision,
    unit character varying,
    opposite boolean DEFAULT false NOT NULL,
    aggregation_type character varying DEFAULT 'mean'::character varying,
    aggregation_min double precision,
    aggregation_max double precision
);


ALTER TABLE analysis.graph_yaxes OWNER TO estation;

--
-- TOC entry 212 (class 1259 OID 99391)
-- Name: i18n; Type: TABLE; Schema: analysis; Owner: estation
--

CREATE TABLE analysis.i18n (
    label character varying(255) NOT NULL,
    eng text NOT NULL,
    fra text,
    por text,
    lang1 text,
    lang2 text,
    lang3 text
);


ALTER TABLE analysis.i18n OWNER TO estation;

--
-- TOC entry 213 (class 1259 OID 99397)
-- Name: languages; Type: TABLE; Schema: analysis; Owner: estation
--

CREATE TABLE analysis.languages (
    langcode character varying(5) NOT NULL,
    langdescription character varying(80),
    active boolean
);


ALTER TABLE analysis.languages OWNER TO estation;

--
-- TOC entry 249 (class 1259 OID 99924)
-- Name: layers; Type: TABLE; Schema: analysis; Owner: estation
--

CREATE TABLE analysis.layers (
    layerid bigint NOT NULL,
    layerlevel character varying(80),
    layername character varying(80),
    description text,
    filename character varying(80),
    layerorderidx integer DEFAULT 1,
    layertype character varying(80) DEFAULT 'polygon'::character varying,
    polygon_outlinecolor character varying(11) DEFAULT '0 0 0'::character varying,
    polygon_outlinewidth integer DEFAULT 1,
    polygon_fillcolor character varying(11) DEFAULT 'Transparent'::character varying,
    polygon_fillopacity integer DEFAULT 100,
    feature_display_column character varying(255),
    feature_highlight_outlinecolor character varying(11) DEFAULT '0 0 0'::character varying,
    feature_highlight_outlinewidth integer DEFAULT 1,
    feature_highlight_fillcolor character varying(11) DEFAULT 'Transparent'::character varying,
    feature_highlight_fillopacity integer DEFAULT 100,
    feature_selected_outlinecolor character varying(11) DEFAULT '0 0 0'::character varying,
    feature_selected_outlinewidth integer DEFAULT 1,
    enabled boolean DEFAULT true,
    deletable boolean DEFAULT true,
    background_legend_image_filename character varying(80),
    projection character varying(80),
    submenu character varying(80),
    menu character varying(80),
    defined_by character varying DEFAULT 'USER'::character varying,
    open_in_mapview boolean DEFAULT false,
    provider text
);


ALTER TABLE analysis.layers OWNER TO estation;

--
-- TOC entry 248 (class 1259 OID 99922)
-- Name: layers_layerid_seq; Type: SEQUENCE; Schema: analysis; Owner: estation
--

CREATE SEQUENCE analysis.layers_layerid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE analysis.layers_layerid_seq OWNER TO estation;

--
-- TOC entry 4134 (class 0 OID 0)
-- Dependencies: 248
-- Name: layers_layerid_seq; Type: SEQUENCE OWNED BY; Schema: analysis; Owner: estation
--

ALTER SEQUENCE analysis.layers_layerid_seq OWNED BY analysis.layers.layerid;


--
-- TOC entry 214 (class 1259 OID 99400)
-- Name: legend; Type: TABLE; Schema: analysis; Owner: estation
--

CREATE TABLE analysis.legend (
    legend_id integer NOT NULL,
    legend_name character varying(100) NOT NULL,
    step_type character varying(80) DEFAULT 'irregular'::character varying NOT NULL,
    min_value double precision,
    max_value double precision,
    min_real_value character varying(20),
    max_real_value text,
    colorbar text,
    step double precision,
    step_range_from double precision,
    step_range_to double precision,
    unit character varying(30),
    defined_by character varying DEFAULT 'USER'::character varying
);


ALTER TABLE analysis.legend OWNER TO estation;

--
-- TOC entry 215 (class 1259 OID 99406)
-- Name: legend_legend_id_seq; Type: SEQUENCE; Schema: analysis; Owner: estation
--

CREATE SEQUENCE analysis.legend_legend_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 100000000
    CACHE 1;


ALTER TABLE analysis.legend_legend_id_seq OWNER TO estation;

--
-- TOC entry 4135 (class 0 OID 0)
-- Dependencies: 215
-- Name: legend_legend_id_seq; Type: SEQUENCE OWNED BY; Schema: analysis; Owner: estation
--

ALTER SEQUENCE analysis.legend_legend_id_seq OWNED BY analysis.legend.legend_id;


--
-- TOC entry 216 (class 1259 OID 99408)
-- Name: legend_step; Type: TABLE; Schema: analysis; Owner: estation
--

CREATE TABLE analysis.legend_step (
    legend_id integer NOT NULL,
    from_step double precision NOT NULL,
    to_step double precision NOT NULL,
    color_rgb character varying(11) NOT NULL,
    color_label character varying(255),
    group_label character varying(255)
);


ALTER TABLE analysis.legend_step OWNER TO estation;

--
-- TOC entry 4136 (class 0 OID 0)
-- Dependencies: 216
-- Name: COLUMN legend_step.color_rgb; Type: COMMENT; Schema: analysis; Owner: estation
--

COMMENT ON COLUMN analysis.legend_step.color_rgb IS 'a string of 3 bytes, in decimal format, comma separated, eg. 128, 36, 64';


--
-- TOC entry 244 (class 1259 OID 99892)
-- Name: logos; Type: TABLE; Schema: analysis; Owner: estation
--

CREATE TABLE analysis.logos (
    logo_id bigint NOT NULL,
    logo_filename character varying(80),
    logo_description character varying(255),
    active boolean DEFAULT true,
    deletable boolean DEFAULT true,
    defined_by character varying DEFAULT 'USER'::character varying,
    isdefault boolean DEFAULT false NOT NULL,
    orderindex_defaults integer
);


ALTER TABLE analysis.logos OWNER TO estation;

--
-- TOC entry 243 (class 1259 OID 99890)
-- Name: logos_logo_id_seq; Type: SEQUENCE; Schema: analysis; Owner: estation
--

CREATE SEQUENCE analysis.logos_logo_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE analysis.logos_logo_id_seq OWNER TO estation;

--
-- TOC entry 4137 (class 0 OID 0)
-- Dependencies: 243
-- Name: logos_logo_id_seq; Type: SEQUENCE OWNED BY; Schema: analysis; Owner: estation
--

ALTER SEQUENCE analysis.logos_logo_id_seq OWNED BY analysis.logos.logo_id;


--
-- TOC entry 217 (class 1259 OID 99414)
-- Name: product_legend; Type: TABLE; Schema: analysis; Owner: estation
--

CREATE TABLE analysis.product_legend (
    productcode character varying NOT NULL,
    subproductcode character varying NOT NULL,
    version character varying NOT NULL,
    legend_id bigint NOT NULL,
    default_legend boolean DEFAULT false
);


ALTER TABLE analysis.product_legend OWNER TO estation;

--
-- TOC entry 258 (class 1259 OID 100052)
-- Name: timeseries_drawproperties; Type: TABLE; Schema: analysis; Owner: estation
--

CREATE TABLE analysis.timeseries_drawproperties (
    productcode character varying NOT NULL,
    subproductcode character varying NOT NULL,
    version character varying NOT NULL,
    tsname_in_legend character varying,
    charttype character varying,
    linestyle character varying,
    linewidth integer,
    color character varying,
    yaxe_id character varying
);


ALTER TABLE analysis.timeseries_drawproperties OWNER TO estation;

--
-- TOC entry 260 (class 1259 OID 100067)
-- Name: user_graph_templates; Type: TABLE; Schema: analysis; Owner: estation
--

CREATE TABLE analysis.user_graph_templates (
    userid character varying(50) NOT NULL,
    workspaceid bigint NOT NULL,
    graph_tpl_id integer NOT NULL,
    graph_tpl_name character varying(80),
    istemplate boolean DEFAULT true NOT NULL,
    graphviewposition character varying(10),
    graphviewsize character varying(10),
    graph_type character varying,
    selectedtimeseries character varying,
    yearts character varying,
    tsfromperiod character varying,
    tstoperiod character varying,
    yearstocompare character varying,
    tsfromseason character varying,
    tstoseason character varying,
    wkt_geom character varying,
    selectedregionname character varying,
    disclaimerobjposition character varying(10),
    disclaimerobjcontent text,
    logosobjposition character varying(10),
    logosobjcontent text,
    showobjects boolean DEFAULT false NOT NULL,
    showtoolbar boolean DEFAULT true NOT NULL,
    auto_open boolean DEFAULT false,
    parent_tpl_id bigint
);


ALTER TABLE analysis.user_graph_templates OWNER TO estation;

--
-- TOC entry 259 (class 1259 OID 100065)
-- Name: user_graph_templates_graph_tpl_id_seq; Type: SEQUENCE; Schema: analysis; Owner: estation
--

CREATE SEQUENCE analysis.user_graph_templates_graph_tpl_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE analysis.user_graph_templates_graph_tpl_id_seq OWNER TO estation;

--
-- TOC entry 4138 (class 0 OID 0)
-- Dependencies: 259
-- Name: user_graph_templates_graph_tpl_id_seq; Type: SEQUENCE OWNED BY; Schema: analysis; Owner: estation
--

ALTER SEQUENCE analysis.user_graph_templates_graph_tpl_id_seq OWNED BY analysis.user_graph_templates.graph_tpl_id;


--
-- TOC entry 261 (class 1259 OID 100087)
-- Name: user_graph_tpl_drawproperties; Type: TABLE; Schema: analysis; Owner: estation
--

CREATE TABLE analysis.user_graph_tpl_drawproperties (
    graph_tpl_id bigint NOT NULL,
    graph_type character varying NOT NULL,
    graph_width integer,
    graph_height integer,
    graph_title character varying,
    graph_title_font_size integer,
    graph_title_font_color character varying,
    graph_subtitle character varying,
    graph_subtitle_font_size integer,
    graph_subtitle_font_color character varying,
    legend_position character varying,
    legend_font_size integer,
    legend_font_color character varying,
    xaxe_font_size integer,
    xaxe_font_color character varying
);


ALTER TABLE analysis.user_graph_tpl_drawproperties OWNER TO estation;

--
-- TOC entry 263 (class 1259 OID 100115)
-- Name: user_graph_tpl_timeseries_drawproperties; Type: TABLE; Schema: analysis; Owner: estation
--

CREATE TABLE analysis.user_graph_tpl_timeseries_drawproperties (
    graph_tpl_id bigint NOT NULL,
    productcode character varying NOT NULL,
    subproductcode character varying NOT NULL,
    version character varying NOT NULL,
    tsname_in_legend character varying,
    charttype character varying,
    linestyle character varying,
    linewidth integer,
    color character varying,
    yaxe_id character varying
);


ALTER TABLE analysis.user_graph_tpl_timeseries_drawproperties OWNER TO estation;

--
-- TOC entry 262 (class 1259 OID 100100)
-- Name: user_graph_tpl_yaxes; Type: TABLE; Schema: analysis; Owner: estation
--

CREATE TABLE analysis.user_graph_tpl_yaxes (
    graph_tpl_id bigint NOT NULL,
    yaxe_id character varying NOT NULL,
    title character varying,
    title_color character varying,
    title_font_size integer,
    min double precision,
    max double precision,
    unit character varying,
    opposite boolean DEFAULT false NOT NULL,
    aggregation_type character varying DEFAULT 'mean'::character varying,
    aggregation_min double precision,
    aggregation_max double precision
);


ALTER TABLE analysis.user_graph_tpl_yaxes OWNER TO estation;

--
-- TOC entry 255 (class 1259 OID 100011)
-- Name: user_map_templates; Type: TABLE; Schema: analysis; Owner: estation
--

CREATE TABLE analysis.user_map_templates (
    userid character varying(50) NOT NULL,
    workspaceid bigint NOT NULL,
    map_tpl_id integer NOT NULL,
    map_tpl_name character varying(80),
    istemplate boolean DEFAULT true NOT NULL,
    mapviewposition character varying(10),
    mapviewsize character varying(10),
    productcode character varying,
    subproductcode character varying,
    productversion character varying,
    mapsetcode character varying,
    legendid integer,
    legendlayout character varying(15) DEFAULT 'vertical'::character varying,
    legendobjposition character varying(10),
    showlegend boolean DEFAULT false NOT NULL,
    titleobjposition character varying(10),
    titleobjcontent text,
    disclaimerobjposition character varying(10),
    disclaimerobjcontent text,
    logosobjposition character varying(10),
    logosobjcontent text,
    showobjects boolean DEFAULT false NOT NULL,
    showtoolbar boolean DEFAULT true NOT NULL,
    showgraticule boolean DEFAULT false NOT NULL,
    scalelineobjposition character varying(10),
    vectorlayers character varying,
    outmask boolean DEFAULT false NOT NULL,
    outmaskfeature text,
    auto_open boolean DEFAULT false,
    zoomextent character varying,
    mapsize character varying,
    mapcenter character varying,
    parent_tpl_id bigint,
    showtimeline boolean DEFAULT false NOT NULL,
    productdate character varying
);


ALTER TABLE analysis.user_map_templates OWNER TO estation;

--
-- TOC entry 254 (class 1259 OID 100009)
-- Name: user_map_templates_map_tpl_id_seq; Type: SEQUENCE; Schema: analysis; Owner: estation
--

CREATE SEQUENCE analysis.user_map_templates_map_tpl_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE analysis.user_map_templates_map_tpl_id_seq OWNER TO estation;

--
-- TOC entry 4139 (class 0 OID 0)
-- Dependencies: 254
-- Name: user_map_templates_map_tpl_id_seq; Type: SEQUENCE OWNED BY; Schema: analysis; Owner: estation
--

ALTER SEQUENCE analysis.user_map_templates_map_tpl_id_seq OWNED BY analysis.user_map_templates.map_tpl_id;


--
-- TOC entry 242 (class 1259 OID 99881)
-- Name: user_role; Type: TABLE; Schema: analysis; Owner: estation
--

CREATE TABLE analysis.user_role (
    role_id integer NOT NULL,
    role_name character varying(50) NOT NULL,
    defined_by character varying DEFAULT 'USER'::character varying
);


ALTER TABLE analysis.user_role OWNER TO estation;

--
-- TOC entry 253 (class 1259 OID 99994)
-- Name: user_workspaces; Type: TABLE; Schema: analysis; Owner: estation
--

CREATE TABLE analysis.user_workspaces (
    userid character varying(50) NOT NULL,
    workspaceid integer NOT NULL,
    workspacename character varying(80) NOT NULL,
    isdefault boolean DEFAULT false NOT NULL,
    pinned boolean DEFAULT false NOT NULL,
    shownewgraph boolean DEFAULT true NOT NULL,
    showbackgroundlayer boolean DEFAULT false NOT NULL,
    showindefault boolean DEFAULT false
);


ALTER TABLE analysis.user_workspaces OWNER TO estation;

--
-- TOC entry 252 (class 1259 OID 99992)
-- Name: user_workspaces_workspaceid_seq; Type: SEQUENCE; Schema: analysis; Owner: estation
--

CREATE SEQUENCE analysis.user_workspaces_workspaceid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE analysis.user_workspaces_workspaceid_seq OWNER TO estation;

--
-- TOC entry 4140 (class 0 OID 0)
-- Dependencies: 252
-- Name: user_workspaces_workspaceid_seq; Type: SEQUENCE OWNED BY; Schema: analysis; Owner: estation
--

ALTER SEQUENCE analysis.user_workspaces_workspaceid_seq OWNED BY analysis.user_workspaces.workspaceid;


--
-- TOC entry 247 (class 1259 OID 99917)
-- Name: users; Type: TABLE; Schema: analysis; Owner: estation
--

CREATE TABLE analysis.users (
    userid character varying(50) NOT NULL,
    username character varying(80) NOT NULL,
    password character varying(32),
    userlevel integer NOT NULL,
    email character varying(50),
    "timestamp" numeric(11,0),
    prefered_language character varying DEFAULT 'eng'::character varying
);


ALTER TABLE analysis.users OWNER TO estation;

--
-- TOC entry 3907 (class 2604 OID 99927)
-- Name: layers layerid; Type: DEFAULT; Schema: analysis; Owner: estation
--

ALTER TABLE ONLY analysis.layers ALTER COLUMN layerid SET DEFAULT nextval('analysis.layers_layerid_seq'::regclass);


--
-- TOC entry 3896 (class 2604 OID 99545)
-- Name: legend legend_id; Type: DEFAULT; Schema: analysis; Owner: estation
--

ALTER TABLE ONLY analysis.legend ALTER COLUMN legend_id SET DEFAULT nextval('analysis.legend_legend_id_seq'::regclass);


--
-- TOC entry 3901 (class 2604 OID 99895)
-- Name: logos logo_id; Type: DEFAULT; Schema: analysis; Owner: estation
--

ALTER TABLE ONLY analysis.logos ALTER COLUMN logo_id SET DEFAULT nextval('analysis.logos_logo_id_seq'::regclass);


--
-- TOC entry 3942 (class 2604 OID 100070)
-- Name: user_graph_templates graph_tpl_id; Type: DEFAULT; Schema: analysis; Owner: estation
--

ALTER TABLE ONLY analysis.user_graph_templates ALTER COLUMN graph_tpl_id SET DEFAULT nextval('analysis.user_graph_templates_graph_tpl_id_seq'::regclass);


--
-- TOC entry 3933 (class 2604 OID 100014)
-- Name: user_map_templates map_tpl_id; Type: DEFAULT; Schema: analysis; Owner: estation
--

ALTER TABLE ONLY analysis.user_map_templates ALTER COLUMN map_tpl_id SET DEFAULT nextval('analysis.user_map_templates_map_tpl_id_seq'::regclass);


--
-- TOC entry 3924 (class 2604 OID 99997)
-- Name: user_workspaces workspaceid; Type: DEFAULT; Schema: analysis; Owner: estation
--

ALTER TABLE ONLY analysis.user_workspaces ALTER COLUMN workspaceid SET DEFAULT nextval('analysis.user_workspaces_workspaceid_seq'::regclass);


--
-- TOC entry 3956 (class 2606 OID 99547)
-- Name: legend_step Primary key violation; Type: CONSTRAINT; Schema: analysis; Owner: estation
--

ALTER TABLE ONLY analysis.legend_step
    ADD CONSTRAINT "Primary key violation" PRIMARY KEY (legend_id, from_step, to_step);


--
-- TOC entry 3972 (class 2606 OID 100041)
-- Name: graph_drawproperties graph_drawproperties_pk; Type: CONSTRAINT; Schema: analysis; Owner: estation
--

ALTER TABLE ONLY analysis.graph_drawproperties
    ADD CONSTRAINT graph_drawproperties_pk PRIMARY KEY (graph_type);


--
-- TOC entry 3974 (class 2606 OID 100051)
-- Name: graph_yaxes graph_yaxes_pk; Type: CONSTRAINT; Schema: analysis; Owner: estation
--

ALTER TABLE ONLY analysis.graph_yaxes
    ADD CONSTRAINT graph_yaxes_pk PRIMARY KEY (yaxe_id);


--
-- TOC entry 3950 (class 2606 OID 99549)
-- Name: i18n i18n_pkey; Type: CONSTRAINT; Schema: analysis; Owner: estation
--

ALTER TABLE ONLY analysis.i18n
    ADD CONSTRAINT i18n_pkey PRIMARY KEY (label);


--
-- TOC entry 3952 (class 2606 OID 99551)
-- Name: languages languages_pkey; Type: CONSTRAINT; Schema: analysis; Owner: estation
--

ALTER TABLE ONLY analysis.languages
    ADD CONSTRAINT languages_pkey PRIMARY KEY (langcode);


--
-- TOC entry 3966 (class 2606 OID 99948)
-- Name: layers layers_pkey; Type: CONSTRAINT; Schema: analysis; Owner: estation
--

ALTER TABLE ONLY analysis.layers
    ADD CONSTRAINT layers_pkey PRIMARY KEY (layerid);


--
-- TOC entry 3954 (class 2606 OID 99553)
-- Name: legend legend_pkey; Type: CONSTRAINT; Schema: analysis; Owner: estation
--

ALTER TABLE ONLY analysis.legend
    ADD CONSTRAINT legend_pkey PRIMARY KEY (legend_id);


--
-- TOC entry 3962 (class 2606 OID 99904)
-- Name: logos logos_pkey; Type: CONSTRAINT; Schema: analysis; Owner: estation
--

ALTER TABLE ONLY analysis.logos
    ADD CONSTRAINT logos_pkey PRIMARY KEY (logo_id);


--
-- TOC entry 3958 (class 2606 OID 99555)
-- Name: product_legend product_legend_pkey; Type: CONSTRAINT; Schema: analysis; Owner: estation
--

ALTER TABLE ONLY analysis.product_legend
    ADD CONSTRAINT product_legend_pkey PRIMARY KEY (productcode, subproductcode, version, legend_id);


--
-- TOC entry 3976 (class 2606 OID 100059)
-- Name: timeseries_drawproperties timeseries_drawproperties_new_pk; Type: CONSTRAINT; Schema: analysis; Owner: estation
--

ALTER TABLE ONLY analysis.timeseries_drawproperties
    ADD CONSTRAINT timeseries_drawproperties_new_pk PRIMARY KEY (productcode, subproductcode, version);


--
-- TOC entry 3978 (class 2606 OID 100081)
-- Name: user_graph_templates user_graph_templates_graph_tpl_id_unique; Type: CONSTRAINT; Schema: analysis; Owner: estation
--

ALTER TABLE ONLY analysis.user_graph_templates
    ADD CONSTRAINT user_graph_templates_graph_tpl_id_unique UNIQUE (graph_tpl_id);


--
-- TOC entry 3980 (class 2606 OID 100079)
-- Name: user_graph_templates user_graph_templates_pkey; Type: CONSTRAINT; Schema: analysis; Owner: estation
--

ALTER TABLE ONLY analysis.user_graph_templates
    ADD CONSTRAINT user_graph_templates_pkey PRIMARY KEY (userid, workspaceid, graph_tpl_id);


--
-- TOC entry 3982 (class 2606 OID 100094)
-- Name: user_graph_tpl_drawproperties user_graph_tpl_drawproperties_pk; Type: CONSTRAINT; Schema: analysis; Owner: estation
--

ALTER TABLE ONLY analysis.user_graph_tpl_drawproperties
    ADD CONSTRAINT user_graph_tpl_drawproperties_pk PRIMARY KEY (graph_tpl_id, graph_type);


--
-- TOC entry 3986 (class 2606 OID 100122)
-- Name: user_graph_tpl_timeseries_drawproperties user_graph_tpl_timeseries_drawproperties_pk; Type: CONSTRAINT; Schema: analysis; Owner: estation
--

ALTER TABLE ONLY analysis.user_graph_tpl_timeseries_drawproperties
    ADD CONSTRAINT user_graph_tpl_timeseries_drawproperties_pk PRIMARY KEY (graph_tpl_id, productcode, subproductcode, version);


--
-- TOC entry 3984 (class 2606 OID 100109)
-- Name: user_graph_tpl_yaxes user_graph_tpl_yaxes_pk; Type: CONSTRAINT; Schema: analysis; Owner: estation
--

ALTER TABLE ONLY analysis.user_graph_tpl_yaxes
    ADD CONSTRAINT user_graph_tpl_yaxes_pk PRIMARY KEY (graph_tpl_id, yaxe_id);


--
-- TOC entry 3970 (class 2606 OID 100028)
-- Name: user_map_templates user_map_templates_pkey; Type: CONSTRAINT; Schema: analysis; Owner: estation
--

ALTER TABLE ONLY analysis.user_map_templates
    ADD CONSTRAINT user_map_templates_pkey PRIMARY KEY (userid, workspaceid, map_tpl_id);


--
-- TOC entry 3960 (class 2606 OID 99889)
-- Name: user_role user_role_pkey; Type: CONSTRAINT; Schema: analysis; Owner: estation
--

ALTER TABLE ONLY analysis.user_role
    ADD CONSTRAINT user_role_pkey PRIMARY KEY (role_id);


--
-- TOC entry 3968 (class 2606 OID 100003)
-- Name: user_workspaces user_workspaces_pkey; Type: CONSTRAINT; Schema: analysis; Owner: estation
--

ALTER TABLE ONLY analysis.user_workspaces
    ADD CONSTRAINT user_workspaces_pkey PRIMARY KEY (userid, workspaceid);


--
-- TOC entry 3964 (class 2606 OID 99921)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: analysis; Owner: estation
--

ALTER TABLE ONLY analysis.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (userid);


--
-- TOC entry 3988 (class 2606 OID 99599)
-- Name: product_legend legend_pkey; Type: FK CONSTRAINT; Schema: analysis; Owner: estation
--

ALTER TABLE ONLY analysis.product_legend
    ADD CONSTRAINT legend_pkey FOREIGN KEY (legend_id) REFERENCES analysis.legend(legend_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3987 (class 2606 OID 99604)
-- Name: legend_step legend_step_legend_id_fkey; Type: FK CONSTRAINT; Schema: analysis; Owner: estation
--

ALTER TABLE ONLY analysis.legend_step
    ADD CONSTRAINT legend_step_legend_id_fkey FOREIGN KEY (legend_id) REFERENCES analysis.legend(legend_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3989 (class 2606 OID 100350)
-- Name: product_legend sub_product_product_legend_fk; Type: FK CONSTRAINT; Schema: analysis; Owner: estation
--

ALTER TABLE ONLY analysis.product_legend
    ADD CONSTRAINT sub_product_product_legend_fk FOREIGN KEY (productcode, version, subproductcode) REFERENCES products.sub_product(productcode, version, subproductcode) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3992 (class 2606 OID 100060)
-- Name: timeseries_drawproperties timeseries_drawproperties_new_yaxe_id_fkey; Type: FK CONSTRAINT; Schema: analysis; Owner: estation
--

ALTER TABLE ONLY analysis.timeseries_drawproperties
    ADD CONSTRAINT timeseries_drawproperties_new_yaxe_id_fkey FOREIGN KEY (yaxe_id) REFERENCES analysis.graph_yaxes(yaxe_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3993 (class 2606 OID 100082)
-- Name: user_graph_templates user_graph_templates_user_workspaces_fkey; Type: FK CONSTRAINT; Schema: analysis; Owner: estation
--

ALTER TABLE ONLY analysis.user_graph_templates
    ADD CONSTRAINT user_graph_templates_user_workspaces_fkey FOREIGN KEY (userid, workspaceid) REFERENCES analysis.user_workspaces(userid, workspaceid) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3994 (class 2606 OID 100095)
-- Name: user_graph_tpl_drawproperties user_graph_tpl_drawproperties_user_graph_templates_fkey; Type: FK CONSTRAINT; Schema: analysis; Owner: estation
--

ALTER TABLE ONLY analysis.user_graph_tpl_drawproperties
    ADD CONSTRAINT user_graph_tpl_drawproperties_user_graph_templates_fkey FOREIGN KEY (graph_tpl_id) REFERENCES analysis.user_graph_templates(graph_tpl_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3996 (class 2606 OID 100123)
-- Name: user_graph_tpl_timeseries_drawproperties user_graph_tpl_timeseries_drawproperties_graph_yaxes_fkey; Type: FK CONSTRAINT; Schema: analysis; Owner: estation
--

ALTER TABLE ONLY analysis.user_graph_tpl_timeseries_drawproperties
    ADD CONSTRAINT user_graph_tpl_timeseries_drawproperties_graph_yaxes_fkey FOREIGN KEY (yaxe_id) REFERENCES analysis.graph_yaxes(yaxe_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3997 (class 2606 OID 100128)
-- Name: user_graph_tpl_timeseries_drawproperties user_graph_tpl_ts_drawproperties_user_graph_tpl_fkey; Type: FK CONSTRAINT; Schema: analysis; Owner: estation
--

ALTER TABLE ONLY analysis.user_graph_tpl_timeseries_drawproperties
    ADD CONSTRAINT user_graph_tpl_ts_drawproperties_user_graph_tpl_fkey FOREIGN KEY (graph_tpl_id) REFERENCES analysis.user_graph_templates(graph_tpl_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3995 (class 2606 OID 100110)
-- Name: user_graph_tpl_yaxes user_graph_tpl_yaxes_user_graph_templates_fkey; Type: FK CONSTRAINT; Schema: analysis; Owner: estation
--

ALTER TABLE ONLY analysis.user_graph_tpl_yaxes
    ADD CONSTRAINT user_graph_tpl_yaxes_user_graph_templates_fkey FOREIGN KEY (graph_tpl_id) REFERENCES analysis.user_graph_templates(graph_tpl_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3991 (class 2606 OID 100029)
-- Name: user_map_templates user_map_templates_user_workspaces_fkey; Type: FK CONSTRAINT; Schema: analysis; Owner: estation
--

ALTER TABLE ONLY analysis.user_map_templates
    ADD CONSTRAINT user_map_templates_user_workspaces_fkey FOREIGN KEY (userid, workspaceid) REFERENCES analysis.user_workspaces(userid, workspaceid) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3990 (class 2606 OID 100004)
-- Name: user_workspaces user_workspaces_users_fkey; Type: FK CONSTRAINT; Schema: analysis; Owner: estation
--

ALTER TABLE ONLY analysis.user_workspaces
    ADD CONSTRAINT user_workspaces_users_fkey FOREIGN KEY (userid) REFERENCES analysis.users(userid) ON UPDATE CASCADE ON DELETE CASCADE;


-- Completed on 2021-03-08 17:36:45 CET

--
-- PostgreSQL database dump complete
--


--
-- TOC entry 10 (class 2615 OID 91164)
-- Name: climsoft; Type: SCHEMA; Schema: -; Owner: estation
--

CREATE SCHEMA climsoft;


ALTER SCHEMA climsoft OWNER TO estation;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 235 (class 1259 OID 91372)
-- Name: obselement; Type: TABLE; Schema: climsoft; Owner: estation
--

CREATE TABLE climsoft.obselement (
    elementid bigint DEFAULT '0'::bigint NOT NULL,
    abbreviation character varying(255) DEFAULT NULL::character varying,
    elementname character varying(255) DEFAULT NULL::character varying,
    description character varying(255) DEFAULT NULL::character varying,
    elementscale numeric(8,2) DEFAULT NULL::numeric,
    upperlimit character varying(255) DEFAULT NULL::character varying,
    lowerlimit character varying(255) DEFAULT NULL::character varying,
    units character varying(255) DEFAULT NULL::character varying,
    elementtype character varying(50) DEFAULT NULL::character varying,
    qctotalrequired integer DEFAULT 0,
    selected smallint DEFAULT '0'::smallint NOT NULL
);


ALTER TABLE climsoft.obselement OWNER TO estation;

--
-- TOC entry 236 (class 1259 OID 91389)
-- Name: observationfinal; Type: TABLE; Schema: climsoft; Owner: estation
--

CREATE TABLE climsoft.observationfinal (
    recordedfrom character varying(255) NOT NULL,
    describedby bigint NOT NULL,
    obsdatetime date NOT NULL,
    obslevel character varying(255) DEFAULT 'surface'::character varying,
    obsvalue numeric(8,2) DEFAULT NULL::numeric,
    flag character varying(255) DEFAULT 'N'::character varying,
    period integer,
    qcstatus integer DEFAULT 0,
    qctypelog text,
    acquisitiontype integer DEFAULT 0,
    dataform character varying(255) DEFAULT NULL::character varying,
    capturedby character varying(255) DEFAULT NULL::character varying,
    mark smallint,
    temperatureunits character varying(255) DEFAULT NULL::character varying,
    precipitationunits character varying(255) DEFAULT NULL::character varying,
    cloudheightunits character varying(255) DEFAULT NULL::character varying,
    visunits character varying(255) DEFAULT NULL::character varying,
    datasourcetimezone integer DEFAULT 0
);


ALTER TABLE climsoft.observationfinal OWNER TO estation;

--
-- TOC entry 237 (class 1259 OID 91407)
-- Name: station; Type: TABLE; Schema: climsoft; Owner: estation
--

CREATE TABLE climsoft.station (
    stationid character varying(255) NOT NULL,
    stationname character varying(255) DEFAULT NULL::character varying,
    wmoid character varying(20) DEFAULT NULL::character varying,
    icaoid character varying(20) DEFAULT NULL::character varying,
    latitude numeric(11,6) DEFAULT NULL::numeric,
    qualifier character varying(20) DEFAULT NULL::character varying,
    longitude numeric(11,6) DEFAULT NULL::numeric,
    elevation character varying(255) DEFAULT NULL::character varying,
    geolocationmethod character varying(255) DEFAULT NULL::character varying,
    geolocationaccuracy numeric(11,6) DEFAULT NULL::numeric,
    openingdatetime character varying(50) DEFAULT NULL::character varying,
    closingdatetime character varying(50) DEFAULT NULL::character varying,
    country character varying(50) DEFAULT NULL::character varying,
    authority character varying(255) DEFAULT NULL::character varying,
    adminregion character varying(255) DEFAULT NULL::character varying,
    drainagebasin character varying(255) DEFAULT NULL::character varying,
    wacaselection smallint DEFAULT '0'::smallint,
    cptselection smallint DEFAULT '0'::smallint,
    stationoperational smallint DEFAULT '0'::smallint
);


ALTER TABLE climsoft.station OWNER TO estation;

--
-- TOC entry 3926 (class 2606 OID 91642)
-- Name: obselement obselement_pk; Type: CONSTRAINT; Schema: climsoft; Owner: estation
--

ALTER TABLE ONLY climsoft.obselement
    ADD CONSTRAINT obselement_pk PRIMARY KEY (elementid);


--
-- TOC entry 3928 (class 2606 OID 91644)
-- Name: observationfinal observationfinal_pk; Type: CONSTRAINT; Schema: climsoft; Owner: estation
--

ALTER TABLE ONLY climsoft.observationfinal
    ADD CONSTRAINT observationfinal_pk PRIMARY KEY (recordedfrom, describedby, obsdatetime);


--
-- TOC entry 3930 (class 2606 OID 91646)
-- Name: station station_pk; Type: CONSTRAINT; Schema: climsoft; Owner: estation
--

ALTER TABLE ONLY climsoft.station
    ADD CONSTRAINT station_pk PRIMARY KEY (stationid);


--
-- TOC entry 3931 (class 2606 OID 91769)
-- Name: observationfinal obselement_observationfinal_fk; Type: FK CONSTRAINT; Schema: climsoft; Owner: estation
--

ALTER TABLE ONLY climsoft.observationfinal
    ADD CONSTRAINT obselement_observationfinal_fk FOREIGN KEY (describedby) REFERENCES climsoft.obselement(elementid) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3932 (class 2606 OID 91774)
-- Name: observationfinal station_observationfinal_fk; Type: FK CONSTRAINT; Schema: climsoft; Owner: estation
--

ALTER TABLE ONLY climsoft.observationfinal
    ADD CONSTRAINT station_observationfinal_fk FOREIGN KEY (recordedfrom) REFERENCES climsoft.station(stationid) ON UPDATE CASCADE ON DELETE SET NULL;


-- Completed on 2021-03-08 11:54:34 CET

--
-- PostgreSQL database dump complete
--

