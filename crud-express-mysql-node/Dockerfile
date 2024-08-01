# Use the official Node.js image from the Docker Hub
FROM node:14

# Create and change to the app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install the app dependencies
RUN npm install

# Copy the app files
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Start the app
CMD ["node", "server.js"]
