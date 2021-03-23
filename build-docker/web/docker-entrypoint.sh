#!/bin/bash

# echo $(id -un)

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

# Start the Climate Station
apache2ctl -D FOREGROUND

# sleep 300


