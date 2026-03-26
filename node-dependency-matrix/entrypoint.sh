#!/bin/sh
set -eu

COMBINED_CA_CERT_PATH="${COMBINED_CA_CERT_PATH:-/tmp/node-dependency-matrix-ca-bundle.crt}"

rm -f "${COMBINED_CA_CERT_PATH}"

if [ -n "${SAMPLE_CA_CERT_PATH:-}" ] && [ -f "${SAMPLE_CA_CERT_PATH}" ]; then
  cat "${SAMPLE_CA_CERT_PATH}" > "${COMBINED_CA_CERT_PATH}"
  cp "${SAMPLE_CA_CERT_PATH}" /usr/local/share/ca-certificates/node-dependency-matrix.crt
  update-ca-certificates >/dev/null 2>&1 || true
fi

if [ -f /tmp/keploy-tls/ca.crt ]; then
  cat /tmp/keploy-tls/ca.crt >> "${COMBINED_CA_CERT_PATH}"
fi

if [ ! -f "${COMBINED_CA_CERT_PATH}" ]; then
  : > "${COMBINED_CA_CERT_PATH}"
  >&2 echo "Warning: No CA certificates were found to create the combined CA bundle at '${COMBINED_CA_CERT_PATH}'. To fix this, either set SAMPLE_CA_CERT_PATH to a valid CA bundle file or mount /tmp/keploy-tls/ca.crt before starting this container so fixture endpoints can establish TLS correctly."
fi

exec "$@"
