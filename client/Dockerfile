FROM node:12

WORKDIR /usr/src/client
COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

WORKDIR /usr/src/client/bin

CMD [ "node", "www" ]