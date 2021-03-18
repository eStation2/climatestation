#!/usr/bin/env bash

set -e

# If the database does not exist on the target machine create and populate it (with version 100 structure and data)
if [[ `su - postgres -c "psql postgres -d estationdb -c \"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'products' AND table_name = 'mapset') as x;\"" 2> /dev/null|grep t` == '' ]]; then
    # First install from scratch the database structure
    echo "`date +'%Y-%m-%d %H:%M '` Create database structure"
    # Create database initial version (100)
    psql -h postgres -U estation -d estationdb -w -f /var/www/climatestation/database/dbInstall/install_db_structure.sql >/var/log/climatestation/install_db_structure.log 2>/var/log/climatestation/install_db_structure.err
    # Update Tables data (both for upgrade and installation from scratch)
    echo "`date +'%Y-%m-%d %H:%M '` Populate/update tables"
    psql -h postgres -U estation -d estationdb -w -f /var/www/climatestation/database/dbInstall/import_jrc_data.sql >/var/log/climatestation/import_jrc_data.log 2>/var/log/climatestation/import_jrc_data.err

    # Set the DB version to initial/first version number 100
    psql -h postgres -U estation -d estationdb -w -c "INSERT INTO products.db_version(db_version) VALUES (100)"

else
    echo "`date +'%Y-%m-%d %H:%M '` Database structure already exists. Continue"
fi

# If the database exist, but it is not the latest version -> do the upgrade to the current version
if [[ `su - postgres -c "psql postgres -d estationdb -c \"select db_version from products.db_version;\""  2>/dev/null|grep -m1 -o '[0-9]\+'` < ${DB_VERSION} ]]; then
    # Update database structure to current release
    echo "`date +'%Y-%m-%d %H:%M '` Update database structure"
    psql -h postgres -U estation -d estationdb -w -f /var/www/climatestation/database/dbInstall/update_structure.sql >/var/log/climatestation/update_structure.log 2>/var/log/climatestation/update_structure.err

    echo "`date +'%Y-%m-%d %H:%M '` Populate/update tables"
    psql -h postgres -U estation -d estationdb -w -f /var/www/climatestation/database/dbInstall/import_jrc_data.sql >/var/log/climatestation/import_jrc_data.log 2>/var/log/climatestation/import_jrc_data.err

    # Update table products.db_version to value DB_VERSION
    psql -h postgres -U estation -d estationdb -w -c "update products.db_version SET db_version='${DB_VERSION}'"

    # Activate the User THEMA in the thema table (since 2.1.0)
#    thema=`grep -i thema /climatestation/settings/system_settings.ini | sed 's/thema =//'| sed 's/ //g'`
#    psql -h postgres -U estation -d estationdb -w -c "update products.thema SET activated=TRUE WHERE thema_id='$thema'"
#    echo "`date +'%Y-%m-%d %H:%M '` Thema activated in the products.thema table"

else
  echo "`date +'%Y-%m-%d %H:%M '` DB estationdb already uptodate. Continue"
fi

