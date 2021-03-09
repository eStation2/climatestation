FROM kartoza/postgis:12.0
# FROM d-prd-registry.jrc.it/kartoza/postgis:12.1
# FROM postgres:12


# Add optional and essential packages
#RUN apt update && apt install -y software-properties-common
#RUN apt-get update && apt-get install -y make cmake gcc nano vim wget git unzip iputils-ping locales mlocate
#RUN apt-get update && apt-get install -y build-essential ca-certificates libcurl4-openssl-dev libssl-dev
## To have locate work
#RUN updatedb

ADD ./build-docker/postgres/pg_hba.conf /etc/postgresql/12/main/
RUN chown postgres:postgres /etc/postgresql/12/main/pg_hba.conf
RUN chown postgres.postgres /var/log/postgresql

#RUN apt-get update && apt-get install -y nano

RUN mkdir /home/postgres/
RUN mkdir /var/log/climatestation/
RUN mkdir -p /var/www/climatestation/

#USER postgres
# RUN export PGPASSWORD='mesadmin'; -> Done in docker-compose file.
ADD ./build-docker/postgres/.pgpass /home/postgres/
RUN chmod 0775 -R /home/postgres/
RUN chown postgres:postgres -R /home/postgres/
ENV PGPASSFILE=/home/postgres/.pgpass

#USER root
#ADD ./src/database/dbInstall/products_dump_structure_only.sql /var/tmp/
#ADD ./src/database/dbInstall/update_db_structure.sql /var/tmp/
#ADD ./src/database/dbInstall/update_insert_jrc_data.sql /var/tmp/
#ADD ./src/database/dbInstall/create_table_db_version.sql /var/tmp/
#ADD ./src/database/dbInstall/climsoft_schema_structure.sql /var/tmp/

#ADD ./build-docker/postgres/postgres-docker-entrypoint.sh /postgres-docker-entrypoint.sh
#RUN chmod 0775 /postgres-docker-entrypoint.sh

ADD ./src/database/dbInstall/install_update_db.sh /
RUN chmod 0775 /install_update_db.sh

ADD ./src/database/dbInstall/install_update_db_old.sh /
RUN chmod 0775 /install_update_db_old.sh

# CMD ["bash", "/postgres-docker-entrypoint.sh"]

#RUN head -2 /docker-entrypoint.sh &gt; /docker-entrypoint.sh.tmp
#RUN all_lines=`wc -l /docker-entrypoint.sh | cut -d' ' -f1` &amp;&amp; \
#    new_lines=`expr $all_lines - 3` &amp;&amp; \
#    tail -$new_lines /docker-entrypoint.sh &gt;&gt; /docker-entrypoint.sh.tmp &amp;&amp; \
#    mv /docker-entrypoint.sh.tmp /docker-entrypoint.sh

#ADD ./build-docker/postgres/postgis-docker-entrypoint.sh /docker-entrypoint.sh.tmp
#RUN mv /docker-entrypoint.sh.tmp /docker-entrypoint.sh
#RUN chmod 777 /docker-entrypoint.sh

#RUN cp /docker-entrypoint.sh /docker-entrypoint.sh.tmp
#RUN sed -i '$ d' /docker-entrypoint.sh.tmp && \
#    echo "source /setup_estationdb.sh\n"  >> /docker-entrypoint.sh.tmp && \
#    tail -1 /docker-entrypoint.sh >> /docker-entrypoint.sh.tmp && \
#    mv /docker-entrypoint.sh.tmp /docker-entrypoint.sh

# ENTRYPOINT presumes the container runs as an executable and runs the command before the container starts!
# The postgres container restarts continiously!
# ENTRYPOINT ["bash", "/root/setup_estationdb.sh"]
# ENTRYPOINT ["/root/estation2-docker-entrypoint.sh"]
# ENTRYPOINT ["/usr/bin/env"]
# CMD ["bash", "/root/postgres-docker-entrypoint.sh"]
