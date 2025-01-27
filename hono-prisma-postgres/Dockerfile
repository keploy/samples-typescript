# Start with a lightweight Linux base image with Node.js and Bun installed
FROM oven/bun:latest

# Set the working directory inside the container
WORKDIR /app

# Copy package.json, bun.lockb, and the Prisma schema to the container
COPY package.json bun.lockb prisma ./ 

# Copy the rest of the application files
COPY . .

# Install dependencies using Bun
RUN bun install

# Expose the port your application will run on
EXPOSE 3000

# Command to start the application
CMD ["bun", "dev"]
