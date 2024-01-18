# Use an official Go runtime as a parent image
FROM golang:latest

# Set the working directory inside the container
WORKDIR /app

# Copy the local package files to the container's workspace
COPY go.mod ./
COPY go.sum ./

# Download any necessary dependencies
RUN go mod download

# Copy the rest of the application's source code
COPY . .

# Build the application
RUN go build -o myapp

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Run the application when the container launches
CMD ["./myapp"]
