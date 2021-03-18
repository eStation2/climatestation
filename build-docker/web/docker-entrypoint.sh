#!/bin/bash
##echo "Starting container $(hostname)"
#sleep 2
##export PYTHONPATH=$PYTHONPATH:'var/www/climatestation'
#python -c 'import webpy_esapp_helpers; webpy_esapp_helpers.importJRCRefWorkspaces(version=1)'
#sleep 20
#python database/dbInstall/install_update_db.py
# /root/wait-for-it.sh postgres:5432 -s -t 60 -- python database/dbInstall/install_update_db.py &

echo $(id -un)

# Create mandatory directories and set their permission
#mkdir -p /data
#mkdir -p /data/processing
#mkdir -p /data/ingest
#mkdir -p /data/ingest.wrong
#mkdir -p /data/static_data
#mkdir -p /data/static_data/completeness_bars
#mkdir -p /data/static_data/db_dump
#mkdir -p /data/static_data/docs
#mkdir -p /data/static_data/get_lists
#mkdir -p /data/static_data/layers
#mkdir -p /data/static_data/log
#mkdir -p /data/static_data/logos
#mkdir -p /data/static_data/requests
#mkdir -p /data/static_data/settings
#mkdir -p /tmp/climatestation
#mkdir -p /tmp/climatestation/services

# chmod 775 -R /data

USER_SETTINGS=/data/static_data/settings/user_settings.ini
if [ ! -f "$USER_SETTINGS" ]; then
    echo "$USER_SETTINGS does not exist. Copy from source code."
    cp /var/www/climatestation/config/install/user_settings.ini /data/static_data/settings/
fi
SYSTEM_SETTINGS=/data/static_data/settings/system_settings.ini
if [ ! -f "$SYSTEM_SETTINGS" ]; then
    echo "$SYSTEM_SETTINGS does not exist. Copy from source code."
    cp /var/www/climatestation/config/install/system_settings.ini /data/static_data/settings/
fi

# Start Impact toolbox
# python apps/impact/Gui/libs_python/my_server.py localhost 8899 9999 &

# Start the Climate Station
apache2ctl -D FOREGROUND

# sleep 300
# python &

