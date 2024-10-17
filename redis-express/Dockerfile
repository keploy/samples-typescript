# Downloading node:alpine
FROM node:alpine

WORKDIR /redis-ts

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Download the ca.crt file and setup_ca.sh script
RUN curl -o ca.crt  https://raw.githubusercontent.com/keploy/keploy/main/pkg/core/proxy/asset/ca.crt
RUN curl -o setup_ca.sh https://raw.githubusercontent.com/keploy/keploy/main/pkg/core/proxy/asset/setup_ca.sh

# Give execute permission to the setup_ca.sh script
RUN chmod +x setup_ca.sh

# Expose the port your app runs on
EXPOSE 3000


# Define the command to run your application with CA setup
CMD ["/bin/bash", "-c", "source ./setup_ca.sh && node dist/index.js"]
