# Use the official Python image from the Docker Hub
FROM python:3.10-slim

# RUN apt-get update && apt-get install -y curl
# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt .

# Install the Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code into the container
COPY . .

# Download Keploy CA certificate and setup script
# RUN curl -o ca.crt https://raw.githubusercontent.com/keploy/keploy/main/pkg/core/proxy/asset/ca.crt && \
#     curl -o setup_ca.sh https://raw.githubusercontent.com/keploy/keploy/main/pkg/core/proxy/asset/setup_ca.sh && \
#     chmod +x setup_ca.sh  # Make the setup script executable

# Expose the port the app runs on
EXPOSE 5000

# Define the command to run the app
CMD ["python", "app.py"]
