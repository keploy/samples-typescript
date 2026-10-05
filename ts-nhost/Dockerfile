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


# Install the ca-certificates package for base system roots (Debian-based).
# Keploy injects its per-run MITM CA and the trust env vars automatically, so no
# certificate needs to be baked in.
RUN apt-get update && apt-get install -y ca-certificates

# Expose the port your app runs on
EXPOSE 3000

CMD ["npx", "ts-node", "src/app.ts"]
