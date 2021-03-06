# Climate Station - Python 3.7.7 in Docker 
## Introduction

This installation contains the Climate Station code (from the master branch) converted to Python 3.7 or higher
For the database PostgreSQL 12 is used, for which the code had to be adapted to the latest version of SQLAlchemy.

Docker compose is used to create/build three images and run the three services (containers).

The three services (containers) are:
* mapserver
* postgres
* web

There is one docker-compose.yml file for setting up the three containers.

## Installation

1. Clone the climatestation repository on your local machine.

    You should have [Git](https://git-scm.com/downloads) installed. 
    
    After you installed Git on your computer, open a CMD or Powershell (Windows) or a Terminal (LINUX) and 
    run the following command.
    First CD to the directory where you want to create the clone.
    ```bash
    cd /Develop/
   
    git clone https://github.com/eStation2/climatestation.git ClimateStation
    ```

2. Download and install [Docker desktop](https://www.docker.com/products/docker-desktop)

3. Create the external docker volume for PostgreSQL 12

   Currently, the volume for PostgreSQL has to be created externally by running the following command:
    ```bash
    docker volume create --name cs-docker-postgresql12-volume -d local
    ```
   In the future this volume will be created automatically, probably using swarm mode.
   
4. Setup environment variables for the web service volumes.
   
    The web service uses two external volumes, one for the data and one for the Climate Station static layers and settings.
    In the .env file used by docker-compose, there are two settings which you have to change to the place where you 
    have the data and climatestation directories.
    For example in Windows:
    
    * DATA_VOLUME=C:\data
    * CS_VOLUME=C:\data\climatestation
    * TMP_VOLUME=C:\data\tmp\climatestation
    * DBDUMP_VOLUME=C:\data\climatestation\db_dump

    The "data" directory should contain the following directories:
    + processing
    + ingest
    + ingest.wrong
    
    The "climatestation" directory should contain the following, mostly empty, directories:
    + completeness_bars
    + db_dump
    + docs   
    + get_lists
    + layers
    + log
    + logos
    + requests
    + settings
    
    You can download the docs, layers and logos from the JRC SFTP server [here](ftp://narmauser:JRCkOq7478@srv-ies-ftp.jrc.it/narma/eStation_2.0/static_data).
    - host: srv-ies-ftp.jrc.it
    - username: narmauser
    - pwd: JRCkOq7478
    - directory: /narma/eStation_2.0/static_data
    
    Unzip the corresponding files in their respective directory.   
   
5. Run docker-compose to build and start the Climate Station application.

   Open a CMD or Powershell (Windows) or a Terminal (LINUX) and run the following command. 
   First CD to the directory where you created the clone. You must have an internet connection!
   ```bash
    cd /Develop/ClimateStation
   
    docker-compose -f "docker-compose.yml" up -d --build
   ```
   This will take some minutes to build the three images and run the three services (containers). 
   In the end you will see a result like this:
   
   ```bash  
    ...
    Successfully built 52ba36b03b87
    Successfully tagged estation2python3docker/web:1.0
    ...
    Successfully built ca1d8d095631
    Successfully tagged estation2python3docker/mapserver:1.0
    ...
    Successfully built 47f027edf7e9
    Successfully tagged estation2python3docker/postgis:9.6
    Creating mapserver ... done
    Creating web       ... done
    Creating postgres  ... done
   ```

6. Create and fill the database

    Running the postgres service will automatically create the estationdb database and estation user, if they don't already exist.
    The structure and the data of the database on the other hand, are not (yet) automatically created.
    
    To do so, you will have to enter the postgres service and run three sql scripts as follows:
    
    ```bash  
    docker exec -it postgres /bin/sh -c "[ -e /bin/bash ] && /bin/bash || /bin/sh"
   
    root@5a1d118827bd:/# psql -h postgres -U estation -d estationdb -w -f /var/tmp/products_dump_structure_only.sql >/var/log/eStation2/products_dump_structure_only.log 2>/var/log/eStation2/products_dump_structure_only.err
    root@5a1d118827bd:/# password: mesadmin
    root@5a1d118827bd:/# psql -h postgres -U estation -d estationdb -w -f /var/tmp/update_db_structure.sql >/var/log/eStation2/update_db_structure.log 2>/var/log/eStation2/update_db_structure.err
    root@5a1d118827bd:/# password: mesadmin
    root@5a1d118827bd:/# psql -h postgres -U estation -d estationdb -w -f /var/tmp/update_insert_jrc_data.sql >/var/log/eStation2/update_insert_jrc_data.log 2>/var/log/eStation2/update_insert_jrc_data.err
    root@5a1d118827bd:/# password: mesadmin
    ```
    
    You have to do this only ones!
    
7. Open a browser and go to [localhost:8080](http://localhost:8080)

PS: All references to eStation2 will be changed to ClimateStation
