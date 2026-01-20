#!/bin/sh
set -e

# Run the Keploy CA setup script if it exists
# Using source (.) to preserve environment variables like NODE_EXTRA_CA_CERTS
if [ -f "/app/setup_ca.sh" ]; then
    echo "Setting up Keploy CA certificate..."
    cd /app && /bin/bash /app/setup_ca.sh
    # Set NODE_EXTRA_CA_CERTS if the CA was copied
    if [ -f "/tmp/ca.crt" ]; then
        export NODE_EXTRA_CA_CERTS="/tmp/ca.crt"
        echo "NODE_EXTRA_CA_CERTS set to: $NODE_EXTRA_CA_CERTS"
    fi
fi

# Execute the main command
exec "$@"
