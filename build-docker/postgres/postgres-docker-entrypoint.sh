#!/bin/bash

mkdir -p /var/lib/postgresql/12
chown postgres:postgres -R /var/lib/postgresql
chown postgres:postgres -R /var/lib/postgresql/12
install -d -m 0755 -o postgres -g postgres /var/lib/postgresql
install -d -m 0755 -o postgres -g postgres /var/lib/postgresql/12
install -d -m 0755 -o postgres -g postgres /var/log/climatestation
install -d -m 0755 -o postgres -g postgres /data/static_data/db_dump
chown --changes --silent --no-dereference --recursive \
        --from=0:0 ${USER_ID}:${GROUP_ID} \
        /var/lib/postgresql \
        /var/lib/postgresql/12

chown --changes --silent --no-dereference --recursive \
    --from=101:102 ${USER_ID}:${GROUP_ID} \
    /var/lib/postgresql \
    /var/lib/postgresql/12 \
    /var/log/climatestation \
    /data/static_data/db_dump


# /usr/bin/env bash

#pg_ctl -D /var/lib/postgresql/data -l logfile start

# echo "Start postgresql"
/etc/init.d/postgresql restart

#echo "Run the postgresql entrypoint"
#source /docker-entrypoint.sh

#echo "Running setup_estationdb.sh"
#source /setup_estationdb.sh

# This script will run as the postgres user due to the Dockerfile USER directive
# set -e

#sleep 10
#echo "Restarting postgresql"
#/etc/init.d/postgresql restart

# set -e
# internal start of server in order to allow set-up using psql-client
# does not listen on external TCP/IP and waits until start finishes
# pg_ctl -D "/var/lib/postgres/data" -o "-c listen_addresses=''" -w start
# source /setup_estationdb.sh