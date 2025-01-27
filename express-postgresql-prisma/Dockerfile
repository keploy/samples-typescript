# Use an official Node.js runtime as a parent image
FROM node:18

# Set the working directory
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

RUN npm run generate
RUN npm run migrate init

RUN npm run clean-build

# Expose the port the app runs on
EXPOSE 3000

# Command to start the app
CMD ["npm", "run", "start"]
