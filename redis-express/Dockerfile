# Downloading node:alpine

FROM node:alpine

WORKDIR /redis-ts

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Keploy injects its per-run MITM CA and the trust env vars automatically; no
# certificate needs to be baked in.

# Expose the port your app runs on
EXPOSE 3000

CMD ["node", "dist/index.js"]
