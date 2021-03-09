
CREATE TABLE IF NOT EXISTS cmd_result (str text);

CREATE OR REPLACE FUNCTION InitUpgradeDB (dbVersion int)
RETURNS void AS $$
DECLARE
BEGIN
        IF EXISTS (SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'products' AND table_name = 'product')) THEN
			raise notice 'Create fresh estationdb database structure';
			copy cmd_result from program 'psql -h postgres -U estation -d estationdb -w -f /var/tmp/products_dump_structure_only.sql >/var/log/climatestation/products_dump_structure_only.log 2>/var/log/climatestation/products_dump_structure_only.err';
        END IF;

        IF EXISTS (SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'climsoft' AND table_name = 'station')) THEN
			raise notice 'Create climsoft schema and structure';
			copy cmd_result from program 'psql -h postgres -U estation -d estationdb -w -f /var/tmp/climsoft_schema_structure.sql >/var/log/climatestation/climsoft_schema_structure.log 2>/var/log/climatestation/climsoft_schema_structure.err';
        END IF;

		IF EXISTS (SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'products' AND table_name = 'db_version')) THEN
			raise notice 'Create table products.db_version';
			copy cmd_result from program 'psql -h postgres -U estation -d estationdb -w -f /var/tmp/create_table_db_version.sql >/var/log/climatestation/create_table_db_version.log 2>/var/log/climatestation/create_table_db_version.err';
        END IF;

		IF (select db_version from products.db_version) < dbVersion THEN
			raise notice 'Update database structure';
			copy cmd_result from program 'psql -h postgres -U estation -d estationdb -w -f /var/tmp/update_db_structure.sql >/var/log/climatestation/update_db_structure.log 2>/var/log/climatestation/update_db_structure.err';
			raise notice 'Populate/update data';
			copy cmd_result from program 'psql -h postgres -U estation -d estationdb -w -f /var/tmp/update_insert_jrc_data.sql >/var/log/climatestation/update_insert_jrc_data.log 2>/var/log/climatestation/update_insert_jrc_data.err';
			raise notice 'Update db_version';
			update products.db_version SET db_version=dbVersion;

        END IF;
END;
$$ language plpgsql;

SELECT InitUpgradeDB(101);
select * from cmd_result;


-- CREATE FUNCTION callSQLScript(scriptPath text, scriptName text)
-- RETURNS void AS $$
--     #!/bin/sh
--     psql -h postgres -U estation -d estationdb -w -f scriptPath/scriptName >/var/log/climatestation/scriptName.log 2>/var/log/climatestation/scriptName.err
-- $$ LANGUAGE plsh;
--
-- SELECT callSQLScript('/tmp/scripts/create_db.sql');

-- CREATE TABLE IF NOT EXISTS cmd_result (str text);

DO $$
BEGIN
        IF NOT (SELECT EXISTS (SELECT * FROM information_schema.tables WHERE table_schema = 'products' AND table_name = 'product')) THEN
			raise notice 'Create fresh estationdb database structure';
			-- copy cmd_result from program 'psql -h postgres -U estation -d estationdb -w -f /var/tmp/products_dump_structure_only.sql >/var/log/climatestation/products_dump_structure_only.log 2>/var/log/climatestation/products_dump_structure_only.err';
        END IF;

        IF NOT (SELECT EXISTS (SELECT * FROM information_schema.tables WHERE table_schema = 'climsoft' AND table_name = 'station')) THEN
			raise notice 'Create climsoft schema and structure';
			copy cmd_result from program 'psql -h localhost -U estation -d estationdb -w -f /var/tmp/climsoft_schema_structure.sql >/var/log/climatestation/climsoft_schema_structure.log 2>/var/log/climatestation/climsoft_schema_structure.err';
        END IF;

-- 		IF EXISTS (SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'products' AND table_name = 'db_version')) THEN
-- 			raise notice 'Create table products.db_version';
-- 			copy cmd_result from program 'psql estationdb -U estation -d estationdb -w -f /var/tmp/create_table_db_version.sql >/var/log/climatestation/create_table_db_version.log 2>/var/log/climatestation/create_table_db_version.err';
--         END IF;

-- 		IF (select db_version from products.db_version) < dbVersion THEN
-- 			raise notice 'Update database structure';
-- 			copy cmd_result from program 'psql estationdb -U estation -d estationdb -w -f /var/tmp/update_db_structure.sql >/var/log/climatestation/update_db_structure.log 2>/var/log/climatestation/update_db_structure.err';
-- 			raise notice 'Populate/update data';
-- 			copy cmd_result from program 'psql estationdb -U estation -d estationdb -w -f /var/tmp/update_insert_jrc_data.sql >/var/log/climatestation/update_insert_jrc_data.log 2>/var/log/climatestation/update_insert_jrc_data.err';
-- 			raise notice 'Update db_version';
-- 			-- update products.db_version SET db_version=dbVersion;

--         END IF;
END $$;
