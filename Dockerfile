FROM node:boron
EXPOSE 3002
ADD ./ /roon-extension-ws-player
WORKDIR /roon-extension-ws-player
RUN npm install socket.io
RUN npm install --no-bin-link
CMD node .
