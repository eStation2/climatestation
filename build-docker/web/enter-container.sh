#!/bin/bash
PID=$(sudo docker inspect --format \{{.State.Pid}}\ $1)
sudo nsenter --target $PID --mount --uts --ipc --net --pid
