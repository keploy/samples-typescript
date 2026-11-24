#!/bin/sh
set -eu

awslocal sqs create-queue --queue-name dependency-matrix >/dev/null 2>&1 || true
