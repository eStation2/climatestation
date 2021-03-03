FROM continuumio/miniconda3

# Security: Don't run as root!!!
USER root
# Setup user
# RUN useradd --create-home adminuser
# USER adminuser
ARG UID
ARG GID

ARG DEBIAN_FRONTEND=noninteractive

# Add optional and essential packages
RUN apt update && apt install -y software-properties-common
RUN apt-get update --fix-missing && \
    apt-get install -y make cmake gcc nano vim wget git unzip iputils-ping locales mlocate && \
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
RUN apt-get update && apt-get install -y libgeos-dev libproj-dev proj-bin

# Add Apache2 with mod-wsgi
RUN apt-get update && apt-get install -y apache2 apache2-dev libapache2-mod-wsgi-py3

# Install all needed Python packages, listed in the file requirements.txt
# Some packages depend on setuptools to be installed. The reqiurements.txt does not preserve
# the order of install so install setuptools before the requirements.txt
# By default pip keeps copies of the downloaded package, in case you reinstall later.
# This wastes space, and you won't need it. Use the --no-cache-dir flag!
ADD requirements.txt /etc/apache2/sites-available/requirements.txt
RUN pip install --upgrade pip
RUN pip install setuptools
RUN pip install --no-cache-dir -r /etc/apache2/sites-available/requirements.txt
RUN pip install --upgrade numpy

# Set secure default apache config
ADD 00-default.conf /etc/apache2/sites-available/00-default.conf
RUN ln -s /etc/apache2/sites-available/00-default.conf /etc/apache2/sites-enabled/00-default.conf && \
    mkdir -p /var/empty && unlink /etc/apache2/sites-enabled/000-default.conf
# Add and enable virtualhost climatestation site
ADD climatestation.conf /etc/apache2/sites-available/climatestation.conf
RUN ln -s /etc/apache2/sites-available/climatestation.conf /etc/apache2/sites-enabled/climatestation.conf


# Install Java JRE for the Synctool
RUN mkdir -p /usr/java && chmod 755 -R /usr/java
ADD jre-8u251-linux-x64.tar.gz /usr/java
#RUN tar zxvf /usr/java/jre-8u73-linux-x64.tar.gz
#RUN apt update
#RUN apt install default-jre
ENV PATH="/usr/java/jre1.8.0_251/bin:${PATH}"
ARG PATH="/usr/java/jre1.8.0_251/bin:${PATH}"


# SNAP Installation
#ADD esa-snap_all_unix_7_0.sh /tmp

#RUN cd /tmp & wget https://download.esa.int/step/snap/8.0/installers/esa-snap_all_unix_8_0.sh
#RUN chmod +x /tmp/esa-snap_all_unix_8_0.sh
#RUN /tmp/esa-snap_all_unix_8_0.sh -q -dir "/usr/local"
#RUN rm /tmp/esa-snap_all_unix_8_0.sh

# Configuring web folder tree
RUN mkdir -p /var/www/climatestation && mkdir -p /var/log/apache2/
ENV PYTHONPATH /var/www/climatestation/
ENV PROJ_LIB /opt/conda/share/proj/
#ENV APACHE_RUN_USER www-data
#ENV APACHE_RUN_GROUP www-data

# For debugging
# ENV PYTHONFAULTHANDLER=1

# Enable these Apache modules wsgi
RUN a2enmod headers rewrite proxy wsgi
RUN service apache2 restart
WORKDIR /var/www/climatestation

# Pre-compile bytecode for faster startup.
# Compile installed code:
# RUN python -c "import compileall; compileall.compile_path(maxlevels=10)"
# Compile code in a directory:
# RUN python -m compileall yourpackage/

#CMD ["python", "-c", "import webpy_esapp_helpers; webpy_esapp_helpers.importJRCRefWorkspaces(version=1)"]
#CMD ["python", "-u", "./resources/libs_python/my_server.py", "127.0.0.1", "8899", "9999"]

ADD docker-entrypoint.sh /root/docker-entrypoint.sh
RUN chmod 0775 /root/docker-entrypoint.sh

# CMD apache2ctl -D FOREGROUND
ENTRYPOINT ["/root/docker-entrypoint.sh"]
EXPOSE 80
