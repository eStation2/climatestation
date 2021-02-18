#!/bin/bash

#!/bin/bash
#Install epel Repository
yum install epel-release -y
#Install Requirements
yum install -y yum-utils device-mapper-persistent-data lvm2 python3-pip xauth
#Setup docker ce repo file Centos Redhat
yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
#Install docker ce and docker-compose using pip
yum install -y docker-ce docker-ce-cli containerd.io
pip3 install docker-compose
#Start service docker
systemctl start docker
systemctl enable docker.service
systemctl enable containerd.service
##Optional post installation steps
#Create the docker group
sudo groupadd docker
sudo usermod -aG docker $USER



docker-compose -f ./docker-compose.yml up -d --build

docker exec -ti web sh -c "database/dbInstall/install_update_db.py"
