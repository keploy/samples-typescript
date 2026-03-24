#!/bin/bash

# This script sends a request to the /check-time endpoint.
# - If run without arguments, it uses the current Unix timestamp (should succeed).
# - If run with a number as an argument, it uses that number as the timestamp.

# --- Configuration ---
APP_URL="${APP_URL:-}"
HOSTNAME="${HOSTNAME:-localhost}"
PORT="${PORT:-8080}"
ENDPOINT="/check-time"
# ---------------------

# Check if a command-line argument (a custom timestamp) was provided
if [ -n "$1" ]; then
  # Use the provided argument as the timestamp
  TIMESTAMP_TO_SEND="$1"
  echo "Using provided timestamp: $TIMESTAMP_TO_SEND"
else
  # No argument provided, get the current Unix timestamp
  TIMESTAMP_TO_SEND=$(date +%s)
  echo "Using current timestamp: $TIMESTAMP_TO_SEND"
fi

# Construct the full URL
if [ -n "${APP_URL}" ]; then
  URL="${APP_URL%/}${ENDPOINT}?ts=${TIMESTAMP_TO_SEND}"
else
  URL="http://${HOSTNAME}:${PORT}${ENDPOINT}?ts=${TIMESTAMP_TO_SEND}"
fi

# Send the request using curl and print the result
echo "Sending request to: ${URL}"
curl -s "${URL}" # The -s flag makes curl silent (no progress meter)
echo # Add a newline for cleaner terminal output
