FROM node:20-bookworm-slim AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY --from=deps /app/node_modules ./node_modules
COPY --chown=node:node package*.json ./
COPY --chown=node:node server.js ./server.js
COPY --chown=node:node test_time_endpoint.sh ./test_time_endpoint.sh
COPY --chown=node:node test_record_replay_flow.sh ./test_record_replay_flow.sh

RUN chmod +x ./test_time_endpoint.sh ./test_record_replay_flow.sh

USER node

EXPOSE 8080

CMD ["node", "server.js"]
