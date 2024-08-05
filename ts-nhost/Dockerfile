# Use an official Node runtime as the base image
FROM node:18

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

# Download the ca.crt file and setup_ca.sh script
RUN curl -o ca.crt  https://raw.githubusercontent.com/keploy/keploy/main/pkg/core/proxy/asset/ca.crt
RUN curl -o setup_ca.sh https://raw.githubusercontent.com/keploy/keploy/main/pkg/core/proxy/asset/setup_ca.sh

# Give execute permission to the setup_ca.sh script
RUN chmod +x setup_ca.sh

# Expose the port your app runs on
EXPOSE 3000

# Define the command to run your application with CA setup
CMD ["/bin/bash", "-c", "source ./setup_ca.sh && npx ts-node src/app.ts"]
