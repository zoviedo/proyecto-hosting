FROM node:lts-alpine

RUN apk update && apk add --no-cache git openssh-client curl tar

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3001

CMD [ "node", "index.js" ]