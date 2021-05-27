FROM continuumio/miniconda3

ARG USER_ID
ARG GROUP_ID

ARG DEBIAN_FRONTEND=noninteractive

# Add optional and essential packages
RUN apt update && apt install -y software-properties-common
RUN apt-get update --fix-missing && \
    apt-get install -y sudo make cmake gcc nano vim wget git unzip iputils-ping locales mlocate && \
    apt-get install -y build-essential ca-certificates libcurl4-openssl-dev libssl-dev && \
    apt-get install -y bzip2 libglib2.0-0 libxext6 libsm6 libxrender1  && \
    apt-get clean
# To have locate work
RUN updatedb

ENV PATH="/root/miniconda3/bin:${PATH}"
ARG PATH="/root/miniconda3/bin:${PATH}"

# Add GDAL from conda-forge -> gdal contains gdal-bin libgdal-dev
RUN conda update conda
RUN conda install python=3.7
RUN conda install conda-forge::gdal
# Add mapscript from conda
RUN conda install -c mc_ mapscript
# Add GEOS and PROJ from apt-get -> needed for mapscript
RUN apt-get update && apt-get install -y libgeos-dev libproj-dev proj-bin cdo

# Add Apache2 with mod-wsgi
RUN apt-get update && apt-get install -y apache2 apache2-dev libapache2-mod-wsgi-py3

# Install all needed Python packages, listed in the file requirements.txt
# Some packages depend on setuptools to be installed. The reqiurements.txt does not preserve
# the order of install so install setuptools before the requirements.txt
ADD requirements.txt /etc/apache2/sites-available/requirements.txt
RUN pip install --upgrade pip
RUN pip install setuptools
RUN pip install --no-cache-dir -r /etc/apache2/sites-available/requirements.txt
RUN pip install --upgrade numpy

# Install Java JRE for the Synctool
RUN mkdir -p /usr/java && chmod 755 -R /usr/java
ADD jre-8u251-linux-x64.tar.gz /usr/java
#RUN tar zxvf /usr/java/jre-8u73-linux-x64.tar.gz
ENV PATH="/usr/java/jre1.8.0_251/bin:${PATH}"
ARG PATH="/usr/java/jre1.8.0_251/bin:${PATH}"

# SNAP Installation
#ADD esa-snap_all_unix_7_0.sh /tmp
#RUN cd /tmp & wget https://download.esa.int/step/snap/8.0/installers/esa-snap_all_unix_8_0.sh
#RUN chmod +x /tmp/esa-snap_all_unix_8_0.sh
#RUN /tmp/esa-snap_all_unix_8_0.sh -q -dir "/usr/local"
#RUN rm /tmp/esa-snap_all_unix_8_0.sh

# Set secure default apache config
ADD 00-default.conf /etc/apache2/sites-available/00-default.conf
RUN ln -s /etc/apache2/sites-available/00-default.conf /etc/apache2/sites-enabled/00-default.conf && \
    mkdir -p /var/empty && unlink /etc/apache2/sites-enabled/000-default.conf
# Add and enable virtualhost climatestation site
ADD climatestation.conf /etc/apache2/sites-available/climatestation.conf
RUN ln -s /etc/apache2/sites-available/climatestation.conf /etc/apache2/sites-enabled/climatestation.conf

# Configuring web folder tree
RUN mkdir -p /var/www/climatestation && mkdir -p /tmp/matplotlib
RUN chmod 0777 /tmp/matplotlib
ENV PYTHONPATH /var/www/climatestation/
ENV PROJ_LIB /opt/conda/share/proj/
# It is highly recommended to set the MPLCONFIGDIR environment variable to a writable directory,
# in particular to speed up the import of Matplotlib and to better support multiprocessing.
ENV MPLCONFIGDIR /tmp/matplotlib

ENV APACHE_RUN_USER www-data
ENV APACHE_RUN_GROUP www-data

# Enable these Apache modules wsgi
RUN a2enmod headers rewrite proxy wsgi
# RUN service apache2 restart

WORKDIR /var/www/climatestation

ADD docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod 0775 /docker-entrypoint.sh

# create a docker user with same uid and gid of host, www-data is just an internal alias
RUN if [ ${USER_ID} -ne 0 ] && [ ${GROUP_ID} -ne 0 ]; then \
    userdel -f www-data &&\
    if getent group www-data ; then groupdel www-data; fi &&\
    groupadd www-data &&\
    useradd -l -u ${USER_ID} -g www-data www-data &&\
    install -d -m 0777 -o www-data -g www-data /var/www/climatestation &&\
    install -d -m 0777 -o www-data -g www-data /data/ &&\
    install -d -m 0777 -o www-data -g www-data /tmp/climatestation &&\
    mkdir -p /var/log/apache2 &&\
    mkdir -p /home/www-data &&\
    chmod 0777 -R /var/log/apache2 &&\
    chmod 0777 -R /home/www-data &&\
    touch /var/log/apache2/error.log &&\
    touch /var/log/apache2/access.log &&\
    chmod 0777 -R /var/log/apache2/error.log &&\
    chmod 0777 -R /var/log/apache2/access.log &&\
    chown --changes --silent --no-dereference --recursive \
              --from=0:0 ${USER_ID}:${GROUP_ID} \
              ${WORKDIR} \
              /data/ \
              /tmp/climatestation/ \
              /home/www-data/ \
              /var/log/apache2/ \
              /var/log/apache2/error.log \
              /var/log/apache2/access.log \
              /run/apache2/ \
              /var/run/apache2/ \
              /var/lock/apache2/ \
              /usr/sbin/apache2ctl \
              /etc/init.d/apache2 \
              /docker-entrypoint.sh \
;fi

# Set the default Apache port to 8080 because www-data who runs apache does not have the permissions to use port 80.
RUN sed -i "s/80/8080/g" /etc/apache2/ports.conf

# Give www-data sudo rights in the container
#RUN sed -i /etc/sudoers -re 's/^%sudo.*/%sudo ALL=(ALL:ALL) NOPASSWD: ALL/g' && \
#    sed -i /etc/sudoers -re 's/^root.*/root ALL=(ALL:ALL) NOPASSWD: ALL/g' && \
#    sed -i /etc/sudoers -re 's/^#includedir.*/## **Removed the include directive** ##"/g' && \
#    echo "www-data ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers;  su - www-data -c id

# RUN mkdir -p /home/www-data && chown www-data:www-data /home/www-data && chmod 775 -R /home/www-data

USER www-data

ENTRYPOINT ["/docker-entrypoint.sh"]
# apache2ctl -D FOREGROUND
# CMD [ "sudo", "-c", "service apache2 start" ]

EXPOSE 8080
