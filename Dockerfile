FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && npm ci && rm -rf /var/lib/apt/lists/*
COPY . .
RUN npm run check && npm run build

FROM node:20-bookworm-slim
ENV NODE_ENV=production PORT=8787 DATA_DIR=/app/storage
WORKDIR /app
COPY package*.json ./
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && npm ci --omit=dev && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/dist ./dist
COPY server.mjs ./
COPY landing.mjs ./
EXPOSE 8787
VOLUME ["/app/storage"]
CMD ["node","server.mjs"]
