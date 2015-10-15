#!/bin/bash

echo "Installing AppServer"

#Check if repo directory exists
if [ ! -d "~/repos" ]; then
  mkdir ~/repos
fi

cd ~/repos
git clone https://github.com/Anton04/AppServer.git
cd ~/repos/AppServer

. ~/.nvm/nvm.sh
nvm use 0.12

npm install socket.io mqtt
 


