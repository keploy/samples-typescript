FROM node:18

# Create app directory
RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates dumb-init && \
    rm -rf /var/lib/apt/lists/* 

WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --omit=dev
ENTRYPOINT ["dumb-init", "--"]

# Bundle app source
COPY . .

EXPOSE 8000
CMD [ "node", "src/app.js" ]