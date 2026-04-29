FROM node:20-bookworm-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates curl dumb-init && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --omit=dev

COPY index.js ./

EXPOSE 1337

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "index.js"]
