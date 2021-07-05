FROM node:14
RUN mkdir -p /usr/src/chain-subscription
COPY index.js package.json package-lock.json /usr/src/chain-subscription/
WORKDIR /usr/src/chain-subscription
RUN npm install --save
CMD "node" "index.js"