#!/bin/bash
##echo "Starting container $(hostname)"
#sleep 2
##export PYTHONPATH=$PYTHONPATH:'var/www/climatestation'
#python -c 'import webpy_esapp_helpers; webpy_esapp_helpers.importJRCRefWorkspaces(version=1)'
#sleep 2
#python -c 'from database.dbInstall.install_update_db_in_postgres_container import install_update_db; install_update_db()'
#sleep 3
python apps/impact/Gui/libs_python/my_server.py localhost 8899 9999 &
apache2ctl -D FOREGROUND


