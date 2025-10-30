# Use an official Node runtime as the base image
FROM node:22

# Install ca-certificates and clean up
RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates curl && \
    rm -rf /var/lib/apt/lists/* 

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Install ts-node and TypeScript globally
RUN npm install -g typescript ts-node @types/node

# Copy the rest of the application code
COPY . .


# Install the ca-certificates package to use the system certificates (the below command is for Debian-based systems, you may need to adjust it for other distributions)
RUN apt-get update && apt-get install -y ca-certificates

# Download the ca.crt file and the setup_ca.sh script

ADD  https://raw.githubusercontent.com/keploy/keploy/refs/heads/main/pkg/core/proxy/tls/asset/ca.crt ca.crt
ADD https://raw.githubusercontent.com/keploy/keploy/refs/heads/main/pkg/core/proxy/tls/asset/setup_ca.sh setup_ca.sh

# Give execute permission to the setup_ca.sh script
RUN chmod +x setup_ca.sh


# Expose the port your app runs on
EXPOSE 3000

# Define the command to run your application with CA setup
CMD ["/bin/bash", "-c", "source ./setup_ca.sh && npx ts-node src/app.ts"]
