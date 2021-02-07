FROM node:lts-alpine3.12

WORKDIR /home/node/app
COPY package.json yarn.lock ./
RUN yarn install --production
COPY src/ src/

USER node
ENTRYPOINT ["yarn", "start"]
