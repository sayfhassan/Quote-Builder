# better-sqlite3 is a native module; every stage that runs `npm ci` needs
# build tools available in case no prebuilt binary matches this platform.
FROM node:20-bookworm-slim AS base
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package*.json ./
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build

FROM base AS prod-deps
COPY package*.json ./
RUN npm ci --omit=dev

# Final image has no build toolchain — just the compiled output and the
# already-built native binary carried over from prod-deps.
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV DATABASE_PATH=/app/data/dev.sqlite3
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh && mkdir -p /app/data

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
