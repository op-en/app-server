# The first lines of your Dockerfile should always be:
FROM hypriot/rpi-node
MAINTAINER Leo Fidjeland (leo.fidjeland@gmail.com)
# This indicates what base image you are using and who maintains the Dockerfile.

# The app server will relay mqtt to a socket.io connection
# We install it as a global package
ENV APP_SERVER_VERSION 0.1.5
RUN npm install -g --unsafe-perm op-en-app-server@${APP_SERVER_VERSION}
EXPOSE 5000

# We setup the run command. This is what happens when you run the compiled container.
CMD ["op-en-app-server"]
