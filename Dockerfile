# The first lines of your Dockerfile should always be:
FROM node:6
MAINTAINER Leo Fidjeland (leo.fidjeland@gmail.com)
# This indicates what base image you are using and who maintains the Dockerfile.

WORKDIR /opt

ADD package.json package.json
RUN npm install --production

ADD index.js index.js

EXPOSE 5000

ENV PORT 5000
ENV MQTT mqtt
ENV LOGIN ''
ENV VERBOSE false

# We setup the run command. This is what happens when you run the compiled container.
CMD ["node","/opt/index.js"]
