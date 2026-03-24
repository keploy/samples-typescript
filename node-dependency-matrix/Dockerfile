FROM node:20-bookworm-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY proto ./proto
COPY fixtures ./fixtures
COPY src ./src
COPY entrypoint.sh ./entrypoint.sh

RUN npm run build && chmod +x /app/entrypoint.sh

FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/proto ./proto
COPY --from=build /app/fixtures ./fixtures
COPY --from=build /app/entrypoint.sh ./entrypoint.sh

ENV NODE_ENV=production
ENV PORT=8080
ENV GRPC_PORT=9090

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "dist/bin/app.js"]
