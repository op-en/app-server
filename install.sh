#!/bin/bash

echo "Installing AppServer"

mkdir ~/repos
cd ~/repos
git clone https://github.com/Anton04/AppServer.git
cd ~/repos/AppServer

. ~/.nvm/nvm.sh
nvm use 0.12

npm install socket.io mqtt



