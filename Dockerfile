FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run check && npm run build

FROM node:20-bookworm-slim
ENV NODE_ENV=production PORT=8787 DATA_DIR=/app/storage
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY server.mjs ./
COPY landing.mjs ./
EXPOSE 8787
VOLUME ["/app/storage"]
CMD ["node","server.mjs"]
