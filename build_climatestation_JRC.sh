#!/bin/bash

export USER_ID=$(id -u)
export GROUP_ID=$(id -g)

# Create mandatory directories and set their permission
mkdir -p /data
mkdir -p /data/processing
mkdir -p /data/ingest
mkdir -p /data/ingest.wrong
mkdir -p /data/static_data
mkdir -p /data/static_data/completeness_bars
mkdir -p /data/static_data/db_dump
mkdir -p /data/static_data/docs
mkdir -p /data/static_data/get_lists
mkdir -p /data/static_data/layers
mkdir -p /data/static_data/log
mkdir -p /data/static_data/logos
mkdir -p /data/static_data/requests
mkdir -p /data/static_data/settings
mkdir -p /tmp/climatestation
mkdir -p /tmp/climatestation/services

chmod 775 -R /data
chmod 775 -R /tmp

# Build and run the climate station containers: mapserver, potsgres and web
docker-compose -f ./docker-compose-JRC.yml up -d --build

# Run script that installs or update the CS DB
docker exec -ti postgres sh -c "/install_update_db.sh"
