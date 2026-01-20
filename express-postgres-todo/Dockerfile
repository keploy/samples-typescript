# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Development stage
FROM node:22-alpine AS development

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src

CMD ["npm", "run", "dev"]

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

# Install the ca-certificates package and bash (needed for Keploy's setup_ca.sh)
RUN apk update && apk add --no-cache ca-certificates bash
# Download the ca.crt file and the setup_ca.sh script
ADD https://raw.githubusercontent.com/keploy/keploy/refs/heads/main/pkg/core/proxy/tls/asset/ca.crt ca.crt
ADD https://raw.githubusercontent.com/keploy/keploy/refs/heads/main/pkg/core/proxy/tls/asset/setup_ca.sh setup_ca.sh
# Give execute permission to the setup_ca.sh script
RUN chmod +x setup_ca.sh

COPY package*.json ./
RUN npm ci --only=production

COPY prisma ./prisma
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

# Copy and setup entrypoint
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["npm", "start"]
