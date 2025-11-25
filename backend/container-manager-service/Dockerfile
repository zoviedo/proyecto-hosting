FROM node:lts-alpine

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install

COPY watcher.js docker.util.js index.js ./ 

CMD [ "node", "index.js" ]