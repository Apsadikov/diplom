FROM node:12

WORKDIR /usr/src/server
COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

WORKDIR /usr/src/server/bin

CMD [ "node", "www" ]