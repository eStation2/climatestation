#!/bin/bash

export USER_ID=$(id -u)
export GROUP_ID=$(id -g)

# Build and run the climate station containers: mapserver, potsgres and web
docker-compose -f ./docker-compose-JRC.yml up -d --build

# Run script that installs or update the CS DB
docker exec -ti postgres sh -c "/install_update_db.sh"
