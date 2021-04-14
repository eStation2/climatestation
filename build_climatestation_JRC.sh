#!/bin/bash

# Get the User ID and Group ID of the user that executes this script.
# These environment variables are used by the docker-compose.yml,
# to map the host user with the user in the docker container for
# all volumes defined for the container.
export USER_ID=$(id -u)
export GROUP_ID=$(id -g)

# Write the User ID and Group ID of the user that executes this script,
# into the .env file so that these environment variables are also available
# when running the command: docker-compose -f ./docker-compose.yml up (or down or stop).
file="JRC.env"
USERID="USER_ID=$(id -u)"
GROUPID="GROUP_ID=$(id -g)"
userid_envvar="$(grep USER_ID $file)"
groupid_envvar="$(grep GROUP_ID $file)"
sed "s/$userid_envvar/$USERID/g;s/$groupid_envvar/$GROUPID/g" "$file" > .env

# Create mandatory directories and set their permissions
source <(grep DATA_VOLUME .env)
source <(grep TMP_VOLUME .env)

mkdir -p log
chmod -R 777 log
mkdir -p log/mapserver
mkdir -p log/postgres
mkdir -p log/web

mkdir -p ${DATA_VOLUME}
chmod -R 777 ${DATA_VOLUME}
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
mkdir -p ${TMP_VOLUME}
chmod -R 777 ${TMP_VOLUME}
mkdir -p ${TMP_VOLUME}/services

chmod -R 777 ${DATA_VOLUME}
chmod -R 777 ${TMP_VOLUME}

# create an external docker volume for the postgresql data:
if [ "$(docker volume ls | grep cs-docker-postgresql12-volume)" != 'local     cs-docker-postgresql12-volume' ]; then
  echo "creating docker volume 'cs-docker-postgresql12-volume'"
  docker volume create --name cs-docker-postgresql12-volume -d local
else
  echo "docker volume 'cs-docker-postgresql12-volume' already exists"
fi

# Build and run the climate station containers: mapserver, postgres and web
docker-compose -f ./docker-compose.yml up -d --build

# Run script that installs or update the CS DB
docker exec -ti postgres sh -c "/install_update_db.sh"

# TODO: get layers and logos (and docs?) from our JRC FTP and extract them into their respective dir under static_data.
