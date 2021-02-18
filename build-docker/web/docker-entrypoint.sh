#!/bin/bash
##echo "Starting container $(hostname)"
#sleep 2
##export PYTHONPATH=$PYTHONPATH:'var/www/climatestation'
#python -c 'import webpy_esapp_helpers; webpy_esapp_helpers.importJRCRefWorkspaces(version=1)'
#sleep 20
#python database/dbInstall/install_update_db.py
# /root/wait-for-it.sh postgres:5432 -s -t 60 -- python database/dbInstall/install_update_db.py &

#sleep 5
python apps/impact/Gui/libs_python/my_server.py localhost 8899 9999 &
apache2ctl -D FOREGROUND


