FROM node:lts-alpine

WORKDIR /home/node/app
COPY package.json yarn.lock ./
RUN yarn install --production; yarn cache clean
COPY src/ src/

USER node
ENTRYPOINT ["node", "src/index.js"]
