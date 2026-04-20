#!/bin/bash
set -euo pipefail

OUTPUT_DIR="${1:-.generated/certs}"
mkdir -p "${OUTPUT_DIR}"

CA_CONFIG="${OUTPUT_DIR}/ca.cnf"
SERVER_CONFIG="${OUTPUT_DIR}/server.cnf"

cat > "${CA_CONFIG}" <<'EOF'
[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_ca
prompt = no

[req_distinguished_name]
CN = node-dependency-matrix-ca

[v3_ca]
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid:always,issuer
basicConstraints = critical, CA:true
keyUsage = critical, keyCertSign, cRLSign
EOF

cat > "${SERVER_CONFIG}" <<'EOF'
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_server
prompt = no

[req_distinguished_name]
CN = node-dependency-matrix

[v3_server]
basicConstraints = critical, CA:false
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = fixture-service
DNS.2 = mysql-tls
DNS.3 = postgres-tls
DNS.4 = mongo-tls
DNS.5 = redis-tls
DNS.6 = kafka-tls
DNS.7 = sqs-tls
DNS.8 = localhost
IP.1 = 127.0.0.1
EOF

openssl genrsa -out "${OUTPUT_DIR}/ca.key" 2048 >/dev/null 2>&1
openssl req -x509 -new -nodes -key "${OUTPUT_DIR}/ca.key" -sha256 -days 3650 -out "${OUTPUT_DIR}/ca.crt" -config "${CA_CONFIG}" >/dev/null 2>&1

openssl genrsa -out "${OUTPUT_DIR}/proxy.key" 2048 >/dev/null 2>&1
openssl req -new -key "${OUTPUT_DIR}/proxy.key" -out "${OUTPUT_DIR}/proxy.csr" -config "${SERVER_CONFIG}" >/dev/null 2>&1
openssl x509 -req -in "${OUTPUT_DIR}/proxy.csr" -CA "${OUTPUT_DIR}/ca.crt" -CAkey "${OUTPUT_DIR}/ca.key" -CAcreateserial -out "${OUTPUT_DIR}/proxy.crt" -days 3650 -sha256 -extensions v3_server -extfile "${SERVER_CONFIG}" >/dev/null 2>&1
cat "${OUTPUT_DIR}/proxy.crt" "${OUTPUT_DIR}/ca.crt" > "${OUTPUT_DIR}/proxy-fullchain.crt"

rm -f "${OUTPUT_DIR}/proxy.csr" "${OUTPUT_DIR}/ca.srl" "${CA_CONFIG}" "${SERVER_CONFIG}"

echo "Generated certs in ${OUTPUT_DIR}"
