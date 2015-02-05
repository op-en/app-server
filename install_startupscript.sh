#!/bin/bash

SCRIPT='./startupscript.sh'
CMD='appserver'

sudo mv $SCRIPT /etc/init.d/$CMD
sudo chmod 755 /etc/init.d/$CMD
sudo update-rc.d $CMD defaults
sudo update-rc.d $CMD enable
