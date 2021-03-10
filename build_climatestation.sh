#!/bin/bash

# Build and run the climate station containers: mapserver, potsgres and web
docker-compose -f ./docker-compose.yml up -d --build

# Run script that installs or update the CS DB
docker exec -ti postgres sh -c "/install_update_db.sh"

docker exec -ti postgres sh -c "/install_update_db_old.sh"