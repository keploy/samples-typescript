# Downloading node:alpine

FROM node:alpine

WORKDIR /redis-ts

COPY package*.json ./

RUN npm install

COPY . .

RUN apk add --no-cache bash

RUN npm run build


# Download the ca.crt file and setup_ca.sh script
ADD  https://raw.githubusercontent.com/keploy/keploy/refs/heads/main/pkg/core/proxy/tls/asset/ca.crt ca.crt
ADD https://raw.githubusercontent.com/keploy/keploy/refs/heads/main/pkg/core/proxy/tls/asset/setup_ca.sh setup_ca.sh

# Give execute permission to the setup_ca.sh script
RUN chmod +x setup_ca.sh

# Expose the port your app runs on
EXPOSE 3000


# Define the command to run your application with CA setup
CMD ["/bin/bash", "-c", "source ./setup_ca.sh && node dist/index.js"]
