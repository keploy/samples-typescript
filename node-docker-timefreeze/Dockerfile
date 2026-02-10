FROM ubuntu:24.04 AS builder

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies, set up the NodeSource repository, and install Node.js
RUN apt-get update && apt-get install -y curl gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

FROM ubuntu:24.04

# Prevent interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install only the Node.js runtime, then clean up to keep the image small
RUN apt-get update && apt-get install -y curl gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# COPY ./freeze_time_amd64.so /lib/keploy/freeze_time_amd64.so
# RUN chmod +x /lib/keploy/freeze_time_amd64.so
# ENV LD_PRELOAD=/lib/keploy/freeze_time_amd64.so


# Copy dependencies from the 'builder' stage
COPY --from=builder /app/node_modules ./node_modules

# Copy application code from the 'builder' stage
COPY --from=builder /app/server.js ./server.js

# Expose port 8080 to the outside world
EXPOSE 8080

# Command to run the executable
CMD ["node", "server.js"]