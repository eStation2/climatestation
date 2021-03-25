#!/bin/bash

export USER_ID=$(id -u)
export GROUP_ID=$(id -g)

export DATA_VOLUME=/data
export TMP_VOLUME=/tmp/climatestation

# Create mandatory directories and set their permission
mkdir -p log
mkdir -p log/mapserver
mkdir -p log/postgres
mkdir -p log/web

mkdir -p ${DATA_VOLUME}
mkdir -p ${DATA_VOLUME}/processing
mkdir -p ${DATA_VOLUME}/ingest
mkdir -p ${DATA_VOLUME}/ingest.wrong
mkdir -p ${DATA_VOLUME}/static_data
mkdir -p ${DATA_VOLUME}/static_data/completeness_bars
mkdir -p ${DATA_VOLUME}/static_data/db_dump
mkdir -p ${DATA_VOLUME}/static_data/docs
mkdir -p ${DATA_VOLUME}/static_data/get_lists
mkdir -p ${DATA_VOLUME}/static_data/layers
mkdir -p ${DATA_VOLUME}/static_data/log
mkdir -p ${DATA_VOLUME}/static_data/logos
mkdir -p ${DATA_VOLUME}/static_data/requests
mkdir -p ${DATA_VOLUME}/static_data/settings
mkdir -p /tmp/climatestation
mkdir -p /tmp/climatestation/services

# TODO: get layers and logos (and docs?) from our JRC FTP and extract them into their respective dir under static_data.

chmod 775 -R ${DATA_VOLUME}
chmod 775 -R /tmp/climatestation

# TODO: get layers and logos (and docs?) from our JRC FTP and extract them into their respective dir under static_data.

chmod 775 -R /data
chmod 775 -R /tmp

# create an external docker volume for the postgresql data:
docker volume create --name cs-docker-postgresql12-volume -d local

# Build and run the climate station containers: mapserver, potsgres and web
docker-compose -f ./docker-compose-JRC.yml up -d --build

# Run script that installs or update the CS DB
docker exec -ti postgres sh -c "/install_update_db.sh"
