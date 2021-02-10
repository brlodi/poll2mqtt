FROM node:lts-alpine

WORKDIR /home/node/app
COPY package.json yarn.lock ./
RUN yarn install --production; yarn cache clean
COPY src/ src/

USER node
ENTRYPOINT ["/bin/sh", "-c", "node src/index.js | ./node_modules/.bin/pino-dev -t \"yyyy-MM-dd HH:mm:ss.SSSXX\""]
