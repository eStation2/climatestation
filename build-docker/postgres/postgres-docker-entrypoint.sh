#!/bin/bash

# /usr/bin/env bash

pg_ctl -D /var/lib/postgresql/data -l logfile start

# echo "Start postgresql"
# /etc/init.d/postgresql start

#echo "Run the postgresql entrypoint"
#source /docker-entrypoint.sh

echo "Running setup_estationdb.sh"
source /setup_estationdb.sh

# This script will run as the postgres user due to the Dockerfile USER directive
# set -e

sleep 10
echo "Restarting postgresql"
/etc/init.d/postgresql restart

# set -e
# internal start of server in order to allow set-up using psql-client
# does not listen on external TCP/IP and waits until start finishes
# pg_ctl -D "/var/lib/postgres/data" -o "-c listen_addresses=''" -w start
# source /setup_estationdb.sh